import type { ConstraintViolation } from './shiftConstraints';

/**
 * Employee availability for scheduling
 */
export interface EmployeeAvailability {
  employee_id: string;
  employee_name: string;
  role: string;
  available_dates: string[]; // ISO date strings
  unavailable_dates?: string[]; // ISO date strings
  max_shifts_per_week?: number;
  preferred_shift_types?: string[];
  skills?: string[];
}

/**
 * Shift to be scheduled
 */
export interface ShiftTemplate {
  shift_id: string;
  shift_type: string;
  department_id: string;
  organization_id: string;
  assignment_date: string; // ISO date
  shift_start_time: string; // HH:mm
  shift_end_time: string; // HH:mm
  required_role?: string;
  required_skill?: string;
  min_staffing?: number;
  max_staffing?: number;
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

/**
 * Result of attempting to assign an employee to a shift
 */
export interface AssignmentAttempt {
  shift_id: string;
  employee_id: string;
  employee_name: string;
  success: boolean;
  violations: ConstraintViolation[];
  score: number; // Higher = better match
  reason?: string;
}

/**
 * Generated schedule assignment
 */
export interface GeneratedAssignment {
  assignment_id?: string;
  shift_id: string;
  employee_id: string;
  employee_name: string;
  organization_id: string;
  department_id: string;
  assigned_role: string;
  assignment_date: string;
  shift_start_time: string;
  shift_end_time: string;
  status: 'assigned' | 'conflict' | 'unassigned';
  violations: ConstraintViolation[];
  assignment_score: number; // Quality of match (0-100)
  override_requested?: boolean;
}

/**
 * Schedule generation request
 */
export interface ScheduleGenerationRequest {
  organization_id: string;
  department_id: string;
  shifts: ShiftTemplate[];
  employees: EmployeeAvailability[];
  strategy?: 'greedy' | 'balanced' | 'skills_first'; // Default: greedy
  max_soft_violations?: number; // Allow soft constraint violations
  allow_hard_overrides?: boolean;
  optimization_criteria?: Array<'minimize_violations' | 'maximize_coverage' | 'balance_workload'>;
}

/**
 * Schedule generation result
 */
export interface ScheduleGenerationResult {
  schedule_id: string;
  organization_id: string;
  department_id: string;
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts: number;
  coverage_percentage: number;
  assignments: GeneratedAssignment[];
  conflicts: AssignmentAttempt[];
  total_hard_violations: number;
  total_soft_violations: number;
  generation_time_ms: number;
  generated_at: string;
  algorithm_used: string;
  notes: string;
}

/**
 * Schedule generation parameters for API request
 */
export interface GenerateScheduleInput {
  organization_id: string;
  department_id: string;
  shifts: ShiftTemplate[];
  employees: EmployeeAvailability[];
  strategy?: 'greedy' | 'balanced' | 'skills_first';
  max_soft_violations?: number;
  allow_hard_overrides?: boolean;
}

/**
 * Assignment scoring criteria
 */
export interface ScoringCriteria {
  has_required_skill: boolean;
  skill_match_count: number;
  available_all_days: boolean;
  shift_preference_match: boolean;
  workload_balance: number; // 0-100, higher is more balanced
  constraint_violations_count: number;
  hard_violations: boolean;
}

/**
 * Employee workload tracker for balanced scheduling
 */
export interface EmployeeWorkload {
  employee_id: string;
  shifts_assigned: number;
  hours_this_week: number;
  last_assignment_date?: string;
  rest_days_remaining: number;
}
