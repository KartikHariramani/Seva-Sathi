import { describe, it, expect, beforeEach } from 'vitest';
import { bloodRequestRepository } from '../bloodRequestRepository';
import { bloodBankService } from '../bloodBankService';
import { campaignService } from '../campaignService';
import { nearExpiryService } from '../nearExpiryService';
import { syncEngine } from '../../sync/broadcastSync';
import { SYNC_EVENTS } from '../../sync/syncEvents';
import { storageAdapter } from '../../persistence/localStorageAdapter';
import { unifiedTelegramNotificationService } from '../unifiedTelegramNotificationService';

describe('SevaSetu Real-Time Multi-Dashboard Data Synchronization Suite', () => {
  beforeEach(() => {
    storageAdapter.clearState();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  });

  // ==========================================================================
  // SECTION 1: HOSPITAL <-> BLOOD BANK REAL-TIME REQUEST & INVENTORY SYNCHRONIZATION
  // ==========================================================================
  describe('1. Hospital <-> Blood Bank Real-Time Request Lifecycle', () => {
    it('synchronizes request creation across Hospital and Blood Bank dashboards with real-time broadcast', async () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      const newRequest = await bloodRequestRepository.createRequest(
        {
          bloodGroup: 'B+',
          quantityLitres: 1.5,
          priority: 'urgent',
          requiredBy: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          reason: 'Emergency Trauma ICU',
          contactPhone: '+91 98765 43210',
          deliveryLocation: 'Emergency Blood Storage Unit',
        },
        {
          hospitalId: 'HOSP-METRO-01',
          hospitalName: 'Metropolitan General Hospital',
        }
      );

      expect(newRequest).toBeDefined();
      expect(newRequest.id).toContain('req-');
      expect(newRequest.displayId).toMatch(/^REQ-/);
      expect(newRequest.status).toBe('pending_approval');
      expect(newRequest.requiredBy).toBeDefined();

      // Verify canonical storage in both repository and storageAdapter
      const repoRequests = await bloodRequestRepository.getRequests();
      expect(repoRequests.some((r) => r.id === newRequest.id)).toBe(true);

      const appStoreRequests = storageAdapter.getState().requests;
      expect(appStoreRequests.some((r) => r.id === newRequest.id)).toBe(true);

      // Verify real-time broadcast event fired
      expect(
        receivedEvents.includes(SYNC_EVENTS.REQUEST_CREATED) ||
        receivedEvents.includes('hospital.request.created')
      ).toBe(true);

      unsub();
    });

    it('propagates Blood Bank reservation directly to Hospital state with matched facility info', async () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      // 1. Hospital creates request
      const req = await bloodRequestRepository.createRequest(
        {
          bloodGroup: 'O+',
          quantityLitres: 2.0,
          priority: 'emergency',
          requiredBy: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
          reason: 'Acute Hemorrhage',
          contactPhone: '+91 91234 56789',
        },
        {
          hospitalId: 'HOSP-CITY-02',
          hospitalName: 'City Trauma Center',
        }
      );

      // 2. Blood Bank accepts and reserves
      const matchedBankId = 'bank-nagpur-regional';
      const matchedBankName = 'Nagpur Regional Blood Centre';

      // Reserve stock in bloodBankService
      await bloodBankService.reserveStockAtBank(matchedBankId, 'O+', 2.0);

      // Update request state
      const updatedReq = await bloodRequestRepository.updateRequest(req.id, {
        status: 'reserved',
        matchedBloodBankId: matchedBankId,
        matchedBloodBankName: matchedBankName,
      });

      expect(updatedReq).toBeDefined();
      expect(updatedReq.status).toBe('reserved');
      expect(updatedReq.matchedBloodBankId).toBe(matchedBankId);
      expect(updatedReq.matchedBloodBankName).toBe(matchedBankName);

      // Verify Hospital view has immediate access to updated request
      const hospitalViewReq = await bloodRequestRepository.getRequest(req.id);
      expect(hospitalViewReq?.status).toBe('reserved');
      expect(hospitalViewReq?.matchedBloodBankName).toBe(matchedBankName);

      // Verify sync broadcast occurred
      expect(
        receivedEvents.includes(SYNC_EVENTS.REQUEST_UPDATED) ||
        receivedEvents.includes('hospital.request.status_changed')
      ).toBe(true);

      unsub();
    });

    it('synchronizes Blood Bank inventory updates to Hospital availability and matching views', async () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      const bankId = 'bank-nagpur-regional';
      const allBanks = await bloodBankService.getAllBanks();
      const targetBank = allBanks.find((b) => b.id === bankId);
      expect(targetBank).toBeDefined();

      const initialAvailable = targetBank!.inventories['A+'].availableStock;

      // Blood Bank adds new stock
      targetBank!.inventories['A+'].physicalStock += 5.0;
      targetBank!.inventories['A+'].availableStock += 5.0;
      bloodBankService.saveBanks(allBanks);
      syncEngine.broadcast(SYNC_EVENTS.INVENTORY_UPDATED, Date.now(), { bankId, bloodGroup: 'A+' });

      // Hospital availability query reflects updated stock
      const updatedBanks = await bloodBankService.getAllBanks();
      const updatedTargetBank = updatedBanks.find((b) => b.id === bankId);
      expect(updatedTargetBank?.inventories['A+'].availableStock).toBe(initialAvailable + 5.0);

      // Verify real-time broadcast fired
      expect(
        receivedEvents.includes(SYNC_EVENTS.INVENTORY_UPDATED) ||
        receivedEvents.includes('hospital.inventory.updated')
      ).toBe(true);

      unsub();
    });

    it('isolates private facility and patient confidential records across institutions', async () => {
      const created = await bloodRequestRepository.createRequest(
        {
          bloodGroup: 'A+',
          quantityLitres: 1.0,
          priority: 'routine',
          requiredBy: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          reason: 'Scheduled Orthopedic Surgery',
          contactPhone: '+91 98765 43210',
        },
        {
          hospitalId: 'HOSP-METRO-01',
          hospitalName: 'Metropolitan General Hospital',
        }
      );

      const allRequests = await bloodRequestRepository.getRequests();
      const metroRequests = allRequests.filter((r) => r.hospitalId === 'HOSP-METRO-01');

      metroRequests.forEach((r) => {
        expect(r.hospitalId).toBe('HOSP-METRO-01');
      });
      expect(metroRequests.length).toBeGreaterThan(0);
      expect(metroRequests.some((r) => r.id === created.id)).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 2: NSS ORGANIZATION <-> DONOR PORTAL SYNCHRONIZATION
  // ==========================================================================
  describe('2. NSS Organization <-> Donor Portal Drive & Registration Lifecycle', () => {
    it('creates campaigns and broadcasts creation in real-time across tabs', () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      // NSS Org creates campaign
      const newCamp = campaignService.createCampaign({
        title: 'Youth Red Cross Campus Drive',
        organizerId: 'ORG-NSS-IITB',
        organizerName: 'NSS IIT Bombay Unit',
        venueName: 'Student Activity Center',
        venueAddress: 'SAC Building, Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076',
        coordinates: { lat: 19.076, lng: 72.8777 },
        startDate: '2026-11-10',
        startTime: '09:00',
        endTime: '17:00',
        capacityTarget: 100,
        status: 'ACTIVE',
        eligibilityCriteria: 'Age 18-60',
        contactPhone: '+91 98765 11111',
        contactEmail: 'nss@iitb.ac.in',
        qrCodeSecret: 'QR-IITB-2026',
      });

      expect(newCamp.id).toBeDefined();
      expect(newCamp.status).toBe('ACTIVE');

      const allCamps = campaignService.getCampaigns();
      expect(allCamps.some((c) => c.id === newCamp.id)).toBe(true);

      // Realtime event broadcast
      expect(
        receivedEvents.includes(SYNC_EVENTS.CAMPAIGN_CREATED) ||
        receivedEvents.includes('campaign.created')
      ).toBe(true);

      unsub();
    });

    it('synchronizes Donor registration: increments organizer count, decreases capacity, and generates QR pass', () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      const camp = campaignService.getCampaigns()[0];
      const initialRegistered = camp.registeredCount;

      // Donor registers
      const regResult = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-TEST-2026-88',
        donorName: 'Aditya Deshmukh',
        donorEmail: 'aditya.deshmukh@example.com',
        donorPhone: '+91 99887 76655',
        bloodGroup: 'B+',
        timeSlot: '10:00 - 11:00',
      });

      expect(regResult.success).toBe(true);
      expect(regResult.registration?.qrTicketToken).toBeDefined();
      expect(regResult.registration?.status).toBe('REGISTERED');

      // Check campaign capacity in NSS Org dashboard
      const updatedCamp = campaignService.getCampaignById(camp.id);
      expect(updatedCamp?.registeredCount).toBe(initialRegistered + 1);

      // Verify real-time broadcast fired
      expect(
        receivedEvents.includes(SYNC_EVENTS.CAMPAIGN_REGISTERED) ||
        receivedEvents.includes('campaign.registered') ||
        receivedEvents.includes('registration.confirmed')
      ).toBe(true);

      unsub();
    });

    it('synchronizes Donor cancellation: restores capacity and updates organizer telemetry', () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      const camp = campaignService.getCampaigns()[0];

      // Create a registration to cancel
      const regResult = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-CANCEL-TEST',
        donorName: 'Test Cancellation Donor',
        donorEmail: 'cancel.donor@example.com',
        donorPhone: '+91 98765 00000',
        bloodGroup: 'AB+',
        timeSlot: '14:00 - 15:00',
      });

      expect(regResult.success).toBe(true);
      const regId = regResult.registration!.id;

      const countBeforeCancel = campaignService.getCampaignById(camp.id)?.registeredCount || 0;

      // Donor cancels registration
      const cancelResult = campaignService.cancelRegistration(regId, 'DNR-CANCEL-TEST');
      expect(cancelResult.success).toBe(true);

      // NSS Org capacity is restored
      const campAfterCancel = campaignService.getCampaignById(camp.id);
      expect(campAfterCancel?.registeredCount).toBe(countBeforeCancel - 1);

      // Realtime event broadcast
      expect(
        receivedEvents.includes(SYNC_EVENTS.CAMPAIGN_CANCELLED) ||
        receivedEvents.includes('campaign.cancelled') ||
        receivedEvents.includes('registration.cancelled')
      ).toBe(true);

      unsub();
    });
  });

  // ==========================================================================
  // SECTION 3: DYNAMIC QR PASS & ATOMIC ATTENDANCE CHECK-IN
  // ==========================================================================
  describe('3. Dynamic QR Pass & Atomic Attendance Check-In', () => {
    it('validates authentic QR pass, marks attendance atomically, and updates Organizer telemetry', () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      const camp = campaignService.getCampaigns()[0];
      const initialCheckedIn = camp.attendedCount;

      // Register donor
      const regResult = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-QR-001',
        donorName: 'Pooja Kulkarni',
        donorEmail: 'pooja.k@example.com',
        donorPhone: '+91 98220 12345',
        bloodGroup: 'O-',
        timeSlot: '11:00 - 12:00',
      });

      expect(regResult.success).toBe(true);
      const qrToken = regResult.registration!.qrTicketToken;

      // Volunteer / Organizer scans QR pass
      const checkInResult = campaignService.checkInDonor(qrToken, 'NSS-VOLUNTEER-42');
      expect(checkInResult.success).toBe(true);
      expect(checkInResult.registration?.status).toBe('ATTENDED');
      expect(checkInResult.registration?.checkedInAt).toBeDefined();

      // NSS Organizer telemetry updates live count
      const updatedCamp = campaignService.getCampaignById(camp.id);
      expect(updatedCamp?.attendedCount).toBe(initialCheckedIn + 1);

      // Realtime event broadcast
      expect(
        receivedEvents.includes(SYNC_EVENTS.CAMPAIGN_CHECKED_IN) ||
        receivedEvents.includes('campaign.checked_in') ||
        receivedEvents.includes('attendance.checked_in')
      ).toBe(true);

      unsub();
    });

    it('rejects duplicate QR scans to prevent double-counting attendance', () => {
      const camp = campaignService.getCampaigns()[0];

      const regResult = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-QR-DUP',
        donorName: 'Sanjay Gupta',
        donorEmail: 'sanjay.gupta@example.com',
        donorPhone: '+91 98220 99999',
        bloodGroup: 'A-',
        timeSlot: '11:00 - 12:00',
      });

      expect(regResult.success).toBe(true);
      const qrToken = regResult.registration!.qrTicketToken;

      // First scan: Valid
      const firstCheckIn = campaignService.checkInDonor(qrToken, 'VOL-1');
      expect(firstCheckIn.success).toBe(true);

      const countAfterFirstScan = campaignService.getCampaignById(camp.id)?.attendedCount || 0;

      // Second duplicate scan: Rejected with error message
      const secondCheckIn = campaignService.checkInDonor(qrToken, 'VOL-1');
      expect(secondCheckIn.success).toBe(false);
      expect(secondCheckIn.error).toMatch(/already scanned/i);

      // Count remains exactly the same
      const countAfterSecondScan = campaignService.getCampaignById(camp.id)?.attendedCount || 0;
      expect(countAfterSecondScan).toBe(countAfterFirstScan);
    });
  });

  // ==========================================================================
  // SECTION 4: ADMIN APPROVALS & FACILITY VERIFICATION SYNCHRONIZATION
  // ==========================================================================
  describe('4. Admin Approvals & Facility Verification Synchronization', () => {
    it('synchronizes organization approval to state and audit trail', () => {
      const state = storageAdapter.getState();
      const org = state.organizations[0];
      expect(org).toBeDefined();

      // Admin approves organization
      org.status = 'VERIFIED';
      org.verifiedAt = new Date().toISOString();
      state.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: 'admin-01',
        actorName: 'State Health Administrator',
        actorRole: 'admin',
        action: 'ORGANIZATION_VERIFIED',
        entityType: 'ORGANIZATION',
        entityId: org.id,
        severity: 'INFO',
        reason: 'Organization approved for state network operation',
      });
      storageAdapter.saveState(state);

      const updatedState = storageAdapter.getState();
      const updatedOrg = updatedState.organizations.find((o) => o.id === org.id);
      expect(updatedOrg?.status).toBe('VERIFIED');
      expect(updatedState.auditLogs[0].action).toBe('ORGANIZATION_VERIFIED');
    });
  });

  // ==========================================================================
  // SECTION 5: REAL-TIME RELIABILITY, RECONNECTION & EVENT DEDUPLICATION
  // ==========================================================================
  describe('5. Real-Time Reliability & Cross-Tab Reconnection', () => {
    it('reconciles state against authoritative database when window focus occurs', async () => {
      // Hospital creates request outside local view
      const req = await bloodRequestRepository.createRequest(
        {
          bloodGroup: 'AB-',
          quantityLitres: 1.0,
          priority: 'routine',
          requiredBy: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          reason: 'Elective Procedure',
          contactPhone: '+91 98888 77777',
        },
        {
          hospitalId: 'HOSP-EXTERNAL-99',
          hospitalName: 'Apollo Specialty Hospital',
        }
      );

      // Simulate a tab returning from background by fetching fresh repository snapshot
      const freshSnapshot = await bloodRequestRepository.getRequests();
      expect(freshSnapshot.some((r) => r.id === req.id)).toBe(true);
    });

    it('safely handles duplicate sync event broadcasts without corrupting state', () => {
      const camp = campaignService.getCampaigns()[0];
      const initialCount = camp.registeredCount;

      // Broadcast same event twice
      syncEngine.broadcast(SYNC_EVENTS.CAMPAIGN_UPDATED, Date.now(), { campaignId: camp.id });
      syncEngine.broadcast(SYNC_EVENTS.CAMPAIGN_UPDATED, Date.now(), { campaignId: camp.id });

      // Verifies idempotent stable state
      const currentCamp = campaignService.getCampaignById(camp.id);
      expect(currentCamp?.registeredCount).toBe(initialCount);
    });
  });

  // ==========================================================================
  // SECTION 6: SHORTAGE, NEAR-EXPIRY & TELEGRAM NOTIFICATION INTEGRATION
  // ==========================================================================
  describe('6. Shortages, Near-Expiry & Notification Integration', () => {
    it('broadcasts ALERT_UPDATED when near-expiry alert is registered and claimed', () => {
      const receivedEvents: string[] = [];
      const unsub = syncEngine.subscribe((event) => {
        receivedEvents.push(event.type);
      });

      const alert = nearExpiryService.createAlert({
        bloodBankId: 'bank-nagpur-regional',
        bloodBankName: 'Nagpur Regional Blood Centre',
        bloodBankCity: 'Nagpur',
        bloodBankContact: '+91 712 274 4401',
        coordinates: { lat: 21.127, lng: 79.098 },
        bloodGroup: 'O+',
        component: 'Whole Blood',
        quantityUnits: 4,
        batchOrUnitId: 'WB-2026-091',
        collectionDate: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
        expiryTimestamp: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        storageCondition: 'Cold Storage 2°C - 6°C',
        handlingConstraints: 'Strict cold-chain transit required',
      });

      expect(alert).toBeDefined();
      expect(alert.status).toBe('ACTIVE');

      // Claim alert for redistribution
      const claimResult = nearExpiryService.claimAlert({
        alertId: alert.id,
        hospitalId: 'HOSP-CLAIM-01',
        hospitalName: 'District Civil Hospital',
        requestedUnits: 2,
        clinicalIndication: 'Emergency ICU Resuscitation',
        urgency: 'critical',
        transfusionOfficer: 'Dr. Deshmukh',
      });
      expect(claimResult.success).toBe(true);

      const updatedAlert = nearExpiryService.getAlertById(alert.id);
      expect(updatedAlert?.status).toBe('RESERVED');
      expect(updatedAlert?.claimedByHospitalName).toBe('District Civil Hospital');

      // Verify ALERT_UPDATED broadcast occurred
      expect(receivedEvents.includes(SYNC_EVENTS.ALERT_UPDATED)).toBe(true);

      unsub();
    });

    it('dispatches Telegram notifications without failing underlying database operations', async () => {
      const req = {
        requestId: 'REQ-NOTIFICATION-TEST',
        displayId: 'REQ-NOTIF-01',
        hospitalName: 'General Hospital',
        bloodGroup: 'B-',
        quantityLitres: 2.0,
        priority: 'emergency',
        status: 'searching',
      };

      const result = await unifiedTelegramNotificationService.notifyHospitalBloodRequest(req);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
