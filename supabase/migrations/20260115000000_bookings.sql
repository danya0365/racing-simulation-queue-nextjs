-- Timezone-Aware Bookings System
-- Created: 2026-01-14
-- Description: New bookings table with full TIMESTAMPTZ support for global timezone handling
-- This is SEPARATE from advance_bookings to allow gradual migration and avoid breaking existing functionality

-- ============================================================
-- ENUM TYPE
-- ============================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
    END IF;
END $$;

-- ============================================================
-- MAIN TABLE: bookings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    
    -- TIMESTAMPTZ: Stores exact moment in time (UTC internally)
    -- This solves all timezone issues - always stored as UTC, converted on display
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Duration in minutes for convenience
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Business timezone (IANA format) for display purposes
    -- This determines how times are shown to users
    business_timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    
    -- Status
    status public.booking_status NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bookings_end_after_start CHECK (end_at > start_at),
    CONSTRAINT bookings_valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480) -- Max 8 hours
);

-- ============================================================
-- GENERATED COLUMNS (for fast queries)
-- Note: PostgreSQL 12+ required for GENERATED ALWAYS AS
-- These are computed from start_at/end_at using business_timezone
-- ============================================================

-- Add generated columns for fast local-time queries
-- These allow us to query by "local date" without timezone conversion at query time
DO $$
BEGIN
    -- local_date: The date in business timezone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_date'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_date DATE GENERATED ALWAYS AS (
            (start_at AT TIME ZONE business_timezone)::DATE
        ) STORED;
    END IF;
    
    -- local_start_time: Start time in business timezone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_start_time'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_start_time TIME GENERATED ALWAYS AS (
            (start_at AT TIME ZONE business_timezone)::TIME
        ) STORED;
    END IF;
    
    -- local_end_time: End time in business timezone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_end_time'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_end_time TIME GENERATED ALWAYS AS (
            (end_at AT TIME ZONE business_timezone)::TIME
        ) STORED;
    END IF;
    
    -- is_cross_midnight: True if booking spans midnight in business timezone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'is_cross_midnight'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN is_cross_midnight BOOLEAN GENERATED ALWAYS AS (
            (start_at AT TIME ZONE business_timezone)::DATE != 
            (end_at AT TIME ZONE business_timezone)::DATE
        ) STORED;
    END IF;
    
    -- local_end_date: The date when booking ends (for cross-midnight queries)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_end_date'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_end_date DATE GENERATED ALWAYS AS (
            (end_at AT TIME ZONE business_timezone)::DATE
        ) STORED;
    END IF;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings are viewable by admins or owners"
    ON public.bookings FOR SELECT
    USING (
        public.is_moderator_or_admin() 
        OR 
        EXISTS (
            SELECT 1 FROM public.customers c
            JOIN public.profiles p ON p.id = c.profile_id
            WHERE c.id = public.bookings.customer_id 
            AND p.auth_id = auth.uid()
        )
    );

-- Only admins/moderators can insert directly. Guests must use rpc_create_booking.
CREATE POLICY "Bookings can be created by admins"
    ON public.bookings FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Bookings can be updated by admins/moderators"
    ON public.bookings FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Bookings can be deleted by admins/moderators"
    ON public.bookings FOR DELETE
    USING (public.is_moderator_or_admin());

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary query pattern: Get bookings for a machine on a specific date
CREATE INDEX IF NOT EXISTS idx_bookings_machine_local_date 
    ON public.bookings(machine_id, local_date);

-- Cross-midnight queries: bookings that end on a specific date
CREATE INDEX IF NOT EXISTS idx_bookings_machine_local_end_date 
    ON public.bookings(machine_id, local_end_date);

-- Time range queries (for overlap detection)
CREATE INDEX IF NOT EXISTS idx_bookings_machine_time_range 
    ON public.bookings(machine_id, start_at, end_at);

