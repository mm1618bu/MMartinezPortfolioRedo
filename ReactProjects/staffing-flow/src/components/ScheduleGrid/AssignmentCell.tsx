import React, { useState, useCallback } from 'react';
import './AssignmentCell.scss';
import type { ScheduleAssignment } from '../../types/scheduleAPI';

interface AssignmentCellProps {
  assignment: ScheduleAssignment;
  onSelect?: (assignment: ScheduleAssignment) => void;
  onEdit?: (assignment: ScheduleAssignment) => void;
  onDelete?: (assignmentId: string) => void;
  isSelected?: boolean;
  isDragging?: boolean;
}

export const AssignmentCell: React.FC<AssignmentCellProps> = ({
  assignment,
  onSelect,
  onEdit,
  onDelete,
  isSelected,
  isDragging,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = useCallback(() => {
    onSelect?.(assignment);
  }, [assignment, onSelect]);

  const handleEdit = useCallback(() => {
    onEdit?.(assignment);
  }, [assignment, onEdit]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Delete this assignment?')) {
      onDelete?.(assignment.id);
    }
  }, [assignment.id, onDelete]);

  // Determine status styling
  const statusClass = assignment.status || 'proposed';
  const hasHardViolations = assignment.has_hard_violations;
  const hasSoftViolations = assignment.has_soft_violations;

  // Calculate match score indicator
  const matchScore = assignment.match_score || 0;
  const matchScoreClass =
    matchScore >= 80 ? 'high' : matchScore >= 60 ? 'medium' : matchScore >= 40 ? 'low' : 'very-low';

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:mm
  };

  const shiftType = assignment.shift_id?.substring(0, 3).toUpperCase() || 'STD';

  return (
    <div
      className={`assignment-cell ${statusClass} ${hasHardViolations ? 'has-hard-violations' : ''} ${
        hasSoftViolations ? 'has-soft-violations' : ''
      } ${isSelected ? 'selected' : ''} ${
        isDragging ? 'dragging' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      title={`${formatTime(assignment.shift_start_time)}-${formatTime(assignment.shift_end_time)}`}
      draggable
    >
      {matchScore > 0 && (
        <div
          className={`match-score-indicator ${matchScoreClass}`}
          title={`Match: ${matchScore}%`}
        />
      )}

      <div className="cell-time">
        {formatTime(assignment.shift_start_time)}
      </div>

      <div className="cell-shift-type">{shiftType}</div>

      {showDetails && (
        <div className="cell-details">
          <div className="detail-header">Assignment Details</div>

          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{assignment.shift_date}</span>
          </div>

          <div className="detail-row">
            <span className="label">Time:</span>
            <span className="value">
              {formatTime(assignment.shift_start_time)}-{formatTime(assignment.shift_end_time)}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Duration:</span>
            <span className="value">{assignment.duration_hours}h</span>
          </div>

          <div className="detail-row">
            <span className="label">Status:</span>
            <span className="value">{statusClass}</span>
          </div>

          {assignment.match_score !== undefined && (
            <div className="detail-row">
              <span className="label">Match Score:</span>
              <span className="value">{assignment.match_score}%</span>
            </div>
          )}

          {assignment.skill_match_percentage !== undefined && (
            <div className="detail-row">
              <span className="label">Skill Match:</span>
              <span className="value">{assignment.skill_match_percentage}%</span>
            </div>
          )}

          {assignment.constraint_violations_count > 0 && (
            <div className="detail-violations">
              <div className="violation-item">
                {assignment.constraint_violations_count} constraint violation(s)
              </div>
              {hasHardViolations && (
                <div className="violation-item hard">Hard violations present</div>
              )}
              {hasSoftViolations && (
                <div className="violation-item">Soft violations present</div>
              )}
            </div>
          )}

          {assignment.notes && (
            <div className="detail-row">
              <span className="label">Notes:</span>
              <span className="value">{assignment.notes}</span>
            </div>
          )}

          <div className="detail-actions">
            <button className="edit" onClick={handleEdit}>
              Edit
            </button>
            <button className="delete" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentCell;
