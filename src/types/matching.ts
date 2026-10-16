import type { BloodGroup } from './index';
import type { RiskLevel } from '../intelligence/types/prediction';

export interface BloodBankInventory {
  bloodGroup: BloodGroup;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  predictedDemand24h: number;
  shortageRisk: RiskLevel;
}

export interface BloodBank {
  id: string;
  name: string;
  city: string;
  address: string;
  distanceKm: number;
  contactPhone: string;
  rating: number;
  responseTimeMinutes: number;
  networkDemand: 'Low' | 'Moderate' | 'High';
  inventories: Record<BloodGroup, BloodBankInventory>;
  coordinates?: { lat: number; lng: number };
}

export interface BloodBankMatch {
  bank: BloodBank;
  matchScore: number; // 0-100
  availableStock: number;
  safeAllocation: number;
  reasons: string[];
  riskAssessment: string;
  isRecommended: boolean;
  scoreBreakdown: {
    availabilityScore: number;
    sustainabilityScore: number;
    distanceScore: number;
    speedScore: number;
  };
}

export interface ExcludedFacility {
  bankId: string;
  bankName: string;
  distanceKm: number;
  reasonCode: 'OUTSIDE_RADIUS' | 'INCOMPATIBLE_GROUP' | 'INSUFFICIENT_STOCK' | 'UNVERIFIED' | 'STALE_DATA' | 'CRITICAL_SHORTAGE';
  detail: string;
}

export interface MatchingResult {
  requestId: string;
  bloodGroup: BloodGroup;
  requestedQuantity: number;
  primaryMatch: BloodBankMatch | null;
  alternatives: BloodBankMatch[];
  evaluatedAt: string;
  searchRadiusKm?: number;
  searchStage?: 'LOCAL_20KM' | 'DISTRICT_40KM' | 'REGIONAL_60KM' | 'MAX_REACHED';
  totalEligibleSupply?: number;
  shortageSummary?: string | null;
  excludedFacilities?: ExcludedFacility[];
}
