import { MyQueueStatusView } from '@/src/presentation/components/customer/MyQueueStatusView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สถานะคิวของฉัน | Racing Queue',
  description: 'ดูสถานะคิวที่คุณจองไว้ทั้งหมด ติดตามลำดับคิวแบบ Real-time',
};

export default function QueueStatusPage() {
  return <MyQueueStatusView />;
}
