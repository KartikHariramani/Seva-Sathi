/**
 * Unified Telegram Notification Service
 * Shared, enterprise notification pipeline connecting Hospital Blood Requests,
 * Blood Donation Drive Registrations & Passes, Blood Shortages, and Expiry Alerts.
 */

import { localEventBus } from '../sync/localEventBus';

export interface TelegramDiagnosticsReport {
  status: string;
  botConfigured: boolean;
  botUsername: string;
  webhookUrl: string;
  mode: string;
  linkedAccounts: Array<{
    userId: string;
    userName: string;
    userRole: string;
    telegramChatIdMasked: string;
    telegramUsername?: string;
    linkedAt: string;
  }>;
  recentOutbox: Array<{
    id: string;
    idempotencyKey: string;
    recipientChatId: string;
    recipientRole?: string;
    recipientName?: string;
    eventCategory?: string;
    messageType: string;
    text: string;
    status: 'ACCEPTED_BY_TELEGRAM' | 'FAILED' | 'PENDING' | 'SIMULATED';
    attempts: number;
    lastAttemptAt?: string;
    lastError?: string;
    createdAt: string;
  }>;
  stats: {
    totalOutboxCount: number;
    acceptedCount: number;
    simulatedCount: number;
    failedCount: number;
  };
  timestamp: string;
}

export interface HospitalRequestNotificationPayload {
  requestId: string;
  displayId: string;
  hospitalName: string;
  bloodGroup: string;
  quantityLitres: number;
  priority: string;
  status?: string;
}

export interface CampaignEventNotificationPayload {
  eventType: 'REGISTRATION' | 'CHECKIN' | 'WAITLIST_PROMOTED' | 'CANCELLED';
  donorId?: string;
  donorName: string;
  campaignTitle: string;
  venueName: string;
  date: string;
  timeSlot: string;
  qrTicketToken?: string;
  recipientChatId?: string;
}

class UnifiedTelegramNotificationService {
  private isListening = false;

  constructor() {
    this.initEventListeners();
  }

  /**
   * Initializes listeners on the application-wide event bus to automatically
   * trigger notifications when domain events occur.
   */
  public initEventListeners(): void {
    if (this.isListening) return;
    this.isListening = true;

    // Listen for hospital blood request created
    localEventBus.on('hospital.request.created', (payload: any) => {
      if (payload && payload.request) {
        const req = payload.request;
        this.notifyHospitalBloodRequest({
          requestId: req.id,
          displayId: req.displayId || req.id,
          hospitalName: req.hospitalName || 'Clinical Care Center',
          bloodGroup: req.bloodGroup,
          quantityLitres: req.quantityLitres,
          priority: req.priority,
          status: req.status,
        }).catch(() => {});
      }
    });

    // Listen for campaign registrations
    localEventBus.on('campaign.registered', (payload: any) => {
      if (payload && payload.registration) {
        const reg = payload.registration;
        this.notifyCampaignEvent({
          eventType: reg.status === 'WAITLISTED' ? 'WAITLIST_PROMOTED' : 'REGISTRATION',
          donorId: reg.donorId,
          donorName: reg.donorName,
          campaignTitle: payload.slot?.campaignTitle || 'Voluntary Blood Donation Drive',
          venueName: payload.slot?.venueName || 'Community Center',
          date: payload.slot?.date || 'Scheduled Event',
          timeSlot: reg.timeSlot || '09:00 - 10:00',
          qrTicketToken: reg.qrTicketToken,
        }).catch(() => {});
      }
    });

    // Listen for campaign check-in
    localEventBus.on('campaign.checked_in', (payload: any) => {
      if (payload && payload.registration) {
        const reg = payload.registration;
        this.notifyCampaignEvent({
          eventType: 'CHECKIN',
          donorId: reg.donorId,
          donorName: reg.donorName,
          campaignTitle: payload.campaignTitle || 'Community Drive',
          venueName: payload.venueName || 'Designated Center',
          date: new Date().toLocaleDateString('en-IN'),
          timeSlot: reg.timeSlot || '09:00 - 10:00',
          qrTicketToken: reg.qrTicketToken,
        }).catch(() => {});
      }
    });
  }

