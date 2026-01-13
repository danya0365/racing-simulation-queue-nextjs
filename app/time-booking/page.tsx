import { TimeBookingView } from '@/src/presentation/components/customer/TimeBookingView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จองเวลา | Racing Queue',
  description: 'จองเวลาเล่น เลือกวันเวลาที่สะดวก',
};

export default function TimeBookingPage() {
  return <TimeBookingView />;
}
