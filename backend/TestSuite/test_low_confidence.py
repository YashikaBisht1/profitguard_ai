import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_manager
from app.models.requests import FraudCheckRequest
from app.services.fraud_service import FraudService


async def seed_c999():
    print("Seeding customer C999 with empty profiles...")
    # Clean up first to avoid duplicates
    await cleanup_c999()
    async with neo4j_manager.session() as session:
        await session.run("CREATE (c:Customer {customerId:'C999', email:'c999@example.com', normalizedEmail:'c999@example.com'});")
        # Decouple email dynamically
        decouple_query = """
        MATCH (c:Customer {customerId: 'C999'})
        WITH c, split(c.email, '@')[1] AS domainName
        MERGE (d:EmailDomain {domainName: domainName})
        MERGE (e:Email {normalizedEmail: c.normalizedEmail})
        ON CREATE SET e.rawEmail = c.email
        MERGE (c)-[:HAS_EMAIL]->(e)
        MERGE (e)-[:BELONGS_TO_DOMAIN]->(d);
        """
        await session.run(decouple_query)


async def cleanup_c999():
    async with neo4j_manager.session() as session:
        await session.run("MATCH (c:Customer {customerId:'C999'}) DETACH DELETE c;")
        await session.run("MATCH (e:Email {normalizedEmail:'c999@example.com'}) DETACH DELETE e;")
        # Keep domainName since it might be shared, or delete if not shared, but it is fine to keep or delete.


async def main():
    await seed_c999()

    service = FraudService()
    request = FraudCheckRequest(customer_id="C999")
    response = await service.check_fraud(request)

    print("\n--- LOW CONFIDENCE TEST RESULTS ---")
    print(f"Decision: {response.decision} (Expected: approve)")
    print(f"Risk Score: {response.risk_score} (Expected: Low)")
    print(f"Confidence: {response.confidence} (Expected: <= 0.20)")
    print(f"Reasoning: {response.reasoning}")

    try:
        assert response.decision == "approve", f"Decision was expected to be 'approve', got '{response.decision}'"
        assert response.confidence <= 0.20, f"Confidence was expected to be <= 0.20, got {response.confidence}"
        print("\nSUCCESS: Anti-hallucination confidence check passed successfully!")
        status = 0
    except AssertionError as e:
        print(f"\nFAILURE: {e}")
        status = 1

    await cleanup_c999()
    sys.exit(status)


if __name__ == "__main__":
    asyncio.run(main())
