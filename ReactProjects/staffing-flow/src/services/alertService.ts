/**
 * Frontend service for Alert Rules Engine
 * Centralized alerting infrastructure client
 */

import type {
  AlertRule,
  Alert,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  ListAlertRulesRequest,
  ListAlertRulesResponse,
  EvaluateRulesRequest,
  EvaluateRulesResponse,
  ListAlertsRequest,
  ListAlertsResponse,
  AcknowledgeAlertRequest,
  ResolveAlertRequest,
  AlertAnalyticsRequest,
  AlertAnalyticsResponse,
  AlertSubscriptionOptions,
  AlertEventPayload,
} from '../../api/types/alertRulesEngine';

const API_BASE = '/api/alerts';

// ==============================================
// ALERT RULE MANAGEMENT
// ==============================================

/**
 * Create a new alert rule
 */
export async function createAlertRule(request: CreateAlertRuleRequest): Promise<AlertRule> {
  const response = await fetch(`${API_BASE}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create alert rule');
  }

  return response.json();
}

/**
 * Update an existing alert rule
 */
export async function updateAlertRule(request: UpdateAlertRuleRequest): Promise<AlertRule> {
  const response = await fetch(`${API_BASE}/rules/${request.rule_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update alert rule');
  }

  return response.json();
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(ruleId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/rules/${ruleId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete alert rule');
  }
}

/**
 * List alert rules
 */
export async function listAlertRules(request: ListAlertRulesRequest): Promise<ListAlertRulesResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.source) params.append('source', request.source);
  if (request.enabled !== undefined) params.append('enabled', request.enabled.toString());
  if (request.severity) params.append('severity', request.severity.join(','));
  if (request.page) params.append('page', request.page.toString());
  if (request.page_size) params.append('page_size', request.page_size.toString());

  const response = await fetch(`${API_BASE}/rules?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list alert rules');
  }

  return response.json();
}

/**
 * Enable/disable an alert rule
 */
export async function toggleAlertRule(ruleId: string, enabled: boolean): Promise<AlertRule> {
  return updateAlertRule({ rule_id: ruleId, enabled });
}

// ==============================================
// RULE EVALUATION
// ==============================================

/**
 * Evaluate alert rules
 */
export async function evaluateRules(request: EvaluateRulesRequest): Promise<EvaluateRulesResponse> {
  const response = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to evaluate rules');
  }

  return response.json();
}

/**
 * Evaluate rules via GET (for scheduled jobs)
 */
export async function evaluateRulesGet(
  organizationId: string,
  options?: {
    departmentId?: string;
    queueName?: string;
    source?: string;
    force?: boolean;
  }
): Promise<EvaluateRulesResponse> {
  const params = new URLSearchParams();
  params.append('organization_id', organizationId);
  
  if (options?.departmentId) params.append('department_id', options.departmentId);
  if (options?.queueName) params.append('queue_name', options.queueName);
  if (options?.source) params.append('source', options.source);
  if (options?.force) params.append('force', 'true');

  const response = await fetch(`${API_BASE}/evaluate?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to evaluate rules');
  }

  return response.json();
}

// ==============================================
// ALERT MANAGEMENT
// ==============================================

/**
 * List alerts
 */
export async function listAlerts(request: ListAlertsRequest): Promise<ListAlertsResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.queue_name) params.append('queue_name', request.queue_name);
  if (request.status) params.append('status', request.status.join(','));
  if (request.severity) params.append('severity', request.severity.join(','));
  if (request.source) params.append('source', request.source);
  if (request.start_time) params.append('start_time', request.start_time);
  if (request.end_time) params.append('end_time', request.end_time);
  if (request.page) params.append('page', request.page.toString());
  if (request.page_size) params.append('page_size', request.page_size.toString());
  if (request.sort_by) params.append('sort_by', request.sort_by);
  if (request.sort_order) params.append('sort_order', request.sort_order);

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list alerts');
  }

  return response.json();
}

/**
 * Get a single alert by ID
 */
export async function getAlert(alertId: string): Promise<Alert> {
  const response = await fetch(`${API_BASE}/${alertId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get alert');
  }

  return response.json();
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(request: AcknowledgeAlertRequest): Promise<Alert> {
  const response = await fetch(`${API_BASE}/${request.alert_id}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acknowledged_by: request.acknowledged_by,
      notes: request.notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to acknowledge alert');
  }

  return response.json();
}

/**
 * Resolve an alert
 */
