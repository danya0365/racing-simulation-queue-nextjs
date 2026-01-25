-- ============================================================
-- Fix: Booking Slot Availability with Active Sessions
-- Created: 2026-01-25
-- Description: 
--   1. Add estimated_end_time column to sessions table
--   2. Update rpc_is_booking_slot_available to check active sessions
--   3. Update rpc_start_session to accept estimated duration
-- ============================================================

-- ============================================================
-- STEP 1: Add estimated_end_time column to sessions table
-- ============================================================

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS estimated_end_time TIMESTAMPTZ;

COMMENT ON COLUMN public.sessions.estimated_end_time 
IS 'Estimated end time for walk-in/manual sessions. Used for slot availability calculation. NULL for booking-based sessions.';

-- Index for querying active sessions with estimated end time
CREATE INDEX IF NOT EXISTS idx_sessions_active_estimated 
    ON public.sessions(station_id, end_time, estimated_end_time) 
    WHERE end_time IS NULL;

-- ============================================================
-- STEP 2: Update rpc_is_booking_slot_available
-- Now checks both bookings AND active sessions
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
    v_booking_conflict INTEGER;
    v_session_conflict INTEGER;
BEGIN
    -- Convert local date+time to TIMESTAMPTZ
    v_start_at := (p_local_date || ' ' || p_local_start_time)::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_at := v_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- 1. Check booking conflicts (existing logic)
    SELECT COUNT(*) INTO v_booking_conflict
    FROM public.bookings
    WHERE machine_id = p_machine_id
      AND status IN ('pending', 'confirmed', 'checked_in', 'seated')
      AND start_at < v_end_at 
      AND end_at > v_start_at;
    
    IF v_booking_conflict > 0 THEN
        RETURN false;
    END IF;
    
    -- 2. Check active session conflicts (NEW)
    -- Active sessions have end_time IS NULL
    -- Use estimated_end_time if available, otherwise default to NOW() + 2 hours buffer
    SELECT COUNT(*) INTO v_session_conflict
    FROM public.sessions
    WHERE station_id = p_machine_id
      AND end_time IS NULL  -- Active session
      AND start_time < v_end_at
      AND COALESCE(estimated_end_time, NOW() + INTERVAL '2 hours') > v_start_at;
    
    IF v_session_conflict > 0 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- ============================================================
-- STEP 3: Update rpc_start_session to accept estimated duration
-- ============================================================

