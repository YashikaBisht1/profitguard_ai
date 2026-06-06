"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { checkFraud } from "../../lib/api";
import { FraudCheckResponse } from "../../lib/mockData";

// Wrapper component to use useSearchParams inside Suspense
function FraudDetectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [paymentFingerprint, setPaymentFingerprint] = useState("");
  const [addressHash, setAddressHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FraudCheckResponse | null>(null);
  const [resultSource, setResultSource] = useState<"LIVE API" | "DEMO SIMULATION" | null>(null);

  // Quick select examples matching seed data
  const testCases = [
    { label: "Avery Stone (Ring A Leader)", id: "CUST-001", type: "FRAUD_RING" },
    { label: "Gray Harper (Coupon Abuse)", id: "CUST-007", type: "COUPON" },
    { label: "Hayden Shah (Return Abuse)", id: "CUST-008", type: "RETURN" },
    { label: "Owen King (Clean Account)", id: "CUST-041", type: "CLEAN" },
  ];

  useEffect(() => {
    const custIdParam = searchParams.get("customer_id");
    if (custIdParam) {
      setCustomerId(custIdParam);
      runScan(custIdParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    runScan(customerId);
  };

  const runScan = async (idToScan: string) => {
    setIsLoading(true);
    setResult(null);

    // Fetch via api.ts wrapper
    const response = await checkFraud({
      customer_id: idToScan,
      order_id: orderId || null,
      payment_fingerprint: paymentFingerprint || null,
      address_hash: addressHash || null,
      include_graph_context: true,
    });

    setResult(response.data);
    setResultSource(response.source);
    setIsLoading(false);
  };

  const loadTestCase = (id: string) => {
    setCustomerId(id);
    setOrderId("");
    setPaymentFingerprint("");
    setAddressHash("");
    runScan(id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Coordinated Fraud Scanner</h2>
        <p className="text-slate-400 text-sm">
          Run GraphRAG evaluations on customers to detect linked payments, address farms, and device fingerprints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input Panel */}
        <div className="glass-panel rounded-xl p-5 flex flex-col gap-5 h-fit">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              SCAN PARAMETERS
            </h3>
            <p className="text-[11px] text-slate-400">Trigger entity inspection across Neo4j nodes</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Customer ID (Required)</label>
              <input
                type="text"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                placeholder="e.g. CUST-001"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Order ID (Optional)</label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. ORD-0001"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Payment Fingerprint (Optional)</label>
              <input
                type="text"
                value={paymentFingerprint}
                onChange={e => setPaymentFingerprint(e.target.value)}
                placeholder="e.g. PAY-FP-FRAUD-RING-A"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Address Hash (Optional)</label>
              <input
                type="text"
                value={addressHash}
                onChange={e => setAddressHash(e.target.value)}
                placeholder="e.g. ADDR-HASH-FRAUD-RING-A"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-850 disabled:text-indigo-400 transition-colors rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ANALYZING NODES...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  EXECUTE RISK SCAN
                </>
              )}
            </button>
          </form>

          {/* Test Scenarios List */}
          <div className="border-t border-white/5 pt-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2 font-mono">
              Demo Seed Test Cases
            </span>
            <div className="flex flex-col gap-1.5">
              {testCases.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => loadTestCase(tc.id)}
                  className="w-full text-left text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded bg-slate-900/40 border border-white/5 hover:border-slate-800 transition-colors font-mono flex justify-between items-center cursor-pointer"
                >
                  <span>{tc.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300">
                    {tc.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scan Results Console */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {isLoading && (
            <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[400px]">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <span className="absolute inset-0 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                <span className="absolute inset-2 border-4 border-indigo-300/10 border-b-indigo-300 rounded-full animate-spin [animation-duration:1.5s]" />
                <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5V9M12 11c1.744 2.772 2.753 6.054 2.753 9.571m-3.44-2.04l-.054-.09A13.916 13.916 0 0015 11.5V9M1.751 3C1.751 2.227 2.378 1.6 3.151 1.6h17.698c.773 0 1.4.627 1.4 1.4v13.52c0 .773-.627 1.4-1.4 1.4H3.151c-.773 0-1.4-.627-1.4-1.4V3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-mono font-bold text-sm tracking-widest">
                  RUNNING GRAPHRAG RISK INSPECTION...
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  Querying database entity links and shared payment fingerprints
                </p>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[400px]">
              <div className="p-4 rounded-full bg-slate-900 border border-white/5">
                <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-slate-300 font-mono text-sm tracking-wider">
                  AWAITING SCAN INPUT
                </h4>
                <p className="text-slate-500 text-xs mt-1">
                  Input a Customer ID or select a Demo Seed Test Case to trigger GraphRAG threat analysis.
                </p>
              </div>
            </div>
          )}

          {!isLoading && result && (
            <div className="flex flex-col gap-6">
              {/* Score and Decision Header */}
              <div className="glass-panel rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Radial score badge */}
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* background circle */}
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        className="stroke-slate-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* indicator circle */}
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        style={{
                          strokeDasharray: 2 * Math.PI * 38,
                          strokeDashoffset: 2 * Math.PI * 38 * (1 - result.risk_score),
                        }}
                        className={`transition-all duration-1000 ${
                          result.risk_score >= 0.75
                            ? "stroke-rose-500"
                            : result.risk_score >= 0.40
                            ? "stroke-amber-500"
                            : "stroke-emerald-500"
                        }`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center flex flex-col">
                      <span className="text-2xl font-black text-white">
                        {Math.round(result.risk_score * 100)}%
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest leading-none">
                        RISK SCORE
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs">Customer ID:</span>
                      <strong className="text-white font-mono text-sm">{result.customer_id}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">({resultSource})</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border capitalize ${
                        result.risk_band === "high"
                          ? "bg-rose-950/40 text-rose-400 border-rose-500/20 glow-rose"
                          : result.risk_band === "medium"
                          ? "bg-amber-950/40 text-amber-400 border-amber-500/20 glow-amber"
                          : "bg-emerald-950/40 text-emerald-400 border-emerald-500/20 glow-emerald"
                      }`}>
                        {result.risk_band.toUpperCase()} RISK
                      </span>

                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                        result.decision === "approve"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                          : result.decision === "step_up_verification"
                          ? "bg-amber-950/40 text-amber-400 border-amber-500/20"
                          : "bg-rose-950/40 text-rose-400 border-rose-500/20"
                      }`}>
                        DECISION: {result.decision.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-right items-end">
                  <span className="text-[10px] text-slate-500 font-mono">CONFIDENCE INDEX</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 font-mono">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  <Link
                    href={`/customer-graph-explorer?search=${result.customer_id}`}
                    className="mt-2 text-[10px] text-indigo-400 font-mono hover:text-indigo-300 flex items-center gap-1 border border-indigo-500/20 bg-indigo-950/20 px-2 py-1 rounded"
                  >
                    EXPLORE RELATIONSHIPS
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Score Breakdown Panel */}
              {result.score_breakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Linkage Card */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-2 border border-white/5 bg-slate-900/20">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>LINKAGE RISK</span>
                      <span className="text-white font-bold">{Math.round((result.score_breakdown.linkage || 0) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full"
                        style={{ width: `${(result.score_breakdown.linkage || 0) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Connection strength to shared payment/address entities.</p>
                  </div>

                  {/* Coupon Abuse Card */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-2 border border-white/5 bg-slate-900/20">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>COUPON ABUSE RISK</span>
                      <span className="text-white font-bold">{Math.round((result.score_breakdown.coupon_abuse || 0) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-1.5 rounded-full"
                        style={{ width: `${(result.score_breakdown.coupon_abuse || 0) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Ratio of orders associated with coupon campaigns.</p>
                  </div>

                  {/* Returns Card */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col gap-2 border border-white/5 bg-slate-900/20">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>RETURN RISK</span>
                      <span className="text-white font-bold">{Math.round((result.score_breakdown.returns || 0) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${(result.score_breakdown.returns || 0) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Ratio of high-risk or flagged returns.</p>
                  </div>
                </div>
              )}

              {/* AI Explanation Card */}
              <div className="glass-panel rounded-xl p-5 border border-indigo-500/10">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                      AI EXPLANATION LOG (GraphRAG)
                    </h3>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">DEEPSEEK-R1-DISTILL</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-xs text-indigo-300 leading-relaxed shadow-inner">
                  <span className="terminal-cursor text-white font-semibold">sys_analyst@profitguard_ai:~$ </span>
                  {result.reasoning}
                </div>
              </div>

              {/* Graph Evidence Card */}
              {result.graph_evidence && result.graph_evidence.length > 0 && (
                <div className="glass-panel rounded-xl p-5 border border-emerald-500/10">
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
                    CONNECTED ENTITY EVIDENCE (GraphRAG)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.graph_evidence.map((evidenceText, idx) => (
                      <div key={idx} className="p-3 rounded bg-emerald-950/20 border border-emerald-500/10 flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                        <span>{evidenceText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence & Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Evidence List */}
                <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-white/5 pb-2">
                    RISK EVIDENCE TRAIL
                  </h3>
                  {result.evidence.length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center font-mono">
                      NO Suspicious Connections Found.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {result.evidence.map((ev, idx) => {
                        const sevColors =
                          ev.severity === "high"
                            ? "bg-rose-950/30 text-rose-400 border-rose-500/20"
                            : ev.severity === "medium"
                            ? "bg-amber-950/30 text-amber-400 border-amber-500/20"
                            : "bg-cyan-950/30 text-cyan-400 border-cyan-500/20";
                        return (
                          <div key={idx} className="p-3 rounded bg-slate-900/30 border border-white/5 flex gap-3">
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border h-fit shrink-0 uppercase ${sevColors}`}>
                              {ev.severity}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-slate-200 capitalize">
                                {ev.type.replace(/_/g, " ")}
                              </span>
                              <p className="text-[11px] text-slate-400">{ev.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-white/5 pb-2">
                    RECOMMENDED DISPOSITION
                  </h3>
                  <div className="flex flex-col gap-3">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 rounded bg-slate-900/30 border border-white/5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-indigo-400 font-mono uppercase">
                          Action: {rec.action.replace(/_/g, " ")}
                        </span>
                        <p className="text-[11px] text-slate-400">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Raw Graph Context Dump */}
              <div className="glass-panel rounded-xl p-5">
                <h3 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider mb-3">
                  Traversed Graph Context Summary (Cypher Response)
                </h3>
                <pre className="bg-slate-950 p-4 rounded-lg border border-white/5 text-[10px] text-slate-400 font-mono overflow-x-auto">
                  {JSON.stringify(result.graph_context, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FraudDetectionContent />
    </Suspense>
  );
}
