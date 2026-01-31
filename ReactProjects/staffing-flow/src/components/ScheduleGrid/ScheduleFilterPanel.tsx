import React, { useState, useCallback } from 'react';
import './TimeIndicator.scss';

interface ScheduleFilterPanelProps {
  onApplyFilters: (filters: FilterOptions) => void;
  onResetFilters: () => void;
  totalAssignments: number;
}

export interface FilterOptions {
  statuses?: string[];
  violationTypes?: string[];
  qualityRange?: [number, number];
  dateRange?: [string, string];
  employeeIds?: string[];
  shiftTypes?: string[];
  hasOverrides?: boolean;
}

export const ScheduleFilterPanel: React.FC<ScheduleFilterPanelProps> = ({
  onApplyFilters,
  onResetFilters,
  totalAssignments,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    statuses: [],
    violationTypes: [],
    qualityRange: [0, 100],
    dateRange: undefined,
    employeeIds: [],
    shiftTypes: [],
    hasOverrides: false,
  });

  const handleStatusChange = useCallback(
    (status: string) => {
      setFilters((prev) => ({
        ...prev,
        statuses: (prev.statuses || []).includes(status)
          ? (prev.statuses || []).filter((s) => s !== status)
          : [...(prev.statuses || []), status],
      }));
    },
    []
  );

  const handleViolationChange = useCallback(
    (violationType: string) => {
      setFilters((prev) => ({
        ...prev,
        violationTypes: (prev.violationTypes || []).includes(violationType)
          ? (prev.violationTypes || []).filter((v) => v !== violationType)
          : [...(prev.violationTypes || []), violationType],
      }));
    },
    []
  );

  const handleQualityChange = useCallback(
    (value: number, type: 'min' | 'max') => {
      setFilters((prev) => ({
        ...prev,
        qualityRange: type === 'min' ? [value, prev.qualityRange?.[1] || 100] : [prev.qualityRange?.[0] || 0, value],
      }));
    },
    []
  );

  const handleDateChange = useCallback(
    (date: string, type: 'from' | 'to') => {
      setFilters((prev) => ({
        ...prev,
        dateRange: type === 'from'
          ? [date, prev.dateRange?.[1] || '']
          : [prev.dateRange?.[0] || '', date],
      }));
    },
    []
  );

  const handleApply = useCallback(() => {
    onApplyFilters(filters);
  }, [filters, onApplyFilters]);

  const handleReset = useCallback(() => {
    setFilters({
      statuses: [],
      violationTypes: [],
      qualityRange: [0, 100],
      dateRange: undefined,
      employeeIds: [],
      shiftTypes: [],
      hasOverrides: false,
    });
    onResetFilters();
  }, [onResetFilters]);

  return (
    <div className="schedule-filter-panel">
      <div className="filter-section">
        <label className="filter-label">Assignment Status</label>
        <div className="filter-options">
          {['proposed', 'assigned', 'confirmed', 'active', 'completed', 'cancelled'].map(
            (status) => (
              <div key={status} className="filter-checkbox">
                <input
                  type="checkbox"
                  id={`status-${status}`}
                  checked={(filters.statuses || []).includes(status)}
                  onChange={() => handleStatusChange(status)}
                />
                <label htmlFor={`status-${status}`} style={{ textTransform: 'capitalize' }}>
                  {status}
                </label>
              </div>
            )
          )}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Constraint Violations</label>
        <div className="filter-options">
          {['hard', 'soft', 'warnings'].map((type) => (
            <div key={type} className="filter-checkbox">
              <input
                type="checkbox"
                id={`violation-${type}`}
                checked={(filters.violationTypes || []).includes(type)}
                onChange={() => handleViolationChange(type)}
              />
              <label htmlFor={`violation-${type}`} style={{ textTransform: 'capitalize' }}>
                {type} Violations
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Quality Range (%)</label>
        <div className="filter-options">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.qualityRange?.[0] || 0}
              onChange={(e) => handleQualityChange(parseInt(e.target.value), 'min')}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
              {filters.qualityRange?.[0] || 0}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.qualityRange?.[1] || 100}
              onChange={(e) => handleQualityChange(parseInt(e.target.value), 'max')}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
              {filters.qualityRange?.[1] || 100}%
            </span>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Date Range</label>
        <div className="filter-options">
          <input
            type="date"
            value={filters.dateRange?.[0] || ''}
            onChange={(e) => handleDateChange(e.target.value, 'from')}
            style={{
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          />
          <input
            type="date"
            value={filters.dateRange?.[1] || ''}
            onChange={(e) => handleDateChange(e.target.value, 'to')}
            style={{
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-checkbox">
          <input
            type="checkbox"
            id="override-required"
            checked={filters.hasOverrides || false}
            onChange={(e) => setFilters((prev) => ({ ...prev, hasOverrides: e.target.checked }))}
          />
          <label htmlFor="override-required">Show Override Required Only</label>
        </div>
      </div>

      <div className="filter-actions">
        <button className="apply" onClick={handleApply}>
          Apply Filters
        </button>
        <button className="reset" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div style={{ padding: '12px 0', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #ddd', marginTop: '12px' }}>
        Showing {totalAssignments} assignment(s)
      </div>
    </div>
  );
};

export default ScheduleFilterPanel;
