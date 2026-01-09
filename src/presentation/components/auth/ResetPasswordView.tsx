/**
 * ResetPasswordView
 * Reset password page view component - Styled to match Backend theme
 * Following Clean Architecture - UI layer
 */

'use client';

import { useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const [state, actions] = useAuthPresenter();
  
  // Check for token error in URL - computed once on mount
  const initialTokenError = useMemo(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      // Set error message after initial render via setTimeout to avoid cascading renders
      setTimeout(() => {
        actions.setError(errorDescription || 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
      }, 0);
      return true;
    }
    return false;
  }, [searchParams, actions]);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(initialTokenError);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    actions.clearError();
    setPasswordError(null);
    setConfirmPasswordError(null);
    
    // Validate password
    const passwordValidation = actions.validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || 'รหัสผ่านไม่ถูกต้อง');
      return;
    }
    
    // Check password match
    if (password !== confirmPassword) {
      setConfirmPasswordError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    
    const success = await actions.updatePassword(password);
    if (success) {
      setResetSuccess(true);
    }
  };

  // Token error state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ลิงก์ไม่ถูกต้อง
            </h1>
            <p className="text-muted mb-6">
              {state.error || 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่'}
            </p>
            
            <Link
              href="/auth/forgot-password"
              className="inline-block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
            >
              ขอลิงก์รีเซ็ตรหัสผ่านใหม่
            </Link>

            <div className="mt-6 pt-6 border-t border-border">
              <Link 
                href="/auth/login" 
                className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                <span>←</span>
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              เปลี่ยนรหัสผ่านสำเร็จ
            </h1>
            <p className="text-muted mb-6">
              รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว<br />
              กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </p>
            
            <Link
              href="/auth/login"
              className="inline-block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl shadow-lg">
              🏎️
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Racing Queue
            </span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-foreground">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="mt-2 text-muted">
            กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
          {/* Error Message */}
          {state.error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl">
              <p className="text-error text-sm flex items-center gap-2">
                <span>⚠️</span>
                {state.error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={state.showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                    actions.checkPasswordStrength(e.target.value);
                    actions.clearError();
                  }}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-12 ${
                    passwordError ? 'border-error' : 'border-input-border'
                  }`}
                  disabled={state.isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={actions.toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {state.showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-error">{passwordError}</p>
              )}
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    <div className={`flex-1 h-1.5 rounded-full ${
                      state.passwordStrength ? 
                        state.passwordStrength === 'weak' ? 'bg-error' :
                        state.passwordStrength === 'medium' ? 'bg-warning' : 'bg-success'
                      : 'bg-muted-light'
                    }`} />
                    <div className={`flex-1 h-1.5 rounded-full ${
                      state.passwordStrength && state.passwordStrength !== 'weak' ? 
                        state.passwordStrength === 'medium' ? 'bg-warning' : 'bg-success'
                      : 'bg-muted-light'
                    }`} />
                    <div className={`flex-1 h-1.5 rounded-full ${
                      state.passwordStrength === 'strong' ? 'bg-success' : 'bg-muted-light'
                    }`} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    ความแข็งแรง: {' '}
                    <span className={`font-medium ${
                      state.passwordStrength === 'weak' ? 'text-error' :
                      state.passwordStrength === 'medium' ? 'text-warning' : 'text-success'
                    }`}>
                      {state.passwordStrength === 'weak' ? 'อ่อน' :
                       state.passwordStrength === 'medium' ? 'ปานกลาง' : 'แข็งแรง'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError(null);
                    actions.clearError();
                  }}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-12 ${
                    confirmPasswordError ? 'border-error' : 'border-input-border'
                  }`}
                  disabled={state.isSubmitting}
                />
                <button
                  type="button"
                  onClick={actions.toggleShowConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {state.showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-sm text-error">{confirmPasswordError}</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="mt-1 text-sm text-success flex items-center gap-1">
                  <span>✓</span> รหัสผ่านตรงกัน
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={state.isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {state.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังเปลี่ยนรหัสผ่าน...
                </span>
              ) : (
                'เปลี่ยนรหัสผ่าน'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-border">
            <Link 
              href="/auth/login" 
              className="block text-center text-sm text-muted hover:text-foreground transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <span>←</span>
                กลับไปหน้าเข้าสู่ระบบ
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
