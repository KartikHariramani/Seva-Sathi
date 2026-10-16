import React, { useState, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { DonorLayout } from '../../components/donor/DonorLayout';
import { donorService } from '../../services/donorService';
import { telegramService, type LinkTokenResponse } from '../../services/telegramService';
import { unifiedTelegramNotificationService } from '../../services/unifiedTelegramNotificationService';
import { useAuth } from '../../context/AuthContext';
import type { CommunicationChannel, DonorProfile } from '../../types/donor';

export const DonorNotificationsPage: React.FC = () => {
  const { user } = useAuth();

  const getActiveDonor = (): DonorProfile => {
    const all = donorService.getDonors();
    if (user?.orgId) {
      const match = all.find((d) => d.id === user.orgId);
      if (match) return match;
    }
    if (user?.email) {
      const match = all.find((d) => d.email.toLowerCase() === user.email.toLowerCase());
      if (match) return match;
    }
    return all[0];
  };

  const [donor, setDonor] = useState<DonorProfile>(() => getActiveDonor());
  const [linkTokenInfo, setLinkTokenInfo] = useState<LinkTokenResponse | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [testAlertStatus, setTestAlertStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Sync latest linked status from backend
  const refreshLinkStatus = async () => {
    try {
      const res = await telegramService.getUserLink(donor.id);
      if (res.isLinked && res.link) {
        const updated = donorService.updateDonorConsent(donor.id, {
          telegramChatId: res.link.telegramChatId,
          preferredChannel: 'TELEGRAM',
        });
        setDonor(updated);
        setLinkTokenInfo(null);
        showToast('Telegram account connection verified with backend.');
      } else if (!res.isLinked && donor.telegramChatId) {
        const updated = donorService.updateDonorConsent(donor.id, {
          telegramChatId: undefined,
        });
        setDonor(updated);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    refreshLinkStatus();
  }, [donor.id]);

  // Token countdown timer
  useEffect(() => {
    if (!linkTokenInfo?.expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const calcRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(linkTokenInfo.expiresAt!).getTime() - Date.now()) / 1000));
      setSecondsRemaining(diff);
      return diff;
    };

    calcRemaining();
    const timer = setInterval(() => {
      const rem = calcRemaining();
      if (rem <= 0) {
        clearInterval(timer);
        setLinkTokenInfo(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [linkTokenInfo?.expiresAt]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleGenerateTelegramLink = async () => {
    setIsLinking(true);
    try {
      const res = await telegramService.generateLinkingToken(donor.id, donor.fullName, 'donor');
      setLinkTokenInfo(res);
      if (res.success) {
        showToast('Single-use linking token created. Valid for 15 minutes.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleCopyDeepLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleUnlink = async () => {
    await telegramService.unlinkUser(donor.id);
    const updated = donorService.updateDonorConsent(donor.id, {
      telegramChatId: undefined,
      preferredChannel: 'IN_APP',
    });
    setDonor(updated);
    showToast('Telegram account successfully disconnected.');
  };

  const handleSendTestAlert = async () => {
    if (!donor.telegramChatId) return;
    setIsTesting(true);
    setTestAlertStatus(null);
    try {
      const res = await unifiedTelegramNotificationService.sendLiveTestAlert(
        donor.telegramChatId,
        `🔔 <b>SEVASETU TEST BROADCAST — CLINICAL VERIFICATION</b>\n\nHello <b>${donor.fullName}</b>! Your Telegram connection is active and ready to receive regional blood shortage alerts and voluntary drive passes.`
      );
      if (res.success) {
        setTestAlertStatus('✅ Test message accepted by Telegram! Check your Telegram app.');
      } else {
        setTestAlertStatus(`⚠️ Delivery note: ${res.error || res.status}`);
      }
    } catch (err: any) {
      setTestAlertStatus(`❌ Test failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleEmergencyConsent = () => {
    const updated = donorService.updateDonorConsent(donor.id, {
      consentEmergencyAlerts: !donor.consentEmergencyAlerts,
    });
    setDonor(updated);
    showToast(
      updated.consentEmergencyAlerts
        ? 'Emergency shortage alerts enabled.'
        : 'Emergency shortage alerts paused.'
    );
  };

  const handleToggleFutureConsent = () => {
    const updated = donorService.updateDonorConsent(donor.id, {
      consentFutureDrives: !donor.consentFutureDrives,
    });
    setDonor(updated);
    showToast('Drive invitation preference updated.');
  };

  const handleChannelChange = (ch: CommunicationChannel) => {
    const updated = donorService.updateDonorConsent(donor.id, {
      preferredChannel: ch,
    });
    setDonor(updated);
    showToast(`Preferred channel set to ${ch}.`);
  };

  return (
    <DonorLayout pageTitle="Notification & Telegram Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              Notification &amp; Telegram Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure communication channels, verify Telegram account linking, and set emergency outreach permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshLinkStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Check Sync</span>
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Telegram Bot Integration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <h2 className="font-bold font-poppins text-base text-slate-900">
                  Telegram Bot Channel
                </h2>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  donor.telegramChatId
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {donor.telegramChatId ? 'CONNECTED' : 'NOT LINKED'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Connect your account to <b>@sevasathibot</b> to receive instant digital QR passes, attendance confirmation, and emergency blood shortage alerts directly on Telegram.
            </p>

            {donor.telegramChatId ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Synchronized with SevaSetu Network</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Telegram Chat ID: <span className="font-bold text-slate-800">{donor.telegramChatId}</span>
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    Real-time transaction dispatches are enabled for this account.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendTestAlert}
                    disabled={isTesting}
                    className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTesting ? 'Transmitting...' : 'Send Test Alert'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>

                {testAlertStatus && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    {testAlertStatus}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!linkTokenInfo ? (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                    <p className="text-xs text-slate-600">
                      Generate an encrypted one-time link token to securely pair your Telegram account without sharing phone numbers.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateTelegramLink}
                      disabled={isLinking}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isLinking ? 'Generating token...' : 'Pair with Telegram Bot'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-xl bg-sky-50/60 border border-sky-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sky-900">Secure Pair Request Active</span>
                      {secondsRemaining !== null && (
                        <span className="font-mono text-[10px] text-sky-700 font-bold">
                          Expires in {secondsRemaining}s
                        </span>
                      )}
                    </div>

                    <a
                      href={linkTokenInfo.deepLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-xl bg-[#229ED9] hover:bg-[#1E8BC0] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Telegram Bot &amp; Start</span>
                    </a>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-600 truncate">
                        {linkTokenInfo.deepLink}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyDeepLink(linkTokenInfo.deepLink!)}
                        className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Token: <code className="font-bold text-slate-700">{linkTokenInfo.token}</code></span>
                      <button type="button" onClick={() => setLinkTokenInfo(null)} className="underline hover:text-slate-800">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Permissions & Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold font-poppins text-base text-slate-900">
                Ethical Consent &amp; Preferences
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Emergency Shortage Alerts</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Receive urgent broadcasts when regional ICU, trauma, or surgery units have critical deficits of blood group {donor.bloodGroup}.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={donor.consentEmergencyAlerts}
                  onChange={handleToggleEmergencyConsent}
                  className="rounded text-[#C1272D] focus:ring-[#C1272D] mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Voluntary Donation Drives</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Invitations to community blood donation drives and NSS university volunteer campaigns in your district.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={donor.consentFutureDrives}
                  onChange={handleToggleFutureConsent}
                  className="rounded text-blue-600 focus:ring-blue-600 mt-1 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Preferred Delivery Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TELEGRAM', 'IN_APP', 'SMS'] as CommunicationChannel[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleChannelChange(ch)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                        donor.preferredChannel === ch
                          ? 'border-[#C1272D] bg-red-50 text-[#C1272D] shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DonorLayout>
  );
};
