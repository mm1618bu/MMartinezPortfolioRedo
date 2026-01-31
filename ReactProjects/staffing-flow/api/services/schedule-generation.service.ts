import { shiftConstraintValidator } from './shift-constraints.service';
import { supabase } from '../lib/supabase';
import type {
  ScheduleGenerationRequest,
  ScheduleGenerationResult,
  GeneratedAssignment,
  AssignmentAttempt,
  EmployeeWorkload,
} from '../types/scheduleGeneration';
import type { ValidateShiftAssignmentInput } from '../schemas/shift-constraints.schema';

/**
 * Greedy Schedule Generation Service
 * Implements a greedy algorithm for generating shift schedules
 * that respects constraints and employee availability
 */

export const scheduleGenerationService = {
  /**
   * Generate schedule using greedy algorithm
   * Process each shift in order, assign best available employee
   */
  async generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduleGenerationResult> {
    const startTime = Date.now();

    try {
      // Initialize workload tracker for all employees
      const workloadMap = new Map<string, EmployeeWorkload>();
      request.employees.forEach((emp: any) => {
        workloadMap.set(emp.employee_id, {
          employee_id: emp.employee_id,
          shifts_assigned: 0,
          hours_this_week: 0,
          rest_days_remaining: 5,
        });
      });

      const assignments: GeneratedAssignment[] = [];
      const conflicts: AssignmentAttempt[] = [];
      let hardViolationCount = 0;
      let softViolationCount = 0;

      // Sort shifts by priority (critical first, then by date)
      const sortedShifts = [...request.shifts].sort((a, b) => {
        const priorityMap: Record<string, number> = {
          critical: 0,
          high: 1,
          normal: 2,
          low: 3,
        };
        const aPriority = priorityMap[a.priority || 'normal'] ?? 2;
        const bPriority = priorityMap[b.priority || 'normal'] ?? 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.assignment_date).getTime() - new Date(b.assignment_date).getTime();
      });

      // Greedy assignment loop
      for (const shift of sortedShifts) {
        const attempts = await this.rankEmployeesForShift(
          shift,
          request.employees,
          request.organization_id,
          request.department_id,
          workloadMap
        );

        // Find best assignment (no hard violations, or allow override)
        let assigned = false;

        for (const attempt of attempts) {
          if (!attempt.success && !request.allow_hard_overrides) {
            const hasHardViolations = attempt.violations.some((v: any) => v.severity === 'hard');
            if (hasHardViolations) continue;
          }

          // Assign this employee
          const hardViolations = attempt.violations.filter((v: any) => v.severity === 'hard').length;
          const softViolations = attempt.violations.filter((v: any) => v.severity === 'soft').length;

          if (softViolations > (request.max_soft_violations || 0) && !request.allow_hard_overrides) {
            continue;
          }

          const assignment: GeneratedAssignment = {
            shift_id: shift.shift_id,
            employee_id: attempt.employee_id,
            employee_name: attempt.employee_name,
            organization_id: request.organization_id,
            department_id: request.department_id,
            assigned_role: shift.required_role || 'general',
            assignment_date: shift.assignment_date,
            shift_start_time: shift.shift_start_time,
            shift_end_time: shift.shift_end_time,
            status: hardViolations > 0 && !request.allow_hard_overrides ? 'conflict' : 'assigned',
            violations: attempt.violations,
            assignment_score: attempt.score,
          };

          assignments.push(assignment);
          hardViolationCount += hardViolations;
          softViolationCount += softViolations;

          // Update workload
          const workload = workloadMap.get(attempt.employee_id);
          if (workload) {
            workload.shifts_assigned++;
            const hours = this.calculateShiftHours(shift.shift_start_time, shift.shift_end_time);
            workload.hours_this_week += hours;
            workload.last_assignment_date = shift.assignment_date;
          }

          assigned = true;
          break;
        }

        // Record failed assignment
        if (!assigned) {
          const topAttempt = attempts[0];
          if (topAttempt) {
            conflicts.push(topAttempt);
          }

          const unassignedAssignment: GeneratedAssignment = {
            shift_id: shift.shift_id,
            employee_id: '',
            employee_name: 'UNASSIGNED',
            organization_id: request.organization_id,
            department_id: request.department_id,
            assigned_role: shift.required_role || 'general',
            assignment_date: shift.assignment_date,
            shift_start_time: shift.shift_start_time,
            shift_end_time: shift.shift_end_time,
            status: 'unassigned',
            violations: [],
            assignment_score: 0,
          };

          assignments.push(unassignedAssignment);
        }
      }

      const assignedCount = assignments.filter(a => a.status === 'assigned' || a.status === 'conflict').length;
      const coveragePercentage = request.shifts.length > 0 ? (assignedCount / request.shifts.length) * 100 : 0;

      const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        schedule_id: scheduleId,
        organization_id: request.organization_id,
        department_id: request.department_id,
        total_shifts: request.shifts.length,
        assigned_shifts: assignedCount,
        unassigned_shifts: request.shifts.length - assignedCount,
        coverage_percentage: Math.round(coveragePercentage * 100) / 100,
        assignments,
        conflicts,
        total_hard_violations: hardViolationCount,
        total_soft_violations: softViolationCount,
        generation_time_ms: Date.now() - startTime,
        generated_at: new Date().toISOString(),
        algorithm_used: 'greedy_assignment',
        notes: `Generated ${assignedCount} assignments covering ${coveragePercentage.toFixed(1)}% of shifts`,
      };
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  },

  /**
   * Rank employees for a specific shift
   * Returns attempts sorted by score (best first)
   */
  async rankEmployeesForShift(
    shift: any,
    employees: any[],
    organizationId: string,
    departmentId: string,
    workloadMap: Map<string, EmployeeWorkload>
  ): Promise<AssignmentAttempt[]> {
    const attempts: AssignmentAttempt[] = [];

    for (const employee of employees) {
      // Check basic availability
        if (!(employee.available_dates || []).includes(shift.assignment_date)) {
          continue; // Employee not available on this date
        }

        if (employee.unavailable_dates?.includes(shift.assignment_date)) {
          continue; // Explicitly unavailable
        }

        // Score this assignment
        const validation = await shiftConstraintValidator.validateAssignment({
          organization_id: organizationId,
          department_id: departmentId,
          employee_id: employee.employee_id,
          shift_template_id: shift.shift_id,
          assignment_date: shift.assignment_date,
          assignment_end_date: shift.assignment_date,
          assigned_role: shift.required_role || 'general',
          skip_soft_constraints: false,
          allow_warnings: false,
        } as ValidateShiftAssignmentInput);

        const scoring = this.scoreAssignment(
          employee,
          shift,
          validation.violations,
          workloadMap.get(employee.employee_id)
        );

        attempts.push({
          shift_id: shift.shift_id,
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          success: validation.valid,
          violations: validation.violations,
          score: scoring,
          reason: validation.valid
            ? 'No hard constraint violations'
            : `${validation.violations.filter((v: any) => v.severity === 'hard').length} hard violations`,
        });
      }

      // Sort by score descending (best first)
      attempts.sort((a, b) => b.score - a.score);
      return attempts;
  },

  /**
   * Score an assignment based on multiple criteria
   * Higher score = better match
   */
  scoreAssignment(
    employee: any,
    shift: any,
    violations: any[],
    workload?: EmployeeWorkload
  ): number {
    let score = 100;

    // Penalty for hard violations (-50 each)
    const hardViolations = violations.filter(v => v.severity === 'hard').length;
    score -= hardViolations * 50;

    // Penalty for soft violations (-10 each)
    const softViolations = violations.filter(v => v.severity === 'soft').length;
    score -= softViolations * 10;

    // Bonus for skill match
    if (shift.required_skill && employee.skills?.includes(shift.required_skill)) {
      score += 15;
    }

    // Bonus for shift preference match
    if (shift.shift_type && employee.preferred_shift_types?.includes(shift.shift_type)) {
      score += 10;
    }

    // Workload balancing - prefer employees with fewer shifts
    if (workload) {
      const workloadPenalty = workload.shifts_assigned * 2;
      score -= workloadPenalty;
    }

    // Ensure minimum score stays at 0 or above
    return Math.max(0, score);
  },

  /**
   * Calculate hours between two times
   */
  calculateShiftHours(startTime: string, endTime: string): number {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startHour = startParts[0] ?? 0;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 0;
    const endMin = endParts[1] ?? 0;

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle shifts that cross midnight

    return diffMinutes / 60;
  },

  /**
   * Persist generated schedule to database
   */
  async saveSchedule(result: ScheduleGenerationResult): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('generated_schedules')
        .insert([
          {
            schedule_id: result.schedule_id,
            organization_id: result.organization_id,
            department_id: result.department_id,
            total_shifts: result.total_shifts,
            assigned_shifts: result.assigned_shifts,
            unassigned_shifts: result.unassigned_shifts,
            coverage_percentage: result.coverage_percentage,
            total_hard_violations: result.total_hard_violations,
            total_soft_violations: result.total_soft_violations,
            algorithm_used: result.algorithm_used,
            generated_at: result.generated_at,
            schedule_data: result, // Full result as JSONB
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving schedule:', error);
      throw error;
    }
  },

  /**
   * Retrieve previously generated schedule
   */
  async getSchedule(scheduleId: string): Promise<ScheduleGenerationResult | null> {
    try {
      const { data, error } = await supabase
        .from('generated_schedules')
        .select('schedule_data')
        .eq('schedule_id', scheduleId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.schedule_data || null;
    } catch (error) {
      console.error('Error retrieving schedule:', error);
      return null;
    }
  },

  /**
   * List recent generated schedules
   */
  async listSchedules(organizationId: string, limit: number = 10): Promise<ScheduleGenerationResult[]> {
    try {
      const { data, error } = await supabase
        .from('generated_schedules')
        .select('schedule_data')
        .eq('organization_id', organizationId)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(row => row.schedule_data).filter(Boolean);
    } catch (error) {
      console.error('Error listing schedules:', error);
      return [];
    }
  },
};
