/**
 * BackendPresenter
 * Handles business logic for Admin/Backend page
 * Receives repository via dependency injection
 * 
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

import { Booking, BookingStats, IBookingRepository } from '@/src/application/repositories/IBookingRepository';
import { IMachineRepository, Machine, MachineStats, MachineStatus } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository, Queue, QueueStats, QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface BackendViewModel {
  machines: Machine[];
  machineStats: MachineStats;
  queues: Queue[];
  queueStats: QueueStats;
  /** Active queues (waiting/playing) + recently finished (24h) - for 24-hour operations */
  activeQueues: Queue[];
  waitingQueues: Queue[];
  /** Today's bookings */
  todayBookings: Booking[];
  /** Booking stats */
  bookingStats: BookingStats;
}

/**
 * Presenter for Backend/Admin page
 */
export class BackendPresenter {
  constructor(
    private readonly machineRepository: IMachineRepository,
    private readonly queueRepository: IQueueRepository,
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
  async getDashboardData(now: string): Promise<Partial<BackendViewModel>> {
    try {
      // Parallel fetch: Stats + Machines (needed for stats display sometimes) + Waiting Queues count
      const [backendStats, machines] = await this.withTimeout(Promise.all([
        this.queueRepository.getBackendStats(),
        this.machineRepository.getAll(),
      ]));

      const machineStats: MachineStats = {
        totalMachines: backendStats?.total_machines || 0,
        availableMachines: backendStats?.available_machines || 0,
        occupiedMachines: backendStats?.occupied_machines || 0,
        maintenanceMachines: backendStats?.maintenance_machines || 0,
      };

      const queueStats: QueueStats = {
        totalQueues: backendStats?.total_queues || 0,
        waitingQueues: backendStats?.waiting_queues || 0,
        playingQueues: backendStats?.playing_queues || 0,
        completedQueues: backendStats?.completed_queues || 0,
        cancelledQueues: backendStats?.cancelled_queues || 0,
      };

      // For dashboard, we might want top 5 recent queues.
      // But getActiveAndRecent is cheap enough (today's data).
      // Let's use getWaiting just for the count if stats didn't have it, but stats has it.
      // We need `activeQueues` for "Recent Queues" list in dashboard.
      const activeQueues = await this.withTimeout(this.queueRepository.getActiveAndRecent(now));

      return {
        machineStats,
        queueStats,
        machines, // Needed for counts if stats fail or for logic
        activeQueues, // For recent activity list
        waitingQueues: activeQueues.filter(q => q.status === 'waiting'),
        queues: activeQueues,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get control room data (Realtime machines + queues)
   */
  async getControlData(now: string): Promise<Partial<BackendViewModel>> {
    try {
      const [machines, activeQueues] = await this.withTimeout(Promise.all([
        this.machineRepository.getAll(),
        this.queueRepository.getActiveAndRecent(now),
      ]));

      // Recalculate basic stats on client for immediate consistency
      const machineStats: MachineStats = {
        totalMachines: machines.length,
        availableMachines: machines.filter(m => m.status === 'available').length,
        occupiedMachines: machines.filter(m => m.status === 'occupied').length,
        maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
      };

      return {
        machines,
        activeQueues,
        waitingQueues: activeQueues.filter(q => q.status === 'waiting'),
        queues: activeQueues,
        machineStats
      };
    } catch (error) {
      console.error('Error getting control data:', error);
      throw error;
    }
  }

  /**
   * Get view model for the backend page (Unified loader)
   * This is kept for backward compatibility but internal logic can use partials
   */
  async getViewModel(now: string): Promise<BackendViewModel> {
    // Default to loading control data as it's the most comprehensive set commonly needed
    const data = await this.getControlData(now);

    // Fetch today's bookings if repository is available
    let todayBookings: Booking[] = [];
    let bookingStats: BookingStats = {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
    };

    if (this.bookingRepository) {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = now.slice(0, 10);
        
        // Fetch bookings for all machines for today
        const machines = data.machines || [];
        const allBookings: Booking[] = [];
        
        await Promise.all(
          machines.map(async (machine) => {
            const machineBookings = await this.bookingRepository!.getByMachineAndDate(machine.id, today);
            allBookings.push(...machineBookings);
          })
        );
        
        todayBookings = allBookings.sort((a, b) => a.localStartTime.localeCompare(b.localStartTime));
        
        // Calculate stats from today's bookings
        bookingStats = {
          totalBookings: todayBookings.length,
          pendingBookings: todayBookings.filter(b => b.status === 'pending').length,
          confirmedBookings: todayBookings.filter(b => b.status === 'confirmed').length,
          cancelledBookings: todayBookings.filter(b => b.status === 'cancelled').length,
          completedBookings: todayBookings.filter(b => b.status === 'completed').length,
        };
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    }

    // Fill missing stats with defaults if needed
    return {
      machines: data.machines || [],
      machineStats: data.machineStats || { totalMachines: 0, availableMachines: 0, occupiedMachines: 0, maintenanceMachines: 0 },
      queues: data.queues || [],
      queueStats: { totalQueues: 0, waitingQueues: 0, playingQueues: 0, completedQueues: 0, cancelledQueues: 0 },
      activeQueues: data.activeQueues || [],
      waitingQueues: data.waitingQueues || [],
      todayBookings,
      bookingStats,
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

  /**
   * Update queue status
   */
  async updateQueueStatus(queueId: string, status: QueueStatus): Promise<Queue> {
    try {
      return await this.queueRepository.updateStatus(queueId, status);
    } catch (error) {
      console.error('Error updating queue status:', error);
      throw error;
    }
  }

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
   * Delete a queue
   */
  async deleteQueue(queueId: string): Promise<boolean> {
    try {
      return await this.queueRepository.delete(queueId);
    } catch (error) {
      console.error('Error deleting queue:', error);
      throw error;
    }
  }

  /**
   * Get all queues
   */
  async getAllQueues(): Promise<Queue[]> {
    try {
      return await this.queueRepository.getAll();
    } catch (error) {
      console.error('Error getting all queues:', error);
      throw error;
    }
  }

  /**
   * Get queues by machine
   */
  async getQueuesByMachine(machineId: string): Promise<Queue[]> {
    try {
      return await this.queueRepository.getByMachineId(machineId);
    } catch (error) {
      console.error('Error getting machine queues:', error);
      throw error;
    }
  }

  /**
   * Reset all queues for a machine
   */
  async resetMachineQueue(machineId: string, now: string): Promise<{ cancelledCount: number; completedCount: number }> {
    try {
      return await this.queueRepository.resetMachineQueue(machineId, now);
    } catch (error) {
      console.error('Error resetting machine queue:', error);
      throw error;
    }
  }

  /**
   * Update machine details (name, description, position, isActive, status, etc.)
   */
  async updateMachine(machineId: string, data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
  }): Promise<Machine> {
    try {
      return await this.machineRepository.update(machineId, data);
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  }
}
