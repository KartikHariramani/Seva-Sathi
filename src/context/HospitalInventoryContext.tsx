import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { BloodGroup } from '../types';
import type {
  HospitalInventoryItem,
  InventoryActivityItem,
  InventorySummary,
} from '../data/hospitalInventory';
import { inventoryService } from '../services/inventoryService';
import { localEventBus } from '../sync/localEventBus';
import { shortageDetectionService } from '../services/shortageDetectionService';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'critical';
}

interface HospitalInventoryContextType {
  inventory: HospitalInventoryItem[];
  activity: InventoryActivityItem[];
  summary: InventorySummary;
  isLoading: boolean;
  error: string | null;
  lastUpdatedTime: string;
  toast: ToastNotification | null;
  dismissToast: () => void;
  // Section 33 required functions:
  getInventory: () => HospitalInventoryItem[];
  getInventorySummary: () => InventorySummary;
  getInventoryByBloodGroup: (group: BloodGroup) => HospitalInventoryItem | undefined;
  updateInventory: (
    bloodGroup: BloodGroup,
    newAvailable: number,
    expiryDate?: string,
    notes?: string
  ) => Promise<boolean>;
  removeInventory: (bloodGroup: BloodGroup) => Promise<boolean>;
  getRecentActivity: () => InventoryActivityItem[];
  getAttentionItems: () => HospitalInventoryItem[];
  refreshInventory: () => Promise<void>;
  resetToDefault: () => void;
}

const HospitalInventoryContext = createContext<HospitalInventoryContextType | undefined>(undefined);

