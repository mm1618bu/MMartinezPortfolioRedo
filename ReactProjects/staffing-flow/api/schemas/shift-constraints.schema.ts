import { z } from 'zod';

/**
 * Shift Assignment Constraint Rules Schema
 * Defines validation rules for shift assignments to prevent scheduling conflicts
 * and enforce labor policies
 */

// Constraint severity levels
export const CONSTRAINT_SEVERITY = {
  HARD: 'hard',      // Cannot be violated - blocks assignment
  SOFT: 'soft',      // Should be avoided - warnings but allows override
  WARNING: 'warning', // Informational only
} as const;

// Constraint types
export const CONSTRAINT_TYPES = {
  // Time-based constraints
  NO_DOUBLE_BOOKING: 'no_double_booking',
  MAX_CONSECUTIVE_SHIFTS: 'max_consecutive_shifts',
  MIN_REST_BETWEEN_SHIFTS: 'min_rest_between_shifts',
  MAX_HOURS_PER_DAY: 'max_hours_per_day',
  MAX_HOURS_PER_WEEK: 'max_hours_per_week',
  
  // Skill-based constraints
  REQUIRED_SKILL: 'required_skill',
  SKILL_CERTIFICATION: 'skill_certification',
  
  // Availability constraints
  EMPLOYEE_AVAILABILITY: 'employee_availability',
  EMPLOYEE_TIME_OFF: 'employee_time_off',
  
  // Preference constraints
  SHIFT_PREFERENCE: 'shift_preference',
  LOCATION_PREFERENCE: 'location_preference',
  
  // Staffing constraints
  MIN_COVERAGE: 'min_coverage',
  MAX_COVERAGE: 'max_coverage',
  DEPARTMENT_STAFFING: 'department_staffing',
  
  // Labor law constraints
  UNION_RULES: 'union_rules',
  BREAK_REQUIREMENTS: 'break_requirements',
  WAGE_REGULATIONS: 'wage_regulations',
} as const;

// Base constraint rule schema
const baseConstraintRule = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Constraint name is required').max(200),
  description: z.string().max(1000).optional(),
  constraint_type: z.enum(Object.values(CONSTRAINT_TYPES) as [string, ...string[]]),
  severity: z.enum(['hard', 'soft', 'warning']).default('hard'),
  organization_id: z.string().uuid('Invalid organization ID'),
  department_id: z.string().uuid().optional().nullable(),
  
  // Constraint parameters (flexible JSON)
  parameters: z.record(z.string(), z.any()).optional(),
  
  // Rule configuration
  is_active: z.boolean().default(true),
  applies_to_roles: z.array(z.string()).optional(),
  applies_to_employees: z.array(z.string().uuid()).optional(),
  excluded_employees: z.array(z.string().uuid()).optional(),
  
  // Effective dates
  effective_from: z.string().datetime().optional(),
  effective_until: z.string().datetime().optional(),
  
  // Metadata
  created_by: z.string().optional(),
  updated_by: z.string().optional(),
});

export const createConstraintRuleSchema = baseConstraintRule.omit({
  id: true,
  created_by: true,
  updated_by: true,
});

export const updateConstraintRuleSchema = createConstraintRuleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Constraint violation schema
export const constraintViolationSchema = z.object({
  constraint_rule_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  violation_type: z.string(),
  severity: z.enum(['hard', 'soft', 'warning']),
  message: z.string(),
  suggested_action: z.string().optional(),
  violation_details: z.record(z.string(), z.any()).optional(),
  override_requested: z.boolean().default(false),
  override_reason: z.string().optional(),
  override_approved_by: z.string().uuid().optional(),
  override_approved_at: z.string().datetime().optional(),
});

// Validation request schema
export const validateShiftAssignmentSchema = z.object({
  employee_id: z.string().uuid(),
  shift_template_id: z.string().uuid(),
  assignment_date: z.string().date(),
  assignment_end_date: z.string().date().optional(),
  assigned_role: z.string().optional(),
  organization_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  
  // Override options
  skip_soft_constraints: z.boolean().default(false),
  allow_warnings: z.boolean().default(false),
});

// Batch validation schema
export const validateBatchAssignmentsSchema = z.object({
  assignments: z.array(validateShiftAssignmentSchema),
  organization_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
});

export type ConstraintRule = z.infer<typeof baseConstraintRule>;
export type CreateConstraintRuleInput = z.infer<typeof createConstraintRuleSchema>;
export type UpdateConstraintRuleInput = z.infer<typeof updateConstraintRuleSchema>;
export type ConstraintViolation = z.infer<typeof constraintViolationSchema>;
export type ValidateShiftAssignmentInput = z.infer<typeof validateShiftAssignmentSchema>;
export type ValidateBatchAssignmentsInput = z.infer<typeof validateBatchAssignmentsSchema>;
