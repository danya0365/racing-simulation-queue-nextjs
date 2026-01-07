'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
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

  return (
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-2xl mx-auto">
          <Link href="/customer" className="text-muted hover:text-cyan-400 transition-colors inline-flex items-center gap-2 mb-4">
            ← กลับหน้าจองคิว
          </Link>
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
