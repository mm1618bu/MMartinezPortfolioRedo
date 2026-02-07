import React, { useState } from 'react';
import { simulationService } from '../../services/simulationService';
import {
  DemandSimulationRequest,
  DemandSimulationResponse,
  SimulationScenario,
  SimulatedDemand,
} from '../../types/simulation.types';
import {
  SCENARIO_METADATA,
  SHIFT_TYPE_METADATA,
  PRIORITY_METADATA,
  aggregateDemandsByDate,
  aggregateDemandsByShift,
  calculateDateRangeDays,
} from '../../types/simulation.types';
import APP_CONFIG from '../../config/app.config';
import './DemandGenerationEngine.css';

interface GenerationState {
  loading: boolean;
  error: string | null;
  result: DemandSimulationResponse | null;
}

export const DemandGenerationEngine: React.FC = () => {
  const [formData, setFormData] = useState<DemandSimulationRequest>({
    organization_id: APP_CONFIG.DEFAULT_ORGANIZATION_ID,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scenario: 'baseline',
    department_id: undefined,
    base_employees: 15,
    variance_percentage: 0.2,
  });

  const [state, setState] = useState<GenerationState>({
    loading: false,
    error: null,
    result: null,
  });

  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'stats'>('stats');

  const handleInputChange = (field: keyof DemandSimulationRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    setState({ loading: true, error: null, result: null });

    try {
      const result = await simulationService.generateDemand(formData);
      setState({ loading: false, error: null, result });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to generate demand',
        result: null,
      });
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!state.result) return;

    if (format === 'json') {
      const json = JSON.stringify(state.result, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demand-simulation-${formData.scenario}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['Date', 'Shift Type', 'Required Employees', 'Priority', 'Notes'];
      const rows = state.result.demands.map((d) => [
        d.date,
        d.shift_type,
        d.required_employees.toString(),
        d.priority,
        d.notes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demand-simulation-${formData.scenario}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const scenarioMeta = SCENARIO_METADATA[formData.scenario as SimulationScenario];
  const dateRangeDays = calculateDateRangeDays(formData.start_date, formData.end_date);

  return (
    <div className="demand-generation-engine">
      <div className="engine-header">
        <h1>🎲 Demand Generation Engine</h1>
        <p className="subtitle">Simulate workforce demand scenarios for planning and forecasting</p>
      </div>

      <div className="engine-layout">
        {/* Configuration Panel */}
        <div className="config-panel">
          <h2>Configuration</h2>

          {/* Scenario Selection */}
          <div className="form-group">
            <label>Simulation Scenario</label>
            <div className="scenario-selector">
              {Object.entries(SCENARIO_METADATA).map(([key, meta]) => (
                <div
                  key={key}
                  className={`scenario-card ${formData.scenario === key ? 'active' : ''}`}
                  onClick={() => handleInputChange('scenario', key)}
                  style={{ borderColor: formData.scenario === key ? meta.color : undefined }}
                >
                  <div className="scenario-icon" style={{ color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="scenario-info">
                    <div className="scenario-name">{meta.displayName}</div>
                    <div className="scenario-desc">{meta.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="form-group">
            <label>Date Range</label>
            <div className="date-range-inputs">
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="date-input"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="date-input"
              />
            </div>
            <div className="field-hint">{dateRangeDays} days selected</div>
          </div>

          {/* Parameters */}
          <div className="form-group">
            <label>
              Base Employees
              <span className="field-hint">Average number of employees per shift</span>
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.base_employees}
              onChange={(e) => handleInputChange('base_employees', parseInt(e.target.value))}
              className="number-input"
            />
          </div>

          <div className="form-group">
            <label>
              Variance Percentage
              <span className="field-hint">Random variation range (0 = none, 1 = 100%)</span>
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={formData.variance_percentage}
              onChange={(e) => handleInputChange('variance_percentage', parseFloat(e.target.value))}
              className="number-input"
            />
            <div className="field-hint">±{(formData.variance_percentage * 100).toFixed(0)}%</div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerate}
              disabled={state.loading}
            >
              {state.loading ? '🔄 Generating...' : '🎲 Generate Demand'}
            </button>
          </div>

          {/* Scenario Info */}
          {scenarioMeta && (
            <div className="scenario-info-box" style={{ borderLeftColor: scenarioMeta.color }}>
              <h3>
                {scenarioMeta.icon} {scenarioMeta.displayName}
              </h3>
              <p>{scenarioMeta.description}</p>
              {scenarioMeta.recommendedFor.length > 0 && (
                <div className="recommended-for">
                  <strong>Recommended for:</strong>
                  <ul>
                    {scenarioMeta.recommendedFor.map((use, idx) => (
                      <li key={idx}>{use}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {state.error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {state.error}
            </div>
          )}

          {state.loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Generating demand simulation...</p>
            </div>
          )}

          {state.result && (
            <>
              <div className="results-header">
                <h2>Simulation Results</h2>
                <div className="view-controls">
                  <button
                    className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
                    onClick={() => setViewMode('stats')}
                  >
                    📊 Statistics
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    📋 Table
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                  >
                    📅 Calendar
                  </button>
                </div>
                <div className="export-buttons">
                  <button className="btn btn-secondary" onClick={() => handleExport('json')}>
                    Export JSON
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Statistics View */}
              {viewMode === 'stats' && (
                <SimulationStatistics result={state.result} scenario={formData.scenario} />
              )}

              {/* Table View */}
              {viewMode === 'table' && <DemandTable demands={state.result.demands} />}

              {/* Calendar View */}
              {viewMode === 'calendar' && <DemandCalendar demands={state.result.demands} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Statistics Component
const SimulationStatistics: React.FC<{
  result: DemandSimulationResponse;
  scenario: string;
}> = ({ result, scenario }) => {
  const byShift = aggregateDemandsByShift(result.demands);

  const priorityCounts = result.demands.reduce(
    (acc, d) => {
      acc[d.priority] = (acc[d.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="simulation-statistics">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{result.total_demands}</div>
          <div className="stat-label">Total Demands</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{result.total_employees_needed}</div>
          <div className="stat-label">Employees Needed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{result.average_per_day.toFixed(1)}</div>
          <div className="stat-label">Average per Day</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{SCENARIO_METADATA[scenario as SimulationScenario]?.icon}</div>
          <div className="stat-label">{scenario}</div>
        </div>
      </div>

      <div className="breakdown-section">
        <h3>Shift Type Breakdown</h3>
        <div className="breakdown-grid">
          {Array.from(byShift.entries()).map(([shiftType, demands]) => {
            const meta = SHIFT_TYPE_METADATA[shiftType];
            const totalEmployees = demands.reduce((sum, d) => sum + d.required_employees, 0);
            return (
              <div key={shiftType} className="breakdown-card">
                <div className="breakdown-icon">{meta.icon}</div>
                <div className="breakdown-info">
                  <div className="breakdown-label">{meta.label}</div>
                  <div className="breakdown-value">{demands.length} demands</div>
                  <div className="breakdown-detail">{totalEmployees} employees</div>
                  <div className="breakdown-time">{meta.timeRange}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="breakdown-section">
        <h3>Priority Distribution</h3>
        <div className="priority-bars">
          {Object.entries(priorityCounts).map(([priority, count]) => {
            const meta = PRIORITY_METADATA[priority as keyof typeof PRIORITY_METADATA];
            const percentage = (count / result.total_demands) * 100;
            return (
              <div key={priority} className="priority-bar">
                <div className="priority-label">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{ width: `${percentage}%`, backgroundColor: meta.color }}
                  />
                </div>
                <div className="priority-count">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Table Component
const DemandTable: React.FC<{ demands: SimulatedDemand[] }> = ({ demands }) => {
  return (
    <div className="demand-table-container">
      <table className="demand-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Shift Type</th>
            <th>Required Employees</th>
            <th>Priority</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {demands.map((demand, idx) => {
            const shiftMeta = SHIFT_TYPE_METADATA[demand.shift_type];
            const priorityMeta = PRIORITY_METADATA[demand.priority];
            return (
              <tr key={idx}>
                <td>{demand.date}</td>
                <td>
                  <span className="shift-badge">
                    {shiftMeta.icon} {shiftMeta.label}
                  </span>
                </td>
                <td className="numeric">{demand.required_employees}</td>
                <td>
                  <span className="priority-badge" style={{ color: priorityMeta.color }}>
                    {priorityMeta.icon} {priorityMeta.label}
                  </span>
                </td>
                <td className="notes">{demand.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Calendar Component
const DemandCalendar: React.FC<{ demands: SimulatedDemand[] }> = ({ demands }) => {
  const byDate = aggregateDemandsByDate(demands);
  const dates = Array.from(byDate.keys()).sort();

  return (
    <div className="demand-calendar">
      {dates.map((date) => {
        const dayDemands = byDate.get(date) || [];
        const totalEmployees = dayDemands.reduce((sum, d) => sum + d.required_employees, 0);
        return (
          <div key={date} className="calendar-day">
            <div className="day-header">
              <div className="day-date">{new Date(date).toLocaleDateString()}</div>
              <div className="day-total">{totalEmployees} employees</div>
            </div>
            <div className="day-shifts">
              {dayDemands.map((demand, idx) => {
                const shiftMeta = SHIFT_TYPE_METADATA[demand.shift_type];
                const priorityMeta = PRIORITY_METADATA[demand.priority];
                return (
                  <div key={idx} className="shift-card" style={{ borderLeftColor: priorityMeta.color }}>
                    <div className="shift-header">
                      <span className="shift-icon">{shiftMeta.icon}</span>
                      <span className="shift-label">{shiftMeta.label}</span>
                    </div>
                    <div className="shift-employees">{demand.required_employees} employees</div>
                    <div className="shift-priority" style={{ color: priorityMeta.color }}>
                      {priorityMeta.icon} {priorityMeta.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DemandGenerationEngine;
