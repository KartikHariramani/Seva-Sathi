import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { DonorLayout } from '../../components/donor/DonorLayout';
import { campaignService } from '../../services/campaignService';
import { donorService } from '../../services/donorService';
import { useAuth } from '../../context/AuthContext';
import type { CampaignRegistration, BloodCampaign } from '../../types/campaign';
import { localEventBus } from '../../sync/localEventBus';

export const DonorRegistrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<CampaignRegistration[]>([]);
  const [campaigns, setCampaigns] = useState<BloodCampaign[]>([]);
  const [cancellingRegId, setCancellingRegId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getActiveDonorId = () => {
    const all = donorService.getDonors();
    if (user?.orgId) {
      const match = all.find((d) => d.id === user.orgId);
      if (match) return match.id;
    }
    if (user?.email) {
      const match = all.find((d) => d.email.toLowerCase() === user.email.toLowerCase());
      if (match) return match.id;
    }
    return all[0].id;
  };

  const donorId = getActiveDonorId();

  const loadData = () => {
    const allCamps = campaignService.getCampaigns();
    setCampaigns(allCamps);
    const regs = campaignService.getRegistrationsByDonor(donorId);
    setRegistrations(regs);
  };

  useEffect(() => {
    loadData();
    const unsub1 = localEventBus.on('campaign.registered', loadData);
    const unsub2 = localEventBus.on('campaign.checked_in', loadData);
    const unsub3 = localEventBus.on('campaign.cancelled', loadData);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [donorId]);

  const handleConfirmCancel = () => {
    if (!cancellingRegId) return;
    const res = campaignService.cancelRegistration(cancellingRegId, donorId);
    if (res.success) {
      loadData();
      setToastMessage('Your registration has been cancelled and your slot released.');
      setTimeout(() => setToastMessage(null), 4000);
    }
    setCancellingRegId(null);
  };

  const activeRegistrations = registrations.filter((r) => r.status !== 'CANCELLED');
  const pastRegistrations = registrations.filter((r) => r.status === 'CANCELLED' || r.status === 'ATTENDED');

  return (
    <DonorLayout pageTitle="My Registrations & QR Passes">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              My Registrations &amp; Digital QR Passes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your official digital passes for voluntary blood donation drives across Maharashtra.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold shrink-0">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>{activeRegistrations.length} Active Pass{activeRegistrations.length === 1 ? '' : 'es'}</span>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs font-semibold text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Active Passes Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold font-poppins text-slate-900 flex items-center gap-2">
            <span>Upcoming Drives &amp; Entry Tickets</span>
            <span className="text-xs font-normal text-slate-400 font-mono">({activeRegistrations.length})</span>
          </h2>

          {activeRegistrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No active drive registrations</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not currently have any upcoming donation reservations. Browse published drives to reserve your slot.
              </p>
              <a
                href="/donor/portal"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C1272D] text-white text-xs font-semibold hover:bg-[#A01F24] transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Browse Scheduled Drives</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeRegistrations.map((reg) => {
                const camp = campaigns.find((c) => c.id === reg.campaignId);
                const isAttended = reg.status === 'ATTENDED';

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    {/* Header Strip */}
                    <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {reg.status}
                        </span>
                        <h3 className="font-bold font-poppins text-base text-slate-900 mt-1.5 leading-snug">
                          {camp?.title || 'Community Blood Drive'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {camp?.organizerName || 'NSS Volunteer Alliance'}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C1272D] font-poppins font-bold text-sm flex items-center justify-center shrink-0 border border-red-100">
                        {reg.bloodGroup}
                      </div>
                    </div>

                    {/* Venue & Time Details */}
                    <div className="p-5 py-4 space-y-2.5 text-xs text-slate-600 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{camp?.startDate}</span>
                        <span>&bull;</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-emerald-700">{reg.timeSlot}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-600 leading-tight">
                          {camp?.venueName}, {camp?.venueAddress}
                        </span>
                      </div>
                    </div>

                    {/* High-Contrast Digital QR Pass Card */}
                    <div className="p-5 bg-slate-900 text-white flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 bg-white text-slate-900 rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow-sm border border-slate-700">
                          <QrCode className="w-full h-full text-slate-900" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400 font-bold block">
                            OFFICIAL DIGITAL PASS
                          </span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-100 block">
                            {reg.qrTicketToken}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-none">
                            Donor ID: {reg.donorId}
                          </span>
                        </div>
                      </div>

                      {isAttended ? (
                        <div className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                          CHECKED IN
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCancellingRegId(reg.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-500/50 text-rose-300 hover:bg-rose-950/80 text-[11px] font-semibold transition-colors shrink-0"
                        >
                          Cancel Slot
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past & Cancelled History */}
          {pastRegistrations.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold font-poppins text-slate-700 mb-3">
                Past &amp; Cancelled Registration Records ({pastRegistrations.length})
              </h3>
              <div className="space-y-2">
                {pastRegistrations.map((p) => {
                  const camp = campaigns.find((c) => c.id === p.campaignId);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{camp?.title || 'Donation Drive'}</span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Slot: {p.timeSlot} • Pass: {p.qrTicketToken}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.status === 'ATTENDED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cancellation Confirmation Dialog */}
        {cancellingRegId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertOctagon className="w-6 h-6" />
                <h3 className="font-bold font-poppins text-base text-slate-900">
                  Cancel Donation Reservation?
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to release your reserved time slot? This capacity will immediately be made available to other voluntary donors or waitlisted candidates.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingRegId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  Yes, Release Slot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DonorLayout>
  );
};
