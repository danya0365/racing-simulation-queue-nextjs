/**
 * ControlPresenter
 * Handles business logic for Game Room Control Panel
 * Session-Centric approach: Sessions track actual machine usage
 * 
 * ✅ Receives repositories via dependency injection (not Supabase directly)
 */

import { Booking, IBookingRepository } from '@/src/application/repositories/IBookingRepository';
import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { ISessionRepository, Session } from '@/src/application/repositories/ISessionRepository';
import { IWalkInQueueRepository, WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';
import { getShopTodayString, SHOP_TIMEZONE } from '@/src/lib/date';
import { Metadata } from 'next';

// ============================================================
// VIEW MODEL TYPES
// ============================================================

export type StationState = 'available' | 'in_use' | 'reserved';

export interface StationViewModel {
  machine: Machine;
  state: StationState;
  activeSession: Session | null;
  reservedBooking: Booking | null;
  upcomingBookings: Booking[];
}

export interface ControlViewModel {
  stations: StationViewModel[];
  waitingQueue: WalkInQueue[];
  stats: {
    availableCount: number;
    inUseCount: number;
    reservedCount: number;
    waitingQueueCount: number;
  };
  currentTime: string;
}

// ============================================================
// PRESENTER CLASS
// ============================================================

export class ControlPresenter {
  constructor(
    private readonly machineRepo: IMachineRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly bookingRepo: IBookingRepository,
    private readonly walkInRepo: IWalkInQueueRepository
  ) {}

  /**
   * Get view model for the control panel
   */
  async getViewModel(): Promise<ControlViewModel> {
    const today = getShopTodayString();
    
    // Fetch data in parallel
    const [allMachines, activeSessions, waitingQueue] = await Promise.all([
      this.machineRepo.getAll(),
      this.sessionRepo.getActiveSessions(),
      this.walkInRepo.getWaiting(),
    ]);

    // Filter active machines only
    const machines = allMachines.filter(m => m.isActive);
    
    // Fetch today's bookings for all machines in parallel
    const bookingsPromises = machines.map(m => 
      this.bookingRepo.getByMachineAndDate(m.id, today)
    );
    const allBookingsArrays = await Promise.all(bookingsPromises);
    
    // Build a map of machineId -> bookings
    const bookingsByMachine = new Map<string, Booking[]>();
    machines.forEach((machine, index) => {
      bookingsByMachine.set(machine.id, allBookingsArrays[index]);
    });

    // Build station view models
    const stations: StationViewModel[] = machines.map(machine => {
      const activeSession = activeSessions.find(s => s.stationId === machine.id) || null;
      const machineBookings = bookingsByMachine.get(machine.id) || [];
      
      // Find reserved booking (confirmed but not yet started session)
      const reservedBooking = this.getReservedBooking(machineBookings, activeSession);
      
      // Get upcoming bookings
      const upcomingBookings = this.getUpcomingBookings(machineBookings, activeSession, reservedBooking);
      
      // Determine state
      const state = this.determineStationState(activeSession, reservedBooking);
      
      return {
        machine,
        state,
        activeSession,
        reservedBooking,
        upcomingBookings,
      };
    });

    // Calculate stats
    const availableCount = stations.filter(s => s.state === 'available').length;
    const inUseCount = stations.filter(s => s.state === 'in_use').length;
    const reservedCount = stations.filter(s => s.state === 'reserved').length;

    return {
      stations,
      waitingQueue,
      stats: {
        availableCount,
        inUseCount,
        reservedCount,
        waitingQueueCount: waitingQueue.length,
      },
      currentTime: new Date().toISOString(),
    };
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'ควบคุมห้องเกม | Racing Simulation',
      description: 'หน้าควบคุมห้องเครื่องเล่นเกม - Session Control Panel',
    };
  }

  /**
   * Start a manual session (walk-in without queue)
   */
  async startManualSession(machineId: string, customerName: string, notes?: string): Promise<Session> {
    return this.sessionRepo.startSession({
      stationId: machineId,
      customerName,
      notes: notes || 'Manual walk-in session',
    });
  }

  /**
   * Start session from walk-in queue
   */
  async startFromQueue(machineId: string, queueId: string): Promise<Session> {
    // First seat the customer (updates queue status)
    const queue = await this.walkInRepo.seatCustomer({
      queueId,
      machineId,
    });
    
    // Session is automatically created by seatCustomer RPC
    // Return the active session for this machine
    const session = await this.sessionRepo.getActiveSession(machineId);
    if (!session) {
      throw new Error('Session not created after seating customer');
    }
    return session;
  }

  /**
   * Start session from booking (check-in)
   */
  async startFromBooking(machineId: string, booking: Booking): Promise<Session> {
    return this.sessionRepo.startSession({
      stationId: machineId,
      customerName: booking.customerName,
      bookingId: booking.id,
      notes: `Check-in from booking (${booking.localStartTime} - ${booking.localEndTime})`,
    });
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, totalAmount?: number): Promise<Session> {
    return this.sessionRepo.endSession({
      sessionId,
      totalAmount,
    });
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private determineStationState(
    activeSession: Session | null,
    reservedBooking: Booking | null
  ): StationState {
    if (activeSession) return 'in_use';
    if (reservedBooking) return 'reserved';
    return 'available';
  }

  private getReservedBooking(
    bookings: Booking[],
    activeSession: Session | null
  ): Booking | null {
    if (activeSession) return null; // If in use, no one is "reserved"
    
    // Find confirmed bookings not yet started
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    // Sort by start time and return the earliest
    return confirmedBookings
      .sort((a, b) => a.localStartTime.localeCompare(b.localStartTime))[0] || null;
  }

  private getUpcomingBookings(
    bookings: Booking[],
    activeSession: Session | null,
    reservedBooking: Booking | null
  ): Booking[] {
    const now = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: SHOP_TIMEZONE 
    });
    
    return bookings
      .filter(b => {
        // Exclude the reserved booking
        if (reservedBooking && b.id === reservedBooking.id) return false;
        // Exclude booking linked to active session
        if (activeSession && b.id === activeSession.bookingId) return false;
        // Only confirmed or pending future bookings
        return ['confirmed', 'pending'].includes(b.status) && b.localStartTime > now;
      })
      .sort((a, b) => a.localStartTime.localeCompare(b.localStartTime))
      .slice(0, 3); // Show max 3 upcoming
  }
}
