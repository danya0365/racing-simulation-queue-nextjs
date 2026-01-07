-- Backend User API Functions
-- Created: 2025-08-11
-- Author: Marosdee Uma
-- Description: RPC functions for backend user operations
-- Function to get paginated users with complete auth schema (admin only)
CREATE OR REPLACE FUNCTION public.get_paginated_users(
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_result JSONB;
    v_users JSONB;
BEGIN
    IF NOT is_service_role() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'insufficient_privilege: admin role required';
    END IF;

    -- Calculate offset
    v_offset := (p_page - 1) * p_limit;
    
    -- Get total count
    SELECT COUNT(*) INTO v_total FROM auth.users;
    
    -- Get users with complete auth schema and additional role/profile data
    WITH profile_counts AS (
        SELECT 
            p.auth_id,
            COUNT(*) AS count
        FROM 
            public.profiles p
        GROUP BY 
            p.auth_id
    ),
    users_data AS (
        SELECT 
            u.id,
            u.email,
            u.phone,
            u.email_confirmed_at,
            u.phone_confirmed_at,
            u.last_sign_in_at,
            u.created_at,
            u.updated_at,
            u.is_anonymous,
            u.raw_app_meta_data AS app_metadata,
            u.raw_user_meta_data AS user_metadata,
            -- Additional fields for backward compatibility
            COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown') AS name,
            u.banned_until,
            COALESCE(pc.count, 0)::BIGINT AS profiles_count
        FROM 
            auth.users u
        LEFT JOIN 
            profile_counts pc ON u.id = pc.auth_id
        ORDER BY 
            u.created_at DESC
        LIMIT 
            p_limit
        OFFSET 
            v_offset
    )
    SELECT 
        jsonb_agg(jsonb_build_object(
            -- Core auth schema fields
            'id', id,
            'email', email,
            'phone', phone,
            'email_confirmed_at', email_confirmed_at,
            'phone_confirmed_at', phone_confirmed_at,
            'last_sign_in_at', last_sign_in_at,
            'created_at', created_at,
            'updated_at', updated_at,
            'is_anonymous', is_anonymous,
            'app_metadata', COALESCE(app_metadata, '{}'::jsonb),
            'user_metadata', COALESCE(user_metadata, '{}'::jsonb),
            -- Additional fields for admin dashboard
            'name', name,
            'banned_until', banned_until,
            'profiles_count', profiles_count
        )) INTO v_users
    FROM 
        users_data;
    
    -- Build final result
    v_result := jsonb_build_object(
        'users', COALESCE(v_users, '[]'::jsonb),
        'total_count', v_total
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', 'function_error',
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get auth user by ID (admin only) - FIXED VERSION
CREATE OR REPLACE FUNCTION public.get_auth_user_by_id(
    p_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_user_exists BOOLEAN;
BEGIN
    -- Check permissions first
    IF NOT is_service_role() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'insufficient_privilege: admin role required';
    END IF;
    
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RETURN jsonb_build_object(
            'error', 'user_not_found',
            'message', 'User with specified ID does not exist'
        );
    END IF;
    
    -- Get user with complete auth schema and additional role/profile data
    WITH profile_counts AS (
        SELECT 
            p.auth_id,
            COUNT(*) AS count
        FROM 
            public.profiles p
        WHERE 
            p.auth_id = p_id
        GROUP BY 
            p.auth_id
    ),
    user_data AS (
        SELECT 
            u.id,
            u.email,
            u.phone,
            u.email_confirmed_at,
            u.phone_confirmed_at,
            u.last_sign_in_at,
            u.created_at,
            u.updated_at,
            u.is_anonymous,
            COALESCE(u.raw_app_meta_data, '{}'::jsonb) AS app_metadata,
            COALESCE(u.raw_user_meta_data, '{}'::jsonb) AS user_metadata,
            -- Additional fields for backward compatibility
            COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown') AS name,
            u.banned_until,
            COALESCE(pc.count, 0)::BIGINT AS profiles_count
        FROM 
            auth.users u
        LEFT JOIN 
            profile_counts pc ON u.id = pc.auth_id
        WHERE 
            u.id = p_id
    )
    SELECT 
        jsonb_build_object(
            -- Core auth schema fields
            'id', id,
            'email', email,
            'phone', phone,
            'email_confirmed_at', email_confirmed_at,
            'phone_confirmed_at', phone_confirmed_at,
            'last_sign_in_at', last_sign_in_at,
            'created_at', created_at,
            'updated_at', updated_at,
            'is_anonymous', is_anonymous,
            'app_metadata', app_metadata,
            'user_metadata', user_metadata,
            -- Additional fields for admin dashboard
            'name', name,
            'banned_until', banned_until,
            'profiles_count', profiles_count
        ) INTO v_result
    FROM 
        user_data;
    
    -- Return result or empty object if no data
    RETURN COALESCE(v_result, '{}'::jsonb);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', 'function_error',
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated role
GRANT EXECUTE ON FUNCTION public.get_paginated_users(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_id(TEXT) TO authenticated;

