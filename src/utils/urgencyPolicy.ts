import type { RequestPriority, BloodRequest } from '../types/bloodRequest';

export interface UrgencyPolicyConfig {
  routineHours: number;
  urgentHours: number;
  emergencyHours: number;
  emergencyMaxHours: number;
  urgentMaxHours: number;
}

export const DEFAULT_URGENCY_POLICY: UrgencyPolicyConfig = {
  routineHours: 24,
  urgentHours: 2,
  emergencyHours: 1,
  emergencyMaxHours: 2,
  urgentMaxHours: 6,
};

/**
 * Formats a Date object to YYYY-MM-DDTHH:mm in the local timezone,
 * ensuring no unexpected UTC shifts in input[type="datetime-local"].
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parses an input string (either ISO-8601 or YYYY-MM-DDTHH:mm) into a local Date instant.
 */
export function parseLocalDateTime(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Calculates the required-by deadline timestamp string based on urgency policy.
 * - emergency: current time + 1 hour
 * - urgent: current time + 2 hours
 * - routine: current time + 24 hours
 */
export function calculateUrgencyDeadline(
  priority: RequestPriority,
  fromDate: Date = new Date(),
  config: UrgencyPolicyConfig = DEFAULT_URGENCY_POLICY
): string {
  let offsetMs = 0;
  switch (priority) {
    case 'emergency':
      offsetMs = config.emergencyHours * 60 * 60 * 1000;
      break;
    case 'urgent':
      offsetMs = config.urgentHours * 60 * 60 * 1000;
      break;
    case 'routine':
    default:
      offsetMs = config.routineHours * 60 * 60 * 1000;
      break;
  }

  const targetDate = new Date(fromDate.getTime() + offsetMs);
  return formatLocalDateTime(targetDate);
}

/**
 * Standard clear UI banner messages corresponding to the active urgency policy.
 */
export function getUrgencyPolicyMessage(priority: RequestPriority): string {
  switch (priority) {
    case 'emergency':
      return 'Emergency request: required within 1 hour.';
    case 'urgent':
      return 'Urgent request: required within 2 hours.';
    case 'routine':
      return 'Routine request: standard fulfillment window (24 hours).';
    default:
      return 'Select an urgency level to calculate requirement deadline.';
  }
}

/**
 * Standard clinical explanation derived from urgency protocol,
 * ensuring medical verification and regulatory requirements remain satisfied.
 */
export function getDefaultClinicalReason(priority: RequestPriority = 'emergency'): string {
  switch (priority) {
    case 'emergency':
      return 'Immediate trauma resuscitation and massive transfusion protocol standby.';
    case 'urgent':
      return 'Acute surgical transfusion requirement and inpatient stabilization.';
    case 'routine':
    default:
      return 'Elective surgical procedure and planned therapeutic transfusion reserve.';
  }
}

/**
 * Validates a user-supplied or form deadline against the chosen urgency policy.
 */
export function validateUrgencyDeadline(
  priority: RequestPriority,
  requiredByStr: string,
  referenceDate: Date = new Date(),
  config: UrgencyPolicyConfig = DEFAULT_URGENCY_POLICY
): { isValid: boolean; error?: string; isExpired?: boolean } {
  if (!requiredByStr || !requiredByStr.trim()) {
    return {
      isValid: false,
      error: 'Please specify when this blood is required by.',
    };
  }

  const parsedDate = parseLocalDateTime(requiredByStr);
  if (isNaN(parsedDate.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date and time.',
    };
  }

  // Grace buffer: 1 minute tolerance for form processing
  const nowTime = referenceDate.getTime();
  const targetTime = parsedDate.getTime();

  if (targetTime < nowTime - 60 * 1000) {
    return {
      isValid: false,
      isExpired: true,
      error: 'Required time cannot be in the past.',
    };
  }

  const diffHours = (targetTime - nowTime) / (1000 * 60 * 60);

  if (priority === 'emergency') {
    if (diffHours > config.emergencyMaxHours) {
      return {
        isValid: false,
        error: `Emergency requests must be required within ${config.emergencyMaxHours} hours maximum (policy default: ${config.emergencyHours} hour).`,
      };
    }
  } else if (priority === 'urgent') {
    if (diffHours > config.urgentMaxHours) {
      return {
        isValid: false,
        error: `Urgent requests must be required within ${config.urgentMaxHours} hours maximum (policy default: ${config.urgentHours} hours).`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Server-side validation and sanitization of deadline.
 * Never trusts client input without verifying compliance against urgency policy.
 */
export function validateAndSanitizeServerDeadline(
  priority: RequestPriority,
  requiredByStr?: string,
  referenceDate: Date = new Date(),
  config: UrgencyPolicyConfig = DEFAULT_URGENCY_POLICY
): { requiredBy: string; recalculated: boolean; reason?: string } {
  if (!requiredByStr || !requiredByStr.trim()) {
    return {
      requiredBy: calculateUrgencyDeadline(priority, referenceDate, config),
      recalculated: true,
      reason: 'Deadline was missing; automatically computed from urgency policy.',
    };
  }

  const parsed = parseLocalDateTime(requiredByStr);
  if (isNaN(parsed.getTime()) || parsed.getTime() <= referenceDate.getTime()) {
    return {
      requiredBy: calculateUrgencyDeadline(priority, referenceDate, config),
      recalculated: true,
      reason: 'Supplied deadline had already passed or was invalid; recalculated to urgency policy.',
    };
  }

  const diffHours = (parsed.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);

  if (priority === 'emergency' && diffHours > config.emergencyMaxHours) {
    return {
      requiredBy: calculateUrgencyDeadline(priority, referenceDate, config),
      recalculated: true,
      reason: `Emergency deadline exceeded max threshold of ${config.emergencyMaxHours}h; clamped to 1h policy.`,
    };
  }

  if (priority === 'urgent' && diffHours > config.urgentMaxHours) {
    return {
      requiredBy: calculateUrgencyDeadline(priority, referenceDate, config),
      recalculated: true,
      reason: `Urgent deadline exceeded max threshold of ${config.urgentMaxHours}h; clamped to 2h policy.`,
    };
  }

  return {
    requiredBy: requiredByStr,
    recalculated: false,
  };
}

/**
 * Priority rank weight: emergency = 1, urgent = 2, routine = 3.
 */
function getPriorityRank(priority: RequestPriority): number {
  switch (priority) {
    case 'emergency':
      return 1;
    case 'urgent':
      return 2;
    case 'routine':
      return 3;
    default:
      return 4;
  }
}

/**
 * Sorts blood requests according to emergency dispatch queue protocol:
 * 1. Active vs inactive
 * 2. Priority rank (Emergency first, then Urgent, then Routine)
 * 3. Earliest requiredBy timestamp ascending (most time-critical first)
 */
export function sortRequestsByDispatchQueue(requests: BloodRequest[]): BloodRequest[] {
  const activeStatuses = ['pending_approval', 'searching', 'matched', 'reserved', 'in_transit'];

  return [...requests].sort((a, b) => {
    const aActive = activeStatuses.includes(a.status) ? 0 : 1;
    const bActive = activeStatuses.includes(b.status) ? 0 : 1;
    if (aActive !== bActive) {
      return aActive - bActive;
    }

    const rankA = getPriorityRank(a.priority);
    const rankB = getPriorityRank(b.priority);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const timeA = new Date(a.requiredBy).getTime();
    const timeB = new Date(b.requiredBy).getTime();
    return timeA - timeB;
  });
}
