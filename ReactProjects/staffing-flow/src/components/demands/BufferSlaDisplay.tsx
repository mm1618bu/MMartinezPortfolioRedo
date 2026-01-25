/**
 * Buffer and SLA Display Component
 * Shows buffer and SLA compliance information
 */

import React from 'react';
import type { DemandWithBuffer, BufferStatistics, BufferRecommendation } from '../../utils/bufferSlaCalculations';
import './BufferSlaDisplay.css';

interface BufferSlaDisplayProps {
  demandsWithBuffer?: DemandWithBuffer[];
  bufferStatistics?: BufferStatistics;
  recommendations?: BufferRecommendation[];
  showRecommendations?: boolean;
}

export const BufferSlaDisplay: React.FC<BufferSlaDisplayProps> = ({
  demandsWithBuffer = [],
  bufferStatistics,
  recommendations = [],
  showRecommendations = true,
}) => {
  if (!bufferStatistics) {
    return null;
  }

  const slaMeetsPercentage = bufferStatistics.slaCompliancePercentage;
  const isSlaOptimal = slaMeetsPercentage >= 95;
  const needsImprovement = slaMeetsPercentage < 85;

  return (
    <div className="buffer-sla-display">
      {/* Buffer Statistics */}
      <div className="buffer-stats-card">
        <h3>📊 Buffer Statistics</h3>
        
        <div className="stats-grid">
          <div className="stat-item">
            <label>Total Demands</label>
            <div className="stat-value">{bufferStatistics.totalDemands}</div>
          </div>

          <div className="stat-item">
            <label>Avg Buffer</label>
            <div className="stat-value">
              {bufferStatistics.averageBufferPercentage.toFixed(1)}%
            </div>
          </div>

          <div className="stat-item">
            <label>Min Buffer</label>
            <div className="stat-value">
              {bufferStatistics.minBuffer.toFixed(1)}%
            </div>
          </div>

          <div className="stat-item">
            <label>Max Buffer</label>
            <div className="stat-value">
              {bufferStatistics.maxBuffer.toFixed(1)}%
            </div>
          </div>

          <div className="stat-item">
            <label>Base Headcount</label>
            <div className="stat-value">{bufferStatistics.totalBaseHeadcount}</div>
          </div>

          <div className="stat-item">
            <label>Buffer Amount</label>
            <div className="stat-value">
              +{bufferStatistics.totalBufferAmount.toFixed(1)}
            </div>
          </div>

          <div className="stat-item">
            <label>Total With Buffer</label>
            <div className="stat-value">
              {bufferStatistics.totalBufferedHeadcount}
            </div>
          </div>
        </div>
      </div>

      {/* SLA Compliance */}
      <div className={`sla-compliance-card ${isSlaOptimal ? 'optimal' : needsImprovement ? 'warning' : 'good'}`}>
        <h3>⏰ SLA Compliance</h3>

        <div className="compliance-summary">
          <div className="compliance-metric">
            <label>Compliant Demands</label>
            <div className="metric-value">
              <span className="number">{bufferStatistics.slaMeetsCount}</span>
              <span className="total">/{bufferStatistics.totalDemands}</span>
            </div>
          </div>

          <div className="compliance-metric">
            <label>Compliance Rate</label>
            <div className="metric-value percentage">
              <span className="number">{bufferStatistics.slaCompliancePercentage.toFixed(1)}</span>
              <span className="unit">%</span>
            </div>
          </div>

          <div className="compliance-metric">
            <label>Non-Compliant</label>
            <div className="metric-value error">
              {bufferStatistics.slaFailureCount}
            </div>
          </div>
        </div>

        <div className="compliance-bar">
          <div 
            className="compliance-fill"
            style={{
              width: `${Math.min(100, Math.max(0, bufferStatistics.slaCompliancePercentage))}%`
            }}
          />
        </div>

        <div className="compliance-status">
          {isSlaOptimal && (
            <span className="badge badge-optimal">✓ Optimal Compliance</span>
          )}
          {!isSlaOptimal && !needsImprovement && (
            <span className="badge badge-good">✓ Good Compliance</span>
          )}
          {needsImprovement && (
            <span className="badge badge-warning">⚠ Needs Improvement</span>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="recommendations-card">
          <h3>💡 Recommendations</h3>

          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-item ${rec.priority}`}>
                <div className="rec-header">
                  <span className="rec-type">
                    {rec.type === 'increase' && '📈 Increase'}
                    {rec.type === 'decrease' && '📉 Decrease'}
                    {rec.type === 'optimal' && '✓ Optimal'}
                  </span>
                  <span className={`priority-badge priority-${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>

                <p className="rec-reason">{rec.reason}</p>

                <div className="rec-values">
                  <div className="value-item">
                    <label>Current:</label>
                    <span>{rec.currentBuffer.toFixed(1)}%</span>
                  </div>
                  {rec.suggestedBuffer !== rec.currentBuffer && (
                    <div className="value-item">
                      <label>Suggested:</label>
                      <span className="suggested">{rec.suggestedBuffer.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed SLA Status by Demand */}
      {demandsWithBuffer.length > 0 && (
        <div className="detailed-sla-card">
          <h3>📋 SLA Status by Demand</h3>

          <div className="sla-table">
            <div className="sla-table-header">
              <div className="col-date">Date</div>
              <div className="col-shift">Shift</div>
              <div className="col-headcount">Headcount</div>
              <div className="col-buffer">Buffer</div>
              <div className="col-status">Status</div>
            </div>

            <div className="sla-table-body">
              {demandsWithBuffer.slice(0, 10).map(demand => (
                <div key={demand.id} className={`sla-table-row ${demand.meetsAllSla ? 'compliant' : 'non-compliant'}`}>
                  <div className="col-date">{demand.date}</div>
                  <div className="col-shift">{demand.shift_type}</div>
                  <div className="col-headcount">{demand.baseHeadcount}</div>
                  <div className="col-buffer">
                    <span className="buffer-badge">
                      +{demand.bufferAmount.toFixed(1)} ({((demand.bufferAmount / demand.baseHeadcount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="col-status">
                    {demand.meetsAllSla ? (
                      <span className="status-badge compliant">✓ Compliant</span>
                    ) : (
                      <span className="status-badge non-compliant">✗ Non-Compliant</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {demandsWithBuffer.length > 10 && (
              <div className="table-footer">
                <em>Showing 10 of {demandsWithBuffer.length} demands</em>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BufferSlaDisplay;
