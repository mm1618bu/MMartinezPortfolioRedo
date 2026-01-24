import { supabase } from '../lib/supabase';
import { DemandQueryInput, UploadDemandCSVInput } from '../schemas/demand.schema';
import { Demand } from '../types/demand.types';
import { DatabaseError } from '../errors';
import { parseCSV, validateCSVHeaders, ParseError } from '../utils/csv-parser';

export const demandService = {
  /**
   * Get all demand records with optional filtering
   */
  getAll: async (query: DemandQueryInput = {}) => {
    let dbQuery = supabase
      .from('demands')
      .select('*, department:departments(id, name)', { count: 'exact' });

    if (query.organizationId) {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.departmentId) {
      dbQuery = dbQuery.eq('department_id', query.departmentId);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('date', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('date', query.endDate);
    }

    if (query.shiftType) {
      dbQuery = dbQuery.eq('shift_type', query.shiftType);
    }

    if (query.priority) {
      dbQuery = dbQuery.eq('priority', query.priority);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    dbQuery = dbQuery.range(from, to).order('date', { ascending: true });

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new DatabaseError(`Failed to fetch demands: ${error.message}`);
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  /**
   * Get a single demand record by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('demands')
      .select('*, department:departments(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch demand: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a single demand record
   */
  create: async (demandData: Omit<Demand, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('demands')
      .insert({
        ...demandData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create demand: ${error.message}`);
    }

    return data;
  },

  /**
   * Update an existing demand record
   */
  update: async (id: string, demandData: Partial<Omit<Demand, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('demands')
      .update({
        ...demandData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update demand: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a demand record
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('demands').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete demand: ${error.message}`);
    }
  },

  /**
   * Upload and process CSV demand data
   */
  uploadCSV: async (csvContent: string, uploadOptions: UploadDemandCSVInput) => {
    // Validate headers first
    const headerValidation = validateCSVHeaders(csvContent);
    if (!headerValidation.valid) {
      return {
        success: false,
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        errors: headerValidation.errors.map((msg) => ({
          row: 0,
          message: msg,
        })),
      };
    }

    // Parse CSV
    const parseResult = parseCSV(csvContent);

    // If validate_only mode, return validation results
    if (uploadOptions.validate_only) {
      return {
        success: parseResult.errors.length === 0,
        total_rows: parseResult.totalRows,
        valid_rows: parseResult.records.length,
        invalid_rows: parseResult.errors.length,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      };
    }

    // Process valid records
    let insertedRows = 0;
    let updatedRows = 0;
    const processingErrors: ParseError[] = [...parseResult.errors];

    for (const record of parseResult.records) {
      try {
        // Resolve department_id if department_name is provided
        let departmentId = record.department_id;

        if (!departmentId && record.department_name) {
          const { data: department } = await supabase
            .from('departments')
            .select('id')
            .eq('name', record.department_name)
            .eq('organization_id', uploadOptions.organization_id)
            .single();

          if (department) {
            departmentId = department.id;
          } else {
            throw new Error(`Department not found: ${record.department_name}`);
          }
        }

        if (!departmentId) {
          throw new Error('Department ID could not be determined');
        }

        // Check if record already exists
        if (uploadOptions.override_existing) {
          const { data: existing } = await supabase
            .from('demands')
            .select('id')
            .eq('date', record.date)
            .eq('department_id', departmentId)
            .eq('organization_id', uploadOptions.organization_id)
            .maybeSingle();

          if (existing) {
            // Update existing record
            await supabase
              .from('demands')
              .update({
                shift_type: record.shift_type,
                start_time: record.start_time,
                end_time: record.end_time,
                required_employees: record.required_employees,
                required_skills: record.required_skills,
                priority: record.priority,
                notes: record.notes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            updatedRows++;
            continue;
          }
        }

        // Insert new record
        await supabase.from('demands').insert({
          date: record.date,
          department_id: departmentId,
          shift_type: record.shift_type,
          start_time: record.start_time,
          end_time: record.end_time,
          required_employees: record.required_employees,
          required_skills: record.required_skills,
          priority: record.priority,
          notes: record.notes,
          organization_id: uploadOptions.organization_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        insertedRows++;
      } catch (err: any) {
        processingErrors.push({
          row: parseResult.records.indexOf(record) + 2,
          message: `Failed to process record: ${err.message}`,
        });
      }
    }

    return {
      success: processingErrors.length === 0,
      total_rows: parseResult.totalRows,
      valid_rows: parseResult.records.length,
      invalid_rows: processingErrors.length,
      inserted_rows: insertedRows,
      updated_rows: updatedRows,
      errors: processingErrors,
      warnings: parseResult.warnings,
    };
  },

  /**
   * Get demand statistics
   */
  getStatistics: async (organizationId: string, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('demands')
      .select('required_employees, priority, department_id')
      .eq('organization_id', organizationId);

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch demand statistics: ${error.message}`);
    }

    const totalDemand = data.reduce((sum, d) => sum + d.required_employees, 0);
    const uniqueDepartments = new Set(data.map((d) => d.department_id)).size;
    const priorityCounts = {
      low: data.filter((d) => d.priority === 'low').length,
      medium: data.filter((d) => d.priority === 'medium').length,
      high: data.filter((d) => d.priority === 'high').length,
      critical: data.filter((d) => d.priority === 'critical').length,
    };

    return {
      totalRecords: data.length,
      totalDemand,
      averageDemand: data.length > 0 ? totalDemand / data.length : 0,
      uniqueDepartments,
      priorityCounts,
    };
  },
};
