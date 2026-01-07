'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { BookingFormData, CustomerViewModel } from '@/src/presentation/presenters/customer/CustomerPresenter';
import { useCustomerPresenter } from '@/src/presentation/presenters/customer/useCustomerPresenter';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CustomerViewProps {
  initialViewModel?: CustomerViewModel;
}

export function CustomerView({ initialViewModel }: CustomerViewProps) {
  const [state, actions] = useCustomerPresenter(initialViewModel);
  const viewModel = state.viewModel;

  // Page animation
  const pageSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

  // Loading state
  if (state.loading && !viewModel) {
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
  if (state.error && !viewModel) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-error mb-4">{state.error}</p>
          <GlowButton color="cyan" onClick={actions.loadData}>
            ลองใหม่อีกครั้ง
          </GlowButton>
        </div>
      </div>
    );
  }

  if (!viewModel) return null;

  return (
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
      {/* Header Section */}
      <section className="relative py-8 px-4 md:px-8 bg-gradient-to-br from-cyan-500/10 via-background to-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-muted hover:text-cyan-400 transition-colors">
              ← กลับหน้าแรก
            </Link>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg">
              🎮
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  จองคิว Racing Simulator
                </span>
              </h1>
              <p className="text-muted">เลือกเครื่องที่ต้องการและจองคิวได้เลย</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">{viewModel.machineStats.availableMachines} เครื่องว่าง</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400">
              <span className="text-sm font-medium">{viewModel.machineStats.occupiedMachines} กำลังใช้งาน</span>
            </div>
          </div>
        </div>
      </section>

      {/* Machines Grid */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-foreground">เลือกเครื่องเล่น</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewModel.machines.map((machine, index) => (
              <MachineBookingCard
                key={machine.id}
                machine={machine}
                index={index}
                onBook={() => actions.openBookingModal(machine)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {state.isBookingModalOpen && state.selectedMachine && (
        <BookingModal
          machine={state.selectedMachine}
          isSubmitting={state.isSubmitting}
          error={state.error}
          onSubmit={actions.submitBooking}
          onClose={actions.closeBookingModal}
        />
      )}

      {/* Success Modal */}
      {state.bookingSuccess && (
        <SuccessModal
          queue={state.bookingSuccess}
          onClose={actions.clearBookingSuccess}
        />
      )}

      {/* Error Toast */}
      {state.error && viewModel && !state.isBookingModalOpen && (
        <div className="fixed bottom-4 right-4 bg-error text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{state.error}</span>
            <button
              onClick={() => actions.setError(null)}
              className="ml-4 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </animated.div>
  );
}

// Machine Booking Card
interface MachineBookingCardProps {
  machine: {
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
  };
  index: number;
  onBook: () => void;
}

function MachineBookingCard({ machine, index, onBook }: MachineBookingCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const spring = useSpring({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    config: config.gentle,
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'ว่าง',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          icon: '✅',
          canBook: true,
        };
      case 'occupied':
        return {
          label: 'กำลังใช้งาน',
          color: 'bg-orange-500',
          textColor: 'text-orange-400',
          icon: '🏁',
          canBook: false,
        };
      case 'maintenance':
        return {
          label: 'ซ่อมบำรุง',
          color: 'bg-gray-500',
          textColor: 'text-gray-400',
          icon: '🔧',
          canBook: false,
        };
      default:
        return {
          label: status,
          color: 'bg-gray-500',
          textColor: 'text-gray-400',
          icon: '❓',
          canBook: false,
        };
    }
  };

  const statusConfig = getStatusConfig(machine.status);

  return (
    <animated.div style={spring}>
      <AnimatedCard
        glowColor={statusConfig.canBook ? 'rgba(0, 212, 255, 0.3)' : 'rgba(107, 114, 128, 0.2)'}
        disabled={!statusConfig.canBook}
        className="p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg">
              🎮
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{machine.name}</h3>
              <p className="text-sm text-muted">เครื่องที่ {machine.position}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted mb-6 line-clamp-2">{machine.description}</p>

        {/* Action */}
        {statusConfig.canBook && machine.isActive ? (
          <GlowButton color="cyan" size="md" onClick={onBook} className="w-full">
            🎯 จองคิวเครื่องนี้
          </GlowButton>
        ) : (
          <div className={`text-center py-3 ${statusConfig.textColor} text-sm rounded-xl bg-surface`}>
            {machine.status === 'occupied' && '⏳ มีคนกำลังใช้งาน'}
            {machine.status === 'maintenance' && '🔧 ปิดปรับปรุงชั่วคราว'}
          </div>
        )}
      </AnimatedCard>
    </animated.div>
  );
}

// Booking Modal
interface BookingModalProps {
  machine: {
    id: string;
    name: string;
  };
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: BookingFormData) => Promise<void>;
  onClose: () => void;
}

function BookingModal({ machine, isSubmitting, error, onSubmit, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    duration: 30,
    notes: '',
  });

  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get next available time slot (now + 5 minutes)
    const bookingTime = new Date();
    bookingTime.setMinutes(bookingTime.getMinutes() + 5);

    await onSubmit({
      machineId: machine.id,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      bookingTime: bookingTime.toISOString(),
      duration: formData.duration,
      notes: formData.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl">
                🎮
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">จองคิว</h3>
                <p className="text-sm text-muted">{machine.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface hover:bg-muted-light flex items-center justify-center text-muted hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/20 text-error text-sm">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground placeholder-input-placeholder"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              เบอร์โทรศัพท์ *
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground placeholder-input-placeholder"
              placeholder="081-234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ระยะเวลา *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration })}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.duration === duration
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-surface border border-border text-muted hover:border-cyan-500'
                  }`}
                >
                  {duration} นาที
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground placeholder-input-placeholder resize-none"
              placeholder="เช่น ต้องการเครื่องใกล้หน้าต่าง"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <AnimatedButton
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              type="submit"
              className="flex-1"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              ✅ ยืนยันจอง
            </AnimatedButton>
          </div>
        </form>
      </animated.div>
    </div>
  );
}

// Success Modal
interface SuccessModalProps {
  queue: {
    id: string;
    machineId: string;
    customerName: string;
    bookingTime: string;
    duration: number;
    position: number;
  };
  onClose: () => void;
}

function SuccessModal({ queue, onClose }: SuccessModalProps) {
  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-center"
      >
        <div className="p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30 animate-float">
            ✅
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-2">จองคิวสำเร็จ!</h3>
          <p className="text-muted mb-6">คุณ {queue.customerName}</p>

          {/* Queue Info */}
          <div className="bg-background rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">หมายเลขคิว</span>
              <span className="font-bold text-cyan-400">#{queue.position}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">เวลานัด</span>
              <span className="font-medium text-foreground">{formatTime(queue.bookingTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">ระยะเวลา</span>
              <span className="font-medium text-foreground">{queue.duration} นาที</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Link href={`/customer/queue/${queue.id}`}>
              <GlowButton color="cyan" className="w-full">
                📋 ดูสถานะคิว
              </GlowButton>
            </Link>
            <AnimatedButton variant="ghost" onClick={onClose} className="w-full">
              ปิด
            </AnimatedButton>
          </div>
        </div>
      </animated.div>
    </div>
  );
}
