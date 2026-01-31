import React, { useMemo } from 'react';
import './TimeIndicator.scss';
import type { ScheduleAssignment } from '../../types/scheduleAPI';

interface ScheduleLegendsProps {
  assignments: ScheduleAssignment[];
}

export interface ScheduleFilters {
  statuses?: string[];
  hasViolations?: boolean;
  qualityRange?: [number, number];
  dateRange?: [string, string];
}

export const ScheduleLegend: React.FC<ScheduleLegendsProps> = ({ assignments }) => {
  // Calculate statistics from assignments
  const stats = useMemo(() => {
    const statusCounts = {
      proposed: 0,
      assigned: 0,
      confirmed: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };

    const violationCounts = {
      hard: 0,
      soft: 0,
      warning: 0,
    };

    let totalQualityScore = 0;

    assignments.forEach((a) => {
      if (a.status && statusCounts.hasOwnProperty(a.status)) {
        statusCounts[a.status as keyof typeof statusCounts]++;
      }

      if (a.has_hard_violations) violationCounts.hard++;
      if (a.has_soft_violations) violationCounts.soft++;

      if (a.match_score) totalQualityScore += a.match_score;
    });

    const avgQualityScore =
      assignments.length > 0 ? Math.round(totalQualityScore / assignments.length) : 0;

    return { statusCounts, violationCounts, avgQualityScore };
  }, [assignments]);



  return (
    <div className="schedule-legend">
      <div className="legend-title">Schedule Legend & Status</div>

      {/* Status Legend */}
      <div className="legend-group statuses">
        <div className="legend-title" style={{ marginBottom: 0, marginTop: 0 }}>
          Assignment Status
        </div>

        <div className="legend-item">
          <div className="legend-indicator proposed" />
          <div className="legend-label">
            <div className="label-name">Proposed</div>
            <div className="label-description">{stats.statusCounts.proposed} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator assigned" />
          <div className="legend-label">
            <div className="label-name">Assigned</div>
            <div className="label-description">{stats.statusCounts.assigned} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator confirmed" />
          <div className="legend-label">
            <div className="label-name">Confirmed</div>
            <div className="label-description">{stats.statusCounts.confirmed} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator active" />
          <div className="legend-label">
            <div className="label-name">Active</div>
            <div className="label-description">{stats.statusCounts.active} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator completed" />
          <div className="legend-label">
            <div className="label-name">Completed</div>
            <div className="label-description">{stats.statusCounts.completed} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator cancelled" />
          <div className="legend-label">
            <div className="label-name">Cancelled</div>
            <div className="label-description">{stats.statusCounts.cancelled} assignments</div>
          </div>
        </div>
      </div>

      {/* Violation Legend */}
      <div className="legend-group violations">
        <div className="legend-title" style={{ marginBottom: 0, marginTop: 0 }}>
          Constraint Violations
        </div>

        <div className="legend-item">
          <div className="legend-indicator hard-violation" />
          <div className="legend-label">
            <div className="label-name">Hard Violations</div>
            <div className="label-description">{stats.violationCounts.hard} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator soft-violation" />
          <div className="legend-label">
            <div className="label-name">Soft Violations</div>
            <div className="label-description">{stats.violationCounts.soft} assignments</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator override" />
          <div className="legend-label">
            <div className="label-name">Override Required</div>
            <div className="label-description">Needs approval</div>
          </div>
        </div>
      </div>

      {/* Quality Legend */}
      <div className="legend-group quality">
        <div className="legend-title" style={{ marginBottom: 0, marginTop: 0 }}>
          Match Quality
        </div>

        <div className="legend-item">
          <div className="legend-indicator excellent" />
          <div className="legend-label">
            <div className="label-name">Excellent (80-100%)</div>
            <div className="label-description">Perfect skill match</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator good" />
          <div className="legend-label">
            <div className="label-name">Good (60-79%)</div>
            <div className="label-description">Strong match</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator fair" />
          <div className="legend-label">
            <div className="label-name">Fair (40-59%)</div>
            <div className="label-description">Acceptable match</div>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-indicator poor" />
          <div className="legend-label">
            <div className="label-name">Poor (&lt;40%)</div>
            <div className="label-description">Needs improvement</div>
          </div>
        </div>
      </div>

      {/* Quality Indicator */}
      <div
        style={{
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '4px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
          Average Match Quality
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1976d2' }}>
          {stats.avgQualityScore}%
        </div>
      </div>
    </div>
  );
};

export default ScheduleLegend;
