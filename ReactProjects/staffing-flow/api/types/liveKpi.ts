/**
 * Live KPI Types for Intraday Console
 * Real-time operational metrics computed from attendance and backlog data
 */

// ==============================================
// CORE KPI METRICS
// ==============================================

/**
 * Utilization metrics - how efficiently staff are being used
 */
export interface UtilizationMetrics {
  // Current utilization (0-100%)
  current_utilization: number;
  
  // Target/optimal utilization (0-100%)
  target_utilization: number;
  
  // Utilization variance from target
  utilization_variance: number;
  
  // Productive time (hours)
  productive_hours: number;
  
  // Available time (hours)
  available_hours: number;
  
  // Idle time (hours)
  idle_hours: number;
  
  // Staff actively working
  active_staff_count: number;
  
  // Staff on break
  staff_on_break: number;
  
  // Staff idle/available
  idle_staff_count: number;
  
  // Average work rate (items per hour)
  avg_work_rate: number;
  
  // Efficiency score (0-100)
  efficiency_score: number;
}

/**
 * Headcount gap metrics - staffing vs demand
 */
export interface HeadcountGapMetrics {
  // Current staff present
  current_headcount: number;
  
  // Required staff based on demand
  required_headcount: number;
  
  // Gap (negative = understaffed, positive = overstaffed)
  headcount_gap: number;
  
  // Gap as percentage of required
  gap_percentage: number;
  
  // Scheduled staff (may not all be present)
  scheduled_headcount: number;
  
  // Absent staff count
  absent_count: number;
  
  // Late staff count
  late_count: number;
  
  // Coverage ratio (current/required)
  coverage_ratio: number;
  
  // Staffing level description
  staffing_level: 'critical_understaffed' | 'understaffed' | 'optimal' | 'overstaffed' | 'critical_overstaffed';
  
  // Projected headcount in next hour (accounting for scheduled arrivals/departures)
  projected_headcount_next_hour: number;
  
  // Projected gap in next hour
  projected_gap_next_hour: number;
}

/**
 * SLA risk metrics - risk of missing service targets
 */
export interface SLARiskMetrics {
  // Overall SLA risk level
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Risk score (0-100, higher = more risk)
  risk_score: number;
  
  // Current SLA compliance percentage
  current_sla_compliance: number;
  
  // Target SLA percentage
  target_sla: number;
  
  // SLA variance from target
  sla_variance: number;
  
  // Current average wait time (minutes)
  current_avg_wait_time: number;
  
  // Target wait time (minutes)
  target_wait_time: number;
  
  // Wait time variance
  wait_time_variance: number;
  
  // Items at risk of SLA breach
  items_at_risk: number;
  
  // Items that already breached SLA
  items_breached: number;
  
  // Total items in system
  total_items: number;
  
  // Percentage of items at risk
  at_risk_percentage: number;
  
  // Estimated time to breach for next item (minutes)
  time_to_next_breach: number | null;
  
  // Backlog trend (growing/stable/decreasing)
  backlog_trend: 'growing' | 'stable' | 'decreasing';
  
  // Projected SLA in next hour
  projected_sla_next_hour: number;
}

/**
 * Consolidated live KPI snapshot
 */
export interface LiveKPISnapshot {
  // Unique identifier
  snapshot_id: string;
  
  // Timestamp of calculation
  timestamp: string;
  
  // Organization/Department/Site context
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  // Core KPI metrics
  utilization: UtilizationMetrics;
  headcount_gap: HeadcountGapMetrics;
  sla_risk: SLARiskMetrics;
  
  // Overall health score (0-100)
  overall_health_score: number;
  
  // Critical alerts count
  critical_alerts: number;
  
  // Recommended actions
  recommended_actions: RecommendedAction[];
  
  // Data freshness
  data_as_of: string;
  attendance_data_age_seconds: number;
  backlog_data_age_seconds: number;
}

/**
 * Recommended action based on KPI analysis
 */
export interface RecommendedAction {
  action_type: 'add_staff' | 'remove_staff' | 'redistribute_work' | 'extend_breaks' | 'shorten_breaks' | 'alert_management' | 'none';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expected_impact: string;
  staff_change_count?: number;
  estimated_cost?: number;
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================

/**
 * Request to compute live KPIs
 */
export interface ComputeLiveKPIsRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  // Time window for calculations (default: current time)
  as_of_time?: string;
  
  // Include historical comparison
  include_comparison?: boolean;
  
  // Comparison period (minutes ago)
  comparison_period_minutes?: number;
}

/**
 * Response with computed live KPIs
 */
export interface ComputeLiveKPIsResponse {
  success: boolean;
  snapshot: LiveKPISnapshot;
  
  // Historical comparison if requested
  comparison?: {
    previous_snapshot: LiveKPISnapshot;
    utilization_change: number;
    headcount_gap_change: number;
    sla_risk_change: number;
    trend: 'improving' | 'stable' | 'degrading';
  };
  
  computation_time_ms: number;
}

/**
 * Request for KPI history
 */
export interface GetKPIHistoryRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  start_time: string;
  end_time: string;
  
  // Aggregation interval
  interval?: 'minute' | '5min' | '15min' | 'hour';
  
  // Metrics to include
  metrics?: ('utilization' | 'headcount_gap' | 'sla_risk' | 'health_score')[];
}

