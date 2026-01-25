import { supabase } from '../lib/supabase';
import { DatabaseError } from '../errors';

export const departmentService = {
  getAll: async (organizationId?: string) => {
    let query = supabase.from('departments').select('*');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw new DatabaseError(`Failed to fetch departments: ${error.message}`);
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();

    if (error) throw new DatabaseError(`Failed to fetch department: ${error.message}`);
    return data;
  },

  create: async (departmentData: any) => {
    const { data, error } = await supabase
      .from('departments')
      .insert(departmentData)
      .select()
      .single();

    if (error) throw new DatabaseError(`Failed to create department: ${error.message}`);
    return data;
  },

  update: async (id: string, departmentData: any) => {
    const { data, error } = await supabase
      .from('departments')
      .update(departmentData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(`Failed to update department: ${error.message}`);
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', id);

    if (error) throw new DatabaseError(`Failed to delete department: ${error.message}`);
  },
};
