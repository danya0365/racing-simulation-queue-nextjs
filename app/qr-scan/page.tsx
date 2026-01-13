import { QRScanView } from '@/src/presentation/components/qr-scan/QRScanView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code จองล่วงหน้า | Racing Simulation',
  description: 'สแกน QR Code เพื่อจองล่วงหน้าสำหรับเล่นเกมแข่งรถ Racing Simulation',
};

export default function QRScanPage() {
  return <QRScanView />;
}
