/**
 * Backlog Snapshot Ingestion Service
 * Handles backlog data ingestion, analytics, and alerting
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket.service';
import type {
  BacklogSnapshot,
  IngestBacklogSnapshotRequest,
  IngestBacklogSnapshotResponse,
  BatchIngestBacklogRequest,
  BatchIngestBacklogResponse,
  ListBacklogSnapshotsRequest,
  ListBacklogSnapshotsResponse,
  GetBacklogTrendRequest,
  GetBacklogTrendResponse,
  BacklogTrendDataPoint,
  BacklogAnalyticsRequest,
  BacklogAnalyticsResponse,
  CreateBacklogAlertRequest,
  BacklogAlertRule,
} from '../types/backlogSnapshot';

class BacklogSnapshotService {
  /**
   * Ingest a single backlog snapshot
   */
  async ingestSnapshot(
    request: IngestBacklogSnapshotRequest
  ): Promise<IngestBacklogSnapshotResponse> {
    try {
      logger.info('Ingesting backlog snapshot', {
        queue: request.queue_name,
        time: request.snapshot_time,
      });

      // Validate snapshot time
      const snapshotTime = new Date(request.snapshot_time);
      if (isNaN(snapshotTime.getTime())) {
        throw new Error('Invalid snapshot_time format');
      }

      // Check for duplicate snapshot
      const { data: existingSnapshot } = await supabase
        .from('backlog_snapshots')
        .select('id')
        .eq('organization_id', request.organization_id)
        .eq('queue_name', request.queue_name)
        .eq('snapshot_time', request.snapshot_time)
        .single();

      if (existingSnapshot) {
        logger.warn('Duplicate snapshot detected', {
          existingId: existingSnapshot.id,
          queue: request.queue_name,
        });
        return {
          success: false,
          snapshot_id: existingSnapshot.id,
          snapshot_time: request.snapshot_time,
          message: 'Duplicate snapshot - already exists',
        };
      }

      // Insert snapshot
      const { data, error } = await supabase
        .from('backlog_snapshots')
        .insert({
          snapshot_time: request.snapshot_time,
          department_id: request.department_id,
          site_id: request.site_id,
          queue_name: request.queue_name,
          total_items: request.total_items,
          priority_breakdown: request.priority_breakdown,
          age_distribution: request.age_distribution,
          sla_compliance: request.sla_compliance,
          avg_wait_time_minutes: request.avg_wait_time_minutes,
          longest_wait_time_minutes: request.longest_wait_time_minutes,
          items_added_last_hour: request.items_added_last_hour,
          items_completed_last_hour: request.items_completed_last_hour,
          current_throughput_per_hour: request.current_throughput_per_hour,
          staffed_employees: request.staffed_employees,
          active_employees: request.active_employees,
          idle_employees: request.idle_employees,
          metadata: request.metadata,
          organization_id: request.organization_id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to insert backlog snapshot', { error });
        throw error;
      }

      logger.info('Backlog snapshot ingested successfully', {
        snapshotId: data.id,
        queue: request.queue_name,
      });

      // Broadcast backlog update via WebSocket
      if (webSocketService.isInitialized()) {
        try {
          webSocketService.broadcastBacklogUpdate({
            snapshot_id: data.id,
            organization_id: data.organization_id,
            department_id: data.department_id,
            queue_name: data.queue_name,
            timestamp: data.snapshot_time,
            total_items: data.total_items,
            avg_wait_time_minutes: data.average_wait_time_minutes || 0,
            items_over_sla: data.sla_at_risk_count || 0,
            sla_compliance_percentage: data.sla_compliance_percentage || 100,
            backlog_trend: 'stable', // Would calculate from history
            items_added_this_interval: 0, // Would track from previous snapshot
            items_completed_this_interval: 0,
          });
          logger.debug('Backlog update broadcasted via WebSocket', {
            organization_id: data.organization_id,
            queue_name: data.queue_name,
          });
        } catch (error) {
          logger.error('Failed to broadcast backlog update', error);
        }
      }

      // Check alert rules (async - don't wait)
      this.checkAlertRules(data).catch((err) =>
        logger.error('Alert check failed', { error: err })
      );

      return {
        success: true,
        snapshot_id: data.id,
        snapshot_time: data.snapshot_time,
        message: 'Snapshot ingested successfully',
      };
    } catch (error) {
      logger.error('Error ingesting backlog snapshot', { error });
      throw error;
    }
  }

  /**
   * Batch ingest multiple snapshots
   */
  async batchIngestSnapshots(
    request: BatchIngestBacklogRequest
  ): Promise<BatchIngestBacklogResponse> {
    try {
      logger.info('Batch ingesting backlog snapshots', {
        count: request.snapshots.length,
      });

      const results: IngestBacklogSnapshotResponse[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < request.snapshots.length; i++) {
        const snapshot = request.snapshots[i];
        if (!snapshot) continue;
        try {
          const result = await this.ingestSnapshot(snapshot);
          results.push(result);
        } catch (error) {
          errors.push({
            index: i,
            error: (error as Error).message,
          });
        }
      }

      const successfulResults = results.filter((r) => r.success);

      return {
        success: errors.length === 0,
        ingested_count: successfulResults.length,
        failed_count: errors.length,
        snapshot_ids: successfulResults.map((r) => r.snapshot_id),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error('Error in batch ingestion', { error });
      throw error;
    }
  }

  /**
   * List backlog snapshots with filtering
   */
  async listSnapshots(
    request: ListBacklogSnapshotsRequest
  ): Promise<ListBacklogSnapshotsResponse> {
    try {
      let query = supabase.from('backlog_snapshots').select('*', { count: 'exact' });

      // Apply filters
      if (request.organization_id) {
        query = query.eq('organization_id', request.organization_id);
      }
      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }
      if (request.site_id) {
        query = query.eq('site_id', request.site_id);
      }
      if (request.queue_name) {
        query = query.eq('queue_name', request.queue_name);
      }
      if (request.start_time) {
        query = query.gte('snapshot_time', request.start_time);
      }
      if (request.end_time) {
        query = query.lte('snapshot_time', request.end_time);
      }

      // Sorting
      const sortBy = request.sort_by || 'snapshot_time';
      const sortOrder = request.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const page = request.page || 1;
      const pageSize = request.page_size || 50;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        snapshots: (data as BacklogSnapshot[]) || [],
        total_count: count || 0,
        page,
        page_size: pageSize,
        total_pages: totalPages,
      };
    } catch (error) {
      logger.error('Error listing backlog snapshots', { error });
      throw error;
    }
  }

  /**
   * Get backlog trend data
   */
  async getBacklogTrend(request: GetBacklogTrendRequest): Promise<GetBacklogTrendResponse> {
    try {
      logger.info('Getting backlog trend', {
        queue: request.queue_name,
        interval: request.interval,
      });

      const { data, error } = await supabase
        .from('backlog_snapshots')
        .select('*')
        .eq('organization_id', request.organization_id)
        .gte('snapshot_time', request.start_time)
        .lte('snapshot_time', request.end_time)
        .order('snapshot_time', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          queue_name: request.queue_name || 'all',
          start_time: request.start_time,
          end_time: request.end_time,
          interval: request.interval || 'hour',
          data_points: [],
          summary: {
            avg_backlog: 0,
            peak_backlog: 0,
            min_backlog: 0,
            avg_wait_time: 0,
            avg_sla_compliance: 0,
            total_items_processed: 0,
          },
        };
      }

      // Filter by queue if specified
      let filteredData = data;
      if (request.queue_name) {
        filteredData = data.filter((s: any) => s.queue_name === request.queue_name);
      }

      // Convert to trend data points
      const dataPoints: BacklogTrendDataPoint[] = filteredData.map((snapshot: any) => ({
        timestamp: snapshot.snapshot_time,
        total_items: snapshot.total_items,
        avg_wait_time: snapshot.avg_wait_time_minutes,
        sla_compliance_percentage: snapshot.sla_compliance.compliance_percentage,
        throughput_per_hour: snapshot.current_throughput_per_hour,
        active_employees: snapshot.active_employees,
      }));

      // Calculate summary statistics
      const totalItems = dataPoints.map((d) => d.total_items);
      const waitTimes = dataPoints.map((d) => d.avg_wait_time);
      const slaCompliances = dataPoints.map((d) => d.sla_compliance_percentage);
      const totalProcessed = filteredData.reduce(
        (sum: number, s: any) => sum + s.items_completed_last_hour,
        0
      );

      const summary = {
        avg_backlog: this.average(totalItems),
        peak_backlog: Math.max(...totalItems),
        min_backlog: Math.min(...totalItems),
        avg_wait_time: this.average(waitTimes),
        avg_sla_compliance: this.average(slaCompliances),
        total_items_processed: totalProcessed,
      };

      return {
        queue_name: request.queue_name || 'all',
        start_time: request.start_time,
        end_time: request.end_time,
        interval: request.interval || 'hour',
        data_points: dataPoints,
        summary,
      };
    } catch (error) {
      logger.error('Error getting backlog trend', { error });
      throw error;
    }
  }

  /**
   * Get comprehensive backlog analytics
   */
  async getBacklogAnalytics(
    request: BacklogAnalyticsRequest
  ): Promise<BacklogAnalyticsResponse> {
    try {
      // Determine time range
      const { startTime, endTime } = this.getTimeRange(request.time_period, request.start_time, request.end_time);

      // Fetch snapshots
      let query = supabase
        .from('backlog_snapshots')
        .select('*')
        .eq('organization_id', request.organization_id)
        .gte('snapshot_time', startTime)
        .lte('snapshot_time', endTime);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }
      if (request.queue_name) {
        query = query.eq('queue_name', request.queue_name);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return this.getEmptyAnalytics(request);
      }

      // Calculate metrics
      const backlogSizes = data.map((s: any) => s.total_items);
      const waitTimes = data.map((s: any) => s.avg_wait_time_minutes);
      const maxWaitTimes = data.map((s: any) => s.longest_wait_time_minutes);
      const slaCompliances = data.map((s: any) => s.sla_compliance.compliance_percentage);
      const throughputs = data.map((s: any) => s.current_throughput_per_hour);
      const staffingLevels = data.map((s: any) => s.active_employees);

      const totalAdded = data.reduce((sum: number, s: any) => sum + s.items_added_last_hour, 0);
      const totalCompleted = data.reduce((sum: number, s: any) => sum + s.items_completed_last_hour, 0);

      // Calculate utilization
      const totalStaffed = data.reduce((sum: number, s: any) => sum + s.staffed_employees, 0);
      const totalActive = data.reduce((sum: number, s: any) => sum + s.active_employees, 0);
      const avgUtilization = totalStaffed > 0 ? (totalActive / totalStaffed) * 100 : 0;

      // Hourly patterns
      const hourlyPatterns = this.calculateHourlyPatterns(data);

      // Priority distribution (aggregate)
      const priorityDistribution = this.aggregatePriorityBreakdown(data);

      // Age distribution (average)
      const ageDistributionAvg = this.aggregateAgeDistribution(data);

      return {
        period: request.time_period,
        queue_name: request.queue_name,
        metrics: {
          avg_backlog_size: this.average(backlogSizes),
          peak_backlog_size: Math.max(...backlogSizes),
          min_backlog_size: Math.min(...backlogSizes),
          avg_wait_time_minutes: this.average(waitTimes),
          max_wait_time_minutes: Math.max(...maxWaitTimes),
          avg_sla_compliance: this.average(slaCompliances),
          total_items_added: totalAdded,
          total_items_completed: totalCompleted,
          net_change: totalAdded - totalCompleted,
          avg_throughput_per_hour: this.average(throughputs),
          avg_staffing_level: this.average(staffingLevels),
          avg_utilization_percentage: avgUtilization,
        },
        hourly_patterns: hourlyPatterns,
        priority_distribution: priorityDistribution,
        age_distribution_avg: ageDistributionAvg,
      };
    } catch (error) {
      logger.error('Error getting backlog analytics', { error });
      throw error;
    }
  }

  /**
   * Create backlog alert rule
   */
  async createAlertRule(request: CreateBacklogAlertRequest): Promise<BacklogAlertRule> {
    try {
      const { data, error } = await supabase
        .from('backlog_alert_rules')
        .insert({
          organization_id: request.organization_id,
          department_id: request.department_id,
          queue_name: request.queue_name,
          alert_type: request.alert_type,
          threshold_value: request.threshold_value,
          comparison: request.comparison,
          duration_minutes: request.duration_minutes,
          notification_channels: request.notification_channels,
          recipients: request.recipients,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as BacklogAlertRule;
    } catch (error) {
      logger.error('Error creating alert rule', { error });
      throw error;
    }
  }

  /**
   * Check alert rules for a snapshot
   */
  private async checkAlertRules(snapshot: BacklogSnapshot): Promise<void> {
    try {
      // Fetch active rules for this queue
      const { data: rules } = await supabase
        .from('backlog_alert_rules')
        .select('*')
        .eq('organization_id', snapshot.organization_id)
        .eq('queue_name', snapshot.queue_name)
        .eq('is_active', true);

      if (!rules || rules.length === 0) {
        return;
      }

      for (const rule of rules) {
        const shouldAlert = this.evaluateAlertRule(rule, snapshot);
        
        if (shouldAlert) {
          await this.triggerAlert(rule, snapshot);
        }
      }
    } catch (error) {
      logger.error('Error checking alert rules', { error });
    }
  }

  /**
   * Evaluate if an alert rule should trigger
   */
  private evaluateAlertRule(rule: any, snapshot: BacklogSnapshot): boolean {
    let currentValue: number;

    switch (rule.alert_type) {
      case 'backlog_threshold':
        currentValue = snapshot.total_items;
        break;
      case 'wait_time_threshold':
        currentValue = snapshot.avg_wait_time_minutes;
        break;
      case 'sla_breach':
        currentValue = snapshot.sla_compliance.breached;
        break;
      case 'throughput_drop':
        currentValue = snapshot.current_throughput_per_hour;
        break;
      default:
        return false;
    }

    switch (rule.comparison) {
      case 'greater_than':
        return currentValue > rule.threshold_value;
      case 'less_than':
        return currentValue < rule.threshold_value;
      case 'equals':
        return currentValue === rule.threshold_value;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: any, snapshot: BacklogSnapshot): Promise<void> {
    try {
      const severity = this.determineSeverity(rule, snapshot);
      const message = this.generateAlertMessage(rule, snapshot);

      await supabase.from('backlog_alerts').insert({
        rule_id: rule.id,
        snapshot_id: snapshot.id,
        alert_type: rule.alert_type,
        severity,
        message,
        current_value: this.getCurrentValueForAlert(rule.alert_type, snapshot),
        threshold_value: rule.threshold_value,
        queue_name: snapshot.queue_name,
        acknowledged: false,
        resolved: false,
      });

      logger.info('Alert triggered', {
        ruleId: rule.id,
        snapshotId: snapshot.id,
        severity,
      });
    } catch (error) {
      logger.error('Error triggering alert', { error });
    }
  }

  // Helper methods
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private getTimeRange(period: string, startTime?: string, endTime?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        start = new Date(now.setDate(now.getDate() - 1));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last_7_days':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last_30_days':
        start = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'custom':
        start = startTime ? new Date(startTime) : new Date(now.setDate(now.getDate() - 1));
        end = endTime ? new Date(endTime) : now;
        break;
      default:
        start = new Date(now.setDate(now.getDate() - 1));
    }

    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  }

  private calculateHourlyPatterns(data: any[]) {
    const hourlyData = new Map<number, any[]>();

    data.forEach((snapshot) => {
      const hour = new Date(snapshot.snapshot_time).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(snapshot);
    });

    const patterns = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourSnapshots = hourlyData.get(hour) || [];
      if (hourSnapshots.length > 0) {
        const avgBacklog = this.average(hourSnapshots.map((s) => s.total_items));
        const avgWaitTime = this.average(hourSnapshots.map((s) => s.avg_wait_time_minutes));
        const avgSLA = this.average(
          hourSnapshots.map((s) => s.sla_compliance.compliance_percentage)
        );

        patterns.push({
          hour,
          avg_backlog: avgBacklog,
          avg_wait_time: avgWaitTime,
          sla_compliance: avgSLA,
        });
      }
    }

    return patterns;
  }

  private aggregatePriorityBreakdown(data: any[]) {
    const total = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    data.forEach((snapshot) => {
      total.critical += snapshot.priority_breakdown.critical || 0;
      total.high += snapshot.priority_breakdown.high || 0;
      total.medium += snapshot.priority_breakdown.medium || 0;
      total.low += snapshot.priority_breakdown.low || 0;
    });

    return total;
  }

  private aggregateAgeDistribution(data: any[]) {
    const total = {
      under_1_hour: 0,
      one_to_4_hours: 0,
      four_to_8_hours: 0,
      over_8_hours: 0,
    };

    data.forEach((snapshot) => {
      total.under_1_hour += snapshot.age_distribution.under_1_hour || 0;
      total.one_to_4_hours += snapshot.age_distribution.one_to_4_hours || 0;
      total.four_to_8_hours += snapshot.age_distribution.four_to_8_hours || 0;
      total.over_8_hours += snapshot.age_distribution.over_8_hours || 0;
    });

    const count = data.length;
    return {
      under_1_hour: total.under_1_hour / count,
      one_to_4_hours: total.one_to_4_hours / count,
      four_to_8_hours: total.four_to_8_hours / count,
      over_8_hours: total.over_8_hours / count,
    };
  }

  private getEmptyAnalytics(request: BacklogAnalyticsRequest): BacklogAnalyticsResponse {
    return {
      period: request.time_period,
      queue_name: request.queue_name,
      metrics: {
        avg_backlog_size: 0,
        peak_backlog_size: 0,
        min_backlog_size: 0,
        avg_wait_time_minutes: 0,
        max_wait_time_minutes: 0,
        avg_sla_compliance: 0,
        total_items_added: 0,
        total_items_completed: 0,
        net_change: 0,
        avg_throughput_per_hour: 0,
        avg_staffing_level: 0,
        avg_utilization_percentage: 0,
      },
      hourly_patterns: [],
      priority_distribution: { critical: 0, high: 0, medium: 0, low: 0 },
      age_distribution_avg: {
        under_1_hour: 0,
        one_to_4_hours: 0,
        four_to_8_hours: 0,
        over_8_hours: 0,
      },
    };
  }

  private determineSeverity(rule: any, snapshot: BacklogSnapshot): 'low' | 'medium' | 'high' | 'critical' {
    // Logic to determine severity based on threshold exceeded percentage
    const currentValue = this.getCurrentValueForAlert(rule.alert_type, snapshot);
    const threshold = rule.threshold_value;
    const percentExceeded = ((currentValue - threshold) / threshold) * 100;

    if (percentExceeded > 100) return 'critical';
    if (percentExceeded > 50) return 'high';
    if (percentExceeded > 25) return 'medium';
    return 'low';
  }

  private generateAlertMessage(rule: any, snapshot: BacklogSnapshot): string {
    const currentValue = this.getCurrentValueForAlert(rule.alert_type, snapshot);
    return `${rule.alert_type} alert: Current value ${currentValue} ${rule.comparison} threshold ${rule.threshold_value} for queue ${snapshot.queue_name}`;
  }

  private getCurrentValueForAlert(alertType: string, snapshot: BacklogSnapshot): number {
    switch (alertType) {
      case 'backlog_threshold':
        return snapshot.total_items;
      case 'wait_time_threshold':
        return snapshot.avg_wait_time_minutes;
      case 'sla_breach':
        return snapshot.sla_compliance.breached;
      case 'throughput_drop':
        return snapshot.current_throughput_per_hour;
      default:
        return 0;
    }
  }
}

export const backlogSnapshotService = new BacklogSnapshotService();
