import asyncio
import os
import sys

# Add the parent directory of backend/app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_manager


async def clean_database():
    print("Cleaning up any existing scenario test nodes...")
    cleanup_queries = [
        "MATCH (c:Customer) WHERE c.customerId IN ['C100', 'C200', 'C201', 'C300', 'C400', 'C500', 'C501', 'C502', 'C600', 'C601', 'C602', 'C701', 'C702', 'C703', 'C704', 'C705', 'C706', 'C999'] DETACH DELETE c;",
        "MATCH (o:Order) WHERE o.orderId IN ['O1001', 'O3001', 'O3002', 'O4001', 'O5001', 'O6001', 'O6011', 'O6021', 'O7001', 'O7002', 'O7003', 'O7004', 'O7005', 'O7006', 'O7007', 'O7008'] DETACH DELETE o;",
        "MATCH (addr:Address) WHERE addr.addressId IN ['ADDR100', 'ADDR500', 'ADDR600'] DETACH DELETE addr;",
        "MATCH (pm:PaymentMethod) WHERE pm.paymentMethodId IN ['PM100', 'PM777', 'PM500', 'PM600'] DETACH DELETE pm;",
        "MATCH (coupon:Coupon) WHERE coupon.couponId IN ['COUP-300', 'COUP-500', 'COUP-600', 'COUP-700'] DETACH DELETE coupon;",
        "MATCH (rr:ReturnRequest) WHERE rr.returnRequestId IN ['RET4001', 'RET4002', 'RET6001', 'RET6011', 'RET6021'] DETACH DELETE rr;",
        "MATCH (e:Email) WHERE e.normalizedEmail IN ['alicejohnson@example.com', 'c200@example.com', 'c201@example.com', 'c300@example.com', 'c400@example.com', 'c500@example.com', 'c501@example.com', 'c502@example.com', 'c600@example.com', 'c601@example.com', 'c602@example.com', 'johnsmith@gmail.com', 'c999@example.com'] DETACH DELETE e;",
        "MATCH (ed:EmailDomain) WHERE ed.domainName IN ['example.com', 'gmail.com'] DETACH DELETE ed;"
    ]
    async with neo4j_manager.session() as session:
        for q in cleanup_queries:
            await session.run(q)


