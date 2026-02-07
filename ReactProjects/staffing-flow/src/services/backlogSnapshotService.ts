/**
 * Frontend service for backlog snapshot ingestion API
 * Communicates with backend to track and analyze backlog data
 */

import type {
  IngestBacklogSnapshotRequest,
  IngestBacklogSnapshotResponse,
  BatchIngestBacklogRequest,
  BatchIngestBacklogResponse,
  ListBacklogSnapshotsRequest,
  ListBacklogSnapshotsResponse,
  GetBacklogTrendRequest,
  GetBacklogTrendResponse,
  BacklogAnalyticsRequest,
  BacklogAnalyticsResponse,
  CreateBacklogAlertRequest,
  BacklogAlertRule,
  BacklogSubscriptionOptions,
  BacklogUpdatePayload,
} from '../../api/types/backlogSnapshot';

const API_BASE = '/api/intraday/backlog';

/**
 * Ingest a single backlog snapshot
 */
export async function ingestBacklogSnapshot(
  request: IngestBacklogSnapshotRequest
): Promise<IngestBacklogSnapshotResponse> {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to ingest snapshot');
  }

  return response.json();
}

/**
 * Batch ingest multiple backlog snapshots
 */
export async function batchIngestBacklogSnapshots(
  request: BatchIngestBacklogRequest
): Promise<BatchIngestBacklogResponse> {
  const response = await fetch(`${API_BASE}/batch-ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to batch ingest snapshots');
  }

  return response.json();
}

/**
 * List backlog snapshots with filtering
 */
export async function listBacklogSnapshots(
  request: ListBacklogSnapshotsRequest
): Promise<ListBacklogSnapshotsResponse> {
  const params = new URLSearchParams();
  
  if (request.organization_id) params.append('organization_id', request.organization_id);
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.site_id) params.append('site_id', request.site_id);
  if (request.queue_name) params.append('queue_name', request.queue_name);
  if (request.start_time) params.append('start_time', request.start_time);
  if (request.end_time) params.append('end_time', request.end_time);
  if (request.page) params.append('page', request.page.toString());
  if (request.page_size) params.append('page_size', request.page_size.toString());
  if (request.sort_by) params.append('sort_by', request.sort_by);
  if (request.sort_order) params.append('sort_order', request.sort_order);

  const response = await fetch(`${API_BASE}/snapshots?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list snapshots');
  }

  return response.json();
}

/**
 * Get backlog trend data over time
 */
export async function getBacklogTrend(
  request: GetBacklogTrendRequest
): Promise<GetBacklogTrendResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  params.append('start_time', request.start_time);
  params.append('end_time', request.end_time);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.queue_name) params.append('queue_name', request.queue_name);
  if (request.interval) params.append('interval', request.interval);

  const response = await fetch(`${API_BASE}/trend?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get trend data');
  }

  return response.json();
}

/**
 * Get comprehensive backlog analytics
 */
export async function getBacklogAnalytics(
  request: BacklogAnalyticsRequest
): Promise<BacklogAnalyticsResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.queue_name) params.append('queue_name', request.queue_name);
  if (request.time_period) params.append('time_period', request.time_period);
  if (request.start_time) params.append('start_time', request.start_time);
  if (request.end_time) params.append('end_time', request.end_time);

  const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get analytics');
  }

  return response.json();
}

/**
 * Create a backlog alert rule
 */
export async function createBacklogAlert(
  request: CreateBacklogAlertRequest
): Promise<BacklogAlertRule> {
  const response = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create alert');
  }

  return response.json();
}

/**
 * Subscribe to real-time backlog updates
 * Uses Supabase real-time subscriptions
 */
export function subscribeToBacklogUpdates(
  options: BacklogSubscriptionOptions,
  callback: (payload: BacklogUpdatePayload) => void
): () => void {
  // Import Supabase client
  import('../lib/supabase').then(({ supabase }: any) => {
    const channel = supabase
      .channel('backlog-snapshots')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'backlog_snapshots',
          filter: options.organization_id
            ? `organization_id=eq.${options.organization_id}`
            : undefined,
        },
        (payload: any) => {
          const snapshot = payload.new as any;
          
          // Apply additional filters
          if (options.queue_names && !options.queue_names.includes(snapshot.queue_name)) {
            return;
          }
          if (options.department_id && snapshot.department_id !== options.department_id) {
            return;
          }
          
          callback({
            event_type: 'snapshot_created',
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
 * Health check for backlog snapshot service
 */
export async function checkBacklogServiceHealth(): Promise<{
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
