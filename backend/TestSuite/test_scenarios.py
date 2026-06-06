import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_manager
from app.models.requests import FraudCheckRequest
from app.services.fraud_service import FraudService


async def clean_database():
    print("Cleaning up test nodes in Neo4j...")
    cleanup_queries = [
        "MATCH (c:Customer) WHERE c.customerId IN ['C100', 'C200', 'C204', 'C300', 'C400', 'C500', 'C501', 'C502', 'C600', 'C601', 'C602', 'C701', 'C702', 'C703', 'C704', 'C705', 'C706', 'C999'] DETACH DELETE c;",
        "MATCH (o:Order) WHERE o.orderId IN ['O1001', 'O3001', 'O3002', 'O4001', 'O5001', 'O7001', 'O7002', 'O7003', 'O7004', 'O7005', 'O7006', 'O7007', 'O7008'] DETACH DELETE o;",
        "MATCH (pm:PaymentMethod) WHERE pm.paymentMethodId IN ['PM-777', 'PM-500'] DETACH DELETE pm;",
        "MATCH (addr:Address) WHERE addr.addressId IN ['ADDR-500'] DETACH DELETE addr;",
        "MATCH (coupon:Coupon) WHERE coupon.couponId IN ['COUP-300', 'COUP-500', 'COUP-700'] DETACH DELETE coupon;",
        "MATCH (rr:ReturnRequest) WHERE rr.returnRequestId IN ['RET-4001', 'RET-4002', 'RET-4003'] DETACH DELETE rr;",
        "MATCH (e:Email) WHERE e.normalizedEmail IN ['alice@example.com', 'c200@example.com', 'c204@example.com', 'c300@example.com', 'c400@example.com', 'c500@example.com', 'c501@example.com', 'c502@example.com', 'johnsmith@gmail.com', 'c999@example.com'] DETACH DELETE e;",
        "MATCH (ed:EmailDomain) WHERE ed.domainName IN ['example.com', 'gmail.com'] DETACH DELETE ed;"
    ]
    async with neo4j_manager.session() as session:
        for query in cleanup_queries:
            await session.run(query)


async def decouple_emails_for_customers(customer_ids: list[str]):
    query = """
    MATCH (c:Customer)
    WHERE c.customerId IN $customer_ids
    WITH c, split(c.email, '@')[1] AS domainName
    MERGE (d:EmailDomain {domainName: domainName})
    MERGE (e:Email {normalizedEmail: c.normalizedEmail})
    ON CREATE SET e.rawEmail = c.email
    MERGE (c)-[:HAS_EMAIL]->(e)
    MERGE (e)-[:BELONGS_TO_DOMAIN]->(d);
    """
    async with neo4j_manager.session() as session:
        await session.run(query, customer_ids=customer_ids)


