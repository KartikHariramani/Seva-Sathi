import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Search, 
  RefreshCw, 
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { eventMobilisationService } from '../../services/eventMobilisationService';
import { useAuth } from '../../context/AuthContext';
import type { CampaignRegistration } from '../../types/campaign';

interface VolunteerQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignTitle?: string;
  volunteerId?: string;
  onCheckInSuccess?: (registration: CampaignRegistration) => void;
}

export const VolunteerQRScannerModal: React.FC<VolunteerQRScannerModalProps> = ({
  isOpen,
  onClose,
  campaignTitle = 'Central Vidarbha Voluntary Blood Drive',
  volunteerId = 'VOLUNTEER-GATE-01',
  onCheckInSuccess,
}) => {
  const { user } = useAuth();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Result States
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
    registration?: CampaignRegistration;
    previousTimestamp?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
      setManualToken('');
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Web camera API is not supported in this browser environment. Please use manual ticket entry.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('[QRScanner] Camera access unavailable:', err);
      setCameraError('Camera access unavailable or permission denied. Please enter Ticket Token manually below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleProcessToken = (tokenToProcess: string) => {
    if (!tokenToProcess.trim()) return;

    setIsProcessing(true);
    setScanResult(null);

    const outcome = eventMobilisationService.checkInDonor(tokenToProcess.trim(), volunteerId, {
      scannerRole: user?.role,
      scannerOrgId: user?.orgId,
    });

    if (outcome.success && outcome.registration) {
      setScanResult({
        type: 'success',
        title: 'Check-In Verified!',
        message: `Welcome, ${outcome.registration.donorName}! Registration pass marked as ATTENDED.`,
        registration: outcome.registration,
      });
      if (onCheckInSuccess) {
        onCheckInSuccess(outcome.registration);
      }
    } else if (outcome.code === 'ALREADY_CHECKED_IN') {
      setScanResult({
        type: 'duplicate',
        title: 'Duplicate Check-In Warning',
        message: outcome.error || 'This QR pass has already been used.',
        registration: outcome.registration,
        previousTimestamp: outcome.previousCheckInAt,
      });
    } else {
      setScanResult({
        type: 'error',
        title: 'Check-In Rejected',
        message: outcome.error || 'Invalid or cancelled pass.',
        registration: outcome.registration,
      });
    }

    setIsProcessing(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessToken(manualToken);
  };

  // Quick Simulation Buttons for QA / Demonstration
  const handleSimulateValidScan = () => {
    handleProcessToken('TK-VID-8812-PASS');
  };

  const handleSimulateDuplicateScan = () => {
    // First ensures it's checked in, then scans again
    eventMobilisationService.checkInDonor('TK-VID-8812-PASS', volunteerId);
    handleProcessToken('TK-VID-8812-PASS');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#C1272D] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-poppins">Volunteer QR Triage Desk</h3>
              <p className="text-[11px] text-slate-500 font-mono">{campaignTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Camera Viewport */}
          <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center">
            {cameraActive ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" />
                {/* Aiming Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-44 border-2 border-red-500/80 rounded-2xl relative animate-pulse">
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500" />
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500" />
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Camera Live • Align Donor QR
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs font-medium text-slate-300">
                  {cameraError || 'Camera inactive.'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Scan Result Feedback Banner */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border animate-in zoom-in-95 duration-150 ${
                scanResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : scanResult.type === 'duplicate'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : scanResult.type === 'duplicate' ? (
                  <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1 text-xs flex-1">
                  <h4 className="font-bold text-sm font-poppins">{scanResult.title}</h4>
                  <p className="leading-relaxed">{scanResult.message}</p>

                  {scanResult.registration && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 block">Donor Name:</span>
                        <span className="font-bold font-sans">{scanResult.registration.donorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Blood Group:</span>
                        <span className="font-bold text-[#C1272D]">{scanResult.registration.bloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Reserved Slot:</span>
                        <span>{scanResult.registration.timeSlot}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Current Status:</span>
                        <span className="font-bold uppercase">{scanResult.registration.status}</span>
                      </div>
                    </div>
                  )}

                  {scanResult.previousTimestamp && (
                    <p className="text-[10px] text-rose-700 font-mono mt-1">
                      Prior check-in recorded at: {new Date(scanResult.previousTimestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Fallback Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Manual Ticket ID Lookup (Barcode / Pass Token)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. TK-VID-8812-PASS"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-[#C1272D] focus:border-[#C1272D]"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualToken.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify</span>
              </button>
            </div>
          </form>

          {/* Simulation & QA Desk */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
              <span>Triage Quick Test Controls (Demo Verification):</span>
              <span className="font-mono">Gate Desk #1</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulateValidScan}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Simulate Valid Pass</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateDuplicateScan}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate Duplicate Scan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
