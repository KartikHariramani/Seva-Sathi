import type { BloodGroup } from '../types';
import type {
  DonorProfile,
  EmergencyDonorNotification,
  DonorNotificationStatus,
  CommunicationChannel,
} from '../types/donor';
import { calculateHaversineDistance } from '../lib/supabase';
import { localEventBus } from '../sync/localEventBus';
import { telegramService } from './telegramService';

const DEFAULT_DONORS: DonorProfile[] = [
  {
    id: 'DNR-2026-001',
    fullName: 'Amitabh Sen',
    email: 'amitabh.sen@example.com',
    phone: '+91 98220 11442',
    bloodGroup: 'O+',
    city: 'Nagpur',
    location: { lat: 21.1402, lng: 79.083 },
    isAvailable: true,
    lastDonationDate: '2026-07-14',
    consentEmergencyAlerts: true,
    consentFutureDrives: true,
    preferredChannel: 'IN_APP',
    telegramChatId: '100001',
    totalDonations: 6,
    rewardPoints: 480,
  },
  {
    id: 'DNR-2026-002',
    fullName: 'Pooja Kulkarni',
    email: 'pooja.kulkarni@example.com',
    phone: '+91 97640 55219',
    bloodGroup: 'O-',
    city: 'Nagpur',
    location: { lat: 21.151, lng: 79.092 },
    isAvailable: true,
    lastDonationDate: '2026-06-20',
    consentEmergencyAlerts: true,
    consentFutureDrives: true,
    preferredChannel: 'TELEGRAM',
    telegramChatId: '100002',
    totalDonations: 9,
    rewardPoints: 720,
  },
  {
    id: 'DNR-2026-003',
    fullName: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@example.com',
    phone: '+91 94221 88310',
    bloodGroup: 'A+',
    city: 'Nagpur',
    location: { lat: 21.129, lng: 79.071 },
    isAvailable: true,
    lastDonationDate: '2026-08-05',
    consentEmergencyAlerts: true,
    consentFutureDrives: false,
    preferredChannel: 'IN_APP',
    totalDonations: 4,
    rewardPoints: 320,
  },
  {
    id: 'DNR-2026-004',
    fullName: 'Dr. Sneha Patil',
    email: 'sneha.patil@example.com',
    phone: '+91 98900 44122',
    bloodGroup: 'B+',
    city: 'Nagpur',
    location: { lat: 21.162, lng: 79.105 },
    isAvailable: false, // Currently on deferral/travel
    lastDonationDate: '2026-09-01',
    consentEmergencyAlerts: true,
    consentFutureDrives: true,
    preferredChannel: 'SMS',
    totalDonations: 11,
    rewardPoints: 890,
  },
  {
    id: 'DNR-2026-005',
    fullName: 'Vikram Choudhary',
    email: 'vikram.c@example.com',
    phone: '+91 98233 77190',
    bloodGroup: 'AB-',
    city: 'Nagpur',
    location: { lat: 21.144, lng: 79.081 },
    isAvailable: true,
    lastDonationDate: '2026-05-18',
    consentEmergencyAlerts: false, // Strict opt-out
    consentFutureDrives: false,
    preferredChannel: 'IN_APP',
    totalDonations: 3,
    rewardPoints: 240,
  },
];

