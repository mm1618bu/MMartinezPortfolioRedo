/**
 * Alert Rules Engine Service
 * Centralized alerting infrastructure for intraday console
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket.service';
import type {
  AlertRule,
  Alert,
  AlertGroup,
  AlertSource,
  AlertSeverity,
  AlertStatus,
  ComparisonOperator,
  NotificationChannel,
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
  AlertEngineConfig,
} from '../types/alertRulesEngine';

class AlertRulesEngineService {
  private config: AlertEngineConfig = {
    evaluation_interval_seconds: 60,
    max_rules_per_evaluation: 100,
    notification_retry_attempts: 3,
    notification_retry_delay_seconds: 30,
    default_cooldown_minutes: 15,
    default_auto_expire_minutes: 240, // 4 hours
    default_auto_resolve_minutes: 60,
    default_grouping_window_minutes: 10,
    default_max_before_grouping: 5,
    default_escalation_delay_minutes: 30,
    max_active_alerts_per_queue: 50,
    max_notifications_per_minute: 100,
    archive_resolved_after_days: 30,
    archive_expired_after_days: 7,
  };

  // ==============================================
  // ALERT RULE MANAGEMENT
  // ==============================================

  /**
   * Create a new alert rule
   */
  async createRule(request: CreateAlertRuleRequest): Promise<AlertRule> {
    const rule: AlertRule = {
      rule_id: this.generateRuleId(),
      rule_name: request.rule_name,
      description: request.description,
      organization_id: request.organization_id,
      department_id: request.department_id,
      site_id: request.site_id,
      queue_name: request.queue_name,
      source: request.source,
      alert_type: request.alert_type,
      severity: request.severity,
      enabled: true,
      condition: request.condition,
      additional_conditions: request.additional_conditions,
      notification_channels: request.notification_channels,
      notification_recipients: request.notification_recipients,
      notification_template: request.notification_template,
      cooldown_minutes: request.cooldown_minutes || this.config.default_cooldown_minutes,
      auto_resolve_after_minutes: request.auto_resolve_after_minutes,
      auto_expire_after_minutes: request.auto_expire_after_minutes || this.config.default_auto_expire_minutes,
      schedule: request.schedule,
      escalation: request.escalation,
      grouping: request.grouping,
      suppression: request.suppression,
      priority: request.priority || 3,
      tags: request.tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      trigger_count: 0,
    };

    const { error } = await supabase
      .from('alert_rules')
      .insert(rule);

    if (error) {
      throw new Error(`Failed to create alert rule: ${error.message}`);
    }

    logger.info('Alert rule created', { rule_id: rule.rule_id, rule_name: rule.rule_name });

    return rule;
  }

  /**
   * Update an existing alert rule
   */
  async updateRule(request: UpdateAlertRuleRequest): Promise<AlertRule> {
    const updates: any = {
      ...request,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('alert_rules')
      .update(updates)
      .eq('rule_id', request.rule_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update alert rule: ${error.message}`);
    }

    logger.info('Alert rule updated', { rule_id: request.rule_id });

    return data as AlertRule;
  }

  /**
   * Delete an alert rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('rule_id', ruleId);

    if (error) {
      throw new Error(`Failed to delete alert rule: ${error.message}`);
    }

    logger.info('Alert rule deleted', { rule_id: ruleId });
  }

  /**
   * List alert rules
   */
  async listRules(request: ListAlertRulesRequest): Promise<ListAlertRulesResponse> {
    let query = supabase
      .from('alert_rules')
      .select('*', { count: 'exact' })
      .eq('organization_id', request.organization_id);

    if (request.department_id) {
      query = query.eq('department_id', request.department_id);
    }
    if (request.source) {
      query = query.eq('source', request.source);
    }
    if (request.enabled !== undefined) {
      query = query.eq('enabled', request.enabled);
    }
    if (request.severity) {
      query = query.in('severity', request.severity);
    }

    const page = request.page || 1;
    const pageSize = request.page_size || 50;
    const offset = (page - 1) * pageSize;

    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list alert rules: ${error.message}`);
    }

    return {
      success: true,
      rules: (data || []) as AlertRule[],
      total_count: count || 0,
      page,
      page_size: pageSize,
    };
  }

  // ==============================================
  // RULE EVALUATION
  // ==============================================

  /**
   * Evaluate alert rules
   */
  async evaluateRules(request: EvaluateRulesRequest): Promise<EvaluateRulesResponse> {
    const startTime = Date.now();
    
    logger.info('Evaluating alert rules', {
      organization_id: request.organization_id,
      department_id: request.department_id,
      source: request.source,
    });

    // Fetch applicable rules
    const rules = await this.fetchApplicableRules(request);
    
    let alertsTriggered = 0;
    let alertsSuppressed = 0;
    const triggeredAlerts: Alert[] = [];

    // Evaluate each rule
    for (const rule of rules) {
      try {
        // Check if rule should be evaluated
        if (!this.shouldEvaluateRule(rule, request.force)) {
          continue;
        }

        // Fetch context data for evaluation
        const contextData = await this.fetchContextData(rule, request.context);

        // Evaluate rule condition
        const conditionMet = this.evaluateCondition(rule, contextData);

        if (conditionMet) {
          // Check suppression
          if (this.isSupppressed(rule, contextData)) {
            alertsSuppressed++;
            logger.debug('Alert suppressed', { rule_id: rule.rule_id });
            continue;
          }

          // Trigger alert
          const alert = await this.triggerAlert(rule, contextData);
          triggeredAlerts.push(alert);
          alertsTriggered++;

          // Update rule trigger stats
          await this.updateRuleTriggerStats(rule.rule_id);
        }
      } catch (error) {
        logger.error('Error evaluating rule', { rule_id: rule.rule_id, error });
      }
    }

    // Process alert grouping
    if (triggeredAlerts.length > 0) {
      await this.processAlertGrouping(triggeredAlerts);
    }

    // Send notifications
    await this.sendNotifications(triggeredAlerts);

    const evaluationTime = Date.now() - startTime;

    logger.info('Rule evaluation complete', {
      rules_evaluated: rules.length,
      alerts_triggered: alertsTriggered,
      alerts_suppressed: alertsSuppressed,
      evaluation_time_ms: evaluationTime,
    });

    return {
      success: true,
      rules_evaluated: rules.length,
      alerts_triggered: alertsTriggered,
      alerts_suppressed: alertsSuppressed,
      triggered_alerts: triggeredAlerts,
      evaluation_time_ms: evaluationTime,
    };
  }

  /**
   * Fetch applicable rules for evaluation
   */
  private async fetchApplicableRules(request: EvaluateRulesRequest): Promise<AlertRule[]> {
    let query = supabase
      .from('alert_rules')
      .select('*')
      .eq('organization_id', request.organization_id)
      .eq('enabled', true);

    if (request.department_id) {
      query = query.or(`department_id.eq.${request.department_id},department_id.is.null`);
    }
    if (request.queue_name) {
      query = query.or(`queue_name.eq.${request.queue_name},queue_name.is.null`);
    }
    if (request.source) {
      query = query.eq('source', request.source);
    }

    query = query.limit(this.config.max_rules_per_evaluation);

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching rules', error);
      return [];
    }

    return (data || []) as AlertRule[];
  }

  /**
   * Check if rule should be evaluated (cooldown, schedule)
   */
  private shouldEvaluateRule(rule: AlertRule, force?: boolean): boolean {
    if (force) {
      return true;
    }

    // Check cooldown
    if (rule.last_triggered_at) {
      const cooldownMs = rule.cooldown_minutes * 60 * 1000;
      const timeSinceLast = Date.now() - new Date(rule.last_triggered_at).getTime();
      if (timeSinceLast < cooldownMs) {
        return false;
      }
    }

    // Check schedule
    if (rule.schedule) {
      if (!this.isWithinSchedule(rule.schedule)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current time is within alert schedule
   */
  private isWithinSchedule(schedule: AlertRule['schedule']): boolean {
    if (!schedule) return true;

    const now = new Date();
    
    // Check day of week
    if (schedule.days_of_week && schedule.days_of_week.length > 0) {
      if (!schedule.days_of_week.includes(now.getDay())) {
        return false;
      }
    }

    // Check time range
    if (schedule.start_time && schedule.end_time) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < schedule.start_time || currentTime > schedule.end_time) {
        return false;
      }
    }

    return true;
  }

  /**
   * Fetch context data for rule evaluation
   */
  private async fetchContextData(rule: AlertRule, providedContext?: Record<string, any>): Promise<Record<string, any>> {
    // Start with provided context
    const context = providedContext || {};

    // Fetch additional data based on rule source
    switch (rule.source) {
      case 'kpi':
        const kpiData = await this.fetchLatestKPIData(rule);
        Object.assign(context, kpiData);
        break;
      
      case 'backlog':
        const backlogData = await this.fetchLatestBacklogData(rule);
        Object.assign(context, backlogData);
        break;
      
      case 'attendance':
        const attendanceData = await this.fetchLatestAttendanceData(rule);
        Object.assign(context, attendanceData);
        break;
    }

    return context;
  }

  /**
   * Fetch latest KPI data
   */
  private async fetchLatestKPIData(rule: AlertRule): Promise<Record<string, any>> {
    const { data } = await supabase
      .from('live_kpi_snapshots')
      .select('*')
      .eq('organization_id', rule.organization_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return data || {};
  }

  /**
   * Fetch latest backlog data
   */
  private async fetchLatestBacklogData(rule: AlertRule): Promise<Record<string, any>> {
    let query = supabase
      .from('backlog_snapshots')
      .select('*')
      .eq('organization_id', rule.organization_id);

    if (rule.queue_name) {
      query = query.eq('queue_name', rule.queue_name);
    }

    const { data } = await query
      .order('snapshot_time', { ascending: false })
      .limit(1)
      .single();

    return data || {};
  }

  /**
   * Fetch latest attendance data
   */
  private async fetchLatestAttendanceData(rule: AlertRule): Promise<Record<string, any>> {
    let query = supabase
      .from('attendance_snapshots')
      .select('*')
      .eq('organization_id', rule.organization_id);

    if (rule.department_id) {
      query = query.eq('department_id', rule.department_id);
    }

    const { data } = await query
      .order('snapshot_time', { ascending: false })
      .limit(100);

    // Aggregate attendance data
    const snapshots = data || [];
    return {
      attendance_count: snapshots.length,
      present_count: snapshots.filter((s: any) => s.status === 'present').length,
      absent_count: snapshots.filter((s: any) => s.status === 'absent').length,
      late_count: snapshots.filter((s: any) => s.status === 'late').length,
    };
  }

  /**
   * Evaluate rule condition against context data
   */
  private evaluateCondition(rule: AlertRule, contextData: Record<string, any>): boolean {
    // Primary condition
    const primaryMet = this.evaluateSingleCondition(
      rule.condition.field,
      rule.condition.operator,
      contextData[rule.condition.field],
      rule.condition.threshold_value,
      rule.condition.threshold_value_secondary
    );

    if (!primaryMet) {
      return false;
    }

    // Additional conditions (AND logic)
    if (rule.additional_conditions) {
      for (const condition of rule.additional_conditions) {
        const met = this.evaluateSingleCondition(
          condition.field,
          condition.operator,
          contextData[condition.field],
          condition.value
        );
        if (!met) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(
    _field: string,
    operator: ComparisonOperator,
    currentValue: any,
    thresholdValue: any,
    thresholdSecondary?: any
  ): boolean {
    if (currentValue === undefined || currentValue === null) {
      return false;
    }

    switch (operator) {
      case 'gt':
        return currentValue > thresholdValue;
      case 'gte':
        return currentValue >= thresholdValue;
      case 'lt':
        return currentValue < thresholdValue;
      case 'lte':
        return currentValue <= thresholdValue;
      case 'eq':
        return currentValue === thresholdValue;
      case 'neq':
        return currentValue !== thresholdValue;
      case 'between':
        return currentValue >= thresholdValue && currentValue <= thresholdSecondary;
      case 'not_between':
        return currentValue < thresholdValue || currentValue > thresholdSecondary;
      default:
        return false;
    }
  }

  /**
   * Check if alert should be suppressed
   */
  private isSupppressed(rule: AlertRule, contextData: Record<string, any>): boolean {
    if (!rule.suppression?.enabled) {
      return false;
    }

    // Schedule-based suppression
    if (rule.suppression.schedule) {
      if (this.isWithinSchedule(rule.suppression.schedule)) {
        return true;
      }
    }

    // Condition-based suppression
    if (rule.suppression.suppress_if_condition) {
      const condition = rule.suppression.suppress_if_condition;
      const met = this.evaluateSingleCondition(
        condition.field,
        condition.operator,
        contextData[condition.field],
        condition.value
      );
      if (met) {
        return true;
      }
    }

    return false;
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, contextData: Record<string, any>): Promise<Alert> {
    const currentValue = contextData[rule.condition.field];
    const thresholdValue = rule.condition.threshold_value;
    
    // Calculate variance
    let variance: number | undefined;
    if (typeof currentValue === 'number' && typeof thresholdValue === 'number') {
      variance = Math.round(((currentValue - thresholdValue) / thresholdValue) * 100);
    }

    // Generate alert message
    const message = this.generateAlertMessage(rule, currentValue, thresholdValue);

    const alert: Alert = {
      alert_id: this.generateAlertId(),
      rule_id: rule.rule_id,
      rule_name: rule.rule_name,
      alert_type: rule.alert_type,
      severity: rule.severity,
      source: rule.source,
      organization_id: rule.organization_id,
      department_id: rule.department_id,
      site_id: rule.site_id,
      queue_name: rule.queue_name,
      message,
      current_value: currentValue,
      threshold_value: thresholdValue,
      variance,
      related_snapshot_id: contextData.snapshot_id || contextData.id,
      status: 'pending',
      triggered_at: new Date().toISOString(),
      notifications_sent: [],
      tags: rule.tags,
      custom_data: contextData,
    };

    // Store alert
    const { error } = await supabase
      .from('alerts')
      .insert(alert);

    if (error) {
      logger.error('Error storing alert', error);
    }

    logger.info('Alert triggered', {
      alert_id: alert.alert_id,
      rule_id: rule.rule_id,
      severity: alert.severity,
    });

    // Broadcast alert via WebSocket
    if (webSocketService.isInitialized()) {
      try {
        // Map status to websocket payload type (exclude 'expired' and 'suppressed')
        const wsStatus: 'pending' | 'active' | 'acknowledged' | 'resolved' = 
          alert.status === 'expired' || alert.status === 'suppressed' ? 'resolved' : alert.status;
        
        webSocketService.broadcastAlert({
          alert_id: alert.alert_id,
          rule_id: alert.rule_id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          source: alert.source,
          organization_id: alert.organization_id,
          department_id: alert.department_id,
          queue_name: alert.queue_name,
          message: alert.message,
          current_value: alert.current_value,
          threshold_value: alert.threshold_value,
          status: wsStatus,
          timestamp: alert.triggered_at,
        });
        logger.debug('Alert broadcasted via WebSocket', {
          alert_id: alert.alert_id,
          severity: alert.severity,
        });
      } catch (error) {
        logger.error('Failed to broadcast alert', error);
      }
    }

    return alert;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: any, thresholdValue: any): string {
    return `${rule.rule_name}: ${rule.condition.field} is ${currentValue} (threshold: ${thresholdValue})`;
  }

  /**
   * Update rule trigger statistics
   */
  private async updateRuleTriggerStats(ruleId: string): Promise<void> {
    // Fetch current trigger count
    const { data: rule } = await supabase
      .from('alert_rules')
      .select('trigger_count')
      .eq('rule_id', ruleId)
      .single();
    
    const newCount = (rule?.trigger_count || 0) + 1;
    
    await supabase
      .from('alert_rules')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: newCount,
      })
      .eq('rule_id', ruleId);
  }

  /**
   * Process alert grouping
   */
  private async processAlertGrouping(alerts: Alert[]): Promise<void> {
    const groupableAlerts = alerts.filter(() => {
      // Check if rule has grouping enabled
      // Would need to fetch rule again or pass it through
      return false; // Simplified for now
    });

    // Group alerts by criteria
    const groups = new Map<string, Alert[]>();
    
    for (const alert of groupableAlerts) {
      const groupKey = `${alert.organization_id}-${alert.alert_type}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(alert);
    }

    // Create alert groups
    for (const [_groupKey, groupAlerts] of groups) {
      if (groupAlerts.length >= 2) {
        await this.createAlertGroup(groupAlerts);
      }
    }
  }

  /**
   * Create an alert group
   */
  private async createAlertGroup(alerts: Alert[]): Promise<AlertGroup> {
    if (alerts.length === 0) {
      throw new Error('Cannot create alert group with no alerts');
    }
    
    const firstAlert = alerts[0]!;
    const lastAlert = alerts[alerts.length - 1]!;
    
    const group: AlertGroup = {
      group_id: this.generateGroupId(),
      organization_id: firstAlert.organization_id,
      department_id: firstAlert.department_id,
      queue_name: firstAlert.queue_name,
      alert_type: firstAlert.alert_type,
      alert_ids: alerts.map(a => a.alert_id),
      alert_count: alerts.length,
      highest_severity: this.getHighestSeverity(alerts),
      status: 'active',
      group_message: `${alerts.length} ${firstAlert.alert_type} alerts`,
      first_alert_at: firstAlert.triggered_at,
      last_alert_at: lastAlert.triggered_at,
      group_notification_sent: false,
    };

    await supabase
      .from('alert_groups')
      .insert(group);

    // Update alerts with group ID
    for (const alert of alerts) {
      await supabase
        .from('alerts')
        .update({
          group_id: group.group_id,
          is_grouped: true,
        })
        .eq('alert_id', alert.alert_id);
    }

    return group;
  }

  /**
   * Get highest severity from alerts
   */
  private getHighestSeverity(alerts: Alert[]): AlertSeverity {
    const severityOrder: AlertSeverity[] = ['critical', 'error', 'warning', 'info'];
    
    for (const severity of severityOrder) {
      if (alerts.some(a => a.severity === severity)) {
        return severity;
      }
    }
    
    return 'info';
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // Fetch rule to get notification settings
        const { data: rule } = await supabase
          .from('alert_rules')
          .select('*')
          .eq('rule_id', alert.rule_id)
          .single();

        if (!rule) continue;

        // Send to each channel
        for (const channel of rule.notification_channels) {
          for (const recipient of rule.notification_recipients) {
            await this.sendNotification(alert, rule, channel, recipient);
          }
        }

        // Update alert status
        await supabase
          .from('alerts')
          .update({
            status: 'active',
            notified_at: new Date().toISOString(),
          })
          .eq('alert_id', alert.alert_id);

      } catch (error) {
        logger.error('Error sending notifications', { alert_id: alert.alert_id, error });
      }
    }
  }

  /**
   * Send a single notification
   */
  private async sendNotification(
    alert: Alert,
    _rule: any,
    channel: NotificationChannel,
    recipient: string
  ): Promise<void> {
    // Simulate sending (would integrate with actual notification services)
    logger.info('Notification sent', {
      alert_id: alert.alert_id,
      channel,
      recipient,
      subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
    });

    // Note: Notification recording would be done in a separate notifications table
    // rather than using JSONB array operations
  }

  // ==============================================
  // ALERT MANAGEMENT
  // ==============================================

  /**
   * List alerts
   */
  async listAlerts(request: ListAlertsRequest): Promise<ListAlertsResponse> {
    let query = supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('organization_id', request.organization_id);

    if (request.department_id) {
      query = query.eq('department_id', request.department_id);
    }
    if (request.queue_name) {
      query = query.eq('queue_name', request.queue_name);
    }
    if (request.status) {
      query = query.in('status', request.status);
    }
    if (request.severity) {
      query = query.in('severity', request.severity);
    }
    if (request.source) {
      query = query.eq('source', request.source);
    }
    if (request.start_time) {
      query = query.gte('triggered_at', request.start_time);
    }
    if (request.end_time) {
      query = query.lte('triggered_at', request.end_time);
    }

    const page = request.page || 1;
    const pageSize = request.page_size || 50;
    const offset = (page - 1) * pageSize;

    const sortBy = request.sort_by || 'triggered_at';
    const sortOrder = request.sort_order || 'desc';

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list alerts: ${error.message}`);
    }

    const alerts = (data || []) as Alert[];

    // Calculate summary
    const summary = {
      active_count: alerts.filter(a => a.status === 'active').length,
      critical_count: alerts.filter(a => a.severity === 'critical').length,
      acknowledged_count: alerts.filter(a => a.status === 'acknowledged').length,
      unacknowledged_count: alerts.filter(a => a.status === 'active' && !a.acknowledged_at).length,
    };

    return {
      success: true,
      alerts,
      total_count: count || 0,
      page,
      page_size: pageSize,
      summary,
    };
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(request: AcknowledgeAlertRequest): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: request.acknowledged_by,
        resolution_notes: request.notes,
      })
      .eq('alert_id', request.alert_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }

    logger.info('Alert acknowledged', {
      alert_id: request.alert_id,
      acknowledged_by: request.acknowledged_by,
    });

    // Broadcast alert acknowledgment via WebSocket
    if (webSocketService.isInitialized()) {
      try {
        const alert = data as Alert;
        webSocketService.broadcastAlert({
          alert_id: alert.alert_id,
          rule_id: alert.rule_id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          source: alert.source,
          organization_id: alert.organization_id,
          department_id: alert.department_id,
          queue_name: alert.queue_name,
          message: alert.message,
          current_value: alert.current_value,
          threshold_value: alert.threshold_value,
          status: 'acknowledged',
          timestamp: alert.triggered_at,
        });
        logger.debug('Alert acknowledgment broadcasted via WebSocket', {
          alert_id: alert.alert_id,
        });
      } catch (error) {
        logger.error('Failed to broadcast alert acknowledgment', error);
      }
    }

    return data as Alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(request: ResolveAlertRequest): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: request.resolved_by,
        resolution_notes: request.resolution_notes,
      })
      .eq('alert_id', request.alert_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }

    logger.info('Alert resolved', {
      alert_id: request.alert_id,
      resolved_by: request.resolved_by,
    });

    // Broadcast alert resolution via WebSocket
    if (webSocketService.isInitialized()) {
      try {
        const alert = data as Alert;
        webSocketService.broadcastAlert({
          alert_id: alert.alert_id,
          rule_id: alert.rule_id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          source: alert.source,
          organization_id: alert.organization_id,
          department_id: alert.department_id,
          queue_name: alert.queue_name,
          message: alert.message,
          current_value: alert.current_value,
          threshold_value: alert.threshold_value,
          status: 'resolved',
          timestamp: alert.triggered_at,
        });
        logger.debug('Alert resolution broadcasted via WebSocket', {
          alert_id: alert.alert_id,
        });
      } catch (error) {
        logger.error('Failed to broadcast alert resolution', error);
      }
    }

    return data as Alert;
  }

  /**
   * Get alert analytics
   */
  async getAlertAnalytics(request: AlertAnalyticsRequest): Promise<AlertAnalyticsResponse> {
    // Fetch alerts in time range
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('organization_id', request.organization_id)
      .gte('triggered_at', request.start_time)
      .lte('triggered_at', request.end_time);

    const alertList = (alerts || []) as Alert[];

    // Calculate summary metrics
    const summary = {
      total_alerts: alertList.length,
      critical_alerts: alertList.filter(a => a.severity === 'critical').length,
      avg_time_to_acknowledge_minutes: this.calculateAvgTimeToAcknowledge(alertList),
      avg_time_to_resolve_minutes: this.calculateAvgTimeToResolve(alertList),
      top_alert_types: this.getTopAlertTypes(alertList),
      top_queues_by_alerts: this.getTopQueues(alertList),
    };

    // Generate time series
    const timeSeries = this.generateTimeSeries(alertList, request.start_time, request.end_time);

    // Calculate breakdowns
    const bySeverity = this.groupBySeverity(alertList);
    const bySource = this.groupBySource(alertList);
    const byStatus = this.groupByStatus(alertList);

    // Determine trend
    const { trend, trend_percentage } = this.calculateTrend(timeSeries);

    return {
      success: true,
      summary,
      time_series: timeSeries,
      by_severity: bySeverity,
      by_source: bySource,
      by_status: byStatus,
      trend,
      trend_percentage,
    };
  }

  // Helper methods for analytics
  private calculateAvgTimeToAcknowledge(alerts: Alert[]): number {
    const acknowledged = alerts.filter(a => a.acknowledged_at);
    if (acknowledged.length === 0) return 0;

    const totalMinutes = acknowledged.reduce((sum, alert) => {
      const triggered = new Date(alert.triggered_at).getTime();
      const acked = new Date(alert.acknowledged_at!).getTime();
      return sum + (acked - triggered) / 60000;
    }, 0);

    return Math.round(totalMinutes / acknowledged.length);
  }

  private calculateAvgTimeToResolve(alerts: Alert[]): number {
    const resolved = alerts.filter(a => a.resolved_at);
    if (resolved.length === 0) return 0;

    const totalMinutes = resolved.reduce((sum, alert) => {
      const triggered = new Date(alert.triggered_at).getTime();
      const resolved = new Date(alert.resolved_at!).getTime();
      return sum + (resolved - triggered) / 60000;
    }, 0);

    return Math.round(totalMinutes / resolved.length);
  }

  private getTopAlertTypes(alerts: Alert[]): Array<{ type: string; count: number }> {
    const counts = new Map<string, number>();
    alerts.forEach(a => {
      counts.set(a.alert_type, (counts.get(a.alert_type) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopQueues(alerts: Alert[]): Array<{ queue: string; count: number }> {
    const counts = new Map<string, number>();
    alerts.forEach(a => {
      if (a.queue_name) {
        counts.set(a.queue_name, (counts.get(a.queue_name) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([queue, count]) => ({ queue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateTimeSeries(_alerts: Alert[], _startTime: string, _endTime: string): any[] {
    // Simplified - would generate hourly buckets
    return [];
  }

  private groupBySeverity(alerts: Alert[]): Record<AlertSeverity, number> {
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      error: alerts.filter(a => a.severity === 'error').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };
  }

  private groupBySource(alerts: Alert[]): Record<AlertSource, number> {
    return {
      kpi: alerts.filter(a => a.source === 'kpi').length,
      backlog: alerts.filter(a => a.source === 'backlog').length,
      attendance: alerts.filter(a => a.source === 'attendance').length,
      schedule: alerts.filter(a => a.source === 'schedule').length,
      system: alerts.filter(a => a.source === 'system').length,
    };
  }

  private groupByStatus(alerts: Alert[]): Record<AlertStatus, number> {
    return {
      pending: alerts.filter(a => a.status === 'pending').length,
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      expired: alerts.filter(a => a.status === 'expired').length,
      suppressed: alerts.filter(a => a.status === 'suppressed').length,
    };
  }

  private calculateTrend(_timeSeries: any[]): { trend: 'increasing' | 'stable' | 'decreasing'; trend_percentage: number } {
    // Simplified
    return { trend: 'stable', trend_percentage: 0 };
  }

  // ID generators
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const alertRulesEngineService = new AlertRulesEngineService();
