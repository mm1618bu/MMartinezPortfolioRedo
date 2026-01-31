import { config } from '../config';
import type {
  CoverageMetrics,
  CoverageAnalysisReport,
  ScheduleComparison,
  CalculateCoverageRequest,
  CompareSchedulesRequest,
} from '../types/coverageScore';

/**
 * Frontend service for coverage score calculations
 * Handles API communication with backend coverage scoring service
 */
export class CoverageScoringService {
  private apiUrl = `${config.api.baseUrl}/coverage-scoring`;

  /**
   * Calculate coverage metrics for a schedule
   */
  async calculateCoverage(request: CalculateCoverageRequest): Promise<CoverageMetrics> {
    try {
      const response = await fetch(`${this.apiUrl}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate coverage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating coverage:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive coverage analysis report
   */
  async generateCoverageReport(request: CalculateCoverageRequest): Promise<CoverageAnalysisReport> {
    try {
      const response = await fetch(`${this.apiUrl}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate coverage report');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating coverage report:', error);
      throw error;
    }
  }

  /**
   * Compare two schedules
   */
  async compareSchedules(request: CompareSchedulesRequest): Promise<ScheduleComparison> {
    try {
      const response = await fetch(`${this.apiUrl}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to compare schedules');
      }

      return await response.json();
    } catch (error) {
      console.error('Error comparing schedules:', error);
      throw error;
    }
  }

  /**
   * Get coverage score for a specific schedule
   */
  async getScheduleScore(scheduleId: string, organizationId: string): Promise<CoverageMetrics> {
    try {
      const response = await fetch(`${this.apiUrl}/schedules/${scheduleId}/score?org_id=${organizationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch coverage score');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching coverage score:', error);
      throw error;
    }
  }

  /**
   * Get health status and alerts for a schedule
   */
  async getScheduleHealth(scheduleId: string, organizationId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/schedules/${scheduleId}/health?org_id=${organizationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule health');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule health:', error);
      throw error;
    }
  }

