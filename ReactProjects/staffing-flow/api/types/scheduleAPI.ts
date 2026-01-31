/**
 * Schedule Generation API Types
 * Comprehensive types for schedule generation, management, and analysis
 */

// =============================================
// SCHEDULE REQUEST/RESPONSE TYPES
// =============================================

export interface GenerateScheduleRequest {
  staffing_plan_id: string;
  name: string;
  description?: string;
  algorithm?: 'greedy' | 'genetic' | 'simulated_annealing';
  algorithm_parameters?: Record<string, unknown>;
  constraint_rule_ids?: string[];
  include_coverage_scoring?: boolean;
  auto_approve?: boolean;
}

export interface GenerateScheduleResponse {
  schedule_id: string;
  staffing_plan_id: string;
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts: number;
  coverage_percentage: number;
  quality_score?: number;
  constraint_violations: ConstraintViolationSummary;
  generation_time_ms: number;
  status: string;
}

export interface ConstraintViolationSummary {
  total_violations: number;
  hard_violations: number;
  soft_violations: number;
  warning_violations: number;
  violations_by_type: Record<string, number>;
}

// =============================================
// SCHEDULE MANAGEMENT TYPES
// =============================================

export interface Schedule {
  id: string;
  organization_id: string;
  staffing_plan_id: string;
  name: string;
  description?: string;
  version: number;
  generation_timestamp: string;
  algorithm: string;
  schedule_start_date: string;
  schedule_end_date: string;
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts: number;
  coverage_percentage: number;
  quality_score?: number;
  constraint_violation_count: number;
  hard_violation_count: number;
  soft_violation_count: number;
  warning_violation_count: number;
  workload_balance_score?: number;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleAssignment {
  id: string;
  schedule_id: string;
  employee_id: string;
  shift_id: string;
  assignment_date: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  duration_hours: number;
  match_score?: number;
  skill_match_percentage?: number;
  constraint_violations_count: number;
  has_hard_violations: boolean;
  has_soft_violations: boolean;
  status: 'proposed' | 'assigned' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  confirmation_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateScheduleRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  review_notes?: string;
  approval_notes?: string;
}

export interface PublishScheduleRequest {
  approval_notes?: string;
}

export interface PublishScheduleResponse {
  schedule_id: string;
  published_at: string;
  status: string;
}

// =============================================
// SCHEDULE VERSION AND COMPARISON TYPES
// =============================================

export interface ScheduleVersion {
  id: string;
  original_schedule_id: string;
  version_number: number;
  created_by: string;
  created_at: string;
  change_description?: string;
  change_type: 'generation' | 'manual_edit' | 'constraint_adjustment' | 'optimization';
  quality_score_snapshot?: number;
  assignments_added: number;
  assignments_removed: number;
  assignments_modified: number;
  quality_change?: number;
}

export interface CompareSchedulesRequest {
  schedule_id_a: string;
  schedule_id_b: string;
}

export interface ScheduleComparisonResult {
  comparison_id: string;
  schedule_a: {
    id: string;
    name: string;
    quality_score: number;
    coverage_percentage: number;
    workload_balance_score?: number;
    constraint_violations: number;
  };
  schedule_b: {
    id: string;
    name: string;
    quality_score: number;
    coverage_percentage: number;
    workload_balance_score?: number;
    constraint_violations: number;
  };
  differences: {
    quality_score_diff: number;
    coverage_diff: number;
    workload_balance_diff?: number;
    constraint_violations_diff: number;
  };
  recommendation: string;
  better_schedule_id: string;
}

// =============================================
// BATCH OPERATION TYPES
// =============================================

export interface BatchGenerateRequest {
  staffing_plan_ids: string[];
  algorithm?: 'greedy' | 'genetic' | 'simulated_annealing';
  algorithm_parameters?: Record<string, unknown>;
  run_in_parallel?: boolean;
}

export interface BatchGenerateResponse {
  batch_id: string;
  total_schedules: number;
  generated_schedules: number;
  failed_schedules: number;
  results: {
    schedule_id?: string;
    staffing_plan_id: string;
    status: 'success' | 'failed';
    error?: string;
    quality_score?: number;
  }[];
  total_generation_time_ms: number;
}

export interface BatchUpdateAssignmentsRequest {
  schedule_id: string;
  assignment_updates: {
    assignment_id: string;
    status?: string;
    confirmed?: boolean;
    notes?: string;
  }[];
}

export interface BatchUpdateResponse {
  schedule_id: string;
  updated_count: number;
  failed_count: number;
  results: {
    assignment_id: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
}

// =============================================
// SCHEDULE TEMPLATE TYPES
// =============================================

export interface ScheduleTemplate {
  id: string;
  organization_id: string;
  department_id?: string;
  name: string;
  description?: string;
  template_data: Record<string, unknown>;
  constraint_rules_applied: string[];
  algorithm_parameters: Record<string, unknown>;
  is_public: boolean;
  is_archived: boolean;
  usage_count: number;
  last_used_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleTemplateRequest {
  name: string;
  description?: string;
  template_data: Record<string, unknown>;
  constraint_rules_applied?: string[];
  algorithm_parameters?: Record<string, unknown>;
  is_public?: boolean;
}

export interface UpdateScheduleTemplateRequest {
  name?: string;
  description?: string;
  template_data?: Record<string, unknown>;
  constraint_rules_applied?: string[];
  algorithm_parameters?: Record<string, unknown>;
  is_public?: boolean;
  is_archived?: boolean;
}

// =============================================
// SCHEDULE ANALYTICS TYPES
// =============================================

export interface ScheduleHealthCheck {
  schedule_id: string;
  overall_health: 'excellent' | 'good' | 'fair' | 'poor';
  health_score: number; // 0-100
  concerns: {
    concern_type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    affected_count: number;
  }[];
  recommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    expected_improvement: string;
  }[];
}

export interface ScheduleStatistics {
  schedule_id: string;
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts: number;
  coverage_percentage: number;
  employee_count: number;
  average_assignments_per_employee: number;
  
