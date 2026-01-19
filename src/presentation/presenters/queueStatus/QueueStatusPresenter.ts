/**
 * QueueStatusPresenter
 * Handles business logic for Queue Status page
 * Receives repository via dependency injection
 * 
 * ✅ Updated to use IWalkInQueueRepository (new schema)
 */

import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { IWalkInQueueRepository, WalkInQueue, WalkInStatus } from '@/src/application/repositories/IWalkInQueueRepository';
import { Metadata } from 'next';

export interface QueueStatusData {
  id: string;
  customerId?: string;
  machineName?: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  preferredStationType?: string;
  queueNumber: number;
  status: WalkInStatus | 'playing' | 'completed' | 'cancelled';
  joinedAt: string;
  calledAt?: string;
  seatedAt?: string;
  /** Number of queues ahead */
  queuesAhead: number;
  /** Estimated wait time in minutes */
  estimatedWaitMinutes: number;
  /** Wait time since joining */
  waitTimeMinutes?: number;
  
  // Backward compatibility fields (deprecated)
  /** @deprecated Use queueNumber instead */
  position?: number;
  /** @deprecated Use joinedAt instead */
  bookingTime?: string;
  /** @deprecated */
  duration?: number;
  /** @deprecated Use queuesAhead instead */
  queueAhead?: number;
}

export interface QueueStatusViewModel {
  queues: QueueStatusData[];
  waitingQueues: QueueStatusData[];
  calledQueues: QueueStatusData[];
  seatedQueues: QueueStatusData[];
  
  // Backward compatibility fields (deprecated)
  /** @deprecated Use calledQueues/seatedQueues instead */
  playingQueues?: QueueStatusData[];
  /** @deprecated Use seatedQueues instead */
  completedQueues?: QueueStatusData[];
}

/**
 * Presenter for Queue Status page
 * ✅ Receives repository via constructor injection (not Supabase directly)
 */
export class QueueStatusPresenter {
  constructor(
    private readonly walkInQueueRepository: IWalkInQueueRepository,
    private readonly machineRepository: IMachineRepository
  ) {}

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'สถานะคิวของฉัน | Racing Queue',
      description: 'ดูสถานะคิวที่คุณจองไว้ทั้งหมด ติดตามลำดับคิวแบบ Real-time',
    };
  }

  /**
   * Get queue by ID
   */
  async getQueueById(id: string): Promise<WalkInQueue | null> {
    try {
      return await this.walkInQueueRepository.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get machine by ID
   */
  async getMachineById(id: string): Promise<Machine | null> {
    try {
      return await this.machineRepository.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all queues
   */
  async getAllQueues(): Promise<WalkInQueue[]> {
    try {
      return await this.walkInQueueRepository.getAll();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel a queue
   */
  async cancelQueue(queueId: string, customerId?: string): Promise<void> {
    try {
      await this.walkInQueueRepository.cancel(queueId, customerId);
    } catch (error) {
      throw error;
    }
  }

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
   * Load queue status data for a customer
   * Uses the new RPC function that returns status with queue position
   */
  async loadMyQueueStatus(customerId: string): Promise<QueueStatusData[]> {
    if (!customerId) return [];

    try {
      const queues = await this.withTimeout(
        this.walkInQueueRepository.getMyQueueStatus(customerId)
      );

      // Map to presenter model with backward-compatible fields
      return queues.map(q => ({
        id: q.id,
        customerId: q.customerId,
        customerName: q.customerName,
        customerPhone: q.customerPhone,
        partySize: q.partySize,
        preferredStationType: q.preferredStationType,
        queueNumber: q.queueNumber,
        status: q.status,
        joinedAt: q.joinedAt,
        calledAt: q.calledAt,
        seatedAt: q.seatedAt,
        queuesAhead: q.queuesAhead || 0,
        estimatedWaitMinutes: q.estimatedWaitMinutes || 0,
        waitTimeMinutes: q.waitTimeMinutes,
        // Backward compatibility
        position: q.queueNumber,
        bookingTime: q.joinedAt,
        duration: 30, // Default duration
        queueAhead: q.queuesAhead || 0,
        machineName: q.preferredMachineName || q.preferredStationType || 'ไม่ระบุ',
      }));

    } catch (error) {
      console.error('Error loading queue status data:', error);
      throw error;
    }
  }

  /**
   * Get view model from queue status data
   */
  getViewModel(queues: QueueStatusData[]): QueueStatusViewModel {
    const waitingQueues = queues.filter(q => q.status === 'waiting');
    const calledQueues = queues.filter(q => q.status === 'called');
    const seatedQueues = queues.filter(q => q.status === 'seated');
    
    return {
      queues,
      waitingQueues,
      calledQueues,
      seatedQueues,
      // Backward compatibility
      playingQueues: calledQueues, // 'called' is similar to old 'playing'
      completedQueues: seatedQueues, // 'seated' is similar to old 'completed'
    };
  }
}
