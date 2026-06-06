from typing import Any, Literal
from pydantic import BaseModel, Field


class CustomerGraphNode(BaseModel):
    id: str
    label: str
    type: Literal["customer", "address", "payment", "email", "email_domain"]
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
    graph_available: bool = True
    graph_error: str | None = None


class FraudFeatures(BaseModel):
    return_ratio: float
    linkage_score: float
    coupon_abuse_score: float


class FraudContext(BaseModel):
    customer_id: str
    customer_risk_score: float | None = 0.0
    account_status: str | None = "UNKNOWN"
    shared_payment_count: int = 0
    shared_address_count: int = 0
    shared_email_count: int = 0
    high_risk_order_count: int = 0
    coupon_abuse_order_count: int = 0
    payment_fingerprint_match: bool = False
    address_hash_match: bool = False
    coupon_codes: list[str] = Field(default_factory=list)
    linked_payment_customers: list[str] = Field(default_factory=list)
    linked_address_customers: list[str] = Field(default_factory=list)
    linked_email_customers: list[str] = Field(default_factory=list)
    email_domain: str | None = None
    graph_evidence: list[str] = Field(default_factory=list)
    total_order_count: int = 0
    returned_order_count: int = 0
    graph_available: bool = True
    graph_error: str | None = None


class ReturnContext(BaseModel):
    customer_id: str
    customer_risk_score: float | None = 0.0
    account_status: str | None = "UNKNOWN"
    total_order_count: int = 0
    total_spent_amount: float = 0.0
    total_refund_amount: float = 0.0
    return_count: int = 0
    manual_review_return_count: int = 0
    rejected_return_count: int = 0
    high_value_return_count: int = 0
    shared_payment_count: int = 0
    shared_address_count: int = 0
    product_categories: list[str] = Field(default_factory=list)
    product_names: list[str] = Field(default_factory=list)
    linked_payment_customers: list[str] = Field(default_factory=list)
    linked_address_customers: list[str] = Field(default_factory=list)
    graph_evidence: list[str] = Field(default_factory=list)
    graph_available: bool = True
    graph_error: str | None = None
