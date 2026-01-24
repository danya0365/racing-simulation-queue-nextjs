-- ============================================================
-- Phase 2: Walk-In Queue Table
-- Created: 2026-01-19
-- Description: New walk_in_queue table with redesigned status flow
-- Replaces the old queues table with better design
-- ============================================================

-- ============================================================
-- ENUM TYPE
-- ============================================================

CREATE TYPE public.walk_in_status AS ENUM ('waiting', 'called', 'seated', 'cancelled');

-- ============================================================
-- MAIN TABLE: walk_in_queue
-- ============================================================

CREATE TABLE IF NOT EXISTS public.walk_in_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer reference (required)
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    
    -- Optional preferred machine
    preferred_machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    
    -- Queue details
    party_size INTEGER NOT NULL DEFAULT 1,
    preferred_station_type TEXT,  -- e.g., "Racing Sim", "PS5"
    queue_number INTEGER NOT NULL,
    
    -- Status flow: waiting -> called -> seated -> (creates session)
    --              waiting -> cancelled
    status public.walk_in_status NOT NULL DEFAULT 'waiting',
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When customer joined queue
    called_at TIMESTAMPTZ,                         -- When staff called customer
    seated_at TIMESTAMPTZ,                         -- When customer was seated
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT walk_in_queue_party_size_check CHECK (party_size > 0 AND party_size <= 10)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.walk_in_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Walk-in queue is viewable by admins or owners"
    ON public.walk_in_queue FOR SELECT
    USING (
        public.is_moderator_or_admin() 
        OR 
        EXISTS (
            SELECT 1 FROM public.customers c
            JOIN public.profiles p ON p.id = c.profile_id
            WHERE c.id = public.walk_in_queue.customer_id 
            AND p.auth_id = auth.uid()
        )
    );

-- Only admins/moderators can insert directly. Guests must use rpc_join_walk_in_queue.
CREATE POLICY "Walk-in queue can be created by admins"
    ON public.walk_in_queue FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

-- Only admins/moderators can update
CREATE POLICY "Walk-in queue can be updated by admins/moderators"
    ON public.walk_in_queue FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

-- Only admins/moderators can delete
CREATE POLICY "Walk-in queue can be deleted by admins/moderators"
    ON public.walk_in_queue FOR DELETE
    USING (public.is_moderator_or_admin());

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary query: Get waiting queue
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_status 
    ON public.walk_in_queue(status);

-- Queue order: by queue number
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_number 
    ON public.walk_in_queue(queue_number);

-- Filter by customer
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_customer 
    ON public.walk_in_queue(customer_id);

-- Filter by date (joined_at)
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_joined_at 
    ON public.walk_in_queue(joined_at);

