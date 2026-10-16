import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  Bell,
  CheckCircle,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { alertBuzzerService } from '../../services/alertBuzzerService';
import { shortageDetectionService } from '../../services/shortageDetectionService';
import type { BuzzerState, InventoryShortageEvent } from '../../types/alert';

export const ShortageBuzzerBanner: React.FC<{
  facilityId?: string;
  onNavigateToReplenish?: () => void;
}> = ({ facilityId, onNavigateToReplenish }) => {
  const [buzzerState, setBuzzerState] = useState<BuzzerState>(() => alertBuzzerService.getState());
  const [activeShortages, setActiveShortages] = useState<InventoryShortageEvent[]>(() =>
    shortageDetectionService.getActiveShortages(facilityId)
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [testBeepMessage, setTestBeepMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubBuzzer = alertBuzzerService.subscribe((state) => {
      setBuzzerState({ ...state });
    });

    const unsubShortages = shortageDetectionService.subscribe((shortages) => {
      if (facilityId) {
        setActiveShortages(shortages.filter((s) => s.facilityId === facilityId));
      } else {
        setActiveShortages([...shortages]);
      }
    });

    return () => {
      unsubBuzzer();
      unsubShortages();
    };
  }, [facilityId]);

  // If no shortages are currently active, show a compact ready indicator or nothing
  if (activeShortages.length === 0) {
    return null;
  }

  const criticalShortages = activeShortages.filter(
    (s) => s.severity === 'CRITICAL' || s.severity === 'OUT_OF_STOCK'
  );
  const hasCritical = criticalShortages.length > 0;
  const isAllAcknowledged = activeShortages.every((s) => s.acknowledged);

  const handleUnlockAudio = () => {
    alertBuzzerService.unlockAudio();
  };

  const handleToggleMute = () => {
    if (buzzerState.isMuted) {
      alertBuzzerService.unmute();
    } else {
      alertBuzzerService.mute();
    }
  };

  const handleAcknowledgeAll = () => {
    for (const shortage of activeShortages) {
      shortageDetectionService.acknowledge(shortage.id);
    }
    alertBuzzerService.acknowledgeAlert(activeShortages[0]?.id || 'all');
  };

  const handleTestBuzzer = () => {
    alertBuzzerService.unlockAudio();
    alertBuzzerService.triggerBuzzer('CRITICAL', 'TEST-ALERT');
    setTestBeepMessage('Sound test played (dual-pulse 880Hz / 660Hz harmonic)');
    setTimeout(() => setTestBeepMessage(null), 3500);
  };

  if (isMinimized) {
    return (
      <aside
        aria-label="Critical Blood Shortage Minimized Status"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-red-500/40 bg-red-950/90 text-white cursor-pointer transition-all hover:scale-105"
        onClick={() => setIsMinimized(false)}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-red-200">
          {activeShortages.length} Shortage Alert{activeShortages.length > 1 ? 's' : ''} Active
        </span>
        <button
          className="ml-2 text-xs bg-red-800/80 hover:bg-red-700 text-white px-2 py-0.5 rounded-md font-medium"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
        >
          Expand
        </button>
      </aside>
    );
  }

  return (
    <section
      aria-label="Critical Blood Shortage Emergency Alert System"
      className={`relative z-40 mb-6 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
        hasCritical
          ? 'bg-gradient-to-r from-red-950/95 via-red-900/90 to-red-950/95 border-red-500/50 text-white shadow-red-900/20'
          : 'bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-amber-950/95 border-amber-500/50 text-white shadow-amber-900/20'
      }`}
    >
      {/* Top emergency pulse bar */}
      <div className={`h-1.5 w-full ${hasCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Severity Icon & Title */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center ${
                hasCritical
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {hasCritical ? (
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    hasCritical
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-500 text-stone-900 font-bold'
                  }`}
                >
                  {hasCritical ? 'CRITICAL SHORTAGE BUZZER' : 'LOW STOCK WARNING'}
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  {activeShortages[0]?.facilityName || 'Facility Central Depot'}
                </span>
                {buzzerState.isPlaying && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-300 font-bold animate-pulse bg-red-950/80 px-2 py-0.5 rounded-md border border-red-500/40">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    BUZZING
                  </span>
                )}
                {isAllAcknowledged && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-medium bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                    <CheckCircle className="w-3 h-3" /> Acknowledged
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                Immediate Inventory Deficit Detected in{' '}
                {activeShortages.map((s) => s.bloodGroup).join(', ')}
              </h2>
            </div>
          </div>

          {/* Action buttons & Audio Controls */}
          <div className="flex items-center flex-wrap gap-2.5 self-end lg:self-center">
            {/* Browser Autoplay Unlock Notice & Button */}
            {!buzzerState.isAudioUnlocked && (
              <button
                id="btn-enable-buzzer-audio"
                onClick={handleUnlockAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md transition-all animate-pulse"
                title="Browser security requires 1 click to unlock Web Audio alarms"
              >
                <Bell className="w-3.5 h-3.5" />
                Enable Sound Alerts
              </button>
            )}

            {/* Test Sound Button */}
            <button
              id="btn-test-buzzer"
              onClick={handleTestBuzzer}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-600 transition-all"
              title="Test Web Audio dual-pulse synthesizer"
            >
              <Volume2 className="w-3.5 h-3.5 text-red-400" />
              Test Beep
            </button>

            {/* Mute / Unmute Button */}
            <button
              id="btn-toggle-buzzer-mute"
              onClick={handleToggleMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                buzzerState.isMuted
                  ? 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                  : 'bg-red-500/20 text-red-200 border-red-500/40 hover:bg-red-500/30'
              }`}
            >
              {buzzerState.isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                  Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-red-400" />
                  Sound On
                </>
              )}
            </button>

            {/* Acknowledge Button */}
            {!isAllAcknowledged && (
              <button
                id="btn-acknowledge-shortage"
                onClick={handleAcknowledgeAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-stone-900 hover:bg-stone-100 shadow-md transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Acknowledge
              </button>
            )}

            {/* Replenish Quick Action */}
            {onNavigateToReplenish && (
              <button
                id="btn-quick-replenish"
                onClick={onNavigateToReplenish}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all"
              >
                Initiate Replenish
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-all"
              title="Minimize banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test Beep Toast message */}
        {testBeepMessage && (
          <div className="mt-2.5 px-3 py-1 rounded bg-stone-900/90 text-stone-300 text-xs font-mono border border-stone-700 flex items-center justify-between">
            <span>🔊 {testBeepMessage}</span>
            <span className="text-emerald-400 font-bold">AudioContext: {alertBuzzerService.getState().isAudioUnlocked ? 'Active' : 'Locked'}</span>
          </div>
        )}

        {/* Shortage Items Grid */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {activeShortages.map((shortage) => (
            <div
              key={shortage.id}
              className={`p-3 rounded-xl border backdrop-blur-sm transition-all ${
                shortage.severity === 'CRITICAL' || shortage.severity === 'OUT_OF_STOCK'
                  ? 'bg-red-950/60 border-red-500/40 text-red-100'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black text-white">{shortage.bloodGroup}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    shortage.severity === 'CRITICAL' || shortage.severity === 'OUT_OF_STOCK'
                      ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                      : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {shortage.severity === 'OUT_OF_STOCK' ? 'Depleted' : shortage.severity}
                </span>
              </div>
              <div className="text-xs text-stone-300">
                Current Stock:{' '}
                <span className="font-bold text-white">
                  {shortage.availableUnits.toFixed(1)} L
                </span>{' '}
                <span className="text-stone-400">(Threshold: {shortage.threshold.toFixed(1)} L)</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-1 truncate">
                {shortage.component}
              </div>
              {shortage.telegramSent && (
                <div className="text-[10px] text-emerald-300 mt-1 flex items-center gap-1">
                  <span>📱 Telegram Alert Sent</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
