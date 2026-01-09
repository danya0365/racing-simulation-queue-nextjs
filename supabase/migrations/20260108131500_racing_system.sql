-- Racing Simulation Queue System Tables
-- Created: 2026-01-08
-- Author: Antigravity (AI Assistant)
-- Description: Tables for managing racing simulators, customers, and queues

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'machine_status') THEN
        CREATE TYPE public.machine_status AS ENUM ('available', 'occupied', 'maintenance');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status') THEN
        CREATE TYPE public.queue_status AS ENUM ('waiting', 'playing', 'completed', 'cancelled');
    END IF;
END $$;

-- Create machines table
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status public.machine_status NOT NULL DEFAULT 'available',
  current_queue_id UUID, -- Will be linked to queues table later via FK
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Linked to profiles, can be NULL for guests
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0,
  total_play_time INTEGER NOT NULL DEFAULT 0, -- Total time in minutes
  last_visit TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create queues table
CREATE TABLE IF NOT EXISTS public.queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  booking_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL DEFAULT 60, -- Duration in minutes
  status public.queue_status NOT NULL DEFAULT 'waiting',
  position INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for current_queue_id in machines table
ALTER TABLE public.machines 
ADD CONSTRAINT fk_machines_current_queue 
FOREIGN KEY (current_queue_id) REFERENCES public.queues(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for machines
CREATE POLICY "Machines are viewable by everyone"
  ON public.machines FOR SELECT
  USING (true);

CREATE POLICY "Only admins/moderators can modify machines"
  ON public.machines FOR ALL
  USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

-- RLS Policies for customers
CREATE POLICY "Customers are viewable by admins/moderators"
  ON public.customers FOR SELECT
  USING (public.is_moderator_or_admin() OR profile_id = public.get_active_profile_id());

CREATE POLICY "Customers can be created by anyone" -- Guests can be created by staff or system
  ON public.customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Customers can be updated by admins/moderators"
  ON public.customers FOR UPDATE
  USING (public.is_moderator_or_admin() OR profile_id = public.get_active_profile_id())
  WITH CHECK (public.is_moderator_or_admin() OR profile_id = public.get_active_profile_id());

CREATE POLICY "Customers can be deleted by admins/moderators"
  ON public.customers FOR DELETE
  USING (public.is_moderator_or_admin());

-- RLS Policies for queues
CREATE POLICY "Queues are viewable by everyone"
  ON public.queues FOR SELECT
  USING (true);

CREATE POLICY "Queues can be created by anyone" -- Customers can book
  ON public.queues FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Queues can be updated by admins/moderators"
  ON public.queues FOR UPDATE
  USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_position ON public.machines(position);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON public.customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_queues_machine_id ON public.queues(machine_id);
CREATE INDEX IF NOT EXISTS idx_queues_customer_id ON public.queues(customer_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON public.queues(status);
CREATE INDEX IF NOT EXISTS idx_queues_booking_time ON public.queues(booking_time);

-- Create triggers for updating timestamps
CREATE TRIGGER update_machines_updated_at
BEFORE UPDATE ON public.machines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queues_updated_at
BEFORE UPDATE ON public.queues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
