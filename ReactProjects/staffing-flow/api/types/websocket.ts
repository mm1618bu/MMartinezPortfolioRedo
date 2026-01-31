/**
 * WebSocket Server Types
 * Real-time bi-directional communication for intraday console
 */

// ==============================================
// CONNECTION TYPES
// ==============================================

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

/**
 * Client connection info
 */
export interface ClientConnection {
  socket_id: string;
  user_id?: string;
  organization_id?: string;
  department_id?: string;
  
  // Connection metadata
  connected_at: string;
  last_activity_at: string;
  ip_address?: string;
  user_agent?: string;
  
  // Subscriptions
  subscriptions: string[];
  
  // Connection state
  status: ConnectionStatus;
  reconnect_attempts?: number;
}

/**
 * Room/channel for grouped communications
 */
export interface WebSocketRoom {
  room_id: string;
  room_type: 'organization' | 'department' | 'queue' | 'user' | 'custom';
  
  // Room identifiers
  organization_id?: string;
  department_id?: string;
  queue_name?: string;
  
  // Members
  member_count: number;
  member_socket_ids: string[];
  
  created_at: string;
}

// ==============================================
// MESSAGE TYPES
// ==============================================

/**
 * Message event types
 */
export type MessageEvent = 
  // KPI updates
  | 'kpi:update'
  | 'kpi:computed'
  | 'kpi:alert'
  
  // Backlog updates
  | 'backlog:update'
  | 'backlog:snapshot'
  | 'backlog:alert'
  
  // Attendance updates
  | 'attendance:update'
  | 'attendance:checkin'
  | 'attendance:checkout'
  | 'attendance:alert'
  
  // Alert updates
  | 'alert:triggered'
  | 'alert:acknowledged'
  | 'alert:resolved'
  | 'alert:escalated'
  
  // System events
  | 'system:notification'
  | 'system:broadcast'
  | 'system:maintenance'
  
  // Client events
  | 'client:subscribe'
  | 'client:unsubscribe'
  | 'client:ping'
  | 'client:pong';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = any> {
  // Message identification
  message_id: string;
  event: MessageEvent;
  
  // Payload
  data: T;
  
  // Metadata
  timestamp: string;
  organization_id?: string;
  department_id?: string;
  queue_name?: string;
  
  // Message properties
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Acknowledgment
  requires_ack?: boolean;
  ack_timeout_ms?: number;
}

/**
 * Message acknowledgment
 */
export interface MessageAcknowledgment {
  message_id: string;
  socket_id: string;
  acknowledged_at: string;
  status: 'received' | 'processed' | 'failed';
  error_message?: string;
}

// ==============================================
// SUBSCRIPTION TYPES
// ==============================================

/**
 * Subscription channel types
 */
export type SubscriptionChannel = 
  | 'kpi'
  | 'backlog'
  | 'attendance'
  | 'alerts'
  | 'notifications'
  | 'all';

/**
 * Subscription request
 */
export interface SubscribeRequest {
  channels: SubscriptionChannel[];
  
  // Scope filters
  organization_id?: string;
  department_id?: string;
  site_id?: string;
  queue_name?: string;
  
  // Filter options
  filters?: {
    min_severity?: string;
    sources?: string[];
    statuses?: string[];
  };
}

/**
 * Subscription response
 */
export interface SubscribeResponse {
  success: boolean;
  subscribed_channels: SubscriptionChannel[];
  subscription_id: string;
  message?: string;
}

/**
 * Unsubscribe request
 */
export interface UnsubscribeRequest {
  channels?: SubscriptionChannel[];
  subscription_id?: string;
}

// ==============================================
// DATA UPDATE TYPES
// ==============================================

/**
 * Utilization metrics (nested in KPI payload)
 */
export interface UtilizationMetrics {
  current_utilization: number;
  target_utilization: number;
  utilization_variance: number;
  productive_hours: number;
  available_hours: number;
  idle_hours: number;
  active_staff_count: number;
  staff_on_break: number;
  idle_staff_count: number;
  avg_work_rate: number;
  efficiency_score: number;
}

/**
 * Headcount gap metrics (nested in KPI payload)
 */
export interface HeadcountGapMetrics {
  headcount_gap: number;
  current_headcount: number;
  required_headcount: number;
  coverage_ratio: number;
  staffing_level: 'critical_understaffed' | 'understaffed' | 'optimal' | 'overstaffed' | 'critical_overstaffed';
  absent_count: number;
  late_count: number;
}

/**
 * SLA risk metrics (nested in KPI payload)
 */
export interface SLARiskMetrics {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_percentage: number;
  average_wait_time_minutes: number;
  items_at_risk: number;
  sla_threshold_minutes: number;
}

/**
 * KPI changes (nested in KPI payload)
 */
export interface KPIChanges {
  utilization_change: number;
  headcount_gap_change: number;
  sla_risk_change: number;
  health_score_change: number;
}

/**
 * Headcount gap metrics (nested in KPI payload)
 */
export interface HeadcountGapMetrics {
  headcount_gap: number;
  current_headcount: number;
  required_headcount: number;
  coverage_ratio: number;
  staffing_level: 'critical_understaffed' | 'understaffed' | 'optimal' | 'overstaffed' | 'critical_overstaffed';
  absent_count: number;
  late_count: number;
}

/**
 * SLA risk metrics (nested in KPI payload)
 */
export interface SLARiskMetrics {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_percentage: number;
  average_wait_time_minutes: number;
  items_at_risk: number;
  sla_threshold_minutes: number;
}

/**
 * KPI changes (nested in KPI payload)
 */
