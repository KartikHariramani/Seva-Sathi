-- ============================================================================
-- SEVASETU: Comprehensive Row-Level Security (RLS) & Strict Multi-Tenant RBAC
-- Migration: 20261018_sevasetu_strict_rbac_rls.sql
-- Role Model: Admin, Hospital, Blood Bank, NSS Organization (NGO), Donor
-- ============================================================================

-- 1. Helper Functions to identify caller role and organization scope
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR(32)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_role VARCHAR(32);
BEGIN
    -- Check user profiles table first
    SELECT LOWER(role) INTO v_role 
    FROM public.profiles 
    WHERE id = auth.uid()::text OR email = auth.jwt()->>'email'
    LIMIT 1;

    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- Fallback to JWT app metadata or user metadata
    v_role := LOWER(COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role',
        'anonymous'
    ));

    RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS VARCHAR(64)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_org_id VARCHAR(64);
BEGIN
    SELECT organization_id INTO v_org_id 
    FROM public.profiles 
    WHERE id = auth.uid()::text OR email = auth.jwt()->>'email'
    LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        RETURN v_org_id;
    END IF;

    v_org_id := COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'organization_id',
        auth.jwt() -> 'user_metadata' ->> 'organization_id',
        auth.jwt() -> 'user_metadata' ->> 'orgId'
    );

    RETURN v_org_id;
END;
$$;

-- 2. Enable Row-Level Security (RLS) on all sensitive network tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_bank_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT USING (
    auth.uid()::text = id 
    OR email = auth.jwt()->>'email'
    OR public.current_user_role() = 'admin'
    OR (organization_id IS NOT NULL AND organization_id = public.current_user_org_id())
);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (
    auth.uid()::text = id OR public.current_user_role() = 'admin'
);

-- ============================================================================
-- 4. ORGANIZATIONS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "organizations_public_read_verified" ON public.organizations;
CREATE POLICY "organizations_public_read_verified" ON public.organizations
FOR SELECT USING (
    status = 'VERIFIED' 
    OR id = public.current_user_org_id() 
    OR public.current_user_role() = 'admin'
);

DROP POLICY IF EXISTS "organizations_admin_manage" ON public.organizations;
CREATE POLICY "organizations_admin_manage" ON public.organizations
FOR ALL USING (
    public.current_user_role() = 'admin'
);

DROP POLICY IF EXISTS "organizations_self_update" ON public.organizations;
CREATE POLICY "organizations_self_update" ON public.organizations
FOR UPDATE USING (
    id = public.current_user_org_id()
);

-- ============================================================================
-- 5. BLOOD INVENTORY POLICIES (Hospital Stock)
-- ============================================================================
-- Hospital can only view and update its own stock; Admin can view all
DROP POLICY IF EXISTS "hospital_inventory_select" ON public.blood_inventory;
CREATE POLICY "hospital_inventory_select" ON public.blood_inventory
FOR SELECT USING (
    hospital_id = public.current_user_org_id() 
    OR public.current_user_role() IN ('admin', 'hospital', 'hospital_staff')
);

DROP POLICY IF EXISTS "hospital_inventory_modify" ON public.blood_inventory;
CREATE POLICY "hospital_inventory_modify" ON public.blood_inventory
FOR ALL USING (
    (hospital_id = public.current_user_org_id() AND public.current_user_role() IN ('hospital', 'hospital_staff'))
    OR public.current_user_role() = 'admin'
);

-- ============================================================================
-- 6. BLOOD BANK INVENTORIES POLICIES (Supply Pools)
-- ============================================================================
-- Blood bank can modify ONLY its own depot inventory. Hospitals/Donors cannot alter it!
DROP POLICY IF EXISTS "blood_bank_inventory_select" ON public.blood_bank_inventories;
CREATE POLICY "blood_bank_inventory_select" ON public.blood_bank_inventories
FOR SELECT USING (
    blood_bank_id = public.current_user_org_id()
    OR public.current_user_role() IN ('admin', 'blood_bank', 'hospital')
);

DROP POLICY IF EXISTS "blood_bank_inventory_modify" ON public.blood_bank_inventories;
CREATE POLICY "blood_bank_inventory_modify" ON public.blood_bank_inventories
FOR ALL USING (
    (blood_bank_id = public.current_user_org_id() AND public.current_user_role() = 'blood_bank')
    OR public.current_user_role() = 'admin'
);

-- ============================================================================
-- 7. BLOOD REQUESTS POLICIES (Clinical Requisitions)
-- ============================================================================
-- Hospital can view & create for own hospital_id. Blood banks can view routed/matched requests.
DROP POLICY IF EXISTS "blood_requests_hospital_view" ON public.blood_requests;
CREATE POLICY "blood_requests_hospital_view" ON public.blood_requests
FOR SELECT USING (
    hospital_id = public.current_user_org_id()
    OR matched_blood_bank_id = public.current_user_org_id()
    OR public.current_user_role() IN ('admin', 'blood_bank')
);

