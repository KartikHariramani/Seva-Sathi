import React, { useState, useEffect } from 'react';
import {
  Heart,
  Bell,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MapPin,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Radio,
  Clock,
  Award,
} from 'lucide-react';
import type { CommunicationChannel, DonorNotificationStatus, DonorProfile, EmergencyDonorNotification } from '../../types/donor';
import { donorService } from '../../services/donorService';
import { localEventBus } from '../../sync/localEventBus';

export const DonorPortalPage: React.FC = () => {
  // Use first default donor as active session
  const [donor, setDonor] = useState<DonorProfile>(() => donorService.getDonors()[0]);
  const [notifications, setNotifications] = useState<EmergencyDonorNotification[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = () => {
    const current = donorService.getDonorById(donor.id) || donor;
    setDonor(current);
    const notifs = donorService.getNotifications({ donorId: donor.id });
    setNotifications(notifs);
  };

  useEffect(() => {
    loadData();
    const unsubMob = localEventBus.on('donors.mobilized', loadData);
    const unsubResp = localEventBus.on('donor.responded', loadData);
    const unsubUpd = localEventBus.on('donor.updated', loadData);

    return () => {
      unsubMob();
      unsubResp();
      unsubUpd();
    };
  }, [donor.id]);

  const handleToggleAvailability = () => {
    const updated = donorService.updateDonorConsent(donor.id, {
      isAvailable: !donor.isAvailable,
    });
    setDonor(updated);
    setActionMessage(
      updated.isAvailable
        ? 'Status updated: You are now marked Available for emergency calls.'
        : 'Status updated: You are marked Deferred / Away. Emergency alerts are paused.'
    );
  };

  const handleToggleEmergencyConsent = () => {
    const updated = donorService.updateDonorConsent(donor.id, {
      consentEmergencyAlerts: !donor.consentEmergencyAlerts,
    });
    setDonor(updated);
    setActionMessage(
      updated.consentEmergencyAlerts
        ? 'Emergency outreach consent enabled.'
        : 'Emergency outreach consent revoked. The system will NOT contact you during shortages.'
    );
  };

  const handleToggleFutureConsent = () => {
    const updated = donorService.updateDonorConsent(donor.id, {
      consentFutureDrives: !donor.consentFutureDrives,
    });
    setDonor(updated);
  };

  const handleChannelChange = (channel: CommunicationChannel) => {
    const updated = donorService.updateDonorConsent(donor.id, {
      preferredChannel: channel,
    });
    setDonor(updated);
    setActionMessage(`Preferred delivery channel updated to ${channel}.`);
  };

  const handleRespond = (notifId: string, status: DonorNotificationStatus) => {
    donorService.respondToNotification(notifId, status);
    loadData();
    if (status === 'ACCEPTED') {
      setActionMessage(
        'Thank you! Your response is logged. Please arrive at the hospital transfusion desk within 90 minutes.'
      );
    } else {
      setActionMessage('Response recorded. Thank you for notifying the clinical team.');
    }
  };

  // Seed sample emergency alert for demonstration if none exist
  const handleTriggerSimulatedShortage = () => {
    donorService.mobilizeForShortage({
      requestId: 'REQ-EMERG-904',
      bloodGroup: donor.bloodGroup,
      shortageUnits: 2,
      hospitalName: 'Metropolitan Trauma & General Hospital',
      hospitalCity: 'Nagpur',
      hospitalLat: 21.128,
      hospitalLng: 79.098,
      urgency: 'critical',
    });
    loadData();
    setActionMessage('Simulated regional emergency shortage broadcast delivered to your feed!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              Donor Volunteer Hub & Emergency Feed
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              Verified Donor Network
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Manage your donation eligibility, emergency communication consent, and respond to live clinical shortages.
          </p>
        </div>

        <button
          onClick={handleTriggerSimulatedShortage}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Simulate Emergency Shortage</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-sm text-blue-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Donor Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#C1272D] text-white flex flex-col items-center justify-center shadow-md shrink-0">
            <span className="text-2xl font-bold font-poppins leading-none">{donor.bloodGroup}</span>
            <span className="text-[10px] font-mono mt-0.5 opacity-90">DONOR</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-poppins">{donor.fullName}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {donor.city} • Donor ID: {donor.id} • Registered Volunteer
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                {donor.totalDonations} Lives Touched
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                {donor.rewardPoints} Seva Points
              </span>
            </div>
          </div>
        </div>

        {/* Realtime Availability Switch */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-6 shrink-0">
          <div>
            <div className="text-xs font-bold text-slate-900">Emergency Call Status</div>
            <div className="text-[11px] text-slate-500">
              {donor.isAvailable ? 'Ready for urgent calls' : 'Deferred / Traveling'}
            </div>
          </div>

          <button
            onClick={handleToggleAvailability}
            className={`p-1 rounded-full transition-colors ${
              donor.isAvailable ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {donor.isAvailable ? (
              <ToggleRight className="w-10 h-10" />
            ) : (
              <ToggleLeft className="w-10 h-10" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Consent & Communication Preferences (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Communication & Consent Policy</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with ethical clinical guidelines, Seva Sathi strictly honors your explicit communication permissions.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Emergency Shortage Alerts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Receive urgent broadcasts when ICU/surgery blood stocks run critically low
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={donor.consentEmergencyAlerts}
                  onChange={handleToggleEmergencyConsent}
                  className="rounded text-[#C1272D] focus:ring-[#C1272D] mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Future Donation Drives
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Invitations to regional community blood drives
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={donor.consentFutureDrives}
                  onChange={handleToggleFutureConsent}
                  className="rounded text-blue-600 focus:ring-blue-600 mt-1"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Preferred Notification Channel
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['IN_APP', 'TELEGRAM', 'SMS'] as CommunicationChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => handleChannelChange(ch)}
                    className={`py-1.5 px-2 rounded-lg border font-mono text-[11px] transition-all ${
                      donor.preferredChannel === ch
                        ? 'border-[#C1272D] bg-red-50 text-[#C1272D] font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {donor.preferredChannel === 'TELEGRAM' && (
                <div className="mt-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-900 space-y-1 font-mono">
                  <div className="font-bold">Telegram Chat Linked:</div>
                  <div>ID: {donor.telegramChatId || 'Not connected'}</div>
                  <div className="text-[10px] text-sky-700 font-sans">
                    Send /start to @RaktSetuBot on Telegram to verify.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Life Saver Badge Card */}
          <div className="bg-linear-to-br from-[#0F172A] to-[#1E293B] text-white p-5 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-red-400">HERO BADGE</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-base font-bold font-poppins">Universal Savior Tier</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your donation history has directly contributed to emergency trauma surgeries and neonatal transfusions across Maharashtra.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400">
              Next eligible donation: November 15, 2026
            </div>
          </div>
        </div>

        {/* Right: Live Emergency Shortage Broadcasts Feed (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C1272D]" />
              <h3 className="text-sm font-bold text-slate-900">
                Live Regional Shortage Broadcasts
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {notifications.length} Broadcast{notifications.length === 1 ? '' : 's'}
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-2">
              <Heart className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">
                No active emergency shortages for {donor.bloodGroup} in your area.
              </p>
              <p className="text-xs text-slate-400">
                Regional blood banks currently meet demand. We will notify you instantly if an urgent requirement arises.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => {
                const isAccepted = notif.status === 'ACCEPTED';
                const isDeclined = notif.status === 'DECLINED';

                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-xl border p-5 transition-all shadow-sm ${
                      isAccepted
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : isDeclined
                          ? 'border-slate-200 opacity-60'
                          : notif.urgency === 'critical'
                            ? 'border-red-300 ring-1 ring-red-100'
                            : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg font-bold font-poppins text-[#C1272D]">
                          {notif.bloodGroup}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono">
                          {notif.requiredUnits} Units Needed
                        </span>
                        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {notif.urgency}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(notif.sentAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="py-3 space-y-2">
                      <h4 className="text-sm font-bold text-slate-900">{notif.hospitalName}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.messageText}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {notif.distanceKm} km away ({notif.hospitalCity})
                        </span>
                        <span>Delivered via: {notif.channel}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {notif.status === 'SENT' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleRespond(notif.id, 'ACCEPTED')}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>I Can Donate (Accept)</span>
                          </button>
                          <button
                            onClick={() => handleRespond(notif.id, 'DECLINED')}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          {isAccepted ? (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              Accepted • Scheduled for emergency screening
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500">
                              <XCircle className="w-4 h-4" />
                              Declined
                            </span>
                          )}
                        </div>
                      )}

                      <span className="text-[11px] font-mono text-slate-400">ID: {notif.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
