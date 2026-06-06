import json
import logging
from typing import Any

from groq import AsyncGroq
from pydantic import BaseModel, Field, ValidationError, field_validator

from app.models.graph_context import FraudContext
from app.prompts.fraud import FRAUD_ANALYSIS_JSON_PROMPT
from app.utils.config import settings
from app.utils.scoring import clamp_score

logger = logging.getLogger(__name__)


class FraudLlmDecision(BaseModel):
    decision: str
    confidence: float = Field(..., ge=0, le=1)
    risk_score: float = Field(..., ge=0, le=1)
    reasoning: str
    alternatives: list[str]
    flags: list[str] = Field(default_factory=list)
    graph_evidence: list[str] = Field(default_factory=list)

    @field_validator("decision")
    @classmethod
    def normalize_decision(cls, value: str) -> str:
        normalized = value.strip().lower()
        allowed = {"approve", "step_up_verification", "manual_review", "deny"}
        if normalized not in allowed:
            raise ValueError(f"decision must be one of {sorted(allowed)}")
        return normalized

    @field_validator("alternatives")
    @classmethod
    def require_alternatives(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if not cleaned:
            raise ValueError("alternatives must contain at least one recommendation")
        return cleaned[:5]


class GroqFraudAnalysisService:
    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None

    async def analyze(
        self,
        *,
        graph_context: FraudContext | dict[str, Any],
        evidence: list[dict[str, Any]],
        risk_score: float,
        decision: str,
        recommendations: list[dict[str, Any]],
        graph_rag_context: str | None = None,
    ) -> FraudLlmDecision:
        # Convert graph_context to dict if it is a Pydantic model
        graph_context_dict = (
            graph_context.model_dump()
            if hasattr(graph_context, "model_dump")
            else graph_context
        )

        payload = {
            "graph_context": graph_context_dict,
            "evidence": evidence,
            "computed_risk_score": risk_score,
            "computed_decision": decision,
            "recommendations": recommendations,
        }
        if graph_rag_context:
            payload["graph_rag_context"] = graph_rag_context

        if self._client is None:
            return self._fallback(payload)

        messages = [
            {"role": "system", "content": FRAUD_ANALYSIS_JSON_PROMPT},
            {"role": "user", "content": json.dumps(payload, default=str)},
        ]

        last_error: Exception | None = None
        for attempt in range(settings.groq_max_retries + 1):
            try:
                completion = await self._client.chat.completions.create(
                    model=settings.groq_model,
                    messages=messages,
                    temperature=settings.groq_temperature,
                    response_format={"type": "json_object"},
                )
                content = completion.choices[0].message.content or "{}"
                return self._parse(content)
            except (ValidationError, json.JSONDecodeError, ValueError) as exc:
                last_error = exc
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            "Repair the previous response into strict JSON matching the required schema. "
                            f"Parser error: {exc}"
                        ),
                    }
                )
            except Exception as exc:
                logger.warning("Groq fraud analysis failed; using fallback: %s", exc)
                return self._fallback(payload)

        logger.warning("Groq response parser exhausted retries; using fallback: %s", last_error)
        return self._fallback(payload)

    def _parse(self, content: str) -> FraudLlmDecision:
        data = json.loads(content)
        data["risk_score"] = clamp_score(float(data.get("risk_score", 0.0)))
        data["confidence"] = clamp_score(float(data.get("confidence", 0.0)))
        return FraudLlmDecision.model_validate(data)

    def _fallback(self, payload: dict[str, Any]) -> FraudLlmDecision:
        score = clamp_score(float(payload["computed_risk_score"]))
        evidence = payload["evidence"]
        recommendation_text = [
            item.get("reason", item.get("action", "Review graph-linked fraud evidence."))
            for item in payload["recommendations"]
        ]

        if score >= 0.85:
            decision = "deny"
        elif score >= 0.75:
            decision = "manual_review"
        elif score >= 0.45:
            decision = "step_up_verification"
        else:
            decision = "approve"

        is_empty = (
            len(evidence) == 0
            and score <= 0.15
            and not payload.get("graph_context", {}).get("linked_payment_customers")
            and not payload.get("graph_context", {}).get("linked_address_customers")
        )
        confidence = 0.20 if is_empty else clamp_score(0.55 + min(len(evidence) * 0.08, 0.35))

        return FraudLlmDecision(
            decision=decision,
            confidence=confidence,
            risk_score=score,
            reasoning=self._fallback_reasoning(evidence, score),
            alternatives=recommendation_text[:3] or ["Review graph evidence before fulfillment decisions."],
            flags=[item.get("type", "") for item in evidence],
            graph_evidence=payload.get("graph_context", {}).get("graph_evidence", []),
        )

    def _fallback_reasoning(self, evidence: list[dict[str, Any]], score: float) -> str:
        if not evidence:
            return f"Graph context produced a risk score of {score}; no strong fraud signals were found."
        evidence_text = "; ".join(item.get("description", item.get("type", "fraud signal")) for item in evidence[:4])
        return f"Graph context produced a risk score of {score}. Key signals: {evidence_text}."
