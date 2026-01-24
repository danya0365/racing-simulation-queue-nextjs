-- Advance Booking System
-- Created: 2026-01-12
-- Description: Tables and RPC functions for advance booking (scheduled time slots)
-- This is SEPARATE from queues table to allow both systems to coexist independently

-- Create advance booking status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advance_booking_status') THEN
        CREATE TYPE public.advance_booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
    END IF;
END $$;

-- Create advance_bookings table
CREATE TABLE IF NOT EXISTS public.advance_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    booking_date DATE NOT NULL,                    -- The date of the booking (YYYY-MM-DD)
    start_time TIME NOT NULL,                      -- Start time (HH:MM)
    end_time TIME NOT NULL,                        -- End time (HH:MM)
    duration INTEGER NOT NULL DEFAULT 60,          -- Duration in minutes
    status public.advance_booking_status NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.advance_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advance_bookings
CREATE POLICY "Advance bookings are viewable by everyone"
    ON public.advance_bookings FOR SELECT
    USING (true);

CREATE POLICY "Advance bookings can be created by anyone"
    ON public.advance_bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Advance bookings can be updated by admins/moderators"
    ON public.advance_bookings FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Advance bookings can be deleted by admins/moderators"
    ON public.advance_bookings FOR DELETE
    USING (public.is_moderator_or_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_advance_bookings_machine_date 
    ON public.advance_bookings(machine_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_advance_bookings_date_status 
    ON public.advance_bookings(booking_date, status);
CREATE INDEX IF NOT EXISTS idx_advance_bookings_customer 
    ON public.advance_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_advance_bookings_status 
    ON public.advance_bookings(status);

-- Create trigger for updating timestamps
CREATE TRIGGER update_advance_bookings_updated_at
    BEFORE UPDATE ON public.advance_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Function: Get day schedule for a machine
CREATE OR REPLACE FUNCTION public.rpc_get_advance_schedule(
    p_machine_id UUID,
    p_date DATE
)
RETURNS TABLE (
    booking_id UUID,
    start_time TIME,
    end_time TIME,
    duration INTEGER,
    status TEXT,
    customer_name TEXT,
    customer_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ab.id AS booking_id,
        ab.start_time,
        ab.end_time,
        ab.duration,
        ab.status::TEXT,
        c.name AS customer_name,
        CASE 
            WHEN public.is_moderator_or_admin() THEN c.phone
            ELSE public.mask_phone(c.phone)
        END AS customer_phone
    FROM public.advance_bookings ab
    JOIN public.customers c ON c.id = ab.customer_id
    WHERE ab.machine_id = p_machine_id
      AND ab.booking_date = p_date
      AND ab.status IN ('pending', 'confirmed')
    ORDER BY ab.start_time;
END;
$$;

-- Function: Create advance booking
CREATE OR REPLACE FUNCTION public.rpc_create_advance_booking(
    p_machine_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_booking_date DATE,
    p_start_time TIME,
    p_duration INTEGER,
    p_notes TEXT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL -- Added for ownership verification
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_end_time TIME;
    v_booking_id UUID;
    v_conflict_count INTEGER;
    v_existing_customer RECORD;
    v_current_profile_id UUID;
BEGIN
    -- Get current profile id once
    v_current_profile_id := public.get_active_profile_id();

    -- Calculate end time
    v_end_time := p_start_time + (p_duration || ' minutes')::INTERVAL;
    
    -- Check for time slot conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.advance_bookings
    WHERE machine_id = p_machine_id
      AND booking_date = p_booking_date
      AND status IN ('pending', 'confirmed')
      AND (
          (start_time < v_end_time AND end_time > p_start_time)  -- Overlapping
      );
    
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
    
    IF v_existing_customer IS NOT NULL THEN
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
    INSERT INTO public.advance_bookings (
        machine_id,
        customer_id,
        booking_date,
        start_time,
        end_time,
        duration,
        status,
        notes
    ) VALUES (
        p_machine_id,
        v_customer_id,
        p_booking_date,
        p_start_time,
        v_end_time,
        p_duration,
        'confirmed',
        p_notes
    )
    RETURNING id INTO v_booking_id;
    
    -- Return the created booking
    RETURN (
        SELECT json_build_object(
            'success', true,
            'booking', json_build_object(
                'id', ab.id,
                'machineId', ab.machine_id,
                'customerId', ab.customer_id,
                'customerName', c.name,
                'customerPhone', c.phone,
                'bookingDate', ab.booking_date,
                'startTime', ab.start_time::TEXT,
                'endTime', ab.end_time::TEXT,
                'duration', ab.duration,
                'status', ab.status,
                'createdAt', ab.created_at
            )
        )
        FROM public.advance_bookings ab
        JOIN public.customers c ON c.id = ab.customer_id
        WHERE ab.id = v_booking_id
    );
END;
$$;

-- Function: Cancel advance booking
CREATE OR REPLACE FUNCTION public.rpc_cancel_advance_booking(
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
    FROM public.advance_bookings
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
        -- Level 1: Check ownership via customer_id (basic)
        IF p_customer_id IS NULL OR v_booking.customer_id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ยกเลิกการจองนี้');
        END IF;

        -- Level 2: Profile Protection
        -- If booking belongs to a registered user, caller MUST be that user
        IF v_profile_id IS NOT NULL THEN
             IF v_current_profile_id IS NULL OR v_current_profile_id != v_profile_id THEN
                RETURN json_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบเพื่อยกเลิกการจอง');
             END IF;
        END IF;
    END IF;
    
    -- Cancel the booking
    UPDATE public.advance_bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Function: Get customer's advance bookings
CREATE OR REPLACE FUNCTION public.rpc_get_customer_advance_bookings(
    p_phone TEXT
)
RETURNS TABLE (
    booking_id UUID,
    machine_id UUID,
    machine_name TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    duration INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ab.id AS booking_id,
        ab.machine_id,
        m.name AS machine_name,
        ab.booking_date,
        ab.start_time,
        ab.end_time,
        ab.duration,
        ab.status::TEXT,
        ab.created_at
    FROM public.advance_bookings ab
    JOIN public.customers c ON c.id = ab.customer_id
    JOIN public.machines m ON m.id = ab.machine_id
    WHERE c.phone = p_phone
    ORDER BY ab.booking_date DESC, ab.start_time DESC
    LIMIT 50;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.rpc_get_advance_schedule(UUID, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_create_advance_booking(UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_advance_booking(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_customer_advance_bookings(TEXT) TO anon, authenticated;