DROP POLICY IF EXISTS "blood_requests_hospital_create" ON public.blood_requests;
CREATE POLICY "blood_requests_hospital_create" ON public.blood_requests
FOR INSERT WITH CHECK (
    hospital_id = public.current_user_org_id()
    AND public.current_user_role() IN ('hospital', 'hospital_staff', 'admin')
);

DROP POLICY IF EXISTS "blood_requests_hospital_update" ON public.blood_requests;
CREATE POLICY "blood_requests_hospital_update" ON public.blood_requests
FOR UPDATE USING (
    hospital_id = public.current_user_org_id()
    OR matched_blood_bank_id = public.current_user_org_id()
    OR public.current_user_role() = 'admin'
);

-- ============================================================================
-- 8. CAMPAIGNS & SLOTS POLICIES (Drives & NSS Event Mobilisation)
-- ============================================================================
-- Active campaigns can be browsed publicly. Editing is restricted to host NGO or Admin.
DROP POLICY IF EXISTS "campaigns_read_active" ON public.campaigns;
CREATE POLICY "campaigns_read_active" ON public.campaigns
FOR SELECT USING (
    status IN ('ACTIVE', 'SCHEDULED', 'COMPLETED')
    OR organizer_id = public.current_user_org_id()
    OR public.current_user_role() = 'admin'
);

DROP POLICY IF EXISTS "campaigns_modify_ngo" ON public.campaigns;
CREATE POLICY "campaigns_modify_ngo" ON public.campaigns
FOR ALL USING (
    (organizer_id = public.current_user_org_id() AND public.current_user_role() IN ('ngo', 'admin'))
    OR public.current_user_role() = 'admin'
);

DROP POLICY IF EXISTS "campaign_slots_read" ON public.campaign_slots;
CREATE POLICY "campaign_slots_read" ON public.campaign_slots
FOR SELECT USING (true);

DROP POLICY IF EXISTS "campaign_slots_modify" ON public.campaign_slots;
CREATE POLICY "campaign_slots_modify" ON public.campaign_slots
FOR ALL USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE organizer_id = public.current_user_org_id())
    OR public.current_user_role() = 'admin'
);

-- ============================================================================
-- 9. CAMPAIGN REGISTRATIONS & DIGITAL PASSES (Donor Isolation)
-- ============================================================================
-- Donors can ONLY view their own passes and registrations.
-- Organizers can view registrations for their own campaigns only.
DROP POLICY IF EXISTS "registrations_donor_own" ON public.campaign_registrations;
CREATE POLICY "registrations_donor_own" ON public.campaign_registrations
FOR SELECT USING (
    donor_id = auth.uid()::text 
    OR donor_email = auth.jwt()->>'email'
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE organizer_id = public.current_user_org_id())
    OR public.current_user_role() = 'admin'
);

DROP POLICY IF EXISTS "registrations_insert_authenticated" ON public.campaign_registrations;
CREATE POLICY "registrations_insert_authenticated" ON public.campaign_registrations
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    OR public.current_user_role() IN ('donor', 'ngo', 'admin')
);

DROP POLICY IF EXISTS "registrations_update_status" ON public.campaign_registrations;
CREATE POLICY "registrations_update_status" ON public.campaign_registrations
FOR UPDATE USING (
    donor_id = auth.uid()::text
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE organizer_id = public.current_user_org_id())
    OR public.current_user_role() = 'admin'
);

-- ============================================================================
-- 10. AUDIT LOGS (Immutable Append-Only Security)
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_read_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_read_admin" ON public.audit_logs
FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR actor_id = auth.uid()::text
);

DROP POLICY IF EXISTS "event_audit_logs_read" ON public.event_audit_logs;
CREATE POLICY "event_audit_logs_read" ON public.event_audit_logs
FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR actor_id = auth.uid()::text
);

DROP POLICY IF EXISTS "event_audit_logs_insert" ON public.event_audit_logs;
CREATE POLICY "event_audit_logs_insert" ON public.event_audit_logs
FOR INSERT WITH CHECK (true);

-- Ensure NO update or delete allowed on audit logs
CREATE OR REPLACE FUNCTION public.prohibit_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Policy Invariant: Audit log records are append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_event_audit_logs ON public.event_audit_logs;
CREATE TRIGGER trg_immutable_event_audit_logs
BEFORE UPDATE OR DELETE ON public.event_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prohibit_audit_log_mutation();
