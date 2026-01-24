import { supabase } from '../lib/supabase';
import {
  DemandGridQuery,
  DemandGridResponse,
  BulkDeleteInput,
  BulkUpdateInput,
  ExportInput,
} from '../schemas/demand-grid.schema';
import { DatabaseError } from '../errors';
import { parse } from 'json2csv';

export const demandGridService = {
  /**
   * Get demands with advanced grid features
   */
  async getGridData(query: DemandGridQuery): Promise<DemandGridResponse> {
    let dbQuery = supabase
      .from('demands')
      .select(
        `
        id,
        date,
        shift_type,
        start_time,
        end_time,
        required_employees,
        required_skills,
        priority,
        notes,
        created_at,
        updated_at,
        department:departments(id, name, description)
      `,
        { count: 'exact' }
      );

    // Required organization filter
    dbQuery = dbQuery.eq('organization_id', query.organizationId);

    // Department filter (multiple)
    if (query.departmentIds && query.departmentIds.length > 0) {
      dbQuery = dbQuery.in('department_id', query.departmentIds);
    }

    // Shift type filter (multiple)
    if (query.shiftTypes && query.shiftTypes.length > 0) {
      dbQuery = dbQuery.in('shift_type', query.shiftTypes);
    }

    // Priority filter (multiple)
    if (query.priorities && query.priorities.length > 0) {
      dbQuery = dbQuery.in('priority', query.priorities);
    }

    // Date range
    if (query.startDate) {
      dbQuery = dbQuery.gte('date', query.startDate);
    }
    if (query.endDate) {
      dbQuery = dbQuery.lte('date', query.endDate);
    }

    // Employee count range
    if (query.minEmployees !== undefined) {
      dbQuery = dbQuery.gte('required_employees', query.minEmployees);
    }
    if (query.maxEmployees !== undefined) {
      dbQuery = dbQuery.lte('required_employees', query.maxEmployees);
    }

    // Search across multiple fields
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      dbQuery = dbQuery.or(
        `notes.ilike.${searchTerm},department.name.ilike.${searchTerm}`
      );
    }

    // Sorting
    if (query.sortBy) {
      const ascending = query.sortOrder === 'asc';
      
      switch (query.sortBy) {
        case 'department':
          dbQuery = dbQuery.order('department(name)', { ascending });
          break;
        case 'date':
        case 'shift_type':
        case 'required_employees':
        case 'priority':
        case 'created_at':
          dbQuery = dbQuery.order(query.sortBy, { ascending });
          break;
      }
    } else {
      // Default sort by date descending
      dbQuery = dbQuery.order('date', { ascending: false });
    }

    // Pagination
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new DatabaseError(`Failed to fetch grid data: ${error.message}`);
    }

    // Get available filter options
    const filterOptions = await this.getFilterOptions(query.organizationId);

    const totalPages = Math.ceil((count || 0) / query.pageSize);

    return {
      data: data || [],
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: count || 0,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrevious: query.page > 1,
      },
      filters: {
        applied: {
          departmentIds: query.departmentIds,
          shiftTypes: query.shiftTypes,
          priorities: query.priorities,
          startDate: query.startDate,
          endDate: query.endDate,
          minEmployees: query.minEmployees,
          maxEmployees: query.maxEmployees,
          search: query.search,
        },
        available: filterOptions,
      },
      sort: {
        field: query.sortBy,
        order: query.sortOrder,
      },
    };
  },

  /**
   * Get available filter options for dropdowns
   */
  async getFilterOptions(organizationId: string) {
    // Get departments
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('name');

    // Get distinct shift types
    const { data: shiftTypes } = await supabase
      .from('demands')
      .select('shift_type')
      .eq('organization_id', organizationId)
      .not('shift_type', 'is', null);

    const uniqueShiftTypes = [
      ...new Set(shiftTypes?.map((d) => d.shift_type).filter(Boolean)),
    ];

    return {
      departments: departments || [],
      shiftTypes: uniqueShiftTypes.map((type) => ({ value: type, label: type })),
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    };
  },

  /**
   * Create a single demand
   */
  async createDemand(data: any) {
    const { data: demand, error } = await supabase
      .from('demands')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create demand: ${error.message}`);
    }

    return demand;
  },

  /**
   * Update a single demand
   */
  async updateDemand(id: string, organizationId: string, data: any) {
    // Verify ownership
    const { data: existing } = await supabase
      .from('demands')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!existing) {
      throw new DatabaseError('Demand not found or access denied');
    }

    const { data: demand, error } = await supabase
      .from('demands')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update demand: ${error.message}`);
    }

    return demand;
  },

  /**
   * Delete a single demand
   */
  async deleteDemand(id: string, organizationId: string) {
    // Verify ownership
    const { data: existing } = await supabase
      .from('demands')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!existing) {
      throw new DatabaseError('Demand not found or access denied');
    }

    const { error } = await supabase.from('demands').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete demand: ${error.message}`);
    }

    return { success: true };
  },

  /**
   * Bulk delete demands
   */
  async bulkDelete(input: BulkDeleteInput) {
    // Verify all records belong to organization
    const { data: existing } = await supabase
      .from('demands')
      .select('id')
      .in('id', input.ids)
      .eq('organization_id', input.organizationId);

    if (!existing || existing.length !== input.ids.length) {
      throw new DatabaseError('Some demands not found or access denied');
    }

    const { error } = await supabase.from('demands').delete().in('id', input.ids);

    if (error) {
      throw new DatabaseError(`Failed to bulk delete: ${error.message}`);
    }

    return {
      success: true,
      deletedCount: input.ids.length,
    };
  },

  /**
   * Bulk update demands
   */
  async bulkUpdate(input: BulkUpdateInput) {
    // Verify all records belong to organization
    const { data: existing } = await supabase
      .from('demands')
      .select('id')
      .in('id', input.ids)
      .eq('organization_id', input.organizationId);

    if (!existing || existing.length !== input.ids.length) {
      throw new DatabaseError('Some demands not found or access denied');
    }

    const updateData = {
      ...input.updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('demands')
      .update(updateData)
      .in('id', input.ids)
      .select();

    if (error) {
      throw new DatabaseError(`Failed to bulk update: ${error.message}`);
    }

    return {
      success: true,
      updatedCount: data?.length || 0,
      updated: data,
    };
  },

  /**
   * Export demands to CSV/JSON
   */
  async exportData(input: ExportInput) {
    let dbQuery = supabase
      .from('demands')
      .select('*, department:departments(name)')
      .eq('organization_id', input.organizationId);

    // Apply filters if provided
    if (input.filters) {
      if (input.filters.departmentIds && input.filters.departmentIds.length > 0) {
        dbQuery = dbQuery.in('department_id', input.filters.departmentIds);
      }
      if (input.filters.shiftTypes && input.filters.shiftTypes.length > 0) {
        dbQuery = dbQuery.in('shift_type', input.filters.shiftTypes);
      }
      if (input.filters.priorities && input.filters.priorities.length > 0) {
        dbQuery = dbQuery.in('priority', input.filters.priorities);
      }
      if (input.filters.startDate) {
        dbQuery = dbQuery.gte('date', input.filters.startDate);
      }
      if (input.filters.endDate) {
        dbQuery = dbQuery.lte('date', input.filters.endDate);
      }
    }

    dbQuery = dbQuery.order('date', { ascending: true });

    const { data, error } = await dbQuery;

    if (error) {
      throw new DatabaseError(`Failed to export data: ${error.message}`);
    }

    // Transform data for export
    const exportData = (data || []).map((record: any) => {
      const transformed: any = {
        date: record.date,
        department: record.department?.name || '',
        shift_type: record.shift_type || '',
        start_time: record.start_time || '',
        end_time: record.end_time || '',
        required_employees: record.required_employees,
        required_skills: Array.isArray(record.required_skills)
          ? record.required_skills.join(', ')
          : record.required_skills || '',
        priority: record.priority,
        notes: record.notes || '',
      };

      // Filter by selected columns if specified
      if (input.columns && input.columns.length > 0) {
        const filtered: any = {};
        input.columns.forEach((col) => {
          if (col in transformed) {
            filtered[col] = transformed[col];
          }
        });
        return filtered;
      }

      return transformed;
    });

    // Format based on requested format
    switch (input.format) {
      case 'csv':
        const csv = parse(exportData);
        return {
          data: csv,
          contentType: 'text/csv',
          filename: `demands_export_${new Date().toISOString().split('T')[0]}.csv`,
        };

      case 'json':
        return {
          data: JSON.stringify(exportData, null, 2),
          contentType: 'application/json',
          filename: `demands_export_${new Date().toISOString().split('T')[0]}.json`,
        };

      case 'xlsx':
        // For XLSX, return JSON that frontend can convert using a library like xlsx
        return {
          data: JSON.stringify(exportData),
          contentType: 'application/json',
          filename: `demands_export_${new Date().toISOString().split('T')[0]}.xlsx`,
          meta: { format: 'xlsx-json' },
        };

      default:
        throw new Error('Unsupported export format');
    }
  },

  /**
   * Get demand by ID
   */
  async getDemandById(id: string, organizationId: string) {
    const { data, error } = await supabase
      .from('demands')
      .select('*, department:departments(id, name)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch demand: ${error.message}`);
    }

    return data;
  },

  /**
   * Get summary statistics for the grid
   */
  async getGridSummary(organizationId: string, filters?: any) {
    let dbQuery = supabase
      .from('demands')
      .select('required_employees, priority, date')
      .eq('organization_id', organizationId);

    // Apply same filters as grid
    if (filters?.departmentIds && filters.departmentIds.length > 0) {
      dbQuery = dbQuery.in('department_id', filters.departmentIds);
    }
    if (filters?.startDate) {
      dbQuery = dbQuery.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      dbQuery = dbQuery.lte('date', filters.endDate);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new DatabaseError(`Failed to fetch summary: ${error.message}`);
    }

    const summary = {
      totalRecords: data?.length || 0,
      totalEmployeesNeeded: data?.reduce((sum, d) => sum + d.required_employees, 0) || 0,
      averagePerDay: 0,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };

    // Count by priority
    data?.forEach((record) => {
      if (record.priority in summary.byPriority) {
        summary.byPriority[record.priority as keyof typeof summary.byPriority]++;
      }
    });

    // Calculate average per day
    const uniqueDates = new Set(data?.map((d) => d.date));
    if (uniqueDates.size > 0) {
      summary.averagePerDay = summary.totalEmployeesNeeded / uniqueDates.size;
    }

    return summary;
  },
};
