-- ============================================================
-- Update rpc_get_bookings_schedule to include Active Sessions
-- This ensures the booking grid shows "Booked" for walk-in/manual sessions
-- ============================================================

-- Drop function first to allow return type changes if any
DROP FUNCTION IF EXISTS public.rpc_get_bookings_schedule(UUID, DATE, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.rpc_get_bookings_schedule(
    p_machine_id UUID,
    p_date DATE,
    p_timezone TEXT DEFAULT 'Asia/Bangkok',
    p_customer_id UUID DEFAULT NULL  -- Optional: for ownership verification
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
    is_owner BOOLEAN,  -- Indicates if this is the caller's booking
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
    -- Check if user is admin/moderator once
    v_is_admin := public.is_moderator_or_admin();
    
    -- Calculate start/end of the requested local date in UTC
    -- Cast date to text for concatenation
    v_start_of_day := (p_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_timezone;
    v_end_of_day := v_start_of_day + INTERVAL '1 day';

    RETURN QUERY
    -- 1. Get Actual Bookings
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
      AND b.status IN ('pending', 'confirmed', 'seated') -- Include seated bookings too
      AND (
          b.local_date = p_date
          OR
          (b.is_cross_midnight AND b.local_end_date = p_date)
      )

    UNION ALL

    -- 2. Get Active Sessions (Walk-in / Manual) that are NOT from bookings
    -- converting them to pseudo-bookings for the schedule
    SELECT 
        s.id AS booking_id,
        s.start_time AS start_at,
        -- Use estimated end time, or default to 1 hour if null (shouldn't be null with new migration)
        COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') AS end_at,
        
        -- Local Start Time
        (s.start_time AT TIME ZONE p_timezone)::TIME AS local_start_time,
        
        -- Local End Time
        (COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') AT TIME ZONE p_timezone)::TIME AS local_end_time,
        
        -- Duration
        EXTRACT(EPOCH FROM (COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') - s.start_time))::INTEGER / 60 AS duration_minutes,
        
        -- Is Cross Midnight
        ((s.start_time AT TIME ZONE p_timezone)::DATE != (COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') AT TIME ZONE p_timezone)::DATE) AS is_cross_midnight,
        
        'confirmed' AS status, -- Treat as confirmed booking
        s.customer_name,
        NULL AS customer_phone, -- No phone for sessions usually
        FALSE AS is_owner,
        0 AS total_price
    FROM public.sessions s
    WHERE s.station_id = p_machine_id
      AND s.end_time IS NULL -- Active sessions only
      AND s.booking_id IS NULL -- Exclude sessions from bookings (already covered above)
      AND (
          -- Check overlap with the requested day
          s.start_time < v_end_of_day
          AND 
          COALESCE(s.estimated_end_time, s.start_time + INTERVAL '1 hour') > v_start_of_day
      )
    
    ORDER BY start_at;
END;
$$;
