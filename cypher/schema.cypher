// Neo4j Ecommerce Fraud Detection GraphRAG Schema
// Purpose: production schema for fraud analytics, entity resolution, and retrieval-augmented graph traversals.
// This file is idempotent and safe to rerun.

// -----------------------------------------------------------------------------
// Node Property Contracts
// -----------------------------------------------------------------------------
// Customer {
//   customerId: STRING, email: STRING, normalizedEmail: STRING, phone: STRING,
//   normalizedPhone: STRING, fullName: STRING, accountStatus: STRING,
//   riskScore: FLOAT, loyaltyTier: STRING, deviceFingerprint: STRING,
//   ipAddress: STRING, userAgent: STRING, firstSeenAt: DATETIME,
//   lastSeenAt: DATETIME, createdAt: DATETIME, updatedAt: DATETIME
// }
//
// Order {
//   orderId: STRING, orderNumber: STRING, orderStatus: STRING, fraudStatus: STRING,
//   channel: STRING, currency: STRING, subtotalAmount: FLOAT, discountAmount: FLOAT,
//   taxAmount: FLOAT, shippingAmount: FLOAT, totalAmount: FLOAT, ipAddress: STRING,
//   deviceFingerprint: STRING, placedAt: DATETIME, fulfilledAt: DATETIME,
//   createdAt: DATETIME, updatedAt: DATETIME
// }
//
// Product {
//   productId: STRING, sku: STRING, name: STRING, brand: STRING, sellerId: STRING,
//   productStatus: STRING, unitPrice: FLOAT, currency: STRING, riskScore: FLOAT,
//   description: STRING, descriptionEmbedding: LIST<FLOAT>, createdAt: DATETIME,
//   updatedAt: DATETIME
// }
//
// ReturnRequest {
//   returnRequestId: STRING, returnStatus: STRING, reasonCode: STRING,
//   reasonText: STRING, refundAmount: FLOAT, currency: STRING, requestedAt: DATETIME,
//   resolvedAt: DATETIME, riskScore: FLOAT, createdAt: DATETIME, updatedAt: DATETIME
// }
//
// Coupon {
//   couponId: STRING, code: STRING, campaignId: STRING, campaignName: STRING,
//   discountType: STRING, discountValue: FLOAT, maxRedemptions: INTEGER,
//   validFrom: DATETIME, validUntil: DATETIME, isActive: BOOLEAN,
//   createdAt: DATETIME, updatedAt: DATETIME
// }
//
// Address {
//   addressId: STRING, addressHash: STRING, line1Hash: STRING, city: STRING,
//   region: STRING, postalCode: STRING, countryCode: STRING, latitude: FLOAT,
//   longitude: FLOAT, deliverabilityStatus: STRING, createdAt: DATETIME,
//   updatedAt: DATETIME
// }
//
// PaymentMethod {
//   paymentMethodId: STRING, paymentFingerprint: STRING, paymentType: STRING,
//   provider: STRING, cardBrand: STRING, bin: STRING, last4: STRING,
//   walletProvider: STRING, issuerCountry: STRING, riskScore: FLOAT,
//   createdAt: DATETIME, updatedAt: DATETIME
// }
//
// Category {
//   categoryId: STRING, name: STRING, slug: STRING, path: STRING, level: INTEGER,
//   isActive: BOOLEAN, createdAt: DATETIME, updatedAt: DATETIME
// }

