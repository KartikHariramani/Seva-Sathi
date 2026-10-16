import React from 'react';
import type { StockoutPrediction } from '../../intelligence/types/prediction';
import { HelpCircle, ArrowDownRight, ArrowUpRight, Minus, ShieldAlert } from 'lucide-react';

interface PredictionExplanationProps {
  prediction: StockoutPrediction;
}

export const PredictionExplanation: React.FC<PredictionExplanationProps> = ({ prediction }) => {
  const { bloodGroup, explanation, currentStock, features, estimatedStockoutHours, riskLevel } = prediction;

  const getImpactBadge = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            <span>Accelerates Depletion</span>
          </span>
        );
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ArrowDownRight className="w-3 h-3 text-emerald-600" />
            <span>Extends Runway</span>
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <Minus className="w-3 h-3 text-slate-400" />
            <span>Neutral / Baseline</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-poppins font-bold text-base text-slate-900 tracking-tight">
              Why this prediction? ({bloodGroup})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic, explainable factor attribution directly grounded in verified transactional records.
            </p>
          </div>
        </div>

        {explanation.recommendedAttention && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 self-start sm:self-auto">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Operational Attention Advised</span>
          </span>
        )}
      </div>

      {/* Structured Factors List (Section 24 & 25) */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Observed Determinants
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {explanation.factors.map((factor, index) => (
            <div
              key={index}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-800 block">
                  {factor.label}
                </span>
                <span className="font-mono text-sm font-medium text-slate-900 block">
                  {factor.value}
                </span>
              </div>
              <div className="shrink-0">
                {getImpactBadge(factor.impact)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The Judge Test Transparency Panel (Section 71) */}
      <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>SevaSetu Trust &amp; Governance Verification</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="border-l-2 border-rose-500 pl-3 py-0.5">
            <p className="font-semibold text-white mb-0.5">
              1. "Why is {bloodGroup} at {riskLevel} risk?"
            </p>
            <p className="text-slate-300 leading-relaxed">
              {bloodGroup} currently has {currentStock} units in physical stock. Recent verified consumption is approximately{' '}
              {features.recentConsumptionRate.toFixed(1)} units/hour, usage trend is {features.usageTrend},{' '}
              and there {features.recentRequestsCount === 1 ? 'is 1 pending request' : `are ${features.recentRequestsCount} pending requests`}.{' '}
              Under observed demand velocity, the system estimates {bloodGroup} may reach depletion in{' '}
              {estimatedStockoutHours !== undefined ? `~${estimatedStockoutHours.toFixed(1)} hours` : '>24 hours'}.
            </p>
          </div>

          <div className="border-l-2 border-emerald-500 pl-3 py-0.5">
            <p className="font-semibold text-white mb-0.5">
              2. "Did AI change the blood inventory?"
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-emerald-400 font-semibold">No.</strong> Actual physical inventory is immutable to AI predictions. Physical inventory changes exclusively through verified hospital transactions (units issued, received, transferred, or reconciled).
            </p>
          </div>

          <div className="border-l-2 border-blue-500 pl-3 py-0.5">
            <p className="font-semibold text-white mb-0.5">
              3. "What happens next?"
            </p>
            <p className="text-slate-300 leading-relaxed">
              Hospital personnel remain in full command. In Phase 5, SevaSetu will generate proactive replenishment recommendations for supervisory approval to balance hospital reserves before stockouts manifest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
