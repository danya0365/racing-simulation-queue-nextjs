-- ============================================================
-- Phase 3: Sessions Table
-- Created: 2026-01-19
-- Description: Track actual usage sessions on machines
-- Links to bookings (advance) or walk_in_queue (walk-in)
-- ============================================================

-- ============================================================
-- ENUM TYPE
-- ============================================================

CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'partial');

-- ============================================================
-- MAIN TABLE: sessions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Machine reference (required)
    station_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    
    -- Source reference (at least one should be set, or both null for manual session)
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.walk_in_queue(id) ON DELETE SET NULL,
    
    -- Customer info (denormalized for quick access)
    customer_name TEXT NOT NULL,
    
    -- Time tracking
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,  -- NULL = session in progress
    
    -- Pricing
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status public.payment_status DEFAULT 'unpaid',
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERATED COLUMN: Duration in minutes
-- ============================================================

-- Note: PostgreSQL doesn't support GENERATED columns referencing NOW()
-- We'll calculate duration in the RPC functions instead

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Only admins/moderators can view sessions directly
CREATE POLICY "Sessions are viewable by admins/moderators"
    ON public.sessions FOR SELECT
    USING (public.is_moderator_or_admin());

-- Only admins/moderators can create sessions
CREATE POLICY "Sessions can be created by admins/moderators"
    ON public.sessions FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

-- Only admins/moderators can update sessions
CREATE POLICY "Sessions can be updated by admins/moderators"
    ON public.sessions FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

-- Only admins/moderators can delete sessions
CREATE POLICY "Sessions can be deleted by admins/moderators"
    ON public.sessions FOR DELETE
    USING (public.is_moderator_or_admin());

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary query: Get sessions by station
CREATE INDEX IF NOT EXISTS idx_sessions_station 
    ON public.sessions(station_id);

-- Filter by booking
CREATE INDEX IF NOT EXISTS idx_sessions_booking 
    ON public.sessions(booking_id);

-- Filter by queue
CREATE INDEX IF NOT EXISTS idx_sessions_queue 
    ON public.sessions(queue_id);

-- Filter by date
CREATE INDEX IF NOT EXISTS idx_sessions_start_time 
    ON public.sessions(start_time);

-- Active sessions (end_time IS NULL)
CREATE INDEX IF NOT EXISTS idx_sessions_active 
    ON public.sessions(station_id, end_time) 
    WHERE end_time IS NULL;

-- Payment status filter
CREATE INDEX IF NOT EXISTS idx_sessions_payment 
    ON public.sessions(payment_status);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
