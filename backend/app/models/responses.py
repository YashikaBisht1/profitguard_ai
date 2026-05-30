from typing import Any, Literal

from pydantic import BaseModel, Field


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


class CustomerGraphNode(BaseModel):
    id: str
    label: str
    type: Literal["customer", "address", "payment"]
    riskScore: float | None = None
    val: int
    properties: dict[str, Any] = Field(default_factory=dict)


class CustomerGraphLink(BaseModel):
    source: str
    target: str
    type: str
    label: str
    score: float | None = None
    properties: dict[str, Any] = Field(default_factory=dict)


class CustomerGraphResponse(BaseModel):
    customer_id: str
    nodes: list[CustomerGraphNode]
    links: list[CustomerGraphLink]


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
    graph_context: dict[str, Any]
    recommendations: list[Recommendation]
    prompt_context: str


class ReturnAnalysisResponse(BaseModel):
    customer_id: str
    order_id: str
    return_request_id: str | None
    risk_score: float = Field(..., ge=0, le=1)
    risk_band: Literal["low", "medium", "high"]
    recommended_action: Literal["approve", "manual_review", "deny_or_manual_review"]
    evidence: list[EvidenceItem]
    graph_context: dict[str, Any]
    recommendations: list[Recommendation]
    prompt_context: str
