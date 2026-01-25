-- ============================================================
-- Racing Simulation Queue System - RPC Functions
-- Created: 2026-01-08 (Consolidated for Production)
-- Description: All RPC functions and grants
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Helper: Mask Phone Number
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF length(p_phone) < 7 THEN RETURN '***-****'; END IF;
    RETURN substr(p_phone, 1, 3) || '-XXX-' || substr(p_phone, -4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- MACHINE RPCs
-- ============================================================

-- Get Active Machines (with type and hourly_rate)
CREATE OR REPLACE FUNCTION public.rpc_get_active_machines()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    machine_position INTEGER,
    status public.machine_status,
    is_active BOOLEAN,
    type TEXT,
    hourly_rate DECIMAL
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        m.id, 
        m.name, 
        m.description, 
        m.position as machine_position, 
        m.status, 
        m.is_active,
        m.type,
        m.hourly_rate
    FROM public.machines m 
    WHERE m.is_active = TRUE 
    ORDER BY m.position ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CUSTOMER RPCs
-- ============================================================

-- Get All Customers (Admin)
CREATE OR REPLACE FUNCTION public.rpc_get_all_customers_admin()
RETURNS SETOF public.customers SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;
    RETURN QUERY SELECT * FROM public.customers ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- BOOKING RPCs
-- ============================================================

-- Create Booking
CREATE OR REPLACE FUNCTION public.rpc_create_booking(
    p_machine_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_local_date DATE,
    p_local_start_time TIME,
    p_duration_minutes INTEGER,
    p_timezone TEXT DEFAULT 'Asia/Bangkok',
    p_notes TEXT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL
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

    -- Prevent concurrent duplicate creation
    PERFORM pg_advisory_xact_lock(hashtext('customer_creation_' || p_customer_phone));

    v_current_profile_id := public.get_active_profile_id();

    -- Convert local date+time to TIMESTAMPTZ
    v_start_at := (p_local_date || ' ' || p_local_start_time)::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_at := v_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check for time slot conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE machine_id = p_machine_id
      AND status IN ('pending', 'confirmed', 'checked_in', 'seated')
      AND start_at < v_end_at 
      AND end_at > v_start_at;
    
    IF v_conflict_count > 0 THEN
        RETURN json_build_object('success', false, 'error', 'ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น');
    END IF;
    
    -- Get machine hourly rate
    SELECT COALESCE(hourly_rate, 200.00) INTO v_hourly_rate
    FROM public.machines WHERE id = p_machine_id;
    
    v_total_price := CEIL(p_duration_minutes / 60.0) * v_hourly_rate;
    
    -- Get customer by phone
    SELECT * INTO v_existing_customer
    FROM public.customers WHERE phone = p_customer_phone LIMIT 1;
    
    IF FOUND THEN
        -- Security: Profile Protection
        IF v_existing_customer.profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_existing_customer.profile_id THEN
                RETURN json_build_object('success', false, 'error', 'เบอร์นี้ผูกกับบัญชีสมาชิก กรุณาเข้าสู่ระบบก่อนทำรายการ');
            END IF;
        END IF;

        -- Security: Ownership check
        IF p_customer_id IS NULL OR v_existing_customer.id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว กรุณาตรวจสอบหรือแจ้งพนักงาน');
        END IF;

        v_customer_id := v_existing_customer.id;

        IF v_existing_customer.name != p_customer_name THEN
            UPDATE public.customers SET name = p_customer_name, updated_at = NOW() WHERE id = v_customer_id;
        END IF;
    ELSE
        INSERT INTO public.customers (name, phone, profile_id)
        VALUES (p_customer_name, p_customer_phone, v_current_profile_id)
        RETURNING id INTO v_customer_id;
    END IF;
    
    -- Create booking
    INSERT INTO public.bookings (
        machine_id, customer_id, start_at, end_at, duration_minutes,
        business_timezone, status, notes, total_price
    ) VALUES (
        p_machine_id, v_customer_id, v_start_at, v_end_at, p_duration_minutes,
        p_timezone, 'confirmed', p_notes, v_total_price
    )
    RETURNING id INTO v_booking_id;
    
    RETURN (
        SELECT json_build_object(
            'success', true,
            'booking', json_build_object(
                'id', b.id, 'machineId', b.machine_id, 'customerId', b.customer_id,
                'customerName', c.name, 'customerPhone', c.phone,
                'startAt', b.start_at, 'endAt', b.end_at,
                'localDate', b.local_date, 'localStartTime', b.local_start_time::TEXT,
                'localEndTime', b.local_end_time::TEXT, 'durationMinutes', b.duration_minutes,
                'businessTimezone', b.business_timezone, 'isCrossMidnight', b.is_cross_midnight,
                'status', b.status, 'totalPrice', b.total_price, 'createdAt', b.created_at
            )
        )
        FROM public.bookings b
        JOIN public.customers c ON c.id = b.customer_id
        WHERE b.id = v_booking_id
    );
END;
$$;

-- Cancel Booking
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
    v_current_profile_id := public.get_active_profile_id();

    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    
    IF v_booking IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบการจอง');
    END IF;

    SELECT profile_id INTO v_profile_id FROM public.customers WHERE id = v_booking.customer_id;
    
    IF NOT public.is_moderator_or_admin() THEN
        IF p_customer_id IS NULL OR v_booking.customer_id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ยกเลิกการจองนี้');
        END IF;

        IF v_profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_profile_id THEN
                RETURN json_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบเพื่อยกเลิก');
            END IF;
        END IF;
    END IF;
    
    UPDATE public.bookings SET status = 'cancelled', updated_at = NOW() WHERE id = p_booking_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Check-in Booking
CREATE OR REPLACE FUNCTION public.rpc_checkin_booking(p_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    
    IF v_booking IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบการจองนี้');
    END IF;
    
    IF v_booking.status != 'confirmed' THEN
        RETURN json_build_object('success', false, 'error', 'สถานะการจองไม่ถูกต้อง ต้องเป็น confirmed เท่านั้น');
    END IF;
    
    UPDATE public.bookings SET status = 'checked_in', updated_at = NOW() WHERE id = p_booking_id;
    
    RETURN json_build_object('success', true, 'message', 'Check-in สำเร็จ');
END;
$$;

-- Get Bookings Schedule (with active sessions)
CREATE OR REPLACE FUNCTION public.rpc_get_bookings_schedule(
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
    v_start_of_day TIMESTAMPTZ;
    v_end_of_day TIMESTAMPTZ;
BEGIN
    v_is_admin := public.is_moderator_or_admin();
    v_start_of_day := (p_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_of_day := v_start_of_day + INTERVAL '1 day';

    RETURN QUERY
    -- Actual Bookings
    SELECT 
        b.id AS booking_id, b.start_at, b.end_at,
        b.local_start_time, b.local_end_time, b.duration_minutes,
        b.is_cross_midnight, b.status::TEXT,
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
      AND b.status IN ('pending', 'confirmed', 'seated')
      AND (b.local_date = p_date OR (b.is_cross_midnight AND b.local_end_date = p_date))

    UNION ALL

    -- Active Sessions (walk-in/manual, not from bookings)
    SELECT 
        s.id AS booking_id,
        s.start_time AS start_at,
        COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') AS end_at,
        (s.start_time AT TIME ZONE p_timezone)::TIME AS local_start_time,
        (COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') AT TIME ZONE p_timezone)::TIME AS local_end_time,
        EXTRACT(EPOCH FROM (COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') - s.start_time))::INTEGER / 60 AS duration_minutes,
        ((s.start_time AT TIME ZONE p_timezone)::DATE != (COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') AT TIME ZONE p_timezone)::DATE) AS is_cross_midnight,
        'confirmed' AS status,
        s.customer_name,
        NULL AS customer_phone,
        FALSE AS is_owner,
        0 AS total_price
    FROM public.sessions s
    WHERE s.station_id = p_machine_id
      AND s.end_time IS NULL
      AND s.booking_id IS NULL
      AND s.start_time < v_end_of_day
      AND COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') > v_start_of_day
    
    ORDER BY start_at;
END;
$$;

-- Get My Bookings
CREATE OR REPLACE FUNCTION public.rpc_get_my_bookings(p_customer_id UUID)
RETURNS TABLE (
    booking_id UUID, machine_id UUID, machine_name TEXT,
    customer_name TEXT, customer_phone TEXT,
    start_at TIMESTAMPTZ, end_at TIMESTAMPTZ,
    local_date DATE, local_start_time TIME, local_end_time TIME,
    duration_minutes INTEGER, business_timezone TEXT,
    is_cross_midnight BOOLEAN, status TEXT, total_price DECIMAL, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id AS booking_id, b.machine_id, m.name AS machine_name,
        c.name AS customer_name, c.phone AS customer_phone,
        b.start_at, b.end_at, b.local_date, b.local_start_time, b.local_end_time,
        b.duration_minutes, b.business_timezone, b.is_cross_midnight,
        b.status::TEXT, b.total_price, b.created_at
    FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    JOIN public.machines m ON m.id = b.machine_id
    WHERE b.customer_id = p_customer_id
    ORDER BY b.start_at DESC
    LIMIT 50;
END;
$$;

-- Get Bookings by Date (all machines)
CREATE OR REPLACE FUNCTION public.rpc_get_bookings_by_date(
    p_date DATE,
    p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
    booking_id UUID, machine_id UUID, machine_name TEXT,
    customer_id UUID, customer_name TEXT, customer_phone TEXT,
    start_at TIMESTAMPTZ, end_at TIMESTAMPTZ,
    duration_minutes INTEGER, business_timezone TEXT, status TEXT,
    created_at TIMESTAMPTZ, local_date DATE, local_start_time TIME,
    local_end_time TIME, is_cross_midnight BOOLEAN, is_owner BOOLEAN
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
        b.id AS booking_id, b.machine_id, m.name AS machine_name,
        b.customer_id, c.name AS customer_name,
        CASE 
            WHEN v_is_admin THEN c.phone
            WHEN p_customer_id IS NOT NULL AND b.customer_id = p_customer_id THEN c.phone
            ELSE NULL 
        END AS customer_phone,
        b.start_at, b.end_at, b.duration_minutes, b.business_timezone,
        b.status::TEXT, b.created_at, b.local_date,
        b.local_start_time, b.local_end_time, b.is_cross_midnight,
        (p_customer_id IS NOT NULL AND b.customer_id = p_customer_id) as is_owner
    FROM bookings b
    JOIN machines m ON b.machine_id = m.id
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE (b.local_date = p_date OR (b.is_cross_midnight AND b.local_end_date = p_date))
    ORDER BY b.local_start_time ASC;
END;
$$;

-- Get Bookings by Machine and Date (with privacy protection)
CREATE OR REPLACE FUNCTION public.rpc_get_bookings_by_machine_date(
    p_machine_id UUID,
    p_date DATE,
    p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
    booking_id UUID,
    machine_id UUID,
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

-- Check Slot Availability
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
    v_start_at := (p_local_date || ' ' || p_local_start_time)::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_at := v_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check booking conflicts
    SELECT COUNT(*) INTO v_booking_conflict
    FROM public.bookings
    WHERE machine_id = p_machine_id
      AND status IN ('pending', 'confirmed', 'checked_in', 'seated')
      AND start_at < v_end_at AND end_at > v_start_at;
    
    IF v_booking_conflict > 0 THEN RETURN false; END IF;
    
    -- Check active session conflicts
    SELECT COUNT(*) INTO v_session_conflict
    FROM public.sessions
    WHERE station_id = p_machine_id
      AND end_time IS NULL
      AND start_time < v_end_at
      AND COALESCE(estimated_end_time, NOW() + INTERVAL '2 hours') > v_start_at;
    
    IF v_session_conflict > 0 THEN RETURN false; END IF;
    
    RETURN true;
END;
$$;

-- Booking Stats
CREATE OR REPLACE FUNCTION public.rpc_get_booking_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER; v_pending INTEGER; v_confirmed INTEGER;
    v_seated INTEGER; v_cancelled INTEGER; v_completed INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'confirmed'),
        COUNT(*) FILTER (WHERE status = 'seated'),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total, v_pending, v_confirmed, v_seated, v_cancelled, v_completed
    FROM bookings;

    RETURN json_build_object(
        'totalBookings', COALESCE(v_total, 0),
        'pendingBookings', COALESCE(v_pending, 0),
        'confirmedBookings', COALESCE(v_confirmed, 0),
        'seatedBookings', COALESCE(v_seated, 0),
        'cancelledBookings', COALESCE(v_cancelled, 0),
        'completedBookings', COALESCE(v_completed, 0)
    );
END;
$$;

-- ============================================================
-- WALK-IN QUEUE RPCs
-- ============================================================

-- Get Waiting Queue
CREATE OR REPLACE FUNCTION public.rpc_get_waiting_queue()
RETURNS TABLE (
    queue_id UUID, queue_number INTEGER, customer_name TEXT,
    customer_phone_masked TEXT, party_size INTEGER,
    preferred_station_type TEXT, preferred_machine_name TEXT,
    status TEXT, joined_at TIMESTAMPTZ, wait_time_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wq.id AS queue_id, wq.queue_number,
        c.name AS customer_name,
        public.mask_phone(c.phone) AS customer_phone_masked,
        wq.party_size, wq.preferred_station_type,
        m.name AS preferred_machine_name,
        wq.status::TEXT, wq.joined_at,
        EXTRACT(EPOCH FROM (NOW() - wq.joined_at))::INTEGER / 60 AS wait_time_minutes
    FROM public.walk_in_queue wq
    JOIN public.customers c ON c.id = wq.customer_id
    LEFT JOIN public.machines m ON m.id = wq.preferred_machine_id
    WHERE wq.status = 'waiting'
    ORDER BY wq.queue_number ASC;
END;
$$;

-- Join Walk-in Queue
CREATE OR REPLACE FUNCTION public.rpc_join_walk_in_queue(
    p_customer_name TEXT, p_customer_phone TEXT,
    p_party_size INTEGER DEFAULT 1,
    p_preferred_station_type TEXT DEFAULT NULL,
    p_preferred_machine_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_queue_id UUID;
    v_queue_number INTEGER;
    v_existing_customer RECORD;
    v_current_profile_id UUID;
BEGIN
    p_customer_phone := TRIM(p_customer_phone);
    p_customer_name := TRIM(p_customer_name);

    PERFORM pg_advisory_xact_lock(hashtext('customer_creation_' || p_customer_phone));
    
    v_current_profile_id := public.get_active_profile_id();

    SELECT * INTO v_existing_customer FROM public.customers WHERE phone = p_customer_phone LIMIT 1;

    IF FOUND THEN
        IF v_existing_customer.profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_existing_customer.profile_id THEN
                RETURN json_build_object('success', false, 'error', 'เบอร์นี้ผูกกับบัญชีสมาชิก กรุณาเข้าสู่ระบบก่อนทำรายการ');
            END IF;
        END IF;

        IF p_customer_id IS NULL OR v_existing_customer.id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว กรุณาตรวจสอบหรือแจ้งพนักงาน');
        END IF;

        v_customer_id := v_existing_customer.id;

        IF v_existing_customer.name != p_customer_name THEN
            UPDATE public.customers SET name = p_customer_name, updated_at = NOW() WHERE id = v_customer_id;
        END IF;
    ELSE
        INSERT INTO public.customers (name, phone, profile_id)
        VALUES (p_customer_name, p_customer_phone, v_current_profile_id)
        RETURNING id INTO v_customer_id;
    END IF;
    
    SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_queue_number
    FROM public.walk_in_queue WHERE joined_at::DATE = CURRENT_DATE;
    
    INSERT INTO public.walk_in_queue (
        customer_id, preferred_machine_id, party_size,
        preferred_station_type, queue_number, notes
    ) VALUES (
        v_customer_id, p_preferred_machine_id, p_party_size,
        p_preferred_station_type, v_queue_number, p_notes
    )
    RETURNING id INTO v_queue_id;
    
    RETURN json_build_object(
        'success', true,
        'queue', json_build_object(
            'id', v_queue_id, 'customerId', v_customer_id,
            'queueNumber', v_queue_number, 'partySize', p_party_size,
            'preferredStationType', p_preferred_station_type,
            'status', 'waiting', 'joinedAt', NOW()
        )
    );
END;
$$;

-- Call Queue Customer
CREATE OR REPLACE FUNCTION public.rpc_call_queue_customer(p_queue_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue RECORD;
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    SELECT * INTO v_queue FROM public.walk_in_queue WHERE id = p_queue_id;
    
    IF v_queue IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบคิวนี้');
    END IF;
    
    IF v_queue.status != 'waiting' THEN
        RETURN json_build_object('success', false, 'error', 'สถานะคิวไม่ถูกต้อง');
    END IF;
    
    UPDATE public.walk_in_queue
    SET status = 'called', called_at = NOW(), updated_at = NOW()
    WHERE id = p_queue_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Cancel Walk-in Queue
CREATE OR REPLACE FUNCTION public.rpc_cancel_walk_in_queue(
    p_queue_id UUID,
    p_customer_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue RECORD;
    v_profile_id UUID;
    v_current_profile_id UUID;
BEGIN
    v_current_profile_id := public.get_active_profile_id();

    SELECT * INTO v_queue FROM public.walk_in_queue WHERE id = p_queue_id;
    
    IF v_queue IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบคิวนี้');
    END IF;

    SELECT profile_id INTO v_profile_id FROM public.customers WHERE id = v_queue.customer_id;
    
    IF NOT public.is_moderator_or_admin() THEN
         IF p_customer_id IS NULL OR v_queue.customer_id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ยกเลิกคิวนี้');
         END IF;

         IF v_profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_profile_id THEN
                RETURN json_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบเพื่อยกเลิก');
            END IF;
         END IF;
    END IF;
    
    IF v_queue.status NOT IN ('waiting', 'called') THEN
        RETURN json_build_object('success', false, 'error', 'ไม่สามารถยกเลิกคิวนี้ได้');
    END IF;
    
    UPDATE public.walk_in_queue SET status = 'cancelled', updated_at = NOW() WHERE id = p_queue_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Get My Walk-in Queue
CREATE OR REPLACE FUNCTION public.rpc_get_my_walk_in_queue(p_customer_id UUID)
RETURNS TABLE (
    queue_id UUID, queue_number INTEGER, customer_name TEXT,
    customer_phone TEXT, party_size INTEGER, preferred_station_type TEXT,
    preferred_machine_name TEXT, notes TEXT, status TEXT,
    queues_ahead INTEGER, estimated_wait_minutes INTEGER,
    joined_at TIMESTAMPTZ, called_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wq.id AS queue_id, wq.queue_number,
        c.name AS customer_name, c.phone AS customer_phone,
        wq.party_size, wq.preferred_station_type,
        m.name AS preferred_machine_name, wq.notes, wq.status::TEXT,
        (SELECT COUNT(*)::INTEGER FROM public.walk_in_queue wq2 
         WHERE wq2.status = 'waiting' AND wq2.queue_number < wq.queue_number) AS queues_ahead,
        (SELECT COUNT(*)::INTEGER * 30 FROM public.walk_in_queue wq2 
         WHERE wq2.status = 'waiting' AND wq2.queue_number < wq.queue_number) AS estimated_wait_minutes,
        wq.joined_at, wq.called_at
    FROM public.walk_in_queue wq
    JOIN public.customers c ON c.id = wq.customer_id
    LEFT JOIN public.machines m ON m.id = wq.preferred_machine_id
    WHERE wq.customer_id = p_customer_id AND wq.status IN ('waiting', 'called')
    ORDER BY wq.joined_at DESC
    LIMIT 5;
END;
$$;

-- Get Walk-in Queue Stats
CREATE OR REPLACE FUNCTION public.rpc_get_walk_in_queue_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_waiting_count INTEGER; v_called_count INTEGER;
    v_seated_today INTEGER; v_cancelled_today INTEGER;
    v_avg_wait_minutes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_waiting_count FROM public.walk_in_queue WHERE status = 'waiting';
    SELECT COUNT(*) INTO v_called_count FROM public.walk_in_queue WHERE status = 'called';
    SELECT COUNT(*) INTO v_seated_today FROM public.walk_in_queue WHERE status = 'seated' AND seated_at::DATE = CURRENT_DATE;
    SELECT COUNT(*) INTO v_cancelled_today FROM public.walk_in_queue WHERE status = 'cancelled' AND updated_at::DATE = CURRENT_DATE;
    
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (seated_at - joined_at)) / 60), 0)::INTEGER
    INTO v_avg_wait_minutes FROM public.walk_in_queue WHERE status = 'seated' AND seated_at::DATE = CURRENT_DATE;
    
    RETURN json_build_object(
        'waitingCount', v_waiting_count, 'calledCount', v_called_count,
        'seatedToday', v_seated_today, 'cancelledToday', v_cancelled_today,
        'averageWaitMinutes', v_avg_wait_minutes
    );
END;
$$;

-- ============================================================
-- SESSION RPCs
-- ============================================================

-- Start Session
CREATE OR REPLACE FUNCTION public.rpc_start_session(
    p_station_id UUID,
    p_customer_name TEXT,
    p_booking_id UUID DEFAULT NULL,
    p_queue_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_estimated_duration_minutes INTEGER DEFAULT 60
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
    v_estimated_end TIMESTAMPTZ;
BEGIN
    IF TRIM(COALESCE(p_customer_name, '')) = '' THEN
        RETURN json_build_object('success', false, 'error', 'กรุณาระบุชื่อลูกค้า');
    END IF;

    IF p_booking_id IS NOT NULL AND p_queue_id IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่สามารถใช้ทั้ง booking และ queue พร้อมกันได้');
    END IF;

    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;

    -- Validate Booking
    IF p_booking_id IS NOT NULL THEN
        SELECT machine_id INTO v_booking_machine_id
        FROM public.bookings WHERE id = p_booking_id AND status IN ('pending', 'confirmed') FOR UPDATE;

        IF v_booking_machine_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'ไม่พบ booking หรือ booking ถูกยกเลิกแล้ว');
        END IF;
        IF v_booking_machine_id != p_station_id THEN
            RETURN json_build_object('success', false, 'error', 'Booking นี้ไม่ได้จองเครื่องนี้');
        END IF;
        v_estimated_end := NULL;
    ELSE
        v_estimated_end := NOW() + (p_estimated_duration_minutes || ' minutes')::INTERVAL;
    END IF;

    -- Validate Queue
    IF p_queue_id IS NOT NULL THEN
        SELECT preferred_machine_id INTO v_queue_machine_id
        FROM public.walk_in_queue WHERE id = p_queue_id AND status IN ('waiting', 'called') FOR UPDATE;

        IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'ไม่พบ queue หรือ queue ไม่ได้อยู่ในสถานะรอหรือถูกเรียก');
        END IF;
        IF v_queue_machine_id IS NOT NULL AND v_queue_machine_id != p_station_id THEN
            RETURN json_build_object('success', false, 'error', 'Queue นี้เลือกเครื่องอื่น');
        END IF;
    END IF;

    -- Lock and Get Machine
    SELECT * INTO v_machine FROM public.machines WHERE id = p_station_id FOR UPDATE;
    
    IF v_machine IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบเครื่องนี้');
    END IF;
    IF NOT v_machine.is_active THEN
        RETURN json_build_object('success', false, 'error', 'เครื่องนี้ถูกปิดใช้งาน');
    END IF;
    IF v_machine.status != 'available' THEN
        RETURN json_build_object('success', false, 'error', 'เครื่องนี้ไม่ว่าง (สถานะ: ' || v_machine.status || ')');
    END IF;

    -- Create Session
    INSERT INTO public.sessions (
        station_id, customer_name, booking_id, queue_id, notes,
        created_at, start_time, estimated_end_time
    ) VALUES (
        p_station_id, TRIM(p_customer_name), p_booking_id, p_queue_id, p_notes,
        NOW(), NOW(), v_estimated_end
    )
    RETURNING id INTO v_session_id;

    GET DIAGNOSTICS v_insert_count = ROW_COUNT;
    IF v_insert_count = 0 OR v_session_id IS NULL THEN
        RAISE EXCEPTION 'INSERT returned no rows or NULL id';
    END IF;

    -- Update machine status
    UPDATE public.machines SET status = 'occupied', updated_at = NOW() WHERE id = p_station_id;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN RAISE EXCEPTION 'Failed to update machine status'; END IF;

    -- Update Booking status
    IF p_booking_id IS NOT NULL THEN
        UPDATE public.bookings SET status = 'seated', updated_at = NOW()
        WHERE id = p_booking_id AND status IN ('pending', 'confirmed');
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        IF v_updated_count = 0 THEN RAISE EXCEPTION 'Failed to update booking status'; END IF;
    END IF;

    -- Update Queue status
    IF p_queue_id IS NOT NULL THEN
        UPDATE public.walk_in_queue
        SET status = 'seated', seated_at = NOW(), preferred_machine_id = p_station_id, updated_at = NOW()
        WHERE id = p_queue_id AND status IN ('waiting', 'called');
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        IF v_updated_count = 0 THEN RAISE EXCEPTION 'Failed to update queue status'; END IF;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'session', json_build_object(
            'id', v_session_id, 'stationId', p_station_id,
            'customerName', TRIM(p_customer_name), 'startTime', NOW(),
            'estimatedEndTime', v_estimated_end, 'paymentStatus', 'unpaid',
            'bookingId', p_booking_id, 'queueId', p_queue_id
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'เกิดข้อผิดพลาด: ' || SQLERRM);
END;
$$;

-- End Session
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
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    SELECT s.*, m.hourly_rate INTO v_session
    FROM public.sessions s
    JOIN public.machines m ON m.id = s.station_id
    WHERE s.id = p_session_id;
    
    IF v_session IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบ session นี้');
    END IF;
    
    IF v_session.end_time IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Session นี้จบไปแล้ว');
    END IF;
    
    v_duration_minutes := EXTRACT(EPOCH FROM (NOW() - v_session.start_time))::INTEGER / 60;
    
    IF p_total_amount IS NULL THEN
        v_hourly_rate := COALESCE(v_session.hourly_rate, 200.00);
        v_calculated_amount := CEIL(v_duration_minutes / 60.0) * v_hourly_rate;
    ELSE
        v_calculated_amount := p_total_amount;
    END IF;
    
    UPDATE public.sessions
    SET end_time = NOW(), total_amount = v_calculated_amount, updated_at = NOW()
    WHERE id = p_session_id;
    
    UPDATE public.machines SET status = 'available', updated_at = NOW()
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

-- Update Session Payment
CREATE OR REPLACE FUNCTION public.rpc_update_session_payment(
    p_session_id UUID,
    p_payment_status public.payment_status
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    UPDATE public.sessions SET payment_status = p_payment_status, updated_at = NOW() WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบ session นี้');
    END IF;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Update Session Amount
CREATE OR REPLACE FUNCTION public.rpc_update_session_amount(
    p_session_id UUID,
    p_total_amount DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    UPDATE public.sessions SET total_amount = p_total_amount, updated_at = NOW() WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบ session นี้');
    END IF;
    
    RETURN json_build_object('success', true, 'session_id', p_session_id, 'total_amount', p_total_amount);
END;
$$;

-- Get Active Sessions
CREATE OR REPLACE FUNCTION public.rpc_get_active_sessions()
RETURNS TABLE (
    session_id UUID, station_id UUID, station_name TEXT,
    customer_name TEXT, start_time TIMESTAMPTZ,
    duration_minutes INTEGER, estimated_end_time TIMESTAMPTZ,
    source_type TEXT, payment_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS session_id, s.station_id, m.name AS station_name,
        s.customer_name, s.start_time,
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

-- Get Today's Sessions
CREATE OR REPLACE FUNCTION public.rpc_get_today_sessions()
RETURNS TABLE (
    session_id UUID, station_id UUID, station_name TEXT,
    customer_name TEXT, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ,
    duration_minutes INTEGER, total_amount DECIMAL,
    payment_status TEXT, source_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS session_id, s.station_id, m.name AS station_name,
        s.customer_name, s.start_time, s.end_time,
        CASE 
            WHEN s.end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (s.end_time - s.start_time))::INTEGER / 60
            ELSE EXTRACT(EPOCH FROM (NOW() - s.start_time))::INTEGER / 60
        END AS duration_minutes,
        s.total_amount, s.payment_status::TEXT,
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

-- Get Session Stats
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
    v_total_sessions INTEGER; v_active_sessions INTEGER;
    v_completed_sessions INTEGER; v_total_revenue DECIMAL;
    v_paid_revenue DECIMAL; v_unpaid_revenue DECIMAL;
    v_avg_duration INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_sessions FROM public.sessions WHERE start_time::DATE BETWEEN v_start AND v_end;
    SELECT COUNT(*) INTO v_active_sessions FROM public.sessions WHERE end_time IS NULL;
    SELECT COUNT(*) INTO v_completed_sessions FROM public.sessions WHERE end_time IS NOT NULL AND start_time::DATE BETWEEN v_start AND v_end;
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue FROM public.sessions WHERE start_time::DATE BETWEEN v_start AND v_end;
    SELECT COALESCE(SUM(total_amount), 0) INTO v_paid_revenue FROM public.sessions WHERE payment_status = 'paid' AND start_time::DATE BETWEEN v_start AND v_end;
    SELECT COALESCE(SUM(total_amount), 0) INTO v_unpaid_revenue FROM public.sessions WHERE payment_status = 'unpaid' AND end_time IS NOT NULL AND start_time::DATE BETWEEN v_start AND v_end;
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0)::INTEGER INTO v_avg_duration FROM public.sessions WHERE end_time IS NOT NULL AND start_time::DATE BETWEEN v_start AND v_end;
    
    RETURN json_build_object(
        'totalSessions', v_total_sessions, 'activeSessions', v_active_sessions,
        'completedSessions', v_completed_sessions, 'totalRevenue', v_total_revenue,
        'paidRevenue', v_paid_revenue, 'unpaidRevenue', v_unpaid_revenue,
        'averageDurationMinutes', v_avg_duration,
        'dateRange', json_build_object('start', v_start, 'end', v_end)
    );
END;
$$;

-- ============================================================
-- DASHBOARD / BACKEND STATS RPCs
-- ============================================================

-- Get Backend Stats
CREATE OR REPLACE FUNCTION public.rpc_get_backend_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_machine_stats RECORD;
    v_queue_stats RECORD;
    v_session_stats RECORD;
    v_booking_stats RECORD;
BEGIN
    -- Machine stats
    SELECT 
        COUNT(*)::INTEGER AS total,
        COUNT(*) FILTER (WHERE status = 'available' AND is_active)::INTEGER AS available,
        COUNT(*) FILTER (WHERE status = 'occupied' AND is_active)::INTEGER AS occupied,
        COUNT(*) FILTER (WHERE status = 'maintenance')::INTEGER AS maintenance
    INTO v_machine_stats FROM public.machines;
    
    -- Walk-in queue stats
    SELECT 
        COUNT(*) FILTER (WHERE status = 'waiting')::INTEGER AS waiting,
        COUNT(*) FILTER (WHERE status = 'called')::INTEGER AS called,
        COUNT(*) FILTER (WHERE status = 'seated' AND seated_at::DATE = CURRENT_DATE)::INTEGER AS seated_today,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at::DATE = CURRENT_DATE)::INTEGER AS cancelled_today
    INTO v_queue_stats FROM public.walk_in_queue;
    
    -- Session stats
    SELECT 
        COUNT(*)::INTEGER AS total_today,
        COUNT(*) FILTER (WHERE end_time IS NULL)::INTEGER AS active,
        COALESCE(SUM(total_amount), 0)::DECIMAL AS revenue_today
    INTO v_session_stats FROM public.sessions WHERE start_time::DATE = CURRENT_DATE;
    
    -- Booking stats
    SELECT 
        COUNT(*) FILTER (WHERE status = 'confirmed')::INTEGER AS confirmed,
        COUNT(*) FILTER (WHERE status = 'checked_in')::INTEGER AS checked_in,
        COUNT(*) FILTER (WHERE status = 'completed' AND local_date = CURRENT_DATE)::INTEGER AS completed_today
    INTO v_booking_stats FROM public.bookings WHERE local_date = CURRENT_DATE OR status IN ('confirmed', 'checked_in');
    
    RETURN json_build_object(
        'machines', json_build_object(
            'total', v_machine_stats.total, 'available', v_machine_stats.available,
            'occupied', v_machine_stats.occupied, 'maintenance', v_machine_stats.maintenance
        ),
        'walkInQueue', json_build_object(
            'waiting', v_queue_stats.waiting, 'called', v_queue_stats.called,
            'seatedToday', v_queue_stats.seated_today, 'cancelledToday', v_queue_stats.cancelled_today
        ),
        'sessions', json_build_object(
            'totalToday', v_session_stats.total_today, 'active', v_session_stats.active,
            'revenueToday', v_session_stats.revenue_today
        ),
        'bookings', json_build_object(
            'confirmed', v_booking_stats.confirmed, 'checkedIn', v_booking_stats.checked_in,
            'completedToday', v_booking_stats.completed_today
        )
    );
END;
$$;

-- Comment
COMMENT ON FUNCTION public.rpc_get_backend_stats() IS 
'Get dashboard statistics for backend. Uses walk_in_queue, sessions, and bookings tables.';

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Helper
GRANT EXECUTE ON FUNCTION public.mask_phone(TEXT) TO anon, authenticated;

-- Machines
GRANT EXECUTE ON FUNCTION public.rpc_get_active_machines() TO anon, authenticated;

-- Customers
GRANT EXECUTE ON FUNCTION public.rpc_get_all_customers_admin() TO authenticated;

-- Bookings
GRANT EXECUTE ON FUNCTION public.rpc_create_booking(UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_booking(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_checkin_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_bookings_schedule(UUID, DATE, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_bookings(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_bookings_by_date(DATE, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_get_bookings_by_machine_date(UUID, DATE, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_is_booking_slot_available(UUID, DATE, TIME, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_booking_stats() TO authenticated, service_role;

-- Walk-in Queue
GRANT EXECUTE ON FUNCTION public.rpc_get_waiting_queue() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_join_walk_in_queue(TEXT, TEXT, INTEGER, TEXT, UUID, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_call_queue_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_walk_in_queue(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_walk_in_queue(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_walk_in_queue_stats() TO anon, authenticated;

-- Sessions
GRANT EXECUTE ON FUNCTION public.rpc_start_session(UUID, TEXT, UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_end_session(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_session_payment(UUID, public.payment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_session_amount(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_active_sessions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_today_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_session_stats(DATE, DATE) TO authenticated;

-- Backend Stats
GRANT EXECUTE ON FUNCTION public.rpc_get_backend_stats() TO authenticated;
