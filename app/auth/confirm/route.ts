/**
 * Auth Confirm Route Handler
 * Handles email confirmation and password reset links from Supabase
 */

import { createClient } from '@/src/infrastructure/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Successful verification
      // Redirect to appropriate page based on type
      if (type === 'recovery') {
        // Password recovery - redirect to reset password page
        redirect('/auth/reset-password');
      } else if (type === 'signup' || type === 'email') {
        // Email verification - redirect to verify success page
        redirect('/auth/verify-email?success=true');
      } else {
        // Other types - redirect to the next URL
        redirect(next);
      }
    } else {
      // Failed verification - redirect with error
      if (type === 'recovery') {
        redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
      } else {
        redirect(`/auth/verify-email?error=${encodeURIComponent(error.message)}`);
      }
    }
  }

  // If no token_hash or type, redirect to home
  redirect('/');
}
