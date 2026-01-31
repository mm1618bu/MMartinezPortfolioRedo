/**
 * Schedule Generation API Service
 * Handles all schedule generation, management, and analytics operations
 */

import { supabase } from '../lib/supabase';
import { scheduleGenerationService } from './schedule-generation.service';
import { coverageScoringService } from './coverage-scoring.service';
import type {
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  Schedule,
  UpdateScheduleRequest,
  PublishScheduleRequest,
  PublishScheduleResponse,
  ScheduleHealthCheck,
  ScheduleStatistics,
  ScheduleComparisonResult,
  CompareSchedulesRequest,
  ScheduleTemplate,
  CreateScheduleTemplateRequest,
  ListSchedulesRequest,
  ListSchedulesResponse,
  ListAssignmentsRequest,
  ListAssignmentsResponse,
} from '../types/scheduleAPI';

/**
 * Schedule API Service - Orchestrates schedule generation and management
 */
class ScheduleAPIService {
  /**
   * Generate a new schedule from a staffing plan
   */
  async generateSchedule(request: GenerateScheduleRequest): Promise<GenerateScheduleResponse> {
    try {
      const startTime = Date.now();

      // Validate staffing plan exists
      const { data: plan, error: planError } = await supabase
        .from('staffing_plans')
        .select('*')
        .eq('id', request.staffing_plan_id)
        .single();

      if (planError || !plan) {
        throw new Error(`Staffing plan not found: ${request.staffing_plan_id}`);
      }

      // Fetch shifts and employees from staffing plan
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('staffing_plan_id', request.staffing_plan_id);

      if (shiftsError || !shifts) {
        throw new Error(`Failed to fetch shifts: ${request.staffing_plan_id}`);
      }

      // Fetch employees for the organization
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', plan.organization_id);

      if (employeesError || !employees) {
        throw new Error(`Failed to fetch employees for organization: ${plan.organization_id}`);
      }

      // Generate schedule using greedy algorithm
      const scheduleResult = await scheduleGenerationService.generateSchedule({
        organization_id: plan.organization_id,
        department_id: plan.department_id,
        shifts: shifts.map((shift: any) => ({
          shift_id: shift.id,
          shift_type: shift.type || 'standard',
          department_id: plan.department_id,
          organization_id: plan.organization_id,
          assignment_date: shift.date,
          shift_start_time: shift.start_time,
          shift_end_time: shift.end_time,
          required_role: shift.required_role,
          required_skill: shift.required_skill,
          min_staffing: shift.min_staffing || 1,
          max_staffing: shift.max_staffing || 10,
          priority: shift.priority || 'normal',
        })),
        employees: employees.map((emp: any) => ({
          employee_id: emp.id,
          employee_name: emp.name,
          role: emp.role,
          available_dates: emp.available_dates || [],
          unavailable_dates: emp.unavailable_dates || [],
          max_shifts_per_week: emp.max_shifts_per_week || 5,
          preferred_shift_types: emp.preferred_shift_types || [],
          skills: emp.skills || [],
        })),
        strategy: (request.algorithm as any) || 'greedy',
        max_soft_violations: request.algorithm_parameters?.max_soft_violations as number | undefined,
        allow_hard_overrides: request.algorithm_parameters?.allow_hard_overrides as boolean | undefined,
      });

      // Calculate coverage metrics if requested
      let qualityScore = 75; // Default quality score
      const coverageMetrics: Record<string, unknown> = {};

      if (request.include_coverage_scoring) {
        try {
          const coverage = await coverageScoringService.calculateCoverage({
            organization_id: plan.organization_id,
            department_id: plan.department_id,
            schedule_result: scheduleResult,
          });
          qualityScore = coverage.coverage_percentage * 0.7 + 75; // Weighted score
          Object.assign(coverageMetrics, coverage);
        } catch (e) {
          console.warn('Coverage scoring failed, continuing without scores:', e);
        }
      }

      // Calculate constraint violations
      const violations = await this.calculateConstraintViolations(
        scheduleResult as unknown as Record<string, unknown>
      );

      // Save schedule to database
      const { data: savedSchedule, error: saveError } = await supabase
        .from('generated_schedules')
        .insert({
          organization_id: plan.organization_id,
          staffing_plan_id: request.staffing_plan_id,
          name: request.name,
          description: request.description,
          version: 1,
          algorithm: request.algorithm || 'greedy',
          algorithm_parameters: request.algorithm_parameters || {},
          schedule_start_date: plan.start_date,
          schedule_end_date: plan.end_date,
          total_shifts: (scheduleResult as any).total_shifts || 0,
          assigned_shifts: (scheduleResult as any).assigned_shifts || 0,
          unassigned_shifts: (scheduleResult as any).unassigned_shifts || 0,
          coverage_percentage: (scheduleResult as any).coverage_percentage || 0,
          quality_score: qualityScore,
          constraint_violation_count: violations.total_violations,
          hard_violation_count: violations.hard_violations,
          soft_violation_count: violations.soft_violations,
          warning_violation_count: violations.warning_violations,
          schedule_data: scheduleResult,
          coverage_metrics: coverageMetrics,
          status: request.auto_approve ? 'approved' : 'draft',
          created_by: plan.created_by,
        })
        .select()
        .single();

      if (saveError || !savedSchedule) {
        throw new Error(`Failed to save schedule: ${saveError?.message}`);
      }

      // Save individual assignments
      if (
        (scheduleResult as any).assignments &&
        Array.isArray((scheduleResult as any).assignments) &&
        (scheduleResult as any).assignments.length > 0
      ) {
        await this.saveScheduleAssignments(
          savedSchedule.id,
          (scheduleResult as any).assignments
        );
      }

      const generationTime = Date.now() - startTime;

      return {
        schedule_id: savedSchedule.id,
        staffing_plan_id: request.staffing_plan_id,
        total_shifts: (scheduleResult as any).total_shifts || 0,
        assigned_shifts: (scheduleResult as any).assigned_shifts || 0,
        unassigned_shifts: (scheduleResult as any).unassigned_shifts || 0,
        coverage_percentage: (scheduleResult as any).coverage_percentage || 0,
        quality_score: qualityScore,
        constraint_violations: {
          ...violations,
          violations_by_type: {},
        },
        generation_time_ms: generationTime,
        status: savedSchedule.status,
      };
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Get a schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<Schedule> {
    try {
      const { data: schedule, error } = await supabase
        .from('generated_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (error || !schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      return schedule as Schedule;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }

  /**
   * List schedules with pagination and filtering
   */
  async listSchedules(request: ListSchedulesRequest): Promise<ListSchedulesResponse> {
    try {
      const pageSize = request.page_size || 10;
      const page = request.page || 1;
      const offset = (page - 1) * pageSize;

      let query = supabase.from('generated_schedules').select('*', { count: 'exact' });

      if (request.organization_id) {
        query = query.eq('organization_id', request.organization_id);
      }
      if (request.staffing_plan_id) {
        query = query.eq('staffing_plan_id', request.staffing_plan_id);
      }
      if (request.status) {
        query = query.eq('status', request.status);
      }
      if (request.date_from) {
        query = query.gte('schedule_start_date', request.date_from);
      }
      if (request.date_to) {
        query = query.lte('schedule_end_date', request.date_to);
      }

      const sortColumn = request.sort_by || 'created_at';
      const sortOrder = request.sort_order || 'desc';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      const { data: schedules, count, error } = await query.range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(`Failed to list schedules: ${error.message}`);
      }

      return {
        schedules: (schedules || []) as Schedule[],
        total_count: count || 0,
        page,
        page_size: pageSize,
        total_pages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('Error listing schedules:', error);
      throw error;
    }
  }

  /**
   * Update a schedule
   */
  async updateSchedule(scheduleId: string, request: UpdateScheduleRequest): Promise<Schedule> {
    try {
      const { data: schedule, error } = await supabase
        .from('generated_schedules')
        .update({
          ...(request.name && { name: request.name }),
          ...(request.description && { description: request.description }),
          ...(request.status && { status: request.status }),
          ...(request.review_notes && { generation_notes: request.review_notes }),
          ...(request.approval_notes && { approval_notes: request.approval_notes }),
        })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error || !schedule) {
        throw new Error(`Failed to update schedule: ${error?.message}`);
      }

      return schedule as Schedule;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Publish a schedule (move to published status)
   */
  async publishSchedule(
    scheduleId: string,
    request: PublishScheduleRequest,
    publishedBy: string
  ): Promise<PublishScheduleResponse> {
    try {
      const publishedAt = new Date().toISOString();

      const { data: schedule, error } = await supabase
        .from('generated_schedules')
        .update({
          status: 'published',
          published_at: publishedAt,
          approved_by: publishedBy,
          approved_at: publishedAt,
          approval_notes: request.approval_notes,
        })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error || !schedule) {
        throw new Error(`Failed to publish schedule: ${error?.message}`);
      }

      return {
        schedule_id: scheduleId,
        published_at: publishedAt,
        status: 'published',
      };
    } catch (error) {
      console.error('Error publishing schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const { error } = await supabase.from('generated_schedules').delete().eq('id', scheduleId);

      if (error) {
        throw new Error(`Failed to delete schedule: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a schedule
   */
  async getScheduleAssignments(
    request: ListAssignmentsRequest
  ): Promise<ListAssignmentsResponse> {
    try {
      const pageSize = request.page_size || 10;
      const page = request.page || 1;
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('schedule_assignments')
        .select('*', { count: 'exact' })
        .eq('schedule_id', request.schedule_id);

      if (request.employee_id) {
        query = query.eq('employee_id', request.employee_id);
      }
      if (request.status) {
        query = query.eq('status', request.status);
      }
      if (request.has_violations !== undefined) {
        if (request.has_violations) {
          query = query.or('has_hard_violations.eq.true,has_soft_violations.eq.true');
        } else {
          query = query.eq('has_hard_violations', false).eq('has_soft_violations', false);
        }
      }
      if (request.date_from) {
        query = query.gte('shift_date', request.date_from);
      }
      if (request.date_to) {
        query = query.lte('shift_date', request.date_to);
      }

      const { data: assignments, count, error } = await query.range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(`Failed to list assignments: ${error.message}`);
      }

      return {
        assignments: (assignments || []) as any[],
        total_count: count || 0,
        page,
        page_size: pageSize,
        total_pages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('Error listing assignments:', error);
      throw error;
    }
  }

  /**
   * Get schedule health check
   */
  async getScheduleHealth(scheduleId: string): Promise<ScheduleHealthCheck> {
    try {
      const schedule = await this.getSchedule(scheduleId);

      // Calculate health score based on multiple factors
      const qualityWeight = 0.35;
      const coverageWeight = 0.3;
      const workloadWeight = 0.2;
      const constraintWeight = 0.15;

      const qualityScore = schedule.quality_score || 50;
      const coverageScore = Math.min(schedule.coverage_percentage || 0, 100);
      const workloadScore = schedule.workload_balance_score || 50;
      const constraintScore = Math.max(
        100 - (schedule.constraint_violation_count || 0) * 2,
        0
      );

      const healthScore =
        qualityScore * qualityWeight +
        coverageScore * coverageWeight +
        workloadScore * workloadWeight +
        constraintScore * constraintWeight;

      // Determine health status
      let health: 'excellent' | 'good' | 'fair' | 'poor';
      if (healthScore >= 85) health = 'excellent';
      else if (healthScore >= 70) health = 'good';
      else if (healthScore >= 50) health = 'fair';
      else health = 'poor';

      // Generate concerns
      const concerns = [];

      if (schedule.coverage_percentage < 80) {
        concerns.push({
          concern_type: 'low_coverage',
          severity: 'critical' as const,
          message: `Coverage is ${schedule.coverage_percentage}%, target is 80%+`,
          affected_count: schedule.unassigned_shifts || 0,
        });
      }

      if ((schedule.hard_violation_count || 0) > 0) {
        concerns.push({
          concern_type: 'hard_violations',
          severity: 'critical' as const,
          message: `${schedule.hard_violation_count} hard constraint violations detected`,
          affected_count: schedule.hard_violation_count || 0,
        });
      }

      if ((schedule.soft_violation_count || 0) > 5) {
        concerns.push({
          concern_type: 'soft_violations',
          severity: 'warning' as const,
          message: `${schedule.soft_violation_count} soft constraint violations`,
          affected_count: schedule.soft_violation_count || 0,
        });
      }

      if ((schedule.quality_score || 0) < 60) {
        concerns.push({
          concern_type: 'low_quality',
          severity: 'warning' as const,
          message: `Quality score ${schedule.quality_score} is below recommended 70+`,
          affected_count: 1,
        });
      }

      // Generate recommendations
      const recommendations = [];

      if (schedule.coverage_percentage < 80) {
        recommendations.push({
          action: 'Increase staffing levels',
          priority: 'high' as const,
          expected_improvement: 'Improve coverage by 10-15%',
        });
      }

      if ((schedule.hard_violation_count || 0) > 0) {
        recommendations.push({
          action: 'Adjust constraint parameters or add exceptions',
          priority: 'high' as const,
          expected_improvement: 'Eliminate hard violations',
        });
      }

      if ((schedule.workload_balance_score || 100) < 70) {
        recommendations.push({
          action: 'Rebalance employee workload distribution',
          priority: 'medium' as const,
          expected_improvement: 'Improve workload fairness',
        });
      }

      return {
        schedule_id: scheduleId,
        overall_health: health,
        health_score: Math.round(healthScore),
        concerns,
        recommendations,
      };
    } catch (error) {
      console.error('Error calculating schedule health:', error);
      throw error;
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStatistics(scheduleId: string): Promise<ScheduleStatistics> {
    try {
      const schedule = await this.getSchedule(scheduleId);

      // Get all assignments for the schedule
      const { data: assignments, error: assignmentError } = await supabase
        .from('schedule_assignments')
        .select('*')
        .eq('schedule_id', scheduleId);

      if (assignmentError) {
        throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
      }

      const assignmentList = (assignments || []) as any[];

      // Calculate statistics
      const employeeIds = new Set(assignmentList.map((a) => a.employee_id));
      const totalViolations = assignmentList.reduce(
        (sum, a) => sum + (a.constraint_violations_count || 0),
        0
      );

      const hoursList = assignmentList.map((a) => a.duration_hours);
      const avgHours =
        hoursList.length > 0 ? hoursList.reduce((a, b) => a + b, 0) / hoursList.length : 0;
      const maxHours = hoursList.length > 0 ? Math.max(...hoursList) : 0;
      const minHours = hoursList.length > 0 ? Math.min(...hoursList) : 0;
      const stdDev =
        hoursList.length > 0
          ? Math.sqrt(
              hoursList.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) / hoursList.length
            )
          : 0;

      const avgMatchScore =
        assignmentList.filter((a) => a.match_score).length > 0
          ? assignmentList.reduce((sum, a) => sum + (a.match_score || 0), 0) /
            assignmentList.filter((a) => a.match_score).length
          : 0;

      return {
        schedule_id: scheduleId,
        total_shifts: schedule.total_shifts,
        assigned_shifts: schedule.assigned_shifts,
        unassigned_shifts: schedule.unassigned_shifts,
        coverage_percentage: schedule.coverage_percentage,
        employee_count: employeeIds.size,
        average_assignments_per_employee:
          employeeIds.size > 0 ? assignmentList.length / employeeIds.size : 0,
        average_hours_per_employee: avgHours,
        max_hours_per_employee: maxHours,
        min_hours_per_employee: minHours,
        workload_std_deviation: stdDev,
        workload_balance_score: schedule.workload_balance_score || 50,
        average_match_score: avgMatchScore,
        average_skill_match:
          assignmentList.filter((a) => a.skill_match_percentage).length > 0
            ? assignmentList.reduce((sum, a) => sum + (a.skill_match_percentage || 0), 0) /
              assignmentList.filter((a) => a.skill_match_percentage).length
            : 0,
        total_violations: totalViolations,
        hard_violations: schedule.hard_violation_count,
        soft_violations: schedule.soft_violation_count,
        warnings: schedule.warning_violation_count,
        violation_rate: schedule.total_shifts > 0 ? (totalViolations / schedule.total_shifts) * 100 : 0,
      };
    } catch (error) {
      console.error('Error calculating schedule statistics:', error);
      throw error;
    }
  }

  /**
   * Compare two schedules
   */
  async compareSchedules(request: CompareSchedulesRequest): Promise<ScheduleComparisonResult> {
    try {
      const scheduleA = await this.getSchedule(request.schedule_id_a);
      const scheduleB = await this.getSchedule(request.schedule_id_b);

      const qualityDiff = (scheduleB.quality_score || 0) - (scheduleA.quality_score || 0);
      const coverageDiff = scheduleB.coverage_percentage - scheduleA.coverage_percentage;
      const workloadDiff = (scheduleB.workload_balance_score || 0) - (scheduleA.workload_balance_score || 0);
      const violationDiff =
        (scheduleB.constraint_violation_count || 0) - (scheduleA.constraint_violation_count || 0);

      // Determine which schedule is better
      const betterScheduleId =
        qualityDiff > 0 || (qualityDiff === 0 && coverageDiff > 0)
          ? request.schedule_id_b
          : request.schedule_id_a;

      // Generate recommendation
      let recommendation = '';
      if (betterScheduleId === request.schedule_id_a) {
        recommendation = `Schedule A is better with ${qualityDiff.toFixed(1)} higher quality score`;
      } else {
        recommendation = `Schedule B is better with ${qualityDiff.toFixed(1)} higher quality score`;
      }

      // Save comparison to database
      const { data: comparison } = await supabase
        .from('schedule_comparisons')
        .insert({
          organization_id: scheduleA.organization_id,
          schedule_id_a: request.schedule_id_a,
          schedule_id_b: request.schedule_id_b,
          quality_score_a: scheduleA.quality_score,
          quality_score_b: scheduleB.quality_score,
          quality_score_difference: qualityDiff,
          coverage_difference: coverageDiff,
          workload_balance_difference: workloadDiff,
          constraint_violations_difference: violationDiff,
          recommendation,
          better_schedule_id: betterScheduleId,
        })
        .select()
        .single();

      return {
        comparison_id: comparison?.id || '',
        schedule_a: {
          id: scheduleA.id,
          name: scheduleA.name,
          quality_score: scheduleA.quality_score || 0,
          coverage_percentage: scheduleA.coverage_percentage,
          workload_balance_score: scheduleA.workload_balance_score,
          constraint_violations: scheduleA.constraint_violation_count,
        },
        schedule_b: {
          id: scheduleB.id,
          name: scheduleB.name,
          quality_score: scheduleB.quality_score || 0,
          coverage_percentage: scheduleB.coverage_percentage,
          workload_balance_score: scheduleB.workload_balance_score,
          constraint_violations: scheduleB.constraint_violation_count,
        },
        differences: {
          quality_score_diff: qualityDiff,
          coverage_diff: coverageDiff,
          workload_balance_diff: workloadDiff,
          constraint_violations_diff: violationDiff,
        },
        recommendation,
        better_schedule_id: betterScheduleId,
      };
    } catch (error) {
      console.error('Error comparing schedules:', error);
      throw error;
    }
  }

  /**
   * Create a schedule template
   */
  async createScheduleTemplate(request: CreateScheduleTemplateRequest): Promise<ScheduleTemplate> {
    try {
      const { data: template, error } = await supabase
        .from('schedule_templates')
        .insert({
          name: request.name,
          description: request.description,
          template_data: request.template_data,
          constraint_rules_applied: request.constraint_rules_applied || [],
          algorithm_parameters: request.algorithm_parameters || {},
          is_public: request.is_public || false,
        })
        .select()
        .single();

      if (error || !template) {
        throw new Error(`Failed to create template: ${error?.message}`);
      }

      return template as ScheduleTemplate;
    } catch (error) {
      console.error('Error creating schedule template:', error);
      throw error;
    }
  }

  /**
   * List schedule templates
   */
  async listScheduleTemplates(
    organizationId: string,
    includeArchived = false
  ): Promise<ScheduleTemplate[]> {
    try {
      let query = supabase
        .from('schedule_templates')
        .select('*')
        .eq('organization_id', organizationId);

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data: templates, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to list templates: ${error.message}`);
      }

      return (templates || []) as ScheduleTemplate[];
    } catch (error) {
      console.error('Error listing schedule templates:', error);
      throw error;
    }
  }

  /**
   * Helper: Save schedule assignments to database
   */
  private async saveScheduleAssignments(
    scheduleId: string,
    assignments: Record<string, unknown>[]
  ): Promise<void> {
    try {
      const assignmentsToSave = assignments.map((assignment: any) => ({
        schedule_id: scheduleId,
        employee_id: assignment.employee_id,
        shift_id: assignment.shift_id,
        assignment_date: new Date().toISOString().split('T')[0],
        shift_date: assignment.shift_date || new Date().toISOString().split('T')[0],
        shift_start_time: assignment.shift_start_time || '09:00',
        shift_end_time: assignment.shift_end_time || '17:00',
        duration_hours: assignment.duration_hours || 8,
        match_score: assignment.match_score,
        skill_match_percentage: assignment.skill_match_percentage,
        status: 'proposed',
      }));

      const { error } = await supabase.from('schedule_assignments').insert(assignmentsToSave);

      if (error) {
        throw new Error(`Failed to save assignments: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate constraint violations
   */
  private async calculateConstraintViolations(
    scheduleResult: Record<string, unknown>
  ): Promise<{
    total_violations: number;
    hard_violations: number;
    soft_violations: number;
    warning_violations: number;
  }> {
    try {
      let hardCount = 0;
      let softCount = 0;
      let warningCount = 0;

      // Count violations from assignments
      const assignments = (scheduleResult.assignments as any[]) || [];
      assignments.forEach((assignment) => {
        if (assignment.constraint_violations) {
          assignment.constraint_violations.forEach((violation: any) => {
            if (violation.severity === 'hard') hardCount++;
            else if (violation.severity === 'soft') softCount++;
            else warningCount++;
          });
        }
      });

      return {
        total_violations: hardCount + softCount + warningCount,
        hard_violations: hardCount,
        soft_violations: softCount,
        warning_violations: warningCount,
      };
    } catch (error) {
      console.error('Error calculating violations:', error);
      return {
        total_violations: 0,
        hard_violations: 0,
        soft_violations: 0,
        warning_violations: 0,
      };
    }
  }
}

export const scheduleAPIService = new ScheduleAPIService();
