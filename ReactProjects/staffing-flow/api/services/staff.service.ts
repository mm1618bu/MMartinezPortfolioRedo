import { supabase } from '../lib/supabase';

interface StaffFilters {
  organizationId?: string;
  departmentId?: string;
  status?: string;
}

export const staffService = {
  getAll: async (filters: StaffFilters) => {
    let query = supabase.from('employees').select('*');

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('last_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  },

  create: async (employeeData: any) => {
    const { data, error } = await supabase.from('employees').insert(employeeData).select().single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, employeeData: any) => {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);

    if (error) throw error;
  },

  importCSV: async (csvData: any[], organizationId: string) => {
    // Process and validate CSV data
    const processedData = csvData.map((row) => ({
      ...row,
      organization_id: organizationId,
    }));

    const { data, error } = await supabase.from('employees').insert(processedData).select();

    if (error) throw error;
    return { imported: data.length, data };
  },
};
