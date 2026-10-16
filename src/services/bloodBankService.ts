import type { BloodGroup } from '../types';
import type { BloodBank, BloodBankMatch, MatchingResult } from '../types/matching';
import type { BloodRequest } from '../types/bloodRequest';

const STORAGE_KEY = 'raktsetu_blood_banks_v2';

import { bloodCompatibilityService } from './bloodCompatibilityService';

export const INITIAL_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bank-nagpur-regional',
    name: 'Nagpur Regional Blood Centre',
    city: 'Nagpur',
    address: 'Near Government Medical College, Hanuman Nagar, Nagpur',
    distanceKm: 18.2,
    coordinates: { lat: 21.127, lng: 79.098 },
    contactPhone: '+91 712 274 4401',
    rating: 4.9,
    responseTimeMinutes: 25,
    networkDemand: 'Moderate',
    inventories: {
      'O+': { bloodGroup: 'O+', physicalStock: 24.0, reservedStock: 4.0, availableStock: 20.0, predictedDemand24h: 8.5, shortageRisk: 'low' },
      'O-': { bloodGroup: 'O-', physicalStock: 8.0, reservedStock: 1.0, availableStock: 7.0, predictedDemand24h: 3.0, shortageRisk: 'monitor' },
      'A+': { bloodGroup: 'A+', physicalStock: 18.0, reservedStock: 2.0, availableStock: 16.0, predictedDemand24h: 6.0, shortageRisk: 'low' },
      'A-': { bloodGroup: 'A-', physicalStock: 6.0, reservedStock: 0.5, availableStock: 5.5, predictedDemand24h: 2.0, shortageRisk: 'low' },
      'B+': { bloodGroup: 'B+', physicalStock: 22.0, reservedStock: 3.0, availableStock: 19.0, predictedDemand24h: 7.0, shortageRisk: 'low' },
      'B-': { bloodGroup: 'B-', physicalStock: 7.0, reservedStock: 1.0, availableStock: 6.0, predictedDemand24h: 2.5, shortageRisk: 'monitor' },
      'AB+': { bloodGroup: 'AB+', physicalStock: 12.0, reservedStock: 1.0, availableStock: 11.0, predictedDemand24h: 4.0, shortageRisk: 'low' },
      'AB-': { bloodGroup: 'AB-', physicalStock: 5.0, reservedStock: 0.5, availableStock: 4.5, predictedDemand24h: 1.5, shortageRisk: 'low' },
    },
  },
  {
    id: 'bank-central-city',
    name: 'Central City Blood Bank',
    city: 'Nagpur Central',
    address: 'Sitabuldi Interchange, Wardha Road, Nagpur',
    distanceKm: 12.4,
    coordinates: { lat: 21.1458, lng: 79.0882 },
    contactPhone: '+91 712 253 9820',
    rating: 4.7,
    responseTimeMinutes: 18,
    networkDemand: 'High',
    inventories: {
      'O+': { bloodGroup: 'O+', physicalStock: 16.0, reservedStock: 2.0, availableStock: 14.0, predictedDemand24h: 13.0, shortageRisk: 'high' },
      'O-': { bloodGroup: 'O-', physicalStock: 4.0, reservedStock: 1.0, availableStock: 3.0, predictedDemand24h: 2.8, shortageRisk: 'high' },
      'A+': { bloodGroup: 'A+', physicalStock: 14.0, reservedStock: 2.0, availableStock: 12.0, predictedDemand24h: 7.0, shortageRisk: 'monitor' },
      'A-': { bloodGroup: 'A-', physicalStock: 4.0, reservedStock: 0.5, availableStock: 3.5, predictedDemand24h: 1.5, shortageRisk: 'low' },
      'B+': { bloodGroup: 'B+', physicalStock: 15.0, reservedStock: 3.0, availableStock: 12.0, predictedDemand24h: 8.0, shortageRisk: 'monitor' },
      'B-': { bloodGroup: 'B-', physicalStock: 3.5, reservedStock: 1.0, availableStock: 2.5, predictedDemand24h: 2.0, shortageRisk: 'high' },
      'AB+': { bloodGroup: 'AB+', physicalStock: 9.0, reservedStock: 1.0, availableStock: 8.0, predictedDemand24h: 3.5, shortageRisk: 'low' },
      'AB-': { bloodGroup: 'AB-', physicalStock: 3.0, reservedStock: 0.5, availableStock: 2.5, predictedDemand24h: 1.2, shortageRisk: 'monitor' },
    },
  },
  {
    id: 'bank-vidarbha-life',
    name: 'Vidarbha Life Blood Bank',
    city: 'MIDC Hingna',
    address: 'Plot 44, Electronic Zone, Hingna Road, Nagpur',
    distanceKm: 27.5,
    coordinates: { lat: 21.112, lng: 78.985 },
    contactPhone: '+91 712 288 1205',
    rating: 4.8,
    responseTimeMinutes: 38,
    networkDemand: 'Low',
    inventories: {
      'O+': { bloodGroup: 'O+', physicalStock: 12.0, reservedStock: 1.0, availableStock: 11.0, predictedDemand24h: 3.0, shortageRisk: 'low' },
      'O-': { bloodGroup: 'O-', physicalStock: 5.0, reservedStock: 0.5, availableStock: 4.5, predictedDemand24h: 1.2, shortageRisk: 'low' },
      'A+': { bloodGroup: 'A+', physicalStock: 10.0, reservedStock: 1.0, availableStock: 9.0, predictedDemand24h: 2.5, shortageRisk: 'low' },
      'A-': { bloodGroup: 'A-', physicalStock: 3.0, reservedStock: 0.0, availableStock: 3.0, predictedDemand24h: 0.8, shortageRisk: 'low' },
      'B+': { bloodGroup: 'B+', physicalStock: 14.0, reservedStock: 2.0, availableStock: 12.0, predictedDemand24h: 3.2, shortageRisk: 'low' },
      'B-': { bloodGroup: 'B-', physicalStock: 4.0, reservedStock: 0.5, availableStock: 3.5, predictedDemand24h: 1.0, shortageRisk: 'low' },
      'AB+': { bloodGroup: 'AB+', physicalStock: 7.0, reservedStock: 0.5, availableStock: 6.5, predictedDemand24h: 1.8, shortageRisk: 'low' },
      'AB-': { bloodGroup: 'AB-', physicalStock: 2.5, reservedStock: 0.0, availableStock: 2.5, predictedDemand24h: 0.5, shortageRisk: 'low' },
    },
  },
  {
    id: 'bank-wardha-district',
    name: 'Wardha District Red Cross Centre',
    city: 'Wardha',
    address: 'Civil Hospital Campus, Sevagram Road, Wardha',
    distanceKm: 54.0,
    coordinates: { lat: 20.745, lng: 78.602 },
    contactPhone: '+91 7152 240 102',
    rating: 4.6,
    responseTimeMinutes: 65,
    networkDemand: 'Low',
    inventories: {
      'O+': { bloodGroup: 'O+', physicalStock: 15.0, reservedStock: 1.0, availableStock: 14.0, predictedDemand24h: 2.0, shortageRisk: 'low' },
      'O-': { bloodGroup: 'O-', physicalStock: 6.0, reservedStock: 0.0, availableStock: 6.0, predictedDemand24h: 1.0, shortageRisk: 'low' },
      'A+': { bloodGroup: 'A+', physicalStock: 11.0, reservedStock: 1.0, availableStock: 10.0, predictedDemand24h: 2.0, shortageRisk: 'low' },
      'A-': { bloodGroup: 'A-', physicalStock: 4.0, reservedStock: 0.0, availableStock: 4.0, predictedDemand24h: 0.5, shortageRisk: 'low' },
      'B+': { bloodGroup: 'B+', physicalStock: 13.0, reservedStock: 1.0, availableStock: 12.0, predictedDemand24h: 2.2, shortageRisk: 'low' },
      'B-': { bloodGroup: 'B-', physicalStock: 3.0, reservedStock: 0.0, availableStock: 3.0, predictedDemand24h: 0.6, shortageRisk: 'low' },
      'AB+': { bloodGroup: 'AB+', physicalStock: 6.0, reservedStock: 0.5, availableStock: 5.5, predictedDemand24h: 1.0, shortageRisk: 'low' },
      'AB-': { bloodGroup: 'AB-', physicalStock: 2.0, reservedStock: 0.0, availableStock: 2.0, predictedDemand24h: 0.4, shortageRisk: 'low' },
    },
  },
];

