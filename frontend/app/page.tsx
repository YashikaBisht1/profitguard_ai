"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// Simulated overall telemetry data
const kpiData = [
  {
    title: "Total Risk Scans",
    value: "1,424",
    change: "+12.4%",
    isPositive: true,
    description: "Evaluations processed last 7 days",
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: "High-Risk Flags",
    value: "86",
    change: "+4.2%",
    isPositive: false,
    description: "Requires urgent manual reviews",
    icon: (
      <svg className="w-5 h-5 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    title: "Return Abuse Index",
    value: "5.4%",
    change: "-1.8%",
    isPositive: true,
    description: "Avg return requests rejected",
    icon: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
      </svg>
    ),
  },
  {
    title: "Coordinated Farms Blocked",
    value: "19",
    change: "+15.4%",
    isPositive: true,
    description: "Identified coupon-abuse hubs",
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const scanHistoryData = [
  { day: "Mon", scans: 140, risk: 8 },
  { day: "Tue", scans: 185, risk: 14 },
  { day: "Wed", scans: 220, risk: 24 },
  { day: "Thu", scans: 195, risk: 11 },
  { day: "Fri", scans: 240, risk: 18 },
  { day: "Sat", scans: 210, risk: 7 },
  { day: "Sun", scans: 234, risk: 12 },
];

const riskDistributionData = [
  { name: "Low Risk", value: 1120, color: "#10b981" },
  { name: "Medium Risk", value: 218, color: "#f59e0b" },
  { name: "High Risk", value: 86, color: "#f43f5e" },
];

const categoryFraudData = [
  { name: "Gift Cards", rate: 78, amt: 2400 },
  { name: "Luxury Fashion", rate: 54, amt: 4800 },
  { name: "Mobile Phones", rate: 42, amt: 12000 },
  { name: "Gaming Consoles", rate: 31, amt: 5400 },
  { name: "Home Appliances", rate: 12, amt: 3500 },
];

const recentAlerts = [
  {
    id: "1",
    customer: "CUST-001",
    name: "Avery Stone",
    type: "Coordinated Fraud Ring",
    score: 94,
    decision: "manual_review",
    time: "2 mins ago",
    details: "Shared address and card details linked to 6 accounts",
  },
  {
    id: "2",
    customer: "CUST-007",
    name: "Gray Harper",
    type: "Promotion Farmer Flag",
    score: 83,
    decision: "step_up_verification",
    time: "15 mins ago",
    details: "Exploited WELCOME50 welcome code across multiple checkouts",
  },
  {
    id: "3",
    customer: "CUST-008",
    name: "Hayden Shah",
    type: "Serial Refund Abuser",
    score: 78,
    decision: "manual_review",
    time: "32 mins ago",
    details: "4 return requests in 14 days, total amount > $1,200",
  },
  {
    id: "4",
    customer: "CUST-021",
    name: "Uma Wallace",
    type: "Standard Verification",
    score: 18,
    decision: "approve",
    time: "1 hour ago",
    details: "Normal purchase behavior patterns detected",
  },
];

export default function Home() {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Risk Intelligence Dashboard</h2>
          <p className="text-slate-400 text-sm">
            Overview of autonomous entity scoring, coupon abuse, and returns validation.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fraud-detection"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            New Fraud Scan
          </Link>
          <Link
            href="/analyze-return"
            className="px-4 py-2 bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-colors rounded-lg text-sm font-medium"
          >
            Analyze Return
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <div key={idx} className="glass-panel glass-panel-hover rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-medium text-slate-400 tracking-wider">
                {kpi.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
                {kpi.icon}
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">{kpi.value}</span>
              <span className={`text-xs font-mono font-bold ${kpi.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">{kpi.description}</p>
            {/* Glowing bottom line indicator */}
            <div className={`absolute bottom-0 left-0 w-full h-[2px] ${idx === 1 ? "bg-rose-500" : (idx === 3 ? "bg-amber-500" : "bg-indigo-500/50")}`} />
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Scan Trends */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white font-mono">SCAN TELEMETRY & ALERTS</h3>
              <p className="text-[11px] text-slate-400">Total transaction requests vs. triggered risk alerts</p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">PAST 7 DAYS</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scanHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} className="font-mono" />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} className="font-mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(11,15,25,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="scans" stroke="#6366f1" strokeWidth={2} name="Total Scans" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} name="Risk Alerts" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Risk Distribution */}
        <div className="glass-panel rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white font-mono">RISK LEVEL SLICES</h3>
              <p className="text-[11px] text-slate-400">Proportional classification of scanned nodes</p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">LIVE CLUSTER</span>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(11,15,25,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-white">1.4k</span>
              <p className="text-[9px] text-slate-400 font-mono uppercase">Scans Total</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            {riskDistributionData.map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 font-medium">{entry.name}</span>
                </div>
                <span className="text-slate-400 font-mono">
                  {entry.value} ({((entry.value / 1424) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Category Fraud */}
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white font-mono">HIGH-RISK PRODUCT FAMILIES</h3>
              <p className="text-[11px] text-slate-400">Percentage of transactions flagged as return/checkout abuse</p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">INDEX %</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryFraudData} layout="vertical" margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={9} width={75} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(11,15,25,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {categoryFraudData.map((entry, index) => {
                    const color = entry.rate > 60 ? "#f43f5e" : entry.rate > 40 ? "#f59e0b" : "#6366f1";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Alerts Feed */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono">REAL-TIME RISK TRIPPERS</h3>
                <p className="text-[11px] text-slate-400">Live operational scan activity feed from GraphRAG</p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                POLLING LIVE
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {recentAlerts.map(alert => {
                const isHighRisk = alert.score >= 75;
                const isMedRisk = alert.score >= 40 && alert.score < 75;
                const riskColor = isHighRisk ? "text-rose-400 border-rose-500/20 bg-rose-950/10" : (isMedRisk ? "text-amber-400 border-amber-500/20 bg-amber-950/10" : "text-emerald-400 border-emerald-500/20 bg-emerald-950/10");

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                    className="p-3.5 rounded-lg border border-white/5 bg-slate-900/20 hover:bg-slate-900/60 hover:border-slate-800 transition-all duration-200 cursor-pointer flex flex-col gap-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {alert.customer}
                        </span>
                        <span className="text-xs text-slate-400">— {alert.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">{alert.time}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${riskColor}`}>
                          SCORE {alert.score}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white">{alert.type}</p>
                      <span className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-full ${
                        alert.decision === "approve"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                          : alert.decision === "step_up_verification"
                          ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                          : "bg-rose-950/40 text-rose-400 border border-rose-500/20"
                      }`}>
                        {alert.decision.replace(/_/g, " ")}
                      </span>
                    </div>

                    {selectedAlert === alert.id && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-2 text-xs">
                        <div className="text-slate-400">
                          <strong className="text-slate-300">Pattern Reason:</strong> {alert.details}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Link
                            href={`/fraud-detection?customer_id=${alert.customer}`}
                            className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-500/30 rounded hover:bg-indigo-900 transition-colors font-mono text-[10px]"
                          >
                            RUN FULL SCAN
                          </Link>
                          <Link
                            href={`/customer-graph-explorer?search=${alert.customer}`}
                            className="px-3 py-1 bg-slate-800 text-slate-300 border border-white/5 rounded hover:bg-slate-700 transition-colors font-mono text-[10px]"
                          >
                            OPEN IN GRAPH
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Showing top risk threats requiring review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