// -----------------------------------------------------------------------------
// Relationship Property Contracts
// -----------------------------------------------------------------------------
// (:Customer)-[:PLACED {
//   createdAt: DATETIME, orderDate: DATETIME, channel: STRING,
//   ipAddress: STRING, deviceFingerprint: STRING
// }]->(:Order)
//
// (:Order)-[:CONTAINS {
//   createdAt: DATETIME, quantity: INTEGER, unitPrice: FLOAT,
//   lineTotal: FLOAT, discountAmount: FLOAT
// }]->(:Product)
//
// (:Order)-[:RETURNED {
//   createdAt: DATETIME, requestedAt: DATETIME, returnStatus: STRING,
//   quantity: INTEGER, refundAmount: FLOAT
// }]->(:ReturnRequest)
//
// (:Order)-[:USED {
//   createdAt: DATETIME, redeemedAt: DATETIME, discountAmount: FLOAT,
//   campaignId: STRING
// }]->(:Coupon)
//
// (:Customer)-[:SHARES_ADDRESS_WITH {
//   createdAt: DATETIME, addressHash: STRING, score: FLOAT,
//   evidenceCount: INTEGER, firstObservedAt: DATETIME, lastObservedAt: DATETIME
// }]->(:Customer)
//
// (:Customer)-[:SHARES_PAYMENT_WITH {
//   createdAt: DATETIME, paymentFingerprint: STRING, score: FLOAT,
//   evidenceCount: INTEGER, firstObservedAt: DATETIME, lastObservedAt: DATETIME
// }]->(:Customer)
//
// (:Product)-[:BELONGS_TO {
//   createdAt: DATETIME, assignedAt: DATETIME, confidence: FLOAT
// }]->(:Category)

// -----------------------------------------------------------------------------
// Core Node Key Constraints
// -----------------------------------------------------------------------------
CREATE LOOKUP INDEX node_label_lookup_idx IF NOT EXISTS
FOR (n)
ON EACH labels(n);

CREATE LOOKUP INDEX relationship_type_lookup_idx IF NOT EXISTS
FOR ()-[r]-()
ON EACH type(r);

CREATE CONSTRAINT customer_id_key IF NOT EXISTS
FOR (c:Customer)
REQUIRE c.customerId IS NODE KEY;

CREATE CONSTRAINT order_id_key IF NOT EXISTS
FOR (o:Order)
REQUIRE o.orderId IS NODE KEY;

CREATE CONSTRAINT product_id_key IF NOT EXISTS
FOR (p:Product)
REQUIRE p.productId IS NODE KEY;

CREATE CONSTRAINT return_request_id_key IF NOT EXISTS
FOR (r:ReturnRequest)
REQUIRE r.returnRequestId IS NODE KEY;

CREATE CONSTRAINT coupon_id_key IF NOT EXISTS
FOR (c:Coupon)
REQUIRE c.couponId IS NODE KEY;

CREATE CONSTRAINT address_id_key IF NOT EXISTS
FOR (a:Address)
REQUIRE a.addressId IS NODE KEY;

CREATE CONSTRAINT payment_method_id_key IF NOT EXISTS
FOR (p:PaymentMethod)
REQUIRE p.paymentMethodId IS NODE KEY;

CREATE CONSTRAINT category_id_key IF NOT EXISTS
FOR (c:Category)
REQUIRE c.categoryId IS NODE KEY;

// -----------------------------------------------------------------------------
// Required Node Properties
// -----------------------------------------------------------------------------
CREATE CONSTRAINT customer_email_required IF NOT EXISTS
FOR (c:Customer)
REQUIRE c.email IS NOT NULL;

CREATE CONSTRAINT order_placed_at_required IF NOT EXISTS
FOR (o:Order)
REQUIRE o.placedAt IS NOT NULL;

CREATE CONSTRAINT product_sku_required IF NOT EXISTS
FOR (p:Product)
REQUIRE p.sku IS NOT NULL;

CREATE CONSTRAINT product_name_required IF NOT EXISTS
FOR (p:Product)
REQUIRE p.name IS NOT NULL;

CREATE CONSTRAINT return_request_status_required IF NOT EXISTS
FOR (r:ReturnRequest)
REQUIRE r.returnStatus IS NOT NULL;

CREATE CONSTRAINT coupon_code_required IF NOT EXISTS
FOR (c:Coupon)
REQUIRE c.code IS NOT NULL;

