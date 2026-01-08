/**
 * AuthPresenter
 * Handles business logic for authentication
 * Receives repository via dependency injection
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
import { Metadata } from 'next';

export interface AuthViewModel {
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthPage = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' | 'profile';

/**
 * Presenter for Authentication
 * ✅ Receives repository via constructor injection
 */
export class AuthPresenter {
  constructor(private readonly repository: IAuthRepository) {}

  /**
   * Get initial view model for auth pages
   */
  async getViewModel(): Promise<AuthViewModel> {
    try {
      const session = await this.repository.getSession();

      if (session) {
        return {
          user: session.user,
          profile: session.profile,
          session,
          isAuthenticated: true,
          isLoading: false,
        };
      }

      return {
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      };
    } catch (error) {
      console.error('Error getting auth view model:', error);
      return {
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      };
    }
  }

  /**
   * Generate metadata for auth pages
   */
  generateMetadata(page: AuthPage): Metadata {
    const metadataMap: Record<AuthPage, Metadata> = {
      login: {
        title: 'เข้าสู่ระบบ | Racing Queue',
        description: 'เข้าสู่ระบบเพื่อจองคิว Racing Simulator',
      },
      register: {
        title: 'สมัครสมาชิก | Racing Queue',
        description: 'สมัครสมาชิกเพื่อจองคิว Racing Simulator ได้ง่ายขึ้น',
      },
      'forgot-password': {
        title: 'ลืมรหัสผ่าน | Racing Queue',
        description: 'รีเซ็ตรหัสผ่านสำหรับบัญชี Racing Queue',
      },
      'reset-password': {
        title: 'ตั้งรหัสผ่านใหม่ | Racing Queue',
        description: 'ตั้งรหัสผ่านใหม่สำหรับบัญชี Racing Queue',
      },
      'verify-email': {
        title: 'ยืนยันอีเมล | Racing Queue',
        description: 'ยืนยันอีเมลสำหรับบัญชี Racing Queue',
      },
      profile: {
        title: 'โปรไฟล์ | Racing Queue',
        description: 'จัดการข้อมูลโปรไฟล์ของคุณ',
      },
    };

    return metadataMap[page];
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      return await this.repository.signUp(data);
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
      return await this.repository.signIn(data);
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
      return await this.repository.signInWithOTP(data);
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
      return await this.repository.verifyOTP(data);
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
   */
  async signInWithOAuth(provider: 'google' | 'facebook' | 'github' | 'line'): Promise<AuthResult> {
    try {
      return await this.repository.signInWithOAuth(provider);
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
      return await this.repository.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการออกจากระบบ',
      };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      return await this.repository.getCurrentUser();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      return await this.repository.getSession();
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<AuthProfile | null> {
    try {
      return await this.repository.getProfile();
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthProfile> {
    return await this.repository.updateProfile(data);
  }

  /**
   * Send password reset email
   */
  async resetPassword(data: ResetPasswordData): Promise<AuthResult> {
    try {
      return await this.repository.resetPassword(data);
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน',
      };
    }
  }

  /**
   * Update password
   */
  async updatePassword(data: UpdatePasswordData): Promise<AuthResult> {
    try {
      return await this.repository.updatePassword(data);
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
      return await this.repository.resendEmailVerification(email);
    } catch (error) {
      console.error('Resend email verification error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน',
      };
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      return await this.repository.verifyEmail(token);
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
      return await this.repository.refreshSession();
    } catch (error) {
      console.error('Refresh session error:', error);
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    return this.repository.onAuthStateChange(callback);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { valid: false, error: 'กรุณากรอกอีเมล' };
    }
    
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' };
    }
    
    return { valid: true };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
    if (!password) {
      return { valid: false, error: 'กรุณากรอกรหัสผ่าน', strength: 'weak' };
    }
    
    if (password.length < 6) {
      return { valid: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', strength: 'weak' };
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    
    if (strengthScore <= 1) {
      return { valid: true, strength: 'weak' };
    }
    
    if (strengthScore <= 2) {
      return { valid: true, strength: 'medium' };
    }
    
    return { valid: true, strength: 'strong' };
  }

  /**
   * Validate phone number format (Thai)
   */
  validatePhone(phone: string): { valid: boolean; error?: string } {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[-\s]/g, '');
    
    // Thai phone number format: starts with 0 and has 10 digits
    const phoneRegex = /^0\d{9}$/;
    
    if (!phone) {
      return { valid: false, error: 'กรุณากรอกหมายเลขโทรศัพท์' };
    }
    
    if (!phoneRegex.test(cleanPhone)) {
      return { valid: false, error: 'หมายเลขโทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)' };
    }
    
    return { valid: true };
  }
}
