import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RaktSetuLocalState } from '../types/admin';
import type { UserRole } from '../types';
import type { AuditLog, AuditAction } from '../types/audit';
import type { SyncEventType } from '../sync/syncEvents';
import { storageAdapter } from '../persistence/localStorageAdapter';
import { syncEngine } from '../sync/broadcastSync';
import { localEventBus } from '../sync/localEventBus';
import { createInitialSeedState } from '../persistence/seedManager';
import { bloodRequestRepository } from '../services/bloodRequestRepository';

interface AppStoreContextType {
  state: RaktSetuLocalState;
  isHydrated: boolean;
  mutate: (
    updater: (draft: RaktSetuLocalState) => void,
    actionType?: SyncEventType,
    auditPayload?: {
      action: AuditAction;
      entityType: AuditLog['entityType'];
      entityId: string;
      reason?: string;
      previousState?: Record<string, unknown>;
      newState?: Record<string, unknown>;
    }
  ) => void;

  // Domain Actions
  verifyOrganization: (orgId: string, verifiedBy?: string) => void;
  rejectOrganization: (orgId: string, reason: string) => void;
  suspendOrganization: (orgId: string, reason: string) => void;
  reactivateOrganization: (orgId: string) => void;

  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;

  dispatchTransfer: (transferId: string) => void;
  deliverTransfer: (transferId: string) => void;

  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  resetDemo: () => void;
  setSession: (role: UserRole, email?: string, orgName?: string) => void;
  logout: () => void;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RaktSetuLocalState>(() => storageAdapter.getState());
  const isHydrated = true;

  // Sync listener: whenever BroadcastChannel receives an update from another tab or local bus
  useEffect(() => {
    const unsubscribeBroadcast = syncEngine.subscribe(() => {
      // Re-read authoritative state from storage
      const fresh = storageAdapter.getState();
      if (fresh.stateVersion >= state.stateVersion) {
        setState(fresh);
      }
    });

    const unsubscribeLocal = localEventBus.on('STATE_UPDATED', () => {
      const fresh = storageAdapter.getState();
      setState(fresh);
    });

    return () => {
      unsubscribeBroadcast();
      unsubscribeLocal();
    };
  }, [state.stateVersion]);

