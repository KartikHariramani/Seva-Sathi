import React, { useState } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { campaignService } from '../../services/campaignService';

interface QRCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QRCheckInModal: React.FC<QRCheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [ticketToken, setTicketToken] = useState('');
  const [officerName, setOfficerName] = useState('Staff Triage Officer');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    donorName?: string;
    bloodGroup?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToken.trim()) return;

    const res = campaignService.checkInDonor(ticketToken.trim(), officerName);
    if (res.success && res.registration) {
      setResult({
        success: true,
        message: `Verified: ${res.registration.donorName} (${res.registration.bloodGroup}) successfully checked in!`,
        donorName: res.registration.donorName,
        bloodGroup: res.registration.bloodGroup,
      });
      onSuccess();
    } else {
      setResult({
        success: false,
        message: res.error || 'Failed to check in donor.',
      });
    }
  };

  const handleReset = () => {
    setTicketToken('');
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C1272D] flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Campaign QR Attendance Desk</h3>
            <p className="text-xs text-slate-500">Scan or verify donor attendance pass</p>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-semibold">{result.success ? 'Attendance Recorded' : 'Verification Rejected'}</p>
                <p className="mt-1 leading-relaxed">{result.message}</p>
              </div>
            </div>

            {result.success && result.donorName && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Donor Name:</span>
                  <span className="font-semibold text-slate-900">{result.donorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blood Group:</span>
                  <span className="font-bold text-[#C1272D]">{result.bloodGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Physical Phlebotomy:</span>
                  <span className="text-emerald-700 font-medium">Eligible & Approved</span>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scan or Enter QR Ticket Token:
              </label>
              <input
                type="text"
                value={ticketToken}
                onChange={(e) => setTicketToken(e.target.value)}
                placeholder="e.g. TK-1002-PKUL-O-"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#C1272D] uppercase"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Test token: <span className="font-mono text-slate-600 font-semibold">TK-1002-PKUL-O-</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Staff Officer:
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C1272D]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Record Check-In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