export const HospitalInventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<HospitalInventoryItem[]>(() => inventoryService.getInventory());
  const [activity, setActivity] = useState<InventoryActivityItem[]>(() => inventoryService.getActivity());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('10:42 AM');
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const summary = inventoryService.calculateSummary(inventory);

  useEffect(() => {
    // Initial evaluation of baseline inventory state (no audible buzz on initial page load)
    shortageDetectionService.evaluateBatch(
      inventory.map((i) => ({ bloodGroup: i.bloodGroup, availableQuantity: i.availableQuantity })),
      { facilityId: 'HOSP-001', facilityName: 'City General Care Hospital', triggerBuzzer: false }
    );

    const unsub = localEventBus.on('INVENTORY_UPDATED', () => {
      const fresh = inventoryService.getInventory();
      const freshAct = inventoryService.getActivity();
      setInventory(fresh);
      setActivity(freshAct);
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      shortageDetectionService.evaluateBatch(
        fresh.map((i) => ({ bloodGroup: i.bloodGroup, availableQuantity: i.availableQuantity })),
        { facilityId: 'HOSP-001', facilityName: 'City General Care Hospital', triggerBuzzer: true }
      );
    });
    return unsub;
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const getInventory = useCallback(() => inventory, [inventory]);

  const getInventorySummary = useCallback(() => summary, [summary]);

  const getInventoryByBloodGroup = useCallback(
    (group: BloodGroup) => {
      return inventory.find((item) => item.bloodGroup === group);
    },
    [inventory]
  );

  const getRecentActivity = useCallback(() => activity, [activity]);

  const getAttentionItems = useCallback(() => {
    return inventory.filter(
      (item) => item.status === 'critical' || item.status === 'attention' || item.status === 'monitor'
    );
  }, [inventory]);

  const refreshInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate real-time fetch latency
      await new Promise((r) => setTimeout(r, 450));
      const fresh = inventoryService.getInventory();
      const freshAct = inventoryService.getActivity();
      setInventory(fresh);
      setActivity(freshAct);
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdatedTime(timeStr);

      shortageDetectionService.evaluateBatch(
        fresh.map((i) => ({ bloodGroup: i.bloodGroup, availableQuantity: i.availableQuantity })),
        { facilityId: 'HOSP-001', facilityName: 'City General Care Hospital', triggerBuzzer: false }
      );
    } catch {
      setError("Inventory couldn't be loaded");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateInventory = useCallback(
    async (
      bloodGroup: BloodGroup,
      newAvailable: number,
      expiryDate?: string,
      notes?: string
    ): Promise<boolean> => {
      try {
        const currentItem = inventory.find((i) => i.bloodGroup === bloodGroup);
        const oldAvailable = currentItem ? currentItem.availableQuantity : 0;
        const deltaNum = Math.round((newAvailable - oldAvailable) * 10) / 10;
        const deltaFormatted = deltaNum > 0 ? `+${deltaNum} L` : deltaNum < 0 ? `−${Math.abs(deltaNum)} L` : '0 L';

        const newStatus = inventoryService.calculateStatus(
          newAvailable,
          currentItem?.demandLevel || 'Medium'
        );

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const updatedList = inventory.map((item) => {
          if (item.bloodGroup === bloodGroup) {
            return {
              ...item,
              availableQuantity: Math.max(0, newAvailable),
              status: newStatus,
              expiryDate: expiryDate || item.expiryDate,
              notes: notes !== undefined ? notes : item.notes,
              updatedAt: now.toISOString(),
            };
          }
          return item;
        });

        // Add activity entry
        const newActivityItem: InventoryActivityItem = {
          id: `act-${Date.now()}`,
          timestamp: now.toISOString(),
          timeFormatted: timeStr,
          bloodGroup,
          action: 'updated',
          description: `${bloodGroup} inventory updated`,
          delta: deltaFormatted,
          statusType: newStatus,
        };

        const updatedActivity = [newActivityItem, ...activity].slice(0, 8);

        // Update state and persistent storage
        setInventory(updatedList);
        setActivity(updatedActivity);
        inventoryService.saveInventory(updatedList);
        inventoryService.saveActivity(updatedActivity);
        setLastUpdatedTime(timeStr);

        // Evaluate shortage transitions & trigger buzzer / Telegram notification if critical
        shortageDetectionService.evaluateBatch(
          updatedList.map((i) => ({ bloodGroup: i.bloodGroup, availableQuantity: i.availableQuantity })),
          { facilityId: 'HOSP-001', facilityName: 'City General Care Hospital', triggerBuzzer: true }
        );

        // Show toast
        setToast({
          id: `toast-${Date.now()}`,
          title: 'Inventory updated',
          message: `${bloodGroup} availability is now ${newAvailable.toFixed(1)} L.`,
          type: newStatus === 'critical' ? 'critical' : 'success',
        });

        // Auto dismiss toast after 4s
        setTimeout(() => {
          setToast((cur) => (cur?.message.includes(bloodGroup) ? null : cur));
        }, 4000);

        return true;
      } catch (err) {
        console.error('Failed to update inventory', err);
        return false;
      }
    },
    [inventory, activity]
  );

  const removeInventory = useCallback(
    async (bloodGroup: BloodGroup): Promise<boolean> => {
      return updateInventory(bloodGroup, 0);
    },
    [updateInventory]
  );

  const resetToDefault = useCallback(() => {
    localStorage.removeItem('raktsetu_hospital_inventory_v2');
    localStorage.removeItem('raktsetu_hospital_activity_v2');
    const fresh = inventoryService.getInventory();
    const freshAct = inventoryService.getActivity();
    setInventory(fresh);
    setActivity(freshAct);
    setLastUpdatedTime('10:42 AM');
    setToast({
      id: `toast-${Date.now()}`,
      title: 'Inventory reset',
      message: 'Baseline demonstration inventory restored.',
      type: 'info',
    });
  }, []);

  return (
    <HospitalInventoryContext.Provider
      value={{
        inventory,
        activity,
        summary,
        isLoading,
        error,
        lastUpdatedTime,
        toast,
        dismissToast,
        getInventory,
        getInventorySummary,
        getInventoryByBloodGroup,
        updateInventory,
        removeInventory,
        getRecentActivity,
        getAttentionItems,
        refreshInventory,
        resetToDefault,
      }}
    >
      {children}
    </HospitalInventoryContext.Provider>
  );
};

export const useHospitalInventory = () => {
  const context = useContext(HospitalInventoryContext);
  if (!context) {
    throw new Error('useHospitalInventory must be used within a HospitalInventoryProvider');
  }
  return context;
};
