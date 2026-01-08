/**
 * ForgotPasswordView
 * Forgot password page view component - Styled to match Backend theme
 * Following Clean Architecture - UI layer
 */

'use client';

import { useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export function ForgotPasswordView() {
  const [state, actions] = useAuthPresenter();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    actions.clearError();
    
    const emailValidation = actions.validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || 'อีเมลไม่ถูกต้อง');
      return;
    }
    
    const success = await actions.resetPassword(email);
    if (success) {
      setEmailSent(true);
    }
  };

  // Show success message
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ตรวจสอบอีเมลของคุณ
            </h1>
            <p className="text-muted mb-6">
              เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted mb-6">
              หากไม่พบอีเมล กรุณาตรวจสอบโฟลเดอร์ Spam หรือ Junk Mail
            </p>
            
            <button
              onClick={() => {
                setEmailSent(false);
                actions.clearSuccessMessage();
              }}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              ส่งอีกครั้ง
            </button>

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
            ลืมรหัสผ่าน
          </h1>
          <p className="mt-2 text-muted">
            กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                  actions.clearError();
                }}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                  emailError ? 'border-error' : 'border-input-border'
                }`}
                disabled={state.isSubmitting}
                autoFocus
              />
              {emailError && (
                <p className="mt-1 text-sm text-error">{emailError}</p>
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
                  กำลังส่ง...
                </span>
              ) : (
                'ส่งลิงก์รีเซ็ตรหัสผ่าน'
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
