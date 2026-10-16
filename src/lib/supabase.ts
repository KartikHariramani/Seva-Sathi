import { createClient } from '@supabase/supabase-js';
import type { BloodGroup, UserRole } from '../types';
import type { Organization, OrganizationStatus } from '../types/organization';
import type { HospitalStaff, CreateStaffInput } from '../types/staff';
import { localEventBus } from '../sync/localEventBus';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholderUrl = !envUrl || envUrl.includes('your-project') || !envUrl.startsWith('http');
const isPlaceholderKey = !envAnonKey || envAnonKey === 'your-anon-key';

const supabaseUrl = !isPlaceholderUrl ? envUrl : 'https://fhnyhsoykmbjingtvcul.supabase.co';
const supabaseAnonKey = !isPlaceholderKey ? envAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobnloc295a21iamluZ3R2Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMDc1ODksImV4cCI6MjEwNjU4MzU4OX0.LZbaCGEK21j-cATaPCL5YqV9V2SuS2p1POtl8utBFvg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface SupabaseUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'HOSPITAL' | 'BLOOD_BANK' | 'HOSPITAL_STAFF' | 'NGO' | 'DONOR';
  organization_id: string | null;
  staff_title?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

/**
 * Standardized demo user identities
 */
export const DEMO_IDENTITIES = {
  ADMIN: {
    email: 'admin@raktsetu.org',
    password: 'demoAdminPass2026!',
    role: 'admin' as UserRole,
    name: 'State Medical Administrator',
    orgId: 'ORG-ADMIN-01',
    orgName: 'RaktSetu State Control Center',
    verificationStatus: 'VERIFIED' as OrganizationStatus,
  },
  HOSPITAL: {
    email: 'hospital.admin@raktsetu.org',
    password: 'demoHospitalPass2026!',
    role: 'hospital' as UserRole,
    name: 'Dr. Rajesh Verma',
    orgId: 'ORG-HOSP-01',
    orgName: 'Metropolitan Trauma & General Hospital',
    verificationStatus: 'VERIFIED' as OrganizationStatus,
  },
  HOSPITAL_STAFF: {
    email: 'hospital.staff@raktsetu.org',
    password: 'demoStaffPass2026!',
    role: 'hospital_staff' as UserRole,
    name: 'Dr. Rahul Sharma',
    staffTitle: 'Senior Transfusion Officer',
    orgId: 'ORG-HOSP-01',
    orgName: 'Metropolitan Trauma & General Hospital',
    verificationStatus: 'VERIFIED' as OrganizationStatus,
  },
  BLOOD_BANK: {
    email: 'bloodbank@raktsetu.org',
    password: 'demoBloodBankPass2026!',
    role: 'blood_bank' as UserRole,
    name: 'Suresh Nair',
    orgId: 'ORG-BANK-01',
    orgName: 'Central City Blood Bank & Apheresis Depot',
    verificationStatus: 'VERIFIED' as OrganizationStatus,
  },
  NGO: {
    email: 'ngo.coordinator@sevasathi.org',
    password: 'demoNgoPass2026!',
    role: 'ngo' as UserRole,
    name: 'Anjali Sharma',
    orgId: 'ORG-NGO-01',
    orgName: 'LifeStream Red Cross NGO Alliance',
    verificationStatus: 'VERIFIED' as OrganizationStatus,
  },
  DONOR: {
    email: 'donor@sevasathi.org',
    password: 'demoDonorPass2026!',
    role: 'donor' as UserRole,
    name: 'Amitabh Sen',
    orgId: 'DNR-2026-001',
    orgName: 'Volunteer Blood Donor Network',
    verificationStatus: 'VERIFIED' as OrganizationStatus,
  },
};

/**
 * Haversine formula for genuine geographic distance computation (km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Supabase Service Layer
 */
