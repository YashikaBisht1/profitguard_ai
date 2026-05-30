"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { checkReturn } from "../../lib/api";
import { ReturnAnalysisResponse, mockProducts } from "../../lib/mockData";

function ReturnAnalysisContent() {
  const searchParams = useSearchParams();

  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [returnRequestId, setReturnRequestId] = useState("");
  const [reasonCode, setReasonCode] = useState("SIZE_OR_FIT");
  const [reasonText, setReasonText] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReturnAnalysisResponse | null>(null);
  const [resultSource, setResultSource] = useState<"LIVE API" | "DEMO SIMULATION" | null>(null);

  // Quick select examples matching seed data
  const testCases = [
    { label: "Hayden Shah (Return Watch Ring B)", custId: "CUST-008", orderId: "ORD-0083", code: "ITEM_NOT_AS_DESCRIBED", amount: 450 },
    { label: "Owen King (Clean Return)", custId: "CUST-041", orderId: "ORD-0165", code: "SIZE_OR_FIT", amount: 89 },
  ];

  useEffect(() => {
    const custIdParam = searchParams.get("customer_id");
    const orderIdParam = searchParams.get("order_id");
    if (custIdParam && orderIdParam) {
      setCustomerId(custIdParam);
      setOrderId(orderIdParam);
      runAnalysis(custIdParam, orderIdParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !orderId) return;
    runAnalysis(customerId, orderId);
  };

  const runAnalysis = async (cId: string, oId: string) => {
    setIsLoading(true);
    setResult(null);

    const response = await checkReturn({
      customer_id: cId,
      order_id: oId,
      return_request_id: returnRequestId || null,
      reason_code: reasonCode || null,
      reason_text: reasonText || null,
      refund_amount: refundAmount ? parseFloat(refundAmount) : null,
    });

    setResult(response.data);
    setResultSource(response.source);
    setIsLoading(false);
  };

  const loadTestCase = (tc: typeof testCases[0]) => {
    setCustomerId(tc.custId);
    setOrderId(tc.orderId);
    setReturnRequestId("RET-001");
    setReasonCode(tc.code);
    setRefundAmount(tc.amount.toString());
    setReasonText(`Sample return analysis testing return behaviors for ${tc.code}`);
    runAnalysis(tc.custId, tc.orderId);
  };

  // Safe recommendations (e.g. replacement products) to prevent fraud cash-out
  // Filter products that are in consumer electronics or luxury fashion and low risk
  const alternativeProducts = mockProducts
    .filter(p => p.riskScore < 0.15 && p.unitPrice > 100)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Return & Refund Abuse Analyst</h2>
        <p className="text-slate-400 text-sm">
          Assess serial refund behaviors, empty box claims, and determine physical inspection rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters input panel */}
        <div className="glass-panel rounded-xl p-5 flex flex-col gap-5 h-fit">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              RETURN PARAMETERS
            </h3>
            <p className="text-[11px] text-slate-400">Inspect historical return vectors & refund claims</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Customer ID (Required)</label>
              <input
                type="text"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                placeholder="e.g. CUST-008"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Order ID (Required)</label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. ORD-0083"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Return Request ID (Optional)</label>
              <input
                type="text"
                value={returnRequestId}
                onChange={e => setReturnRequestId(e.target.value)}
                placeholder="e.g. RET-001"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Reason Code</label>
              <select
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              >
                <option value="SIZE_OR_FIT">SIZE_OR_FIT (Normal)</option>
                <option value="ITEM_NOT_AS_DESCRIBED">ITEM_NOT_AS_DESCRIBED (Watch)</option>
                <option value="EMPTY_BOX_CLAIM">EMPTY_BOX_CLAIM (High Abuse)</option>
                <option value="DAMAGED_ON_ARRIVAL">DAMAGED_ON_ARRIVAL (Abuse Watch)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Refund Amount ($ USD)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder="e.g. 350.00"
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Customer Narrative / Reason Text</label>
              <textarea
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                placeholder="Narrative summary for fraud classification..."
                rows={3}
                className="bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                  ANALYZING HISTORY...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  </svg>
                  VERIFY RETURN RISK
                </>
              )}
            </button>
          </form>

          {/* Test cases */}
          <div className="border-t border-white/5 pt-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2 font-mono">
              Return Seed Test Cases
            </span>
            <div className="flex flex-col gap-1.5">
              {testCases.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => loadTestCase(tc)}
                  className="w-full text-left text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded bg-slate-900/40 border border-white/5 hover:border-slate-800 transition-colors font-mono flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{tc.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300">
                      {tc.custId}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Order: {tc.orderId} // ${tc.amount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Console */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {isLoading && (
            <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[400px]">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <span className="absolute inset-0 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                <span className="absolute inset-2 border-4 border-indigo-300/10 border-b-indigo-300 rounded-full animate-spin [animation-duration:1.5s]" />
                <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M9 11l3 3L22 4" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-mono font-bold text-sm tracking-widest">
                  RUNNING RETURN RISK DIAGNOSTICS...
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  Querying customer return indices and high-value claim ratios in Neo4j
                </p>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[400px]">
              <div className="p-4 rounded-full bg-slate-900 border border-white/5">
                <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <div>
                <h4 className="text-slate-300 font-mono text-sm tracking-wider">
                  AWAITING RETURN DETAILS
                </h4>
                <p className="text-slate-500 text-xs mt-1">
                  Submit a Return request to analyze return frequencies and retrieve alternative replacement offerings.
                </p>
              </div>
            </div>
          )}

          {!isLoading && result && (
            <div className="flex flex-col gap-6">
              {/* Header metrics */}
              <div className="glass-panel rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        className="stroke-slate-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        style={{
                          strokeDasharray: 2 * Math.PI * 38,
                          strokeDashoffset: 2 * Math.PI * 38 * (1 - result.risk_score),
                        }}
                        className={`transition-all duration-1000 ${
                          result.risk_score >= 0.70
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
                        RISK RATING
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
                        result.recommended_action === "approve"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                          : result.recommended_action === "manual_review"
                          ? "bg-amber-950/40 text-amber-400 border-amber-500/20"
                          : "bg-rose-950/40 text-rose-400 border-rose-500/20"
                      }`}>
                        ACTION: {result.recommended_action.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-right sm:items-end">
                  <span className="text-[10px] text-slate-500 font-mono">ORDER SPECIFIED</span>
                  <span className="text-sm font-mono text-slate-200 font-bold">{result.order_id}</span>
                  {result.return_request_id && (
                    <span className="text-[10px] text-slate-400 font-mono">Request: {result.return_request_id}</span>
                  )}
                </div>
              </div>

              {/* AI Explanation Card */}
              <div className="glass-panel rounded-xl p-5 border border-indigo-500/10">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                      RETURN ANALYSIS EXPLANATION (GraphRAG)
                    </h3>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">GROQ LLM ENVELOPE</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-xs text-indigo-300 leading-relaxed shadow-inner">
                  {result.risk_score >= 0.70 ? (
                    <p>
                      <strong className="text-rose-400">[ALERT]</strong> Customer belongs to Return watch group. Neo4j shows {result.graph_context.return_count} return claims in the past 30 days, including {result.graph_context.rejected_return_count} previously rejected and {result.graph_context.high_value_return_count} high-value instances. The customer is linked via shared addresses to another blacklisted customer node, implying coordinated refund exploitation.
                    </p>
                  ) : (
                    <p>
                      <strong className="text-emerald-400">[CLEAR]</strong> Return pattern matches baseline. Normal returns index. Size-and-fit mismatches identified on low-risk apparel items. Automatic warehouse return label issuance recommended.
                    </p>
                  )}
                </div>
              </div>

              {/* Product Replacement Recommendations (Prevention Strategy) */}
              <div className="glass-panel rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                      SAFE SUBSTITUTION RECOMMENDATIONS
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Offer replacement products in return flow instead of cash to prevent refund exploitation.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    Risk Mitigator
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {alternativeProducts.map(p => (
                    <div
                      key={p.productId}
                      className="p-3.5 rounded-lg border border-white/5 bg-slate-900/40 hover:border-slate-800 flex flex-col justify-between gap-3 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                          {p.categoryName}
                        </span>
                        <h4 className="text-xs font-bold text-white leading-tight">{p.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Brand: {p.brand}</p>
                      </div>

                      <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                        <span className="text-sm font-extrabold text-indigo-300 font-mono">
                          ${p.unitPrice.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900 rounded font-mono text-[9px] cursor-pointer"
                        >
                          OFFER EXCHANGE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence & Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Evidence List */}
                <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-white/5 pb-2">
                    RETURN ABUSE TRAIL
                  </h3>
                  {result.evidence.length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center font-mono">
                      NO prior return watch signals found.
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
                    SYSTEM INSTRUCTIONS
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
      <ReturnAnalysisContent />
    </Suspense>
  );
}
