'use client';

import { Session } from '@/src/application/repositories/ISessionRepository';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useEffect, useState } from 'react';

dayjs.extend(duration);

interface SessionDetailModalProps {
  session: Session;
  onClose: () => void;
}

export function SessionDetailModal({
  session,
  onClose,
}: SessionDetailModalProps) {
  return (
    <Portal>
      <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-lg p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white"
          >
            ✕
          </button>
          
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            📄 รายละเอียดรอบการเล่น
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-xs text-white/40 mb-1">ลูกค้า</p>
                <p className="text-lg font-bold text-white">{session.customerName}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-xs text-white/40 mb-1">เครื่อง</p>
                <p className="text-lg font-bold text-white">{session.stationName || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">เริ่มเวลา</span>
                <span className="text-white font-mono">{dayjs(session.startTime).format('HH:mm:ss')}</span>
              </div>
              {session.endTime ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/60">สิ้นสุดเวลา</span>
                    <span className="text-white font-mono">{dayjs(session.endTime).format('HH:mm:ss')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">ระยะเวลา</span>
                    <span className="text-white font-mono">{session.durationMinutes} นาที</span>
                  </div>
                </>
              ) : (
                <div className="mt-2 -mx-2">
                  <SessionTimer 
                    startTime={session.startTime} 
                    estimatedEndTime={session.estimatedEndTime}
                  />
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                <span className="text-white/60">ประเภท</span>
                <span className="text-emerald-400 capitalize">{session.sourceType || 'Manual'}</span>
              </div>
            </div>

            {session.notes && (
              <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                <p className="text-xs text-yellow-500 mb-1">หมายเหตุ</p>
                <p className="text-white/80 text-sm">{session.notes}</p>
              </div>
            )}
            
            {session.totalAmount !== undefined && (
              <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/30 flex justify-between items-center">
                <span className="text-emerald-300">ยอดรวม</span>
                <span className="text-2xl font-bold text-white">฿{session.totalAmount}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <GlowButton color="purple" className="w-full" onClick={onClose}>
              ปิด
            </GlowButton>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function SessionTimer({ 
  startTime, 
  estimatedEndTime,
  compact = false 
}: { 
  startTime: string; 
  estimatedEndTime?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = now.diff(dayjs(startTime));
  if (diffMs < 0) return null;

  const dur = dayjs.duration(diffMs);
  const hours = Math.floor(dur.asHours());
  const mins = dur.minutes();
  const secs = dur.seconds();

  const timeStr = hours > 0
    ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`;
  
  // Calculate remaining time
  let remainingStr = null;
  let isOvertime = false;
  
  if (estimatedEndTime) {
    const end = dayjs(estimatedEndTime);
    const remainingMs = end.diff(now);
    isOvertime = remainingMs < 0;
    
    const remainingDur = dayjs.duration(Math.abs(remainingMs));
    const rHours = Math.floor(remainingDur.asHours());
    const rMins = remainingDur.minutes();
    
    remainingStr = isOvertime 
      ? `+${rHours > 0 ? rHours + ':' : ''}${rMins}m`
      : `-${rHours > 0 ? rHours + ':' : ''}${rMins}m`;
  }

  // Compact View (for Lists)
  if (compact) {
    return (
      <div className="flex flex-col items-end">
        <span className="font-mono font-bold text-lg text-emerald-400 animate-pulse tabular-nums">
          {timeStr}
        </span>
        {remainingStr && (
           <span className={`text-[10px] font-bold ${isOvertime ? 'text-red-400' : 'text-blue-300'}`}>
             {remainingStr}
           </span>
        )}
      </div>
    );
  }

  // Full View (for Modal)
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-4 flex flex-col gap-2 shadow-inner">
      <div className="flex justify-between items-center gap-4">
        <span className="text-sm text-muted opacity-80">⏱️ เวลาที่เล่น</span>
        <span className="font-mono font-bold text-2xl text-emerald-400 animate-pulse tabular-nums tracking-wider text-shadow-sm">
          {timeStr}
        </span>
      </div>
      
      {remainingStr && (
        <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
           <span className="text-xs text-muted">เวลาที่เหลือ</span>
           <span className={`font-mono text-sm font-bold ${isOvertime ? 'text-red-400' : 'text-blue-300'}`}>
             {remainingStr}
           </span>
        </div>
      )}
    </div>
  );
}
