import { supabase } from '../lib/supabase';
import { CreateSiteInput, UpdateSiteInput, SiteQueryInput } from '../schemas/site.schema';
import { DatabaseError } from '../errors';

export const siteService = {
  /**
   * Get all sites with optional filtering
   */
  getAll: async (query: SiteQueryInput = {}) => {
    let dbQuery = supabase.from('sites').select('*, manager:manager_id(id, name, email)');

    if (query.organizationId) {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', query.isActive === 'true');
    }

    if (query.search) {
      dbQuery = dbQuery.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%,city.ilike.%${query.search}%`);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    dbQuery = dbQuery.range(from, to).order('name', { ascending: true });

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new DatabaseError(`Failed to fetch sites: ${error.message}`);
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
   * Get a single site by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('sites')
      .select('*, manager:manager_id(id, name, email), departments(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch site: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new site
   */
  create: async (siteData: CreateSiteInput) => {
    const { data, error } = await supabase
      .from('sites')
      .insert({
        ...siteData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, manager:manager_id(id, name, email)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create site: ${error.message}`);
    }

    return data;
  },

  /**
   * Update an existing site
   */
  update: async (id: string, siteData: UpdateSiteInput) => {
    const { data, error } = await supabase
      .from('sites')
      .update({
        ...siteData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, manager:manager_id(id, name, email)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update site: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a site
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('sites').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete site: ${error.message}`);
    }
  },

  /**
   * Get site statistics
   */
  getStatistics: async (siteId: string) => {
    // Get employee count
    const { count: employeeCount, error: empError } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'active');

    // Get department count
    const { count: deptCount, error: deptError } = await supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId);

    if (empError || deptError) {
      throw new DatabaseError('Failed to fetch site statistics');
    }

    return {
      total_employees: employeeCount || 0,
      total_departments: deptCount || 0,
    };
  },
};
