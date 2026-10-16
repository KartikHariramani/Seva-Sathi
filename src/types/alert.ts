import type { BloodGroup } from './index';

export type ShortageSeverity =
  | 'HEALTHY'
  | 'NORMAL'
  | 'LOW'
  | 'WARNING'
  | 'CRITICAL'
  | 'OUT_OF_STOCK';

export interface AlertThresholdConfig {
  criticalLitres: number; // default critical threshold
  warningLitres: number; // default warning threshold
  defaultCriticalThreshold?: number; // alias
  defaultWarningThreshold?: number; // alias
  nearExpiryHours: number; // default 18 hours
  soundEnabled: boolean; // default true
  cooldownHours: number; // default 4 hours between Telegram repeated alerts
  autoEscalate: boolean;
}

export interface InventoryShortageEvent {
  id: string; // e.g. SHT-HSP-O-POS-179200
  facilityId: string;
  facilityName: string;
  facilityType: 'hospital' | 'blood_bank';
  bloodGroup: BloodGroup;
  component: string;
  availableUnits: number; // in Litres or Units
  threshold: number;
  severity: ShortageSeverity;
  status?: 'ACTIVE' | 'RESOLVED';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  telegramSent: boolean;
  telegramDeliveredAt?: string;
  outboxKey?: string;
}

export interface NearExpiryAlertEvent {
  id: string; // e.g. EXP-UNT-2026-901
  facilityId: string;
  facilityName: string;
  facilityContact?: string;
  bloodGroup: BloodGroup;
  component: string;
  quantityUnits: number;
  batchOrUnitId: string;
  expiryTimestamp: string;
  hoursRemaining: number;
  severity: 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED' | 'TRANSFERRED' | 'EXPIRED';
  timestamp: string;
  telegramSent: boolean;
  telegramDeliveredAt?: string;
}

export interface BuzzerState {
  isPlaying: boolean;
  soundEnabled: boolean;
  isSoundEnabled: boolean;
  isAudioUnlocked: boolean;
  muted: boolean;
  isMuted: boolean;
  activeShortageId: string | null;
  severity: ShortageSeverity | null;
  activeAlerts?: Map<string, { severity: ShortageSeverity; acknowledged: boolean; timestamp: string }>;
  lastTriggeredAt?: string | null;
}
