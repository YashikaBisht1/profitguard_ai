// Mock database representing the Neo4j seed.cypher records

export interface EvidenceItem {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface Recommendation {
  action: string;
  reason: string;
}

export interface FraudCheckResponse {
  customer_id: string;
  order_id: string | null;
  risk_score: number;
  risk_band: "low" | "medium" | "high";
  decision: "approve" | "step_up_verification" | "manual_review" | "deny";
  confidence: number;
  reasoning: string;
  alternatives: string[];
  evidence: EvidenceItem[];
  graph_context: Record<string, any>;
  recommendations: Recommendation[];
  prompt_context: string;
}

export interface ReturnAnalysisResponse {
  customer_id: string;
  order_id: string;
  return_request_id: string | null;
  risk_score: number;
  risk_band: "low" | "medium" | "high";
  recommended_action: "approve" | "manual_review" | "deny_or_manual_review";
  evidence: EvidenceItem[];
  graph_context: Record<string, any>;
  recommendations: Recommendation[];
  prompt_context: string;
}

// 50 Seed Customer Names
export const CUSTOMER_NAMES = [
  "Avery Stone", "Blake Turner", "Casey Vega", "Drew Morgan", "Emery Chen",
  "Finley Brooks", "Gray Harper", "Hayden Shah", "Indigo Price", "Jules Rivera",
  "Kai Bennett", "Logan Patel", "Morgan Quinn", "Noa Sullivan", "Oakley Cruz",
  "Parker Reed", "Quinn Taylor", "Riley Dawson", "Sage Coleman", "Tatum Fox",
  "Uma Wallace", "Val Jordan", "Wren Ellis", "Xander Miles", "Yael Knox",
  "Zara Bishop", "Aria Lane", "Ben Carter", "Cora Hughes", "Dylan Ross",
  "Eli Foster", "Faye Simmons", "Gina Ward", "Hugo Bell", "Iris Long",
  "Jonah Hale", "Kira West", "Lena Ortiz", "Milo Ford", "Nina Park",
  "Owen King", "Priya Nair", "Rohan Mehta", "Sara Kim", "Theo Grant",
  "Vera Scott", "Will Mason", "Yara Ali", "Zane Cole", "Maya Singh"
];

// Reconstruct standard customer records matching seed behavior
export const mockCustomers = Array.from({ length: 50 }, (_, idx) => {
  const i = idx + 1;
  const name = CUSTOMER_NAMES[idx];
  const customerId = `CUST-${String(i).padStart(3, "0")}`;

  let accountStatus = "ACTIVE";
  let riskScore = ((i % 25) + 5) / 100.0;
  let deviceFingerprint = `DEVICE-${String(i).padStart(3, "0")}`;
  let ipAddress = `192.0.2.${(i % 200) + 10}`;

  if ([1, 2, 3, 4, 5, 6].includes(i)) {
    accountStatus = "REVIEW";
    riskScore = 0.94;
    deviceFingerprint = "DEVICE-FRAUD-RING-A";
    ipAddress = "198.51.100.77";
  } else if ([7, 11, 15, 19, 23].includes(i)) {
    accountStatus = "COUPON_WATCH";
    riskScore = 0.83;
    deviceFingerprint = "DEVICE-COUPON-FARM-C";
    ipAddress = "203.0.113.45";
  } else if ([8, 12, 16, 20, 24].includes(i)) {
    accountStatus = "RETURN_WATCH";
    riskScore = 0.78;
  }

  const isPromoEmail = [3, 7, 11, 15, 19, 23].includes(i);
  const email = `${name.toLowerCase().replace(/ /g, ".")}${isPromoEmail ? "+promo" : ""}@example.com`;

  // Address
  let addressId = `ADDR-${String(((i - 1) % 40) + 1).padStart(3, "0")}`;
  let addressHash = `ADDR-HASH-${String(((i - 1) % 40) + 1).padStart(3, "0")}`;
  if ([1, 2, 3, 4, 5, 6].includes(i)) {
    addressId = "ADDR-001";
    addressHash = "ADDR-HASH-FRAUD-RING-A";
  } else if ([7, 11, 15, 19, 23].includes(i)) {
    addressId = "ADDR-006";
    addressHash = "ADDR-HASH-COUPON-FARM-C";
  } else if ([8, 12, 16, 20, 24].includes(i)) {
    addressId = "ADDR-004";
    addressHash = "ADDR-HASH-RETURN-HUB-B";
  }

  // Payment method
  let paymentMethodId = `PM-${String(((i - 1) % 30) + 1).padStart(3, "0")}`;
  let paymentFingerprint = `PAY-FP-${String(((i - 1) % 30) + 1).padStart(3, "0")}`;
  if ([1, 2, 3, 4, 5, 6].includes(i)) {
    paymentMethodId = "PM-001";
    paymentFingerprint = "PAY-FP-FRAUD-RING-A";
  } else if ([7, 11, 15, 19, 23].includes(i)) {
    paymentMethodId = "PM-005";
    paymentFingerprint = "PAY-FP-COUPON-FARM-C";
  } else if ([8, 12, 16, 20, 24].includes(i)) {
    paymentMethodId = "PM-008";
    paymentFingerprint = "PAY-FP-RETURN-LOOP-B";
  }

  return {
    customerId,
    fullName: name,
    email,
    phone: `+1-555-${String(2000 + i).padStart(4, "0")}`,
    accountStatus,
    riskScore,
    loyaltyTier: i % 10 === 0 ? "PLATINUM" : i % 4 === 0 ? "GOLD" : i % 3 === 0 ? "SILVER" : "BRONZE",
    deviceFingerprint,
    ipAddress,
    userAgent: [1, 2, 3, 4, 5, 6, 7, 11, 15, 19, 23].includes(i) ? "Mozilla/5.0 SyntheticBrowser/91.0" : `Mozilla/5.0 RetailApp/5.${i % 9}`,
    addressId,
    addressHash,
    paymentMethodId,
    paymentFingerprint,
  };
});

// Generate 80 Products
export const mockProducts = Array.from({ length: 80 }, (_, idx) => {
  const i = idx + 1;
  let categoryId = "CAT-10";
  let productFamily = "Digital Gift Card";

  if (i <= 12) {
    categoryId = "CAT-02";
    productFamily = "Smartphone";
  } else if (i <= 24) {
    categoryId = "CAT-03";
    productFamily = "Laptop";
  } else if (i <= 34) {
    categoryId = "CAT-04";
    productFamily = "Gaming Console";
  } else if (i <= 46) {
    categoryId = "CAT-05";
    productFamily = "Designer Item";
  } else if (i <= 56) {
    categoryId = "CAT-06";
    productFamily = "Premium Sneaker";
  } else if (i <= 64) {
    categoryId = "CAT-07";
    productFamily = "Appliance";
  } else if (i <= 70) {
    categoryId = "CAT-08";
    productFamily = "Beauty Kit";
  } else if (i <= 76) {
    categoryId = "CAT-09";
    productFamily = "Training Gear";
  }

  const categoryNames: Record<string, string> = {
    "CAT-01": "Consumer Electronics",
    "CAT-02": "Mobile Phones",
    "CAT-03": "Laptops",
    "CAT-04": "Gaming",
    "CAT-05": "Luxury Fashion",
    "CAT-06": "Footwear",
    "CAT-07": "Home Appliances",
    "CAT-08": "Beauty",
    "CAT-09": "Sports Gear",
    "CAT-10": "Gift Cards",
  };

  const brands = ["Northline", "Aster", "VoltEdge", "UrbanMint", "Monarch", "Kairo", "EverydayCo"];
  const brand = i % 7 === 0 ? brands[0] : i % 7 === 1 ? brands[1] : i % 7 === 2 ? brands[2] : i % 7 === 3 ? brands[3] : i % 7 === 4 ? brands[4] : i % 7 === 5 ? brands[5] : brands[6];

  let unitPrice = 50 + i * 10;
  if (i <= 24) unitPrice = 499 + i * 37;
  else if (i <= 46) unitPrice = 249 + i * 19;
  else if (i <= 56) unitPrice = 129 + i * 8;
  else if (i <= 76) unitPrice = 39 + i * 4;

  const isRiskySeller = [5, 11, 19, 27, 41, 58, 79].includes(i);
  const sellerId = isRiskySeller ? "SELLER-RISK-09" : `SELLER-${String((i % 15) + 1).padStart(2, "0")}`;
  const riskScore = isRiskySeller ? 0.91 : ((i % 35) + 5) / 100.0;

  return {
    productId: `PROD-${String(i).padStart(3, "0")}`,
    sku: `SKU-${categoryId}-${String(i).padStart(3, "0")}`,
    name: `${productFamily} ${i}`,
    brand,
    sellerId,
    productStatus: "ACTIVE",
    unitPrice,
    currency: "USD",
    riskScore,
    categoryName: categoryNames[categoryId] || "Unknown",
    categoryId,
    description: `${productFamily} for ecommerce recommendation and fraud retrieval. Includes brand, category, seller, return behavior, coupon sensitivity, and high value resale signals.`,
  };
});

// Generate 200 Orders
export const mockOrders = Array.from({ length: 200 }, (_, idx) => {
  const i = idx + 1;
  const orderId = `ORD-${String(i).padStart(4, "0")}`;

  let customerNo = ((i - 1) % 50) + 1;
  if (i <= 42) {
    customerNo = ((i - 1) % 6) + 1;
  } else if (i <= 82) {
    customerNo = [7, 11, 15, 19, 23][(i - 43) % 5];
  } else if (i <= 122) {
    customerNo = [8, 12, 16, 20, 24][(i - 83) % 5];
  }

  const customerId = `CUST-${String(customerNo).padStart(3, "0")}`;
  const customer = mockCustomers.find(c => c.customerId === customerId);

  let fraudStatus = "CLEAR";
  if ([1, 2, 3, 4, 5, 6].includes(customerNo)) {
    fraudStatus = "HIGH_RISK";
  } else if ([7, 11, 15, 19, 23].includes(customerNo)) {
    fraudStatus = "COUPON_ABUSE_REVIEW";
  } else if ([8, 12, 16, 20, 24].includes(customerNo)) {
    fraudStatus = "RETURN_ABUSE_REVIEW";
  }

  const isCancelled = [6, 17, 28, 39, 67, 91, 113, 144, 188].includes(i);
  const orderStatus = isCancelled ? "CANCELLED" : (i % 11 === 0 ? "RETURNED" : "FULFILLED");

  const subtotalAmount = 45 + ((i * 29) % 1800);
  const discountAmount = i <= 82 ? (25 + (i % 90)) : (i % 25);
  const taxAmount = 5 + (i % 85);
  const shippingAmount = i % 5 === 0 ? 0.0 : 9.99;
  const totalAmount = subtotalAmount - discountAmount + taxAmount + shippingAmount;

  // Products contained
  let p1Index = ((i - 1) % 80) + 1;
  if (i <= 42) {
    p1Index = [5, 11, 19, 27, 41, 58][(i - 1) % 6];
  } else if (i <= 82) {
    p1Index = [2, 4, 6, 8, 10, 79][(i - 43) % 6];
  } else if (i <= 122) {
    p1Index = [31, 32, 33, 34, 45, 46][(i - 83) % 6];
  }

  const p2Index = ((i + 17) % 80) + 1;
  const p1 = mockProducts[p1Index - 1];
  const p2 = mockProducts[p2Index - 1];

  return {
    orderId,
    orderNumber: `PG-${20260000 + i}`,
    customerId,
    orderStatus,
    fraudStatus,
    subtotalAmount,
    discountAmount,
    taxAmount,
    shippingAmount,
    totalAmount,
    ipAddress: customer?.ipAddress || "192.0.2.1",
    deviceFingerprint: customer?.deviceFingerprint || "DEVICE-000",
    placedAt: new Date(Date.parse("2026-02-01T08:00:00Z") + i * 3 * 3600 * 1000).toISOString(),
    products: [p1, p2],
  };
});

// Generate 45 Returns
export const mockReturns = Array.from({ length: 45 }, (_, idx) => {
  const i = idx + 1;
  const returnRequestId = `RET-${String(i).padStart(3, "0")}`;

  let orderNo = 20 + i * 3;
  if (i <= 30) {
    orderNo = 82 + i;
  }

  const orderId = `ORD-${String(orderNo).padStart(4, "0")}`;
  const order = mockOrders[orderNo - 1];

  const returnStatus = i % 6 === 0 ? "REJECTED" : (i % 4 === 0 ? "MANUAL_REVIEW" : "APPROVED");
  const reasonCode = i <= 30 ? "ITEM_NOT_AS_DESCRIBED" : (i % 5 === 0 ? "EMPTY_BOX_CLAIM" : (i % 4 === 0 ? "DAMAGED_ON_ARRIVAL" : "SIZE_OR_FIT"));
  const reasonText = i <= 30 
    ? "Customer reports repeated mismatch between product listing and received item; pattern useful for return fraud retrieval."
    : (i % 5 === 0 ? "Customer claims package arrived empty after high-value order." : (i % 4 === 0 ? "Customer reports damage after delivery." : "Customer reports ordinary size or fit issue."));

  const refundAmount = 40 + ((i * 37) % 700);
  const riskScore = i <= 30 ? 0.86 : ((i % 30) + 20) / 100.0;

  return {
    returnRequestId,
    orderId,
    customerId: order?.customerId || "CUST-008",
    returnStatus,
    reasonCode,
    reasonText,
    refundAmount,
    riskScore,
    requestedAt: new Date(Date.parse(order?.placedAt || "2026-02-01T08:00:00Z") + 6 * 24 * 3600 * 1000).toISOString(),
  };
});

// Mock Fraud Check Engine
export function mockCheckFraud(request: {
  customer_id: string;
  order_id?: string | null;
  payment_fingerprint?: string | null;
  address_hash?: string | null;
  include_graph_context?: boolean;
}): FraudCheckResponse {
  const customer = mockCustomers.find(c => c.customerId === request.customer_id) || {
    customerId: request.customer_id,
    fullName: "Unknown Customer",
    email: `${request.customer_id.toLowerCase()}@example.com`,
    phone: "+1-555-0000",
    accountStatus: "UNKNOWN",
    riskScore: 0.12,
    deviceFingerprint: "DEVICE-UNKNOWN",
    ipAddress: "192.0.2.255",
    addressHash: request.address_hash || "ADDR-HASH-UNKNOWN",
    paymentFingerprint: request.payment_fingerprint || "PAY-FP-UNKNOWN",
  };

  const orders = mockOrders.filter(o => o.customerId === customer.customerId);
  const returns = mockReturns.filter(r => r.customerId === customer.customerId);

  const sharedPaymentCount = mockCustomers.filter(c => c.customerId !== customer.customerId && c.paymentFingerprint === customer.paymentFingerprint).length;
  const sharedAddressCount = mockCustomers.filter(c => c.customerId !== customer.customerId && c.addressHash === customer.addressHash).length;
  const highRiskOrderCount = orders.filter(o => o.fraudStatus === "HIGH_RISK").length;
  const couponAbuseOrderCount = orders.filter(o => o.fraudStatus === "COUPON_ABUSE_REVIEW").length;

  const paymentFingerprintMatch = !!request.payment_fingerprint && customer.paymentFingerprint === request.payment_fingerprint;
  const addressHashMatch = !!request.address_hash && customer.addressHash === request.address_hash;

  // Scoring
  let score = customer.riskScore;
  score += Math.min(sharedPaymentCount * 0.08, 0.28);
  score += Math.min(sharedAddressCount * 0.05, 0.20);
  score += Math.min(highRiskOrderCount * 0.04, 0.20);
  score += Math.min(couponAbuseOrderCount * 0.03, 0.15);
  if (paymentFingerprintMatch) score += 0.08;
  if (addressHashMatch) score += 0.05;

  const evidence: EvidenceItem[] = [];
  if (sharedPaymentCount > 0) {
    evidence.push({
      type: "shared_payment",
      severity: "high",
      description: `${sharedPaymentCount} linked customers share a payment fingerprint.`,
    });
  }
  if (sharedAddressCount > 0) {
    evidence.push({
      type: "shared_address",
      severity: "medium",
      description: `${sharedAddressCount} linked customers share an address hash.`,
    });
  }
  if (highRiskOrderCount > 0) {
    evidence.push({
      type: "order_history",
      severity: "high",
      description: `${highRiskOrderCount} orders are already marked high risk or under fraud review.`,
    });
  }
  if (couponAbuseOrderCount > 0) {
    evidence.push({
      type: "coupon_abuse",
      severity: "medium",
      description: `${couponAbuseOrderCount} orders used abuse-prone coupon campaigns.`,
    });
  }
  if (paymentFingerprintMatch) {
    evidence.push({
      type: "payment_input_match",
      severity: "high",
      description: "Input payment fingerprint matches a known graph payment method.",
    });
  }
  if (addressHashMatch) {
    evidence.push({
      type: "address_input_match",
      severity: "medium",
      description: "Input address hash matches a known graph address.",
    });
  }

  score = Math.max(0, Math.min(1, score));

  // Risk band
  let risk_band: "low" | "medium" | "high" = "low";
  if (score >= 0.75) risk_band = "high";
  else if (score >= 0.45) risk_band = "medium";

  // Decision
  let decision: "approve" | "step_up_verification" | "manual_review" | "deny" = "approve";
  if (score >= 0.85) decision = "deny";
  else if (score >= 0.70) decision = "manual_review";
  else if (score >= 0.40) decision = "step_up_verification";

  // Reasoning
  let reasoning = `Graph traversal shows a standard customer history with a low risk footprint. Subtotal is normal, and IP-device correlations align with typical buyer behavior.`;
  if (decision === "deny" || decision === "manual_review") {
    reasoning = `ALERT: High-risk linked-entity cluster identified. Customer ${customer.customerId} shares payment card '${customer.paymentFingerprint}' and address hash '${customer.addressHash}' with ${sharedPaymentCount + sharedAddressCount} other accounts, several of which have already been blacklisted for chargebacks. Highly indicative of structured fraud-ring activity. Recommend holding fulfillment immediately.`;
  } else if (customer.accountStatus === "COUPON_WATCH") {
    reasoning = `System flagged account for Coupon Exploitation. Multiple orders placed within a 3-hour period utilizing WELCOME50 and FLASH70 campaigns on synthetic email variants (+promo). This pattern represents targeted promotion abuse bypassing single-use rules.`;
  }

  const recommendations: Recommendation[] = [
    { action: "expand_graph", reason: "Traverse shared payment, shared address, coupon, and return paths before final disposition." },
    { action: "retain_context", reason: "Attach graph evidence to the case record for analyst review and GraphRAG retrieval." }
  ];

  if (score >= 0.75) {
    recommendations.unshift({ action: "hold_fulfillment", reason: "Risk is high enough to pause shipment or refund until review." });
  }
  if (couponAbuseOrderCount > 0 || customer.accountStatus === "COUPON_WATCH") {
    recommendations.push({ action: "coupon_controls", reason: "Limit high-discount redemptions across linked accounts." });
  }

  const graphContext = {
    customer_id: customer.customerId,
    customer_risk_score: customer.riskScore,
    account_status: customer.accountStatus,
    shared_payment_count: sharedPaymentCount,
    shared_address_count: sharedAddressCount,
    high_risk_order_count: highRiskOrderCount,
    coupon_abuse_order_count: couponAbuseOrderCount,
    payment_fingerprint_match: paymentFingerprintMatch,
    address_hash_match: addressHashMatch,
    coupon_codes: customer.accountStatus === "COUPON_WATCH" ? ["WELCOME50", "FLASH70"] : [],
  };

  return {
    customer_id: customer.customerId,
    order_id: request.order_id || null,
    risk_score: score,
    risk_band,
    decision,
    confidence: score > 0.8 ? 0.92 : 0.85,
    reasoning,
    alternatives: score > 0.7 ? ["Request government identity proof", "Perform voice verification step-up"] : ["Authorize transaction"],
    evidence,
    graph_context: graphContext,
    recommendations,
    prompt_context: "SYSTEM: Analyze customer entity risk using GraphRAG indicators including payment, address, and device links.",
  };
}

// Mock Return Analysis Engine
export function mockAnalyzeReturn(request: {
  customer_id: string;
  order_id: string;
  return_request_id?: string | null;
  reason_code?: string | null;
  reason_text?: string | null;
  refund_amount?: number | null;
}): ReturnAnalysisResponse {
  const customer = mockCustomers.find(c => c.customerId === request.customer_id) || {
    customerId: request.customer_id,
    fullName: "Unknown Customer",
    riskScore: 0.1,
    accountStatus: "UNKNOWN",
    sharedPaymentId: "",
    sharedAddressId: "",
    paymentFingerprint: "PAY-FP-UNKNOWN",
    addressHash: "ADDR-HASH-UNKNOWN",
  };

  const orders = mockOrders.filter(o => o.customerId === customer.customerId);
  const returns = mockReturns.filter(r => r.customerId === customer.customerId);

  const sharedPaymentCount = mockCustomers.filter(c => c.customerId !== customer.customerId && c.paymentFingerprint === customer.paymentFingerprint).length;
  const sharedAddressCount = mockCustomers.filter(c => c.customerId !== customer.customerId && c.addressHash === customer.addressHash).length;

  const returnCount = returns.length + 1;
  const manualReviewReturnCount = returns.filter(r => r.returnStatus === "MANUAL_REVIEW").length;
  const rejectedReturnCount = returns.filter(r => r.returnStatus === "REJECTED").length;
  const highValueReturnCount = returns.filter(r => r.refundAmount >= 300).length + ((request.refund_amount || 0) >= 300 ? 1 : 0);

  // Score
  let score = customer.riskScore;
  score += Math.min(returnCount * 0.05, 0.25);
  score += Math.min(manualReviewReturnCount * 0.08, 0.24);
  score += Math.min(rejectedReturnCount * 0.12, 0.24);
  score += Math.min(highValueReturnCount * 0.08, 0.16);
  score += Math.min((sharedPaymentCount + sharedAddressCount) * 0.04, 0.16);
  score += Math.min((returns.length + 1) * 0.02, 0.08);

  score = Math.max(0, Math.min(1, score));

  // Risk band
  let risk_band: "low" | "medium" | "high" = "low";
  if (score >= 0.70) risk_band = "high";
  else if (score >= 0.40) risk_band = "medium";

  // Action
  let recommended_action: "approve" | "manual_review" | "deny_or_manual_review" = "approve";
  if (score >= 0.75) recommended_action = "deny_or_manual_review";
  else if (score >= 0.45) recommended_action = "manual_review";

  const evidence: EvidenceItem[] = [];
  if (returnCount >= 3) {
    evidence.push({
      type: "return_frequency",
      severity: "medium",
      description: `${returnCount} prior return requests found for this customer.`,
    });
  }
  if (manualReviewReturnCount > 0) {
    evidence.push({
      type: "manual_review_returns",
      severity: "medium",
      description: `${manualReviewReturnCount} returns previously required manual review.`,
    });
  }
  if (rejectedReturnCount > 0) {
    evidence.push({
      type: "rejected_returns",
      severity: "high",
      description: `${rejectedReturnCount} prior returns were rejected.`,
    });
  }
  if (highValueReturnCount > 0) {
    evidence.push({
      type: "high_value_returns",
      severity: "high",
      description: `${highValueReturnCount} high-value refund requests found.`,
    });
  }
  if (sharedPaymentCount > 0 || sharedAddressCount > 0) {
    evidence.push({
      type: "linked_identity",
      severity: "high",
      description: "Customer is connected to other accounts through shared address or payment relationships.",
    });
  }

  const recommendations: Recommendation[] = [
    { action: "compare_return_reason", reason: "Retrieve similar return narratives and product-category return patterns before final approval." },
    { action: "inspect_linked_accounts", reason: "Review shared address and payment clusters for coordinated refund abuse." }
  ];

  if (score >= 0.75) {
    recommendations.unshift({ action: "pause_refund", reason: "Risk is high enough to delay automatic refund release." });
  }
  if (highValueReturnCount > 0) {
    recommendations.push({ action: "require_item_inspection", reason: "High-value return pattern warrants warehouse validation." });
  }

  const graphContext = {
    customer_id: customer.customerId,
    customer_risk_score: customer.riskScore,
    account_status: customer.accountStatus,
    return_count: returnCount,
    manual_review_return_count: manualReviewReturnCount,
    rejected_return_count: rejectedReturnCount,
    high_value_return_count: highValueReturnCount,
    shared_payment_count: sharedPaymentCount,
    shared_address_count: sharedAddressCount,
    product_categories: ["Consumer Electronics", "Luxury Fashion"],
    product_names: ["Smartphone 5", "Premium Sneaker 48"],
  };

  return {
    customer_id: customer.customerId,
    order_id: request.order_id,
    return_request_id: request.return_request_id || null,
    risk_score: score,
    risk_band,
    recommended_action,
    evidence,
    graph_context: graphContext,
    recommendations,
    prompt_context: "SYSTEM: Evaluate returning entity risk score and flag repeat refund abuse trends.",
  };
}

// Full graph reconstruction for force layout
export interface GraphNode {
  id: string;
  label: string;
  type: "customer" | "order" | "address" | "payment" | "coupon";
  riskScore?: number;
  val: number; // size
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export function getFullMockGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Grouping maps to prevent duplicates
  const addressSet = new Set<string>();
  const paymentSet = new Set<string>();
  const couponSet = new Set<string>();