export async function resolveAlert(request: ResolveAlertRequest): Promise<Alert> {
  const response = await fetch(`${API_BASE}/${request.alert_id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resolved_by: request.resolved_by,
      resolution_notes: request.resolution_notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to resolve alert');
  }

  return response.json();
}

/**
 * Batch acknowledge alerts
 */
export async function batchAcknowledgeAlerts(
  alertIds: string[],
  acknowledgedBy: string,
  notes?: string
): Promise<Alert[]> {
  const results = await Promise.all(
    alertIds.map(alertId =>
      acknowledgeAlert({ alert_id: alertId, acknowledged_by: acknowledgedBy, notes })
    )
  );
  return results;
}

/**
 * Batch resolve alerts
 */
export async function batchResolveAlerts(
  alertIds: string[],
  resolvedBy: string,
  resolutionNotes?: string
): Promise<Alert[]> {
  const results = await Promise.all(
    alertIds.map(alertId =>
      resolveAlert({ alert_id: alertId, resolved_by: resolvedBy, resolution_notes: resolutionNotes })
    )
  );
  return results;
}

// ==============================================
// ANALYTICS
// ==============================================

/**
 * Get alert analytics
 */
export async function getAlertAnalytics(request: AlertAnalyticsRequest): Promise<AlertAnalyticsResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  params.append('start_time', request.start_time);
  params.append('end_time', request.end_time);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.group_by) params.append('group_by', request.group_by.join(','));

  const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get alert analytics');
  }

  return response.json();
}

/**
 * Get alert summary (for dashboard)
 */
export async function getAlertSummary(organizationId: string): Promise<{
  success: boolean;
  active_alerts: number;
  critical_alerts: number;
  unacknowledged_alerts: number;
  timestamp: string;
}> {
  const params = new URLSearchParams();
  params.append('organization_id', organizationId);

  const response = await fetch(`${API_BASE}/summary?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get alert summary');
  }

  return response.json();
}

// ==============================================
// REAL-TIME SUBSCRIPTIONS
// ==============================================

/**
 * Subscribe to real-time alert updates
 */
export function subscribeToAlerts(
  options: AlertSubscriptionOptions,
  callback: (payload: AlertEventPayload) => void
): () => void {
  // Import Supabase client
  import('../utils/supabaseClient').then(({ supabase }: any) => {
    const channel = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: options.organization_id
            ? `organization_id=eq.${options.organization_id}`
            : undefined,
        },
        (payload) => {
          const alert = payload.new as any as Alert;
          
          // Apply filters
          if (options.department_id && alert.department_id !== options.department_id) {
            return;
          }
          if (options.queue_name && alert.queue_name !== options.queue_name) {
            return;
          }
          if (options.min_severity) {
            const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
            if (severityOrder[alert.severity] > severityOrder[options.min_severity]) {
              return;
            }
          }
          if (options.sources && !options.sources.includes(alert.source)) {
            return;
          }
          
          // Determine event type
          let eventType: AlertEventPayload['event_type'] = 'alert_triggered';
          if (payload.eventType === 'UPDATE') {
            if (alert.status === 'acknowledged') {
              eventType = 'alert_acknowledged';
            } else if (alert.status === 'resolved') {
              eventType = 'alert_resolved';
            } else if (alert.escalation_level !== undefined) {
              eventType = 'alert_escalated';
            }
          }
          
          // Skip non-new alerts if requested
          if (options.new_alerts_only && eventType !== 'alert_triggered') {
            return;
          }
          
          callback({
            event_type: eventType,
            alert,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  });

  // Return no-op unsubscribe if module not loaded yet
  return () => {};
}

/**
 * Health check for alert service
 */
export async function checkAlertServiceHealth(): Promise<{
  status: string;
  service: string;
  timestamp: string;
}> {
  const response = await fetch(`${API_BASE}/health`);
  
  if (!response.ok) {
    throw new Error('Service unhealthy');
  }
  
  return response.json();
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Get active alerts count
 */
export async function getActiveAlertsCount(organizationId: string): Promise<number> {
  const result = await listAlerts({
    organization_id: organizationId,
    status: ['active', 'pending'],
    page: 1,
    page_size: 1,
  });
  return result.total_count;
}

/**
 * Get critical alerts count
 */
export async function getCriticalAlertsCount(organizationId: string): Promise<number> {
  const result = await listAlerts({
    organization_id: organizationId,
    severity: ['critical'],
    status: ['active'],
    page: 1,
    page_size: 1,
  });
  return result.total_count;
}

/**
 * Get unacknowledged alerts
 */
export async function getUnacknowledgedAlerts(organizationId: string): Promise<Alert[]> {
  const result = await listAlerts({
    organization_id: organizationId,
    status: ['active', 'pending'],
    page: 1,
    page_size: 100,
  });
  return result.alerts.filter(a => !a.acknowledged_at);
}

/**
 * Check if there are any critical alerts
 */
export async function hasCriticalAlerts(organizationId: string): Promise<boolean> {
  const count = await getCriticalAlertsCount(organizationId);
  return count > 0;
}

/**
 * Custom hook for polling alerts
 */
export function useAlertPolling(
  organizationId: string,
  options?: {
    intervalSeconds?: number;
    enabled?: boolean;
    statusFilter?: string[];
  }
) {
  const intervalSeconds = options?.intervalSeconds || 30;
  const enabled = options?.enabled !== false;
  
  const fetchAlerts = async () => {
    return listAlerts({
      organization_id: organizationId,
      status: options?.statusFilter as any[],
      page: 1,
      page_size: 50,
      sort_by: 'triggered_at',
      sort_order: 'desc',
    });
  };
  
  return { fetchAlerts, intervalSeconds, enabled };
}
