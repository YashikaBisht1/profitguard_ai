"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { checkBackendConnection, ApiConnectionStatus } from "../lib/api";

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connStatus, setConnStatus] = useState<ApiConnectionStatus>({
    isConnected: false,
    mode: "DEMO SIMULATION",
  });

  // Check connection on load and every 10 seconds
  useEffect(() => {
    const runCheck = async () => {
      const status = await checkBackendConnection();
      setConnStatus(status);
    };
    runCheck();
    const interval = setInterval(runCheck, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: "Ops Dashboard",
      path: "/",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "Fraud Check Scan",
      path: "/fraud-detection",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: "Analyze Return",
      path: "/analyze-return",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
    },
    {
      name: "Graph Explorer",
      path: "/customer-graph-explorer",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 cyber-grid cyber-radial-glow">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            P
          </div>
          <div>
            <h1 className="text-md font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-400">
              PROFITGUARD AI
            </h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest leading-none">
              RISK OPERATIONS CONSOLE
            </p>
          </div>
        </div>

        {/* Live / Demo Mode Badge */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all duration-300 ${
              connStatus.isConnected
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 glow-emerald"
                : "bg-amber-950/40 border-amber-500/30 text-amber-400 glow-amber"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block animate-pulse ${
                connStatus.isConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {connStatus.mode}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 p-4 gap-6 shrink-0 h-[calc(100vh-73px)] sticky top-[73px]">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-3">
              Core Modules
            </span>
            <nav className="flex flex-col gap-1">
              {navItems.map(item => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                      isActive
                        ? "bg-indigo-950/40 text-indigo-300 border-indigo-500/30 glow-purple font-medium"
                        : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/5 pt-4">
            <div className="bg-slate-900/40 border border-white/5 rounded-lg p-3 text-xs">
              <span className="text-indigo-400 font-mono font-bold block mb-1">
                SYSTEM TELEMETRY
              </span>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Neo4j Graph:</span>
                <span className={connStatus.isConnected ? "text-emerald-400" : "text-amber-400"}>
                  {connStatus.isConnected ? "CONNECTED" : "MOCKED"}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>Model Server:</span>
                <span className="text-slate-300">GROQ (DEEPSEEK)</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>Version:</span>
                <span className="text-slate-300">v1.1.2-beta</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm md:hidden">
            <div className="w-64 glass-panel border-r border-white/5 h-full p-4 flex flex-col gap-6">
              <nav className="flex flex-col gap-2">
                {navItems.map(item => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                        isActive
                          ? "bg-indigo-950/40 text-indigo-300 border-indigo-500/30"
                          : "text-slate-400 border-transparent hover:text-slate-200"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
