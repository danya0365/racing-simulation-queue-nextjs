/**
 * SupabaseAuthRepository
 * Supabase implementation for authentication
 * Following Clean Architecture - this is in the Infrastructure layer
 */

import type {
  AuthProfile,
  AuthResult,
  AuthSession,
  AuthUser,
  IAuthRepository,
  OTPSignInData,
  ResetPasswordData,
  SignInData,
  SignUpData,
  UpdatePasswordData,
  UpdateProfileData,
  VerifyOTPData,
} from '@/src/application/repositories/IAuthRepository';
import type { Database } from '@/src/domain/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Map Supabase user to AuthUser
   */
  private mapUser(user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    email_confirmed_at?: string | null;
    created_at?: string;
    last_sign_in_at?: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      emailVerified: !!user.email_confirmed_at,
      phone: user.phone || undefined,
      createdAt: user.created_at || new Date().toISOString(),
      lastLoginAt: user.last_sign_in_at || undefined,
    };
  }

  /**
   * Map Supabase profile to AuthProfile
   */
  private mapProfile(profile: Database['public']['Tables']['profiles']['Row']): AuthProfile {
    const preferences = profile.preferences as { language?: string; notifications?: boolean; theme?: string } || {};
    
    return {
      id: profile.id,
      authId: profile.auth_id,
      username: profile.username || undefined,
      fullName: profile.full_name || undefined,
      phone: profile.phone || undefined,
      avatarUrl: profile.avatar_url || undefined,
      dateOfBirth: profile.date_of_birth || undefined,
      gender: profile.gender as 'male' | 'female' | 'other' | undefined,
      address: profile.address || undefined,
      bio: profile.bio || undefined,
      preferences: {
        language: preferences.language || 'th',
        notifications: preferences.notifications ?? true,
        theme: (preferences.theme as 'light' | 'dark' | 'auto') || 'auto',
      },
      socialLinks: (profile.social_links as Record<string, string>) || undefined,
      verificationStatus: profile.verification_status as 'pending' | 'verified' | 'rejected',
      isActive: profile.is_active,
      createdAt: profile.created_at || new Date().toISOString(),
      updatedAt: profile.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'ไม่สามารถสร้างบัญชีได้',
        };
      }

      // Create profile for the new user
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          auth_id: authData.user.id,
          full_name: data.fullName,
          phone: data.phone,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      return {
        success: true,
        user: this.mapUser(authData.user),
        needsEmailVerification: !authData.user.email_confirmed_at,
        message: authData.user.email_confirmed_at 
          ? 'สมัครสมาชิกสำเร็จ' 
          : 'กรุณายืนยันอีเมลเพื่อเปิดใช้งานบัญชี',
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: 'ไม่สามารถเข้าสู่ระบบได้',
        };
      }

      // Get user profile
      const profile = await this.getProfile();

      return {
        success: true,
        user: this.mapUser(authData.user),
        session: {
          user: this.mapUser(authData.user),
          profile,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at || 0,
        },
        message: 'เข้าสู่ระบบสำเร็จ',
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      };
    }
  }

  /**
   * Sign in with OTP (phone)
   */
  async signInWithOTP(data: OTPSignInData): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signInWithOtp({
        phone: data.phone,
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      return {
        success: true,
        needsPhoneVerification: true,
        message: 'กรุณากรอกรหัส OTP ที่ส่งไปยังหมายเลขโทรศัพท์ของคุณ',
      };
    } catch (error) {
      console.error('OTP sign in error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่ง OTP',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: VerifyOTPData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await this.supabase.auth.verifyOtp({
        phone: data.phone,
        token: data.token,
        type: 'sms',
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: 'ไม่สามารถยืนยัน OTP ได้',
        };
      }

      const profile = await this.getProfile();

      return {
        success: true,
        user: this.mapUser(authData.user),
        session: {
          user: this.mapUser(authData.user),
          profile,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at || 0,
        },
        message: 'ยืนยัน OTP สำเร็จ',
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการยืนยัน OTP',
      };
    }
  }

  /**
   * Sign in with OAuth provider
   * Note: 'line' is not a standard Supabase provider, requires custom setup
   */
  async signInWithOAuth(provider: 'google' | 'facebook' | 'github' | 'line'): Promise<AuthResult> {
    try {
      // Line is not a built-in Supabase provider, show message
      if (provider === 'line') {
        return {
          success: false,
          error: 'การเข้าสู่ระบบด้วย Line ยังไม่พร้อมใช้งาน',
        };
      }

      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'facebook' | 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      // OAuth redirect will happen, return success
      return {
        success: true,
        message: 'กำลังเปลี่ยนเส้นทางไปยังผู้ให้บริการ...',
      };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย OAuth',
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      return {
        success: true,
        message: 'ออกจากระบบสำเร็จ',
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการออกจากระบบ',
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error || !session) {
        return null;
      }

      const profile = await this.getProfile();

      return {
        user: this.mapUser(session.user),
        profile,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || 0,
      };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return this.mapUser(user);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<AuthProfile | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !profile) {
        return null;
      }

      return this.mapProfile(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthProfile> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ไม่พบผู้ใช้');
      }

      const updateData: Partial<Database['public']['Tables']['profiles']['Update']> = {};

      if (data.username !== undefined) updateData.username = data.username;
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.bio !== undefined) updateData.bio = data.bio;

      if (data.preferences) {
        updateData.preferences = data.preferences as unknown as Database['public']['Tables']['profiles']['Update']['preferences'];
      }

      if (data.socialLinks) {
        updateData.social_links = data.socialLinks as unknown as Database['public']['Tables']['profiles']['Update']['social_links'];
      }

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('auth_id', user.id)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        throw new Error(this.translateAuthError(error.message));
      }

      return this.mapProfile(profile);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(data: ResetPasswordData): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      return {
        success: true,
        message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน',
      };
    }
  }

  /**
   * Update password (when authenticated)
   */
  async updatePassword(data: UpdatePasswordData): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      return {
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ',
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
      };
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      return {
        success: true,
        message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว',
      };
    } catch (error) {
      console.error('Resend email verification error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน',
      };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'ไม่สามารถยืนยันอีเมลได้',
        };
      }

      return {
        success: true,
        user: this.mapUser(data.user),
        message: 'ยืนยันอีเมลสำเร็จ',
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการยืนยันอีเมล',
      };
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();

      if (error || !session) {
        return null;
      }

      const profile = await this.getProfile();

      return {
        user: this.mapUser(session.user),
        profile,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || 0,
      };
    } catch (error) {
      console.error('Refresh session error:', error);
      return null;
    }
  }

  private authListener: { unsubscribe: () => void } | null = null;
  private subscribers: ((session: AuthSession | null) => void)[] = [];
  private isProcessingAuthChange = false;
  private lastSession: AuthSession | null = null;

  /**
   * Subscribe to auth state changes
   * Implements Singleton Listener pattern with State Replay
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    // 1. Add subscriber
    this.subscribers.push(callback);

    // 2. Replay last known state immediately if available
    // This allows components mounting LATER to get the current user instantly
    if (this.lastSession) {
      callback(this.lastSession);
    } else if (this.authListener) {
        // If listener is active but no session (logged out), notify null
        // But be careful not to notify null if we are just "loading"
        // For now, we only replay if we have a session.
        // Logic can be improved to have "lastState" which includes null.
    }

    // 3. Initialize listener if not active
    if (!this.authListener) {
      const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (this.isProcessingAuthChange) return;
          this.isProcessingAuthChange = true;

          try {
            if (session) {
              // Fetch profile only once per event
              const profile = await this.getProfile();
              const authSession: AuthSession = {
                user: this.mapUser(session.user),
                profile,
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                expiresAt: session.expires_at || 0,
              };

              // Update cache
              this.lastSession = authSession;

              // Notify all subscribers
              this.subscribers.forEach(sub => sub(authSession));
            } else {
              // Update cache
              this.lastSession = null;
              
              // Notify all subscribers of logout
              this.subscribers.forEach(sub => sub(null));
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
          } finally {
            this.isProcessingAuthChange = false;
          }
        }
      );
      this.authListener = subscription;
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
      
      // Cleanup logic optional - kept for persistent connection
      if (this.subscribers.length === 0 && this.authListener) {
          // We can choose to keep it alive or kill it. 
          // Since AuthInitializer keeps one subscription alive, this block might be hit only if AuthInitializer unmounts (rare).
      }
    };
  }

  /**
   * Translate auth error messages to Thai
   */
  private translateAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'Email not confirmed': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
      'User already registered': 'อีเมลนี้ถูกใช้งานแล้ว',
      'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'Invalid email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'Signup requires a valid password': 'กรุณากรอกรหัสผ่านที่ถูกต้อง',
      'To signup, please provide your email': 'กรุณากรอกอีเมล',
      'Email rate limit exceeded': 'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่',
      'Token has expired or is invalid': 'ลิงก์หมดอายุหรือไม่ถูกต้อง',
      'New password should be different from the old password': 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม',
      'User not found': 'ไม่พบผู้ใช้งาน',
      'Unable to validate email address: invalid format': 'รูปแบบอีเมลไม่ถูกต้อง',
    };

    return errorMap[error] || error;
  }
}
