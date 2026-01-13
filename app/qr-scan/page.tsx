import { QRScanView } from '@/src/presentation/components/qr-scan/QRScanView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code จองเวลา | Racing Simulation',
  description: 'สแกน QR Code เพื่อจองเวลาสำหรับเล่นเกมแข่งรถ Racing Simulation',
};

export default function QRScanPage() {
  return <QRScanView />;
}
