/**
 * Attendance Snapshot Types
 * Real-time employee attendance tracking for intraday operations
 */

// ==============================================
// CORE ATTENDANCE TYPES
// ==============================================

/**
 * Employee attendance status snapshot
 * Captures real-time attendance state for operational monitoring
 */
export interface AttendanceSnapshot {
  id: string;
  organization_id: string;
  department_id?: string;
  site_id?: string;
  employee_id: string;
  employee_name: string;
  snapshot_time: string; // ISO timestamp
  shift_id?: string;
  
  // Scheduled information
  scheduled_start_time?: string; // ISO timestamp
  scheduled_end_time?: string; // ISO timestamp
  scheduled_duration_minutes?: number;
  
  // Actual attendance
  actual_clock_in?: string; // ISO timestamp
  actual_clock_out?: string; // ISO timestamp
  actual_duration_minutes?: number;
  
  // Status
  attendance_status: AttendanceStatus;
  is_present: boolean;
  is_late: boolean;
  is_absent: boolean;
  is_on_break: boolean;
  is_early_departure: boolean;
  
  // Time differences (in minutes)
  late_by_minutes?: number;
  early_departure_minutes?: number;
  break_duration_minutes?: number;
  overtime_minutes?: number;
  
  // Adherence metrics
  schedule_adherence_percentage?: number; // 0-100
  time_on_task_percentage?: number; // 0-100
  
  // Break tracking
  break_start_time?: string; // ISO timestamp
  break_expected_duration_minutes?: number;
  total_break_time_minutes?: number;
  
  // Additional context
  absence_type?: AbsenceType;
  absence_reason?: string;
  excuse_code?: string;
  is_excused?: boolean;
  notes?: string;
  
  // Metadata
  data_source?: string; // e.g., 'timeclock_system', 'manual_entry', 'ADP'
  created_at?: string;
  updated_at?: string;
}

export type AttendanceStatus = 
  | 'scheduled' // Employee is scheduled but hasn't clocked in
  | 'present' // Employee is clocked in and working
  | 'on_break' // Employee is on break
  | 'late' // Employee clocked in late
  | 'absent' // Employee is absent (no clock in)
  | 'early_departure' // Employee left early
  | 'completed' // Shift completed normally
  | 'no_show'; // Employee didn't show up for scheduled shift

export type AbsenceType =
  | 'unexcused'
  | 'excused'
  | 'sick_leave'
  | 'vacation'
  | 'personal_day'
  | 'bereavement'
  | 'jury_duty'
  | 'fmla'
  | 'other';

// ==============================================
// INGESTION REQUEST/RESPONSE
// ==============================================

/**
 * Request to ingest a single attendance snapshot
 */
export interface IngestAttendanceSnapshotRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  employee_id: string;
  employee_name: string;
  snapshot_time: string;
  shift_id?: string;
  
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  scheduled_duration_minutes?: number;
  
  actual_clock_in?: string;
  actual_clock_out?: string;
  actual_duration_minutes?: number;
  
  attendance_status: AttendanceStatus;
  is_present: boolean;
  is_late: boolean;
  is_absent: boolean;
  is_on_break: boolean;
  is_early_departure: boolean;
  
  late_by_minutes?: number;
  early_departure_minutes?: number;
  break_duration_minutes?: number;
  overtime_minutes?: number;
  
  schedule_adherence_percentage?: number;
  time_on_task_percentage?: number;
  
  break_start_time?: string;
  break_expected_duration_minutes?: number;
  total_break_time_minutes?: number;
  
  absence_type?: AbsenceType;
  absence_reason?: string;
  excuse_code?: string;
  is_excused?: boolean;
  notes?: string;
  data_source?: string;
}

export interface IngestAttendanceSnapshotResponse {
  success: boolean;
  snapshot_id?: string;
  message?: string;
  duplicate?: boolean; // True if snapshot already exists
}

/**
 * Batch ingestion request
 */
export interface BatchIngestAttendanceRequest {
  snapshots: IngestAttendanceSnapshotRequest[];
}

export interface BatchIngestAttendanceResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: IngestAttendanceSnapshotResponse[];
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// ==============================================
// QUERY & RETRIEVAL
// ==============================================

export interface ListAttendanceSnapshotsRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  employee_id?: string;
  shift_id?: string;
  attendance_status?: AttendanceStatus;
  is_present?: boolean;
  is_absent?: boolean;
  is_late?: boolean;
  start_time?: string; // ISO timestamp
  end_time?: string; // ISO timestamp
  page?: number; // Default: 1
  page_size?: number; // Default: 50, max: 100
  sort_by?: 'snapshot_time' | 'employee_name' | 'late_by_minutes' | 'schedule_adherence_percentage';
  sort_order?: 'asc' | 'desc'; // Default: 'desc'
}

