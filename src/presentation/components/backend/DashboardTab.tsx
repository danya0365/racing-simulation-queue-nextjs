'use client';

import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';

interface DashboardTabProps {
  viewModel: BackendViewModel;
}

export function DashboardTab({ viewModel }: DashboardTabProps) {
  // Get status config for bookings
  const getBookingStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'รอยืนยัน', color: 'text-yellow-400' };
      case 'confirmed':
        return { label: 'ยืนยันแล้ว', color: 'text-emerald-400' };
      case 'seated':
        return { label: 'กำลังเล่น', color: 'text-indigo-400' };
      case 'completed':
        return { label: 'สำเร็จ', color: 'text-blue-400' };
      case 'cancelled':
        return { label: 'ยกเลิก', color: 'text-red-400' };
      default:
        return { label: status, color: 'text-gray-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon="🎮" label="เครื่องทั้งหมด" value={viewModel.machineStats.totalMachines} color="from-blue-500 to-cyan-500" />
        <StatsCard icon="✅" label="เครื่องว่าง" value={viewModel.machineStats.availableMachines} color="from-emerald-500 to-green-500" />
        <StatsCard icon="📅" label="จองวันนี้" value={viewModel.bookingStats?.totalBookings || 0} color="from-purple-500 to-violet-500" />
        <StatsCard icon="🏁" label="กำลังเล่น" value={viewModel.machineStats.occupiedMachines} color="from-orange-500 to-amber-500" />
      </div>

      {/* Booking Stats Mini Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{viewModel.bookingStats?.pendingBookings || 0}</div>
          <div className="text-xs text-muted">รอยืนยัน</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{viewModel.bookingStats?.confirmedBookings || 0}</div>
          <div className="text-xs text-muted">ยืนยันแล้ว</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{viewModel.bookingStats?.completedBookings || 0}</div>
          <div className="text-xs text-muted">สำเร็จ</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{viewModel.bookingStats?.cancelledBookings || 0}</div>
          <div className="text-xs text-muted">ยกเลิก</div>
        </div>
      </div>

      {/* Today's Bookings */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-bold mb-4 text-foreground">📅 การจองวันนี้</h3>
        {(!viewModel.todayBookings || viewModel.todayBookings.length === 0) ? (
          <p className="text-muted text-center py-8">ยังไม่มีการจองวันนี้</p>
        ) : (
          <div className="space-y-3">
            {viewModel.todayBookings.slice(0, 8).map((booking) => {
              const statusConfig = getBookingStatusConfig(booking.status);
              return (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">
                      {booking.localStartTime.slice(0, 5)}
                    </span>
                    <div>
                      <span className="text-foreground font-medium">{booking.customerName}</span>
                      <p className="text-xs text-muted">{booking.durationMinutes} นาที</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted text-sm">{booking.localStartTime.slice(0, 5)} - {booking.localEndTime.slice(0, 5)}</span>
                    <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                </div>
              );
            })}
            {viewModel.todayBookings.length > 8 && (
              <p className="text-center text-muted text-sm pt-2">
                +{viewModel.todayBookings.length - 8} รายการเพิ่มเติม
              </p>
            )}
          </div>
        )}
      </AnimatedCard>
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${color} shadow-lg cursor-default transition-transform duration-200 hover:scale-105`}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </div>
  );
}
