import { AdvanceBookingHistoryView } from '@/src/presentation/components/customer/AdvanceBookingHistoryView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ตารางการจอง | Racing Queue',
  description: 'ดูตารางและประวัติการจองเวลาทั้งหมด',
};

export default function AdvanceBookingHistoryPage() {
  return <AdvanceBookingHistoryView />;
}
