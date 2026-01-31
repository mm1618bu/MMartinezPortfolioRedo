/**
 * Frontend service for Live KPI API
 * Real-time operational metrics for intraday console
 */

import type {
  ComputeLiveKPIsRequest,
  ComputeLiveKPIsResponse,
  GetKPIHistoryRequest,
  GetKPIHistoryResponse,
  KPIDashboardRequest,
  KPIDashboardResponse,
  CreateKPIAlertRequest,
  KPIAlertRule,
  KPISubscriptionOptions,
  KPIUpdatePayload,
  LiveKPISnapshot,
} from '../../api/types/liveKpi';

const API_BASE = '/api/intraday/kpi';

/**
 * Compute live KPIs for a queue/department
 */
export async function computeLiveKPIs(
  request: ComputeLiveKPIsRequest
): Promise<ComputeLiveKPIsResponse> {
  const response = await fetch(`${API_BASE}/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to compute live KPIs');
  }

  return response.json();
}

/**
 * Compute live KPIs via GET request (for simpler polling)
 */
export async function computeLiveKPIsGet(
  organizationId: string,
  options?: {
    departmentId?: string;
    siteId?: string;
    queueName?: string;
    includeComparison?: boolean;
    comparisonPeriodMinutes?: number;
  }
): Promise<ComputeLiveKPIsResponse> {
  const params = new URLSearchParams();
  params.append('organization_id', organizationId);
  
  if (options?.departmentId) params.append('department_id', options.departmentId);
  if (options?.siteId) params.append('site_id', options.siteId);
  if (options?.queueName) params.append('queue_name', options.queueName);
  if (options?.includeComparison) params.append('include_comparison', 'true');
  if (options?.comparisonPeriodMinutes) {
    params.append('comparison_period_minutes', options.comparisonPeriodMinutes.toString());
  }

  const response = await fetch(`${API_BASE}/compute?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to compute live KPIs');
  }

  return response.json();
}

/**
 * Get historical KPI data
 */
export async function getKPIHistory(
  request: GetKPIHistoryRequest
): Promise<GetKPIHistoryResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  params.append('start_time', request.start_time);
  params.append('end_time', request.end_time);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.site_id) params.append('site_id', request.site_id);
  if (request.queue_name) params.append('queue_name', request.queue_name);
  if (request.interval) params.append('interval', request.interval);
  if (request.metrics) params.append('metrics', request.metrics.join(','));

  const response = await fetch(`${API_BASE}/history?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get KPI history');
  }

  return response.json();
}

/**
 * Get KPI dashboard for multiple queues
 */
export async function getKPIDashboard(
  request: KPIDashboardRequest
): Promise<KPIDashboardResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.site_id) params.append('site_id', request.site_id);
  if (request.queue_names) params.append('queue_names', request.queue_names.join(','));
  if (request.as_of_time) params.append('as_of_time', request.as_of_time);

  const response = await fetch(`${API_BASE}/dashboard?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get KPI dashboard');
  }

  return response.json();
}

/**
 * Get quick KPI summary (lightweight, for polling)
 */
export async function getQuickKPIs(
  organizationId: string,
  queueName?: string
): Promise<{
  success: boolean;
  timestamp: string;
  health_score: number;
  utilization: number;
  headcount_gap: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  critical_alerts: number;
}> {
  const params = new URLSearchParams();
  params.append('organization_id', organizationId);
  if (queueName) params.append('queue_name', queueName);

  const response = await fetch(`${API_BASE}/quick?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get quick KPIs');
  }

  return response.json();
}

/**
 * Create a KPI alert rule
 */
export async function createKPIAlert(
  request: CreateKPIAlertRequest
): Promise<KPIAlertRule> {
  const response = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create KPI alert');
  }

  return response.json();
}

/**
 * Subscribe to real-time KPI updates
 * Uses Supabase real-time subscriptions
 */
export function subscribeToKPIUpdates(
  options: KPISubscriptionOptions,
  callback: (payload: KPIUpdatePayload) => void
): () => void {
  // Import Supabase client
  import('../utils/supabaseClient').then(({ supabase }: any) => {
    const channel = supabase
      .channel('live-kpi-snapshots')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_kpi_snapshots',
          filter: options.organization_id
            ? `organization_id=eq.${options.organization_id}`
            : undefined,
        },
        (payload) => {
          const snapshot = payload.new as any as LiveKPISnapshot;
          
          // Apply additional filters
          if (options.queue_name && snapshot.queue_name !== options.queue_name) {
            return;
          }
          if (options.department_id && snapshot.department_id !== options.department_id) {
            return;
          }
          
          // Check if change is significant enough
          if (options.change_threshold_percentage) {
            // Would need previous snapshot to compare - skip for now
          }
          
          // Skip if alerts-only mode and no critical alerts
          if (options.alerts_only && snapshot.critical_alerts === 0) {
            return;
          }
          
          callback({
            event_type: 'kpi_computed',
            snapshot,
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
 * Health check for live KPI service
 */
export async function checkKPIServiceHealth(): Promise<{
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

/**
 * Custom hook for polling live KPIs
 * Returns data and refresh function
 */
export function useKPIPolling(
  organizationId: string,
  options?: {
    queueName?: string;
    intervalSeconds?: number;
    enabled?: boolean;
  }
) {
  const intervalSeconds = options?.intervalSeconds || 60;
  const enabled = options?.enabled !== false;
  
  // This is a utility function that can be used with React hooks
  // In actual React component, wrap with useState and useEffect
  
  const fetchKPIs = async () => {
    return getQuickKPIs(organizationId, options?.queueName);
  };
  
  return { fetchKPIs, intervalSeconds, enabled };
}

/**
 * Batch compute KPIs for multiple queues
 */
export async function batchComputeKPIs(
  organizationId: string,
  queueNames: string[]
): Promise<Map<string, ComputeLiveKPIsResponse>> {
  const results = new Map<string, ComputeLiveKPIsResponse>();
  
  // Compute in parallel
  const promises = queueNames.map(async (queueName) => {
    try {
      const result = await computeLiveKPIs({
        organization_id: organizationId,
        queue_name: queueName,
      });
      results.set(queueName, result);
    } catch (error) {
      console.error(`Failed to compute KPIs for queue ${queueName}:`, error);
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Get KPI trend summary (utilization, headcount gap, SLA risk over time)
 */
export async function getKPITrendSummary(
  organizationId: string,
  options: {
    queueName?: string;
    hoursBack?: number;
  } = {}
): Promise<{
  utilization_trend: number[];
  headcount_gap_trend: number[];
  risk_score_trend: number[];
  timestamps: string[];
}> {
  const hoursBack = options.hoursBack || 24;
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hoursBack * 60 * 60 * 1000);
  
  const history = await getKPIHistory({
    organization_id: organizationId,
    queue_name: options.queueName,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    interval: 'hour',
  });
  
  return {
    utilization_trend: history.data_points.map(d => d.utilization.current_utilization),
    headcount_gap_trend: history.data_points.map(d => d.headcount_gap.headcount_gap),
    risk_score_trend: history.data_points.map(d => d.sla_risk.risk_score),
    timestamps: history.data_points.map(d => d.timestamp),
  };
}
