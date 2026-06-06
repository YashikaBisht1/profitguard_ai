from app.graph.repositories import FraudGraphRepository
from app.models.requests import ReturnAnalysisRequest
from app.models.graph_context import ReturnContext
from app.models.responses import EvidenceItem, Recommendation, ReturnAnalysisResponse
from app.prompts.return_analysis import RETURN_ANALYSIS_SYSTEM_PROMPT
from app.services.context_builder import build_graph_evidence
from app.utils.scoring import clamp_score, risk_band


class ReturnAnalysisService:
    def __init__(self, repository: FraudGraphRepository | None = None) -> None:
        self.repository = repository or FraudGraphRepository()

    async def analyze_return(self, request: ReturnAnalysisRequest) -> ReturnAnalysisResponse:
        graph = await self.repository.fetch_return_context(request)
        graph.graph_evidence = build_graph_evidence(graph)
        evidence = self._build_evidence(graph)
        score = self._score(graph, evidence)

        total_orders = graph.total_order_count
        return_count = graph.return_count
        spent = graph.total_spent_amount
        refunded = graph.total_refund_amount
        rejected = graph.rejected_return_count
        manual = graph.manual_review_return_count

        return_rate = round(return_count / total_orders, 2) if total_orders > 0 else 0.0
        refund_rate = round(refunded / spent, 2) if spent > 0 else 0.0
        rejected_return_rate = round(rejected / return_count, 2) if return_count > 0 else 0.0
        manual_review_rate = round(manual / return_count, 2) if return_count > 0 else 0.0

        return ReturnAnalysisResponse(
            customer_id=request.customer_id,
            order_id=request.order_id,
            return_request_id=request.return_request_id,
            risk_score=score,
            risk_band=risk_band(score),
            recommended_action=self._recommended_action(score),
            evidence=evidence,
            graph_context=graph if request.include_graph_context else ReturnContext(customer_id=request.customer_id),
            recommendations=self._recommendations(score, graph),
            prompt_context=RETURN_ANALYSIS_SYSTEM_PROMPT,
            return_rate=return_rate,
            refund_rate=refund_rate,
            rejected_return_rate=rejected_return_rate,
            manual_review_rate=manual_review_rate,
        )

    def _build_evidence(self, graph: ReturnContext) -> list[EvidenceItem]:
        evidence: list[EvidenceItem] = []
        return_count = graph.return_count
        manual_review_returns = graph.manual_review_return_count
        rejected_returns = graph.rejected_return_count
        high_value_returns = graph.high_value_return_count

        if graph.graph_available is False:
            evidence.append(EvidenceItem(type="graph_unavailable", severity="low", description="Neo4j graph context is unavailable; response is based on fallback defaults."))
        if return_count >= 3:
            evidence.append(EvidenceItem(type="return_frequency", severity="medium", description=f"{return_count} prior return requests found for this customer."))
        if manual_review_returns:
            evidence.append(EvidenceItem(type="manual_review_returns", severity="medium", description=f"{manual_review_returns} returns previously required manual review."))
        if rejected_returns:
            evidence.append(EvidenceItem(type="rejected_returns", severity="high", description=f"{rejected_returns} prior returns were rejected."))
        if high_value_returns:
            evidence.append(EvidenceItem(type="high_value_returns", severity="high", description=f"{high_value_returns} high-value refund requests found."))
        if graph.shared_payment_count or graph.shared_address_count:
            evidence.append(EvidenceItem(type="linked_identity", severity="high", description="Customer is connected to other accounts through shared address or payment relationships."))

        return evidence

    def _score(self, graph: ReturnContext, evidence: list[EvidenceItem]) -> float:
        score = float(graph.customer_risk_score or 0.1)
        score += min(graph.return_count * 0.05, 0.25)
        score += min(graph.manual_review_return_count * 0.08, 0.24)
        score += min(graph.rejected_return_count * 0.12, 0.24)
        score += min(graph.high_value_return_count * 0.08, 0.16)
        score += min((graph.shared_payment_count + graph.shared_address_count) * 0.04, 0.16)
        score += min(len(evidence) * 0.02, 0.08)
        return clamp_score(score)

    def _recommended_action(self, score: float) -> str:
        if score >= 0.75:
            return "deny_or_manual_review"
        if score >= 0.45:
            return "manual_review"
        return "approve"

    def _recommendations(self, score: float, graph: ReturnContext) -> list[Recommendation]:
        recommendations = [
            Recommendation(action="compare_return_reason", reason="Retrieve similar return narratives and product-category return patterns before final approval."),
            Recommendation(action="inspect_linked_accounts", reason="Review shared address and payment clusters for coordinated refund abuse."),
        ]
        if score >= 0.75:
            recommendations.insert(0, Recommendation(action="pause_refund", reason="Risk is high enough to delay automatic refund release."))
        if graph.high_value_return_count > 0:
            recommendations.append(Recommendation(action="require_item_inspection", reason="High-value return pattern warrants warehouse validation."))
        return recommendations

