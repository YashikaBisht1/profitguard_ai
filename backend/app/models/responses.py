from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.graph_context import (
    CustomerGraphNode,
    CustomerGraphLink,
    CustomerGraphResponse,
    FraudContext,
    ReturnContext,
)
from app.models.fraud_features import FraudFeatures


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    version: str
    graph: dict[str, Any]


class EvidenceItem(BaseModel):
    type: str
    severity: Literal["low", "medium", "high"]
    description: str


class Recommendation(BaseModel):
    action: str
    reason: str


class FraudCheckResponse(BaseModel):
    customer_id: str
    order_id: str | None
    risk_score: float = Field(..., ge=0, le=1)
    risk_band: Literal["low", "medium", "high"]
    decision: Literal["approve", "step_up_verification", "manual_review", "deny"]
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str
    alternatives: list[str]
    evidence: list[EvidenceItem]
    graph_context: FraudContext | dict[str, Any]
    recommendations: list[Recommendation]
    prompt_context: str
    flags: list[str] = Field(default_factory=list)
    graph_evidence: list[str] = Field(default_factory=list)
    features: FraudFeatures
    score_breakdown: dict[str, float] = Field(default_factory=dict)


class ReturnAnalysisResponse(BaseModel):
    customer_id: str
    order_id: str
    return_request_id: str | None
    risk_score: float = Field(..., ge=0, le=1)
    risk_band: Literal["low", "medium", "high"]
    recommended_action: Literal["approve", "manual_review", "deny_or_manual_review"]
    evidence: list[EvidenceItem]
    graph_context: ReturnContext | dict[str, Any]
    recommendations: list[Recommendation]
    prompt_context: str
    return_rate: float = 0.0
    refund_rate: float = 0.0
    rejected_return_rate: float = 0.0
    manual_review_rate: float = 0.0

