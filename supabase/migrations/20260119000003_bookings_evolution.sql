-- ============================================================
-- Phase 4: Bookings Table Evolution
-- Created: 2026-01-19
-- Description: Add total_price column and checked_in status
-- ============================================================

-- ============================================================
-- ADD NEW COLUMNS
-- ============================================================

-- Add total_price column for pricing calculation
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- Add comment
COMMENT ON COLUMN public.bookings.total_price IS 'Calculated total price based on duration and machine hourly rate';

-- ============================================================
-- UPDATE ENUM: Add checked_in status
-- ============================================================

-- Add checked_in to booking_status enum
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction
-- This is safe to run multiple times (IF NOT EXISTS)
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'checked_in';

-- ============================================================
-- UPDATE TRIGGER: Calculate total_price on insert/update
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_booking_total_price()
RETURNS TRIGGER AS $$
DECLARE
    v_hourly_rate DECIMAL;
BEGIN
    -- Get machine hourly rate
    SELECT COALESCE(hourly_rate, 200.00) INTO v_hourly_rate
    FROM public.machines
    WHERE id = NEW.machine_id;
    
    -- Calculate total price if not set
    IF NEW.total_price IS NULL THEN
        NEW.total_price := CEIL(NEW.duration_minutes / 60.0) * v_hourly_rate;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS calculate_booking_price ON public.bookings;

CREATE TRIGGER calculate_booking_price
    BEFORE INSERT OR UPDATE OF duration_minutes, machine_id
    ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_booking_total_price();

-- ============================================================
-- DROP existing functions before recreating with new return types
-- ============================================================

DROP FUNCTION IF EXISTS public.rpc_create_booking(UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_get_bookings_schedule(UUID, DATE, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_get_my_bookings(UUID);

-- ============================================================
-- UPDATE RPC: Create booking with total_price
-- ============================================================

CREATE FUNCTION public.rpc_create_booking(
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
    v_hourly_rate DECIMAL;
    v_total_price DECIMAL;
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
      AND status IN ('pending', 'confirmed', 'checked_in')
      AND start_at < v_end_at 
      AND end_at > v_start_at;
    
    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น'
        );
    END IF;
    
    -- Get machine hourly rate for price calculation
    SELECT COALESCE(hourly_rate, 200.00) INTO v_hourly_rate
    FROM public.machines
    WHERE id = p_machine_id;
    
    v_total_price := CEIL(p_duration_minutes / 60.0) * v_hourly_rate;
    
    -- Get customer by phone
    SELECT * INTO v_existing_customer
    FROM public.customers
    WHERE phone = p_customer_phone
    LIMIT 1;
    
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
        notes,
        total_price
    ) VALUES (
        p_machine_id,
        v_customer_id,
        v_start_at,
        v_end_at,
        p_duration_minutes,
        p_timezone,
        'confirmed',
        p_notes,
        v_total_price
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
                'totalPrice', b.total_price,
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
-- RPC FUNCTION: Check-in booking
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_checkin_booking(
    p_booking_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    -- Get booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    
    IF v_booking IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบการจองนี้');
    END IF;
    
    IF v_booking.status != 'confirmed' THEN
        RETURN json_build_object('success', false, 'error', 'สถานะการจองไม่ถูกต้อง ต้องเป็น confirmed เท่านั้น');
    END IF;
    
    -- Update status to checked_in
    UPDATE public.bookings
    SET status = 'checked_in', updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN json_build_object('success', true, 'message', 'Check-in สำเร็จ');
END;
$$;

-- ============================================================
-- UPDATE RPC: Get bookings schedule with total_price
-- ============================================================

CREATE FUNCTION public.rpc_get_bookings_schedule(
    p_machine_id UUID,
    p_date DATE,
    p_timezone TEXT DEFAULT 'Asia/Bangkok',
    p_customer_id UUID DEFAULT NULL
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
    is_owner BOOLEAN,
    total_price DECIMAL
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
        b.start_at,
        b.end_at,
        b.local_start_time,
        b.local_end_time,
        b.duration_minutes,
        b.is_cross_midnight,
        b.status::TEXT,
        c.name AS customer_name,
        CASE 
            WHEN v_is_admin THEN c.phone
            WHEN p_customer_id IS NOT NULL AND b.customer_id = p_customer_id THEN c.phone
            ELSE NULL
        END AS customer_phone,
        (p_customer_id IS NOT NULL AND b.customer_id = p_customer_id) AS is_owner,
        b.total_price
    FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    WHERE b.machine_id = p_machine_id
      AND b.status IN ('pending', 'confirmed', 'checked_in')
      AND (
          b.local_date = p_date
          OR (b.is_cross_midnight AND b.local_end_date = p_date)
      )
    ORDER BY b.start_at;
END;
$$;

-- ============================================================
-- UPDATE RPC: Get my bookings with total_price
-- ============================================================

CREATE FUNCTION public.rpc_get_my_bookings(
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
    total_price DECIMAL,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        b.total_price,
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
-- GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.rpc_create_booking(UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_checkin_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_bookings_schedule(UUID, DATE, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_bookings(UUID) TO anon, authenticated;