  // We add seed customers
  mockCustomers.forEach(cust => {
    // Customer Node
    nodes.push({
      id: cust.customerId,
      label: `${cust.fullName} (${cust.customerId})`,
      type: "customer",
      riskScore: cust.riskScore,
      val: 25,
    });

    // Address Node
    if (!addressSet.has(cust.addressHash)) {
      addressSet.add(cust.addressHash);
      nodes.push({
        id: cust.addressHash,
        label: `Address: ${cust.addressHash.replace("ADDR-HASH-", "")}`,
        type: "address",
        riskScore: cust.riskScore > 0.7 ? 0.7 : 0.1,
        val: 18,
      });
    }

    // Link Customer -> Address
    links.push({
      source: cust.customerId,
      target: cust.addressHash,
      type: "USES_ADDRESS",
    });

    // Payment Node
    if (!paymentSet.has(cust.paymentFingerprint)) {
      paymentSet.add(cust.paymentFingerprint);
      nodes.push({
        id: cust.paymentFingerprint,
        label: `Payment: ${cust.paymentFingerprint.replace("PAY-FP-", "")}`,
        type: "payment",
        riskScore: cust.riskScore > 0.7 ? 0.8 : 0.2,
        val: 18,
      });
    }

    // Link Customer -> Payment
    links.push({
      source: cust.customerId,
      target: cust.paymentFingerprint,
      type: "USES_PAYMENT",
    });
  });

