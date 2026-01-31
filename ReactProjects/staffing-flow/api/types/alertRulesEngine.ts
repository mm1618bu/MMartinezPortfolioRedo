/**
 * Alert Rules Engine Types
 * Centralized alerting infrastructure for intraday console
 */

// ==============================================
// ALERT RULE TYPES
// ==============================================

/**
 * Alert source systems
 */
export type AlertSource = 'kpi' | 'backlog' | 'attendance' | 'schedule' | 'system';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert status lifecycle
 */
export type AlertStatus = 
  | 'pending'      // Rule triggered, awaiting notification
  | 'active'       // Notification sent, awaiting acknowledgment
  | 'acknowledged' // Acknowledged by user
  | 'resolved'     // Condition no longer true
  | 'expired'      // Auto-expired after max duration
  | 'suppressed';  // Suppressed by rule or schedule

/**
 * Comparison operators for threshold evaluation
 */
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between' | 'not_between';

/**
 * Notification channels
 */
export type NotificationChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'in_app' | 'push';

/**
 * Alert rule schedule
 */
export interface AlertSchedule {
  // Days of week (0 = Sunday, 6 = Saturday)
  days_of_week?: number[];
  
  // Time range (HH:MM format)
  start_time?: string;
  end_time?: string;
  
  // Timezone
  timezone?: string;
  
  // Exclude holidays
  exclude_holidays?: boolean;
}

/**
 * Alert escalation configuration
 */
export interface AlertEscalation {
  enabled: boolean;
  
  // Escalate after this many minutes without acknowledgment
  escalate_after_minutes: number;
  
  // Escalation levels
  levels: Array<{
    level: number;
    recipients: string[];
    channels: NotificationChannel[];
  }>;
}

/**
 * Alert grouping configuration
 */
export interface AlertGrouping {
  enabled: boolean;
  
  // Group alerts within this time window (minutes)
  window_minutes: number;
  
  // Group by these fields
  group_by: ('organization_id' | 'department_id' | 'queue_name' | 'alert_type')[];
  
  // Maximum alerts before grouping
  max_before_grouping: number;
}

/**
 * Alert suppression rule
 */
export interface AlertSuppression {
  enabled: boolean;
  
  // Suppress during specific schedule
  schedule?: AlertSchedule;
  
  // Suppress if another alert is active
  suppress_if_alert_active?: {
    alert_type: string;
    severity?: AlertSeverity[];
  };
  
  // Suppress if condition met
  suppress_if_condition?: {
    field: string;
    operator: ComparisonOperator;
    value: any;
  };
}

/**
 * Comprehensive alert rule
 */
export interface AlertRule {
  // Identification
  rule_id: string;
  rule_name: string;
  description?: string;
  
  // Scope
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  // Rule configuration
  source: AlertSource;
  alert_type: string;
  severity: AlertSeverity;
  enabled: boolean;
  
  // Condition evaluation
  condition: {
    field: string;
    operator: ComparisonOperator;
    threshold_value: any;
    threshold_value_secondary?: any; // For 'between' operator
  };
  
  // Additional conditions (AND logic)
  additional_conditions?: Array<{
    field: string;
    operator: ComparisonOperator;
    value: any;
  }>;
  
  // Notification settings
  notification_channels: NotificationChannel[];
  notification_recipients: string[];
  
  // Custom notification templates
  notification_template?: {
    subject?: string;
    body?: string;
    variables?: Record<string, any>;
  };
  
  // Cooldown to prevent spam (minutes)
  cooldown_minutes: number;
  
  // Last triggered timestamp
  last_triggered_at?: string;
  
  // Alert lifecycle settings
  auto_resolve_after_minutes?: number; // Auto-resolve if condition no longer met
  auto_expire_after_minutes?: number;  // Auto-expire if unacknowledged
  
  // Advanced features
  schedule?: AlertSchedule;
  escalation?: AlertEscalation;
  grouping?: AlertGrouping;
  suppression?: AlertSuppression;
  
  // Alert priority (1-5, higher = more important)
  priority: number;
  
  // Metadata
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Statistics
  trigger_count?: number;
  last_notification_sent_at?: string;
}

// ==============================================
// ALERT INSTANCE TYPES
// ==============================================

/**
 * Triggered alert instance
 */
export interface Alert {
  // Identification
  alert_id: string;
  rule_id: string;
  
