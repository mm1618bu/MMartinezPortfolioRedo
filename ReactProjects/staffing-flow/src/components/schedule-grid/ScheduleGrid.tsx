/**
 * Schedule Grid Component
 * Main container for displaying generated schedules in a grid/calendar format
 * Supports viewing, filtering, and basic management of schedule assignments
 */

import React, { useState, useEffect, useMemo } from 'react';
import { scheduleAPIService } from '../../services/scheduleAPIService';
import type { Schedule, ScheduleHealthCheck } from '../../types/scheduleAPI';
import { ScheduleGridHeader } from './ScheduleGridHeader';
import { ScheduleGridControls } from './ScheduleGridControls';
import { ScheduleTable } from './ScheduleTable';
import { ScheduleMetricsPanel } from './ScheduleMetricsPanel';
import { AssignmentDetailsModal } from './AssignmentDetailsModal';
import { ScheduleLegend } from './ScheduleLegend';
import './ScheduleGrid.css';

interface ScheduleGridProps {
  scheduleId?: string;
  organizationId: string;
  readOnly?: boolean;
  onScheduleSelect?: (schedule: Schedule) => void;
}

interface GridState {
  schedule: Schedule | null;
  health: ScheduleHealthCheck | null;
  isLoading: boolean;
  error: string | null;
  selectedAssignmentId: string | null;
  viewMode: 'week' | 'month' | 'full';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    employee: string | null;
    status: string | null;
    showViolations: boolean;
  };
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  scheduleId,
  organizationId,
  readOnly = false,
  onScheduleSelect,
}) => {
  const [state, setState] = useState<GridState>({
    schedule: null,
    health: null,
    isLoading: true,
    error: null,
    selectedAssignmentId: null,
    viewMode: 'month',
    dateRange: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    filters: {
      employee: null,
      status: null,
      showViolations: false,
    },
  });

  // Load schedule data
  useEffect(() => {
    const loadSchedule = async () => {
      if (!scheduleId) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const [schedule, health] = await Promise.all([
          scheduleAPIService.getSchedule(scheduleId),
          scheduleAPIService.getScheduleHealth(scheduleId),
        ]);

        setState((prev) => ({
          ...prev,
          schedule,
          health,
          dateRange: {
            startDate: new Date(schedule.schedule_start_date),
            endDate: new Date(schedule.schedule_end_date),
          },
          isLoading: false,
        }));

        if (onScheduleSelect) {
          onScheduleSelect(schedule);
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: (err as Error).message,
          isLoading: false,
        }));
      }
    };

    loadSchedule();
  }, [scheduleId, onScheduleSelect]);

  // Filter assignments based on current filters
  const filteredAssignments = useMemo(() => {
    if (!state.schedule?.assignments) return [];

    return state.schedule.assignments.filter((assignment) => {
      if (state.filters.employee && assignment.employee_id !== state.filters.employee) {
        return false;
      }
      if (state.filters.status && assignment.status !== state.filters.status) {
        return false;
      }
      if (state.filters.showViolations && !assignment.has_violations) {
        return false;
      }
      return true;
    });
  }, [state.schedule?.assignments, state.filters]);

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setState((prev) => ({
      ...prev,
      dateRange: { startDate, endDate },
    }));
  };

  const handleFilterChange = (filters: typeof state.filters) => {
    setState((prev) => ({ ...prev, filters }));
  };

  const handleViewModeChange = (viewMode: GridState['viewMode']) => {
    setState((prev) => ({ ...prev, viewMode }));
  };

  const handleAssignmentSelect = (assignmentId: string) => {
    setState((prev) => ({ ...prev, selectedAssignmentId: assignmentId }));
  };

  const handleAssignmentClose = () => {
    setState((prev) => ({ ...prev, selectedAssignmentId: null }));
  };

  if (state.isLoading) {
    return (
      <div className="schedule-grid-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="schedule-grid-container error">
        <div className="error-message">
          <h3>Error Loading Schedule</h3>
          <p>{state.error}</p>
        </div>
      </div>
    );
  }

  if (!state.schedule) {
    return (
      <div className="schedule-grid-container">
        <div className="no-schedule">
          <p>No schedule selected. Please select or generate a schedule to view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-grid-container">
      <ScheduleGridHeader schedule={state.schedule} health={state.health} />

      <div className="schedule-grid-content">
        <ScheduleGridControls
          schedule={state.schedule}
          viewMode={state.viewMode}
          filters={state.filters}
          onViewModeChange={handleViewModeChange}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          readOnly={readOnly}
        />

        <div className="schedule-grid-main">
          <ScheduleTable
            schedule={state.schedule}
            assignments={filteredAssignments}
            viewMode={state.viewMode}
            dateRange={state.dateRange}
            selectedAssignmentId={state.selectedAssignmentId}
            onAssignmentSelect={handleAssignmentSelect}
            readOnly={readOnly}
          />

          {state.health && <ScheduleMetricsPanel health={state.health} />}
        </div>

        <ScheduleLegend />
      </div>

      {state.selectedAssignmentId && state.schedule && (
        <AssignmentDetailsModal
          schedule={state.schedule}
          assignmentId={state.selectedAssignmentId}
          onClose={handleAssignmentClose}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};
