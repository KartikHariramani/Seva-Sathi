import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type {
  BloodRequest,
  CreateBloodRequestInput,
} from '../types/bloodRequest';
import { bloodRequestRepository } from '../services/bloodRequestRepository';
import { useAuth } from './AuthContext';
import { useRegistration } from './RegistrationContext';
import { isRequestActive } from '../utils/requestStatus';
import { unifiedTelegramNotificationService } from '../services/unifiedTelegramNotificationService';
import { localEventBus } from '../sync/localEventBus';
import { syncEngine } from '../sync/broadcastSync';

interface HospitalRequestContextType {
  requests: BloodRequest[];
  isLoading: boolean;
  error: string | null;
  activeRequestsCount: number;
  awaitingApprovalCount: number;
  inProgressCount: number;
  completedCount: number;
  createRequest: (data: CreateBloodRequestInput) => Promise<BloodRequest>;
  cancelRequest: (id: string, reason?: string) => Promise<boolean>;
  updateRequest: (id: string, updates: Partial<BloodRequest>) => Promise<BloodRequest | null>;
  saveDraft: (data: Partial<CreateBloodRequestInput>) => Promise<void>;
  getDraft: () => Promise<Partial<CreateBloodRequestInput> | null>;
  clearDraft: () => Promise<void>;
  getRequestById: (id: string) => BloodRequest | undefined;
  refreshRequests: () => Promise<void>;
  resetRequestsToDefault: () => Promise<void>;
}

const HospitalRequestContext = createContext<HospitalRequestContextType | undefined>(undefined);

export const HospitalRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: regData } = useRegistration();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active hospital organization details
  const hospitalContext = useMemo(
    () => ({
      hospitalId: regData.organizationId || user?.orgId || 'HSP-00124',
      hospitalName: regData.organizationName || user?.orgName || 'XYZ Hospital',
      hospitalCity: regData.city ? `${regData.city}, Maharashtra` : 'Nagpur, Maharashtra',
      submittedBy: regData.adminName || 'Hospital Admin',
    }),
    [regData, user]
  );

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bloodRequestRepository.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load blood requests', err);
      setError("Unable to load blood requests. Please check connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    const unsub1 = localEventBus.on('REQUEST_CREATED', () => fetchRequests());
    const unsub2 = localEventBus.on('REQUEST_UPDATED', () => fetchRequests());
    const unsub3 = localEventBus.on('RESERVATION_CREATED', () => fetchRequests());
    const unsub4 = localEventBus.on('TRANSFER_UPDATED', () => fetchRequests());
    const unsub5 = localEventBus.on('hospital.request.created', () => fetchRequests());
    const unsub6 = localEventBus.on('hospital.request.updated', () => fetchRequests());
    const unsub7 = syncEngine.subscribe((msg) => {
      if (
        msg.type === 'REQUEST_CREATED' ||
        msg.type === 'REQUEST_UPDATED' ||
        msg.type === 'RESERVATION_CREATED' ||
        msg.type === 'TRANSFER_UPDATED'
      ) {
        fetchRequests();
      }
    });

    const handleFocus = () => fetchRequests();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [fetchRequests]);

  // Derived KPI metrics
  const activeRequestsCount = useMemo(
    () => requests.filter((r) => isRequestActive(r.status)).length,
    [requests]
  );

  const awaitingApprovalCount = useMemo(
    () => requests.filter((r) => r.status === 'pending_approval').length,
    [requests]
  );

  const inProgressCount = useMemo(
    () =>
      requests.filter((r) =>
        ['searching', 'matched', 'reserved', 'in_transit'].includes(r.status)
      ).length,
    [requests]
  );

  const completedCount = useMemo(
    () => requests.filter((r) => r.status === 'completed').length,
    [requests]
  );

  const getRequestById = useCallback(
    (id: string): BloodRequest | undefined => {
      const normalized = id.toLowerCase().trim();
      return requests.find(
        (r) => r.id.toLowerCase() === normalized || r.displayId.toLowerCase() === normalized
      );
    },
    [requests]
  );

  const createRequest = useCallback(
    async (input: CreateBloodRequestInput): Promise<BloodRequest> => {
      setError(null);
      try {
        const created = await bloodRequestRepository.createRequest(input, hospitalContext);
        setRequests((prev) => [created, ...prev]);

        // Trigger automatic Telegram dispatch to regional blood-bank and hospital coordinators
        unifiedTelegramNotificationService.notifyHospitalBloodRequest({
          requestId: created.id,
          displayId: created.displayId || created.id,
          hospitalName: created.hospitalName || hospitalContext.hospitalName,
          bloodGroup: created.bloodGroup,
          quantityLitres: created.quantityLitres,
          priority: created.priority,
          status: created.status,
        }).catch((err) => console.warn('[Telegram Dispatch] Hospital request alert failed:', err));

        localEventBus.emit('hospital.request.created', { request: created });
        return created;
      } catch (err) {
        console.error('Failed to create blood request', err);
        throw new Error('Unable to submit request. Please try again.');
      }
    },
    [hospitalContext]
  );

  const cancelRequest = useCallback(
    async (id: string, reason?: string): Promise<boolean> => {
      setError(null);
      try {
        const cancelled = await bloodRequestRepository.cancelRequest(
          id,
          reason,
          hospitalContext.submittedBy
        );
        setRequests((prev) =>
          prev.map((r) => (r.id === cancelled.id || r.displayId === cancelled.displayId ? cancelled : r))
        );
        return true;
      } catch (err) {
        console.error('Failed to cancel request', err);
        throw new Error('Unable to cancel request. Please try again.');
      }
    },
    [hospitalContext.submittedBy]
  );

  const updateRequest = useCallback(
    async (id: string, updates: Partial<BloodRequest>): Promise<BloodRequest | null> => {
      setError(null);
      try {
        const updated = await bloodRequestRepository.updateRequest(id, updates);
        setRequests((prev) =>
          prev.map((r) => (r.id === updated.id || r.displayId === updated.displayId ? updated : r))
        );
        return updated;
      } catch (err) {
        console.error('Failed to update request', err);
        return null;
      }
    },
    []
  );

  const saveDraft = useCallback(
    async (data: Partial<CreateBloodRequestInput>): Promise<void> => {
      await bloodRequestRepository.saveDraft(data);
    },
    []
  );

  const getDraft = useCallback(async (): Promise<Partial<CreateBloodRequestInput> | null> => {
    return bloodRequestRepository.getDraft();
  }, []);

  const clearDraft = useCallback(async (): Promise<void> => {
    await bloodRequestRepository.clearDraft();
  }, []);

  const resetRequestsToDefault = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const reset = await bloodRequestRepository.resetToDefault();
      setRequests(reset);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <HospitalRequestContext.Provider
      value={{
        requests,
        isLoading,
        error,
        activeRequestsCount,
        awaitingApprovalCount,
        inProgressCount,
        completedCount,
        createRequest,
        cancelRequest,
        updateRequest,
        saveDraft,
        getDraft,
        clearDraft,
        getRequestById,
        refreshRequests: fetchRequests,
        resetRequestsToDefault,
      }}
    >
      {children}
    </HospitalRequestContext.Provider>
  );
};

export const useHospitalRequests = () => {
  const context = useContext(HospitalRequestContext);
  if (!context) {
    throw new Error('useHospitalRequests must be used within a HospitalRequestProvider');
  }
  return context;
};
