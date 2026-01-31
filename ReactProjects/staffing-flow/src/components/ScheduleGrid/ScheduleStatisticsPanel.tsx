import React, { useMemo } from 'react';
import '../styles/TimeIndicator.scss';
import type { ScheduleAssignment } from '../../types/scheduleAPI';

interface ScheduleStatisticsPanelProps {
  assignments: ScheduleAssignment[];
  scheduleMetrics?: {
    quality_score?: number;
    coverage_percentage?: number;
    workload_balance_score?: number;
    hard_violation_count?: number;
    soft_violation_count?: number;
    warning_violation_count?: number;
  };
}

export const ScheduleStatisticsPanel: React.FC<ScheduleStatisticsPanelProps> = ({
  assignments,
  scheduleMetrics,
}) => {
  const stats = useMemo(() => {
    const total = assignments.length;
    const assigned = assignments.filter((a) => a.status !== 'proposed').length;
    const withViolations = assignments.filter((a) => a.has_hard_violations || a.has_soft_violations)
      .length;
    const hardViolations = assignments.filter((a) => a.has_hard_violations).length;

    const totalHours = assignments.reduce((sum, a) => sum + (a.duration_hours || 0), 0);
    const avgHours = total > 0 ? totalHours / total : 0;

    const avgMatchScore =
      total > 0
        ? Math.round(assignments.reduce((sum, a) => sum + (a.match_score || 0), 0) / total)
        : 0;

return {
      total,
      assigned,
      unassigned: total - assigned,
      withViolations,
      hardViolations,
      softViolations: withViolations - hardViolations,
      totalHours: totalHours.toFixed(1),
      avgHours: avgHours.toFixed(1),
      avgMatchScore,
      assignmentRate: total > 0 ? Math.round((assigned / total) * 100) : 0,
      violationRate: total > 0 ? Math.round((withViolations / total) * 100) : 0,
    };
  }, [assignments]);

  return (
    <div className="schedule-stats-panel">
      <StatCard
        label="Total Assignments"
        value={stats.total}
        sublabel="shifts in schedule"
      />

      <StatCard
        label="Assignments Made"
        value={stats.assigned}
        sublabel={`${stats.assignmentRate}% coverage`}
        className={stats.assignmentRate >= 90 ? 'success' : stats.assignmentRate >= 70 ? 'warning' : 'error'}
      />

      <StatCard
        label="Unassigned"
        value={stats.unassigned}
        sublabel="open shifts"
        className={stats.unassigned === 0 ? 'success' : 'warning'}
      />

      <StatCard
        label="Avg Match Score"
        value={`${stats.avgMatchScore}%`}
        sublabel="skill matching quality"
        className={stats.avgMatchScore >= 80 ? 'success' : stats.avgMatchScore >= 60 ? 'info' : 'warning'}
      />

      <StatCard
        label="Total Hours"
        value={stats.totalHours}
        sublabel={`avg ${stats.avgHours}h per shift`}
      />

      <StatCard
        label="Hard Violations"
        value={stats.hardViolations}
        sublabel={`${stats.hardViolations > 0 ? 'requires attention' : 'none'}`}
        className={stats.hardViolations > 0 ? 'error' : 'success'}
      />

      <StatCard
        label="Soft Violations"
        value={stats.softViolations}
        sublabel={`${stats.softViolations > 0 ? 'can be overridden' : 'none'}`}
        className={stats.softViolations > 0 ? 'warning' : 'success'}
      />



      {scheduleMetrics?.quality_score !== undefined && (
        <StatCard
          label="Quality Score"
          value={`${Math.round(scheduleMetrics.quality_score)}/100`}
          sublabel="overall schedule quality"
          className={
            scheduleMetrics.quality_score >= 80
              ? 'success'
              : scheduleMetrics.quality_score >= 60
                ? 'info'
                : 'warning'
          }
        />
      )}

      {scheduleMetrics?.coverage_percentage !== undefined && (
        <StatCard
          label="Coverage"
          value={`${Math.round(scheduleMetrics.coverage_percentage)}%`}
          sublabel="shifts covered"
          className={
            scheduleMetrics.coverage_percentage >= 95
              ? 'success'
              : scheduleMetrics.coverage_percentage >= 80
                ? 'info'
                : 'warning'
          }
        />
      )}

      {scheduleMetrics?.workload_balance_score !== undefined && (
        <StatCard
          label="Workload Balance"
          value={`${Math.round(scheduleMetrics.workload_balance_score)}/100`}
          sublabel="employee distribution"
          className={
            scheduleMetrics.workload_balance_score >= 75
              ? 'success'
              : scheduleMetrics.workload_balance_score >= 50
                ? 'info'
                : 'warning'
          }
        />
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  className?: 'success' | 'warning' | 'error' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sublabel, className = 'info' }) => {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${className}`}>{value}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  );
};

export default ScheduleStatisticsPanel;