export interface KPIChanges {
  utilization_change: number;
  headcount_gap_change: number;
  sla_risk_change: number;
  health_score_change: number;
}

/**
 * KPI update payload
 */
export interface KPIUpdatePayload {
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  // Nested metrics
  utilization: UtilizationMetrics;
  headcount_gap: HeadcountGapMetrics;
  sla_risk: SLARiskMetrics;
  health_score: number;
  
  // Changes
  changes?: KPIChanges;
  
  timestamp: string;
}

/**
 * Backlog update payload
 */
export interface BacklogUpdatePayload {
  snapshot_id: string;
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  // Metrics
  total_items: number;
  avg_wait_time_minutes: number;
  items_over_sla: number;
  sla_compliance_percentage: number;
  
  // Changes
  backlog_trend: 'growing' | 'stable' | 'decreasing';
  items_added_this_interval: number;
  items_completed_this_interval: number;
  
  timestamp: string;
}

/**
 * Attendance update payload
 */
export interface AttendanceUpdatePayload {
  snapshot_id: string;
  organization_id: string;
  department_id?: string;
  
  // Metrics
  scheduled_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
  
  // Recent events
  recent_checkins: Array<{
    employee_id: string;
    employee_name: string;
    checked_in_at: string;
    status: string;
  }>;
  
  timestamp: string;
}

/**
 * Alert update payload
 */
export interface AlertUpdatePayload {
  alert_id: string;
  rule_id: string;
  
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: 'kpi' | 'backlog' | 'attendance' | 'schedule' | 'system';
  
  message: string;
  current_value: any;
  threshold_value: any;
  
  status: 'pending' | 'active' | 'acknowledged' | 'resolved';
  
  organization_id: string;
  department_id?: string;
  queue_name?: string;
  
  timestamp: string;
}

// ==============================================
// BROADCAST TYPES
// ==============================================

/**
 * Broadcast request
 */
export interface BroadcastRequest {
  event: MessageEvent;
  data: any;
  
  // Target scope
  target?: {
    organization_id?: string;
    department_id?: string;
    queue_name?: string;
    user_ids?: string[];
    socket_ids?: string[];
  };
  
  // Message properties
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  requires_ack?: boolean;
}

/**
 * Broadcast response
 */
export interface BroadcastResponse {
  success: boolean;
  message_id: string;
  recipients_count: number;
  sent_at: string;
}

// ==============================================
// STATISTICS TYPES
// ==============================================

/**
 * WebSocket server statistics
 */
export interface WebSocketStats {
  // Connection stats
  total_connections: number;
  active_connections: number;
  connections_by_org: Record<string, number>;
  
  // Room stats
  total_rooms: number;
  rooms_by_type: Record<string, number>;
  
  // Message stats
  messages_sent_total: number;
  messages_sent_per_second: number;
  messages_by_event: Record<MessageEvent, number>;
  
  // Performance
  avg_latency_ms: number;
  max_latency_ms: number;
  
  // Errors
  error_count: number;
  last_error?: string;
  
  // Server info
  uptime_seconds: number;
  server_start_time: string;
}

/**
 * Connection metrics
 */
export interface ConnectionMetrics {
  socket_id: string;
  
  // Activity
  messages_received: number;
  messages_sent: number;
  last_message_at: string;
  
  // Performance
  avg_response_time_ms: number;
  
  // Subscriptions
  active_subscriptions: number;
  
  // Connection quality
  reconnect_count: number;
  error_count: number;
}

// ==============================================
// CONFIGURATION TYPES
// ==============================================

/**
 * WebSocket server configuration
 */
export interface WebSocketConfig {
  // Server settings
  port?: number;
  path?: string;
  
  // CORS settings
  cors_origins: string[];
  
  // Connection limits
  max_connections_per_org: number;
  max_connections_total: number;
  
  // Message limits
  max_message_size_bytes: number;
  max_messages_per_second_per_client: number;
  
  // Timeouts
  ping_interval_ms: number;
  ping_timeout_ms: number;
  connection_timeout_ms: number;
  
  // Reconnection
  reconnection_enabled: boolean;
  reconnection_attempts: number;
  reconnection_delay_ms: number;
  
  // Room settings
  max_room_size: number;
  room_cleanup_interval_ms: number;
  
  // Authentication
  require_authentication: boolean;
  auth_timeout_ms: number;
  
  // Compression
  enable_compression: boolean;
  compression_threshold_bytes: number;
  
  // Logging
  log_all_messages: boolean;
  log_connection_events: boolean;
}

// ==============================================
// ERROR TYPES
// ==============================================

/**
 * WebSocket error codes
 */
export enum WebSocketErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  CONNECTION_LIMIT_REACHED = 'CONNECTION_LIMIT_REACHED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * WebSocket error
 */
export interface WebSocketError {
  code: WebSocketErrorCode;
  message: string;
  details?: any;
  timestamp: string;
}

// ==============================================
// AUTHENTICATION TYPES
// ==============================================

/**
 * Authentication request
 */
export interface AuthenticateRequest {
  token?: string;
  user_id?: string;
  organization_id?: string;
  session_id?: string;
}

/**
 * Authentication response
 */
export interface AuthenticateResponse {
  success: boolean;
  socket_id: string;
  user_id?: string;
  organization_id?: string;
  permissions?: string[];
  expires_at?: string;
  message?: string;
}

// ==============================================
// HEALTH CHECK TYPES
// ==============================================

/**
 * Health check response
 */
export interface WebSocketHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connections: boolean;
    memory: boolean;
    latency: boolean;
    rooms: boolean;
  };
  stats: WebSocketStats;
  timestamp: string;
}