  // Add a sample of orders and coupons to flesh out the visualization
  mockOrders.slice(0, 50).forEach(order => {
    // Order Node
    nodes.push({
      id: order.orderId,
      label: `Order: ${order.orderNumber} ($${order.totalAmount.toFixed(0)})`,
      type: "order",
      riskScore: order.fraudStatus === "HIGH_RISK" ? 0.9 : 0.1,
      val: 12,
    });

    // Link Customer -> Order
    links.push({
      source: order.customerId,
      target: order.orderId,
      type: "PLACED",
    });

    // Create a mock coupon for coupon abuse watch customers
    if (order.fraudStatus === "COUPON_ABUSE_REVIEW") {
      const couponId = "WELCOME50";
      if (!couponSet.has(couponId)) {
        couponSet.add(couponId);
        nodes.push({
          id: couponId,
          label: `Coupon: WELCOME50`,
          type: "coupon",
          riskScore: 0.85,
          val: 15,
        });
      }
      links.push({
        source: order.orderId,
        target: couponId,
        type: "USED_COUPON",
      });
    }
  });

  // Cross customer linkages representing the fraud rings
  // Shared Address ring CUST-001 to CUST-006
  const ringACusts = ["CUST-001", "CUST-002", "CUST-003", "CUST-004", "CUST-005", "CUST-006"];
  for (let idx = 0; idx < ringACusts.length - 1; idx++) {
    links.push({
      source: ringACusts[idx],
      target: ringACusts[idx + 1],
      type: "SHARES_ADDRESS_WITH",
    });
    links.push({
      source: ringACusts[idx],
      target: ringACusts[idx + 1],
      type: "SHARES_PAYMENT_WITH",
    });
  }

  // Shared Address ring CUST-007, CUST-011, CUST-015, CUST-019, CUST-023
  const ringCCusts = ["CUST-007", "CUST-011", "CUST-015", "CUST-019", "CUST-023"];
  for (let idx = 0; idx < ringCCusts.length - 1; idx++) {
    links.push({
      source: ringCCusts[idx],
      target: ringCCusts[idx + 1],
      type: "SHARES_ADDRESS_WITH",
    });
    links.push({
      source: ringCCusts[idx],
      target: ringCCusts[idx + 1],
      type: "SHARES_PAYMENT_WITH",
    });
  }

  // Shared Address ring CUST-008, CUST-012, CUST-016, CUST-020, CUST-024
  const ringBCusts = ["CUST-008", "CUST-012", "CUST-016", "CUST-020", "CUST-024"];
  for (let idx = 0; idx < ringBCusts.length - 1; idx++) {
    links.push({
      source: ringBCusts[idx],
      target: ringBCusts[idx + 1],
      type: "SHARES_ADDRESS_WITH",
    });
    links.push({
      source: ringBCusts[idx],
      target: ringBCusts[idx + 1],
      type: "SHARES_PAYMENT_WITH",
    });
  }

  return { nodes, links };
}
