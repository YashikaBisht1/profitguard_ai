"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFullMockGraph, mockCustomers, mockOrders, GraphNode, GraphLink } from "../../lib/mockData";
import { getCustomerGraph } from "../../lib/api";

function GraphExplorerContent() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // Graph Data & State
  const fallbackGraphData = useMemo(() => getFullMockGraph(), []);
  const [rawGraphData, setRawGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>(fallbackGraphData);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("CUST-001");
  const [customerId, setCustomerId] = useState("CUST-001");
  const [dataSource, setDataSource] = useState<"LIVE API" | "DEMO SIMULATION">("DEMO SIMULATION");
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "PAYMENT" | "ADDRESS" | "FRAUD">("ALL");

  // Keep state tracked via refs for callback visibility inside force-graph context
  const selectedNodeRef = useRef<GraphNode | null>(null);
  const searchQueryRef = useRef<string>("");
  const filteredDataRef = useRef<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });

  // Load query from URL search parameters (e.g. from Dashboard click)
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
      setCustomerId(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingGraph(true);
    getCustomerGraph(customerId)
      .then(result => {
        if (!isMounted) return;
        setRawGraphData(result.data);
        setDataSource(result.source);
        setSelectedNode(result.data.nodes.find(n => n.id === customerId) || null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingGraph(false);
      });
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  // Filters nodes and links
  const filteredData = useMemo(() => {
    let filteredLinks = rawGraphData.links;

    // Filter links by relation type
    if (filterType === "PAYMENT") {
      filteredLinks = rawGraphData.links.filter(l => l.type === "USES_PAYMENT" || l.type === "SHARES_PAYMENT_WITH");
    } else if (filterType === "ADDRESS") {
      filteredLinks = rawGraphData.links.filter(l => l.type === "USES_ADDRESS" || l.type === "SHARES_ADDRESS_WITH");
    } else if (filterType === "FRAUD") {
      filteredLinks = rawGraphData.links.filter(l => l.type === "SHARES_PAYMENT_WITH" || l.type === "SHARES_ADDRESS_WITH");
    }

    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      // Keep nodes matching ID or label
      const matchedNodeIds = new Set(
        rawGraphData.nodes
          .filter(n => n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query))
          .map(n => n.id)
      );

      // Keep links connected to matched nodes
      filteredLinks = filteredLinks.filter(
        l => matchedNodeIds.has(typeof l.source === "object" ? (l.source as any).id : l.source) ||
             matchedNodeIds.has(typeof l.target === "object" ? (l.target as any).id : l.target)
      );
    }

    // Collect all active node IDs from filtered links
    const activeNodeIds = new Set<string>();
    filteredLinks.forEach(l => {
      activeNodeIds.add(typeof l.source === "object" ? (l.source as any).id : l.source);
      activeNodeIds.add(typeof l.target === "object" ? (l.target as any).id : l.target);
    });

    // If search matched specific nodes but they have no connections, make sure they remain visible
    if (searchQuery.trim()) {
      rawGraphData.nodes.forEach(n => {
        const q = searchQuery.trim().toLowerCase();
        if (n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q)) {
          activeNodeIds.add(n.id);
        }
      });
    }

    const filteredNodes = rawGraphData.nodes.filter(n => activeNodeIds.has(n.id));

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [rawGraphData, filterType, searchQuery]);

  // Sync state values to refs for the force-graph engine loops
  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Retrieve selected node properties matching seed database
  const selectedNodeProperties = useMemo(() => {
    if (!selectedNode) return null;

    if (selectedNode.type === "customer") {
      return mockCustomers.find(c => c.customerId === selectedNode.id) || null;
    }
    if (selectedNode.type === "order") {
      return mockOrders.find(o => o.orderId === selectedNode.id) || null;
    }
    return null;
  }, [selectedNode]);

  // Color mapper for node types & risks
  const getNodeColor = (node: GraphNode, currentSearchQuery: string) => {
    // Check if searched
    if (currentSearchQuery && node.id.toLowerCase().includes(currentSearchQuery.toLowerCase())) {
      return "#f43f5e"; // bright red/crimson for matched searches
    }

    switch (node.type) {
      case "customer":
        if (node.riskScore && node.riskScore >= 0.75) return "#f43f5e"; // high risk red
        if (node.riskScore && node.riskScore >= 0.40) return "#f59e0b"; // medium risk amber
        return "#10b981"; // clear green
      case "order":
        return "#6366f1"; // indigo
      case "address":
        return "#06b6d4"; // cyan
      case "payment":
        return "#8b5cf6"; // violet
      case "coupon":
        return "#ec4899"; // pink
      case "email":
        return "#eab308"; // amber/gold
      case "email_domain":
        return "#f97316"; // orange
      default:
        return "#94a3b8";
    }
  };

  const handleQuickSearch = (id: string) => {
    setSearchQuery(id);
    setCustomerId(id);
    const node = rawGraphData.nodes.find(n => n.id === id);
    if (node) {
      setSelectedNode(node);
      // Center graph zoom on selected node
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(2.5, 1000);
      }
    }
  };

  // Setup force-graph on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDestroyed = false;
    let fgInstance: any = null;

    import("force-graph").then((ForceGraphModule) => {
      if (isDestroyed) return;
      const ForceGraph = ForceGraphModule.default;

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 400;

      const fg = ForceGraph()(container)
        .width(width)
        .height(height)
        .backgroundColor("rgba(3, 7, 18, 0.2)")
        .nodeVal((node: any) => node.val || 12)
        .nodeLabel((node: any) => node.label)
        .onNodeClick((node: any) => setSelectedNode(node))
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(0.005)
        .linkWidth(() => 1.5)
        .linkColor(() => "rgba(255, 255, 255, 0.08)")
        .nodeCanvasObject((node: any, ctx: any, globalScale: any) => {
          const size = node.val || 10;
          const color = getNodeColor(node, searchQueryRef.current);

          // Draw outer glowing circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size / 2 + 2, 0, 2 * Math.PI, false);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw core circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // If selected, draw an indicator ring
          const selNode = selectedNodeRef.current;
          if (selNode && selNode.id === node.id) {
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, size / 2 + 5, 0, 2 * Math.PI, false);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Node text labels on close scales
          if (globalScale > 1.4) {
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px monospace`;
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(node.id, node.x!, node.y! + size / 2 + 4);
          }
        });

      graphRef.current = fg;
      fgInstance = fg;

      // Sync initial data
      fg.graphData(filteredDataRef.current);
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (graphRef.current) {
          graphRef.current.width(width).height(height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isDestroyed = true;
      resizeObserver.disconnect();
      if (fgInstance) {
        fgInstance.pauseAnimation();
      }
      container.innerHTML = "";
    };
  }, []);

  // Reactive updates for graphData
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.graphData(filteredData);
    }
  }, [filteredData]);

  // Redraw canvas if search or selection updates
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
    }
  }, [selectedNode, searchQuery]);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Linked Customer Graph Explorer</h2>
              <p className="text-slate-400 text-sm">
            Traverse linked accounts, shared payment methods, addresses, and fraud relationships.
              </p>
        </div>
        <div className="text-right font-mono text-[10px] text-slate-500">
          <div className={dataSource === "LIVE API" ? "text-emerald-400" : "text-amber-400"}>{dataSource}</div>
          <div>{rawGraphData.nodes.length} nodes / {rawGraphData.links.length} links</div>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        {/* Graph display canvas panel */}
        <div className="flex-1 glass-panel rounded-xl overflow-hidden relative flex flex-col bg-slate-950/40 min-h-[350px]">
          {/* Controls Overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all ${
                filterType === "ALL"
                  ? "bg-indigo-950/60 border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              } cursor-pointer`}
            >
              ALL LINKAGES
            </button>
            <button
              onClick={() => setFilterType("PAYMENT")}
              className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all ${
                filterType === "PAYMENT"
                  ? "bg-indigo-950/60 border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              } cursor-pointer`}
            >
              SHARED PAYMENTS
            </button>
            <button
              onClick={() => setFilterType("ADDRESS")}
              className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all ${
                filterType === "ADDRESS"
                  ? "bg-indigo-950/60 border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              } cursor-pointer`}
            >
              SHARED ADDRESSES
            </button>
            <button
              onClick={() => setFilterType("FRAUD")}
              className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all ${
                filterType === "FRAUD"
                  ? "bg-indigo-950/60 border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              } cursor-pointer`}
            >
              FRAUD LINKS
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 w-full h-full relative">
            {isLoadingGraph && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </div>


          {/* Floating Instructions */}
          <div className="absolute bottom-4 left-4 z-10 text-[10px] text-slate-500 font-mono">
            DRAG to pan • SCROLL to zoom • CLICK node to inspect properties
          </div>
        </div>

        {/* Sidebar Controls & Properties details */}
        <div className="w-full lg:w-96 glass-panel rounded-xl p-5 flex flex-col gap-5 shrink-0 overflow-y-auto max-h-[400px] lg:max-h-none">
          {/* Node Search */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              NETWORK QUERY BOX
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search CUST-001, PAY-FP..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                onKeyDown={e => {
                  if (e.key === "Enter" && searchQuery.trim().toUpperCase().startsWith("CUST-")) {
                    setCustomerId(searchQuery.trim().toUpperCase());
                  }
                }}
              />
              <button
                onClick={() => {
                  if (searchQuery.trim().toUpperCase().startsWith("CUST-")) {
                    setCustomerId(searchQuery.trim().toUpperCase());
                  }
                }}
                className="px-2.5 bg-indigo-950 border border-indigo-500/30 hover:bg-indigo-900 rounded font-mono text-xs text-indigo-300 cursor-pointer"
              >
                LOAD
              </button>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedNode(null);
                  }}
                  className="px-2.5 bg-slate-900 border border-white/5 hover:border-slate-800 rounded font-mono text-xs cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Quick click search targets */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase py-0.5 pr-1 font-mono">
                Rings:
              </span>
              <button
                onClick={() => handleQuickSearch("CUST-001")}
                className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                Ring A (Fraud)
              </button>
              <button
                onClick={() => handleQuickSearch("CUST-007")}
                className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                Ring C (Coupon)
              </button>
              <button
                onClick={() => handleQuickSearch("CUST-008")}
                className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                Ring B (Return)
              </button>
            </div>
          </div>

          {/* Properties section */}
          <div className="flex-1 flex flex-col gap-4 border-t border-white/5 pt-4">
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              NODE SPECIFICATIONS
            </h3>

            {!selectedNode ? (
              <div className="text-xs text-slate-500 font-mono py-8 text-center bg-slate-950/20 border border-dashed border-white/5 rounded-lg">
                Select any node on the force graph to examine detailed properties.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Node details */}
                <div className="p-3 bg-slate-950 border border-white/5 rounded-lg font-mono text-xs flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Node ID:</span>
                    <strong className="text-indigo-400">{selectedNode.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Label:</span>
                    <span className="text-slate-300 font-semibold">{selectedNode.label.split("(")[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-slate-300 capitalize">{selectedNode.type}</span>
                  </div>
                  {selectedNode.riskScore !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Calculated Risk:</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                        selectedNode.riskScore >= 0.75
                          ? "bg-rose-950/40 text-rose-400 border-rose-500/20"
                          : selectedNode.riskScore >= 0.40
                          ? "bg-amber-950/40 text-amber-400 border-amber-500/20"
                          : "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {Math.round(selectedNode.riskScore * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-properties if Customer */}
                {selectedNode.type === "customer" && selectedNodeProperties && (
                  <div className="flex flex-col gap-2 font-mono text-[11px] text-slate-400">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Customer Profile Attributes
                    </span>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Email:</span>
                      <span className="text-slate-300 text-right truncate max-w-[200px]" title={(selectedNodeProperties as any).email}>
                        {(selectedNodeProperties as any).email}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Status:</span>
                      <span className="text-slate-300">{(selectedNodeProperties as any).accountStatus}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>IP Address:</span>
                      <span className="text-slate-300">{(selectedNodeProperties as any).ipAddress}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Phone:</span>
                      <span className="text-slate-300">{(selectedNodeProperties as any).phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Device Hash:</span>
                      <span className="text-slate-300 text-right truncate max-w-[150px]" title={(selectedNodeProperties as any).deviceFingerprint}>
                        {(selectedNodeProperties as any).deviceFingerprint}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <a
                        href={`/fraud-detection?customer_id=${selectedNode.id}`}
                        className="flex-1 py-1.5 bg-indigo-950 border border-indigo-500/30 hover:bg-indigo-900 rounded font-mono text-[10px] text-center text-indigo-300 cursor-pointer"
                      >
                        RUN FRAUD SCAN
                      </a>
                      <a
                        href={`/analyze-return?customer_id=${selectedNode.id}&order_id=ORD-0083`}
                        className="flex-1 py-1.5 bg-slate-900 border border-white/5 hover:border-slate-800 rounded font-mono text-[10px] text-center text-slate-300 cursor-pointer"
                      >
                        ANALYZE RETURNS
                      </a>
                    </div>
                  </div>
                )}

                {/* Sub-properties if Order */}
                {selectedNode.type === "order" && selectedNodeProperties && (
                  <div className="flex flex-col gap-2 font-mono text-[11px] text-slate-400">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Order Invoice Details
                    </span>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Order Status:</span>
                      <span className="text-slate-300">{(selectedNodeProperties as any).orderStatus}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Total Amount:</span>
                      <span className="text-slate-300 font-bold">${(selectedNodeProperties as any).totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Discount Used:</span>
                      <span className="text-slate-300">${(selectedNodeProperties as any).discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Placing IP:</span>
                      <span className="text-slate-300">{(selectedNodeProperties as any).ipAddress}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Items:</span>
                      <span className="text-slate-300 text-right truncate max-w-[200px]" title={(selectedNodeProperties as any).products?.map((p: any) => p.name).join(", ")}>
                        {(selectedNodeProperties as any).products?.map((p: any) => p.name).join(", ")}
                      </span>
                    </div>

                    <a
                      href={`/analyze-return?customer_id=${(selectedNodeProperties as any).customerId}&order_id=${selectedNode.id}`}
                      className="w-full mt-4 py-2 bg-indigo-950 border border-indigo-500/30 hover:bg-indigo-900 rounded font-mono text-[10px] text-center text-indigo-300 cursor-pointer"
                    >
                      PROCESS REFUND INVOICE
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
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
      <GraphExplorerContent />
    </Suspense>
  );
}
