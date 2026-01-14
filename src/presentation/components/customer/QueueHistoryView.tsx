'use client';

import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useQueueHistoryPresenter } from '@/src/presentation/presenters/queueHistory/useQueueHistoryPresenter';
import dayjs from 'dayjs';
import Link from 'next/link';

/**
 * QueueHistoryView
 * View component for Queue History page
 * ✅ Following Clean Architecture pattern - uses presenter hook for state management
 */
export function QueueHistoryView() {
  const [state, actions] = useQueueHistoryPresenter();
  const { viewModel, filter } = state;

  // NOTE: Removed pageSpring for better performance
  // Using CSS animations instead (animate-page-in)

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dayjs(dateString).toDate());
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'เสร็จสิ้น', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '✅' };
      case 'cancelled':
        return { label: 'ยกเลิก', color: 'text-red-400', bg: 'bg-red-500/10', icon: '❌' };
      default:
        return { label: status, color: 'text-gray-400', bg: 'bg-gray-500/10', icon: '📋' };
    }
  };

  // Group filtered history by date
  const groupedByDate = actions.groupByDate(viewModel.filteredHistory);

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/customer" className="text-muted hover:text-cyan-400 transition-colors inline-flex items-center gap-2">
              ← กลับหน้าจองคิว
            </Link>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              📜 ประวัติการจองคิว
            </span>
          </h1>
          <p className="text-muted mt-2">ดูประวัติการจองคิวทั้งหมดของคุณ</p>
        </div>
      </section>

      {/* Filter & Actions */}
      <section className="px-4 md:px-8 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => actions.setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-surface text-muted hover:text-foreground'
              }`}
            >
              ทั้งหมด ({viewModel.stats.total})
            </button>
            <button
              onClick={() => actions.setFilter('completed')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface text-muted hover:text-foreground'
              }`}
            >
              ✅ เสร็จสิ้น
            </button>
            <button
              onClick={() => actions.setFilter('cancelled')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : 'bg-surface text-muted hover:text-foreground'
              }`}
            >
              ❌ ยกเลิก
            </button>
          </div>

          {/* Clear Button */}
          {viewModel.history.length > 0 && (
            <button
              onClick={actions.clearHistory}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              🗑️ ลบประวัติทั้งหมด
            </button>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {viewModel.filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {filter === 'all' ? 'ยังไม่มีประวัติการจอง' : `ไม่มีรายการ${filter === 'completed' ? 'ที่เสร็จสิ้น' : 'ที่ยกเลิก'}`}
              </h2>
              <p className="text-muted mb-6">เมื่อคุณจองและใช้บริการ ประวัติจะแสดงที่นี่</p>
              <Link href="/customer/booking">
                <GlowButton color="cyan">จองคิวเลย</GlowButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, bookings]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-muted">{date}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Bookings */}
                  <div className="space-y-3">
                    {bookings.map((booking) => {
                      const statusConfig = getStatusConfig(booking.status);
                      
                      return (
                        <div
                          key={booking.id}
                          className={`rounded-xl border border-border p-4 ${statusConfig.bg}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl">
                                {statusConfig.icon}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{booking.machineName}</p>
                                <p className="text-sm text-muted">{booking.customerName}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                                  <span>⏰ {formatTime(booking.bookingTime)}</span>
                                  <span>⏱️ {booking.duration} นาที</span>
                                  <span>คิว #{booking.position}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Status */}
                            <span className={`text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {viewModel.history.length > 0 && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{viewModel.stats.total}</div>
                <div className="text-xs text-muted">ทั้งหมด</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{viewModel.stats.completed}</div>
                <div className="text-xs text-muted">เสร็จสิ้น</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{viewModel.stats.cancelled}</div>
                <div className="text-xs text-muted">ยกเลิก</div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3 justify-center pt-8">
            <Link href="/customer/booking">
              <GlowButton color="cyan" size="sm">➕ จองคิวใหม่</GlowButton>
            </Link>
            <Link href="/customer/queue-status">
              <GlowButton color="purple" size="sm">📊 ดูสถานะคิว</GlowButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
