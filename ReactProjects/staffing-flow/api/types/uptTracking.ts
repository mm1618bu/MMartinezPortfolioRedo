/**
 * UPT (Unpaid Time) Tracking Types
 * Attendance exception detection and UPT balance management
 */

// ==============================================
// CORE UPT TYPES
// ==============================================

/**
 * UPT Exception Types
 */
export type UPTExceptionType =
  | 'absence'           // Full absence without approved PTO
  | 'tardiness'         // Late clock-in beyond grace period
  | 'early_departure'   // Left early without approval
  | 'missed_punch'      // Missing clock in/out
  | 'extended_break'    // Break exceeded allowed time
  | 'no_call_no_show'   // Absence without notification
  | 'partial_absence';  // Partial shift missed

/**
 * UPT Exception Severity
 */
export type UPTSeverity = 'minor' | 'moderate' | 'major' | 'critical';

/**
 * UPT Balance Status
 */
export type UPTBalanceStatus = 'healthy' | 'warning' | 'critical' | 'terminated';

/**
 * UPT Exception Record
 * Tracks individual attendance exceptions that result in UPT deductions
 */
export interface UPTException {
  exception_id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  department_id?: string;
  
  // Exception details
  exception_type: UPTExceptionType;
  exception_date: string; // ISO date
  occurrence_time: string; // ISO datetime
  severity: UPTSeverity;
  
  // Time impact
  minutes_missed: number;
  upt_hours_deducted: number; // Hours deducted from UPT balance
  
  // Context
  shift_id?: string;
  scheduled_start?: string; // ISO datetime
  scheduled_end?: string; // ISO datetime
  actual_clock_in?: string; // ISO datetime
  actual_clock_out?: string; // ISO datetime
  
  // Approval status
  is_excused: boolean;
  excuse_reason?: string;
  excuse_documentation?: string;
  approved_by?: string; // Manager ID
  approved_at?: string; // ISO datetime
  
  // Notifications
  employee_notified: boolean;
  manager_notified: boolean;
  notification_sent_at?: string; // ISO datetime
  
  // Notes
  notes?: string;
  system_notes?: string;
  
  // Metadata
  detected_by: 'system' | 'manager' | 'manual';
  detection_method?: string; // e.g., 'scheduled_comparison', 'timeclock_analysis'
  data_source?: string;
  created_at: string;
  updated_at: string;
}

/**
 * UPT Balance
 * Tracks employee's UPT balance (hours of unpaid time allowed before termination)
 */
export interface UPTBalance {
  balance_id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  department_id?: string;
  
  // Balance
  current_balance_hours: number; // Remaining UPT hours (typically starts at 20-80)
  initial_balance_hours: number; // Starting balance (e.g., 20 hours)
  total_used_hours: number; // Total UPT hours used
  total_excused_hours: number; // Total hours excused (not deducted)
  
  // Thresholds
  warning_threshold_hours: number; // When to warn (e.g., 10 hours)
  critical_threshold_hours: number; // When critical (e.g., 5 hours)
  termination_threshold_hours: number; // When to terminate (e.g., 0 hours)
  
  // Status
  balance_status: UPTBalanceStatus;
  is_negative: boolean;
  days_until_termination?: number; // Estimated based on usage pattern
  
  // Period tracking
  period_start_date: string; // ISO date (e.g., hire date or annual reset)
  period_end_date?: string; // ISO date (if balance resets)
  last_exception_date?: string; // ISO date of most recent exception
  last_balance_update: string; // ISO datetime
  
  // Trends
  exceptions_this_month: number;
  exceptions_this_quarter: number;
  exceptions_this_year: number;
  avg_exceptions_per_month: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * UPT Policy Configuration
 * Organization/department-specific UPT rules
 */
export interface UPTPolicyConfig {
  policy_id: string;
  organization_id: string;
  department_id?: string; // Optional: dept-specific policy
  