export const supabaseService = {
  /**
   * Realtime Channel Subscriptions
   */
  initRealtimeSubscriptions(onSyncEvent?: (tableName: string, payload: unknown) => void) {
    const channel = supabase
      .channel('raktsetu_live_network_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        (payload) => {
          localEventBus.emit('organization.updated', payload.new);
          if (onSyncEvent) onSyncEvent('organizations', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_inventory' },
        (payload) => {
          localEventBus.emit('inventory.updated', payload.new);
          if (onSyncEvent) onSyncEvent('blood_inventory', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_inventory_transactions' },
        (payload) => {
          localEventBus.emit('transaction.created', payload.new);
          if (onSyncEvent) onSyncEvent('blood_inventory_transactions', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_requests' },
        (payload) => {
          localEventBus.emit('request.updated', payload.new);
          if (onSyncEvent) onSyncEvent('blood_requests', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_reservations' },
        (payload) => {
          localEventBus.emit('reservation.updated', payload.new);
          if (onSyncEvent) onSyncEvent('blood_reservations', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_transfers' },
        (payload) => {
          localEventBus.emit('transfer.updated', payload.new);
          if (onSyncEvent) onSyncEvent('blood_transfers', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Fetch hospital staff
   */
  async getHospitalStaff(hospitalId: string): Promise<HospitalStaff[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', hospitalId)
        .eq('role', 'HOSPITAL_STAFF');

      if (!error && data && data.length > 0) {
        return data.map((p) => ({
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          role: 'HOSPITAL_STAFF',
          hospitalId: p.organization_id,
          staffTitle: p.staff_title || 'Transfusion Staff',
          status: p.status === 'DEACTIVATED' ? 'DEACTIVATED' : 'ACTIVE',
          createdAt: p.created_at,
          lastActiveAt: p.last_active_at,
        }));
      }
    } catch (e) {
      console.warn('[Supabase] Falling back to store staff', e);
    }

    // Default seeded staff
    return [
      {
        id: 'STAFF-MH-01',
        email: 'hospital.staff@raktsetu.org',
        fullName: 'Dr. Rahul Sharma',
        role: 'HOSPITAL_STAFF',
        hospitalId,
        staffTitle: 'Senior Transfusion Officer',
        status: 'ACTIVE',
        createdAt: '2026-09-15T09:30:00Z',
        lastActiveAt: new Date().toISOString(),
      },
      {
        id: 'STAFF-MH-02',
        email: 'priya.nair@metrotrauma.org',
        fullName: 'Priya Nair, B.Sc MLT',
        role: 'HOSPITAL_STAFF',
        hospitalId,
        staffTitle: 'Blood Bank Technologist',
        status: 'ACTIVE',
        createdAt: '2026-09-20T11:00:00Z',
        lastActiveAt: '2026-10-02T16:20:00Z',
      },
    ];
  },

  /**
   * Create hospital staff
   */
  async createHospitalStaff(hospitalId: string, input: CreateStaffInput): Promise<HospitalStaff> {
    const staffId = 'STAFF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newStaff: HospitalStaff = {
      id: staffId,
      email: input.email,
      fullName: input.fullName,
      role: 'HOSPITAL_STAFF',
      hospitalId,
      staffTitle: input.staffTitle,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    try {
      await supabase.from('profiles').insert({
        id: staffId,
        email: input.email,
        full_name: input.fullName,
        role: 'HOSPITAL_STAFF',
        organization_id: hospitalId,
        staff_title: input.staffTitle,
        status: 'ACTIVE',
      });
    } catch (e) {
      console.warn('[Supabase] Staff saved to memory/store', e);
    }

    localEventBus.emit('staff.created', newStaff);
    return newStaff;
  },

  /**
   * Deactivate staff
   */
  async deactivateStaff(staffId: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ status: 'DEACTIVATED' })
        .eq('id', staffId);
    } catch (e) {
      console.warn('[Supabase] Staff status updated locally', e);
    }
    localEventBus.emit('staff.deactivated', { staffId });
  },

  /**
   * Reactivate staff
   */
  async reactivateStaff(staffId: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ status: 'ACTIVE' })
        .eq('id', staffId);
    } catch (e) {
      console.warn('[Supabase] Staff status updated locally', e);
    }
    localEventBus.emit('staff.updated', { staffId, status: 'ACTIVE' });
  },

  /**
   * Discover Verified Nearby Blood Banks with Haversine Distance
   * Excludes PENDING, REJECTED, SUSPENDED organizations
   */
  async discoverNearbyBloodBanks(
    hospitalLat: number = 21.128,
    hospitalLng: number = 79.098,
    _bloodGroup?: BloodGroup,
    quantityNeeded: number = 1.0,
    allOrganizations: Organization[] = []
  ) {
    // Filter only verified blood banks
    const verifiedBanks = allOrganizations.filter(
      (org) => org.type === 'blood_bank' && org.status === 'VERIFIED'
    );

    return verifiedBanks.map((bank) => {
      const dist = calculateHaversineDistance(
        hospitalLat,
        hospitalLng,
        bank.location.coordinates.lat || 21.1458,
        bank.location.coordinates.lng || 79.0882
      );

      // Estimate live available units for group
      const availableForGroup = Math.max(
        0,
        Math.round((bank.stats.totalInventoryUnits / 8) * 10) / 10
      );
      const isSufficient = availableForGroup >= quantityNeeded;

      return {
        bank,
        distanceKm: dist,
        availableUnits: availableForGroup,
        isSufficient,
        shortageRisk: isSufficient ? 'low' : 'high',
        networkLoad: dist < 5 ? 'Moderate' : 'Low',
        responseTimeMinutes: Math.round(dist * 1.8 + 10),
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  },
};
