/**
 * MockAdvanceBookingRepository
 * Mock implementation for development and testing
 * Following Clean Architecture - Infrastructure layer
 */

import {
  AdvanceBooking,
  AdvanceBookingStats,
  CreateAdvanceBookingData,
  DaySchedule,
  IAdvanceBookingRepository,
  TimeSlot,
  TimeSlotStatus,
  UpdateAdvanceBookingData,
} from '@/src/application/repositories/IAdvanceBookingRepository';
import { OPERATING_HOURS } from '@/src/config/booking.config';

// Operating hours configuration - moved to booking.config.ts
const OPENING_HOUR = OPERATING_HOURS.isOpen24Hours ? 0 : OPERATING_HOURS.open;
const CLOSING_HOUR = OPERATING_HOURS.isOpen24Hours ? 24 : OPERATING_HOURS.close;
const SLOT_DURATION_MINUTES = OPERATING_HOURS.slotDurationMinutes;

/**
 * Generate time slots for a day
 */
function generateTimeSlots(date: string, bookedSlots: Map<string, string>, referenceTime?: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = referenceTime ? new Date(referenceTime) : new Date();
  const targetDate = new Date(date);
  const isToday = now.getFullYear() === targetDate.getFullYear() && 
                  now.getMonth() === targetDate.getMonth() && 
                  now.getDate() === targetDate.getDate();

  for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHour = minute + SLOT_DURATION_MINUTES >= 60 ? hour + 1 : hour;
      const endMinute = (minute + SLOT_DURATION_MINUTES) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      let status: TimeSlotStatus = 'available';
      let bookingId: string | undefined;
      
      // Check if slot is booked
      if (bookedSlots.has(startTime)) {
        status = 'booked';
        bookingId = bookedSlots.get(startTime);
      }
      
      // Check if slot has passed (for today)
      if (isToday) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        if (slotTime < now && status === 'available') {
          status = 'passed';
        }
      }
      
      slots.push({
        id: `slot-${date}-${startTime}`,
        startTime,
        endTime,
        status,
        bookingId,
      });
    }
  }
  
  return slots;
}