-- Composite: waiting queues ordered by number
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_waiting_order 
    ON public.walk_in_queue(status, queue_number) 
    WHERE status = 'waiting';

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE TRIGGER update_walk_in_queue_updated_at
    BEFORE UPDATE ON public.walk_in_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC FUNCTION: Get waiting queue
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_waiting_queue()
RETURNS TABLE (
    queue_id UUID,
    queue_number INTEGER,
    customer_name TEXT,
    customer_phone_masked TEXT,
    party_size INTEGER,
    preferred_station_type TEXT,
    preferred_machine_name TEXT,
    status TEXT,
    joined_at TIMESTAMPTZ,
    wait_time_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wq.id AS queue_id,
        wq.queue_number,
        c.name AS customer_name,
        public.mask_phone(c.phone) AS customer_phone_masked,
        wq.party_size,
        wq.preferred_station_type,
        m.name AS preferred_machine_name,
        wq.status::TEXT,
        wq.joined_at,
        EXTRACT(EPOCH FROM (NOW() - wq.joined_at))::INTEGER / 60 AS wait_time_minutes
    FROM public.walk_in_queue wq
    JOIN public.customers c ON c.id = wq.customer_id
    LEFT JOIN public.machines m ON m.id = wq.preferred_machine_id
    WHERE wq.status = 'waiting'
    ORDER BY wq.queue_number ASC;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Join walk-in queue
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_join_walk_in_queue(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_party_size INTEGER DEFAULT 1,
    p_preferred_station_type TEXT DEFAULT NULL,
    p_preferred_machine_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL  -- Added for ownership verification
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
    -- Input sanitization
    p_customer_phone := TRIM(p_customer_phone);
    p_customer_name := TRIM(p_customer_name);

    -- Prevent concurrent duplicate creation for the same phone number
    PERFORM pg_advisory_xact_lock(hashtext('customer_creation_' || p_customer_phone));
    
    -- Get current profile id once for performance
    v_current_profile_id := public.get_active_profile_id();

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

        -- SECURITY CHECK 2: If phone exists, p_customer_id MUST match (for guest flow)
        -- Exception: Admin/Moderator can bypass (if needed, but for now strict for guest)
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
    
    -- Get next queue number for today
    SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_queue_number
    FROM public.walk_in_queue
    WHERE joined_at::DATE = CURRENT_DATE;
    
    -- Create queue entry
    INSERT INTO public.walk_in_queue (
        customer_id,
        preferred_machine_id,
        party_size,
        preferred_station_type,
        queue_number,
        notes
    ) VALUES (
        v_customer_id,
        p_preferred_machine_id,
        p_party_size,
        p_preferred_station_type,
        v_queue_number,
        p_notes
    )
    RETURNING id INTO v_queue_id;
    
    -- Return the created queue entry
    RETURN json_build_object(
        'success', true,
        'queue', json_build_object(
            'id', v_queue_id,
            'customerId', v_customer_id,
            'queueNumber', v_queue_number,
            'partySize', p_party_size,
            'preferredStationType', p_preferred_station_type,
            'status', 'waiting',
            'joinedAt', NOW()
        )
    );
END;
$$;

-- ============================================================
-- RPC FUNCTION: Call customer from queue
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_call_queue_customer(
    p_queue_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue RECORD;
BEGIN
    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    -- Get queue
    SELECT * INTO v_queue FROM public.walk_in_queue WHERE id = p_queue_id;
    
    IF v_queue IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบคิวนี้');
    END IF;
    
    IF v_queue.status != 'waiting' THEN
        RETURN json_build_object('success', false, 'error', 'สถานะคิวไม่ถูกต้อง');
    END IF;
    
    -- Update status to called
    UPDATE public.walk_in_queue
    SET status = 'called', called_at = NOW(), updated_at = NOW()
    WHERE id = p_queue_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC FUNCTION: Seat customer (creates session)
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_seat_queue_customer(
    p_queue_id UUID,
    p_machine_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue RECORD;
    v_customer RECORD;
    v_machine RECORD;
BEGIN
    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    -- Get queue with customer
    SELECT wq.*, c.name as customer_name
    INTO v_queue
    FROM public.walk_in_queue wq
    JOIN public.customers c ON c.id = wq.customer_id
    WHERE wq.id = p_queue_id;
    
    IF v_queue IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบคิวนี้');
    END IF;
    
    IF v_queue.status NOT IN ('waiting', 'called') THEN
        RETURN json_build_object('success', false, 'error', 'สถานะคิวไม่ถูกต้อง');
    END IF;
    
    -- Check machine availability
    SELECT * INTO v_machine FROM public.machines WHERE id = p_machine_id;
    
    IF v_machine IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบเครื่องนี้');
    END IF;
    
    IF v_machine.status != 'available' THEN
        RETURN json_build_object('success', false, 'error', 'เครื่องนี้ไม่ว่าง');
    END IF;
    
    -- Update queue status to seated
    UPDATE public.walk_in_queue
    SET status = 'seated', seated_at = NOW(), updated_at = NOW()
    WHERE id = p_queue_id;
    
    -- Update machine status to occupied
    UPDATE public.machines
    SET status = 'occupied', updated_at = NOW()
    WHERE id = p_machine_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'ลูกค้าได้รับการจัดที่นั่งแล้ว'
    );
END;
$$;

-- ============================================================
-- RPC FUNCTION: Cancel queue entry
-- ============================================================

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
    -- Get current profile
    v_current_profile_id := public.get_active_profile_id();

    -- Get queue
    SELECT * INTO v_queue 
    FROM public.walk_in_queue 
    WHERE id = p_queue_id;
    
    IF v_queue IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบคิวนี้');
    END IF;

    -- Get profile id
    SELECT profile_id INTO v_profile_id
    FROM public.customers
    WHERE id = v_queue.customer_id;
    
    -- Check permission: admin or owner
    IF NOT public.is_moderator_or_admin() THEN
         -- Ownership check
         IF p_customer_id IS NULL OR v_queue.customer_id != p_customer_id THEN
            RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ยกเลิกคิวนี้');
         END IF;

         -- Profile Protection check
         IF v_profile_id IS NOT NULL THEN
            IF v_current_profile_id IS NULL OR v_current_profile_id != v_profile_id THEN
                RETURN json_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบเพื่อยกเลิก');
            END IF;
         END IF;
    END IF;
    
    IF v_queue.status NOT IN ('waiting', 'called') THEN
        RETURN json_build_object('success', false, 'error', 'ไม่สามารถยกเลิกคิวนี้ได้');
    END IF;
    
    -- Cancel the queue
    UPDATE public.walk_in_queue
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_queue_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get my queue status
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_my_walk_in_queue(
    p_customer_id UUID
)
RETURNS TABLE (
    queue_id UUID,
    queue_number INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    party_size INTEGER,
    preferred_station_type TEXT,
    preferred_machine_name TEXT,
    notes TEXT,
    status TEXT,
    queues_ahead INTEGER,
    estimated_wait_minutes INTEGER,
    joined_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wq.id AS queue_id,
        wq.queue_number,
        c.name AS customer_name,
        c.phone AS customer_phone,
        wq.party_size,
        wq.preferred_station_type,
        m.name AS preferred_machine_name,
        wq.notes,
        wq.status::TEXT,
        (
            SELECT COUNT(*)::INTEGER 
            FROM public.walk_in_queue wq2 
            WHERE wq2.status = 'waiting' 
            AND wq2.queue_number < wq.queue_number
        ) AS queues_ahead,
        (
            SELECT COUNT(*)::INTEGER * 30  -- Estimate 30 min per queue
            FROM public.walk_in_queue wq2 
            WHERE wq2.status = 'waiting' 
            AND wq2.queue_number < wq.queue_number
        ) AS estimated_wait_minutes,
        wq.joined_at,
        wq.called_at
    FROM public.walk_in_queue wq
    JOIN public.customers c ON c.id = wq.customer_id
    LEFT JOIN public.machines m ON m.id = wq.preferred_machine_id
    WHERE wq.customer_id = p_customer_id
      AND wq.status IN ('waiting', 'called')
    ORDER BY wq.joined_at DESC
    LIMIT 5;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Get queue stats
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_walk_in_queue_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_waiting_count INTEGER;
    v_called_count INTEGER;
    v_seated_today INTEGER;
    v_cancelled_today INTEGER;
    v_avg_wait_minutes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_waiting_count
    FROM public.walk_in_queue
    WHERE status = 'waiting';
    
    SELECT COUNT(*) INTO v_called_count
    FROM public.walk_in_queue
    WHERE status = 'called';
    
    SELECT COUNT(*) INTO v_seated_today
    FROM public.walk_in_queue
    WHERE status = 'seated'
      AND seated_at::DATE = CURRENT_DATE;
    
    SELECT COUNT(*) INTO v_cancelled_today
    FROM public.walk_in_queue
    WHERE status = 'cancelled'
      AND updated_at::DATE = CURRENT_DATE;
    
    -- Average wait time for seated customers today
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (seated_at - joined_at)) / 60), 0)::INTEGER
    INTO v_avg_wait_minutes
    FROM public.walk_in_queue
    WHERE status = 'seated'
      AND seated_at::DATE = CURRENT_DATE;
    
    RETURN json_build_object(
        'waitingCount', v_waiting_count,
        'calledCount', v_called_count,
        'seatedToday', v_seated_today,
        'cancelledToday', v_cancelled_today,
        'averageWaitMinutes', v_avg_wait_minutes
    );
END;
$$;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON public.walk_in_queue TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.rpc_get_waiting_queue() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_join_walk_in_queue(TEXT, TEXT, INTEGER, TEXT, UUID, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_call_queue_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_seat_queue_customer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_walk_in_queue(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_walk_in_queue(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_walk_in_queue_stats() TO anon, authenticated;
