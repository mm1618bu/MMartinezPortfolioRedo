import type { Schedule, ScheduleAssignment } from '../../types/scheduleAPI';

export interface ValidationWarning {
  id: string;
  type: 'violation' | 'workload' | 'coverage' | 'skill_match' | 'availability' | 'pattern';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  affectedAssignments: string[]; // Assignment IDs
  affectedEmployees: string[]; // Employee IDs
  suggestedAction?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface ValidationContext {
  schedule: Schedule;
  assignments: ScheduleAssignment[];
  employeeWorkloads: Map<string, number>;
  coverageByDate: Map<string, number>;
  violationsByAssignment: Map<string, string[]>;
}

export class RealtimeValidationService {
  /**
   * Perform comprehensive real-time validation on schedule
   */
  static validateSchedule(
    schedule: Schedule,
    assignments: ScheduleAssignment[]
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const context = this.buildValidationContext(schedule, assignments);

    // Run all validation checks
    warnings.push(...this.checkConstraintViolations(context));
    warnings.push(...this.checkWorkloadBalance(context));
    warnings.push(...this.checkCoverageIssues(context));
    warnings.push(...this.checkSkillMatches(context));
    warnings.push(...this.checkAvailabilityIssues(context));
    warnings.push(...this.checkSchedulingPatterns(context));

    return warnings;
  }

  /**
   * Build validation context from schedule data
   */
  private static buildValidationContext(
    schedule: Schedule,
    assignments: ScheduleAssignment[]
  ): ValidationContext {
    const employeeWorkloads = new Map<string, number>();
    const coverageByDate = new Map<string, number>();
    const violationsByAssignment = new Map<string, string[]>();

    // Calculate workloads
    assignments.forEach((a) => {
      const current = employeeWorkloads.get(a.employee_id) || 0;
      employeeWorkloads.set(a.employee_id, current + (a.duration_hours || 0));

      // Track coverage
      const coverage = coverageByDate.get(a.shift_date) || 0;
      coverageByDate.set(a.shift_date, coverage + 1);

      // Track violations
      if (a.has_hard_violations || a.has_soft_violations) {
        const violations = violationsByAssignment.get(a.id) || [];
        if (a.has_hard_violations) violations.push('hard_violation');
        if (a.has_soft_violations) violations.push('soft_violation');
        violationsByAssignment.set(a.id, violations);
      }
    });

    return {
      schedule,
      assignments,
      employeeWorkloads,
      coverageByDate,
      violationsByAssignment,
    };
  }

  /**
   * Check for constraint violations
   */
  private static checkConstraintViolations(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Hard violations
    const hardViolations = context.assignments.filter((a) => a.has_hard_violations);
    if (hardViolations.length > 0) {
      warnings.push({
        id: `hard-violations-${Date.now()}`,
        type: 'violation',
        severity: 'critical',
        title: 'Hard Constraint Violations',
        message: `${hardViolations.length} assignment(s) violate hard constraints and require manual override`,
        affectedAssignments: hardViolations.map((a) => a.id),
        affectedEmployees: [...new Set(hardViolations.map((a) => a.employee_id))],
        suggestedAction: 'Review and resolve hard violations before publishing schedule',
        metadata: {
          violationCount: hardViolations.length,
          violatedAssignments: hardViolations.map((a) => ({
            id: a.id,
            employee: a.employee_id,
            date: a.shift_date,
          })),
        },
        timestamp: new Date(),
      });
    }

    // Soft violations
    const softViolations = context.assignments.filter((a) => a.has_soft_violations);
    if (softViolations.length > 0) {
      warnings.push({
        id: `soft-violations-${Date.now()}`,
        type: 'violation',
        severity: 'warning',
        title: 'Soft Constraint Violations',
        message: `${softViolations.length} assignment(s) have soft constraint violations`,
        affectedAssignments: softViolations.map((a) => a.id),
        affectedEmployees: [...new Set(softViolations.map((a) => a.employee_id))],
        suggestedAction: 'Consider adjusting these assignments to improve schedule quality',
        metadata: {
          violationCount: softViolations.length,
        },
        timestamp: new Date(),
      });
    }

    return warnings;
  }

