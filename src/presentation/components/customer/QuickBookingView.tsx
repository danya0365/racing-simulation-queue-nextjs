'use client';

import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useCustomerPresenter } from '@/src/presentation/presenters/customer/useCustomerPresenter';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * QuickBookingView - Focus Mode Booking
 * Simplified, fast booking experience - minimal UI for quick queue booking
 */
export function QuickBookingView() {
  const router = useRouter();
  const [state, actions] = useCustomerPresenter();
  const { customerInfo, setCustomerInfo } = useCustomerStore();
  const viewModel = state.viewModel;

  // Form state
  const [step, setStep] = useState<'machine' | 'info' | 'confirm'>('machine');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [name, setName] = useState(customerInfo.name);
  const [phone, setPhone] = useState(customerInfo.phone);
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get available machines
  const availableMachines = viewModel?.machines.filter(m => m.isActive && m.status !== 'maintenance') || [];
  const selectedMachine = availableMachines.find(m => m.id === selectedMachineId);

  // Handle machine selection
  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setStep('info');
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedMachineId || !name.trim() || !phone.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save customer info for future bookings
      setCustomerInfo({ name: name.trim(), phone: phone.trim() });

      // Submit booking
      await actions.submitBooking({
        machineId: selectedMachineId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        bookingTime: new Date().toISOString(),
        duration,
      });

      setSuccess(true);
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (state.loading && !viewModel) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success && state.bookingSuccess) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-ping" />
        </div>

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Success Icon */}
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-6xl shadow-2xl mb-8 animate-bounce">
            ✅
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">จองสำเร็จ!</h1>
          
          {/* Queue Number */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <p className="text-white/60 text-sm mb-2">หมายเลขคิวของคุณ</p>
            <p className="text-5xl font-bold text-emerald-300">
              #{state.bookingSuccess.position}
            </p>
            <p className="text-white/80 mt-4">{selectedMachine?.name}</p>
            <p className="text-white/60 text-sm">{duration} นาที</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href={`/customer/queue/${state.bookingSuccess.id}`}>
              <GlowButton color="green" size="lg" className="w-full">
                📊 ดูสถานะคิว
              </GlowButton>
            </Link>
            <Link href="/">
              <button className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all">
                กลับหน้าแรก
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 overflow-auto">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all"
        >
          <span>←</span>
          <span className="hidden sm:inline">ออก</span>
        </Link>

        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>⚡</span>
          จองด่วน
        </h1>

        <div className="w-20" /> {/* Spacer */}
      </header>

      {/* Progress Steps */}
      <div className="relative z-10 px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'machine' ? 'text-cyan-400' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'machine' ? 'bg-cyan-500 text-white' : step === 'info' || step === 'confirm' ? 'bg-emerald-500 text-white' : 'bg-white/20'}`}>
                {step === 'info' || step === 'confirm' ? '✓' : '1'}
              </div>
              <span className="text-sm hidden sm:inline">เลือกเครื่อง</span>
            </div>
            <div className="w-8 h-0.5 bg-white/20" />
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-cyan-400' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'info' ? 'bg-cyan-500 text-white' : step === 'confirm' ? 'bg-emerald-500 text-white' : 'bg-white/20'}`}>
                {step === 'confirm' ? '✓' : '2'}
              </div>
              <span className="text-sm hidden sm:inline">กรอกข้อมูล</span>
            </div>
            <div className="w-8 h-0.5 bg-white/20" />
            <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-cyan-400' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'confirm' ? 'bg-cyan-500 text-white' : 'bg-white/20'}`}>
                3
              </div>
              <span className="text-sm hidden sm:inline">ยืนยัน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          
          {/* Step 1: Machine Selection */}
          {step === 'machine' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                🎮 เลือกเครื่องเล่น
              </h2>

              {availableMachines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔧</div>
                  <p className="text-white/60">ขณะนี้ไม่มีเครื่องว่าง</p>
                  <Link href="/" className="mt-4 inline-block">
                    <GlowButton color="cyan">กลับหน้าแรก</GlowButton>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableMachines.map((machine) => {
                    const isAvailable = machine.status === 'available';
                    const queueInfo = viewModel?.machineQueueInfo[machine.id];
                    
                    return (
                      <button
                        key={machine.id}
                        onClick={() => handleSelectMachine(machine.id)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                          isAvailable
                            ? 'bg-emerald-500/20 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-orange-500/20 border-orange-500/50 hover:border-orange-400 hover:bg-orange-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                            isAvailable
                              ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                              : 'bg-gradient-to-br from-orange-400 to-amber-600'
                          }`}>
                            🎮
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">{machine.name}</h3>
                            <p className="text-white/60 text-sm">
                              {isAvailable ? '✅ ว่างพร้อมเล่น' : `⏳ มี ${queueInfo?.waitingCount || 0} คิวรอ`}
                            </p>
                          </div>
                          <div className="text-white/40 text-2xl">→</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customer Info */}
          {step === 'info' && selectedMachine && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                👤 กรอกข้อมูล
              </h2>
              <p className="text-white/60 text-center text-sm mb-6">
                {selectedMachine.name}
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">ชื่อ</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none text-lg"
                    autoFocus
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">เบอร์โทร</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none text-lg"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">ระยะเวลา</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`py-4 rounded-xl font-bold text-lg transition-all ${
                          duration === d
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {d} นาที
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('machine')}
                  className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  onClick={() => {
                    if (name.trim() && phone.trim()) {
                      setStep('confirm');
                    } else {
                      setError('กรุณากรอกข้อมูลให้ครบ');
                    }
                  }}
                  disabled={!name.trim() || !phone.trim()}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && selectedMachine && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                ✅ ยืนยันการจอง
              </h2>

              {/* Summary Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-white/20">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{selectedMachine.name}</h3>
                    <p className="text-white/60 text-sm">เครื่องที่ {selectedMachine.position}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">👤 ชื่อ</span>
                    <span className="text-white font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">📱 เบอร์โทร</span>
                    <span className="text-white font-medium">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">⏱️ ระยะเวลา</span>
                    <span className="text-cyan-400 font-bold">{duration} นาที</span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('info')}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                >
                  ← แก้ไข
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? '⏳ กำลังจอง...' : '⚡ ยืนยัน'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/40 text-sm">
          ⚡ จองด่วน - ง่าย รวดเร็ว ทันใจ
        </p>
      </footer>
    </div>
  );
}
