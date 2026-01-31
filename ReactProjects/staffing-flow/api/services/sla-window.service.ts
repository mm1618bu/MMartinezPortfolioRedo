import { supabase } from '../lib/supabase';
import { CreateSLAWindowInput, UpdateSLAWindowInput, SLAWindowQueryInput } from '../schemas/sla-window.schema';
import { DatabaseError } from '../errors';

export const slaWindowService = {
  /**
   * Get all SLA windows with optional filtering
   */
  getAll: async (query: SLAWindowQueryInput = {}) => {
    try {
      let dbQuery = supabase.from('sla_windows').select('*');

      if (query.organizationId) {
        dbQuery = dbQuery.eq('organization_id', query.organizationId);
      }

      if (query.departmentId) {
        dbQuery = dbQuery.eq('department_id', query.departmentId);
      }

      if (query.dayOfWeek) {
        dbQuery = dbQuery.eq('day_of_week', query.dayOfWeek);
      }

      if (query.priority) {
        dbQuery = dbQuery.eq('priority', query.priority);
      }

      if (query.isActive !== undefined) {
        const isActive = query.isActive === 'true';
        dbQuery = dbQuery.eq('is_active', isActive);
      }

      if (query.search) {
        dbQuery = dbQuery.ilike('name', `%${query.search}%`);
      }

      dbQuery = dbQuery.order('effective_date', { ascending: false }).order('start_time', { ascending: true });

      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }

      if (query.page && query.limit) {
        const offset = (query.page - 1) * query.limit;
        dbQuery = dbQuery.range(offset, offset + query.limit - 1);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('SLA windows query error:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('SLA windows service error:', err);
      return [];
    }
  },

  /**
   * Get a single SLA window by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('sla_windows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch SLA window: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new SLA window
   */
  create: async (slaData: CreateSLAWindowInput) => {
    try {
      console.log('Creating SLA window with data:', slaData);

      const { data, error } = await supabase
        .from('sla_windows')
        .insert({
          ...slaData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('SLA window creation error:', error);
        throw new DatabaseError(`Failed to create SLA window: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('SLA window service error:', err);
      throw new DatabaseError(`Failed to create SLA window: ${err.message}`);
    }
  },

  /**
   * Update an existing SLA window
   */
  update: async (id: string, slaData: UpdateSLAWindowInput) => {
    const { data, error } = await supabase
      .from('sla_windows')
      .update({
        ...slaData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update SLA window: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete an SLA window
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('sla_windows').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete SLA window: ${error.message}`);
    }
  },

  /**
   * Get applicable SLA windows for a specific time and department
   */
  getApplicableSLAs: async (organizationId: string, departmentId: string | null, date: Date, time: string) => {
    try {
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

      let dbQuery = supabase
        .from('sla_windows')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .lte('effective_date', date.toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${date.toISOString().split('T')[0]}`)
        .lte('start_time', time)
        .gte('end_time', time);

      if (departmentId) {
        dbQuery = dbQuery.or(`department_id.eq.${departmentId},department_id.is.null`);
      } else {
        dbQuery = dbQuery.is('department_id', null);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error fetching applicable SLAs:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in getApplicableSLAs:', err);
      return [];
    }
  },
};
