-- ============================================================
-- Racing Simulation Queue System - Schema
-- Created: 2026-01-08 (Consolidated for Production)
-- Description: Tables, indexes, policies, and triggers
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'machine_status') THEN
        CREATE TYPE public.machine_status AS ENUM ('available', 'occupied', 'maintenance');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'checked_in');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'walk_in_status') THEN
        CREATE TYPE public.walk_in_status AS ENUM ('waiting', 'called', 'seated', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'partial');
    END IF;
END $$;

-- ============================================================
-- TABLE: machines
-- ============================================================

CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status public.machine_status NOT NULL DEFAULT 'available',
    type TEXT DEFAULT 'Racing Sim',
    hourly_rate DECIMAL(10,2) DEFAULT 200.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON COLUMN public.machines.type IS 'Station type for categorization (e.g., Racing Sim, PS5, PC)';
COMMENT ON COLUMN public.machines.hourly_rate IS 'Price per hour in THB';

-- Enable RLS
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Machines are viewable by everyone"
    ON public.machines FOR SELECT
    USING (true);

CREATE POLICY "Only admins/moderators can modify machines"
    ON public.machines FOR ALL
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_position ON public.machines(position);
CREATE INDEX IF NOT EXISTS idx_machines_type ON public.machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_id_status ON public.machines(id, status) WHERE is_active = true;

-- Trigger
CREATE TRIGGER update_machines_updated_at
    BEFORE UPDATE ON public.machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: customers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    visit_count INTEGER NOT NULL DEFAULT 0,
    total_play_time INTEGER NOT NULL DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers are viewable by admins/moderators or owner"
    ON public.customers FOR SELECT
    USING (public.is_moderator_or_admin() OR profile_id = public.get_active_profile_id());

CREATE POLICY "Customers can be created by anyone"
    ON public.customers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Customers can be updated by admins/moderators or owner"
    ON public.customers FOR UPDATE
    USING (public.is_moderator_or_admin() OR profile_id = public.get_active_profile_id())
    WITH CHECK (public.is_moderator_or_admin() OR profile_id = public.get_active_profile_id());

CREATE POLICY "Customers can be deleted by admins/moderators"
    ON public.customers FOR DELETE
    USING (public.is_moderator_or_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON public.customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(auth_id);

-- Trigger
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: bookings
-- Timezone-aware with TIMESTAMPTZ and generated columns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    
    -- TIMESTAMPTZ: Stores exact moment in time (UTC internally)
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Duration in minutes
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Business timezone (IANA format)
    business_timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    
    -- Pricing
    total_price DECIMAL(10,2),
    
    -- Status
    status public.booking_status NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bookings_end_after_start CHECK (end_at > start_at),
    CONSTRAINT bookings_valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

-- Generated columns for fast local-time queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_date'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_date DATE GENERATED ALWAYS AS (
            (start_at AT TIME ZONE business_timezone)::DATE
        ) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_start_time'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_start_time TIME GENERATED ALWAYS AS (
            (start_at AT TIME ZONE business_timezone)::TIME
        ) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_end_time'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_end_time TIME GENERATED ALWAYS AS (
            (end_at AT TIME ZONE business_timezone)::TIME
        ) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'is_cross_midnight'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN is_cross_midnight BOOLEAN GENERATED ALWAYS AS (
            (start_at AT TIME ZONE business_timezone)::DATE != 
            (end_at AT TIME ZONE business_timezone)::DATE
        ) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'local_end_date'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN local_end_date DATE GENERATED ALWAYS AS (
            (end_at AT TIME ZONE business_timezone)::DATE
        ) STORED;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Bookings are viewable by admins or owners"
    ON public.bookings FOR SELECT
    USING (
        public.is_moderator_or_admin() 
        OR 
        EXISTS (
            SELECT 1 FROM public.customers c
            JOIN public.profiles p ON p.id = c.profile_id
            WHERE c.id = public.bookings.customer_id 
            AND p.auth_id = auth.uid()
        )
    );

