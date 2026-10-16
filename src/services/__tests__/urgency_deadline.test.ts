import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateUrgencyDeadline,
  validateUrgencyDeadline,
  validateAndSanitizeServerDeadline,
  formatLocalDateTime,
  parseLocalDateTime,
  getUrgencyPolicyMessage,
  sortRequestsByDispatchQueue,
} from '../../utils/urgencyPolicy';
import { validateBloodRequest } from '../../utils/requestValidation';
import { bloodRequestRepository } from '../bloodRequestRepository';
import type { CreateBloodRequestInput, BloodRequest } from '../../types/bloodRequest';

describe('Urgency Policy & Automatic Deadline Calculation', () => {
  const mockNow = new Date('2026-10-16T10:00:00.000Z');

  describe('1. Urgency Deadline Calculation Policy', () => {
    it('calculates emergency deadline exactly 1 hour from reference time', () => {
      const deadline = calculateUrgencyDeadline('emergency', mockNow);
      const parsed = new Date(deadline);
      const diffMinutes = Math.round((parsed.getTime() - mockNow.getTime()) / (60 * 1000));
      expect(diffMinutes).toBe(60);
    });

    it('calculates urgent deadline exactly 2 hours from reference time', () => {
      const deadline = calculateUrgencyDeadline('urgent', mockNow);
      const parsed = new Date(deadline);
      const diffMinutes = Math.round((parsed.getTime() - mockNow.getTime()) / (60 * 1000));
      expect(diffMinutes).toBe(120);
    });

    it('calculates routine deadline to standard 24 hours window', () => {
      const deadline = calculateUrgencyDeadline('routine', mockNow);
      const parsed = new Date(deadline);
      const diffHours = Math.round((parsed.getTime() - mockNow.getTime()) / (3600 * 1000));
      expect(diffHours).toBe(24);
    });

    it('provides clear banner text for all urgency policies', () => {
      expect(getUrgencyPolicyMessage('emergency')).toBe(
        'Emergency request: required within 1 hour.'
      );
      expect(getUrgencyPolicyMessage('urgent')).toBe(
        'Urgent request: required within 2 hours.'
      );
      expect(getUrgencyPolicyMessage('routine')).toBe(
        'Routine request: standard fulfillment window (24 hours).'
      );
    });
  });

  describe('2. Urgency Switching Workflow & Preservation of Clinical Details', () => {
    it('switches between urgencies updating deadline without altering clinical reason', () => {
      const state: Partial<CreateBloodRequestInput> = {
        bloodGroup: 'O+',
        quantityLitres: 2.0,
        priority: 'routine',
        reason: 'Pre-operative cardiac surgery transfusion reserve',
        requiredBy: calculateUrgencyDeadline('routine', mockNow),
      };

      // User switches to urgent
      state.priority = 'urgent';
      state.requiredBy = calculateUrgencyDeadline('urgent', mockNow);
      expect(state.reason).toBe('Pre-operative cardiac surgery transfusion reserve');
      expect(new Date(state.requiredBy).getTime() - mockNow.getTime()).toBe(2 * 3600 * 1000);

      // User switches to emergency
      state.priority = 'emergency';
      state.requiredBy = calculateUrgencyDeadline('emergency', mockNow);
      expect(state.reason).toBe('Pre-operative cardiac surgery transfusion reserve');
      expect(new Date(state.requiredBy).getTime() - mockNow.getTime()).toBe(1 * 3600 * 1000);
    });
  });

  describe('3. Timezone Handling & Instant Representation', () => {
    it('formats and parses datetime-local representations consistently without drift', () => {
      const testDate = new Date('2026-10-16T14:30:00');
      const formatted = formatLocalDateTime(testDate);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

      const parsed = parseLocalDateTime(formatted);
      expect(parsed.getFullYear()).toBe(testDate.getFullYear());
      expect(parsed.getMonth()).toBe(testDate.getMonth());
      expect(parsed.getDate()).toBe(testDate.getDate());
      expect(parsed.getHours()).toBe(testDate.getHours());
      expect(parsed.getMinutes()).toBe(testDate.getMinutes());
    });
  });

  describe('4. Form Validation Against Urgency Policy Thresholds', () => {
    it('accepts emergency deadline within 1 hour policy', () => {
      const deadline1h = calculateUrgencyDeadline('emergency', mockNow);
      const validation = validateUrgencyDeadline('emergency', deadline1h, mockNow);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('rejects emergency deadline that exceeds maximum emergency threshold (>2 hours)', () => {
      const futureDate = new Date(mockNow.getTime() + 5 * 3600 * 1000);
      const invalidEmergencyDeadline = formatLocalDateTime(futureDate);
      const validation = validateUrgencyDeadline('emergency', invalidEmergencyDeadline, mockNow);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Emergency requests must be required within 2 hours');
    });

    it('rejects urgent deadline that exceeds maximum urgent threshold (>6 hours)', () => {
      const futureDate = new Date(mockNow.getTime() + 10 * 3600 * 1000);
      const invalidUrgentDeadline = formatLocalDateTime(futureDate);
      const validation = validateUrgencyDeadline('urgent', invalidUrgentDeadline, mockNow);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Urgent requests must be required within 6 hours');
    });

    it('detects and flags expired deadlines in the past', () => {
      const pastDate = new Date(mockNow.getTime() - 15 * 60 * 1000); // 15 mins in past
      const expiredDeadline = formatLocalDateTime(pastDate);
      const validation = validateUrgencyDeadline('emergency', expiredDeadline, mockNow);
      expect(validation.isValid).toBe(false);
      expect(validation.isExpired).toBe(true);
      expect(validation.error).toBe('Required time cannot be in the past.');
    });

    it('validates comprehensive blood request input with urgency rules', () => {
      const validReq = validateBloodRequest({
        bloodGroup: 'B+',
        quantityLitres: 3.5,
        priority: 'emergency',
        reason: 'Acute traumatic rupture and hemodilution resuscitation',
        requiredBy: calculateUrgencyDeadline('emergency'),
      });
      expect(validReq.isValid).toBe(true);

      const invalidReq = validateBloodRequest({
        bloodGroup: 'B+',
        quantityLitres: 3.5,
        priority: 'emergency',
        reason: 'Trauma',
        requiredBy: '2020-01-01T12:00', // Expired
      });
      expect(invalidReq.isValid).toBe(false);
      expect(invalidReq.errors.requiredBy).toBeDefined();
    });
  });

  describe('5. Server-Side Recalculation & Client Spoofing Protection', () => {
    it('server recalculates expired deadline to policy default (1h)', () => {
      const expired = formatLocalDateTime(new Date(mockNow.getTime() - 3600 * 1000));
      const result = validateAndSanitizeServerDeadline('emergency', expired, mockNow);
      expect(result.recalculated).toBe(true);
      const parsed = new Date(result.requiredBy);
      expect(parsed.getTime() - mockNow.getTime()).toBe(3600 * 1000);
    });

    it('server clamps emergency deadline if client attempts to submit beyond policy bounds', () => {
      const spoofed12h = formatLocalDateTime(new Date(mockNow.getTime() + 12 * 3600 * 1000));
      const result = validateAndSanitizeServerDeadline('emergency', spoofed12h, mockNow);
      expect(result.recalculated).toBe(true);
      expect(result.reason).toContain('Emergency deadline exceeded max threshold');
      const parsed = new Date(result.requiredBy);
      expect(parsed.getTime() - mockNow.getTime()).toBe(3600 * 1000);
    });

    it('server preserves valid compliant deadline without recalculation', () => {
      const valid45m = formatLocalDateTime(new Date(mockNow.getTime() + 45 * 60 * 1000));
      const result = validateAndSanitizeServerDeadline('emergency', valid45m, mockNow);
      expect(result.recalculated).toBe(false);
      expect(result.requiredBy).toBe(valid45m);
    });
  });

  describe('6. Emergency Prioritization & Dispatch Queue Ordering', () => {
    beforeEach(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    it('creates emergency request and ensures persistence with verified deadline', async () => {
      const newReq = await bloodRequestRepository.createRequest(
        {
          bloodGroup: 'AB-',
          quantityLitres: 2.0,
          priority: 'emergency',
          reason: 'Severe hemorrhagic shock in trauma OT',
          requiredBy: calculateUrgencyDeadline('emergency'),
          deliveryLocation: 'Emergency Trauma ICU',
          department: 'Trauma Surgery',
          contactPhone: '+91 712 256 8900',
        },
        {
          hospitalId: 'HSP-TEST',
          hospitalName: 'Seva Sathi Apex Hospital',
          submittedBy: 'Chief Medical Officer',
        }
      );

      expect(newReq.priority).toBe('emergency');
      expect(newReq.requiredBy).toBeDefined();
      expect(newReq.activities.length).toBeGreaterThanOrEqual(1);

      const queue = await bloodRequestRepository.getDispatchQueue();
      const found = queue.find((r) => r.id === newReq.id);
      expect(found).toBeDefined();
      expect(found?.priority).toBe('emergency');
    });

    it('orders dispatch queue by emergency priority first, then earliest deadline', () => {
      const now = Date.now();
      const sampleRequests: BloodRequest[] = [
        {
          id: 'req-routine',
          displayId: 'REQ-ROUTINE',
          hospitalId: 'HSP-1',
          hospitalName: 'General Hospital',
          hospitalCity: 'Nagpur',
          deliveryLocation: 'Ward 4',
          department: 'General Surgery',
          contactPhone: '1234567890',
          bloodGroup: 'A+',
          quantityLitres: 1.0,
          priority: 'routine',
          status: 'pending_approval',
          requiredBy: new Date(now + 24 * 3600 * 1000).toISOString(),
          reason: 'Routine surgery',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedBy: 'Dr. Rao',
          activities: [],
        },
        {
          id: 'req-urgent',
          displayId: 'REQ-URGENT',
          hospitalId: 'HSP-2',
          hospitalName: 'Trauma Center',
          hospitalCity: 'Nagpur',
          deliveryLocation: 'OT 2',
          department: 'Orthopedics',
          contactPhone: '1234567890',
          bloodGroup: 'O+',
          quantityLitres: 2.0,
          priority: 'urgent',
          status: 'searching',
          requiredBy: new Date(now + 2 * 3600 * 1000).toISOString(),
          reason: 'Urgent surgery',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedBy: 'Dr. Patel',
          activities: [],
        },
        {
          id: 'req-emergency-late',
          displayId: 'REQ-EMERGENCY-2',
          hospitalId: 'HSP-3',
          hospitalName: 'City Hospital',
          hospitalCity: 'Nagpur',
          deliveryLocation: 'ER',
          department: 'ER',
          contactPhone: '1234567890',
          bloodGroup: 'B-',
          quantityLitres: 4.0,
          priority: 'emergency',
          status: 'searching',
          requiredBy: new Date(now + 75 * 60 * 1000).toISOString(), // 75 mins
          reason: 'Multiple fracture surgery',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedBy: 'Dr. Sharma',
          activities: [],
        },
        {
          id: 'req-emergency-soon',
          displayId: 'REQ-EMERGENCY-1',
          hospitalId: 'HSP-4',
          hospitalName: 'Apex Trauma',
          hospitalCity: 'Nagpur',
          deliveryLocation: 'Resus Bay',
          department: 'Trauma',
          contactPhone: '1234567890',
          bloodGroup: 'O-',
          quantityLitres: 5.0,
          priority: 'emergency',
          status: 'searching',
          requiredBy: new Date(now + 30 * 60 * 1000).toISOString(), // 30 mins
          reason: 'Massive internal hemorrhage',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedBy: 'Dr. Deshmukh',
          activities: [],
        },
      ];

      const sorted = sortRequestsByDispatchQueue(sampleRequests);
      // Emergency requests must come first, and the one required sooner (30m) must precede the 75m one
      expect(sorted[0].id).toBe('req-emergency-soon');
      expect(sorted[1].id).toBe('req-emergency-late');
      expect(sorted[2].id).toBe('req-urgent');
      expect(sorted[3].id).toBe('req-routine');
    });
  });
});
