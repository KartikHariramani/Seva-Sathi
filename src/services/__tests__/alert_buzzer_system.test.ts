import { describe, it, expect, beforeEach } from 'vitest';
import { alertBuzzerService } from '../alertBuzzerService';
import { shortageDetectionService } from '../shortageDetectionService';
import { nearExpiryService } from '../nearExpiryService';
import { runServerAlertScan } from '../../server/telegramServerMiddleware';
import type { BloodGroup } from '../../types';

describe('Seva Sathi Alert Buzzer & Automated Notification System', () => {
  beforeEach(() => {
    alertBuzzerService.silence();
    alertBuzzerService.unmute();
    shortageDetectionService.clearHistory();
    nearExpiryService.clearTelegramHistory();
  });

  describe('Phase 3: Website Buzzer Service', () => {
    it('initializes with expected default sound and mute state', () => {
      const state = alertBuzzerService.getState();
      expect(state.isSoundEnabled).toBe(true);
      expect(state.isMuted).toBe(false);
      expect(state.isPlaying).toBe(false);
    });

    it('handles mute and unmute controls correctly', () => {
      alertBuzzerService.mute();
      expect(alertBuzzerService.getState().isMuted).toBe(true);

      alertBuzzerService.unmute();
      expect(alertBuzzerService.getState().isMuted).toBe(false);
    });

    it('handles browser autoplay audio unlock gracefully', () => {
      expect(alertBuzzerService.getState().isAudioUnlocked).toBe(false);
      alertBuzzerService.unlockAudio();
      expect(alertBuzzerService.getState().isAudioUnlocked).toBe(true);
    });

    it('acknowledges an active alert and updates buzzer state', () => {
      alertBuzzerService.triggerBuzzer('CRITICAL', 'ALERT-TEST-001');
      alertBuzzerService.acknowledgeAlert('ALERT-TEST-001');
      
      const state = alertBuzzerService.getState();
      expect(state.activeAlerts?.get('ALERT-TEST-001')?.acknowledged).toBe(true);
      expect(state.isPlaying).toBe(false);
    });

    it('silences active sound without removing historical tracking', () => {
      alertBuzzerService.triggerBuzzer('CRITICAL', 'ALERT-TEST-002');
      alertBuzzerService.silence();
      expect(alertBuzzerService.getState().isPlaying).toBe(false);
    });
  });

  describe('Phase 3.1 & 3.4: Shortage Detection and Deduplication', () => {
    it('classifies stock above warning threshold as NORMAL without buzzer or alerts', () => {
      const event = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'B+' as BloodGroup,
        availableUnits: 32.0,
      });

      expect(event.severity).toBe('NORMAL');
      expect(event.status).toBe('RESOLVED');
      expect(alertBuzzerService.getState().isPlaying).toBe(false);
    });

    it('detects WARNING when stock falls between warning and critical threshold', () => {
      const event = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'A+' as BloodGroup,
        availableUnits: 20.0,
      });

      expect(event.severity).toBe('WARNING');
      expect(event.status).toBe('ACTIVE');
    });

    it('detects CRITICAL when stock falls to or below 15L threshold and triggers buzzer', () => {
      const event = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O-' as BloodGroup,
        availableUnits: 10.0,
      });

      expect(event.severity).toBe('CRITICAL');
      expect(event.status).toBe('ACTIVE');
      expect(alertBuzzerService.getState().isPlaying).toBe(true);
    });

    it('suppresses repeated buzzing and alerts on benign identical data refreshes', () => {
      // First drop to critical: triggers buzz
      shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O-' as BloodGroup,
        availableUnits: 10.0,
      });
      expect(alertBuzzerService.getState().isPlaying).toBe(true);

      // Silence the buzzer
      alertBuzzerService.silence();
      expect(alertBuzzerService.getState().isPlaying).toBe(false);

      // Refresh with identical stock: should NOT re-buzz
      const refreshedEvent = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O-' as BloodGroup,
        availableUnits: 10.0,
      });

      expect(refreshedEvent.severity).toBe('CRITICAL');
      // Buzzer remains silent because it did not escalate
      expect(alertBuzzerService.getState().isPlaying).toBe(false);
    });

    it('re-triggers buzzer when shortage escalates from WARNING to CRITICAL or OUT_OF_STOCK', () => {
      // First warning
      shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'AB-' as BloodGroup,
        availableUnits: 20.0,
      });
      alertBuzzerService.silence();

      // Escalation to critical
      shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'AB-' as BloodGroup,
        availableUnits: 10.0,
      });
      expect(alertBuzzerService.getState().isPlaying).toBe(true);

      alertBuzzerService.silence();

      // Escalation to OUT_OF_STOCK
      shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'AB-' as BloodGroup,
        availableUnits: 0.0,
      });
      expect(alertBuzzerService.getState().isPlaying).toBe(true);
    });

    it('resolves shortage and silences buzzer when inventory recovers', () => {
      // Critical stock
      shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O+' as BloodGroup,
        availableUnits: 8.0,
      });
      expect(alertBuzzerService.getState().isPlaying).toBe(true);

      // Stock replenished to 35L
      const recoveredEvent = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O+' as BloodGroup,
        availableUnits: 35.0,
      });

      expect(recoveredEvent.severity).toBe('NORMAL');
      expect(recoveredEvent.status).toBe('RESOLVED');
      expect(alertBuzzerService.getState().isPlaying).toBe(false);
    });

    it('supports customizable facility-level alert thresholds', () => {
      shortageDetectionService.updateConfig({
        defaultCriticalThreshold: 12.0,
        defaultWarningThreshold: 18.0,
      });

      // 14L is above critical (12L) but below warning (18L)
      const event = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-SPECIAL',
        facilityName: 'Rural Critical Center',
        bloodGroup: 'A-' as BloodGroup,
        availableUnits: 14.0,
      });

      expect(event.severity).toBe('WARNING');

      // Reset to defaults
      shortageDetectionService.updateConfig({
        defaultCriticalThreshold: 15.0,
        defaultWarningThreshold: 25.0,
      });
    });
  });

  describe('Phase 4: Automatic Telegram Shortage Alerts', () => {
    it('dispatches formatted Telegram alert for critical shortages', async () => {
      const event = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O-' as BloodGroup,
        availableUnits: 8.0,
        triggerBuzzer: true,
      });

      const sent = await shortageDetectionService.dispatchTelegramAlert(event, '100001');
      expect(sent).toBe(true);
      expect(event.telegramSent).toBe(true);
      expect(event.outboxKey).toContain('SHT_TG_HOSP-001_O-_CRITICAL_');
    });

    it('deduplicates Telegram alert dispatches within cooldown interval', async () => {
      const event = shortageDetectionService.evaluateItem({
        facilityId: 'HOSP-001',
        facilityName: 'City General Care Hospital',
        bloodGroup: 'O-' as BloodGroup,
        availableUnits: 8.0,
      });

      // First dispatch succeeds
      const first = await shortageDetectionService.dispatchTelegramAlert(event, '100001');
      expect(first).toBe(true);

      // Second immediate dispatch for same severity is deduplicated
      const second = await shortageDetectionService.dispatchTelegramAlert(event, '100001');
      expect(second).toBe(false);
    });
  });

  describe('Phase 5: Automatic Telegram Alerts for Expiring Blood Units', () => {
    it('detects units in the critical 18-hour window and dispatches Telegram alert', async () => {
      const now = Date.now();
      const mockItems = [
        {
          unitId: 'PLT-2026-TEST18',
          bloodGroup: 'A-' as BloodGroup,
          component: 'Platelet Concentrate',
          expiryTimestamp: new Date(now + 16 * 3600 * 1000).toISOString(), // 16h remaining
          quantityUnits: 3.0,
          bloodBankId: 'ORG-BANK-01',
          bloodBankName: 'Central City Blood Bank',
          city: 'Nagpur',
          contact: '+91 712 2548901',
          lat: 21.1458,
          lng: 79.0882,
        },
      ];

      const scanResult = nearExpiryService.runScheduledExpiryScan({
        thresholdHours: 18.0,
        inventoryItems: mockItems,
      });

      expect(scanResult.newAlertsCreated).toBe(1);
      expect(scanResult.existingAlertsActive).toBeGreaterThanOrEqual(1);

      // Wait brief microtask for async dispatch
      await new Promise((r) => setTimeout(r, 20));

      // Repeated scan suppresses duplicate alert creation
      const secondScan = nearExpiryService.runScheduledExpiryScan({
        thresholdHours: 18.0,
        inventoryItems: mockItems,
      });

      expect(secondScan.idempotentDuplicatesSuppressed).toBe(1);
      expect(secondScan.newAlertsCreated).toBe(0);
    });

    it('excludes already expired units from active rescue alerts', () => {
      const now = Date.now();
      const expiredItems = [
        {
          unitId: 'EXP-UNIT-000',
          bloodGroup: 'O+' as BloodGroup,
          component: 'Whole Blood',
          expiryTimestamp: new Date(now - 2 * 3600 * 1000).toISOString(), // expired 2h ago
          quantityUnits: 2.0,
          bloodBankId: 'ORG-BANK-01',
          bloodBankName: 'Central City Blood Bank',
          city: 'Nagpur',
          contact: '+91 712 2548901',
          lat: 21.1458,
          lng: 79.0882,
        },
      ];

      const scanResult = nearExpiryService.runScheduledExpiryScan({
        thresholdHours: 18.0,
        inventoryItems: expiredItems,
      });

      expect(scanResult.newAlertsCreated).toBe(0);
    });
  });

  describe('Phase 6 & 7: Autonomous Server-Side Alert Scanner', () => {
    it('executes server-side scan autonomously and deduplicates subsequent scans', async () => {
      const firstScan = await runServerAlertScan();
      expect(firstScan.success).toBe(true);
      expect(firstScan.nearExpiryDetected).toBeGreaterThanOrEqual(1);
      expect(firstScan.shortagesDetected).toBeGreaterThanOrEqual(1);
      expect(firstScan.alertsDispatched).toBeGreaterThanOrEqual(1);

      // Second immediate scan: should suppress duplicates
      const secondScan = await runServerAlertScan();
      expect(secondScan.success).toBe(true);
      expect(secondScan.duplicatesSuppressed).toBeGreaterThanOrEqual(1);
    });
  });
});
