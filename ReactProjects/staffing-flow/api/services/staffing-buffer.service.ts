import { supabase } from '../lib/supabase';
import { CreateStaffingBufferInput, UpdateStaffingBufferInput, StaffingBufferQueryInput } from '../schemas/staffing-buffer.schema';
import { DatabaseError } from '../errors';

export const staffingBufferService = {
  /**
   * Get all staffing buffers with optional filtering
   */
  getAll: async (query: StaffingBufferQueryInput = {}) => {
    try {
      let dbQuery = supabase.from('staffing_buffers').select('*');

      if (query.organizationId) {
        dbQuery = dbQuery.eq('organization_id', query.organizationId);
      }

      if (query.departmentId) {
        dbQuery = dbQuery.eq('department_id', query.departmentId);
      }

      if (query.isActive !== undefined) {
        const isActive = query.isActive === 'true';
        dbQuery = dbQuery.eq('is_active', isActive);
      }

      if (query.search) {
        dbQuery = dbQuery.ilike('name', `%${query.search}%`);
      }

      dbQuery = dbQuery.order('effective_date', { ascending: false });

      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }

      if (query.page && query.limit) {
        const offset = (query.page - 1) * query.limit;
        dbQuery = dbQuery.range(offset, offset + query.limit - 1);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Staffing buffers query error:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Staffing buffers service error:', err);
      return [];
    }
  },

  /**
   * Get a single staffing buffer by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('staffing_buffers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch staffing buffer: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new staffing buffer
   */
  create: async (bufferData: CreateStaffingBufferInput) => {
    try {
      console.log('Creating staffing buffer with data:', bufferData);

      const { data, error } = await supabase
        .from('staffing_buffers')
        .insert({
          ...bufferData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Staffing buffer creation error:', error);
        throw new DatabaseError(`Failed to create staffing buffer: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('Staffing buffer service error:', err);
      throw new DatabaseError(`Failed to create staffing buffer: ${err.message}`);
    }
  },

  /**
   * Update an existing staffing buffer
   */
  update: async (id: string, bufferData: UpdateStaffingBufferInput) => {
    const { data, error } = await supabase
      .from('staffing_buffers')
      .update({
        ...bufferData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update staffing buffer: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a staffing buffer
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('staffing_buffers').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete staffing buffer: ${error.message}`);
    }
  },

  /**
   * Get applicable buffers for a specific time and department
   */
  getApplicableBuffers: async (organizationId: string, departmentId: string, date: Date) => {
    try {
      let dbQuery = supabase
        .from('staffing_buffers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .lte('effective_date', date.toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${date.toISOString().split('T')[0]}`);

      if (departmentId) {
        dbQuery = dbQuery.or(`department_id.eq.${departmentId},department_id.is.null`);
      } else {
        dbQuery = dbQuery.is('department_id', null);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error fetching applicable buffers:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in getApplicableBuffers:', err);
      return [];
    }
  },
};
