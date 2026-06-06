# MASTER REFERENCE DOCUMENT
**ProfitGuard AI GraphRAG Fraud Engine**

---

# PROJECT IDENTITY

* **Project Name:** ProfitGuard AI **[CONFIRMED FACT]**
* **Purpose:** Real-time coordinated fraud detection, return abuse analysis, and visual relationship mapping for e-commerce checkouts. **[CONFIRMED FACT]**
* **Business Objective:** Prevent merchant exploitation from coupon abuse rings, return/refund loops, and shared checkout credentials (payment sharing, address farming) by providing deterministic risk scores and LLM-generated explanations. **[CONFIRMED FACT]**
* **Technology Stack:** FastAPI, Next.js (App Router), Neo4j AuraDB (Graph Database), Groq Llama-3.3-70b-versatile, Tailwind CSS/Vanilla CSS, D3 force-graph. **[CONFIRMED FACT]**
* **Deployment Architecture:** Decoupled frontend and backend runtime services configured for deployment on Render. **[CONFIRMED FACT]**
* **Entry Points:**
  * Backend: [main.py](file:///c:/Users/bisht/profitguard_ai/backend/app/main.py) **[CONFIRMED FACT]**
  * Frontend: [page.tsx](file:///c:/Users/bisht/profitguard_ai/frontend/app/page.tsx) **[CONFIRMED FACT]**
* **Repository Structure:**
  ```
  profitguard_ai/
  ├── backend/           # FastAPI backend endpoints, models, scoring services
  ├── frontend/          # Next.js App Router workspace, styles, visual graph explorer
  └── cypher/            # Neo4j database initialization and unique constraints
  ``` **[CONFIRMED FACT]**

---

# EXECUTIVE ARCHITECTURE SUMMARY

ProfitGuard AI is designed as a hybrid deterministic and cognitive coordination detection engine. The application separates real-time checkout risk calculations from conversational reasoning. The architecture consists of three core layers:

1. **The Graph Data Store (Neo4j):** Models transitivity and credential-sharing edges among customers, orders, coupons, addresses, and payment methods. Parameterized queries compute counts of linked credentials at checkout.
2. **The Scoring and Normalization Engine:** Normalizes database counts into structured features ($[0, 1]$ bounds) and uses a rule-based weighted math model to output a deterministic risk score. It enforces that final scores are at least equal to historical risk values stored in Neo4j.
3. **The LLM RAG Layer (Groq):** Compiles deterministic scores, recommendations, and graph paths into a text prompt. An Async Groq helper invokes Llama-3.3-70b in JSON Mode to output reasoning text, shielding the system from hallucinations.

The frontend is a Next.js single-page dashboard displaying visual gauges, evidence lists, and an interactive force-directed graph rendering linked entity relationships. If the backend fails or times out, the Axios client transitions the interface into a local fallback simulation runtime to maintain responsiveness.

---

# CONFIRMED ARCHITECTURE DECISIONS

### AD-001: Separation of Real-time Scoring from Historical Risk
* **Description:** The system divides risk evaluations into two dimensions: the raw historical `customer_risk_score` stored on the database node, and the real-time `risk_score` calculated by the engine based on active checkouts. **[CONFIRMED FACT]**
* **Implications:** Enables known blacklisted entities to be denied immediately while calculating active risk scores for unflagged entities based on behavior. **[CONFIRMED FACT]**
* **Files Impacted:** [fraud_engine.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/fraud_engine.py), [fraud_service.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/fraud_service.py)
* **Dependencies:** None.
* **Status:** Implemented.

### AD-002: Resilient Offline Fallback Simulation Mode
* **Description:** The frontend Axios helper automatically catches connection drops or request timeouts and switches the client-side context to a local mock database simulator. **[CONFIRMED FACT]**
* **Implications:** Guarantees UI availability for presentations and local testing even without database connection, but degrades results to mock values. **[CONFIRMED FACT]**
* **Files Impacted:** [api.ts](file:///c:/Users/bisht/profitguard_ai/frontend/lib/api.ts), [mockData.ts](file:///c:/Users/bisht/profitguard_ai/frontend/lib/mockData.ts)
* **Dependencies:** Axios.
* **Status:** Implemented.

### AD-003: Deduplicated Resource Traversal
* **Description:** Cypher queries count unique customer IDs connected to shared credentials instead of counting the directional raw relationships, avoiding double-counting on bidirectional links. **[CONFIRMED FACT]**
* **Implications:** Solved the bug where families sharing single credit cards were incorrectly escalated to manual review due to double-counted relationships. **[CONFIRMED FACT]**
* **Files Impacted:** [repositories.py](file:///c:/Users/bisht/profitguard_ai/backend/app/graph/repositories.py)
* **Dependencies:** Neo4j Driver.
* **Status:** Implemented.

---

# FILE MAP

### [main.py](file:///c:/Users/bisht/profitguard_ai/backend/app/main.py)
* **Purpose:** Core backend entry point. **[CONFIRMED FACT]**
* **Responsibilities:** Initializes FastAPI, sets up async Neo4j lifespans, registers CORS settings, and routes endpoints. **[CONFIRMED FACT]**
* **Dependencies:** FastAPI, CORSMiddleware, neo4j_manager.
* **When to Modify:** When exposing new route prefixes or adjusting global middleware configurations.
* **Risk Level:** Low.
* **Owner Subsystem:** Backend Infrastructure.

### [repositories.py](file:///c:/Users/bisht/profitguard_ai/backend/app/graph/repositories.py)
* **Purpose:** Data access repository for Neo4j. **[CONFIRMED FACT]**
* **Responsibilities:** Runs parameterized Cypher transactions to retrieve customer contexts, fraud check data, and return histories. **[CONFIRMED FACT]**
* **Dependencies:** neo4j_manager, FraudContext, ReturnContext, CustomerGraphResponse.
* **When to Modify:** When changing query models, adding node property matches, or adjusting graph projection filters.
* **Risk Level:** High (contains database matching patterns).
* **Owner Subsystem:** Database Layer.

### [fraud_engine.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/fraud_engine.py)
* **Purpose:** Deterministic fraud scoring engine. **[CONFIRMED FACT]**
* **Responsibilities:** Weighs base risk ($40\%$), linkage ($35\%$), coupon abuse ($15\%$), and return abuse ($10\%$) to compute final risk metrics. **[CONFIRMED FACT]**
* **Dependencies:** FraudFeatures.
* **When to Modify:** When adjusting scoring weights, base overrides, or changing mapping thresholds.
* **Risk Level:** High (determines decisions).
* **Owner Subsystem:** Logic Engine.

### [api.ts](file:///c:/Users/bisht/profitguard_ai/frontend/lib/api.ts)
* **Purpose:** Frontend network connection manager. **[CONFIRMED FACT]**
* **Responsibilities:** Sends POST/GET requests to the FastAPI backend with a 15-second timeout, falling back to local simulation data on connection failures. **[CONFIRMED FACT]**
* **Dependencies:** Axios, mockData.ts.
* **When to Modify:** When adding new API parameters, routes, or altering timeout limits.
* **Risk Level:** Medium.
* **Owner Subsystem:** Frontend Network Client.

---

# DEPENDENCY REGISTRY

### Backend
* **fastapi** (Version: Unknown) — API routing and controller framework. Criticality: Core. Replacement Difficulty: High. **[CONFIRMED FACT]**
* **uvicorn** (Version: Unknown) — ASGI server process runtime. Criticality: Core. Replacement Difficulty: Low. **[CONFIRMED FACT]**
* **neo4j** (Version: Unknown) — Official Python driver for Neo4j. Criticality: Core. Replacement Difficulty: High. **[CONFIRMED FACT]**
* **groq** (Version: Unknown) — Async client for Groq API. Criticality: Core (required for AI). Replacement Difficulty: Medium. **[CONFIRMED FACT]**
* **pydantic** (Version: Unknown) — Runtime typing and configuration validation. Criticality: Core. Replacement Difficulty: High. **[CONFIRMED FACT]**

### Frontend
* **next** (Version: 16.2.6) — App router framework. Criticality: Core. Replacement Difficulty: High. **[CONFIRMED FACT]**
* **axios** (Version: Unknown) — HTTP client. Criticality: Core. Replacement Difficulty: Low. **[CONFIRMED FACT]**
* **force-graph** (Version: Unknown) — Canvas node explorer. Criticality: Core (required for Explorer). Replacement Difficulty: High. **[CONFIRMED FACT]**

---

# PROMPT REGISTRY

### Prompt ID: PR-001 (Groq JSON Analysis Prompt)
* **File Location:** [fraud.py](file:///c:/Users/bisht/profitguard_ai/backend/app/prompts/fraud.py#L46-L104) **[CONFIRMED FACT]**
* **Purpose:** Directs Groq Llama to generate a structured analysis justifying the engine's computed risk score and decision. **[CONFIRMED FACT]**
* **Variables:** `computed_decision`, `computed_risk_score`, `graph_rag_context`, `evidence`, `recommendations`. **[CONFIRMED FACT]**
* **Dynamic Inputs:** Raw database contexts serialized as JSON string. **[CONFIRMED FACT]**
* **Output Format:** JSON object containing `decision`, `confidence`, `risk_score`, `flags`, `graph_evidence`, `reasoning`, and `alternatives`. **[CONFIRMED FACT]**
* **Security Concerns:** Input narrative fields (`reason_text`) passed directly to LLM context can trigger prompt injection. **[RISK]**
* **Dependencies:** groq python sdk.
* **Status:** Verified and active.
* **Snippet:**
  ```
  The decision and risk score are already computed by the fraud engine. Your task is to explain and justify those results using the supplied evidence. Do not override or change the risk score or decision.
  ``` **[CONFIRMED FACT]**

---

# API ROUTE REGISTRY

### POST `/api/v1/fraud-check`
* **Method:** POST **[CONFIRMED FACT]**
* **Path:** `/api/v1/fraud-check` **[CONFIRMED FACT]**
* **Handler:** `fraud_check` in [routes/fraud.py](file:///c:/Users/bisht/profitguard_ai/backend/app/routes/fraud.py#L20-L37) **[CONFIRMED FACT]**
* **Request Schema:** `FraudCheckRequest` (Pydantic model) **[CONFIRMED FACT]**
* **Response Schema:** `FraudCheckResponse` (Pydantic model) **[CONFIRMED FACT]**
* **Authentication:** None. **[CONFIRMED FACT]**
* **Dependencies:** FraudService, repositories.py, llm_service.py.
* **Risk Level:** High (core checkout analyzer).

### POST `/api/v1/analyze-return`
* **Method:** POST **[CONFIRMED FACT]**
* **Path:** `/api/v1/analyze-return` **[CONFIRMED FACT]**
* **Handler:** `analyze_return` in [routes/fraud.py](file:///c:/Users/bisht/profitguard_ai/backend/app/routes/fraud.py#L39-L56) **[CONFIRMED FACT]**
* **Request Schema:** `ReturnAnalysisRequest` **[CONFIRMED FACT]**
* **Response Schema:** `ReturnAnalysisResponse` **[CONFIRMED FACT]**
* **Authentication:** None. **[CONFIRMED FACT]**
* **Dependencies:** ReturnAnalysisService, return_service.py.
* **Risk Level:** Medium.

### GET `/api/customer/{customer_id}/graph`
* **Method:** GET **[CONFIRMED FACT]**
* **Path:** `/api/customer/{customer_id}/graph` **[CONFIRMED FACT]**
* **Handler:** `customer_graph` in [routes/customer.py](file:///c:/Users/bisht/profitguard_ai/backend/app/routes/customer.py) **[CONFIRMED FACT]**
* **Request Schema:** None (URL path string parameter) **[CONFIRMED FACT]**
* **Response Schema:** `CustomerGraphResponse` **[CONFIRMED FACT]**
* **Authentication:** None. **[CONFIRMED FACT]**
* **Dependencies:** FraudGraphRepository.
* **Risk Level:** Low.

---

# DATA FLOW REGISTRY

### Trace 1: Checkout Fraud Scanner Flow
1. **User Action:** Customer inputs checkout credentials in the Coordinated Fraud Scanner form and clicks search.
2. **Frontend Handler:** `runScan` in [page.tsx](file:///c:/Users/bisht/profitguard_ai/frontend/app/fraud-detection/page.tsx#L44) triggers an async call to `checkFraud`.
3. **API Call:** Axios client makes a POST request to `http://localhost:8000/api/v1/fraud-check`.
4. **Backend Router:** FastAPI passes request properties to `FraudService.check_fraud`.
5. **Database Transaction:** `repositories.py` issues a parameterized Cypher query matching the customer and counting their shared payment/address resources.
6. **Feature Extraction:** Normalized metrics are mapped to $[0, 1]$ risk levels inside `feature_extractor.py`.
7. **Rules Engine Evaluation:** `FraudScoringEngine` computes the final score and determines the recommended action.
8. **LLM Generation:** The Groq API is called with the GraphRAG context; the parsed JSON reasoning is generated and returned to FastAPI.
9. **UI Rendering:** React updates components, drawing the radial risk gauge and rendering the AI reasoning block.

---

# NEO4J SCHEMA

```
(Customer {customerId: String, riskScore: Float, accountStatus: String})-[:USES_PAYMENT]->(PaymentMethod {paymentFingerprint: String})
(Customer)-[:USES_ADDRESS]->(Address {addressHash: String})
(Customer)-[:SHARES_PAYMENT_WITH {score: Float}]-(Customer)
(Customer)-[:SHARES_ADDRESS_WITH {score: Float}]-(Customer)
(Customer)-[:PLACED]->(Order)-[:USED]->(Coupon {campaignId: String})
(Order)-[:RETURNED]->(ReturnRequest {returnStatus: String, refundAmount: Float})
```

---

# GRAPH FACTS

* **Confirmed Labels:** `Customer`, `Address`, `PaymentMethod`, `Order`, `Coupon`, `ReturnRequest`, `Product`, `Category`. **[CONFIRMED FACT]**
* **Confirmed Relationships:** `USES_ADDRESS`, `USES_PAYMENT`, `SHARES_PAYMENT_WITH`, `SHARES_ADDRESS_WITH`, `PLACED`, `USED`, `RETURNED`, `CONTAINS`, `BELONGS_TO`. **[CONFIRMED FACT]**
* **Traversal Patterns:** Customer node to credential node to connected customer nodes (2-hop matching). **[CONFIRMED FACT]**
* **Indexes:** Impliciting B-tree indexes exist on `Customer.customerId`, `Order.orderId`, and `Product.productId`. **[CONFIRMED FACT]**
* **Vector Search / Semantic Query Usage:** **None.** GraphRAG is compiled directly from Cypher query patterns; no semantic search is implemented. **[CONFIRMED FACT]**

---

# AI SYSTEM REGISTRY

* **Provider:** Groq API. **[CONFIRMED FACT]**
* **Model:** Configured via settings (defaults to `llama-3.3-70b-versatile`). **[CONFIRMED FACT]**
* **Temperature:** `0.1` (low temperature to prevent random output variations). **[CONFIRMED FACT]**
* **Token Management:** Truncated Cypher array slices `[0..10]` keep input payloads small, well within Llama token boundaries. **[CONFIRMED FACT]**
* **Streaming:** Enabled: No. Synchronous blocking wait is used. **[CONFIRMED FACT]**
* **Schema Validation & Error Recovery:** Pydantic validators intercept invalid JSON strings; up to 2 auto-repair queries are appended on syntax errors before reverting to static fallback outputs (`_fallback`). **[CONFIRMED FACT]**

---

# SECURITY REVIEW

* **Authentication:** None. Frontend and backend communicate without request validation tokens or API signatures. **[RISK]**
* **Input Validation:** Backend validation is handled at boundaries via Pydantic model schemas. **[CONFIRMED FACT]**
* **Injection Risks:** Parameterized Cypher queries protect Neo4j from direct injection, but raw text narratives (`reason_text`) passed directly into the LLM context present prompt injection risks. **[RISK]**
* **Secrets Management:** Kept in local `.env` files (e.g., `NEO4J_PASSWORD`, `GROQ_API_KEY`). **[CONFIRMED FACT]**

---

# PERFORMANCE REVIEW

* **API Request Timeout:** Set to 15 seconds (`15000` ms) on the frontend Axios client to prevent timeout fallbacks on slow initial GraphRAG runs. **[CONFIRMED FACT]**
* **Database Query Performance:** Matched keys on `PaymentMethod(paymentFingerprint)` and `Address(addressHash)` lack indexes, resulting in full-label scans on large databases. **[RISK]**

---

# RISKS & GAPS

### RG-001: Missing Database Indexing on Matched Keys
* **Description:** Neo4j database lacks indexes on `paymentFingerprint` and `addressHash`, resulting in slow table scans. **[CONFIRMED FACT]**
* **Severity:** High (degrades performance at scale).
* **Mitigation:** Execute index creation migrations in `constraints.cypher`.
* **Status:** Documented in roadmap.

### RG-002: Prompt Injection Vulnerability in Return Narratives
* **Description:** User reason text narratives in return requests are passed straight into the LLM context. **[CONFIRMED FACT]**
* **Severity:** Medium.
* **Mitigation:** Implement regex-based validation helpers to strip control tokens.
* **Status:** Open.

---

# TECH DEBT BACKLOG

### TD-001: Legacy Unused Router File
* **Description:** The backend contains an unused router script [routes/analyze.py](file:///c:/Users/bisht/profitguard_ai/backend/app/routes/analyze.py).
* **Risk:** Low (code clutter).
* **Priority:** Low.
* **Effort:** Low (delete file).

---

# FEATURE ROADMAP

### Phase A: Critical Fixes
* **FEATURE: Database Query Performance Indexes**
  * **Goal:** Create B-tree indexes on matched property keys in Neo4j.
  * **Files Impacted:** [constraints.cypher](file:///c:/Users/bisht/profitguard_ai/cypher/constraints.cypher) (modify).
  * **Effort:** Low.
  * **Risk:** Low.

### Phase B: High-Value, Low-Effort Features
* **FEATURE: Email Laundering Node Decoupling**
  * **Goal:** Decouple `Email` attributes into separate nodes to spot dot-trick registrations.
  * **Files Impacted:** [repositories.py](file:///c:/Users/bisht/profitguard_ai/backend/app/graph/repositories.py), [feature_extractor.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/feature_extractor.py) (modify).
  * **Graph changes:** Introduce `(Email)` node and `[:HAS_EMAIL]` relationship.
  * **Effort:** Medium.

### Phase C: Medium-Effort Features (Security, Signals & Temporal Logs)
* **FEATURE: Device Fingerprint Association (AD-004)**
  * **Goal:** Collect and link canvas/hardware fingerprints to identify fraud rings operating from a single machine.
  * **Business Value:** High (stops multi-account device farms).
  * **Technical Value:** High (bypasses standard IP/email laundering evasion).
  * **Files Impacted:** [page.tsx](file:///c:/Users/bisht/profitguard_ai/frontend/app/fraud-detection/page.tsx) (modify), [repositories.py](file:///c:/Users/bisht/profitguard_ai/backend/app/graph/repositories.py) (modify), [feature_extractor.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/feature_extractor.py) (modify).
  * **Graph Changes:** Introduce `(Device {deviceFingerprint: String})` nodes and `[:USES_DEVICE]` relationships.
  * **Effort:** Medium.
  * **Risk:** Low (uses standard client-side fingerprinting).

* **FEATURE: Temporal Resource Velocity Engine**
  * **Goal:** Evaluate the speed of resource sharing (e.g., number of new accounts linked to a payment card in the last hour).
  * **Business Value:** High (prevents automated bot sign-ups).
  * **Technical Value:** Medium (adds time-series context to graph queries).
  * **Files Impacted:** [repositories.py](file:///c:/Users/bisht/profitguard_ai/backend/app/graph/repositories.py) (modify), [feature_extractor.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/feature_extractor.py) (modify).
  * **Graph Changes:** Add `since` timestamp properties to `[:USES_PAYMENT]` and `[:USES_ADDRESS]` relationships.
  * **Effort:** Medium.
  * **Risk:** Medium (requires robust clock synchronization).

* **FEATURE: API HMAC Request Signatures**
  * **Goal:** Secure the FastAPI backend from unauthorized direct scanning and data scraping.
  * **Business Value:** Medium.
  * **Technical Value:** High (mitigates denial-of-service and pricing calculation abuse).
  * **Files Impacted:** [main.py](file:///c:/Users/bisht/profitguard_ai/backend/app/main.py) (modify), [api.ts](file:///c:/Users/bisht/profitguard_ai/frontend/lib/api.ts) (modify).
  * **Effort:** Low.
  * **Risk:** Low.

### Phase D: Long-Term Advanced Features (Clustering & Cognitive Search)
* **FEATURE: Dynamic Weight Calibration Admin Panel**
  * **Goal:** Enable live updates of rule scoring weights and decision thresholds without code redeployment.
  * **Business Value:** High (allows operations team to tune parameters rapidly).
  * **Technical Value:** Medium.
  * **Files Impacted:** [fraud_engine.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/fraud_engine.py) (modify), frontend/app/admin/weights/page.tsx (new).
  * **Graph Changes:** Add `(SystemConfig)` node storing active weights JSON.
  * **Effort:** Medium.
  * **Risk:** Medium (improper weight configurations can block checkout).

* **FEATURE: Neo4j GDS Weakly Connected Components (WCC) Community Clustering**
  * **Goal:** Automatically group customers into fraud ring community IDs using community detection algorithms.
  * **Business Value:** High (flag members of hidden networks early).
  * **Technical Value:** Very High.
  * **Files Impacted:** [repositories.py](file:///c:/Users/bisht/profitguard_ai/backend/app/graph/repositories.py) (modify), [feature_extractor.py](file:///c:/Users/bisht/profitguard_ai/backend/app/services/feature_extractor.py) (modify).
  * **Graph Changes:** Add `communityId` property to `Customer` nodes.
  * **Dependencies:** Neo4j Graph Data Science (GDS) library.
  * **Effort:** High.
  * **Risk:** High (GDS library requires paid tier or AuraDS migration).

* **FEATURE: Hybrid GraphRAG Semantic Search for Refund Disputations**
  * **Goal:** Use Neo4j Vector Indexes to compare refund reasons against known social engineering templates (e.g., "empty box").
  * **Business Value:** High (reduces returns leakage).
  * **Technical Value:** High.
  * **Files Impacted:** backend/app/services/return_service.py (modify), [fraud.py](file:///c:/Users/bisht/profitguard_ai/backend/app/prompts/fraud.py) (modify).
  * **Graph Changes:** Enable vector indexes on `ReturnRequest.reasonText` embeddings.
  * **Dependencies:** Sentence-transformers or OpenAI/Groq embedding service.
  * **Effort:** Medium.
  * **Risk:** Low.

---

# OPEN QUESTIONS

### OQ-001: GDS Library Support on AuraDB Free Tier
* **Why it matters:** Enabling the Weakly Connected Components (WCC) clustering algorithm requires the Graph Data Science library.
* **Potential Impact:** If GDS is unsupported on the customer's active Neo4j instance tier, WCC calculations will fail, requiring a migration to AuraDS or manual query-based clustering algorithms.
* **Blocking Level:** High (blocks Phase D implementation).

---

# PHASE SUMMARIES

### Phase 1: Structure Map & General Observations
* **Executive Summary:** Established the baseline file layout and structural categories across backend/frontend directories. Identified entry points and mapped the offline simulation fallback mechanisms.

### Phase 2: Component Deep Dive
* **Executive Summary:** Audited React pages, backend scoring logic, and the Groq LLM validation pipeline. Documented local page re-renders, hardcoded UI details, and input validation gaps.

### Phase 3: Neo4j Graph Layer Audit
* **Executive Summary:** Reconstructed the Neo4j schema layout and cataloged Cypher queries. Identified missing database indexes on payment fingerprints and address hashes.

### Phase 4: Feature Roadmap & Implementation Plan
* **Executive Summary:** Formulated a phased technical roadmap resolving performance indexes (Phase A), email lumping nodes (Phase B), hardware fingerprints (Phase C), and graph clustering (Phase D).

---

# ARCHITECTURE EVOLUTION

```
[Initial State] -> [Next.js Web Page] --> [FastAPI Backend] ---> [Neo4j AuraDB] (No Indexes)
                                            |
                                            v
                                        [Groq LLM]

[Future State]  -> [Client Fingerprint] -> [FastAPI Backend] --> [Neo4j AuraDS] (Pre-computed WCC)
                                            |
                                            v
                                        [Groq JSON]
```

---

# IMPLEMENTATION PRIORITIES

1. **Create indexes on `paymentFingerprint` and `addressHash`:** Resolves database lookup latencies. **[Priority: High]**
2. **Implement Input Sanitization on Text Narratives:** Secures LLM endpoint from injection vectors. **[Priority: High]**
3. **Decouple Emails to separate nodes (Phase B):** Improves coupon abuse detection rates. **[Priority: Medium]**
