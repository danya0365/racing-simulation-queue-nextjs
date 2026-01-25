/**
 * BackendPresenter
 * Handles business logic for Admin/Backend page
 * Receives repository via dependency injection
 * 
 * ✅ Updated to use IWalkInQueueRepository and ISessionRepository (new schema)
 * ✅ Uses IBookingRepository (TIMESTAMPTZ-based)
 */

import { Booking, BookingStats, IBookingRepository } from '@/src/application/repositories/IBookingRepository';
import { IMachineRepository, Machine, MachineStats, MachineStatus } from '@/src/application/repositories/IMachineRepository';
import { ISessionRepository, Session, SessionStats } from '@/src/application/repositories/ISessionRepository';
import { IWalkInQueueRepository, WalkInQueue, WalkInQueueStats } from '@/src/application/repositories/IWalkInQueueRepository';
import { Metadata } from 'next';

export interface BackendViewModel {
  machines: Machine[];
  machineStats: MachineStats;
  /** Walk-in queue entries */
  walkInQueues: WalkInQueue[];
  walkInQueueStats: WalkInQueueStats;
  /** Waiting queue entries */
  waitingQueues: WalkInQueue[];
  /** Active sessions */
  activeSessions: Session[];
  sessionStats: SessionStats;
  /** Today's bookings */
  todayBookings: Booking[];
  /** Booking stats */
  bookingStats: BookingStats;
  /** Next confirmed booking for each machine (Key: MachineID) */
  nextBookingsMap?: Record<string, Booking>;
  /** List of all/history sessions (loaded on demand) */
  sessions?: Session[];

  // Backward compatibility fields (deprecated, use walkInQueues instead)
  /** @deprecated Use walkInQueues instead */
  activeQueues?: WalkInQueue[];
  /** @deprecated Use walkInQueues instead */
  queues?: WalkInQueue[];
  /** @deprecated Use walkInQueueStats instead */
  queueStats?: WalkInQueueStats;
}

/**
 * Presenter for Backend/Admin page
 */
export class BackendPresenter {
  constructor(
    private readonly machineRepository: IMachineRepository,
    private readonly walkInQueueRepository: IWalkInQueueRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly bookingRepository?: IBookingRepository
  ) {}

