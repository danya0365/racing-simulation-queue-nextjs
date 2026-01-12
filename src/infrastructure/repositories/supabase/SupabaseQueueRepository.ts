import {
  BackendStatsDTO,
  CreateQueueData,
  IQueueRepository,
  PaginatedResult,
  Queue,
  QueueStats,
  QueueStatus,
  QueueWithStatusDTO,
  UpdateQueueData
} from '@/src/application/repositories/IQueueRepository';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseQueueRepository implements IQueueRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getById(id: string): Promise<Queue | null> {
    try {
      // Try using the guest RPC first to bypass RLS for customer info
      const { data: rpcData, error: rpcError } = await this.supabase
        .rpc('rpc_get_queue_details', { p_queue_id: id });
      
      if (!rpcError && rpcData) {
        // Handle both array (legacy TABLE return) and object (new JSONB return)
        const q = Array.isArray(rpcData)
          ? (rpcData.length > 0 ? rpcData[0] as Database['public']['Functions']['rpc_get_queue_details']['Returns'][number] : null)
          : rpcData as unknown as Database['public']['Functions']['rpc_get_queue_details']['Returns'][number];
        
        if (q) {
          return {
            id: q.id,
            machineId: q.machine_id,
            customerId: q.customer_id,
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
      }

      // Fallback or Admin view (full data)
      const { data, error } = await this.supabase
        .from('queues')
        .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
        .eq('id', id)
        .single();
      
      if (error || !data) return null;

      return this.mapToDomain(data);
    } catch (e) {
      throw e;
    }
  }

  async getByIds(ids: string[]): Promise<Queue[]> {
    if (ids.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('queues')
        .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
        .in('id', ids);
      
      if (error) {
        console.error('Error fetching queues by IDs:', error);
        return [];
      }
      return data.map(this.mapToDomain);
    } catch (e) {
      console.error('Exception fetching queues by IDs:', e);
      return [];
    }
  }

  async getByIdsWithStatus(ids: string[]): Promise<QueueWithStatusDTO[]> {
    if (ids.length === 0) return [];

    try {
      const { data, error } = await this.supabase.rpc('rpc_get_my_queue_status', { p_queue_ids: ids });

      if (error) {
        console.error('Error fetching queues with status RPC:', error);
        return [];
      }

      return (data as Database['public']['Functions']['rpc_get_my_queue_status']['Returns']).map(row => ({
        id: row.id,
        machineId: row.machine_id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        bookingTime: row.booking_time,
        duration: row.duration,
        status: row.status as QueueStatus,
        position: row.queue_position,
        notes: '',
        createdAt: new Date().toISOString(), // RPC doesn't return this, not needed for status
        updatedAt: new Date().toISOString(),
        machineName: row.machine_name,
        queueAhead: row.queue_ahead,
        estimatedWaitMinutes: row.estimated_wait_minutes
      }));
    } catch (e) {
      console.error('Exception fetching queues with status RPC:', e);
      return [];
    }
  }

  async searchByPhone(phone: string, localCustomerId?: string): Promise<Queue[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('rpc_search_queues_by_phone', { 
          p_phone: phone,
          p_local_customer_id: localCustomerId || undefined 
        });
      
      if (error) {
        console.error('Error searching queues by phone:', error);
        return [];
      }
      return (data || []).map(this.mapToDomain);
    } catch (e) {
      console.error('Exception searching queues by phone:', e);
      return [];
    }
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
    
    // Result is { success: boolean, queue_id: string, customer_id: string, position: number }
    const createResult = result as any;
    const queueId = createResult.queue_id;
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

  async cancel(id: string, customerId?: string): Promise<boolean> {
    if (customerId) {
      // For guest cancellation, verify the queue belongs to the customer first
      // Then update status directly
      const { data: queue, error: fetchError } = await this.supabase
        .from('queues')
        .select('id, customer_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !queue) {
        console.warn('Queue not found:', id);
        return false;
      }

      // Verify customer owns this queue
      if (queue.customer_id !== customerId) {
        console.warn('Customer ID mismatch for queue cancellation');
        return false;
      }

      // Only allow cancellation of waiting queues
      if (queue.status !== 'waiting') {
        console.warn('Cannot cancel queue with status:', queue.status);
        return false;
      }

      // Update the queue status to cancelled
      const { error: updateError } = await this.supabase
        .from('queues')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('customer_id', customerId);

      return !updateError;
    }

    // No customerId provided, must be admin/mod manually cancelling
    const { error } = await this.supabase.rpc('rpc_update_queue_status_admin', {
        p_queue_id: id,
        p_status: 'cancelled'
    });
    
    return !error;
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

  private mapToDomain = (raw: {
    id: string;
    machine_id: string;
    customer_id: string;
    booking_time: string;
    duration: number;
    status: string;
    position?: number;
    queue_position?: number;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    customers?: { name: string; phone: string } | null;
    customer_name?: string;
    customer_phone?: string;
    customer_phone_masked?: string;
  }): Queue => {
    return {
      id: raw.id,
      machineId: raw.machine_id,
      customerId: raw.customer_id,
      customerName: raw.customers?.name || raw.customer_name || 'Unknown',
      customerPhone: raw.customers?.phone || raw.customer_phone || raw.customer_phone_masked || '',
      bookingTime: raw.booking_time,
      duration: raw.duration,
      status: raw.status as QueueStatus,
      position: raw.position || raw.queue_position || 0,
      notes: raw.notes || '',
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
    };
  };

  async getActiveAndRecent(): Promise<Queue[]> {
    // Use direct query approach (works without RPC being registered in types)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await this.supabase
      .from('queues')
      .select('*, machines!queues_machine_id_fkey(name), customers(name, phone)')
      .or(`status.in.(waiting,playing),and(status.in.(completed,cancelled),updated_at.gte.${twentyFourHoursAgo.toISOString()})`)
      .order('booking_time', { ascending: true });

    if (error) {
      console.error('Error fetching active and recent queues:', error);
      return [];
    }
    return data.map(this.mapToDomain);
  }

  async resetMachineQueue(machineId: string): Promise<{ cancelledCount: number; completedCount: number }> {
    // Direct implementation until RPC is available
    // 1. Cancel waiting queues
    const { data: waitingData } = await this.supabase
      .from('queues')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('machine_id', machineId)
      .eq('status', 'waiting')
      .select('id');

    // 2. Complete playing queues
    const { data: playingData } = await this.supabase
      .from('queues')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('machine_id', machineId)
      .eq('status', 'playing')
      .select('id');

    // 3. Reset machine status
    await this.supabase
      .from('machines')
      .update({ status: 'available', current_queue_id: null, updated_at: new Date().toISOString() })
      .eq('id', machineId);

    return {
      cancelledCount: waitingData?.length || 0,
      completedCount: playingData?.length || 0,
    };
  }

  async getBackendStats(): Promise<BackendStatsDTO | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('rpc_get_backend_dashboard_stats');
      
      if (error) {
        console.error('Error getting backend stats:', error);
        return null;
      }
      
      const stats = data as Database['public']['Functions']['rpc_get_backend_dashboard_stats']['Returns'];
      return Array.isArray(stats) && stats.length > 0 ? stats[0] : null;
    } catch (e) {
      console.error('Exception getting backend stats:', e);
      return null;
    }
  }
}