-- Customer lookup
CREATE INDEX IF NOT EXISTS idx_bookings_customer 
    ON public.bookings(customer_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON public.bookings(status);

-- Combined index for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_machine_date_status 
    ON public.bookings(machine_id, local_date, status);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC FUNCTION: Get schedule for a specific date
-- Handles cross-midnight bookings correctly
-- Privacy: Hide phone for guests, show for admin/owner
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_bookings_schedule(
    p_machine_id UUID,
    p_date DATE,
    p_timezone TEXT DEFAULT 'Asia/Bangkok',
    p_customer_id UUID DEFAULT NULL  -- Optional: for ownership verification
)
RETURNS TABLE (
    booking_id UUID,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    local_start_time TIME,
    local_end_time TIME,
    duration_minutes INTEGER,
    is_cross_midnight BOOLEAN,
    status TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    is_owner BOOLEAN  -- Indicates if this is the caller's booking
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user is admin/moderator once
    v_is_admin := public.is_moderator_or_admin();
    
    RETURN QUERY
    SELECT 
        b.id AS booking_id,
        b.start_at,
        b.end_at,
        b.local_start_time,
        b.local_end_time,
        b.duration_minutes,
        b.is_cross_midnight,
        b.status::TEXT,
        c.name AS customer_name,
        -- Privacy logic for phone:
        -- 1. Admin/Moderator: Full phone
        -- 2. Owner (customer_id matches): Full phone
        -- 3. Others: NULL (hidden)
        CASE 
            WHEN v_is_admin THEN c.phone
            WHEN p_customer_id IS NOT NULL AND b.customer_id = p_customer_id THEN c.phone
            ELSE NULL
        END AS customer_phone,
        -- Is this the caller's booking?
        (p_customer_id IS NOT NULL AND b.customer_id = p_customer_id) AS is_owner
    FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    WHERE b.machine_id = p_machine_id
      AND b.status IN ('pending', 'confirmed')
      AND (
          -- Bookings that START on this date
          b.local_date = p_date
          OR
          -- Bookings that CROSS midnight and END on this date (started yesterday, ends today)
          (b.is_cross_midnight AND b.local_end_date = p_date)
      )
    ORDER BY b.start_at;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Create a new booking
-- Accepts local time + timezone and converts to UTC
-- ============================================================

DROP FUNCTION IF EXISTS public.rpc_create_booking(TEXT, TEXT, UUID, INTEGER, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.rpc_create_booking(
    p_machine_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_local_date DATE,
    p_local_start_time TIME,
    p_duration_minutes INTEGER,
    p_timezone TEXT DEFAULT 'Asia/Bangkok',
    p_notes TEXT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL -- Added for ownership verification
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_booking_id UUID;
    v_start_at TIMESTAMPTZ;
    v_end_at TIMESTAMPTZ;
    v_conflict_count INTEGER;
    v_existing_customer RECORD;
    v_current_profile_id UUID;
BEGIN
    -- Input sanitization
    p_customer_phone := TRIM(p_customer_phone);
    p_customer_name := TRIM(p_customer_name);

    -- Prevent concurrent duplicate creation for the same phone number
    PERFORM pg_advisory_xact_lock(hashtext('customer_creation_' || p_customer_phone));

    -- Get current profile id once
    v_current_profile_id := public.get_active_profile_id();

    -- Convert local date+time to TIMESTAMPTZ
    v_start_at := (p_local_date || ' ' || p_local_start_time)::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_at := v_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check for time slot conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE machine_id = p_machine_id
      AND status IN ('pending', 'confirmed')
      AND start_at < v_end_at 
      AND end_at > v_start_at;
    
    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น'
        );
    END IF;
    
    -- Get customer by phone
    SELECT * INTO v_existing_customer
    FROM public.customers
    WHERE phone = p_customer_phone
    LIMIT 1;
    
    -- Fix: Use FOUND because "row IS NOT NULL" returns false if ANY column is null (e.g. email, profile_id)
    IF FOUND THEN
        -- SECURITY CHECK 1: If customer has a profile, MUST be logged in as that user to edit
        IF v_existing_customer.profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_existing_customer.profile_id THEN
                RETURN json_build_object(
                    'success', false, 
                    'error', 'เบอร์นี้ผูกกับบัญชีสมาชิก กรุณาเข้าสู่ระบบก่อนทำรายการ'
                );
            END IF;
        END IF;

        -- SECURITY CHECK 2: If phone exists, p_customer_id MUST match
        IF p_customer_id IS NULL OR v_existing_customer.id != p_customer_id THEN
            RETURN json_build_object(
                'success', false, 
                'error', 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว กรุณาตรวจสอบหรือแจ้งพนักงาน'
            );
        END IF;

        v_customer_id := v_existing_customer.id;

        -- Update name if matched (Authorized update)
        IF v_existing_customer.name != p_customer_name THEN
            UPDATE public.customers
            SET name = p_customer_name, updated_at = NOW()
            WHERE id = v_customer_id;
        END IF;
    ELSE
        -- New customer
        INSERT INTO public.customers (name, phone, profile_id)
        VALUES (p_customer_name, p_customer_phone, v_current_profile_id)
        RETURNING id INTO v_customer_id;
    END IF;
    
    -- Create the booking
    INSERT INTO public.bookings (
        machine_id,
        customer_id,
        start_at,
        end_at,
        duration_minutes,
        business_timezone,
        status,
        notes
    ) VALUES (
        p_machine_id,
        v_customer_id,
        v_start_at,
        v_end_at,
        p_duration_minutes,
        p_timezone,
        'confirmed',
        p_notes
    )
    RETURNING id INTO v_booking_id;
    
    -- Return the created booking
    RETURN (
        SELECT json_build_object(
            'success', true,
            'booking', json_build_object(
                'id', b.id,
                'machineId', b.machine_id,
                'customerId', b.customer_id,
                'customerName', c.name,
                'customerPhone', c.phone,
                'startAt', b.start_at,
                'endAt', b.end_at,
                'localDate', b.local_date,
                'localStartTime', b.local_start_time::TEXT,
                'localEndTime', b.local_end_time::TEXT,
                'durationMinutes', b.duration_minutes,
                'businessTimezone', b.business_timezone,
                'isCrossMidnight', b.is_cross_midnight,
                'status', b.status,
                'createdAt', b.created_at
            )
        )
        FROM public.bookings b
        JOIN public.customers c ON c.id = b.customer_id
        WHERE b.id = v_booking_id
    );
END;
$$;

-- ============================================================
-- RPC FUNCTION: Cancel a booking
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_cancel_booking(
    p_booking_id UUID,
    p_customer_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
    v_profile_id UUID;
    v_current_profile_id UUID;
BEGIN
    -- Get current profile
    v_current_profile_id := public.get_active_profile_id();

    -- Get the booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;
    
    IF v_booking IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบการจอง');
    END IF;

    -- Get profile id
    SELECT profile_id INTO v_profile_id
    FROM public.customers
    WHERE id = v_booking.customer_id;
    
    -- Check permission: admin or owner
    IF NOT public.is_moderator_or_admin() THEN
        -- Ownership check
        IF p_customer_id IS NULL OR v_booking.customer_id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ยกเลิกการจองนี้');
        END IF;

        -- Profile Protection check
        IF v_profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_profile_id THEN
                RETURN json_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบเพื่อยกเลิก');
            END IF;
        END IF;
    END IF;
    
    -- Cancel the booking
    UPDATE public.bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get my bookings by customer_id
-- SECURE: Only returns bookings for the provided customer_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_my_bookings(
    p_customer_id UUID
)
RETURNS TABLE (
    booking_id UUID,
    machine_id UUID,
    machine_name TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    local_date DATE,
    local_start_time TIME,
    local_end_time TIME,
    duration_minutes INTEGER,
    business_timezone TEXT,
    is_cross_midnight BOOLEAN,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only return bookings that belong to this customer_id
    RETURN QUERY
    SELECT 
        b.id AS booking_id,
        b.machine_id,
        m.name AS machine_name,
        c.name AS customer_name,
        c.phone AS customer_phone,
        b.start_at,
        b.end_at,
        b.local_date,
        b.local_start_time,
        b.local_end_time,
        b.duration_minutes,
        b.business_timezone,
        b.is_cross_midnight,
        b.status::TEXT,
        b.created_at
    FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    JOIN public.machines m ON m.id = b.machine_id
    WHERE b.customer_id = p_customer_id
    ORDER BY b.start_at DESC
    LIMIT 50;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get bookings by machine and date (Privacy Protected)
-- Phone shown only for: Admin/Moderator OR Owner
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_bookings_by_machine_date(
    p_machine_id UUID,
    p_date DATE,
    p_customer_id UUID DEFAULT NULL  -- Optional: for ownership checking
)
RETURNS TABLE (
    booking_id UUID,
    machine_id UUID,
    customer_name TEXT,
    customer_phone TEXT,  -- NULL if not owner/admin
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    local_date DATE,
    local_start_time TIME,
    local_end_time TIME,
    duration_minutes INTEGER,
    business_timezone TEXT,
    is_cross_midnight BOOLEAN,
    status TEXT,
    is_owner BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := public.is_moderator_or_admin();
    
    RETURN QUERY
    SELECT 
        b.id AS booking_id,
        b.machine_id,
        c.name AS customer_name,
        -- Privacy: Phone shown only for admin/moderator or owner
        CASE 
            WHEN v_is_admin THEN c.phone
            WHEN p_customer_id IS NOT NULL AND b.customer_id = p_customer_id THEN c.phone
            ELSE NULL
        END AS customer_phone,
        b.start_at,
        b.end_at,
        b.local_date,
        b.local_start_time,
        b.local_end_time,
        b.duration_minutes,
        b.business_timezone,
        b.is_cross_midnight,
        b.status::TEXT,
        (p_customer_id IS NOT NULL AND b.customer_id = p_customer_id) AS is_owner,
        b.created_at
    FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    WHERE b.machine_id = p_machine_id
      AND b.status IN ('pending', 'confirmed')
      AND (
          b.local_date = p_date
          OR (b.is_cross_midnight AND b.local_end_date = p_date)
      )
    ORDER BY b.start_at;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Check if a time slot is available
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_is_booking_slot_available(
    p_machine_id UUID,
    p_local_date DATE,
    p_local_start_time TIME,
    p_duration_minutes INTEGER,
    p_timezone TEXT DEFAULT 'Asia/Bangkok'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_at TIMESTAMPTZ;
    v_end_at TIMESTAMPTZ;
    v_conflict_count INTEGER;
BEGIN
    -- Convert local date+time to TIMESTAMPTZ
    v_start_at := (p_local_date || ' ' || p_local_start_time)::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_at := v_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check for conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE machine_id = p_machine_id
      AND status IN ('pending', 'confirmed')
      AND start_at < v_end_at 
      AND end_at > v_start_at;
    
    RETURN v_conflict_count = 0;
END;
$$;

-- ============================================================
-- SESSION LOGS TABLE (references new bookings table)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('START', 'STOP')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking logs are viewable by everyone"
    ON public.booking_logs FOR SELECT
    USING (true);

CREATE POLICY "Booking logs can be inserted by authenticated users"
    ON public.booking_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id 
    ON public.booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_recorded_at 
    ON public.booking_logs(recorded_at);

-- ============================================================
-- RPC FUNCTION: Log session action
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_log_booking(
    p_booking_id UUID,
    p_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.booking_logs (booking_id, action)
    VALUES (p_booking_id, p_action);
    
    RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get booking session logs
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_booking_logs(
    p_booking_ids UUID[]
)
RETURNS TABLE (
    booking_id UUID,
    action TEXT,
    recorded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.booking_id,
        bl.action,
        bl.recorded_at
    FROM public.booking_logs bl
    WHERE bl.booking_id = ANY(p_booking_ids)
    ORDER BY bl.recorded_at ASC;
END;
$$;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON public.bookings TO anon, authenticated;
GRANT ALL ON public.booking_logs TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.rpc_get_bookings_schedule(UUID, DATE, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_create_booking(UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_booking(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_bookings(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_bookings_by_machine_date(UUID, DATE, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_is_booking_slot_available(UUID, DATE, TIME, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_log_booking(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_booking_logs(UUID[]) TO anon, authenticated;
