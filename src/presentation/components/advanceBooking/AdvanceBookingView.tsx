'use client';

import { AdvanceBooking, TimeSlot } from '@/src/application/repositories/IAdvanceBookingRepository';
import { DEFAULT_DURATION, DURATION_OPTIONS } from '@/src/config/booking.config';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { AdvanceBookingViewModel } from '@/src/presentation/presenters/advanceBooking/AdvanceBookingPresenter';
import { useAdvanceBookingPresenter } from '@/src/presentation/presenters/advanceBooking/useAdvanceBookingPresenter';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AdvanceBookingViewProps {
  initialViewModel?: AdvanceBookingViewModel;
}

export function AdvanceBookingView({ initialViewModel }: AdvanceBookingViewProps) {
  const [state, actions] = useAdvanceBookingPresenter(initialViewModel);
  const { customerInfo } = useCustomerStore();
  const viewModel = state.viewModel;

  // Loading state
  if (state.loading && !viewModel) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-3xl animate-pulse">
            📅
          </div>
          <p className="text-muted">กำลังโหลด...</p>
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
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Hero Header Section */}
      <section className="relative py-10 px-4 md:px-8 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/customer" className="text-muted hover:text-purple-400 transition-colors">
              ← กลับหน้าจองคิว
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/30">
              📅
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent">
                  จองคิวล่วงหน้า
                </span>
              </h1>
              <p className="text-muted mt-1">เลือกวันและเวลาที่ต้องการจองล่วงหน้า</p>
            </div>
          </div>
        </div>
      </section>

      {/* Machine Selector */}
      <section className="px-4 md:px-8 py-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-xl">🎮</span>
            เลือกเครื่องเล่น
          </h2>
          <div className="flex flex-wrap gap-3">
            {viewModel.machines.map((machine) => (
              <button
                key={machine.id}
                onClick={() => actions.selectMachine(machine.id)}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  viewModel.selectedMachineId === machine.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-surface border border-border text-muted hover:border-purple-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎮</span>
                  <span>{machine.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Date Picker */}
      <section className="px-4 md:px-8 py-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-xl">📆</span>
            เลือกวัน
          </h2>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin">
            {viewModel.availableDates.map((date, index) => {
              const dateObj = new Date(date);
              const isSelected = viewModel.selectedDate === date;
              const isToday = index === 0;
              const dayName = dateObj.toLocaleDateString('th-TH', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              const monthName = dateObj.toLocaleDateString('th-TH', { month: 'short' });
              
              return (
                <button
                  key={date}
                  onClick={() => actions.selectDate(date)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all min-w-[80px] ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-surface border border-border text-muted hover:border-cyan-500'
                  }`}
                >
                  <div className="text-center">
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                      {isToday ? 'วันนี้' : dayName}
                    </p>
                    <p className="text-2xl font-bold">{dayNum}</p>
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted'}`}>{monthName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Time Slots Grid */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="text-xl">🕐</span>
              เลือกเวลา
            </h2>
            {state.scheduleLoading && (
              <span className="text-sm text-muted animate-pulse">กำลังโหลด...</span>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500/50" />
              <span className="text-sm text-muted">ว่าง</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
              <span className="text-sm text-muted">จองแล้ว</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500/30 border border-gray-500/50" />
              <span className="text-sm text-muted">ผ่านไปแล้ว</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-500/50" />
              <span className="text-sm text-muted">เลือกอยู่</span>
            </div>
          </div>

          {/* Time Slots */}
          {state.daySchedule ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {state.daySchedule.timeSlots.map((slot) => {
                const isSelected = state.selectedTimeSlot?.id === slot.id;
                
                let slotClass = '';
                if (isSelected) {
                  slotClass = 'bg-cyan-500/30 border-cyan-500 text-cyan-400 ring-2 ring-cyan-500';
                } else if (slot.status === 'available') {
                  slotClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500 cursor-pointer';
                } else if (slot.status === 'booked') {
                  slotClass = 'bg-red-500/10 border-red-500/30 text-red-400 cursor-not-allowed';
                } else {
                  slotClass = 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed';
                }

                return (
                  <button
                    key={slot.id}
                    onClick={() => slot.status === 'available' && actions.selectTimeSlot(slot)}
                    disabled={slot.status !== 'available'}
                    className={`py-2 px-1 rounded-lg border text-sm font-medium transition-all ${slotClass}`}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-muted">กรุณาเลือกเครื่องและวันที่</p>
            </div>
          )}

          {/* Summary */}
          {state.daySchedule && (
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                <span className="text-emerald-400 font-medium">{state.daySchedule.availableSlots}</span>
                <span className="text-muted ml-1">ช่วงว่าง</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <span className="text-red-400 font-medium">{state.daySchedule.bookedSlots}</span>
                <span className="text-muted ml-1">จองแล้ว</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Selected Time Slot Action */}
      {state.selectedTimeSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border p-4 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">
                🕐
              </div>
              <div>
                <p className="text-sm text-muted">เวลาที่เลือก</p>
                <p className="text-lg font-bold text-cyan-400">
                  {state.selectedTimeSlot.startTime} - {state.selectedTimeSlot.endTime}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AnimatedButton variant="ghost" onClick={actions.clearTimeSlot}>
                ยกเลิก
              </AnimatedButton>
              <GlowButton color="cyan" onClick={actions.openBookingModal}>
                📝 จองเวลานี้
              </GlowButton>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {state.isBookingModalOpen && state.selectedTimeSlot && (
        <Portal>
          <BookingModal
            selectedDate={viewModel.selectedDate}
            selectedTime={state.selectedTimeSlot}
            machineName={viewModel.machines.find(m => m.id === viewModel.selectedMachineId)?.name || ''}
            isSubmitting={state.isSubmitting}
            error={state.error}
            initialData={customerInfo}
            onSubmit={actions.submitBooking}
            onClose={actions.closeBookingModal}
          />
        </Portal>
      )}

      {/* Success Modal */}
      {state.bookingSuccess && (
        <Portal>
          <SuccessModal
            booking={state.bookingSuccess}
            machineName={viewModel.machines.find(m => m.id === viewModel.selectedMachineId)?.name || ''}
            onClose={actions.clearBookingSuccess}
          />
        </Portal>
      )}

      {/* Error Toast */}
      {state.error && viewModel && !state.isBookingModalOpen && (
        <div className="fixed bottom-4 right-4 bg-error text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{state.error}</span>
            <button onClick={() => actions.setError(null)} className="ml-4 hover:opacity-70">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ✨ Booking Modal Component
interface BookingModalProps {
  selectedDate: string;
  selectedTime: TimeSlot;
  machineName: string;
  isSubmitting: boolean;
  error: string | null;
  initialData: { name: string; phone: string };
  onSubmit: (data: { customerName: string; customerPhone: string; duration: number; notes?: string }) => Promise<void>;
  onClose: () => void;
}

function BookingModal({
  selectedDate,
  selectedTime,
  machineName,
  isSubmitting,
  error,
  initialData,
  onSubmit,
  onClose,
}: BookingModalProps) {
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone);
  const [duration, setDuration] = useState(DEFAULT_DURATION);

  useEffect(() => {
    setName(initialData.name);
    setPhone(initialData.phone);
  }, [initialData.name, initialData.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      customerName: name,
      customerPhone: phone,
      duration,
    });
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl">
                📅
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">จองคิวล่วงหน้า</h3>
                <p className="text-sm text-muted">{machineName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-muted"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Booking Info */}
        <div className="px-6 pt-4">
          <div className="bg-background border border-border rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">วันที่</p>
                <p className="font-medium text-foreground">{formatDate(selectedDate)}</p>
              </div>
              <div>
                <p className="text-muted">เวลา</p>
                <p className="font-medium text-cyan-400">{selectedTime.startTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">ชื่อผู้จอง</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-cyan-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-cyan-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Duration Select */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">ระยะเวลา</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d.time}
                  type="button"
                  onClick={() => setDuration(d.time)}
                  className={`py-3 px-2 rounded-xl font-medium transition-all relative ${
                    duration === d.time
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-surface border border-border text-muted hover:border-cyan-500'
                  }`}
                >
                  {d.popular && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                      แนะนำ
                    </span>
                  )}
                  <div className="text-sm font-bold">{d.label}</div>
                  <div className="text-xs opacity-70">{d.labelEn}</div>
                  <div className="text-xs mt-0.5">{d.priceDisplay}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <GlowButton
            color="purple"
            disabled={isSubmitting || !name || !phone}
            className="w-full"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          >
            {isSubmitting ? '🔄 กำลังจอง...' : '✅ ยืนยันการจอง'}
          </GlowButton>
        </form>
      </div>
    </div>
  );
}

// ✨ Success Modal Component
interface SuccessModalProps {
  booking: AdvanceBooking;
  machineName: string;
  onClose: () => void;
}

function SuccessModal({ booking, machineName, onClose }: SuccessModalProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(dateString));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-center animate-modal-in">
        {/* Success Animation */}
        <div className="p-8 bg-gradient-to-br from-emerald-500/20 to-green-500/10">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-5xl shadow-lg mb-4 animate-bounce">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">จองคิวสำเร็จ!</h2>
          <p className="text-muted">การจองล่วงหน้าถูกบันทึกเรียบร้อยแล้ว</p>
        </div>

        {/* Booking Details */}
        <div className="p-6">
          <div className="bg-background border border-border rounded-xl p-4 mb-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted">เครื่อง</p>
              <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent">
                {machineName}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">วันที่</p>
                <p className="font-medium text-foreground">{formatDate(booking.bookingDate)}</p>
              </div>
              <div>
                <p className="text-muted">เวลา</p>
                <p className="font-medium text-cyan-400">{booking.startTime} - {booking.endTime}</p>
              </div>
              <div>
                <p className="text-muted">ชื่อ</p>
                <p className="font-medium text-foreground">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-muted">ระยะเวลา</p>
                <p className="font-medium text-foreground">{booking.duration} นาที</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatedButton onClick={onClose} className="w-full">
              ปิด
            </AnimatedButton>
            <Link href="/customer" className="block">
              <AnimatedButton variant="ghost" className="w-full">
                กลับหน้าจองคิว
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
