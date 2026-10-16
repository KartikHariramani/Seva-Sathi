-- ============================================================================
-- SEVA SATHI: Intelligent Event Mobilisation & Turnout Management Migration
-- Version: 20261017_sevasathi_event_mobilisation.sql
-- ============================================================================

-- 1. Create Campaign Slots Table with Strict Capacity Constraints
CREATE TABLE IF NOT EXISTS public.campaign_slots (
    id VARCHAR(64) PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    confirmed_count INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_count >= 0),
    waitlisted_count INTEGER NOT NULL DEFAULT 0 CHECK (waitlisted_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT slot_capacity_enforced CHECK (registered_count <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_campaign_slots_camp ON public.campaign_slots(campaign_id);

-- 2. Extend Campaign Registrations Table for Lifecycle & Pass Validation
ALTER TABLE public.campaign_registrations 
ADD COLUMN IF NOT EXISTS slot_id VARCHAR(64) REFERENCES public.campaign_slots(id),
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,
ADD COLUMN IF NOT EXISTS turnout_score NUMERIC(4,3) CHECK (turnout_score >= 0.0 AND turnout_score <= 1.0),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_by VARCHAR(64),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ;

-- 3. Telegram Account Links Table
CREATE TABLE IF NOT EXISTS public.telegram_account_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL UNIQUE,
    telegram_chat_id VARCHAR(64) NOT NULL,
    telegram_username VARCHAR(128),
    link_token_used VARCHAR(64),
    is_active BOOLEAN NOT NULL DEFAULT true,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tg_links_chat ON public.telegram_account_links(telegram_chat_id);

-- 4. Event & Mobilisation Audit Logs Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.event_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    affected_entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.event_audit_logs(affected_entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.event_audit_logs(created_at DESC);

-- 5. Atomic RPC: Reserve Campaign Slot with Overbooking Prevention
CREATE OR REPLACE FUNCTION public.reserve_campaign_slot(
    p_campaign_id VARCHAR(64),
    p_slot_id VARCHAR(64),
    p_donor_id VARCHAR(64),
    p_donor_name VARCHAR(128),
    p_donor_phone VARCHAR(32),
    p_donor_email VARCHAR(128),
    p_blood_group VARCHAR(8),
    p_qr_token VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot RECORD;
    v_registration_id VARCHAR(64);
    v_status VARCHAR(32);
    v_waitlist_pos INTEGER := NULL;
BEGIN
    -- Lock slot row to prevent concurrent race-condition overbooking
    SELECT * INTO v_slot 
    FROM public.campaign_slots 
    WHERE id = p_slot_id AND campaign_id = p_campaign_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Specified campaign slot does not exist.');
    END IF;

    -- Evaluate Capacity
    IF v_slot.registered_count < v_slot.capacity THEN
        v_status := 'REGISTERED';
        UPDATE public.campaign_slots 
        SET registered_count = registered_count + 1, updated_at = now() 
        WHERE id = p_slot_id;
    ELSE
        v_status := 'WAITLISTED';
        v_waitlist_pos := v_slot.waitlisted_count + 1;
        UPDATE public.campaign_slots 
        SET waitlisted_count = waitlisted_count + 1, updated_at = now() 
        WHERE id = p_slot_id;
    END IF;

    -- Create registration record
    v_registration_id := 'REG-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 10));

    INSERT INTO public.campaign_registrations (
        id, campaign_id, slot_id, donor_id, donor_name, donor_phone, donor_email,
        blood_group, status, waitlist_position, qr_ticket_token, registered_at
    ) VALUES (
        v_registration_id, p_campaign_id, p_slot_id, p_donor_id, p_donor_name, p_donor_phone, p_donor_email,
        p_blood_group, v_status, v_waitlist_pos, p_qr_token, now()
    );

    -- Record Audit Trail
    INSERT INTO public.event_audit_logs (event_type, actor_id, actor_role, affected_entity, entity_id, metadata)
    VALUES (
        'DONOR_REGISTERED', p_donor_id, 'donor', 'campaign_registrations', v_registration_id,
        jsonb_build_object('slot_id', p_slot_id, 'status', v_status, 'waitlist_position', v_waitlist_pos)
    );

    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_registration_id,
        'status', v_status,
        'waitlist_position', v_waitlist_pos
    );
END;
$$;

-- 6. Atomic RPC: Cancel Registration & Promote Next Waitlist Candidate
CREATE OR REPLACE FUNCTION public.cancel_slot_and_rebalance_waitlist(
    p_registration_id VARCHAR(64),
    p_policy VARCHAR(16) DEFAULT 'FIFO'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reg RECORD;
    v_slot RECORD;
    v_promoted RECORD;
BEGIN
    SELECT * INTO v_reg 
    FROM public.campaign_registrations 
    WHERE id = p_registration_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration not found.');
    END IF;

    IF v_reg.status = 'CANCELLED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration is already cancelled.');
    END IF;

    -- Mark registration cancelled
    UPDATE public.campaign_registrations 
    SET status = 'CANCELLED', cancelled_at = now() 
    WHERE id = p_registration_id;

    -- If this was an active registration (not waitlisted), release capacity and promote next
    IF v_reg.status IN ('REGISTERED', 'CONFIRMED') AND v_reg.slot_id IS NOT NULL THEN
        -- Find next waitlisted donor for this slot
        IF p_policy = 'PREDICTIVE' THEN
            SELECT * INTO v_promoted 
            FROM public.campaign_registrations 
            WHERE slot_id = v_reg.slot_id AND status = 'WAITLISTED'
            ORDER BY turnout_score DESC NULLS LAST, registered_at ASC 
            LIMIT 1 
            FOR UPDATE;
        ELSE
            -- FIFO Default
            SELECT * INTO v_promoted 
            FROM public.campaign_registrations 
            WHERE slot_id = v_reg.slot_id AND status = 'WAITLISTED'
            ORDER BY waitlist_position ASC, registered_at ASC 
            LIMIT 1 
            FOR UPDATE;
        END IF;

        IF FOUND THEN
            -- Promote waitlisted donor to REGISTERED
            UPDATE public.campaign_registrations 
            SET status = 'REGISTERED', waitlist_position = NULL, promoted_at = now() 
            WHERE id = v_promoted.id;

            UPDATE public.campaign_slots 
            SET waitlisted_count = GREATEST(0, waitlisted_count - 1), updated_at = now() 
            WHERE id = v_reg.slot_id;

            -- Audit Promotion
            INSERT INTO public.event_audit_logs (event_type, actor_id, actor_role, affected_entity, entity_id, metadata)
            VALUES (
                'WAITLIST_PROMOTED', 'SYSTEM_SCHEDULER', 'system', 'campaign_registrations', v_promoted.id,
                jsonb_build_object('slot_id', v_reg.slot_id, 'policy', p_policy, 'prior_cancelled_id', p_registration_id)
            );

            RETURN jsonb_build_object(
                'success', true,
                'cancelled_id', p_registration_id,
                'promoted_donor_id', v_promoted.donor_id,
                'promoted_registration_id', v_promoted.id
            );
        ELSE
            -- No waitlist candidates, simply decrement registered count
            UPDATE public.campaign_slots 
            SET registered_count = GREATEST(0, registered_count - 1), updated_at = now() 
            WHERE id = v_reg.slot_id;
        END IF;
    END IF;

    -- Audit Cancellation
    INSERT INTO public.event_audit_logs (event_type, actor_id, actor_role, affected_entity, entity_id, metadata)
    VALUES (
        'SLOT_CANCELLED', v_reg.donor_id, 'donor', 'campaign_registrations', p_registration_id,
        jsonb_build_object('slot_id', v_reg.slot_id)
    );

    RETURN jsonb_build_object('success', true, 'cancelled_id', p_registration_id);
END;
$$;

-- 7. Atomic RPC: Single-Use QR Attendance Check-In
CREATE OR REPLACE FUNCTION public.check_in_donor_qr_atomic(
    p_qr_token VARCHAR(128),
    p_volunteer_id VARCHAR(64) DEFAULT 'VOLUNTEER-GATE-01'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reg RECORD;
BEGIN
    SELECT * INTO v_reg 
    FROM public.campaign_registrations 
    WHERE qr_ticket_token = p_qr_token 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_TICKET',
            'error', 'QR pass token does not match any registered attendee.'
        );
    END IF;

    -- Atomic Duplicate Check
    IF v_reg.status = 'ATTENDED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKED_IN',
            'error', 'Duplicate Check-In Warning: This pass has already been used.',
            'previous_checked_in_at', v_reg.checked_in_at,
            'checked_in_by', v_reg.checked_in_by,
            'donor_name', v_reg.donor_name
        );
    END IF;

    IF v_reg.status = 'CANCELLED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CANCELLED_PASS',
            'error', 'Check-in Rejected: This registration was previously cancelled.'
        );
    END IF;

    IF v_reg.status = 'WAITLISTED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'WAITLIST_NOT_ELIGIBLE',
            'error', 'Check-in Rejected: Donor is still on the waitlist and has not been confirmed for a slot.'
        );
    END IF;

    -- Atomically Mark Attended
    UPDATE public.campaign_registrations 
    SET status = 'ATTENDED', checked_in_at = now(), checked_in_by = p_volunteer_id 
    WHERE id = v_reg.id;

    UPDATE public.campaigns 
    SET attended_count = attended_count + 1, updated_at = now() 
    WHERE id = v_reg.campaign_id;

    -- Record Audit Event
    INSERT INTO public.event_audit_logs (event_type, actor_id, actor_role, affected_entity, entity_id, metadata)
    VALUES (
        'QR_CHECK_IN', p_volunteer_id, 'volunteer', 'campaign_registrations', v_reg.id,
        jsonb_build_object('qr_token', p_qr_token, 'donor_name', v_reg.donor_name, 'blood_group', v_reg.blood_group)
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CHECK_IN_SUCCESS',
        'registration_id', v_reg.id,
        'donor_name', v_reg.donor_name,
        'blood_group', v_reg.blood_group,
        'checked_in_at', now()
    );
END;
$$;
