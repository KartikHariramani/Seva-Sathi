import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Activity, GitBranch } from 'lucide-react';

export const HeroNetworkVisual: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full max-w-4xl mx-auto my-6 sm:my-10 p-6 sm:p-8 bg-white/70 backdrop-blur-sm border border-[#E2E8F0] rounded-xl shadow-subtle">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 text-xs font-mono text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
          </span>
          <span className="font-semibold text-[#0F172A]">SEVASETU-CORE // TELEMETRY FEED</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>STATUS: <span className="text-emerald-600 font-medium">SYNCHRONIZED</span></span>
          <span className="hidden sm:inline">LATENCY: <span className="text-[#0F172A] font-medium">38ms</span></span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">DEMO NETWORK</span>
        </div>
      </div>

      {/* Network schematic container */}
      <div className="relative py-4 select-none">
        {/* SVG connection lines with moving data pulses */}
        <div className="hidden md:block absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 800 240" fill="none">
            {/* Background connection paths */}
            <path d="M 230 60 C 310 60, 330 120, 400 120" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 230 180 C 310 180, 330 120, 400 120" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 400 120 C 470 120, 490 50, 570 50" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 400 120 C 470 120, 490 120, 570 120" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 400 120 C 470 120, 490 190, 570 190" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Slow traveling data pulses */}
            {!shouldReduceMotion && (
              <>
                {/* Hospital -> Core pulse */}
                <motion.circle
                  r="3.5"
                  fill="#C1272D"
                  initial={{ cx: 230, cy: 60 }}
                  animate={{ cx: [230, 400], cy: [60, 120] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.circle
                  r="3.5"
                  fill="#E11D48"
                  initial={{ cx: 230, cy: 180 }}
                  animate={{ cx: [230, 400], cy: [180, 120] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                />

                {/* Core -> Blood Banks pulses */}
                <motion.circle
                  r="3.5"
                  fill="#10B981"
                  initial={{ cx: 400, cy: 120 }}
                  animate={{ cx: [400, 570], cy: [120, 50] }}
                  transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
                <motion.circle
                  r="3.5"
                  fill="#1E4C8A"
                  initial={{ cx: 400, cy: 120 }}
                  animate={{ cx: [400, 570], cy: [120, 120] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
                />
                <motion.circle
                  r="3.5"
                  fill="#1E4C8A"
                  initial={{ cx: 400, cy: 120 }}
                  animate={{ cx: [400, 570], cy: [120, 190] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }}
                />
              </>
            )}
          </svg>
        </div>

        {/* 3-Column Node Layout: Hospitals | Core Hub | Blood Banks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center relative z-10">
          {/* Column 1: Hospital Nodes */}
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-mono text-slate-600 font-semibold tracking-wider uppercase block text-center md:text-left">
              CONSUMPTION // HOSPITALS
            </span>

            {/* Hospital Node 1 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#0F172A]">Apex Trauma ICU</span>
                <span className="font-mono text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                  O- Deficit (4u)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Demand Surge</span>
                <span className="text-amber-600 font-medium">Risk: High</span>
              </div>
            </div>

            {/* Hospital Node 2 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#0F172A]">Metropolitan General</span>
                <span className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">
                  A- Request (2u)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Surgery Reserve</span>
                <span className="text-emerald-600 font-medium">Scheduled</span>
              </div>
            </div>
          </div>

          {/* Column 2: Central SevaSetu Core */}
          <div className="flex flex-col items-center justify-center my-2 md:my-0">
            <div className="relative p-5 rounded-2xl bg-[#0F172A] text-white border border-slate-700/80 shadow-premium w-full max-w-xs text-center">
              <div className="w-10 h-10 rounded-full bg-[#C1272D]/20 text-[#C1272D] flex items-center justify-center mx-auto mb-3">
                <Activity className="w-5 h-5 text-red-400" />
              </div>

              <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase block mb-1">
                INTELLIGENT HUB
              </span>
              <h3 className="font-poppins font-semibold text-base text-white mb-1">
                SevaSetu Engine
              </h3>
              <p className="text-xs text-slate-300 leading-snug mb-3">
                Predictive allocation &amp; dispatch routing
              </p>

              <div className="pt-2.5 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between px-2">
                <span>MATCH SPEED</span>
                <span className="text-emerald-400 font-semibold">42 ms</span>
              </div>
            </div>
          </div>

          {/* Column 3: Blood Banks */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-mono text-slate-600 font-semibold tracking-wider uppercase block text-center md:text-right">
              SUPPLY // BLOOD BANKS
            </span>

            {/* Bank 1 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Red Cross Regional</span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  O- (6u Avail)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Dist: 4.2 km</span>
                <span className="text-blue-600 font-medium">Matched &bull; Lock</span>
              </div>
            </div>

            {/* Bank 2 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Metro Blood Repository</span>
                <span className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">
                  A- (8u Avail)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Dist: 7.8 km</span>
                <span className="text-slate-600">Standby</span>
              </div>
            </div>

            {/* Bank 3 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Civic Cryo Bank</span>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  B+ / O+ Surplus
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Dist: 11.0 km</span>
                <span className="text-slate-600">Monitored</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom caption */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-[#1E4C8A]" />
          <span>Automated matching based on proximity, compatibility &amp; expiry viability.</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <span>HOSPITALS</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span>SEVASETU</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span>BLOOD BANKS</span>
        </div>
      </div>
    </div>
  );
};
