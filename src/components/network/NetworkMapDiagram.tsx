import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DEMO_NETWORK_STATS, DEMO_NETWORK_NODES } from '../../data/mockData';
import type { NetworkNode } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface NetworkMapDiagramProps {
  interactive?: boolean;
}

export const NetworkMapDiagram: React.FC<NetworkMapDiagramProps> = ({ interactive = true }) => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(DEMO_NETWORK_NODES[0]);
  const shouldReduceMotion = useReducedMotion();

  const hospitals = DEMO_NETWORK_NODES.filter((n) => n.type === 'hospital');
  const bloodBanks = DEMO_NETWORK_NODES.filter((n) => n.type === 'blood_bank');

  return (
    <div className="w-full max-w-6xl mx-auto my-8">
      {/* Top Demo Network Banner & Stats */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-semibold text-lg text-[#0F172A]">
                Regional Grid Status
              </span>
              <span className="text-[11px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                Demo Network
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Synthetic telemetry representing metropolitan load-balancing cluster.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry updated: Just now</span>
          </div>
        </div>

        {/* 4 Required Metric Labels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-mono text-[#64748B] uppercase block">Connected Banks</span>
            <span className="font-mono text-2xl font-bold text-[#0F172A] mt-0.5 block">
              {DEMO_NETWORK_STATS.connectedBanks}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">+ {DEMO_NETWORK_STATS.connectedHospitals} Hospitals</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-mono text-[#64748B] uppercase block">Active Requests</span>
            <span className="font-mono text-2xl font-bold text-[#1E4C8A] mt-0.5 block">
              {DEMO_NETWORK_STATS.activeRequests}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Routing automatically</span>
          </div>

          <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg">
            <span className="text-[11px] font-mono text-rose-700 uppercase block">Stockout Risks</span>
            <span className="font-mono text-2xl font-bold text-[#E11D48] mt-0.5 block">
              {DEMO_NETWORK_STATS.stockoutRisks}
            </span>
            <span className="text-[10px] text-rose-600 font-mono">Early alerts dispatched</span>
          </div>

          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
            <span className="text-[11px] font-mono text-[#1E4C8A] uppercase block">Redistribution Opps</span>
            <span className="font-mono text-2xl font-bold text-[#1E4C8A] mt-0.5 block">
              {DEMO_NETWORK_STATS.redistributionOpportunities}
            </span>
            <span className="text-[10px] text-blue-600 font-mono">Viability-optimized</span>
          </div>
        </div>
      </div>

      {/* Interactive Network Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-subtle relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 text-xs font-mono text-slate-500">
            <span>TOPOLOGY: BIPARTITE LOAD BALANCING</span>
            <span className="text-slate-400">CLICK ANY NODE TO INSPECT</span>
          </div>

          {/* SVG Diagram */}
          <div className="relative h-80 sm:h-96 w-full bg-slate-50/60 rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center">
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 360" fill="none">
              {/* Connecting lines between Hospitals and Central Hub (300, 180) */}
              <line x1="120" y1="60" x2="300" y2="180" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="120" y1="140" x2="300" y2="180" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="120" y1="220" x2="300" y2="180" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="120" y1="300" x2="300" y2="180" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Connecting lines between Central Hub and Blood Banks */}
              <line x1="300" y1="180" x2="480" y2="60" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="300" y1="180" x2="480" y2="140" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="300" y1="180" x2="480" y2="220" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="300" y1="180" x2="480" y2="300" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Moving pulse animations */}
              {!shouldReduceMotion && (
                <>
                  <motion.circle
                    r="3"
                    fill="#C1272D"
                    initial={{ cx: 120, cy: 60 }}
                    animate={{ cx: [120, 300], cy: [60, 180] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.circle
                    r="3"
                    fill="#10B981"
                    initial={{ cx: 300, cy: 180 }}
                    animate={{ cx: [300, 480], cy: [180, 60] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 0.8 }}
                  />
                  <motion.circle
                    r="3"
                    fill="#1E4C8A"
                    initial={{ cx: 300, cy: 180 }}
                    animate={{ cx: [300, 480], cy: [180, 220] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', delay: 1.4 }}
                  />
                </>
              )}
            </svg>

            {/* Hospital Nodes (Left Column) */}
            <div className="absolute left-6 top-0 bottom-0 flex flex-col justify-around py-4 z-10">
              {hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => interactive && setSelectedNode(h)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left transition-all ${
                    selectedNode?.id === h.id
                      ? 'bg-white border-[#C1272D] shadow-sm ring-1 ring-[#C1272D]'
                      : 'bg-white/90 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      h.status === 'critical'
                        ? 'bg-rose-500'
                        : h.status === 'low_stock'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-[#0F172A] truncate max-w-[120px]">
                      {h.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Demand: {h.activeRequestsCount} reqs
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Central SevaSetu Hub Node */}
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#0F172A] border-2 border-slate-700 shadow-premium flex flex-col items-center justify-center text-white">
                <span className="text-[10px] font-mono text-red-400 font-bold">CORE</span>
                <span className="text-[8px] font-mono text-slate-300">HUB</span>
              </div>
              <span className="text-[10px] font-mono text-slate-600 font-semibold mt-1">
                SevaSetu
              </span>
            </div>

            {/* Blood Bank Nodes (Right Column) */}
            <div className="absolute right-6 top-0 bottom-0 flex flex-col justify-around py-4 z-10">
              {bloodBanks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => interactive && setSelectedNode(b)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-right justify-end transition-all ${
                    selectedNode?.id === b.id
                      ? 'bg-white border-[#1E4C8A] shadow-sm ring-1 ring-[#1E4C8A]'
                      : 'bg-white/90 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-[#0F172A] truncate max-w-[120px]">
                      {b.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {b.bloodUnitsTotal} units avail
                    </span>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      b.status === 'excess'
                        ? 'bg-blue-500'
                        : b.status === 'optimal'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>&larr; Hospitals (Demand)</span>
            <span className="text-slate-400">Automated Dispatch Balancing</span>
            <span>Blood Banks (Supply) &rarr;</span>
          </div>
        </div>

        {/* Node Inspector Side Panel */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                NODE TELEMETRY
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                LIVE DEMO
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {selectedNode.type === 'hospital' ? 'Hospital' : 'Regional Blood Bank'}
                  </span>
                  <h4 className="font-poppins font-semibold text-lg text-[#0F172A] leading-tight">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedNode.city}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Stock</span>
                    <span className="font-mono text-xl font-bold text-[#0F172A]">
                      {selectedNode.bloodUnitsTotal} <span className="text-xs font-normal">units</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Reqs</span>
                    <span className="font-mono text-xl font-bold text-[#1E4C8A]">
                      {selectedNode.activeRequestsCount}
                    </span>
                  </div>
                </div>

                {selectedNode.criticalGroups.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded">
                    <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Critical Shortage
                    </span>
                    <div className="flex gap-1.5">
                      {selectedNode.criticalGroups.map((g) => (
                        <span key={g} className="px-2 py-0.5 bg-white border border-rose-300 font-mono text-xs font-bold text-rose-700 rounded">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.excessGroups.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                      Available Surplus for Allocation
                    </span>
                    <div className="flex gap-1.5">
                      {selectedNode.excessGroups.map((g) => (
                        <span key={g} className="px-2 py-0.5 bg-white border border-blue-300 font-mono text-xs font-bold text-blue-800 rounded">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500 font-mono pt-2 border-t border-slate-100 flex justify-between">
                  <span>Last ping:</span>
                  <span className="text-slate-700">{selectedNode.lastUpdated}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                Click on any node in the diagram to inspect real-time metrics.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-tight">
            Synthetic demo network telemetry. Does not reflect real hospital patients or donor records.
          </div>
        </div>
      </div>
    </div>
  );
};
