-- Create RPC for getting bookings for ALL machines for a specific date
-- Optimized for Dashboard to avoid N+1 queries
-- Updated with consistent security logic

CREATE OR REPLACE FUNCTION rpc_get_bookings_by_date(
    p_date DATE,
    p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
    booking_id UUID,
    machine_id UUID,
    machine_name TEXT,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    business_timezone TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    local_date DATE,
    local_start_time TIME,
    local_end_time TIME,
    is_cross_midnight BOOLEAN,
    is_owner BOOLEAN
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
        m.name AS machine_name,
        b.customer_id,
        c.name AS customer_name,
        -- Privacy: Phone shown only for admin/moderator or owner
        CASE 
            WHEN v_is_admin THEN c.phone
            WHEN p_customer_id IS NOT NULL AND b.customer_id = p_customer_id THEN c.phone
            ELSE NULL 
        END AS customer_phone,
        b.start_at,
        b.end_at,
        b.duration_minutes,
        b.business_timezone,
        b.status::TEXT,
        b.created_at,
        b.local_date,
        b.local_start_time,
        b.local_end_time,
        b.is_cross_midnight,
        (p_customer_id IS NOT NULL AND b.customer_id = p_customer_id) as is_owner
    FROM
        bookings b
    JOIN
        machines m ON b.machine_id = m.id
    LEFT JOIN
        customers c ON b.customer_id = c.id
    WHERE
        (
            b.local_date = p_date
            OR
            (b.is_cross_midnight AND b.local_end_date = p_date)
        )
    ORDER BY
        b.local_start_time ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_get_bookings_by_date(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_bookings_by_date(DATE, UUID) TO service_role;
