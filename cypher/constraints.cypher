CREATE CONSTRAINT customer_id_unique
IF NOT EXISTS
FOR (c:Customer)
REQUIRE c.customerId IS UNIQUE;

CREATE CONSTRAINT order_id_unique
IF NOT EXISTS
FOR (o:Order)
REQUIRE o.orderId IS UNIQUE;

CREATE CONSTRAINT product_id_unique
IF NOT EXISTS
FOR (p:Product)
REQUIRE p.productId IS UNIQUE;

// Phase A Indexes
CREATE INDEX payment_fingerprint_idx IF NOT EXISTS
FOR (p:PaymentMethod)
ON (p.paymentFingerprint);

CREATE INDEX address_hash_idx IF NOT EXISTS
FOR (a:Address)
ON (a.addressHash);

// Phase B Constraints
CREATE CONSTRAINT email_unique IF NOT EXISTS
FOR (e:Email)
REQUIRE e.normalizedEmail IS UNIQUE;

CREATE CONSTRAINT email_domain_unique IF NOT EXISTS
FOR (ed:EmailDomain)
REQUIRE ed.domainName IS UNIQUE;
