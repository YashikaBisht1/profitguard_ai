import asyncio
import logging
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

from app.graph.neo4j import neo4j_manager
from app.models.requests import FraudCheckRequest
from app.services.fraud_service import FraudService
from app.services.feature_extractor import extract_fraud_features
from app.services.fraud_engine import FraudScoringEngine
from app.services.context_builder import build_graph_evidence, build_graph_rag_context


async def seed_c500():
    print("Seeding C500 (Fraud Ring Worst Case) nodes...")
    cleanup_queries = [
        "MATCH (c:Customer) WHERE c.customerId IN ['C500', 'C501', 'C502'] DETACH DELETE c;",
        "MATCH (o:Order) WHERE o.orderId = 'O5001' DETACH DELETE o;",
        "MATCH (pm:PaymentMethod) WHERE pm.paymentMethodId = 'PM-500' DETACH DELETE pm;",
        "MATCH (addr:Address) WHERE addr.addressId = 'ADDR-500' DETACH DELETE addr;",
        "MATCH (coupon:Coupon) WHERE coupon.couponId = 'COUP-500' DETACH DELETE coupon;",
        "MATCH (e:Email) WHERE e.normalizedEmail IN ['c500@example.com', 'c501@example.com', 'c502@example.com'] DETACH DELETE e;",
        "MATCH (ed:EmailDomain) WHERE ed.domainName = 'example.com' DETACH DELETE ed;"
    ]
    queries = [
        "CREATE (c1:Customer {customerId:'C500', riskScore:0.95, email:'c500@example.com', normalizedEmail:'c500@example.com'});",
        "CREATE (c2:Customer {customerId:'C501', email:'c501@example.com', normalizedEmail:'c501@example.com'});",
        "CREATE (c3:Customer {customerId:'C502', email:'c502@example.com', normalizedEmail:'c502@example.com'});",
        "CREATE (addr:Address {addressId:'ADDR-500', addressHash:'ADDR-500'});",
        "MATCH (c1:Customer {customerId:'C500'}), (addr:Address {addressId:'ADDR-500'}) CREATE (c1)-[:USES_ADDRESS]->(addr);",
        "MATCH (c2:Customer {customerId:'C501'}), (addr:Address {addressId:'ADDR-500'}) CREATE (c2)-[:USES_ADDRESS]->(addr);",
        "MATCH (c3:Customer {customerId:'C502'}), (addr:Address {addressId:'ADDR-500'}) CREATE (c3)-[:USES_ADDRESS]->(addr);",
        "MATCH (c1:Customer {customerId:'C500'}), (c2:Customer {customerId:'C501'}) CREATE (c1)-[:SHARES_ADDRESS_WITH {createdAt: datetime(), score: 0.95}]->(c2);",
        "MATCH (c1:Customer {customerId:'C500'}), (c3:Customer {customerId:'C502'}) CREATE (c1)-[:SHARES_ADDRESS_WITH {createdAt: datetime(), score: 0.95}]->(c3);",
        "CREATE (pm:PaymentMethod {paymentMethodId:'PM-500', paymentFingerprint:'PM-500'});",
        "MATCH (c1:Customer {customerId:'C500'}), (pm:PaymentMethod {paymentMethodId:'PM-500'}) CREATE (c1)-[:USES_PAYMENT]->(pm);",
        "MATCH (c2:Customer {customerId:'C501'}), (pm:PaymentMethod {paymentMethodId:'PM-500'}) CREATE (c2)-[:USES_PAYMENT]->(pm);",
        "MATCH (c3:Customer {customerId:'C502'}), (pm:PaymentMethod {paymentMethodId:'PM-500'}) CREATE (c3)-[:USES_PAYMENT]->(pm);",
        "MATCH (c1:Customer {customerId:'C500'}), (c2:Customer {customerId:'C501'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.95}]->(c2);",
        "MATCH (c1:Customer {customerId:'C500'}), (c3:Customer {customerId:'C502'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.95}]->(c3);",
        "CREATE (coupon:Coupon {couponId:'COUP-500', code:'FRAUD90', campaignId:'CMP-ABUSE-RING', isActive: true});",
        "CREATE (o:Order {orderId:'O5001', fraudStatus:'HIGH_RISK', placedAt: datetime()});",
        "MATCH (c1:Customer {customerId:'C500'}), (o:Order {orderId:'O5001'}) CREATE (c1)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (o:Order {orderId:'O5001'}), (coupon:Coupon {couponId:'COUP-500'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);"
    ]
    async with neo4j_manager.session() as session:
        for q in cleanup_queries:
            await session.run(q)
        for q in queries:
            await session.run(q)
            
        # Decouple emails to separate nodes
        decouple_query = """
        MATCH (c:Customer)
        WHERE c.customerId IN ['C500', 'C501', 'C502']
        WITH c, split(c.email, '@')[1] AS domainName
        MERGE (d:EmailDomain {domainName: domainName})
        MERGE (e:Email {normalizedEmail: c.normalizedEmail})
        ON CREATE SET e.rawEmail = c.email
        MERGE (c)-[:HAS_EMAIL]->(e)
        MERGE (e)-[:BELONGS_TO_DOMAIN]->(d);
        """
        await session.run(decouple_query)


async def cleanup_c500():
    print("Cleaning up seeded test nodes...")
    cleanup_queries = [
        "MATCH (c:Customer) WHERE c.customerId IN ['C500', 'C501', 'C502'] DETACH DELETE c;",
        "MATCH (o:Order) WHERE o.orderId = 'O5001' DETACH DELETE o;",
        "MATCH (pm:PaymentMethod) WHERE pm.paymentMethodId = 'PM-500' DETACH DELETE pm;",
        "MATCH (addr:Address) WHERE addr.addressId = 'ADDR-500' DETACH DELETE addr;",
        "MATCH (coupon:Coupon) WHERE coupon.couponId = 'COUP-500' DETACH DELETE coupon;",
        "MATCH (e:Email) WHERE e.normalizedEmail IN ['c500@example.com', 'c501@example.com', 'c502@example.com'] DETACH DELETE e;",
        "MATCH (ed:EmailDomain) WHERE ed.domainName = 'example.com' DETACH DELETE ed;"
    ]
    async with neo4j_manager.session() as session:
        for q in cleanup_queries:
            await session.run(q)


async def main():
    await seed_c500()

    request = FraudCheckRequest(
        customer_id="C500",
        order_id="O5001",
        payment_fingerprint="PM-500",
        address_hash="ADDR-500"
    )

    print("\n--- STAGE 1: Neo4j (Context Fetching) ---")
    service = FraudService()
    graph = await service.repository.fetch_fraud_context(request)
    graph.graph_evidence = build_graph_evidence(graph)
    print(graph.model_dump())

    print("\n--- STAGE 2: Features (Feature Extraction) ---")
    features = extract_fraud_features(graph)
    print(features.model_dump())

    print("\n--- STAGE 3: Risk Engine (Deterministic Scoring) ---")
    engine_result = FraudScoringEngine().evaluate(features)
    print(engine_result)

    print("\n--- STAGE 4: GraphRAG Context (For LLM) ---")
    graph_rag_context = build_graph_rag_context(graph, features)
    print(graph_rag_context)

    print("\n--- STAGE 5: LLM & API Response (E2E Result) ---")
    response = await service.check_fraud(request)
    print(response.model_dump())

    await cleanup_c500()


if __name__ == "__main__":
    asyncio.run(main())
