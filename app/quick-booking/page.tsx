import { QuickBookingView } from '@/src/presentation/components/customer/QuickBookingView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จองด่วน | Racing Queue',
  description: 'จองคิวแบบรวดเร็ว ง่าย สะดวก ทันใจ',
};

export default function QuickBookingPage() {
  return <QuickBookingView />;
}
