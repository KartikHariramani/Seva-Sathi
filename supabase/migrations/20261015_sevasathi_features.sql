-- ============================================================================
-- Seva Sathi: Intelligent Healthcare Coordination Network
-- Database Migration: Near-Expiry Rescue, Smart Document Import, Donor Mobilisation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NEAR-EXPIRY ALERTS TABLE (Rescue Module)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.near_expiry_alerts (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'NEA-20261015-01'
  blood_bank_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blood_bank_name VARCHAR(255) NOT NULL,
  blood_bank_city VARCHAR(128) NOT NULL,
  blood_bank_contact VARCHAR(64) NOT NULL,
  latitude NUMERIC(10, 6) DEFAULT 21.1458,
  longitude NUMERIC(10, 6) DEFAULT 79.0882,
  blood_group VARCHAR(8) NOT NULL,
  component VARCHAR(64) NOT NULL DEFAULT 'Whole Blood',
  quantity_units NUMERIC(6, 2) NOT NULL CHECK (quantity_units > 0),
  batch_or_unit_id VARCHAR(64) NOT NULL,
  collection_date DATE,
  expiry_timestamp TIMESTAMPTZ NOT NULL,
  storage_condition VARCHAR(128) NOT NULL DEFAULT 'Cold Storage 2°C - 6°C',
  handling_constraints TEXT NOT NULL DEFAULT 'Strict cold-chain transit required',
  response_deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESERVED', 'TRANSFERRED', 'EXPIRED', 'CANCELLED')),
  claimed_by_hospital_id VARCHAR(64) REFERENCES public.organizations(id) ON DELETE SET NULL,
  claimed_by_hospital_name VARCHAR(255),
  reservation_id VARCHAR(32),
  transfer_id VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by blood group and status
CREATE INDEX IF NOT EXISTS idx_near_expiry_group_status ON public.near_expiry_alerts(blood_group, status);
CREATE INDEX IF NOT EXISTS idx_near_expiry_deadline ON public.near_expiry_alerts(response_deadline);

-- ----------------------------------------------------------------------------
-- 2. SMART INVENTORY IMPORTS TABLE (Spreadsheet, PDF, Image Ingestion)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_imports (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'IMP-20261015-812'
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(16) NOT NULL CHECK (file_type IN ('csv', 'excel', 'pdf', 'image')),
  file_size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by VARCHAR(128) NOT NULL,
  blood_bank_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blood_bank_name VARCHAR(255) NOT NULL,
  operation VARCHAR(16) NOT NULL CHECK (operation IN ('SNAPSHOT', 'ADJUSTMENT')),
  status VARCHAR(32) NOT NULL DEFAULT 'REVIEW_PENDING' CHECK (status IN ('UPLOADED', 'PARSING', 'REVIEW_PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'FAILED')),
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  uncertain_rows INT NOT NULL DEFAULT 0,
  rejected_rows INT NOT NULL DEFAULT 0,
  records JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_url TEXT,
  audit_notes TEXT,
  approved_by VARCHAR(128),
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inventory_imports_bank ON public.inventory_imports(blood_bank_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. DONOR PROFILES TABLE (Verified Volunteer Network)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donor_profiles (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'DNR-2026-001'
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(64) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  city VARCHAR(128) NOT NULL,
  latitude NUMERIC(10, 6) DEFAULT 21.1458,
  longitude NUMERIC(10, 6) DEFAULT 79.0882,
  is_available BOOLEAN NOT NULL DEFAULT true,
  last_donation_date DATE,
  consent_emergency_alerts BOOLEAN NOT NULL DEFAULT true,
  consent_future_drives BOOLEAN NOT NULL DEFAULT true,
  preferred_channel VARCHAR(32) NOT NULL DEFAULT 'IN_APP' CHECK (preferred_channel IN ('IN_APP', 'TELEGRAM', 'SMS')),
  telegram_chat_id VARCHAR(64),
  total_donations INT NOT NULL DEFAULT 0,
  reward_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_group_city ON public.donor_profiles(blood_group, city, is_available);

-- ----------------------------------------------------------------------------
-- 4. EMERGENCY DONOR NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donor_notifications (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'EDN-20261015-01'
  request_id VARCHAR(64) NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id VARCHAR(64) NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  donor_name VARCHAR(255) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  hospital_name VARCHAR(255) NOT NULL,
  hospital_city VARCHAR(128) NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  urgency VARCHAR(16) NOT NULL CHECK (urgency IN ('critical', 'high', 'routine')),
  required_units NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
  message_text TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'ACCEPTED', 'DECLINED', 'UNANSWERED')),
  channel VARCHAR(32) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'TELEGRAM', 'SMS')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_donor_notifs_req ON public.donor_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_notifs_donor ON public.donor_notifications(donor_id);

-- ----------------------------------------------------------------------------
-- 5. ATOMIC RPC: CLAIM NEAR-EXPIRY RESCUE ALERT
-- Prevents double-claiming, atomicity guarantees, writes reservation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_near_expiry_alert(
  p_alert_id VARCHAR(64),
  p_hospital_id VARCHAR(64),
  p_hospital_name VARCHAR(255),
  p_transfusion_officer VARCHAR(128),
  p_clinical_indication TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_alert RECORD;
  v_reservation_id VARCHAR(32);
BEGIN
  -- Row lock alert to prevent concurrent claiming
  SELECT * INTO v_alert
  FROM public.near_expiry_alerts
  WHERE id = p_alert_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alert not found');
  END IF;

  IF v_alert.status != 'ACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alert is already claimed or expired');
  END IF;

  v_reservation_id := 'RES-EXP-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);

  -- Update alert status
  UPDATE public.near_expiry_alerts
  SET
    status = 'RESERVED',
    claimed_by_hospital_id = p_hospital_id,
    claimed_by_hospital_name = p_hospital_name,
    reservation_id = v_reservation_id,
    updated_at = NOW()
  WHERE id = p_alert_id;

  -- Create supply reservation
  INSERT INTO public.blood_reservations (
    reservation_id,
    request_id,
    blood_bank_id,
    blood_bank_name,
    hospital_id,
    hospital_name,
    blood_group,
    quantity,
    status,
    expires_at,
    created_by,
    notes
  ) VALUES (
    v_reservation_id,
    p_alert_id,
    v_alert.blood_bank_id,
    v_alert.blood_bank_name,
    p_hospital_id,
    p_hospital_name,
    v_alert.blood_group,
    v_alert.quantity_units,
    'ACTIVE',
    v_alert.response_deadline,
    p_transfusion_officer,
    'Near-Expiry Rescue claim for: ' || p_clinical_indication
  );

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'alert_id', p_alert_id,
    'units', v_alert.quantity_units,
    'blood_group', v_alert.blood_group
  );
END;
$$ LANGUAGE plpgsql;
