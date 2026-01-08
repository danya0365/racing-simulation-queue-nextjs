import { QueueHistoryView } from '@/src/presentation/components/customer/QueueHistoryView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ประวัติการจอง | Racing Queue',
  description: 'ดูประวัติการจองคิวทั้งหมดของคุณ',
};

export default function QueueHistoryPage() {
  return <QueueHistoryView />;
}