-- ============================================================
-- RPC FUNCTION: Start a session (IMPROVED VERSION)
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_start_session(
    p_station_id UUID,
    p_customer_name TEXT,
    p_booking_id UUID DEFAULT NULL,
    p_queue_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_machine RECORD;
    v_booking_machine_id UUID;
    v_queue_machine_id UUID;
    v_updated_count INT;
    v_insert_count INT;
    v_session_exists BOOLEAN;
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
        SELECT machine_id INTO v_booking_machine_id
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
    END IF;

    -- Validate Walk-in Queue (if provided)
    IF p_queue_id IS NOT NULL THEN
        SELECT preferred_machine_id INTO v_queue_machine_id
        FROM public.walk_in_queue
        WHERE id = p_queue_id 
          AND status IN ('waiting', 'called')
        FOR UPDATE;

        -- Fix: Use FOUND to check if row exists, because v_queue_machine_id can be NULL (Any Machine)
        IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'ไม่พบ queue หรือ queue ไม่ได้อยู่ในสถานะรอหรือถูกเรียก');
        END IF;

        -- Queue can have NULL preferred_machine_id (any machine)
        -- Only error if specific machine IS selected AND it doesn't match
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
    -- LOG ก่อน INSERT
    RAISE NOTICE '=== BEFORE INSERT SESSION ===';
    RAISE NOTICE 'station_id: %, customer_name: %, queue_id: %', 
        p_station_id, p_customer_name, p_queue_id;

    INSERT INTO public.sessions (
        station_id,
        customer_name,
        booking_id,
        queue_id,
        notes,
        created_at,
        start_time
    ) VALUES (
        p_station_id,
        TRIM(p_customer_name),
        p_booking_id,
        p_queue_id,
        p_notes,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_session_id;

    GET DIAGNOSTICS v_insert_count = ROW_COUNT;
    
    -- LOG หลัง INSERT
    RAISE NOTICE '=== AFTER INSERT SESSION ===';
    RAISE NOTICE 'session_id returned: %, row_count: %', v_session_id, v_insert_count;
    
    -- ตรวจสอบว่า session ถูก INSERT จริงๆ หรือไม่
    SELECT EXISTS(SELECT 1 FROM public.sessions WHERE id = v_session_id) INTO v_session_exists;
    RAISE NOTICE 'session exists in table: %', v_session_exists;
    
    IF v_insert_count = 0 OR v_session_id IS NULL THEN
        RAISE EXCEPTION 'INSERT returned no rows or NULL id';
    END IF;
    
    IF NOT v_session_exists THEN
        RAISE EXCEPTION 'Session was inserted but does not exist in table! Possible trigger deletion.';
    END IF;

    -- Update machine status to occupied
    UPDATE public.machines
    SET 
        status = 'occupied', 
        updated_at = NOW()
    WHERE id = p_station_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Machine update row_count: %', v_updated_count;
    
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
        RAISE NOTICE 'Booking update row_count: %', v_updated_count;
        
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
        RAISE NOTICE 'Queue update row_count: %', v_updated_count;
        
        IF v_updated_count = 0 THEN
            RAISE EXCEPTION 'Failed to update queue status';
        END IF;
    END IF;
    
    -- ตรวจสอบอีกครั้งก่อน return ว่า session ยังอยู่หรือไม่
    SELECT EXISTS(SELECT 1 FROM public.sessions WHERE id = v_session_id) INTO v_session_exists;
    RAISE NOTICE '=== BEFORE RETURN ===';
    RAISE NOTICE 'session still exists: %', v_session_exists;
    
    IF NOT v_session_exists THEN
        RAISE EXCEPTION 'Session disappeared before return! Check for AFTER UPDATE triggers.';
    END IF;
    
    -- Return the created session
    RETURN json_build_object(
        'success', true,
        'session', json_build_object(
            'id', v_session_id,
            'stationId', p_station_id,
            'customerName', TRIM(p_customer_name),
            'startTime', NOW(),
            'paymentStatus', 'unpaid',
            'bookingId', p_booking_id,
            'queueId', p_queue_id
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log complete error info
        RAISE NOTICE '=== EXCEPTION CAUGHT ===';
        RAISE NOTICE 'SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        
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

-- Recommended Indexes
CREATE INDEX IF NOT EXISTS idx_machines_id_status ON machines(id, status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_station_id ON sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_bookings_id_status ON bookings(id, status, machine_id);
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_id_status ON walk_in_queue(id, status, preferred_machine_id);

-- ============================================================
-- RPC FUNCTION: End a session
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_end_session(
    p_session_id UUID,
    p_total_amount DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_duration_minutes INTEGER;
    v_calculated_amount DECIMAL;
    v_hourly_rate DECIMAL;
BEGIN
    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    -- Get session
    SELECT s.*, m.hourly_rate
    INTO v_session
    FROM public.sessions s
    JOIN public.machines m ON m.id = s.station_id
    WHERE s.id = p_session_id;
    
    IF v_session IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบ session นี้');
    END IF;
    
    IF v_session.end_time IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Session นี้จบไปแล้ว');
    END IF;
    
    -- Calculate duration in minutes
    v_duration_minutes := EXTRACT(EPOCH FROM (NOW() - v_session.start_time))::INTEGER / 60;
    
    -- Calculate amount if not provided
    IF p_total_amount IS NULL THEN
        v_hourly_rate := COALESCE(v_session.hourly_rate, 200.00);
        v_calculated_amount := CEIL(v_duration_minutes / 60.0) * v_hourly_rate;
    ELSE
        v_calculated_amount := p_total_amount;
    END IF;
    
    -- End session
    UPDATE public.sessions
    SET 
        end_time = NOW(),
        total_amount = v_calculated_amount,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    -- Update machine status to available
    UPDATE public.machines
    SET status = 'available', updated_at = NOW()
    WHERE id = v_session.station_id;
    
    RETURN json_build_object(
        'success', true,
        'session', json_build_object(
            'id', p_session_id,
            'durationMinutes', v_duration_minutes,
            'totalAmount', v_calculated_amount
        )
    );
END;
$$;

-- ============================================================
-- RPC FUNCTION: Update payment status
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_update_session_payment(
    p_session_id UUID,
    p_payment_status public.payment_status
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    UPDATE public.sessions
    SET payment_status = p_payment_status, updated_at = NOW()
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบ session นี้');
    END IF;
    
    RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get active sessions
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_active_sessions()
RETURNS TABLE (
    session_id UUID,
    station_id UUID,
    station_name TEXT,
    customer_name TEXT,
    start_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    source_type TEXT,  -- 'booking' | 'walk_in' | 'manual'
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
-- RPC FUNCTION: Get today's sessions
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_today_sessions()
RETURNS TABLE (
    session_id UUID,
    station_id UUID,
    station_name TEXT,
    customer_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    total_amount DECIMAL,
    payment_status TEXT,
    source_type TEXT
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
        s.end_time,
        CASE 
            WHEN s.end_time IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (s.end_time - s.start_time))::INTEGER / 60
            ELSE 
                EXTRACT(EPOCH FROM (NOW() - s.start_time))::INTEGER / 60
        END AS duration_minutes,
        s.total_amount,
        s.payment_status::TEXT,
        CASE 
            WHEN s.booking_id IS NOT NULL THEN 'booking'
            WHEN s.queue_id IS NOT NULL THEN 'walk_in'
            ELSE 'manual'
        END AS source_type
    FROM public.sessions s
    JOIN public.machines m ON m.id = s.station_id
    WHERE s.start_time::DATE = CURRENT_DATE
    ORDER BY s.start_time DESC;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get session statistics
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_session_stats(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start DATE := COALESCE(p_start_date, CURRENT_DATE);
    v_end DATE := COALESCE(p_end_date, CURRENT_DATE);
    v_total_sessions INTEGER;
    v_active_sessions INTEGER;
    v_completed_sessions INTEGER;
    v_total_revenue DECIMAL;
    v_paid_revenue DECIMAL;
    v_unpaid_revenue DECIMAL;
    v_avg_duration INTEGER;
BEGIN
    -- Total sessions in period
    SELECT COUNT(*) INTO v_total_sessions
    FROM public.sessions
    WHERE start_time::DATE BETWEEN v_start AND v_end;
    
    -- Active sessions
    SELECT COUNT(*) INTO v_active_sessions
    FROM public.sessions
    WHERE end_time IS NULL;
    
    -- Completed sessions in period
    SELECT COUNT(*) INTO v_completed_sessions
    FROM public.sessions
    WHERE end_time IS NOT NULL
      AND start_time::DATE BETWEEN v_start AND v_end;
    
    -- Total revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue
    FROM public.sessions
    WHERE start_time::DATE BETWEEN v_start AND v_end;
    
    -- Paid revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO v_paid_revenue
    FROM public.sessions
    WHERE payment_status = 'paid'
      AND start_time::DATE BETWEEN v_start AND v_end;
    
    -- Unpaid revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO v_unpaid_revenue
    FROM public.sessions
    WHERE payment_status = 'unpaid'
      AND end_time IS NOT NULL
      AND start_time::DATE BETWEEN v_start AND v_end;
    
    -- Average duration (completed sessions only)
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0)::INTEGER
    INTO v_avg_duration
    FROM public.sessions
    WHERE end_time IS NOT NULL
      AND start_time::DATE BETWEEN v_start AND v_end;
    
    RETURN json_build_object(
        'totalSessions', v_total_sessions,
        'activeSessions', v_active_sessions,
        'completedSessions', v_completed_sessions,
        'totalRevenue', v_total_revenue,
        'paidRevenue', v_paid_revenue,
        'unpaidRevenue', v_unpaid_revenue,
        'averageDurationMinutes', v_avg_duration,
        'dateRange', json_build_object('start', v_start, 'end', v_end)
    );
END;
$$;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON public.sessions TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.rpc_start_session(UUID, TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_end_session(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_session_payment(UUID, public.payment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_active_sessions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_today_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_session_stats(DATE, DATE) TO authenticated;
