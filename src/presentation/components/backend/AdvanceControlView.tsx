'use client';

import { AdvanceBooking, DaySchedule } from '@/src/application/repositories/IAdvanceBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { createAdvanceBookingRepositories } from '@/src/infrastructure/repositories/RepositoryFactory';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * AdvanceControlView - Game Room Control for Advance Bookings
 * 
 * This control panel is designed for the advance booking system.
 * It shows real-time status based on scheduled time slots.
 * 
 * Route: /backend/advance-control
 */
export function AdvanceControlView() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allSchedules, setAllSchedules] = useState<Map<string, DaySchedule>>(new Map());
  const [allBookings, setAllBookings] = useState<AdvanceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completeBookingId, setCompleteBookingId] = useState<string | null>(null);

  // Get today's date in local YYYY-MM-DD
  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // ✅ Use factory for repositories
  const { advanceBookingRepo, machineRepo } = useMemo(
    () => createAdvanceBookingRepositories(),
    []
  );

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsUpdating(true);
    try {
      const allMachines = await machineRepo.getAll();
      const activeMachines = allMachines.filter(m => m.isActive);
      setMachines(activeMachines);

      // Load schedules and bookings for all machines
      const schedulesMap = new Map<string, DaySchedule>();
      const allMachineBookings: AdvanceBooking[] = [];

      const nowStr = new Date().toISOString();
      await Promise.all(activeMachines.map(async (machine) => {
        const [schedule, machineBookings] = await Promise.all([
          advanceBookingRepo.getDaySchedule(machine.id, today, nowStr),
          advanceBookingRepo.getByMachineAndDate(machine.id, today),
        ]);
        schedulesMap.set(machine.id, schedule);
        allMachineBookings.push(...machineBookings);
      }));

      setAllSchedules(schedulesMap);
      setAllBookings(allMachineBookings);
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [machineRepo, advanceBookingRepo, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Get current time string for comparison (HH:MM format)
  const getCurrentTimeString = () => {
    return currentTime.toTimeString().slice(0, 5);
  };

  // Get current booking for a machine (based on time)
  const getCurrentBooking = (machineId: string): AdvanceBooking | null => {
    const machineBookings = allBookings.filter(b => 
      b.machineId === machineId && 
      (b.status === 'confirmed' || b.status === 'pending')
    );
    const now = getCurrentTimeString();
    
    return machineBookings.find(booking => {
      const start = booking.startTime.slice(0, 5);
      const end = booking.endTime.slice(0, 5);
      return now >= start && now < end;
    }) || null;
  };

  // Get next booking for a machine
  const getNextBooking = (machineId: string): AdvanceBooking | null => {
    const machineBookings = allBookings.filter(b => 
      b.machineId === machineId && 
      (b.status === 'confirmed' || b.status === 'pending')
    );
    const now = getCurrentTimeString();
    
    return machineBookings
      .filter(b => b.startTime.slice(0, 5) > now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;
  };

  // Get upcoming bookings for a machine
  const getUpcomingBookings = (machineId: string): AdvanceBooking[] => {
    const machineBookings = allBookings.filter(b => 
      b.machineId === machineId && 
      (b.status === 'confirmed' || b.status === 'pending')
    );
    const now = getCurrentTimeString();
    
    return machineBookings
      .filter(b => b.startTime.slice(0, 5) > now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 3);
  };

  // Mark booking as completed
  const handleCompleteBooking = async () => {
    if (!completeBookingId) return;
    
    setIsUpdating(true);
    try {
      // Update booking status to completed
      await advanceBookingRepo.update(completeBookingId, { status: 'completed' });
      await loadData();
    } catch (err) {
      setError('ไม่สามารถอัพเดทสถานะได้');
      console.error('Error completing booking:', err);
    } finally {
      setIsUpdating(false);
      setCompleteBookingId(null);
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Calculate time remaining for current booking
  const getTimeRemaining = (endTime: string): string => {
    const now = currentTime;
    const [hours, minutes] = endTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes, 0, 0);
    
    const diffMs = endDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'หมดเวลา';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `อีก ${diffMins} นาที`;
    return `อีก ${Math.floor(diffMins / 60)} ชม. ${diffMins % 60} นาที`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !machines.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <GlowButton color="purple" onClick={loadData}>
              ลองใหม่
            </GlowButton>
            <Link href="/backend">
              <GlowButton color="purple">
                กลับ Dashboard
              </GlowButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 overflow-auto p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/backend">
            <GlowButton color="purple" size="sm">
              ← กลับ
            </GlowButton>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              🎮 ควบคุมห้องเกม
            </h1>
            <p className="text-white/60 text-sm">
              ระบบจองเวลา • {new Date().toLocaleDateString('th-TH', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Time */}
          <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
            <p className="text-2xl font-bold text-white font-mono">
              {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <AnimatedButton 
            variant="secondary" 
            onClick={loadData} 
            disabled={isUpdating}
          >
            🔄 รีเฟรช
          </AnimatedButton>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">
            {machines.filter(m => !getCurrentBooking(m.id)).length}
          </div>
          <div className="text-sm text-white/60">เครื่องว่าง</div>
        </div>
        <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">
            {machines.filter(m => getCurrentBooking(m.id)).length}
          </div>
          <div className="text-sm text-white/60">กำลังใช้งาน</div>
        </div>
        <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {allBookings.length}
          </div>
          <div className="text-sm text-white/60">การจองทั้งหมดวันนี้</div>
          <div className="text-[10px] text-white/40 mt-1">
            (รอยืนยัน {allBookings.filter(b => b.status === 'pending').length} • ยืนยันแล้ว {allBookings.filter(b => b.status === 'confirmed').length} • สำเร็จ {allBookings.filter(b => b.status === 'completed').length})
          </div>
        </div>
        <div className="bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400">
            {Array.from(allSchedules.values()).reduce((sum, s) => sum + s.availableSlots, 0)}
          </div>
          <div className="text-sm text-white/60">Slots ว่าง</div>
        </div>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {machines.map((machine) => {
          const currentBooking = getCurrentBooking(machine.id);
          const nextBooking = getNextBooking(machine.id);
          const upcomingBookings = getUpcomingBookings(machine.id);
          const schedule = allSchedules.get(machine.id);
          const isOccupied = !!currentBooking;

          return (
            <div
              key={machine.id}
              className={`relative backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 ${
                isOccupied
                  ? 'bg-orange-500/10 border-orange-500/40 shadow-lg shadow-orange-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {/* Machine Header */}
              <div className={`px-5 py-4 border-b ${
                isOccupied ? 'border-orange-500/30' : 'border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg ${
                      isOccupied
                        ? 'bg-gradient-to-br from-orange-500 to-red-600'
                        : 'bg-gradient-to-br from-emerald-500 to-green-600'
                    }`}>
                      🎮
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{machine.name}</h3>
                      <p className="text-sm text-white/50">เครื่องที่ {machine.position}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    isOccupied
                      ? 'bg-orange-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {isOccupied ? '🏁 กำลังเล่น' : '✅ ว่าง'}
                  </div>
                </div>
              </div>

              {/* Current Booking */}
              {currentBooking ? (
                <div className="p-5 space-y-4">
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-orange-400 font-medium mb-1">🏁 กำลังเล่น</p>
                        <p className="text-lg font-bold text-white">{currentBooking.customerName}</p>
                        <p className="text-sm text-white/60">{currentBooking.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-400">
                          {formatTime(currentBooking.startTime)} - {formatTime(currentBooking.endTime)}
                        </p>
                        <p className="text-sm text-white/60">{getTimeRemaining(currentBooking.endTime)}</p>
                      </div>
                    </div>
                    
                    <GlowButton 
                      color="green" 
                      onClick={() => setCompleteBookingId(currentBooking.id)}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      ✅ เสร็จสิ้น (จบก่อนเวลา)
                    </GlowButton>
                  </div>

                  {/* Next Up */}
                  {nextBooking && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <p className="text-xs text-white/50 mb-2">⏳ ถัดไป</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{nextBooking.customerName}</p>
                          <p className="text-xs text-white/50">{nextBooking.customerPhone}</p>
                        </div>
                        <p className="text-sm font-bold text-purple-400">
                          {formatTime(nextBooking.startTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-lg font-bold text-emerald-400">พร้อมใช้งาน</p>
                    <p className="text-sm text-white/50">ไม่มีการจองตอนนี้</p>
                  </div>

                  {/* Upcoming Bookings */}
                  {upcomingBookings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/50 font-medium">📅 การจองถัดไป</p>
                      {upcomingBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-white text-sm">{booking.customerName}</p>
                            <p className="text-xs text-white/50">{booking.duration} นาที</p>
                          </div>
                          <p className="text-sm font-bold text-purple-400">
                            {formatTime(booking.startTime)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Time Slots Bar */}
              {schedule && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-white/40 mb-2">ตารางวันนี้</p>
                  <div className="flex gap-0.5">
                    {schedule.timeSlots.map((slot) => {
                      let color = 'bg-gray-500/30';
                      if (slot.status === 'available') color = 'bg-emerald-500/50';
                      else if (slot.status === 'booked') color = 'bg-red-500/50';
                      
                      return (
                        <div
                          key={slot.id}
                          className={`h-2 flex-1 rounded-sm ${color}`}
                          title={`${slot.startTime} - ${slot.status}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!completeBookingId}
        title="เสร็จสิ้นการเล่น?"
        description="ยืนยันว่าลูกค้าเล่นเสร็จแล้ว และต้องการปิดรอบนี้?"
        confirmText="✅ ยืนยัน เสร็จสิ้น"
        cancelText="ยกเลิก"
        variant="info"
        onConfirm={handleCompleteBooking}
        onClose={() => setCompleteBookingId(null)}
        isLoading={isUpdating}
      />
    </div>
  );
}
