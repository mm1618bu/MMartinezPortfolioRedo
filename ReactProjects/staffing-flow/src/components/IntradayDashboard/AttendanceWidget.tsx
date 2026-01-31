/**
 * Attendance Widget Component
 * Displays real-time attendance metrics and recent check-ins
 */

import React from 'react';
import type { AttendanceUpdatePayload } from '../../../api/types/websocket';
import './AttendanceWidget.scss';

interface AttendanceWidgetProps {
  data: AttendanceUpdatePayload | null;
  isLoading?: boolean;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="attendance-widget loading">
        <div className="skeleton-loader large"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="attendance-widget no-data">
        <p>No attendance data available</p>
      </div>
    );
  }

  const totalStaff = data.scheduled_count;
  const attendancePercentage = data.attendance_rate;

  return (
    <div className="attendance-widget">
      <div className="attendance-overview">
        <div className="attendance-ring-container">
          <svg className="attendance-ring" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="20"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#4caf50"
              strokeWidth="20"
              strokeDasharray={`${(attendancePercentage / 100) * 440} 440`}
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div className="ring-center">
            <div className="attendance-percentage">
              {attendancePercentage.toFixed(1)}%
            </div>
            <div className="attendance-label">Attendance</div>
          </div>
        </div>

        <div className="attendance-breakdown">
          <div className="status-item present">
            <span className="status-icon">✓</span>
            <span className="status-label">Present</span>
            <span className="status-value">{data.present_count}</span>
          </div>
          <div className="status-item absent">
            <span className="status-icon">✗</span>
            <span className="status-label">Absent</span>
            <span className="status-value">{data.absent_count}</span>
          </div>
          <div className="status-item late">
            <span className="status-icon">⏰</span>
            <span className="status-label">Late</span>
            <span className="status-value">{data.late_count}</span>
          </div>
          <div className="status-item total">
            <span className="status-icon">👥</span>
            <span className="status-label">Scheduled</span>
            <span className="status-value">{totalStaff}</span>
          </div>
        </div>
      </div>

      <div className="recent-checkins">
        <h4>Recent Check-ins</h4>
        {data.recent_checkins.length > 0 ? (
          <div className="checkin-list">
            {data.recent_checkins.slice(0, 5).map((checkin, index) => (
              <div key={`${checkin.employee_id}-${index}`} className="checkin-item">
                <div className="checkin-avatar">
                  {checkin.employee_name.charAt(0).toUpperCase()}
                </div>
                <div className="checkin-info">
                  <div className="checkin-name">{checkin.employee_name}</div>
                  <div className="checkin-time">
                    {new Date(checkin.checked_in_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className={`checkin-status status-${checkin.status}`}>
                  {checkin.status === 'present' ? '✓' : '⏰'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-checkins">
            <p>No recent check-ins</p>
          </div>
        )}
      </div>

      <div className="attendance-footer">
        <span className="last-update">
          Updated {new Date(data.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default AttendanceWidget;
