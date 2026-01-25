import React, { useMemo } from 'react';
import { Demand } from '../../../services/demandService';

interface DepartmentChartProps {
  demands: Demand[];
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({ demands }) => {
  const data = useMemo(() => {
    const departments: Record<string, { count: number; employees: number }> = {};

    demands.forEach((demand) => {
      const dept = demand.department_id || 'Unassigned';
      if (!departments[dept]) {
        departments[dept] = { count: 0, employees: 0 };
      }
      departments[dept].count++;
      departments[dept].employees += demand.required_employees;
    });

    return Object.entries(departments)
      .map(([dept, stats]) => ({
        department: dept,
        count: stats.count,
        employees: stats.employees,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 departments
  }, [demands]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="chart-department">
      <div className="chart-bars-horizontal">
        {data.map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          const colors = [
            '#1976d2',
            '#d32f2f',
            '#388e3c',
            '#f57c00',
            '#7b1fa2',
            '#0097a7',
            '#c2185b',
            '#fbc02d',
          ];

          return (
            <div key={item.department} className="bar-horizontal-item">
              <div className="bar-label-left">
                <span className="label">{item.department.substring(0, 20)}</span>
              </div>
              <div className="bar-background-horizontal">
                <div
                  className="bar-fill-horizontal"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
              <div className="bar-info">
                <span className="count">{item.count}</span>
                <span className="employees">{item.employees} employees</span>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          No department data available
        </div>
      )}
    </div>
  );
};
