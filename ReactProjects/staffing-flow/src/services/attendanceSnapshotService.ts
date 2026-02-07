/**
 * Frontend service for attendance snapshot ingestion API
 * Communicates with backend to track and analyze employee attendance
 */

import type {
  IngestAttendanceSnapshotRequest,
  IngestAttendanceSnapshotResponse,
  BatchIngestAttendanceRequest,
  BatchIngestAttendanceResponse,
  ListAttendanceSnapshotsRequest,
  ListAttendanceSnapshotsResponse,
  GetAttendanceTrendRequest,
  GetAttendanceTrendResponse,
  AttendanceAnalyticsRequest,
  AttendanceAnalyticsResponse,
  CreateAttendanceAlertRequest,
  AttendanceAlertRule,
  AttendanceSubscriptionOptions,
  AttendanceUpdatePayload,
} from '../../api/types/attendanceSnapshot';

const API_BASE = '/api/intraday/attendance';

/**
 * Ingest a single attendance snapshot
 */
export async function ingestAttendanceSnapshot(
  request: IngestAttendanceSnapshotRequest
): Promise<IngestAttendanceSnapshotResponse> {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to ingest attendance snapshot');
  }

  return response.json();
}

/**
 * Batch ingest multiple attendance snapshots
 */
export async function batchIngestAttendanceSnapshots(
  request: BatchIngestAttendanceRequest
): Promise<BatchIngestAttendanceResponse> {
  const response = await fetch(`${API_BASE}/batch-ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to batch ingest attendance snapshots');
  }

  return response.json();
}

/**
 * List attendance snapshots with filtering
 */
export async function listAttendanceSnapshots(
  request: ListAttendanceSnapshotsRequest
): Promise<ListAttendanceSnapshotsResponse> {
  const params = new URLSearchParams();
  
  if (request.organization_id) params.append('organization_id', request.organization_id);
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.site_id) params.append('site_id', request.site_id);
  if (request.employee_id) params.append('employee_id', request.employee_id);
  if (request.shift_id) params.append('shift_id', request.shift_id);
  if (request.attendance_status) params.append('attendance_status', request.attendance_status);
  if (request.is_present !== undefined) params.append('is_present', request.is_present.toString());
  if (request.is_absent !== undefined) params.append('is_absent', request.is_absent.toString());
  if (request.is_late !== undefined) params.append('is_late', request.is_late.toString());
  if (request.start_time) params.append('start_time', request.start_time);
  if (request.end_time) params.append('end_time', request.end_time);
  if (request.page) params.append('page', request.page.toString());
  if (request.page_size) params.append('page_size', request.page_size.toString());
  if (request.sort_by) params.append('sort_by', request.sort_by);
  if (request.sort_order) params.append('sort_order', request.sort_order);

  const response = await fetch(`${API_BASE}/snapshots?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list attendance snapshots');
  }

  return response.json();
}

/**
 * Get attendance trend data over time
 */
export async function getAttendanceTrend(
  request: GetAttendanceTrendRequest
): Promise<GetAttendanceTrendResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  params.append('start_time', request.start_time);
  params.append('end_time', request.end_time);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.site_id) params.append('site_id', request.site_id);
  if (request.interval) params.append('interval', request.interval);

  const response = await fetch(`${API_BASE}/trend?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get attendance trend data');
  }

  return response.json();
}

/**
 * Get comprehensive attendance analytics
 */
export async function getAttendanceAnalytics(
  request: AttendanceAnalyticsRequest
): Promise<AttendanceAnalyticsResponse> {
  const params = new URLSearchParams();
  
  params.append('organization_id', request.organization_id);
  
  if (request.department_id) params.append('department_id', request.department_id);
  if (request.site_id) params.append('site_id', request.site_id);
  if (request.shift_id) params.append('shift_id', request.shift_id);
  if (request.time_period) params.append('time_period', request.time_period);
  if (request.start_time) params.append('start_time', request.start_time);
  if (request.end_time) params.append('end_time', request.end_time);

  const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get attendance analytics');
  }

  return response.json();
}

/**
 * Create an attendance alert rule
 */
export async function createAttendanceAlert(
  request: CreateAttendanceAlertRequest
): Promise<AttendanceAlertRule> {
  const response = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create attendance alert');
  }

  return response.json();
}

/**
 * Subscribe to real-time attendance updates
 * Uses Supabase real-time subscriptions
 */
export function subscribeToAttendanceUpdates(
  options: AttendanceSubscriptionOptions,
  callback: (payload: AttendanceUpdatePayload) => void
): () => void {
  // Import Supabase client
  import('../lib/supabase').then(({ supabase }: any) => {
    const channel = supabase
      .channel('attendance-snapshots')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_snapshots',
          filter: options.organization_id
            ? `organization_id=eq.${options.organization_id}`
            : undefined,
        },
        (payload: any) => {
          const snapshot = payload.new as any;
          
          // Apply additional filters
          if (options.employee_id && snapshot.employee_id !== options.employee_id) {
            return;
          }
          if (options.department_id && snapshot.department_id !== options.department_id) {
            return;
          }
          if (options.site_id && snapshot.site_id !== options.site_id) {
            return;
          }
          
          callback({
            event_type: 'snapshot_inserted',
            snapshot,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_snapshots',
          filter: options.organization_id
            ? `organization_id=eq.${options.organization_id}`
            : undefined,
        },
        (payload: any) => {
          const snapshot = payload.new as any;
          
          // Apply additional filters
          if (options.employee_id && snapshot.employee_id !== options.employee_id) {
            return;
          }
          if (options.department_id && snapshot.department_id !== options.department_id) {
            return;
          }
          if (options.site_id && snapshot.site_id !== options.site_id) {
            return;
          }
          
          callback({
            event_type: 'snapshot_updated',
            snapshot,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_alerts',
          filter: options.organization_id
            ? `organization_id=eq.${options.organization_id}`
            : undefined,
        },
        (payload: any) => {
          const alert = payload.new as any;
          
          // Apply additional filters
          if (options.department_id && alert.department_id !== options.department_id) {
            return;
          }
          if (options.site_id && alert.site_id !== options.site_id) {
            return;
          }
          
          callback({
            event_type: 'alert_triggered',
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
 * Health check for attendance snapshot service
 */
export async function checkAttendanceServiceHealth(): Promise<{
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