  // Rule snapshot (for historical context)
  rule_name: string;
  alert_type: string;
  severity: AlertSeverity;
  source: AlertSource;
  
  // Scope
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  // Alert details
  message: string;
  description?: string;
  
  // Condition values
  current_value: any;
  threshold_value: any;
  variance?: number;
  
  // Related data
  related_snapshot_id?: string; // KPI/backlog/attendance snapshot
  related_entity_id?: string;
  
  // Status
  status: AlertStatus;
  
  // Lifecycle timestamps
  triggered_at: string;
  notified_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  
  // Notification tracking
  notifications_sent: Array<{
    channel: NotificationChannel;
    recipient: string;
    sent_at: string;
    success: boolean;
    error_message?: string;
  }>;
  
  // Escalation tracking
  escalation_level?: number;
  escalated_at?: string;
  
  // Grouping
  group_id?: string;
  is_grouped?: boolean;
  
  // Metadata
  tags?: string[];
  custom_data?: Record<string, any>;
}

/**
 * Alert group (multiple related alerts)
 */
export interface AlertGroup {
  group_id: string;
  
  // Grouping criteria
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  alert_type?: string;
  
  // Grouped alerts
  alert_ids: string[];
  alert_count: number;
  
  // Group summary
  highest_severity: AlertSeverity;
  status: AlertStatus;
  
  // Group message
  group_message: string;
  
  // Timestamps
  first_alert_at: string;
  last_alert_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  
  // Notification sent for group
  group_notification_sent: boolean;
  group_notification_sent_at?: string;
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================

/**
 * Create alert rule request
 */
export interface CreateAlertRuleRequest {
  rule_name: string;
  description?: string;
  organization_id: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  source: AlertSource;
  alert_type: string;
  severity: AlertSeverity;
  
  condition: AlertRule['condition'];
  additional_conditions?: AlertRule['additional_conditions'];
  
  notification_channels: NotificationChannel[];
  notification_recipients: string[];
  notification_template?: AlertRule['notification_template'];
  
  cooldown_minutes?: number;
  auto_resolve_after_minutes?: number;
  auto_expire_after_minutes?: number;
  
  schedule?: AlertSchedule;
  escalation?: AlertEscalation;
  grouping?: AlertGrouping;
  suppression?: AlertSuppression;
  
  priority?: number;
  tags?: string[];
}

/**
 * Update alert rule request
 */
export interface UpdateAlertRuleRequest {
  rule_id: string;
  enabled?: boolean;
  severity?: AlertSeverity;
  condition?: Partial<AlertRule['condition']>;
  notification_channels?: NotificationChannel[];
  notification_recipients?: string[];
  cooldown_minutes?: number;
  priority?: number;
}

/**
 * List alert rules request
 */
export interface ListAlertRulesRequest {
  organization_id: string;
  department_id?: string;
  source?: AlertSource;
  enabled?: boolean;
  severity?: AlertSeverity[];
  page?: number;
  page_size?: number;
}

/**
 * List alert rules response
 */
export interface ListAlertRulesResponse {
  success: boolean;
  rules: AlertRule[];
  total_count: number;
  page: number;
  page_size: number;
}

/**
 * Evaluate rules request
 */
export interface EvaluateRulesRequest {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  // Specific source to evaluate
  source?: AlertSource;
  
  // Force evaluation even if in cooldown
  force?: boolean;
  
  // Context data for evaluation
  context?: Record<string, any>;
}

/**
 * Evaluate rules response
 */
export interface EvaluateRulesResponse {
  success: boolean;
  rules_evaluated: number;
  alerts_triggered: number;
  alerts_suppressed: number;
  triggered_alerts: Alert[];
  evaluation_time_ms: number;
}

/**
 * List alerts request
 */
export interface ListAlertsRequest {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  status?: AlertStatus[];
  severity?: AlertSeverity[];
  source?: AlertSource;
  
  start_time?: string;
  end_time?: string;
  
  page?: number;
  page_size?: number;
  sort_by?: 'triggered_at' | 'severity' | 'status';
  sort_order?: 'asc' | 'desc';
}

/**
 * List alerts response
 */
export interface ListAlertsResponse {
  success: boolean;
  alerts: Alert[];
  total_count: number;
  page: number;
  page_size: number;
  
