import {
  CreateMachineData,
  IMachineRepository,
  Machine,
  MachineStats,
  MachineStatus,
  UpdateMachineData
} from '@/src/application/repositories/IMachineRepository';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseMachineRepository implements IMachineRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getById(id: string): Promise<Machine | null> {
    const { data, error } = await this.supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  async getByIds(ids: string[]): Promise<Machine[]> {
    if (ids.length === 0) return [];
    
    const { data, error } = await this.supabase
      .from('machines')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Error fetching machines by IDs:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getAll(): Promise<Machine[]> {
    const { data, error } = await this.supabase
      .from('machines')
      .select('*')
      .order('position');

    if (error) {
      console.error('Error fetching machines:', error);
      return [];
    }

    return data.map(this.mapToDomain);
  }

  async getAvailable(): Promise<Machine[]> {
    const machines = await this.getAll();
    return machines.filter(m => m.isActive && m.status === 'available');
  }

  async create(data: CreateMachineData): Promise<Machine> {
    const { data: created, error } = await this.supabase
      .from('machines')
      .insert({
        name: data.name,
        description: data.description,
        position: data.position,
        image_url: data.imageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateMachineData): Promise<Machine> {
    const { data: updated, error } = await this.supabase
      .from('machines')
      .update({
        name: data.name,
        description: data.description,
        position: data.position,
        image_url: data.imageUrl,
        is_active: data.isActive,
        status: data.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('machines')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getStats(): Promise<MachineStats> {
    const { data: machines, error } = await this.supabase
      .from('machines')
      .select('status, is_active');

    if (error || !machines) {
      return {
        totalMachines: 0,
        availableMachines: 0,
        occupiedMachines: 0,
        maintenanceMachines: 0,
      };
    }

    const activeMachines = machines.filter(m => m.is_active);

    return {
      totalMachines: activeMachines.length,
      availableMachines: activeMachines.filter(m => m.status === 'available').length,
      occupiedMachines: activeMachines.filter(m => m.status === 'occupied').length,
      maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
    };
  }

  async updateStatus(id: string, status: MachineStatus): Promise<Machine> {
    return this.update(id, { status });
  }

  async getDashboardInfo(): Promise<import("@/src/application/repositories/IMachineRepository").MachineDashboardDTO[]> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_machine_dashboard_info');

    if (error) {
      console.error('Error fetching machine dashboard info:', error);
      return [];
    }

    return (data as Database['public']['Functions']['rpc_get_machine_dashboard_info']['Returns']).map(row => ({
      machineId: row.machine_id,
      waitingCount: row.waiting_count,
      playingCount: row.playing_count,
      estimatedWaitMinutes: row.estimated_wait_minutes,
      nextPosition: row.next_position,
    }));
  }

  private mapToDomain = (raw: Database['public']['Tables']['machines']['Row']): Machine => {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      position: raw.position,
      imageUrl: raw.image_url || undefined,
      isActive: raw.is_active,
      status: raw.status as MachineStatus,
      currentQueueId: raw.current_queue_id || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
    };
  };
}
