-- Function to get comprehensive backend stats using only server-side logic
-- Replaces multiple filtering queries in BackendPresenter
CREATE OR REPLACE FUNCTION rpc_get_backend_dashboard_stats()
RETURNS TABLE (
  total_machines int,
  available_machines int,
  occupied_machines int,
  maintenance_machines int,
  total_queues int,
  waiting_queues int,
  playing_queues int,
  completed_queues int,
  cancelled_queues int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::int FROM machines WHERE is_active = true) as total_machines,
    (SELECT COUNT(*)::int FROM machines WHERE is_active = true AND status = 'available') as available_machines,
    (SELECT COUNT(*)::int FROM machines WHERE is_active = true AND status = 'occupied') as occupied_machines,
    (SELECT COUNT(*)::int FROM machines WHERE status = 'maintenance') as maintenance_machines,
    
    (SELECT COUNT(*)::int FROM queues WHERE created_at >= CURRENT_DATE) as total_queues,
    (SELECT COUNT(*)::int FROM queues WHERE status = 'waiting' AND created_at >= CURRENT_DATE) as waiting_queues,
    (SELECT COUNT(*)::int FROM queues WHERE status = 'playing' AND created_at >= CURRENT_DATE) as playing_queues,
    (SELECT COUNT(*)::int FROM queues WHERE status = 'completed' AND created_at >= CURRENT_DATE) as completed_queues,
    (SELECT COUNT(*)::int FROM queues WHERE status = 'cancelled' AND created_at >= CURRENT_DATE) as cancelled_queues;
END;
$$;
