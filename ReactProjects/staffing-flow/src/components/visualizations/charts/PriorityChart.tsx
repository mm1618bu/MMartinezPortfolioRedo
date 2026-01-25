import React, { useMemo } from 'react';
import { Demand } from '../../../services/demandService';

interface PriorityChartProps {
  demands: Demand[];
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ demands }) => {
  const data = useMemo(() => {
    const counts = {
      low: 0,
      medium: 0,
      high: 0,
    };

    demands.forEach((demand) => {
      counts[demand.priority]++;
    });

    return counts;
  }, [demands]);

  const total = data.low + data.medium + data.high;
  const colors = {
    low: '#2e7d32',
    medium: '#e65100',
    high: '#c62828',
  };

  const getPercentage = (value: number) => {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  };

  return (
    <div className="chart-priority">
      <div className="chart-bars">
        {Object.entries(data).map(([priority, count]) => {
          const percentage = getPercentage(count);
          return (
            <div key={priority} className="bar-item">
              <div className="bar-label">
                <span className="label">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                <span className="count">{count}</span>
              </div>
              <div className="bar-background">
                <div
                  className="bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[priority as keyof typeof colors],
                  }}
                ></div>
              </div>
              <div className="bar-percentage">{percentage}%</div>
            </div>
          );
        })}
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colors.low }}></div>
          <span>Low Priority</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colors.medium }}></div>
          <span>Medium Priority</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colors.high }}></div>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  );
};
