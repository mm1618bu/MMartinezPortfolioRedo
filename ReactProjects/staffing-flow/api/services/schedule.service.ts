import { supabase } from '../lib/supabase';

interface ScheduleFilters {
  organizationId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

interface ShiftAssignment {
  employeeId: string;
  shiftTemplateId: string;
  shiftDate: string;
}

export const scheduleService = {
  getAll: async (filters: ScheduleFilters) => {
    let query = supabase.from('shift_assignments').select('*');

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters.startDate) {
      query = query.gte('shift_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('shift_date', filters.endDate);
    }

    const { data, error } = await query.order('shift_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('shift_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (scheduleData: any) => {
    const { data, error } = await supabase
      .from('shift_assignments')
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, scheduleData: any) => {
    const { data, error } = await supabase
      .from('shift_assignments')
      .update(scheduleData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('shift_assignments').delete().eq('id', id);

    if (error) throw error;
  },

  assignShift: async (assignment: ShiftAssignment) => {
    const { employeeId, shiftTemplateId, shiftDate } = assignment;

    // Fetch shift template details
    const { data: template, error: templateError } = await supabase
      .from('shift_templates')
      .select('*')
      .eq('id', shiftTemplateId)
      .single();

    if (templateError) throw templateError;

    // Create shift assignment
    const { data, error } = await supabase
      .from('shift_assignments')
      .insert({
        employee_id: employeeId,
        shift_template_id: shiftTemplateId,
        shift_date: shiftDate,
        start_time: template.start_time,
        end_time: template.end_time,
        organization_id: template.organization_id,
        department_id: template.department_id,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  bulkAssign: async (assignments: ShiftAssignment[]) => {
    const results = await Promise.allSettled(
      assignments.map((assignment) => scheduleService.assignShift(assignment))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      total: assignments.length,
      successful,
      failed,
      results,
    };
  },
};
