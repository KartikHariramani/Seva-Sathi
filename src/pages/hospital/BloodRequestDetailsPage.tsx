import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { useHospitalRequests } from '../../hooks/useHospitalRequests';
import { RequestStatusBadge } from '../../components/requests/RequestStatusBadge';
import { RequestPriorityBadge } from '../../components/requests/RequestPriorityBadge';
import { RequestTimeline } from '../../components/requests/RequestTimeline';
import { RequestStatusCard } from '../../components/requests/RequestStatusCard';
import { RequestSummary } from '../../components/requests/RequestSummary';
import { RequestCancelDialog } from '../../components/requests/RequestCancelDialog';
import { isRequestCancellable, isRequestEditable } from '../../utils/requestStatus';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export const BloodRequestDetailsPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { getRequestById, cancelRequest, refreshRequests } = useHospitalRequests();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelToast, setCancelToast] = useState(false);

  const request = requestId ? getRequestById(requestId) : undefined;

  const handleConfirmCancel = async (id: string, reason?: string) => {
    await cancelRequest(id, reason);
    setCancelToast(true);
    setTimeout(() => setCancelToast(false), 4000);
  };

  // Not found fallback
  if (!request) {
    return (
      <HospitalLayout pageTitle="Request Details">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center max-w-md mx-auto my-12 shadow-card">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
            Request Not Found
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 mb-5">
            The blood requisition with identifier <span className="font-mono">{requestId}</span> could not be located in this hospital node ledger.
          </p>
          <Link
            to="/hospital/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Blood Requests</span>
          </Link>
        </div>
      </HospitalLayout>
    );
  }

  const canCancel = isRequestCancellable(request.status);
  const canEdit = isRequestEditable(request.status);

  return (
    <HospitalLayout pageTitle={`Request ${request.displayId}`}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/hospital/requests"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Blood Requests</span>
            </Link>
            <span className="text-slate-300 font-mono">/</span>
            <span className="font-mono font-bold text-sm text-[#0F172A]">
              {request.displayId}
            </span>
            <RequestPriorityBadge priority={request.priority} size="sm" />
            <RequestStatusBadge status={request.status} size="sm" />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {canCancel && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancel Request
              </button>
            )}

            {!canEdit && request.status !== 'cancelled' && request.status !== 'rejected' && (
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline-block">
                Processing locked &bull; Cannot modify
              </span>
            )}
          </div>
        </div>

        {/* Cancellation Success Feedback Banner */}
        {cancelToast && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-mono flex items-center justify-between shadow-premium animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Request {request.displayId} has been cancelled successfully.</span>
            </div>
          </div>
        )}

        {/* 1. CURRENT STATUS CARD (Section 25) */}
        <RequestStatusCard request={request} onRefresh={refreshRequests} />

        {/* 2. STATUS TIMELINE (Section 24) */}
        <RequestTimeline request={request} />

        {/* 3. TWO-COLUMN MAIN DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: Request Specifications + Activity (65% on desktop - col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Request Summary Specification Card */}
            <RequestSummary request={request} />

            {/* FUTURE SMART MATCHING RESERVED AREA (Section 29 & 56) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-poppins font-semibold text-sm text-[#0F172A]">
                    Network Match &amp; Load Balancing
                  </h4>
                </div>
                <Link
                  to={`/hospital/requests/${request.id}/matching`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Open Load Balancer</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {request.status === 'matched' || request.status === 'reserved' || request.status === 'in_transit' || request.status === 'completed' ? (
                <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200/80 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">MATCHED REPOSITORY</span>
                    <span className="font-bold text-indigo-950">
                      {request.matchedBloodBankName || 'Civic Cryo Blood Repository'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">MATCH QUALITY SCORE</span>
                    <span className="font-bold text-emerald-700">
                      {request.matchScore || 98}% compatibility index
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ESTIMATED FULFILLMENT TIME</span>
                    <span className="font-semibold text-slate-800">
                      {request.estimatedFulfillmentTime || '~45 mins'} ({request.distanceKm || '8.4'} km radius)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 leading-relaxed font-inter">
                  <p>
                    Matching information and connected blood-bank inventory details will be dynamically populated here once compatible stock is locked during the automated Phase 3 load-balancing cycle.
                  </p>
                </div>
              )}
            </div>

            {/* REQUEST ACTIVITY LOG (Section 28) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-poppins font-semibold text-sm text-[#0F172A]">
                  Audit & Activity Log
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  {request.activities.length} {request.activities.length === 1 ? 'event' : 'events'} logged
                </span>
              </div>

              <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                {request.activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-[#1E4C8A]" />
                    <div className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0F172A] font-inter">
                          {act.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {act.timeFormatted || new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-slate-500 mt-0.5 leading-relaxed font-inter">
                          {act.description}
                        </p>
                      )}
                      {act.actor && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Actor: {act.actor}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Hospital Context & Assistance (35% on desktop - col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Requesting Hospital Context (Section 27) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-card space-y-3.5">
              <h4 className="font-poppins font-semibold text-xs text-slate-500 uppercase tracking-wider">
                Requesting Node Context
              </h4>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">{request.hospitalName}</span>
                    <span className="text-slate-500 text-[11px] block">{request.hospitalCity}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Node Identifier:</span>
                  <span className="font-bold text-slate-800">{request.hospitalId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Network Telemetry:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Connected</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Intake Unit:</span>
                  <span className="text-slate-700 text-right truncate max-w-[150px]">
                    {request.deliveryLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Help */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#1E4C8A]" />
                <h5 className="font-poppins font-semibold text-xs text-[#0F172A]">
                  Clinical Operations Support
                </h5>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed">
                Need to escalate this requisition or alter medical parameters? Contact the regional SevaSetu command dispatch desk directly.
              </p>

              <div className="pt-2 text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Helpline: 1800-SEVA-SETU</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>24/7 Trauma Hotline</span>
                </div>
              </div>
            </div>

            {/* AI Roadmap Note (Section 48) */}
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs font-mono text-slate-500 bg-white">
              <div className="flex items-center gap-1.5 text-[#1E4C8A] font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SevaSetu Architecture Note</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                This request record is ready for Phase 3 predictive load balancing. Connected blood banks will receive real-time dispatch alerts upon approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <RequestCancelDialog
        isOpen={isCancelModalOpen}
        request={request}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />
    </HospitalLayout>
  );
};
