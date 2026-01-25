-- Create RPC for getting booking statistics efficiently
-- This replaces fetching all rows and counting in client-side

CREATE OR REPLACE FUNCTION rpc_get_booking_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_pending INTEGER;
    v_confirmed INTEGER;
    v_seated INTEGER;
    v_cancelled INTEGER;
    v_completed INTEGER;
BEGIN
    -- Calculate all stats in a single pass using FILTER
    -- This is much faster than multiple COUNT(*) queries
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'confirmed'),
        COUNT(*) FILTER (WHERE status = 'seated'),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE status = 'completed')
    INTO 
        v_total,
        v_pending,
        v_confirmed,
        v_seated,
        v_cancelled,
        v_completed
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_get_booking_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_booking_stats() TO service_role;
