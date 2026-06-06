from pydantic import BaseModel


class FraudFeatures(BaseModel):
    customer_risk_score: float
    linkage_score: float
    email_score: float
    coupon_abuse_score: float
    return_risk_score: float
    graph_evidence: list[str]
