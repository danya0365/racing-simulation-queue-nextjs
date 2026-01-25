'use client';

import { Booking } from '@/src/application/repositories/IBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';

interface SessionStartModalProps {
  machine: Machine;
  target: {
    type: 'booking' | 'queue';
    data: Booking | WalkInQueue;
  };
  conflictWarning?: string; // If trying to seat queue while booking exists
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function SessionStartModal({
  machine,
  target,
  conflictWarning,
  onConfirm,
  onCancel,
  isProcessing
}: SessionStartModalProps) {
  const isBooking = target.type === 'booking';
  const customerName = isBooking 
    ? (target.data as Booking).customerName 
    : (target.data as WalkInQueue).customerName;
  
  const duration = isBooking
    ? (target.data as Booking).durationMinutes
    : 0; // Queue might not have fixed duration yet, or we assume default

  // Calculate pricing (Mock logic for now, or from props if available)
  const estimatedPrice = duration > 0 ? (machine.hourlyRate || 0) * (duration / 60) : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`p-6 text-center ${isBooking ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg bg-surface">
            {isBooking ? '📅' : '🚶'}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {isBooking ? 'Check-in จองล่วงหน้า' : 'เริ่มเล่น (Walk-in)'}
          </h2>
          <p className="text-sm text-muted">
            {machine.name} (เครื่อง {machine.position})
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-3 text-left animate-pulse">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-red-500 text-sm">คำเตือน: มี Booking รออยู่</p>
                <p className="text-xs text-red-400">{conflictWarning}</p>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-surface/50 rounded-xl p-4 border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted">ลูกค้า</span>
              <span className="font-bold text-lg">{customerName}</span>
            </div>
            
            {isBooking && (
               <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted">เวลานัด</span>
                <span className="font-medium text-emerald-400">
                  {(target.data as Booking).localStartTime?.slice(0, 5)} - {(target.data as Booking).localEndTime?.slice(0, 5)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted">เวลาเล่น</span>
              <span className="font-medium">
                {duration > 0 ? `${duration} นาที` : 'จับเวลา (Open)'}
              </span>
            </div>

            {estimatedPrice > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                <span className="text-sm text-muted">ราคาประมาณ</span>
                <span className="font-bold text-emerald-400">฿{estimatedPrice.toFixed(0)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl bg-surface border border-border font-medium hover:bg-muted-light transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <AnimatedButton
              variant={isBooking ? 'success' : 'primary'}
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 text-center justify-center"
            >
               {isProcessing ? 'กำลังบันทึก...' : '✅ ยืนยันเริ่มเล่น'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
}