  policy_name: string;
  description?: string;
  
  // Initial allocation
  initial_upt_hours: number; // e.g., 20 hours
  reset_frequency?: 'never' | 'annual' | 'quarterly' | 'monthly';
  reset_date?: string; // ISO date (e.g., hire anniversary, Jan 1)
  
  // Thresholds
  warning_threshold_hours: number;
  critical_threshold_hours: number;
  termination_threshold_hours: number;
  
  // Grace periods (minutes)
  tardiness_grace_period_minutes: number; // e.g., 5 minutes
  early_departure_grace_period_minutes: number;
  break_grace_period_minutes: number;
  
  // Deduction rates
  deduction_rate_tardiness: number; // Hours deducted per minute late (e.g., 0.017 = 1 hour per 60 min)
  deduction_rate_early_departure: number;
  deduction_rate_absence: number; // Hours deducted for full absence (e.g., 8 hours)
  deduction_rate_no_call_no_show: number; // Penalty multiplier (e.g., 2x)
  
  // Rounding
  round_to_nearest_minutes: number; // e.g., 15 minutes
  always_round_up: boolean;
  
  // Excuses
  allow_excused_absences: boolean;
  require_documentation: boolean;
  documentation_types: string[]; // e.g., ['doctor_note', 'court_summons']
  excuse_approval_required: boolean;
  
  // Notifications
  notify_employee_on_exception: boolean;
  notify_manager_on_exception: boolean;
  notify_hr_on_critical: boolean;
  notify_on_warning_threshold: boolean;
  notify_on_critical_threshold: boolean;
  
  // Auto-detection
  auto_detect_exceptions: boolean;
  detection_schedule_minutes: number; // How often to run detection (e.g., 30 min)
  
  // Status
  is_active: boolean;
  effective_date: string; // ISO date
  end_date?: string; // ISO date
  
