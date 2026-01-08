import { RegisterView } from '@/src/presentation/components/auth/RegisterView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สมัครสมาชิก | Racing Queue',
  description: 'สมัครสมาชิกเพื่อจองคิว Racing Simulator ได้ง่ายขึ้น',
};

/**
 * Register Page - Server Component for SEO optimization
 */
export default function RegisterPage() {
  return <RegisterView />;
}
