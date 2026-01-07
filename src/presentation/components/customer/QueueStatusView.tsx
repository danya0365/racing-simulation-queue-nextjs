'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { createClientCustomerPresenter } from '@/src/presentation/presenters/customer/CustomerPresenterClientFactory';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface QueueStatusViewProps {
  queueId: string;
}

export function QueueStatusView({ queueId }: QueueStatusViewProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<{
    id: string;
    machineId: string;
    customerName: string;
    customerPhone: string;
    bookingTime: string;
    duration: number;
    status: string;
    position: number;
    notes?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [machineName, setMachineName] = useState<string>('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [queueAhead, setQueueAhead] = useState(0);

  const presenter = createClientCustomerPresenter();
  const { activeBookings, removeBooking, updateBooking } = useCustomerStore();

  // Try to get queue from local store first
  const localBooking = activeBookings.find(b => b.id === queueId);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await presenter.getQueueById(queueId);
      if (result) {
        setQueue(result);
        
        // Update local store with latest status
        updateBooking(queueId, {
          status: result.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
          position: result.position,
        });

        // Get machine name
        const machine = await presenter.getMachineById(result.machineId);
        if (machine) {
          setMachineName(machine.name);
        }

        // Calculate queue ahead for the same machine
        try {
          const allQueues = await presenter.getAllQueues();
          const machineQueues = allQueues.filter(
            q => q.machineId === result.machineId && 
            q.status === 'waiting' && 
            q.position < result.position
          );
          setQueueAhead(machineQueues.length);
        } catch {
          setQueueAhead(Math.max(0, result.position - 1));
        }
      } else if (localBooking) {
        // Use local storage data if server doesn't have it
        setQueue({
          id: localBooking.id,
          machineId: localBooking.machineId,
          customerName: localBooking.customerName,
          customerPhone: localBooking.customerPhone,
          bookingTime: localBooking.bookingTime,
          duration: localBooking.duration,
          status: localBooking.status,
          position: localBooking.position,
        });
        setMachineName(localBooking.machineName);
      } else {
        setError('ไม่พบข้อมูลคิว');
      }
    } catch (err) {
      // If server fails, try local storage
      if (localBooking) {
        setQueue({
          id: localBooking.id,
          machineId: localBooking.machineId,
          customerName: localBooking.customerName,
          customerPhone: localBooking.customerPhone,
          bookingTime: localBooking.bookingTime,
          duration: localBooking.duration,
          status: localBooking.status,
          position: localBooking.position,
        });
        setMachineName(localBooking.machineName);
      } else {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      }
    } finally {
      setLoading(false);
    }
  }, [queueId, presenter, localBooking, updateBooking]);

  const handleCancel = async () => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;
    
    setIsCancelling(true);
    try {
      await presenter.cancelQueue(queueId);
      removeBooking(queueId);
      router.push('/customer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถยกเลิกคิวได้');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Auto refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadQueue();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const pageSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin-glow mx-auto mb-4" />
          <p className="text-muted animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !queue) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-foreground mb-2">ไม่พบข้อมูลคิว</h2>
          <p className="text-muted mb-6">{error || 'ไม่พบคิวที่ต้องการ หรือคิวอาจถูกยกเลิกไปแล้ว'}</p>
          <Link href="/customer">
            <GlowButton color="cyan">กลับหน้าจองคิว</GlowButton>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(queue.status);

  // Show Focus Mode for customer waiting
  if (isFocusMode && queue.status === 'waiting') {
    return (
      <Portal>
        <CustomerFocusMode
          queue={queue}
          machineName={machineName}
          queueAhead={queueAhead}
          onRefresh={loadQueue}
          onCancel={handleCancel}
          onExit={() => setIsFocusMode(false)}
          isCancelling={isCancelling}
        />
      </Portal>
    );
  }

  return (
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/customer" className="text-muted hover:text-cyan-400 transition-colors inline-flex items-center gap-2">
              ← กลับหน้าจองคิว
            </Link>
            {queue.status === 'waiting' && (
              <GlowButton color="purple" size="sm" onClick={() => setIsFocusMode(true)}>
                📺 โหมดรอคิว
              </GlowButton>
            )}
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              สถานะคิวของคุณ
            </span>
          </h1>
        </div>
      </section>

      {/* Status Card */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatedCard className="p-8 text-center">
            {/* Status Icon with Animation */}
            <div className={`w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br ${statusConfig.color} flex items-center justify-center text-6xl shadow-lg animate-float`}>
              {statusConfig.icon}
            </div>

            {/* Queue Position - Large & Prominent */}
            <div className="mb-4">
              <span className="text-7xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                #{queue.position}
              </span>
              <p className="text-muted mt-2">หมายเลขคิว</p>
            </div>

            {/* Status Badge */}
            <div className={`inline-block px-8 py-3 rounded-full bg-gradient-to-r ${statusConfig.color} text-white font-bold text-lg mb-4 shadow-lg`}>
              {statusConfig.label}
            </div>

            {/* Status Message */}
            <p className="text-muted mb-8 text-lg">{statusConfig.message}</p>

            {/* Queue Details Card */}
            <div className={`rounded-xl p-6 text-left space-y-4 ${statusConfig.bgColor} border border-border`}>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted flex items-center gap-2">
                  <span>👤</span> ชื่อ
                </span>
                <span className="font-medium text-foreground">{queue.customerName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted flex items-center gap-2">
                  <span>📱</span> เบอร์โทร
                </span>
                <span className="font-medium text-foreground">{queue.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted flex items-center gap-2">
                  <span>🎮</span> เครื่อง
                </span>
                <span className="font-medium text-foreground">{machineName || `Machine ${queue.machineId}`}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted flex items-center gap-2">
                  <span>📅</span> วันที่
                </span>
                <span className="font-medium text-foreground">{formatDate(queue.bookingTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted flex items-center gap-2">
                  <span>⏰</span> เวลานัดหมาย
                </span>
                <span className="font-medium text-cyan-400 text-lg">{formatTime(queue.bookingTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted flex items-center gap-2">
                  <span>⏱️</span> ระยะเวลา
                </span>
                <span className="font-medium text-foreground">{queue.duration} นาที</span>
              </div>
              {queue.notes && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted flex items-center gap-2">
                    <span>📝</span> หมายเหตุ
                  </span>
                  <span className="font-medium text-foreground">{queue.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <AnimatedButton variant="ghost" onClick={loadQueue}>
                🔄 รีเฟรช
              </AnimatedButton>
              
              {statusConfig.showCancel && (
                <AnimatedButton 
                  variant="ghost" 
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  {isCancelling ? '❌ กำลังยกเลิก...' : '❌ ยกเลิกคิว'}
                </AnimatedButton>
              )}
              
              <Link href="/customer">
                <GlowButton color="cyan">จองคิวเพิ่ม</GlowButton>
              </Link>
            </div>
          </AnimatedCard>

          {/* Auto refresh notice */}
          <div className="flex items-center justify-center gap-2 text-center text-sm text-muted mt-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ข้อมูลจะรีเฟรชอัตโนมัติทุก 15 วินาที</span>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 rounded-xl bg-surface border border-border">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span>💡</span> คำแนะนำ
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>กรุณามาถึงก่อนเวลานัดหมายอย่างน้อย 5 นาที</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>สามารถยกเลิกคิวได้หากมีการเปลี่ยนแปลง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>หากมีข้อสงสัย สามารถติดต่อเจ้าหน้าที่ได้ตลอดเวลา</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </animated.div>
  );
}

// Customer Focus Mode - Fullscreen Queue Waiting Experience
interface CustomerFocusModeProps {
  queue: {
    id: string;
    machineId: string;
    customerName: string;
    customerPhone: string;
    bookingTime: string;
    duration: number;
    status: string;
    position: number;
    notes?: string;
  };
  machineName: string;
  queueAhead: number;
  onRefresh: () => Promise<void>;
  onCancel: () => Promise<void>;
  onExit: () => void;
  isCancelling: boolean;
}

function CustomerFocusMode({
  queue,
  machineName,
  queueAhead,
  onRefresh,
  onCancel,
  onExit,
  isCancelling,
}: CustomerFocusModeProps) {
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

  // Estimate wait time (assume ~20 mins per person)
  const estimatedWaitMinutes = queueAhead * 20;
  const estimatedWaitText = estimatedWaitMinutes > 0 
    ? `ประมาณ ${estimatedWaitMinutes} นาที`
    : 'ใกล้ถึงคิวแล้ว!';

  // Is next in queue?
  const isNextUp = queueAhead === 0;

  // Animation for pulsing when next up
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
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        {isNextUp && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-ping" />
        )}
      </div>

      {/* Exit Button - Top Right */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium flex items-center gap-2 backdrop-blur-sm transition-all"
      >
        <span>✕</span>
        <span className="hidden sm:inline">ออก</span>
      </button>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-8">
        {/* Top: Customer Info */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-sm">ยินดีต้อนรับ</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{queue.customerName}</h1>
          <p className="text-white/40 text-sm mt-1">{queue.customerPhone}</p>
        </div>

        {/* Queue Number - Hero */}
        <animated.div 
          style={pulseSpring}
          className={`relative mb-8 ${isNextUp ? 'animate-bounce' : ''}`}
        >
          <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center shadow-2xl ${
            isNextUp 
              ? 'bg-gradient-to-br from-emerald-400 to-green-600 ring-4 ring-emerald-300' 
              : 'bg-gradient-to-br from-purple-500 to-pink-600 ring-4 ring-purple-400/50'
          }`}>
            <span className="text-white/60 text-sm">หมายเลขคิว</span>
            <span className="text-6xl md:text-8xl font-bold text-white">
              #{queue.position}
            </span>
          </div>
        </animated.div>

        {/* Status Message */}
        {isNextUp ? (
          <div className="text-center mb-8 animate-pulse">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">
              ถึงคิวคุณแล้ว!
            </h2>
            <p className="text-white/80 text-lg">กรุณาเตรียมตัวที่เครื่อง</p>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              มี {queueAhead} คิวก่อนหน้า
            </h2>
            <p className="text-white/60 text-lg">{estimatedWaitText}</p>
          </div>
        )}

        {/* Progress Bar */}
        {!isNextUp && (
          <div className="w-full max-w-md mb-8">
            <div className="bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, 100 - (queueAhead * 20))}%` }}
              />
            </div>
            <p className="text-center text-white/40 text-sm mt-2">ความคืบหน้า</p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 max-w-md w-full mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">🎮</div>
            <p className="text-white/60 text-xs">เครื่อง</p>
            <p className="text-white font-medium text-sm">{machineName}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">⏱️</div>
            <p className="text-white/60 text-xs">ระยะเวลา</p>
            <p className="text-white font-medium text-sm">{queue.duration} นาที</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">📅</div>
            <p className="text-white/60 text-xs">เวลานัดหมาย</p>
            <p className="text-white font-medium text-sm">{formatBookingTime()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">⏰</div>
            <p className="text-white/60 text-xs">เวลาปัจจุบัน</p>
            <p className="text-white font-mono font-medium text-sm">{formatTime()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span>รีเฟรช</span>
          </button>
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-300 font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <span>❌</span>
            <span>{isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิกคิว'}</span>
          </button>
        </div>

        {/* Footer: Live indicator */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-white/40 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>กำลังอัพเดทอัตโนมัติ</span>
        </div>
      </div>
    </div>
  );
}
