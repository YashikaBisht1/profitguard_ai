from app.models.graph_context import FraudContext


def build_graph_evidence(context: FraudContext | dict) -> list[str]:
    evidence = []

    if isinstance(context, FraudContext):
        linked_payments = context.linked_payment_customers
        linked_addresses = context.linked_address_customers
        linked_emails = context.linked_email_customers
    elif isinstance(context, dict):
        linked_payments = context.get("linked_payment_customers", [])
        linked_addresses = context.get("linked_address_customers", [])
        linked_emails = context.get("linked_email_customers", [])
    else:
        return []

    for cid in linked_payments:
        evidence.append(f"Customer shares payment method with {cid}")

    for cid in linked_addresses:
        evidence.append(f"Customer shares address with {cid}")

    for cid in linked_emails:
        evidence.append(f"Customer shares email (exact/normalized) with {cid}")

    return evidence


def build_graph_rag_context(context, features):
    if hasattr(context, "model_dump"):
        ctx = context.model_dump()
    elif isinstance(context, dict):
        ctx = context
    else:
        ctx = {}

    return f"""
Customer Risk Score:
{ctx.get("customer_risk_score", 0.0)}

Shared Payment Count:
{ctx.get("shared_payment_count", 0)}

Shared Address Count:
{ctx.get("shared_address_count", 0)}

Shared Email Count:
{ctx.get("shared_email_count", 0)}

Graph Evidence:
{features.graph_evidence}

Coupon Abuse Score:
{features.coupon_abuse_score}

Linkage Score:
{features.linkage_score}

Email Score:
{features.email_score}
""".strip()