  // Workload
  average_hours_per_employee: number;
  max_hours_per_employee: number;
  min_hours_per_employee: number;
  workload_std_deviation: number;
  workload_balance_score: number;
  
  // Quality
  average_match_score: number;
  average_skill_match: number;
  
  // Constraints
  total_violations: number;
  hard_violations: number;
  soft_violations: number;
  warnings: number;
  violation_rate: number; // violations per 100 shifts
  
  // Coverage
  coverage_by_role?: Record<string, number>;
  coverage_by_department?: Record<string, number>;
  coverage_by_shift_type?: Record<string, number>;
}

export interface ScheduleExportRequest {
  schedule_id: string;
  format: 'pdf' | 'csv' | 'json' | 'ical' | 'excel';
  include_options?: {
    include_assignments?: boolean;
    include_metrics?: boolean;
    include_violations?: boolean;
    include_comments?: boolean;
  };
  filters?: {
    employee_ids?: string[];
    departments?: string[];
    shift_types?: string[];
    date_range?: {
      start_date: string;
      end_date: string;
    };
  };
}

export interface ScheduleExportResponse {
  export_id: string;
  schedule_id: string;
  format: string;
  file_url?: string;
  file_size_bytes?: number;
  created_at: string;
  expires_at?: string;
}

// =============================================
// SCHEDULE COMMENTS AND COLLABORATION TYPES
// =============================================

export interface ScheduleComment {
  id: string;
  schedule_id: string;
  author_id: string;
  content: string;
  parent_comment_id?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
}

export interface ResolveCommentRequest {
  is_resolved: boolean;
}

// =============================================
// APPROVAL WORKFLOW TYPES
// =============================================

export interface ApprovalRequest {
  schedule_id: string;
  approval_notes?: string;
}

export interface ApprovalResponse {
  schedule_id: string;
  approved: boolean;
  approved_by: string;
  approved_at: string;
  status: string;
}

export interface ApprovalHistory {
  schedule_id: string;
  approval_workflows: {
    step: number;
    approver_id: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_at?: string;
    notes?: string;
  }[];
}

// =============================================
// VALIDATION TYPES
// =============================================

export interface ValidateScheduleRequest {
  staffing_plan_id: string;
  constraint_rule_ids?: string[];
}

export interface ValidateScheduleResponse {
  is_valid: boolean;
  warnings: {
    warning_type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  estimated_quality_score: number;
  estimated_coverage: number;
  can_generate: boolean;
}

// =============================================
// PAGINATION AND FILTERING TYPES
// =============================================

export interface ListSchedulesRequest {
  organization_id?: string;
  staffing_plan_id?: string;
  status?: string;
  sort_by?: 'created_at' | 'updated_at' | 'quality_score' | 'coverage_percentage';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}

export interface ListSchedulesResponse {
  schedules: Schedule[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListAssignmentsRequest {
  schedule_id: string;
  employee_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  has_violations?: boolean;
  page?: number;
  page_size?: number;
}

export interface ListAssignmentsResponse {
  assignments: ScheduleAssignment[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// =============================================
// ERROR RESPONSE TYPES
// =============================================

export interface ScheduleErrorResponse {
  error: string;
  error_code: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
