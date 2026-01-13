import { AdvanceBookingHistoryView } from '@/src/presentation/components/customer/AdvanceBookingHistoryView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ตารางการจอง | Racing Queue',
  description: 'ดูตารางและประวัติการจองล่วงหน้าทั้งหมด',
};

export default function AdvanceBookingHistoryPage() {
  return <AdvanceBookingHistoryView />;
}
