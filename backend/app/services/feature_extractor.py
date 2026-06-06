from app.models.fraud_features import FraudFeatures
from app.models.graph_context import FraudContext


def extract_fraud_features(context: dict | FraudContext) -> FraudFeatures:
    if hasattr(context, "model_dump"):
        ctx = context.model_dump()
    elif isinstance(context, dict):
        ctx = context
    else:
        ctx = {}

    linkage_score = min(
        (
            ctx.get("shared_payment_count", 0) * 0.25
            + ctx.get("shared_address_count", 0) * 0.15
        ),
        1.0,
    )

    email_score = min(
        ctx.get("shared_email_count", 0) / 10.0,
        1.0,
    )

    coupon_abuse_score = min(
        ctx.get("coupon_abuse_order_count", 0) * 0.2,
        1.0,
    )

    return_risk_score = min(
        ctx.get("high_risk_order_count", 0) * 0.2,
        1.0,
    )

    customer_risk_score = ctx.get("customer_risk_score", 0.0)
    if customer_risk_score is None:
        customer_risk_score = 0.0

    return FraudFeatures(
        customer_risk_score=float(customer_risk_score),
        linkage_score=linkage_score,
        email_score=email_score,
        coupon_abuse_score=coupon_abuse_score,
        return_risk_score=return_risk_score,
        graph_evidence=ctx.get("graph_evidence", []),
    )
