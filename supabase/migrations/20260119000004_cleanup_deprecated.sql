-- ============================================================
-- Phase 5: Cleanup Deprecated Tables and Columns
-- Created: 2026-01-19
-- Description: Remove deprecated tables and columns after schema redesign
-- 
-- DEPRECATED:
-- - queues table → replaced by walk_in_queue
-- - advance_bookings table → replaced by bookings
-- - booking_session_logs table → replaced by sessions
-- - booking_logs table → replaced by sessions
-- - machines.current_queue_id → sessions tracks active usage
-- ============================================================

-- ============================================================
-- DROP DEPRECATED RPC FUNCTIONS FIRST
-- ============================================================

-- Old queue functions
DROP FUNCTION IF EXISTS public.rpc_get_today_queues();
DROP FUNCTION IF EXISTS public.rpc_get_queue_details(UUID);
DROP FUNCTION IF EXISTS public.rpc_cancel_queue_guest(UUID, UUID);
DROP FUNCTION IF EXISTS public.rpc_update_queue_status_admin(UUID, public.queue_status);
DROP FUNCTION IF EXISTS public.rpc_reset_machine_queue(UUID);
DROP FUNCTION IF EXISTS public.rpc_get_backend_stats();
DROP FUNCTION IF EXISTS public.rpc_get_machine_dashboard_info();
DROP FUNCTION IF EXISTS public.rpc_get_my_queue_status(UUID);
DROP FUNCTION IF EXISTS public.rpc_search_queues_by_phone(TEXT, UUID);

-- Old advance booking functions
DROP FUNCTION IF EXISTS public.rpc_get_advance_schedule(UUID, DATE);
DROP FUNCTION IF EXISTS public.rpc_create_advance_booking(UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_cancel_advance_booking(UUID, UUID);
DROP FUNCTION IF EXISTS public.rpc_get_customer_advance_bookings(TEXT);

-- Old session log functions
DROP FUNCTION IF EXISTS public.rpc_log_booking_session(UUID, TEXT);
DROP FUNCTION IF EXISTS public.rpc_get_booking_session_logs(UUID[]);

-- ============================================================
-- DROP DEPRECATED TABLES
-- ============================================================

-- Drop booking_session_logs (references advance_bookings)
DROP TABLE IF EXISTS public.booking_session_logs CASCADE;

-- Drop booking_logs (references bookings - but we have sessions now)
DROP TABLE IF EXISTS public.booking_logs CASCADE;

-- Drop advance_bookings
DROP TABLE IF EXISTS public.advance_bookings CASCADE;

-- Drop queues (replaced by walk_in_queue)
DROP TABLE IF EXISTS public.queues CASCADE;

-- ============================================================
-- DROP DEPRECATED COLUMN FROM machines
-- ============================================================

-- Remove current_queue_id from machines (sessions tracks this now)
ALTER TABLE public.machines 
DROP COLUMN IF EXISTS current_queue_id;

-- ============================================================
-- DROP DEPRECATED ENUM TYPES
-- ============================================================

-- Note: We keep queue_status and advance_booking_status for now
-- They can only be dropped if no columns reference them
DROP TYPE IF EXISTS public.advance_booking_status CASCADE;

-- ============================================================
-- CLEANUP FOREIGN KEY CONSTRAINT
-- ============================================================

-- The FK fk_machines_current_queue should be dropped with the column
-- But let's ensure it's gone
ALTER TABLE public.machines 
DROP CONSTRAINT IF EXISTS fk_machines_current_queue;

-- ============================================================
-- UPDATE RPC: Get backend stats (new version without old queue references)
-- ============================================================

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
    INTO v_machine_stats
    FROM public.machines;
    
    -- Walk-in queue stats (new table)
    SELECT 
        COUNT(*) FILTER (WHERE status = 'waiting')::INTEGER AS waiting,
        COUNT(*) FILTER (WHERE status = 'called')::INTEGER AS called,
        COUNT(*) FILTER (WHERE status = 'seated' AND seated_at::DATE = CURRENT_DATE)::INTEGER AS seated_today,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at::DATE = CURRENT_DATE)::INTEGER AS cancelled_today
    INTO v_queue_stats
    FROM public.walk_in_queue;
    
    -- Session stats (today)
    SELECT 
        COUNT(*)::INTEGER AS total_today,
        COUNT(*) FILTER (WHERE end_time IS NULL)::INTEGER AS active,
        COALESCE(SUM(total_amount), 0)::DECIMAL AS revenue_today
    INTO v_session_stats
    FROM public.sessions
    WHERE start_time::DATE = CURRENT_DATE;
    
    -- Booking stats (today)
    SELECT 
        COUNT(*) FILTER (WHERE status = 'confirmed')::INTEGER AS confirmed,
        COUNT(*) FILTER (WHERE status = 'checked_in')::INTEGER AS checked_in,
        COUNT(*) FILTER (WHERE status = 'completed' AND local_date = CURRENT_DATE)::INTEGER AS completed_today
    INTO v_booking_stats
    FROM public.bookings
    WHERE local_date = CURRENT_DATE OR status IN ('confirmed', 'checked_in');
    
    RETURN json_build_object(
        'machines', json_build_object(
            'total', v_machine_stats.total,
            'available', v_machine_stats.available,
            'occupied', v_machine_stats.occupied,
            'maintenance', v_machine_stats.maintenance
        ),
        'walkInQueue', json_build_object(
            'waiting', v_queue_stats.waiting,
            'called', v_queue_stats.called,
            'seatedToday', v_queue_stats.seated_today,
            'cancelledToday', v_queue_stats.cancelled_today
        ),
        'sessions', json_build_object(
            'totalToday', v_session_stats.total_today,
            'active', v_session_stats.active,
            'revenueToday', v_session_stats.revenue_today
        ),
        'bookings', json_build_object(
            'confirmed', v_booking_stats.confirmed,
            'checkedIn', v_booking_stats.checked_in,
            'completedToday', v_booking_stats.completed_today
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.rpc_get_backend_stats() TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON FUNCTION public.rpc_get_backend_stats() IS 
'Get dashboard statistics for backend. Uses new walk_in_queue, sessions, and bookings tables.';
