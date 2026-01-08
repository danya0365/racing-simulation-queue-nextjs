import {
  CreateQueueData,
  IQueueRepository,
  PaginatedResult,
  Queue,
  QueueStats,
  QueueStatus,
  UpdateQueueData
} from '@/src/application/repositories/IQueueRepository';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseQueueRepository implements IQueueRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getById(id: string): Promise<Queue | null> {
    // Try using the guest RPC first to bypass RLS for customer info
    const { data: rpcData, error: rpcError } = await this.supabase
      .rpc('rpc_get_queue_details', { p_queue_id: id });

    if (!rpcError && rpcData && (rpcData as any).length > 0) {
      const q = (rpcData as any)[0];
      return {
        id: q.id,
        machineId: q.machine_id,
        customerName: q.customer_name,
        customerPhone: q.customer_phone_masked,
        bookingTime: q.booking_time,
        duration: q.duration,
        status: q.status as QueueStatus,
        position: q.queue_position,
        notes: q.notes || '',
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      };
    }

    // Fallback or Admin view (full data)
    const { data, error } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  async getAll(): Promise<Queue[]> {
    const { data, error } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .order('booking_time', { ascending: true });

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async getByMachineId(machineId: string): Promise<Queue[]> {
    const { data, error } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .eq('machine_id', machineId)
      .order('position', { ascending: true });

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async getWaiting(): Promise<Queue[]> {
    // We can use the RPC for today's queues or query directly
    // Let's use direct query to get full data for internal use, 
    // but filter by waiting status
    const { data, error } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .eq('status', 'waiting')
      .order('booking_time', { ascending: true });

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async getToday(): Promise<Queue[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .gte('booking_time', today.toISOString())
      .lt('booking_time', tomorrow.toISOString())
      .order('booking_time', { ascending: true });

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async getPaginated(page: number, perPage: number): Promise<PaginatedResult<Queue>> {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
        return { data: [], total: 0, page, perPage };
    }

    return {
      data: data.map(this.mapToDomain),
      total: count || 0,
      page,
      perPage,
    };
  }

  async create(data: CreateQueueData): Promise<Queue> {
    // For creation, we should use the RPC which handles customer creation/lookup
    const { data: result, error } = await this.supabase.rpc('rpc_create_booking', {
        p_customer_name: data.customerName,
        p_customer_phone: data.customerPhone,
        p_machine_id: data.machineId,
        p_duration: data.duration,
        p_notes: data.notes || '',
    });

    if (error) throw error;
    
    // Result is { success: boolean, queue_id: string, position: number }
    const queueId = (result as any).queue_id;
    const queue = await this.getById(queueId);
    if (!queue) throw new Error('Failed to retrieve created queue');
    
    return queue;
  }

  async update(id: string, data: UpdateQueueData): Promise<Queue> {
    const { data: updated, error } = await this.supabase
      .from('queues')
      .update({
        machine_id: data.machineId,
        duration: data.duration,
        status: data.status,
        notes: data.notes,
        booking_time: data.bookingTime,
      })
      .eq('id', id)
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .single();

    if (error) throw error;
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('queues')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getStats(): Promise<QueueStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabase
      .from('queues')
      .select('status')
      .gte('booking_time', today.toISOString());

    if (error || !data) {
      return {
        totalQueues: 0,
        waitingQueues: 0,
        playingQueues: 0,
        completedQueues: 0,
        cancelledQueues: 0,
      };
    }

    return {
      totalQueues: data.length,
      waitingQueues: data.filter(q => q.status === 'waiting').length,
      playingQueues: data.filter(q => q.status === 'playing').length,
      completedQueues: data.filter(q => q.status === 'completed').length,
      cancelledQueues: data.filter(q => q.status === 'cancelled').length,
    };
  }

  async updateStatus(id: string, status: QueueStatus): Promise<Queue> {
    // Admin RPC handles status updates and machine sync
    const { error } = await this.supabase.rpc('rpc_update_queue_status_admin', {
        p_queue_id: id,
        p_status: status as Database["public"]["Enums"]["queue_status"]
    });

    if (error) throw error;
    
    const queue = await this.getById(id);
    if (!queue) throw new Error('Failed to retrieve updated queue');
    return queue;
  }

  async getNextPosition(machineId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('queues')
      .select('position')
      .eq('machine_id', machineId)
      .in('status', ['waiting', 'playing'])
      .order('position', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return 1;
    return data[0].position + 1;
  }

  private mapToDomain(raw: any): Queue {
    return {
      id: raw.id,
      machineId: raw.machine_id,
      customerName: raw.customers?.name || 'Unknown',
      customerPhone: raw.customers?.phone || '',
      bookingTime: raw.booking_time,
      duration: raw.duration,
      status: raw.status as QueueStatus,
      position: raw.position,
      notes: raw.notes || '',
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}
