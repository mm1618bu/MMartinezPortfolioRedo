export interface StaffingPlan {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  planned_headcount: number | null;
  current_assignments: number;
  unassigned_positions: number;
  demand_ids: string[] | null;
  staffing_buffer_ids: string[] | null;
  sla_window_ids: string[] | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_by: string | null;
  approved_by: string | null;
  approval_date: string | null;
  notes: string | null;
  internal_comments: string | null;
  organization_id: string;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateStaffingPlanInput = Omit<
  StaffingPlan,
  'id' | 'created_at' | 'updated_at' | 'current_assignments' | 'unassigned_positions' | 'approval_date'
>;

export interface StaffingPlanQueryParams {
  organizationId: string;
  departmentId?: string;
  status?: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'active' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StaffingPlanAssignment {
  id: string;
  staffing_plan_id: string;
  employee_id: string;
  organization_id: string;
  assignment_date: string;
  assignment_end_date: string | null;
  assigned_role: string | null;
  shift_template_id: string | null;
  status: 'proposed' | 'assigned' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateStaffingPlanAssignmentInput = Omit<
  StaffingPlanAssignment,
  'id' | 'created_at' | 'updated_at' | 'confirmed_at'
>;

export interface StaffingPlanAssignmentQueryParams {
  staffingPlanId?: string;
  employeeId?: string;
  organizationId?: string;
  status?: 'proposed' | 'assigned' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