CREATE POLICY "Bookings can be created by admins"
    ON public.bookings FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Bookings can be updated by admins/moderators"
    ON public.bookings FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Bookings can be deleted by admins/moderators"
    ON public.bookings FOR DELETE
    USING (public.is_moderator_or_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_machine_local_date ON public.bookings(machine_id, local_date);
CREATE INDEX IF NOT EXISTS idx_bookings_machine_local_end_date ON public.bookings(machine_id, local_end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_machine_time_range ON public.bookings(machine_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_machine_date_status ON public.bookings(machine_id, local_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_id_status ON public.bookings(id, status, machine_id);

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger Function: Calculate total_price
CREATE OR REPLACE FUNCTION public.calculate_booking_total_price()
RETURNS TRIGGER AS $$
DECLARE
    v_hourly_rate DECIMAL;
BEGIN
    SELECT COALESCE(hourly_rate, 200.00) INTO v_hourly_rate
    FROM public.machines
    WHERE id = NEW.machine_id;
    
    IF NEW.total_price IS NULL THEN
        NEW.total_price := CEIL(NEW.duration_minutes / 60.0) * v_hourly_rate;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculate booking price
DROP TRIGGER IF EXISTS calculate_booking_price ON public.bookings;
CREATE TRIGGER calculate_booking_price
    BEFORE INSERT OR UPDATE OF duration_minutes, machine_id
    ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_booking_total_price();

-- ============================================================
-- TABLE: walk_in_queue
-- Walk-in queue with redesigned status flow
-- ============================================================

CREATE TABLE IF NOT EXISTS public.walk_in_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer reference
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    
    -- Optional preferred machine
    preferred_machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    
    -- Queue details
    party_size INTEGER NOT NULL DEFAULT 1,
    preferred_station_type TEXT,
    queue_number INTEGER NOT NULL,
    
    -- Status: waiting -> called -> seated -> (creates session)
    status public.walk_in_status NOT NULL DEFAULT 'waiting',
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT walk_in_queue_party_size_check CHECK (party_size > 0 AND party_size <= 10)
);

-- Enable RLS
ALTER TABLE public.walk_in_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Walk-in queue is viewable by admins or owners"
    ON public.walk_in_queue FOR SELECT
    USING (
        public.is_moderator_or_admin() 
        OR 
        EXISTS (
            SELECT 1 FROM public.customers c
            JOIN public.profiles p ON p.id = c.profile_id
            WHERE c.id = public.walk_in_queue.customer_id 
            AND p.auth_id = auth.uid()
        )
    );

CREATE POLICY "Walk-in queue can be created by admins"
    ON public.walk_in_queue FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Walk-in queue can be updated by admins/moderators"
    ON public.walk_in_queue FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Walk-in queue can be deleted by admins/moderators"
    ON public.walk_in_queue FOR DELETE
    USING (public.is_moderator_or_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_status ON public.walk_in_queue(status);
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_number ON public.walk_in_queue(queue_number);
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_customer ON public.walk_in_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_joined_at ON public.walk_in_queue(joined_at);
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_waiting_order ON public.walk_in_queue(status, queue_number) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_walk_in_queue_id_status ON public.walk_in_queue(id, status, preferred_machine_id);

-- Trigger
CREATE TRIGGER update_walk_in_queue_updated_at
    BEFORE UPDATE ON public.walk_in_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: sessions
-- Track actual usage sessions on machines
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Machine reference
    station_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    
    -- Source reference (booking or walk-in, or null for manual)
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.walk_in_queue(id) ON DELETE SET NULL,
    
    -- Customer info
    customer_name TEXT NOT NULL,
    
    -- Time tracking
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    estimated_end_time TIMESTAMPTZ,
    
    -- Pricing
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status public.payment_status DEFAULT 'unpaid',
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment
COMMENT ON COLUMN public.sessions.estimated_end_time 
IS 'Estimated end time for walk-in/manual sessions. Used for slot availability calculation. NULL for booking-based sessions.';

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sessions are viewable by admins/moderators"
    ON public.sessions FOR SELECT
    USING (public.is_moderator_or_admin());

CREATE POLICY "Sessions can be created by admins/moderators"
    ON public.sessions FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Sessions can be updated by admins/moderators"
    ON public.sessions FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "Sessions can be deleted by admins/moderators"
    ON public.sessions FOR DELETE
    USING (public.is_moderator_or_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_station ON public.sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_booking ON public.sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_sessions_queue ON public.sessions(queue_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.sessions(station_id, end_time) WHERE end_time IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_payment ON public.sessions(payment_status);
CREATE INDEX IF NOT EXISTS idx_sessions_station_id ON public.sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active_estimated ON public.sessions(station_id, end_time, estimated_end_time) WHERE end_time IS NULL;

-- Trigger
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- GRANTS
-- ============================================================

GRANT ALL ON public.machines TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.bookings TO anon, authenticated;
GRANT ALL ON public.walk_in_queue TO anon, authenticated;
GRANT ALL ON public.sessions TO anon, authenticated;
