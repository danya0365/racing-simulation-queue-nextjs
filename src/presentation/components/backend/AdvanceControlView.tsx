'use client';

import { Booking, BookingDaySchedule } from '@/src/application/repositories/IBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { Session } from '@/src/application/repositories/ISessionRepository';
import { createBookingRepositories, createSessionRepository } from '@/src/infrastructure/repositories/RepositoryFactory';
import { getShopNow, getShopTodayString, SHOP_TIMEZONE } from '@/src/lib/date';
import { BookingDetailModal } from '@/src/presentation/components/backend/BookingDetailModal';
import { SessionStartModal } from '@/src/presentation/components/backend/SessionStartModal';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

dayjs.extend(duration);


const DEFAULT_TIMEZONE = SHOP_TIMEZONE;


/**
 * AdvanceControlView - Game Room Control for Advance Bookings
 * 
 * This control panel is designed for the advance booking system.
 * It shows real-time status based on scheduled time slots.
 * 
 * ✅ Now uses Session System (ISessionRepository) for real usage tracking
 * ✅ Uses IBookingRepository for reservation management
 * ✅ Strictly Separated States: Available | Reserved | Occupied
 * 
 * Route: /backend/advance-control
 */
export function AdvanceControlView() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allSchedules, setAllSchedules] = useState<Map<string, BookingDaySchedule>>(new Map());
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  
  // Modals state
  const [completeSessionId, setCompleteSessionId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [sessionStartTarget, setSessionStartTarget] = useState<{
    machine: Machine;
    booking: Booking;
  } | null>(null);

  // Get today's date in Shop timezone (YYYY-MM-DD)
  const today = useMemo(() => {
    return getShopTodayString();
  }, []);

  // ✅ Use factory for repositories
  const { bookingRepo, machineRepo } = useMemo(
    () => createBookingRepositories(),
    []
  );
  
  const sessionRepo = useMemo(() => createSessionRepository(), []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
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
      const schedulesMap = new Map<string, BookingDaySchedule>();
      const allMachineBookings: Booking[] = [];

      const referenceTime = getShopNow().toISOString();
      
      // Parallel Fetching: Schedules, Bookings, and Active Sessions
      const [sessions, ...results] = await Promise.all([
        sessionRepo.getActiveSessions(),
        ...activeMachines.map(async (machine) => {
          const [schedule, machineBookings] = await Promise.all([
            bookingRepo.getDaySchedule(machine.id, today, DEFAULT_TIMEZONE, referenceTime),
            bookingRepo.getByMachineAndDate(machine.id, today),
          ]);
          return { machineId: machine.id, schedule, machineBookings };
        })
      ]);

      // Process Results
      results.forEach(res => {
        schedulesMap.set(res.machineId, res.schedule);
        allMachineBookings.push(...res.machineBookings);
      });

      setActiveSessions(sessions);
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
  }, [machineRepo, bookingRepo, sessionRepo, today]);

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
    return currentTime.format('HH:mm');
  };

  // --- Strict Logic for Booking State ---

  /**
   * Get Active Session for a machine
   */
  const getActiveSession = (machineId: string): Session | undefined => {
    return activeSessions.find(s => s.stationId === machineId);
  };

  /**
   * Get the RESERVED booking (Waiting for Check-in)
   * Status 'confirmed' AND Machine is NOT Occupied
   */
  const getReservedBooking = (machineId: string): Booking | null => {
    const session = getActiveSession(machineId);
    if (session) return null; // If occupied, no one is "waiting" for immediate check-in on this machine (conceptually)

    const machineBookings = allBookings.filter(b => b.machineId === machineId && b.status === 'confirmed');
    // Sort by time
    return machineBookings.sort((a, b) => a.localStartTime.localeCompare(b.localStartTime))[0] || null;
  };

  /**
   * Get Upcoming bookings (Future)
   * Status 'confirmed' or 'pending', but later than Reserved one if exists.
   */
  const getUpcomingBookings = (machineId: string): Booking[] => {
    const machineBookings = allBookings.filter(b => 
      b.machineId === machineId && 
      (b.status === 'confirmed' || b.status === 'pending')
    );
    
    // We filter out the one that is currently linked to active session or reserved
    const activeSession = getActiveSession(machineId);
    const reservedBooking = getReservedBooking(machineId);
    
    const now = getCurrentTimeString();

    return machineBookings
      .filter(b => {
        if (activeSession && b.id === activeSession.bookingId) return false;
        if (reservedBooking && b.id === reservedBooking.id) return false;
        // Also ensure it's in the future (or strictly not the one we are focusing on)
        // Note: We use 'id' instead of 'transactionId' (Correction)
        return b.id !== (activeSession?.bookingId) && b.localStartTime > now; 
      })
      .sort((a, b) => a.localStartTime.localeCompare(b.localStartTime))
      .slice(0, 3);
  };

  // --- Actions ---

  // Handle Start Session (Check-in)
  // Triggered by Modal Confirmation
  const handleConfirmStartSession = async () => {
    if (!sessionStartTarget) return;
    const { booking, machine } = sessionStartTarget;

    setIsUpdating(true);
    try {
      // ✅ Use Session Repository - Creates session & updates booking status automatically
      await sessionRepo.startSession({
        stationId: machine.id,
        customerName: booking.customerName,
        bookingId: booking.id,
        notes: `Check-in from Advance Control (Booking ${booking.id})`
      });
      
      // Refresh
      await loadData();
    } catch (err) {
      setError('ไม่สามารถเริ่มใช้งานได้');
      console.error('Error starting session:', err);
    } finally {
      setIsUpdating(false);
      setSessionStartTarget(null);
    }
  };

  // Handle Complete Session (Finish)
  const handleCompleteSession = async () => {
    if (!completeSessionId) return;
    
    setIsUpdating(true);
    try {
      // ✅ Use Session Repository - Ends session & release machine
      await sessionRepo.endSession({
        sessionId: completeSessionId
      });

      await loadData();
    } catch (err) {
      setError('ไม่สามารถจบงานได้');
      console.error('Error completing session:', err);
    } finally {
      setIsUpdating(false);
      setCompleteSessionId(null);
    }
  };

  // Helper: Find booking object for a session
  const getBookingForSession = (session: Session): Booking | undefined => {
    if (!session.bookingId) return undefined;
    return allBookings.find(b => b.id === session.bookingId);
  };

  const formatTime = (timeString: string) => timeString.slice(0, 5);
  
  const getTimeRemaining = (endTime: string): string => {
    const now = currentTime;
    const [hours, minutes] = endTime.split(':').map(Number);
    const endDate = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
    
    const diffMs = endDate.diff(now);
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
       <div className="min-h-screen flex items-center justify-center text-white flex-col gap-4">
          <div className="text-6xl">⚠️</div>
          <p className="text-xl">{error}</p>
          <GlowButton color="purple" onClick={loadData}>Retry</GlowButton>
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
              ระบบจองเวลา • {dayjs().locale('th').format('ddddที่ D MMMM')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
            <p className="text-2xl font-bold text-white font-mono">
              {currentTime.format('HH:mm')}
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
            {machines.length - activeSessions.length}
          </div>
          <div className="text-sm text-white/60">เครื่องว่าง</div>
        </div>
        <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">
            {activeSessions.length}
          </div>
          <div className="text-sm text-white/60">กำลังใช้งาน</div>
        </div>
        <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {allBookings.length}
          </div>
          <div className="text-sm text-white/60">การจองทั้งหมดวันนี้</div>
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
          // Determine State
          const activeSession = getActiveSession(machine.id);
          const reservedBooking = getReservedBooking(machine.id);
          const activeBooking = activeSession ? getBookingForSession(activeSession) : null;
          
          // UI State Flags
          const isOccupied = !!activeSession;
          const isReserved = !!reservedBooking && !isOccupied;
          
          // Overdue Logic: Reserved but start time has passed
          const isOverdue = isReserved && reservedBooking && reservedBooking.localStartTime < getCurrentTimeString();
          
          const schedule = allSchedules.get(machine.id);

          return (
            <div
              key={machine.id}
              className={`relative backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 ${
                isOccupied
                  ? 'bg-orange-500/10 border-orange-500/40 shadow-lg shadow-orange-500/20'
                  : isOverdue
                  ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/20 animate-pulse-slow'
                  : isReserved
                  ? 'bg-yellow-500/10 border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                  : 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {/* Machine Header */}
              <div className={`px-5 py-4 border-b ${
                isOccupied ? 'border-orange-500/30' : 
                isOverdue ? 'border-red-500/30' :
                isReserved ? 'border-yellow-500/30' : 'border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg ${
                      isOccupied
                        ? 'bg-gradient-to-br from-orange-500 to-red-600'
                        : isOverdue
                        ? 'bg-gradient-to-br from-red-500 to-rose-600'
                        : isReserved
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
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
                  <div 
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-transform ${
                      isOccupied
                        ? 'bg-orange-500 text-white animate-pulse'
                        : isOverdue 
                        ? 'bg-red-500 text-white animate-bounce-slow'
                        : isReserved
                        ? 'bg-yellow-500 text-black'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {isOccupied ? '🏁 กำลังเล่น' : isOverdue ? '⚠️ เลยเวลา' : isReserved ? '📅 จองไว้' : '✅ ว่าง'}
                  </div>
                </div>
              </div>

              {/* Body Content based on State */}
              <div className="p-5 space-y-4">
                 
                 {/* STATE: OCCUPIED (Active Session) */}
                 {isOccupied && activeSession && (
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <p className="text-xs text-orange-400 font-medium mb-1">🏁 ผู้เล่นปัจจุบัน</p>
                             <p className="text-lg font-bold text-white">{activeSession.customerName}</p>
                             {activeBooking && (
                                <p className="text-sm text-white/50">Booking: {formatTime(activeBooking.localStartTime)}</p>
                             )}
                          </div>
                          <div className="text-right">
                             {activeBooking && (
                                <>
                                  <p className="text-2xl font-bold text-orange-400">
                                    {formatTime(activeBooking.localStartTime)} - {formatTime(activeBooking.localEndTime)}
                                  </p>
                                  <p className="text-sm text-white/60">{getTimeRemaining(activeBooking.localEndTime)}</p>
                                </>
                             )}
                          </div>
                       </div>
                       
                       {/* Real-time Timer Component */}
                       <div className="space-y-2">
                          <SessionTimer startTime={activeSession.startTime} />
                          
                          <GlowButton 
                            color="red" 
                            onClick={() => setCompleteSessionId(activeSession.id)}
                            disabled={isUpdating}
                            className="w-full shadow-lg shadow-red-500/20"
                          >
                            ✅ จบงาน / Off Machine
                          </GlowButton>
                       </div>
                    </div>
                 )}

                 {/* STATE: RESERVED (Waiting for Check-in) */}
                 {isReserved && reservedBooking && (
                    <div className={`${isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl p-4`}>
                       <div className="flex justify-between items-center mb-3">
                          <div>
                             <p className={`text-xs font-medium mb-1 ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                                {isOverdue ? '⚠️ เลยเวลาจอง (Overdue)' : '📅 จองไว้ (รอเช็คอิน)'}
                             </p>
                             <p className="text-lg font-bold text-white">{reservedBooking.customerName}</p>
                          </div>
                          <p className={`text-xl font-bold ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                             {formatTime(reservedBooking.localStartTime)}
                          </p>
                       </div>
                       
                       <GlowButton 
                          color={isOverdue ? "red" : "green"} 
                          className={`w-full text-lg py-3 shadow-lg ${isOverdue ? 'shadow-red-500/20' : 'shadow-green-500/20'}`}
                          onClick={() => setSessionStartTarget({ machine, booking: reservedBooking })}
                          disabled={isUpdating}
                       >
                          {isOverdue ? '⚠️ จองสาย (Check-in)' : '✅ Check-in / เริ่มเล่น'}
                       </GlowButton>
                    </div>
                 )}

                 {/* STATE: AVAILABLE */}
                 {!isOccupied && !isReserved && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                       <p className="text-4xl mb-2">✅</p>
                       <p className="text-lg font-bold text-emerald-400">ว่างพร้อมใช้งาน</p>
                    </div>
                 )}
                 
                 {/* Upcoming List */}
                 {getUpcomingBookings(machine.id).length > 0 && (
                     <div className="pt-2 border-t border-white/10 mt-2">
                        <p className="text-xs text-white/40 mb-2">คิวถัดไป</p>
                        {getUpcomingBookings(machine.id).map(b => (
                           <div key={b.id} className="flex justify-between items-center py-1 text-sm text-white/60">
                              <span>{b.customerName}</span>
                              <span>{formatTime(b.localStartTime)}</span>
                           </div>
                        ))}
                     </div>
                 )}

                 {/* Time Slots Bar */}
                 {schedule && (
                    <div className="pt-2">
                      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-white/5">
                        {schedule.timeSlots.map((slot) => {
                          let color = 'bg-transparent';
                          // Improve usage visualization
                          if (slot.status === 'booked') color = 'bg-red-500/40';
                          return (
                            <div
                              key={slot.id}
                              className={`flex-1 ${color}`}
                              title={`${slot.startTime} - ${slot.status}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                 )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!completeSessionId}
        title="เสร็จสิ้นการเล่น?"
        description="ยืนยันว่าลูกค้าเล่นเสร็จแล้ว และต้องการปิดเซสชัน?"
        confirmText="✅ ยืนยัน เสร็จสิ้น"
        cancelText="ยกเลิก"
        variant="info"
        onConfirm={handleCompleteSession}
        onClose={() => setCompleteSessionId(null)}
        isLoading={isUpdating}
      />

      {/* Start Session Modal (Check-in) */}
      {sessionStartTarget && (
        <Portal>
           <SessionStartModal 
              machine={sessionStartTarget.machine}
              target={{ type: 'booking', data: sessionStartTarget.booking }}
              onConfirm={handleConfirmStartSession}
              onCancel={() => setSessionStartTarget(null)}
              isProcessing={isUpdating}
           />
        </Portal>
      )}

      {/* Booking Detail Modal Support */}
      {selectedBookingId && (
        <BookingDetailModal
          booking={allBookings.find(b => b.id === selectedBookingId)!}
          logs={[]} 
          onClose={() => setSelectedBookingId(null)}
          onStart={async () => {
            // ✅ Connect to New Session Flow
            const booking = allBookings.find(b => b.id === selectedBookingId);
            if (booking) {
               const machine = machines.find(m => m.id === booking.machineId);
               if (machine) {
                  setSelectedBookingId(null);
                  setSessionStartTarget({ machine, booking });
               }
            }
          }}
          onStop={async () => {
             // ✅ Connect to End Session Flow
             const session = activeSessions.find(s => s.bookingId === selectedBookingId);
             if (session) {
                setSelectedBookingId(null);
                setCompleteSessionId(session.id);
             }
          }}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}

// Helper Component for Real-time Timer
function SessionTimer({ startTime }: { startTime: string }) {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = now.diff(dayjs(startTime));
  
  // Prevent negative display (if system time slightly off)
  if (diffMs < 0) return <span className="font-mono font-bold text-xl text-emerald-400">00:00</span>;

  const duration = dayjs.duration(diffMs);
  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();
  const secs = duration.seconds();

  return (
    <div className="bg-black/20 rounded-lg p-3 flex justify-between items-center px-4">
      <span className="text-sm text-white/60">⏱️ เวลาที่ใช้ไป</span>
      <span className="font-mono font-bold text-xl text-emerald-400 animate-pulse">
        {hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins}:${secs.toString().padStart(2, '0')}`}
      </span>
    </div>
  );
}
