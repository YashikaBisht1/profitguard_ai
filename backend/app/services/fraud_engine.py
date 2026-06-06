from app.models.fraud_features import FraudFeatures


class FraudScoringEngine:
    def evaluate(self, features: FraudFeatures):
        raw_base = features.customer_risk_score * 0.35
        raw_linkage = features.linkage_score * 0.30
        raw_email = features.email_score * 0.10
        raw_coupon = features.coupon_abuse_score * 0.15
        raw_returns = features.return_risk_score * 0.10

        total_raw = raw_base + raw_linkage + raw_email + raw_coupon + raw_returns
        risk_score = min(max(total_raw, 0.0), 1.0)
        
        # Ensure calculated risk score reflects the customer's baseline risk
        risk_score = max(risk_score, features.customer_risk_score)

        if total_raw > 1.0 and total_raw > 0:
            scale = 1.0 / total_raw
            base_contrib = raw_base * scale
            linkage_contrib = raw_linkage * scale
            email_contrib = raw_email * scale
            coupon_contrib = raw_coupon * scale
            returns_contrib = raw_returns * scale
        else:
            base_contrib = raw_base
            linkage_contrib = raw_linkage
            email_contrib = raw_email
            coupon_contrib = raw_coupon
            returns_contrib = raw_returns

        # Decision Tree Logic
        if features.linkage_score >= 0.8 or risk_score >= 0.85:
            decision = "deny"
        elif (
            features.coupon_abuse_score >= 0.7
            or features.return_risk_score >= 0.7
            or features.email_score >= 0.5
            or risk_score >= 0.55
        ):
            decision = "manual_review"
        elif risk_score >= 0.5:
            decision = "step_up_verification"
        else:
            decision = "approve"

        return {
            "risk_score": round(risk_score, 2),
            "decision": decision,
            "score_breakdown": {
                "customer_base": round(raw_base, 2),
                "customer_base_contribution": round(base_contrib, 2),
                "linkage": round(linkage_contrib, 2),
                "linkage_contribution": round(linkage_contrib, 2),
                "email": round(email_contrib, 2),
                "email_contribution": round(email_contrib, 2),
                "coupon_abuse": round(coupon_contrib, 2),
                "coupon_abuse_contribution": round(coupon_contrib, 2),
                "returns": round(returns_contrib, 2),
                "returns_contribution": round(returns_contrib, 2),
            },
        }
