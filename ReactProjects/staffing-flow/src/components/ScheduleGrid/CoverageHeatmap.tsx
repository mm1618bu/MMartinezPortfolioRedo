import React, { useMemo, useState } from 'react';
import type { Schedule, ScheduleAssignment } from '../../types/scheduleAPI';
import './CoverageHeatmap.scss';

interface CoverageHeatmapProps {
  schedule: Schedule;
  assignments: ScheduleAssignment[];
  viewMode?: 'hourly' | 'daily' | 'weekly';
  showLegend?: boolean;
  onCellClick?: (date: string, hour?: number) => void;
}

interface CoverageData {
  date: string;
  hour?: number;
  count: number;
  percentage: number;
  assignments: ScheduleAssignment[];
}

interface HeatmapCell {
  date: string;
  hour?: number;
  coverage: CoverageData;
  severity: 'critical' | 'low' | 'medium' | 'good' | 'excellent';
  color: string;
}

export const CoverageHeatmap: React.FC<CoverageHeatmapProps> = ({
  schedule,
  assignments,
  viewMode = 'daily',
  showLegend = true,
  onCellClick,
}) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Calculate coverage data based on view mode
  const coverageData = useMemo(() => {
    const data: CoverageData[] = [];

    if (viewMode === 'hourly') {
      // Hourly breakdown for each day
      const start = new Date(schedule.schedule_start_date);
      const end = new Date(schedule.schedule_end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        for (let hour = 0; hour < 24; hour++) {
          const hourAssignments = assignments.filter((a) => {
            if (a.shift_date !== dateStr) return false;

            const startHour = parseInt(a.shift_start_time.split(':')[0]);
            const endHour = parseInt(a.shift_end_time.split(':')[0]);

            return hour >= startHour && hour < endHour;
          });

          data.push({
            date: dateStr,
            hour,
            count: hourAssignments.length,
            percentage: (hourAssignments.length / Math.max(1, assignments.length)) * 100,
            assignments: hourAssignments,
          });
        }
      }
    } else if (viewMode === 'daily') {
      // Daily coverage
      const start = new Date(schedule.schedule_start_date);
      const end = new Date(schedule.schedule_end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayAssignments = assignments.filter((a) => a.shift_date === dateStr);

        data.push({
          date: dateStr,
          count: dayAssignments.length,
          percentage: (dayAssignments.length / Math.max(1, assignments.length / 7)) * 100,
          assignments: dayAssignments,
        });
      }
    } else {
      // Weekly coverage
      const start = new Date(schedule.schedule_start_date);
      const end = new Date(schedule.schedule_end_date);

      let weekStart = new Date(start);
      while (weekStart <= end) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekAssignments = assignments.filter((a) => {
          const assignmentDate = new Date(a.shift_date);
          return assignmentDate >= weekStart && assignmentDate <= weekEnd;
        });

        data.push({
          date: weekStart.toISOString().split('T')[0],
          count: weekAssignments.length,
          percentage: (weekAssignments.length / Math.max(1, assignments.length / 4)) * 100,
          assignments: weekAssignments,
        });

        weekStart.setDate(weekStart.getDate() + 7);
      }
    }

    return data;
  }, [schedule, assignments, viewMode]);

  // Convert coverage data to heatmap cells
  const heatmapCells = useMemo(() => {
    return coverageData.map((coverage): HeatmapCell => {
      let severity: HeatmapCell['severity'];
      let color: string;

      if (coverage.count === 0) {
        severity = 'critical';
        color = '#f44336';
      } else if (coverage.count < 2) {
        severity = 'low';
        color = '#ff9800';
      } else if (coverage.count < 4) {
        severity = 'medium';
        color = '#ffc107';
      } else if (coverage.count < 6) {
        severity = 'good';
        color = '#4caf50';
      } else {
        severity = 'excellent';
        color = '#2e7d32';
      }

      return {
        date: coverage.date,
        hour: coverage.hour,
        coverage,
        severity,
        color,
      };
    });
  }, [coverageData]);

  // Group cells by date for daily/hourly views
  const cellsByDate = useMemo(() => {
    const grouped = new Map<string, HeatmapCell[]>();

    heatmapCells.forEach((cell) => {
      if (!grouped.has(cell.date)) {
        grouped.set(cell.date, []);
      }
      grouped.get(cell.date)!.push(cell);
    });

    return grouped;
  }, [heatmapCells]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = heatmapCells.length;
    const critical = heatmapCells.filter((c) => c.severity === 'critical').length;
    const low = heatmapCells.filter((c) => c.severity === 'low').length;
    const medium = heatmapCells.filter((c) => c.severity === 'medium').length;
    const good = heatmapCells.filter((c) => c.severity === 'good').length;
    const excellent = heatmapCells.filter((c) => c.severity === 'excellent').length;

    const avgCoverage =
      heatmapCells.reduce((sum, c) => sum + c.coverage.count, 0) / heatmapCells.length;

    return {
      total,
      critical,
      low,
      medium,
      good,
      excellent,
      avgCoverage: avgCoverage.toFixed(1),
      coverageScore: Math.round(((good + excellent) / total) * 100),
    };
  }, [heatmapCells]);

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell);
    onCellClick?.(cell.date, cell.hour);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="coverage-heatmap">
      {/* Header */}
      <div className="heatmap-header">
        <div className="header-title">
          <h3>Coverage Heatmap</h3>
          <span className="view-mode-badge">{viewMode}</span>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="label">Avg Coverage:</span>
            <span className="value">{stats.avgCoverage}</span>
          </div>
          <div className="stat">
            <span className="label">Score:</span>
            <span className={`value ${stats.coverageScore >= 80 ? 'good' : 'warning'}`}>
              {stats.coverageScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className={`heatmap-container ${viewMode}-view`}>
        {viewMode === 'hourly' ? (
          // Hourly view: dates as rows, hours as columns
          <div className="hourly-heatmap">
            <div className="hour-labels">
              <div className="corner-label">Date / Hour</div>
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                <div key={hour} className="hour-label">
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            <div className="heatmap-rows">
              {Array.from(cellsByDate.entries()).map(([date, cells]) => (
                <div key={date} className="heatmap-row">
                  <div className="row-label">{formatDate(date)}</div>
                  {cells.map((cell) => (
                    <div
                      key={`${cell.date}-${cell.hour}`}
                      className={`heatmap-cell ${cell.severity} ${
                        selectedCell?.date === cell.date && selectedCell?.hour === cell.hour
                          ? 'selected'
                          : ''
                      } ${
                        hoveredCell?.date === cell.date && hoveredCell?.hour === cell.hour
                          ? 'hovered'
                          : ''
                      }`}
                      style={{ backgroundColor: cell.color }}
                      onClick={() => handleCellClick(cell)}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${formatDate(cell.date)} ${formatHour(
                        cell.hour!
                      )}: ${cell.coverage.count} assignments`}
                    >
                      <span className="cell-value">{cell.coverage.count}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'daily' ? (
          // Daily view: calendar grid
          <div className="daily-heatmap">
            <div className="weekday-labels">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="weekday-label">
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-grid">
              {heatmapCells.map((cell) => {
                const date = new Date(cell.date);
                const dayOfWeek = date.getDay();

                return (
                  <div
                    key={cell.date}
                    className={`heatmap-cell ${cell.severity} ${
                      selectedCell?.date === cell.date ? 'selected' : ''
                    } ${hoveredCell?.date === cell.date ? 'hovered' : ''}`}
                    style={{
                      backgroundColor: cell.color,
                      gridColumn: dayOfWeek + 1,
                    }}
                    onClick={() => handleCellClick(cell)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div className="cell-date">{date.getDate()}</div>
                    <div className="cell-value">{cell.coverage.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Weekly view: simple bar chart style
          <div className="weekly-heatmap">
            {heatmapCells.map((cell, index) => (
              <div
                key={cell.date}
                className={`week-bar ${cell.severity} ${
                  selectedCell?.date === cell.date ? 'selected' : ''
                } ${hoveredCell?.date === cell.date ? 'hovered' : ''}`}
                onClick={() => handleCellClick(cell)}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <div className="week-label">
                  Week {index + 1}
                  <span className="date-range">{formatDate(cell.date)}</span>
                </div>
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min(100, (cell.coverage.count / 50) * 100)}%`,
                      backgroundColor: cell.color,
                    }}
                  >
                    <span className="bar-value">{cell.coverage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="heatmap-legend">
          <div className="legend-title">Coverage Levels</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color critical"></div>
              <div className="legend-label">
                <span className="label">No Coverage</span>
                <span className="count">({stats.critical})</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-color low"></div>
              <div className="legend-label">
                <span className="label">Low (1-2)</span>
                <span className="count">({stats.low})</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-color medium"></div>
              <div className="legend-label">
                <span className="label">Medium (3-4)</span>
                <span className="count">({stats.medium})</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-color good"></div>
              <div className="legend-label">
                <span className="label">Good (5-6)</span>
                <span className="count">({stats.good})</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-color excellent"></div>
              <div className="legend-label">
                <span className="label">Excellent (7+)</span>
                <span className="count">({stats.excellent})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip/Details Panel */}
      {(hoveredCell || selectedCell) && (
        <div className="heatmap-tooltip">
          <div className="tooltip-header">
            <strong>
              {formatDate((hoveredCell || selectedCell)!.date)}
              {(hoveredCell || selectedCell)!.hour !== undefined &&
                ` - ${formatHour((hoveredCell || selectedCell)!.hour!)}`}
            </strong>
            <span className={`severity-badge ${(hoveredCell || selectedCell)!.severity}`}>
              {(hoveredCell || selectedCell)!.severity}
            </span>
          </div>
          <div className="tooltip-stats">
            <div className="stat-item">
              <span className="stat-label">Assignments:</span>
              <span className="stat-value">{(hoveredCell || selectedCell)!.coverage.count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Employees:</span>
              <span className="stat-value">
                {
                  new Set((hoveredCell || selectedCell)!.coverage.assignments.map((a) => a.employee_id))
                    .size
                }
              </span>
            </div>
          </div>
          <div className="tooltip-actions">
            <button
              className="view-details-btn"
              onClick={() =>
                onCellClick?.(
                  (hoveredCell || selectedCell)!.date,
                  (hoveredCell || selectedCell)!.hour
                )
              }
            >
              View Details →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageHeatmap;
