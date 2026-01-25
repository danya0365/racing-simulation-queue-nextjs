/**
 * ISessionRepository
 * Repository interface for Session data access
 * Following Clean Architecture - Application layer
 * 
 * Sessions track actual machine usage:
 * - Linked to bookings (advance reservations) or walk_in_queue
 * - Tracks start/end time and calculated duration
 * - Manages payment status
 */

// ============================================================
// TYPES
// ============================================================

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export type SessionSourceType = 'booking' | 'walk_in' | 'manual';

/**
 * Session record representing actual machine usage
 */
export interface Session {
  id: string;
  stationId: string;
  stationName?: string;
  bookingId?: string;
  queueId?: string;
  customerName: string;
  startTime: string;
  endTime?: string;
  estimatedEndTime?: string;
  durationMinutes?: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  sourceType?: SessionSourceType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session statistics
 */
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  averageDurationMinutes: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Data required to start a session
 */
export interface StartSessionData {
  stationId: string;
  customerName: string;
  bookingId?: string;
  queueId?: string;
  notes?: string;
  /**
   * Estimated duration in minutes for walk-in/manual sessions.
   * Used for slot availability calculation. Default: 60 minutes.
   * Not needed for booking-based sessions (uses booking's end_at).
   */
  estimatedDurationMinutes?: number;
}

/**
 * Data for ending a session
 */
export interface EndSessionData {
  sessionId: string;
  totalAmount?: number;  // If not provided, will be calculated based on duration
}

// ============================================================
// REPOSITORY INTERFACE
// ============================================================

export interface ISessionRepository {
  /**
   * Get session by ID
   */
  getById(id: string): Promise<Session | null>;

  /**
   * Get all sessions (with pagination)
   */
  getAll(limit?: number, page?: number): Promise<Session[]>;

  /**
   * Get sessions by station ID
   */
  getByStationId(stationId: string, limit?: number, page?: number): Promise<Session[]>;

  /**
   * Get active (in-progress) session for a station
   */
  getActiveSession(stationId: string): Promise<Session | null>;

  /**
   * Get all active sessions across all stations
   */
  getActiveSessions(): Promise<Session[]>;

  /**
   * Get today's sessions
   */
  getTodaySessions(): Promise<Session[]>;

  /**
   * Get sessions by date range
   */
  getByDateRange(startDate: string, endDate: string): Promise<Session[]>;

  /**
   * Start a new session
   */
  startSession(data: StartSessionData): Promise<Session>;

  /**
   * End a session (calculates duration and optional amount)
   */
  endSession(data: EndSessionData): Promise<Session>;

  /**
   * Update payment status
   */
  updatePaymentStatus(sessionId: string, status: PaymentStatus): Promise<Session>;
  /**
   * Update the total amount for a session.
   */
  updateTotalAmount(sessionId: string, totalAmount: number): Promise<Session>;

  /**
   * Get session statistics
   */
  getStats(dateRange?: { start: string; end: string }): Promise<SessionStats>;

  /**
   * Get total revenue for a date range
   */
  getTotalRevenue(dateRange?: { start: string; end: string }): Promise<number>;
}
