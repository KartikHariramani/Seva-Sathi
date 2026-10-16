/**
 * Blood Shortage Detection & Telegram Dispatch Service
 * Evaluates real-time inventory against configured thresholds, triggers buzzer alerts,
 * and automatically dispatches formatted notifications to authorized Telegram recipients.
 */

import type { BloodGroup, BloodComponent } from '../types';
import type { HospitalInventoryItem } from '../data/hospitalInventory';
import type {
  ShortageSeverity,
  InventoryShortageEvent,
  AlertThresholdConfig,
} from '../types/alert';
import { alertBuzzerService, DEFAULT_ALERT_CONFIG } from './alertBuzzerService';
import { telegramService } from './telegramService';
import { localEventBus } from '../sync/localEventBus';

interface SentNotificationRecord {
  timestamp: number;
  severity: ShortageSeverity;
  outboxKey: string;
}

export interface ShortageEvaluationInput {
  facilityId: string;
  facilityName: string;
  facilityType?: 'hospital' | 'blood_bank';
  bloodGroup: BloodGroup;
  component?: BloodComponent | string;
  availableUnits?: number;
  availableQuantity?: number;
  triggerBuzzer?: boolean;
  recipientChatId?: string;
}

class ShortageDetectionService {
  private activeShortages: Map<string, InventoryShortageEvent> = new Map();
  private sentTelegramHistory: Map<string, SentNotificationRecord> = new Map();
  private subscribers: Set<(shortages: InventoryShortageEvent[]) => void> = new Set();
  private config: AlertThresholdConfig = { ...DEFAULT_ALERT_CONFIG };

  constructor() {
    this.config = alertBuzzerService.getThresholdConfig();
  }

