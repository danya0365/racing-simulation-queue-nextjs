/**
 * useAuthPresenter
 * Custom hook for authentication state management
 * Following Clean Architecture with presenter pattern
 */

'use client';

import type {
    AuthProfile,
    AuthSession,
    AuthUser,
    UpdateProfileData
} from '@/src/application/repositories/IAuthRepository';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthViewModel } from './AuthPresenter';
import { createClientAuthPresenter } from './AuthPresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientAuthPresenter();

export interface AuthPresenterState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
  // Form states
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordStrength: 'weak' | 'medium' | 'strong' | null;
  // OTP states
  otpSent: boolean;
  otpPhone: string;
  // Email verification
  needsEmailVerification: boolean;
  verificationEmail: string;
}

export interface AuthPresenterActions {
  // Auth actions
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, token: string) => Promise<boolean>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'github' | 'line') => Promise<void>;
  signOut: () => Promise<void>;
  
  // Password actions
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  
  // Profile actions
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  refreshSession: () => Promise<void>;
  
  // Email verification
  resendEmailVerification: (email: string) => Promise<boolean>;
  
  // OTP actions
  resetOTPState: () => void;
  
  // UI actions
  toggleShowPassword: () => void;
  toggleShowConfirmPassword: () => void;
  checkPasswordStrength: (password: string) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
  setError: (error: string) => void;
  
  // Validation
  validateEmail: (email: string) => { valid: boolean; error?: string };
  validatePassword: (password: string) => { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' };
  validatePhone: (phone: string) => { valid: boolean; error?: string };
}

/**
 * Custom hook for authentication
 */
