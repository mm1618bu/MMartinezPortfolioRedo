/**
 * Coverage Score Types
 * Defines types for calculating and tracking coverage metrics across schedules
 */

/**
 * Individual assignment quality score
 */
export interface AssignmentQualityScore {
  assignment_id: string;
  employee_id: string;
  shift_id: string;
  match_score: number; // 0-100: skill match, availability, preference match
  constraint_violation_score: number; // 0-100: penalty for violations
  workload_balance_score: number; // 0-100: how well balanced vs other employees
  priority_fulfillment: number; // 0-100: does this cover a high-priority shift?
  combined_score: number; // 0-100: weighted average of above
}

/**
 * Coverage by dimension (role, department, shift type, etc.)
 */
export interface DimensionalCoverage {
  dimension: 'role' | 'department' | 'shift_type' | 'time_period' | 'priority';
  dimension_value: string;
  total_shifts: number;
  covered_shifts: number;
  coverage_percentage: number;
  average_quality_score: number; // Average AssignmentQualityScore.combined_score
  gaps: string[]; // Specific gaps in this dimension
}

/**
 * Overall schedule coverage metrics
 */
export interface CoverageMetrics {
  schedule_id: string;
  organization_id: string;
  department_id?: string;
  
  // Basic coverage
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts: number;
  coverage_percentage: number;
  
  // Quality metrics
  average_assignment_quality: number; // 0-100
  total_constraint_violations: number;
  critical_shifts_covered: number; // Count of critical priority shifts assigned
  critical_coverage_percentage: number;
  
  // By dimension
  coverage_by_role: DimensionalCoverage[];
  coverage_by_department: DimensionalCoverage[];
  coverage_by_shift_type: DimensionalCoverage[];
  coverage_by_time_period: DimensionalCoverage[];
  coverage_by_priority: DimensionalCoverage[];
  
  // Workload distribution
  workload_distribution: {
    avg_shifts_per_employee: number;
    std_deviation_shifts: number;
    max_shifts_single_employee: number;
    min_shifts_single_employee: number;
    workload_balance_score: number; // 0-100: how evenly distributed
  };
  
  // Constraint analysis
  constraint_distribution: {
    hard_violations: number;
    soft_violations: number;
    warning_violations: number;
    most_common_violation: string;
  };
  
  // Overall health score
  overall_coverage_score: number; // 0-100 composite score
  score_components: {
    coverage_component: number; // 40% weight: basic coverage
    quality_component: number; // 35% weight: assignment quality
    balance_component: number; // 15% weight: workload balance
    priority_component: number; // 10% weight: critical shift coverage
  };
  
  generated_at: string; // ISO timestamp
}

/**
 * Request to calculate coverage for a schedule
 */
export interface CalculateCoverageRequest {
  schedule_id?: string; // If omitted, calculate for provided schedule_result
  organization_id: string;
  department_id?: string;
  schedule_result?: {
    assignments: any[];
    total_shifts: number;
    conflicts: any[];
  };
}

/**
 * Request to compare two schedules
 */
export interface CompareSchedulesRequest {
  schedule_id_1: string;
  schedule_id_2: string;
  organization_id: string;
}

/**
 * Schedule comparison result
 */
export interface ScheduleComparison {
  schedule_1_id: string;
  schedule_2_id: string;
  
  coverage_improvement: number; // percentage points
  quality_improvement: number;
  balance_improvement: number;
  overall_score_improvement: number;
  
  better_by_role: Record<string, string>; // role -> schedule_1_id or schedule_2_id
  better_by_metric: Record<string, 'schedule_1' | 'schedule_2'>;
  
  recommendation: string; // Which schedule is better and why
}

/**
 * Time period enum for period-based analysis
 */
export type TimePeriod = 'daily' | 'weekly' | 'bi_weekly' | 'monthly';

/**
 * Coverage score weights for customization
 */
export interface CoverageScoreWeights {
  coverage_weight: number; // Default: 40
  quality_weight: number; // Default: 35
  balance_weight: number; // Default: 15
  priority_weight: number; // Default: 10
  
  // Sub-weights for quality
  skill_match_weight: number; // Default: 30
  constraint_weight: number; // Default: 40
  availability_weight: number; // Default: 30;
}

/**
 * Alert/warning about schedule quality
 */
export interface CoverageAlert {
  severity: 'critical' | 'warning' | 'info';
  type: string; // e.g., 'low_coverage', 'uneven_workload', 'missing_skills'
  message: string;
  affected_dimensions?: string[];
  recommended_action: string;
}

/**
 * Full coverage analysis report
 */
export interface CoverageAnalysisReport {
  schedule_id: string;
  metrics: CoverageMetrics;
  alerts: CoverageAlert[];
  recommendations: string[];
  health_status: 'excellent' | 'good' | 'fair' | 'poor'; // Based on overall_coverage_score
  generated_at: string;
}
