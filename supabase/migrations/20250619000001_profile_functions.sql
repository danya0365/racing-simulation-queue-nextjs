-- ShopQueue Profile Functions
-- Created: 2025-06-19
-- Author: Marosdee Uma
-- Description: Adds profile management RPC functions

-- Create API function to set a profile as active
CREATE OR REPLACE FUNCTION public.set_profile_active(profile_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  auth_user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Check if user is authenticated
  auth_user_id := auth.uid();
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for setting profile active';
  END IF;
  
  -- Check if the profile belongs to the authenticated user
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = profile_id AND auth_id = auth_user_id
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RAISE EXCEPTION 'Profile not found or does not belong to the authenticated user';
    RETURN FALSE;
  END IF;
  
  -- Deactivate all profiles for this auth user
  UPDATE public.profiles
  SET is_active = false
  WHERE auth_id = auth_user_id;
  
  -- Activate the requested profile
  UPDATE public.profiles
  SET is_active = true
  WHERE id = profile_id;
  
  RETURN TRUE;
END;
$$;

-- Create API function to get active profile for current user
CREATE OR REPLACE FUNCTION public.get_active_profile()
RETURNS SETOF public.profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for getting active profile';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.profiles
  WHERE auth_id = auth.uid() AND is_active = true
  LIMIT 1;
END;
$$;

-- Create API function to get all profiles for current user
CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS SETOF public.profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for getting user profiles';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.profiles
  WHERE auth_id = auth.uid()
  ORDER BY is_active DESC, created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_profile_active TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profiles TO authenticated;


-- Create a function to migrate existing profiles to the new roles system
CREATE OR REPLACE FUNCTION public.migrate_profile_roles()
RETURNS void AS $$
DECLARE
  admin_auth_id UUID;
BEGIN
  -- Get admin user ID for granting roles
  SELECT id INTO admin_auth_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  -- Insert default 'user' role for all profiles that don't have a role yet
  INSERT INTO public.profile_roles (profile_id, role, granted_by)
  SELECT 
    p.id,
    'user'::public.profile_role,
    admin_auth_id
  FROM 
    public.profiles p
  WHERE 
    NOT EXISTS (SELECT 1 FROM public.profile_roles r WHERE r.profile_id = p.id)
  ON CONFLICT (profile_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
