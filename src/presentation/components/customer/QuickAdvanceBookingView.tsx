'use client';

import { AdvanceBooking, DaySchedule, TimeSlot } from '@/src/application/repositories/IAdvanceBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { DEFAULT_DURATION, DURATION_OPTIONS, OPERATING_HOURS } from '@/src/config/booking.config';
import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { animated } from '@react-spring/web';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * QuickAdvanceBookingView - Focus Mode Advance Booking
 * Simplified, fast booking experience for scheduled time slots
 */
export function QuickAdvanceBookingView() {
  const { customerInfo } = useCustomerStore();

  // Check if system is enabled
  if (!OPERATING_HOURS.isEnabled) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 flex items-center justify-center p-4">
        <div className="relative z-10 text-center max-w-md w-full">
          <div className="w-32 h-32 mx-auto rounded-full bg-white/10 flex items-center justify-center text-6xl mb-8">
            🚪
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">ขออภัย</h1>
          <p className="text-white/70 text-lg mb-8">
            ระบบจองล่วงหน้าปิดให้บริการชั่วคราว
            <br />
            กรุณาลองใหม่ในภายหลัง
          </p>
          <Link href="/">
            <GlowButton color="purple" size="lg" className="w-full">
              🏠 กลับหน้าแรก
            </GlowButton>
          </Link>
        </div>
      </div>
    );
  }

  // Repositories
  const { advanceBookingRepo, machineRepo } = useMemo(() => {
    const supabase = createClient();
    return {
      advanceBookingRepo: new SupabaseAdvanceBookingRepository(supabase),
      machineRepo: new SupabaseMachineRepository(supabase),
    };
  }, []);

  // Data state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [step, setStep] = useState<'machine' | 'datetime' | 'info' | 'confirm'>('machine');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [name, setName] = useState(customerInfo.name);
  const [phone, setPhone] = useState(customerInfo.phone);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AdvanceBooking | null>(null);

  // Get selected machine
  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  // Generate date options (today + 7 days)
  const dateOptions = useMemo(() => {
    const dates: { date: string; label: string; }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const label = i === 0 ? 'วันนี้' : new Intl.DateTimeFormat('th-TH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(date);
      dates.push({ date: dateStr, label });
    }
    return dates;
  }, []);

  // Load machines on mount
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const allMachines = await machineRepo.getAll();
        setMachines(allMachines.filter(m => m.isActive));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลเครื่องได้';
        setError(errorMessage);
        console.error('Error loading machines:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMachines();
  }, [machineRepo]);

  // Load schedule when machine/date changes
  const loadSchedule = useCallback(async () => {
    if (!selectedMachineId) return;
    
    try {
      const now = new Date().toISOString();
      const data = await advanceBookingRepo.getDaySchedule(selectedMachineId, selectedDate, now);
      setSchedule(data);
    } catch (err) {
      console.error('Error loading schedule:', err);
    }
  }, [selectedMachineId, selectedDate, advanceBookingRepo]);

  useEffect(() => {
    if (step === 'datetime' && selectedMachineId) {
      loadSchedule();
    }
  }, [step, loadSchedule, selectedMachineId]);

  // Handle machine selection
  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setStep('datetime');
  };

  // Handle slot selection
  const handleSelectSlot = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    setSelectedSlot(slot);
    setStep('info');
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedMachineId || !selectedSlot || !name.trim() || !phone.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await advanceBookingRepo.create({
        machineId: selectedMachineId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
        duration,
      });

      setSuccess(booking);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-pink-400/30 border-t-pink-400 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
          
          {/* Booking Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <p className="text-white/60 text-sm mb-2">การจองของคุณ</p>
            <p className="text-2xl font-bold text-emerald-300 mb-2">
              📅 {formatDateDisplay(success.bookingDate)}
            </p>
            <p className="text-4xl font-bold text-white">
              🕐 {success.startTime.slice(0, 5)} - {success.endTime.slice(0, 5)}
            </p>
            <p className="text-white/80 mt-4">{selectedMachine?.name}</p>
            <p className="text-white/60 text-sm">{success.duration} นาที</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/">
              <GlowButton color="green" size="lg" className="w-full">
                🏠 กลับหน้าแรก
              </GlowButton>
            </Link>
            <button 
              onClick={() => {
                setSuccess(null);
                setStep('machine');
                setSelectedMachineId(null);
                setSelectedSlot(null);
              }}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
            >
              📅 จองเพิ่มอีก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 overflow-auto">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
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
          <span>📅</span>
          จองล่วงหน้า
        </h1>

        <div className="w-20" /> {/* Spacer */}
      </header>

      {/* Progress Steps */}
      <div className="relative z-10 px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {['machine', 'datetime', 'info', 'confirm'].map((s, i) => {
              const stepIndex = ['machine', 'datetime', 'info', 'confirm'].indexOf(step);
              const isActive = s === step;
              const isCompleted = i < stepIndex;
              const labels = ['เลือกเครื่อง', 'เลือกเวลา', 'กรอกข้อมูล', 'ยืนยัน'];
              
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 sm:gap-2 ${isActive ? 'text-pink-400' : 'text-white/40'}`}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                      isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-pink-500 text-white' : 'bg-white/20'
                    }`}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <span className="text-xs sm:text-sm hidden sm:inline">{labels[i]}</span>
                  </div>
                  {i < 3 && <div className="w-4 sm:w-8 h-0.5 bg-white/20" />}
                </div>
              );
            })}
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

              {machines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔧</div>
                  <p className="text-white/60">ไม่พบเครื่องที่พร้อมใช้งาน</p>
                  <Link href="/" className="mt-4 inline-block">
                    <GlowButton color="pink">กลับหน้าแรก</GlowButton>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {machines.map((machine) => (
                    <button
                      key={machine.id}
                      onClick={() => handleSelectMachine(machine.id)}
                      className="w-full p-4 rounded-2xl border-2 bg-purple-500/20 border-purple-500/50 hover:border-pink-400 hover:bg-purple-500/30 text-left transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-2xl">
                          🎮
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg">{machine.name}</h3>
                          <p className="text-white/60 text-sm">เครื่องที่ {machine.position}</p>
                        </div>
                        <div className="text-white/40 text-2xl">→</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 'datetime' && selectedMachine && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                🕐 เลือกวันและเวลา
              </h2>
              <p className="text-white/60 text-center text-sm mb-6">
                {selectedMachine.name}
              </p>

              {/* Date Selection - Carousel */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-medium mb-3">📅 เลือกวัน</label>
                
                {/* Carousel Container */}
                <div className="relative">
                  {/* Left Arrow */}
                  <button
                    onClick={() => {
                      const currentIdx = dateOptions.findIndex(d => d.date === selectedDate);
                      if (currentIdx > 0) {
                        setSelectedDate(dateOptions[currentIdx - 1].date);
                      }
                    }}
                    disabled={dateOptions.findIndex(d => d.date === selectedDate) === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ←
                  </button>

                  {/* Carousel Items */}
                  <div className="flex justify-center items-center gap-3 px-14 py-2 overflow-hidden">
                    {dateOptions.map((d, index) => {
                      const currentIdx = dateOptions.findIndex(opt => opt.date === selectedDate);
                      const distance = Math.abs(index - currentIdx);
                      const isSelected = d.date === selectedDate;
                      
                      // Calculate scale and opacity based on distance from center
                      const scale = isSelected ? 1.15 : distance === 1 ? 0.9 : 0.75;
                      const opacity = isSelected ? 1 : distance === 1 ? 0.7 : 0.4;
                      const zIndex = isSelected ? 10 : 10 - distance;
                      
                      // Only show items within 2 positions of selected
                      if (distance > 2) return null;
                      
                      return (
                        <animated.button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          style={{
                            transform: `scale(${scale})`,
                            opacity,
                            zIndex,
                          }}
                          className={`flex-shrink-0 px-5 py-4 rounded-2xl font-bold transition-all duration-300 min-w-[90px] ${
                            isSelected
                              ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-500/40'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">
                              {index === 0 ? 'วันนี้' : new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(new Date(d.date))}
                            </div>
                            <div className="text-xl font-bold">
                              {new Date(d.date).getDate()}
                            </div>
                            <div className="text-xs opacity-70">
                              {new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(new Date(d.date))}
                            </div>
                          </div>
                        </animated.button>
                      );
                    })}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => {
                      const currentIdx = dateOptions.findIndex(d => d.date === selectedDate);
                      if (currentIdx < dateOptions.length - 1) {
                        setSelectedDate(dateOptions[currentIdx + 1].date);
                      }
                    }}
                    disabled={dateOptions.findIndex(d => d.date === selectedDate) === dateOptions.length - 1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    →
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mt-4">
                  {dateOptions.map((d, index) => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        d.date === selectedDate 
                          ? 'w-6 bg-pink-500' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">🕐 เลือกเวลา</label>
                {!schedule ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-3 border-pink-400/30 border-t-pink-400 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">กำลังโหลด...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {schedule.timeSlots.map((slot) => {
                      const isAvailable = slot.status === 'available';
                      const isBooked = slot.status === 'booked';
                      const isPassed = slot.status === 'passed';
                      const isSelected = selectedSlot?.id === slot.id;
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSelectSlot(slot)}
                          disabled={!isAvailable}
                          className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${
                            isSelected
                              ? 'bg-pink-500 text-white ring-2 ring-white'
                              : isAvailable
                              ? 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50'
                              : isBooked
                              ? 'bg-red-500/30 text-red-300 cursor-not-allowed'
                              : 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500/50" />
                    <span>ว่าง</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500/50" />
                    <span>จองแล้ว</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-500/50" />
                    <span>ผ่านไปแล้ว</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setStep('machine');
                    setSelectedSlot(null);
                  }}
                  className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  onClick={() => selectedSlot && setStep('info')}
                  disabled={!selectedSlot}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customer Info */}
          {step === 'info' && selectedMachine && selectedSlot && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                👤 กรอกข้อมูล
              </h2>
              <p className="text-white/60 text-center text-sm mb-6">
                {selectedMachine.name} • {selectedDate} • {selectedSlot.startTime}
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
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-pink-400 focus:outline-none text-lg"
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
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-pink-400 focus:outline-none text-lg"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">ระยะเวลา</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.time}
                        type="button"
                        onClick={() => setDuration(d.time)}
                        className={`py-4 px-3 rounded-xl font-bold transition-all relative ${
                          duration === d.time
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {d.popular && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                            แนะนำ
                          </span>
                        )}
                        <div className="text-lg">{d.label}</div>
                        <div className="text-xs opacity-70">{d.labelEn}</div>
                        <div className="text-sm mt-1">{d.priceDisplay}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('datetime')}
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
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && selectedMachine && selectedSlot && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                ✅ ยืนยันการจอง
              </h2>

              {/* Summary Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-white/20">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{selectedMachine.name}</h3>
                    <p className="text-white/60 text-sm">เครื่องที่ {selectedMachine.position}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">📅 วันที่</span>
                    <span className="text-white font-medium">{formatDateDisplay(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">🕐 เวลา</span>
                    <span className="text-pink-400 font-bold text-lg">{selectedSlot.startTime}</span>
                  </div>
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
                    <span className="text-pink-400 font-bold">{duration} นาที</span>
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
                  {isSubmitting ? '⏳ กำลังจอง...' : '📅 ยืนยันจอง'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/40 text-sm">
          📅 จองล่วงหน้า - เปิดให้บริการ {OPERATING_HOURS.isOpen24Hours ? '24 ชม.' : `${OPERATING_HOURS.open.toString().padStart(2, '0')}:00 - ${OPERATING_HOURS.close.toString().padStart(2, '0')}:00 น.`}
        </p>
      </footer>
    </div>
  );
}
