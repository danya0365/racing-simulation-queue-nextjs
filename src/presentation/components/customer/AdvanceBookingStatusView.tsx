'use client';

import { AdvanceBooking } from '@/src/application/repositories/IAdvanceBookingRepository';
import { createAdvanceBookingRepository } from '@/src/infrastructure/repositories/RepositoryFactory';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * AdvanceBookingStatusView - View customer's advance bookings
 * Shows all advance bookings for the current customer (by phone)
 */
export function AdvanceBookingStatusView() {
  const { customerInfo } = useCustomerStore();
  const [bookings, setBookings] = useState<AdvanceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchPhone, setSearchPhone] = useState(customerInfo.phone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ✅ Use factory for repository creation
  const advanceBookingRepo = useMemo(() => createAdvanceBookingRepository(), []);

  // Load bookings by phone
  const loadBookings = useCallback(async (phone: string) => {
    if (!phone.trim()) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await advanceBookingRepo.getByCustomerPhone(phone.trim());
      setBookings(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลการจองได้');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [advanceBookingRepo]);

  // Auto-load on mount if phone exists
  useEffect(() => {
    if (customerInfo.phone) {
      setSearchPhone(customerInfo.phone);
      loadBookings(customerInfo.phone);
    } else {
      setLoading(false);
    }
  }, [customerInfo.phone, loadBookings]);

  // Handle search
  const handleSearch = () => {
    loadBookings(searchPhone);
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;

    setIsCancelling(true);
    try {
      await advanceBookingRepo.cancel(cancelBookingId);
      // Reload bookings
      await loadBookings(searchPhone);
    } catch (err) {
      setError('ไม่สามารถยกเลิกการจองได้');
      console.error('Error cancelling booking:', err);
    } finally {
      setIsCancelling(false);
      setCancelBookingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const bookingDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (bookingDateStr === todayStr) {
      return 'วันนี้';
    } else if (bookingDateStr === tomorrowStr) {
      return 'พรุ่งนี้';
    }

    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  // Format time
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  // Get status styling
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'ยืนยันแล้ว', color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: '✅' };
      case 'pending':
        return { label: 'รอยืนยัน', color: 'bg-amber-500', textColor: 'text-amber-400', icon: '⏳' };
      case 'completed':
        return { label: 'เสร็จสิ้น', color: 'bg-gray-500', textColor: 'text-gray-400', icon: '✔️' };
      case 'cancelled':
        return { label: 'ยกเลิก', color: 'bg-red-500', textColor: 'text-red-400', icon: '❌' };
      default:
        return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400', icon: '❓' };
    }
  };

  // Separate upcoming and past bookings
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const upcomingBookings = bookings.filter(b =>
    b.bookingDate >= today && (b.status === 'confirmed' || b.status === 'pending')
  );
  const pastBookings = bookings.filter(b =>
    b.bookingDate < today || b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">📅 การจองของฉัน</h1>
          <p className="text-muted">ดูสถานะการจองเวลาทั้งหมด</p>
        </div>

        {/* Search Box */}
        <AnimatedCard className="p-6 mb-6">
          <label className="block text-sm font-medium text-muted mb-2">🔍 ค้นหาจากเบอร์โทร</label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:border-purple-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <AnimatedButton
              variant="primary"
              onClick={handleSearch}
              disabled={isSearching || !searchPhone.trim()}
            >
              {isSearching ? '⏳' : '🔍'} ค้นหา
            </AnimatedButton>
          </div>
        </AnimatedCard>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted">กำลังโหลด...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* No Phone Yet */}
        {!loading && !searchPhone.trim() && (
          <AnimatedCard className="p-8 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-foreground mb-2">ใส่เบอร์โทรเพื่อค้นหา</h3>
            <p className="text-muted mb-6">กรอกเบอร์โทรที่ใช้จองเพื่อดูรายการจองของคุณ</p>
            <Link href="/time-booking">
              <GlowButton color="purple">📅 จองคิวใหม่</GlowButton>
            </Link>
          </AnimatedCard>
        )}

        {/* No Bookings Found */}
        {!loading && searchPhone.trim() && bookings.length === 0 && (
          <AnimatedCard className="p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-foreground mb-2">ไม่พบการจอง</h3>
            <p className="text-muted mb-6">ไม่พบการจองสำหรับเบอร์ {searchPhone}</p>
            <Link href="/time-booking">
              <GlowButton color="purple">📅 จองคิวใหม่</GlowButton>
            </Link>
          </AnimatedCard>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">📆</span>
              การจองที่กำลังจะถึง ({upcomingBookings.length})
            </h2>
            <div className="space-y-4">
              {upcomingBookings.map((booking, index) => {
                const statusConfig = getStatusConfig(booking.status);
                const isToday = booking.bookingDate === today;

                return (
                  <AnimatedCard
                    key={booking.id}
                    className={`p-5 ${isToday ? 'ring-2 ring-purple-500' : ''}`}
                  >
                    {isToday && (
                      <div className="mb-3 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full inline-block">
                        🔥 วันนี้!
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
                          🎮
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-lg">
                            {formatDate(booking.bookingDate)}
                          </p>
                          <p className="text-2xl font-bold text-purple-400">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </p>
                          <p className="text-sm text-muted mt-1">
                            {booking.duration} นาที
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <div className="mt-4 pt-4 border-t border-border flex justify-end">
                        <AnimatedButton
                          variant="danger"
                          size="sm"
                          onClick={() => setCancelBookingId(booking.id)}
                        >
                          ❌ ยกเลิกการจอง
                        </AnimatedButton>
                      </div>
                    )}
                  </AnimatedCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center text-gray-400">📋</span>
              ประวัติการจอง ({pastBookings.length})
            </h2>
            <div className="space-y-3">
              {pastBookings.slice(0, 10).map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                
                return (
                  <div
                    key={booking.id}
                    className="p-4 bg-surface border border-border rounded-xl opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center text-lg">
                          🎮
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {formatDate(booking.bookingDate)} • {formatTime(booking.startTime)}
                          </p>
                          <p className="text-xs text-muted">{booking.duration} นาที</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.textColor} bg-opacity-20 ${statusConfig.color}/20`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {bookings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link href="/time-booking">
              <GlowButton color="purple" size="lg">
                📅 จองคิวเพิ่ม
              </GlowButton>
            </Link>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancelBookingId}
        title="ยกเลิกการจอง?"
        description="คุณต้องการยกเลิกการจองนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="🗑️ ยกเลิกการจอง"
        cancelText="ไม่ใช่ กลับไป"
        variant="danger"
        onConfirm={handleCancelBooking}
        onClose={() => setCancelBookingId(null)}
        isLoading={isCancelling}
      />
    </div>
  );
}