async def seed_scenario_1():
    print("Seeding Scenario 1: Legitimate Customer...")
    queries = [
        "CREATE (c:Customer {customerId:'C100', fullName:'Alice Sharma', riskScore:0.10, accountStatus:'ACTIVE', email:'alice@example.com', normalizedEmail:'alice@example.com'});",
        "CREATE (o1:Order {orderId:'O1001', fraudStatus:'CLEAR', placedAt: datetime()});",
        "MATCH (c:Customer {customerId:'C100'}), (o1:Order {orderId:'O1001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o1);"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C100"])


async def seed_scenario_2():
    print("Seeding Scenario 2: Shared Payment Ring...")
    queries = [
        "CREATE (c1:Customer {customerId:'C200', riskScore:0.25, email:'c200@example.com', normalizedEmail:'c200@example.com'});",
        "CREATE (c2:Customer {customerId:'C204', riskScore:0.20, email:'c204@example.com', normalizedEmail:'c204@example.com'});",
        "CREATE (pm:PaymentMethod {paymentMethodId:'PM-777', paymentFingerprint:'PM-777'});",
        "MATCH (c1:Customer {customerId:'C200'}), (pm:PaymentMethod {paymentMethodId:'PM-777'}) CREATE (c1)-[:USES_PAYMENT]->(pm);",
        "MATCH (c2:Customer {customerId:'C204'}), (pm:PaymentMethod {paymentMethodId:'PM-777'}) CREATE (c2)-[:USES_PAYMENT]->(pm);",
        "MATCH (c1:Customer {customerId:'C200'}), (c2:Customer {customerId:'C204'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.9}]->(c2);"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C200", "C204"])


async def seed_scenario_3():
    print("Seeding Scenario 3: Coupon Abuse...")
    queries = [
        "CREATE (c:Customer {customerId:'C300', riskScore:0.40, email:'c300@example.com', normalizedEmail:'c300@example.com'});",
        "CREATE (coupon:Coupon {couponId:'COUP-300', code:'SAVE90', campaignId:'CMP-ABUSE-01', isActive: true});",
        "CREATE (o1:Order {orderId:'O3001', fraudStatus:'CLEAR', placedAt: datetime()});",
        "CREATE (o2:Order {orderId:'O3002', fraudStatus:'CLEAR', placedAt: datetime()});",
        "MATCH (c:Customer {customerId:'C300'}), (o1:Order {orderId:'O3001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o1);",
        "MATCH (c:Customer {customerId:'C300'}), (o2:Order {orderId:'O3002'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o2);",
        "MATCH (o1:Order {orderId:'O3001'}), (coupon:Coupon {couponId:'COUP-300'}) CREATE (o1)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o2:Order {orderId:'O3002'}), (coupon:Coupon {couponId:'COUP-300'}) CREATE (o2)-[:USED {createdAt: datetime()}]->(coupon);"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C300"])


async def seed_scenario_4():
    print("Seeding Scenario 4: Return Fraud Cluster...")
    queries = [
        "CREATE (c:Customer {customerId:'C400', riskScore:0.70, email:'c400@example.com', normalizedEmail:'c400@example.com'});",
        "CREATE (o1:Order {orderId:'O4001', placedAt: datetime()});",
        "CREATE (rr1:ReturnRequest {returnRequestId:'RET-4001', returnStatus:'REJECTED', refundAmount:600.0});",
        "CREATE (rr2:ReturnRequest {returnRequestId:'RET-4002', returnStatus:'MANUAL_REVIEW', refundAmount:500.0});",
        "CREATE (rr3:ReturnRequest {returnRequestId:'RET-4003', returnStatus:'MANUAL_REVIEW', refundAmount:700.0});",
        "MATCH (c:Customer {customerId:'C400'}), (o1:Order {orderId:'O4001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o1);",
        "MATCH (o1:Order {orderId:'O4001'}), (rr1:ReturnRequest {returnRequestId:'RET-4001'}) CREATE (o1)-[:RETURNED {createdAt: datetime()}]->(rr1);",
        "MATCH (o1:Order {orderId:'O4001'}), (rr2:ReturnRequest {returnRequestId:'RET-4002'}) CREATE (o1)-[:RETURNED {createdAt: datetime()}]->(rr2);",
        "MATCH (o1:Order {orderId:'O4001'}), (rr3:ReturnRequest {returnRequestId:'RET-4003'}) CREATE (o1)-[:RETURNED {createdAt: datetime()}]->(rr3);"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C400"])


async def seed_scenario_5():
    print("Seeding Scenario 5: Fraud Ring (Worst Case)...")
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
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C500", "C501", "C502"])


async def seed_scenario_7():
    print("Seeding Scenario 7: Email Laundering Coupon Ring...")
    queries = [
        "CREATE (c1:Customer {customerId:'C701', fullName:'John Smith 1', riskScore:0.20, email:'john.smith@gmail.com', normalizedEmail:'johnsmith@gmail.com', accountStatus:'ACTIVE'});",
        "CREATE (c2:Customer {customerId:'C702', fullName:'John Smith 2', riskScore:0.20, email:'john.smith+promo@gmail.com', normalizedEmail:'johnsmith@gmail.com', accountStatus:'ACTIVE'});",
        "CREATE (c3:Customer {customerId:'C703', fullName:'John Smith 3', riskScore:0.20, email:'j.o.h.n.s.m.i.t.h@gmail.com', normalizedEmail:'johnsmith@gmail.com', accountStatus:'ACTIVE'});",
        "CREATE (c4:Customer {customerId:'C704', fullName:'John Smith 4', riskScore:0.20, email:'johnsmith+free@gmail.com', normalizedEmail:'johnsmith@gmail.com', accountStatus:'ACTIVE'});",
        "CREATE (c5:Customer {customerId:'C705', fullName:'John Smith 5', riskScore:0.20, email:'john.s.m.i.t.h+1@gmail.com', normalizedEmail:'johnsmith@gmail.com', accountStatus:'ACTIVE'});",
        "CREATE (c6:Customer {customerId:'C706', fullName:'John Smith 6', riskScore:0.20, email:'john.smith+2@gmail.com', normalizedEmail:'johnsmith@gmail.com', accountStatus:'ACTIVE'});",
        "CREATE (coupon700:Coupon {couponId:'COUP-700', code:'WELCOME90', campaignId:'CMP-ABUSE-001', isActive: true});",
        "CREATE (o7001:Order {orderId:'O7001', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7002:Order {orderId:'O7002', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7003:Order {orderId:'O7003', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7004:Order {orderId:'O7004', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7005:Order {orderId:'O7005', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7006:Order {orderId:'O7006', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7007:Order {orderId:'O7007', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o7008:Order {orderId:'O7008', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "MATCH (c:Customer {customerId:'C701'}), (o:Order {orderId:'O7001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C701'}), (o:Order {orderId:'O7007'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C701'}), (o:Order {orderId:'O7008'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C702'}), (o:Order {orderId:'O7002'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C703'}), (o:Order {orderId:'O7003'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C704'}), (o:Order {orderId:'O7004'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C705'}), (o:Order {orderId:'O7005'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C706'}), (o:Order {orderId:'O7006'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (o:Order {orderId:'O7001'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7002'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7003'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7004'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7005'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7006'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7007'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O7008'}), (coupon:Coupon {couponId:'COUP-700'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C701", "C702", "C703", "C704", "C705", "C706"])


async def seed_bonus_scenario():
    print("Seeding Bonus Scenario: Empty Customer...")
    queries = [
        "CREATE (c:Customer {customerId:'C999', email:'c999@example.com', normalizedEmail:'c999@example.com'});"
    ]
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
    await decouple_emails_for_customers(["C999"])


async def run_scenario_tests():
    service = FraudService()
    failed = False

    # Ensure clean slate first
    await clean_database()

    # 1. SCENARIO 1: Legitimate Customer
    await seed_scenario_1()
    res1 = await service.check_fraud(FraudCheckRequest(customer_id="C100"))
    print("\n--- SCENARIO 1 RESULT ---")
    print(f"Decision: {res1.decision} (Expected: approve)")
    print(f"Risk Score: {res1.risk_score} (Expected: 0.00 - 0.30)")
    print(f"Confidence: {res1.confidence} (Expected: Medium/Reasonable)")
    print(f"Reasoning: {res1.reasoning}")
    print(f"Graph Evidence: {res1.graph_evidence}")
    try:
        assert res1.decision == "approve", "Scenario 1 failed decision validation"
        assert 0.00 <= res1.risk_score <= 0.30, "Scenario 1 failed risk score validation"
        print("SCENARIO 1 PASSED")
    except AssertionError as e:
        print(f"SCENARIO 1 FAILED ASSERTION: {e}")
        failed = True

    # Clean up Scenario 1
    await clean_database()

    # 2. SCENARIO 2: Shared Payment Ring
    await seed_scenario_2()
    res2 = await service.check_fraud(FraudCheckRequest(customer_id="C200"))
    print("\n--- SCENARIO 2 RESULT ---")
    print(f"Decision: {res2.decision} (Expected: approve)")
    print(f"Risk Score: {res2.risk_score} (Expected: 0.20 - 0.30)")
    print(f"Reasoning: {res2.reasoning}")
    print(f"Graph Evidence: {res2.graph_evidence}")
    try:
        assert res2.decision == "approve", "Scenario 2 failed decision validation"
        assert 0.20 <= res2.risk_score <= 0.30, f"Scenario 2 failed risk score validation (got {res2.risk_score})"
        assert any("shares payment" in ev.lower() for ev in res2.graph_evidence), "Scenario 2 failed graph evidence verification"
        print("SCENARIO 2 PASSED")
    except AssertionError as e:
        print(f"SCENARIO 2 FAILED ASSERTION: {e}")
        failed = True

    # Clean up Scenario 2
    await clean_database()

    # 3. SCENARIO 3: Coupon Abuse
    await seed_scenario_3()
    res3 = await service.check_fraud(FraudCheckRequest(customer_id="C300"))
    print("\n--- SCENARIO 3 RESULT ---")
    print(f"Decision: {res3.decision} (Expected: approve)")
    print(f"Risk Score: {res3.risk_score} (Expected: 0.35 - 0.45)")
    print(f"Reasoning: {res3.reasoning}")
    print(f"Graph Evidence: {res3.graph_evidence}")
    try:
        assert res3.decision == "approve", "Scenario 3 failed decision validation"
        assert 0.35 <= res3.risk_score <= 0.45, f"Scenario 3 failed risk score validation (got {res3.risk_score})"
        print("SCENARIO 3 PASSED")
    except AssertionError as e:
        print(f"SCENARIO 3 FAILED ASSERTION: {e}")
        failed = True

    # Clean up Scenario 3
    await clean_database()

    # 4. SCENARIO 4: Return Fraud Cluster
    await seed_scenario_4()
    res4 = await service.check_fraud(FraudCheckRequest(customer_id="C400"))
    print("\n--- SCENARIO 4 RESULT ---")
    print(f"Decision: {res4.decision} (Expected: manual_review)")
    print(f"Risk Score: {res4.risk_score} (Expected: 0.65 - 0.75)")
    print(f"Reasoning: {res4.reasoning}")
    print(f"Graph Evidence: {res4.graph_evidence}")
    try:
        assert res4.decision == "manual_review", f"Scenario 4 failed decision validation (got {res4.decision})"
        assert 0.65 <= res4.risk_score <= 0.75, f"Scenario 4 failed risk score validation (got {res4.risk_score})"
        print("SCENARIO 4 PASSED")
    except AssertionError as e:
        print(f"SCENARIO 4 FAILED ASSERTION: {e}")
        failed = True

    # Clean up Scenario 4
    await clean_database()

    # 5. SCENARIO 5: Fraud Ring (Worst Case)
    await seed_scenario_5()
    res5 = await service.check_fraud(FraudCheckRequest(customer_id="C500"))
    print("\n--- SCENARIO 5 RESULT ---")
    print(f"Decision: {res5.decision} (Expected: deny)")
    print(f"Risk Score: {res5.risk_score} (Expected: 0.90 - 1.00)")
    print(f"Confidence: {res5.confidence} (Expected: High)")
    print(f"Reasoning: {res5.reasoning}")
    print(f"Graph Evidence: {res5.graph_evidence}")
    try:
        assert res5.decision == "deny", "Scenario 5 failed decision validation"
        assert 0.90 <= res5.risk_score <= 1.00, f"Scenario 5 failed risk score validation (got {res5.risk_score})"
        has_sa = any("shares address" in ev.lower() for ev in res5.graph_evidence)
        has_sp = any("shares payment" in ev.lower() for ev in res5.graph_evidence)
        assert has_sa and has_sp, "Scenario 5 missing expected shared address or payment graph evidence"
        print("SCENARIO 5 PASSED")
    except AssertionError as e:
        print(f"SCENARIO 5 FAILED ASSERTION: {e}")
        failed = True

    # Clean up Scenario 5
    await clean_database()

    # 7. SCENARIO 7: Email Laundering Coupon Ring
    await seed_scenario_7()
    res7 = await service.check_fraud(FraudCheckRequest(customer_id="C701"))
    print("\n--- SCENARIO 7 RESULT ---")
    print(f"Decision: {res7.decision} (Expected: manual_review or deny)")
    print(f"Risk Score: {res7.risk_score} (Expected: elevated >= 0.20)")
    print(f"Reasoning: {res7.reasoning}")
    print(f"Graph Evidence: {res7.graph_evidence}")
    try:
        assert res7.decision in ["manual_review", "deny"], f"Scenario 7 failed decision validation (got {res7.decision})"
        assert res7.risk_score >= 0.20, f"Scenario 7 risk score expected elevated, got {res7.risk_score}"
        assert any("shares email" in ev.lower() for ev in res7.graph_evidence), "Scenario 7 missing expected shared email graph evidence"
        print("SCENARIO 7 PASSED")
    except AssertionError as e:
        print(f"SCENARIO 7 FAILED ASSERTION: {e}")
        failed = True

    # Clean up Scenario 7
    await clean_database()

    # 6. BONUS SCENARIO: Empty Customer (Anti-Hallucination)
    await seed_bonus_scenario()
    res_b = await service.check_fraud(FraudCheckRequest(customer_id="C999"))
    print("\n--- BONUS SCENARIO RESULT ---")
    print(f"Decision: {res_b.decision} (Expected: approve)")
    print(f"Risk Score: {res_b.risk_score} (Expected: Low/Close to 0.0)")
    print(f"Confidence: {res_b.confidence} (Expected: <= 0.20)")
    print(f"Reasoning: {res_b.reasoning}")
    print(f"Graph Evidence: {res_b.graph_evidence}")
    try:
        assert res_b.decision == "approve", "Bonus Scenario failed decision validation"
        assert res_b.confidence <= 0.20, f"Bonus Scenario failed anti-hallucination validation: confidence is {res_b.confidence} (> 0.20)"
        print("BONUS SCENARIO PASSED")
    except AssertionError as e:
        print(f"BONUS SCENARIO FAILED ASSERTION: {e}")
        failed = True

    # Final cleanup
    await clean_database()

    if failed:
        print("\nSome scenarios failed testing. Please check the logs above.")
        sys.exit(1)
    else:
        print("\nAll scenarios successfully passed verification!")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(run_scenario_tests())
