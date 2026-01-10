-- Function to get queue status details for multiple queue IDs
-- Optimized for "My Queue Status" page to reduce client-side requests
-- Calculates queue ahead and estimated wait time on server side

CREATE OR REPLACE FUNCTION rpc_get_my_queue_status(p_queue_ids uuid[])
RETURNS TABLE (
  id uuid,
  machine_id uuid,
  customer_id uuid,
  machine_name text,
  customer_name text,
  customer_phone text,
  booking_time timestamptz,
  duration int,
  status text,
  queue_position int,
  queue_ahead int,
  estimated_wait_minutes int
)
LANGUAGE plpgsql
SECURITY DEFINER -- Use security definer to bypass RLS for reading queue details
AS $$
BEGIN
  RETURN QUERY
  WITH target_queues AS (
    SELECT 
      q.id,
      q.machine_id,
      q.customer_id,
      q.booking_time,
      q.duration,
      q.status,
      q.position, -- using explicit column name
      m.name as machine_name,
      c.name as customer_name,
      c.phone as customer_phone
    FROM queues q
    JOIN machines m ON q.machine_id = m.id
    LEFT JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ANY(p_queue_ids)
  ),
  queue_stats AS (
    SELECT 
      tq.id,
      -- Count waiting queues ahead
      (
        SELECT COUNT(*)::int
        FROM queues q2 
        WHERE q2.machine_id = tq.machine_id 
        AND q2.status = 'waiting' 
        AND q2.position < tq.position
      ) as waiting_count_ahead,
      -- Check if there is a playing queue
      (
        SELECT COUNT(*)::int
        FROM queues q3
        WHERE q3.machine_id = tq.machine_id
        AND q3.status = 'playing'
      ) as playing_count,
       -- Sum duration of playing queue
      (
        SELECT COALESCE(SUM(q4.duration), 0)::int
        FROM queues q4
        WHERE q4.machine_id = tq.machine_id
        AND q4.status = 'playing'
      ) as playing_duration,
      -- Sum duration of waiting queues ahead
      (
        SELECT COALESCE(SUM(q5.duration), 0)::int
        FROM queues q5
        WHERE q5.machine_id = tq.machine_id
        AND q5.status = 'waiting' 
        AND q5.position < tq.position
      ) as waiting_duration_ahead
    FROM target_queues tq
  )
  SELECT 
    tq.id,
    tq.machine_id,
    tq.customer_id,
    tq.machine_name,
    COALESCE(tq.customer_name, 'Unknown'),
    COALESCE(tq.customer_phone, ''),
    tq.booking_time,
    tq.duration,
    tq.status::text,
    tq.position as queue_position,
    
    -- Calculate queue_ahead
    -- If status is waiting: waiting queues ahead + 1 if someone is playing
    -- If status is playing/completed/cancelled: 0
    CASE 
      WHEN tq.status = 'waiting' THEN qs.waiting_count_ahead + (CASE WHEN qs.playing_count > 0 THEN 1 ELSE 0 END)
      ELSE 0 
    END as queue_ahead,

    -- Calculate estimated_wait_minutes
    -- If status is waiting: duration of playing queue + duration of waiting queues ahead
    CASE 
      WHEN tq.status = 'waiting' THEN qs.playing_duration + qs.waiting_duration_ahead
      ELSE 0
    END as estimated_wait_minutes

  FROM target_queues tq
  JOIN queue_stats qs ON tq.id = qs.id;
END;
$$;
