// Neo4j Ecommerce Fraud Detection GraphRAG Seed Data
// Exact core volumes:
// - 50 Customer nodes
// - 200 Order nodes
// - 80 Product nodes
//
// The data intentionally contains:
// - high-risk customer clusters connected by shared addresses and payment fingerprints
// - coupon abuse campaigns and repeated discount redemption
// - suspicious returns concentrated around a small set of customers and categories
// - rich product/category text for GraphRAG retrieval and recommendation examples
//
// Load after schema.cypher. This script uses CREATE statements only for writes.

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------
WITH [
  {name: 'Consumer Electronics', slug: 'consumer-electronics', path: 'Retail > Consumer Electronics', level: 2},
  {name: 'Mobile Phones', slug: 'mobile-phones', path: 'Retail > Consumer Electronics > Mobile Phones', level: 3},
  {name: 'Laptops', slug: 'laptops', path: 'Retail > Consumer Electronics > Laptops', level: 3},
  {name: 'Gaming', slug: 'gaming', path: 'Retail > Consumer Electronics > Gaming', level: 3},
  {name: 'Luxury Fashion', slug: 'luxury-fashion', path: 'Retail > Fashion > Luxury Fashion', level: 3},
  {name: 'Footwear', slug: 'footwear', path: 'Retail > Fashion > Footwear', level: 3},
  {name: 'Home Appliances', slug: 'home-appliances', path: 'Retail > Home > Appliances', level: 3},
  {name: 'Beauty', slug: 'beauty', path: 'Retail > Personal Care > Beauty', level: 3},
  {name: 'Sports Gear', slug: 'sports-gear', path: 'Retail > Sports > Gear', level: 3},
  {name: 'Gift Cards', slug: 'gift-cards', path: 'Retail > Digital > Gift Cards', level: 3}
] AS categories
UNWIND range(0, size(categories) - 1) AS idx
CREATE (:Category {
  categoryId: 'CAT-' + right('00' + toString(idx + 1), 2),
  name: categories[idx].name,
  slug: categories[idx].slug,
  path: categories[idx].path,
  level: categories[idx].level,
  isActive: true,
  createdAt: datetime('2026-01-01T00:00:00Z'),
  updatedAt: datetime('2026-05-01T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Products: 80 products across fraud-prone and ordinary categories
// -----------------------------------------------------------------------------
UNWIND range(1, 80) AS i
WITH i,
  CASE
    WHEN i <= 12 THEN 'CAT-02'
    WHEN i <= 24 THEN 'CAT-03'
    WHEN i <= 34 THEN 'CAT-04'
    WHEN i <= 46 THEN 'CAT-05'
    WHEN i <= 56 THEN 'CAT-06'
    WHEN i <= 64 THEN 'CAT-07'
    WHEN i <= 70 THEN 'CAT-08'
    WHEN i <= 76 THEN 'CAT-09'
    ELSE 'CAT-10'
  END AS categoryId,
  CASE
    WHEN i <= 12 THEN 'Smartphone'
    WHEN i <= 24 THEN 'Laptop'
    WHEN i <= 34 THEN 'Gaming Console'
    WHEN i <= 46 THEN 'Designer Item'
    WHEN i <= 56 THEN 'Premium Sneaker'
    WHEN i <= 64 THEN 'Appliance'
    WHEN i <= 70 THEN 'Beauty Kit'
    WHEN i <= 76 THEN 'Training Gear'
    ELSE 'Digital Gift Card'
  END AS productFamily
MATCH (cat:Category {categoryId: categoryId})
CREATE (p:Product {
  productId: 'PROD-' + right('000' + toString(i), 3),
  sku: 'SKU-' + categoryId + '-' + right('000' + toString(i), 3),
  name: productFamily + ' ' + toString(i),
  brand: CASE
    WHEN i % 7 = 0 THEN 'Northline'
    WHEN i % 7 = 1 THEN 'Aster'
    WHEN i % 7 = 2 THEN 'VoltEdge'
    WHEN i % 7 = 3 THEN 'UrbanMint'
    WHEN i % 7 = 4 THEN 'Monarch'
    WHEN i % 7 = 5 THEN 'Kairo'
    ELSE 'EverydayCo'
  END,
  sellerId: CASE WHEN i IN [5, 11, 19, 27, 41, 58, 79] THEN 'SELLER-RISK-09' ELSE 'SELLER-' + right('00' + toString((i % 15) + 1), 2) END,
  productStatus: 'ACTIVE',
  unitPrice: toFloat(CASE
    WHEN i <= 24 THEN 499 + (i * 37)
    WHEN i <= 46 THEN 249 + (i * 19)
    WHEN i <= 56 THEN 129 + (i * 8)
    WHEN i <= 76 THEN 39 + (i * 4)
    ELSE 50 + (i * 10)
  END),
  currency: 'USD',
  riskScore: CASE WHEN i IN [5, 11, 19, 27, 41, 58, 79] THEN 0.91 ELSE toFloat((i % 35) + 5) / 100.0 END,
  description: productFamily + ' for ecommerce recommendation and fraud retrieval. Includes brand, category, seller, return behavior, coupon sensitivity, and high value resale signals.',
  createdAt: datetime('2026-01-05T00:00:00Z') + duration({days: i}),
  updatedAt: datetime('2026-05-05T00:00:00Z')
})
CREATE (p)-[:BELONGS_TO {
  createdAt: datetime('2026-01-05T00:00:00Z') + duration({days: i}),
  assignedAt: datetime('2026-01-05T00:00:00Z') + duration({days: i}),
  confidence: 0.99
}]->(cat);

// -----------------------------------------------------------------------------
// Coupons: abuse campaigns plus normal promotions
// -----------------------------------------------------------------------------
WITH [
  {id: 'COUP-ABUSE-01', code: 'WELCOME50', campaignId: 'CMP-ABUSE-WELCOME', campaignName: 'Welcome Offer Exploit', discountType: 'PERCENT', discountValue: 50.0, maxRedemptions: 500, active: true},
  {id: 'COUP-ABUSE-02', code: 'RETURNS25', campaignId: 'CMP-RETURN-LOOP', campaignName: 'Return Loop Promo', discountType: 'PERCENT', discountValue: 25.0, maxRedemptions: 300, active: true},
  {id: 'COUP-ABUSE-03', code: 'GIFT100', campaignId: 'CMP-GIFTCARD-RISK', campaignName: 'Gift Card Abuse', discountType: 'FIXED', discountValue: 100.0, maxRedemptions: 100, active: true},
  {id: 'COUP-ABUSE-04', code: 'FLASH70', campaignId: 'CMP-FLASH-RISK', campaignName: 'Flash Sale Risk', discountType: 'PERCENT', discountValue: 70.0, maxRedemptions: 200, active: true},
  {id: 'COUP-NORM-01', code: 'SAVE10', campaignId: 'CMP-SEASONAL', campaignName: 'Seasonal Save', discountType: 'PERCENT', discountValue: 10.0, maxRedemptions: 5000, active: true},
  {id: 'COUP-NORM-02', code: 'FREESHIP', campaignId: 'CMP-SHIPPING', campaignName: 'Free Shipping', discountType: 'FIXED', discountValue: 8.0, maxRedemptions: 8000, active: true},
  {id: 'COUP-NORM-03', code: 'LOYAL15', campaignId: 'CMP-LOYALTY', campaignName: 'Loyalty Reward', discountType: 'PERCENT', discountValue: 15.0, maxRedemptions: 2000, active: true},
  {id: 'COUP-NORM-04', code: 'BEAUTY20', campaignId: 'CMP-BEAUTY', campaignName: 'Beauty Bundle', discountType: 'PERCENT', discountValue: 20.0, maxRedemptions: 1500, active: true},
  {id: 'COUP-NORM-05', code: 'HOME30', campaignId: 'CMP-HOME', campaignName: 'Home Upgrade', discountType: 'FIXED', discountValue: 30.0, maxRedemptions: 1200, active: true},
  {id: 'COUP-NORM-06', code: 'SPORT12', campaignId: 'CMP-SPORT', campaignName: 'Sports Deal', discountType: 'PERCENT', discountValue: 12.0, maxRedemptions: 2500, active: true},
  {id: 'COUP-NORM-07', code: 'LAPTOP75', campaignId: 'CMP-LAPTOP', campaignName: 'Laptop Upgrade', discountType: 'FIXED', discountValue: 75.0, maxRedemptions: 900, active: true},
  {id: 'COUP-NORM-08', code: 'STYLE18', campaignId: 'CMP-FASHION', campaignName: 'Style Event', discountType: 'PERCENT', discountValue: 18.0, maxRedemptions: 1800, active: true}
] AS coupons
UNWIND coupons AS coupon
CREATE (:Coupon {
  couponId: coupon.id,
  code: coupon.code,
  campaignId: coupon.campaignId,
  campaignName: coupon.campaignName,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  maxRedemptions: coupon.maxRedemptions,
  validFrom: datetime('2026-01-01T00:00:00Z'),
  validUntil: datetime('2026-12-31T23:59:59Z'),
  isActive: coupon.active,
  createdAt: datetime('2025-12-01T00:00:00Z'),
  updatedAt: datetime('2026-05-01T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Addresses: 40 physical addresses with several deliberately shared clusters
// -----------------------------------------------------------------------------
UNWIND range(1, 40) AS i
CREATE (:Address {
  addressId: 'ADDR-' + right('000' + toString(i), 3),
  addressHash: CASE
    WHEN i IN [1, 2, 3] THEN 'ADDR-HASH-FRAUD-RING-A'
    WHEN i IN [4, 5] THEN 'ADDR-HASH-RETURN-HUB-B'
    WHEN i IN [6, 7] THEN 'ADDR-HASH-COUPON-FARM-C'
    ELSE 'ADDR-HASH-' + right('000' + toString(i), 3)
  END,
  line1Hash: 'LINE1-HASH-' + right('000' + toString(i), 3),
  city: CASE WHEN i % 5 = 0 THEN 'Austin' WHEN i % 5 = 1 THEN 'Chicago' WHEN i % 5 = 2 THEN 'Seattle' WHEN i % 5 = 3 THEN 'Miami' ELSE 'Phoenix' END,
  region: CASE WHEN i % 5 = 0 THEN 'TX' WHEN i % 5 = 1 THEN 'IL' WHEN i % 5 = 2 THEN 'WA' WHEN i % 5 = 3 THEN 'FL' ELSE 'AZ' END,
  postalCode: CASE WHEN i <= 7 THEN '900' + right('00' + toString(i), 2) ELSE '7' + right('0000' + toString(1000 + i), 4) END,
  countryCode: 'US',
  latitude: 30.0 + toFloat(i) / 10.0,
  longitude: -97.0 - toFloat(i) / 10.0,
  deliverabilityStatus: CASE WHEN i IN [1, 4, 6] THEN 'RISK_REVIEW' ELSE 'DELIVERABLE' END,
  createdAt: datetime('2026-01-01T00:00:00Z') + duration({days: i}),
  updatedAt: datetime('2026-05-01T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Payment methods: 30 methods with linked-card and wallet clusters
// -----------------------------------------------------------------------------
UNWIND range(1, 30) AS i
CREATE (:PaymentMethod {
  paymentMethodId: 'PM-' + right('000' + toString(i), 3),
  paymentFingerprint: CASE
    WHEN i IN [1, 2, 3, 4] THEN 'PAY-FP-FRAUD-RING-A'
    WHEN i IN [5, 6, 7] THEN 'PAY-FP-COUPON-FARM-C'
    WHEN i IN [8, 9] THEN 'PAY-FP-RETURN-LOOP-B'
    ELSE 'PAY-FP-' + right('000' + toString(i), 3)
  END,
  paymentType: CASE WHEN i % 4 = 0 THEN 'WALLET' ELSE 'CARD' END,
  provider: CASE WHEN i % 4 = 0 THEN 'PayLink' WHEN i % 3 = 0 THEN 'Stripe' ELSE 'Adyen' END,
  cardBrand: CASE WHEN i % 3 = 0 THEN 'MASTERCARD' ELSE 'VISA' END,
  bin: CASE WHEN i <= 9 THEN '411111' ELSE '52' + right('0000' + toString(7000 + i), 4) END,
  last4: right('0000' + toString(1000 + i), 4),
  walletProvider: CASE WHEN i % 4 = 0 THEN 'QuickWallet' ELSE null END,
  issuerCountry: CASE WHEN i IN [3, 6, 9] THEN 'GB' ELSE 'US' END,
  riskScore: CASE WHEN i <= 9 THEN 0.88 ELSE toFloat((i % 20) + 10) / 100.0 END,
  createdAt: datetime('2026-01-01T00:00:00Z') + duration({days: i}),
  updatedAt: datetime('2026-05-01T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Customers: 50 total, with risk clusters for fraud, coupon abuse, and returns
// -----------------------------------------------------------------------------
WITH [
  'Avery Stone', 'Blake Turner', 'Casey Vega', 'Drew Morgan', 'Emery Chen',
  'Finley Brooks', 'Gray Harper', 'Hayden Shah', 'Indigo Price', 'Jules Rivera',
  'Kai Bennett', 'Logan Patel', 'Morgan Quinn', 'Noa Sullivan', 'Oakley Cruz',
  'Parker Reed', 'Quinn Taylor', 'Riley Dawson', 'Sage Coleman', 'Tatum Fox',
  'Uma Wallace', 'Val Jordan', 'Wren Ellis', 'Xander Miles', 'Yael Knox',
  'Zara Bishop', 'Aria Lane', 'Ben Carter', 'Cora Hughes', 'Dylan Ross',
  'Eli Foster', 'Faye Simmons', 'Gina Ward', 'Hugo Bell', 'Iris Long',
  'Jonah Hale', 'Kira West', 'Lena Ortiz', 'Milo Ford', 'Nina Park',
  'Owen King', 'Priya Nair', 'Rohan Mehta', 'Sara Kim', 'Theo Grant',
  'Vera Scott', 'Will Mason', 'Yara Ali', 'Zane Cole', 'Maya Singh'
] AS names
UNWIND range(1, 50) AS i
CREATE (:Customer {
  customerId: 'CUST-' + right('000' + toString(i), 3),
  email: toLower(replace(names[i - 1], ' ', '.')) + CASE WHEN i IN [3, 7, 11, 15, 19, 23] THEN '+promo' ELSE '' END + '@example.com',
  normalizedEmail: toLower(replace(names[i - 1], ' ', '.')) + '@example.com',
  phone: '+1-555-' + right('0000' + toString(2000 + i), 4),
  normalizedPhone: '+1555' + right('0000' + toString(2000 + i), 4),
  fullName: names[i - 1],
  accountStatus: CASE
    WHEN i IN [1, 2, 3, 4, 5, 6] THEN 'REVIEW'
    WHEN i IN [7, 11, 15, 19, 23] THEN 'COUPON_WATCH'
    WHEN i IN [8, 12, 16, 20, 24] THEN 'RETURN_WATCH'
    ELSE 'ACTIVE'
  END,
  riskScore: CASE
    WHEN i IN [1, 2, 3, 4, 5, 6] THEN 0.94
    WHEN i IN [7, 11, 15, 19, 23] THEN 0.83
    WHEN i IN [8, 12, 16, 20, 24] THEN 0.78
    ELSE toFloat((i % 25) + 5) / 100.0
  END,
  loyaltyTier: CASE WHEN i % 10 = 0 THEN 'PLATINUM' WHEN i % 4 = 0 THEN 'GOLD' WHEN i % 3 = 0 THEN 'SILVER' ELSE 'BRONZE' END,
  deviceFingerprint: CASE
    WHEN i IN [1, 2, 3, 4, 5, 6] THEN 'DEVICE-FRAUD-RING-A'
    WHEN i IN [7, 11, 15, 19, 23] THEN 'DEVICE-COUPON-FARM-C'
    ELSE 'DEVICE-' + right('000' + toString(i), 3)
  END,
  ipAddress: CASE
    WHEN i IN [1, 2, 3, 4, 5, 6] THEN '198.51.100.77'
    WHEN i IN [7, 11, 15, 19, 23] THEN '203.0.113.45'
    ELSE '192.0.2.' + toString((i % 200) + 10)
  END,
  userAgent: CASE WHEN i IN [1, 2, 3, 4, 5, 6, 7, 11, 15, 19, 23] THEN 'Mozilla/5.0 SyntheticBrowser/91.0' ELSE 'Mozilla/5.0 RetailApp/5.' + toString(i % 9) END,
  firstSeenAt: datetime('2026-01-01T00:00:00Z') + duration({days: i}),
  lastSeenAt: datetime('2026-05-20T00:00:00Z') + duration({hours: i}),
  createdAt: datetime('2026-01-01T00:00:00Z') + duration({days: i}),
  updatedAt: datetime('2026-05-20T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Operational customer links to address and payment reference nodes
// -----------------------------------------------------------------------------
MATCH (c:Customer)
WITH c, toInteger(right(c.customerId, 3)) AS i
MATCH (a:Address {addressId:
  CASE
    WHEN i IN [1, 2, 3, 4, 5, 6] THEN 'ADDR-001'
    WHEN i IN [7, 11, 15, 19, 23] THEN 'ADDR-006'
    WHEN i IN [8, 12, 16, 20, 24] THEN 'ADDR-004'
    ELSE 'ADDR-' + right('000' + toString(((i - 1) % 40) + 1), 3)
  END
})
CREATE (c)-[:USES_ADDRESS {
  createdAt: datetime('2026-02-01T00:00:00Z') + duration({days: i}),
  firstUsedAt: datetime('2026-02-01T00:00:00Z') + duration({days: i}),
  lastUsedAt: datetime('2026-05-20T00:00:00Z')
}]->(a);

MATCH (c:Customer)
WITH c, toInteger(right(c.customerId, 3)) AS i
MATCH (p:PaymentMethod {paymentMethodId:
  CASE
    WHEN i IN [1, 2, 3, 4, 5, 6] THEN 'PM-001'
    WHEN i IN [7, 11, 15, 19, 23] THEN 'PM-005'
    WHEN i IN [8, 12, 16, 20, 24] THEN 'PM-008'
    ELSE 'PM-' + right('000' + toString(((i - 1) % 30) + 1), 3)
  END
})
CREATE (c)-[:USES_PAYMENT {
  createdAt: datetime('2026-02-01T00:00:00Z') + duration({days: i}),
  firstUsedAt: datetime('2026-02-01T00:00:00Z') + duration({days: i}),
  lastUsedAt: datetime('2026-05-20T00:00:00Z')
}]->(p);

// -----------------------------------------------------------------------------
// Explicit shared-address and shared-payment fraud edges
// -----------------------------------------------------------------------------
UNWIND [
  ['CUST-001', 'CUST-002', 'ADDR-HASH-FRAUD-RING-A', 0.98],
  ['CUST-001', 'CUST-003', 'ADDR-HASH-FRAUD-RING-A', 0.97],
  ['CUST-002', 'CUST-004', 'ADDR-HASH-FRAUD-RING-A', 0.96],
  ['CUST-003', 'CUST-005', 'ADDR-HASH-FRAUD-RING-A', 0.95],
  ['CUST-004', 'CUST-006', 'ADDR-HASH-FRAUD-RING-A', 0.94],
  ['CUST-007', 'CUST-011', 'ADDR-HASH-COUPON-FARM-C', 0.91],
  ['CUST-011', 'CUST-015', 'ADDR-HASH-COUPON-FARM-C', 0.90],
  ['CUST-015', 'CUST-019', 'ADDR-HASH-COUPON-FARM-C', 0.89],
  ['CUST-019', 'CUST-023', 'ADDR-HASH-COUPON-FARM-C', 0.88],
  ['CUST-008', 'CUST-012', 'ADDR-HASH-RETURN-HUB-B', 0.86],
  ['CUST-012', 'CUST-016', 'ADDR-HASH-RETURN-HUB-B', 0.85],
  ['CUST-016', 'CUST-020', 'ADDR-HASH-RETURN-HUB-B', 0.84],
  ['CUST-020', 'CUST-024', 'ADDR-HASH-RETURN-HUB-B', 0.83]
] AS row
MATCH (source:Customer {customerId: row[0]})
MATCH (target:Customer {customerId: row[1]})
CREATE (source)-[:SHARES_ADDRESS_WITH {
  createdAt: datetime('2026-05-01T00:00:00Z'),
  addressHash: row[2],
  score: row[3],
  evidenceCount: 3,
  firstObservedAt: datetime('2026-02-01T00:00:00Z'),
  lastObservedAt: datetime('2026-05-20T00:00:00Z')
}]->(target);

UNWIND [
  ['CUST-001', 'CUST-002', 'PAY-FP-FRAUD-RING-A', 0.99],
  ['CUST-001', 'CUST-004', 'PAY-FP-FRAUD-RING-A', 0.98],
  ['CUST-002', 'CUST-003', 'PAY-FP-FRAUD-RING-A', 0.97],
  ['CUST-003', 'CUST-005', 'PAY-FP-FRAUD-RING-A', 0.96],
  ['CUST-005', 'CUST-006', 'PAY-FP-FRAUD-RING-A', 0.95],
  ['CUST-007', 'CUST-011', 'PAY-FP-COUPON-FARM-C', 0.93],
  ['CUST-011', 'CUST-015', 'PAY-FP-COUPON-FARM-C', 0.92],
  ['CUST-015', 'CUST-019', 'PAY-FP-COUPON-FARM-C', 0.91],
  ['CUST-019', 'CUST-023', 'PAY-FP-COUPON-FARM-C', 0.90],
  ['CUST-008', 'CUST-012', 'PAY-FP-RETURN-LOOP-B', 0.88],
  ['CUST-012', 'CUST-016', 'PAY-FP-RETURN-LOOP-B', 0.87],
  ['CUST-016', 'CUST-020', 'PAY-FP-RETURN-LOOP-B', 0.86],
  ['CUST-020', 'CUST-024', 'PAY-FP-RETURN-LOOP-B', 0.85]
] AS row
MATCH (source:Customer {customerId: row[0]})
MATCH (target:Customer {customerId: row[1]})
CREATE (source)-[:SHARES_PAYMENT_WITH {
  createdAt: datetime('2026-05-01T00:00:00Z'),
  paymentFingerprint: row[2],
  score: row[3],
  evidenceCount: 4,
  firstObservedAt: datetime('2026-02-01T00:00:00Z'),
  lastObservedAt: datetime('2026-05-20T00:00:00Z')
}]->(target);

// -----------------------------------------------------------------------------
// Orders: 200 total. High-risk customers are intentionally overrepresented.
// -----------------------------------------------------------------------------
UNWIND range(1, 200) AS i
WITH i,
  CASE
    WHEN i <= 42 THEN ((i - 1) % 6) + 1
    WHEN i <= 82 THEN [7, 11, 15, 19, 23][(i - 43) % 5]
    WHEN i <= 122 THEN [8, 12, 16, 20, 24][(i - 83) % 5]
    ELSE ((i - 123) % 50) + 1
  END AS customerNo
MATCH (c:Customer {customerId: 'CUST-' + right('000' + toString(customerNo), 3)})
CREATE (c)-[:PLACED {
  createdAt: datetime('2026-02-01T08:00:00Z') + duration({hours: i * 3}),
  orderDate: datetime('2026-02-01T08:00:00Z') + duration({hours: i * 3}),
  channel: CASE WHEN i % 4 = 0 THEN 'MARKETPLACE' WHEN i % 3 = 0 THEN 'WEB' ELSE 'MOBILE_APP' END,
  ipAddress: c.ipAddress,
  deviceFingerprint: c.deviceFingerprint
}]->(:Order {
  orderId: 'ORD-' + right('0000' + toString(i), 4),
  orderNumber: 'PG-' + toString(20260000 + i),
  orderStatus: CASE WHEN i IN [6, 17, 28, 39, 67, 91, 113, 144, 188] THEN 'CANCELLED' WHEN i % 11 = 0 THEN 'RETURNED' ELSE 'FULFILLED' END,
  fraudStatus: CASE
    WHEN customerNo IN [1, 2, 3, 4, 5, 6] THEN 'HIGH_RISK'
    WHEN customerNo IN [7, 11, 15, 19, 23] THEN 'COUPON_ABUSE_REVIEW'
    WHEN customerNo IN [8, 12, 16, 20, 24] THEN 'RETURN_ABUSE_REVIEW'
    ELSE 'CLEAR'
  END,
  channel: CASE WHEN i % 4 = 0 THEN 'MARKETPLACE' WHEN i % 3 = 0 THEN 'WEB' ELSE 'MOBILE_APP' END,
  currency: 'USD',
  subtotalAmount: toFloat(45 + ((i * 29) % 1800)),
  discountAmount: CASE WHEN i <= 82 THEN toFloat(25 + (i % 90)) ELSE toFloat(i % 25) END,
  taxAmount: toFloat(5 + (i % 85)),
  shippingAmount: CASE WHEN i % 5 = 0 THEN 0.0 ELSE 9.99 END,
  totalAmount: toFloat(70 + ((i * 31) % 2100)),
  ipAddress: c.ipAddress,
  deviceFingerprint: c.deviceFingerprint,
  placedAt: datetime('2026-02-01T08:00:00Z') + duration({hours: i * 3}),
  fulfilledAt: CASE WHEN i IN [6, 17, 28, 39, 67, 91, 113, 144, 188] THEN null ELSE datetime('2026-02-03T08:00:00Z') + duration({hours: i * 3}) END,
  createdAt: datetime('2026-02-01T08:00:00Z') + duration({hours: i * 3}),
  updatedAt: datetime('2026-05-20T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Order line items: each order contains two products, biased toward risky SKUs
// -----------------------------------------------------------------------------
MATCH (o:Order)
WITH o, toInteger(right(o.orderId, 4)) AS i
MATCH (p1:Product {productId:
  CASE
    WHEN i <= 42 THEN 'PROD-' + right('000' + toString(([5, 11, 19, 27, 41, 58][(i - 1) % 6])), 3)
    WHEN i <= 82 THEN 'PROD-' + right('000' + toString(([2, 4, 6, 8, 10, 79][(i - 43) % 6])), 3)
    WHEN i <= 122 THEN 'PROD-' + right('000' + toString(([31, 32, 33, 34, 45, 46][(i - 83) % 6])), 3)
    ELSE 'PROD-' + right('000' + toString(((i - 1) % 80) + 1), 3)
  END
})
MATCH (p2:Product {productId: 'PROD-' + right('000' + toString(((i + 17) % 80) + 1), 3)})
CREATE (o)-[:CONTAINS {
  createdAt: o.createdAt,
  quantity: CASE WHEN i % 17 = 0 THEN 4 ELSE 1 + (i % 2) END,
  unitPrice: p1.unitPrice,
  lineTotal: p1.unitPrice * toFloat(CASE WHEN i % 17 = 0 THEN 4 ELSE 1 + (i % 2) END),
  discountAmount: CASE WHEN i <= 82 THEN toFloat(10 + (i % 30)) ELSE toFloat(i % 8) END
}]->(p1)
CREATE (o)-[:CONTAINS {
  createdAt: o.createdAt,
  quantity: 1,
  unitPrice: p2.unitPrice,
  lineTotal: p2.unitPrice,
  discountAmount: toFloat(i % 6)
}]->(p2);

// -----------------------------------------------------------------------------
// Coupon usage: concentrated abuse plus normal promotional usage
// -----------------------------------------------------------------------------
MATCH (o:Order)
WHERE toInteger(right(o.orderId, 4)) <= 160
WITH o, toInteger(right(o.orderId, 4)) AS i
MATCH (coupon:Coupon {couponId:
  CASE
    WHEN i <= 82 AND i % 4 = 0 THEN 'COUP-ABUSE-04'
    WHEN i <= 82 AND i % 3 = 0 THEN 'COUP-ABUSE-03'
    WHEN i <= 82 AND i % 2 = 0 THEN 'COUP-ABUSE-02'
    WHEN i <= 82 THEN 'COUP-ABUSE-01'
    WHEN i % 8 = 0 THEN 'COUP-NORM-07'
    WHEN i % 7 = 0 THEN 'COUP-NORM-08'
    WHEN i % 6 = 0 THEN 'COUP-NORM-04'
    WHEN i % 5 = 0 THEN 'COUP-NORM-02'
    ELSE 'COUP-NORM-01'
  END
})
CREATE (o)-[:USED {
  createdAt: o.createdAt,
  redeemedAt: o.placedAt,
  discountAmount: o.discountAmount,
  campaignId: coupon.campaignId
}]->(coupon);

// -----------------------------------------------------------------------------
// Return requests: 45 total, concentrated among return-watch customers and high-value goods
// -----------------------------------------------------------------------------
UNWIND range(1, 45) AS i
MATCH (o:Order {orderId:
  CASE
    WHEN i <= 30 THEN 'ORD-' + right('0000' + toString(82 + i), 4)
    ELSE 'ORD-' + right('0000' + toString(20 + (i * 3)), 4)
  END
})
CREATE (o)-[:RETURNED {
  createdAt: o.placedAt + duration({days: 6}),
  requestedAt: o.placedAt + duration({days: 6}),
  returnStatus: CASE WHEN i % 6 = 0 THEN 'REJECTED' WHEN i % 4 = 0 THEN 'MANUAL_REVIEW' ELSE 'APPROVED' END,
  quantity: CASE WHEN i % 9 = 0 THEN 3 ELSE 1 END,
  refundAmount: toFloat(40 + ((i * 37) % 700))
}]->(:ReturnRequest {
  returnRequestId: 'RET-' + right('000' + toString(i), 3),
  returnStatus: CASE WHEN i % 6 = 0 THEN 'REJECTED' WHEN i % 4 = 0 THEN 'MANUAL_REVIEW' ELSE 'APPROVED' END,
  reasonCode: CASE
    WHEN i <= 30 THEN 'ITEM_NOT_AS_DESCRIBED'
    WHEN i % 5 = 0 THEN 'EMPTY_BOX_CLAIM'
    WHEN i % 4 = 0 THEN 'DAMAGED_ON_ARRIVAL'
    ELSE 'SIZE_OR_FIT'
  END,
  reasonText: CASE
    WHEN i <= 30 THEN 'Customer reports repeated mismatch between product listing and received item; pattern useful for return fraud retrieval.'
    WHEN i % 5 = 0 THEN 'Customer claims package arrived empty after high-value order.'
    WHEN i % 4 = 0 THEN 'Customer reports damage after delivery.'
    ELSE 'Customer reports ordinary size or fit issue.'
  END,
  refundAmount: toFloat(40 + ((i * 37) % 700)),
  currency: 'USD',
  requestedAt: o.placedAt + duration({days: 6}),
  resolvedAt: CASE WHEN i % 4 = 0 THEN null ELSE o.placedAt + duration({days: 10}) END,
  riskScore: CASE WHEN i <= 30 THEN 0.86 ELSE toFloat((i % 30) + 20) / 100.0 END,
  createdAt: o.placedAt + duration({days: 6}),
  updatedAt: datetime('2026-05-20T00:00:00Z')
});

// -----------------------------------------------------------------------------
// Smoke-test traversal examples for analysts:
// -----------------------------------------------------------------------------
// Fraud ring:
// MATCH p = (:Customer {customerId:'CUST-001'})-[:SHARES_PAYMENT_WITH|SHARES_ADDRESS_WITH*1..3]-(:Customer)
// RETURN p;
//
// Coupon abuse:
// MATCH p = (:Customer)-[:PLACED]->(:Order)-[:USED]->(:Coupon {campaignId:'CMP-ABUSE-WELCOME'})
// RETURN p;
//
// Suspicious returns:
// MATCH p = (:Customer)-[:PLACED]->(:Order)-[:RETURNED]->(:ReturnRequest)
// WHERE p IS NOT NULL
// RETURN p;
//
// Recommendation opportunity:
// MATCH (:Customer {customerId:'CUST-030'})-[:PLACED]->(:Order)-[:CONTAINS]->(:Product)-[:BELONGS_TO]->(cat:Category)<-[:BELONGS_TO]-(rec:Product)
// RETURN DISTINCT rec.name, rec.brand, cat.name
// LIMIT 10;