CREATE CONSTRAINT address_hash_required IF NOT EXISTS
FOR (a:Address)
REQUIRE a.addressHash IS NOT NULL;

CREATE CONSTRAINT payment_fingerprint_required IF NOT EXISTS
FOR (p:PaymentMethod)
REQUIRE p.paymentFingerprint IS NOT NULL;

CREATE CONSTRAINT category_name_required IF NOT EXISTS
FOR (c:Category)
REQUIRE c.name IS NOT NULL;

// -----------------------------------------------------------------------------
// Type Constraints For Stable Ingestion
// -----------------------------------------------------------------------------
CREATE CONSTRAINT customer_risk_score_type IF NOT EXISTS
FOR (c:Customer)
REQUIRE c.riskScore IS :: FLOAT;

CREATE CONSTRAINT order_total_amount_type IF NOT EXISTS
FOR (o:Order)
REQUIRE o.totalAmount IS :: FLOAT;

CREATE CONSTRAINT product_unit_price_type IF NOT EXISTS
FOR (p:Product)
REQUIRE p.unitPrice IS :: FLOAT;

CREATE CONSTRAINT return_refund_amount_type IF NOT EXISTS
FOR (r:ReturnRequest)
REQUIRE r.refundAmount IS :: FLOAT;

CREATE CONSTRAINT coupon_active_type IF NOT EXISTS
FOR (c:Coupon)
REQUIRE c.isActive IS :: BOOLEAN;

CREATE CONSTRAINT category_level_type IF NOT EXISTS
FOR (c:Category)
REQUIRE c.level IS :: INTEGER;

// -----------------------------------------------------------------------------
// Required Relationship Properties
// -----------------------------------------------------------------------------
CREATE CONSTRAINT placed_created_at_required IF NOT EXISTS
FOR ()-[r:PLACED]-()
REQUIRE r.createdAt IS NOT NULL;

CREATE CONSTRAINT placed_order_date_required IF NOT EXISTS
FOR ()-[r:PLACED]-()
REQUIRE r.orderDate IS NOT NULL;

CREATE CONSTRAINT contains_created_at_required IF NOT EXISTS
FOR ()-[r:CONTAINS]-()
REQUIRE r.createdAt IS NOT NULL;

CREATE CONSTRAINT contains_quantity_required IF NOT EXISTS
FOR ()-[r:CONTAINS]-()
REQUIRE r.quantity IS NOT NULL;

CREATE CONSTRAINT returned_created_at_required IF NOT EXISTS
FOR ()-[r:RETURNED]-()
REQUIRE r.createdAt IS NOT NULL;

CREATE CONSTRAINT used_created_at_required IF NOT EXISTS
FOR ()-[r:USED]-()
REQUIRE r.createdAt IS NOT NULL;

CREATE CONSTRAINT shares_address_created_at_required IF NOT EXISTS
FOR ()-[r:SHARES_ADDRESS_WITH]-()
REQUIRE r.createdAt IS NOT NULL;

CREATE CONSTRAINT shares_address_score_required IF NOT EXISTS
FOR ()-[r:SHARES_ADDRESS_WITH]-()
REQUIRE r.score IS NOT NULL;

CREATE CONSTRAINT shares_payment_created_at_required IF NOT EXISTS
FOR ()-[r:SHARES_PAYMENT_WITH]-()
REQUIRE r.createdAt IS NOT NULL;

CREATE CONSTRAINT shares_payment_score_required IF NOT EXISTS
FOR ()-[r:SHARES_PAYMENT_WITH]-()
REQUIRE r.score IS NOT NULL;

CREATE CONSTRAINT belongs_to_created_at_required IF NOT EXISTS
FOR ()-[r:BELONGS_TO]-()
REQUIRE r.createdAt IS NOT NULL;

// -----------------------------------------------------------------------------
// Customer Risk Pivot Indexes
// -----------------------------------------------------------------------------
CREATE INDEX customer_email_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.email);

