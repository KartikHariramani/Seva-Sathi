import type { BloodGroup } from '../types';
import type { CreateBloodRequestInput, RequestValidationResult } from '../types/bloodRequest';
import {
  validateUrgencyDeadline,
  calculateUrgencyDeadline,
  getDefaultClinicalReason,
} from './urgencyPolicy';

export * from './urgencyPolicy';

const VALID_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function validateBloodRequest(
  data: Partial<CreateBloodRequestInput>
): RequestValidationResult {
  const errors: RequestValidationResult['errors'] = {};

  // 1. Blood group validation
  if (!data.bloodGroup) {
    errors.bloodGroup = 'Please select a required blood group.';
  } else if (!VALID_BLOOD_GROUPS.includes(data.bloodGroup as BloodGroup)) {
    errors.bloodGroup = 'Invalid blood group specified.';
  }

  // 2. Quantity validation
  if (data.quantityLitres === undefined || data.quantityLitres === null || isNaN(Number(data.quantityLitres))) {
    errors.quantityLitres = 'Quantity is required.';
  } else {
    const qty = Number(data.quantityLitres);
    if (qty <= 0) {
      errors.quantityLitres = 'Quantity must be greater than 0.';
    } else if (qty > 20.0) {
      errors.quantityLitres = 'Single request quantity cannot exceed 20.0 L.';
    } else if (!Number.isFinite(qty)) {
      errors.quantityLitres = 'Please enter a valid numeric quantity.';
    }
  }

  // 3. Priority validation
  if (!data.priority) {
    errors.priority = 'Please choose the urgency level for this request.';
  } else if (!['routine', 'urgent', 'emergency'].includes(data.priority)) {
    errors.priority = 'Invalid priority selection.';
  }

  // 4. Required by validation (with urgency deadline policy checking)
  const effectiveDeadline = data.requiredBy && data.requiredBy.trim()
    ? data.requiredBy
    : calculateUrgencyDeadline(data.priority || 'emergency');

  const urgencyValidation = validateUrgencyDeadline(data.priority || 'emergency', effectiveDeadline);
  if (!urgencyValidation.isValid) {
    errors.requiredBy = urgencyValidation.error || 'Invalid requirement deadline.';
  }

  // 5. Reason validation (Conditional)
  // When Section 03 is omitted from UI, apply standard protocol reason for the urgency tier
  const isUrgentOrEmergency = data.priority === 'urgent' || data.priority === 'emergency';
  const reasonText = (data.reason !== undefined && data.reason !== null && data.reason.trim())
    ? data.reason.trim()
    : getDefaultClinicalReason(data.priority || 'emergency');

  if (isUrgentOrEmergency && !reasonText) {
    errors.reason = 'Clinical reason is required for urgent and emergency requests.';
  } else if (isUrgentOrEmergency && reasonText.length < 5) {
    errors.reason = 'Please provide a clinical explanation (at least 5 characters).';
  } else if (reasonText.length > 500) {
    errors.reason = `Reason exceeds maximum limit of 500 characters (${reasonText.length}/500).`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSingleField<K extends keyof CreateBloodRequestInput>(
  field: K,
  value: CreateBloodRequestInput[K],
  allData: Partial<CreateBloodRequestInput>
): string | undefined {
  const testData = { ...allData, [field]: value };
  const result = validateBloodRequest(testData);
  return result.errors[field as keyof typeof result.errors];
}
