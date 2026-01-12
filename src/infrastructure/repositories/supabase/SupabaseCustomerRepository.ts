import {
  CreateCustomerData,
  Customer,
  CustomerStats,
  ICustomerRepository,
  UpdateCustomerData
} from '@/src/application/repositories/ICustomerRepository';
import { CUSTOMER_CONFIG } from '@/src/config/customerConfig';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getAll(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_all_customers_admin');

    if (error) {
      console.error('Error fetching customers via RPC:', error);
      // Fallback to direct query if RPC fails (assuming user has rights)
      const { data: tableData, error: tableError } = await this.supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (tableError) return [];
      return tableData.map(this.mapToDomain);
    }

    return data.map(this.mapToDomain);
  }

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async search(query: string): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name');

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const { data: created, error } = await this.supabase
      .from('customers')
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const { data: updated, error } = await this.supabase
      .from('customers')
      .update({
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        is_vip: data.isVip,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id);

    return !error;
  }

  async incrementVisit(id: string, playTime: number): Promise<Customer> {
    // This could also be a function in SQL for atomicity
    const { data: current, error: getError } = await this.supabase
      .from('customers')
      .select('visit_count, total_play_time')
      .eq('id', id)
      .single();

    if (getError || !current) throw new Error('Customer not found');

    const { data: updated, error: updateError } = await this.supabase
      .from('customers')
      .update({
        visit_count: (current.visit_count || 0) + 1,
        total_play_time: (current.total_play_time || 0) + playTime,
        last_visit: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return this.mapToDomain(updated);
  }

  async getStats(): Promise<CustomerStats> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('id, is_vip, created_at, last_visit, visit_count');

    if (error || !data) {
        return {
          totalCustomers: 0,
          vipCustomers: 0,
          newCustomersToday: 0,
          returningCustomers: 0,
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      totalCustomers: data.length,
      vipCustomers: data.filter(c => c.is_vip).length,
      newCustomersToday: data.filter(c => new Date(c.created_at || '') >= today).length,
      // Use centralized config for "returning/regular" customer threshold
      returningCustomers: data.filter(c => (c.visit_count || 0) >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS).length,
    };
  }

  async getVipCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('is_vip', true)
      .order('name');

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async getFrequentCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .gte('visit_count', CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS)
      .order('visit_count', { ascending: false });

    if (error) return [];
    return data.map(this.mapToDomain);
  }

    private mapToDomain = (raw: Database['public']['Tables']['customers']['Row']): Customer => {
    return {
      id: raw.id,
      name: raw.name,
      phone: raw.phone,
      email: raw.email || undefined,
      visitCount: raw.visit_count || 0,
      totalPlayTime: raw.total_play_time || 0,
      lastVisit: raw.last_visit || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
      notes: raw.notes || undefined,
      isVip: raw.is_vip || false,
    };
  };
}
