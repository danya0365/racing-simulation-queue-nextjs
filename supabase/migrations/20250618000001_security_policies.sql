-- ShopQueue Security Policies
-- Created: 2025-06-18
-- Author: Marosdee Uma
-- Description: Row Level Security (RLS) policies for ShopQueue application

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;


-- Helper function to get active profile ID for current user
CREATE OR REPLACE FUNCTION public.get_active_profile_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  active_profile_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the active profile for the current user
  SELECT id INTO active_profile_id
  FROM public.profiles
  WHERE auth_id = auth.uid() AND is_active = TRUE
  LIMIT 1;
  
  RETURN active_profile_id;
END;
$$;

-- Create security definer functions for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_active_profile_role() = 'admin'::public.profile_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_active_profile_role() IN ('moderator'::public.profile_role, 'admin'::public.profile_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Authenticated users can create profiles for themselves
CREATE POLICY "Authenticated users can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = auth_id);

-- Users can update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Function to create profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (
    id, 
    auth_id,
    username, 
    full_name, 
    avatar_url, 
    is_active
  ) VALUES (
    gen_random_uuid(), 
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    true
  );
  
  -- Log the event
  RAISE NOTICE 'Profile created for user: %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid errors on migration rerun
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Profile roles policies
-- Profile roles are viewable by everyone
CREATE POLICY "Profile roles are viewable by everyone"
  ON public.profile_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update profile roles"
  ON public.profile_roles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert policy: authenticated users can create their own profile_roles only as 'user'; admins can create for anyone with any role
CREATE POLICY "Authenticated users can create their own profile_roles as user"
  ON public.profile_roles FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      public.is_admin()
      OR (
        role = 'user'::public.profile_role
        AND profile_id = public.get_active_profile_id()
      )
    )
  );
