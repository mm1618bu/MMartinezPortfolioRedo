/**
 * UPT (Unpaid Time) Tracking Service
 * Automated attendance exception detection and UPT balance management
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  UPTException,
  UPTBalance,
  UPTPolicyConfig,
  UPTExceptionType,
  UPTSeverity,
  UPTBalanceStatus,
  DetectExceptionsRequest,
  DetectExceptionsResponse,
  DetectedExceptionDetail,
  RecordExceptionRequest,
  RecordExceptionResponse,
  ExcuseExceptionRequest,
  ExcuseExceptionResponse,
  GetUPTBalanceRequest,
  GetUPTBalanceResponse,
  ListExceptionsRequest,
  ListExceptionsResponse,
  UPTAnalyticsRequest,
  UPTAnalyticsResponse,
  UPTSummary,
  UPTEmployeeStats,
  UPTDepartmentStats,
  UPTExceptionTypeStats,
  UPTSeverityStats,
  EmployeesAtRiskRequest,
  EmployeesAtRiskResponse,
  EmployeeAtRisk,
  AdjustUPTBalanceRequest,
  AdjustUPTBalanceResponse,
  CreateUPTPolicyRequest,
  UpdateUPTPolicyRequest,
  UPTPolicyResponse,
} from '../types/uptTracking';
import type { AttendanceSnapshot } from '../types/attendanceSnapshot';

export class UPTTrackingService {
  /**
   * Detect attendance exceptions from attendance data
   */
  async detectExceptions(request: DetectExceptionsRequest): Promise<DetectExceptionsResponse> {
    try {
      const {
        organization_id,
        department_id,
        employee_ids,
        start_date,
        end_date,
        exception_types,
        auto_deduct_upt = true,
        send_notifications = true,
      } = request;

      logger.info('Detecting UPT exceptions', { organization_id, start_date, end_date });

      // Get UPT policy
      const policy = await this.getActivePolicy(organization_id, department_id);
      if (!policy) {
        return {
          success: false,
          exceptions_detected: 0,
          exceptions_created: 0,
          exceptions_skipped: 0,
          upt_hours_deducted: 0,
          employees_affected: 0,
          details: [],
          error: 'No active UPT policy found',
        };
      }

      // Get attendance snapshots for the period
      let query = supabase
        .from('attendance_snapshots')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('snapshot_time', start_date)
        .lte('snapshot_time', end_date);

      if (department_id) {
        query = query.eq('department_id', department_id);
      }

      if (employee_ids && employee_ids.length > 0) {
        query = query.in('employee_id', employee_ids);
      }

      const { data: snapshots, error: snapshotsError } = await query;

      if (snapshotsError) {
        throw new Error(`Failed to fetch attendance snapshots: ${snapshotsError.message}`);
      }

      // Analyze each snapshot for exceptions
      const detectedExceptions: DetectedExceptionDetail[] = [];
      const createdExceptions: UPTException[] = [];
      let exceptionsSkipped = 0;
      let totalUPTDeducted = 0;
      const employeesAffected = new Set<string>();

      for (const snapshot of snapshots || []) {
        const exceptions = this.analyzeSnapshot(snapshot, policy);

        for (const exception of exceptions) {
          // Filter by exception type if specified
          if (exception_types && !exception_types.includes(exception.exception_type)) {
            continue;
          }

          // Check if exception already exists
          const existingException = await this.getExistingException(
            organization_id,
            exception.employee_id,
            exception.exception_date,
            exception.exception_type
          );

          if (existingException) {
            exceptionsSkipped++;
            continue;
          }

          // Record the exception
          if (auto_deduct_upt) {
            const recordResult = await this.recordException({
              organization_id,
              employee_id: exception.employee_id,
              exception_type: exception.exception_type,
              exception_date: exception.exception_date,
              occurrence_time: exception.occurrence_time,
              minutes_missed: exception.minutes_missed,
              shift_id: snapshot.shift_id,
              scheduled_start: snapshot.scheduled_start_time,
              scheduled_end: snapshot.scheduled_end_time,
              actual_clock_in: snapshot.actual_clock_in,
              actual_clock_out: snapshot.actual_clock_out,
              detected_by: 'system',
              auto_deduct_upt: true,
              send_notifications,
            });

            if (recordResult.success && recordResult.exception) {
              createdExceptions.push(recordResult.exception);
              totalUPTDeducted += recordResult.exception.upt_hours_deducted;
              employeesAffected.add(exception.employee_id);

              detectedExceptions.push({
                employee_id: exception.employee_id,
                employee_name: snapshot.employee_name,
                exception_type: exception.exception_type,
                exception_date: exception.exception_date,
                minutes_missed: exception.minutes_missed,
                upt_hours_deducted: recordResult.exception.upt_hours_deducted,
                new_balance_hours: recordResult.upt_balance.current_balance_hours,
                balance_status: recordResult.upt_balance.balance_status,
                created: true,
              });
            }
          } else {
            // Just detect, don't record
            detectedExceptions.push({
              employee_id: exception.employee_id,
              employee_name: snapshot.employee_name,
              exception_type: exception.exception_type,
              exception_date: exception.exception_date,
              minutes_missed: exception.minutes_missed,
              upt_hours_deducted: this.calculateUPTDeduction(exception.minutes_missed, exception.exception_type, policy),
              new_balance_hours: 0, // Unknown without recording
              balance_status: 'healthy', // Unknown
              created: false,
            });
          }
        }
      }

      return {
        success: true,
        exceptions_detected: detectedExceptions.length,
        exceptions_created: createdExceptions.length,
        exceptions_skipped: exceptionsSkipped,
        upt_hours_deducted: totalUPTDeducted,
        employees_affected: employeesAffected.size,
        details: detectedExceptions,
      };
    } catch (error: any) {
      logger.error('Error detecting UPT exceptions:', error);
      return {
        success: false,
        exceptions_detected: 0,
        exceptions_created: 0,
        exceptions_skipped: 0,
        upt_hours_deducted: 0,
        employees_affected: 0,
        details: [],
        error: error.message,
      };
    }
  }

  /**
   * Record a UPT exception manually
   */
  async recordException(request: RecordExceptionRequest): Promise<RecordExceptionResponse> {
    try {
      const {
        organization_id,
        employee_id,
        exception_type,
        exception_date,
        occurrence_time,
        minutes_missed,
        shift_id,
        scheduled_start,
        scheduled_end,
        actual_clock_in,
        actual_clock_out,
        notes,
        detected_by = 'manual',
        auto_deduct_upt = true,
        send_notifications = true,
      } = request;

      // Get policy and calculate deduction
      const policy = await this.getActivePolicy(organization_id);
      if (!policy) {
        throw new Error('No active UPT policy found');
      }

      const uptHoursDeducted = this.calculateUPTDeduction(minutes_missed, exception_type, policy);
      const severity = this.determineSeverity(minutes_missed, exception_type);

      // Get employee info
      const { data: employee } = await supabase
        .from('employees')
        .select('name, department_id')
        .eq('id', employee_id)
        .single();

      // Create exception record
      const exceptionData = {
        organization_id,
        employee_id,
        employee_name: employee?.name || 'Unknown',
        department_id: employee?.department_id,
        exception_type,
        exception_date,
        occurrence_time,
        severity,
        minutes_missed,
        upt_hours_deducted: uptHoursDeducted,
        shift_id,
        scheduled_start,
        scheduled_end,
        actual_clock_in,
        actual_clock_out,
        is_excused: false,
        employee_notified: false,
        manager_notified: false,
        notes,
        detected_by,
      };

      const { data: exception, error: exceptionError } = await supabase
        .from('upt_exceptions')
        .insert(exceptionData)
        .select()
        .single();

      if (exceptionError) {
        throw new Error(`Failed to record exception: ${exceptionError.message}`);
      }

      // Deduct UPT if requested
      let uptBalance: UPTBalance | null = null;
      if (auto_deduct_upt && uptHoursDeducted > 0) {
        const deductResult = await this.deductUPT(employee_id, uptHoursDeducted, exception.exception_id);
        if (deductResult.success) {
          uptBalance = deductResult.balance;
        }
      }

      // Get current balance if not deducted
      if (!uptBalance) {
        const balanceResult = await this.getUPTBalance({ organization_id, employee_id });
        if (balanceResult.success) {
          uptBalance = balanceResult.balance;
        }
      }

      // Send notifications
      if (send_notifications) {
        await this.sendExceptionNotifications(exception, uptBalance, policy);
      }

      return {
        success: true,
        exception,
        upt_balance: uptBalance!,
        message: `Exception recorded. ${uptHoursDeducted} hours deducted from UPT balance.`,
      };
    } catch (error: any) {
      logger.error('Error recording UPT exception:', error);
      return {
        success: false,
        exception: {} as UPTException,
        upt_balance: {} as UPTBalance,
        error: error.message,
      };
    }
  }

  /**
   * Excuse a UPT exception (refund UPT hours)
   */
  async excuseException(request: ExcuseExceptionRequest): Promise<ExcuseExceptionResponse> {
    try {
      const {
        organization_id,
        exception_id,
        excuse_reason,
        excuse_documentation,
        approved_by,
        refund_upt = true,
        notes,
      } = request;

      // Get exception
      const { data: exception, error: exceptionError } = await supabase
        .from('upt_exceptions')
        .select('*')
        .eq('exception_id', exception_id)
        .eq('organization_id', organization_id)
        .single();

      if (exceptionError || !exception) {
        throw new Error('Exception not found');
      }

      if (exception.is_excused) {
        throw new Error('Exception is already excused');
      }

      // Update exception
      const now = new Date().toISOString();
      const { data: updatedException, error: updateError } = await supabase
        .from('upt_exceptions')
        .update({
          is_excused: true,
          excuse_reason,
          excuse_documentation,
          approved_by,
          approved_at: now,
          notes: notes || exception.notes,
          updated_at: now,
        })
        .eq('exception_id', exception_id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update exception: ${updateError.message}`);
      }

      // Refund UPT hours
      let uptBalance: UPTBalance | null = null;
      let uptRefundedHours = 0;
      if (refund_upt && exception.upt_hours_deducted > 0) {
        const refundResult = await this.refundUPT(
          exception.employee_id,
          exception.upt_hours_deducted,
          exception_id,
          excuse_reason
        );
        if (refundResult.success) {
          uptBalance = refundResult.balance;
          uptRefundedHours = exception.upt_hours_deducted;
        }
      }

      return {
        success: true,
        exception: updatedException,
        upt_balance: uptBalance || undefined,
        upt_refunded_hours: uptRefundedHours,
        message: `Exception excused. ${uptRefundedHours} hours refunded.`,
      };
    } catch (error: any) {
      logger.error('Error excusing UPT exception:', error);
      return {
        success: false,
        exception: {} as UPTException,
        error: error.message,
      };
    }
  }

  /**
   * Get UPT balance for an employee
   */
  async getUPTBalance(request: GetUPTBalanceRequest): Promise<GetUPTBalanceResponse> {
    try {
      const { organization_id, employee_id } = request;

      // Get balance
      const { data: balance, error: balanceError } = await supabase
        .from('upt_balances')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('employee_id', employee_id)
        .single();

      if (balanceError) {
        // Create initial balance if doesn't exist
        if (balanceError.code === 'PGRST116') {
          const createdBalance = await this.createInitialBalance(organization_id, employee_id);
          if (!createdBalance) {
            throw new Error('Failed to create initial UPT balance');
          }
          
          return {
            success: true,
            balance: createdBalance,
            recent_exceptions: [],
          };
        }
        throw new Error(`Failed to fetch UPT balance: ${balanceError.message}`);
      }

      // Get recent exceptions
      const { data: recentExceptions } = await supabase
        .from('upt_exceptions')
        .select('*')
        .eq('employee_id', employee_id)
        .order('exception_date', { ascending: false })
        .limit(10);

      return {
        success: true,
        balance,
        recent_exceptions: recentExceptions || [],
      };
    } catch (error: any) {
      logger.error('Error getting UPT balance:', error);
      return {
        success: false,
        balance: {} as UPTBalance,
        recent_exceptions: [],
        error: error.message,
      };
    }
  }

  /**
   * List UPT exceptions with filters
   */
  async listExceptions(request: ListExceptionsRequest): Promise<ListExceptionsResponse> {
    try {
      const {
        organization_id,
        employee_id,
        department_id,
        exception_types,
        severity,
        is_excused,
        start_date,
        end_date,
        balance_status,
        limit = 100,
        offset = 0,
        sort_by = 'date',
        sort_order = 'desc',
      } = request;

      let query = supabase
        .from('upt_exceptions')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization_id);

      if (employee_id) query = query.eq('employee_id', employee_id);
      if (department_id) query = query.eq('department_id', department_id);
      if (exception_types) query = query.in('exception_type', exception_types);
      if (severity) query = query.eq('severity', severity);
      if (is_excused !== undefined) query = query.eq('is_excused', is_excused);
      if (start_date) query = query.gte('exception_date', start_date);
      if (end_date) query = query.lte('exception_date', end_date);

      // Sort
      const sortColumn = sort_by === 'date' ? 'exception_date' :
                        sort_by === 'severity' ? 'severity' :
                        sort_by === 'hours_deducted' ? 'upt_hours_deducted' :
                        'employee_name';
      query = query.order(sortColumn, { ascending: sort_order === 'asc' });

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data: exceptions, error: exceptionsError, count } = await query;

      if (exceptionsError) {
        throw new Error(`Failed to list exceptions: ${exceptionsError.message}`);
      }

      // Filter by balance status if requested
      let filteredExceptions = exceptions || [];
      if (balance_status) {
        const employeeIds = [...new Set(filteredExceptions.map(e => e.employee_id))];
        const { data: balances } = await supabase
          .from('upt_balances')
          .select('employee_id, balance_status')
          .in('employee_id', employeeIds)
          .eq('balance_status', balance_status);

        const balanceEmployeeIds = new Set(balances?.map(b => b.employee_id) || []);
        filteredExceptions = filteredExceptions.filter(e => balanceEmployeeIds.has(e.employee_id));
      }

      return {
        success: true,
        exceptions: filteredExceptions,
        total_count: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
      };
    } catch (error: any) {
      logger.error('Error listing UPT exceptions:', error);
      return {
        success: false,
        exceptions: [],
        total_count: 0,
        page: 1,
        limit: request.limit || 100,
        error: error.message,
      };
    }
  }

  /**
   * Get UPT analytics
   */
  async getAnalytics(request: UPTAnalyticsRequest): Promise<UPTAnalyticsResponse> {
    try {
      const { organization_id, department_id, start_date, end_date, group_by } = request;

      // Base query
      let query = supabase
        .from('upt_exceptions')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('exception_date', start_date)
        .lte('exception_date', end_date);

      if (department_id) {
        query = query.eq('department_id', department_id);
      }

      const { data: exceptions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch analytics data: ${error.message}`);
      }

      // Calculate summary
      const summary = this.calculateSummary(exceptions || [], start_date, end_date);

      // Group by requested dimension
      const response: UPTAnalyticsResponse = {
        success: true,
        summary,
      };

      if (group_by === 'employee') {
        response.by_employee = await this.groupByEmployee(exceptions || []);
      } else if (group_by === 'department') {
        response.by_department = await this.groupByDepartment(exceptions || []);
      } else if (group_by === 'exception_type') {
        response.by_exception_type = this.groupByExceptionType(exceptions || []);
      } else if (group_by === 'severity') {
        response.by_severity = this.groupBySeverity(exceptions || []);
      }

      return response;
    } catch (error: any) {
      logger.error('Error getting UPT analytics:', error);
      return {
        success: false,
        summary: {} as UPTSummary,
        error: error.message,
      };
    }
  }

  /**
   * Get employees at risk (low UPT balance)
   */
  async getEmployeesAtRisk(request: EmployeesAtRiskRequest): Promise<EmployeesAtRiskResponse> {
    try {
      const {
        organization_id,
        department_id,
        status_filter = ['warning', 'critical'],
        min_exceptions,
        sort_by = 'balance',
        limit = 50,
      } = request;

      let query = supabase
        .from('upt_balances')
        .select('*')
        .eq('organization_id', organization_id)
        .in('balance_status', status_filter);

      if (department_id) {
        query = query.eq('department_id', department_id);
      }

      if (min_exceptions) {
        query = query.gte('exceptions_this_month', min_exceptions);
      }

      // Sort
      const sortColumn = sort_by === 'balance' ? 'current_balance_hours' :
                        sort_by === 'exceptions' ? 'exceptions_this_month' :
                        'last_exception_date';
      query = query.order(sortColumn, { ascending: sort_by === 'balance' });

      query = query.limit(limit);

      const { data: balances, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch at-risk employees: ${error.message}`);
      }

      // Get recent exceptions for each employee
      const employees: EmployeeAtRisk[] = [];
      for (const balance of balances || []) {
        const { data: recentExceptions } = await supabase
          .from('upt_exceptions')
          .select('exception_date')
          .eq('employee_id', balance.employee_id)
          .gte('exception_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('exception_date', { ascending: false });

        // Get department name
        let departmentName = 'Unknown';
        if (balance.department_id) {
          const { data: dept } = await supabase
            .from('departments')
            .select('name')
            .eq('id', balance.department_id)
            .single();
          departmentName = dept?.name || 'Unknown';
        }

        employees.push({
          employee_id: balance.employee_id,
          employee_name: balance.employee_name,
          department_id: balance.department_id,
          department_name: departmentName,
          current_balance_hours: balance.current_balance_hours,
          balance_status: balance.balance_status,
          is_negative: balance.is_negative,
          total_exceptions: balance.exceptions_this_year,
          exceptions_last_30_days: recentExceptions?.length || 0,
          last_exception_date: balance.last_exception_date,
          days_until_termination: balance.days_until_termination,
          recommended_action: this.getRecommendedAction(balance.balance_status, balance.current_balance_hours, balance.exceptions_this_month),
        });
      }

      return {
        success: true,
        employees,
        total_count: employees.length,
      };
    } catch (error: any) {
      logger.error('Error getting at-risk employees:', error);
      return {
        success: false,
        employees: [],
        total_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Adjust UPT balance manually (admin override)
   */
  async adjustBalance(request: AdjustUPTBalanceRequest): Promise<AdjustUPTBalanceResponse> {
    try {
      const { organization_id, employee_id, adjustment_hours, reason, adjusted_by, notes } = request;

      // Get current balance
      const balanceResult = await this.getUPTBalance({ organization_id, employee_id });
      if (!balanceResult.success) {
        throw new Error('Failed to get current UPT balance');
      }

      const currentBalance = balanceResult.balance;
      const previousBalanceHours = currentBalance.current_balance_hours;
      const newBalanceHours = previousBalanceHours + adjustment_hours;

      // Update balance
      const now = new Date().toISOString();
      const { data: updatedBalance, error: updateError } = await supabase
        .from('upt_balances')
        .update({
          current_balance_hours: newBalanceHours,
          is_negative: newBalanceHours < 0,
          balance_status: this.calculateBalanceStatus(newBalanceHours, currentBalance),
          last_balance_update: now,
          updated_at: now,
        })
        .eq('employee_id', employee_id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }

      // Log adjustment
      await supabase.from('upt_balance_adjustments').insert({
        organization_id,
        employee_id,
        adjustment_hours,
        previous_balance_hours: previousBalanceHours,
        new_balance_hours: newBalanceHours,
        reason,
        adjusted_by,
        notes,
        adjustment_date: now,
      });

      return {
        success: true,
        previous_balance_hours: previousBalanceHours,
        new_balance_hours: newBalanceHours,
        adjustment_hours,
        upt_balance: updatedBalance,
        message: `Balance adjusted by ${adjustment_hours} hours. New balance: ${newBalanceHours} hours.`,
      };
    } catch (error: any) {
      logger.error('Error adjusting UPT balance:', error);
      return {
        success: false,
        previous_balance_hours: 0,
        new_balance_hours: 0,
        adjustment_hours: 0,
        upt_balance: {} as UPTBalance,
        error: error.message,
      };
    }
  }

  /**
   * Create UPT policy
   */
  async createPolicy(request: CreateUPTPolicyRequest): Promise<UPTPolicyResponse> {
    try {
      const now = new Date().toISOString();
      const policyData = {
        ...request,
        reset_frequency: request.reset_frequency || 'never',
        tardiness_grace_period_minutes: request.tardiness_grace_period_minutes || 5,
        early_departure_grace_period_minutes: request.early_departure_grace_period_minutes || 5,
        break_grace_period_minutes: request.break_grace_period_minutes || 5,
        deduction_rate_tardiness: request.deduction_rate_tardiness || 0.017, // 1 hour per 60 min
        deduction_rate_early_departure: request.deduction_rate_early_departure || 0.017,
        deduction_rate_absence: request.deduction_rate_absence || 8, // 8 hours for full day
        deduction_rate_no_call_no_show: request.deduction_rate_no_call_no_show || 16, // 2x penalty
        round_to_nearest_minutes: request.round_to_nearest_minutes || 15,
        always_round_up: request.always_round_up ?? true,
        allow_excused_absences: request.allow_excused_absences ?? true,
        require_documentation: request.require_documentation ?? false,
        documentation_types: request.documentation_types || ['doctor_note', 'court_summons'],
        excuse_approval_required: request.excuse_approval_required ?? true,
        notify_employee_on_exception: request.notify_employee_on_exception ?? true,
        notify_manager_on_exception: request.notify_manager_on_exception ?? true,
        notify_hr_on_critical: request.notify_hr_on_critical ?? true,
        notify_on_warning_threshold: request.notify_on_warning_threshold ?? true,
        notify_on_critical_threshold: request.notify_on_critical_threshold ?? true,
        auto_detect_exceptions: request.auto_detect_exceptions ?? true,
        detection_schedule_minutes: request.detection_schedule_minutes || 30,
        is_active: request.is_active ?? true,
        created_at: now,
        updated_at: now,
      };

      const { data: policy, error } = await supabase
        .from('upt_policies')
        .insert(policyData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create policy: ${error.message}`);
      }

      return {
        success: true,
        policy,
        message: 'UPT policy created successfully',
      };
    } catch (error: any) {
      logger.error('Error creating UPT policy:', error);
      return {
        success: false,
        policy: {} as UPTPolicyConfig,
        error: error.message,
      };
    }
  }

  /**
   * Update UPT policy
   */
  async updatePolicy(request: UpdateUPTPolicyRequest): Promise<UPTPolicyResponse> {
    try {
      const { policy_id, ...updates } = request;
      const now = new Date().toISOString();

      const { data: policy, error } = await supabase
        .from('upt_policies')
        .update({ ...updates, updated_at: now })
        .eq('policy_id', policy_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update policy: ${error.message}`);
      }

      return {
        success: true,
        policy,
        message: 'UPT policy updated successfully',
      };
    } catch (error: any) {
      logger.error('Error updating UPT policy:', error);
      return {
        success: false,
        policy: {} as UPTPolicyConfig,
        error: error.message,
      };
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Analyze attendance snapshot for exceptions
   */
  private analyzeSnapshot(snapshot: AttendanceSnapshot, policy: UPTPolicyConfig): Array<{
    employee_id: string;
    exception_type: UPTExceptionType;
    exception_date: string;
    occurrence_time: string;
    minutes_missed: number;
  }> {
    const exceptions: Array<{
      employee_id: string;
      exception_type: UPTExceptionType;
      exception_date: string;
      occurrence_time: string;
      minutes_missed: number;
    }> = [];

    const exceptionDate = snapshot.snapshot_time.split('T')[0] || snapshot.snapshot_time;

    // Check for absence
    if (snapshot.is_absent && !snapshot.actual_clock_in) {
      exceptions.push({
        employee_id: snapshot.employee_id,
        exception_type: snapshot.attendance_status === 'no_show' ? 'no_call_no_show' : 'absence',
        exception_date: exceptionDate,
        occurrence_time: snapshot.scheduled_start_time || snapshot.snapshot_time,
        minutes_missed: snapshot.scheduled_duration_minutes || 480, // Default 8 hours
      });
    }

    // Check for tardiness
    if (snapshot.is_late && snapshot.late_by_minutes && snapshot.late_by_minutes > policy.tardiness_grace_period_minutes) {
      exceptions.push({
        employee_id: snapshot.employee_id,
        exception_type: 'tardiness',
        exception_date: exceptionDate,
        occurrence_time: snapshot.actual_clock_in || snapshot.snapshot_time,
        minutes_missed: snapshot.late_by_minutes,
      });
    }

    // Check for early departure
    if (snapshot.is_early_departure && snapshot.early_departure_minutes && snapshot.early_departure_minutes > policy.early_departure_grace_period_minutes) {
      exceptions.push({
        employee_id: snapshot.employee_id,
        exception_type: 'early_departure',
        exception_date: exceptionDate,
        occurrence_time: snapshot.actual_clock_out || snapshot.snapshot_time,
        minutes_missed: snapshot.early_departure_minutes,
      });
    }

    // Check for extended break
    if (snapshot.break_duration_minutes && snapshot.break_expected_duration_minutes) {
      const breakOverage = snapshot.break_duration_minutes - snapshot.break_expected_duration_minutes;
      if (breakOverage > policy.break_grace_period_minutes) {
        exceptions.push({
          employee_id: snapshot.employee_id,
          exception_type: 'extended_break',
          exception_date: exceptionDate,
          occurrence_time: snapshot.break_start_time || snapshot.snapshot_time,
          minutes_missed: breakOverage,
        });
      }
    }

    // Check for missed punch
    if (snapshot.scheduled_start_time && !snapshot.actual_clock_in && !snapshot.is_absent) {
      exceptions.push({
        employee_id: snapshot.employee_id,
        exception_type: 'missed_punch',
        exception_date: exceptionDate,
        occurrence_time: snapshot.scheduled_start_time,
        minutes_missed: 0, // No time missed, but still an exception
      });
    }

    return exceptions;
  }

  /**
   * Calculate UPT hours to deduct based on minutes missed
   */
  private calculateUPTDeduction(minutesMissed: number, exceptionType: UPTExceptionType, policy: UPTPolicyConfig): number {
    let hours = 0;

    switch (exceptionType) {
      case 'absence':
      case 'partial_absence':
        hours = policy.deduction_rate_absence || 8;
        break;
      case 'no_call_no_show':
        hours = policy.deduction_rate_no_call_no_show || 16;
        break;
      case 'tardiness':
        hours = (minutesMissed / 60) * (policy.deduction_rate_tardiness || 1);
        break;
      case 'early_departure':
        hours = (minutesMissed / 60) * (policy.deduction_rate_early_departure || 1);
        break;
      case 'extended_break':
        hours = minutesMissed / 60;
        break;
      case 'missed_punch':
        hours = 0; // Warning only, no deduction
        break;
    }

    // Round if configured
    if (policy.round_to_nearest_minutes > 0) {
      const roundTo = policy.round_to_nearest_minutes / 60; // Convert to hours
      if (policy.always_round_up) {
        hours = Math.ceil(hours / roundTo) * roundTo;
      } else {
        hours = Math.round(hours / roundTo) * roundTo;
      }
    }

    return Math.max(0, hours);
  }

  /**
   * Determine exception severity
   */
  private determineSeverity(minutesMissed: number, exceptionType: UPTExceptionType): UPTSeverity {
    if (exceptionType === 'no_call_no_show' || exceptionType === 'absence') {
      return 'critical';
    }
    if (minutesMissed >= 120) return 'major';
    if (minutesMissed >= 60) return 'moderate';
    return 'minor';
  }

  /**
   * Deduct UPT hours from balance
   */
  private async deductUPT(employeeId: string, hours: number, _exceptionId: string): Promise<{ success: boolean; balance: UPTBalance }> {
    try {
      // Get current balance
      const { data: balance, error: balanceError } = await supabase
        .from('upt_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (balanceError) {
        throw new Error('Failed to fetch UPT balance');
      }

      const newBalanceHours = balance.current_balance_hours - hours;
      const newStatus = this.calculateBalanceStatus(newBalanceHours, balance);

      // Update balance
      const now = new Date().toISOString();
      const { data: updatedBalance, error: updateError } = await supabase
        .from('upt_balances')
        .update({
          current_balance_hours: newBalanceHours,
          total_used_hours: balance.total_used_hours + hours,
          is_negative: newBalanceHours < 0,
          balance_status: newStatus,
          last_exception_date: new Date().toISOString().split('T')[0],
          last_balance_update: now,
          exceptions_this_month: balance.exceptions_this_month + 1,
          exceptions_this_quarter: balance.exceptions_this_quarter + 1,
          exceptions_this_year: balance.exceptions_this_year + 1,
          updated_at: now,
        })
        .eq('employee_id', employeeId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }

      return { success: true, balance: updatedBalance };
    } catch (error: any) {
      logger.error('Error deducting UPT:', error);
      return { success: false, balance: {} as UPTBalance };
    }
  }

  /**
   * Refund UPT hours (when exception is excused)
   */
  private async refundUPT(employeeId: string, hours: number, _exceptionId: string, _reason: string): Promise<{ success: boolean; balance: UPTBalance }> {
    try {
      const { data: balance, error: balanceError } = await supabase
        .from('upt_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (balanceError) {
        throw new Error('Failed to fetch UPT balance');
      }

      const newBalanceHours = balance.current_balance_hours + hours;
      const newStatus = this.calculateBalanceStatus(newBalanceHours, balance);

      const now = new Date().toISOString();
      const { data: updatedBalance, error: updateError } = await supabase
        .from('upt_balances')
        .update({
          current_balance_hours: newBalanceHours,
          total_used_hours: Math.max(0, balance.total_used_hours - hours),
          total_excused_hours: balance.total_excused_hours + hours,
          is_negative: newBalanceHours < 0,
          balance_status: newStatus,
          last_balance_update: now,
          updated_at: now,
        })
        .eq('employee_id', employeeId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to refund UPT: ${updateError.message}`);
      }

      return { success: true, balance: updatedBalance };
    } catch (error: any) {
      logger.error('Error refunding UPT:', error);
      return { success: false, balance: {} as UPTBalance };
    }
  }

  /**
   * Calculate balance status based on thresholds
   */
  private calculateBalanceStatus(balanceHours: number, balance: Partial<UPTBalance>): UPTBalanceStatus {
    if (balanceHours <= (balance.termination_threshold_hours || 0)) return 'terminated';
    if (balanceHours <= (balance.critical_threshold_hours || 5)) return 'critical';
    if (balanceHours <= (balance.warning_threshold_hours || 10)) return 'warning';
    return 'healthy';
  }

  /**
   * Get active UPT policy
   */
  private async getActivePolicy(organizationId: string, departmentId?: string): Promise<UPTPolicyConfig | null> {
    try {
      let query = supabase
        .from('upt_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Try department-specific policy first
      if (departmentId) {
        const { data: deptPolicy } = await query.eq('department_id', departmentId).single();
        if (deptPolicy) return deptPolicy;
      }

      // Fall back to org-level policy
      const { data: orgPolicy } = await query.is('department_id', null).single();
      return orgPolicy;
    } catch (error) {
      logger.error('Error fetching UPT policy:', error);
      return null;
    }
  }

  /**
   * Check if exception already exists
   */
  private async getExistingException(
    organizationId: string,
    employeeId: string,
    exceptionDate: string,
    exceptionType: UPTExceptionType
  ): Promise<UPTException | null> {
    const { data } = await supabase
      .from('upt_exceptions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('employee_id', employeeId)
      .eq('exception_date', exceptionDate)
      .eq('exception_type', exceptionType)
      .single();

    return data;
  }

  /**
   * Create initial UPT balance for employee
   */
  private async createInitialBalance(organizationId: string, employeeId: string): Promise<UPTBalance | null> {
    try {
      const policy = await this.getActivePolicy(organizationId);
      if (!policy) return null;

      const { data: employee } = await supabase
        .from('employees')
        .select('name, department_id')
        .eq('id', employeeId)
        .single();

      const now = new Date().toISOString();
      const balanceData = {
        organization_id: organizationId,
        employee_id: employeeId,
        employee_name: employee?.name || 'Unknown',
        department_id: employee?.department_id,
        current_balance_hours: policy.initial_upt_hours,
        initial_balance_hours: policy.initial_upt_hours,
        total_used_hours: 0,
        total_excused_hours: 0,
        warning_threshold_hours: policy.warning_threshold_hours,
        critical_threshold_hours: policy.critical_threshold_hours,
        termination_threshold_hours: policy.termination_threshold_hours,
        balance_status: 'healthy' as UPTBalanceStatus,
        is_negative: false,
        period_start_date: now.split('T')[0],
        last_balance_update: now,
        exceptions_this_month: 0,
        exceptions_this_quarter: 0,
        exceptions_this_year: 0,
        avg_exceptions_per_month: 0,
        created_at: now,
        updated_at: now,
      };

      const { data: balance, error } = await supabase
        .from('upt_balances')
        .insert(balanceData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating initial balance:', error);
        return null;
      }

      return balance;
    } catch (error) {
      logger.error('Error in createInitialBalance:', error);
      return null;
    }
  }

  /**
   * Send notifications for exception
   */
  private async sendExceptionNotifications(exception: UPTException, _balance: UPTBalance | null, _policy: UPTPolicyConfig): Promise<void> {
    // TODO: Implement notification logic (email, SMS, in-app)
    logger.info('Sending exception notifications', {
      exception_id: exception.exception_id,
      employee_id: exception.employee_id,
      exception_type: exception.exception_type,
    });
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(exceptions: UPTException[], startDate: string, endDate: string): UPTSummary {
    const totalExceptions = exceptions.length;
    const employeesAffected = new Set(exceptions.map(e => e.employee_id)).size;
    const totalUPTDeducted = exceptions.reduce((sum, e) => sum + (e.is_excused ? 0 : e.upt_hours_deducted), 0);
    const totalUPTExcused = exceptions.reduce((sum, e) => sum + (e.is_excused ? e.upt_hours_deducted : 0), 0);

    const byType = {
      absences: exceptions.filter(e => e.exception_type === 'absence' || e.exception_type === 'partial_absence').length,
      tardiness: exceptions.filter(e => e.exception_type === 'tardiness').length,
      early_departures: exceptions.filter(e => e.exception_type === 'early_departure').length,
      missed_punches: exceptions.filter(e => e.exception_type === 'missed_punch').length,
      extended_breaks: exceptions.filter(e => e.exception_type === 'extended_break').length,
      no_call_no_shows: exceptions.filter(e => e.exception_type === 'no_call_no_show').length,
    };

    const bySeverity = {
      minor_exceptions: exceptions.filter(e => e.severity === 'minor').length,
      moderate_exceptions: exceptions.filter(e => e.severity === 'moderate').length,
      major_exceptions: exceptions.filter(e => e.severity === 'major').length,
      critical_exceptions: exceptions.filter(e => e.severity === 'critical').length,
    };

    return {
      total_exceptions: totalExceptions,
      total_employees_affected: employeesAffected,
      total_upt_hours_deducted: totalUPTDeducted,
      total_upt_hours_excused: totalUPTExcused,
      avg_exceptions_per_employee: employeesAffected > 0 ? totalExceptions / employeesAffected : 0,
      avg_upt_hours_per_exception: totalExceptions > 0 ? totalUPTDeducted / totalExceptions : 0,
      employees_healthy: 0, // TODO: Calculate from balances
      employees_warning: 0,
      employees_critical: 0,
      employees_terminated: 0,
      ...byType,
      ...bySeverity,
      start_date: startDate,
      end_date: endDate,
    };
  }

  /**
   * Group exceptions by employee
   */
  private async groupByEmployee(exceptions: UPTException[]): Promise<UPTEmployeeStats[]> {
    const employeeMap = new Map<string, UPTException[]>();
    
    exceptions.forEach(exception => {
      if (!employeeMap.has(exception.employee_id)) {
        employeeMap.set(exception.employee_id, []);
      }
      employeeMap.get(exception.employee_id)!.push(exception);
    });

    const stats: UPTEmployeeStats[] = [];
    for (const [employeeId, empExceptions] of employeeMap) {
      const { data: balance } = await supabase
        .from('upt_balances')
        .select('current_balance_hours, balance_status, department_id')
        .eq('employee_id', employeeId)
        .single();

      const totalDeducted = empExceptions.reduce((sum, e) => sum + (e.is_excused ? 0 : e.upt_hours_deducted), 0);
      const totalExcused = empExceptions.reduce((sum, e) => sum + (e.is_excused ? e.upt_hours_deducted : 0), 0);

      const exceptionTypes = empExceptions.map(e => e.exception_type);
      const typeCounts = exceptionTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostCommonType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0] as UPTExceptionType || 'absence';

      const sortedDates = empExceptions.map(e => e.exception_date).sort();
      const mostRecentDate = sortedDates[sortedDates.length - 1];

      stats.push({
        employee_id: employeeId,
        employee_name: empExceptions[0]?.employee_name || 'Unknown',
        department_id: balance?.department_id,
        department_name: undefined,
        current_balance_hours: balance?.current_balance_hours || 0,
        balance_status: balance?.balance_status || 'healthy',
        total_exceptions: empExceptions.length,
        total_upt_hours_deducted: totalDeducted,
        total_excused_hours: totalExcused,
        most_common_exception_type: mostCommonType,
        most_recent_exception_date: mostRecentDate,
        trend: 'stable', // TODO: Calculate trend
      });
    }

    return stats;
  }

  /**
   * Group exceptions by department
   */
  private async groupByDepartment(exceptions: UPTException[]): Promise<UPTDepartmentStats[]> {
    const deptMap = new Map<string, UPTException[]>();
    
    exceptions.forEach(exception => {
      const deptId = exception.department_id || 'unknown';
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, []);
      }
      deptMap.get(deptId)!.push(exception);
    });

    const stats: UPTDepartmentStats[] = [];
    for (const [deptId, deptExceptions] of deptMap) {
      if (deptId === 'unknown') continue;

      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', deptId)
        .single();

      const uniqueEmployees = new Set(deptExceptions.map(e => e.employee_id)).size;
      const totalUPTDeducted = deptExceptions.reduce((sum, e) => sum + (e.is_excused ? 0 : e.upt_hours_deducted), 0);

      const exceptionTypes = deptExceptions.map(e => e.exception_type);
      const typeCounts = exceptionTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostCommonType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0] as UPTExceptionType || 'absence';

      // Get critical/warning counts
      const { data: balances } = await supabase
        .from('upt_balances')
        .select('balance_status')
        .eq('department_id', deptId);

      const criticalCount = balances?.filter(b => b.balance_status === 'critical').length || 0;
      const warningCount = balances?.filter(b => b.balance_status === 'warning').length || 0;

      stats.push({
        department_id: deptId,
        department_name: dept?.name || 'Unknown',
        total_employees: uniqueEmployees,
        total_exceptions: deptExceptions.length,
        total_upt_hours_deducted: totalUPTDeducted,
        avg_exceptions_per_employee: deptExceptions.length / uniqueEmployees,
        employees_critical: criticalCount,
        employees_warning: warningCount,
        most_common_exception_type: mostCommonType,
      });
    }

    return stats;
  }

  /**
   * Group exceptions by type
   */
  private groupByExceptionType(exceptions: UPTException[]): UPTExceptionTypeStats[] {
    const typeMap = new Map<UPTExceptionType, UPTException[]>();
    
    exceptions.forEach(exception => {
      if (!typeMap.has(exception.exception_type)) {
        typeMap.set(exception.exception_type, []);
      }
      typeMap.get(exception.exception_type)!.push(exception);
    });

    const stats: UPTExceptionTypeStats[] = [];
    const totalExceptions = exceptions.length;

    for (const [type, typeExceptions] of typeMap) {
      const count = typeExceptions.length;
      const percentage = (count / totalExceptions) * 100;
      const totalUPTHours = typeExceptions.reduce((sum, e) => sum + (e.is_excused ? 0 : e.upt_hours_deducted), 0);
      const avgUPTHours = count > 0 ? totalUPTHours / count : 0;
      const employeesAffected = new Set(typeExceptions.map(e => e.employee_id)).size;

      stats.push({
        exception_type: type,
        count,
        percentage,
        total_upt_hours: totalUPTHours,
        avg_upt_hours_per_exception: avgUPTHours,
        employees_affected: employeesAffected,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Group exceptions by severity
   */
  private groupBySeverity(exceptions: UPTException[]): UPTSeverityStats[] {
    const severityMap = new Map<UPTSeverity, UPTException[]>();
    
    exceptions.forEach(exception => {
      if (!severityMap.has(exception.severity)) {
        severityMap.set(exception.severity, []);
      }
      severityMap.get(exception.severity)!.push(exception);
    });

    const stats: UPTSeverityStats[] = [];
    const totalExceptions = exceptions.length;

    for (const [severity, sevExceptions] of severityMap) {
      const count = sevExceptions.length;
      const percentage = (count / totalExceptions) * 100;
      const totalUPTHours = sevExceptions.reduce((sum, e) => sum + (e.is_excused ? 0 : e.upt_hours_deducted), 0);
      const employeesAffected = new Set(sevExceptions.map(e => e.employee_id)).size;

      stats.push({
        severity,
        count,
        percentage,
        total_upt_hours: totalUPTHours,
        employees_affected: employeesAffected,
      });
    }

    return stats;
  }

  /**
   * Get recommended action based on balance status
   */
  private getRecommendedAction(status: UPTBalanceStatus, balanceHours: number, monthlyExceptions: number): string {
    if (status === 'terminated' || balanceHours <= 0) {
      return 'Termination review required';
    }
    if (status === 'critical') {
      return monthlyExceptions >= 3 ? 'Written warning and PIP' : 'Written warning';
    }
    if (status === 'warning') {
      return monthlyExceptions >= 2 ? 'Verbal warning' : 'Coaching conversation';
    }
    return 'Monitor';
  }
}

export const uptTrackingService = new UPTTrackingService();
