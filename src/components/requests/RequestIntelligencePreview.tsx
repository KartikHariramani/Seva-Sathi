import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface RequestIntelligencePreviewProps {
  className?: string;
}

export const RequestIntelligencePreview: React.FC<RequestIntelligencePreviewProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 sm:p-5 relative ${className}`}
      aria-label="AI Readiness Preview"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1E4C8A]/10 text-[#1E4C8A] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-poppins font-semibold text-xs text-[#0F172A] tracking-tight">
            AI Readiness Preview
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          Coming in Phase 3
        </span>
      </div>

      <p className="text-xs text-[#64748B] leading-relaxed mb-3">
        Once automated prediction is enabled, SevaSetu will dynamically evaluate:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-600">
        <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E4C8A]" />
          <span>Shortage risk scoring</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E4C8A]" />
          <span>Expected stockout timeline</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E4C8A]" />
          <span>Regional network demand velocity</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E4C8A]" />
          <span>Best-fit blood bank recommendation</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Architectural stub ready for ML integration</span>
        <span className="flex items-center gap-0.5 text-slate-500">
          Phase 3 specification <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