  /**
   * Helper to wrap promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out (${ms}ms)`)), ms)
      )
    ]);
  }

  /**
   * Get dashboard data (Stats + Light Machine Check)
   */
  async getDashboardData(): Promise<Partial<BackendViewModel>> {
    try {
      // Parallel fetch: Stats + Machines + Queue Stats + Session Stats
      const [machines, walkInQueueStats, sessionStats] = await this.withTimeout(Promise.all([
        this.machineRepository.getAll(),
        this.walkInQueueRepository.getStats(),
        this.sessionRepository.getStats(),
      ]));

      const activeMachines = machines.filter(m => m.isActive);
      const machineStats: MachineStats = {
        totalMachines: activeMachines.length,
        availableMachines: activeMachines.filter(m => m.status === 'available').length,
        occupiedMachines: activeMachines.filter(m => m.status === 'occupied').length,
        maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
      };

      // Get waiting queues and active sessions
      const [waitingQueues, activeSessions] = await this.withTimeout(Promise.all([
        this.walkInQueueRepository.getWaiting(),
        this.sessionRepository.getActiveSessions(),
      ]));

      return {
        machineStats,
        walkInQueueStats,
        sessionStats,
        machines,
        waitingQueues,
        walkInQueues: waitingQueues,
        activeSessions,
        // Backward compatibility
        activeQueues: waitingQueues,
        queues: waitingQueues,
        queueStats: walkInQueueStats,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get control room data (Realtime machines + queues + sessions)
   */
  async getControlData(): Promise<Partial<BackendViewModel>> {
    try {
      const [machines, waitingQueues, activeSessions] = await this.withTimeout(Promise.all([
        this.machineRepository.getAll(),
        this.walkInQueueRepository.getWaiting(),
        this.sessionRepository.getActiveSessions(),
      ]));

      // Calculate machine stats
      const activeMachines = machines.filter(m => m.isActive);
      const machineStats: MachineStats = {
        totalMachines: activeMachines.length,
        availableMachines: activeMachines.filter(m => m.status === 'available').length,
        occupiedMachines: activeMachines.filter(m => m.status === 'occupied').length,
        maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
      };

      return {
        machines,
        waitingQueues,
        walkInQueues: waitingQueues,
        activeSessions,
        machineStats,
        // Backward compatibility
        activeQueues: waitingQueues,
        queues: waitingQueues,
      };
    } catch (error) {
      console.error('Error getting control data:', error);
      throw error;
    }
  }

  /**
   * Get queues data (History + Stats)
   */
  async getQueuesData(limit: number = 20, page: number = 1): Promise<Partial<BackendViewModel>> {
    try {
      const [queues, walkInQueueStats] = await this.withTimeout(Promise.all([
        this.walkInQueueRepository.getAll(limit, page),
        this.walkInQueueRepository.getStats(),
      ]));

      return {
        walkInQueues: queues,
        walkInQueueStats,
        // Backward compatibility
        activeQueues: queues,
        queues: queues,
        queueStats: walkInQueueStats,
      };
    } catch (error) {
      console.error('Error getting queues data:', error);
      throw error;
    }
  }
  /**
   * Get sessions data (History + Stats)
   */
  async getSessionsData(limit: number = 20, page: number = 1): Promise<Partial<BackendViewModel>> {
    try {
      const [sessions, sessionStats] = await this.withTimeout(Promise.all([
        this.sessionRepository.getAll(limit, page),
        this.sessionRepository.getStats(),
      ]));

      // Sort sessions by start time desc (newest first)
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      return {
        sessions: sortedSessions,
        sessionStats,
      };
    } catch (error) {
      console.error('Error getting sessions data:', error);
      throw error;
    }
  }

  /**
   * Get view model for the backend page (Unified loader)
   */
  async getViewModel(now: string): Promise<BackendViewModel> {
    const data = await this.getControlData();

    // Fetch today's bookings if repository is available
    let todayBookings: Booking[] = [];
    let bookingStats: BookingStats = {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      seatedBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
    };

    if (this.bookingRepository) {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = now.slice(0, 10);
        
        // Fetch all bookings for all machines for today in ONE query
        const allBookings = await this.bookingRepository!.getByDate(today);
        
        todayBookings = allBookings.sort((a, b) => a.localStartTime.localeCompare(b.localStartTime));
        
        // Calculate stats from today's bookings
        bookingStats = {
          totalBookings: todayBookings.length,
          pendingBookings: todayBookings.filter(b => b.status === 'pending').length,
          confirmedBookings: todayBookings.filter(b => b.status === 'confirmed').length,
          seatedBookings: todayBookings.filter(b => b.status === 'seated').length,
          cancelledBookings: todayBookings.filter(b => b.status === 'cancelled').length,
          completedBookings: todayBookings.filter(b => b.status === 'completed').length,
        };
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    }

    // Get full stats
    const [walkInQueueStats, sessionStats] = await Promise.all([
      this.walkInQueueRepository.getStats(),
      this.sessionRepository.getStats(),
    ]);

    return {
      machines: data.machines || [],
      machineStats: data.machineStats || { totalMachines: 0, availableMachines: 0, occupiedMachines: 0, maintenanceMachines: 0 },
      walkInQueues: data.walkInQueues || [],
      walkInQueueStats,
      waitingQueues: data.waitingQueues || [],
      activeSessions: data.activeSessions || [],
      sessionStats,
      todayBookings,
      bookingStats,
      nextBookingsMap: todayBookings.reduce((acc, booking) => {
        if (booking.status === 'confirmed' && !acc[booking.machineId]) {
             // Basic logic: take the first confirmed one. 
             // Since todayBookings is sorted by time, the first one found for a machine is the earliest.
             // But map might overwrite? No, "if !acc[booking.machineId]" ensures we keep the first (earliest).
             // Wait, reduce iterates start to end. if we want earliest, and list is sorted earliest first.
             acc[booking.machineId] = booking;
        }
        return acc;
      }, {} as Record<string, Booking>),
      // Backward compatibility
      activeQueues: data.walkInQueues || [],
      queues: data.walkInQueues || [],
      queueStats: walkInQueueStats,
    };
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'แอดมิน | Racing Queue',
      description: 'ระบบจัดการคิวและเครื่องเล่น Racing Simulator',
    };
  }

  // ============================================================
  // WALK-IN QUEUE OPERATIONS
  // ============================================================

  /**
   * Call a customer from walk-in queue
   */
  async callQueueCustomer(queueId: string): Promise<WalkInQueue> {
    try {
      return await this.walkInQueueRepository.callCustomer(queueId);
    } catch (error) {
      console.error('Error calling queue customer:', error);
      throw error;
    }
  }



  /**
   * Cancel a queue entry
   */
  async cancelQueue(queueId: string): Promise<boolean> {
    try {
      return await this.walkInQueueRepository.cancel(queueId);
    } catch (error) {
      console.error('Error cancelling queue:', error);
      throw error;
    }
  }

  /**
   * Get all walk-in queues
   */
  async getAllQueues(): Promise<WalkInQueue[]> {
    try {
      return await this.walkInQueueRepository.getAll();
    } catch (error) {
      console.error('Error getting all queues:', error);
      throw error;
    }
  }

  // ============================================================
  // SESSION OPERATIONS
  // ============================================================

  /**
   * Start a session (for walk-in customer)
   */
  async startSession(
    stationId: string, 
    customerName: string, 
    queueId?: string,
    estimatedDurationMinutes?: number
  ): Promise<Session> {
    try {
      return await this.sessionRepository.startSession({
        stationId,
        customerName,
        queueId,
        estimatedDurationMinutes,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, totalAmount?: number): Promise<Session> {
    try {
      return await this.sessionRepository.endSession({ sessionId, totalAmount });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<Session[]> {
    try {
      return await this.sessionRepository.getActiveSessions();
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * Update session payment status
   */
  async updateSessionPayment(sessionId: string, status: 'paid' | 'unpaid' | 'partial'): Promise<Session> {
    try {
      return await this.sessionRepository.updatePaymentStatus(sessionId, status);
    } catch (error) {
      console.error('Error updating session payment:', error);
      throw error;
    }
  }

  /**
   * Update session total amount
   */
  async updateSessionAmount(sessionId: string, amount: number): Promise<Session> {
    try {
      return await this.sessionRepository.updateTotalAmount(sessionId, amount);
    } catch (error) {
      console.error('Error updating session amount:', error);
      throw error;
    }
  }

  // ============================================================
  // MACHINE OPERATIONS
  // ============================================================

  /**
   * Update machine status
   */
  async updateMachineStatus(machineId: string, status: MachineStatus): Promise<Machine> {
    try {
      return await this.machineRepository.updateStatus(machineId, status);
    } catch (error) {
      console.error('Error updating machine status:', error);
      throw error;
    }
  }

  /**
   * Update machine details
   */
  async updateMachine(machineId: string, data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
    type?: string;
    hourlyRate?: number;
  }): Promise<Machine> {
    try {
      return await this.machineRepository.update(machineId, data);
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  }
}
