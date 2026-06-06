import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.fraud_features import FraudFeatures
from app.services.fraud_engine import FraudScoringEngine

features = FraudFeatures(
    customer_risk_score=0.95,
    linkage_score=0.7,
    email_score=0.1,
    coupon_abuse_score=0.5,
    return_risk_score=0.4,
    graph_evidence=[]
)

engine = FraudScoringEngine()
result = engine.evaluate(features)
print("Scoring Engine Results:")
print(result)