CREATE INDEX customer_normalized_email_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.normalizedEmail);

CREATE INDEX customer_phone_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.normalizedPhone);

CREATE INDEX customer_device_fingerprint_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.deviceFingerprint);

CREATE INDEX customer_ip_address_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.ipAddress);

CREATE INDEX customer_status_risk_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.accountStatus, c.riskScore);

CREATE INDEX customer_seen_at_idx IF NOT EXISTS
FOR (c:Customer)
ON (c.firstSeenAt, c.lastSeenAt);

// -----------------------------------------------------------------------------
// Order Traversal And Time-Series Indexes
// -----------------------------------------------------------------------------
CREATE INDEX order_number_idx IF NOT EXISTS
FOR (o:Order)
ON (o.orderNumber);

CREATE INDEX order_placed_at_idx IF NOT EXISTS
FOR (o:Order)
ON (o.placedAt);

CREATE INDEX order_status_idx IF NOT EXISTS
FOR (o:Order)
ON (o.orderStatus);

CREATE INDEX order_fraud_status_idx IF NOT EXISTS
FOR (o:Order)
ON (o.fraudStatus);

CREATE INDEX order_channel_idx IF NOT EXISTS
FOR (o:Order)
ON (o.channel);

CREATE INDEX order_amount_idx IF NOT EXISTS
FOR (o:Order)
ON (o.totalAmount);

CREATE INDEX order_device_ip_idx IF NOT EXISTS
FOR (o:Order)
ON (o.deviceFingerprint, o.ipAddress);

// -----------------------------------------------------------------------------
// Product And Category Retrieval Indexes
// -----------------------------------------------------------------------------
CREATE INDEX product_sku_idx IF NOT EXISTS
FOR (p:Product)
ON (p.sku);

CREATE INDEX product_brand_idx IF NOT EXISTS
FOR (p:Product)
ON (p.brand);

CREATE INDEX product_seller_idx IF NOT EXISTS
FOR (p:Product)
ON (p.sellerId);

CREATE INDEX product_status_risk_idx IF NOT EXISTS
FOR (p:Product)
ON (p.productStatus, p.riskScore);

CREATE INDEX category_name_idx IF NOT EXISTS
FOR (c:Category)
ON (c.name);

CREATE INDEX category_slug_idx IF NOT EXISTS
FOR (c:Category)
ON (c.slug);

CREATE INDEX category_path_idx IF NOT EXISTS
FOR (c:Category)
ON (c.path);

CREATE INDEX category_level_idx IF NOT EXISTS
FOR (c:Category)
ON (c.level);

// -----------------------------------------------------------------------------
// Return, Coupon, Address, And Payment Indexes
// -----------------------------------------------------------------------------
CREATE INDEX return_status_idx IF NOT EXISTS
FOR (r:ReturnRequest)
ON (r.returnStatus);

CREATE INDEX return_reason_idx IF NOT EXISTS
FOR (r:ReturnRequest)
ON (r.reasonCode);

CREATE INDEX return_requested_at_idx IF NOT EXISTS
FOR (r:ReturnRequest)
ON (r.requestedAt);

CREATE INDEX return_risk_score_idx IF NOT EXISTS
FOR (r:ReturnRequest)
ON (r.riskScore);

CREATE INDEX coupon_code_idx IF NOT EXISTS
FOR (c:Coupon)
ON (c.code);

CREATE INDEX coupon_campaign_idx IF NOT EXISTS
FOR (c:Coupon)
ON (c.campaignId);

CREATE INDEX coupon_active_window_idx IF NOT EXISTS
FOR (c:Coupon)
ON (c.isActive, c.validFrom, c.validUntil);

CREATE INDEX address_hash_idx IF NOT EXISTS
FOR (a:Address)
ON (a.addressHash);

CREATE INDEX address_postal_country_idx IF NOT EXISTS
FOR (a:Address)
ON (a.postalCode, a.countryCode);

