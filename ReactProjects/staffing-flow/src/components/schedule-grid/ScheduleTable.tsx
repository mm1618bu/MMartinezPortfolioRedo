/**
 * Schedule Table Component
 * Main grid/table for displaying schedule assignments
 * Supports different view modes (week, month, full period)
 */

import React, { useMemo } from 'react';
import type { Schedule, ScheduleAssignment } from '../../types/scheduleAPI';
import { ScheduleCell } from './ScheduleCell';
import { EmployeeRow } from './EmployeeRow';
import './ScheduleTable.css';

interface ScheduleTableProps {
  schedule: Schedule;
  assignments: ScheduleAssignment[];
  viewMode: 'week' | 'month' | 'full';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  selectedAssignmentId: string | null;
  onAssignmentSelect: (assignmentId: string) => void;
  readOnly?: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule,
  assignments,
  viewMode,
  dateRange,
  selectedAssignmentId,
  onAssignmentSelect,
  readOnly = false,
}) => {
  // Generate array of dates based on view mode
  const displayDates = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Limit visible dates based on view mode
    if (viewMode === 'week' && dates.length > 7) {
      return dates.slice(0, 7);
    }
    if (viewMode === 'month' && dates.length > 31) {
      return dates.slice(0, 31);
    }

    return dates;
  }, [dateRange, viewMode]);

  // Group assignments by employee
  const employeeAssignments = useMemo(() => {
    const grouped = new Map<string, ScheduleAssignment[]>();

    assignments.forEach((assignment) => {
      if (!grouped.has(assignment.employee_id)) {
        grouped.set(assignment.employee_id, []);
      }
      grouped.get(assignment.employee_id)!.push(assignment);
    });

    return grouped;
  }, [assignments]);

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="schedule-table-container">
      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="employee-col">Employee</th>
              {displayDates.map((date) => (
                <th key={date.toISOString()} className="date-col">
                  <div className="date-header">
                    <span className="day-of-week">{getDayOfWeek(date)}</span>
                    <span className="date">{formatDateHeader(date)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(employeeAssignments.entries()).map(([employeeId, employeeAssigns]) => (
              <EmployeeRow
                key={employeeId}
                employeeId={employeeId}
                assignments={employeeAssigns}
                dates={displayDates}
                selectedAssignmentId={selectedAssignmentId}
                onAssignmentSelect={onAssignmentSelect}
                readOnly={readOnly}
              />
            ))}
            {employeeAssignments.size === 0 && (
              <tr>
                <td colSpan={displayDates.length + 1} className="empty-state">
                  No assignments to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="schedule-table-info">
        <p>
          Showing {displayDates.length} days, {employeeAssignments.size} employees, {assignments.length}{' '}
          assignments
        </p>
      </div>
    </div>
  );
};
