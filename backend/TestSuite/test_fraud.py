import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.repositories import FraudGraphRepository
from app.models.requests import FraudCheckRequest

repo = FraudGraphRepository()

async def main():
    request = FraudCheckRequest(
        customer_id="C500",
        order_id="O5001",
        payment_fingerprint="PM-500",
        address_hash="ADDR-500"
    )
    result = await repo.fetch_fraud_context(request)
    print("Fetched Neo4j FraudContext for C500:")
    print(result.model_dump())

if __name__ == "__main__":
    asyncio.run(main())
