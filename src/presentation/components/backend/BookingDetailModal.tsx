'use client';

import { Booking } from '@/src/application/repositories/IBookingRepository';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';

interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
  onCheckIn?: () => void;
}

export function BookingDetailModal({ 
  booking, 
  onClose,
  onCheckIn
}: BookingDetailModalProps) {
  
  const statusColors = {
    pending: 'text-yellow-400',
    confirmed: 'text-emerald-400',
    seated: 'text-purple-400',
    completed: 'text-blue-400',
    cancelled: 'text-red-400'
  };

  const statusLabels = {
    pending: 'รอยืนยัน',
    confirmed: 'ยืนยันแล้ว',
    seated: 'เช็คอินแล้ว',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก'
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-foreground">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-slate-800 border border-white/20 theme-gloss rounded-2xl shadow-2xl overflow-hidden animate-modal-in flex flex-col">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl shadow-lg text-white">
                  📅
                </div>
              <div>
                <h3 className="font-bold text-lg text-white">รายละเอียดการจอง</h3>
                <p className="text-xs text-white/60">ID: {booking.id.slice(0, 8)}...</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors">✕</button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <span className={`px-4 py-1.5 rounded-full border bg-white/5 ${statusColors[booking.status] || 'text-white'} border-white/10 font-bold text-sm tracking-wide`}>
                {statusLabels[booking.status] || booking.status}
              </span>
            </div>

            {/* Customer Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
               <div className="flex justify-between items-start mb-2">
                  <div>
                     <p className="text-white/60 text-xs mb-1">ผู้จอง</p>
                     <p className="text-xl font-bold text-white">{booking.customerName}</p>
                     <p className="text-sm text-white/60">{booking.customerPhone}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-white/60 text-xs mb-1">เวลา</p>
                     <p className="text-xl font-bold text-purple-400 font-mono">
                       {booking.localStartTime.slice(0, 5)} - {booking.localEndTime.slice(0, 5)}
                     </p>
                     <p className="text-xs text-white/40 mt-1">
                       {booking.localDate}
                     </p>
                  </div>
               </div>
               {booking.notes && (
                 <div className="mt-3 pt-3 border-t border-white/10">
                   <p className="text-xs text-white/40 mb-1">หมายเหตุ</p>
                   <p className="text-sm text-white/80">{booking.notes}</p>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <p className="text-xs text-white/40 mb-1">ระยะเวลา</p>
                  <p className="text-lg font-bold text-white">{booking.durationMinutes} นาที</p>
               </div>
               <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <p className="text-xs text-white/40 mb-1">ข้ามวัน</p>
                  <p className="text-lg font-bold text-white">{booking.isCrossMidnight ? 'ใช่' : 'ไม่'}</p>
               </div>
            </div>
            
            {/* Actions */}
            <div className="pt-2 flex flex-col gap-3">
               {onCheckIn && booking.status === 'confirmed' && (
                 <GlowButton 
                   color="green" 
                   onClick={onCheckIn}
                   className="w-full py-3"
                 >
                   ✅ Check-in ลูกค้า
                 </GlowButton>
               )}
               
               <GlowButton 
                 color="purple" 
                 onClick={onClose}
                 className="w-full py-3"
               >
                 ปิด
               </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
