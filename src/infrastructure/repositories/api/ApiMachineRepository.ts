/**
 * ApiMachineRepository
 * Implements IMachineRepository using API calls instead of direct Supabase connection
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 */

'use client';

import {
    CreateMachineData,
    IMachineRepository,
    Machine,
    MachineDashboardDTO,
    MachineStats,
    MachineStatus,
    UpdateMachineData,
} from '@/src/application/repositories/IMachineRepository';

export class ApiMachineRepository implements IMachineRepository {
  private baseUrl = '/api/machines';

  /**
   * Get machine by ID
   */
  async getById(id: string): Promise<Machine | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลเครื่องได้');
    }
    return res.json();
  }

  /**
   * Get machines by IDs
   */
  async getByIds(ids: string[]): Promise<Machine[]> {
    // For multiple IDs, call getById for each (could optimize with batch endpoint later)
    const results = await Promise.all(
      ids.map(id => this.getById(id))
    );
    return results.filter((m): m is Machine => m !== null);
  }

  /**
   * Get all machines
   */
  async getAll(): Promise<Machine[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลเครื่องได้');
    }
    return res.json();
  }

  /**
   * Get available machines
   */
  async getAvailable(): Promise<Machine[]> {
    const res = await fetch(`${this.baseUrl}?action=available`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลเครื่องได้');
    }
    return res.json();
  }

  /**
   * Create a new machine
   */
  async create(data: CreateMachineData): Promise<Machine> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถสร้างเครื่องได้');
    }
    return res.json();
  }

  /**
   * Update an existing machine
   */
  async update(id: string, data: UpdateMachineData): Promise<Machine> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตเครื่องได้');
    }
    return res.json();
  }

  /**
   * Delete a machine
   */
  async delete(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถลบเครื่องได้');
    }
    return true;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<MachineStats> {
    const res = await fetch(`${this.baseUrl}?action=stats`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถิติได้');
    }
    return res.json();
  }

  /**
   * Update machine status
   */
  async updateStatus(id: string, status: MachineStatus): Promise<Machine> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', status }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตสถานะได้');
    }
    return res.json();
  }

  /**
   * Get dashboard info (queue stats per machine)
   */
  async getDashboardInfo(): Promise<MachineDashboardDTO[]> {
    const res = await fetch(`${this.baseUrl}?action=dashboard`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล Dashboard ได้');
    }
    return res.json();
  }
}
