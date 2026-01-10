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
CREATE OR REPLACE FUNCTION rpc_search_queues_by_phone(
  p_phone text,
  p_local_customer_id uuid DEFAULT NULL
)
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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Normalize input phone: remove non-digits
  -- And compare with normalized table phone
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
  FROM queues q
  JOIN customers c ON q.customer_id = c.id
  JOIN machines m ON q.machine_id = m.id
  WHERE 
    -- Phone match
    regexp_replace(c.phone, '\D', '', 'g') LIKE '%' || regexp_replace(p_phone, '\D', '', 'g') || '%'
    AND (
      -- Security Condition 1: Guest Ownership
      -- Must match local_customer_id AND have no profile linked
      (p_local_customer_id IS NOT NULL AND c.id = p_local_customer_id AND c.profile_id IS NULL)
      OR
      -- Security Condition 2: Authenticated User
      -- Must own the profile linked to the customer
      (auth.uid() IS NOT NULL AND c.profile_id = auth.uid())
    )
  ORDER BY q.booking_time DESC
  LIMIT 50;
END;
$$;