  /**
   * Check for workload balance issues
   */
  private static checkWorkloadBalance(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    const workloads = Array.from(context.employeeWorkloads.values());
    if (workloads.length === 0) return warnings;

    const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    const maxWorkload = Math.max(...workloads);
    const minWorkload = Math.min(...workloads);

    // Check for extreme overload
    const overloadedEmployees: { id: string; hours: number }[] = [];
    context.employeeWorkloads.forEach((hours, employeeId) => {
      if (hours > 50) overloadedEmployees.push({ id: employeeId, hours });
    });

    if (overloadedEmployees.length > 0) {
      warnings.push({
        id: `overload-${Date.now()}`,
        type: 'workload',
        severity: 'critical',
        title: 'Employee Overload Warning',
        message: `${overloadedEmployees.length} employee(s) assigned more than 50 hours`,
        affectedEmployees: overloadedEmployees.map((e) => e.id),
        affectedAssignments: context.assignments
          .filter((a) => overloadedEmployees.some((e) => e.id === a.employee_id))
          .map((a) => a.id),
        suggestedAction: 'Reduce hours for affected employees to meet maximum limits',
        metadata: {
          overloadedCount: overloadedEmployees.length,
          overloadedEmployees,
        },
        timestamp: new Date(),
      });
    }

    // Check for unbalanced distribution
    const deviation = Math.sqrt(
      workloads.reduce((sum, w) => sum + Math.pow(w - avgWorkload, 2), 0) / workloads.length
    );
    const imbalanceRatio = deviation / avgWorkload;

    if (imbalanceRatio > 0.4) {
      const underworkedCount = workloads.filter((w) => w < avgWorkload * 0.5).length;
      const overworkedCount = workloads.filter((w) => w > avgWorkload * 1.5).length;

      warnings.push({
        id: `imbalance-${Date.now()}`,
        type: 'workload',
        severity: 'warning',
        title: 'Workload Imbalance',
        message: `${underworkedCount} employee(s) under-utilized, ${overworkedCount} employee(s) over-utilized`,
        affectedEmployees: [],
        affectedAssignments: [],
        suggestedAction: 'Rebalance workload distribution for better fairness',
        metadata: {
          averageWorkload: parseFloat(avgWorkload.toFixed(2)),
          maxWorkload,
          minWorkload,
          imbalanceRatio: parseFloat(imbalanceRatio.toFixed(2)),
        },
        timestamp: new Date(),
      });
    }

    return warnings;
  }

  /**
   * Check for coverage issues
   */
  private static checkCoverageIssues(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    const start = new Date(context.schedule.schedule_start_date);
    const end = new Date(context.schedule.schedule_end_date);
    const uncoveredDates: string[] = [];
    const lowCoverageDates: { date: string; coverage: number }[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const coverage = context.coverageByDate.get(dateStr) || 0;

      if (coverage === 0) {
        uncoveredDates.push(dateStr);
      } else if (coverage < 3) {
        lowCoverageDates.push({ date: dateStr, coverage });
      }
    }

    // No coverage on dates
    if (uncoveredDates.length > 0) {
      warnings.push({
        id: `no-coverage-${Date.now()}`,
        type: 'coverage',
        severity: 'critical',
        title: 'No Coverage on Dates',
        message: `${uncoveredDates.length} date(s) have no assigned shifts`,
        affectedAssignments: [],
        affectedEmployees: [],
        suggestedAction: 'Assign shifts to all uncovered dates before publishing',
        metadata: {
          uncoveredCount: uncoveredDates.length,
          uncoveredDates,
        },
        timestamp: new Date(),
      });
    }

    // Low coverage on dates
    if (lowCoverageDates.length > 0) {
      warnings.push({
        id: `low-coverage-${Date.now()}`,
        type: 'coverage',
        severity: 'warning',
        title: 'Low Coverage on Dates',
        message: `${lowCoverageDates.length} date(s) have fewer than 3 assigned shifts`,
        affectedAssignments: [],
        affectedEmployees: [],
        suggestedAction: 'Consider adding more shifts to improve coverage',
        metadata: {
          lowCoverageCount: lowCoverageDates.length,
          lowCoverageDates,
        },
        timestamp: new Date(),
      });
    }

    return warnings;
  }

  /**
   * Check for skill match issues
   */
  private static checkSkillMatches(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    const poorMatches = context.assignments.filter((a) => a.skill_match_percentage && a.skill_match_percentage < 50);

    if (poorMatches.length > 0) {
      const criticalMatches = poorMatches.filter((a) => a.skill_match_percentage! < 30);

      if (criticalMatches.length > 0) {
        warnings.push({
          id: `critical-skill-match-${Date.now()}`,
          type: 'skill_match',
          severity: 'critical',
          title: 'Critical Skill Mismatch',
          message: `${criticalMatches.length} assignment(s) have <30% skill match`,
          affectedAssignments: criticalMatches.map((a) => a.id),
          affectedEmployees: [...new Set(criticalMatches.map((a) => a.employee_id))],
          suggestedAction: 'Reassign these shifts to employees with better skill matches',
          metadata: {
            mismatchCount: criticalMatches.length,
            assignments: criticalMatches.map((a) => ({
              id: a.id,
              skillMatch: a.skill_match_percentage,
            })),
          },
          timestamp: new Date(),
        });
      }

      const moderateMatches = poorMatches.filter((a) => a.skill_match_percentage! >= 30 && a.skill_match_percentage! < 50);
      if (moderateMatches.length > 0) {
        warnings.push({
          id: `low-skill-match-${Date.now()}`,
          type: 'skill_match',
          severity: 'warning',
          title: 'Low Skill Match',
          message: `${moderateMatches.length} assignment(s) have 30-50% skill match`,
          affectedAssignments: moderateMatches.map((a) => a.id),
          affectedEmployees: [...new Set(moderateMatches.map((a) => a.employee_id))],
          suggestedAction: 'Consider training or reassigning these shifts for better outcomes',
          metadata: {
            mismatchCount: moderateMatches.length,
          },
          timestamp: new Date(),
        });
      }
    }

    return warnings;
  }

