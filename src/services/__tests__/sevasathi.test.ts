import { describe, it, expect } from 'vitest';
import {
  normalizeBloodGroup,
  normalizeBloodComponent,
  parseSupportedDate,
  processRawRows,
} from '../importParserService';
import { nearExpiryService } from '../nearExpiryService';
import { donorService } from '../donorService';

describe('Seva Sathi: Blood Group & Component Normalization', () => {
  it('should accurately normalize various blood group formats', () => {
    expect(normalizeBloodGroup('O+')).toBe('O+');
    expect(normalizeBloodGroup('O Positive')).toBe('O+');
    expect(normalizeBloodGroup('o positive')).toBe('O+');
    expect(normalizeBloodGroup('O+VE')).toBe('O+');
    expect(normalizeBloodGroup('O POS')).toBe('O+');

    expect(normalizeBloodGroup('O-')).toBe('O-');
    expect(normalizeBloodGroup('O Negative')).toBe('O-');
    expect(normalizeBloodGroup('O-VE')).toBe('O-');
    expect(normalizeBloodGroup('O NEG')).toBe('O-');

    expect(normalizeBloodGroup('AB Positive')).toBe('AB+');
    expect(normalizeBloodGroup('ab+')).toBe('AB+');
    expect(normalizeBloodGroup('AB Negative')).toBe('AB-');
    expect(normalizeBloodGroup('A+')).toBe('A+');
    expect(normalizeBloodGroup('B POSITIVE')).toBe('B+');

    expect(normalizeBloodGroup('INVALID')).toBe(null);
    expect(normalizeBloodGroup(null)).toBe(null);
  });

  it('should accurately normalize component types', () => {
    expect(normalizeBloodComponent('prbc')).toBe('Packed Red Blood Cells (PRBC)');
    expect(normalizeBloodComponent('Packed Red Blood Cells')).toBe('Packed Red Blood Cells (PRBC)');
    expect(normalizeBloodComponent('platelets')).toBe('Platelet Concentrate');
    expect(normalizeBloodComponent('Fresh Frozen Plasma')).toBe('Fresh Frozen Plasma (FFP)');
    expect(normalizeBloodComponent('cryoprecipitate')).toBe('Cryoprecipitate');
    expect(normalizeBloodComponent('whole blood')).toBe('Whole Blood');
  });

  it('should parse ISO and Indian format dates and detect expired inventory', () => {
    const futureDate = parseSupportedDate('2028-12-31');
    expect(futureDate.isValid).toBe(true);
    expect(futureDate.isExpired).toBe(false);

    const pastDate = parseSupportedDate('2020-01-01');
    expect(pastDate.isValid).toBe(true);
    expect(pastDate.isExpired).toBe(true);

    const ddmmyyyy = parseSupportedDate('25/12/2028');
    expect(ddmmyyyy.isValid).toBe(true);
    expect(ddmmyyyy.dateStr).toBe('2028-12-25');
  });
});

describe('Seva Sathi: Tabular Ingestion & Duplicate Detection', () => {
  it('should detect valid rows, duplicate unit IDs, and invalid quantities', () => {
    const mockRawRows = [
      {
        'Blood Group': 'O Positive',
        'Component': 'PRBC',
        'Quantity': 3,
        'Expiry Date': '2028-10-16',
        'Unit ID': 'BAG-1001',
      },
      {
        'Blood Group': 'O Positive',
        'Component': 'PRBC',
        'Quantity': 2,
        'Expiry Date': '2028-10-16',
        'Unit ID': 'BAG-1001', // Duplicate Unit ID
      },
      {
        'Blood Group': 'UNKNOWN',
        'Component': 'Platelets',
        'Quantity': -5, // Invalid negative quantity
        'Expiry Date': '2028-10-16',
      },
    ];

    const extracted = processRawRows(mockRawRows);
    expect(extracted.length).toBe(3);

    // First row: valid
    expect(extracted[0].validationStatus).toBe('VALID');
    expect(extracted[0].bloodGroup).toBe('O+');
    expect(extracted[0].quantity).toBe(3);

    // Second row: duplicate detected
    expect(extracted[1].validationStatus).toBe('DUPLICATE');
    expect(extracted[1].validationErrors.some((e) => e.includes('Duplicate'))).toBe(true);

    // Third row: invalid group and negative qty
    expect(extracted[2].validationStatus).toBe('INVALID');
    expect(extracted[2].bloodGroup).toBe(null);
  });
});

describe('Seva Sathi: Near-Expiry Rescue & Atomic Supply Lock', () => {
  it('should allow first hospital to claim near-expiry alert and block concurrent claims', () => {
    const alerts = nearExpiryService.getAlerts({ status: 'ACTIVE' });
    expect(alerts.length).toBeGreaterThan(0);

    const targetAlert = alerts[0];

    // First hospital claims
    const claim1 = nearExpiryService.claimAlert({
      alertId: targetAlert.id,
      hospitalId: 'ORG-HOSP-01',
      hospitalName: 'Metropolitan Trauma Hospital',
      requestedUnits: targetAlert.quantityUnits,
      clinicalIndication: 'Emergency Trauma Surgery',
      urgency: 'critical',
      transfusionOfficer: 'Dr. Sharma',
    });

    expect(claim1.success).toBe(true);
    expect(claim1.reservationId).toBeDefined();

    // Second hospital tries to claim same physical units
    const claim2 = nearExpiryService.claimAlert({
      alertId: targetAlert.id,
      hospitalId: 'ORG-HOSP-02',
      hospitalName: 'City General Hospital',
      requestedUnits: targetAlert.quantityUnits,
      clinicalIndication: 'Cardiac bypass surgery',
      urgency: 'critical',
      transfusionOfficer: 'Dr. Verma',
    });

    expect(claim2.success).toBe(false);
    expect(claim2.error).toContain('already been claimed');
  });
});

describe('Seva Sathi: Donor Mobilization & Strict Consent', () => {
  it('should strictly exclude donors who have not given emergency alert consent', () => {
    const notifications = donorService.mobilizeForShortage({
      requestId: 'REQ-TEST-01',
      bloodGroup: 'AB-',
      shortageUnits: 2,
      hospitalName: 'Metropolitan Trauma Hospital',
      hospitalCity: 'Nagpur',
      hospitalLat: 21.128,
      hospitalLng: 79.098,
      urgency: 'critical',
    });

    // Vikram Choudhary has consentEmergencyAlerts: false for AB-
    const notifiedVikram = notifications.some((n) => n.donorName === 'Vikram Choudhary');
    expect(notifiedVikram).toBe(false);
  });
});
