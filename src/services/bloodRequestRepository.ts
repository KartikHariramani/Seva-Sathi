import type {
  BloodRequest,
  CreateBloodRequestInput,
  BloodRequestActivity,
} from '../types/bloodRequest';
import { INITIAL_HOSPITAL_REQUESTS } from '../data/hospitalRequests';
import { generateRequestId } from '../utils/requestId';
import {
  validateAndSanitizeServerDeadline,
  sortRequestsByDispatchQueue,
} from '../utils/urgencyPolicy';
import { syncEngine } from '../sync/broadcastSync';
import { storageAdapter } from '../persistence/localStorageAdapter';

const REQUESTS_STORAGE_KEY = 'raktsetu_hospital_requests_v2';
const DRAFT_STORAGE_KEY = 'raktsetu_hospital_request_draft_v2';

export interface BloodRequestRepository {
  getRequests(): Promise<BloodRequest[]>;
  getRequest(id: string): Promise<BloodRequest | null>;
  getDispatchQueue(): Promise<BloodRequest[]>;
  createRequest(
    data: CreateBloodRequestInput,
    hospitalContext?: {
      hospitalId?: string;
      hospitalName?: string;
      hospitalCity?: string;
      submittedBy?: string;
    }
  ): Promise<BloodRequest>;
  updateRequest(id: string, updates: Partial<BloodRequest>): Promise<BloodRequest>;
  cancelRequest(id: string, reason?: string, actor?: string): Promise<BloodRequest>;
  saveDraft(data: Partial<CreateBloodRequestInput>): Promise<void>;
  getDraft(): Promise<Partial<CreateBloodRequestInput> | null>;
  clearDraft(): Promise<void>;
  resetToDefault(): Promise<BloodRequest[]>;
}

class MockBloodRequestRepository implements BloodRequestRepository {
  private memoryStore: BloodRequest[] | null = null;

