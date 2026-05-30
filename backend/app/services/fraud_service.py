from app.graph.repositories import FraudGraphRepository
from app.models.requests import FraudCheckRequest
from app.models.responses import EvidenceItem, FraudCheckResponse, Recommendation
from app.prompts.fraud import FRAUD_CHECK_SYSTEM_PROMPT
from app.services.llm_service import GroqFraudAnalysisService
from app.utils.scoring import clamp_score, risk_band


class FraudService:
    def __init__(
        self,
        repository: FraudGraphRepository | None = None,
        llm_service: GroqFraudAnalysisService | None = None,
    ) -> None:
        self.repository = repository or FraudGraphRepository()
        self.llm_service = llm_service or GroqFraudAnalysisService()

    async def check_fraud(self, request: FraudCheckRequest) -> FraudCheckResponse:
        graph = await self.repository.fetch_fraud_context(request)
        evidence = self._build_evidence(graph)
        score = self._score(graph, evidence)
        recommendations = self._recommendations(score, graph)
        decision = self._decision(score)
        llm_decision = await self.llm_service.analyze(
            graph_context=graph,
            evidence=[item.model_dump() for item in evidence],
            risk_score=score,
            decision=decision,
            recommendations=[item.model_dump() for item in recommendations],
        )

        return FraudCheckResponse(
            customer_id=request.customer_id,
            order_id=request.order_id,
            risk_score=llm_decision.risk_score,
            risk_band=risk_band(llm_decision.risk_score),
            decision=llm_decision.decision,
            confidence=llm_decision.confidence,
            reasoning=llm_decision.reasoning,
            alternatives=llm_decision.alternatives,
            evidence=evidence,
            graph_context=graph if request.include_graph_context else {},
            recommendations=recommendations,
            prompt_context=FRAUD_CHECK_SYSTEM_PROMPT,
        )

    def _build_evidence(self, graph: dict) -> list[EvidenceItem]:
        evidence: list[EvidenceItem] = []
        shared_payment_count = graph.get("shared_payment_count", 0)
        shared_address_count = graph.get("shared_address_count", 0)
        risky_orders = graph.get("high_risk_order_count", 0)
        coupon_abuse_orders = graph.get("coupon_abuse_order_count", 0)

        if graph.get("graph_available") is False:
            evidence.append(EvidenceItem(type="graph_unavailable", severity="low", description="Neo4j graph context is unavailable; response is based on fallback defaults."))
        if shared_payment_count:
            evidence.append(EvidenceItem(type="shared_payment", severity="high", description=f"{shared_payment_count} linked customers share a payment fingerprint."))
        if shared_address_count:
            evidence.append(EvidenceItem(type="shared_address", severity="medium", description=f"{shared_address_count} linked customers share an address hash."))
        if risky_orders:
            evidence.append(EvidenceItem(type="order_history", severity="high", description=f"{risky_orders} orders are already marked high risk or under fraud review."))
        if coupon_abuse_orders:
            evidence.append(EvidenceItem(type="coupon_abuse", severity="medium", description=f"{coupon_abuse_orders} orders used abuse-prone coupon campaigns."))
        if graph.get("payment_fingerprint_match"):
            evidence.append(EvidenceItem(type="payment_input_match", severity="high", description="Input payment fingerprint matches a known graph payment method."))
        if graph.get("address_hash_match"):
            evidence.append(EvidenceItem(type="address_input_match", severity="medium", description="Input address hash matches a known graph address."))

        return evidence

    def _score(self, graph: dict, evidence: list[EvidenceItem]) -> float:
        score = float(graph.get("customer_risk_score") or 0.12)
        score += min(graph.get("shared_payment_count", 0) * 0.08, 0.28)
        score += min(graph.get("shared_address_count", 0) * 0.05, 0.2)
        score += min(graph.get("high_risk_order_count", 0) * 0.04, 0.2)
        score += min(graph.get("coupon_abuse_order_count", 0) * 0.03, 0.15)
        score += 0.08 if graph.get("payment_fingerprint_match") else 0.0
        score += 0.05 if graph.get("address_hash_match") else 0.0
        score += min(len(evidence) * 0.02, 0.08)
        return clamp_score(score)

    def _decision(self, score: float) -> str:
        if score >= 0.75:
            return "manual_review"
        if score >= 0.45:
            return "step_up_verification"
        return "approve"

    def _recommendations(self, score: float, graph: dict) -> list[Recommendation]:
        recommendations = [
            Recommendation(action="expand_graph", reason="Traverse shared payment, shared address, coupon, and return paths before final disposition."),
            Recommendation(action="retain_context", reason="Attach graph evidence to the case record for analyst review and GraphRAG retrieval."),
        ]
        if score >= 0.75:
            recommendations.insert(0, Recommendation(action="hold_fulfillment", reason="Risk is high enough to pause shipment or refund until review."))
        if graph.get("coupon_abuse_order_count", 0) > 0:
            recommendations.append(Recommendation(action="coupon_controls", reason="Limit high-discount redemptions across linked accounts."))
        return recommendations
