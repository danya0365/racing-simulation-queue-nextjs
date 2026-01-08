'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { useSingleQueuePresenter } from '@/src/presentation/presenters/singleQueue/useSingleQueuePresenter';
import { animated, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface QueueStatusViewProps {
  queueId: string;
}

/**
 * QueueStatusView
 * View component for viewing a single queue status
 * ✅ Following Clean Architecture pattern - uses useSingleQueuePresenter hook
 */
export function QueueStatusView({ queueId }: QueueStatusViewProps) {
  const router = useRouter();
  const [state, actions] = useSingleQueuePresenter(queueId);
  const { viewModel, loading, error, isCancelling, isFocusMode } = state;

  // NOTE: Removed pageSpring for better performance
  // Using CSS animations instead (animate-page-in)

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return {
          label: 'รอคิว',
          color: 'from-purple-500 to-violet-600',
          bgColor: 'bg-purple-500/10',
          icon: '⏳',
          message: 'กรุณารอสักครู่ เจ้าหน้าที่จะเรียกคิวของคุณเร็วๆ นี้',
          showCancel: true,
        };
      case 'playing':
        return {
          label: 'กำลังเล่น',
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-500/10',
          icon: '🏁',
          message: 'ขอให้สนุกกับการเล่น!',
          showCancel: false,
        };
      case 'completed':
        return {
          label: 'เสร็จสิ้น',
          color: 'from-emerald-500 to-green-600',
          bgColor: 'bg-emerald-500/10',
          icon: '✅',
          message: 'ขอบคุณที่ใช้บริการ หวังว่าจะพบกันอีก!',
          showCancel: false,
        };
      case 'cancelled':
        return {
          label: 'ยกเลิก',
          color: 'from-red-500 to-rose-600',
          bgColor: 'bg-red-500/10',
          icon: '❌',
          message: 'คิวนี้ถูกยกเลิกแล้ว',
          showCancel: false,
        };
      default:
        return {
          label: status,
          color: 'from-gray-500 to-slate-600',
          bgColor: 'bg-gray-500/10',
          icon: '❓',
          message: '',
          showCancel: false,
        };
    }
  };

  const handleCancel = async () => {
    await actions.cancelQueue();
    router.push('/customer');
  };

  // Focus Mode
  if (isFocusMode && viewModel?.queue) {
    return (
      <Portal>
        <CustomerFocusMode
          queue={{
            id: viewModel.queue.id,
            machineName: viewModel.machine?.name || 'Unknown',
            customerName: viewModel.queue.customerName,
            customerPhone: viewModel.queue.customerPhone,
            bookingTime: viewModel.queue.bookingTime,
            duration: viewModel.queue.duration,
            status: viewModel.queue.status,
            position: viewModel.queue.position,
            queueAhead: viewModel.queueAhead,
          }}
          onRefresh={actions.loadData}
          onCancel={handleCancel}
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

  // Error state
  if (error && !viewModel) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-error mb-4">{error}</p>
          <Link href="/customer">
            <GlowButton color="cyan">กลับหน้าจองคิว</GlowButton>
          </Link>
        </div>
      </div>
    );
  }

  if (!viewModel?.queue) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-muted mb-4">ไม่พบข้อมูลคิว</p>
          <Link href="/customer">
            <GlowButton color="cyan">กลับหน้าจองคิว</GlowButton>
          </Link>
        </div>
      </div>
    );
  }

  const queue = viewModel.queue;
  const machineName = viewModel.machine?.name || 'Unknown';
  const queueAhead = viewModel.queueAhead;
  const statusConfig = getStatusConfig(queue.status);
  const estimatedWaitMinutes = queueAhead * 20;
  const isNextUp = queueAhead === 0 && queue.status === 'waiting';

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/customer/queue-status" className="text-muted hover:text-cyan-400 transition-colors inline-flex items-center gap-2">
              ← กลับหน้าสถานะคิว
            </Link>
            <button
              onClick={actions.loadData}
              className="text-muted hover:text-cyan-400 transition-colors"
            >
              🔄 รีเฟรช
            </button>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              📋 สถานะคิว #{queue.position}
            </span>
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Queue Number Card */}
          <AnimatedCard className={`p-8 text-center ${statusConfig.bgColor}`}>
            {/* Status Icon */}
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${statusConfig.color} flex items-center justify-center text-5xl shadow-lg ${isNextUp ? 'animate-pulse' : ''}`}>
              {statusConfig.icon}
            </div>

            {/* Queue Number */}
            <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
              #{queue.position}
            </div>
            <div className={`text-xl font-bold bg-gradient-to-r ${statusConfig.color} bg-clip-text text-transparent mb-2`}>
              {statusConfig.label}
            </div>
            
            {/* Next Up Alert */}
            {isNextUp && (
              <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500 rounded-xl animate-pulse">
                <p className="text-emerald-400 font-bold text-lg">🎉 ถึงคิวคุณแล้ว!</p>
                <p className="text-emerald-300 text-sm">กรุณาเตรียมตัวที่เครื่อง</p>
              </div>
            )}

            {/* Queue Ahead */}
            {queue.status === 'waiting' && !isNextUp && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="text-purple-300 font-medium">มี {queueAhead} คิวก่อนหน้า</p>
                <p className="text-purple-400/70 text-sm">รอประมาณ {estimatedWaitMinutes} นาที</p>
              </div>
            )}

            {/* Status Message */}
            <p className="text-muted mt-4">{statusConfig.message}</p>
          </AnimatedCard>

          {/* Details Card */}
          <AnimatedCard className="p-6">
            <h3 className="font-bold text-foreground mb-4">📝 รายละเอียดการจอง</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">👤 ชื่อ</span>
                <span className="font-medium text-foreground">{queue.customerName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">📱 เบอร์โทร</span>
                <span className="font-medium text-foreground">{queue.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">🎮 เครื่อง</span>
                <span className="font-medium text-foreground">{machineName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">📅 วันที่</span>
                <span className="font-medium text-foreground">{formatDate(queue.bookingTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">⏰ เวลา</span>
                <span className="font-medium text-foreground">{formatTime(queue.bookingTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted">⏱️ ระยะเวลา</span>
                <span className="font-medium text-cyan-400">{queue.duration} นาที</span>
              </div>
            </div>
          </AnimatedCard>

          {/* Actions */}
          <div className="space-y-3">
            {/* Focus Mode Button */}
            {queue.status === 'waiting' && (
              <GlowButton
                color="purple"
                size="lg"
                className="w-full"
                onClick={actions.enterFocusMode}
              >
                📺 โหมดติดตาม
              </GlowButton>
            )}

            {/* Cancel Button */}
            {statusConfig.showCancel && (
              <AnimatedButton
                variant="ghost"
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                {isCancelling ? '⏳ กำลังยกเลิก...' : '❌ ยกเลิกคิว'}
              </AnimatedButton>
            )}

            {/* Back Button */}
            <Link href="/customer" className="block">
              <AnimatedButton variant="ghost" className="w-full">
                ← กลับหน้าหลัก
              </AnimatedButton>
            </Link>
          </div>

          {/* Auto refresh notice */}
          <div className="flex items-center justify-center gap-2 text-center text-sm text-muted pt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ข้อมูลจะรีเฟรชอัตโนมัติทุก 15 วินาที</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// Customer Focus Mode - Fullscreen Queue Tracking
interface CustomerFocusModeProps {
  queue: {
    id: string;
    machineName: string;
    customerName: string;
    customerPhone: string;
    bookingTime: string;
    duration: number;
    status: string;
    position: number;
    queueAhead: number;
  };
  onRefresh: () => Promise<void>;
  onCancel: () => Promise<void>;
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
