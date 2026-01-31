/**
 * Schedule Grid Controls
 * Toolbar for filtering, viewing modes, and date range selection
 */

import React, { useState } from 'react';
import type { Schedule } from '../../types/scheduleAPI';
import './ScheduleGridControls.css';

interface ScheduleGridControlsProps {
  schedule: Schedule;
  viewMode: 'week' | 'month' | 'full';
  filters: {
    employee: string | null;
    status: string | null;
    showViolations: boolean;
  };
  onViewModeChange: (mode: 'week' | 'month' | 'full') => void;
  onFilterChange: (filters: any) => void;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  readOnly?: boolean;
}

export const ScheduleGridControls: React.FC<ScheduleGridControlsProps> = ({
  schedule,
  viewMode,
  filters,
  onViewModeChange,
  onFilterChange,
  onDateRangeChange,
  readOnly = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState(filters.employee || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [violationsFilter, setViolationsFilter] = useState(filters.showViolations);

  const handleApplyFilters = () => {
    onFilterChange({
      employee: employeeFilter || null,
      status: statusFilter || null,
      showViolations: violationsFilter,
    });
  };

  const handleClearFilters = () => {
    setEmployeeFilter('');
    setStatusFilter('');
    setViolationsFilter(false);
    onFilterChange({
      employee: null,
      status: null,
      showViolations: false,
    });
  };

  // Get unique employees and statuses from assignments
  const employees = Array.from(
    new Set(schedule.assignments?.map((a) => a.employee_id) || [])
  );
  const statuses = Array.from(
    new Set(schedule.assignments?.map((a) => a.status) || [])
  );
  const violationAssignments = schedule.assignments?.filter((a) => a.has_violations) || [];

  return (
    <div className="schedule-grid-controls">
      <div className="controls-top">
        <div className="view-mode-selector">
          <label>View:</label>
          <div className="view-buttons">
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => onViewModeChange('week')}
            >
              Week
            </button>
            <button
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => onViewModeChange('month')}
            >
              Month
            </button>
            <button
              className={`view-btn ${viewMode === 'full' ? 'active' : ''}`}
              onClick={() => onViewModeChange('full')}
            >
              Full Period
            </button>
          </div>
        </div>

        <div className="control-actions">
          <button
            className="btn btn-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters {Object.values(filters).some((v) => v) ? '(active)' : ''}
          </button>
          {!readOnly && (
            <>
              <button className="btn btn-primary">📥 Import</button>
              <button className="btn btn-secondary">⬇️ Export</button>
            </>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-item">
              <label>Employee:</label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((empId) => (
                  <option key={empId} value={empId}>
                    {empId}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={violationsFilter}
                  onChange={(e) => setViolationsFilter(e.target.checked)}
                />
                Show Only Violations {violationAssignments.length > 0 && `(${violationAssignments.length})`}
              </label>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-sm btn-primary" onClick={handleApplyFilters}>
              Apply
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleClearFilters}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="controls-stats">
        <span className="stat">
          <strong>{schedule.assigned_shifts}</strong> assigned
        </span>
        <span className="stat">
          <strong>{schedule.unassigned_shifts}</strong> unassigned
        </span>
        <span className="stat">
          <strong>{violationAssignments.length}</strong> violations
        </span>
        <span className="stat">
          Coverage: <strong>{schedule.coverage_percentage}%</strong>
        </span>
      </div>
    </div>
  );
};
