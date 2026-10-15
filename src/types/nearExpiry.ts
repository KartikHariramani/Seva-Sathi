import type { BloodGroup } from './index';

export type BloodComponent =
  | 'Whole Blood'
  | 'Packed Red Blood Cells (PRBC)'
  | 'Platelet Concentrate'
  | 'Fresh Frozen Plasma (FFP)'
  | 'Cryoprecipitate';

export type NearExpiryNotificationWindow = 24 | 48 | 72; // hours before expiry

export type NearExpiryStatus =
  | 'ACTIVE'
  | 'RESERVED'
  | 'TRANSFERRED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface NearExpiryAlert {
  id: string; // e.g. NEA-20261015-01
  bloodBankId: string;
  bloodBankName: string;
  bloodBankCity: string;
  bloodBankContact: string;
  coordinates: { lat: number; lng: number };
  bloodGroup: BloodGroup;
  component: BloodComponent;
  quantityUnits: number;
  batchOrUnitId: string;
  collectionDate?: string;
  expiryTimestamp: string;
  hoursRemaining: number;
  storageCondition: string; // e.g. 'Cold Storage 2°C - 6°C'
  handlingConstraints: string; // e.g. 'Strict cold-chain transit required'
  responseDeadline: string;
  status: NearExpiryStatus;
  claimedByHospitalId?: string;
  claimedByHospitalName?: string;
  reservationId?: string;
  transferId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNearExpiryAlertInput {
  bloodBankId: string;
  bloodBankName: string;
  bloodBankCity: string;
  bloodBankContact: string;
  coordinates: { lat: number; lng: number };
  bloodGroup: BloodGroup;
  component: BloodComponent;
  quantityUnits: number;
  batchOrUnitId: string;
  collectionDate?: string;
  expiryTimestamp: string;
  storageCondition: string;
  handlingConstraints: string;
  responseDeadlineHours?: number; // e.g. 12, 24
}

export interface RescueRequestClaimInput {
  alertId: string;
  hospitalId: string;
  hospitalName: string;
  requestedUnits: number;
  clinicalIndication: string;
  urgency: 'critical' | 'high' | 'routine';
  transfusionOfficer: string;
}
