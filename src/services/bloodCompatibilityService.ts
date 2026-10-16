import type { BloodGroup } from '../types';

/**
 * Deterministic Clinical Transfusion Compatibility Engine
 * Complies with WHO, Red Cross, and Indian National Blood Transfusion Council (NBTC) guidelines.
 * 
 * Safety-Critical Rule: This engine is strictly deterministic and auditable.
 * Under NO circumstances should an LLM or heuristic alter these biological rules.
 */

export type BloodComponentType = 
  | 'Whole Blood' 
  | 'Packed Red Blood Cells (PRBC)' 
  | 'Platelet Concentrate' 
  | 'Fresh Frozen Plasma (FFP)' 
  | 'Cryoprecipitate';

// Red Blood Cell / PRBC / Whole Blood Compatibility Matrix
// Key = Recipient Blood Group, Value = Array of Compatible Donor Blood Groups
const RBC_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'], // Universal Recipient
};

// Plasma (FFP) Compatibility Matrix (Anti-A / Anti-B antibodies reversed)
const FFP_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // O can receive any plasma
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

export class BloodCompatibilityService {
  /**
   * Returns list of all compatible donor blood groups for a given recipient and component.
   */
  public getCompatibleDonorGroups(
    recipientGroup: BloodGroup,
    component: BloodComponentType = 'Packed Red Blood Cells (PRBC)'
  ): BloodGroup[] {
    if (component === 'Fresh Frozen Plasma (FFP)') {
      return FFP_COMPATIBILITY[recipientGroup] || [recipientGroup];
    }
    // Default to RBC / Whole Blood compatibility
    return RBC_COMPATIBILITY[recipientGroup] || [recipientGroup];
  }

  /**
   * Deterministically checks whether a specific donor group can safely be transfused to recipient.
   */
  public isCompatible(
    recipientGroup: BloodGroup,
    donorGroup: BloodGroup,
    component: BloodComponentType = 'Packed Red Blood Cells (PRBC)'
  ): boolean {
    const allowed = this.getCompatibleDonorGroups(recipientGroup, component);
    return allowed.includes(donorGroup);
  }

  /**
   * Returns human-readable clinical explanation of the compatibility result.
   */
  public explainCompatibility(
    recipientGroup: BloodGroup,
    donorGroup: BloodGroup,
    component: BloodComponentType = 'Packed Red Blood Cells (PRBC)'
  ): { isCompatible: boolean; explanation: string; riskNote?: string } {
    const compatible = this.isCompatible(recipientGroup, donorGroup, component);

    if (recipientGroup === donorGroup) {
      return {
        isCompatible: true,
        explanation: `Exact identical ABO/Rh match (${donorGroup}). Optimal clinical selection.`,
      };
    }

    if (compatible) {
      if (donorGroup === 'O-') {
        return {
          isCompatible: true,
          explanation: `O- (Universal Red Cell Donor) is safe for ${recipientGroup} recipient in emergency deficit.`,
        };
      }
      return {
        isCompatible: true,
        explanation: `Clinically compatible alternative donor group ${donorGroup} for ${recipientGroup} recipient.`,
      };
    }

    return {
      isCompatible: false,
      explanation: `Incompatible: Transfusing ${donorGroup} into a ${recipientGroup} patient carries acute hemolytic transfusion reaction risk.`,
      riskNote: 'Strictly prohibited under patient safety protocol.',
    };
  }
}

export const bloodCompatibilityService = new BloodCompatibilityService();
