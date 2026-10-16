import type { BloodGroup } from './index';

export type OrganizationType = 'hospital' | 'blood_bank' | 'ngo';
export type OrganizationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface OrganizationContact {
  primaryPhone: string;
  emergencyPhone?: string;
  email: string;
  website?: string;
}

export interface OrganizationLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
    // Map visualization coordinates (0-100 normalized)
    x: number;
    y: number;
  };
}

export interface OrganizationStats {
  totalInventoryUnits: number;
  criticalStockGroups: BloodGroup[];
  activeRequestsCount: number;
  completedTransfersCount: number;
  lastActiveAt: string;
}

export interface Organization {
  id: string; // e.g. 'ORG-HOSP-01'
  name: string;
  code: string;
  type: OrganizationType;
  status: OrganizationStatus;
  licenseNumber: string;
  joinCode?: string; // Unique hospital authorization code for clinical staff joining
  location: OrganizationLocation;
  contact: OrganizationContact;
  registeredAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  stats: OrganizationStats;
  notes?: string;
}
