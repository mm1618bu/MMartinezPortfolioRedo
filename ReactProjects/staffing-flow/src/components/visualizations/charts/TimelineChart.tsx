import React, { useMemo } from 'react';
import { Demand } from '../../../services/demandService';

interface TimelineChartProps {
  demands: Demand[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ demands }) => {
  const data = useMemo(() => {
    const grouped: Record<string, { count: number; employees: number }> = {};

    demands.forEach((demand) => {
      if (!grouped[demand.date]) {
        grouped[demand.date] = { count: 0, employees: 0 };
      }
      grouped[demand.date].count++;
      grouped[demand.date].employees += demand.required_employees;
    });

    const sorted = Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .slice(-30); // Last 30 days

    return sorted;
  }, [demands]);

  if (data.length === 0) {
    return (
      <div className="chart-timeline">
        <p style={{ textAlign: 'center', color: '#999' }}>No data for timeline</p>
      </div>
    );
  }

  const maxEmployees = Math.max(...data.map(([, d]) => d.employees), 1);
  const maxCount = Math.max(...data.map(([, d]) => d.count), 1);

  return (
    <div className="chart-timeline">
      <div className="timeline-container">
        <div className="timeline-bars">
          {data.map(([date, stats]) => {
            const countPercentage = (stats.count / maxCount) * 100;
            const employeePercentage = (stats.employees / maxEmployees) * 100;
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={date} className="timeline-bar-item">
                <div className="timeline-bars-container">
                  <div
                    className="timeline-bar demand-count"
                    style={{ height: `${countPercentage}%` }}
                    title={`Demands: ${stats.count}`}
                  ></div>
                  <div
                    className="timeline-bar employee-count"
                    style={{ height: `${employeePercentage}%` }}
                    title={`Employees: ${stats.employees}`}
                  ></div>
                </div>
                <div className="timeline-date">{formattedDate}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#1976d2' }}></div>
          <span>Number of Demands</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff6f00' }}></div>
          <span>Total Employees Needed</span>
        </div>
      </div>

      <div className="timeline-stats">
        <div className="stat-item">
          <span className="stat-label">Date Range:</span>
          <span className="stat-value">
            {data.length > 0 && `${data[0][0]} to ${data[data.length - 1][0]}`}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Days:</span>
          <span className="stat-value">{data.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Peak Day:</span>
          <span className="stat-value">
            {data.length > 0 &&
              data.reduce((max, current) =>
                current[1].employees > max[1].employees ? current : max
              )[0]}
          </span>
        </div>
      </div>
    </div>
  );
};
