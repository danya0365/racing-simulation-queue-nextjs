/**
 * RegisterView
 * Registration page view component - Styled to match Backend theme
 * Following Clean Architecture - UI layer
 */

'use client';

import { useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export function RegisterView() {
  const [state, actions] = useAuthPresenter();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    actions.clearError();
    
    // Reset errors
    setFullNameError(null);
    setEmailError(null);
    setPhoneError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setTermsError(null);
    
    let hasError = false;
    
    // Validate full name
    if (!fullName.trim()) {
      setFullNameError('กรุณากรอกชื่อ-นามสกุล');
      hasError = true;
    }
    
    // Validate email
    const emailValidation = actions.validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || 'อีเมลไม่ถูกต้อง');
      hasError = true;
    }
    
    // Validate phone (optional but must be valid if provided)
    if (phone) {
      const phoneValidation = actions.validatePhone(phone);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || 'หมายเลขโทรศัพท์ไม่ถูกต้อง');
        hasError = true;
      }
    }
    
    // Validate password
    const passwordValidation = actions.validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || 'รหัสผ่านไม่ถูกต้อง');
      hasError = true;
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('รหัสผ่านไม่ตรงกัน');
      hasError = true;
    }
    
    // Validate terms
    if (!acceptTerms) {
      setTermsError('กรุณายอมรับเงื่อนไขการใช้งาน');
      hasError = true;
    }
    
    if (hasError) return;
    
    await actions.signUp(email, password, fullName, phone || undefined);
  };

  // Show email verification message
  if (state.needsEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📧</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ยืนยันอีเมลของคุณ
            </h1>
            <p className="text-muted mb-6">
              เราได้ส่งลิงก์ยืนยันไปยัง<br />
              <span className="font-medium text-foreground">{state.verificationEmail}</span>
            </p>
            <p className="text-sm text-muted mb-6">
              กรุณาคลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชีของคุณ<br />
              หากไม่พบอีเมล กรุณาตรวจสอบโฟลเดอร์ Spam
            </p>
            
            <button
              onClick={() => actions.resendEmailVerification(state.verificationEmail || '')}
              disabled={state.isSubmitting}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:opacity-50"
            >
              {state.isSubmitting ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันใหม่'}
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
            สมัครสมาชิก
          </h1>
          <p className="mt-2 text-muted">
            สร้างบัญชีเพื่อจองคิว Racing Simulator
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
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
                ชื่อ-นามสกุล <span className="text-error">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFullNameError(null);
                }}
                placeholder="สมชาย ใจดี"
                className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                  fullNameError ? 'border-error' : 'border-input-border'
                }`}
                disabled={state.isSubmitting}
              />
              {fullNameError && (
                <p className="mt-1 text-sm text-error">{fullNameError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                อีเมล <span className="text-error">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                  emailError ? 'border-error' : 'border-input-border'
                }`}
                disabled={state.isSubmitting}
              />
              {emailError && (
                <p className="mt-1 text-sm text-error">{emailError}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                เบอร์โทรศัพท์ <span className="text-muted text-xs">(ไม่บังคับ)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="0812345678"
                className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                  phoneError ? 'border-error' : 'border-input-border'
                }`}
                disabled={state.isSubmitting}
              />
              {phoneError && (
                <p className="mt-1 text-sm text-error">{phoneError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                รหัสผ่าน <span className="text-error">*</span>
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
                  }}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className={`w-full px-4 py-3 rounded-xl border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-12 ${
                    passwordError ? 'border-error' : 'border-input-border'
                  }`}
                  disabled={state.isSubmitting}
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
              
              {/* Password Strength */}
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
                ยืนยันรหัสผ่าน <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError(null);
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

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setTermsError(null);
                  }}
                  className="w-5 h-5 rounded border-input-border text-purple-500 focus:ring-purple-500 mt-0.5"
                />
                <span className="text-sm text-muted">
                  ฉันยอมรับ{' '}
                  <Link href="/terms" className="text-purple-400 hover:text-purple-300">เงื่อนไขการใช้งาน</Link>
                  {' '}และ{' '}
                  <Link href="/privacy" className="text-purple-400 hover:text-purple-300">นโยบายความเป็นส่วนตัว</Link>
                </span>
              </label>
              {termsError && (
                <p className="mt-1 text-sm text-error">{termsError}</p>
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
                  กำลังสมัครสมาชิก...
                </span>
              ) : (
                'สมัครสมาชิก'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-muted">หรือสมัครด้วย</span>
            </div>
          </div>

          {/* Social Register */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => actions.signInWithOAuth('google')}
              disabled={state.isSubmitting}
              className="flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-surface hover:bg-muted-light transition-all disabled:opacity-50"
            >
              <span className="text-xl">G</span>
            </button>
            <button
              type="button"
              onClick={() => actions.signInWithOAuth('facebook')}
              disabled={state.isSubmitting}
              className="flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-surface hover:bg-muted-light transition-all disabled:opacity-50"
            >
              <span className="text-xl text-blue-500">f</span>
            </button>
            <button
              type="button"
              onClick={() => actions.signInWithOAuth('line')}
              disabled={state.isSubmitting}
              className="flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-surface hover:bg-muted-light transition-all disabled:opacity-50"
            >
              <span className="text-xl text-green-500">💬</span>
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-muted">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