  /**
   * Dispatches hospital blood request notification
   */
  async notifyHospitalBloodRequest(payload: HospitalRequestNotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/notify/hospital-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatches campaign event notification (Registration, Check-In, QR Pass, Waitlist Promotion)
   */
  async notifyCampaignEvent(payload: CampaignEventNotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/notify/campaign-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatches automated 24h / 2h campaign reminders to registered donors
   */
  async notifyCampaignReminder(payload: {
    donorId: string;
    donorName: string;
    campaignTitle: string;
    venueName: string;
    date: string;
    timeSlot: string;
    qrTicketToken: string;
    reminderType: '24H' | '2H';
    recipientChatId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.notifyCampaignEvent({
      eventType: payload.reminderType === '24H' ? ('REMINDER_24H' as any) : ('REMINDER_2H' as any),
      donorId: payload.donorId,
      donorName: payload.donorName,
      campaignTitle: payload.campaignTitle,
      venueName: payload.venueName,
      date: payload.date,
      timeSlot: payload.timeSlot,
      qrTicketToken: payload.qrTicketToken,
      recipientChatId: payload.recipientChatId,
    });
  }

  /**
   * Dispatches campaign schedule or venue change notices to all registered donors
   */
  async notifyCampaignChange(payload: {
    donorId: string;
    donorName: string;
    campaignTitle: string;
    venueName: string;
    date: string;
    timeSlot: string;
    changeNote: string;
    recipientChatId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.notifyCampaignEvent({
      eventType: 'CAMPAIGN_CHANGED' as any,
      donorId: payload.donorId,
      donorName: payload.donorName,
      campaignTitle: payload.campaignTitle,
      venueName: payload.venueName,
      date: payload.date,
      timeSlot: payload.timeSlot,
      recipientChatId: payload.recipientChatId,
    });
  }

  /**
   * Dispatches escalation notice when emergency requisition is overdue
   */
  async notifyRequestEscalation(payload: {
    requestId: string;
    displayId: string;
    hospitalName: string;
    bloodGroup: string;
    quantityLitres: number;
    priority: string;
    minutesOverdue: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/notify/escalation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Directly links a Telegram chat ID to a user account
   */
  async linkTelegramDirect(params: {
    userId: string;
    telegramChatId: string;
    userName?: string;
    userRole?: string;
    telegramUsername?: string;
  }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/link-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatches critical shortage alert to authorized recipients
   */
  async notifyShortageAlert(payload: {
    facilityId: string;
    facilityName: string;
    bloodGroup: string;
    component: string;
    availableUnits: number;
    threshold: number;
    severity?: string;
    recipientChatId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/alert/shortage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatches 18h / 48h near-expiry alert to blood bank staff and candidate receiving hospitals
   */
  async notifyNearExpiryAlert(payload: {
    facilityName: string;
    bloodGroup: string;
    component: string;
    quantityUnits: number;
    batchOrUnitId: string;
    expiryTimestamp: string;
    hoursRemaining: number;
    recipientChatId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/alert/expiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Retrieves full diagnostic telemetry of Telegram bot and delivery queue
   */
  async getDiagnostics(): Promise<TelegramDiagnosticsReport> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/diagnostics`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'OFFLINE_OR_LOCAL',
        botConfigured: false,
        botUsername: 'sevasathibot',
        webhookUrl: 'http://localhost:5174/api/telegram/webhook (simulated)',
        mode: 'SIMULATED_LOCAL',
        linkedAccounts: [],
        recentOutbox: [],
        stats: {
          totalOutboxCount: 0,
          acceptedCount: 0,
          simulatedCount: 0,
          failedCount: 0,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sends an immediate verified test alert to a specific Telegram chat ID
   */
  async sendLiveTestAlert(chatId: string, customText?: string): Promise<{ success: boolean; status: string; error?: string }> {
    try {
      const isNode = typeof window === 'undefined';
      const baseUrl = isNode ? 'http://localhost:5174' : '';
      const res = await fetch(`${baseUrl}/api/telegram/diagnostics/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text: customText }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, status: 'FAILED', error: err.message };
    }
  }
}

export const unifiedTelegramNotificationService = new UnifiedTelegramNotificationService();
