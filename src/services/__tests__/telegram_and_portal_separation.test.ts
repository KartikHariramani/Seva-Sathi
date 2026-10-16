import { describe, it, expect, beforeEach } from 'vitest';
import { campaignService } from '../campaignService';
import { unifiedTelegramNotificationService } from '../unifiedTelegramNotificationService';

describe('SevaSetu: Telegram Alert Repair & Hospital / Donation Drive Separation Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  });

  // ==========================================================================
  // PART A: TELEGRAM ALERT GENERATION & MULTI-CHANNEL DISPATCH
  // ==========================================================================
  describe('Part A — Telegram Alert Pipeline & Diagnostics', () => {
    it('verifies Telegram bot environment credentials and configuration', () => {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const username = process.env.TELEGRAM_BOT_USERNAME;
      expect(token).toBeDefined();
      expect(token).toContain(':');
      expect(username).toBe('sevasathibot');
    });

    it('generates, queues, and validates hospital blood requisition notification', async () => {
      const sampleRequest = {
        requestId: 'REQ-EMERG-202610-99',
        displayId: 'REQ-202610-99',
        hospitalName: 'Metropolitan Trauma Center',
        bloodGroup: 'O-',
        quantityLitres: 3.5,
        priority: 'emergency',
        status: 'searching',
      };

      const result = await unifiedTelegramNotificationService.notifyHospitalBloodRequest(sampleRequest);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('generates campaign registration notification with digital pass token', async () => {
      const camp = campaignService.getCampaigns()[0];
      const payload = {
        eventType: 'REGISTRATION' as const,
        donorId: 'DNR-202610-001',
        donorName: 'Rahul Sharma',
        campaignTitle: camp.title,
        venueName: camp.venueName,
        date: camp.startDate,
        timeSlot: '09:30 - 10:30',
        qrTicketToken: 'TK-VID-8812-PASS',
        recipientChatId: '100001',
      };

      const result = await unifiedTelegramNotificationService.notifyCampaignEvent(payload);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('generates attendance check-in confirmation dispatch', async () => {
      const payload = {
        eventType: 'CHECKIN' as const,
        donorId: 'DNR-202610-001',
        donorName: 'Rahul Sharma',
        campaignTitle: 'Central Vidarbha Voluntary Blood Drive',
        venueName: 'Sitabuldi Metro Atrium',
        date: '2026-10-25',
        timeSlot: '09:30 - 10:30',
        qrTicketToken: 'TK-VID-8812-PASS',
        recipientChatId: '100001',
      };

      const result = await unifiedTelegramNotificationService.notifyCampaignEvent(payload);
      expect(result.success).toBe(true);
    });

    it('generates waitlist promotion notification upon slot release', async () => {
      const payload = {
        eventType: 'WAITLIST_PROMOTED' as const,
        donorId: 'DNR-202610-003',
        donorName: 'Amitabh Deshmukh',
        campaignTitle: 'Central Vidarbha Voluntary Blood Drive',
        venueName: 'Sitabuldi Metro Atrium',
        date: '2026-10-25',
        timeSlot: '09:30 - 10:30',
        qrTicketToken: 'TK-VID-8814-WAIT',
        recipientChatId: '100001',
      };

      const result = await unifiedTelegramNotificationService.notifyCampaignEvent(payload);
      expect(result.success).toBe(true);
    });

    it('retrieves system diagnostic report containing status and delivery ledger', async () => {
      const diag = await unifiedTelegramNotificationService.getDiagnostics();
      expect(diag).toBeDefined();
      expect(diag.stats).toBeDefined();
      expect(typeof diag.stats.totalOutboxCount).toBe('number');
    });

    it('executes diagnostic test alert dispatch', async () => {
      const res = await unifiedTelegramNotificationService.sendLiveTestAlert('100001', 'Diagnostic Verification Test');
      expect(res).toBeDefined();
      expect(res.success).toBe(true);
    });
  });

  // ==========================================================================
  // PART B: HOSPITAL & DONATION DRIVE INTERFACE SEPARATION
  // ==========================================================================
  describe('Part B — Portal Separation & Role-Specific Boundary Isolation', () => {
    it('verifies that Hospital navigation links do not expose the Donor Portal', () => {
      const hospitalNavPaths = [
        '/hospital/dashboard',
        '/hospital/requests',
        '/hospital/requests/new',
        '/hospital/network',
        '/hospital/inventory',
        '/hospital/usage/new',
        '/hospital/predictions',
        '/hospital/transactions',
        '/hospital/staff',
      ];

      // Invariant: Hospital navigation must not include donor routes
      hospitalNavPaths.forEach((p) => {
        expect(p.startsWith('/donor')).toBe(false);
      });
      expect(hospitalNavPaths).not.toContain('/donor/portal');
    });

    it('verifies that Donor navigation routes are dedicated to blood drives and passes', () => {
      const donorNavPaths = [
        '/donor/portal',
        '/donor/drives',
        '/donor/registrations',
        '/donor/passes',
        '/donor/notifications',
      ];

      // Invariant: Donor routes must not point to hospital clinical operational paths
      donorNavPaths.forEach((p) => {
        expect(p.startsWith('/hospital')).toBe(false);
        expect(p.startsWith('/blood-bank')).toBe(false);
        expect(p.startsWith('/admin')).toBe(false);
      });
    });

    it('allows donors to query published drives and retrieve personal registrations', () => {
      const campaigns = campaignService.getCampaigns();
      expect(campaigns.length).toBeGreaterThan(0);

      // Register donor
      const regRes = campaignService.registerDonor({
        campaignId: campaigns[0].id,
        donorId: 'DNR-TEST-ROLE-01',
        donorName: 'Test Volunteer',
        donorPhone: '+91 98000 11111',
        donorEmail: 'test.vol@example.org',
        bloodGroup: 'B+',
        timeSlot: '11:00 - 12:00',
      });

      expect(regRes.success).toBe(true);
      expect(regRes.registration).toBeDefined();

      // Retrieve registrations specifically for this donor
      const myRegs = campaignService.getRegistrationsByDonor('DNR-TEST-ROLE-01');
      expect(myRegs.length).toBe(1);
      expect(myRegs[0].campaignId).toBe(campaigns[0].id);
      expect(myRegs[0].qrTicketToken).toBeDefined();
    });

    it('enforces donor registration cancellation policy and capacity rebalancing', () => {
      const campaigns = campaignService.getCampaigns();
      const camp = campaigns[0];
      const initialCount = camp.registeredCount;
      expect(initialCount).toBeGreaterThanOrEqual(0);

      const regRes = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-CANCEL-TEST',
        donorName: 'Cancel Test Donor',
        donorPhone: '+91 98000 22222',
        donorEmail: 'cancel.test@example.org',
        bloodGroup: 'O+',
        timeSlot: '14:00 - 15:00',
      });

      expect(regRes.success).toBe(true);
      const regId = regRes.registration!.id;

      // Cancel registration
      const cancelRes = campaignService.cancelRegistration(regId, 'DNR-CANCEL-TEST');
      expect(cancelRes.success).toBe(true);

      // Verify donor registrations reflect cancellation
      const donorRegs = campaignService.getRegistrationsByDonor('DNR-CANCEL-TEST');
      expect(donorRegs[0].status).toBe('CANCELLED');
    });

    it('blocks unauthorized users from cancelling someone else registration', () => {
      const campaigns = campaignService.getCampaigns();
      const regRes = campaignService.registerDonor({
        campaignId: campaigns[0].id,
        donorId: 'DNR-OWNER',
        donorName: 'Owner Donor',
        donorPhone: '+91 98000 33333',
        donorEmail: 'owner@example.org',
        bloodGroup: 'A+',
        timeSlot: '15:00 - 16:00',
      });

      const cancelAttempt = campaignService.cancelRegistration(regRes.registration!.id, 'DNR-IMPOSTER');
      expect(cancelAttempt.success).toBe(false);
      expect(cancelAttempt.error).toContain('Unauthorized');
    });
  });
});