CREATE INDEX address_city_region_country_idx IF NOT EXISTS
FOR (a:Address)
ON (a.city, a.region, a.countryCode);

CREATE INDEX payment_fingerprint_idx IF NOT EXISTS
FOR (p:PaymentMethod)
ON (p.paymentFingerprint);

CREATE INDEX payment_bin_last4_idx IF NOT EXISTS
FOR (p:PaymentMethod)
ON (p.bin, p.last4);

CREATE INDEX payment_provider_type_idx IF NOT EXISTS
FOR (p:PaymentMethod)
ON (p.provider, p.paymentType);

CREATE INDEX payment_issuer_country_idx IF NOT EXISTS
FOR (p:PaymentMethod)
ON (p.issuerCountry);

// -----------------------------------------------------------------------------
// Relationship Traversal Indexes
// -----------------------------------------------------------------------------
CREATE INDEX placed_order_date_idx IF NOT EXISTS
FOR ()-[r:PLACED]-()
ON (r.orderDate);

CREATE INDEX placed_created_at_idx IF NOT EXISTS
FOR ()-[r:PLACED]-()
ON (r.createdAt);

CREATE INDEX contains_quantity_idx IF NOT EXISTS
FOR ()-[r:CONTAINS]-()
ON (r.quantity);

CREATE INDEX contains_line_total_idx IF NOT EXISTS
FOR ()-[r:CONTAINS]-()
ON (r.lineTotal);

CREATE INDEX returned_requested_at_idx IF NOT EXISTS
FOR ()-[r:RETURNED]-()
ON (r.requestedAt);

CREATE INDEX returned_status_idx IF NOT EXISTS
FOR ()-[r:RETURNED]-()
ON (r.returnStatus);

CREATE INDEX used_redeemed_at_idx IF NOT EXISTS
FOR ()-[r:USED]-()
ON (r.redeemedAt);

CREATE INDEX used_discount_amount_idx IF NOT EXISTS
FOR ()-[r:USED]-()
ON (r.discountAmount);

CREATE INDEX shares_address_score_idx IF NOT EXISTS
FOR ()-[r:SHARES_ADDRESS_WITH]-()
ON (r.score);

CREATE INDEX shares_address_hash_idx IF NOT EXISTS
FOR ()-[r:SHARES_ADDRESS_WITH]-()
ON (r.addressHash);

CREATE INDEX shares_payment_score_idx IF NOT EXISTS
FOR ()-[r:SHARES_PAYMENT_WITH]-()
ON (r.score);

CREATE INDEX shares_payment_fingerprint_idx IF NOT EXISTS
FOR ()-[r:SHARES_PAYMENT_WITH]-()
ON (r.paymentFingerprint);

CREATE INDEX belongs_to_confidence_idx IF NOT EXISTS
FOR ()-[r:BELONGS_TO]-()
ON (r.confidence);

// -----------------------------------------------------------------------------
// Full-Text And Vector Indexes For GraphRAG Retrieval
// -----------------------------------------------------------------------------
CREATE FULLTEXT INDEX customer_identity_fulltext_idx IF NOT EXISTS
FOR (c:Customer)
ON EACH [c.email, c.normalizedEmail, c.phone, c.fullName];

CREATE FULLTEXT INDEX product_catalog_fulltext_idx IF NOT EXISTS
FOR (p:Product)
ON EACH [p.sku, p.name, p.brand, p.description];

CREATE FULLTEXT INDEX return_reason_fulltext_idx IF NOT EXISTS
FOR (r:ReturnRequest)
ON EACH [r.reasonCode, r.reasonText, r.returnStatus];

CREATE FULLTEXT INDEX category_fulltext_idx IF NOT EXISTS
FOR (c:Category)
ON EACH [c.name, c.slug, c.path];

CREATE VECTOR INDEX product_description_embedding_idx IF NOT EXISTS
FOR (p:Product)
ON (p.descriptionEmbedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
};