export class BloodBankService {
  private getStoredBanks(): BloodBank[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      // safe fallback
    }
    this.saveBanks(INITIAL_BLOOD_BANKS);
    return INITIAL_BLOOD_BANKS;
  }

  saveBanks(banks: BloodBank[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));
      }
    } catch (e) {
      // safe fallback
    }
  }

  async getAllBanks(): Promise<BloodBank[]> {
    return this.getStoredBanks();
  }

  async getBank(id: string): Promise<BloodBank | null> {
    const banks = this.getStoredBanks();
    return banks.find((b) => b.id === id) || null;
  }

  /**
   * Progressive-Radius Blood Search & Matching Engine
   * Evaluates 20km -> 40km -> 60km search corridors.
   * Enforces strict ABO/Rh clinical compatibility and safe reserve load balancing.
   */
  async matchBloodBanks(
    request: BloodRequest,
    configuredMaxRadius: number = 60
  ): Promise<MatchingResult> {
    const banks = this.getStoredBanks();
    const recipientGroup = request.bloodGroup;
    const requestedQty = request.quantityLitres;

    // Compatible blood groups for red blood cells (or specific component)
    const compatibleGroups = bloodCompatibilityService.getCompatibleDonorGroups(recipientGroup);

    // Progressive radius thresholds
    const radiusSteps = [20, 40, Math.min(60, configuredMaxRadius)];
    let activeRadius = radiusSteps[0];
    let candidateBanks: BloodBank[] = [];
    let eligibleSupplyInRadius = 0;

    // Search progression sequence
    for (const radius of radiusSteps) {
      activeRadius = radius;
      candidateBanks = banks.filter((b) => b.distanceKm <= radius);

      // Calculate total eligible supply within this radius
      eligibleSupplyInRadius = candidateBanks.reduce((sum, bank) => {
        // Sum available stock across all compatible groups
        const bankCompatibleStock = compatibleGroups.reduce((acc, grp) => {
          return acc + (bank.inventories[grp]?.availableStock || 0);
        }, 0);
        return sum + bankCompatibleStock;
      }, 0);

      // Stop expanding once sufficient eligible supply is found
      if (eligibleSupplyInRadius >= requestedQty) {
        break;
      }
    }

    const stageLabel: 'LOCAL_20KM' | 'DISTRICT_40KM' | 'REGIONAL_60KM' | 'MAX_REACHED' = 
      activeRadius <= 20 ? 'LOCAL_20KM' : activeRadius <= 40 ? 'DISTRICT_40KM' : 'REGIONAL_60KM';

    const matches: BloodBankMatch[] = [];
    const excludedFacilities: Array<{
      bankId: string;
      bankName: string;
      distanceKm: number;
      reasonCode: 'OUTSIDE_RADIUS' | 'INCOMPATIBLE_GROUP' | 'INSUFFICIENT_STOCK' | 'UNVERIFIED' | 'STALE_DATA' | 'CRITICAL_SHORTAGE';
      detail: string;
    }> = [];

    for (const bank of banks) {
      // 1. Outside active search radius check
      if (bank.distanceKm > activeRadius) {
        excludedFacilities.push({
          bankId: bank.id,
          bankName: bank.name,
          distanceKm: bank.distanceKm,
          reasonCode: 'OUTSIDE_RADIUS',
          detail: `Located ${bank.distanceKm.toFixed(1)} km away; outside active ${activeRadius} km progressive radius.`,
        });
        continue;
      }

      // 2. Check identical & compatible stock
      const identicalInv = bank.inventories[recipientGroup];
      const identicalAvail = identicalInv?.availableStock || 0;

      // Also compute alternative compatible stock
      let bestCompatibleGroup: BloodGroup = recipientGroup;
      let effectiveAvail = identicalAvail;

      if (effectiveAvail < requestedQty) {
        // Look for compatible alternatives (e.g. O- units)
        for (const grp of compatibleGroups) {
          const altStock = bank.inventories[grp]?.availableStock || 0;
          if (altStock > effectiveAvail) {
            effectiveAvail = altStock;
            bestCompatibleGroup = grp;
          }
        }
      }

      // Check if zero stock
      if (effectiveAvail <= 0) {
        excludedFacilities.push({
          bankId: bank.id,
          bankName: bank.name,
          distanceKm: bank.distanceKm,
          reasonCode: 'INSUFFICIENT_STOCK',
          detail: `Zero usable ${recipientGroup} or compatible units available.`,
        });
        continue;
      }

      const inv = bank.inventories[bestCompatibleGroup] || identicalInv;
      const reasons: string[] = [];

      // Clinical compatibility reason
      if (bestCompatibleGroup === recipientGroup) {
        reasons.push(`${effectiveAvail.toFixed(1)} L of identical ${recipientGroup} available`);
      } else {
        reasons.push(`${effectiveAvail.toFixed(1)} L of clinically compatible ${bestCompatibleGroup} available`);
      }

      // 1. Availability Score (0-35 points)
      let availabilityScore = 0;
      if (effectiveAvail >= requestedQty) {
        availabilityScore = 35;
        reasons.push('Full volume fulfillable from single facility');
      } else {
        availabilityScore = Math.round((effectiveAvail / requestedQty) * 30);
        reasons.push(`Partial fulfillment capacity (${effectiveAvail.toFixed(1)} of ${requestedQty.toFixed(1)} L)`);
      }

      // 2. Sustainability & Network Protection Score (0-35 points)
      let sustainabilityScore = 35;
      let riskAssessment = 'Stable reserve buffer';
      const remainingAfterAllocation = effectiveAvail - requestedQty;

      if (inv.shortageRisk === 'high' || inv.shortageRisk === 'critical') {
        sustainabilityScore = 10;
        riskAssessment = 'Bank has elevated local trauma pressure; allocation throttled';
        reasons.push('Elevated local surgical demand at this blood center');
      } else if (remainingAfterAllocation < inv.predictedDemand24h * 0.5) {
        sustainabilityScore = 20;
        riskAssessment = 'Full allocation would lower bank below 12h safety threshold';
        reasons.push('Allocation would impact bank local safety buffer');
      } else {
        reasons.push('Sustainable surplus after full reservation');
      }

      // 3. Distance Score (0-20 points)
      const distanceScore = Math.max(0, Math.round(20 - (bank.distanceKm / activeRadius) * 15));
      reasons.push(`${bank.distanceKm.toFixed(1)} km transit corridor (${bank.responseTimeMinutes} min transit)`);

      // 4. Speed & Rating Score (0-10 points)
      const speedScore = Math.round((bank.rating / 5) * 10);
      const totalScore = Math.min(100, availabilityScore + sustainabilityScore + distanceScore + speedScore);

      // Safe allocation logic
      let safeAllocation = requestedQty;
      if (inv.shortageRisk === 'high') {
        safeAllocation = Math.min(requestedQty, Math.max(2.0, Math.floor(effectiveAvail * 0.4)));
      } else if (effectiveAvail < requestedQty) {
        safeAllocation = effectiveAvail;
      }

      matches.push({
        bank,
        matchScore: totalScore,
        availableStock: effectiveAvail,
        safeAllocation,
        reasons,
        riskAssessment,
        isRecommended: false,
        scoreBreakdown: {
          availabilityScore,
          sustainabilityScore,
          distanceScore,
          speedScore,
        },
      });
    }

    // Sort by matchScore descending
    matches.sort((a, b) => b.matchScore - a.matchScore);
    if (matches.length > 0) {
      matches[0].isRecommended = true;
    }

    // Shortage calculation
    const totalAllocatable = matches.reduce((sum, m) => sum + m.safeAllocation, 0);
    let shortageSummary: string | null = null;
    if (totalAllocatable < requestedQty) {
      const shortage = Math.round((requestedQty - totalAllocatable) * 10) / 10;
      shortageSummary = `Network deficit: Shortfall of ${shortage} L remains across ${activeRadius}km radius. Donor cascade activation recommended.`;
    }

    return {
      requestId: request.id,
      bloodGroup: recipientGroup,
      requestedQuantity: requestedQty,
      primaryMatch: matches[0] || null,
      alternatives: matches.slice(1),
      evaluatedAt: new Date().toISOString(),
      searchRadiusKm: activeRadius,
      searchStage: stageLabel,
      totalEligibleSupply: eligibleSupplyInRadius,
      shortageSummary,
      excludedFacilities,
    };
  }

  /**
   * Step 20: Atomically Reserve Blood at Blood Bank
   */
  async reserveStockAtBank(
    bankId: string,
    bloodGroup: BloodGroup,
    quantityLitres: number
  ): Promise<void> {
    const banks = this.getStoredBanks();
    const bank = banks.find((b) => b.id === bankId);

    if (!bank) {
      throw new Error(`Blood bank ${bankId} not found.`);
    }

    const inv = bank.inventories[bloodGroup];
    if (!inv) {
      throw new Error(`Blood group ${bloodGroup} not supported by ${bank.name}`);
    }

    if (inv.availableStock < quantityLitres) {
      throw new Error(
        `Atomic lock failed: Only ${inv.availableStock} units available at ${bank.name}. Requested ${quantityLitres} units.`
      );
    }

    // Atomic update
    inv.reservedStock = Math.round((inv.reservedStock + quantityLitres) * 10) / 10;
    inv.availableStock = Math.max(0, Math.round((inv.physicalStock - inv.reservedStock) * 10) / 10);

    this.saveBanks(banks);
  }

  /**
   * Step 20: Release / Fulfill Reservation at Blood Bank
   */
  async fulfillOrReleaseBankStock(
    bankId: string,
    bloodGroup: BloodGroup,
    quantityLitres: number,
    action: 'fulfill' | 'release'
  ): Promise<void> {
    const banks = this.getStoredBanks();
    const bank = banks.find((b) => b.id === bankId);
    if (!bank) return;

    const inv = bank.inventories[bloodGroup];
    if (!inv) return;

    if (action === 'fulfill') {
      // Blood physically leaves the bank
      inv.physicalStock = Math.max(0, Math.round((inv.physicalStock - quantityLitres) * 10) / 10);
      inv.reservedStock = Math.max(0, Math.round((inv.reservedStock - quantityLitres) * 10) / 10);
      inv.availableStock = Math.max(0, Math.round((inv.physicalStock - inv.reservedStock) * 10) / 10);
    } else {
      // Reservation cancelled or expired -> release back to available
      inv.reservedStock = Math.max(0, Math.round((inv.reservedStock - quantityLitres) * 10) / 10);
      inv.availableStock = Math.max(0, Math.round((inv.physicalStock - inv.reservedStock) * 10) / 10);
    }

    this.saveBanks(banks);
  }
}

export const bloodBankService = new BloodBankService();