  /**
   * Check for availability issues
   */
  private static checkAvailabilityIssues(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    const unconfirmedAssignments = context.assignments.filter((a) => a.status === 'proposed');

    if (unconfirmedAssignments.length > 0) {
      warnings.push({
        id: `unconfirmed-availability-${Date.now()}`,
        type: 'availability',
        severity: 'info',
        title: 'Unconfirmed Availability',
        message: `${unconfirmedAssignments.length} assignment(s) lack availability confirmation`,
        affectedAssignments: unconfirmedAssignments.map((a) => a.id),
        affectedEmployees: [...new Set(unconfirmedAssignments.map((a) => a.employee_id))],
        suggestedAction: 'Request availability confirmation from affected employees',
        metadata: {
          unconfirmedCount: unconfirmedAssignments.length,
        },
        timestamp: new Date(),
      });
    }

    return warnings;
  }

  /**
   * Check for scheduling pattern issues
   */
  private static checkSchedulingPatterns(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for consecutive high-hour days
    const employeeAssignments = new Map<string, ScheduleAssignment[]>();
    context.assignments.forEach((a) => {
      const list = employeeAssignments.get(a.employee_id) || [];
      list.push(a);
      employeeAssignments.set(a.employee_id, list);
    });

    const burnoutRiskEmployees: { id: string; consecutiveDays: number }[] = [];

    employeeAssignments.forEach((assignments, employeeId) => {
      const sortedByDate = assignments.sort((a, b) => a.shift_date.localeCompare(b.shift_date));

      let consecutiveDays = 0;
      let maxConsecutive = 0;

      for (let i = 0; i < sortedByDate.length; i++) {
        if (i === 0) {
          consecutiveDays = 1;
        } else {
          const prevDate = new Date(sortedByDate[i - 1].shift_date);
          const currDate = new Date(sortedByDate[i].shift_date);
          const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

          if (Math.abs(dayDiff - 1) < 0.1) {
            consecutiveDays++;
          } else {
            maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            consecutiveDays = 1;
          }
        }
      }

      maxConsecutive = Math.max(maxConsecutive, consecutiveDays);

      if (maxConsecutive >= 8) {
        burnoutRiskEmployees.push({ id: employeeId, consecutiveDays: maxConsecutive });
      }
    });

    if (burnoutRiskEmployees.length > 0) {
      warnings.push({
        id: `burnout-risk-${Date.now()}`,
        type: 'pattern',
        severity: 'warning',
        title: 'Burnout Risk - Long Stretches',
        message: `${burnoutRiskEmployees.length} employee(s) have 8+ consecutive working days`,
        affectedEmployees: burnoutRiskEmployees.map((e) => e.id),
        affectedAssignments: context.assignments
          .filter((a) => burnoutRiskEmployees.some((e) => e.id === a.employee_id))
          .map((a) => a.id),
        suggestedAction: 'Consider adding rest days to prevent employee burnout',
        metadata: {
          burnoutRiskCount: burnoutRiskEmployees.length,
          employees: burnoutRiskEmployees,
        },
        timestamp: new Date(),
      });
    }

    return warnings;
  }

  /**
   * Get warnings by severity
   */
  static groupBySeverity(warnings: ValidationWarning[]) {
    return {
      critical: warnings.filter((w) => w.severity === 'critical'),
      warning: warnings.filter((w) => w.severity === 'warning'),
      info: warnings.filter((w) => w.severity === 'info'),
    };
  }

  /**
   * Get warnings for specific assignment
   */
  static getWarningsForAssignment(
    warnings: ValidationWarning[],
    assignmentId: string
  ): ValidationWarning[] {
    return warnings.filter((w) => w.affectedAssignments.includes(assignmentId));
  }

  /**
   * Get warnings for specific employee
   */
  static getWarningsForEmployee(warnings: ValidationWarning[], employeeId: string): ValidationWarning[] {
    return warnings.filter((w) => w.affectedEmployees.includes(employeeId));
  }

  /**
   * Filter warnings by type
   */
  static filterByType(warnings: ValidationWarning[], type: ValidationWarning['type']): ValidationWarning[] {
    return warnings.filter((w) => w.type === type);
  }
}

export default RealtimeValidationService;
