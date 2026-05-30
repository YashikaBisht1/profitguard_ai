import axios from "axios";
import {
  mockCheckFraud,
  mockAnalyzeReturn,
  getFullMockGraph,
  FraudCheckResponse,
  GraphLink,
  GraphNode,
  ReturnAnalysisResponse,
} from "./mockData";

// Backend endpoint configuration
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BACKEND_URL = `${BASE_API_URL}/api/v1`;

const client = axios.create({
  baseURL: BACKEND_URL,
  timeout: 5000, // 5s timeout
  headers: {
    "Content-Type": "application/json",
  },
});


export interface ApiConnectionStatus {
  isConnected: boolean;
  mode: "LIVE API" | "DEMO SIMULATION";
}

export interface CustomerGraphResponse {
  customer_id: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Checks connection health to the FastAPI backend.
 */
export async function checkBackendConnection(): Promise<ApiConnectionStatus> {
  try {
    // Health endpoint on backend is at root tags or /health (from routes/health.py)
    const res = await axios.get(`${BASE_API_URL}/health`, { timeout: 1500 });
    if (res.status === 200) {
      return { isConnected: true, mode: "LIVE API" };
    }
  } catch (err) {
    // Silently catch and fall back
  }
  return { isConnected: false, mode: "DEMO SIMULATION" };
}

/**
 * Sends a Fraud Check query to backend, falls back to mock simulation on failure.
 */
export async function checkFraud(params: {
  customer_id: string;
  order_id?: string | null;
  payment_fingerprint?: string | null;
  address_hash?: string | null;
  include_graph_context?: boolean;
}): Promise<{ data: FraudCheckResponse; source: "LIVE API" | "DEMO SIMULATION" }> {
  try {
    const response = await client.post<FraudCheckResponse>("/fraud-check", params);
    return { data: response.data, source: "LIVE API" };
  } catch (err) {
    console.warn("Backend unavailable. Falling back to local Simulation Mode.", err);
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: mockCheckFraud(params),
      source: "DEMO SIMULATION",
    };
  }
}

/**
 * Sends a Return Analysis query to backend, falls back to mock simulation on failure.
 */
export async function checkReturn(params: {
  customer_id: string;
  order_id: string;
  return_request_id?: string | null;
  reason_code?: string | null;
  reason_text?: string | null;
  refund_amount?: number | null;
  include_graph_context?: boolean;
}): Promise<{ data: ReturnAnalysisResponse; source: "LIVE API" | "DEMO SIMULATION" }> {
  try {
    const response = await client.post<ReturnAnalysisResponse>("/analyze-return", params);
    return { data: response.data, source: "LIVE API" };
  } catch (err) {
    console.warn("Backend unavailable. Falling back to local Simulation Mode.", err);
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: mockAnalyzeReturn(params),
      source: "DEMO SIMULATION",
    };
  }
}

export async function getCustomerGraph(
  customerId: string
): Promise<{ data: CustomerGraphResponse; source: "LIVE API" | "DEMO SIMULATION" }> {
  try {
    const response = await axios.get<CustomerGraphResponse>(
      `${BASE_API_URL}/api/customer/${encodeURIComponent(customerId)}/graph`,
      { timeout: 5000 }
    );
    return { data: response.data, source: "LIVE API" };
  } catch (err) {
    console.warn("Customer graph API unavailable. Falling back to local Simulation Mode.", err);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        customer_id: customerId,
        ...getFullMockGraph(),
      },
      source: "DEMO SIMULATION",
    };
  }
}
