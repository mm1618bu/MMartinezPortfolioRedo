/**
 * Backlog Snapshot Ingestion API Types
 * For tracking and ingesting real-time backlog data
 */

// =============================================
// BACKLOG SNAPSHOT TYPES
// =============================================

export interface BacklogSnapshot {
  id: string;
  snapshot_time: string;
  department_id?: string;
  site_id?: string;
  queue_name: string;
  total_items: number;
  priority_breakdown: PriorityBreakdown;
  age_distribution: AgeDistribution;
  sla_compliance: SLACompliance;
  avg_wait_time_minutes: number;
  longest_wait_time_minutes: number;
  items_added_last_hour: number;
  items_completed_last_hour: number;
  current_throughput_per_hour: number;
  staffed_employees: number;
  active_employees: number;
  idle_employees: number;
  metadata?: Record<string, any>;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface PriorityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface AgeDistribution {
  under_1_hour: number;
  one_to_4_hours: number;
  four_to_8_hours: number;
  over_8_hours: number;
}

export interface SLACompliance {
  within_sla: number;
  at_risk: number; // Within 80-100% of SLA
  breached: number; // Over SLA
  sla_target_minutes: number;
  compliance_percentage: number;
}

// =============================================
// INGESTION REQUEST/RESPONSE TYPES
// =============================================

export interface IngestBacklogSnapshotRequest {
  snapshot_time: string; // ISO timestamp
  department_id?: string;
  site_id?: string;
  queue_name: string;
  total_items: number;
  priority_breakdown: PriorityBreakdown;
  age_distribution: AgeDistribution;
  sla_compliance: SLACompliance;
  avg_wait_time_minutes: number;
  longest_wait_time_minutes: number;
  items_added_last_hour: number;
  items_completed_last_hour: number;
  current_throughput_per_hour: number;
  staffed_employees: number;
  active_employees: number;
  idle_employees: number;
  metadata?: Record<string, any>;
  organization_id: string;
}

export interface IngestBacklogSnapshotResponse {
  success: boolean;
  snapshot_id: string;
  snapshot_time: string;
  message: string;
}

export interface BatchIngestBacklogRequest {
  snapshots: IngestBacklogSnapshotRequest[];
  allow_duplicates?: boolean; // Allow same timestamp for same queue
}

export interface BatchIngestBacklogResponse {
  success: boolean;
  ingested_count: number;
  failed_count: number;
  snapshot_ids: string[];
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// =============================================
// QUERY TYPES
// =============================================

export interface ListBacklogSnapshotsRequest {
  organization_id?: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'snapshot_time' | 'total_items' | 'avg_wait_time_minutes';
  sort_order?: 'asc' | 'desc';
}

export interface ListBacklogSnapshotsResponse {
  snapshots: BacklogSnapshot[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GetBacklogTrendRequest {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  start_time: string;
  end_time: string;
  interval?: 'hour' | '15min' | '5min';
}

export interface BacklogTrendDataPoint {
  timestamp: string;
  total_items: number;
  avg_wait_time: number;
  sla_compliance_percentage: number;
  throughput_per_hour: number;
  active_employees: number;
}

export interface GetBacklogTrendResponse {
  queue_name: string;
  start_time: string;
  end_time: string;
  interval: string;
  data_points: BacklogTrendDataPoint[];
  summary: {
    avg_backlog: number;
    peak_backlog: number;
    min_backlog: number;
    avg_wait_time: number;
    avg_sla_compliance: number;
    total_items_processed: number;
  };
}

// =============================================
// ANALYTICS TYPES
// =============================================

export interface BacklogAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  time_period: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'custom';
  start_time?: string;
  end_time?: string;
}

export interface BacklogAnalyticsResponse {
  period: string;
  queue_name?: string;
  metrics: {
    avg_backlog_size: number;
    peak_backlog_size: number;
    min_backlog_size: number;
    avg_wait_time_minutes: number;
    max_wait_time_minutes: number;
    avg_sla_compliance: number;
    total_items_added: number;
    total_items_completed: number;
    net_change: number;
    avg_throughput_per_hour: number;
    avg_staffing_level: number;
    avg_utilization_percentage: number;
  };
  hourly_patterns: Array<{
    hour: number;
    avg_backlog: number;
    avg_wait_time: number;
    sla_compliance: number;
  }>;
  priority_distribution: PriorityBreakdown;
  age_distribution_avg: AgeDistribution;
}

// =============================================
// ALERT TYPES
// =============================================

export interface BacklogAlertRule {
  id: string;
  organization_id: string;
  department_id?: string;
  queue_name: string;
  alert_type: 'backlog_threshold' | 'wait_time_threshold' | 'sla_breach' | 'throughput_drop';
  threshold_value: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  duration_minutes?: number; // Alert only if condition persists
  notification_channels: Array<'email' | 'sms' | 'slack' | 'in_app'>;
  recipients: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBacklogAlertRequest {
  organization_id: string;
  department_id?: string;
  queue_name: string;
  alert_type: 'backlog_threshold' | 'wait_time_threshold' | 'sla_breach' | 'throughput_drop';
  threshold_value: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  duration_minutes?: number;
  notification_channels: Array<'email' | 'sms' | 'slack' | 'in_app'>;
  recipients: string[];
}

export interface BacklogAlert {
  id: string;
  rule_id: string;
  snapshot_id: string;
  triggered_at: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current_value: number;
  threshold_value: number;
  queue_name: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

// =============================================
// REAL-TIME SUBSCRIPTION TYPES
// =============================================

export interface BacklogSubscriptionOptions {
  organization_id: string;
  department_id?: string;
  queue_names?: string[];
  alert_only?: boolean;
}

export interface BacklogUpdatePayload {
  event_type: 'snapshot_created' | 'alert_triggered' | 'alert_resolved';
  snapshot?: BacklogSnapshot;
  alert?: BacklogAlert;
  timestamp: string;
}

// =============================================
// ERROR TYPES
// =============================================

export interface BacklogAPIError {
  error: string;
  details?: string;
  validation_errors?: Array<{
    field: string;
    message: string;
  }>;
}
