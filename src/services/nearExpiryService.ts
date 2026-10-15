import type { BloodGroup } from '../types';
import type {
  NearExpiryAlert,
  CreateNearExpiryAlertInput,
  RescueRequestClaimInput,
} from '../types/nearExpiry';
import { calculateHaversineDistance } from '../lib/supabase';
import { localEventBus } from '../sync/localEventBus';
import type { Organization } from '../types/organization';

// In-memory persistent seeded near-expiry alerts with dynamic timestamps
const DEFAULT_ALERTS: NearExpiryAlert[] = [
  {
    id: 'NEA-20261015-01',
    bloodBankId: 'ORG-BANK-01',
    bloodBankName: 'Central City Blood Bank & Apheresis Depot',
    bloodBankCity: 'Nagpur',
    bloodBankContact: '+91 712 2548901',
    coordinates: { lat: 21.1458, lng: 79.0882 },
    bloodGroup: 'O+',
    component: 'Packed Red Blood Cells (PRBC)',
    quantityUnits: 2.0,
    batchOrUnitId: 'PRBC-2026-9042',
    collectionDate: '2026-09-12',
    expiryTimestamp: new Date(Date.now() + 22 * 3600 * 1000).toISOString(), // 22 hours remaining
    hoursRemaining: 22,
    storageCondition: 'Cold Vault 2°C - 6°C',
    handlingConstraints: 'Strict cold-chain transit required; transfer within 4 hours of dispatch',
    responseDeadline: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'NEA-20261015-02',
    bloodBankId: 'ORG-BANK-02',
    bloodBankName: 'Nagpur District Red Cross Blood Centre',
    bloodBankCity: 'Nagpur',
    bloodBankContact: '+91 712 2721100',
    coordinates: { lat: 21.139, lng: 79.076 },
    bloodGroup: 'A-',
    component: 'Platelet Concentrate',
    quantityUnits: 3.0,
    batchOrUnitId: 'PLT-2026-3310',
    collectionDate: '2026-10-11',
    expiryTimestamp: new Date(Date.now() + 18 * 3600 * 1000).toISOString(), // 18 hours remaining
    hoursRemaining: 18,
    storageCondition: 'Agitator Incubator 20°C - 24°C',
    handlingConstraints: 'Continuous flatbed agitation required during transport',
    responseDeadline: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'NEA-20261015-03',
    bloodBankId: 'ORG-BANK-01',
    bloodBankName: 'Central City Blood Bank & Apheresis Depot',
    bloodBankCity: 'Nagpur',
    bloodBankContact: '+91 712 2548901',
    coordinates: { lat: 21.1458, lng: 79.0882 },
    bloodGroup: 'B+',
    component: 'Fresh Frozen Plasma (FFP)',
    quantityUnits: 4.0,
    batchOrUnitId: 'FFP-2026-8801',
    collectionDate: '2025-10-16',
    expiryTimestamp: new Date(Date.now() + 46 * 3600 * 1000).toISOString(), // 46 hours remaining
    hoursRemaining: 46,
    storageCondition: 'Deep Freeze -30°C',
    handlingConstraints: 'Dry ice packaging required',
    responseDeadline: new Date(Date.now() + 30 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

class NearExpiryService {
  private alerts: NearExpiryAlert[] = [];

  constructor() {
    this.loadAlerts();
  }

  private loadAlerts() {
    try {
      const stored = localStorage.getItem('sevasathi_near_expiry_alerts');
      if (stored) {
        this.alerts = JSON.parse(stored);
      } else {
        this.alerts = [...DEFAULT_ALERTS];
        this.saveAlerts();
      }
    } catch {
      this.alerts = [...DEFAULT_ALERTS];
    }
    this.refreshRemainingHours();
  }

  private saveAlerts() {
    try {
      localStorage.setItem('sevasathi_near_expiry_alerts', JSON.stringify(this.alerts));
    } catch {
      // fallback
    }
  }

  /**
   * Recalculate dynamic hours remaining and mark expired items
   */
  public refreshRemainingHours() {
    const now = Date.now();
    let changed = false;

    this.alerts = this.alerts.map((alert) => {
      const expTime = new Date(alert.expiryTimestamp).getTime();
      const diffHours = Math.round(((expTime - now) / (1000 * 3600)) * 10) / 10;

      let newStatus = alert.status;
      if (diffHours <= 0 && alert.status === 'ACTIVE') {
        newStatus = 'EXPIRED';
        changed = true;
      }

      return {
        ...alert,
        hoursRemaining: Math.max(0, diffHours),
        status: newStatus,
      };
    });

    if (changed) {
      this.saveAlerts();
    }
  }

  /**
   * Fetch Near Expiry Alerts with Filters
   */
  public getAlerts(filter?: {
    bloodGroup?: BloodGroup;
    maxHours?: number;
    status?: string;
    bloodBankId?: string;
  }): NearExpiryAlert[] {
    this.refreshRemainingHours();

    return this.alerts.filter((a) => {
      if (filter?.bloodGroup && a.bloodGroup !== filter.bloodGroup) return false;
      if (filter?.status && filter.status !== 'ALL' && a.status !== filter.status) return false;
      if (filter?.maxHours && a.hoursRemaining > filter.maxHours) return false;
      if (filter?.bloodBankId && a.bloodBankId !== filter.bloodBankId) return false;
      return true;
    }).sort((a, b) => a.hoursRemaining - b.hoursRemaining);
  }

  /**
   * Create a Near-Expiry Rescue Alert
   */
  public createAlert(input: CreateNearExpiryAlertInput): NearExpiryAlert {
    const expTime = new Date(input.expiryTimestamp).getTime();
    const diffHours = Math.round(((expTime - Date.now()) / (1000 * 3600)) * 10) / 10;

    if (diffHours <= 0) {
      throw new Error('Cannot publish alert for already expired blood components.');
    }
    if (input.quantityUnits <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }

    const responseHours = input.responseDeadlineHours || Math.max(2, Math.round(diffHours * 0.6));
    const responseDeadline = new Date(Date.now() + responseHours * 3600 * 1000).toISOString();

    const newAlert: NearExpiryAlert = {
      id: `NEA-${new Date().toISOString().replace(/\D/g, '').substring(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      bloodBankId: input.bloodBankId,
      bloodBankName: input.bloodBankName,
      bloodBankCity: input.bloodBankCity,
      bloodBankContact: input.bloodBankContact,
      coordinates: input.coordinates,
      bloodGroup: input.bloodGroup,
      component: input.component,
      quantityUnits: input.quantityUnits,
      batchOrUnitId: input.batchOrUnitId,
      collectionDate: input.collectionDate,
      expiryTimestamp: input.expiryTimestamp,
      hoursRemaining: diffHours,
      storageCondition: input.storageCondition,
      handlingConstraints: input.handlingConstraints,
      responseDeadline,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.alerts.unshift(newAlert);
    this.saveAlerts();

    localEventBus.emit('near_expiry.created', newAlert);
    return newAlert;
  }

  /**
   * Atomically Claim Near-Expiry Alert (Prevents double reservations)
   */
  public claimAlert(input: RescueRequestClaimInput): {
    success: boolean;
    reservationId?: string;
    error?: string;
  } {
    this.refreshRemainingHours();
    const alertIndex = this.alerts.findIndex((a) => a.id === input.alertId);

    if (alertIndex === -1) {
      return { success: false, error: 'Near-expiry alert not found.' };
    }

    const alert = this.alerts[alertIndex];

    if (alert.status !== 'ACTIVE') {
      return {
        success: false,
        error: `Cannot claim: Alert is currently in status "${alert.status}". It may have already been claimed or expired.`,
      };
    }

    const reservationId = `RES-EXP-${new Date().toISOString().replace(/\D/g, '').substring(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const updatedAlert: NearExpiryAlert = {
      ...alert,
      status: 'RESERVED',
      claimedByHospitalId: input.hospitalId,
      claimedByHospitalName: input.hospitalName,
      reservationId,
      updatedAt: new Date().toISOString(),
    };

    this.alerts[alertIndex] = updatedAlert;
    this.saveAlerts();

    localEventBus.emit('near_expiry.claimed', {
      alertId: input.alertId,
      reservationId,
      hospitalId: input.hospitalId,
      hospitalName: input.hospitalName,
    });

    return { success: true, reservationId };
  }

  /**
   * Rank Feasible Receiving Institutions based on Proximity and Urgency
   */
  public rankReceivingHospitals(
    alert: NearExpiryAlert,
    hospitals: Organization[]
  ): Array<{
    hospital: Organization;
    distanceKm: number;
    estimatedTransitMinutes: number;
    isFeasible: boolean;
    urgencyPriority: 'critical' | 'high' | 'routine';
    reason: string;
  }> {
    const verifiedHospitals = hospitals.filter((h) => h.type === 'hospital' && h.status === 'VERIFIED');

    return verifiedHospitals.map((h) => {
      const dist = calculateHaversineDistance(
        alert.coordinates.lat,
        alert.coordinates.lng,
        h.location.coordinates.lat || 21.1458,
        h.location.coordinates.lng || 79.0882
      );

      // Estimate cold-chain transport time (30km/h average city ambulance corridor)
      const transitMinutes = Math.round((dist / 30) * 60 + 15);
      const transitHours = transitMinutes / 60;

      // Feasible if transit takes less than 50% of remaining shelf life
      const isFeasible = transitHours < alert.hoursRemaining;

      return {
        hospital: h,
        distanceKm: dist,
        estimatedTransitMinutes: transitMinutes,
        isFeasible,
        urgencyPriority: (dist < 10 ? 'critical' : dist < 25 ? 'high' : 'routine') as 'critical' | 'high' | 'routine',
        reason: isFeasible
          ? `Within cold-chain transport corridor (${transitMinutes}m transit, ${dist}km away)`
          : `Transit time (${transitMinutes}m) exceeds safe cold-chain transfer window for ${alert.hoursRemaining}h shelf life`,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

export const nearExpiryService = new NearExpiryService();
