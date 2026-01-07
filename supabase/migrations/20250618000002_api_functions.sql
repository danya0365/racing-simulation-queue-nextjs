-- FilmNest API Functions
-- Created: 2025-06-18
-- Author: Marosdee Uma
-- Description: Supabase API functions for FilmNest application


-- Function to create a new profile (can be called by authenticated users)
CREATE OR REPLACE FUNCTION public.create_profile(
  username TEXT,
  full_name TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_profile_id UUID;
  auth_user_id UUID;
BEGIN
  -- Get the current user's auth ID
  auth_user_id := auth.uid();
  
  -- Check if the user exists
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for creating a profile';
  END IF;
  
  -- Insert the new profile
  INSERT INTO public.profiles (auth_id, username, full_name, avatar_url, is_active)
  VALUES (auth_user_id, username, full_name, avatar_url, FALSE)
  RETURNING id INTO new_profile_id;

  RETURN new_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profile role (can be called by anyone)
CREATE OR REPLACE FUNCTION public.get_profile_role(profile_id UUID)
RETURNS public.profile_role AS $$
DECLARE
  profile_role public.profile_role;
BEGIN
  SELECT role INTO profile_role FROM public.profile_roles WHERE profile_id = $1;
  RETURN COALESCE(profile_role, 'user'::public.profile_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active profile role for current user (can be called by anyone)
CREATE OR REPLACE FUNCTION public.get_active_profile_role()
RETURNS public.profile_role AS $$
DECLARE
  active_profile_id UUID;
  user_role public.profile_role;
BEGIN
  -- Get the active profile ID for current user
  SELECT id INTO active_profile_id FROM public.profiles 
  WHERE auth_id = auth.uid() AND is_active = true;
  
  -- If no active profile, return 'user' as default role
  IF active_profile_id IS NULL THEN
    RETURN 'user'::public.profile_role;
  END IF;
  
  -- Get the role for this profile
  SELECT role INTO user_role FROM public.profile_roles WHERE profile_id = active_profile_id;
  RETURN COALESCE(user_role, 'user'::public.profile_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set profile role (admin only)
CREATE OR REPLACE FUNCTION public.set_profile_role(
  target_profile_id UUID,
  new_role public.profile_role
)
RETURNS BOOLEAN AS $$
DECLARE
  admin_profile_id UUID;
  admin_role public.profile_role;
BEGIN
  -- Get the active profile ID for current user
  SELECT id INTO admin_profile_id FROM public.profiles 
  WHERE auth_id = auth.uid() AND is_active = true;
  
  -- Check if current user's active profile is admin
  SELECT role INTO admin_role FROM public.profile_roles WHERE profile_id = admin_profile_id;
  
  IF admin_role != 'admin'::public.profile_role THEN
    RAISE EXCEPTION 'Only administrators can change profile roles';
    RETURN false;
  END IF;
  
  -- Update or insert role
  INSERT INTO public.profile_roles (profile_id, role, granted_by)
  VALUES (target_profile_id, new_role, auth.uid())
  ON CONFLICT (profile_id) 
  DO UPDATE SET 
    role = new_role,
    granted_by = auth.uid(),
    granted_at = NOW();
    
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;