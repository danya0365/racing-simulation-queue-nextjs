
--------------------------------------------------------------------------------
-- RPC FUNCTIONS (Accessed via /rest/v1/rpc/...)
--------------------------------------------------------------------------------

-- Helper: Mask Phone Number
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF length(p_phone) < 7 THEN RETURN '***-****'; END IF;
    RETURN substr(p_phone, 1, 3) || '-XXX-' || substr(p_phone, -4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. GUEST RPC: Get Active Machines
CREATE OR REPLACE FUNCTION public.rpc_get_active_machines()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    machine_position INTEGER,
    status public.machine_status,
    is_active BOOLEAN
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT m.id, m.name, m.description, m.position as machine_position, m.status, m.is_active 
    FROM public.machines m 
    WHERE m.is_active = TRUE 
    ORDER BY m.position ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. GUEST RPC: Get Today's Queues (Masked Data)
CREATE OR REPLACE FUNCTION public.rpc_get_today_queues()
RETURNS TABLE (
    id UUID,
    customer_name TEXT,
    customer_phone_masked TEXT,
    machine_name TEXT,
    booking_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    status public.queue_status,
    queue_position INTEGER
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        c.name as customer_name,
        public.mask_phone(c.phone) as customer_phone_masked,
        m.name as machine_name,
        q.booking_time,
        q.duration,
        q.status,
        q.position as queue_position
    FROM public.queues q
    JOIN public.customers c ON q.customer_id = c.id
    JOIN public.machines m ON q.machine_id = m.id
    WHERE q.booking_time >= CURRENT_DATE AND q.booking_time < CURRENT_DATE + 1
    ORDER BY q.booking_time ASC;
END;
$$ LANGUAGE plpgsql;

-- 3. GUEST RPC: Create Booking
CREATE OR REPLACE FUNCTION public.rpc_create_booking(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_machine_id UUID,
    p_duration INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE
    v_customer_id UUID;
    v_queue_id UUID;
    v_next_pos INTEGER;
BEGIN
    -- 1. Find or Create Customer
    SELECT id INTO v_customer_id FROM public.customers WHERE phone = p_customer_phone LIMIT 1;
    
    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (name, phone, profile_id)
        VALUES (p_customer_name, p_customer_phone, public.get_active_profile_id())
        RETURNING id INTO v_customer_id;
    END IF;

    -- 2. Calculate Position
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_pos 
    FROM public.queues 
    WHERE machine_id = p_machine_id AND status IN ('waiting', 'playing');

    -- 3. Create Queue
    INSERT INTO public.queues (machine_id, customer_id, duration, position, notes, status)
    VALUES (p_machine_id, v_customer_id, p_duration, v_next_pos, p_notes, 'waiting')
    RETURNING id INTO v_queue_id;

    RETURN jsonb_build_object(
        'success', true,
        'queue_id', v_queue_id,
        'customer_id', v_customer_id,
        'position', v_next_pos
    );
END;
$$ LANGUAGE plpgsql;

-- 4. ADMIN RPC: Get Full Data Customers
CREATE OR REPLACE FUNCTION public.rpc_get_all_customers_admin()
RETURNS SETOF public.customers SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;
    RETURN QUERY SELECT * FROM public.customers ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. ADMIN RPC: Update Queue Status
CREATE OR REPLACE FUNCTION public.rpc_update_queue_status_admin(
    p_queue_id UUID,
    p_status public.queue_status
)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;
    
    UPDATE public.queues SET status = p_status, updated_at = NOW() WHERE id = p_queue_id;
    
    -- If status is playing, set machine status to occupied
    IF p_status = 'playing' THEN
        UPDATE public.machines 
        SET status = 'occupied', current_queue_id = p_queue_id 
        WHERE id = (SELECT machine_id FROM public.queues WHERE id = p_queue_id);
    ELSIF p_status IN ('completed', 'cancelled') THEN
        -- Clear machine if this was the current queue
        UPDATE public.machines 
        SET status = 'available', current_queue_id = NULL 
        WHERE current_queue_id = p_queue_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. GUEST RPC: Get Single Queue Details
CREATE OR REPLACE FUNCTION public.rpc_get_queue_details(p_queue_id UUID)
RETURNS TABLE (
    id UUID,
    machine_id UUID,
    customer_id UUID,
    machine_name TEXT,
    customer_name TEXT,
    customer_phone_masked TEXT,
    booking_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    status public.queue_status,
    queue_position INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.machine_id,
        q.customer_id,
        m.name as machine_name,
        c.name as customer_name,
        public.mask_phone(c.phone) as customer_phone_masked,
        q.booking_time,
        q.duration,
        q.status,
        q.position as queue_position,
        q.notes,
        q.created_at,
        q.updated_at
    FROM public.queues q
    JOIN public.customers c ON q.customer_id = c.id
    JOIN public.machines m ON q.machine_id = m.id
    WHERE q.id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- 7. GUEST RPC: Cancel Booking (Guest ownership verification)
CREATE OR REPLACE FUNCTION public.rpc_cancel_queue_guest(
    p_queue_id UUID,
    p_customer_id UUID
)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
    v_profile_id UUID;
    v_actual_customer_id UUID;
    v_status public.queue_status;
BEGIN
    -- 1. Get queue and customer info
    SELECT q.customer_id, q.status, c.profile_id 
    INTO v_actual_customer_id, v_status, v_profile_id
    FROM public.queues q
    JOIN public.customers c ON q.customer_id = c.id
    WHERE q.id = p_queue_id;

    -- 2. Validate ownership
    IF v_actual_customer_id IS NULL OR v_actual_customer_id != p_customer_id THEN
        RAISE EXCEPTION 'Ownership verification failed.';
    END IF;

    -- 3. Check status
    IF v_status != 'waiting' THEN
        RAISE EXCEPTION 'Only waiting queues can be cancelled.';
    END IF;

    -- 4. Check profile connection (Security)
    IF v_profile_id IS NOT NULL THEN
        -- If it's a registered user's booking, they must be authenticated
        IF auth.uid() IS NULL OR auth.uid() != v_profile_id THEN
            RAISE EXCEPTION 'Please login to cancel this booking.';
        END IF;
    END IF;

    -- 5. Perform cancellation
    UPDATE public.queues 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE id = p_queue_id;

    -- 6. Trigger machine status update
    UPDATE public.machines 
    SET status = 'available', current_queue_id = NULL 
    WHERE current_queue_id = p_queue_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on RPCs to anon and authenticated
GRANT EXECUTE ON FUNCTION public.rpc_get_active_machines() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_today_queues() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_create_booking(TEXT, TEXT, UUID, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_all_customers_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_queue_status_admin(UUID, public.queue_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_queue_details(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_queue_guest(UUID, UUID) TO anon, authenticated;
