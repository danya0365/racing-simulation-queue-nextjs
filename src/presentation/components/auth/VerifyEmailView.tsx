/**
 * VerifyEmailView
 * Email verification page view component - Styled to match Backend theme
 * Following Clean Architecture - UI layer
 */

'use client';

import { useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type VerificationStatus = 'loading' | 'success' | 'error';

export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, actions] = useAuthPresenter();
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const success = searchParams.get('success');

      // Check for errors in URL
      if (error) {
        actions.setError(errorDescription || 'เกิดข้อผิดพลาดในการยืนยันอีเมล');
        setStatus('error');
        return;
      }

      // If success param or type is signup/email_change, the verification is complete
      if (success === 'true' || type === 'signup' || type === 'email_change') {
        setStatus('success');
        return;
      }

      // Default to success (user likely landed here after clicking email link)
      setStatus('success');
    };

    verifyEmail();
  }, [searchParams, actions]);

  // Countdown for redirect
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/auth/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              กำลังยืนยันอีเมล
            </h1>
            <p className="text-muted">
              กรุณารอสักครู่...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ยืนยันอีเมลไม่สำเร็จ
            </h1>
            <p className="text-muted mb-6">
              {state.error || 'ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุ'}
            </p>
            
            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
              >
                สมัครสมาชิกใหม่
              </Link>
              
              <Link
                href="/auth/login"
                className="block py-3 px-6 border border-border text-foreground rounded-xl font-medium hover:bg-muted-light transition-all"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ยืนยันอีเมลสำเร็จ
          </h1>
          <p className="text-muted mb-6">
            อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว<br />
            คุณสามารถเข้าสู่ระบบได้ทันที
          </p>
          
          <Link
            href="/auth/login"
            className="inline-block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
          
          <p className="mt-4 text-sm text-muted">
            เปลี่ยนเส้นทางอัตโนมัติใน {countdown} วินาที
          </p>
        </div>
      </div>
    </div>
  );
}
