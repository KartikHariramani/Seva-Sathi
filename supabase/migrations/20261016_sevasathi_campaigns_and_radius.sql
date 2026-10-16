-- ============================================================================
-- Seva Sathi: Intelligent Healthcare Coordination Network
-- Database Migration: NGO Campaigns, Donor Registrations, QR Check-in,
-- Progressive Radius Search & Idempotent Expiry Scheduler Ledger
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND ORGANIZATIONS FOR NGOS
-- ----------------------------------------------------------------------------
-- Add 'ngo' to allowed organization types if constraint exists
DO $$
BEGIN
  ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_type_check;
  ALTER TABLE public.organizations ADD CONSTRAINT organizations_type_check 
    CHECK (type IN ('hospital', 'blood_bank', 'ngo'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 2. BLOOD DONATION CAMPAIGNS TABLE (Managed by NGOs & Social Orgs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'CMP-202610-001'
  title VARCHAR(255) NOT NULL,
  organizer_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organizer_name VARCHAR(255) NOT NULL,
  co_host_blood_bank_id VARCHAR(64) REFERENCES public.organizations(id) ON DELETE SET NULL,
  co_host_blood_bank_name VARCHAR(255),
  venue_name VARCHAR(255) NOT NULL,
  venue_address TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL DEFAULT 'Maharashtra',
  pincode VARCHAR(32) NOT NULL,
  latitude NUMERIC(10, 6) DEFAULT 21.1458,
  longitude NUMERIC(10, 6) DEFAULT 79.0882,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity_target INT NOT NULL DEFAULT 100,
  registered_count INT NOT NULL DEFAULT 0,
  confirmed_count INT NOT NULL DEFAULT 0,
  attended_count INT NOT NULL DEFAULT 0,
  waitlist_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  eligibility_criteria TEXT NOT NULL DEFAULT 'Age 18-65, Weight > 45kg, Hemoglobin > 12.5 g/dL. No donation in past 90 days.',
  contact_phone VARCHAR(64) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  qr_code_secret VARCHAR(64) NOT NULL DEFAULT 'SS-QR-CMP-2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_city_date ON public.campaigns(city, start_date, status);

-- ----------------------------------------------------------------------------
-- 3. CAMPAIGN REGISTRATIONS & ATTENDANCE (With QR Check-In)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_registrations (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'REG-CMP-1001'
  campaign_id VARCHAR(64) NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_id VARCHAR(64) NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  donor_name VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(64) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  time_slot VARCHAR(64) NOT NULL DEFAULT '09:00 AM - 11:00 AM',
  status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'CONFIRMED', 'WAITLISTED', 'ATTENDED', 'CANCELLED', 'NO_SHOW')),
  qr_ticket_token VARCHAR(64) NOT NULL UNIQUE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_in_by VARCHAR(128),
  turnout_probability NUMERIC(4, 3) DEFAULT 0.650,
  notes TEXT,
  UNIQUE(campaign_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_camp_reg_camp ON public.campaign_registrations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_camp_reg_donor ON public.campaign_registrations(donor_id);

-- ----------------------------------------------------------------------------
-- 4. CAMPAIGN ANNOUNCEMENTS & OUTREACH LOG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_announcements (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'ANN-202610-01'
  campaign_id VARCHAR(64) NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(32) NOT NULL CHECK (channel IN ('IN_APP', 'TELEGRAM', 'SMS', 'BROWSER_VOICE')),
  title VARCHAR(255) NOT NULL,
  message_body TEXT NOT NULL,
  target_audience VARCHAR(64) NOT NULL DEFAULT 'CITY_DONORS',
  target_city VARCHAR(128) NOT NULL,
  recipients_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'SENT' CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'PREVIEW_TEST')),
  sent_by VARCHAR(128) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. SCHEDULED EXPIRY CHECK EXECUTION LEDGER (Idempotency Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheduled_job_executions (
  id VARCHAR(64) PRIMARY KEY,
  job_name VARCHAR(64) NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  items_evaluated INT NOT NULL DEFAULT 0,
  alerts_created INT NOT NULL DEFAULT 0,
  notifications_dispatched INT NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 6. ATOMIC QR ATTENDANCE VALIDATION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_in_campaign_donor(
  p_qr_ticket_token VARCHAR(64),
  p_officer_name VARCHAR(128)
)
RETURNS JSONB AS $$
DECLARE
  v_reg RECORD;
BEGIN
  SELECT * INTO v_reg
  FROM public.campaign_registrations
  WHERE qr_ticket_token = p_qr_ticket_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid ticket QR token.');
  END IF;

  IF v_reg.status = 'ATTENDED' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Donor already checked in at ' || to_char(v_reg.checked_in_at, 'HH12:MI AM')
    );
  END IF;

  UPDATE public.campaign_registrations
  SET
    status = 'ATTENDED',
    checked_in_at = NOW(),
    checked_in_by = p_officer_name
  WHERE id = v_reg.id;

  -- Increment campaign attendance counter
  UPDATE public.campaigns
  SET attended_count = attended_count + 1
  WHERE id = v_reg.campaign_id;

  RETURN jsonb_build_object(
    'success', true,
    'donor_name', v_reg.donor_name,
    'blood_group', v_reg.blood_group,
    'checked_in_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;
