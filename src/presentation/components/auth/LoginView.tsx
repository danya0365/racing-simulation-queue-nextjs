/**
 * LoginView
 * Login page view component - Styled to match Backend theme
 * Following Clean Architecture - UI layer
 */

'use client';

import { useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type LoginMethod = 'email' | 'phone';

export function LoginView() {
  const [state, actions] = useAuthPresenter();
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    actions.clearError();
    
    // Validate
    const emailValidation = actions.validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || 'อีเมลไม่ถูกต้อง');
      return;
    }
    
    if (!password) {
      setPasswordError('กรุณากรอกรหัสผ่าน');
      return;
    }
    
    await actions.signIn(email, password);
  };

  /**
   * Handle phone/OTP login
   */
  const handlePhoneLogin = async (e: FormEvent) => {
    e.preventDefault();
    actions.clearError();
    
    if (!state.otpSent) {
      // Request OTP
      const phoneValidation = actions.validatePhone(phone);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || 'หมายเลขโทรศัพท์ไม่ถูกต้อง');
        return;
      }
      
      await actions.signInWithOTP(phone);
    } else {
      // Verify OTP
      if (!otp || otp.length < 6) {
        actions.setError('กรุณากรอกรหัส OTP 6 หลัก');
        return;
      }
      
      await actions.verifyOTP(phone, otp);
    }
  };

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
            เข้าสู่ระบบ
          </h1>
          <p className="mt-2 text-muted">
            เข้าสู่ระบบเพื่อจองคิว Racing Simulator
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
          {/* Login Method Tabs */}
          <div className="flex rounded-xl bg-muted-light p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                loginMethod === 'email'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              อีเมล
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                loginMethod === 'phone'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              เบอร์โทรศัพท์
            </button>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl">
              <p className="text-error text-sm flex items-center gap-2">
                <span>⚠️</span>
                {state.error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {state.successMessage && (
            <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-xl">
              <p className="text-success text-sm flex items-center gap-2">
                <span>✅</span>
                {state.successMessage}
              </p>
            </div>
          )}

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                />
                {emailError && (
                  <p className="mt-1 text-sm text-error">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={state.showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                      actions.clearError();
                    }}
                    placeholder="••••••••"
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-input-border text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-muted">จดจำฉัน</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              <button
                type="submit"
                disabled={state.isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
              >
                {state.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </form>
          )}

          {/* Phone Login Form */}
          {loginMethod === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              {!state.otpSent ? (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError(null);
                      actions.clearError();
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
                  <p className="mt-2 text-xs text-muted">
                    เราจะส่งรหัส OTP ไปยังหมายเลขนี้
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-1">
                    รหัส OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      actions.clearError();
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-input-border bg-input-bg text-foreground placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-center text-2xl tracking-widest"
                    disabled={state.isSubmitting}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-muted text-center">
                    รหัส OTP ถูกส่งไปยัง {state.otpPhone}
                  </p>
                  <button
                    type="button"
                    onClick={() => actions.resetOTPState()}
                    className="w-full mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    เปลี่ยนเบอร์โทรศัพท์
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={state.isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
              >
                {state.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {state.otpSent ? 'กำลังยืนยัน...' : 'กำลังส่ง OTP...'}
                  </span>
                ) : (
                  state.otpSent ? 'ยืนยัน OTP' : 'ขอรหัส OTP'
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-muted">หรือเข้าสู่ระบบด้วย</span>
            </div>
          </div>

          {/* Social Login */}
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

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-muted">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted">
          การเข้าสู่ระบบหมายถึงคุณยอมรับ{' '}
          <Link href="/terms" className="text-purple-400 hover:text-purple-300">เงื่อนไขการใช้งาน</Link>
          {' '}และ{' '}
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300">นโยบายความเป็นส่วนตัว</Link>
        </p>
      </div>
    </div>
  );
}
