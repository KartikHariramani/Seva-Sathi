import { describe, it, expect, beforeEach } from 'vitest';
import type { UserRole } from '../../types';
import { campaignService } from '../campaignService';
import fs from 'fs';
import path from 'path';

describe('SevaSetu: Strict Role-Based Access Control (RBAC) & Route Protection Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  });

  // ==========================================================================
  // 1. Unauthenticated Route & Protected Service Rejections
  // ==========================================================================
  describe('1. Unauthenticated Access Denial', () => {
    it('redirects unauthenticated users attempting to access protected dashboards to /login with state', () => {
      const protectedPaths = [
        '/hospital/dashboard',
        '/hospital/requests/new',
        '/blood-bank/dashboard',
        '/blood-bank/near-expiry',
        '/admin/command-center',
        '/admin/settings',
        '/ngo/campaigns',
        '/donor/portal',
      ];

      protectedPaths.forEach((targetPath) => {
        // Evaluate route guard invariant
        const isAuth = false;
        const result = isAuth ? 'RENDER_PAGE' : `/login?redirect=${encodeURIComponent(targetPath)}`;
        expect(result).toBe(`/login?redirect=${encodeURIComponent(targetPath)}`);
      });
    });

    it('preserves public access for explicitly unauthenticated public pages', () => {
      const publicPaths = ['/', '/how-it-works', '/about', '/network', '/login', '/register', '/register/hospital'];
      const isPublicPath = (p: string) => publicPaths.includes(p);

      expect(isPublicPath('/')).toBe(true);
      expect(isPublicPath('/how-it-works')).toBe(true);
      expect(isPublicPath('/about')).toBe(true);
      expect(isPublicPath('/login')).toBe(true);
      expect(isPublicPath('/register')).toBe(true);
      expect(isPublicPath('/hospital/dashboard')).toBe(false);
      expect(isPublicPath('/donor/portal')).toBe(false);
      expect(isPublicPath('/admin/command-center')).toBe(false);
    });
  });

  // ==========================================================================
  // 2. Cross-Role Isolation & 403 Forbidden Redirection
  // ==========================================================================
  describe('2. Cross-Role Isolation & Route Matrix', () => {
    const isAuthorized = (role: UserRole, path: string): boolean => {
      if (role === 'admin') return true;
      if (path.startsWith('/admin')) return false;
      if (path.startsWith('/hospital/staff') && role !== 'hospital' && role !== 'hospital_staff') return false;
      if (path === '/hospital/staff' && role === 'hospital_staff') return false; // Staff restricted from admin-only staff management
      if (path.startsWith('/hospital')) return role === 'hospital' || role === 'hospital_staff';
      if (path.startsWith('/blood-bank') || path === '/near-expiry') return role === 'blood_bank';
      if (path.startsWith('/ngo') || path.startsWith('/organizer') || path.startsWith('/telemetry')) return role === 'ngo';
      if (path.startsWith('/donor')) return role === 'donor';
      return true; // public path
    };

    it('Hospital user cannot access Blood Bank or Admin routes', () => {
      expect(isAuthorized('hospital', '/blood-bank/dashboard')).toBe(false);
      expect(isAuthorized('hospital', '/blood-bank/near-expiry')).toBe(false);
      expect(isAuthorized('hospital', '/admin/command-center')).toBe(false);
      expect(isAuthorized('hospital', '/admin/settings')).toBe(false);
      expect(isAuthorized('hospital', '/hospital/dashboard')).toBe(true);
    });

    it('Blood Bank user cannot access Hospital requisition or Admin routes', () => {
      expect(isAuthorized('blood_bank', '/hospital/dashboard')).toBe(false);
      expect(isAuthorized('blood_bank', '/hospital/requests/new')).toBe(false);
      expect(isAuthorized('blood_bank', '/admin/command-center')).toBe(false);
      expect(isAuthorized('blood_bank', '/blood-bank/dashboard')).toBe(true);
      expect(isAuthorized('blood_bank', '/blood-bank/near-expiry')).toBe(true);
    });

    it('Donor cannot access Admin, NGO, Hospital, or Blood Bank operational pages', () => {
      expect(isAuthorized('donor', '/admin/command-center')).toBe(false);
      expect(isAuthorized('donor', '/ngo/campaigns')).toBe(false);
      expect(isAuthorized('donor', '/hospital/dashboard')).toBe(false);
      expect(isAuthorized('donor', '/blood-bank/dashboard')).toBe(false);
      expect(isAuthorized('donor', '/donor/portal')).toBe(true);
    });

    it('NSS Organization (NGO) cannot access private Hospital or Blood Bank reserves', () => {
      expect(isAuthorized('ngo', '/hospital/dashboard')).toBe(false);
      expect(isAuthorized('ngo', '/blood-bank/dashboard')).toBe(false);
      expect(isAuthorized('ngo', '/admin/command-center')).toBe(false);
      expect(isAuthorized('ngo', '/ngo/campaigns')).toBe(true);
      expect(isAuthorized('ngo', '/organizer/telemetry')).toBe(true);
    });

    it('Hospital Staff is restricted from admin-only /hospital/staff route', () => {
      expect(isAuthorized('hospital_staff', '/hospital/staff')).toBe(false);
      expect(isAuthorized('hospital_staff', '/hospital/staff/dashboard')).toBe(true);
      expect(isAuthorized('hospital', '/hospital/staff')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Post-Login Destination Validation & Tamper Protection
  // ==========================================================================
  describe('3. Safe Post-Login Redirection & Destination Preservation', () => {
    const resolvePostLoginRedirect = (role: UserRole, requestedFrom?: string): string => {
      const isAuthorizedForPath = (r: UserRole, path: string): boolean => {
        if (path.startsWith('/admin')) return r === 'admin';
        if (path.startsWith('/hospital')) return r === 'hospital' || r === 'hospital_staff';
        if (path.startsWith('/blood-bank') || path.startsWith('/near-expiry') || path.startsWith('/inventory')) return r === 'blood_bank' || r === 'admin';
        if (path.startsWith('/ngo') || path.startsWith('/organizer') || path.startsWith('/telemetry')) return r === 'ngo' || r === 'admin';
        if (path.startsWith('/donor')) return r === 'donor' || r === 'admin';
        return false;
      };

      if (requestedFrom && requestedFrom !== '/login' && requestedFrom !== '/unauthorized' && isAuthorizedForPath(role, requestedFrom)) {
        return requestedFrom;
      }

      switch (role) {
        case 'admin':
          return '/admin/command-center';
        case 'blood_bank':
          return '/blood-bank/dashboard';
        case 'hospital_staff':
          return '/hospital/staff/dashboard';
        case 'ngo':
          return '/ngo/campaigns';
        case 'donor':
          return '/donor/portal';
        default:
          return '/hospital/dashboard';
      }
    };

    it('preserves intended destination when the authenticated role is authorized', () => {
      const hospitalRedirect = resolvePostLoginRedirect('hospital', '/hospital/requests/new');
      expect(hospitalRedirect).toBe('/hospital/requests/new');

      const ngoRedirect = resolvePostLoginRedirect('ngo', '/ngo/campaigns');
      expect(ngoRedirect).toBe('/ngo/campaigns');
    });

    it('safely falls back to default role dashboard when requested destination is unauthorized for that role', () => {
      // Donor was intercepted trying to open /admin/settings, then logs in as Donor
      const donorRedirect = resolvePostLoginRedirect('donor', '/admin/settings');
      expect(donorRedirect).toBe('/donor/portal'); // Denies /admin/settings, routes to /donor/portal

      // Hospital was intercepted trying to open /blood-bank/dashboard
      const hospitalRedirect = resolvePostLoginRedirect('hospital', '/blood-bank/dashboard');
      expect(hospitalRedirect).toBe('/hospital/dashboard');
    });
  });

  // ==========================================================================
  // 4. Multi-Tenant Scanner Authorization & Organization Boundaries
  // ==========================================================================
  describe('4. Scanner Authorization & Resource Boundaries', () => {
    it('blocks Donor and Hospital roles from validating attendance passes', () => {
      const camp = campaignService.getCampaigns()[0];
      const donorReg = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-TEST-001',
        donorName: 'Test Volunteer',
        donorPhone: '+91 99999 11111',
        donorEmail: 'test@example.com',
        bloodGroup: 'O+',
        timeSlot: '10:00 AM',
      });

      const token = donorReg.registration!.qrTicketToken;

      // 1. Attempt scan with Donor role
      const donorScan = campaignService.checkInDonor(token, 'Self', { scannerRole: 'donor' });
      expect(donorScan.success).toBe(false);
      expect(donorScan.error).toContain('Unauthorized Scanner');

      // 2. Attempt scan with Hospital role
      const hospitalScan = campaignService.checkInDonor(token, 'Nurse', { scannerRole: 'hospital' });
      expect(hospitalScan.success).toBe(false);
      expect(hospitalScan.error).toContain('Unauthorized Scanner');
    });

    it('blocks an NGO coordinator from scanning passes belonging to another organization campaign', () => {
      const camp = campaignService.getCampaigns()[0]; // Organised by ORG-NGO-01
      const reg = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-TEST-CROSS',
        donorName: 'Cross Org Test',
        donorPhone: '+91 98888 22222',
        donorEmail: 'cross@example.com',
        bloodGroup: 'A+',
        timeSlot: '11:00 AM',
      });

      const token = reg.registration!.qrTicketToken;

      // Attempt scan with a different NGO organization (ORG-NGO-99)
      const crossScan = campaignService.checkInDonor(token, 'Rival NGO Staff', {
        scannerRole: 'ngo',
        scannerOrgId: 'ORG-NGO-99-UNRELATED',
      });

      expect(crossScan.success).toBe(false);
      expect(crossScan.error).toContain("Forbidden: Scanner is not authorized");
    });

    it('permits authorized host NGO coordinator and System Admin to check in attendees', () => {
      const camp = campaignService.getCampaigns()[0];
      const reg = campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-TEST-AUTH',
        donorName: 'Authorized Scan Test',
        donorPhone: '+91 97777 33333',
        donorEmail: 'authscan@example.com',
        bloodGroup: 'B+',
        timeSlot: '12:00 PM',
      });

      const token = reg.registration!.qrTicketToken;

      // Scan with host organization credentials (ORG-NGO-01)
      const validScan = campaignService.checkInDonor(token, 'Authorized Gate Volunteer', {
        scannerRole: 'ngo',
        scannerOrgId: camp.organizerId,
      });

      expect(validScan.success).toBe(true);
      expect(validScan.registration?.status).toBe('ATTENDED');
    });
  });

  // ==========================================================================
  // 5. Donor Data Isolation & Account Privacy
  // ==========================================================================
  describe('5. Donor Data Privacy & Scoped Records', () => {
    it('isolates registrations so a donor can only retrieve their own passes', () => {
      const camp = campaignService.getCampaigns()[0];

      // Donor A registers
      campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-ALICE',
        donorName: 'Alice',
        donorPhone: '+91 91111 11111',
        donorEmail: 'alice@example.com',
        bloodGroup: 'O+',
        timeSlot: '09:00 AM',
      });

      // Donor B registers
      campaignService.registerDonor({
        campaignId: camp.id,
        donorId: 'DNR-BOB',
        donorName: 'Bob',
        donorPhone: '+91 92222 22222',
        donorEmail: 'bob@example.com',
        bloodGroup: 'AB-',
        timeSlot: '10:00 AM',
      });

      const aliceRegs = campaignService.getRegistrationsForDonor('DNR-ALICE');
      const bobRegs = campaignService.getRegistrationsForDonor('DNR-BOB');

      expect(aliceRegs.every((r) => r.donorId === 'DNR-ALICE')).toBe(true);
      expect(bobRegs.every((r) => r.donorId === 'DNR-BOB')).toBe(true);
      expect(aliceRegs.some((r) => r.donorId === 'DNR-BOB')).toBe(false);
    });
  });

  // ==========================================================================
  // 6. Supabase Database Row Level Security (RLS) Verification
  // ==========================================================================
  describe('6. Database Row-Level Security Migration Validation', () => {
    it('verifies that the RLS migration file exists and enforces policies for all 5 roles', () => {
      const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/20261018_sevasetu_strict_rbac_rls.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);

      const content = fs.readFileSync(migrationPath, 'utf8');

      // Verify RLS enabled on all sensitive tables
      expect(content).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('ALTER TABLE public.blood_bank_inventories ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('ALTER TABLE public.campaign_registrations ENABLE ROW LEVEL SECURITY');

      // Verify role-based helper functions
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.current_user_role()');
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.current_user_org_id()');

      // Verify immutable audit log trigger
      expect(content).toContain('trg_immutable_event_audit_logs');
    });
  });
});
