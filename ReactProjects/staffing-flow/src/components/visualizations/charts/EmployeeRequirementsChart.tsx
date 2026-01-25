import React, { useMemo } from 'react';
import { Demand } from '../../../services/demandService';

interface EmployeeRequirementsChartProps {
  demands: Demand[];
}

export const EmployeeRequirementsChart: React.FC<EmployeeRequirementsChartProps> = ({
  demands,
}) => {
  const data = useMemo(() => {
    const ranges = [
      { min: 1, max: 5, label: '1-5', count: 0 },
      { min: 6, max: 10, label: '6-10', count: 0 },
      { min: 11, max: 20, label: '11-20', count: 0 },
      { min: 21, max: 50, label: '21-50', count: 0 },
      { min: 51, max: Infinity, label: '50+', count: 0 },
    ];

    demands.forEach((demand) => {
      const employees = demand.required_employees;
      const range = ranges.find((r) => employees >= r.min && employees <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [demands]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="chart-employee-requirements">
      <div className="chart-bars-vertical">
        {data.map((range) => {
          const percentage = (range.count / maxCount) * 100;
          return (
            <div key={range.label} className="bar-vertical-item">
              <div className="bar-vertical-container">
                <div
                  className="bar-vertical-fill"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: `hsl(${190 + (range.count / maxCount) * 30}, 70%, 50%)`,
                  }}
                  title={`${range.count} demands`}
                ></div>
              </div>
              <div className="bar-label-bottom">
                <span className="label">{range.label}</span>
                <span className="count">{range.count}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Total Employees Needed:</span>
          <span className="stat-value">{demands.reduce((sum, d) => sum + d.required_employees, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average per Demand:</span>
          <span className="stat-value">
            {(demands.reduce((sum, d) => sum + d.required_employees, 0) / demands.length).toFixed(1)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max Requirement:</span>
          <span className="stat-value">
            {Math.max(...demands.map((d) => d.required_employees), 0)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min Requirement:</span>
          <span className="stat-value">
            {Math.min(...demands.map((d) => d.required_employees), 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