class DonorService {
  private donors: DonorProfile[] = [];
  private notifications: EmergencyDonorNotification[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedDonors = localStorage.getItem('sevasathi_donors');
      this.donors = storedDonors ? JSON.parse(storedDonors) : [...DEFAULT_DONORS];

      const storedNotifs = localStorage.getItem('sevasathi_donor_notifs');
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [];
    } catch {
      this.donors = [...DEFAULT_DONORS];
      this.notifications = [];
    }
  }

  private saveState() {
    try {
      localStorage.setItem('sevasathi_donors', JSON.stringify(this.donors));
      localStorage.setItem('sevasathi_donor_notifs', JSON.stringify(this.notifications));
    } catch {
      // fallback
    }
  }

  public getDonors(): DonorProfile[] {
    return this.donors;
  }

  public getDonorById(id: string): DonorProfile | undefined {
    return this.donors.find((d) => d.id === id);
  }

  public updateDonorConsent(
    id: string,
    updates: {
      isAvailable?: boolean;
      consentEmergencyAlerts?: boolean;
      consentFutureDrives?: boolean;
      preferredChannel?: CommunicationChannel;
      telegramChatId?: string;
    }
  ): DonorProfile {
    const idx = this.donors.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Donor profile not found');

    this.donors[idx] = {
      ...this.donors[idx],
      ...updates,
    };
    this.saveState();
    localEventBus.emit('donor.updated', this.donors[idx]);
    return this.donors[idx];
  }

  /**
   * Mobilize Suitable Nearby Donors when an Emergency Shortage Remains
   * STRICTLY respects user consent and availability!
   */
  public mobilizeForShortage(params: {
    requestId: string;
    bloodGroup: BloodGroup;
    shortageUnits: number;
    hospitalName: string;
    hospitalCity: string;
    hospitalLat: number;
    hospitalLng: number;
    urgency: 'critical' | 'high' | 'routine';
  }): EmergencyDonorNotification[] {
    const {
      requestId,
      bloodGroup,
      shortageUnits,
      hospitalName,
      hospitalCity,
      hospitalLat,
      hospitalLng,
      urgency,
    } = params;

    // Filter compatible, available donors with active consent
    const eligibleDonors = this.donors.filter((d) => {
      // Compatibility check: exact group or O- universal donor
      const isCompatible = d.bloodGroup === bloodGroup || d.bloodGroup === 'O-';
      return isCompatible && d.isAvailable && d.consentEmergencyAlerts;
    });

    const newNotifications: EmergencyDonorNotification[] = [];

    for (const donor of eligibleDonors) {
      const distance = calculateHaversineDistance(
        hospitalLat,
        hospitalLng,
        donor.location.lat,
        donor.location.lng
      );

      // Only mobilize within reasonable perimeter (35km)
      if (distance <= 35) {
        const notif: EmergencyDonorNotification = {
          id: `EDN-${new Date().toISOString().replace(/\D/g, '').substring(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          requestId,
          donorId: donor.id,
          donorName: donor.fullName,
          bloodGroup: donor.bloodGroup,
          hospitalName,
          hospitalCity,
          distanceKm: distance,
          urgency,
          requiredUnits: shortageUnits,
          messageText: `Urgent Blood Need: ${hospitalName} in ${hospitalCity} requires ${shortageUnits} units of ${bloodGroup} blood (${urgency.toUpperCase()}). You are ${distance}km away. Are you able to donate?`,
          status: 'SENT',
          channel: donor.preferredChannel,
          sentAt: new Date().toISOString(),
        };

        newNotifications.push(notif);
        this.notifications.unshift(notif);

        // Dispatch outbound alert to Telegram if donor preferred channel is TELEGRAM
        if (donor.preferredChannel === 'TELEGRAM' && donor.telegramChatId) {
          telegramService
            .sendNotification({
              chatId: donor.telegramChatId,
              text: `🚨 <b>Emergency Blood Shortage Alert</b>\n\n${notif.messageText}\n\n<i>Type /status in Telegram to view options or respond.</i>`,
              messageType: 'TRANSACTIONAL',
              idempotencyKey: `ALERT_${notif.id}`,
            })
            .catch(() => {});
        }
      }
    }

    this.saveState();

    if (newNotifications.length > 0) {
      localEventBus.emit('donors.mobilized', {
        requestId,
        count: newNotifications.length,
        notifications: newNotifications,
      });
    }

    return newNotifications;
  }

  public getNotifications(filter?: { donorId?: string; requestId?: string }): EmergencyDonorNotification[] {
    return this.notifications.filter((n) => {
      if (filter?.donorId && n.donorId !== filter.donorId) return false;
      if (filter?.requestId && n.requestId !== filter.requestId) return false;
      return true;
    });
  }

  public respondToNotification(notificationId: string, response: DonorNotificationStatus): EmergencyDonorNotification {
    const idx = this.notifications.findIndex((n) => n.id === notificationId);
    if (idx === -1) throw new Error('Notification not found');

    this.notifications[idx] = {
      ...this.notifications[idx],
      status: response,
      respondedAt: new Date().toISOString(),
    };

    this.saveState();
    localEventBus.emit('donor.responded', this.notifications[idx]);
    return this.notifications[idx];
  }
}

export const donorService = new DonorService();
