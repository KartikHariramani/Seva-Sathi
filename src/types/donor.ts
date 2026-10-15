import type { BloodGroup } from './index';

export type DonorNotificationStatus =
  | 'SENT'
  | 'DELIVERED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'UNANSWERED';

export type CommunicationChannel = 'IN_APP' | 'TELEGRAM' | 'SMS';

export interface DonorProfile {
  id: string; // DNR-2026-001
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  city: string;
  location: { lat: number; lng: number };
  isAvailable: boolean;
  lastDonationDate?: string;
  consentEmergencyAlerts: boolean;
  consentFutureDrives: boolean;
  preferredChannel: CommunicationChannel;
  telegramChatId?: string;
  totalDonations: number;
  rewardPoints: number;
}

export interface EmergencyDonorNotification {
  id: string; // EDN-20261015-01
  requestId: string;
  donorId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  hospitalCity: string;
  distanceKm: number;
  urgency: 'critical' | 'high' | 'routine';
  requiredUnits: number;
  messageText: string;
  status: DonorNotificationStatus;
  channel: CommunicationChannel;
  sentAt: string;
  respondedAt?: string;
}
