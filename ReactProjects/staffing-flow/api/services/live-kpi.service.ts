/**
 * Live KPI Computation Service
 * Calculates real-time operational metrics for intraday console
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket.service';
import type {
  LiveKPISnapshot,
  UtilizationMetrics,
  HeadcountGapMetrics,
  SLARiskMetrics,
  RecommendedAction,
  ComputeLiveKPIsRequest,
  ComputeLiveKPIsResponse,
  GetKPIHistoryRequest,
  GetKPIHistoryResponse,
  KPIDashboardRequest,
  KPIDashboardResponse,
  CreateKPIAlertRequest,
  KPIAlertRule,
  KPIComputationConfig,
} from '../types/liveKpi';
import type { AttendanceSnapshot } from '../types/attendanceSnapshot';
import type { BacklogSnapshot } from '../types/backlogSnapshot';

class LiveKPIService {
  private config: KPIComputationConfig = {
    target_utilization_percentage: 85,
    utilization_warning_threshold: 70,
    utilization_critical_threshold: 50,
    optimal_coverage_ratio_min: 0.95,
    optimal_coverage_ratio_max: 1.10,
    critical_understaffed_threshold: 0.80,
    target_sla_percentage: 95,
    sla_warning_threshold: 90,
    sla_critical_threshold: 80,
    target_wait_time_minutes: 15,
    health_score_weights: {
      utilization: 0.25,
      coverage: 0.35,
      sla_compliance: 0.30,
      efficiency: 0.10,
    },
    max_attendance_data_age_seconds: 300, // 5 minutes
    max_backlog_data_age_seconds: 300, // 5 minutes
    default_items_per_hour_per_person: 12,
    auto_compute_interval_seconds: 60, // 1 minute
  };

  /**
   * Compute live KPIs for a queue/department
   */
  async computeLiveKPIs(request: ComputeLiveKPIsRequest): Promise<ComputeLiveKPIsResponse> {
    const startTime = Date.now();
    
    try {
      const asOfTime = request.as_of_time ? new Date(request.as_of_time) : new Date();
      
      logger.info('Computing live KPIs', {
        organization_id: request.organization_id,
        department_id: request.department_id,
        queue_name: request.queue_name,
        as_of_time: asOfTime.toISOString(),
      });

      // Fetch latest attendance and backlog data
      const [attendanceData, backlogData] = await Promise.all([
        this.fetchLatestAttendance(request, asOfTime),
        this.fetchLatestBacklog(request, asOfTime),
      ]);

      // Compute individual KPI components
      const utilization = this.computeUtilization(attendanceData, backlogData);
      const headcountGap = await this.computeHeadcountGap(request, attendanceData, backlogData, asOfTime);
      const slaRisk = this.computeSLARisk(backlogData);

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(utilization, headcountGap, slaRisk);

      // Calculate overall health score
      const overallHealthScore = this.calculateHealthScore(utilization, headcountGap, slaRisk);

      // Count critical alerts
      const criticalAlerts = recommendedActions.filter(a => a.priority === 'critical').length;

      // Build snapshot
      const snapshot: LiveKPISnapshot = {
        snapshot_id: this.generateSnapshotId(),
        timestamp: new Date().toISOString(),
        organization_id: request.organization_id,
        department_id: request.department_id,
        site_id: request.site_id,
        queue_name: request.queue_name,
        utilization,
        headcount_gap: headcountGap,
        sla_risk: slaRisk,
        overall_health_score: overallHealthScore,
        critical_alerts: criticalAlerts,
        recommended_actions: recommendedActions,
        data_as_of: asOfTime.toISOString(),
        attendance_data_age_seconds: attendanceData.age_seconds,
        backlog_data_age_seconds: backlogData.age_seconds,
      };

      // Store snapshot
      await this.storeKPISnapshot(snapshot);

      // Check alert rules
      await this.checkAlertRules(snapshot);

      // Handle historical comparison if requested
      let comparison;
      if (request.include_comparison) {
        comparison = await this.getComparison(request, snapshot);
      }

      const computationTime = Date.now() - startTime;

      // Broadcast KPI update via WebSocket
      if (webSocketService.isInitialized()) {
        try {
          webSocketService.broadcastKPIUpdate({
            organization_id: snapshot.organization_id,
            department_id: snapshot.department_id,
            queue_name: snapshot.queue_name,
            timestamp: snapshot.timestamp,
            utilization: snapshot.utilization,
            headcount_gap: snapshot.headcount_gap,
            sla_risk: {
              risk_score: snapshot.sla_risk.risk_score,
              risk_level: snapshot.sla_risk.risk_level,
              compliance_percentage: snapshot.sla_risk.current_sla_compliance,
              average_wait_time_minutes: snapshot.sla_risk.current_avg_wait_time,
              items_at_risk: snapshot.sla_risk.items_at_risk,
              sla_threshold_minutes: snapshot.sla_risk.target_wait_time,
            },
            health_score: snapshot.overall_health_score,
            changes: {
              utilization_change: 0, // Would compare with previous
              headcount_gap_change: 0,
              sla_risk_change: 0,
              health_score_change: 0,
            },
          });
          logger.debug('KPI update broadcasted via WebSocket', {
            organization_id: snapshot.organization_id,
            queue_name: snapshot.queue_name,
          });
        } catch (error) {
          logger.error('Failed to broadcast KPI update', error);
        }
      }

      return {
        success: true,
        snapshot,
        comparison,
        computation_time_ms: computationTime,
      };
    } catch (error) {
      logger.error('Error computing live KPIs', error);
      throw error;
    }
  }

  /**
   * Fetch latest attendance data
   */
  private async fetchLatestAttendance(
    request: ComputeLiveKPIsRequest,
    asOfTime: Date
  ): Promise<{ snapshots: AttendanceSnapshot[]; age_seconds: number }> {
    const { data, error } = await supabase
      .from('attendance_snapshots')
      .select('*')
      .eq('organization_id', request.organization_id)
      .eq('shift_date', asOfTime.toISOString().split('T')[0])
      .lte('snapshot_time', asOfTime.toISOString())
      .order('snapshot_time', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Error fetching attendance data', error);
      return { snapshots: [], age_seconds: 0 };
    }

    const snapshots = (data || []) as AttendanceSnapshot[];
    const latestSnapshot = snapshots[0];
    const ageSeconds = latestSnapshot
      ? Math.floor((asOfTime.getTime() - new Date(latestSnapshot.snapshot_time).getTime()) / 1000)
      : 0;

    return { snapshots, age_seconds: ageSeconds };
  }

  /**
   * Fetch latest backlog data
   */
  private async fetchLatestBacklog(
    request: ComputeLiveKPIsRequest,
    asOfTime: Date
  ): Promise<{ snapshots: BacklogSnapshot[]; age_seconds: number }> {
    let query = supabase
      .from('backlog_snapshots')
      .select('*')
      .eq('organization_id', request.organization_id)
      .lte('snapshot_time', asOfTime.toISOString())
      .order('snapshot_time', { ascending: false })
      .limit(10);

    if (request.department_id) {
      query = query.eq('department_id', request.department_id);
    }
    if (request.queue_name) {
      query = query.eq('queue_name', request.queue_name);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching backlog data', error);
      return { snapshots: [], age_seconds: 0 };
    }

    const snapshots = (data || []) as BacklogSnapshot[];
    const latestSnapshot = snapshots[0];
    const ageSeconds = latestSnapshot
      ? Math.floor((asOfTime.getTime() - new Date(latestSnapshot.snapshot_time).getTime()) / 1000)
      : 0;

    return { snapshots, age_seconds: ageSeconds };
  }

  /**
   * Compute utilization metrics
   */
  private computeUtilization(
    attendanceData: { snapshots: AttendanceSnapshot[] },
    backlogData: { snapshots: BacklogSnapshot[] }
  ): UtilizationMetrics {
    const attendance = attendanceData.snapshots;
    
    // Count staff by status
    const activeStaff = attendance.filter(a => a.is_present || a.is_on_break).length;
    const staffOnBreak = attendance.filter(a => a.is_on_break).length;
    const productiveStaff = activeStaff - staffOnBreak;

    // Calculate time metrics (assuming current snapshot represents 1 hour window)
    const availableHours = activeStaff * 1.0;
    const breakHours = staffOnBreak * (15 / 60); // Assume 15 min breaks
    const productiveHours = availableHours - breakHours;
    const idleHours = Math.max(0, availableHours - productiveHours);

    // Calculate work rate
    const backlogSnapshot = backlogData.snapshots[0];
    const itemsCompleted = backlogSnapshot?.items_completed_last_hour || 0;
    const avgWorkRate = productiveStaff > 0 ? itemsCompleted / productiveStaff : 0;

    // Calculate utilization
    const currentUtilization = availableHours > 0 ? (productiveHours / availableHours) * 100 : 0;
    const targetUtilization = this.config.target_utilization_percentage;
    const utilizationVariance = currentUtilization - targetUtilization;

    // Calculate efficiency (comparing actual vs expected work rate)
    const expectedWorkRate = this.config.default_items_per_hour_per_person;
    const efficiencyScore = expectedWorkRate > 0 ? Math.min(100, (avgWorkRate / expectedWorkRate) * 100) : 0;

    return {
      current_utilization: Math.round(currentUtilization * 10) / 10,
      target_utilization: targetUtilization,
      utilization_variance: Math.round(utilizationVariance * 10) / 10,
      productive_hours: Math.round(productiveHours * 100) / 100,
      available_hours: Math.round(availableHours * 100) / 100,
      idle_hours: Math.round(idleHours * 100) / 100,
      active_staff_count: activeStaff,
      staff_on_break: staffOnBreak,
      idle_staff_count: Math.max(0, activeStaff - productiveStaff - staffOnBreak),
      avg_work_rate: Math.round(avgWorkRate * 10) / 10,
      efficiency_score: Math.round(efficiencyScore * 10) / 10,
    };
  }

  /**
   * Compute headcount gap metrics
   */
  private async computeHeadcountGap(
    request: ComputeLiveKPIsRequest,
    attendanceData: { snapshots: AttendanceSnapshot[] },
    backlogData: { snapshots: BacklogSnapshot[] },
    asOfTime: Date
  ): Promise<HeadcountGapMetrics> {
    const attendance = attendanceData.snapshots;
    
    // Current headcount (present staff)
    const currentHeadcount = attendance.filter(a => 
      a.is_present || a.is_on_break
    ).length;

    // Scheduled headcount (all who should be working)
    const scheduledHeadcount = attendance.filter(a => 
      !a.is_absent
    ).length;

    // Absent and late counts
    const absentCount = attendance.filter(a => a.is_absent).length;
    const lateCount = attendance.filter(a => a.is_late).length;

    // Calculate required headcount based on backlog
    const backlogSnapshot = backlogData.snapshots[0];
    const totalItems = backlogSnapshot?.total_items || 0;
    const avgWaitTime = backlogSnapshot?.avg_wait_time_minutes || 0;
    
    const requiredHeadcount = this.calculateRequiredHeadcount(
      totalItems,
      avgWaitTime,
      this.config.target_wait_time_minutes,
      this.config.default_items_per_hour_per_person
    );

    // Calculate gap
    const headcountGap = currentHeadcount - requiredHeadcount;
    const gapPercentage = requiredHeadcount > 0 
      ? Math.round((headcountGap / requiredHeadcount) * 100) 
      : 0;

    // Coverage ratio
    const coverageRatio = requiredHeadcount > 0 
      ? currentHeadcount / requiredHeadcount 
      : 1.0;

    // Determine staffing level
    const staffingLevel = this.determineStaffingLevel(coverageRatio);

    // Project next hour (fetch scheduled arrivals/departures)
    const projectedNextHour = await this.projectNextHourHeadcount(
      request,
      currentHeadcount,
      asOfTime
    );

    return {
      current_headcount: currentHeadcount,
      required_headcount: requiredHeadcount,
      headcount_gap: headcountGap,
      gap_percentage: gapPercentage,
      scheduled_headcount: scheduledHeadcount,
      absent_count: absentCount,
      late_count: lateCount,
      coverage_ratio: Math.round(coverageRatio * 100) / 100,
      staffing_level: staffingLevel,
      projected_headcount_next_hour: projectedNextHour.headcount,
      projected_gap_next_hour: projectedNextHour.headcount - requiredHeadcount,
    };
  }

  /**
   * Calculate required headcount based on demand
   */
  private calculateRequiredHeadcount(
    totalItems: number,
    avgWaitTime: number,
    targetWaitTime: number,
    itemsPerHourPerPerson: number
  ): number {
    // If wait time is over target, scale up staff
    const waitTimeMultiplier = avgWaitTime > targetWaitTime 
      ? avgWaitTime / targetWaitTime 
      : 1.0;

    // Base requirement from backlog size
    const baseRequirement = Math.ceil(totalItems / (itemsPerHourPerPerson * 2)); // 2-hour target clearance

    // Apply wait time multiplier
    const adjustedRequirement = Math.ceil(baseRequirement * waitTimeMultiplier);

    return Math.max(1, adjustedRequirement);
  }

  /**
   * Determine staffing level category
   */
  private determineStaffingLevel(coverageRatio: number): HeadcountGapMetrics['staffing_level'] {
    if (coverageRatio < this.config.critical_understaffed_threshold) {
      return 'critical_understaffed';
    } else if (coverageRatio < this.config.optimal_coverage_ratio_min) {
      return 'understaffed';
    } else if (coverageRatio <= this.config.optimal_coverage_ratio_max) {
      return 'optimal';
    } else if (coverageRatio <= 1.3) {
      return 'overstaffed';
    } else {
      return 'critical_overstaffed';
    }
  }

  /**
   * Project headcount for next hour
   */
  private async projectNextHourHeadcount(
    request: ComputeLiveKPIsRequest,
    currentHeadcount: number,
    asOfTime: Date
  ): Promise<{ headcount: number; arrivals: number; departures: number }> {
    const nextHour = new Date(asOfTime.getTime() + 60 * 60 * 1000);
    
    // Query scheduled shifts starting/ending in next hour
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('organization_id', request.organization_id)
      .gte('start_time', asOfTime.toISOString())
      .lt('start_time', nextHour.toISOString());

    const arrivals = shifts?.length || 0;

    const { data: endingShifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('organization_id', request.organization_id)
      .gte('end_time', asOfTime.toISOString())
      .lt('end_time', nextHour.toISOString());

    const departures = endingShifts?.length || 0;

    return {
      headcount: currentHeadcount + arrivals - departures,
      arrivals,
      departures,
    };
  }

  /**
   * Compute SLA risk metrics
   */
  private computeSLARisk(backlogData: { snapshots: BacklogSnapshot[] }): SLARiskMetrics {
    const backlogSnapshot = backlogData.snapshots[0];
    
    if (!backlogSnapshot) {
      return this.getEmptySLARisk();
    }

    // Extract backlog metrics
    const totalItems = backlogSnapshot.total_items || 0;
    const avgWaitTime = backlogSnapshot.avg_wait_time_minutes || 0;
    const itemsOverSLA = backlogSnapshot.sla_compliance?.breached || 0;
    const slaThresholdMinutes = backlogSnapshot.sla_compliance?.sla_target_minutes || 60;

    // Calculate SLA compliance
    const currentSLACompliance = totalItems > 0 
      ? ((totalItems - itemsOverSLA) / totalItems) * 100 
      : 100;

    const targetSLA = this.config.target_sla_percentage;
    const slaVariance = currentSLACompliance - targetSLA;

    // Calculate wait time variance
    const targetWaitTime = this.config.target_wait_time_minutes;
    const waitTimeVariance = avgWaitTime - targetWaitTime;

    // Determine items at risk (close to breaching)
    const itemsAtRisk = Math.floor(totalItems * 0.15); // Assume 15% at risk
    const atRiskPercentage = totalItems > 0 ? (itemsAtRisk / totalItems) * 100 : 0;

    // Estimate time to next breach
    const timeToNextBreach = avgWaitTime < slaThresholdMinutes 
      ? slaThresholdMinutes - avgWaitTime 
      : null;

    // Determine backlog trend (compare with previous snapshots)
    const backlogTrend = this.determineBacklogTrend(backlogData.snapshots);

    // Calculate risk score (0-100)
    const riskScore = this.calculateRiskScore(
      currentSLACompliance,
      avgWaitTime,
      atRiskPercentage,
      backlogTrend
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    // Project SLA for next hour
    const projectedSLANextHour = this.projectSLANextHour(
      currentSLACompliance,
      backlogTrend,
      avgWaitTime
    );

    return {
      risk_level: riskLevel,
      risk_score: Math.round(riskScore),
      current_sla_compliance: Math.round(currentSLACompliance * 10) / 10,
      target_sla: targetSLA,
      sla_variance: Math.round(slaVariance * 10) / 10,
      current_avg_wait_time: Math.round(avgWaitTime * 10) / 10,
      target_wait_time: targetWaitTime,
      wait_time_variance: Math.round(waitTimeVariance * 10) / 10,
      items_at_risk: itemsAtRisk,
      items_breached: itemsOverSLA,
      total_items: totalItems,
      at_risk_percentage: Math.round(atRiskPercentage * 10) / 10,
      time_to_next_breach: timeToNextBreach,
      backlog_trend: backlogTrend,
      projected_sla_next_hour: Math.round(projectedSLANextHour * 10) / 10,
    };
  }

  /**
   * Determine backlog trend from historical snapshots
   */
  private determineBacklogTrend(snapshots: BacklogSnapshot[]): SLARiskMetrics['backlog_trend'] {
    if (snapshots.length < 2) {
      return 'stable';
    }

    const recent = snapshots[0]?.total_items || 0;
    const previous = snapshots[1]?.total_items || 0;
    
    const change = ((recent - previous) / previous) * 100;

    if (change > 10) return 'growing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate risk score (0-100, higher = more risk)
   */
  private calculateRiskScore(
    slaCompliance: number,
    avgWaitTime: number,
    atRiskPercentage: number,
    backlogTrend: SLARiskMetrics['backlog_trend']
  ): number {
    // SLA compliance component (inverted, 40% weight)
    const slaComponent = (100 - slaCompliance) * 0.4;

    // Wait time component (30% weight)
    const waitTimeComponent = Math.min(100, (avgWaitTime / 60) * 100) * 0.3;

    // At-risk items component (20% weight)
    const atRiskComponent = atRiskPercentage * 0.2;

    // Trend component (10% weight)
    const trendMultiplier = backlogTrend === 'growing' ? 1.5 : backlogTrend === 'decreasing' ? 0.5 : 1.0;
    const trendComponent = 10 * trendMultiplier * 0.1;

    const totalScore = slaComponent + waitTimeComponent + atRiskComponent + trendComponent;

    return Math.min(100, Math.max(0, totalScore));
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(riskScore: number): SLARiskMetrics['risk_level'] {
    if (riskScore >= 75) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  /**
   * Project SLA compliance for next hour
   */
  private projectSLANextHour(
    currentSLA: number,
    trend: SLARiskMetrics['backlog_trend'],
    avgWaitTime: number
  ): number {
    let projection = currentSLA;

    if (trend === 'growing') {
      projection -= 5; // Expect 5% degradation
    } else if (trend === 'decreasing') {
      projection += 3; // Expect 3% improvement
    }

    // Factor in current wait time
    if (avgWaitTime > 30) {
      projection -= 2;
    }

    return Math.max(0, Math.min(100, projection));
  }

  /**
   * Generate recommended actions based on KPI analysis
   */
  private generateRecommendedActions(
    utilization: UtilizationMetrics,
    headcountGap: HeadcountGapMetrics,
    slaRisk: SLARiskMetrics
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    // Critical understaffing
    if (headcountGap.staffing_level === 'critical_understaffed') {
      actions.push({
        action_type: 'add_staff',
        priority: 'critical',
        description: `Critically understaffed: Add ${Math.abs(headcountGap.headcount_gap)} staff immediately`,
        expected_impact: `Improve coverage ratio from ${(headcountGap.coverage_ratio * 100).toFixed(0)}% to 95%+`,
        staff_change_count: Math.abs(headcountGap.headcount_gap),
      });
    }

    // High SLA risk
    if (slaRisk.risk_level === 'critical' || slaRisk.risk_level === 'high') {
      actions.push({
        action_type: 'alert_management',
        priority: slaRisk.risk_level === 'critical' ? 'critical' : 'high',
        description: `SLA at risk: ${slaRisk.items_at_risk} items may breach SLA in next ${slaRisk.time_to_next_breach || 'N/A'} minutes`,
        expected_impact: `Prevent SLA breach and maintain ${this.config.target_sla_percentage}% compliance`,
      });
    }

    // Low utilization with adequate staffing
    if (utilization.current_utilization < this.config.utilization_critical_threshold && 
        headcountGap.staffing_level === 'overstaffed') {
      actions.push({
        action_type: 'redistribute_work',
        priority: 'medium',
        description: `Low utilization (${utilization.current_utilization.toFixed(0)}%) with ${headcountGap.headcount_gap} excess staff`,
        expected_impact: `Redistribute work to improve efficiency or release excess staff`,
        staff_change_count: Math.abs(headcountGap.headcount_gap),
      });
    }

    // Regular understaffing
    if (headcountGap.staffing_level === 'understaffed') {
      actions.push({
        action_type: 'add_staff',
        priority: 'high',
        description: `Understaffed: Add ${Math.abs(headcountGap.headcount_gap)} staff to meet demand`,
        expected_impact: `Reach optimal coverage and improve SLA compliance`,
        staff_change_count: Math.abs(headcountGap.headcount_gap),
      });
    }

    // If no critical issues
    if (actions.length === 0) {
      actions.push({
        action_type: 'none',
        priority: 'low',
        description: 'Operations are within normal parameters',
        expected_impact: 'Continue monitoring',
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(
    utilization: UtilizationMetrics,
    headcountGap: HeadcountGapMetrics,
    slaRisk: SLARiskMetrics
  ): number {
    const weights = this.config.health_score_weights;

    // Utilization score (normalize to 0-100)
    const utilizationScore = Math.min(100, utilization.current_utilization);

    // Coverage score (normalize coverage ratio to 0-100)
    const optimalCoverage = (this.config.optimal_coverage_ratio_min + this.config.optimal_coverage_ratio_max) / 2;
    const coverageDeviation = Math.abs(headcountGap.coverage_ratio - optimalCoverage);
    const coverageScore = Math.max(0, 100 - (coverageDeviation * 200));

    // SLA compliance score (direct percentage)
    const slaScore = slaRisk.current_sla_compliance;

    // Efficiency score (from utilization metrics)
    const efficiencyScore = utilization.efficiency_score;

    // Weighted average
    const healthScore = 
      (utilizationScore * weights.utilization) +
      (coverageScore * weights.coverage) +
      (slaScore * weights.sla_compliance) +
      (efficiencyScore * weights.efficiency);

    return Math.round(healthScore);
  }

  /**
   * Store KPI snapshot in database
   */
  private async storeKPISnapshot(snapshot: LiveKPISnapshot): Promise<void> {
    const { error } = await supabase
      .from('live_kpi_snapshots')
      .insert({
        snapshot_id: snapshot.snapshot_id,
        timestamp: snapshot.timestamp,
        organization_id: snapshot.organization_id,
        department_id: snapshot.department_id,
        site_id: snapshot.site_id,
        queue_name: snapshot.queue_name,
        utilization: snapshot.utilization,
        headcount_gap: snapshot.headcount_gap,
        sla_risk: snapshot.sla_risk,
        overall_health_score: snapshot.overall_health_score,
        critical_alerts: snapshot.critical_alerts,
        recommended_actions: snapshot.recommended_actions,
        data_as_of: snapshot.data_as_of,
      });

    if (error) {
      logger.error('Error storing KPI snapshot', error);
    }
  }

  /**
   * Check alert rules and trigger alerts
   */
  private async checkAlertRules(snapshot: LiveKPISnapshot): Promise<void> {
    // Implementation similar to backlog/attendance alert checking
    // Fetch active rules, evaluate conditions, trigger alerts
    logger.info('Checking KPI alert rules', { snapshot_id: snapshot.snapshot_id });
  }

  /**
   * Get historical comparison
   */
  private async getComparison(
    request: ComputeLiveKPIsRequest,
    currentSnapshot: LiveKPISnapshot
  ): Promise<ComputeLiveKPIsResponse['comparison']> {
    const comparisonPeriod = request.comparison_period_minutes || 60;
    const comparisonTime = new Date(Date.now() - comparisonPeriod * 60 * 1000);

    const { data } = await supabase
      .from('live_kpi_snapshots')
      .select('*')
      .eq('organization_id', request.organization_id)
      .lte('timestamp', comparisonTime.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      return undefined;
    }

    const previousSnapshot = data as any as LiveKPISnapshot;

    const utilizationChange = 
      currentSnapshot.utilization.current_utilization - previousSnapshot.utilization.current_utilization;
    const headcountGapChange = 
      currentSnapshot.headcount_gap.headcount_gap - previousSnapshot.headcount_gap.headcount_gap;
    const slaRiskChange = 
      currentSnapshot.sla_risk.risk_score - previousSnapshot.sla_risk.risk_score;

    const trend = 
      currentSnapshot.overall_health_score > previousSnapshot.overall_health_score + 5 ? 'improving' :
      currentSnapshot.overall_health_score < previousSnapshot.overall_health_score - 5 ? 'degrading' :
      'stable';

    return {
      previous_snapshot: previousSnapshot,
      utilization_change: Math.round(utilizationChange * 10) / 10,
      headcount_gap_change: headcountGapChange,
      sla_risk_change: Math.round(slaRiskChange),
      trend,
    };
  }

  /**
   * Get KPI history
   */
  async getKPIHistory(request: GetKPIHistoryRequest): Promise<GetKPIHistoryResponse> {
    const { data, error } = await supabase
      .from('live_kpi_snapshots')
      .select('*')
      .eq('organization_id', request.organization_id)
      .gte('timestamp', request.start_time)
      .lte('timestamp', request.end_time)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch KPI history: ${error.message}`);
    }

    const dataPoints = (data || []) as any[] as LiveKPISnapshot[];

    // Calculate summary statistics
    const summary = this.calculateHistorySummary(dataPoints);

    return {
      success: true,
      data_points: dataPoints,
      summary,
      total_count: dataPoints.length,
      time_range: {
        start: request.start_time,
        end: request.end_time,
      },
    };
  }

  /**
   * Calculate summary statistics for history
   */
  private calculateHistorySummary(dataPoints: LiveKPISnapshot[]): GetKPIHistoryResponse['summary'] {
    if (dataPoints.length === 0) {
      return {
        avg_utilization: 0,
        avg_headcount_gap: 0,
        avg_sla_risk_score: 0,
        avg_health_score: 0,
        peak_utilization: 0,
        peak_headcount_gap: 0,
        peak_risk_score: 0,
        min_utilization: 0,
        min_headcount_gap: 0,
        min_risk_score: 0,
        critical_risk_duration_minutes: 0,
        understaffed_duration_minutes: 0,
        optimal_staffing_duration_minutes: 0,
      };
    }

    const utilizations = dataPoints.map(d => d.utilization.current_utilization);
    const headcountGaps = dataPoints.map(d => d.headcount_gap.headcount_gap);
    const riskScores = dataPoints.map(d => d.sla_risk.risk_score);
    const healthScores = dataPoints.map(d => d.overall_health_score);

    // Duration calculations (assuming 1 data point per minute)
    const lastPoint = dataPoints[dataPoints.length - 1];
    const firstPoint = dataPoints[0];
    const minutesPerPoint = dataPoints.length > 1 && lastPoint && firstPoint
      ? (new Date(lastPoint.timestamp).getTime() - 
         new Date(firstPoint.timestamp).getTime()) / (dataPoints.length - 1) / 60000
      : 1;

    const criticalRiskPoints = dataPoints.filter(d => d.sla_risk.risk_level === 'critical').length;
    const understaffedPoints = dataPoints.filter(d => 
      d.headcount_gap.staffing_level === 'understaffed' || 
      d.headcount_gap.staffing_level === 'critical_understaffed'
    ).length;
    const optimalPoints = dataPoints.filter(d => d.headcount_gap.staffing_level === 'optimal').length;

    return {
      avg_utilization: this.average(utilizations),
      avg_headcount_gap: this.average(headcountGaps),
      avg_sla_risk_score: this.average(riskScores),
      avg_health_score: this.average(healthScores),
      peak_utilization: Math.max(...utilizations),
      peak_headcount_gap: Math.max(...headcountGaps),
      peak_risk_score: Math.max(...riskScores),
      min_utilization: Math.min(...utilizations),
      min_headcount_gap: Math.min(...headcountGaps),
      min_risk_score: Math.min(...riskScores),
      critical_risk_duration_minutes: Math.round(criticalRiskPoints * minutesPerPoint),
      understaffed_duration_minutes: Math.round(understaffedPoints * minutesPerPoint),
      optimal_staffing_duration_minutes: Math.round(optimalPoints * minutesPerPoint),
    };
  }

  /**
   * Get KPI dashboard for multiple queues
   */
  async getKPIDashboard(request: KPIDashboardRequest): Promise<KPIDashboardResponse> {
    const startTime = Date.now();

    // Get latest KPI snapshots for all relevant queues
    let query = supabase
      .from('live_kpi_snapshots')
      .select('*')
      .eq('organization_id', request.organization_id)
      .order('timestamp', { ascending: false });

    if (request.department_id) {
      query = query.eq('department_id', request.department_id);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }

    const allSnapshots = (data || []) as any[] as LiveKPISnapshot[];

    // Group by queue and get latest for each
    const queueMap = new Map<string, LiveKPISnapshot>();
    allSnapshots.forEach(snapshot => {
      const key = snapshot.queue_name || 'default';
      if (!queueMap.has(key) || 
          new Date(snapshot.timestamp) > new Date(queueMap.get(key)!.timestamp)) {
        queueMap.set(key, snapshot);
      }
    });

    const queueSnapshots = Array.from(queueMap.values());

    // Filter by requested queues if specified
    const filteredSnapshots = request.queue_names 
      ? queueSnapshots.filter(s => request.queue_names!.includes(s.queue_name || ''))
      : queueSnapshots;

    // Calculate overall metrics
    const overall = {
      total_queues: filteredSnapshots.length,
      queues_at_risk: filteredSnapshots.filter(s => 
        s.sla_risk.risk_level === 'high' || s.sla_risk.risk_level === 'critical'
      ).length,
      total_headcount: filteredSnapshots.reduce((sum, s) => sum + s.headcount_gap.current_headcount, 0),
      total_required: filteredSnapshots.reduce((sum, s) => sum + s.headcount_gap.required_headcount, 0),
      overall_utilization: this.average(filteredSnapshots.map(s => s.utilization.current_utilization)),
      overall_sla_compliance: this.average(filteredSnapshots.map(s => s.sla_risk.current_sla_compliance)),
      critical_alerts: filteredSnapshots.reduce((sum, s) => sum + s.critical_alerts, 0),
    };

    // Rank queues by risk
    const queues = filteredSnapshots
      .sort((a, b) => b.sla_risk.risk_score - a.sla_risk.risk_score)
      .map((snapshot, index) => ({
        queue_name: snapshot.queue_name || 'default',
        snapshot,
        rank_by_risk: index + 1,
      }));

    // Collect top priority actions
    const allActions = filteredSnapshots.flatMap(s => s.recommended_actions);
    const topPriorityActions = allActions
      .filter(a => a.priority === 'critical' || a.priority === 'high')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 10);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      overall,
      queues,
      top_priority_actions: topPriorityActions,
      computation_time_ms: Date.now() - startTime,
    };
  }

  /**
   * Create KPI alert rule
   */
  async createAlertRule(request: CreateKPIAlertRequest): Promise<KPIAlertRule> {
    const rule: KPIAlertRule = {
      rule_id: this.generateRuleId(),
      organization_id: request.organization_id,
      department_id: request.department_id,
      queue_name: request.queue_name,
      rule_name: request.rule_name,
      enabled: true,
      alert_type: request.alert_type,
      threshold_value: request.threshold_value,
      comparison_operator: request.comparison_operator,
      severity: request.severity,
      notification_channels: request.notification_channels,
      notification_recipients: request.notification_recipients,
      cooldown_minutes: request.cooldown_minutes || 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('kpi_alert_rules')
      .insert(rule);

    if (error) {
      throw new Error(`Failed to create alert rule: ${error.message}`);
    }

    return rule;
  }

  // Helper methods
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round((numbers.reduce((sum, n) => sum + n, 0) / numbers.length) * 10) / 10;
  }

  private generateSnapshotId(): string {
    return `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEmptySLARisk(): SLARiskMetrics {
    return {
      risk_level: 'low',
      risk_score: 0,
      current_sla_compliance: 100,
      target_sla: this.config.target_sla_percentage,
      sla_variance: 0,
      current_avg_wait_time: 0,
      target_wait_time: this.config.target_wait_time_minutes,
      wait_time_variance: 0,
      items_at_risk: 0,
      items_breached: 0,
      total_items: 0,
      at_risk_percentage: 0,
      time_to_next_breach: null,
      backlog_trend: 'stable',
      projected_sla_next_hour: 100,
    };
  }
}

export const liveKPIService = new LiveKPIService();
