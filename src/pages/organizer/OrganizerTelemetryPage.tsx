import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  QrCode, 
  ShieldCheck, 
  RefreshCw, 
  Activity
} from 'lucide-react';
import { eventMobilisationService } from '../../services/eventMobilisationService';
import { VolunteerQRScannerModal } from '../../components/campaign/VolunteerQRScannerModal';
import { localEventBus } from '../../sync/localEventBus';

export const OrganizerTelemetryPage: React.FC = () => {
  const [selectedCampaignId] = useState<string>('CMP-202610-001');
  const [telemetry, setTelemetry] = useState(() => eventMobilisationService.getCampaignTelemetry('CMP-202610-001'));
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  const refreshData = () => {
    const updated = eventMobilisationService.getCampaignTelemetry(selectedCampaignId);
    setTelemetry(updated);
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    refreshData();
    const unsub1 = localEventBus.on('campaign.checked_in', refreshData);
    const unsub2 = localEventBus.on('campaign.registered', refreshData);
    const unsub3 = localEventBus.on('campaign.cancelled', refreshData);
    const unsub4 = localEventBus.on('registration.confirmed', refreshData);
    const unsub5 = localEventBus.on('registration.cancelled', refreshData);
    const unsub6 = localEventBus.on('waitlist.promoted', refreshData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [selectedCampaignId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              Real-Time Mobilisation & Turnout Telemetry
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Authoritative event telemetry, arrival density distribution, and real-time attendance triage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={refreshData}
            title="Refresh Authoritative Data"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Open Volunteer Scanner</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registered */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Signups</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{telemetry.totalRegistrations}</div>
          <p className="text-[11px] text-slate-400">Excludes cancelled slots</p>
        </div>

        {/* Confirmed RSVPs */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Confirmed RSVPs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{telemetry.confirmedCount}</div>
          <p className="text-[11px] text-slate-400">Telegram & In-App confirmed</p>
        </div>

        {/* Waitlisted Candidates */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Waitlist Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">{telemetry.waitlistedCount}</div>
          <p className="text-[11px] text-slate-400">Auto-promotes on cancellation</p>
        </div>

        {/* Actual Attended (Checked-In) */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold">
            <span>Actual Check-Ins</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">{telemetry.actualAttended}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Verified QR Triage Scans</p>
        </div>

        {/* Predicted Turnout */}
        <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-sky-900 text-xs font-semibold">
            <span>Predicted Turnout</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700">~{telemetry.predictedTurnout} Units</div>
          <p className="text-[10px] text-sky-600">Logistic ML Forecast</p>
        </div>
      </div>

      {/* Notice Banner Distinguishing Prediction vs Reality */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <b>Clinical Integrity Notice:</b> Predicted turnout (~{telemetry.predictedTurnout}) represents a statistical machine learning estimate based on prior donor behavior. It is strictly segregated from actual verified physical check-ins ({telemetry.actualAttended}).
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 shrink-0">Updated: {lastRefreshed}</span>
      </div>

      {/* Main Grid: Slot Arrival Density (8 cols) & Recent Triage Check-Ins (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 30-Minute Slot Arrival Density */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-poppins">Slot Arrival Density Distribution</h3>
              <p className="text-xs text-slate-500">30-minute interval capacity and actual phlebotomy check-ins</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{telemetry.slotDensity.length} Configured Intervals</span>
          </div>

          <div className="space-y-3">
            {telemetry.slotDensity.map((slot) => {
              const isFull = slot.registered >= slot.capacity;
              return (
                <div
                  key={slot.slotId}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{slot.time}</span>
                      <span className="font-mono text-[11px] text-slate-400">ID: {slot.slotId}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span>
                        Capacity: <b className="text-slate-900">{slot.registered}</b> / {slot.capacity}
                      </span>
                      <span>
                        Attended: <b className="text-emerald-700">{slot.attended}</b>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFull ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isFull ? 'CAPACITY REACHED' : 'OPEN'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    {/* Attended portion */}
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (slot.attended / slot.capacity) * 100)}%` }}
                      title={`Attended: ${slot.attended}`}
                    />
                    {/* Registered (not yet checked in) */}
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((slot.registered - slot.attended) / slot.capacity) * 100))}%`,
                      }}
                      title={`Pending Arrival: ${slot.registered - slot.attended}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Triage Stream (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 font-poppins">Recent Triage Check-Ins</h3>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Feed
            </span>
          </div>

          {telemetry.recentCheckIns.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <QrCode className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-500">No donors checked in yet today.</p>
              <p className="text-[11px] text-slate-400">Launch the scanner to record the first arrival.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {telemetry.recentCheckIns.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.donorName}</span>
                    <span className="font-mono font-bold text-[#C1272D]">{item.bloodGroup}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Slot: {item.timeSlot}</span>
                    <span className="font-mono">{new Date(item.checkedInAt || 0).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Token: {item.qrTicketToken} • Verified by {item.checkedInBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Scanner Modal */}
      <VolunteerQRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        campaignTitle="Central Vidarbha Voluntary Blood Drive"
        volunteerId="VOLUNTEER-GATE-01"
        onCheckInSuccess={() => refreshData()}
      />
    </div>
  );
};
