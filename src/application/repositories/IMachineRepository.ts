/**
 * IMachineRepository
 * Repository interface for Machine data access
 * Following Clean Architecture - Application layer
 */

export type MachineStatus = 'available' | 'occupied' | 'maintenance';

export interface Machine {
  id: string;
  name: string;
  description: string;
  position: number;
  imageUrl?: string;
  isActive: boolean;
  status: MachineStatus;
  /** Station type for categorization (e.g., Racing Sim, PS5, PC) */
  type?: string;
  /** Price per hour in THB */
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MachineStats {
  totalMachines: number;
  availableMachines: number;
  occupiedMachines: number;
  maintenanceMachines: number;
}

export interface MachineDashboardDTO {
  machineId: string;
  waitingCount: number;
  playingCount: number;
  estimatedWaitMinutes: number;
  nextPosition: number;
}

export interface CreateMachineData {
  name: string;
  description: string;
  position: number;
  imageUrl?: string;
  type?: string;
  hourlyRate?: number;
}

export interface UpdateMachineData {
  name?: string;
  description?: string;
  position?: number;
  imageUrl?: string;
  isActive?: boolean;
  status?: MachineStatus;
  type?: string;
  hourlyRate?: number;
}

export interface IMachineRepository {
  /**
   * Get machine by ID
   */
  getById(id: string): Promise<Machine | null>;
  getByIds(ids: string[]): Promise<Machine[]>;

  /**
   * Get all machines
   */
  getAll(): Promise<Machine[]>;

  /**
   * Get available machines
   */
  getAvailable(): Promise<Machine[]>;

  /**
   * Create a new machine
   */
  create(data: CreateMachineData): Promise<Machine>;

  /**
   * Update an existing machine
   */
  update(id: string, data: UpdateMachineData): Promise<Machine>;

  /**
   * Delete a machine
   */
  delete(id: string): Promise<boolean>;

  /**
   * Get statistics
   */
  getStats(): Promise<MachineStats>;

  /**
   * Update machine status
   */
  updateStatus(id: string, status: MachineStatus): Promise<Machine>;

  /**
   * Get dashboard info (queue stats per machine)
   */
  getDashboardInfo(): Promise<MachineDashboardDTO[]>;
}
