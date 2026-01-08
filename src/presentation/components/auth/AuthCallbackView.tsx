/**
 * AuthCallbackView
 * OAuth callback page view component - Styled to match Backend theme
 * Following Clean Architecture - UI layer
 */

'use client';

import { useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CallbackStatus = 'loading' | 'success' | 'error';

export function AuthCallbackView() {
  const router = useRouter();
  const [state, actions] = useAuthPresenter();
  
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Give Supabase time to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we have a session
        await actions.refreshSession();
        
        if (state.isAuthenticated) {
          setStatus('success');
        } else {
          // Wait a bit more and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (state.isAuthenticated) {
            setStatus('success');
          } else {
            setStatus('error');
            actions.setError('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
          }
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        actions.setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    };

    handleCallback();
  }, [actions, state.isAuthenticated]);

  // Countdown for redirect on success
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/customer');
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
              กำลังเข้าสู่ระบบ
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
              เข้าสู่ระบบไม่สำเร็จ
            </h1>
            <p className="text-muted mb-6">
              {state.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง'}
            </p>
            
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
              >
                ลองใหม่อีกครั้ง
              </Link>
              
              <Link
                href="/"
                className="block py-3 px-6 border border-border text-foreground rounded-xl font-medium hover:bg-muted-light transition-all"
              >
                กลับหน้าแรก
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
            เข้าสู่ระบบสำเร็จ
          </h1>
          <p className="text-muted mb-2">
            ยินดีต้อนรับกลับมา{state.user?.email ? `, ${state.user.email}` : ''}!
          </p>
          <p className="text-sm text-muted">
            เปลี่ยนเส้นทางอัตโนมัติใน {countdown} วินาที
          </p>
          
          <div className="mt-6">
            <Link
              href="/customer"
              className="inline-block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
            >
              ไปหน้าจองคิว
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
