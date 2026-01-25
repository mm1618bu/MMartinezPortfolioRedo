import React, { useMemo } from 'react';
import { Demand } from '../../../services/demandService';

interface SkillsChartProps {
  demands: Demand[];
}

export const SkillsChart: React.FC<SkillsChartProps> = ({ demands }) => {
  const data = useMemo(() => {
    const skills: Record<string, number> = {};

    demands.forEach((demand) => {
      if (demand.required_skills && demand.required_skills.length > 0) {
        demand.required_skills.forEach((skill) => {
          skills[skill] = (skills[skill] || 0) + 1;
        });
      }
    });

    return Object.entries(skills)
      .map(([skill, count]) => ({
        skill,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 skills
  }, [demands]);

  if (data.length === 0) {
    return (
      <div className="chart-skills">
        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          <p>No skills data available</p>
          <small>Skills will appear here when demands with required skills are created</small>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="chart-skills">
      <div className="chart-bars-horizontal-skills">
        {data.map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          const colors = [
            '#e91e63',
            '#9c27b0',
            '#673ab7',
            '#3f51b5',
            '#2196f3',
            '#03a9f4',
            '#00bcd4',
            '#009688',
            '#4caf50',
            '#8bc34a',
          ];

          return (
            <div key={item.skill} className="bar-skill-item">
              <div className="skill-label">
                <span className="skill-name">{item.skill}</span>
                <span className="skill-count">{item.count} demands</span>
              </div>
              <div className="skill-bar-container">
                <div
                  className="skill-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="skills-summary">
        <div className="summary-stat">
          <span className="stat-label">Unique Skills:</span>
          <span className="stat-value">{data.length}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Most Required:</span>
          <span className="stat-value">{data.length > 0 ? data[0].skill : 'N/A'}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Total Skill Demands:</span>
          <span className="stat-value">{data.reduce((sum, d) => sum + d.count, 0)}</span>
        </div>
      </div>
    </div>
  );
};
