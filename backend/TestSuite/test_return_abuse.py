import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_manager
from app.models.requests import ReturnAnalysisRequest
from app.services.return_service import ReturnAnalysisService


async def clean_database():
    print("Cleaning up test nodes in Neo4j...")
    cleanup_queries = [
        "MATCH (c:Customer {customerId: 'C800'}) DETACH DELETE c;",
        "MATCH (o:Order) WHERE o.orderId IN ['O8001', 'O8002', 'O8003', 'O8004'] DETACH DELETE o;",
        "MATCH (rr:ReturnRequest) WHERE rr.returnRequestId IN ['RET-8001', 'RET-8002', 'RET-8003'] DETACH DELETE rr;"
    ]
    async with neo4j_manager.session() as session:
        for query in cleanup_queries:
            await session.run(query)


async def seed_return_abuse_scenario():
    print("Seeding Return Abuse Scenario...")
    queries = [
        "CREATE (c:Customer {customerId:'C800', fullName:'Abusive Returner', riskScore:0.50, email:'c800@example.com'});",
        # 4 orders total, totalAmount = 1000.0 (250.0 each)
        "CREATE (o1:Order {orderId:'O8001', totalAmount: 250.0, placedAt: datetime()});",
        "CREATE (o2:Order {orderId:'O8002', totalAmount: 250.0, placedAt: datetime()});",
        "CREATE (o3:Order {orderId:'O8003', totalAmount: 250.0, placedAt: datetime()});",
        "CREATE (o4:Order {orderId:'O8004', totalAmount: 250.0, placedAt: datetime()});",
        "MATCH (c:Customer {customerId:'C800'}), (o1:Order {orderId:'O8001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o1);",
        "MATCH (c:Customer {customerId:'C800'}), (o2:Order {orderId:'O8002'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o2);",
        "MATCH (c:Customer {customerId:'C800'}), (o3:Order {orderId:'O8003'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o3);",
        "MATCH (c:Customer {customerId:'C800'}), (o4:Order {orderId:'O8004'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o4);",
        # 3 returned orders, refund amount: 150.0, 150.0, 150.0 = 450.0 total
        # Statuses: 1 REJECTED, 1 MANUAL_REVIEW, 1 APPROVED
        "CREATE (rr1:ReturnRequest {returnRequestId:'RET-8001', returnStatus:'REJECTED', refundAmount: 150.0});",
        "CREATE (rr2:ReturnRequest {returnRequestId:'RET-8002', returnStatus:'MANUAL_REVIEW', refundAmount: 150.0});",
        "CREATE (rr3:ReturnRequest {returnRequestId:'RET-8003', returnStatus:'APPROVED', refundAmount: 150.0});",
        "MATCH (o1:Order {orderId:'O8001'}), (rr1:ReturnRequest {returnRequestId:'RET-8001'}) CREATE (o1)-[:RETURNED {createdAt: datetime()}]->(rr1);",
        "MATCH (o2:Order {orderId:'O8002'}), (rr2:ReturnRequest {returnRequestId:'RET-8002'}) CREATE (o2)-[:RETURNED {createdAt: datetime()}]->(rr2);",
        "MATCH (o3:Order {orderId:'O8003'}), (rr3:ReturnRequest {returnRequestId:'RET-8003'}) CREATE (o3)-[:RETURNED {createdAt: datetime()}]->(rr3);"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)


async def main():
    await clean_database()
    await seed_return_abuse_scenario()

    service = ReturnAnalysisService()
    request = ReturnAnalysisRequest(customer_id="C800", order_id="O8001", include_graph_context=True)
    response = await service.analyze_return(request)

    print("\n--- RETURN ABUSE INTELLIGENCE TEST RESULTS ---")
    print(f"Customer ID: {response.customer_id}")
    print(f"Total Orders: {response.graph_context.total_order_count} (Expected: 4)")
    print(f"Total Spent: {response.graph_context.total_spent_amount} (Expected: 1000.0)")
    print(f"Total Refunded: {response.graph_context.total_refund_amount} (Expected: 450.0)")
    print(f"Return Count: {response.graph_context.return_count} (Expected: 3)")
    print("")
    print(f"Return Rate: {response.return_rate} (Expected: 3/4 = 0.75)")
    print(f"Refund Rate: {response.refund_rate} (Expected: 450/1000 = 0.45)")
    print(f"Rejected Return Rate: {response.rejected_return_rate} (Expected: 1/3 = 0.33)")
    print(f"Manual Review Rate: {response.manual_review_rate} (Expected: 1/3 = 0.33)")

    try:
        assert response.graph_context.total_order_count == 4
        assert response.graph_context.total_spent_amount == 1000.0
        assert response.graph_context.total_refund_amount == 450.0
        assert response.return_rate == 0.75
        assert response.refund_rate == 0.45
        assert response.rejected_return_rate == 0.33
        assert response.manual_review_rate == 0.33
        print("\nSUCCESS: Return Abuse Intelligence metrics calculated perfectly!")
        status = 0
    except AssertionError as e:
        print(f"\nFAILURE: {e}")
        status = 1

    await clean_database()
    sys.exit(status)


if __name__ == "__main__":
    asyncio.run(main())
