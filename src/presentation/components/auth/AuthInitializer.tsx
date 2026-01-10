'use client';

import { AuthProfile, AuthSession, AuthUser } from '@/src/application/repositories/IAuthRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';

/**
 * Global Auth Initializer
 * Single Source of Truth for Auth State
 * Manages Supabase subscription and broadcasts to Zustand store
 */
export const AuthInitializer: React.FC = () => {
  const { setSession, reset } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Helper to map Supabase User to AuthUser
    const mapUser = (user: any): AuthUser => ({
      id: user.id,
      email: user.email || '',
      emailVerified: !!user.email_confirmed_at,
      phone: user.phone || undefined,
      createdAt: user.created_at || new Date().toISOString(),
      lastLoginAt: user.last_sign_in_at || undefined,
    });

    // Helper to map Supabase Profile to AuthProfile
    const mapProfile = (profile: any): AuthProfile => {
      const preferences = profile.preferences || {};
      return {
        id: profile.id,
        authId: profile.auth_id,
        username: profile.username || undefined,
        fullName: profile.full_name || undefined,
        phone: profile.phone || undefined,
        avatarUrl: profile.avatar_url || undefined,
        dateOfBirth: profile.date_of_birth || undefined,
        gender: profile.gender,
        address: profile.address || undefined,
        bio: profile.bio || undefined,
        preferences: {
          language: preferences.language || 'th',
          notifications: preferences.notifications ?? true,
          theme: preferences.theme || 'auto',
        },
        socialLinks: profile.social_links,
        verificationStatus: profile.verification_status,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    };

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', userId)
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        return data ? mapProfile(data) : null;
      } catch (err) {
        console.error('Exception fetching profile:', err);
        return null;
      }
    };

    // Initialize Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch additional profile data
          const profile = await fetchProfile(session.user.id);
          
          const authSession: AuthSession = {
            user: mapUser(session.user),
            profile,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at || 0,
          };
          
          setSession(authSession);
        } else {
          // Logged out or no session
          reset();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthInitializer;
