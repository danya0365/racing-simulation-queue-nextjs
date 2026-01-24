/**
 * IBookingRepository
 * Repository interface for timezone-aware Booking data access
 * Following Clean Architecture - Application layer
 * 
 * Key differences from IAdvanceBookingRepository:
 * - Uses TIMESTAMPTZ (ISO 8601 strings) instead of separate DATE + TIME
 * - Supports cross-midnight bookings via isCrossMidnight flag
 * - Includes businessTimezone for display purposes
 */

// ============================================================
// TYPES
// ============================================================

export type BookingSlotStatus = 'available' | 'booked' | 'passed';

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'completed';

/**
 * Represents a single time slot in the schedule
 */
export interface BookingTimeSlot {
  id: string;
  startTime: string; // HH:mm format (local time)
  endTime: string;   // HH:mm format (local time)
  status: BookingSlotStatus;
  bookingId?: string; // If booked, reference to the booking
  isCrossMidnight?: boolean; // True if this slot is part of a cross-midnight booking
}

/**
 * Schedule for a specific day
 */
export interface BookingDaySchedule {
  date: string; // YYYY-MM-DD format (local date in business timezone)
  machineId: string;
  timezone: string; // IANA timezone (e.g., 'Asia/Bangkok')
  timeSlots: BookingTimeSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

/**
 * A booking record with full timezone information
 */
export interface Booking {
  id: string;
  machineId: string;
  machineName?: string; // Optional: Machine name for display
  customerId?: string;
  isOwner?: boolean; // True if this booking belongs to the current user
  customerName: string;
  customerPhone: string;
  
  // Timestamps in ISO 8601 format with timezone
  startAt: string;      // e.g., "2026-01-15T10:00:00+07:00"
  endAt: string;        // e.g., "2026-01-15T11:00:00+07:00"
  
  // Duration in minutes
  durationMinutes: number;
  
  // Pricing
  totalPrice?: number;  // Calculated total price based on duration and machine rate
  
  // Business timezone for display
  businessTimezone: string; // e.g., "Asia/Bangkok"
  
  // Local date/time derived from startAt/endAt using businessTimezone
  localDate: string;       // YYYY-MM-DD
  localStartTime: string;  // HH:mm
  localEndTime: string;    // HH:mm
  
  // Cross-midnight indicator
  isCrossMidnight: boolean;
  
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data required to create a new booking
 * Uses local date/time + timezone for convenience
 */
export interface CreateBookingData {
  machineId: string;
  customerName: string;
  customerPhone: string;
  
  // Local date and time (will be converted to TIMESTAMPTZ using timezone)
  localDate: string;      // YYYY-MM-DD
  localStartTime: string; // HH:mm
  durationMinutes: number;
  
  // Timezone for conversion
  timezone?: string; // Defaults to 'Asia/Bangkok'
  
  notes?: string;
  customerId: string; // Required for ownership verification (empty string if new/guest)
}

/**
 * Data for updating an existing booking
 */
export interface UpdateBookingData {
  localDate?: string;
  localStartTime?: string;
  durationMinutes?: number;
  status?: BookingStatus;
  notes?: string;
}

/**
 * Summary statistics for bookings
 */
export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  cancelledBookings: number;
  completedBookings: number;
}

/**
 * Log of a booking session action (START/STOP)
 */
export interface BookingLog {
  bookingId: string;
  action: 'START' | 'STOP';
  recordedAt: string;
}

// ============================================================
// REPOSITORY INTERFACE
// ============================================================

export interface IBookingRepository {
  /**
   * Get schedule for a specific day and machine
   * @param machineId - UUID of the machine
   * @param date - Local date in YYYY-MM-DD format
   * @param timezone - IANA timezone (e.g., 'Asia/Bangkok')
   * @param referenceTime - Optional ISO 8601 timestamp for marking passed slots
   * @param customerId - Optional customer ID for privacy (shows full phone for owner)
   */
  getDaySchedule(
    machineId: string, 
    date: string, 
    timezone: string,
    referenceTime?: string,
    customerId?: string
  ): Promise<BookingDaySchedule>;

  /**
   * Get available dates (next N days)
   * @param todayStr - Today's date in YYYY-MM-DD format
   * @param daysAhead - Number of days to return (default: 7)
   */
  getAvailableDates(todayStr: string, daysAhead?: number): Promise<string[]>;

  /**
   * Get booking by ID
   */
  getById(id: string): Promise<Booking | null>;

  /**
   * Get all bookings for the current customer (by customer_id)
   * SECURE: Only returns bookings that belong to this customer_id
   * @param customerId - Customer UUID from localStorage (obtained after first booking)
   */
  getMyBookings(customerId: string): Promise<Booking[]>;

  /**
   * Get all bookings for a machine on a specific date
   * Includes bookings that cross midnight into this date
   */
  getByMachineAndDate(machineId: string, date: string, customerId?: string): Promise<Booking[]>;

  /**
   * Create a new booking
   * Converts local date/time + timezone to TIMESTAMPTZ
   */
  create(data: CreateBookingData): Promise<Booking>;

  /**
   * Update an existing booking
   */
  update(id: string, data: UpdateBookingData): Promise<Booking>;

  /**
   * Cancel a booking
   * @param id - Booking UUID
   * @param customerId - Optional customer ID for ownership verification (required for non-admins)
   */
  cancel(id: string, customerId?: string): Promise<boolean>;

  /**
   * Check if a time slot is available
   * Uses TIMESTAMPTZ range overlap detection
   */
  isSlotAvailable(
    machineId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    timezone?: string,
    referenceTime?: string
  ): Promise<boolean>;

  /**
   * Get booking statistics
   */
  getStats(): Promise<BookingStats>;

  /**
   * Log a session action (START/STOP)
   */
  logSession(bookingId: string, action: 'START' | 'STOP'): Promise<void>;

  /**
   * Get session logs for a list of bookings
   */
  getSessionLogs(bookingIds: string[]): Promise<BookingLog[]>;
}
