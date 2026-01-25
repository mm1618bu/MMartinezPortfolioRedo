import React, { useState } from 'react';

interface DemandFiltersProps {
  filters: {
    departmentIds: string[];
    shiftTypes: string[];
    priorities: string[];
    startDate: string;
    endDate: string;
    minEmployees?: number;
    maxEmployees?: number;
    search: string;
  };
  availableOptions: {
    departments: Array<{ id: string; name: string }>;
    shiftTypes: string[];
    priorities: string[];
  };
  onFiltersChange: (filters: any) => void;
  onExport: (format: 'csv' | 'json' | 'xlsx') => void;
}

const DemandFilters: React.FC<DemandFiltersProps> = ({
  filters,
  availableOptions,
  onFiltersChange,
  onExport,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value,
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleDepartmentToggle = (deptId: string) => {
    const newDepts = filters.departmentIds.includes(deptId)
      ? filters.departmentIds.filter(id => id !== deptId)
      : [...filters.departmentIds, deptId];

    onFiltersChange({
      ...filters,
      departmentIds: newDepts,
    });
  };

  const handleShiftToggle = (shift: string) => {
    const newShifts = filters.shiftTypes.includes(shift)
      ? filters.shiftTypes.filter(s => s !== shift)
      : [...filters.shiftTypes, shift];

    onFiltersChange({
      ...filters,
      shiftTypes: newShifts,
    });
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];

    onFiltersChange({
      ...filters,
      priorities: newPriorities,
    });
  };

  const handleRangeChange = (field: 'minEmployees' | 'maxEmployees', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? parseInt(value) : undefined,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      departmentIds: [],
      shiftTypes: [],
      priorities: [],
      startDate: '',
      endDate: '',
      minEmployees: undefined,
      maxEmployees: undefined,
      search: '',
    });
  };

  const activeFilterCount =
    filters.departmentIds.length +
    filters.shiftTypes.length +
    filters.priorities.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.minEmployees !== undefined ? 1 : 0) +
    (filters.maxEmployees !== undefined ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="demand-filters">
      <div className="filter-header">
        <h3>Filters</h3>
        {activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount} active</span>
        )}
      </div>

      {/* Search */}
      <div className="filter-section search-section">
        <input
          type="text"
          placeholder="Search notes, departments..."
          value={filters.search}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {/* Basic Filters */}
      <div className="filter-grid">
        {/* Date Range */}
        <div className="filter-group">
          <label className="filter-label">Date Range</label>
          <div className="date-inputs">
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleDateChange('startDate', e.target.value)}
              className="date-input"
              placeholder="Start Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleDateChange('endDate', e.target.value)}
              className="date-input"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Shift Types */}
        <div className="filter-group">
          <label className="filter-label">Shift Type</label>
          <div className="checkbox-group">
            {availableOptions.shiftTypes.map(shift => (
              <label key={shift} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.shiftTypes.includes(shift)}
                  onChange={() => handleShiftToggle(shift)}
                />
                <span>{shift}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div className="filter-group">
          <label className="filter-label">Priority</label>
          <div className="checkbox-group">
            {availableOptions.priorities.map(priority => (
              <label key={priority} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.priorities.includes(priority)}
                  onChange={() => handlePriorityToggle(priority)}
                />
                <span>{priority}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Filters
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters">
          {/* Departments */}
          <div className="filter-group">
            <label className="filter-label">Departments</label>
            <div className="checkbox-group">
              {availableOptions.departments.map(dept => (
                <label key={dept.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.departmentIds.includes(dept.id)}
                    onChange={() => handleDepartmentToggle(dept.id)}
                  />
                  <span>{dept.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Employee Count Range */}
          <div className="filter-group">
            <label className="filter-label">Employees Needed</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.minEmployees || ''}
                onChange={e => handleRangeChange('minEmployees', e.target.value)}
                className="range-input"
                min="0"
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxEmployees || ''}
                onChange={e => handleRangeChange('maxEmployees', e.target.value)}
                className="range-input"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="filter-actions">
        {activeFilterCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            Clear Filters
          </button>
        )}
        <div className="export-buttons">
          <button className="btn btn-sm" onClick={() => onExport('csv')} title="Export as CSV">
            📥 CSV
          </button>
          <button className="btn btn-sm" onClick={() => onExport('json')} title="Export as JSON">
            📥 JSON
          </button>
          <button className="btn btn-sm" onClick={() => onExport('xlsx')} title="Export as Excel">
            📥 Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemandFilters;
