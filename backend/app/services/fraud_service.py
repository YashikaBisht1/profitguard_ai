from app.graph.repositories import FraudGraphRepository
from app.models.requests import FraudCheckRequest
from app.models.graph_context import FraudContext
from app.models.fraud_features import FraudFeatures
from app.models.responses import EvidenceItem, FraudCheckResponse, Recommendation
from app.prompts.fraud import FRAUD_CHECK_SYSTEM_PROMPT
from app.services.llm_service import GroqFraudAnalysisService
from app.services.context_builder import build_graph_evidence, build_graph_rag_context
from app.services.feature_extractor import extract_fraud_features
from app.services.fraud_engine import FraudScoringEngine
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
        
        # Build the graph evidence using the compiler
        graph.graph_evidence = build_graph_evidence(graph)
        
        # Extract derived features
        features = extract_fraud_features(graph)
        
        # Deterministically calculate scoring via the Fraud Engine
        engine_result = FraudScoringEngine().evaluate(features)
        print("ENGINE DECISION=",engine_result["decision"])
        print("ENGINE SCORE=",engine_result["risk_score"])
        risk_score = engine_result["risk_score"]
        decision = engine_result["decision"]
        score_breakdown = engine_result["score_breakdown"]
        
        # Build GraphRAG plaintext context for the LLM
        graph_rag_context = build_graph_rag_context(graph, features)
        
        evidence = self._build_evidence(graph)
        recommendations = self._recommendations(risk_score, graph)
        
        llm_decision = await self.llm_service.analyze(
            graph_context=graph,
            evidence=[item.model_dump() for item in evidence],
            risk_score=risk_score,
            decision=decision,
            recommendations=[item.model_dump() for item in recommendations],
            graph_rag_context=graph_rag_context,
        )

        response= FraudCheckResponse(
            customer_id=request.customer_id,
            order_id=request.order_id,
            risk_score=risk_score,
            risk_band=risk_band(risk_score),
            decision=decision,
            confidence=llm_decision.confidence,
            reasoning=llm_decision.reasoning,
            alternatives=llm_decision.alternatives,
            evidence=evidence,
            graph_context=graph if request.include_graph_context else FraudContext(customer_id=request.customer_id),
            recommendations=recommendations,
            prompt_context=FRAUD_CHECK_SYSTEM_PROMPT,
            flags=llm_decision.flags,
            graph_evidence=features.graph_evidence,
            features=features,
            score_breakdown=score_breakdown,
        )
        print("FINAL DECISION=",response.decision)
        print("FINAL SCORE=",response.risk_score)
        return response

    def _build_evidence(self, graph: FraudContext) -> list[EvidenceItem]:
        evidence: list[EvidenceItem] = []
        shared_payment_count = graph.shared_payment_count
        shared_address_count = graph.shared_address_count
        risky_orders = graph.high_risk_order_count
        coupon_abuse_orders = graph.coupon_abuse_order_count

        if graph.graph_available is False:
            evidence.append(EvidenceItem(type="graph_unavailable", severity="low", description="Neo4j graph context is unavailable; response is based on fallback defaults."))
        if shared_payment_count:
            evidence.append(EvidenceItem(type="shared_payment", severity="high", description=f"{shared_payment_count} linked customers share a payment fingerprint."))
        if shared_address_count:
            evidence.append(EvidenceItem(type="shared_address", severity="medium", description=f"{shared_address_count} linked customers share an address hash."))
        if risky_orders:
            evidence.append(EvidenceItem(type="order_history", severity="high", description=f"{risky_orders} orders are already marked high risk or under fraud review."))
        if coupon_abuse_orders:
            evidence.append(EvidenceItem(type="coupon_abuse", severity="medium", description=f"{coupon_abuse_orders} orders used abuse-prone coupon campaigns."))
        if graph.payment_fingerprint_match:
            evidence.append(EvidenceItem(type="payment_input_match", severity="high", description="Input payment fingerprint matches a known graph payment method."))
        if graph.address_hash_match:
            evidence.append(EvidenceItem(type="address_input_match", severity="medium", description="Input address hash matches a known graph address."))

        return evidence

    def _score(self, graph: FraudContext, evidence: list[EvidenceItem]) -> float:
        score = float(graph.customer_risk_score or 0.12)
        score += min(graph.shared_payment_count * 0.08, 0.28)
        score += min(graph.shared_address_count * 0.05, 0.2)
        score += min(graph.high_risk_order_count * 0.04, 0.2)
        score += min(graph.coupon_abuse_order_count * 0.03, 0.15)
        score += 0.08 if graph.payment_fingerprint_match else 0.0
        score += 0.05 if graph.address_hash_match else 0.0
        score += min(len(evidence) * 0.02, 0.08)
        return clamp_score(score)

    def _decision(self, score: float) -> str:
        if score >= 0.75:
            return "manual_review"
        if score >= 0.45:
            return "step_up_verification"
        return "approve"

    def _recommendations(self, score: float, graph: FraudContext) -> list[Recommendation]:
        recommendations = [
            Recommendation(action="expand_graph", reason="Traverse shared payment, shared address, coupon, and return paths before final disposition."),
            Recommendation(action="retain_context", reason="Attach graph evidence to the case record for analyst review and GraphRAG retrieval."),
        ]
        if score >= 0.75:
            recommendations.insert(0, Recommendation(action="hold_fulfillment", reason="Risk is high enough to pause shipment or refund until review."))
        if graph.coupon_abuse_order_count > 0:
            recommendations.append(Recommendation(action="coupon_controls", reason="Limit high-discount redemptions across linked accounts."))
        return recommendations