  created_at: string;
  updated_at: string;
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================

/**
 * Detect Attendance Exceptions Request
 * Analyzes attendance data to identify UPT exceptions
 */
export interface DetectExceptionsRequest {
  organization_id: string;
  department_id?: string; // Optional: filter by department
  employee_ids?: string[]; // Optional: specific employees
  start_date: string; // ISO date
  end_date: string; // ISO date
  exception_types?: UPTExceptionType[]; // Optional: filter by type
  auto_deduct_upt?: boolean; // If true, automatically deduct UPT (default: true)
  send_notifications?: boolean; // If true, notify employees/managers (default: true)
}

export interface DetectExceptionsResponse {
  success: boolean;
  exceptions_detected: number;
  exceptions_created: number;
  exceptions_skipped: number; // Already exist or excused
  upt_hours_deducted: number; // Total UPT hours deducted
  employees_affected: number;
  details: DetectedExceptionDetail[];
  error?: string;
}

export interface DetectedExceptionDetail {
  employee_id: string;
  employee_name: string;
  exception_type: UPTExceptionType;
  exception_date: string;
  minutes_missed: number;
  upt_hours_deducted: number;
  new_balance_hours: number;
  balance_status: UPTBalanceStatus;
  created: boolean; // True if new, false if already exists
  reason?: string;
}

/**
 * Record UPT Exception Request (Manual Entry)
 */
export interface RecordExceptionRequest {
  organization_id: string;
  employee_id: string;
  exception_type: UPTExceptionType;
  exception_date: string; // ISO date
  occurrence_time: string; // ISO datetime
  minutes_missed: number;
  shift_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_clock_in?: string;
  actual_clock_out?: string;
  notes?: string;
  detected_by?: 'system' | 'manager' | 'manual';
  auto_deduct_upt?: boolean; // Default: true
  send_notifications?: boolean; // Default: true
}

export interface RecordExceptionResponse {
  success: boolean;
  exception: UPTException;
  upt_balance: UPTBalance;
  message?: string;
  error?: string;
}

/**
 * Excuse UPT Exception Request
 */
export interface ExcuseExceptionRequest {
  organization_id: string;
  exception_id: string;
  excuse_reason: string;
  excuse_documentation?: string; // File URL or reference
  approved_by: string; // Manager/HR ID
  refund_upt?: boolean; // If true, refund UPT hours (default: true)
  notes?: string;
}

export interface ExcuseExceptionResponse {
  success: boolean;
  exception: UPTException;
  upt_balance?: UPTBalance; // If UPT was refunded
  upt_refunded_hours?: number;
  message?: string;
  error?: string;
}

/**
 * Get UPT Balance Request
 */
export interface GetUPTBalanceRequest {
  organization_id: string;
  employee_id: string;
}

export interface GetUPTBalanceResponse {
  success: boolean;
  balance: UPTBalance;
  recent_exceptions: UPTException[]; // Last 10 exceptions
  error?: string;
}

/**
 * List UPT Exceptions Request
 */
export interface ListExceptionsRequest {
  organization_id: string;
  employee_id?: string;
  department_id?: string;
  exception_types?: UPTExceptionType[];
  severity?: UPTSeverity;
  is_excused?: boolean;
  start_date?: string; // ISO date
  end_date?: string; // ISO date
  balance_status?: UPTBalanceStatus; // Filter employees by balance status
  limit?: number; // Default: 100
  offset?: number; // For pagination
  sort_by?: 'date' | 'severity' | 'hours_deducted' | 'employee';
  sort_order?: 'asc' | 'desc';
}

export interface ListExceptionsResponse {
  success: boolean;
  exceptions: UPTException[];
  total_count: number;
  page: number;
  limit: number;
  error?: string;
}

/**
 * UPT Analytics Request
 */
export interface UPTAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  group_by?: 'employee' | 'department' | 'exception_type' | 'severity';
}

export interface UPTAnalyticsResponse {
  success: boolean;
  summary: UPTSummary;
  by_employee?: UPTEmployeeStats[];
  by_department?: UPTDepartmentStats[];
  by_exception_type?: UPTExceptionTypeStats[];
  by_severity?: UPTSeverityStats[];
  trends?: UPTTrendData[];
  error?: string;
}

export interface UPTSummary {
  total_exceptions: number;
  total_employees_affected: number;
  total_upt_hours_deducted: number;
  total_upt_hours_excused: number;
  avg_exceptions_per_employee: number;
  avg_upt_hours_per_exception: number;
  
  // By status
  employees_healthy: number;
  employees_warning: number;
  employees_critical: number;
  employees_terminated: number;
  
  // By type
  absences: number;
  tardiness: number;
  early_departures: number;
  missed_punches: number;
  extended_breaks: number;
  no_call_no_shows: number;
  
  // Severity
  minor_exceptions: number;
  moderate_exceptions: number;
  major_exceptions: number;
  critical_exceptions: number;
  
  // Time period
  start_date: string;
  end_date: string;
}

export interface UPTEmployeeStats {
  employee_id: string;
  employee_name: string;
  department_id?: string;
  department_name?: string;
  
  current_balance_hours: number;
  balance_status: UPTBalanceStatus;
  
  total_exceptions: number;
  total_upt_hours_deducted: number;
  total_excused_hours: number;
  
  most_common_exception_type: UPTExceptionType;
  most_recent_exception_date?: string;
  
  trend: 'improving' | 'stable' | 'worsening';
}

export interface UPTDepartmentStats {
  department_id: string;
  department_name: string;
  
  total_employees: number;
  total_exceptions: number;
  total_upt_hours_deducted: number;
  avg_exceptions_per_employee: number;
  
  employees_critical: number;
  employees_warning: number;
  