  // Summary statistics
  summary: {
    active_count: number;
    critical_count: number;
    acknowledged_count: number;
    unacknowledged_count: number;
  };
}

/**
 * Acknowledge alert request
 */
export interface AcknowledgeAlertRequest {
  alert_id: string;
  acknowledged_by: string;
  notes?: string;
}

/**
 * Resolve alert request
 */
export interface ResolveAlertRequest {
  alert_id: string;
  resolved_by: string;
  resolution_notes?: string;
}

/**
 * Alert history/analytics request
 */
export interface AlertAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  
  start_time: string;
  end_time: string;
  
  // Grouping
  group_by?: ('source' | 'severity' | 'alert_type' | 'department' | 'queue')[];
}

/**
 * Alert history/analytics response
 */
export interface AlertAnalyticsResponse {
  success: boolean;
  
  // Summary metrics
  summary: {
    total_alerts: number;
    critical_alerts: number;
    avg_time_to_acknowledge_minutes: number;
    avg_time_to_resolve_minutes: number;
    top_alert_types: Array<{ type: string; count: number }>;
    top_queues_by_alerts: Array<{ queue: string; count: number }>;
  };
  
  // Time series data
  time_series: Array<{
    timestamp: string;
    alert_count: number;
    critical_count: number;
  }>;
  
  // Breakdowns
  by_severity: Record<AlertSeverity, number>;
  by_source: Record<AlertSource, number>;
  by_status: Record<AlertStatus, number>;
  
  // Alert trends
  trend: 'increasing' | 'stable' | 'decreasing';
  trend_percentage: number;
}

// ==============================================
// NOTIFICATION TYPES
// ==============================================

/**
 * Notification payload
 */
export interface NotificationPayload {
  notification_id: string;
  alert_id: string;
  
  channel: NotificationChannel;
  recipient: string;
  
  // Notification content
  subject: string;
  body: string;
  
  // Rendering context
  template_variables?: Record<string, any>;
  
  // Priority/urgency
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Action buttons/links
  actions?: Array<{
    label: string;
    url: string;
    type: 'acknowledge' | 'resolve' | 'view' | 'custom';
  }>;
  
  // Metadata
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  
  // Retry tracking
  retry_count?: number;
  last_error?: string;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  template_id: string;
  template_name: string;
  
  source: AlertSource;
  alert_type: string;
  
  // Channel-specific templates
  templates: {
    email?: {
      subject: string;
      body_html: string;
      body_text: string;
    };
    sms?: {
      body: string;
    };
    slack?: {
      text: string;
      blocks?: any[]; // Slack Block Kit
    };
    webhook?: {
      payload: Record<string, any>;
    };
    in_app?: {
      title: string;
      body: string;
    };
  };
  
  // Template variables
  variables: string[];
  
  created_at: string;
  updated_at: string;
}

// ==============================================
// REAL-TIME SUBSCRIPTION TYPES
// ==============================================

/**
 * Alert subscription options
 */
export interface AlertSubscriptionOptions {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  // Filter by severity
  min_severity?: AlertSeverity;
  
  // Filter by sources
  sources?: AlertSource[];
  
  // Only new alerts (exclude updates)
  new_alerts_only?: boolean;
}

/**
 * Alert event payload for real-time updates
 */
export interface AlertEventPayload {
  event_type: 'alert_triggered' | 'alert_acknowledged' | 'alert_resolved' | 'alert_escalated';
  alert: Alert;
  timestamp: string;
}

// ==============================================
// RULE ENGINE CONFIGURATION
// ==============================================

/**
 * Alert rules engine configuration
 */
export interface AlertEngineConfig {
  // Evaluation frequency
  evaluation_interval_seconds: number;
  
  // Batch processing
  max_rules_per_evaluation: number;
  
  // Notification settings
  notification_retry_attempts: number;
  notification_retry_delay_seconds: number;
  
  // Alert lifecycle
  default_cooldown_minutes: number;
  default_auto_expire_minutes: number;
  default_auto_resolve_minutes: number;
  
  // Grouping defaults
  default_grouping_window_minutes: number;
  default_max_before_grouping: number;
  
  // Escalation defaults
  default_escalation_delay_minutes: number;
  
  // Performance limits
  max_active_alerts_per_queue: number;
  max_notifications_per_minute: number;
  
  // Archive settings
  archive_resolved_after_days: number;
  archive_expired_after_days: number;
}