/**
 * Response with KPI history
 */
export interface GetKPIHistoryResponse {
  success: boolean;
  data_points: LiveKPISnapshot[];
  
  // Summary statistics
  summary: {
    avg_utilization: number;
    avg_headcount_gap: number;
    avg_sla_risk_score: number;
    avg_health_score: number;
    
    peak_utilization: number;
    peak_headcount_gap: number;
    peak_risk_score: number;
    
    min_utilization: number;
    min_headcount_gap: number;
    min_risk_score: number;
    
    // Time periods
    critical_risk_duration_minutes: number;
    understaffed_duration_minutes: number;
    optimal_staffing_duration_minutes: number;
  };
  
  total_count: number;
  time_range: {
    start: string;
    end: string;
  };
}

/**
 * KPI dashboard summary for multiple queues
 */
export interface KPIDashboardRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  
  // Include all queues or specific list
  queue_names?: string[];
  
  // Time window
  as_of_time?: string;
}

/**
 * Dashboard response with multiple queue KPIs
 */
export interface KPIDashboardResponse {
  success: boolean;
  timestamp: string;
  
  // Overall organization/department metrics
  overall: {
    total_queues: number;
    queues_at_risk: number;
    total_headcount: number;
    total_required: number;
    overall_utilization: number;
    overall_sla_compliance: number;
    critical_alerts: number;
  };
  
  // Per-queue breakdowns
  queues: Array<{
    queue_name: string;
    snapshot: LiveKPISnapshot;
    rank_by_risk: number;
  }>;
  
  // Top priority actions across all queues
  top_priority_actions: RecommendedAction[];
  
  computation_time_ms: number;
}

// ==============================================
// KPI ALERT RULES
// ==============================================

/**
 * KPI alert rule configuration
 */
export interface KPIAlertRule {
  rule_id: string;
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  rule_name: string;
  enabled: boolean;
  
  // Alert trigger type
  alert_type: 
    | 'utilization_low'
    | 'utilization_high'
    | 'headcount_gap_critical'
    | 'sla_risk_high'
    | 'sla_breach_imminent'
    | 'health_score_low'
    | 'efficiency_low'
    | 'backlog_surge';
  
  // Threshold conditions
  threshold_value: number;
  comparison_operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  
  // Alert severity
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Notification settings
  notification_channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  notification_recipients: string[];
  
  // Cooldown to prevent alert spam (minutes)
  cooldown_minutes: number;
  
  created_at: string;
  updated_at: string;
}

/**
 * Request to create KPI alert rule
 */
export interface CreateKPIAlertRequest {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  rule_name: string;
  alert_type: KPIAlertRule['alert_type'];
  threshold_value: number;
  comparison_operator: KPIAlertRule['comparison_operator'];
  severity: KPIAlertRule['severity'];
  
  notification_channels: KPIAlertRule['notification_channels'];
  notification_recipients: string[];
  cooldown_minutes?: number;
}

/**
 * Triggered KPI alert
 */
export interface KPIAlert {
  alert_id: string;
  rule_id: string;
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  alert_type: KPIAlertRule['alert_type'];
  severity: KPIAlertRule['severity'];
  
  // Alert details
  message: string;
  current_value: number;
  threshold_value: number;
  
  // Associated KPI snapshot
  snapshot_id: string;
  
  // Alert status
  status: 'active' | 'acknowledged' | 'resolved';
  
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

// ==============================================
// REAL-TIME SUBSCRIPTIONS
// ==============================================

/**
 * KPI subscription options for real-time updates
 */
export interface KPISubscriptionOptions {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  // Subscribe to specific metric changes
  metrics?: ('utilization' | 'headcount_gap' | 'sla_risk' | 'health_score')[];
  
  // Only notify on significant changes (percentage threshold)
  change_threshold_percentage?: number;
  
  // Alert-only mode (only send when alerts trigger)
  alerts_only?: boolean;
}

/**
 * Real-time KPI update payload
 */
export interface KPIUpdatePayload {
  event_type: 'kpi_computed' | 'kpi_alert' | 'kpi_threshold_exceeded';
  snapshot?: LiveKPISnapshot;
  alert?: KPIAlert;
  timestamp: string;
}

// ==============================================
// COMPUTATION CONFIGURATION
// ==============================================

/**
 * Configuration for KPI computation engine
 */
export interface KPIComputationConfig {
  // Utilization settings
  target_utilization_percentage: number;
  utilization_warning_threshold: number;
  utilization_critical_threshold: number;
  
  // Staffing settings
  optimal_coverage_ratio_min: number;
  optimal_coverage_ratio_max: number;
  critical_understaffed_threshold: number;
  
  // SLA settings
  target_sla_percentage: number;
  sla_warning_threshold: number;
  sla_critical_threshold: number;
  target_wait_time_minutes: number;
  
  // Health score weights
  health_score_weights: {
    utilization: number;
    coverage: number;
    sla_compliance: number;
    efficiency: number;
  };
  
  // Data freshness requirements
  max_attendance_data_age_seconds: number;
  max_backlog_data_age_seconds: number;
  
  // Work rate assumptions
  default_items_per_hour_per_person: number;
  
  // Computation frequency
  auto_compute_interval_seconds: number;
}
