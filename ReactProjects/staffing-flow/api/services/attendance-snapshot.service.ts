/**
 * Attendance Snapshot Service
 * Handles ingestion, querying, and analytics for real-time attendance tracking
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket.service';
import type {
  AttendanceSnapshot,
  AttendanceStatus,
  AbsenceType,
  IngestAttendanceSnapshotRequest,
  IngestAttendanceSnapshotResponse,
  BatchIngestAttendanceRequest,
  BatchIngestAttendanceResponse,
  ListAttendanceSnapshotsRequest,
  ListAttendanceSnapshotsResponse,
  GetAttendanceTrendRequest,
  GetAttendanceTrendResponse,
  AttendanceTrendDataPoint,
  AttendanceAnalyticsRequest,
  AttendanceAnalyticsResponse,
  StatusBreakdown,
  AbsenceTypeBreakdown,
  HourlyAttendancePattern,
  EmployeeAttendanceSummary,
  CreateAttendanceAlertRequest,
  AttendanceAlertRule,
  AttendanceAlert,
  AttendanceAlertType,
} from '../types/attendanceSnapshot';

export class AttendanceSnapshotService {
  /**
   * Ingest a single attendance snapshot
   */
  async ingestSnapshot(
    request: IngestAttendanceSnapshotRequest
  ): Promise<IngestAttendanceSnapshotResponse> {
    const correlationId = Math.random().toString(36).substring(7);
    
    try {
      logger.info('Ingesting attendance snapshot', {
        correlationId,
        employee_id: request.employee_id,
        snapshot_time: request.snapshot_time,
        status: request.attendance_status,
      });

      // Validate snapshot time
      const snapshotDate = new Date(request.snapshot_time);
      if (isNaN(snapshotDate.getTime())) {
        return {
          success: false,
          message: 'Invalid snapshot_time format',
        };
      }

      // Check for duplicate snapshot (same employee + snapshot_time within 1 minute)
      const oneMinuteBefore = new Date(snapshotDate.getTime() - 60000).toISOString();
      const oneMinuteAfter = new Date(snapshotDate.getTime() + 60000).toISOString();
      
      const { data: existingSnapshots, error: checkError } = await supabase
        .from('attendance_snapshots')
        .select('id')
        .eq('organization_id', request.organization_id)
        .eq('employee_id', request.employee_id)
        .gte('snapshot_time', oneMinuteBefore)
        .lte('snapshot_time', oneMinuteAfter)
        .limit(1);

      if (checkError) {
        logger.error('Error checking for duplicate attendance snapshot', {
          correlationId,
          error: checkError,
        });
        throw checkError;
      }

      if (existingSnapshots && existingSnapshots.length > 0 && existingSnapshots[0]) {
        logger.info('Duplicate attendance snapshot detected', {
          correlationId,
          existing_id: existingSnapshots[0].id,
        });
        return {
          success: false,
          message: 'Duplicate snapshot detected',
          duplicate: true,
          snapshot_id: existingSnapshots[0].id,
        };
      }

      // Insert new snapshot
      const { data: insertedSnapshot, error: insertError } = await supabase
        .from('attendance_snapshots')
        .insert([request])
        .select('id')
        .single();

      if (insertError) {
        logger.error('Error inserting attendance snapshot', {
          correlationId,
          error: insertError,
        });
        throw insertError;
      }

      logger.info('Attendance snapshot ingested successfully', {
        correlationId,
        snapshot_id: insertedSnapshot.id,
      });

      // Broadcast attendance update via WebSocket
      if (webSocketService.isInitialized()) {
        try {
          // Fetch current attendance stats for broadcast
          const stats = await this.getCurrentAttendanceStats(
            request.organization_id,
            request.department_id,
            request.site_id
          );

          webSocketService.broadcastAttendanceUpdate({
            snapshot_id: insertedSnapshot.id,
            organization_id: request.organization_id,
            department_id: request.department_id,
            timestamp: request.snapshot_time,
            scheduled_count: stats.total_count,
            present_count: stats.present_count,
            absent_count: stats.absent_count,
            late_count: stats.late_count,
            attendance_rate: stats.attendance_rate,
            recent_checkins: stats.recent_checkins,
          });
          logger.debug('Attendance update broadcasted via WebSocket', {
            organization_id: request.organization_id,
            department_id: request.department_id,
          });
        } catch (error) {
          logger.error('Failed to broadcast attendance update', error);
        }
      }

      // 
      // Trigger alert checks asynchronously (don't wait for completion)
      this.checkAlertRules(request.organization_id, request.department_id, request.site_id)
        .catch((error) => {
          logger.error('Error checking attendance alert rules', {
            correlationId,
            error,
          });
        });

      return {
        success: true,
        snapshot_id: insertedSnapshot.id,
        message: 'Attendance snapshot ingested successfully',
      };
    } catch (error) {
      logger.error('Failed to ingest attendance snapshot', {
        correlationId,
        error,
      });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Batch ingest multiple attendance snapshots
   */
  async batchIngestSnapshots(
    request: BatchIngestAttendanceRequest
  ): Promise<BatchIngestAttendanceResponse> {
    const correlationId = Math.random().toString(36).substring(7);
    
    logger.info('Batch ingesting attendance snapshots', {
      correlationId,
      count: request.snapshots.length,
    });

    const results: IngestAttendanceSnapshotResponse[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < request.snapshots.length; i++) {
      const snapshot = request.snapshots[i];
      if (!snapshot) continue;
      try {
        const result = await this.ingestSnapshot(snapshot);
        results.push(result);
        
        if (!result.success) {
          errors.push({ index: i, error: result.message || 'Unknown error' });
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        results.push({
          success: false,
          message: errorMessage,
        });
        errors.push({ index: i, error: errorMessage });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info('Batch ingestion completed', {
      correlationId,
      total: request.snapshots.length,
      successful,
      failed,
    });

    return {
      success: failed === 0,
      total: request.snapshots.length,
      successful,
      failed,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * List attendance snapshots with filtering
   */
  async listSnapshots(
    request: ListAttendanceSnapshotsRequest
  ): Promise<ListAttendanceSnapshotsResponse> {
    try {
      let query = supabase
        .from('attendance_snapshots')
        .select('*', { count: 'exact' })
        .eq('organization_id', request.organization_id);

      // Apply filters
      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }
      if (request.site_id) {
        query = query.eq('site_id', request.site_id);
      }
      if (request.employee_id) {
        query = query.eq('employee_id', request.employee_id);
      }
      if (request.shift_id) {
        query = query.eq('shift_id', request.shift_id);
      }
      if (request.attendance_status) {
        query = query.eq('attendance_status', request.attendance_status);
      }
      if (request.is_present !== undefined) {
        query = query.eq('is_present', request.is_present);
      }
      if (request.is_absent !== undefined) {
        query = query.eq('is_absent', request.is_absent);
      }
      if (request.is_late !== undefined) {
        query = query.eq('is_late', request.is_late);
      }
      if (request.start_time) {
        query = query.gte('snapshot_time', request.start_time);
      }
      if (request.end_time) {
        query = query.lte('snapshot_time', request.end_time);
      }

      // Apply sorting
      const sortBy = request.sort_by || 'snapshot_time';
      const sortOrder = request.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = request.page || 1;
      const pageSize = Math.min(request.page_size || 50, 100);
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error listing attendance snapshots', { error });
        throw error;
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        snapshots: data as AttendanceSnapshot[],
        total: count || 0,
        page,
        page_size: pageSize,
        total_pages: totalPages,
      };
    } catch (error) {
      logger.error('Failed to list attendance snapshots', { error });
      throw error;
    }
  }

  /**
   * Get attendance trend over time
   */
  async getAttendanceTrend(
    request: GetAttendanceTrendRequest
  ): Promise<GetAttendanceTrendResponse> {
    try {
      let query = supabase
        .from('attendance_snapshots')
        .select('*')
        .eq('organization_id', request.organization_id)
        .gte('snapshot_time', request.start_time)
        .lte('snapshot_time', request.end_time);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }
      if (request.site_id) {
        query = query.eq('site_id', request.site_id);
      }

      const { data: snapshots, error } = await query;

      if (error) {
        logger.error('Error fetching attendance trend data', { error });
        throw error;
      }

      // Group snapshots by time interval
      const interval = request.interval || 'hour';
      const dataPoints = this.groupSnapshotsByInterval(
        snapshots as AttendanceSnapshot[],
        interval
      );

      // Calculate summary statistics
      const attendanceRates = dataPoints.map((dp) => dp.attendance_rate);
      const adherenceRates = dataPoints.map((dp) => dp.adherence_rate);
      const totalAbsences = dataPoints.reduce((sum, dp) => sum + dp.absent_count, 0);
      const totalLateArrivals = dataPoints.reduce((sum, dp) => sum + dp.late_count, 0);

      return {
        data_points: dataPoints,
        summary: {
          average_attendance_rate: this.average(attendanceRates),
          peak_attendance_rate: Math.max(...attendanceRates, 0),
          lowest_attendance_rate: Math.min(...attendanceRates, 100),
          average_adherence_rate: this.average(adherenceRates),
          total_absences: totalAbsences,
          total_late_arrivals: totalLateArrivals,
        },
      };
    } catch (error) {
      logger.error('Failed to get attendance trend', { error });
      throw error;
    }
  }

  /**
   * Get comprehensive attendance analytics
   */
  async getAttendanceAnalytics(
    request: AttendanceAnalyticsRequest
  ): Promise<AttendanceAnalyticsResponse> {
    try {
      // Determine time range
      const { start_time, end_time } = this.getTimeRange(request.time_period, request.start_time, request.end_time);

      // Fetch snapshots for the period
      let query = supabase
        .from('attendance_snapshots')
        .select('*')
        .eq('organization_id', request.organization_id)
        .gte('snapshot_time', start_time)
        .lte('snapshot_time', end_time);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }
      if (request.site_id) {
        query = query.eq('site_id', request.site_id);
      }
      if (request.shift_id) {
        query = query.eq('shift_id', request.shift_id);
      }

      const { data: snapshots, error } = await query;

      if (error) {
        logger.error('Error fetching attendance analytics data', { error });
        throw error;
      }

      if (!snapshots || snapshots.length === 0) {
        return this.getEmptyAnalytics(request, start_time, end_time);
      }

      // Calculate metrics
      const attendanceSnapshots = snapshots as AttendanceSnapshot[];
      
      // Get unique employees (most recent snapshot per employee)
      const latestSnapshotsByEmployee = this.getLatestSnapshotsByEmployee(attendanceSnapshots);
      
      const totalScheduledEmployees = latestSnapshotsByEmployee.length;
      const totalPresentEmployees = latestSnapshotsByEmployee.filter((s) => s.is_present).length;
      const totalAbsentEmployees = latestSnapshotsByEmployee.filter((s) => s.is_absent).length;
      const totalLateEmployees = latestSnapshotsByEmployee.filter((s) => s.is_late).length;
      const totalOnBreakEmployees = latestSnapshotsByEmployee.filter((s) => s.is_on_break).length;

      const attendanceRate = totalScheduledEmployees > 0 
        ? (totalPresentEmployees / totalScheduledEmployees) * 100 
        : 0;
      const absenceRate = totalScheduledEmployees > 0 
        ? (totalAbsentEmployees / totalScheduledEmployees) * 100 
        : 0;
      const tardinessRate = totalScheduledEmployees > 0 
        ? (totalLateEmployees / totalScheduledEmployees) * 100 
        : 0;
      
      const adherenceRates = latestSnapshotsByEmployee
        .map((s) => s.schedule_adherence_percentage)
        .filter((rate): rate is number => rate !== null && rate !== undefined);
      const adherenceRate = adherenceRates.length > 0 ? this.average(adherenceRates) : 0;

      // Time metrics
      const lateTimes = latestSnapshotsByEmployee
        .map((s) => s.late_by_minutes)
        .filter((time): time is number => time !== null && time !== undefined && time > 0);
      const averageLateTime = lateTimes.length > 0 ? this.average(lateTimes) : 0;

      const overtimes = latestSnapshotsByEmployee
        .map((s) => s.overtime_minutes)
        .filter((time): time is number => time !== null && time !== undefined && time > 0);
      const averageOvertime = overtimes.length > 0 ? this.average(overtimes) : 0;

      const breakTimes = latestSnapshotsByEmployee
        .map((s) => s.total_break_time_minutes)
        .filter((time): time is number => time !== null && time !== undefined && time > 0);
      const totalBreakTime = breakTimes.reduce((sum, time) => sum + time, 0);
      const averageBreakTime = breakTimes.length > 0 ? this.average(breakTimes) : 0;

      // Shift completion
      const completedShifts = latestSnapshotsByEmployee.filter((s) => s.attendance_status === 'completed').length;
      const earlyDepartures = latestSnapshotsByEmployee.filter((s) => s.is_early_departure).length;
      const noShows = latestSnapshotsByEmployee.filter((s) => s.attendance_status === 'no_show').length;

      // Excused vs unexcused
      const excusedAbsences = latestSnapshotsByEmployee.filter((s) => s.is_absent && s.is_excused).length;
      const unexcusedAbsences = latestSnapshotsByEmployee.filter((s) => s.is_absent && !s.is_excused).length;

      // Breakdowns
      const statusBreakdown = this.calculateStatusBreakdown(latestSnapshotsByEmployee);
      const absenceTypeDistribution = this.calculateAbsenceTypeDistribution(latestSnapshotsByEmployee);
      const hourlyPatterns = this.calculateHourlyAttendancePatterns(attendanceSnapshots);

      // Top offenders
      const chronicLateEmployees = this.getChronicLateEmployees(attendanceSnapshots, 5);
      const chronicAbsentEmployees = this.getChronicAbsentEmployees(attendanceSnapshots, 5);

      return {
        organization_id: request.organization_id,
        department_id: request.department_id,
        site_id: request.site_id,
        time_period: request.time_period || 'custom',
        start_time,
        end_time,
        
        total_scheduled_employees: totalScheduledEmployees,
        total_present_employees: totalPresentEmployees,
        total_absent_employees: totalAbsentEmployees,
        total_late_employees: totalLateEmployees,
        total_on_break_employees: totalOnBreakEmployees,
        
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        absence_rate: Math.round(absenceRate * 100) / 100,
        tardiness_rate: Math.round(tardinessRate * 100) / 100,
        adherence_rate: Math.round(adherenceRate * 100) / 100,
        
        average_late_time: Math.round(averageLateTime * 100) / 100,
        average_overtime: Math.round(averageOvertime * 100) / 100,
        total_break_time: totalBreakTime,
        average_break_time: Math.round(averageBreakTime * 100) / 100,
        
        completed_shifts: completedShifts,
        early_departures: earlyDepartures,
        no_shows: noShows,
        
        excused_absences: excusedAbsences,
        unexcused_absences: unexcusedAbsences,
        
        status_breakdown: statusBreakdown,
        absence_type_distribution: absenceTypeDistribution,
        hourly_patterns: hourlyPatterns,
        chronic_late_employees: chronicLateEmployees,
        chronic_absent_employees: chronicAbsentEmployees,
      };
    } catch (error) {
      logger.error('Failed to get attendance analytics', { error });
      throw error;
    }
  }

  /**
   * Get current attendance stats for broadcasting
   */
  private async getCurrentAttendanceStats(
    organization_id: string,
    department_id?: string,
    site_id?: string
  ): Promise<{
    total_count: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    attendance_rate: number;
    recent_checkins: Array<{
      employee_id: string;
      employee_name: string;
      checked_in_at: string;
      status: string;
    }>;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('attendance_snapshots')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('shift_date', today)
      .order('snapshot_time', { ascending: false });

    if (department_id) {
      query = query.eq('department_id', department_id);
    }
    if (site_id) {
      query = query.eq('site_id', site_id);
    }

    const { data: snapshots } = await query.limit(100);
    const records = (snapshots || []) as AttendanceSnapshot[];

    // Get unique employees (latest record for each)
    const latestByEmployee = new Map<string, AttendanceSnapshot>();
    for (const record of records) {
      if (!latestByEmployee.has(record.employee_id)) {
        latestByEmployee.set(record.employee_id, record);
      }
    }

    const latestRecords = Array.from(latestByEmployee.values());
    const presentCount = latestRecords.filter(r => r.attendance_status === 'present').length;
    const absentCount = latestRecords.filter(r => 
      r.attendance_status === 'no_show'
    ).length;
    const lateCount = latestRecords.filter(r => r.attendance_status === 'late').length;
    const totalCount = latestRecords.length;
    const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    // Get recent check-ins (last 10)
    const recentCheckins = records
      .filter(r => r.attendance_status === 'present')
      .slice(0, 10)
      .map(r => ({
        employee_id: r.employee_id,
        employee_name: r.employee_name || r.employee_id,
        checked_in_at: r.snapshot_time,
        status: r.attendance_status,
      }));

    return {
      total_count: totalCount,
      present_count: presentCount,
      absent_count: absentCount,
      late_count: lateCount,
      attendance_rate: attendanceRate,
      recent_checkins: recentCheckins,
    };
  }

  /**
   * 
  }

  /**
   * Create an attendance alert rule
   */
  async createAlertRule(request: CreateAttendanceAlertRequest): Promise<AttendanceAlertRule> {
    try {
      const { data, error } = await supabase
        .from('attendance_alert_rules')
        .insert([
          {
            ...request,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('Error creating attendance alert rule', { error });
        throw error;
      }

      return data as AttendanceAlertRule;
    } catch (error) {
      logger.error('Failed to create attendance alert rule', { error });
      throw error;
    }
  }

  /**
   * Check alert rules and trigger alerts if thresholds are exceeded
   */
  async checkAlertRules(
    organization_id: string,
    department_id?: string,
    site_id?: string
  ): Promise<void> {
    try {
      // Fetch active alert rules
      let query = supabase
        .from('attendance_alert_rules')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('is_active', true);

      if (department_id) {
        query = query.eq('department_id', department_id);
      }
      if (site_id) {
        query = query.eq('site_id', site_id);
      }

      const { data: rules, error } = await query;

      if (error) {
        logger.error('Error fetching attendance alert rules', { error });
        return;
      }

      if (!rules || rules.length === 0) {
        return;
      }

      // Get current analytics
      const analytics = await this.getAttendanceAnalytics({
        organization_id,
        department_id,
        site_id,
        time_period: 'today',
      });

      // Check each rule
      for (const rule of rules as AttendanceAlertRule[]) {
        const shouldTrigger = this.evaluateAlertRule(rule, analytics);
        if (shouldTrigger) {
          await this.triggerAlert(rule, analytics);
        }
      }
    } catch (error) {
      logger.error('Error checking attendance alert rules', { error });
    }
  }

  // ==============================================
  // HELPER METHODS
  // ==============================================

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private getTimeRange(
    timePeriod?: string,
    startTime?: string,
    endTime?: string
  ): { start_time: string; end_time: string } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (timePeriod) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last_7_days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (!startTime || !endTime) {
          throw new Error('start_time and end_time required for custom time period');
        }
        return { start_time: startTime, end_time: endTime };
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };
  }

  private groupSnapshotsByInterval(
    snapshots: AttendanceSnapshot[],
    interval: 'hour' | 'day' | 'week'
  ): AttendanceTrendDataPoint[] {
    const grouped = new Map<string, AttendanceSnapshot[]>();

    for (const snapshot of snapshots) {
      const date = new Date(snapshot.snapshot_time);
      let key: string;

      if (interval === 'hour') {
        key = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
      } else if (interval === 'day') {
        key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      } else {
        // week
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        key = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString();
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(snapshot);
    }

    const dataPoints: AttendanceTrendDataPoint[] = [];
    for (const [timestamp, snapshotsInInterval] of grouped.entries()) {
      const latestByEmployee = this.getLatestSnapshotsByEmployee(snapshotsInInterval);
      
      const scheduled_count = latestByEmployee.length;
      const present_count = latestByEmployee.filter((s) => s.is_present).length;
      const absent_count = latestByEmployee.filter((s) => s.is_absent).length;
      const late_count = latestByEmployee.filter((s) => s.is_late).length;
      
      const attendance_rate = scheduled_count > 0 ? (present_count / scheduled_count) * 100 : 0;
      
      const adherenceRates = latestByEmployee
        .map((s) => s.schedule_adherence_percentage)
        .filter((rate): rate is number => rate !== null && rate !== undefined);
      const adherence_rate = adherenceRates.length > 0 ? this.average(adherenceRates) : 0;

      dataPoints.push({
        timestamp,
        scheduled_count,
        present_count,
        absent_count,
        late_count,
        attendance_rate: Math.round(attendance_rate * 100) / 100,
        adherence_rate: Math.round(adherence_rate * 100) / 100,
      });
    }

    return dataPoints.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private getLatestSnapshotsByEmployee(snapshots: AttendanceSnapshot[]): AttendanceSnapshot[] {
    const latestByEmployee = new Map<string, AttendanceSnapshot>();

    for (const snapshot of snapshots) {
      const existing = latestByEmployee.get(snapshot.employee_id);
      if (!existing || new Date(snapshot.snapshot_time) > new Date(existing.snapshot_time)) {
        latestByEmployee.set(snapshot.employee_id, snapshot);
      }
    }

    return Array.from(latestByEmployee.values());
  }

  private calculateStatusBreakdown(snapshots: AttendanceSnapshot[]): StatusBreakdown[] {
    const statusCounts = new Map<AttendanceStatus, number>();
    
    for (const snapshot of snapshots) {
      const count = statusCounts.get(snapshot.attendance_status) || 0;
      statusCounts.set(snapshot.attendance_status, count + 1);
    }

    const total = snapshots.length;
    const breakdown: StatusBreakdown[] = [];

    for (const [status, count] of statusCounts.entries()) {
      breakdown.push({
        status,
        count,
        percentage: Math.round((count / total) * 10000) / 100,
      });
    }

    return breakdown.sort((a, b) => b.count - a.count);
  }

  private calculateAbsenceTypeDistribution(snapshots: AttendanceSnapshot[]): AbsenceTypeBreakdown[] {
    const absentSnapshots = snapshots.filter((s) => s.is_absent && s.absence_type);
    const typeCounts = new Map<AbsenceType, number>();
    
    for (const snapshot of absentSnapshots) {
      if (snapshot.absence_type) {
        const count = typeCounts.get(snapshot.absence_type) || 0;
        typeCounts.set(snapshot.absence_type, count + 1);
      }
    }

    const total = absentSnapshots.length;
    if (total === 0) return [];

    const breakdown: AbsenceTypeBreakdown[] = [];

    for (const [absence_type, count] of typeCounts.entries()) {
      breakdown.push({
        absence_type,
        count,
        percentage: Math.round((count / total) * 10000) / 100,
      });
    }

    return breakdown.sort((a, b) => b.count - a.count);
  }

  private calculateHourlyAttendancePatterns(snapshots: AttendanceSnapshot[]): HourlyAttendancePattern[] {
    const hourlyData = new Map<number, {
      scheduled: Set<string>;
      present: Set<string>;
      absent: Set<string>;
      late: Set<string>;
    }>();

    // Initialize all 24 hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.set(hour, {
        scheduled: new Set(),
        present: new Set(),
        absent: new Set(),
        late: new Set(),
      });
    }

    // Aggregate data
    for (const snapshot of snapshots) {
      const hour = new Date(snapshot.snapshot_time).getHours();
      const data = hourlyData.get(hour)!;
      
      data.scheduled.add(snapshot.employee_id);
      if (snapshot.is_present) data.present.add(snapshot.employee_id);
      if (snapshot.is_absent) data.absent.add(snapshot.employee_id);
      if (snapshot.is_late) data.late.add(snapshot.employee_id);
    }

    // Convert to patterns
    const patterns: HourlyAttendancePattern[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData.get(hour)!;
      const scheduled_count = data.scheduled.size;
      const present_count = data.present.size;
      const absent_count = data.absent.size;
      const late_count = data.late.size;
      const attendance_rate = scheduled_count > 0 ? (present_count / scheduled_count) * 100 : 0;

      patterns.push({
        hour,
        scheduled_count,
        present_count,
        absent_count,
        late_count,
        attendance_rate: Math.round(attendance_rate * 100) / 100,
      });
    }

    return patterns;
  }

  private getChronicLateEmployees(
    snapshots: AttendanceSnapshot[],
    limit: number
  ): EmployeeAttendanceSummary[] {
    const employeeData = new Map<string, {
      name: string;
      scheduled: number;
      late: number;
      absent: number;
      onTime: number;
      lateMinutes: number[];
    }>();

    for (const snapshot of snapshots) {
      if (!employeeData.has(snapshot.employee_id)) {
        employeeData.set(snapshot.employee_id, {
          name: snapshot.employee_name,
          scheduled: 0,
          late: 0,
          absent: 0,
          onTime: 0,
          lateMinutes: [],
        });
      }

      const data = employeeData.get(snapshot.employee_id)!;
      data.scheduled++;
      
      if (snapshot.is_late) {
        data.late++;
        if (snapshot.late_by_minutes) {
          data.lateMinutes.push(snapshot.late_by_minutes);
        }
      } else if (snapshot.is_absent) {
        data.absent++;
      } else if (snapshot.is_present) {
        data.onTime++;
      }
    }

    const summaries: EmployeeAttendanceSummary[] = [];
    for (const [employee_id, data] of employeeData.entries()) {
      if (data.late > 0) {
        summaries.push({
          employee_id,
          employee_name: data.name,
          total_scheduled_shifts: data.scheduled,
          late_count: data.late,
          absent_count: data.absent,
          on_time_count: data.onTime,
          attendance_rate: Math.round(((data.onTime + data.late) / data.scheduled) * 10000) / 100,
          average_late_minutes: data.lateMinutes.length > 0 ? this.average(data.lateMinutes) : 0,
        });
      }
    }

    return summaries
      .sort((a, b) => b.late_count - a.late_count)
      .slice(0, limit);
  }

  private getChronicAbsentEmployees(
    snapshots: AttendanceSnapshot[],
    limit: number
  ): EmployeeAttendanceSummary[] {
    const employeeData = new Map<string, {
      name: string;
      scheduled: number;
      late: number;
      absent: number;
      onTime: number;
    }>();

    for (const snapshot of snapshots) {
      if (!employeeData.has(snapshot.employee_id)) {
        employeeData.set(snapshot.employee_id, {
          name: snapshot.employee_name,
          scheduled: 0,
          late: 0,
          absent: 0,
          onTime: 0,
        });
      }

      const data = employeeData.get(snapshot.employee_id)!;
      data.scheduled++;
      
      if (snapshot.is_absent) {
        data.absent++;
      } else if (snapshot.is_late) {
        data.late++;
      } else if (snapshot.is_present) {
        data.onTime++;
      }
    }

    const summaries: EmployeeAttendanceSummary[] = [];
    for (const [employee_id, data] of employeeData.entries()) {
      if (data.absent > 0) {
        summaries.push({
          employee_id,
          employee_name: data.name,
          total_scheduled_shifts: data.scheduled,
          late_count: data.late,
          absent_count: data.absent,
          on_time_count: data.onTime,
          attendance_rate: Math.round(((data.onTime + data.late) / data.scheduled) * 10000) / 100,
          average_late_minutes: 0,
        });
      }
    }

    return summaries
      .sort((a, b) => b.absent_count - a.absent_count)
      .slice(0, limit);
  }

  private getEmptyAnalytics(
    request: AttendanceAnalyticsRequest,
    start_time: string,
    end_time: string
  ): AttendanceAnalyticsResponse {
    return {
      organization_id: request.organization_id,
      department_id: request.department_id,
      site_id: request.site_id,
      time_period: request.time_period || 'custom',
      start_time,
      end_time,
      total_scheduled_employees: 0,
      total_present_employees: 0,
      total_absent_employees: 0,
      total_late_employees: 0,
      total_on_break_employees: 0,
      attendance_rate: 0,
      absence_rate: 0,
      tardiness_rate: 0,
      adherence_rate: 0,
      average_late_time: 0,
      average_overtime: 0,
      total_break_time: 0,
      average_break_time: 0,
      completed_shifts: 0,
      early_departures: 0,
      no_shows: 0,
      excused_absences: 0,
      unexcused_absences: 0,
      status_breakdown: [],
      absence_type_distribution: [],
      hourly_patterns: [],
      chronic_late_employees: [],
      chronic_absent_employees: [],
    };
  }

  private evaluateAlertRule(
    rule: AttendanceAlertRule,
    analytics: AttendanceAnalyticsResponse
  ): boolean {
    const currentValue = this.getCurrentValueForAlert(rule.alert_type, analytics);
    
    switch (rule.alert_type) {
      case 'absence_rate_high':
      case 'tardiness_rate_high':
        return currentValue >= rule.threshold;
      case 'adherence_rate_low':
        return currentValue <= rule.threshold;
      case 'no_show_count':
      case 'early_departure_count':
      case 'employee_consecutive_absences':
      case 'employee_consecutive_late':
      case 'staffing_below_minimum':
        return currentValue >= rule.threshold;
      default:
        return false;
    }
  }

  private getCurrentValueForAlert(
    alertType: AttendanceAlertType,
    analytics: AttendanceAnalyticsResponse
  ): number {
    switch (alertType) {
      case 'absence_rate_high':
        return analytics.absence_rate;
      case 'tardiness_rate_high':
        return analytics.tardiness_rate;
      case 'adherence_rate_low':
        return analytics.adherence_rate;
      case 'no_show_count':
        return analytics.no_shows;
      case 'early_departure_count':
        return analytics.early_departures;
      case 'staffing_below_minimum':
        return analytics.total_present_employees;
      default:
        return 0;
    }
  }

  private async triggerAlert(
    rule: AttendanceAlertRule,
    analytics: AttendanceAnalyticsResponse
  ): Promise<void> {
    try {
      const currentValue = this.getCurrentValueForAlert(rule.alert_type, analytics);
      const message = this.generateAlertMessage(rule, currentValue);

      const alert: Omit<AttendanceAlert, 'id'> = {
        rule_id: rule.id,
        organization_id: rule.organization_id,
        department_id: rule.department_id,
        site_id: rule.site_id,
        alert_type: rule.alert_type,
        severity: rule.severity,
        message,
        current_value: currentValue,
        threshold_value: rule.threshold,
        triggered_at: new Date().toISOString(),
        acknowledged: false,
      };

      const { error } = await supabase.from('attendance_alerts').insert([alert]);

      if (error) {
        logger.error('Error inserting attendance alert', { error });
      } else {
        logger.info('Attendance alert triggered', {
          rule_name: rule.rule_name,
          alert_type: rule.alert_type,
          current_value: currentValue,
          threshold: rule.threshold,
        });
      }
    } catch (error) {
      logger.error('Error triggering attendance alert', { error });
    }
  }

  private generateAlertMessage(rule: AttendanceAlertRule, currentValue: number): string {
    const formatValue = (val: number, type: AttendanceAlertType): string => {
      if (type.includes('rate')) {
        return `${val.toFixed(1)}%`;
      }
      return val.toString();
    };

    return `${rule.rule_name}: Current value ${formatValue(currentValue, rule.alert_type)} exceeds threshold of ${formatValue(rule.threshold, rule.alert_type)}`;
  }
}

// Export singleton instance
export const attendanceSnapshotService = new AttendanceSnapshotService();
