'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { createClientCustomerPresenter } from '@/src/presentation/presenters/customer/CustomerPresenterClientFactory';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface QueueStatusViewProps {
  queueId: string;
}

export function QueueStatusView({ queueId }: QueueStatusViewProps) {
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

  const presenter = createClientCustomerPresenter();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await presenter.getQueueById(queueId);
      setQueue(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [queueId, presenter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Auto refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadQueue();
    }, 10000);
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return {
          label: 'รอคิว',
          color: 'from-purple-500 to-violet-600',
          icon: '⏳',
          message: 'กรุณารอสักครู่ เจ้าหน้าที่จะเรียกคิวของคุณเร็วๆ นี้',
        };
      case 'playing':
        return {
          label: 'กำลังเล่น',
          color: 'from-cyan-500 to-blue-600',
          icon: '🏁',
          message: 'ขอให้สนุกกับการเล่น!',
        };
      case 'completed':
        return {
          label: 'เสร็จสิ้น',
          color: 'from-emerald-500 to-green-600',
          icon: '✅',
          message: 'ขอบคุณที่ใช้บริการ หวังว่าจะพบกันอีก!',
        };
      case 'cancelled':
        return {
          label: 'ยกเลิก',
          color: 'from-red-500 to-rose-600',
          icon: '❌',
          message: 'คิวนี้ถูกยกเลิกแล้ว',
        };
      default:
        return {
          label: status,
          color: 'from-gray-500 to-slate-600',
          icon: '❓',
          message: '',
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
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-foreground mb-2">ไม่พบข้อมูลคิว</h2>
          <p className="text-muted mb-4">{error || 'ไม่พบคิวที่ต้องการ'}</p>
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
          <Link href="/customer" className="text-muted hover:text-cyan-400 transition-colors inline-block mb-4">
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
            {/* Status Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${statusConfig.color} flex items-center justify-center text-5xl shadow-lg animate-float`}>
              {statusConfig.icon}
            </div>

            {/* Queue Position */}
            <div className="mb-4">
              <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                #{queue.position}
              </span>
              <p className="text-muted mt-2">หมายเลขคิว</p>
            </div>

            {/* Status Badge */}
            <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${statusConfig.color} text-white font-bold mb-4`}>
              {statusConfig.label}
            </div>

            {/* Status Message */}
            <p className="text-muted mb-8">{statusConfig.message}</p>

            {/* Queue Details */}
            <div className="bg-background rounded-xl p-6 text-left space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">ชื่อ</span>
                <span className="font-medium text-foreground">{queue.customerName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">เบอร์โทร</span>
                <span className="font-medium text-foreground">{queue.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">เวลานัดหมาย</span>
                <span className="font-medium text-foreground">{formatTime(queue.bookingTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted">ระยะเวลา</span>
                <span className="font-medium text-foreground">{queue.duration} นาที</span>
              </div>
              {queue.notes && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted">หมายเหตุ</span>
                  <span className="font-medium text-foreground">{queue.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <AnimatedButton variant="ghost" onClick={loadQueue}>
                🔄 รีเฟรช
              </AnimatedButton>
              <Link href="/customer">
                <GlowButton color="cyan">จองคิวเพิ่ม</GlowButton>
              </Link>
            </div>
          </AnimatedCard>

          {/* Auto refresh notice */}
          <p className="text-center text-sm text-muted mt-4">
            ข้อมูลจะรีเฟรชอัตโนมัติทุก 10 วินาที
          </p>
        </div>
      </section>
    </animated.div>
  );
}
