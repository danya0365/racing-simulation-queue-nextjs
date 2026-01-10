/**
 * IQueueRepository
 * Repository interface for Queue data access
 * Following Clean Architecture - Application layer
 */

export type QueueStatus = 'waiting' | 'playing' | 'completed' | 'cancelled';

export interface Queue {
  id: string;
  machineId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number; // in minutes
  status: QueueStatus;
  position: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueWithStatusDTO extends Queue {
  machineName: string;
  queueAhead: number;
  estimatedWaitMinutes: number;
}

export interface QueueStats {
  totalQueues: number;
  waitingQueues: number;
  playingQueues: number;
  completedQueues: number;
  cancelledQueues: number;
}

export interface CreateQueueData {
  machineId: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  notes?: string;
}

export interface UpdateQueueData {
  machineId?: string;
  customerName?: string;
  customerPhone?: string;
  bookingTime?: string;
  duration?: number;
  status?: QueueStatus;
  notes?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface IQueueRepository {
  /**
   * Get queue by ID
   */
  getById(id: string): Promise<Queue | null>;

  /**
   * Get queues by IDs
   */
  getByIds(ids: string[]): Promise<Queue[]>;

  /**
   * Get queues by IDs with calculated status (RPC)
   */
  getByIdsWithStatus(ids: string[]): Promise<QueueWithStatusDTO[]>;

  /**
   * Search queues by phone number (RPC optimized)
   */
  searchByPhone(phone: string): Promise<Queue[]>;

  /**
   * Get all queues
   */
  getAll(): Promise<Queue[]>;

  /**
   * Get queues by machine ID
   */
  getByMachineId(machineId: string): Promise<Queue[]>;

  /**
   * Get waiting queues
   */
  getWaiting(): Promise<Queue[]>;

  /**
   * Get today's queues
   */
  getToday(): Promise<Queue[]>;

  /**
   * Get paginated queues
   */
  getPaginated(page: number, perPage: number): Promise<PaginatedResult<Queue>>;

  /**
   * Create a new queue
   */
  create(data: CreateQueueData): Promise<Queue>;

  /**
   * Update an existing queue
   */
  update(id: string, data: UpdateQueueData): Promise<Queue>;

  /**
   * Delete a queue
   */
  delete(id: string): Promise<boolean>;

  /**
   * Get statistics
   */
  getStats(): Promise<QueueStats>;

  /**
   * Update queue status
   */
  updateStatus(id: string, status: QueueStatus): Promise<Queue>;

  /**
   * Cancel a queue (supports guest verification)
   */
  cancel(id: string, customerId?: string): Promise<boolean>;

  /**
   * Get next queue position for a machine
   */
  getNextPosition(machineId: string): Promise<number>;

  /**
   * Get active queues (waiting/playing) + recently finished (24 hours)
   * For 24-hour operations
   */
  getActiveAndRecent(): Promise<Queue[]>;

  /**
   * Reset all queues for a machine
   * Cancels waiting, completes playing, resets position
   */
  resetMachineQueue(machineId: string): Promise<{ cancelledCount: number; completedCount: number }>;

  /**
   * Get backend dashboard stats (RPC)
   */
  getBackendStats(): Promise<any>;
}
