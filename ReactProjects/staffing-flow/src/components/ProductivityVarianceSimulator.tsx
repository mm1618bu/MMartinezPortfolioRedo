/**
 * Productivity Variance Simulator Component
 * Example React component demonstrating productivity variance engine usage
 */

import React, { useState } from 'react';
import { productivityVarianceService } from '../services/productivityVarianceService';
import {
  VarianceScenario,
  QuickAnalysisResponse,
  VARIANCE_SCENARIO_METADATA,
  formatVariancePercentage,
} from '../types/productivityVariance.types';

interface ProductivityVarianceSimulatorProps {
  organizationId: string;
  defaultBaselineStaff?: number;
  defaultUnitsPerHour?: number;
}

export function ProductivityVarianceSimulator({
  organizationId,
  defaultBaselineStaff = 10,
  defaultUnitsPerHour = 15.0,
}: ProductivityVarianceSimulatorProps) {
  const [scenario, setScenario] = useState<VarianceScenario>(VarianceScenario.CONSISTENT);
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-31');
  const [baselineStaff, setBaselineStaff] = useState(defaultBaselineStaff);
  const [unitsPerHour, setUnitsPerHour] = useState(defaultUnitsPerHour);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productivityVarianceService.quickAnalysis({
        organizationId,
        startDate,
        endDate,
        scenario,
        baselineStaff,
        baselineUnitsPerHour: unitsPerHour,
      });
      
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scenarioMeta = VARIANCE_SCENARIO_METADATA[scenario];

  return (
    <div className="productivity-variance-simulator pvs-wrapper">
      <div className="simulator-header">
        <h2>Productivity Variance Simulator</h2>
        <p>Model productivity fluctuations and their impact on staffing needs</p>
      </div>

      <div className="simulator-form">
        <div className="form-section">
          <h3>Simulation Parameters</h3>
          
          <div className="form-group">
            <label htmlFor="scenario">Variance Scenario</label>
            <select
              id="scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value as VarianceScenario)}
              className="form-control"
            >
              {Object.values(VarianceScenario).map((s) => {
                const meta = VARIANCE_SCENARIO_METADATA[s];
                return (
                  <option key={s} value={s}>
                    {meta.icon} {meta.displayName} - {meta.expectedImpact}
                  </option>
                );
              })}
            </select>
            <p className="help-text">
              {scenarioMeta.description} - {scenarioMeta.useCase}
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="baselineStaff">Baseline Staff Needed</label>
              <input
                type="number"
                id="baselineStaff"
                value={baselineStaff}
                onChange={(e) => setBaselineStaff(Number(e.target.value))}
                min="1"
                max="1000"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="unitsPerHour">Baseline Units per Hour</label>
              <input
                type="number"
                id="unitsPerHour"
                value={unitsPerHour}
                onChange={(e) => setUnitsPerHour(Number(e.target.value))}
                min="1"
                step="0.1"
                className="form-control"
              />
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? (
              <>
                <span className="spinner"></span> Simulating...
              </>
            ) : (
              <>
                <span>▶</span> Run Simulation
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="simulation-results">
            <h3>Simulation Results</h3>
            
            <div className="results-grid">
              <div className="result-card">
                <div className="card-header" style={{ backgroundColor: scenarioMeta.color }}>
                  <h4>{scenarioMeta.icon} {scenarioMeta.displayName}</h4>
                </div>
                <div className="card-body">
                  <div className="stat">
                    <label>Date Range</label>
                    <span className="value">
                      {result.date_range.start} to {result.date_range.end}
                      <span className="stat-detail">({result.date_range.total_days} days)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="result-card">
                <div className="card-header">
                  <h4>📊 Productivity Summary</h4>
                </div>
                <div className="card-body">
                  <div className="stat">
                    <label>Baseline Units/Hour</label>
                    <span className="value">{result.productivity_summary.baseline_units_per_hour.toFixed(1)}</span>
                  </div>
                  <div className="stat">
                    <label>Mean Actual Units/Hour</label>
                    <span className="value highlighted">
                      {result.productivity_summary.mean_actual_units_per_hour.toFixed(1)}
                    </span>
                  </div>
                  <div className="stat">
                    <label>Productivity Range</label>
                    <span className="value">
                      {result.productivity_summary.range.min.toFixed(1)} -{' '}
                      {result.productivity_summary.range.max.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="result-card">
                <div className="card-header">
                  <h4>👥 Staffing Impact</h4>
                </div>
                <div className="card-body">
                  <div className="stat">
                    <label>Baseline Staff</label>
                    <span className="value">{result.staffing_impact.baseline_staff}</span>
                  </div>
                  <div className="stat">
                    <label>Avg Additional Staff Needed</label>
                    <span className="value warning">
                      {formatVariancePercentage(result.staffing_impact.avg_additional_staff_needed)}
                    </span>
                  </div>
                  <div className="stat">
                    <label>Peak Additional Staff</label>
                    <span className="value danger">
                      +{result.staffing_impact.peak_additional_staff_needed}
                    </span>
                  </div>
                  <div className="stat">
                    <label>Days Needing Extra Staff</label>
                    <span className="value">
                      {result.staffing_impact.days_requiring_extra_staff} days
                      <span className="stat-detail">
                        ({(result.staffing_impact.days_requiring_extra_staff / result.date_range.total_days * 100).toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="stat">
                    <label>Total Additional Staff-Days</label>
                    <span className="value highlighted">
                      {result.staffing_impact.total_additional_staff_days}
                    </span>
                  </div>
                </div>
              </div>

              <div className="result-card">
                <div className="card-header">
                  <h4>⚠️ Risk Assessment</h4>
                </div>
                <div className="card-body">
                  <div className="stat">
                    <label>Probability of Underperformance</label>
                    <span className="value warning">
                      {result.risk_assessment.probability_underperformance}
                    </span>
                  </div>
                  <div className="stat">
                    <label>Critical Risk Probability</label>
                    <span className="value danger">
                      {result.risk_assessment.probability_critical}
                    </span>
                  </div>
                  <div className="stat">
                    <label>Volatility</label>
                    <span className="value">
                      {(result.risk_assessment.volatility * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="results-actions">
              <button className="btn btn-secondary">
                📈 View Detailed Results
              </button>
              <button className="btn btn-secondary">
                💾 Export Data
              </button>
              <button className="btn btn-secondary">
                📊 Compare Scenarios
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pvs-wrapper.productivity-variance-simulator {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .pvs-wrapper .simulator-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .pvs-wrapper .simulator-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .pvs-wrapper .simulator-form {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .pvs-wrapper .form-section h3 {
          margin-bottom: 1.5rem;
        }

        .pvs-wrapper .form-group {
          margin-bottom: 1.5rem;
        }

        .pvs-wrapper .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .pvs-wrapper .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .pvs-wrapper .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .pvs-wrapper .help-text {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .pvs-wrapper .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pvs-wrapper .btn-primary {
          background: #3b82f6;
          color: white;
          width: 100%;
          margin-top: 1rem;
        }

        .pvs-wrapper .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .pvs-wrapper .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pvs-wrapper .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .pvs-wrapper .btn-secondary:hover {
          background: #d1d5db;
        }

        .pvs-wrapper .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .pvs-wrapper .alert-error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .pvs-wrapper .simulation-results {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .pvs-wrapper .simulation-results h3 {
          margin-bottom: 1.5rem;
        }

        .pvs-wrapper .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .pvs-wrapper .result-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .pvs-wrapper .card-header {
          background: #f9fafb;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .pvs-wrapper .card-header h4 {
          margin: 0;
          font-size: 1.1rem;
        }

        .pvs-wrapper .card-body {
          padding: 1rem;
        }

        .pvs-wrapper .stat {
          margin-bottom: 1rem;
        }

        .pvs-wrapper .stat:last-child {
          margin-bottom: 0;
        }

        .pvs-wrapper .stat label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .pvs-wrapper .stat .value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .pvs-wrapper .stat .stat-detail {
          font-size: 0.875rem;
          font-weight: normal;
          color: #6b7280;
          margin-left: 0.5rem;
        }

        .pvs-wrapper .highlighted {
          color: #3b82f6 !important;
        }

        .pvs-wrapper .warning {
          color: #f59e0b !important;
        }

        .pvs-wrapper .danger {
          color: #ef4444 !important;
        }

        .pvs-wrapper .results-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .pvs-wrapper .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: pvs-spin 0.6s linear infinite;
        }

        @keyframes pvs-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ProductivityVarianceSimulator;