  /**
   * Get health status badge color based on score
   */
  getHealthStatusColor(healthStatus: string): 'success' | 'warning' | 'error' | 'info' {
    switch (healthStatus) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Format metrics for display
   */
  formatMetrics(metrics: CoverageMetrics): {
    coverage_text: string;
    quality_text: string;
    balance_text: string;
    overall_text: string;
    coverage_badge: 'success' | 'warning' | 'error';
    quality_badge: 'success' | 'warning' | 'error';
  } {
    const coverage = metrics.coverage_percentage;
    const quality = metrics.average_assignment_quality;
    const balance = metrics.workload_distribution.workload_balance_score;
    const overall = metrics.overall_coverage_score;

    let coverageBadge: 'success' | 'warning' | 'error' = 'success';
    let qualityBadge: 'success' | 'warning' | 'error' = 'success';

    if (coverage < 70) {
      coverageBadge = 'error';
    } else if (coverage < 85) {
      coverageBadge = 'warning';
    }

    if (quality < 60) {
      qualityBadge = 'error';
    } else if (quality < 75) {
      qualityBadge = 'warning';
    }

    return {
      coverage_text: `${coverage.toFixed(1)}% coverage (${metrics.assigned_shifts}/${metrics.total_shifts} shifts)`,
      quality_text: `${quality}/100 average assignment quality`,
      balance_text: `Std Dev: ${balance}/100 workload balance`,
      overall_text: `Overall Score: ${overall}/100`,
      coverage_badge: coverageBadge,
      quality_badge: qualityBadge,
    };
  }

  /**
   * Get comparison summary
   */
  formatComparison(comparison: ScheduleComparison): {
    summary: string;
    better_schedule: string;
    winner_color: string;
  } {
    const improvement = comparison.overall_score_improvement;
    const betterSchedule = improvement > 0 ? 'Schedule 2' : improvement < 0 ? 'Schedule 1' : 'Tied';

    let summary = `${comparison.recommendation}\n`;
    summary += `Coverage: ${improvement > 0 ? '+' : ''}${comparison.coverage_improvement.toFixed(1)}%\n`;
    summary += `Quality: ${improvement > 0 ? '+' : ''}${comparison.quality_improvement.toFixed(1)} points\n`;
    summary += `Workload Balance: ${comparison.balance_improvement > 0 ? '+' : ''}${comparison.balance_improvement.toFixed(1)} points`;

    return {
      summary,
      better_schedule: betterSchedule,
      winner_color: improvement > 5 ? 'green' : improvement > 0 ? 'blue' : improvement < -5 ? 'red' : 'gray',
    };
  }

  /**
   * Get insight message for a coverage metric
   */
  getInsight(metrics: CoverageMetrics): string[] {
    const insights: string[] = [];

    // Coverage insight
    if (metrics.coverage_percentage === 100) {
      insights.push('✓ All shifts are covered');
    } else if (metrics.coverage_percentage >= 95) {
      insights.push('✓ Excellent coverage with minimal gaps');
    } else if (metrics.coverage_percentage >= 85) {
      insights.push('△ Good coverage but with some gaps');
    } else if (metrics.coverage_percentage >= 70) {
      insights.push('⚠ Significant coverage gaps exist');
    } else {
      insights.push('✗ Critical coverage shortage');
    }

    // Quality insight
    if (metrics.average_assignment_quality >= 85) {
      insights.push('✓ High quality assignments with good skill matches');
    } else if (metrics.average_assignment_quality >= 70) {
      insights.push('△ Acceptable assignment quality');
    } else {
      insights.push('⚠ Low assignment quality - review for mismatches');
    }

    // Balance insight
    const workload = metrics.workload_distribution;
    if (workload.std_deviation_shifts < 1) {
      insights.push('✓ Perfectly balanced workload distribution');
    } else if (workload.std_deviation_shifts < 2) {
      insights.push('✓ Well-balanced workload');
    } else if (workload.std_deviation_shifts < 3) {
      insights.push('△ Moderately balanced workload');
    } else {
      insights.push('⚠ Uneven workload distribution');
    }

    // Violations insight
    if (metrics.total_constraint_violations === 0) {
      insights.push('✓ No constraint violations');
    } else if (metrics.constraint_distribution.hard_violations === 0) {
      insights.push(`△ ${metrics.constraint_distribution.soft_violations} soft violations - acceptable with review`);
    } else {
      insights.push(`✗ ${metrics.constraint_distribution.hard_violations} hard violations - require resolution`);
    }

    // Critical shifts insight
    if (metrics.critical_coverage_percentage === 100) {
      insights.push('✓ All critical priority shifts covered');
    } else if (metrics.critical_coverage_percentage > 90) {
      insights.push('✓ Almost all critical shifts covered');
    } else {
      insights.push(`⚠ ${100 - metrics.critical_coverage_percentage}% of critical shifts uncovered`);
    }

    return insights;
  }

  /**
   * Export metrics as JSON
   */
  exportMetricsAsJSON(metrics: CoverageMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Export metrics as CSV
   */
  exportMetricsAsCSV(metrics: CoverageMetrics): string {
    const lines: string[] = [];

    // Header
    lines.push('Coverage Metric,Value');

    // Basic metrics
    lines.push(`Total Shifts,${metrics.total_shifts}`);
    lines.push(`Assigned Shifts,${metrics.assigned_shifts}`);
    lines.push(`Unassigned Shifts,${metrics.unassigned_shifts}`);
    lines.push(`Coverage Percentage,${metrics.coverage_percentage.toFixed(2)}%`);
    lines.push(`Average Quality,${metrics.average_assignment_quality}/100`);
    lines.push(`Overall Score,${metrics.overall_coverage_score}/100`);

    // By role
    lines.push('');
    lines.push('Coverage By Role');
    lines.push('Role,Total,Covered,Coverage %,Avg Quality');
    for (const role of metrics.coverage_by_role) {
      lines.push(
        `${role.dimension_value},${role.total_shifts},${role.covered_shifts},${role.coverage_percentage.toFixed(2)}%,${role.average_quality_score}`
      );
    }

    // Workload
    lines.push('');
    lines.push('Workload Distribution');
    lines.push(`Avg Shifts Per Employee,${metrics.workload_distribution.avg_shifts_per_employee}`);
    lines.push(`Std Deviation,${metrics.workload_distribution.std_deviation_shifts}`);
    lines.push(`Max Shifts,${metrics.workload_distribution.max_shifts_single_employee}`);
    lines.push(`Min Shifts,${metrics.workload_distribution.min_shifts_single_employee}`);
    lines.push(`Balance Score,${metrics.workload_distribution.workload_balance_score}/100`);

    // Violations
    lines.push('');
    lines.push('Constraint Violations');
    lines.push(`Hard Violations,${metrics.constraint_distribution.hard_violations}`);
    lines.push(`Soft Violations,${metrics.constraint_distribution.soft_violations}`);
    lines.push(`Warnings,${metrics.constraint_distribution.warning_violations}`);

    return lines.join('\n');
  }
}

export const coverageScoringService = new CoverageScoringService();
