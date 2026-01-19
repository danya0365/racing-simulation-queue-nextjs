/**
 * IWalkInQueueRepository
 * Repository interface for Walk-In Queue data access
 * Following Clean Architecture - Application layer
 * 
 * This replaces the old IQueueRepository with redesigned status flow:
 * waiting → called → seated → (creates session)
 *         ↘ cancelled
 */

// ============================================================
// TYPES
// ============================================================

export type WalkInStatus = 'waiting' | 'called' | 'seated' | 'cancelled';

/**
 * Walk-In Queue entry
 */
export interface WalkInQueue {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  preferredMachineId?: string;
  preferredMachineName?: string;
  partySize: number;
  preferredStationType?: string;
  queueNumber: number;
  status: WalkInStatus;
  notes?: string;
  joinedAt: string;
  calledAt?: string;
  seatedAt?: string;
  waitTimeMinutes?: number;
  queuesAhead?: number;
  estimatedWaitMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statistics for walk-in queue
 */
export interface WalkInQueueStats {
  waitingCount: number;
  calledCount: number;
  seatedToday: number;
  cancelledToday: number;
  averageWaitMinutes: number;
}

/**
 * Data required to join walk-in queue
 */
export interface JoinWalkInQueueData {
  customerName: string;
  customerPhone: string;
  partySize?: number;
  preferredStationType?: string;
  preferredMachineId?: string;
  notes?: string;
}

/**
 * Data for seating a customer
 */
export interface SeatCustomerData {
  queueId: string;
  machineId: string;
}

// ============================================================
// REPOSITORY INTERFACE
// ============================================================

export interface IWalkInQueueRepository {
  /**
   * Get queue entry by ID
   */
  getById(id: string): Promise<WalkInQueue | null>;

  /**
   * Get all queue entries
   */
  getAll(): Promise<WalkInQueue[]>;

  /**
   * Get all waiting queue entries (ordered by queue number)
   */
  getWaiting(): Promise<WalkInQueue[]>;

  /**
   * Get queue entries by customer ID
   */
  getByCustomerId(customerId: string): Promise<WalkInQueue[]>;

  /**
   * Get my active queue status (for customer view)
   */
  getMyQueueStatus(customerId: string): Promise<WalkInQueue[]>;

  /**
   * Join the walk-in queue
   */
  join(data: JoinWalkInQueueData): Promise<WalkInQueue>;

  /**
   * Call a customer from the queue (status: waiting → called)
   */
  callCustomer(queueId: string): Promise<WalkInQueue>;

  /**
   * Seat a customer (status: waiting/called → seated)
   * This should also start a session
   */
  seatCustomer(data: SeatCustomerData): Promise<WalkInQueue>;

  /**
   * Cancel a queue entry (status: waiting/called → cancelled)
   */
  cancel(queueId: string, customerId?: string): Promise<boolean>;

  /**
   * Get the next queue number for today
   */
  getNextQueueNumber(): Promise<number>;

  /**
   * Get statistics
   */
  getStats(): Promise<WalkInQueueStats>;
}
