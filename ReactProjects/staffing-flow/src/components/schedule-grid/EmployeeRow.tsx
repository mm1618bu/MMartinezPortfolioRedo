/**
 * Employee Row Component
 * Displays a single employee's assignments across selected date range
 */

import React, { useMemo } from 'react';
import type { ScheduleAssignment } from '../../types/scheduleAPI';
import { ScheduleCell } from './ScheduleCell';
import './EmployeeRow.css';

interface EmployeeRowProps {
  employeeId: string;
  assignments: ScheduleAssignment[];
  dates: Date[];
  selectedAssignmentId: string | null;
  onAssignmentSelect: (assignmentId: string) => void;
  readOnly?: boolean;
}

export const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employeeId,
  assignments,
  dates,
  selectedAssignmentId,
  onAssignmentSelect,
  readOnly = false,
}) => {
  // Map assignments to dates
  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, ScheduleAssignment[]>();

    dates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      map.set(dateStr, []);
    });

    assignments.forEach((assignment) => {
      const dateStr = assignment.shift_date;
      const existing = map.get(dateStr) || [];
      map.set(dateStr, [...existing, assignment]);
    });

    return map;
  }, [assignments, dates]);

  // Calculate total hours
  const totalHours = useMemo(() => {
    return assignments.reduce((sum, a) => sum + (a.duration_hours || 0), 0);
  }, [assignments]);

  // Count violations
  const violationCount = assignments.filter((a) => a.has_violations).length;

  return (
    <tr className="employee-row">
      <td className="employee-cell">
        <div className="employee-info">
          <strong>{employeeId}</strong>
          {violationCount > 0 && (
            <span className="violation-badge" title={`${violationCount} violation(s)`}>
              ⚠️
            </span>
          )}
          <span className="hours-badge">{totalHours}h</span>
        </div>
      </td>

      {dates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayAssignments = assignmentsByDate.get(dateStr) || [];

        return (
          <td key={dateStr} className="schedule-date-cell">
            <div className="day-assignments">
              {dayAssignments.map((assignment) => (
                <ScheduleCell
                  key={assignment.id}
                  assignment={assignment}
                  isSelected={selectedAssignmentId === assignment.id}
                  onSelect={() => onAssignmentSelect(assignment.id)}
                  readOnly={readOnly}
                />
              ))}
              {dayAssignments.length === 0 && (
                <div className="empty-cell">-</div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
};
