import { supabase } from '../lib/supabase';
import type {
  CoverageMetrics,
  DimensionalCoverage,
  AssignmentQualityScore,
  CalculateCoverageRequest,
  CompareSchedulesRequest,
  ScheduleComparison,
  CoverageAlert,
  CoverageAnalysisReport,
} from '../../src/types/coverageScore';
import type { ScheduleGenerationResult, GeneratedAssignment } from '../types/scheduleGeneration';

/**
 * Coverage Score Calculation Service
 * Evaluates schedule quality across multiple dimensions
 */

export const coverageScoringService = {
  /**
   * Calculate comprehensive coverage metrics for a schedule
   */
  async calculateCoverage(request: CalculateCoverageRequest): Promise<CoverageMetrics> {
    try {
      let schedule: ScheduleGenerationResult;

      if (request.schedule_result) {
        // Use provided schedule
        schedule = request.schedule_result as any;
      } else if (request.schedule_id) {
        // Fetch schedule from database
        const { data, error } = await supabase
          .from('generated_schedules')
          .select('schedule_data')
          .eq('schedule_id', request.schedule_id)
          .single();

        if (error || !data) throw new Error('Schedule not found');
        schedule = data.schedule_data;
      } else {
        throw new Error('Either schedule_id or schedule_result is required');
      }

      // Calculate quality scores for each assignment
      const assignmentScores = this.calculateAssignmentScores(schedule.assignments);

      // Calculate dimensional coverage
      const rolesCoverage = this.calculateDimensionalCoverage(
        schedule.assignments,
        'role',
        assignmentScores
      );
      const deptsCoverage = this.calculateDimensionalCoverage(
        schedule.assignments,
        'department',
        assignmentScores
      );
      const typeCoverage = this.calculateDimensionalCoverage(
        schedule.assignments,
        'shift_type',
        assignmentScores
      );
      const periodCoverage = this.calculateDimensionalCoverage(
        schedule.assignments,
        'time_period',
        assignmentScores
      );
      const priorityCoverage = this.calculateDimensionalCoverage(
        schedule.assignments,
        'priority',
        assignmentScores
      );

      // Calculate workload distribution
      const workloadDist = this.calculateWorkloadDistribution(schedule.assignments);

      // Calculate constraint distribution
      const constraintDist = this.calculateConstraintDistribution(schedule.assignments);

      // Calculate average quality
      const avgQuality =
        assignmentScores.length > 0
          ? assignmentScores.reduce((sum, s) => sum + s.combined_score, 0) / assignmentScores.length
          : 0;

      // Count critical shifts
      const criticalShifts = schedule.assignments.filter(
        (a: any) => a.shift_priority === 'critical' || a.assignment_date
      );
      const criticalAssigned = criticalShifts.filter((a: any) => a.status === 'assigned' || a.status === 'conflict');

      // Calculate score components
      const coverageComponent = Math.min(100, (schedule.coverage_percentage / 100) * 100);
      const qualityComponent = avgQuality;
      const balanceComponent = workloadDist.workload_balance_score;
      const priorityComponent = criticalShifts.length > 0 ? (criticalAssigned.length / criticalShifts.length) * 100 : 100;

      // Weights
      const weights = {
        coverage: 40,
        quality: 35,
        balance: 15,
        priority: 10,
      };

      const overallScore = Math.round(
        (coverageComponent * weights.coverage +
          qualityComponent * weights.quality +
          balanceComponent * weights.balance +
          priorityComponent * weights.priority) /
          100
      );

      return {
        schedule_id: schedule.schedule_id,
        organization_id: request.organization_id,
        department_id: request.department_id,
        total_shifts: schedule.total_shifts,
        assigned_shifts: schedule.assigned_shifts,
        unassigned_shifts: schedule.unassigned_shifts,
        coverage_percentage: schedule.coverage_percentage,
        average_assignment_quality: Math.round(avgQuality),
        total_constraint_violations: schedule.total_hard_violations + schedule.total_soft_violations,
        critical_shifts_covered: criticalAssigned.length,
        critical_coverage_percentage: criticalShifts.length > 0 ? (criticalAssigned.length / criticalShifts.length) * 100 : 100,
        coverage_by_role: rolesCoverage,
        coverage_by_department: deptsCoverage,
        coverage_by_shift_type: typeCoverage,
        coverage_by_time_period: periodCoverage,
        coverage_by_priority: priorityCoverage,
        workload_distribution: workloadDist,
        constraint_distribution: constraintDist,
        overall_coverage_score: overallScore,
        score_components: {
          coverage_component: Math.round(coverageComponent),
          quality_component: Math.round(qualityComponent),
          balance_component: Math.round(balanceComponent),
          priority_component: Math.round(priorityComponent),
        },
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating coverage:', error);
      throw error;
    }
  },

  /**
   * Calculate quality score for each assignment
   */
  calculateAssignmentScores(assignments: GeneratedAssignment[]): AssignmentQualityScore[] {
    return assignments
      .filter(a => a.status !== 'unassigned')
      .map(a => {
        // Match score (0-100): based on role match and skills
        const matchScore = a.assignment_score || 0;

        // Constraint violation score: penalize for violations
        const hardViolations = a.violations.filter(v => v.severity === 'hard').length;
        const softViolations = a.violations.filter(v => v.severity === 'soft').length;
        const constraintScore = Math.max(0, 100 - hardViolations * 25 - softViolations * 5);

        // Workload balance score: prefer employees with fewer assignments
        const workloadScore = 100 - Math.min(50, Math.max(0, (assignments.filter(x => x.employee_id === a.employee_id && x.status !== 'unassigned').length - 1) * 5));

        // Priority fulfillment: bonus for covering high-priority shifts
        const priorityBonus = a.assignment_date ? 10 : 0;

        // Combined score: weighted average
        const combinedScore = Math.round(
          (matchScore * 0.4 + constraintScore * 0.35 + workloadScore * 0.15 + priorityBonus) / 1.0
        );

        return {
          assignment_id: a.assignment_id || `assign_${a.shift_id}_${a.employee_id}`,
          employee_id: a.employee_id,
          shift_id: a.shift_id,
          match_score: Math.round(matchScore),
          constraint_violation_score: Math.round(constraintScore),
          workload_balance_score: Math.round(workloadScore),
          priority_fulfillment: 100,
          combined_score: combinedScore,
        };
      });
  },

  /**
   * Calculate coverage by a specific dimension
   */
  calculateDimensionalCoverage(
    assignments: GeneratedAssignment[],
    dimension: 'role' | 'department' | 'shift_type' | 'time_period' | 'priority',
    assignmentScores: AssignmentQualityScore[]
  ): DimensionalCoverage[] {
    const groupedByDimension = new Map<string, GeneratedAssignment[]>();

    // Group assignments by dimension
    for (const assignment of assignments) {
      let dimensionValue: string;

      switch (dimension) {
        case 'role':
          dimensionValue = assignment.assigned_role || 'general';
          break;
        case 'department':
          dimensionValue = assignment.department_id || 'unknown';
          break;
        case 'shift_type':
          dimensionValue = assignment.shift_start_time && assignment.shift_end_time
            ? `${assignment.shift_start_time}-${assignment.shift_end_time}`
            : 'unknown';
          break;
        case 'time_period':
          // Categorize by date
          const date = new Date(assignment.assignment_date);
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
          dimensionValue = dayOfWeek;
          break;
        case 'priority':
          dimensionValue = 'standard'; // Default if not specified in assignment
          break;
        default:
          dimensionValue = 'unknown';
      }

      if (!groupedByDimension.has(dimensionValue)) {
        groupedByDimension.set(dimensionValue, []);
      }
      groupedByDimension.get(dimensionValue)!.push(assignment);
    }

    // Calculate coverage for each dimension value
    const coverages: DimensionalCoverage[] = [];

    for (const [dimensionValue, groupAssignments] of groupedByDimension.entries()) {
      const assigned = groupAssignments.filter(a => a.status !== 'unassigned').length;
      const avgQuality = this.calculateAverageQuality(
        groupAssignments.filter(a => a.status !== 'unassigned'),
        assignmentScores
      );

      const gaps = groupAssignments
        .filter(a => a.status === 'unassigned')
        .map(a => `${a.shift_id} on ${a.assignment_date}`);

      coverages.push({
        dimension,
        dimension_value: dimensionValue,
        total_shifts: groupAssignments.length,
        covered_shifts: assigned,
        coverage_percentage: Math.round((assigned / groupAssignments.length) * 100),
        average_quality_score: avgQuality,
        gaps: gaps.slice(0, 5), // Top 5 gaps
      });
    }

    return coverages.sort((a, b) => b.coverage_percentage - a.coverage_percentage);
  },

  /**
   * Calculate workload distribution metrics
   */
  calculateWorkloadDistribution(assignments: GeneratedAssignment[]): {
    avg_shifts_per_employee: number;
    std_deviation_shifts: number;
    max_shifts_single_employee: number;
    min_shifts_single_employee: number;
    workload_balance_score: number;
  } {
    const employeeShifts = new Map<string, number>();

    // Count shifts per employee
    for (const assignment of assignments) {
      if (assignment.status !== 'unassigned') {
        employeeShifts.set(assignment.employee_id, (employeeShifts.get(assignment.employee_id) || 0) + 1);
      }
    }

    const shiftsArray = Array.from(employeeShifts.values());
    if (shiftsArray.length === 0) {
      return {
        avg_shifts_per_employee: 0,
        std_deviation_shifts: 0,
        max_shifts_single_employee: 0,
        min_shifts_single_employee: 0,
        workload_balance_score: 100,
      };
    }

    const avg = shiftsArray.reduce((a, b) => a + b, 0) / shiftsArray.length;
    const variance = shiftsArray.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / shiftsArray.length;
    const stdDev = Math.sqrt(variance);
    const max = Math.max(...shiftsArray);
    const min = Math.min(...shiftsArray);

    // Balance score: higher is more balanced (lower std dev)
    // Perfect balance would have std dev of 0
    const balanceScore = Math.max(0, 100 - stdDev * 10);

    return {
      avg_shifts_per_employee: Math.round(avg * 10) / 10,
      std_deviation_shifts: Math.round(stdDev * 10) / 10,
      max_shifts_single_employee: max,
      min_shifts_single_employee: min,
      workload_balance_score: Math.round(balanceScore),
    };
  },

  /**
   * Calculate constraint violation distribution
   */
  calculateConstraintDistribution(assignments: GeneratedAssignment[]): {
    hard_violations: number;
    soft_violations: number;
    warning_violations: number;
    most_common_violation: string;
  } {
    let hardCount = 0;
    let softCount = 0;
    let warningCount = 0;
    const violationTypes = new Map<string, number>();

    for (const assignment of assignments) {
      for (const violation of assignment.violations) {
        if (violation.severity === 'hard') hardCount++;
        else if (violation.severity === 'soft') softCount++;
        else if (violation.severity === 'warning') warningCount++;

        violationTypes.set(violation.violation_type, (violationTypes.get(violation.violation_type) || 0) + 1);
      }
    }

    // Find most common violation
    let mostCommon = 'none';
    let maxCount = 0;
    for (const [type, count] of violationTypes.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }

    return {
      hard_violations: hardCount,
      soft_violations: softCount,
      warning_violations: warningCount,
      most_common_violation: mostCommon,
    };
  },

  /**
   * Calculate average quality score for a set of assignments
   */
  calculateAverageQuality(assignments: GeneratedAssignment[], scores: AssignmentQualityScore[]): number {
    if (assignments.length === 0) return 0;

    const relevantScores = scores.filter(s =>
      assignments.some(a => a.assignment_id === s.assignment_id || (a.shift_id === s.shift_id && a.employee_id === s.employee_id))
    );

    if (relevantScores.length === 0) return 0;

    const avgScore =
      relevantScores.reduce((sum, s) => sum + s.combined_score, 0) / relevantScores.length;
    return Math.round(avgScore);
  },

  /**
   * Generate coverage analysis report with alerts and recommendations
   */
  async generateCoverageReport(metrics: CoverageMetrics): Promise<CoverageAnalysisReport> {
    const alerts: CoverageAlert[] = [];
    const recommendations: string[] = [];

    // Alert on low coverage
    if (metrics.coverage_percentage < 70) {
      alerts.push({
        severity: 'critical',
        type: 'low_coverage',
        message: `Schedule has only ${metrics.coverage_percentage}% coverage. ${metrics.unassigned_shifts} shifts remain unassigned.`,
        recommended_action: 'Review available employees or extend assignment window to cover remaining shifts.',
      });
      recommendations.push(`Add ${Math.ceil(metrics.unassigned_shifts * 0.5)} employees or extend scheduling period`);
    } else if (metrics.coverage_percentage < 85) {
      alerts.push({
        severity: 'warning',
        type: 'low_coverage',
        message: `Schedule has ${metrics.coverage_percentage}% coverage. Consider additional assignments.`,
        recommended_action: 'Review remaining unassigned shifts and employee availability.',
      });
    }

    // Alert on low critical coverage
    if (metrics.critical_coverage_percentage < 100) {
      alerts.push({
        severity: 'critical',
        type: 'critical_shifts_uncovered',
        message: `Only ${metrics.critical_coverage_percentage}% of critical shifts are covered.`,
        recommended_action: 'Prioritize assignment of remaining critical shifts.',
      });
    }

    // Alert on poor quality
    if (metrics.average_assignment_quality < 60) {
      alerts.push({
        severity: 'warning',
        type: 'poor_quality',
        message: `Average assignment quality is low (${metrics.average_assignment_quality}/100).`,
        recommended_action: 'Review assignments for constraint violations and skill mismatches.',
      });
      recommendations.push('Review constraint violations and consider relaxing soft constraints or allowing overrides');
    }

    // Alert on uneven workload
    const workload = metrics.workload_distribution;
    if (workload.std_deviation_shifts > 2) {
      alerts.push({
        severity: 'warning',
        type: 'uneven_workload',
        message: `Workload is uneven (std dev: ${workload.std_deviation_shifts}). ${workload.max_shifts_single_employee} shifts for one employee vs ${workload.min_shifts_single_employee} for another.`,
        recommended_action: 'Rebalance assignments to better distribute workload among employees.',
      });
      recommendations.push('Rebalance shifts between employees to improve fairness');
    }

    // Alert on constraint violations
    if (metrics.constraint_distribution.hard_violations > 0) {
      alerts.push({
        severity: 'warning',
        type: 'hard_violations',
        message: `${metrics.constraint_distribution.hard_violations} hard constraint violations present.`,
        recommended_action: 'Review and resolve hard violations or use override approvals.',
      });
    }

    // Check role coverage
    const lowRoleCoverage = metrics.coverage_by_role.filter(r => r.coverage_percentage < 80);
    if (lowRoleCoverage.length > 0) {
      recommendations.push(
        `Improve coverage for roles: ${lowRoleCoverage.map(r => r.dimension_value).join(', ')}`
      );
    }

    // Check time period coverage
    const lowPeriodCoverage = metrics.coverage_by_time_period.filter(p => p.coverage_percentage < 75);
    if (lowPeriodCoverage.length > 0) {
      recommendations.push(
        `Low coverage during: ${lowPeriodCoverage.map(p => p.dimension_value).join(', ')}`
      );
    }

    // Determine health status
    const score = metrics.overall_coverage_score;
    const healthStatus: 'excellent' | 'good' | 'fair' | 'poor' =
      score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 55 ? 'fair' : 'poor';

    return {
      schedule_id: metrics.schedule_id,
      metrics,
      alerts,
      recommendations,
      health_status: healthStatus,
      generated_at: new Date().toISOString(),
    };
  },

  /**
   * Compare two schedules
   */
  async compareSchedules(request: CompareSchedulesRequest): Promise<ScheduleComparison> {
    // Fetch both schedules
    const [schedule1Data, schedule2Data] = await Promise.all([
      supabase
        .from('generated_schedules')
        .select('schedule_data')
        .eq('schedule_id', request.schedule_id_1)
        .single(),
      supabase
        .from('generated_schedules')
        .select('schedule_data')
        .eq('schedule_id', request.schedule_id_2)
        .single(),
    ]);

    if (!schedule1Data.data || !schedule2Data.data) {
      throw new Error('One or both schedules not found');
    }

    // Calculate coverage for both
    const coverage1 = await this.calculateCoverage({
      organization_id: request.organization_id,
      schedule_result: schedule1Data.data.schedule_data,
    });

    const coverage2 = await this.calculateCoverage({
      organization_id: request.organization_id,
      schedule_result: schedule2Data.data.schedule_data,
    });

    // Calculate improvements
    const coverageImprovement = coverage2.coverage_percentage - coverage1.coverage_percentage;
    const qualityImprovement = coverage2.average_assignment_quality - coverage1.average_assignment_quality;
    const balanceImprovement = coverage2.workload_distribution.workload_balance_score - coverage1.workload_distribution.workload_balance_score;
    const overallImprovement = coverage2.overall_coverage_score - coverage1.overall_coverage_score;

    // Determine which is better by metric
    const betterByMetric: Record<string, 'schedule_1' | 'schedule_2'> = {
      coverage: coverageImprovement > 0 ? 'schedule_2' : 'schedule_1',
      quality: qualityImprovement > 0 ? 'schedule_2' : 'schedule_1',
      balance: balanceImprovement > 0 ? 'schedule_2' : 'schedule_1',
      violations: coverage2.total_constraint_violations < coverage1.total_constraint_violations ? 'schedule_2' : 'schedule_1',
      critical_coverage: coverage2.critical_coverage_percentage > coverage1.critical_coverage_percentage ? 'schedule_2' : 'schedule_1',
    };

    // Recommendation
    const recommendation =
      overallImprovement > 5
        ? `Schedule 2 is significantly better (${overallImprovement.toFixed(1)} point improvement)`
        : overallImprovement > 0
          ? `Schedule 2 is slightly better (${overallImprovement.toFixed(1)} point improvement)`
          : overallImprovement < -5
            ? `Schedule 1 is significantly better (${Math.abs(overallImprovement).toFixed(1)} point advantage)`
            : `Schedules are comparable with minor differences`;

    return {
      schedule_1_id: request.schedule_id_1,
      schedule_2_id: request.schedule_id_2,
      coverage_improvement: Math.round(coverageImprovement * 100) / 100,
      quality_improvement: Math.round(qualityImprovement * 100) / 100,
      balance_improvement: Math.round(balanceImprovement * 100) / 100,
      overall_score_improvement: Math.round(overallImprovement * 100) / 100,
      better_by_role: {}, // TODO: detailed role analysis
      better_by_metric: betterByMetric,
      recommendation,
    };
  },
};