async def seed_scenarios():
    queries = [
        # Scenario 1 - Legitimate Customer
        "CREATE (c:Customer {customerId:'C100', fullName:'Alice Johnson', riskScore:0.05, accountStatus:'ACTIVE', email:'alice.johnson@example.com', normalizedEmail:'alicejohnson@example.com'});",
        "CREATE (a:Address {addressId:'ADDR100', addressHash:'ADDR100', city:'Seattle', region:'WA'});",
        "CREATE (p:PaymentMethod {paymentMethodId:'PM100', paymentFingerprint:'PM100', cardBrand:'Visa', last4:'1111'});",
        "MATCH (c:Customer {customerId:'C100'}), (a:Address {addressId:'ADDR100'}) CREATE (c)-[:USES_ADDRESS]->(a);",
        "MATCH (c:Customer {customerId:'C100'}), (p:PaymentMethod {paymentMethodId:'PM100'}) CREATE (c)-[:USES_PAYMENT]->(p);",

        # Scenario 2 - Shared Payment Ring
        "CREATE (c1:Customer {customerId:'C200', riskScore:0.30, email:'c200@example.com', normalizedEmail:'c200@example.com'});",
        "CREATE (c2:Customer {customerId:'C201', riskScore:0.40, email:'c201@example.com', normalizedEmail:'c201@example.com'});",
        "CREATE (pm:PaymentMethod {paymentMethodId:'PM777', paymentFingerprint:'PM777', cardBrand:'Mastercard', last4:'7777'});",
        "MATCH (c1:Customer {customerId:'C200'}), (pm:PaymentMethod {paymentMethodId:'PM777'}) CREATE (c1)-[:USES_PAYMENT]->(pm);",
        "MATCH (c2:Customer {customerId:'C201'}), (pm:PaymentMethod {paymentMethodId:'PM777'}) CREATE (c2)-[:USES_PAYMENT]->(pm);",
        "MATCH (c1:Customer {customerId:'C200'}), (c2:Customer {customerId:'C201'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.90}]->(c2);",
        "MATCH (c1:Customer {customerId:'C200'}), (c2:Customer {customerId:'C201'}) CREATE (c2)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.90}]->(c1);",

        # Scenario 3 - Coupon Abuse
        "CREATE (c:Customer {customerId:'C300', riskScore:0.55, email:'c300@example.com', normalizedEmail:'c300@example.com'});",
        "CREATE (coupon:Coupon {couponId:'COUP-300', code:'SAVE90', campaignId:'CMP-ABUSE-001', isActive: true});",
        "CREATE (o1:Order {orderId:'O3001', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "CREATE (o2:Order {orderId:'O3002', fraudStatus:'SUSPICIOUS', placedAt: datetime()});",
        "MATCH (c:Customer {customerId:'C300'}), (o1:Order {orderId:'O3001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o1);",
        "MATCH (c:Customer {customerId:'C300'}), (o2:Order {orderId:'O3002'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o2);",
        "MATCH (o1:Order {orderId:'O3001'}), (coupon:Coupon {couponId:'COUP-300'}) CREATE (o1)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o2:Order {orderId:'O3002'}), (coupon:Coupon {couponId:'COUP-300'}) CREATE (o2)-[:USED {createdAt: datetime()}]->(coupon);",

        # Scenario 4 - Return Fraud
        "CREATE (c:Customer {customerId:'C400', riskScore:0.60, email:'c400@example.com', normalizedEmail:'c400@example.com'});",
        "CREATE (o:Order {orderId:'O4001', placedAt: datetime()});",
        "CREATE (rr1:ReturnRequest {returnRequestId:'RET4001', returnStatus:'REJECTED', refundAmount:500.0});",
        "CREATE (rr2:ReturnRequest {returnRequestId:'RET4002', returnStatus:'MANUAL_REVIEW', refundAmount:700.0});",
        "MATCH (c:Customer {customerId:'C400'}), (o:Order {orderId:'O4001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (o:Order {orderId:'O4001'}), (rr1:ReturnRequest {returnRequestId:'RET4001'}) CREATE (o)-[:RETURNED {createdAt: datetime()}]->(rr1);",
        "MATCH (o:Order {orderId:'O4001'}), (rr2:ReturnRequest {returnRequestId:'RET4002'}) CREATE (o)-[:RETURNED {createdAt: datetime()}]->(rr2);",

        # Scenario 5 - Fraud Ring
        "CREATE (c500:Customer {customerId:'C500', fullName:'Fraud Ring Leader', riskScore:0.95, accountStatus:'ACTIVE', email:'c500@example.com', normalizedEmail:'c500@example.com'});",
        "CREATE (c501:Customer {customerId:'C501', riskScore:0.90, email:'c501@example.com', normalizedEmail:'c501@example.com'});",
        "CREATE (c502:Customer {customerId:'C502', riskScore:0.88, email:'c502@example.com', normalizedEmail:'c502@example.com'});",
        "CREATE (pm:PaymentMethod {paymentMethodId:'PM500', paymentFingerprint:'PM500', cardBrand:'Visa', last4:'5000'});",
        "CREATE (addr:Address {addressId:'ADDR500', addressHash:'ADDR500', city:'Miami', region:'FL'});",
        "MATCH (c1:Customer {customerId:'C500'}), (pm:PaymentMethod {paymentMethodId:'PM500'}) CREATE (c1)-[:USES_PAYMENT]->(pm);",
        "MATCH (c2:Customer {customerId:'C501'}), (pm:PaymentMethod {paymentMethodId:'PM500'}) CREATE (c2)-[:USES_PAYMENT]->(pm);",
        "MATCH (c3:Customer {customerId:'C502'}), (pm:PaymentMethod {paymentMethodId:'PM500'}) CREATE (c3)-[:USES_PAYMENT]->(pm);",
        "MATCH (c1:Customer {customerId:'C500'}), (addr:Address {addressId:'ADDR500'}) CREATE (c1)-[:USES_ADDRESS]->(addr);",
        "MATCH (c2:Customer {customerId:'C501'}), (addr:Address {addressId:'ADDR500'}) CREATE (c2)-[:USES_ADDRESS]->(addr);",
        "MATCH (c3:Customer {customerId:'C502'}), (addr:Address {addressId:'ADDR500'}) CREATE (c3)-[:USES_ADDRESS]->(addr);",
        "MATCH (c1:Customer {customerId:'C500'}), (c2:Customer {customerId:'C501'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.95}]->(c2);",
        "MATCH (c1:Customer {customerId:'C500'}), (c3:Customer {customerId:'C502'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.95}]->(c3);",
        "MATCH (c1:Customer {customerId:'C500'}), (c2:Customer {customerId:'C501'}) CREATE (c1)-[:SHARES_ADDRESS_WITH {createdAt: datetime(), score: 0.95}]->(c2);",
        "MATCH (c1:Customer {customerId:'C500'}), (c3:Customer {customerId:'C502'}) CREATE (c1)-[:SHARES_ADDRESS_WITH {createdAt: datetime(), score: 0.95}]->(c3);",

        # Bonus Scenario 6 - Return and Coupon Laundering
        "CREATE (c600:Customer {customerId:'C600', fullName:'Bonus Fraud Ring Leader', riskScore:0.90, email:'c600@example.com', normalizedEmail:'c600@example.com', accountStatus:'ACTIVE'});",
        "CREATE (c601:Customer {customerId:'C601', fullName:'Laundering Account 1', riskScore:0.85, email:'c601@example.com', normalizedEmail:'c601@example.com', accountStatus:'ACTIVE'});",
        "CREATE (c602:Customer {customerId:'C602', fullName:'Laundering Account 2', riskScore:0.82, email:'c602@example.com', normalizedEmail:'c602@example.com', accountStatus:'ACTIVE'});",
        "CREATE (pm600:PaymentMethod {paymentMethodId:'PM600', paymentFingerprint:'PM600', cardBrand:'Amex', last4:'6000'});",
        "CREATE (addr600:Address {addressId:'ADDR600', addressHash:'ADDR600', city:'Chicago', region:'IL'});",
        "MATCH (c1:Customer {customerId:'C600'}), (pm:PaymentMethod {paymentMethodId:'PM600'}) CREATE (c1)-[:USES_PAYMENT]->(pm);",
        "MATCH (c2:Customer {customerId:'C601'}), (pm:PaymentMethod {paymentMethodId:'PM600'}) CREATE (c2)-[:USES_PAYMENT]->(pm);",
        "MATCH (c3:Customer {customerId:'C602'}), (pm:PaymentMethod {paymentMethodId:'PM600'}) CREATE (c3)-[:USES_PAYMENT]->(pm);",
        "MATCH (c1:Customer {customerId:'C600'}), (addr:Address {addressId:'ADDR600'}) CREATE (c1)-[:USES_ADDRESS]->(addr);",
        "MATCH (c2:Customer {customerId:'C601'}), (addr:Address {addressId:'ADDR600'}) CREATE (c2)-[:USES_ADDRESS]->(addr);",
        "MATCH (c3:Customer {customerId:'C602'}), (addr:Address {addressId:'ADDR600'}) CREATE (c3)-[:USES_ADDRESS]->(addr);",
        "MATCH (c1:Customer {customerId:'C600'}), (c2:Customer {customerId:'C601'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.95}]->(c2);",
        "MATCH (c1:Customer {customerId:'C600'}), (c3:Customer {customerId:'C602'}) CREATE (c1)-[:SHARES_PAYMENT_WITH {createdAt: datetime(), score: 0.95}]->(c3);",
        "MATCH (c1:Customer {customerId:'C600'}), (c2:Customer {customerId:'C601'}) CREATE (c1)-[:SHARES_ADDRESS_WITH {createdAt: datetime(), score: 0.95}]->(c2);",
        "MATCH (c1:Customer {customerId:'C600'}), (c3:Customer {customerId:'C602'}) CREATE (c1)-[:SHARES_ADDRESS_WITH {createdAt: datetime(), score: 0.95}]->(c3);",
        "CREATE (coupon600:Coupon {couponId:'COUP-600', code:'LAUNDER90', campaignId:'CMP-ABUSE-LAUNDER', isActive: true});",
        "CREATE (o600:Order {orderId:'O6001', placedAt: datetime(), totalAmount: 250.0});",
        "CREATE (o601:Order {orderId:'O6011', placedAt: datetime(), totalAmount: 250.0});",
        "CREATE (o602:Order {orderId:'O6021', placedAt: datetime(), totalAmount: 250.0});",
        "MATCH (c:Customer {customerId:'C600'}), (o:Order {orderId:'O6001'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C601'}), (o:Order {orderId:'O6011'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (c:Customer {customerId:'C602'}), (o:Order {orderId:'O6021'}) CREATE (c)-[:PLACED {createdAt: datetime(), orderDate: datetime()}]->(o);",
        "MATCH (o:Order {orderId:'O6001'}), (coupon:Coupon {couponId:'COUP-600'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O6011'}), (coupon:Coupon {couponId:'COUP-600'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "MATCH (o:Order {orderId:'O6021'}), (coupon:Coupon {couponId:'COUP-600'}) CREATE (o)-[:USED {createdAt: datetime()}]->(coupon);",
        "CREATE (rr600:ReturnRequest {returnRequestId:'RET6001', returnStatus:'REJECTED', refundAmount: 200.0, reasonCode: 'GIFT_CARD_REFUND'});",
        "CREATE (rr601:ReturnRequest {returnRequestId:'RET6011', returnStatus:'MANUAL_REVIEW', refundAmount: 180.0, reasonCode: 'GIFT_CARD_REFUND'});",
        "CREATE (rr602:ReturnRequest {returnRequestId:'RET6021', returnStatus:'MANUAL_REVIEW', refundAmount: 190.0, reasonCode: 'GIFT_CARD_REFUND'});",
        "MATCH (o:Order {orderId:'O6001'}), (rr:ReturnRequest {returnRequestId:'RET6001'}) CREATE (o)-[:RETURNED {createdAt: datetime()}]->(rr);",
        "MATCH (o:Order {orderId:'O6011'}), (rr:ReturnRequest {returnRequestId:'RET6011'}) CREATE (o)-[:RETURNED {createdAt: datetime()}]->(rr);",
        "MATCH (o:Order {orderId:'O6021'}), (rr:ReturnRequest {returnRequestId:'RET6021'}) CREATE (o)-[:RETURNED {createdAt: datetime()}]->(rr);",

        # Scenario 7 - Coupon Abuse Ring via Email Laundering (Normalized Gmail Matching)
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

    print("Seeding scenarios 1-7 + Bonus Scenario...")
    async with neo4j_manager.session() as session:
        for q in queries:
            await session.run(q)
            
        # Decouple emails dynamically for all seeded customers
        decouple_query = """
        MATCH (c:Customer)
        WHERE c.customerId IN ['C100', 'C200', 'C201', 'C300', 'C400', 'C500', 'C501', 'C502', 'C600', 'C601', 'C602', 'C701', 'C702', 'C703', 'C704', 'C705', 'C706', 'C999']
        WITH c, split(c.email, '@')[1] AS domainName
        MERGE (d:EmailDomain {domainName: domainName})
        MERGE (e:Email {normalizedEmail: c.normalizedEmail})
        ON CREATE SET e.rawEmail = c.email
        MERGE (c)-[:HAS_EMAIL]->(e)
        MERGE (e)-[:BELONGS_TO_DOMAIN]->(d);
        """
        await session.run(decouple_query)
        
    print("Database seeding completed successfully!")


async def main():
    await clean_database()
    await seed_scenarios()
    await neo4j_manager.close()


if __name__ == "__main__":
    asyncio.run(main())
