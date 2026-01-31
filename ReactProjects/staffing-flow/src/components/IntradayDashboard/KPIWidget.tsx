/**
 * KPI Widget Component
 * Displays individual KPI metrics with real-time updates
 */

import React from 'react';
import type { KPIUpdatePayload } from '../../../api/types/websocket';
import './KPIWidget.scss';

interface KPIWidgetProps {
  type: 'utilization' | 'headcount' | 'sla' | 'health';
  data: KPIUpdatePayload | null;
  isLoading?: boolean;
}

const KPIWidget: React.FC<KPIWidgetProps> = ({ type, data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="kpi-widget loading">
        <div className="skeleton-loader"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="kpi-widget no-data">
        <p>No data available</p>
      </div>
    );
  }

  const renderUtilization = () => {
    const util = data.utilization;
    const percentage = (util.current_utilization * 100).toFixed(1);
    const change = data.changes?.utilization_change || 0;
    const status = util.current_utilization >= 0.85 ? 'excellent' :
                   util.current_utilization >= 0.70 ? 'good' :
                   util.current_utilization >= 0.50 ? 'warning' : 'critical';

    return (
      <div className={`kpi-widget utilization status-${status}`}>
        <div className="kpi-header">
          <h3>Utilization</h3>
          <span className="kpi-icon">📊</span>
        </div>
        <div className="kpi-value">
          {percentage}%
        </div>
        <div className="kpi-details">
          <div className="detail-row">
            <span>Productive Hours:</span>
            <strong>{util.productive_hours.toFixed(1)}h</strong>
          </div>
          <div className="detail-row">
            <span>Available Hours:</span>
            <strong>{util.available_hours.toFixed(1)}h</strong>
          </div>
          <div className="detail-row">
            <span>Efficiency:</span>
            <strong>{(util.efficiency_rate * 100).toFixed(0)}%</strong>
          </div>
        </div>
        {change !== 0 && (
          <div className={`kpi-change ${change > 0 ? 'positive' : 'negative'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change * 100).toFixed(1)}%
          </div>
        )}
        <div className="kpi-footer">
          <span className="last-update">
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  const renderHeadcount = () => {
    const gap = data.headcount_gap;
    const gapValue = gap.headcount_gap;
    const status = gap.staffing_level === 'optimal' ? 'excellent' :
                   gap.staffing_level === 'acceptable' ? 'good' :
                   gap.staffing_level === 'understaffed' ? 'warning' : 'critical';

    return (
      <div className={`kpi-widget headcount status-${status}`}>
        <div className="kpi-header">
          <h3>Headcount Gap</h3>
          <span className="kpi-icon">👥</span>
        </div>
        <div className="kpi-value">
          {gapValue > 0 ? '+' : ''}{gapValue}
        </div>
        <div className="kpi-status-label">{gap.staffing_level}</div>
        <div className="kpi-details">
          <div className="detail-row">
            <span>Current Staff:</span>
            <strong>{gap.current_headcount}</strong>
          </div>
          <div className="detail-row">
            <span>Required:</span>
            <strong>{gap.required_headcount}</strong>
          </div>
          <div className="detail-row">
            <span>Coverage:</span>
            <strong>{(gap.coverage_ratio * 100).toFixed(0)}%</strong>
          </div>
        </div>
        <div className="kpi-footer">
          <span className="last-update">
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  const renderSLA = () => {
    const sla = data.sla_risk;
    const riskScore = sla.risk_score.toFixed(0);
    const status = sla.risk_level === 'low' ? 'excellent' :
                   sla.risk_level === 'medium' ? 'warning' : 'critical';

    return (
      <div className={`kpi-widget sla status-${status}`}>
        <div className="kpi-header">
          <h3>SLA Risk</h3>
          <span className="kpi-icon">⚡</span>
        </div>
        <div className="kpi-value risk-score">
          {riskScore}
        </div>
        <div className="kpi-status-label">{sla.risk_level} risk</div>
        <div className="kpi-details">
          <div className="detail-row">
            <span>Compliance:</span>
            <strong>{sla.compliance_percentage.toFixed(1)}%</strong>
          </div>
          <div className="detail-row">
            <span>Avg Wait:</span>
            <strong>{sla.average_wait_time_minutes.toFixed(0)}m</strong>
          </div>
          <div className="detail-row">
            <span>At Risk:</span>
            <strong className="highlight">{sla.items_at_risk}</strong>
          </div>
        </div>
        <div className="kpi-footer">
          <span className="last-update">
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  const renderHealth = () => {
    const healthScore = data.health_score;
    const status = healthScore >= 85 ? 'excellent' :
                   healthScore >= 70 ? 'good' :
                   healthScore >= 50 ? 'warning' : 'critical';

    return (
      <div className={`kpi-widget health status-${status}`}>
        <div className="kpi-header">
          <h3>Overall Health</h3>
          <span className="kpi-icon">❤️</span>
        </div>
        <div className="kpi-value">
          {healthScore.toFixed(0)}
        </div>
        <div className="health-ring">
          <svg viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="12"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${(healthScore / 100) * 339.3} 339.3`}
              transform="rotate(-90 60 60)"
            />
          </svg>
        </div>
        <div className="kpi-details">
          <div className="detail-row">
            <span>Utilization:</span>
            <strong>{(data.utilization.current_utilization * 100).toFixed(0)}%</strong>
          </div>
          <div className="detail-row">
            <span>Coverage:</span>
            <strong>{(data.headcount_gap.coverage_ratio * 100).toFixed(0)}%</strong>
          </div>
          <div className="detail-row">
            <span>SLA:</span>
            <strong>{data.sla_risk.compliance_percentage.toFixed(0)}%</strong>
          </div>
        </div>
        <div className="kpi-footer">
          <span className="last-update">
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  switch (type) {
    case 'utilization':
      return renderUtilization();
    case 'headcount':
      return renderHeadcount();
    case 'sla':
      return renderSLA();
    case 'health':
      return renderHealth();
    default:
      return null;
  }
};

export default KPIWidget;
