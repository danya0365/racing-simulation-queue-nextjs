import { AdvanceBookingStatusView } from '@/src/presentation/components/customer/AdvanceBookingStatusView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สถานะการจอง | Racing Queue',
  description: 'ดูสถานะการจองเวลาของคุณ',
};

export default function AdvanceBookingStatusPage() {
  return <AdvanceBookingStatusView />;
}
