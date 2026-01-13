import { BookingHistoryView } from '@/src/presentation/components/customer/BookingHistoryView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ตารางการจอง | Racing Queue',
  description: 'ดูตารางและประวัติการจองเวลาทั้งหมด',
};

export default function BookingHistoryPage() {
  return <BookingHistoryView />;
}
