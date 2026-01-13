import { AdvanceBookingStatusView } from '@/src/presentation/components/customer/AdvanceBookingStatusView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สถานะการจอง | Racing Queue',
  description: 'ดูสถานะการจองล่วงหน้าของคุณ',
};

export default function AdvanceBookingStatusPage() {
  return <AdvanceBookingStatusView />;
}