  most_common_exception_type: UPTExceptionType;
}

export interface UPTExceptionTypeStats {
  exception_type: UPTExceptionType;
  count: number;
  percentage: number;
  total_upt_hours: number;
  avg_upt_hours_per_exception: number;
  employees_affected: number;
}

export interface UPTSeverityStats {
  severity: UPTSeverity;
  count: number;
  percentage: number;
  total_upt_hours: number;
  employees_affected: number;
}

export interface UPTTrendData {
  date: string; // ISO date
  exceptions: number;
  upt_hours_deducted: number;
  employees_affected: number;
  avg_balance_hours: number;
}

/**
 * Employees at Risk Request
 * Get employees with low UPT balance
 */
export interface EmployeesAtRiskRequest {
  organization_id: string;
  department_id?: string;
  status_filter?: UPTBalanceStatus[]; // e.g., ['warning', 'critical']
  min_exceptions?: number; // Min exceptions to include
  sort_by?: 'balance' | 'exceptions' | 'recent_activity';
  limit?: number;
}

export interface EmployeesAtRiskResponse {
  success: boolean;
  employees: EmployeeAtRisk[];
  total_count: number;
  error?: string;
}

export interface EmployeeAtRisk {
  employee_id: string;
  employee_name: string;
  department_id?: string;
  department_name?: string;
  
  current_balance_hours: number;
  balance_status: UPTBalanceStatus;
  is_negative: boolean;
  
  total_exceptions: number;
  exceptions_last_30_days: number;
  last_exception_date?: string;
  
  days_until_termination?: number;
  recommended_action: string; // e.g., 'coaching', 'written_warning', 'termination_review'
}

/**
 * UPT Balance Adjustment Request (Manual Adjustment)
 */
export interface AdjustUPTBalanceRequest {
  organization_id: string;
  employee_id: string;
  adjustment_hours: number; // Positive to add, negative to deduct
  reason: string;
  adjusted_by: string; // Manager/HR ID
  notes?: string;
}

export interface AdjustUPTBalanceResponse {
  success: boolean;
  previous_balance_hours: number;
  new_balance_hours: number;
  adjustment_hours: number;
  upt_balance: UPTBalance;
  message?: string;
  error?: string;
}

/**
 * UPT Policy Request
 */
export interface CreateUPTPolicyRequest {
  organization_id: string;
  department_id?: string;
  policy_name: string;
  description?: string;
  initial_upt_hours: number;
  reset_frequency?: 'never' | 'annual' | 'quarterly' | 'monthly';
  warning_threshold_hours: number;
  critical_threshold_hours: number;
  termination_threshold_hours: number;
  tardiness_grace_period_minutes?: number;
  early_departure_grace_period_minutes?: number;
  break_grace_period_minutes?: number;
  deduction_rate_tardiness?: number;
  deduction_rate_early_departure?: number;
  deduction_rate_absence?: number;
  deduction_rate_no_call_no_show?: number;
  round_to_nearest_minutes?: number;
  always_round_up?: boolean;
  allow_excused_absences?: boolean;
  require_documentation?: boolean;
  documentation_types?: string[];
  excuse_approval_required?: boolean;
  notify_employee_on_exception?: boolean;
  notify_manager_on_exception?: boolean;
  notify_hr_on_critical?: boolean;
  notify_on_warning_threshold?: boolean;
  notify_on_critical_threshold?: boolean;
  auto_detect_exceptions?: boolean;
  detection_schedule_minutes?: number;
  is_active?: boolean;
  effective_date: string;
}

export interface UpdateUPTPolicyRequest {
  policy_id: string;
  // All fields optional for partial update
  policy_name?: string;
  description?: string;
  initial_upt_hours?: number;
  warning_threshold_hours?: number;
  critical_threshold_hours?: number;
  termination_threshold_hours?: number;
  tardiness_grace_period_minutes?: number;
  auto_detect_exceptions?: boolean;
  is_active?: boolean;
}

export interface UPTPolicyResponse {
  success: boolean;
  policy: UPTPolicyConfig;
  message?: string;
  error?: string;
}
