import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { RequestForm } from '../../components/requests/RequestForm';
import { useHospitalRequests } from '../../hooks/useHospitalRequests';
import type { BloodRequest, CreateBloodRequestInput } from '../../types/bloodRequest';
import {
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export const CreateBloodRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRequest, saveDraft, getDraft, clearDraft } = useHospitalRequests();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<BloodRequest | null>(null);
  const [draftData, setDraftData] = useState<Partial<CreateBloodRequestInput> | null>(null);
  const [draftAlertShown, setDraftAlertShown] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  // Check for saved draft on mount
  useEffect(() => {
    let mounted = true;
    getDraft().then((saved) => {
      if (mounted && saved && Object.keys(saved).length > 0) {
        setDraftData(saved);
        setDraftAlertShown(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [getDraft]);

  const handleSubmit = async (formData: CreateBloodRequestInput) => {
    setIsSubmitting(true);
    try {
      const created = await createRequest(formData);
      setSubmittedRequest(created);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: Partial<CreateBloodRequestInput>) => {
    setIsSavingDraft(true);
    try {
      await saveDraft(formData);
      setIsSavingDraft(false);
      setDraftNotice('Draft saved successfully to local storage.');
      setTimeout(() => setDraftNotice(null), 4000);
    } catch {
      setIsSavingDraft(false);
    }
  };

  const handleDiscardDraft = async () => {
    await clearDraft();
    setDraftData(null);
    setDraftAlertShown(false);
  };

  return (
    <HospitalLayout pageTitle="Create Blood Request">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between pb-1">
          <Link
            to="/hospital/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&larr; Blood Requests</span>
          </Link>

          <span className="text-xs font-mono text-slate-400">
            Phase 2 Workflow &bull; Step 06
          </span>
        </div>

        {/* 1. SUBMISSION CONFIRMATION STATE (Section 20) */}
        {submittedRequest ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 shadow-premium-lg text-center space-y-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold inline-block mb-3">
                Request Registered Successfully
              </span>
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                {submittedRequest.displayId}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-md mx-auto">
                Your blood requisition has been logged into the network queue.
              </p>
            </div>

            {/* Parameter Strip */}
            <div className="inline-flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
              <span className="font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                {submittedRequest.bloodGroup}
              </span>
              <span>&bull;</span>
              <span className="font-semibold text-sm">
                {submittedRequest.quantityLitres.toFixed(1)} L
              </span>
              <span>&bull;</span>
              <span className="uppercase font-semibold text-[#C1272D]">
                {submittedRequest.priority}
              </span>
            </div>

            {/* "What happens next" Roadmap (Section 20) */}
            <div className="text-left bg-slate-50/70 border border-slate-200/90 rounded-xl p-6 max-w-xl mx-auto space-y-4">
              <h4 className="font-poppins font-semibold text-xs text-slate-700 uppercase tracking-wide">
                What happens next
              </h4>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1E4C8A] text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    01
                  </div>
                  <div>
                    <span className="font-poppins font-semibold text-xs text-[#0F172A] block">
                      Hospital Review
                    </span>
                    <p className="text-xs text-slate-500">
                      Request is reviewed and approved by the hospital clinical workflow.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    02
                  </div>
                  <div>
                    <span className="font-poppins font-semibold text-xs text-slate-700 block">
                      Network Search
                    </span>
                    <p className="text-xs text-slate-500">
                      Compatible available stock is scanned across connected regional blood banks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    03
                  </div>
                  <div>
                    <span className="font-poppins font-semibold text-xs text-slate-700 block">
                      Reservation
                    </span>
                    <p className="text-xs text-slate-500">
                      Identified inventory is securely locked exclusively for your patient.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    04
                  </div>
                  <div>
                    <span className="font-poppins font-semibold text-xs text-slate-700 block">
                      Fulfillment
                    </span>
                    <p className="text-xs text-slate-500">
                      The cold-chain transfer is coordinated for safe hospital delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/hospital/requests/${submittedRequest.id}`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <span>View Request Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/hospital/requests')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg transition-all cursor-pointer"
              >
                <span>Back to Blood Requests</span>
              </button>
            </div>
          </div>
        ) : (
          /* 2. FORM STATE */
          <div className="space-y-6">
            <div>
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                Create Blood Request
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Requisition blood units across the SevaSetu hospital and blood bank network.
              </p>
            </div>

            {/* Restored Draft Alert */}
            {draftAlertShown && draftData && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-[#1E4C8A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900 block">
                      Saved Draft Found
                    </span>
                    <p className="text-blue-700 mt-0.5">
                      You have an unsaved draft from a previous session. The form has been populated with those values.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="text-xs text-blue-900 hover:text-blue-950 underline font-medium cursor-pointer shrink-0"
                >
                  Discard draft
                </button>
              </div>
            )}

            {draftNotice && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{draftNotice}</span>
              </div>
            )}

            {/* Progressive Request Form */}
            <RequestForm
              initialValues={draftData || undefined}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
              isSavingDraft={isSavingDraft}
            />
          </div>
        )}
      </div>
    </HospitalLayout>
  );
};
