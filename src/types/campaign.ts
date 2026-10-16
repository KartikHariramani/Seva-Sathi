import type { BloodGroup } from './index';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'ATTENDED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AnnouncementChannel = 'IN_APP' | 'TELEGRAM' | 'SMS' | 'BROWSER_VOICE';

export interface BloodCampaign {
  id: string; // CMP-202610-001
  title: string;
  organizerId: string;
  organizerName: string;
  coHostBloodBankId?: string;
  coHostBloodBankName?: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: { lat: number; lng: number };
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  capacityTarget: number;
  registeredCount: number;
  confirmedCount: number;
  attendedCount: number;
  waitlistCount: number;
  status: CampaignStatus;
  eligibilityCriteria: string;
  contactPhone: string;
  contactEmail: string;
  qrCodeSecret: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRegistration {
  id: string; // REG-CMP-1001
  campaignId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  bloodGroup: BloodGroup;
  timeSlot: string;
  status: RegistrationStatus;
  qrTicketToken: string;
  registeredAt: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  turnoutProbability?: number; // 0.0 to 1.0 from ML model
  slotId?: string;
  waitlistPosition?: number;
  promotedFromWaitlistAt?: string;
  notes?: string;
}

export interface CampaignSlot {
  id: string; // SLOT-CMP-101
  campaignId: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  capacity: number;
  registeredCount: number;
  confirmedCount: number;
  waitlistedCount: number;
}

export type WaitlistPolicy = 'FIFO' | 'PREDICTIVE';

export interface TurnoutPredictionResult {
  score: number; // 0.0 to 1.0
  confidenceTier: 'HIGH' | 'MODERATE' | 'LOW';
  modelType: 'ML_LOGISTIC' | 'CALIBRATED_HEURISTIC';
  factors: {
    leadTimeDays: number;
    priorAttendanceRate: number;
    daysSinceLastDonation: number;
    isConfirmed: boolean;
    distanceKm: number;
  };
  calculatedAt: string;
}

export interface AuditEvent {
  id: string;
  eventType:
    | 'CAMPAIGN_CREATED'
    | 'CAMPAIGN_MODIFIED'
    | 'SLOT_CAPACITY_CHANGED'
    | 'DONOR_REGISTERED'
    | 'ATTENDANCE_CONFIRMED'
    | 'SLOT_CANCELLED'
    | 'WAITLIST_PROMOTED'
    | 'QR_CHECK_IN'
    | 'REMINDER_SENT';
  actorId: string;
  actorRole: string;
  affectedEntity: string;
  entityId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface CampaignAnnouncement {
  id: string;
  campaignId: string;
  channel: AnnouncementChannel;
  title: string;
  messageBody: string;
  targetAudience: string;
  targetCity: string;
  recipientsCount: number;
  deliveredCount: number;
  idempotencyKey: string;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'PREVIEW_TEST';
  sentBy: string;
  sentAt: string;
}

