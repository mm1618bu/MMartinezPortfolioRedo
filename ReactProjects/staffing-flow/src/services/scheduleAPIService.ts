/**
 * Schedule Generation API Frontend Service
 * Handles all frontend API calls to the schedule generation backend
 */

import { config } from '../config';
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
  ScheduleExportRequest,
  ScheduleExportResponse,
  ValidateScheduleRequest,
  ValidateScheduleResponse,
} from '../types/scheduleAPI';

/**
 * Schedule API Frontend Service
 */
export class ScheduleAPIService {
  private baseUrl = `${config.api.baseUrl}/schedules`;

  /**
   * Generate a new schedule
   */
  async generateSchedule(request: GenerateScheduleRequest): Promise<GenerateScheduleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate schedule');
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/${scheduleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      return await response.json();
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
      const params = new URLSearchParams();

      if (request.organization_id) params.append('organization_id', request.organization_id);
      if (request.staffing_plan_id) params.append('staffing_plan_id', request.staffing_plan_id);
      if (request.status) params.append('status', request.status);
      if (request.sort_by) params.append('sort_by', request.sort_by);
      if (request.sort_order) params.append('sort_order', request.sort_order);
      if (request.page) params.append('page', request.page.toString());
      if (request.page_size) params.append('page_size', request.page_size.toString());
      if (request.date_from) params.append('date_from', request.date_from);
      if (request.date_to) params.append('date_to', request.date_to);

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    request: UpdateScheduleRequest
  ): Promise<Schedule> {
    try {
      const response = await fetch(`${this.baseUrl}/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Publish a schedule
   */
  async publishSchedule(
    scheduleId: string,
    request: PublishScheduleRequest
  ): Promise<PublishScheduleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${scheduleId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error publishing schedule:', error);
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
      const params = new URLSearchParams();

      if (request.employee_id) params.append('employee_id', request.employee_id);
      if (request.status) params.append('status', request.status);
      if (request.has_violations !== undefined)
        params.append('has_violations', request.has_violations.toString());
      if (request.date_from) params.append('date_from', request.date_from);
      if (request.date_to) params.append('date_to', request.date_to);
      if (request.page) params.append('page', request.page.toString());
      if (request.page_size) params.append('page_size', request.page_size.toString());

      const response = await fetch(`${this.baseUrl}/${request.schedule_id}/assignments?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  /**
   * Get schedule health check
   */
  async getScheduleHealth(scheduleId: string): Promise<ScheduleHealthCheck> {
    try {
      const response = await fetch(`${this.baseUrl}/${scheduleId}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
   * Get schedule statistics
   */
  async getScheduleStatistics(scheduleId: string): Promise<ScheduleStatistics> {
    try {
      const response = await fetch(`${this.baseUrl}/${scheduleId}/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedule statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule statistics:', error);
      throw error;
    }
  }

  /**
   * Compare two schedules
   */
  async compareSchedules(request: CompareSchedulesRequest): Promise<ScheduleComparisonResult> {
    try {
      const response = await fetch(`${this.baseUrl}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to compare schedules');
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating template:', error);
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
      const params = new URLSearchParams({
        organization_id: organizationId,
        include_archived: includeArchived.toString(),
      });

      const response = await fetch(`${this.baseUrl}/templates?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to list templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing templates:', error);
      throw error;
    }
  }

  /**
   * Validate a staffing plan before generation
   */
  async validateSchedule(request: ValidateScheduleRequest): Promise<ValidateScheduleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating schedule:', error);
      throw error;
    }
  }

  /**
   * Export a schedule in various formats
   */
  async exportSchedule(request: ScheduleExportRequest): Promise<ScheduleExportResponse> {
    try {
      // Note: In production, handle file streaming differently
      const response = await fetch(
        `${this.baseUrl}/${request.schedule_id}/export/${request.format}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export schedule as ${request.format}`);
      }

      // For file downloads
      if (request.format === 'pdf' || request.format === 'excel') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule-${request.schedule_id}.${request.format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
      }

      return {
        export_id: `export-${Date.now()}`,
        schedule_id: request.schedule_id,
        format: request.format,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting schedule:', error);
      throw error;
    }
  }

  /**
   * Generate multiple schedules in batch
   */
  async generateBatchSchedules(staffingPlanIds: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/batch/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffing_plan_ids: staffingPlanIds,
          algorithm: 'greedy',
          run_in_parallel: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Batch generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in batch generation:', error);
      throw error;
    }
  }

  /**
   * Format schedule for display
   */
  formatScheduleForDisplay(schedule: Schedule): string {
    return `
Schedule: ${schedule.name}
Status: ${schedule.status}
Coverage: ${schedule.coverage_percentage}%
Quality Score: ${schedule.quality_score || 'N/A'}
Assigned: ${schedule.assigned_shifts}/${schedule.total_shifts}
Violations: ${schedule.constraint_violation_count}
Generated: ${new Date(schedule.created_at).toLocaleDateString()}
    `.trim();
  }

  /**
   * Format statistics for display
   */
  formatStatistics(stats: ScheduleStatistics): Record<string, string> {
    return {
      'Total Shifts': stats.total_shifts.toString(),
      'Assigned Shifts': stats.assigned_shifts.toString(),
      'Coverage': `${stats.coverage_percentage}%`,
      'Employee Count': stats.employee_count.toString(),
      'Avg Hours/Employee': stats.average_hours_per_employee.toFixed(1),
      'Workload Balance': `${stats.workload_balance_score?.toFixed(1) || 'N/A'}%`,
      'Total Violations': stats.total_violations.toString(),
      'Hard Violations': stats.hard_violations.toString(),
      'Soft Violations': stats.soft_violations.toString(),
    };
  }

  /**
   * Get health status color
   */
  getHealthStatusColor(health: ScheduleHealthCheck): string {
    switch (health.overall_health) {
      case 'excellent':
        return '#10b981'; // green
      case 'good':
        return '#3b82f6'; // blue
      case 'fair':
        return '#f59e0b'; // amber
      case 'poor':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  }

  /**
   * Export metrics as JSON
   */
  async exportMetricsAsJSON(scheduleId: string): Promise<string> {
    try {
      const schedule = await this.getSchedule(scheduleId);
      const stats = await this.getScheduleStatistics(scheduleId);
      const health = await this.getScheduleHealth(scheduleId);

      return JSON.stringify(
        {
          schedule,
          statistics: stats,
          health,
          exported_at: new Date().toISOString(),
        },
        null,
        2
      );
    } catch (error) {
      console.error('Error exporting metrics as JSON:', error);
      throw error;
    }
  }

  /**
   * Export metrics as CSV
   */
  async exportMetricsAsCSV(scheduleId: string): Promise<string> {
    try {
      const stats = await this.getScheduleStatistics(scheduleId);

      const headers = Object.keys(stats).join(',');
      const values = Object.values(stats).join(',');

      return `${headers}\n${values}`;
    } catch (error) {
      console.error('Error exporting metrics as CSV:', error);
      throw error;
    }
  }
}

export const scheduleAPIService = new ScheduleAPIService();
