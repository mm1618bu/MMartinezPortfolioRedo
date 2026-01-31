import { supabase } from '../lib/supabase';
import { CreateStaffingPlanInput, UpdateStaffingPlanInput, StaffingPlanQueryInput, CreateStaffingPlanAssignmentInput, UpdateStaffingPlanAssignmentInput, StaffingPlanAssignmentQueryInput } from '../schemas/staffing-plan.schema';
import { DatabaseError } from '../errors';

export const staffingPlanService = {
  /**
   * Get all staffing plans with optional filtering
   */
  getAll: async (query: StaffingPlanQueryInput = {}) => {
    try {
      let dbQuery = supabase.from('staffing_plans').select('*');

      if (query.organizationId) {
        dbQuery = dbQuery.eq('organization_id', query.organizationId);
      }

      if (query.departmentId) {
        dbQuery = dbQuery.eq('department_id', query.departmentId);
      }

      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }

      if (query.priority) {
        dbQuery = dbQuery.eq('priority', query.priority);
      }

      if (query.startDate) {
        dbQuery = dbQuery.gte('start_date', query.startDate);
      }

      if (query.endDate) {
        dbQuery = dbQuery.lte('end_date', query.endDate);
      }

      if (query.search) {
        dbQuery = dbQuery.ilike('name', `%${query.search}%`);
      }

      dbQuery = dbQuery.order('start_date', { ascending: false }).order('name', { ascending: true });

      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }

      if (query.page && query.limit) {
        const offset = (query.page - 1) * query.limit;
        dbQuery = dbQuery.range(offset, offset + query.limit - 1);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Staffing plans query error:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Staffing plans service error:', err);
      return [];
    }
  },

  /**
   * Get a single staffing plan by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('staffing_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch staffing plan: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new staffing plan
   */
  create: async (planData: CreateStaffingPlanInput) => {
    try {
      console.log('Creating staffing plan with data:', planData);

      const { data, error } = await supabase
        .from('staffing_plans')
        .insert({
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Staffing plan creation error:', error);
        throw new DatabaseError(`Failed to create staffing plan: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('Staffing plan service error:', err);
      throw new DatabaseError(`Failed to create staffing plan: ${err.message}`);
    }
  },

  /**
   * Update an existing staffing plan
   */
  update: async (id: string, planData: UpdateStaffingPlanInput) => {
    const { data, error } = await supabase
      .from('staffing_plans')
      .update({
        ...planData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update staffing plan: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a staffing plan
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('staffing_plans').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete staffing plan: ${error.message}`);
    }
  },

  /**
   * Get staffing plans by date range
   */
  getPlansByDateRange: async (organizationId: string, startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('staffing_plans')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching plans by date range:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in getPlansByDateRange:', err);
      return [];
    }
  },

  /**
   * Get staffing plans that overlap with a specific date
   */
  getActivePlans: async (organizationId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('staffing_plans')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .lte('start_date', date)
        .gte('end_date', date)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error fetching active plans:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in getActivePlans:', err);
      return [];
    }
  },

  /**
   * Update staffing plan status
   */
  updateStatus: async (id: string, status: string, approvedBy?: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (approvedBy && status === 'approved') {
        updateData.approved_by = approvedBy;
        updateData.approval_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('staffing_plans')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update plan status: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('Error updating plan status:', err);
      throw new DatabaseError(`Failed to update plan status: ${err.message}`);
    }
  },
};

/**
 * Staffing Plan Assignments Service
 */
export const staffingPlanAssignmentService = {
  /**
   * Get all assignments for a plan
   */
  getAllByPlan: async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('staffing_plan_assignments')
        .select('*')
        .eq('staffing_plan_id', planId)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('Error fetching plan assignments:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in getAllByPlan:', err);
      return [];
    }
  },

  /**
   * Get assignments with optional filtering
   */
  getAll: async (query: StaffingPlanAssignmentQueryInput = {}) => {
    try {
      let dbQuery = supabase.from('staffing_plan_assignments').select('*');

      if (query.staffingPlanId) {
        dbQuery = dbQuery.eq('staffing_plan_id', query.staffingPlanId);
      }

      if (query.employeeId) {
        dbQuery = dbQuery.eq('employee_id', query.employeeId);
      }

      if (query.organizationId) {
        dbQuery = dbQuery.eq('organization_id', query.organizationId);
      }

      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }

      if (query.fromDate) {
        dbQuery = dbQuery.gte('assignment_date', query.fromDate);
      }

      if (query.toDate) {
        dbQuery = dbQuery.lte('assignment_date', query.toDate);
      }

      dbQuery = dbQuery.order('assignment_date', { ascending: true });

      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }

      if (query.page && query.limit) {
        const offset = (query.page - 1) * query.limit;
        dbQuery = dbQuery.range(offset, offset + query.limit - 1);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Assignments query error:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Assignments service error:', err);
      return [];
    }
  },

  /**
   * Get a single assignment by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('staffing_plan_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch assignment: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new assignment
   */
  create: async (assignmentData: CreateStaffingPlanAssignmentInput) => {
    try {
      console.log('Creating assignment with data:', assignmentData);

      const { data, error } = await supabase
        .from('staffing_plan_assignments')
        .insert({
          ...assignmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Assignment creation error:', error);
        throw new DatabaseError(`Failed to create assignment: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('Assignment service error:', err);
      throw new DatabaseError(`Failed to create assignment: ${err.message}`);
    }
  },

  /**
   * Update an existing assignment
   */
  update: async (id: string, assignmentData: UpdateStaffingPlanAssignmentInput) => {
    const { data, error } = await supabase
      .from('staffing_plan_assignments')
      .update({
        ...assignmentData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update assignment: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete an assignment
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('staffing_plan_assignments').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete assignment: ${error.message}`);
    }
  },

  /**
   * Bulk create assignments
   */
  createBulk: async (assignments: CreateStaffingPlanAssignmentInput[]) => {
    try {
      const assignmentsWithTimestamps = assignments.map(a => ({
        ...a,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('staffing_plan_assignments')
        .insert(assignmentsWithTimestamps)
        .select('*');

      if (error) {
        throw new DatabaseError(`Failed to create assignments: ${error.message}`);
      }

      return data || [];
    } catch (err: any) {
      console.error('Bulk assignment creation error:', err);
      throw new DatabaseError(`Failed to create assignments: ${err.message}`);
    }
  },

  /**
   * Update assignment status
   */
  updateStatus: async (id: string, status: string, confirmedBy?: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (confirmedBy && status === 'confirmed') {
        updateData.confirmed_by = confirmedBy;
        updateData.confirmed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('staffing_plan_assignments')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update assignment status: ${error.message}`);
      }

      return data;
    } catch (err: any) {
      console.error('Error updating assignment status:', err);
      throw new DatabaseError(`Failed to update assignment status: ${err.message}`);
    }
  },
};
