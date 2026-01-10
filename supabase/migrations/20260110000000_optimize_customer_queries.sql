-- Function to get dashboard queue status for all machines
-- Replaces client-side calculation in CustomerPresenter and BookingWizardPresenter
-- Calculates wait times and queue counts on server

CREATE OR REPLACE FUNCTION rpc_get_machine_dashboard_info()
RETURNS TABLE (
  machine_id uuid,
  waiting_count int,
  playing_count int,
  estimated_wait_minutes int,
  next_position int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as machine_id,
    -- Count waiting queues
    COALESCE(SUM(CASE WHEN q.status = 'waiting' THEN 1 ELSE 0 END), 0)::int as waiting_count,
    -- Count playing queues
    COALESCE(SUM(CASE WHEN q.status = 'playing' THEN 1 ELSE 0 END), 0)::int as playing_count,
    -- Sum duration (waiting + playing)
    COALESCE(SUM(CASE WHEN q.status IN ('waiting', 'playing') THEN q.duration ELSE 0 END), 0)::int as estimated_wait_minutes,
    -- Calculate next position (max position + 1, or 1 if empty)
    COALESCE(MAX(q.position), 0)::int + 1 as next_position
  FROM machines m
  LEFT JOIN queues q ON m.id = q.machine_id AND q.status IN ('waiting', 'playing')
  WHERE m.is_active = true
  GROUP BY m.id;
END;
$$;

-- Function to search queues by phone number (normalized)
-- Prevents loading all queues to client
CREATE OR REPLACE FUNCTION rpc_search_queues_by_phone(p_phone text)
RETURNS SETOF queues
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Normalize input phone: remove non-digits
  -- And compare with normalized table phone
  RETURN QUERY
  SELECT q.*
  FROM queues q
  JOIN customers c ON q.customer_id = c.id
  WHERE 
    regexp_replace(c.phone, '\D', '', 'g') LIKE '%' || regexp_replace(p_phone, '\D', '', 'g') || '%'
  ORDER BY q.booking_time DESC
  LIMIT 50; -- Limit results for safety
END;
$$;
