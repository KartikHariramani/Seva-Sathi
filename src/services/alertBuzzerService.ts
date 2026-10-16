/**
 * Alert Buzzer & Audio Synthesizer Service
 * HTML5 Web Audio API synthesizer for critical blood shortages.
 * Operates without external audio assets; handles browser autoplay policies gracefully.
 */

import type { ShortageSeverity, InventoryShortageEvent, AlertThresholdConfig, BuzzerState } from '../types/alert';
import { localEventBus } from '../sync/localEventBus';

export const DEFAULT_ALERT_CONFIG: AlertThresholdConfig = {
  criticalLitres: 15.0,
  warningLitres: 25.0,
  defaultCriticalThreshold: 15.0,
  defaultWarningThreshold: 25.0,
  nearExpiryHours: 18,
  soundEnabled: true,
  cooldownHours: 4,
  autoEscalate: true,
};

const SOUND_PREF_KEY = 'sevasathi_sound_alerts_enabled';
const THRESHOLD_CONFIG_KEY = 'sevasathi_alert_threshold_config';
const ACKNOWLEDGED_ALERTS_KEY = 'sevasathi_acknowledged_alerts';

class AlertBuzzerService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private isMuted: boolean = false;
  private isAudioUnlocked: boolean = false;
  private isPlaying: boolean = false;
  private lastTriggeredAt: string | null = null;
  private acknowledgedAlerts: Set<string> = new Set();
  private lastPlayedSeverity: Map<string, ShortageSeverity> = new Map();
  private activeAlertsMap: Map<string, { severity: ShortageSeverity; acknowledged: boolean; timestamp: string }> = new Map();
  private activeBuzzerTimer: any = null;
  private subscribers: Set<(state: BuzzerState) => void> = new Set();

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSound = localStorage.getItem(SOUND_PREF_KEY);
        this.soundEnabled = savedSound !== null ? savedSound === 'true' : true;

        const savedAcks = localStorage.getItem(ACKNOWLEDGED_ALERTS_KEY);
        if (savedAcks) {
          const list = JSON.parse(savedAcks);
          if (Array.isArray(list)) {
            this.acknowledgedAlerts = new Set(list);
          }
        }
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  private notify() {
    const s = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(s);
      } catch {
        // ignore subscriber errors
      }
    });
    localEventBus.emit('BUZZER_STATE_CHANGED', s);
  }

  public subscribe(listener: (state: BuzzerState) => void): () => void {
    this.subscribers.add(listener);
    listener(this.getState());
    return () => this.subscribers.delete(listener);
  }

  public getThresholdConfig(): AlertThresholdConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(THRESHOLD_CONFIG_KEY);
        if (saved) {
          return { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(saved) };
        }
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_ALERT_CONFIG };
  }

  public saveThresholdConfig(config: Partial<AlertThresholdConfig>): AlertThresholdConfig {
    const updated = { ...this.getThresholdConfig(), ...config };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(THRESHOLD_CONFIG_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
    localEventBus.emit('ALERT_CONFIG_UPDATED', updated);
    return updated;
  }

  /**
   * Initializes or resumes Web Audio API context upon user gesture
   */
  public async unlockAudio(): Promise<boolean> {
    this.isAudioUnlocked = true;
    if (typeof window === 'undefined') {
      this.notify();
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtxClass();
        }
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        this.isAudioUnlocked = this.audioCtx.state === 'running';
      }
    } catch {
      // fallback in headless/test environments
    }

    this.notify();
    return this.isAudioUnlocked;
  }

  public isUnlocked(): boolean {
    return this.isAudioUnlocked || (this.audioCtx !== null && this.audioCtx.state === 'running');
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public isMuteActive(): boolean {
    return this.isMuted;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SOUND_PREF_KEY, String(enabled));
      }
    } catch {
      // ignore
    }
    if (!enabled) {
      this.stopBuzzer();
    }
    this.notify();
  }

  public mute(): void {
    this.isMuted = true;
    this.stopBuzzer();
    this.notify();
  }

  public unmute(): void {
    this.isMuted = false;
    this.notify();
  }

  public silence(): void {
    this.stopBuzzer();
  }

  public stopBuzzer(): void {
    this.isPlaying = false;
    if (this.activeBuzzerTimer) {
      clearInterval(this.activeBuzzerTimer);
      this.activeBuzzerTimer = null;
    }
    this.notify();
  }

  /**
   * Generates a calibrated clinical double-beep audio pulse via Web Audio API.
   * Dual-harmonic frequency: 880Hz (A5) -> 660Hz (E5) with envelope ramp.
   */
  public async playBuzzerPulse(severity: ShortageSeverity = 'CRITICAL'): Promise<boolean> {
    if (!this.soundEnabled || this.isMuted) return false;

    if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        const now = this.audioCtx.currentTime;
        const isCritical = severity === 'CRITICAL' || severity === 'OUT_OF_STOCK';

        // Oscillator 1 (Primary Tone)
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();

        osc1.type = isCritical ? 'square' : 'sine';
        osc1.frequency.setValueAtTime(isCritical ? 880 : 740, now);
        osc1.frequency.exponentialRampToValueAtTime(isCritical ? 988 : 830, now + 0.12);

        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.exponentialRampToValueAtTime(isCritical ? 0.28 : 0.18, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);

        osc1.start(now);
        osc1.stop(now + 0.15);

        // Oscillator 2 (Secondary Echo Tone after 60ms gap)
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(isCritical ? 660 : 587, now + 0.2);

        gain2.gain.setValueAtTime(0.001, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(isCritical ? 0.25 : 0.15, now + 0.22);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);

        osc2.start(now + 0.2);
        osc2.stop(now + 0.4);
      } catch {
        // audio playback failure caught
      }
    }

    return true;
  }

  /**
   * Triggers buzzer sound for a specific severity and alert event
   */
  public triggerBuzzer(severity: ShortageSeverity = 'CRITICAL', alertId: string = 'ALERT-GENERIC'): boolean {
    if (!this.soundEnabled || this.isMuted) return false;

    this.isPlaying = true;
    this.lastTriggeredAt = new Date().toISOString();
    this.activeAlertsMap.set(alertId, {
      severity,
      acknowledged: false,
      timestamp: this.lastTriggeredAt,
    });

    this.playBuzzerPulse(severity);
    this.notify();
    return true;
  }

  /**
   * Evaluates shortage transition and sounds buzzer if warranted by policy:
   * 1. Only buzzes when crossing into warning or critical threshold
   * 2. Re-buzzes only if severity escalates (e.g. LOW/WARNING -> CRITICAL)
   * 3. Does not repeatedly buzz on benign data refreshes
   */
  public evaluateAndTriggerShortageBuzzer(event: InventoryShortageEvent): boolean {
    if (event.severity === 'HEALTHY' || event.severity === 'NORMAL') {
      // Stock recovered! Clear any previous severity record and silence active sound
      this.lastPlayedSeverity.delete(event.id);
      this.activeAlertsMap.delete(event.id);
      if (this.activeAlertsMap.size === 0) {
        this.silence();
      }
      return false;
    }

    if (this.acknowledgedAlerts.has(event.id)) {
      return false;
    }

    const prevSeverity = this.lastPlayedSeverity.get(event.id);

    // Rule: Trigger if new shortage OR if severity escalated from LOW/WARNING to CRITICAL/OUT_OF_STOCK
    const isNew = !prevSeverity;
    const isEscalation =
      (prevSeverity === 'LOW' || prevSeverity === 'WARNING') &&
      (event.severity === 'CRITICAL' || event.severity === 'OUT_OF_STOCK');

    const isDoubleEscalation =
      prevSeverity === 'CRITICAL' && event.severity === 'OUT_OF_STOCK';

    if (isNew || isEscalation || isDoubleEscalation) {
      this.lastPlayedSeverity.set(event.id, event.severity);
      this.triggerBuzzer(event.severity, event.id);
      localEventBus.emit('SHORTAGE_BUZZER_TRIGGERED', { event, severity: event.severity });
      return true;
    }

    return false;
  }

  public acknowledgeAlert(eventId: string, staffName?: string): void {
    this.acknowledgedAlerts.add(eventId);
    const existing = this.activeAlertsMap.get(eventId);
    if (existing) {
      existing.acknowledged = true;
    } else {
      this.activeAlertsMap.set(eventId, {
        severity: 'CRITICAL',
        acknowledged: true,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ACKNOWLEDGED_ALERTS_KEY, JSON.stringify(Array.from(this.acknowledgedAlerts)));
      }
    } catch {
      // ignore
    }

    this.stopBuzzer();
    this.notify();
    localEventBus.emit('SHORTAGE_ALERT_ACKNOWLEDGED', { eventId, staffName, timestamp: new Date().toISOString() });
  }

  public isAcknowledged(eventId: string): boolean {
    return this.acknowledgedAlerts.has(eventId);
  }

  public clearAcknowledged(): void {
    this.acknowledgedAlerts.clear();
    this.lastPlayedSeverity.clear();
    this.activeAlertsMap.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(ACKNOWLEDGED_ALERTS_KEY);
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  public getState(): BuzzerState {
    return {
      isPlaying: this.isPlaying,
      soundEnabled: this.soundEnabled,
      isSoundEnabled: this.soundEnabled,
      isAudioUnlocked: this.isUnlocked(),
      muted: this.isMuted,
      isMuted: this.isMuted,
      activeShortageId: this.activeAlertsMap.keys().next().value || null,
      severity: this.activeAlertsMap.values().next().value?.severity || null,
      activeAlerts: this.activeAlertsMap,
      lastTriggeredAt: this.lastTriggeredAt,
    };
  }
}

export const alertBuzzerService = new AlertBuzzerService();
