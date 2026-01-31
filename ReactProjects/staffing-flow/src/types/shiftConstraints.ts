/**
 * Shift Constraint Rules TypeScript Types
 * Frontend type definitions matching backend schemas
 */

export interface ConstraintRule {
  id: string;
  name: string;
  description?: string;
  constraint_type: ConstraintType;
  severity: ConstraintSeverity;
  organization_id: string;
  department_id?: string;
  parameters?: Record<string, any>;
  is_active: boolean;
  applies_to_roles?: string[];
  applies_to_employees?: string[];
  excluded_employees?: string[];
  effective_from?: string;
  effective_until?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConstraintRuleInput {
  name: string;
  description?: string;
  constraint_type: ConstraintType;
  severity: ConstraintSeverity;
  organization_id: string;
  department_id?: string;
  parameters?: Record<string, any>;
  is_active?: boolean;
  applies_to_roles?: string[];
  applies_to_employees?: string[];
  excluded_employees?: string[];
  effective_from?: string;
  effective_until?: string;
}

export interface UpdateConstraintRuleInput {
  name?: string;
  description?: string;
  constraint_type?: ConstraintType;
  severity?: ConstraintSeverity;
  department_id?: string;
  parameters?: Record<string, any>;
  is_active?: boolean;
  applies_to_roles?: string[];
  applies_to_employees?: string[];
  excluded_employees?: string[];
  effective_from?: string;
  effective_until?: string;
}

export interface ConstraintViolation {
  constraint_rule_id: string;
  assignment_id: string;
  employee_id: string;
  violation_type: string;
  severity: ConstraintSeverity;
  message: string;
  suggested_action?: string;
  violation_details?: Record<string, any>;
  override_requested?: boolean;
  override_reason?: string;
  override_approved_by?: string;
  override_approved_at?: string;
}

export interface ValidateShiftAssignmentInput {
  employee_id: string;
  shift_template_id: string;
  assignment_date: string;
  assignment_end_date?: string;
  assigned_role?: string;
  organization_id: string;
  department_id?: string;
  skip_soft_constraints?: boolean;
  allow_warnings?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  violations: ConstraintViolation[];
}

export interface BatchValidationResult {
  valid: boolean;
  results: Array<{
    assignment: ValidateShiftAssignmentInput;
    valid: boolean;
    violations: ConstraintViolation[];
  }>;
}

// Constraint type enumeration
export type ConstraintType =
  | 'no_double_booking'
  | 'max_consecutive_shifts'
  | 'min_rest_between_shifts'
  | 'max_hours_per_day'
  | 'max_hours_per_week'
  | 'required_skill'
  | 'skill_certification'
  | 'employee_availability'
  | 'employee_time_off'
  | 'shift_preference'
  | 'location_preference'
  | 'min_coverage'
  | 'max_coverage'
  | 'department_staffing'
  | 'union_rules'
  | 'break_requirements'
  | 'wage_regulations';

// Constraint severity enumeration
export type ConstraintSeverity = 'hard' | 'soft' | 'warning';

// Constraint descriptions for UI
export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  no_double_booking: 'No Double Booking',
  max_consecutive_shifts: 'Max Consecutive Shifts',
  min_rest_between_shifts: 'Min Rest Between Shifts',
  max_hours_per_day: 'Max Hours Per Day',
  max_hours_per_week: 'Max Hours Per Week',
  required_skill: 'Required Skill',
  skill_certification: 'Skill Certification',
  employee_availability: 'Employee Availability',
  employee_time_off: 'Employee Time Off',
  shift_preference: 'Shift Preference',
  location_preference: 'Location Preference',
  min_coverage: 'Min Coverage',
  max_coverage: 'Max Coverage',
  department_staffing: 'Department Staffing',
  union_rules: 'Union Rules',
  break_requirements: 'Break Requirements',
  wage_regulations: 'Wage Regulations',
};

export const CONSTRAINT_TYPE_DESCRIPTIONS: Record<ConstraintType, string> = {
  no_double_booking: 'Prevents employee from being assigned to multiple shifts on the same day',
  max_consecutive_shifts: 'Limits the number of consecutive days an employee can work',
  min_rest_between_shifts: 'Ensures minimum rest period between consecutive shifts',
  max_hours_per_day: 'Limits maximum working hours in a single day',
  max_hours_per_week: 'Limits maximum working hours in a week',
  required_skill: 'Requires employee to have a specific skill',
  skill_certification: 'Requires employee to have current certification for a skill',
  employee_availability: 'Checks if employee is available (active status)',
  employee_time_off: 'Prevents assignment during approved time off',
  shift_preference: 'Considers employee shift preferences',
  location_preference: 'Considers employee location preferences',
  min_coverage: 'Ensures minimum number of staff for position',
  max_coverage: 'Limits maximum number of staff for position',
  department_staffing: 'Enforces department-specific staffing requirements',
  union_rules: 'Enforces union labor agreement rules',
  break_requirements: 'Enforces break timing requirements',
  wage_regulations: 'Enforces wage and hour regulations',
};

export const SEVERITY_LABELS: Record<ConstraintSeverity, string> = {
  hard: 'Hard',
  soft: 'Soft',
  warning: 'Warning',
};

export const SEVERITY_DESCRIPTIONS: Record<ConstraintSeverity, string> = {
  hard: 'Constraint cannot be violated - blocks assignment',
  soft: 'Constraint should be avoided - warnings but allows override',
  warning: 'Informational only - does not block assignment',
};
