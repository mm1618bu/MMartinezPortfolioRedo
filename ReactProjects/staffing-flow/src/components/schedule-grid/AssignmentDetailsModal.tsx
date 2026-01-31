/**
 * Assignment Details Modal
 * Detailed view of a single shift assignment with constraint information
 */

import React, { useMemo } from 'react';
import type { Schedule } from '../../types/scheduleAPI';
import './AssignmentDetailsModal.css';

interface AssignmentDetailsModalProps {
  schedule: Schedule;
  assignmentId: string;
  onClose: () => void;
  readOnly?: boolean;
}

export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  schedule,
  assignmentId,
  onClose,
  readOnly = false,
}) => {
  const assignment = useMemo(() => {
    return schedule.assignments?.find((a) => a.id === assignmentId);
  }, [schedule.assignments, assignmentId]);

  if (!assignment) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposed: '#2196f3',
      assigned: '#4caf50',
      confirmed: '#8bc34a',
      active: '#ff9800',
      completed: '#9e9e9e',
      cancelled: '#f44336',
    };
    return colors[status] || '#757575';
  };

  const violations = assignment.constraint_violation_details?.violations || [];
  const hardViolations = violations.filter((v: any) => v.severity === 'hard');
  const softViolations = violations.filter((v: any) => v.severity === 'soft');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assignment-details" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assignment Details</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="details-section">
            <h3>Assignment Information</h3>
            <div className="detail-group">
              <div className="detail-item">
                <label>Employee ID</label>
                <span className="value">{assignment.employee_id}</span>
              </div>
              <div className="detail-item">
                <label>Shift Date</label>
                <span className="value">{formatDate(assignment.shift_date)}</span>
              </div>
              <div className="detail-item">
                <label>Shift Time</label>
                <span className="value">
                  {assignment.shift_start_time} - {assignment.shift_end_time}
                </span>
              </div>
              <div className="detail-item">
                <label>Duration</label>
                <span className="value">{assignment.duration_hours} hours</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Status & Quality</h3>
            <div className="detail-group">
              <div className="detail-item">
                <label>Status</label>
                <span
                  className="badge"
                  style={{ backgroundColor: getStatusColor(assignment.status) }}
                >
                  {assignment.status}
                </span>
              </div>
              <div className="detail-item">
                <label>Match Score</label>
                <span className="value">
                  {assignment.match_score?.toFixed(1) || 'N/A'}%
                </span>
              </div>
              <div className="detail-item">
                <label>Skill Match</label>
                <span className="value">
                  {assignment.skill_match_percentage?.toFixed(1) || 'N/A'}%
                </span>
              </div>
              <div className="detail-item">
                <label>Availability Confirmed</label>
                <span className="value">
                  {assignment.availability_confirmed ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          </div>

          {(hardViolations.length > 0 || softViolations.length > 0) && (
            <div className="details-section violations">
              <h3>Constraint Violations</h3>
              {hardViolations.length > 0 && (
                <div className="violation-group hard">
                  <h4>🔴 Hard Violations ({hardViolations.length})</h4>
                  <ul>
                    {hardViolations.map((v: any, idx) => (
                      <li key={idx}>
                        <strong>{v.rule_type}</strong>: {v.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {softViolations.length > 0 && (
                <div className="violation-group soft">
                  <h4>🟡 Soft Violations ({softViolations.length})</h4>
                  <ul>
                    {softViolations.map((v: any, idx) => (
                      <li key={idx}>
                        <strong>{v.rule_type}</strong>: {v.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {assignment.override_required && (
            <div className="details-section warning">
              <h3>⚠️ Override Required</h3>
              <p>{assignment.override_reason}</p>
              {assignment.override_approved_by && (
                <div className="override-status">
                  <strong>Approved by:</strong> {assignment.override_approved_by}
                  <br />
                  <strong>At:</strong> {new Date(assignment.override_approved_at!).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {assignment.notes && (
            <div className="details-section">
              <h3>Notes</h3>
              <p className="notes-text">{assignment.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!readOnly && !assignment.availability_confirmed && (
            <button className="btn btn-primary">Confirm Availability</button>
          )}
          {!readOnly && assignment.override_required && !assignment.override_approved_by && (
            <button className="btn btn-warning">Approve Override</button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
