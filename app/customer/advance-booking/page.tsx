import { AdvanceBookingView } from '@/src/presentation/components/advanceBooking/AdvanceBookingView';
import { createServerAdvanceBookingPresenter } from '@/src/presentation/presenters/advanceBooking/AdvanceBookingPresenterServerFactory';
import type { Metadata } from 'next';
import Link from 'next/link';

// Tell Next.js this is a dynamic page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const presenter = await createServerAdvanceBookingPresenter();
    return presenter.generateMetadata();
  } catch (error) {
    console.error('Error generating metadata:', error);

    return {
      title: 'จองคิวล่วงหน้า | Racing Queue',
      description: 'จองคิวเครื่องเล่น Racing Simulator ล่วงหน้า เลือกวันและเวลาที่ต้องการได้ตามสะดวก',
    };
  }
}

/**
 * Advance Booking page - Server Component for SEO optimization
 * Uses presenter pattern following Clean Architecture
 */
export default async function AdvanceBookingPage() {
  try {
    const presenter = await createServerAdvanceBookingPresenter();
    const todayStr = new Date().toISOString().split('T')[0];
    const viewModel = await presenter.getViewModel(todayStr);

    return <AdvanceBookingView initialViewModel={viewModel} />;
  } catch (error) {
    console.error('Error fetching advance booking data:', error);

    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-muted mb-4">ไม่สามารถโหลดข้อมูลได้</p>
          <Link
            href="/customer"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-400 hover:to-pink-500 transition-all"
          >
            กลับหน้าจองคิว
          </Link>
        </div>
      </div>
    );
  }
}
