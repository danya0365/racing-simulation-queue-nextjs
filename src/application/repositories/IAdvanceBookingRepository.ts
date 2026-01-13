/**
 * IAdvanceBookingRepository
 * Repository interface for Advance Booking data access
 * Following Clean Architecture - Application layer
 */

export type TimeSlotStatus = 'available' | 'booked' | 'passed';

/**
 * Represents a single time slot
 */
export interface TimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  status: TimeSlotStatus;
  bookingId?: string; // If booked, reference to the booking
}

/**
 * Schedule for a specific day
 */
export interface DaySchedule {
  date: string; // YYYY-MM-DD format
  machineId: string;
  timeSlots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

/**
 * Advance booking record
 */
export interface AdvanceBooking {
  id: string;
  machineId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;  // YYYY-MM-DD
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  duration: number;     // in minutes
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data required to create an advance booking
 */
export interface CreateAdvanceBookingData {
  machineId: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;  // YYYY-MM-DD
  startTime: string;    // HH:mm
  duration: number;     // in minutes  
  notes?: string;
}

/**
 * Data for updating an advance booking
 */
export interface UpdateAdvanceBookingData {
  customerName?: string;
  customerPhone?: string;
  bookingDate?: string;
  startTime?: string;
  duration?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

/**
 * Summary statistics for advance bookings
 */
export interface AdvanceBookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
}

/**
 * Repository interface for advance booking operations
 */
export interface IAdvanceBookingRepository {
  /**
   * Get schedule for a specific day and machine
   */
  getDaySchedule(machineId: string, date: string, referenceTime?: string): Promise<DaySchedule>;

  /**
   * Get available dates (next N days)
   */
  getAvailableDates(todayStr: string, daysAhead?: number): Promise<string[]>;

  /**
   * Get booking by ID
   */
  getById(id: string): Promise<AdvanceBooking | null>;

  /**
   * Get all advance bookings for a customer
   */
  getByCustomerPhone(phone: string): Promise<AdvanceBooking[]>;

  /**
   * Get all advance bookings for a machine on a date
   */
  getByMachineAndDate(machineId: string, date: string): Promise<AdvanceBooking[]>;

  /**
   * Create a new advance booking
   */
  create(data: CreateAdvanceBookingData): Promise<AdvanceBooking>;

  /**
   * Update an existing advance booking
   */
  update(id: string, data: UpdateAdvanceBookingData): Promise<AdvanceBooking>;

  /**
   * Cancel an advance booking
   */
  cancel(id: string): Promise<boolean>;

  /**
   * Check if a time slot is available
   */
  isSlotAvailable(machineId: string, date: string, startTime: string, duration: number, referenceTime?: string): Promise<boolean>;

  /**
   * Get statistics
   */
  getStats(): Promise<AdvanceBookingStats>;
}