// Mock existing bookings
const MOCK_BOOKINGS: AdvanceBooking[] = [
  {
    id: 'adv-001',
    machineId: 'machine-001',
    customerName: 'สมชาย ใจดี',
    customerPhone: '081-234-5678',
    bookingDate: new Date().toISOString().split('T')[0], // Today
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adv-002',
    machineId: 'machine-001',
    customerName: 'สมหญิง รักสนุก',
    customerPhone: '089-876-5432',
    bookingDate: new Date().toISOString().split('T')[0], // Today
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adv-003',
    machineId: 'machine-002',
    customerName: 'วิชัย เกมเมอร์',
    customerPhone: '082-111-2222',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '11:00',
    endTime: '12:30',
    duration: 90,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adv-004',
    machineId: 'machine-001',
    customerName: 'นภา แข่งเร็ว',
    customerPhone: '083-333-4444',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '15:00',
    endTime: '16:00',
    duration: 60,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class MockAdvanceBookingRepository implements IAdvanceBookingRepository {
  private bookings: AdvanceBooking[] = [...MOCK_BOOKINGS];

  async getDaySchedule(machineId: string, date: string, referenceTime?: string): Promise<DaySchedule> {
    await this.delay(150);
    
    // Get bookings for this machine and date
    const dayBookings = this.bookings.filter(
      b => b.machineId === machineId && 
           b.bookingDate === date && 
           b.status !== 'cancelled'
    );
    
    // Create a map of booked time slots
    const bookedSlots = new Map<string, string>();
    dayBookings.forEach(booking => {
      // Mark all slots covered by this booking
      const startHour = parseInt(booking.startTime.split(':')[0]);
      const startMinute = parseInt(booking.startTime.split(':')[1]);
      const slotsNeeded = Math.ceil(booking.duration / SLOT_DURATION_MINUTES);
      
      for (let i = 0; i < slotsNeeded; i++) {
        const slotMinute = startMinute + (i * SLOT_DURATION_MINUTES);
        const slotHour = startHour + Math.floor(slotMinute / 60);
        const actualMinute = slotMinute % 60;
        const timeKey = `${slotHour.toString().padStart(2, '0')}:${actualMinute.toString().padStart(2, '0')}`;
        bookedSlots.set(timeKey, booking.id);
      }
    });
    
    const timeSlots = generateTimeSlots(date, bookedSlots, referenceTime);
    const availableSlots = timeSlots.filter(s => s.status === 'available').length;
    const bookedCount = timeSlots.filter(s => s.bookingId !== undefined).length;
    
    return {
      date,
      machineId,
      timeSlots,
      totalSlots: timeSlots.length,
      availableSlots,
      bookedSlots: bookedCount,
    };
  }

  async getAvailableDates(todayStr: string, daysAhead: number = 7): Promise<string[]> {
    await this.delay(50);
    
    const dates: string[] = [];
    const [year, month, day] = todayStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dYear = date.getFullYear();
      const dMonth = String(date.getMonth() + 1).padStart(2, '0');
      const dDay = String(date.getDate()).padStart(2, '0');
      dates.push(`${dYear}-${dMonth}-${dDay}`);
    }
    
    return dates;
  }

  async getById(id: string): Promise<AdvanceBooking | null> {
    await this.delay(100);
    return this.bookings.find(b => b.id === id) || null;
  }

  async getByCustomerPhone(phone: string): Promise<AdvanceBooking[]> {
    await this.delay(100);
    return this.bookings.filter(b => b.customerPhone === phone);
  }

  async getByMachineAndDate(machineId: string, date: string): Promise<AdvanceBooking[]> {
    await this.delay(100);
    return this.bookings.filter(
      b => b.machineId === machineId && b.bookingDate === date
    );
  }

  async create(data: CreateAdvanceBookingData): Promise<AdvanceBooking> {
    await this.delay(200);
    
    // Calculate end time
    const startParts = data.startTime.split(':');
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = startMinutes + data.duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    const newBooking: AdvanceBooking = {
      id: `adv-${Date.now()}`,
      machineId: data.machineId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime,
      duration: data.duration,
      status: 'confirmed',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.bookings.push(newBooking);
    return newBooking;
  }

  async update(id: string, data: UpdateAdvanceBookingData): Promise<AdvanceBooking> {
    await this.delay(200);
    
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Booking not found');
    }
    
    const updated: AdvanceBooking = {
      ...this.bookings[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    this.bookings[index] = updated;
    return updated;
  }

  async cancel(id: string): Promise<boolean> {
    await this.delay(200);
    
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) {
      return false;
    }
    
    this.bookings[index] = {
      ...this.bookings[index],
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    
    return true;
  }

  async isSlotAvailable(
    machineId: string, 
    date: string, 
    startTime: string, 
    duration: number,
    referenceTime?: string
  ): Promise<boolean> {
    await this.delay(100);
    
    const schedule = await this.getDaySchedule(machineId, date, referenceTime);
    const slotsNeeded = Math.ceil(duration / SLOT_DURATION_MINUTES);
    
    // Find the starting slot index
    const startIndex = schedule.timeSlots.findIndex(s => s.startTime === startTime);
    if (startIndex === -1) return false;
    
    // Check if all required slots are available
    for (let i = 0; i < slotsNeeded; i++) {
      const slotIndex = startIndex + i;
      if (slotIndex >= schedule.timeSlots.length) return false;
      if (schedule.timeSlots[slotIndex].status !== 'available') return false;
    }
    
    return true;
  }

  async getStats(): Promise<AdvanceBookingStats> {
    await this.delay(100);
    
    return {
      totalBookings: this.bookings.length,
      pendingBookings: this.bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: this.bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: this.bookings.filter(b => b.status === 'cancelled').length,
      completedBookings: this.bookings.filter(b => b.status === 'completed').length,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for convenience
export const mockAdvanceBookingRepository = new MockAdvanceBookingRepository();
