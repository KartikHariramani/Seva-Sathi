import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import { syncEngine } from '../../sync/broadcastSync';
import {
  RotateCcw,
  ShieldAlert,
  Database,
  Sliders,
  CheckCircle2,
  Volume2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { shortageDetectionService } from '../../services/shortageDetectionService';
import { alertBuzzerService } from '../../services/alertBuzzerService';
import { telegramService, type TelegramBotStatus } from '../../services/telegramService';
import { unifiedTelegramNotificationService, type TelegramDiagnosticsReport } from '../../services/unifiedTelegramNotificationService';

export const AdminSettingsPage: React.FC = () => {
  const { state, resetDemo, mutate } = useAppStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Alert & Telegram Governance state
  const [alertConfig, setAlertConfig] = useState(() => shortageDetectionService.getConfig());
  const [buzzerState, setBuzzerState] = useState(() => alertBuzzerService.getState());
  const [telegramStatus, setTelegramStatus] = useState<TelegramBotStatus | null>(null);
  const [diagnostics, setDiagnostics] = useState<TelegramDiagnosticsReport | null>(null);
  const [testChatId, setTestChatId] = useState('100001');
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [testAlertOutcome, setTestAlertOutcome] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  const fetchDiagnostics = () => {
    telegramService.getStatus().then(setTelegramStatus).catch(() => {});
    unifiedTelegramNotificationService.getDiagnostics().then(setDiagnostics).catch(() => {});
  };

  useEffect(() => {
    fetchDiagnostics();
    const unsubBuzzer = alertBuzzerService.subscribe(setBuzzerState);
    return unsubBuzzer;
  }, []);

  const { isSupported, tabId } = syncEngine.getChannelStatus();

  const handleConfirmReset = () => {
    resetDemo();
    setShowResetModal(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  const handleUpdateCriticalThreshold = (val: number) => {
    const updated = shortageDetectionService.updateConfig({ defaultCriticalThreshold: val });
    setAlertConfig({ ...updated });
    showConfigToast();
  };

  const handleUpdateWarningThreshold = (val: number) => {
    const updated = shortageDetectionService.updateConfig({ defaultWarningThreshold: val });
    setAlertConfig({ ...updated });
    showConfigToast();
  };

  const handleToggleSoundEnabled = () => {
    alertBuzzerService.setSoundEnabled(!buzzerState.isSoundEnabled);
    showConfigToast();
  };

  const handleToggleMute = () => {
    if (buzzerState.isMuted) {
      alertBuzzerService.unmute();
    } else {
      alertBuzzerService.mute();
    }
  };

  const showConfigToast = () => {
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const handleTriggerDiagnosticScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/telegram/alerts/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
      } else {
        setScanResult({ error: `Server error ${res.status}` });
      }
    } catch (e: any) {
      setScanResult({ error: e.message });
    } finally {
      setIsScanning(false);
    }
  };

  const handleTransmitTestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testChatId) return;
    setTestAlertSending(true);
    setTestAlertOutcome(null);
    try {
      const res = await unifiedTelegramNotificationService.sendLiveTestAlert(
        testChatId,
        `🔔 <b>SEVASETU SYSTEM ALERT — ADMINISTRATIVE VERIFICATION</b>\n\n• <b>Source:</b> State Healthcare Command Center\n• <b>Security Protocol:</b> Verified Handshake\n• <b>Timestamp:</b> ${new Date().toLocaleString('en-IN')}\n\n<i>This diagnostic alert verifies active bidirectional communication.</i>`
      );
      setTestAlertOutcome(res);
      fetchDiagnostics();
    } catch (err: any) {
      setTestAlertOutcome({ success: false, error: err.message });
    } finally {
      setTestAlertSending(false);
    }
  };

  const handleToggleAutoSync = () => {
    mutate((draft) => {
      draft.settings.autoSync = !draft.settings.autoSync;
    }, 'STATE_UPDATED');
  };

  const handleToggleProtection = () => {
    mutate((draft) => {
      draft.settings.networkProtectionEnabled = !draft.settings.networkProtectionEnabled;
    }, 'STATE_UPDATED');
  };

  // Estimate local storage usage in KB
  const storageUsageKb = Math.round(
    (JSON.stringify(state).length * 2) / 1024
  );

  return (
    <AdminLayout pageTitle="System Settings & Demo Diagnostics">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                System Governance & Controls
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Local-First Architecture</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Settings & Demo Controls
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure cross-tab synchronization parameters, threshold boundaries, and trigger controlled demo environment resets.
            </p>
          </div>
        </div>

        {resetSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Demo Environment Reset Complete:</strong> Initial seed dataset restored and synchronized across all open browser tabs.
            </span>
          </div>
        )}

        {/* 1. Operational Parameters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-[#1E4C8A]" />
            <h2 className="font-poppins font-bold text-base text-slate-900">
              Network Operating Parameters
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <p className="font-semibold text-slate-800">Cross-Tab Realtime Broadcast</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Synchronize administrative approvals and hospital blood consumption in real-time across multiple tabs via BroadcastChannel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  state.settings.autoSync ? 'bg-[#1E4C8A]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    state.settings.autoSync ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <p className="font-semibold text-slate-800">Smart Load Balancing & Network Protection</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prevents candidate blood banks from depleting beyond their own 3-hour shortage threshold during candidate matching.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleProtection}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  state.settings.networkProtectionEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    state.settings.networkProtectionEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 1b. Shortage Buzzer & Telegram Alert Governance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="font-poppins font-bold text-base text-slate-900">
                  Blood Shortage Buzzer & Telegram Alert Policy
                </h2>
                <p className="text-[11px] text-slate-500">
                  Facility-wide audible alert thresholds, deduplication windows, and server-side background monitors.
                </p>
              </div>
            </div>
            {configSavedToast && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ✓ Policy Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Critical Threshold */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="font-semibold text-slate-800 block">
                Critical Shortage Threshold (Litres)
              </label>
              <p className="text-[11px] text-slate-500">
                Stock dropping to or below this level triggers the high-pitch emergency buzzer and queues Telegram alerts.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={alertConfig.defaultCriticalThreshold}
                  onChange={(e) => handleUpdateCriticalThreshold(parseFloat(e.target.value) || 15)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-red-600"
                />
                <span className="text-slate-500 font-mono">Litres</span>
              </div>
            </div>

            {/* Warning Threshold */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="font-semibold text-slate-800 block">
                Warning Threshold (Litres)
              </label>
              <p className="text-[11px] text-slate-500">
                Stock dropping into this range displays amber warning cards across connected hospital dashboards.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="5"
                  max="100"
                  step="1"
                  value={alertConfig.defaultWarningThreshold}
                  onChange={(e) => handleUpdateWarningThreshold(parseFloat(e.target.value) || 25)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-slate-500 font-mono">Litres</span>
              </div>
            </div>
          </div>

          {/* Sound & Buzzer Controls */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-red-600" />
                  Website Sound Alert (Web Audio Synthesizer)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Uses dual 880Hz / 660Hz pulses for authentic clinical alerting without external audio assets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`px-2.5 py-1 rounded text-xs font-medium border ${
                    buzzerState.isMuted
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {buzzerState.isMuted ? 'Muted' : 'Unmuted'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleSoundEnabled}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    buzzerState.isSoundEnabled ? 'bg-red-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      buzzerState.isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Telegram Bot Diagnostic & Manual Scheduled Scan */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[#1E4C8A]" />
                    Automated Telegram Bot & Scheduled Scanner
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Autonomous 60s background scanning operates without requiring open browser dashboards.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleTriggerDiagnosticScan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E4C8A] hover:bg-[#163866] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Trigger Immediate Scan'}</span>
                </button>
              </div>

              {/* Bot status chip */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 flex-wrap pt-1">
                <span>Bot: <strong className="text-slate-900">@{telegramStatus?.botUsername || 'SevaSathiBot'}</strong></span>
                <span>Mode: <strong className="text-slate-900">{telegramStatus?.mode || 'LOCAL_SIMULATED'}</strong></span>
                <span>Linked Users: <strong className="text-emerald-700">{telegramStatus?.linkedAccountsCount ?? 1}</strong></span>
                <span>Outbox Dispatches: <strong className="text-blue-700">{telegramStatus?.outboxItemsCount ?? 0}</strong></span>
              </div>

              {scanResult && (
                <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900">Scan Result ({scanResult.timestamp || 'Now'}):</div>
                  <div>• Shortages Evaluated: {scanResult.shortagesDetected ?? 0}</div>
                  <div>• 18h Expiry Units Detected: {scanResult.nearExpiryDetected ?? 0}</div>
                  <div>• Alerts Dispatched to Telegram: {scanResult.alertsDispatched ?? 0}</div>
                  <div>• Duplicate Alerts Suppressed: {scanResult.duplicatesSuppressed ?? 0}</div>
                </div>
              )}

              {/* Live Test Broadcast Tool */}
              <form onSubmit={handleTransmitTestAlert} className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Target Telegram Chat ID (e.g. 100001 or your numerical ID)"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={testAlertSending || !testChatId}
                  className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3 text-sky-400" />
                  <span>{testAlertSending ? 'Transmitting...' : 'Send Test Alert'}</span>
                </button>
              </form>

              {testAlertOutcome && (
                <div className={`p-2.5 rounded-lg text-xs font-mono border ${
                  testAlertOutcome.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-bold">Test Delivery Outcome:</div>
                  <div>Status: {testAlertOutcome.status || (testAlertOutcome.success ? 'ACCEPTED' : 'FAILED')}</div>
                  {testAlertOutcome.error && <div>Error: {testAlertOutcome.error}</div>}
                </div>
              )}
            </div>

            {/* Notification Outbox Delivery Ledger Table */}
            {diagnostics && diagnostics.recentOutbox && diagnostics.recentOutbox.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-poppins">
                    Recent Telegram Outbox Delivery Ledger
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {diagnostics.stats.acceptedCount} Accepted &bull; {diagnostics.stats.simulatedCount} Simulated &bull; {diagnostics.stats.failedCount} Failed
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-200/70 text-slate-700 text-[10px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1.5">Category</th>
                        <th className="px-2.5 py-1.5">Recipient</th>
                        <th className="px-2.5 py-1.5">Status</th>
                        <th className="px-2.5 py-1.5">Attempts</th>
                        <th className="px-2.5 py-1.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {diagnostics.recentOutbox.slice(0, 15).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="px-2.5 py-1.5 font-bold text-slate-800 text-[11px]">
                            {item.eventCategory || item.messageType}
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-600">
                            {item.recipientChatId}
                          </td>
                          <td className="px-2.5 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'ACCEPTED_BY_TELEGRAM'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'SIMULATED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-500">
                            {item.attempts}
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-400 text-[10px]">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Demo Diagnostics Panel (Requirement #91) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-slate-700" />
            <h2 className="font-poppins font-bold text-base text-slate-900">
              Demo System Diagnostics & Integrity
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">State Version</span>
              <strong className="text-slate-900 font-bold text-base">v{state.stateVersion}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Schema Version</span>
              <strong className="text-slate-900 font-bold text-base">v{state.schemaVersion}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Storage Size</span>
              <strong className="text-slate-900 font-bold text-base">~{storageUsageKb} KB</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Broadcast Engine</span>
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isSupported ? 'Channel Active' : 'Storage Fallback'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Active Tab ID:</span>
              <strong className="text-slate-900">{tabId}</strong>
            </div>
            <div className="flex justify-between">
              <span>Organizations Registered:</span>
              <strong className="text-slate-900">{state.organizations.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Transactions Logged:</span>
              <strong className="text-slate-900">{state.transactions.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Immutable Audit Logs:</span>
              <strong className="text-slate-900">{state.auditLogs.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Last Synchronized:</span>
              <strong className="text-slate-900">{new Date(state.meta.lastUpdatedAt).toLocaleTimeString()}</strong>
            </div>
          </div>
        </div>

        {/* 3. Demo Reset Zone (Requirement #8) */}
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h2 className="font-poppins font-bold text-base text-rose-950">
                  Reset Demo Environment
                </h2>
              </div>
              <p className="text-xs text-rose-800/80 mt-1 max-w-xl leading-relaxed">
                Restore the initial consistent fictional seed dataset. This resets hospital stock (O+ back to 4.0 L with high demand), restores pending requests, and clears transient test state across all open browser tabs without requiring a page refresh.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Reset SevaSetu Demo?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Restores initial synchronized state across all tabs
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed font-mono">
                This will clear any local blood issues, physical inventory reconciliation adjustments, and approved requisitions created during this session.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm & Reset Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
