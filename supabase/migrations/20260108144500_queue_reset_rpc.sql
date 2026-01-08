-- Migration: Add Reset Queue RPC and Update Query Logic
-- For 24-hour game shop operations

--------------------------------------------------------------------------------
-- 8. ADMIN RPC: Reset Machine Queue
-- Clears all active queues for a specific machine
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_reset_machine_queue(
    p_machine_id UUID
)
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE
    v_cancelled_count INTEGER := 0;
    v_completed_count INTEGER := 0;
BEGIN
    -- Check admin permission
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;

    -- Mark all waiting queues as cancelled
    UPDATE public.queues 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE machine_id = p_machine_id AND status = 'waiting';
    GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

    -- Mark all playing queues as completed
    UPDATE public.queues 
    SET status = 'completed', updated_at = NOW() 
    WHERE machine_id = p_machine_id AND status = 'playing';
    GET DIAGNOSTICS v_completed_count = ROW_COUNT;

    -- Reset machine status to available
    UPDATE public.machines 
    SET status = 'available', current_queue_id = NULL, updated_at = NOW()
    WHERE id = p_machine_id;

    RETURN jsonb_build_object(
        'success', true,
        'cancelled_count', v_cancelled_count,
        'completed_count', v_completed_count,
        'message', 'Queue reset successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_reset_machine_queue(UUID) TO authenticated;

--------------------------------------------------------------------------------
-- 9. RPC: Get Active and Recent Queues (for 24-hour operations)
-- Returns: Active queues (waiting/playing) + completed/cancelled in last 24 hours
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_active_and_recent_queues()
RETURNS TABLE (
    id UUID,
    machine_id UUID,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    machine_name TEXT,
    booking_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    status public.queue_status,
    queue_position INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER AS $$
BEGIN
    -- Check admin permission
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;

    RETURN QUERY
    SELECT 
        q.id,
        q.machine_id,
        q.customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        m.name as machine_name,
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
    WHERE 
        -- Active queues (always show)
        q.status IN ('waiting', 'playing')
        OR 
        -- Recently finished queues (last 24 hours)
        (q.status IN ('completed', 'cancelled') AND q.updated_at >= NOW() - INTERVAL '24 hours')
    ORDER BY 
        CASE q.status 
            WHEN 'playing' THEN 1 
            WHEN 'waiting' THEN 2 
            WHEN 'completed' THEN 3 
            WHEN 'cancelled' THEN 4 
        END,
        q.booking_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_get_active_and_recent_queues() TO authenticated;