-- Drop existing function first (signature change)
DROP FUNCTION IF EXISTS public.rpc_start_session(UUID, TEXT, UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.rpc_start_session(
    p_station_id UUID,
    p_customer_name TEXT,
    p_booking_id UUID DEFAULT NULL,
    p_queue_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_estimated_duration_minutes INTEGER DEFAULT 60  -- NEW: Default 60 minutes
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_machine RECORD;
    v_booking_machine_id UUID;
    v_booking_duration INTEGER;
    v_queue_machine_id UUID;
    v_updated_count INT;
    v_insert_count INT;
    v_session_exists BOOLEAN;
    v_estimated_end TIMESTAMPTZ;
BEGIN
    -- Input Validation
    IF TRIM(COALESCE(p_customer_name, '')) = '' THEN
        RETURN json_build_object('success', false, 'error', 'กรุณาระบุชื่อลูกค้า');
    END IF;

    IF p_booking_id IS NOT NULL AND p_queue_id IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่สามารถใช้ทั้ง booking และ queue พร้อมกันได้');
    END IF;

    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;

    -- Validate Booking (if provided)
    IF p_booking_id IS NOT NULL THEN
        SELECT machine_id, duration_minutes INTO v_booking_machine_id, v_booking_duration
        FROM public.bookings
        WHERE id = p_booking_id 
          AND status IN ('pending', 'confirmed')
        FOR UPDATE;

        IF v_booking_machine_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'ไม่พบ booking หรือ booking ถูกยกเลิกแล้ว');
        END IF;

        IF v_booking_machine_id != p_station_id THEN
            RETURN json_build_object('success', false, 'error', 'Booking นี้ไม่ได้จองเครื่องนี้');
        END IF;
        
        -- For booking-based sessions, use booking's end_at directly
        -- We'll set estimated_end_time to NULL since booking has its own end_at
        v_estimated_end := NULL;
    ELSE
        -- For walk-in/manual sessions, calculate estimated end time
        v_estimated_end := NOW() + (p_estimated_duration_minutes || ' minutes')::INTERVAL;
    END IF;

    -- Validate Walk-in Queue (if provided)
    IF p_queue_id IS NOT NULL THEN
        SELECT preferred_machine_id INTO v_queue_machine_id
        FROM public.walk_in_queue
        WHERE id = p_queue_id 
          AND status IN ('waiting', 'called')
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'ไม่พบ queue หรือ queue ไม่ได้อยู่ในสถานะรอหรือถูกเรียก');
        END IF;

        IF v_queue_machine_id IS NOT NULL AND v_queue_machine_id != p_station_id THEN
            RETURN json_build_object('success', false, 'error', 'Queue นี้เลือกเครื่องอื่น');
        END IF;
    END IF;

    -- Lock and Get Machine
    SELECT * INTO v_machine 
    FROM public.machines 
    WHERE id = p_station_id 
    FOR UPDATE;
    
    IF v_machine IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบเครื่องนี้');
    END IF;

    IF NOT v_machine.is_active THEN
        RETURN json_build_object('success', false, 'error', 'เครื่องนี้ถูกปิดใช้งาน');
    END IF;

    IF v_machine.status != 'available' THEN
        RETURN json_build_object('success', false, 'error', 'เครื่องนี้ไม่ว่าง (สถานะ: ' || v_machine.status || ')');
    END IF;

    -- ===== CRITICAL SECTION: Create Session =====
    INSERT INTO public.sessions (
        station_id,
        customer_name,
        booking_id,
        queue_id,
        notes,
        created_at,
        start_time,
        estimated_end_time  -- NEW column
    ) VALUES (
        p_station_id,
        TRIM(p_customer_name),
        p_booking_id,
        p_queue_id,
        p_notes,
        NOW(),
        NOW(),
        v_estimated_end  -- NULL for booking, calculated for walk-in/manual
    )
    RETURNING id INTO v_session_id;

    GET DIAGNOSTICS v_insert_count = ROW_COUNT;
    
    IF v_insert_count = 0 OR v_session_id IS NULL THEN
        RAISE EXCEPTION 'INSERT returned no rows or NULL id';
    END IF;

    -- Update machine status to occupied
    UPDATE public.machines
    SET 
        status = 'occupied', 
        updated_at = NOW()
    WHERE id = p_station_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count = 0 THEN
        RAISE EXCEPTION 'Failed to update machine status';
    END IF;

    -- Update Booking status if provided
    IF p_booking_id IS NOT NULL THEN
        UPDATE public.bookings
        SET 
            status = 'seated',
            updated_at = NOW()
        WHERE id = p_booking_id
          AND status IN ('pending', 'confirmed');
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        IF v_updated_count = 0 THEN
            RAISE EXCEPTION 'Failed to update booking status';
        END IF;
    END IF;

    -- Update Walk-in Queue status if provided
    IF p_queue_id IS NOT NULL THEN
        UPDATE public.walk_in_queue
        SET 
            status = 'seated', 
            seated_at = NOW(), 
            preferred_machine_id = p_station_id,
            updated_at = NOW()
        WHERE id = p_queue_id
          AND status IN ('waiting', 'called');
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        IF v_updated_count = 0 THEN
            RAISE EXCEPTION 'Failed to update queue status';
        END IF;
    END IF;
    
    -- Return the created session
    RETURN json_build_object(
        'success', true,
        'session', json_build_object(
            'id', v_session_id,
            'stationId', p_station_id,
            'customerName', TRIM(p_customer_name),
            'startTime', NOW(),
            'estimatedEndTime', v_estimated_end,
            'paymentStatus', 'unpaid',
            'bookingId', p_booking_id,
            'queueId', p_queue_id
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'เกิดข้อผิดพลาด: ' || SQLERRM,
            'debug', json_build_object(
                'sqlstate', SQLSTATE,
                'queue_id', p_queue_id,
                'session_id', v_session_id
            )
        );
END;
$$;

-- ============================================================
-- STEP 4: Update rpc_get_active_sessions to include estimated_end_time
-- ============================================================

-- Drop function first because return type signature is changing
DROP FUNCTION IF EXISTS public.rpc_get_active_sessions();

CREATE OR REPLACE FUNCTION public.rpc_get_active_sessions()
RETURNS TABLE (
    session_id UUID,
    station_id UUID,
    station_name TEXT,
    customer_name TEXT,
    start_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    estimated_end_time TIMESTAMPTZ,  -- NEW
    source_type TEXT,
    payment_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS session_id,
        s.station_id,
        m.name AS station_name,
        s.customer_name,
        s.start_time,
        EXTRACT(EPOCH FROM (NOW() - s.start_time))::INTEGER / 60 AS duration_minutes,
        s.estimated_end_time,
        CASE 
            WHEN s.booking_id IS NOT NULL THEN 'booking'
            WHEN s.queue_id IS NOT NULL THEN 'walk_in'
            ELSE 'manual'
        END AS source_type,
        s.payment_status::TEXT
    FROM public.sessions s
    JOIN public.machines m ON m.id = s.station_id
    WHERE s.end_time IS NULL
    ORDER BY s.start_time ASC;
END;
$$;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.rpc_start_session(UUID, TEXT, UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_is_booking_slot_available(UUID, DATE, TIME, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_active_sessions() TO anon, authenticated;
