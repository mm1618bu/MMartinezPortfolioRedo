import { supabase } from '../lib/supabase';
import { CreateLaborStandardInput, UpdateLaborStandardInput, LaborStandardQueryInput } from '../schemas/labor-standard.schema';
import { DatabaseError } from '../errors';

export const laborStandardService = {
  /**
   * Get all labor standards with optional filtering
   */
  getAll: async (query: LaborStandardQueryInput = {}) => {
    try {
      let dbQuery = supabase
        .from('labor_standards')
        .select('*');

      if (query.organizationId) {
        dbQuery = dbQuery.eq('organization_id', query.organizationId);
      }

      if (query.departmentId) {
        dbQuery = dbQuery.eq('department_id', query.departmentId);
      }

      dbQuery = dbQuery.order('effective_date', { ascending: false });

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Labor standards query error:', error);
        // Return empty array on error instead of throwing
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Labor standards service error:', err);
      // Return empty array on exception
      return [];
    }
  },

  /**
   * Get a single labor standard by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('labor_standards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch labor standard: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new labor standard
   */
  create: async (laborStandardData: CreateLaborStandardInput) => {
    try {
      console.log('Creating labor standard with data:', laborStandardData);
      
      const { data, error } = await supabase
        .from('labor_standards')
        .insert({
          ...laborStandardData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Labor standard creation error:', error);
        throw new DatabaseError(`Failed to create labor standard: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('Labor standard service error:', err);
      throw new DatabaseError(`Failed to create labor standard: ${err.message}`);
    }
  },

  /**
   * Update an existing labor standard
   */
  update: async (id: string, laborStandardData: UpdateLaborStandardInput) => {
    const { data, error } = await supabase
      .from('labor_standards')
      .update({
        ...laborStandardData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update labor standard: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a labor standard
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('labor_standards').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete labor standard: ${error.message}`);
    }
  },

  /**
   * Get active labor standard for a specific task type and date
   */
  getActiveStandard: async (taskType: string, departmentId: string, effectiveDate: string) => {
    const { data, error } = await supabase
      .from('labor_standards')
      .select('*, department:departments(id, name)')
      .eq('task_type', taskType)
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .lte('effective_date', effectiveDate)
      .or(`end_date.is.null,end_date.gte.${effectiveDate}`)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Return null if not found instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Failed to fetch active labor standard: ${error.message}`);
    }

    return data;
  },

  /**
   * Get all task types
   */
  getTaskTypes: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('labor_standards')
      .select('task_type')
      .eq('organization_id', organizationId)
      .order('task_type');

    if (error) {
      throw new DatabaseError(`Failed to fetch task types: ${error.message}`);
    }

    // Get unique task types
    const taskTypes = [...new Set(data.map((item) => item.task_type))];
    return taskTypes;
  },

  /**
   * Calculate productivity based on standard
   */
  calculateProductivity: async (standardId: string, actualUnits: number, actualHours: number) => {
    const standard = await laborStandardService.getById(standardId);

    if (!standard) {
      throw new DatabaseError('Labor standard not found');
    }

    let productivity = 0;
    let variance = 0;

    if (standard.standard_units_per_hour) {
      const expectedUnits = standard.standard_units_per_hour * actualHours;
      productivity = (actualUnits / expectedUnits) * 100;
      variance = actualUnits - expectedUnits;
    } else if (standard.standard_hours_per_unit) {
      const expectedHours = standard.standard_hours_per_unit * actualUnits;
      productivity = (expectedHours / actualHours) * 100;
      variance = expectedHours - actualHours;
    }

    return {
      standard_id: standardId,
      standard_name: standard.name,
      actual_units: actualUnits,
      actual_hours: actualHours,
      productivity_percentage: Math.round(productivity * 100) / 100,
      variance,
      meets_quality_threshold: standard.quality_threshold_percentage
        ? productivity >= standard.quality_threshold_percentage
        : null,
    };
  },
};
