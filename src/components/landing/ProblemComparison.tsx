import React from 'react';
import { ArrowDown, AlertOctagon, Clock, RefreshCw } from 'lucide-react';

export const ProblemComparison: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative">
        {/* LEFT COLUMN: SHORTAGE */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-subtle relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#E11D48]" />
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-semibold tracking-wider text-[#E11D48] uppercase">
                SYSTEM FAILURE 01 // SHORTAGE
              </span>
              <AlertOctagon className="w-4 h-4 text-[#E11D48]" />
            </div>

            <h3 className="font-poppins font-semibold text-xl text-[#0F172A] mb-8">
              Emergency &amp; Surgical Units
            </h3>

            {/* Vertical Flow */}
            <div className="space-y-4 max-w-xs mx-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center text-sm font-medium text-slate-800">
                Hospital
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded text-center text-sm font-semibold text-rose-800">
                Demand ↑
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded text-center text-sm font-semibold text-rose-900">
                Local Stock ↓
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3.5 bg-rose-100 border border-rose-300 rounded text-center text-sm font-bold text-rose-950 font-mono">
                Critical Stockout
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs text-slate-500 font-mono text-center pt-4 border-t border-slate-100">
            Surgeries delayed &bull; Emergency transfers delayed
          </p>
        </div>

        {/* RIGHT COLUMN: WASTAGE */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-subtle relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-semibold tracking-wider text-[#F59E0B] uppercase">
                SYSTEM FAILURE 02 // WASTAGE
              </span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>

            <h3 className="font-poppins font-semibold text-xl text-[#0F172A] mb-8">
              Regional Blood Repositories
            </h3>

            {/* Vertical Flow */}
            <div className="space-y-4 max-w-xs mx-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center text-sm font-medium text-slate-800">
                Blood Bank
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded text-center text-sm font-semibold text-amber-800">
                Excess Inventory
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded text-center text-sm font-semibold text-amber-900">
                Expiry Approaching
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3.5 bg-amber-100 border border-amber-300 rounded text-center text-sm font-bold text-amber-950 font-mono">
                Wasted Life-Saving Stock
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs text-slate-500 font-mono text-center pt-4 border-t border-slate-100">
            Unused units discarded after 35-42 days shelf life
          </p>
        </div>
      </div>

      {/* Central Statement */}
      <div className="mt-10 p-6 bg-slate-900 text-white rounded-xl text-center max-w-2xl mx-auto shadow-premium border border-slate-800">
        <div className="inline-flex items-center gap-2 mb-2 text-[#C1272D] font-mono text-xs font-semibold uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>The Equilibrium Solution</span>
        </div>
        <h4 className="font-poppins font-semibold text-xl sm:text-2xl text-white mb-2">
          SevaSetu connects both sides.
        </h4>
        <p className="text-sm text-slate-300 font-normal leading-relaxed text-balance">
          Eliminating the information silos between consumption centers and storage facilities through predictive load-balancing.
        </p>
      </div>
    </div>
  );
};
