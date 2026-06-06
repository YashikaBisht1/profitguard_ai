import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.feature_extractor import extract_fraud_features

context = {
    "customer_risk_score": 0.95,
    "shared_payment_count": 2,
    "shared_address_count": 2,
    "coupon_abuse_order_count": 3,
    "high_risk_order_count": 1,
    "graph_evidence": [
        "Customer shares payment with C501",
        "Customer shares address with C502"
    ]
}

features = extract_fraud_features(context)
print("Extracted Fraud Features:")
print(features.model_dump())
