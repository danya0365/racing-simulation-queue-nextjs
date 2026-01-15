'use client';

import { Booking } from '@/src/application/repositories/IBookingRepository';
import { createBookingRepository } from '@/src/infrastructure/repositories/RepositoryFactory';
import dayjs, { getShopTodayString } from '@/src/lib/date';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { CustomerInfoCard } from '@/src/presentation/components/ui/CustomerInfoCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { TimezoneNotice } from '@/src/presentation/components/ui/TimezoneNotice';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * BookingStatusView - View customer's bookings
 * SECURE: Only shows bookings for the current customer (by customer_id from localStorage)
 * 
 * ✅ Uses customer_id instead of phone for secure lookup
 */
export function BookingStatusView() {
  const { customerInfo, isInitialized } = useCustomerStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ✅ Use factory for repository creation
  const bookingRepo = useMemo(() => createBookingRepository(), []);

  // Load my bookings by customer_id (SECURE)
  const loadMyBookings = useCallback(async () => {
    if (!customerInfo.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await bookingRepo.getMyBookings(customerInfo.id);
      setBookings(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลการจองได้');
      console.error('Error loading my bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [bookingRepo, customerInfo.id]);

  // Auto-load when customerInfo.id is available
  useEffect(() => {
    if (isInitialized) {
      loadMyBookings();
    }
  }, [isInitialized, loadMyBookings]);

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!cancelBookingId || !customerInfo.id) return;

    setIsCancelling(true);
    try {
      await bookingRepo.cancel(cancelBookingId, customerInfo.id);
      // Reload bookings
      await loadMyBookings();
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
    const date = dayjs(dateStr);
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');

    if (date.isSame(today, 'day')) {
      return 'วันนี้';
    } else if (date.isSame(tomorrow, 'day')) {
      return 'พรุ่งนี้';
    }

    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date.toDate());
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
  const todayStr = getShopTodayString();
  const upcomingBookings = bookings.filter(b =>
    b.localDate >= todayStr && (b.status === 'confirmed' || b.status === 'pending')
  );
  const pastBookings = bookings.filter(b =>
    b.localDate < todayStr || b.status === 'completed' || b.status === 'cancelled'
  );

  // Check if user has verified identity (has customerId)
  const hasCustomerId = !!customerInfo.id;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">📅 การจองของฉัน</h1>
          <p className="text-muted">ดูสถานะการจองเวลาทั้งหมด</p>
        </div>

        {/* 🌍 Timezone Notice */}
        <TimezoneNotice />

        {/* 👤 Customer Info Card */}
        <div className="mb-6">
          <CustomerInfoCard />
        </div>

        {/* Not Verified Yet */}
        {!loading && !hasCustomerId && (
          <AnimatedCard className="p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-foreground mb-2">ยังไม่มีประวัติการจอง</h3>
            <p className="text-muted mb-6">
              คุณต้องจองอย่างน้อย 1 ครั้งเพื่อยืนยันตัวตน<br />
              จากนั้นจะสามารถดูและจัดการการจองได้ที่นี่
            </p>
            <Link href="/time-booking">
              <GlowButton color="purple">📅 จองคิวเลย</GlowButton>
            </Link>
          </AnimatedCard>
        )}

        {/* Loading */}
        {loading && hasCustomerId && (
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

        {/* No Bookings Found */}
        {!loading && hasCustomerId && bookings.length === 0 && (
          <AnimatedCard className="p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-foreground mb-2">ยังไม่มีการจอง</h3>
            <p className="text-muted mb-6">
              คุณยังไม่มีรายการจอง<br />
              มาจองคิวกันเถอะ!
            </p>
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
              {upcomingBookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const isToday = booking.localDate === todayStr;

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
                            {formatDate(booking.localDate)}
                          </p>
                          <p className="text-2xl font-bold text-purple-400">
                            {formatTime(booking.localStartTime)} - {formatTime(booking.localEndTime)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {booking.machineName && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
                                🎮 {booking.machineName}
                              </span>
                            )}
                            <span className="text-sm text-muted">
                              {booking.durationMinutes} นาที
                            </span>
                          </div>
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
                            {formatDate(booking.localDate)} • {formatTime(booking.localStartTime)}
                            {booking.machineName && (
                              <span className="ml-2 px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                                {booking.machineName}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted">{booking.durationMinutes} นาที</p>
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
