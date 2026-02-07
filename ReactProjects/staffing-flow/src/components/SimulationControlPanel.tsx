/**
 * Simulation Control Panel Component
 * Comprehensive UI for running workforce simulations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { config } from '../config';
import SimulationPlayback from './SimulationPlayback';
import './SimulationControlPanel.scss';

interface SimulationControlPanelProps {
  organizationId: string;
  departmentId?: string;
  onSimulationComplete?: (results: any) => void;
}

type SimulationType = 'productivity' | 'backlog' | 'combined';
type VarianceScenario = 'consistent' | 'volatile' | 'declining' | 'improving' | 'cyclical' | 'shock';

interface SimulationState {
  type: SimulationType;
  isRunning: boolean;
  results: any | null;
  error: string | null;
  executionTime: number | null;
}

interface ProductivityParams {
  scenario: VarianceScenario;
  days: number;
  baselineUnitsPerHour: number;
  baselineStaff: number;
  startDate: string;
}

interface BacklogParams {
  days: number;
  dailyDemandCount: number;
  dailyCapacityHours: number;
  initialBacklogCount: number;
  startDate: string;
}

const API_BASE_URL = config.api.baseUrl || 'http://localhost:5000/api';

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  organizationId,
  departmentId,
  onSimulationComplete,
}) => {
  // Simulation state
  const [state, setState] = useState<SimulationState>({
    type: 'productivity',
    isRunning: false,
    results: null,
    error: null,
    executionTime: null,
  });

  // Playback view state
  const [showPlayback, setShowPlayback] = useState(false);

  // Productivity parameters
  const [productivityParams, setProductivityParams] = useState<ProductivityParams>({
    scenario: 'consistent',
    days: 30,
    baselineUnitsPerHour: 8.5,
    baselineStaff: 10,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Backlog parameters
  const [backlogParams, setBacklogParams] = useState<BacklogParams>({
    days: 30,
    dailyDemandCount: 50,
    dailyCapacityHours: 40,
    initialBacklogCount: 0,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Available presets
  const [presets, setPresets] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load presets and strategies on mount
  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const [presetsRes, strategiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/simulations/productivity/presets`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE_URL}/simulations/backlog/overflow-strategies`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (presetsRes.ok) {
        const presetsData = await presetsRes.json();
        setPresets(Array.isArray(presetsData) ? presetsData : presetsData.presets || []);
      }

      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json();
        setStrategies(Array.isArray(strategiesData) ? strategiesData : strategiesData.strategies || []);
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const runProductivitySimulation = async () => {
    const queryParams = new URLSearchParams({
      scenario: productivityParams.scenario,
      days: productivityParams.days.toString(),
      baseline_units_per_hour: productivityParams.baselineUnitsPerHour.toString(),
      baseline_staff: productivityParams.baselineStaff.toString(),
      start_date: productivityParams.startDate,
      organization_id: organizationId,
    });

    const response = await fetch(
      `${API_BASE_URL}/simulations/productivity/quick-analysis?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Simulation failed');
    }

    return response.json();
  };

  const runBacklogSimulation = async () => {
    const queryParams = new URLSearchParams({
      organization_id: organizationId,
      start_date: backlogParams.startDate,
      days: backlogParams.days.toString(),
      daily_demand_count: backlogParams.dailyDemandCount.toString(),
      daily_capacity_hours: backlogParams.dailyCapacityHours.toString(),
      initial_backlog_count: backlogParams.initialBacklogCount.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/simulations/backlog/quick-scenarios?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Simulation failed');
    }

    return response.json();
  };

  const runCombinedSimulation = async () => {
    const [productivityResults, backlogResults] = await Promise.all([
      runProductivitySimulation(),
      runBacklogSimulation(),
    ]);

    return {
      productivity: productivityResults,
      backlog: backlogResults,
      combined_insights: {
        execution_time_ms:
          (productivityResults.execution_time_ms || 0) + (backlogResults.execution_time_ms || 0),
      },
    };
  };

  const handleRunSimulation = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      error: null,
      results: null,
      executionTime: null,
    }));

    const startTime = Date.now();

    try {
      let results;

      switch (state.type) {
        case 'productivity':
          results = await runProductivitySimulation();
          break;
        case 'backlog':
          results = await runBacklogSimulation();
          break;
        case 'combined':
          results = await runCombinedSimulation();
          break;
      }

      const executionTime = Date.now() - startTime;

      setState((prev) => ({
        ...prev,
        isRunning: false,
        results,
        executionTime,
      }));

      onSimulationComplete?.(results);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: error.message || 'Simulation failed',
      }));
    }
  }, [state.type, productivityParams, backlogParams, organizationId]);

  const renderProductivityParams = () => (
    <div className="param-section">
      <h3>Productivity Variance Parameters</h3>
      
      <div className="form-group">
        <label htmlFor="scenario">Scenario</label>
        <select
          id="scenario"
          value={productivityParams.scenario}
          onChange={(e) =>
            setProductivityParams((prev) => ({
              ...prev,
              scenario: e.target.value as VarianceScenario,
            }))
          }
        >
          <option value="consistent">Consistent (±5%)</option>
          <option value="volatile">Volatile (±25%)</option>
          <option value="declining">Declining (-30%)</option>
          <option value="improving">Improving (+30%)</option>
          <option value="cyclical">Cyclical (±15%)</option>
          <option value="shock">Shock Events (±30%)</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="days">Simulation Days</label>
          <input
            id="days"
            type="number"
            min="1"
            max="365"
            value={productivityParams.days}
            onChange={(e) =>
              setProductivityParams((prev) => ({
                ...prev,
                days: parseInt(e.target.value, 10),
              }))
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            value={productivityParams.startDate}
            onChange={(e) =>
              setProductivityParams((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="baselineUnits">Baseline Units/Hour</label>
          <input
            id="baselineUnits"
            type="number"
            step="0.1"
            min="0.1"
            value={productivityParams.baselineUnitsPerHour}
            onChange={(e) =>
              setProductivityParams((prev) => ({
                ...prev,
                baselineUnitsPerHour: parseFloat(e.target.value),
              }))
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="baselineStaff">Baseline Staff Count</label>
          <input
            id="baselineStaff"
            type="number"
            min="1"
            value={productivityParams.baselineStaff}
            onChange={(e) =>
              setProductivityParams((prev) => ({
                ...prev,
                baselineStaff: parseInt(e.target.value, 10),
              }))
            }
          />
        </div>
      </div>
    </div>
  );

  const renderBacklogParams = () => (
    <div className="param-section">
      <h3>Backlog Propagation Parameters</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="backlogDays">Simulation Days</label>
          <input
            id="backlogDays"
            type="number"
            min="1"
            max="365"
            value={backlogParams.days}
            onChange={(e) =>
              setBacklogParams((prev) => ({
                ...prev,
                days: parseInt(e.target.value, 10),
              }))
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="backlogStartDate">Start Date</label>
          <input
            id="backlogStartDate"
            type="date"
            value={backlogParams.startDate}
            onChange={(e) =>
              setBacklogParams((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dailyDemand">Daily Demand (items)</label>
          <input
            id="dailyDemand"
            type="number"
            min="1"
            value={backlogParams.dailyDemandCount}
            onChange={(e) =>
              setBacklogParams((prev) => ({
                ...prev,
                dailyDemandCount: parseInt(e.target.value, 10),
              }))
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="dailyCapacity">Daily Capacity (hours)</label>
          <input
            id="dailyCapacity"
            type="number"
            step="0.5"
            min="1"
            value={backlogParams.dailyCapacityHours}
            onChange={(e) =>
              setBacklogParams((prev) => ({
                ...prev,
                dailyCapacityHours: parseFloat(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="initialBacklog">Initial Backlog (items)</label>
        <input
          id="initialBacklog"
          type="number"
          min="0"
          value={backlogParams.initialBacklogCount}
          onChange={(e) =>
            setBacklogParams((prev) => ({
              ...prev,
              initialBacklogCount: parseInt(e.target.value, 10),
            }))
          }
        />
      </div>
    </div>
  );

  const renderResults = () => {
    if (!state.results) return null;

    return (
      <div className="results-section">
        <h3>
          Simulation Results
          {state.executionTime && (
            <span className="execution-time"> ({state.executionTime}ms)</span>
          )}
        </h3>

        {state.type === 'productivity' && (
          <div className="productivity-results">
            <div className="result-card">
              <div className="result-label">Mean Productivity</div>
              <div className="result-value">
                {state.results.summary?.mean_productivity?.toFixed(2) || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">Productivity Variance</div>
              <div className="result-value">
                {state.results.summary?.productivity_variance?.toFixed(3) || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">Baseline Capacity</div>
              <div className="result-value">
                {state.results.summary?.baseline_capacity?.toFixed(0) || 'N/A'} units
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">Staffing Impact</div>
              <div className="result-value">
                {state.results.summary?.net_staffing_impact || 0} staff
              </div>
            </div>
          </div>
        )}

        {state.type === 'backlog' && (
          <div className="backlog-results">
            {Object.entries(state.results.scenarios || {}).map(([name, data]: [string, any]) => (
              <div key={name} className="scenario-card">
                <h4>{name.replace(/_/g, ' ').toUpperCase()}</h4>
                <div className="scenario-metrics">
                  <div className="metric">
                    <span className="metric-label">Final Backlog:</span>
                    <span className="metric-value">{data.final_backlog || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">SLA Compliance:</span>
                    <span className="metric-value">
                      {data.sla_compliance?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Items Processed:</span>
                    <span className="metric-value">{data.items_processed || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {state.type === 'combined' && (
          <div className="combined-results">
            <div className="result-group">
              <h4>Productivity Variance</h4>
              <pre>{JSON.stringify(state.results.productivity?.summary, null, 2)}</pre>
            </div>
            <div className="result-group">
              <h4>Backlog Propagation</h4>
              <pre>{JSON.stringify(state.results.backlog?.scenarios, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="simulation-control-panel">
      <div className="panel-header">
        <h2>🎯 Simulation Control Panel</h2>
        <p className="panel-description">
          Run workforce simulations to analyze productivity variance and backlog propagation
        </p>
      </div>

      {/* Simulation Type Selector */}
      <div className="type-selector">
        <button
          className={`type-button ${state.type === 'productivity' ? 'active' : ''}`}
          onClick={() => setState((prev) => ({ ...prev, type: 'productivity' }))}
          disabled={state.isRunning}
        >
          📊 Productivity Variance
        </button>
        <button
          className={`type-button ${state.type === 'backlog' ? 'active' : ''}`}
          onClick={() => setState((prev) => ({ ...prev, type: 'backlog' }))}
          disabled={state.isRunning}
        >
          📦 Backlog Propagation
        </button>
        <button
          className={`type-button ${state.type === 'combined' ? 'active' : ''}`}
          onClick={() => setState((prev) => ({ ...prev, type: 'combined' }))}
          disabled={state.isRunning}
        >
          🔄 Combined Analysis
        </button>
      </div>

      {/* Parameters Form */}
      <div className="parameters-container">
        {(state.type === 'productivity' || state.type === 'combined') && renderProductivityParams()}
        {(state.type === 'backlog' || state.type === 'combined') && renderBacklogParams()}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="run-button"
          onClick={handleRunSimulation}
          disabled={state.isRunning}
        >
          {state.isRunning ? '⏳ Running Simulation...' : '▶️ Run Simulation'}
        </button>
        
        {state.results && (
          <>
            <button
              className="playback-button"
              onClick={() => setShowPlayback(true)}
              disabled={state.isRunning}
            >
              🎬 View Playback
            </button>
            <button
              className="clear-button"
              onClick={() => setState((prev) => ({ ...prev, results: null, error: null }))}
              disabled={state.isRunning}
            >
              🗑️ Clear Results
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="error-banner">
          <strong>❌ Error:</strong> {state.error}
        </div>
      )}

      {/* Results Display */}
      {renderResults()}

      {/* Loading Indicator */}
      {state.isRunning && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Running simulation...</p>
        </div>
      )}

      {/* Playback View */}
      {showPlayback && state.results && (
        <div className="playback-modal">
          <SimulationPlayback
            simulationResults={state.results}
            simulationType={state.type}
            onClose={() => setShowPlayback(false)}
          />
        </div>
      )}
    </div>
  );
};

export default SimulationControlPanel;
