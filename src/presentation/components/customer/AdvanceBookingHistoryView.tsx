'use client';

import { AdvanceBooking, DaySchedule } from '@/src/application/repositories/IAdvanceBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { animated } from '@react-spring/web';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * AdvanceBookingHistoryView - Detailed booking schedule view
 * Shows schedule for a specific date with machine filter and time slots grid
 */
export function AdvanceBookingHistoryView() {
  // Data state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [allSchedules, setAllSchedules] = useState<Map<string, DaySchedule>>(new Map());
  const [bookings, setBookings] = useState<AdvanceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter state
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Repositories
  const { advanceBookingRepo, machineRepo } = useMemo(() => {
    const supabase = createClient();
    return {
      advanceBookingRepo: new SupabaseAdvanceBookingRepository(supabase),
      machineRepo: new SupabaseMachineRepository(supabase),
    };
  }, []);

  // Generate date options (7 days before + today + 7 days ahead)
  const dateOptions = useMemo(() => {
    const dates: { date: string; label: string; dayOfWeek: string; dayNum: number; month: string; }[] = [];
    const today = new Date();
    
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dYear = date.getFullYear();
      const dMonth = String(date.getMonth() + 1).padStart(2, '0');
      const dDay = String(date.getDate()).padStart(2, '0');
      const dateStr = `${dYear}-${dMonth}-${dDay}`;
      
      let label = '';
      if (i === 0) label = 'วันนี้';
      else if (i === -1) label = 'เมื่อวาน';
      else if (i === 1) label = 'พรุ่งนี้';
      else label = new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(date);
      
      dates.push({
        date: dateStr,
        label,
        dayOfWeek: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(date),
        dayNum: date.getDate(),
        month: new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(date),
      });
    }
    return dates;
  }, []);

  // Load machines on mount
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const allMachines = await machineRepo.getAll();
        setMachines(allMachines.filter(m => m.isActive));
      } catch (err) {
        console.error('Error loading machines:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMachines();
  }, [machineRepo]);

  // Load schedule when machine/date changes
  const loadSchedule = useCallback(async () => {
    if (machines.length === 0) return;
    
    setIsUpdating(true);
    try {
      if (selectedMachineId === 'all') {
        // Load for ALL machines
        const allMachineBookings: AdvanceBooking[] = [];
        const schedulesMap = new Map<string, DaySchedule>();
        
        const now = new Date().toISOString();
        await Promise.all(machines.map(async (machine) => {
          const [machineSchedule, machineBookings] = await Promise.all([
            advanceBookingRepo.getDaySchedule(machine.id, selectedDate, now),
            advanceBookingRepo.getByMachineAndDate(machine.id, selectedDate),
          ]);
          schedulesMap.set(machine.id, machineSchedule);
          allMachineBookings.push(...machineBookings);
        }));
        
        setAllSchedules(schedulesMap);
        setBookings(allMachineBookings);
        setSchedule(null);
      } else {
        // Load for specific machine
        const now = new Date().toISOString();
        const [machineSchedule, machineBookings] = await Promise.all([
          advanceBookingRepo.getDaySchedule(selectedMachineId, selectedDate, now),
          advanceBookingRepo.getByMachineAndDate(selectedMachineId, selectedDate),
        ]);
        setSchedule(machineSchedule);
        setBookings(machineBookings);
        setAllSchedules(new Map());
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedMachineId, selectedDate, machines, advanceBookingRepo]);

  useEffect(() => {
    if (machines.length > 0) {
      loadSchedule();
    }
  }, [loadSchedule, machines.length]);

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  // Get status styling
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'ยืนยันแล้ว', color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: '✅' };
      case 'pending':
        return { label: 'รอยืนยัน', color: 'bg-amber-500', textColor: 'text-amber-400', icon: '⏳' };
      case 'completed':
        return { label: 'เสร็จสิ้น', color: 'bg-blue-500', textColor: 'text-blue-400', icon: '✔️' };
      case 'cancelled':
        return { label: 'ยกเลิก', color: 'bg-red-500', textColor: 'text-red-400', icon: '❌' };
      default:
        return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400', icon: '❓' };
    }
  };

  // Calculate stats
  const totalAvailable = selectedMachineId === 'all'
    ? Array.from(allSchedules.values()).reduce((sum, s) => sum + s.availableSlots, 0)
    : schedule?.availableSlots || 0;
  
  const totalBooked = selectedMachineId === 'all'
    ? Array.from(allSchedules.values()).reduce((sum, s) => sum + s.bookedSlots, 0)
    : schedule?.bookedSlots || 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">📋 ตารางการจอง</h1>
          <p className="text-muted">ดูตารางและประวัติการจองทั้งหมด</p>
        </div>

        {/* Date Carousel */}
        <AnimatedCard className="p-6 mb-6">
          <label className="block text-sm font-medium text-muted mb-4">📅 เลือกวันที่</label>
          
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
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-surface border border-border hover:bg-muted-light rounded-full text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ←
            </button>

            {/* Carousel Items */}
            <div className="flex justify-center items-center gap-2 sm:gap-3 px-14 py-2 overflow-hidden">
              {dateOptions.map((d, index) => {
                const currentIdx = dateOptions.findIndex(opt => opt.date === selectedDate);
                const distance = Math.abs(index - currentIdx);
                const isSelected = d.date === selectedDate;
                const isToday = d.date === (() => {
                  const dNow = new Date();
                  return `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}-${String(dNow.getDate()).padStart(2, '0')}`;
                })();
                
                // Calculate scale and opacity
                const scale = isSelected ? 1.1 : distance === 1 ? 0.85 : 0.7;
                const opacity = isSelected ? 1 : distance === 1 ? 0.7 : 0.4;
                
                if (distance > 2) return null;
                
                return (
                  <animated.button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    style={{
                      transform: `scale(${scale})`,
                      opacity,
                    }}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl font-bold transition-all duration-300 min-w-[80px] ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/40'
                        : 'bg-surface border border-border text-foreground hover:border-purple-500'
                    } ${isToday && !isSelected ? 'ring-2 ring-purple-500/50' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {d.label}
                      </div>
                      <div className="text-xl font-bold">
                        {d.dayNum}
                      </div>
                      <div className="text-xs opacity-60">
                        {d.month}
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
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-surface border border-border hover:bg-muted-light rounded-full text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              →
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1 mt-4">
            {dateOptions.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  d.date === selectedDate 
                    ? 'w-4 bg-purple-500' 
                    : 'bg-muted hover:bg-purple-500/50'
                }`}
              />
            ))}
          </div>

          {/* Selected Date Display */}
          <p className="text-center text-foreground font-medium mt-4">
            {formatDateDisplay(selectedDate)}
          </p>
        </AnimatedCard>

        {/* Machine Filter */}
        <AnimatedCard className="p-6 mb-6">
          <label className="block text-sm font-medium text-muted mb-3">🎮 เลือกเครื่อง</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMachineId('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                selectedMachineId === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-surface border border-border text-foreground hover:border-purple-500'
              }`}
            >
              📋 ทุกเครื่อง
            </button>
            {machines.map((machine) => (
              <button
                key={machine.id}
                onClick={() => setSelectedMachineId(machine.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedMachineId === machine.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-surface border border-border text-foreground hover:border-purple-500'
                }`}
              >
                🎮 {machine.name}
              </button>
            ))}
          </div>
        </AnimatedCard>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{totalAvailable}</div>
            <div className="text-sm text-muted">สล็อตว่าง</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{totalBooked}</div>
            <div className="text-sm text-muted">สล็อตจองแล้ว</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{bookings.length}</div>
            <div className="text-sm text-muted">รายการจอง</div>
          </div>
        </div>

        {/* Loading */}
        {(loading || isUpdating) && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted">กำลังโหลด...</p>
          </div>
        )}

        {/* Time Slots Grid - Single Machine */}
        {!loading && !isUpdating && schedule && selectedMachineId !== 'all' && (
          <AnimatedCard className="p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">🕐 ตารางเวลา</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {schedule.timeSlots.map((slot) => {
                let slotClass = '';
                if (slot.status === 'available') {
                  slotClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
                } else if (slot.status === 'booked') {
                  slotClass = 'bg-red-500/20 border-red-500/30 text-red-400';
                } else {
                  slotClass = 'bg-gray-500/20 border-gray-500/30 text-gray-500';
                }
                
                return (
                  <div
                    key={slot.id}
                    className={`py-2 px-1 rounded-lg border text-sm font-medium text-center ${slotClass}`}
                    title={`${slot.startTime} - ${slot.endTime} (${slot.status})`}
                  >
                    {slot.startTime.slice(0, 5)}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500/50" />
                <span className="text-muted">ว่าง</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
                <span className="text-muted">จองแล้ว</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500/30 border border-gray-500/50" />
                <span className="text-muted">ผ่านไปแล้ว</span>
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Time Slots Grid - All Machines */}
        {!loading && !isUpdating && selectedMachineId === 'all' && allSchedules.size > 0 && (
          <AnimatedCard className="p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">🕐 ตารางเวลาทุกเครื่อง</h3>
            <div className="space-y-4">
              {machines.map((machine) => {
                const machineSchedule = allSchedules.get(machine.id);
                if (!machineSchedule) return null;
                
                return (
                  <div key={machine.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎮</span>
                        <span className="font-bold text-foreground">{machine.name}</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                          ว่าง {machineSchedule.availableSlots}
                        </span>
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                          จอง {machineSchedule.bookedSlots}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 sm:grid-cols-16 md:grid-cols-24 gap-1">
                      {machineSchedule.timeSlots.map((slot) => {
                        let slotColor = 'bg-gray-500/30';
                        if (slot.status === 'available') slotColor = 'bg-emerald-500/50';
                        else if (slot.status === 'booked') slotColor = 'bg-red-500/50';
                        
                        return (
                          <div
                            key={slot.id}
                            className={`h-5 rounded ${slotColor}`}
                            title={`${slot.startTime} - ${slot.status}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/50" />
                <span className="text-muted">ว่าง</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/50" />
                <span className="text-muted">จองแล้ว</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500/30" />
                <span className="text-muted">ผ่านไปแล้ว</span>
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Bookings List */}
        <AnimatedCard className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">📋 รายการจอง ({bookings.length})</h3>
          
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-muted">ไม่มีการจองในวันนี้</p>
              <Link href="/quick-advance-booking" className="mt-4 inline-block">
                <GlowButton color="purple">📅 จองเลย</GlowButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((booking) => {
                  const statusConfig = getStatusConfig(booking.status);
                  const machine = machines.find(m => m.id === booking.machineId);
                  
                  return (
                    <div
                      key={booking.id}
                      className="p-4 bg-surface border border-border rounded-xl hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl text-white shadow-lg">
                            🎮
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}
                              {selectedMachineId === 'all' && machine && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                  {machine.name}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted">
                              {booking.customerName} • {booking.customerPhone}
                            </p>
                            <p className="text-xs text-muted">
                              ระยะเวลา: {booking.duration} นาที
                            </p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </AnimatedCard>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Link href="/quick-advance-booking">
            <GlowButton color="purple" size="lg">
              📅 จองคิวใหม่
            </GlowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
