import { config } from '../config';
import type {
  ScheduleGenerationRequest,
  ScheduleGenerationResult,
} from '../types/scheduleGeneration';

/**
 * Frontend service for schedule generation
 * Handles API communication with backend scheduling service
 */
export class ScheduleGenerationService {
  private apiUrl = `${config.api.baseUrl}/schedule-generation`;

  /**
   * Generate a new schedule using greedy algorithm
   */
  async generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduleGenerationResult> {
    try {
      const response = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Retrieve a previously generated schedule
   */
  async getSchedule(scheduleId: string): Promise<ScheduleGenerationResult> {
    try {
      const response = await fetch(`${this.apiUrl}/schedules/${scheduleId}`);

      if (!response.ok) {
        throw new Error('Failed to retrieve schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving schedule:', error);
      throw error;
    }
  }

  /**
   * List recent generated schedules for an organization
   */
  async listSchedules(
    organizationId: string,
    limit: number = 10
  ): Promise<ScheduleGenerationResult[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/schedules?organization_id=${organizationId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to list schedules');
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing schedules:', error);
      throw error;
    }
  }

  /**
   * Validate a schedule generation request
   * Returns metrics and potential issues without generating
   */
  async validateSchedule(request: ScheduleGenerationRequest): Promise<{
    total_shifts: number;
    total_employees: number;
    shifts_per_employee: number;
    date_range: { start: string; end: string };
    employee_coverage: { estimated_coverage: number; critical_shifts_coverage: number };
    potential_issues: string[];
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to validate schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating schedule:', error);
      throw error;
    }
  }

  /**
   * Format schedule result for display
   */
  formatScheduleResult(result: ScheduleGenerationResult): {
    summary: string;
    coverageText: string;
    violationsText: string;
    statusBadge: 'success' | 'warning' | 'error';
  } {
    const coverage = result.coverage_percentage;
    let statusBadge: 'success' | 'warning' | 'error' = 'success';

    if (coverage < 70) {
      statusBadge = 'error';
    } else if (coverage < 90) {
      statusBadge = 'warning';
    }

    const coverageText =
      coverage === 100
        ? 'All shifts covered'
        : coverage >= 90
          ? 'High coverage'
          : coverage >= 70
            ? 'Partial coverage'
            : 'Low coverage';

    const violationsText =
      result.total_hard_violations === 0 && result.total_soft_violations === 0
        ? 'No constraint violations'
        : `${result.total_hard_violations} hard, ${result.total_soft_violations} soft violations`;

    return {
      summary: `Generated ${result.assigned_shifts}/${result.total_shifts} assignments in ${result.generation_time_ms}ms`,
      coverageText,
      violationsText,
      statusBadge,
    };
  }

  /**
   * Export schedule as CSV
   */
  exportScheduleAsCSV(result: ScheduleGenerationResult): string {
    const headers = [
      'Shift ID',
      'Employee',
      'Date',
      'Start Time',
      'End Time',
      'Role',
      'Status',
      'Score',
      'Violations',
    ];

    const rows = result.assignments.map(a => [
      a.shift_id,
      a.employee_name,
      a.assignment_date,
      a.shift_start_time,
      a.shift_end_time,
      a.assigned_role,
      a.status,
      a.assignment_score.toString(),
      a.violations.length.toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      `Generated: ${result.generated_at}`,
      `Coverage: ${result.coverage_percentage}%`,
      `Total Violations: ${result.total_hard_violations + result.total_soft_violations}`,
    ].join('\n');

    return csv;
  }

  /**
   * Get statistics about a schedule
   */
  getScheduleStatistics(result: ScheduleGenerationResult) {
    const assignedByRole = result.assignments.reduce(
      (acc, a) => {
        if (a.status !== 'unassigned') {
          acc[a.assigned_role] = (acc[a.assigned_role] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const assignedByEmployee = result.assignments.reduce(
      (acc, a) => {
        if (a.status !== 'unassigned') {
          acc[a.employee_name] = (acc[a.employee_name] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const violationsByType = result.assignments.reduce(
      (acc, a) => {
        a.violations.forEach(v => {
          acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total_assigned: result.assigned_shifts,
      total_unassigned: result.unassigned_shifts,
      coverage_percentage: result.coverage_percentage,
      assigned_by_role: assignedByRole,
      assigned_by_employee: assignedByEmployee,
      violations_by_type: violationsByType,
      average_assignment_score:
        result.assignments.length > 0
          ? result.assignments.reduce((sum, a) => sum + a.assignment_score, 0) / result.assignments.length
          : 0,
    };
  }
}

export const scheduleGenerationService = new ScheduleGenerationService();
