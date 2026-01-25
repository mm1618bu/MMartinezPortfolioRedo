import React, { useEffect, useState } from 'react';
import { Demand } from '../../services/demandService';
import { demandService } from '../../services/demandService';
import type { HeadcountSummary as HeadcountSummaryType } from '../../utils/headcountCalculations';
import './HeadcountSummary.css';

interface HeadcountSummaryProps {
  demands: Demand[];
  departments?: Array<{ id: string; name: string }>;
  title?: string;
}

export const HeadcountSummary: React.FC<HeadcountSummaryProps> = ({
  demands,
  departments,
  title = 'Headcount Summary',
}) => {
  const [summary, setSummary] = useState<HeadcountSummaryType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'department' | 'shift' | 'priority' | 'skill'>('overview');

  useEffect(() => {
    const summary = demandService.calculateHeadcountSummary(demands, departments);
    setSummary(summary);
  }, [demands, departments]);

  if (!summary) {
    return <div className="headcount-summary loading">Loading headcount data...</div>;
  }

  const formatNumber = (num: number) => Math.round(num * 10) / 10;

  return (
    <div className="headcount-summary">
      <div className="headcount-header">
        <h2>{title}</h2>
        <div className="headcount-quick-stats">
          <div className="stat-card stat-primary">
            <div className="stat-value">{summary.totalHeadcount}</div>
            <div className="stat-label">Total Headcount</div>
          </div>
          <div className="stat-card stat-secondary">
            <div className="stat-value">{summary.totalDemands}</div>
            <div className="stat-label">Total Demands</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{formatNumber(summary.averageHeadcountPerDemand)}</div>
            <div className="stat-label">Avg per Demand</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{summary.minHeadcountPerDemand} - {summary.maxHeadcountPerDemand}</div>
            <div className="stat-label">Range</div>
          </div>
        </div>
        <div className="headcount-date-range">
          From {summary.dateRange.start} to {summary.dateRange.end}
        </div>
      </div>

      <div className="headcount-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'department' ? 'active' : ''}`}
          onClick={() => setActiveTab('department')}
        >
          By Department
        </button>
        <button
          className={`tab-button ${activeTab === 'shift' ? 'active' : ''}`}
          onClick={() => setActiveTab('shift')}
        >
          By Shift Type
        </button>
        <button
          className={`tab-button ${activeTab === 'priority' ? 'active' : ''}`}
          onClick={() => setActiveTab('priority')}
        >
          By Priority
        </button>
        <button
          className={`tab-button ${activeTab === 'skill' ? 'active' : ''}`}
          onClick={() => setActiveTab('skill')}
        >
          By Skill
        </button>
      </div>

      <div className="headcount-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="metric-grid">
              <div className="metric-card">
                <h3>Headcount Statistics</h3>
                <div className="metric-row">
                  <span>Total Headcount:</span>
                  <strong>{summary.totalHeadcount}</strong>
                </div>
                <div className="metric-row">
                  <span>Total Demands:</span>
                  <strong>{summary.totalDemands}</strong>
                </div>
                <div className="metric-row">
                  <span>Average per Demand:</span>
                  <strong>{formatNumber(summary.averageHeadcountPerDemand)}</strong>
                </div>
                <div className="metric-row">
                  <span>Median per Demand:</span>
                  <strong>{formatNumber(summary.medianHeadcountPerDemand)}</strong>
                </div>
                <div className="metric-row">
                  <span>Min per Demand:</span>
                  <strong>{summary.minHeadcountPerDemand}</strong>
                </div>
                <div className="metric-row">
                  <span>Max per Demand:</span>
                  <strong>{summary.maxHeadcountPerDemand}</strong>
                </div>
              </div>

              <div className="metric-card">
                <h3>By Priority</h3>
                {summary.byPriority.map(priority => (
                  <div key={priority.priority} className="metric-row">
                    <span className={`priority-label priority-${priority.priority}`}>
                      {priority.priority.toUpperCase()}
                    </span>
                    <span>{priority.totalHeadcount} headcount ({priority.demandCount} demands)</span>
                    <span className="metric-percentage">{formatNumber(priority.percentage)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Department Tab */}
        {activeTab === 'department' && (
          <div className="tab-content">
            <table className="headcount-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Headcount</th>
                  <th>Demands</th>
                  <th>Avg/Demand</th>
                  <th>Low</th>
                  <th>Medium</th>
                  <th>High</th>
                </tr>
              </thead>
              <tbody>
                {summary.byDepartment.map(dept => (
                  <tr key={dept.departmentId}>
                    <td>
                      <strong>{dept.departmentName || 'Unassigned'}</strong>
                    </td>
                    <td>{dept.totalHeadcount}</td>
                    <td>{dept.demandCount}</td>
                    <td>{formatNumber(dept.averagePerDemand)}</td>
                    <td>{dept.byPriority.low}</td>
                    <td>{dept.byPriority.medium}</td>
                    <td>{dept.byPriority.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Shift Type Tab */}
        {activeTab === 'shift' && (
          <div className="tab-content">
            <table className="headcount-table">
              <thead>
                <tr>
                  <th>Shift Type</th>
                  <th>Headcount</th>
                  <th>Demands</th>
                  <th>Avg/Demand</th>
                  <th>Low</th>
                  <th>Medium</th>
                  <th>High</th>
                </tr>
              </thead>
              <tbody>
                {summary.byShiftType.map(shift => (
                  <tr key={shift.shiftType}>
                    <td>
                      <strong>{shift.shiftType.replace('_', ' ').toUpperCase()}</strong>
                    </td>
                    <td>{shift.totalHeadcount}</td>
                    <td>{shift.demandCount}</td>
                    <td>{formatNumber(shift.averagePerDemand)}</td>
                    <td>{shift.byPriority.low}</td>
                    <td>{shift.byPriority.medium}</td>
                    <td>{shift.byPriority.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Priority Tab */}
        {activeTab === 'priority' && (
          <div className="tab-content">
            <div className="priority-breakdown">
              {summary.byPriority.map(priority => (
                <div key={priority.priority} className="priority-card">
                  <div className={`priority-header priority-${priority.priority}`}>
                    <h3>{priority.priority.toUpperCase()}</h3>
                    <span className="priority-percentage">{formatNumber(priority.percentage)}%</span>
                  </div>
                  <div className="priority-stats">
                    <div className="stat">
                      <span>Headcount:</span>
                      <strong>{priority.totalHeadcount}</strong>
                    </div>
                    <div className="stat">
                      <span>Demands:</span>
                      <strong>{priority.demandCount}</strong>
                    </div>
                    <div className="stat">
                      <span>Avg/Demand:</span>
                      <strong>{formatNumber(priority.averagePerDemand)}</strong>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill priority-${priority.priority}`}
                      style={{ width: `${priority.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skill' && (
          <div className="tab-content">
            {summary.bySkill.length > 0 ? (
              <table className="headcount-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Headcount</th>
                    <th>Demands</th>
                    <th>Avg/Demand</th>
                    <th>Low</th>
                    <th>Medium</th>
                    <th>High</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.bySkill.map(skill => (
                    <tr key={skill.skill}>
                      <td>
                        <strong>{skill.skill}</strong>
                      </td>
                      <td>{skill.totalHeadcount}</td>
                      <td>{skill.demandCount}</td>
                      <td>{formatNumber(skill.averagePerDemand)}</td>
                      <td>{skill.byPriority.low}</td>
                      <td>{skill.byPriority.medium}</td>
                      <td>{skill.byPriority.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">No skills assigned to demands</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadcountSummary;
