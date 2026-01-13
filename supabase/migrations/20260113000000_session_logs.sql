-- Create booking_session_logs table
CREATE TABLE IF NOT EXISTS public.booking_session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.advance_bookings(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('START', 'STOP')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.booking_session_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Session logs are viewable by everyone"
    ON public.booking_session_logs FOR SELECT
    USING (true);

CREATE POLICY "Session logs can be inserted by authenticated users"
    ON public.booking_session_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_session_logs_booking_id 
    ON public.booking_session_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_session_logs_recorded_at 
    ON public.booking_session_logs(recorded_at);

-- RPC: Log a session action
CREATE OR REPLACE FUNCTION public.rpc_log_booking_session(
    p_booking_id UUID,
    p_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.booking_session_logs (booking_id, action)
    VALUES (p_booking_id, p_action);
    
    RETURN json_build_object('success', true);
END;
$$;

-- RPC: Get logs for bookings
CREATE OR REPLACE FUNCTION public.rpc_get_booking_session_logs(
    p_booking_ids UUID[]
)
RETURNS TABLE (
    booking_id UUID,
    action TEXT,
    recorded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bsl.booking_id,
        bsl.action,
        bsl.recorded_at
    FROM public.booking_session_logs bsl
    WHERE bsl.booking_id = ANY(p_booking_ids)
    ORDER BY bsl.recorded_at ASC;
END;
$$;

-- Grant permissions
GRANT ALL ON public.booking_session_logs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_log_booking_session(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_booking_session_logs(UUID[]) TO anon, authenticated;
