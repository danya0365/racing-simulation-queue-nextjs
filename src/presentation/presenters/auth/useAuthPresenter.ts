'use client';

import type {
  AuthProfile,
  AuthSession,
  AuthUser,
  UpdateProfileData
} from '@/src/application/repositories/IAuthRepository';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { AuthPresenter, AuthViewModel } from './AuthPresenter';
import { createClientAuthPresenter } from './AuthPresenterClientFactory';

export interface AuthPresenterState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordStrength: 'weak' | 'medium' | 'strong' | null;
  otpSent: boolean;
  otpPhone: string;
  needsEmailVerification: boolean;
  verificationEmail: string;
}

export interface AuthPresenterActions {
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, token: string) => Promise<boolean>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'github' | 'line') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  refreshSession: () => Promise<void>;
  resendEmailVerification: (email: string) => Promise<boolean>;
  resetOTPState: () => void;
  toggleShowPassword: () => void;
  toggleShowConfirmPassword: () => void;
  checkPasswordStrength: (password: string) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
  setError: (error: string) => void;
  validateEmail: (email: string) => { valid: boolean; error?: string };
  validatePassword: (password: string) => { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' };
  validatePhone: (phone: string) => { valid: boolean; error?: string };
}

/**
 * Custom hook for authentication
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 */
export function useAuthPresenter(
  initialViewModel?: AuthViewModel,
  presenterOverride?: AuthPresenter
): [AuthPresenterState, AuthPresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientAuthPresenter(),
    [presenterOverride]
  );
  
  const router = useRouter();
  
  const getRedirectUrl = useCallback(() => {
    if (typeof window === 'undefined') return '/backend';
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirectTo');
    if (redirectTo && (redirectTo.startsWith('/') || redirectTo.startsWith(window.location.origin))) {
      return redirectTo;
    }
    return '/backend';
  }, []);

  const { user, profile, session, isAuthenticated, isLoading } = useAuthStore();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

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
  }, [router, getRedirectUrl, presenter]);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.signIn({ email, password });
      if (result.success) {
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
  }, [router, getRedirectUrl, presenter]);

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
  }, [presenter]);

  const verifyOTP = useCallback(async (phone: string, token: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await presenter.verifyOTP({ phone, token });
      if (result.success) {
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
  }, [router, getRedirectUrl, presenter]);

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
  }, [presenter]);

  const signOut = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await presenter.signOut();
      if (result.success) {
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
  }, [router, presenter]);

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
  }, [presenter]);

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
  }, [router, presenter]);

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await presenter.updateProfile(data);
      useAuthStore.getState().setProfile(updatedProfile);
      setSuccessMessage('อัปเดตโปรไฟล์สำเร็จ');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [presenter]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await presenter.refreshSession();
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  }, [presenter]);

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
  }, [presenter]);

  const resetOTPState = useCallback(() => {
    setOtpSent(false);
    setOtpPhone('');
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const checkPasswordStrength = useCallback((password: string) => {
    const result = presenter.validatePassword(password);
    setPasswordStrength(result.strength);
  }, [presenter]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const setErrorMessage = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  const validateEmail = useCallback((email: string) => {
    return presenter.validateEmail(email);
  }, [presenter]);

  const validatePassword = useCallback((password: string) => {
    return presenter.validatePassword(password);
  }, [presenter]);

  const validatePhone = useCallback((phone: string) => {
    return presenter.validatePhone(phone);
  }, [presenter]);

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
