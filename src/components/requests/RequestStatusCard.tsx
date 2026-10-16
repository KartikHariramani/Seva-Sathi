import React from 'react';
import type { BloodRequest } from '../../types/bloodRequest';
import { requestStatusConfig } from '../../utils/requestStatus';
import {
  Clock,
  Search,
  CheckCircle2,
  Lock,
  Truck,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface RequestStatusCardProps {
  request: BloodRequest;
  onRefresh?: () => void;
  className?: string;
}

export const RequestStatusCard: React.FC<RequestStatusCardProps> = ({
  request,
  onRefresh,
  className = '',
}) => {
  const statusMeta = requestStatusConfig[request.status] || requestStatusConfig.pending_approval;

  const getStatusHeadline = () => {
    switch (request.status) {
      case 'draft':
        return 'Draft request saved';
      case 'pending_approval':
        return 'Awaiting clinical review';
      case 'approved':
        return 'Request approved for network matching';
      case 'searching':
        return 'Network search in progress';
      case 'matched':
        return 'Compatible inventory identified';
      case 'reserved':
        return 'Inventory locked and reserved';
      case 'in_transit':
        return 'Cold-chain dispatch en route';
      case 'completed':
        return 'Blood request fulfilled & received';
      case 'cancelled':
        return 'Request cancelled by hospital';
      case 'rejected':
        return 'Request declined during review';
      default:
        return 'Status update';
    }
  };

  const getStatusExplanation = () => {
    switch (request.status) {
      case 'draft':
        return 'This draft has been stored locally. Complete the clinical requirements whenever you are ready to submit to the SevaSetu network.';
      case 'pending_approval':
        return `Your request for ${request.quantityLitres.toFixed(1)} L of ${request.bloodGroup} has been logged and is awaiting internal verification before querying connected blood banks.`;
      case 'approved':
        return 'Clinical supervisor cleared this requisition. Automated matching engine is preparing to scan regional storage hubs.';
      case 'searching':
        return `We're querying 12 connected blood banks across the regional network for compatible ${request.bloodGroup} inventory with verified test clearance.`;
      case 'matched':
        return `Compatible ${request.quantityLitres.toFixed(1)} L of ${request.bloodGroup} identified at ${request.matchedBloodBankName || 'connected repository'}. Awaiting dispatch authorization.`;
      case 'reserved':
        return `Stock has been locked exclusively for ${request.hospitalName}. Reservation lock prevents allocation to other regional emergency units.`;
      case 'in_transit':
        return `Certified cold-chain vehicle is en route to ${request.deliveryLocation}. Temperature logs monitored continuously.`;
      case 'completed':
        return `Units successfully handed over to ${request.hospitalName} cold storage on ${new Date(request.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`;
      case 'cancelled':
        return `This request was withdrawn. The requirement is no longer active and no blood units will be held for this order.`;
      case 'rejected':
        return `Institutional review did not clear this request for automated network matching. Contact department lead for details.`;
      default:
        return statusMeta.description;
    }
  };

  const getStatusIcon = () => {
    switch (request.status) {
      case 'searching':
        return (
          <div className="w-10 h-10 rounded-full bg-sky-100 text-[#1E4C8A] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 animate-pulse" />
          </div>
        );
      case 'pending_approval':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        );
      case 'approved':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      case 'matched':
      case 'reserved':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
        );
      case 'in_transit':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1E4C8A] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        );
      case 'completed':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            {request.status === 'cancelled' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
        );
      case 'draft':
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
    }
  };

  const updatedTime = new Date(request.updatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {getStatusIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-bold text-base sm:text-lg text-[#0F172A] tracking-tight">
                {getStatusHeadline()}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed max-w-2xl">
              {getStatusExplanation()}
            </p>
          </div>
        </div>

        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-right">
            <span className="block text-[10px] font-mono uppercase text-slate-400">
              Last updated
            </span>
            <span className="text-xs font-mono font-medium text-slate-700">
              {updatedTime}
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
