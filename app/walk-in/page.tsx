import { JoinWalkInView } from '@/src/presentation/components/walk-in/JoinWalkInView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าคิวเล่นเกม | Racing Queue',
  description: 'ระบบรับบำดับคิวสำหรับลูกค้า Walk-in ร้าน Racing Simulation',
};

export default function WalkInPage() {
  return <JoinWalkInView />;
}
