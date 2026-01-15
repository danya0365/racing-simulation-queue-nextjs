'use client';

import { Booking, BookingLog } from '@/src/application/repositories/IBookingRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

interface BookingDetailModalProps {
  booking: Booking;
  logs: BookingLog[];
  onClose: () => void;
  onStart: (bookingId: string) => Promise<void>;
  onStop: (bookingId: string) => Promise<void>;
  isLoading?: boolean;
}

export function BookingDetailModal({ 
  booking, 
  logs, 
  onClose,
  onStart,
  onStop,
  isLoading = false
}: BookingDetailModalProps) {
  const [elapsed, setElapsed] = useState<string>('00:00');
  const [showAllLogs, setShowAllLogs] = useState(false);
  
  // Calculate session status and duration
  const calculateSession = () => {
    const sortedLogs = [...logs].sort((a, b) => dayjs(a.recordedAt).unix() - dayjs(b.recordedAt).unix());
    let totalMs = 0;
    let lastStartTime: number | null = null;
    let isRunning = false;
    let lastStartLog = null;
    let lastStopLog = null;

    sortedLogs.forEach(log => {
      const time = dayjs(log.recordedAt).valueOf();
      if (log.action === 'START') {
        if (lastStartTime === null) {
          lastStartTime = time;
          isRunning = true;
          lastStartLog = log;
        }
      } else if (log.action === 'STOP') {
        if (lastStartTime !== null) {
          totalMs += (time - lastStartTime);
          lastStartTime = null;
          isRunning = false;
          lastStopLog = log;
        }
      }
    });

    return { totalMs, isRunning, lastStartTime, lastStartLog, lastStopLog };
  };

  const { totalMs: initialTotal, isRunning, lastStartTime } = calculateSession();

  useEffect(() => {
    if (!isRunning || lastStartTime === null) {
      // Just show static total
      const minutes = Math.floor(initialTotal / 60000);
      const seconds = Math.floor((initialTotal % 60000) / 1000);
      setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      return;
    }

    // Update timer
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      const currentSessionDuration = now - lastStartTime;
      const total = initialTotal + currentSessionDuration;
      
      const minutes = Math.floor(total / 60000);
      const seconds = Math.floor((total % 60000) / 1000);
      
      setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, lastStartTime, initialTotal]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-foreground">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden animate-modal-in flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl shadow-lg text-white">
                📅
              </div>
            <div>
              <h3 className="font-bold text-lg text-white">รายละเอียดการจอง</h3>
              <p className="text-xs text-white/60">Booking ID: {booking.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Customer Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
             <div className="flex justify-between items-start mb-2">
                <div>
                   <p className="text-white/60 text-xs mb-1">ผู้จอง</p>
                   <p className="text-xl font-bold text-white">{booking.customerName}</p>
                   <p className="text-sm text-white/60">{booking.customerPhone}</p>
                </div>
                <div className="text-right">
                   <p className="text-white/60 text-xs mb-1">เวลาจอง</p>
                   <p className="text-xl font-bold text-purple-400">
                     {booking.localStartTime.slice(0, 5)} - {booking.localEndTime.slice(0, 5)}
                   </p>
                   <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg mt-1">
                     {booking.durationMinutes} นาที
                   </span>
                </div>
             </div>
             {booking.notes && (
               <div className="mt-3 pt-3 border-t border-white/10">
                 <p className="text-xs text-white/40 mb-1">หมายเหตุ</p>
                 <p className="text-sm text-white/80">{booking.notes}</p>
               </div>
             )}
          </div>

          {/* Session Control */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              การจัดการเวลาเล่น
            </h4>

            {/* Timer Display */}
            <div className="bg-black/20 rounded-2xl p-6 text-center border border-white/5">
               <p className="text-white/40 text-sm mb-2">เวลาที่ใช้ไป</p>
               <div className={`text-5xl font-mono font-bold tracking-wider ${isRunning ? 'text-emerald-400' : 'text-white/30'}`}>
                 {elapsed}
               </div>
               {!isRunning && initialTotal > 0 && (
                 <p className="text-white/40 text-sm mt-2">หยุดพักเวลา (สามารถกดเริ่มต่อได้)</p>
               )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-4">
               {!isRunning ? (
                 <GlowButton 
                   color={initialTotal > 0 ? "orange" : "cyan"} 
                   onClick={() => onStart(booking.id)}
                   disabled={isLoading}
                   className="w-full py-4 text-lg"
                 >
                   {initialTotal > 0 ? '▶️ เริ่มจับเวลาต่อ (Resume)' : '▶️ เริ่มจับเวลา'}
                 </GlowButton>
               ) : (
                 <GlowButton 
                   color="red" 
                   onClick={() => onStop(booking.id)}
                   disabled={isLoading}
                   className="w-full py-4 text-lg"
                 >
                   ⏸️ หยุดจับเวลาชั่วคราว
                 </GlowButton>
               )}
            </div>
            
            {/* Logs History */}
            {logs.length > 0 && (
               <div className="mt-4 pt-4 border-t border-white/10">
                 <p className="text-xs text-white/40 mb-2">ประวัติการกด</p>
                  <div className="space-y-1">
                    {(() => {
                      const sortedLogs = [...logs].sort((a, b) => dayjs(b.recordedAt).unix() - dayjs(a.recordedAt).unix());
                      const displayedLogs = showAllLogs ? sortedLogs : sortedLogs.slice(0, 5);
                      
                      return (
                        <>
                          {displayedLogs.map((log, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-white/60 px-2 py-1 bg-white/5 rounded">
                              <span>{log.action === 'START' ? '▶️ เริ่ม' : '⏹️ จบ'}</span>
                              <span className="font-mono">
                                {dayjs(log.recordedAt).format('HH:mm:ss')}
                              </span>
                            </div>
                          ))}
                          
                          {sortedLogs.length > 5 && (
                            <button
                              onClick={() => setShowAllLogs(!showAllLogs)}
                              className="w-full text-center text-xs text-purple-400 hover:text-purple-300 py-1 transition-colors"
                            >
                              {showAllLogs ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${sortedLogs.length})`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
          <AnimatedButton variant="secondary" onClick={onClose} className="w-full">
            ปิด
          </AnimatedButton>
        </div>

      </div>
    </div>
  );
}