  // Atomic state mutator
  const mutate = useCallback(
    (
      updater: (draft: RaktSetuLocalState) => void,
      actionType: SyncEventType = 'STATE_UPDATED',
      auditPayload?: {
        action: AuditAction;
        entityType: AuditLog['entityType'];
        entityId: string;
        reason?: string;
        previousState?: Record<string, unknown>;
        newState?: Record<string, unknown>;
      }
    ) => {
      setState((prev) => {
        // Deep clone draft
        const draft: RaktSetuLocalState = JSON.parse(JSON.stringify(prev));

        // Apply mutation
        updater(draft);

        const now = new Date().toISOString();
        draft.stateVersion = (draft.stateVersion || 100) + 1;
        draft.meta.lastUpdatedAt = now;

        // Automatically log audit entry if provided
        if (auditPayload) {
          const auditId = `aud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          const newAudit: AuditLog = {
            id: auditId,
            timestamp: now,
            actorId: draft.session.userId || 'usr-anon',
            actorName: draft.session.userName || 'Authorized Operator',
            actorRole: draft.session.role || 'admin',
            organizationId: draft.session.organizationId || 'RaktSetu-Network',
            organizationName: draft.session.organizationName || 'RaktSetu Network',
            action: auditPayload.action,
            entityType: auditPayload.entityType,
            entityId: auditPayload.entityId,
            severity: auditPayload.action.includes('REJECT') || auditPayload.action.includes('SUSPEND') ? 'WARNING' : 'NOTICE',
            previousState: auditPayload.previousState,
            newState: auditPayload.newState,
            reason: auditPayload.reason,
          };
          draft.auditLogs.unshift(newAudit);
          // Limit audit logs in local demo memory to latest 150 entries
          if (draft.auditLogs.length > 150) {
            draft.auditLogs = draft.auditLogs.slice(0, 150);
          }
        }

        // Persist to storage
        storageAdapter.saveState(draft);

        // Broadcast to other tabs & local bus
        syncEngine.broadcast(actionType, draft.stateVersion, { actionType });

        return draft;
      });
    },
    []
  );

  // -------------------------------------------------------------
  // DOMAIN ACTIONS
  // -------------------------------------------------------------

  const verifyOrganization = useCallback(
    (orgId: string, verifiedBy?: string) => {
      const target = state.organizations.find((o) => o.id === orgId);
      if (!target) return;

      const actorName = verifiedBy || state.session.userName || 'RaktSetu State Admin';

      mutate(
        (draft) => {
          const org = draft.organizations.find((o) => o.id === orgId);
          if (org) {
            org.status = 'VERIFIED';
            org.verifiedAt = new Date().toISOString();
            org.verifiedBy = actorName;
          }
          // Resolve any pending verification alert
          draft.alerts = draft.alerts.map((a) =>
            a.relatedEntityId === orgId && a.type === 'ORGANIZATION_VERIFICATION'
              ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
              : a
          );
        },
        'ORGANIZATION_UPDATED',
        {
          action: 'ORGANIZATION_VERIFIED',
          entityType: 'ORGANIZATION',
          entityId: orgId,
          reason: 'Statutory compliance and medical licensure verified.',
          previousState: { status: target.status },
          newState: { status: 'VERIFIED', verifiedBy: actorName },
        }
      );
    },
    [state.organizations, state.session.userName, mutate]
  );

  const rejectOrganization = useCallback(
    (orgId: string, reason: string) => {
      const target = state.organizations.find((o) => o.id === orgId);
      if (!target) return;

      mutate(
        (draft) => {
          const org = draft.organizations.find((o) => o.id === orgId);
          if (org) {
            org.status = 'REJECTED';
            org.rejectionReason = reason;
          }
        },
        'ORGANIZATION_UPDATED',
        {
          action: 'ORGANIZATION_REJECTED',
          entityType: 'ORGANIZATION',
          entityId: orgId,
          reason,
          previousState: { status: target.status },
          newState: { status: 'REJECTED', reason },
        }
      );
    },
    [state.organizations, mutate]
  );

  const suspendOrganization = useCallback(
    (orgId: string, reason: string) => {
      const target = state.organizations.find((o) => o.id === orgId);
      if (!target) return;

      mutate(
        (draft) => {
          const org = draft.organizations.find((o) => o.id === orgId);
          if (org) {
            org.status = 'SUSPENDED';
            org.suspensionReason = reason;
          }
        },
        'ORGANIZATION_UPDATED',
        {
          action: 'ORGANIZATION_SUSPENDED',
          entityType: 'ORGANIZATION',
          entityId: orgId,
          reason,
          previousState: { status: target.status },
          newState: { status: 'SUSPENDED', reason },
        }
      );
    },
    [state.organizations, mutate]
  );

  const reactivateOrganization = useCallback(
    (orgId: string) => {
      const target = state.organizations.find((o) => o.id === orgId);
      if (!target) return;

      mutate(
        (draft) => {
          const org = draft.organizations.find((o) => o.id === orgId);
          if (org) {
            org.status = 'VERIFIED';
            delete org.suspensionReason;
          }
        },
        'ORGANIZATION_UPDATED',
        {
          action: 'ORGANIZATION_REACTIVATED',
          entityType: 'ORGANIZATION',
          entityId: orgId,
          reason: 'Administrative suspension resolved. Compliance re-verified.',
          previousState: { status: target.status },
          newState: { status: 'VERIFIED' },
        }
      );
    },
    [state.organizations, mutate]
  );

  const approveRequest = useCallback(
    (requestId: string) => {
      const target = state.requests.find((r) => r.id === requestId || r.displayId === requestId);
      if (!target) return;

      mutate(
        (draft) => {
          const req = draft.requests.find((r) => r.id === target.id || r.displayId === target.displayId);
          if (req) {
            req.status = 'approved';
            req.updatedAt = new Date().toISOString();
            req.activities.unshift({
              id: `act-${Date.now()}`,
              requestId: req.id,
              type: 'approval',
              title: 'Requisition Approved',
              description: 'Approved for regional blood bank candidate matching.',
              timestamp: new Date().toISOString(),
              actor: draft.session.userName || 'RaktSetu Network Admin',
            });
          }
        },
        'REQUEST_UPDATED',
        {
          action: 'REQUEST_APPROVED',
          entityType: 'REQUEST',
          entityId: target.displayId || target.id,
          reason: 'Requisition verified and approved for network candidate allocation.',
          previousState: { status: target.status },
          newState: { status: 'approved' },
        }
      );

      bloodRequestRepository.updateRequest(target.id, { status: 'approved' }).catch(() => {});
    },
    [state.requests, mutate]
  );

  const rejectRequest = useCallback(
    (requestId: string, reason: string) => {
      const target = state.requests.find((r) => r.id === requestId || r.displayId === requestId);
      if (!target) return;

      mutate(
        (draft) => {
          const req = draft.requests.find((r) => r.id === target.id || r.displayId === target.displayId);
          if (req) {
            req.status = 'rejected';
            req.updatedAt = new Date().toISOString();
            req.activities.unshift({
              id: `act-${Date.now()}`,
              requestId: req.id,
              type: 'status_change',
              title: 'Requisition Rejected',
              description: `Requisition rejected: ${reason}`,
              timestamp: new Date().toISOString(),
              actor: draft.session.userName || 'RaktSetu Network Admin',
            });
          }
        },
        'REQUEST_UPDATED',
        {
          action: 'REQUEST_REJECTED',
          entityType: 'REQUEST',
          entityId: target.displayId || target.id,
          reason,
          previousState: { status: target.status },
          newState: { status: 'rejected', reason },
        }
      );

      bloodRequestRepository.updateRequest(target.id, { status: 'rejected' }).catch(() => {});
    },
    [state.requests, mutate]
  );

  const dispatchTransfer = useCallback(
    (transferId: string) => {
      const target = state.transfers.find((t) => t.id === transferId || t.transferId === transferId);
      if (!target) return;

      mutate(
        (draft) => {
          const tr = draft.transfers.find((t) => t.id === target.id || t.transferId === target.transferId);
          if (tr) {
            tr.status = 'IN_TRANSIT';
            tr.dispatchedAt = new Date().toISOString();
            tr.updatedAt = new Date().toISOString();
          }
        },
        'TRANSFER_UPDATED',
        {
          action: 'TRANSFER_DISPATCHED',
          entityType: 'TRANSFER',
          entityId: target.transferId,
          reason: 'Blood consignment packed in cold chain container and dispatched.',
          previousState: { status: target.status },
          newState: { status: 'IN_TRANSIT' },
        }
      );
    },
    [state.transfers, mutate]
  );

  const deliverTransfer = useCallback(
    (transferId: string) => {
      const target = state.transfers.find((t) => t.id === transferId || t.transferId === transferId);
      if (!target) return;

      mutate(
        (draft) => {
          const tr = draft.transfers.find((t) => t.id === target.id || t.transferId === target.transferId);
          if (tr) {
            tr.status = 'DELIVERED';
            tr.deliveredAt = new Date().toISOString();
            tr.updatedAt = new Date().toISOString();
          }
        },
        'TRANSFER_UPDATED',
        {
          action: 'TRANSFER_RECEIVED',
          entityType: 'TRANSFER',
          entityId: target.transferId,
          reason: 'Consignment safely delivered and accepted by destination hospital.',
          previousState: { status: target.status },
          newState: { status: 'DELIVERED' },
        }
      );
    },
    [state.transfers, mutate]
  );

  const acknowledgeAlert = useCallback(
    (alertId: string) => {
      mutate(
        (draft) => {
          const alert = draft.alerts.find((a) => a.id === alertId);
          if (alert) {
            alert.status = 'ACKNOWLEDGED';
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = draft.session.userName || 'Admin Operator';
          }
        },
        'ALERT_UPDATED',
        {
          action: 'ALERT_ACKNOWLEDGED',
          entityType: 'ALERT',
          entityId: alertId,
          reason: 'Operator acknowledged critical alert and initiated monitoring.',
        }
      );
    },
    [mutate]
  );

  const resolveAlert = useCallback(
    (alertId: string) => {
      mutate(
        (draft) => {
          const alert = draft.alerts.find((a) => a.id === alertId);
          if (alert) {
            alert.status = 'RESOLVED';
            alert.resolvedAt = new Date().toISOString();
          }
        },
        'ALERT_UPDATED',
        {
          action: 'ALERT_RESOLVED',
          entityType: 'ALERT',
          entityId: alertId,
          reason: 'Condition mitigated and resolved.',
        }
      );
    },
    [mutate]
  );

  const resetDemo = useCallback(() => {
    const seed = createInitialSeedState();
    storageAdapter.saveState(seed);
    setState(seed);
    syncEngine.broadcast('DEMO_RESET', seed.stateVersion, { reset: true });
    localEventBus.emit('STATE_UPDATED');
  }, []);

  const setSession = useCallback(
    (role: UserRole, email?: string, orgName?: string) => {
      mutate(
        (draft) => {
          draft.session.role = role;
          draft.session.authenticated = true;
          if (email) draft.session.email = email;
          if (orgName) draft.session.organizationName = orgName;

          if (role === 'admin') {
            draft.session.userName = 'Alhaj Baig (Regional Director)';
            draft.session.organizationId = 'RaktSetu-Network';
            draft.session.organizationName = 'RaktSetu Regional Network Command';
          } else if (role === 'hospital') {
            draft.session.userName = 'Dr. Ramesh Sharma (Medical Director)';
            draft.session.organizationId = 'HSP-00124';
            draft.session.organizationName = orgName || 'CityCare Hospital & Trauma Center';
          } else {
            draft.session.userName = 'Dr. Sandeep Deshpande (Bank Director)';
            draft.session.organizationId = 'bank-nagpur-regional';
            draft.session.organizationName = orgName || 'Nagpur Regional Blood Centre';
          }
        },
        'STATE_UPDATED',
        {
          action: 'LOGIN',
          entityType: 'SYSTEM',
          entityId: `SESSION-${role.toUpperCase()}`,
          reason: `Authenticated as ${role.toUpperCase()}`,
        }
      );
    },
    [mutate]
  );

  const logout = useCallback(() => {
    mutate(
      (draft) => {
        draft.session.authenticated = false;
        draft.session.role = null;
        draft.session.userId = null;
        draft.session.userName = null;
      },
      'STATE_UPDATED',
      {
        action: 'LOGOUT',
        entityType: 'SYSTEM',
        entityId: 'SESSION-LOGOUT',
        reason: 'User explicitly logged out',
      }
    );
  }, [mutate]);

  return (
    <AppStoreContext.Provider
      value={{
        state,
        isHydrated,
        mutate,
        verifyOrganization,
        rejectOrganization,
        suspendOrganization,
        reactivateOrganization,
        approveRequest,
        rejectRequest,
        dispatchTransfer,
        deliverTransfer,
        acknowledgeAlert,
        resolveAlert,
        resetDemo,
        setSession,
        logout,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = (): AppStoreContextType => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};