export function useAuthPresenter(
  initialViewModel?: AuthViewModel
): [AuthPresenterState, AuthPresenterActions] {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get redirect URL from query params or default to /customer
  const getRedirectUrl = useCallback(() => {
    const redirectTo = searchParams.get('redirectTo');
    // Safety check: only allow relative paths or same-origin URLs
    if (redirectTo && (redirectTo.startsWith('/') || redirectTo.startsWith(window.location.origin))) {
      return redirectTo;
    }
    return '/customer';
  }, [searchParams]);
  // State
  const [user, setUser] = useState<AuthUser | null>(initialViewModel?.user || null);
  const [profile, setProfile] = useState<AuthProfile | null>(initialViewModel?.profile || null);
  const [session, setSession] = useState<AuthSession | null>(initialViewModel?.session || null);
  const [isAuthenticated, setIsAuthenticated] = useState(initialViewModel?.isAuthenticated || false);
  const [isLoading, setIsLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');

  // Email verification
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  /**
   * Load initial auth state
   */
  const loadAuthState = useCallback(async () => {
    if (initialViewModel) {
      setIsLoading(false);
      return;
    }

    try {
      const viewModel = await presenter.getViewModel();
      setUser(viewModel.user);
      setProfile(viewModel.profile);
      setSession(viewModel.session);
      setIsAuthenticated(viewModel.isAuthenticated);
    } catch (err) {
      console.error('Error loading auth state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialViewModel]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string, fullName?: string, phone?: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.signUp({ email, password, fullName, phone });

      if (result.success) {
        if (result.needsEmailVerification) {
          setNeedsEmailVerification(true);
          setVerificationEmail(email);
          setSuccessMessage(result.message || 'กรุณายืนยันอีเมลเพื่อเปิดใช้งานบัญชี');
        } else {
          setUser(result.user || null);
          setSuccessMessage(result.message || 'สมัครสมาชิกสำเร็จ');
          router.push(getRedirectUrl());
        }
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [router, getRedirectUrl]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.signIn({ email, password });

      if (result.success) {
        setUser(result.user || null);
        setProfile(result.session?.profile || null);
        setSession(result.session || null);
        setIsAuthenticated(true);
        setSuccessMessage(result.message || 'เข้าสู่ระบบสำเร็จ');
        router.push(getRedirectUrl());
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [router, getRedirectUrl]);

  /**
   * Sign in with OTP
   */
  const signInWithOTP = useCallback(async (phone: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.signInWithOTP({ phone });

      if (result.success) {
        setOtpSent(true);
        setOtpPhone(phone);
        setSuccessMessage(result.message || 'ส่ง OTP สำเร็จ');
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการส่ง OTP');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่ง OTP';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Verify OTP
   */
  const verifyOTP = useCallback(async (phone: string, token: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.verifyOTP({ phone, token });

      if (result.success) {
        setUser(result.user || null);
        setProfile(result.session?.profile || null);
        setSession(result.session || null);
        setIsAuthenticated(true);
        setOtpSent(false);
        setOtpPhone('');
        setSuccessMessage(result.message || 'ยืนยัน OTP สำเร็จ');
        router.push(getRedirectUrl());
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการยืนยัน OTP');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการยืนยัน OTP';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [router, getRedirectUrl]);

  /**
   * Sign in with OAuth provider
   */
  const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook' | 'github' | 'line'): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await presenter.signInWithOAuth(provider);
      if (!result.success) {
        setError(result.error || `เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย ${provider}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await presenter.signOut();

      if (result.success) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAuthenticated(false);
        setSuccessMessage(result.message || 'ออกจากระบบสำเร็จ');
        router.push('/');
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการออกจากระบบ');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.resetPassword({ email });

      if (result.success) {
        setSuccessMessage(result.message || 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาด');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Update password
   */
  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.updatePassword({ newPassword });

      if (result.success) {
        setSuccessMessage(result.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
        router.push('/auth/login');
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาด');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await presenter.updateProfile(data);
      setProfile(updatedProfile);
      setSuccessMessage('อัปเดตโปรไฟล์สำเร็จ');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const newSession = await presenter.refreshSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setProfile(newSession.profile);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  }, []);

  /**
   * Resend email verification
   */
  const resendEmailVerification = useCallback(async (email: string): Promise<boolean> => {
    if (!email) {
      setError('ไม่พบอีเมลสำหรับยืนยัน');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await presenter.resendEmailVerification(email);

      if (result.success) {
        setSuccessMessage(result.message || 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว');
        return true;
      } else {
        setError(result.error || 'เกิดข้อผิดพลาด');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Reset OTP state
   */
  const resetOTPState = useCallback(() => {
    setOtpSent(false);
    setOtpPhone('');
  }, []);

  /**
   * UI Actions
   */
  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const checkPasswordStrength = useCallback((password: string) => {
    const result = presenter.validatePassword(password);
    setPasswordStrength(result.strength);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const setErrorMessage = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  /**
   * Validation wrappers
   */
  const validateEmail = useCallback((email: string) => {
    return presenter.validateEmail(email);
  }, []);

  const validatePassword = useCallback((password: string) => {
    return presenter.validatePassword(password);
  }, []);

  const validatePhone = useCallback((phone: string) => {
    return presenter.validatePhone(phone);
  }, []);

  /**
   * Subscribe to auth state changes
   */
  useEffect(() => {
    loadAuthState();

    const unsubscribe = presenter.onAuthStateChange((newSession) => {
      if (newSession) {
        setUser(newSession.user);
        setProfile(newSession.profile);
        setSession(newSession);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadAuthState]);

  const state: AuthPresenterState = useMemo(() => ({
    user,
    profile,
    session,
    isAuthenticated,
    isLoading,
    error,
    successMessage,
    isSubmitting,
    showPassword,
    showConfirmPassword,
    passwordStrength,
    otpSent,
    otpPhone,
    needsEmailVerification,
    verificationEmail,
  }), [
    user, profile, session, isAuthenticated, isLoading, error,
    successMessage, isSubmitting, showPassword, showConfirmPassword,
    passwordStrength, otpSent, otpPhone, needsEmailVerification, verificationEmail
  ]);

  const actions: AuthPresenterActions = useMemo(() => ({
    signUp,
    signIn,
    signInWithOTP,
    verifyOTP,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    resendEmailVerification,
    resetOTPState,
    toggleShowPassword,
    toggleShowConfirmPassword,
    checkPasswordStrength,
    clearError,
    clearSuccessMessage,
    setError: setErrorMessage,
    validateEmail,
    validatePassword,
    validatePhone,
  }), [
    signUp, signIn, signInWithOTP, verifyOTP, signInWithOAuth,
    signOut, resetPassword, updatePassword, updateProfile, refreshSession,
    resendEmailVerification, resetOTPState, toggleShowPassword, toggleShowConfirmPassword,
    checkPasswordStrength, clearError, clearSuccessMessage, setErrorMessage,
    validateEmail, validatePassword, validatePhone
  ]);

  return [state, actions];
}
