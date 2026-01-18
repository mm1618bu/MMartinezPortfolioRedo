import { supabase } from './supabase';
import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

/**
 * Authentication helpers
 */
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: { name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Get current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // Update user
  updateUser: async (attributes: { email?: string; password?: string; data?: object }) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    return { data, error };
  },
};

/**
 * Staff operations
 */
export const staff = {
  // Get all staff
  getAll: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_name', { ascending: true });
    return { data, error };
  },

  // Get staff by ID
  getById: async (id: string) => {
    const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
    return { data, error };
  },

  // Create staff
  create: async (staff: Tables['staff']['Insert']) => {
    const { data, error } = await supabase.from('staff').insert(staff).select().single();
    return { data, error };
  },

  // Update staff
  update: async (id: string, updates: Tables['staff']['Update']) => {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete staff
  delete: async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    return { error };
  },

  // Get staff by department
  getByDepartment: async (departmentId: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('department_id', departmentId)
      .eq('status', 'active')
      .order('last_name', { ascending: true });
    return { data, error };
  },
};

/**
 * Schedule operations
 */
export const schedules = {
  // Get schedules
  getAll: async (filters?: {
    startDate?: string;
    endDate?: string;
    staffId?: string;
    organizationId?: string;
  }) => {
    let query = supabase.from('schedules').select('*, staff(*)');

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters?.staffId) {
      query = query.eq('staff_id', filters.staffId);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('end_time', filters.endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: true });
    return { data, error };
  },

  // Get schedule by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, staff(*)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create schedule
  create: async (schedule: Tables['schedules']['Insert']) => {
    const { data, error } = await supabase.from('schedules').insert(schedule).select().single();
    return { data, error };
  },

  // Update schedule
  update: async (id: string, updates: Tables['schedules']['Update']) => {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete schedule
  delete: async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    return { error };
  },

  // Bulk create schedules
  createBulk: async (schedules: Tables['schedules']['Insert'][]) => {
    const { data, error } = await supabase.from('schedules').insert(schedules).select();
    return { data, error };
  },
};

/**
 * Time off operations
 */
export const timeOff = {
  // Get all time off requests
  getAll: async (filters?: { staffId?: string; status?: string; organizationId?: string }) => {
    let query = supabase.from('time_off').select('*, staff(*)');

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters?.staffId) {
      query = query.eq('staff_id', filters.staffId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  // Get time off by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('time_off')
      .select('*, staff(*)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create time off request
  create: async (timeOff: Tables['time_off']['Insert']) => {
    const { data, error } = await supabase.from('time_off').insert(timeOff).select().single();
    return { data, error };
  },

  // Update time off request
  update: async (id: string, updates: Tables['time_off']['Update']) => {
    const { data, error } = await supabase
      .from('time_off')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Approve time off
  approve: async (id: string, reviewedBy: string, reviewNotes?: string) => {
    const { data, error } = await supabase
      .from('time_off')
      .update({
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Deny time off
  deny: async (id: string, reviewedBy: string, reviewNotes?: string) => {
    const { data, error } = await supabase
      .from('time_off')
      .update({
        status: 'denied',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

/**
 * Department operations
 */
export const departments = {
  // Get all departments
  getAll: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });
    return { data, error };
  },

  // Get department by ID
  getById: async (id: string) => {
    const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();
    return { data, error };
  },

  // Create department
  create: async (department: Tables['departments']['Insert']) => {
    const { data, error } = await supabase.from('departments').insert(department).select().single();
    return { data, error };
  },

  // Update department
  update: async (id: string, updates: Tables['departments']['Update']) => {
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete department
  delete: async (id: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    return { error };
  },
};

/**
 * User operations
 */
export const users = {
  // Get all users
  getAll: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });
    return { data, error };
  },

  // Get user by ID
  getById: async (id: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    return { data, error };
  },

  // Update user
  update: async (id: string, updates: Tables['users']['Update']) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete user
  delete: async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return { error };
  },
};

/**
 * Real-time subscriptions
 */
export const subscriptions = {
  // Subscribe to schedule changes
  subscribeToSchedules: (organizationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('schedules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to time off changes
  subscribeToTimeOff: (organizationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('time_off_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_off',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to staff changes
  subscribeToStaff: (organizationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('staff_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();
  },
};
