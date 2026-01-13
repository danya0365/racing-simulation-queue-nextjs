import { QuickAdvanceBookingView } from '@/src/presentation/components/customer/QuickAdvanceBookingView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จองล่วงหน้า | Racing Queue',
  description: 'จองคิวล่วงหน้า เลือกวันเวลาที่สะดวก',
};

export default function QuickAdvanceBookingPage() {
  return <QuickAdvanceBookingView />;
}
