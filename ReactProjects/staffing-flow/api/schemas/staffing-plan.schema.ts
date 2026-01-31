import { z } from 'zod';

/**
 * Staffing Plans schema
 * Validates staffing plan creation, updates, and queries
 */

export const createStaffingPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  planned_headcount: z.number().int().min(1, 'Planned headcount must be at least 1').optional(),
  demand_ids: z.array(z.string().uuid('Invalid demand ID')).optional(),
  staffing_buffer_ids: z.array(z.string().uuid('Invalid buffer ID')).optional(),
  sla_window_ids: z.array(z.string().uuid('Invalid SLA window ID')).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'scheduled', 'active', 'completed', 'archived']).default('draft'),
  notes: z.string().max(2000, 'Notes too long').optional(),
  internal_comments: z.string().max(2000, 'Comments too long').optional(),
  organization_id: z.string().uuid('Invalid organization ID'),
  department_id: z.string().uuid('Invalid department ID').optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be after or equal to start date', path: ['end_date'] }
);

export const updateStaffingPlanSchema = createStaffingPlanSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const staffingPlanQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'scheduled', 'active', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().optional(), // For filtering by date range
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Staffing Plan Assignment Schema
 */

export const createStaffingPlanAssignmentSchema = z.object({
  staffing_plan_id: z.string().uuid('Invalid plan ID'),
  employee_id: z.string().uuid('Invalid employee ID'),
  organization_id: z.string().uuid('Invalid organization ID'),
  assignment_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid assignment date'),
  assignment_end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  assigned_role: z.string().max(100, 'Role too long').optional(),
  shift_template_id: z.string().uuid('Invalid shift template ID').optional(),
  status: z.enum(['proposed', 'assigned', 'confirmed', 'active', 'completed', 'cancelled']).default('proposed'),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(
  (data) => !data.assignment_end_date || new Date(data.assignment_end_date) >= new Date(data.assignment_date),
  { message: 'End date must be after or equal to start date', path: ['assignment_end_date'] }
);

export const updateStaffingPlanAssignmentSchema = createStaffingPlanAssignmentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const staffingPlanAssignmentQuerySchema = z.object({
  staffingPlanId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  status: z.enum(['proposed', 'assigned', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateStaffingPlanInput = z.infer<typeof createStaffingPlanSchema>;
export type UpdateStaffingPlanInput = z.infer<typeof updateStaffingPlanSchema>;
export type StaffingPlanQueryInput = z.infer<typeof staffingPlanQuerySchema>;

export type CreateStaffingPlanAssignmentInput = z.infer<typeof createStaffingPlanAssignmentSchema>;
export type UpdateStaffingPlanAssignmentInput = z.infer<typeof updateStaffingPlanAssignmentSchema>;
export type StaffingPlanAssignmentQueryInput = z.infer<typeof staffingPlanAssignmentQuerySchema>;
