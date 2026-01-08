'use client';

import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { QueueStatusData } from '@/src/presentation/presenters/queueStatus/QueueStatusPresenter';
import { useQueueStatusPresenter } from '@/src/presentation/presenters/queueStatus/useQueueStatusPresenter';
import { animated, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * MyQueueStatusView
 * View component for Queue Status page
 * ✅ Following Clean Architecture pattern - uses presenter hook for state management
 */
export function MyQueueStatusView() {
  const [state, actions] = useQueueStatusPresenter();
  const { viewModel, loading, focusQueueId, currentTime } = state;

  // NOTE: Removed pageSpring for better performance
  // Using CSS animations instead (animate-page-in)

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatCurrentTime = () => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(currentTime);
  };

  // Get focus queue data
  const focusQueue = focusQueueId && viewModel 
    ? viewModel.queues.find(q => q.id === focusQueueId) 
    : null;

  // Customer Focus Mode
  if (focusQueue) {
    return (
      <Portal>
        <CustomerFocusMode
          queue={focusQueue}
          onRefresh={actions.loadData}
          onCancel={() => actions.cancelQueue(focusQueue.id)}
          onExit={actions.exitFocusMode}
        />
      </Portal>
    );
  }

  // Loading state
  if (loading && !viewModel) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin-glow mx-auto mb-4" />
          <p className="text-muted animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const waitingQueues = viewModel?.waitingQueues || [];
  const playingQueues = viewModel?.playingQueues || [];
  const completedQueues = viewModel?.completedQueues || [];

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/customer" className="text-muted hover:text-cyan-400 transition-colors inline-flex items-center gap-2">
              ← กลับหน้าจองคิว
            </Link>
            <div className="text-right">
              <p className="text-muted text-sm">เวลาปัจจุบัน</p>
              <p className="text-lg font-mono font-bold text-cyan-400">{formatCurrentTime()}</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              📋 สถานะคิวของฉัน
            </span>
          </h1>
          <p className="text-muted mt-2">ติดตามสถานะคิวและเวลารอของคุณได้ที่นี่</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* No Queues */}
          {(!viewModel || viewModel.queues.length === 0) && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-xl font-bold text-foreground mb-2">ยังไม่มีคิว</h2>
              <p className="text-muted mb-6">คุณยังไม่ได้จองคิวเครื่องเล่น</p>
              <Link href="/customer/booking">
                <GlowButton color="cyan">จองคิวเลย</GlowButton>
              </Link>
            </div>
          )}

          {/* Waiting Queues - Primary */}
          {waitingQueues.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                ⏳ กำลังรอคิว ({waitingQueues.length})
              </h2>
              <div className="space-y-4">
                {waitingQueues.map((queue) => (
                  <QueueCard
                    key={queue.id}
                    queue={queue}
                    formatTime={formatTime}
                    onFocus={() => actions.enterFocusMode(queue.id)}
                    onCancel={() => actions.cancelQueue(queue.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Playing Now */}
          {playingQueues.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                🏁 กำลังเล่นอยู่ ({playingQueues.length})
              </h2>
              <div className="space-y-4">
                {playingQueues.map((queue) => (
                  <div
                    key={queue.id}
                    className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl text-white font-bold">
                          🏁
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{queue.machineName}</p>
                          <p className="text-cyan-400 font-medium">{queue.customerName}</p>
                          <p className="text-sm text-muted">{queue.duration} นาที</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-4 py-2 rounded-full bg-cyan-500 text-white font-medium">
                          กำลังเล่น
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedQueues.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-muted mb-4">
                ✅ ประวัติ ({completedQueues.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {completedQueues.slice(0, 3).map((queue) => (
                  <div
                    key={queue.id}
                    className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted">
                        {queue.status === 'completed' ? '✅' : '❌'}
                      </span>
                      <span className="text-muted">{queue.machineName}</span>
                    </div>
                    <span className="text-sm text-muted">{formatTime(queue.bookingTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto refresh notice */}
          <div className="flex items-center justify-center gap-2 text-center text-sm text-muted pt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ข้อมูลจะรีเฟรชอัตโนมัติทุก 15 วินาที</span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 justify-center pt-4">
            <Link href="/customer/booking">
              <GlowButton color="cyan" size="sm">➕ จองคิวเพิ่ม</GlowButton>
            </Link>
            <button
              onClick={actions.loadData}
              className="px-4 py-2 bg-surface border border-border rounded-xl text-muted hover:text-foreground transition-colors flex items-center gap-2"
            >
              🔄 รีเฟรช
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Queue Card Component
interface QueueCardProps {
  queue: QueueStatusData;
  formatTime: (time: string) => string;
  onFocus: () => void;
  onCancel: () => void;
}

function QueueCard({ queue, formatTime, onFocus, onCancel }: QueueCardProps) {
  const isNextUp = queue.queueAhead === 0;
  
  // Estimate wait time
  const estimatedWaitMinutes = queue.queueAhead * 20;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
        isNextUp
          ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500 animate-pulse'
          : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50'
      }`}
    >
      {/* Alert for next up */}
      {isNextUp && (
        <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-center py-1 text-sm font-bold">
          🎉 ถึงคิวคุณแล้ว! กรุณาเตรียมตัว
        </div>
      )}

      <div className={`${isNextUp ? 'mt-6' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          {/* Left: Queue Info */}
          <div className="flex items-center gap-4">
            {/* Queue Number */}
            <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
              isNextUp
                ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                : 'bg-gradient-to-br from-purple-500 to-pink-600'
            }`}>
              <span className="text-white/60 text-xs">คิว</span>
              <span className="text-2xl font-bold text-white">#{queue.position}</span>
            </div>

            {/* Details */}
            <div>
              <p className="font-bold text-foreground">{queue.machineName}</p>
              <p className="text-sm text-muted">{queue.customerName}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted">⏰ {formatTime(queue.bookingTime)}</span>
                <span className="text-xs text-muted">⏱️ {queue.duration} นาที</span>
              </div>
            </div>
          </div>

          {/* Right: Status */}
          <div className="text-right">
            {isNextUp ? (
              <div className="text-emerald-400 font-bold">ถึงคิวแล้ว!</div>
            ) : (
              <>
                <div className="text-foreground font-medium">
                  อีก {queue.queueAhead} คิว
                </div>
                <div className="text-sm text-muted">
                  ~{estimatedWaitMinutes} นาที
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <GlowButton
            color={isNextUp ? 'green' : 'purple'}
            size="sm"
            onClick={onFocus}
            className="flex-1"
          >
            📺 โหมดติดตาม
          </GlowButton>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors text-sm"
          >
            ❌ ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// Customer Focus Mode - Fullscreen Queue Tracking
interface CustomerFocusModeProps {
  queue: QueueStatusData;
  onRefresh: () => Promise<void>;
  onCancel: () => void;
  onExit: () => void;
}

function CustomerFocusMode({ queue, onRefresh, onCancel, onExit }: CustomerFocusModeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const formatTime = () => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(currentTime);
  };

  const formatBookingTime = () => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(queue.bookingTime));
  };

  // Estimate wait time
  const estimatedWaitMinutes = queue.queueAhead * 20;
  const estimatedWaitText = estimatedWaitMinutes > 0 
    ? `ประมาณ ${estimatedWaitMinutes} นาที`
    : 'ใกล้ถึงคิวแล้ว!';

  // Is next in queue?
  const isNextUp = queue.queueAhead === 0;

  // Pulse animation when next up
  const pulseSpring = useSpring({
    loop: isNextUp,
    from: { scale: 1, opacity: 1 },
    to: isNextUp ? [
      { scale: 1.05, opacity: 0.8 },
      { scale: 1, opacity: 1 },
    ] : { scale: 1, opacity: 1 },
    config: { duration: 1000 },
  });

  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden ${
      isNextUp 
        ? 'bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900' 
        : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        {isNextUp && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-ping" />
        )}
      </div>

      {/* Exit Button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium flex items-center gap-2 backdrop-blur-sm transition-all"
      >
        <span>✕</span>
        <span className="hidden sm:inline">ออก</span>
      </button>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-8">
        {/* Customer Info */}
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm">ยินดีต้อนรับ</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{queue.customerName}</h1>
          <p className="text-white/40 text-sm mt-1">{queue.customerPhone}</p>
        </div>

        {/* Queue Number */}
        <animated.div 
          style={pulseSpring}
          className={`relative mb-6 ${isNextUp ? 'animate-bounce' : ''}`}
        >
          <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center shadow-2xl ${
            isNextUp 
              ? 'bg-gradient-to-br from-emerald-400 to-green-600 ring-4 ring-emerald-300' 
              : 'bg-gradient-to-br from-purple-500 to-pink-600 ring-4 ring-purple-400/50'
          }`}>
            <span className="text-white/60 text-sm">หมายเลขคิว</span>
            <span className="text-5xl md:text-7xl font-bold text-white">
              #{queue.position}
            </span>
          </div>
        </animated.div>

        {/* Status Message */}
        {isNextUp ? (
          <div className="text-center mb-6 animate-pulse">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-300 mb-2">
              ถึงคิวคุณแล้ว!
            </h2>
            <p className="text-white/80 text-lg">กรุณาเตรียมตัวที่เครื่อง {queue.machineName}</p>
          </div>
        ) : (
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              มี {queue.queueAhead} คิวก่อนหน้า
            </h2>
            <p className="text-white/60 text-lg">{estimatedWaitText}</p>
          </div>
        )}

        {/* Progress Bar */}
        {!isNextUp && queue.queueAhead < 5 && (
          <div className="w-full max-w-sm mb-6">
            <div className="bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, 100 - (queue.queueAhead * 20))}%` }}
              />
            </div>
            <p className="text-center text-white/40 text-sm mt-2">ความคืบหน้า</p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 max-w-sm w-full mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🎮</div>
            <p className="text-white/60 text-xs">เครื่อง</p>
            <p className="text-white font-medium text-sm">{queue.machineName}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">⏱️</div>
            <p className="text-white/60 text-xs">ระยะเวลา</p>
            <p className="text-white font-medium text-sm">{queue.duration} นาที</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">📅</div>
            <p className="text-white/60 text-xs">เวลาจอง</p>
            <p className="text-white font-medium text-sm">{formatBookingTime()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">⏰</div>
            <p className="text-white/60 text-xs">เวลาปัจจุบัน</p>
            <p className="text-white font-mono font-medium text-sm">{formatTime()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span>รีเฟรช</span>
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-300 font-medium flex items-center gap-2 transition-all"
          >
            <span>❌</span>
            <span>ยกเลิก</span>
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-white/40 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>อัพเดทอัตโนมัติทุก 10 วินาที</span>
        </div>
      </div>
    </div>
  );
}
