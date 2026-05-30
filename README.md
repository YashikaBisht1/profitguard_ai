# ProfitGuard AI — Ecommerce Fraud Detection Console

ProfitGuard AI is an enterprise-grade ecommerce fraud detection and analytics platform. It leverages **GraphRAG (Graph-based Retrieval-Augmented Generation)**, **Neo4j graph databases**, and **FastAPI** to identify risk networks, return abuses, coupon exploitation, and linked-entity fraud rings.

---

## Key Features

1. **Linked Customer Graph Explorer (`/customer-graph-explorer`)**
   - Visualize and navigate connections between customers, orders, billing/shipping addresses, payment methods, and coupons.
   - Filter views by connection type (All, Shared Payments, Shared Addresses, Fraud Links).
   - High-fidelity 2D canvas force-directed graph with interactive zoom, pan, and search focus.

2. **AI Fraud Detection Scan (`/fraud-detection`)**
   - Real-time account risk scoring (Low, Medium, High).
   - Trace linked accounts, suspicious transaction spikes, and fingerprint mismatches.
   
3. **Refund & Return Pattern Analysis (`/analyze-return`)**
   - Run AI GraphRAG scans on orders to flag return fraud (e.g., wardrobing, empty box claims, serial refunders).
   - Process refund invoices with context-aware decision support.

4. **Executive Dashboard (`/` & `/dashboard`)**
   - High-level KPIs: Active fraud alerts, pending reviews, risk distributions, and flagged transactional volumes.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS 4, glassmorphism, responsive dashboard grids
- **Graph Canvas**: Core `force-graph` package (dynamic client-side canvas renderer)
- **Charts**: Recharts (for analytics dashboards)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: Neo4j (Graph Database)
- **AI/LLM Engine**: Groq API (for GraphRAG-based pattern interpretation and return explanations)
- **Settings**: Pydantic v2

---

## Project Structure

```
profitguard_ai/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── graph/            # Neo4j connection and repository interfaces
│   │   ├── models/           # Pydantic schema validation
│   │   ├── prompts/          # Structured LLM templates
│   │   ├── routes/           # FastAPI router endpoints
│   │   ├── services/         # Fraud detection, LLM, and return analysis logic
│   │   └── utils/            # Config, logging, and scoring helpers
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment configuration template
├── cypher/                   # Database scripts
│   └── seed.cypher           # Cypher script to spin up seed schema and demo nodes
├── frontend/                 # Next.js React frontend
│   ├── app/                  # Application pages (Routing layout)
│   ├── lib/                  # Fetching API and fallback mock data
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript configuration
└── .gitignore                # Root gitignore rules
```

---

## Getting Started

### 1. Database Setup (Neo4j)
Spin up a Neo4j database (locally via Desktop, Community Edition, or Sandbox). 
Execute the Cypher queries in [seed.cypher](file:///c:/Users/bisht/profitguard_ai/cypher/seed.cypher) to populate the database with graph mock networks:
- Customer nodes (`CUST-001`, `CUST-007`, etc.)
- Orders, physical addresses, credit card numbers, and coupons.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment parameters in a new `.env` file (copying from `.env.example`):
   ```ini
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   GROQ_API_KEY=your_groq_key
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend documentation will be accessible at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web console at [http://localhost:3000](http://localhost:3000).
   *Note: If the backend is not connected, the UI automatically falls back to **Demo Simulation mode** to allow visual explorations of the graph networks.*

### 4. Deploying to Render
The backend is pre-configured for automated deployment to Render using the Blueprint architecture:
1. Create a **Blueprint** service on the Render Dashboard.
2. Link this GitHub repository. Render will parse [render.yaml](file:///c:/Users/bisht/profitguard_ai/render.yaml) and automatically configure the Python environment, build commands, and start scripts.
3. Provide the environment values when prompted: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, and `GROQ_API_KEY`.
4. Your API endpoints will be live at `https://your-service-name.onrender.com/docs`.