export interface ListAttendanceSnapshotsResponse {
  snapshots: AttendanceSnapshot[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ==============================================
// ATTENDANCE ANALYTICS
// ==============================================

export interface AttendanceAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  shift_id?: string;
  time_period?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'custom';
  start_time?: string; // Required if time_period = 'custom'
  end_time?: string; // Required if time_period = 'custom'
}

export interface AttendanceAnalyticsResponse {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  time_period: string;
  start_time: string;
  end_time: string;
  
  // Overall metrics
  total_scheduled_employees: number;
  total_present_employees: number;
  total_absent_employees: number;
  total_late_employees: number;
  total_on_break_employees: number;
  
  // Rates (percentages)
  attendance_rate: number; // % of scheduled employees who showed up
  absence_rate: number; // % of scheduled employees who are absent
  tardiness_rate: number; // % of scheduled employees who were late
  adherence_rate: number; // Average schedule adherence across all employees
  
  // Time metrics (all in minutes)
  average_late_time: number;
  average_overtime: number;
  total_break_time: number;
  average_break_time: number;
  
  // Shift completion
  completed_shifts: number;
  early_departures: number;
  no_shows: number;
  
  // Excused vs unexcused
  excused_absences: number;
  unexcused_absences: number;
  
  // Breakdown by status
  status_breakdown: StatusBreakdown[];
  
  // Absence type distribution
  absence_type_distribution: AbsenceTypeBreakdown[];
  
  // Hourly patterns
  hourly_patterns?: HourlyAttendancePattern[];
  
  // Top offenders (employees with worst attendance)
  chronic_late_employees?: EmployeeAttendanceSummary[];
  chronic_absent_employees?: EmployeeAttendanceSummary[];
}

export interface StatusBreakdown {
  status: AttendanceStatus;
  count: number;
  percentage: number;
}

export interface AbsenceTypeBreakdown {
  absence_type: AbsenceType;
  count: number;
  percentage: number;
}

export interface HourlyAttendancePattern {
  hour: number; // 0-23
  scheduled_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
}

export interface EmployeeAttendanceSummary {
  employee_id: string;
  employee_name: string;
  total_scheduled_shifts: number;
  late_count: number;
  absent_count: number;
  on_time_count: number;
  attendance_rate: number;
  average_late_minutes: number;
}

// ==============================================
// ATTENDANCE TRENDS
// ==============================================

export interface GetAttendanceTrendRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  start_time: string;
  end_time: string;
  interval?: 'hour' | 'day' | 'week'; // Default: 'hour'
}

export interface GetAttendanceTrendResponse {
  data_points: AttendanceTrendDataPoint[];
  summary: {
    average_attendance_rate: number;
    peak_attendance_rate: number;
    lowest_attendance_rate: number;
    average_adherence_rate: number;
    total_absences: number;
    total_late_arrivals: number;
  };
}

export interface AttendanceTrendDataPoint {
  timestamp: string;
  scheduled_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
  adherence_rate: number;
}

// ==============================================
// ALERTING
// ==============================================

export interface AttendanceAlertRule {
  id: string;
  organization_id: string;
  department_id?: string;
  site_id?: string;
  rule_name: string;
  alert_type: AttendanceAlertType;
  threshold: number; // Value depends on alert_type
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  notification_channels?: string[]; // e.g., ['email', 'slack', 'sms']
  notification_recipients?: string[]; // Email addresses or user IDs
  created_at: string;
  updated_at: string;
}

export type AttendanceAlertType =
  | 'absence_rate_high' // Threshold: percentage (e.g., 20 = 20% absence rate)
  | 'tardiness_rate_high' // Threshold: percentage
  | 'adherence_rate_low' // Threshold: percentage (e.g., 80 = below 80% adherence)
  | 'no_show_count' // Threshold: count
  | 'early_departure_count' // Threshold: count
  | 'employee_consecutive_absences' // Threshold: days
  | 'employee_consecutive_late' // Threshold: days
  | 'staffing_below_minimum'; // Threshold: count (minimum staff present)

export interface CreateAttendanceAlertRequest {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  rule_name: string;
  alert_type: AttendanceAlertType;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  notification_channels?: string[];
  notification_recipients?: string[];
}

export interface AttendanceAlert {
  id: string;
  rule_id: string;
  organization_id: string;
  department_id?: string;
  site_id?: string;
  alert_type: AttendanceAlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  current_value: number;
  threshold_value: number;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

// ==============================================
// REAL-TIME SUBSCRIPTIONS
// ==============================================

export interface AttendanceSubscriptionOptions {
  organization_id: string;
  department_id?: string;
  site_id?: string;
  employee_id?: string;
}

export interface AttendanceUpdatePayload {
  event_type: 'snapshot_inserted' | 'snapshot_updated' | 'alert_triggered';
  snapshot?: AttendanceSnapshot;
  alert?: AttendanceAlert;
  timestamp: string;
}
