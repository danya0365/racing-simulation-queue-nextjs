-- ============================================================
-- Phase 1: Machines Table Evolution
-- Created: 2026-01-19
-- Description: Add type and hourly_rate columns to machines table
-- ============================================================

-- Add type column for station categorization
-- e.g., "Racing Sim", "PS5", "PC", "Xbox", "Switch"
ALTER TABLE public.machines 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Racing Sim';

-- Add hourly rate for pricing calculation
ALTER TABLE public.machines 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 200.00;

-- Add comments for documentation
COMMENT ON COLUMN public.machines.type IS 'Station type for categorization (e.g., Racing Sim, PS5, PC)';
COMMENT ON COLUMN public.machines.hourly_rate IS 'Price per hour in THB';

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_machines_type ON public.machines(type);

-- ============================================================
-- Update RPC: Get active machines with new fields
-- Must DROP first because return type is changing
-- ============================================================

DROP FUNCTION IF EXISTS public.rpc_get_active_machines();

CREATE FUNCTION public.rpc_get_active_machines()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    machine_position INTEGER,
    status public.machine_status,
    is_active BOOLEAN,
    type TEXT,
    hourly_rate DECIMAL
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        m.id, 
        m.name, 
        m.description, 
        m.position as machine_position, 
        m.status, 
        m.is_active,
        m.type,
        m.hourly_rate
    FROM public.machines m 
    WHERE m.is_active = TRUE 
    ORDER BY m.position ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_get_active_machines() TO anon, authenticated;

