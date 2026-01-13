'use client';

import { AdvanceBooking, DaySchedule, UpdateAdvanceBookingData } from '@/src/application/repositories/IAdvanceBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { createAdvanceBookingRepositories } from '@/src/infrastructure/repositories/RepositoryFactory';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Portal } from '../ui/Portal';

export function AdvanceBookingsTab() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all'); // Default to 'all'
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<AdvanceBooking[]>([]);
  const [allBookings, setAllBookings] = useState<AdvanceBooking[]>([]); // All machines bookings
  const [allSchedules, setAllSchedules] = useState<Map<string, DaySchedule>>(new Map()); // Schedules per machine
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null); // For confirmation modal
  const [editingBooking, setEditingBooking] = useState<AdvanceBooking | null>(null);

  // ✅ Use factory for repositories
  const { advanceBookingRepo, machineRepo } = useMemo(
    () => createAdvanceBookingRepositories(),
    []
  );

  // Generate date options (today + 7 days)
  const dateOptions = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  }, []);

  // Load machines on mount
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const allMachines = await machineRepo.getAll();
        const activeMachines = allMachines.filter(m => m.isActive);
        setMachines(activeMachines);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลเครื่องได้');
        console.error('Error loading machines:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMachines();
  }, [machineRepo]);

  // Load bookings when machine or date changes
  const loadSchedule = useCallback(async () => {
    setIsUpdating(true);
    try {
      if (selectedMachineId === 'all') {
        // Load bookings and schedules from ALL machines
        const allMachineBookings: AdvanceBooking[] = [];
        const schedulesMap = new Map<string, DaySchedule>();
        
        const now = new Date().toISOString();
        await Promise.all(machines.map(async (machine) => {
          const [schedule, machineBookings] = await Promise.all([
            advanceBookingRepo.getDaySchedule(machine.id, selectedDate, now),
            advanceBookingRepo.getByMachineAndDate(machine.id, selectedDate),
          ]);
          schedulesMap.set(machine.id, schedule);
          allMachineBookings.push(...machineBookings);
        }));
        
        setAllSchedules(schedulesMap);
        setAllBookings(allMachineBookings);
        setBookings(allMachineBookings);
        setDaySchedule(null); // No single schedule for 'all'
      } else {
        // Load for specific machine
        const now = new Date().toISOString();
        const [schedule, machineBookings] = await Promise.all([
          advanceBookingRepo.getDaySchedule(selectedMachineId, selectedDate, now),
          advanceBookingRepo.getByMachineAndDate(selectedMachineId, selectedDate),
        ]);
        setDaySchedule(schedule);
        setBookings(machineBookings);
        setAllSchedules(new Map());
      }
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดตารางการจองได้');
      console.error('Error loading schedule:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedMachineId, selectedDate, advanceBookingRepo, machines]);

  useEffect(() => {
    if (machines.length > 0) {
      loadSchedule();
    }
  }, [loadSchedule, machines.length]);

  // Handle update booking
  const handleUpdateBooking = async (id: string, data: UpdateAdvanceBookingData) => {
    setIsUpdating(true);
    try {
      await advanceBookingRepo.update(id, data);
      await loadSchedule();
      setEditingBooking(null);
      setError(null);
    } catch (err) {
      setError('ไม่สามารถอัปเดตข้อมูลการจองได้');
      console.error('Error updating booking:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel booking - triggered by confirmation modal
  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    
    setIsUpdating(true);
    try {
      const success = await advanceBookingRepo.cancel(cancelBookingId);
      if (success) {
        await loadSchedule();
      } else {
        setError('ไม่สามารถยกเลิกการจองได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการยกเลิก');
      console.error('Error cancelling booking:', err);
    } finally {
      setIsUpdating(false);
      setCancelBookingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500 text-white';
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอยืนยัน';
      case 'cancelled':
        return 'ยกเลิก';
      case 'completed':
        return 'เสร็จสิ้น';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
            📅
          </div>
          <p className="text-muted">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">📅 จัดการการจองล่วงหน้า</h2>
          <p className="text-sm text-muted">ดูและจัดการการจองตามวันเวลา</p>
        </div>
        <AnimatedButton variant="secondary" onClick={loadSchedule} disabled={isUpdating}>
          🔄 รีเฟรช
        </AnimatedButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Machine Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-muted mb-2">เครื่อง</label>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          >
            <option value="all">📋 ทุกเครื่อง</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                🎮 {machine.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-muted mb-2">วันที่</label>
          <div className="flex flex-wrap gap-2">
            {dateOptions.map((date, index) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDate === date
                    ? 'bg-purple-500 text-white'
                    : 'bg-surface border border-border text-muted hover:border-purple-500'
                }`}
              >
                {index === 0 ? 'วันนี้' : formatDate(date)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {selectedMachineId === 'all' 
              ? Array.from(allSchedules.values()).reduce((sum, s) => sum + s.availableSlots, 0)
              : daySchedule?.availableSlots || 0}
          </div>
          <div className="text-sm text-muted">สล็อตว่าง {selectedMachineId === 'all' ? '(รวม)' : ''}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {selectedMachineId === 'all'
              ? Array.from(allSchedules.values()).reduce((sum, s) => sum + s.bookedSlots, 0)
              : daySchedule?.bookedSlots || 0}
          </div>
          <div className="text-sm text-muted">สล็อตจองแล้ว {selectedMachineId === 'all' ? '(รวม)' : ''}</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{bookings.length}</div>
          <div className="text-sm text-muted">คนจองวันนี้</div>
        </div>
      </div>

      {/* Time Slots Visual - Single Machine */}
      {daySchedule && (
        <AnimatedCard className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">🕐 ตารางเวลา</h3>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {daySchedule.timeSlots.map((slot) => {
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
                  {slot.startTime}
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

      {/* Time Slots Visual - ALL Machines Grid */}
      {selectedMachineId === 'all' && allSchedules.size > 0 && (
        <AnimatedCard className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">🕐 ตารางเวลาทุกเครื่อง</h3>
          
          {/* Machines Grid */}
          <div className="space-y-4">
            {machines.map((machine) => {
              const schedule = allSchedules.get(machine.id);
              if (!schedule) return null;
              
              return (
                <div key={machine.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎮</span>
                      <span className="font-bold text-foreground">{machine.name}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                        ว่าง {schedule.availableSlots}
                      </span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                        จอง {schedule.bookedSlots}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-1">
                    {schedule.timeSlots.map((slot) => {
                      let slotColor = 'bg-gray-500/30';
                      if (slot.status === 'available') {
                        slotColor = 'bg-emerald-500/50';
                      } else if (slot.status === 'booked') {
                        slotColor = 'bg-red-500/50';
                      }
                      
                      return (
                        <div
                          key={slot.id}
                          className={`h-6 rounded ${slotColor}`}
                          title={`${slot.startTime} - ${slot.status}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
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
        
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-muted">ไม่มีการจองในวันนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between flex-wrap gap-4 p-4 bg-surface border border-border rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl">
                    🕐
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {booking.startTime} - {booking.endTime}
                      {selectedMachineId === 'all' && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          {machines.find(m => m.id === booking.machineId)?.name || 'Unknown'}
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

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                  
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <div className="flex gap-2">
                      <AnimatedButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingBooking(booking)}
                        disabled={isUpdating}
                      >
                        ✏️ แก้ไข
                      </AnimatedButton>
                      <AnimatedButton
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelBookingId(booking.id)}
                        disabled={isUpdating}
                      >
                        ❌ ยกเลิก
                      </AnimatedButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedCard>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancelBookingId}
        title="ยกเลิกการจอง?"
        description="การจองนี้จะถูกยกเลิกและเวลาจะว่างให้ลูกค้าคนอื่นจองได้ ต้องการดำเนินการต่อหรือไม่?"
        confirmText="🗑️ ยกเลิกการจอง"
        cancelText="ไม่ใช่ กลับไป"
        variant="danger"
        onConfirm={handleCancelBooking}
        onClose={() => setCancelBookingId(null)}
        isLoading={isUpdating}
      />

      {/* Edit Booking Modal */}
      {editingBooking && (
        <Portal>
          <EditBookingModal
            booking={editingBooking}
            onClose={() => setEditingBooking(null)}
            onSave={(data) => handleUpdateBooking(editingBooking.id, data)}
            isUpdating={isUpdating}
          />
        </Portal>
      )}
    </div>
  );
}

/**
 * Edit Booking Modal Component
 */
function EditBookingModal({ 
  booking, 
  onClose, 
  onSave,
  isUpdating 
}: { 
  booking: AdvanceBooking; 
  onClose: () => void; 
  onSave: (data: UpdateAdvanceBookingData) => Promise<void>;
  isUpdating: boolean;
}) {
  const [formData, setFormData] = useState({
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    status: booking.status,
    notes: booking.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground">✏️ แก้ไขการจองล่วงหน้า</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm text-muted mb-1">ชื่อลูกค้า</label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground"
              placeholder="ชื่อลูกค้า"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-sm text-muted mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground"
              placeholder="เบอร์โทรศัพท์"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-muted mb-1">สถานะ</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AdvanceBooking['status'] })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground outline-none"
            >
              <option value="pending">⏳ รอยืนยัน</option>
              <option value="confirmed">✅ ยืนยันแล้ว</option>
              <option value="completed">✔️ เสร็จสิ้น</option>
              <option value="cancelled">❌ ยกเลิก</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-muted mb-1">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>

          {/* Booking Info (Read-only) */}
          <div className="bg-muted-light/30 p-3 rounded-xl border border-border/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">วันที่:</span>
                <span className="text-foreground font-medium">{booking.bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">เวลา:</span>
                <span className="text-foreground font-medium">{booking.startTime} - {booking.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">ระยะเวลา:</span>
                <span className="text-foreground font-medium">{booking.duration} นาที</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1" disabled={isUpdating}>
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton variant="primary" type="submit" className="flex-1" disabled={isUpdating}>
              {isUpdating ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
