import { VerifyEmailView } from '@/src/presentation/components/auth/VerifyEmailView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'ยืนยันอีเมล | Racing Queue',
  description: 'ยืนยันอีเมลสำหรับบัญชี Racing Queue',
};

/**
 * Loading component for suspense
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-card-border p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            กำลังยืนยันอีเมล...
          </h1>
        </div>
      </div>
    </div>
  );
}

/**
 * Verify Email Page - Server Component for SEO optimization
 * Wrapped in Suspense because it uses useSearchParams
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailView />
    </Suspense>
  );
}
