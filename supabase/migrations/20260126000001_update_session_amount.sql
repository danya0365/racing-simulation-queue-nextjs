-- ============================================================
-- Migration: Add Update Session Amount Function
-- Created: 2026-01-26
-- Description: Allow admins to manually update session total amount
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_update_session_amount(
    p_session_id UUID,
    p_total_amount DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check permission
    IF NOT public.is_moderator_or_admin() THEN
        RETURN json_build_object('success', false, 'error', 'ไม่มีสิทธิ์ดำเนินการ');
    END IF;
    
    UPDATE public.sessions
    SET total_amount = p_total_amount, updated_at = NOW()
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบ session นี้');
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'session_id', p_session_id,
        'total_amount', p_total_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_session_amount(UUID, DECIMAL) TO authenticated;