  private getStoredRequests(): BloodRequest[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } else if (this.memoryStore) {
        return this.memoryStore;
      }
    } catch (e) {
      console.error('Failed to parse stored requests from localStorage', e);
    }
    // Default fallback
    this.saveRequests(INITIAL_HOSPITAL_REQUESTS);
    return INITIAL_HOSPITAL_REQUESTS;
  }

  private saveRequests(requests: BloodRequest[]): void {
    try {
      this.memoryStore = requests;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
      }
    } catch (e) {
      console.error('Failed to save requests to localStorage', e);
    }
  }

  // Artificial network latency simulator (200-350ms)
  private async delay(ms: number = 250): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getRequests(): Promise<BloodRequest[]> {
    await this.delay(180);
    return sortRequestsByDispatchQueue(this.getStoredRequests());
  }

  async getRequest(id: string): Promise<BloodRequest | null> {
    await this.delay(150);
    const requests = this.getStoredRequests();
    // Allow lookup by internal id or displayId
    const found = requests.find(
      (r) => r.id === id || r.displayId.toLowerCase() === id.toLowerCase()
    );
    return found || null;
  }

  async getDispatchQueue(): Promise<BloodRequest[]> {
    await this.delay(150);
    return sortRequestsByDispatchQueue(this.getStoredRequests());
  }

  async createRequest(
    data: CreateBloodRequestInput,
    hospitalContext?: {
      hospitalId?: string;
      hospitalName?: string;
      hospitalCity?: string;
      submittedBy?: string;
    }
  ): Promise<BloodRequest> {
    await this.delay(350);
    const requests = this.getStoredRequests();
    const now = new Date();
    const nowIso = now.toISOString();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Server-side enforcement: Never trust a deadline supplied only by the frontend
    const serverDeadlineCheck = validateAndSanitizeServerDeadline(
      data.priority,
      data.requiredBy,
      now
    );
    const verifiedRequiredBy = serverDeadlineCheck.requiredBy;

    const displayId = generateRequestId();
    const internalId = `req-${Date.now()}`;
    const initialStatus = data.status || 'pending_approval';

    const initialActivity: BloodRequestActivity = {
      id: `act-${Date.now()}-1`,
      requestId: internalId,
      type: 'created',
      title: initialStatus === 'draft' ? 'Draft request saved' : 'Request submitted for review',
      description: `${data.quantityLitres.toFixed(1)} L of ${data.bloodGroup} requested (${data.priority.toUpperCase()}). Deadline: ${new Date(verifiedRequiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      timestamp: nowIso,
      timeFormatted,
      actor: hospitalContext?.submittedBy || 'Hospital Admin',
    };

    const newActivities: BloodRequestActivity[] = [initialActivity];
    if (serverDeadlineCheck.recalculated && serverDeadlineCheck.reason) {
      newActivities.push({
        id: `act-${Date.now()}-recalc`,
        requestId: internalId,
        type: 'status_change',
        title: 'Emergency Deadline Calibrated',
        description: serverDeadlineCheck.reason,
        timestamp: nowIso,
        timeFormatted,
        actor: 'Seva Sathi Automated Policy Engine',
      });
    }

    const newRequest: BloodRequest = {
      id: internalId,
      displayId,
      hospitalId: hospitalContext?.hospitalId || 'HSP-00124',
      hospitalName: hospitalContext?.hospitalName || 'XYZ Hospital',
      hospitalCity: hospitalContext?.hospitalCity || 'Nagpur, Maharashtra',
      deliveryLocation: data.deliveryLocation || 'Emergency Blood Storage Unit',
      department: data.department || 'Emergency Medicine',
      contactPhone: data.contactPhone || '+91 712 256 8900',
      bloodGroup: data.bloodGroup,
      quantityLitres: Number(data.quantityLitres),
      priority: data.priority,
      status: initialStatus,
      requiredBy: verifiedRequiredBy,
      reason: data.reason || '',
      createdAt: nowIso,
      updatedAt: nowIso,
      submittedBy: hospitalContext?.submittedBy || 'Hospital Admin',
      activities: newActivities,
    };

    const updated = sortRequestsByDispatchQueue([newRequest, ...requests]);
    this.saveRequests(updated);

    // Keep canonical state synchronized for cross-dashboard visibility (Blood Banks & Admin)
    try {
      const canonicalState = storageAdapter.getState();
      const existingIdx = canonicalState.requests.findIndex(
        (r) => r.id === newRequest.id || r.displayId === newRequest.displayId
      );
      if (existingIdx >= 0) {
        canonicalState.requests[existingIdx] = newRequest;
      } else {
        canonicalState.requests.unshift(newRequest);
      }
      canonicalState.stateVersion = (canonicalState.stateVersion || 100) + 1;
      storageAdapter.saveState(canonicalState);
    } catch {
      // safe fallback
    }

    syncEngine.broadcast('REQUEST_CREATED', Date.now(), { request: newRequest }, 'REQUEST', newRequest.id);

    // If draft was cleared after submission
    if (initialStatus !== 'draft') {
      await this.clearDraft();
    }

    return newRequest;
  }

  async updateRequest(id: string, updates: Partial<BloodRequest>): Promise<BloodRequest> {
    await this.delay(250);
    const requests = this.getStoredRequests();
    const index = requests.findIndex((r) => r.id === id || r.displayId === id);
    if (index === -1) {
      throw new Error(`Blood request with ID ${id} not found`);
    }

    const existing = requests[index];
    const now = new Date();
    const nowIso = now.toISOString();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedActivities = existing.activities;
    if (updates.status && updates.status !== existing.status) {
      const statusActivity: BloodRequestActivity = {
        id: `act-${Date.now()}`,
        requestId: existing.id,
        type: 'status_change',
        title: `Status updated to ${updates.status.replace('_', ' ')}`,
        timestamp: nowIso,
        timeFormatted,
        actor: 'Hospital Admin',
      };
      updatedActivities = [statusActivity, ...existing.activities];
    }

    const updatedItem: BloodRequest = {
      ...existing,
      ...updates,
      updatedAt: nowIso,
      activities: updatedActivities,
    };

    requests[index] = updatedItem;
    this.saveRequests(requests);

    try {
      const canonicalState = storageAdapter.getState();
      const existingIdx = canonicalState.requests.findIndex(
        (r) => r.id === updatedItem.id || r.displayId === updatedItem.displayId
      );
      if (existingIdx >= 0) {
        canonicalState.requests[existingIdx] = updatedItem;
      } else {
        canonicalState.requests.unshift(updatedItem);
      }
      canonicalState.stateVersion = (canonicalState.stateVersion || 100) + 1;
      storageAdapter.saveState(canonicalState);
    } catch {
      // safe fallback
    }

    syncEngine.broadcast('REQUEST_UPDATED', Date.now(), { request: updatedItem }, 'REQUEST', updatedItem.id);

    return updatedItem;
  }

  async cancelRequest(id: string, reason?: string, actor?: string): Promise<BloodRequest> {
    await this.delay(300);
    const requests = this.getStoredRequests();
    const index = requests.findIndex((r) => r.id === id || r.displayId === id);
    if (index === -1) {
      throw new Error(`Blood request with ID ${id} not found`);
    }

    const existing = requests[index];
    const now = new Date();
    const nowIso = now.toISOString();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const cancelActivity: BloodRequestActivity = {
      id: `act-${Date.now()}-cancel`,
      requestId: existing.id,
      type: 'cancelled',
      title: 'Request cancelled by hospital',
      description: reason ? `Reason: ${reason}` : 'Cancelled by requesting medical officer.',
      timestamp: nowIso,
      timeFormatted,
      actor: actor || 'Hospital Admin',
    };

    const cancelledItem: BloodRequest = {
      ...existing,
      status: 'cancelled',
      updatedAt: nowIso,
      activities: [cancelActivity, ...existing.activities],
    };

    requests[index] = cancelledItem;
    this.saveRequests(requests);

    try {
      const canonicalState = storageAdapter.getState();
      const existingIdx = canonicalState.requests.findIndex(
        (r) => r.id === cancelledItem.id || r.displayId === cancelledItem.displayId
      );
      if (existingIdx >= 0) {
        canonicalState.requests[existingIdx] = cancelledItem;
        canonicalState.stateVersion = (canonicalState.stateVersion || 100) + 1;
        storageAdapter.saveState(canonicalState);
      }
    } catch {
      // safe fallback
    }

    syncEngine.broadcast('REQUEST_UPDATED', Date.now(), { request: cancelledItem }, 'REQUEST', cancelledItem.id);

    return cancelledItem;
  }

  async saveDraft(data: Partial<CreateBloodRequestInput>): Promise<void> {
    await this.delay(100);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save draft to localStorage', e);
    }
  }

  async getDraft(): Promise<Partial<CreateBloodRequestInput> | null> {
    await this.delay(50);
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch (e) {
      console.error('Failed to retrieve draft from localStorage', e);
      return null;
    }
  }

  async clearDraft(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear draft from localStorage', e);
    }
  }

  async resetToDefault(): Promise<BloodRequest[]> {
    await this.delay(200);
    this.saveRequests(INITIAL_HOSPITAL_REQUESTS);
    await this.clearDraft();
    return INITIAL_HOSPITAL_REQUESTS;
  }
}

export const bloodRequestRepository: BloodRequestRepository = new MockBloodRequestRepository();
