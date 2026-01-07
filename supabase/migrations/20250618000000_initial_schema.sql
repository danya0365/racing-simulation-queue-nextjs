-- ShopQueue Database Schema
-- Created: 2025-06-18
-- Author: Marosdee Uma
-- Description: Initial schema for ShopQueue application following Clean Architecture principles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_roles 
    WHERE rolname = current_user 
    AND rolbypassrls = true
  );
$$;

-- Create custom types
CREATE TYPE public.profile_role AS ENUM ('user', 'moderator', 'admin');


-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,

  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  bio TEXT,
  
  -- Preferences as JSONB
  preferences JSONB NOT NULL DEFAULT '{
    "language": "th",
    "notifications": true,
    "theme": "auto"
  }'::jsonb,
  
  -- Social links as JSONB
  social_links JSONB DEFAULT '{}'::jsonb,
  
  -- Verification status
  verification_status TEXT NOT NULL DEFAULT 'verified' 
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  
  -- Privacy settings as JSONB
  privacy_settings JSONB NOT NULL DEFAULT '{
    "show_phone": false,
    "show_email": false,
    "show_address": false
  }'::jsonb,
  
  -- Login tracking
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_id, username)
);

-- Create profile_roles table (managed by admins only)
CREATE TABLE IF NOT EXISTS public.profile_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.profile_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Create function to automatically create a role when a profile is created
CREATE OR REPLACE FUNCTION create_default_role_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default 'user' role for the newly created profile
  INSERT INTO public.profile_roles (profile_id, role, granted_by)
  VALUES (NEW.id, 'user'::public.profile_role, NEW.auth_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create a role when a profile is created
CREATE TRIGGER create_default_role_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION create_default_role_for_profile();