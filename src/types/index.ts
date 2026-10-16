export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type OrganizationType = 'hospital' | 'blood_bank' | 'ngo';

export type UserRole = 'hospital' | 'blood_bank' | 'admin' | 'hospital_staff' | 'donor' | 'ngo';

export interface OrganizationRegistrationData {
  organizationType: OrganizationType;
  organizationName: string;
  organizationId: string;
  address: string;
  city: string;
  contactNumber: string;
  adminName: string;
  email: string;
  password?: string;
  inventory?: Record<BloodGroup, number>;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: OrganizationType | 'hub';
  city: string;
  status: 'optimal' | 'low_stock' | 'critical' | 'excess';
  bloodUnitsTotal: number;
  criticalGroups: BloodGroup[];
  excessGroups: BloodGroup[];
  activeRequestsCount: number;
  lastUpdated: string;
  coordinates: { x: number; y: number }; // normalized 0-100 for diagram
}

export interface NetworkTransfer {
  id: string;
  fromNodeName: string;
  toNodeName: string;
  bloodGroup: BloodGroup;
  units: number;
  status: 'in_transit' | 'scheduled' | 'completed';
  etaMinutes: number;
  urgency: 'critical' | 'high' | 'routine';
  timestamp: string;
}

export interface PredictiveAlert {
  id: string;
  type: 'stockout_risk' | 'expiry_risk' | 'redistribution_opportunity';
  targetOrg: string;
  bloodGroup: BloodGroup;
  details: string;
  timeframe: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface UserSession {
  email: string;
  role: UserRole;
  userName?: string;
  staffTitle?: string;
  orgName: string;
  orgId: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  token?: string;
}

export * from './bloodRequest';
export * from './nearExpiry';
export * from './inventoryImport';
export * from './donor';
export * from './campaign';
export * from './alert';
