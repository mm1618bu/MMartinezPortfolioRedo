/**
 * Schedule Cell Component
 * Individual cell representing a single shift assignment
 */

import React from 'react';
import type { ScheduleAssignment } from '../../types/scheduleAPI';
import './ScheduleCell.css';

interface ScheduleCellProps {
  assignment: ScheduleAssignment;
  isSelected: boolean;
  onSelect: () => void;
  readOnly?: boolean;
}

export const ScheduleCell: React.FC<ScheduleCellProps> = ({
  assignment,
  isSelected,
  onSelect,
  readOnly = false,
}) => {
  const getStatusClass = (status: string) => {
    return `cell-status-${status.toLowerCase()}`;
  };

  const getViolationClass = () => {
    if (assignment.has_violations) {
      return 'has-violations';
    }
    return '';
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  return (
    <div
      className={`schedule-cell ${getStatusClass(assignment.status)} ${getViolationClass()} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={onSelect}
      title={`${assignment.shift_start_time}-${assignment.shift_end_time} (${assignment.duration_hours}h)`}
    >
      <div className="cell-content">
        <span className="shift-time">
          {formatTime(assignment.shift_start_time)} - {formatTime(assignment.shift_end_time)}
        </span>
        {assignment.has_violations && (
          <span className="violation-indicator" title="Has constraint violations">
            ⚠️
          </span>
        )}
        <span className="match-score">
          {assignment.match_score && `${assignment.match_score}%`}
        </span>
      </div>
      <div className="cell-status-bar"></div>
    </div>
  );
};