  public getConfig(): AlertThresholdConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AlertThresholdConfig>): AlertThresholdConfig {
    const merged: Partial<AlertThresholdConfig> = { ...newConfig };
    if (newConfig.defaultCriticalThreshold !== undefined) {
      merged.criticalLitres = newConfig.defaultCriticalThreshold;
    }
    if (newConfig.defaultWarningThreshold !== undefined) {
      merged.warningLitres = newConfig.defaultWarningThreshold;
    }
    if (newConfig.criticalLitres !== undefined) {
      merged.defaultCriticalThreshold = newConfig.criticalLitres;
    }
    if (newConfig.warningLitres !== undefined) {
      merged.defaultWarningThreshold = newConfig.warningLitres;
    }
    this.config = alertBuzzerService.saveThresholdConfig(merged);
    return { ...this.config };
  }

  private notify() {
    const list = this.getActiveShortages();
    this.subscribers.forEach((cb) => {
      try {
        cb(list);
      } catch {
        // ignore
      }
    });
  }

  public subscribe(listener: (shortages: InventoryShortageEvent[]) => void): () => void {
    this.subscribers.add(listener);
    listener(this.getActiveShortages());
    return () => this.subscribers.delete(listener);
  }

  /**
   * Evaluates available quantity against configured thresholds.
   * Returns: OUT_OF_STOCK | CRITICAL | WARNING | NORMAL
   */
  public evaluateSeverity(
    availableUnits: number,
    config: AlertThresholdConfig = this.config
  ): ShortageSeverity {
    const criticalThreshold = config.defaultCriticalThreshold ?? config.criticalLitres ?? 15.0;
    const warningThreshold = config.defaultWarningThreshold ?? config.warningLitres ?? 25.0;

    if (availableUnits <= 0) return 'OUT_OF_STOCK';
    if (availableUnits <= criticalThreshold) return 'CRITICAL';
    if (availableUnits <= warningThreshold) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Flexible evaluator supporting both single-object input and (item, facilityInfo) signature
   */
  public evaluateItem(
    param1: ShortageEvaluationInput | HospitalInventoryItem,
    param2?: {
      facilityId: string;
      facilityName: string;
      facilityType?: 'hospital' | 'blood_bank';
      recipientChatId?: string;
      triggerBuzzer?: boolean;
    }
  ): InventoryShortageEvent {
    let facilityId = 'HOSP-001';
    let facilityName = 'City General Care Hospital';
    let facilityType: 'hospital' | 'blood_bank' = 'hospital';
    let bloodGroup: BloodGroup = 'O+';
    let component = 'Packed Red Blood Cells (PRBC)';
    let availableUnits = 0;
    let triggerBuzzer = true;
    let recipientChatId = '100001';

    if (param2) {
      // (item: HospitalInventoryItem, facilityInfo: {...}) signature
      const item = param1 as HospitalInventoryItem;
      facilityId = param2.facilityId;
      facilityName = param2.facilityName;
      facilityType = param2.facilityType || 'hospital';
      bloodGroup = item.bloodGroup;
      availableUnits = item.availableQuantity;
      recipientChatId = param2.recipientChatId || '100001';
      if (param2.triggerBuzzer !== undefined) triggerBuzzer = param2.triggerBuzzer;
    } else {
      // ShortageEvaluationInput single object signature
      const input = param1 as ShortageEvaluationInput;
      facilityId = input.facilityId || facilityId;
      facilityName = input.facilityName || facilityName;
      facilityType = input.facilityType || facilityType;
      bloodGroup = input.bloodGroup;
      component = (input.component as string) || component;
      availableUnits = input.availableUnits !== undefined ? input.availableUnits : input.availableQuantity || 0;
      recipientChatId = input.recipientChatId || '100001';
      if (input.triggerBuzzer !== undefined) triggerBuzzer = input.triggerBuzzer;
    }

    const config = this.getConfig();
    const severity = this.evaluateSeverity(availableUnits, config);
    const eventKey = `SHT_${facilityId}_${bloodGroup}`;
    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const threshold = severity === 'CRITICAL' ? config.criticalLitres || 15.0 : config.warningLitres || 25.0;

    if (severity === 'NORMAL') {
      const recoveredEvent: InventoryShortageEvent = {
        id: eventKey,
        facilityId,
        facilityName,
        facilityType,
        bloodGroup,
        component,
        availableUnits,
        threshold,
        severity: 'NORMAL',
        status: 'RESOLVED',
        timestamp: timestampStr,
        acknowledged: true,
        telegramSent: false,
      };

      if (this.activeShortages.has(eventKey)) {
        this.activeShortages.delete(eventKey);
        alertBuzzerService.evaluateAndTriggerShortageBuzzer(recoveredEvent);
        localEventBus.emit('SHORTAGE_RESOLVED', {
          facilityId,
          bloodGroup,
          recoveredQuantity: availableUnits,
        });
        this.notify();
      }

      return recoveredEvent;
    }

    const isNew = !this.activeShortages.has(eventKey);
    const prevSeverity = this.activeShortages.get(eventKey)?.severity;

    const event: InventoryShortageEvent = {
      id: eventKey,
      facilityId,
      facilityName,
      facilityType,
      bloodGroup,
      component,
      availableUnits,
      threshold,
      severity,
      status: 'ACTIVE',
      timestamp: timestampStr,
      acknowledged: alertBuzzerService.isAcknowledged(eventKey),
      telegramSent: false,
    };

    this.activeShortages.set(eventKey, event);

    // 1. Evaluate & Trigger Website Buzzer if requested
    if (triggerBuzzer) {
      alertBuzzerService.evaluateAndTriggerShortageBuzzer(event);
    }

    // 2. Automated Telegram Dispatch for critical shortages
    if (severity === 'CRITICAL' || severity === 'OUT_OF_STOCK') {
      // Trigger if new or escalated
      if (isNew || (prevSeverity === 'WARNING' && severity === 'CRITICAL')) {
        this.dispatchTelegramShortageAlert(event, recipientChatId, config).catch(() => {});
      }
    }

    this.notify();
    localEventBus.emit('SHORTAGE_DETECTED', event);
    return event;
  }

  /**
   * Scans a batch of items and evaluates shortage transitions
   */
  public evaluateBatch(
    items: Array<{ bloodGroup: BloodGroup; availableQuantity?: number; availableUnits?: number }>,
    facilityInfo: {
      facilityId: string;
      facilityName: string;
      facilityType?: 'hospital' | 'blood_bank';
      recipientChatId?: string;
      triggerBuzzer?: boolean;
    }
  ): InventoryShortageEvent[] {
    const results: InventoryShortageEvent[] = [];
    for (const item of items) {
      const units = item.availableQuantity !== undefined ? item.availableQuantity : item.availableUnits || 0;
      const res = this.evaluateItem({
        facilityId: facilityInfo.facilityId,
        facilityName: facilityInfo.facilityName,
        facilityType: facilityInfo.facilityType,
        bloodGroup: item.bloodGroup,
        availableUnits: units,
        triggerBuzzer: facilityInfo.triggerBuzzer,
        recipientChatId: facilityInfo.recipientChatId,
      });
      if (res.status === 'ACTIVE') {
        results.push(res);
      }
    }
    return results;
  }

  /**
   * Dispatches formatted Telegram alert conforming to Phase 4.3 with deduplication guards.
   */
  public async dispatchTelegramShortageAlert(
    event: InventoryShortageEvent,
    targetChatId?: string,
    config: AlertThresholdConfig = this.config
  ): Promise<boolean> {
    const recipientChat = targetChatId || '100001';
    const nowMs = Date.now();
    const cooldownHours = config.cooldownHours || 4;
    const bucket = Math.floor(nowMs / (1000 * 3600 * cooldownHours));
    const key = `SHT_TG_${event.facilityId}_${event.bloodGroup}_${event.severity}_${bucket}`;

    // Deduplication guard
    if (this.sentTelegramHistory.has(key)) {
      return false; // Deduplicated
    }

    const severityLabel =
      event.severity === 'OUT_OF_STOCK'
        ? 'OUT OF STOCK (DEPLETED)'
        : event.severity === 'CRITICAL'
        ? 'CRITICAL DEFICIT'
        : 'LOW STOCK WARNING';

    const messageText = `🚨 <b>SEVASETU — CRITICAL BLOOD STOCK ALERT</b>\n\n• <b>Facility:</b> ${event.facilityName}\n• <b>Blood Group:</b> ${event.bloodGroup}\n• <b>Component:</b> ${event.component}\n• <b>Available Eligible Units:</b> ${event.availableUnits.toFixed(1)} L\n• <b>Critical Threshold:</b> ${event.threshold.toFixed(1)} L\n• <b>Status:</b> ${severityLabel}\n• <b>Last Updated:</b> ${event.timestamp}\n\n⚠️ <i>Please review the inventory and initiate the appropriate authorized replenishment workflow.</i>\n\n🔗 <a href="http://localhost:5174/hospital/dashboard">Open SevaSetu Command Center</a>`;

    try {
      const res = await telegramService.sendNotification({
        chatId: recipientChat,
        text: messageText,
        messageType: 'TRANSACTIONAL',
        idempotencyKey: key,
      });

      if (res.success) {
        event.telegramSent = true;
        event.outboxKey = key;
        this.sentTelegramHistory.set(key, {
          timestamp: nowMs,
          severity: event.severity,
          outboxKey: key,
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[ShortageService] Telegram alert delivery error:', e);
      return false;
    }
  }

  public dispatchTelegramAlert(event: InventoryShortageEvent, recipientChatId?: string): Promise<boolean> {
    return this.dispatchTelegramShortageAlert(event, recipientChatId);
  }

  public acknowledge(shortageId: string): void {
    const s = this.activeShortages.get(shortageId);
    if (s) {
      s.acknowledged = true;
    }
    alertBuzzerService.acknowledgeAlert(shortageId);
    this.notify();
  }

  public getActiveShortages(facilityId?: string): InventoryShortageEvent[] {
    const all = Array.from(this.activeShortages.values()).filter((s) => s.status === 'ACTIVE');
    if (facilityId) {
      return all.filter((s) => s.facilityId === facilityId);
    }
    return all.sort((a, b) => (b.severity === 'CRITICAL' ? 1 : 0) - (a.severity === 'CRITICAL' ? 1 : 0));
  }

  public clearHistory(): void {
    this.activeShortages.clear();
    this.sentTelegramHistory.clear();
    alertBuzzerService.clearAcknowledged();
    this.notify();
  }
}

export const shortageDetectionService = new ShortageDetectionService();
