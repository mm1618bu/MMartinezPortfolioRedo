import React, { useEffect, useState, useCallback } from 'react';
import { demandService, Demand, DemandSummary } from '../../services/demandService';
import { PriorityChart } from './charts/PriorityChart.tsx';
import { ShiftTypeChart } from './charts/ShiftTypeChart.tsx';
import { EmployeeRequirementsChart } from './charts/EmployeeRequirementsChart.tsx';
import { TimelineChart } from './charts/TimelineChart.tsx';
import { DepartmentChart } from './charts/DepartmentChart.tsx';
import { SkillsChart } from './charts/SkillsChart.tsx';
import './DemandCharts.css';

interface ChartData {
  summary?: DemandSummary;
  demands?: Demand[];
  loading: boolean;
  error?: string;
}

export const DemandCharts: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData>({ loading: true });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setChartData({ loading: true });

      // Fetch grid data with filters
      const query: any = {
        pageSize: 1000,
        startDate: dateRange.start,
        endDate: dateRange.end,
      };

      if (selectedPriority) {
        query.priorities = [selectedPriority];
      }

      if (selectedDepartment) {
        query.departmentIds = [selectedDepartment];
      }

      const [gridResponse, summaryResponse] = await Promise.all([
        demandService.getGridData(query),
        demandService.getGridSummary(),
      ]);

      setChartData({
        demands: gridResponse.data,
        summary: summaryResponse,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setChartData({
        loading: false,
        error: message,
      });
    }
  }, [dateRange, selectedPriority, selectedDepartment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (filter: 'priority' | 'department', value: string) => {
    if (filter === 'priority') {
      setSelectedPriority(value);
    } else {
      setSelectedDepartment(value);
    }
  };

  const handleClearFilters = () => {
    setSelectedPriority('');
    setSelectedDepartment('');
    setDateRange({
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    });
  };

  if (chartData.loading) {
    return (
      <div className="charts-container">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading visualization data...</p>
        </div>
      </div>
    );
  }

  if (chartData.error) {
    return (
      <div className="charts-container">
        <div className="alert alert-error">
          <strong>Error:</strong> {chartData.error}
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      {/* Header */}
      <div className="charts-header">
        <h1>Demand Analytics</h1>
        <p className="subtitle">Real-time visualization of staffing demands</p>
      </div>

      {/* Summary Cards */}
      {chartData.summary && (
        <div className="summary-cards-grid">
          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <span className="card-label">Total Demands</span>
              <span className="card-value">{chartData.summary.totalRecords}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <span className="card-label">Employees Needed</span>
              <span className="card-value">{chartData.summary.totalEmployees}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <span className="card-label">Daily Average</span>
              <span className="card-value">
                {chartData.summary.averageEmployeesPerDay.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">⚠️</div>
            <div className="card-content">
              <span className="card-label">High Priority</span>
              <span className="card-value">
                {chartData.summary.byPriority?.['high'] || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="charts-controls">
        <div className="control-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            id="startDate"
            type="date"
            name="start"
            value={dateRange.start}
            onChange={handleDateRangeChange}
            className="date-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            id="endDate"
            type="date"
            name="end"
            value={dateRange.end}
            onChange={handleDateRangeChange}
            className="date-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="priorityFilter">Priority:</label>
          <select
            id="priorityFilter"
            value={selectedPriority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="departmentFilter">Department:</label>
          <select
            id="departmentFilter"
            value={selectedDepartment}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {/* Departments will be populated from available filters in future enhancement */}
          </select>
        </div>

        <button className="btn btn-secondary" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Top Row - Key Metrics */}
        <div className="chart-item chart-item-full">
          <div className="chart-wrapper">
            <h3>Demand Timeline (Last 30 Days)</h3>
            {chartData.demands && <TimelineChart demands={chartData.demands} />}
          </div>
        </div>

        {/* Second Row - Priority & Shift Type */}
        <div className="chart-item chart-item-half">
          <div className="chart-wrapper">
            <h3>Demands by Priority</h3>
            {chartData.demands && <PriorityChart demands={chartData.demands} />}
          </div>
        </div>

        <div className="chart-item chart-item-half">
          <div className="chart-wrapper">
            <h3>Demands by Shift Type</h3>
            {chartData.demands && <ShiftTypeChart demands={chartData.demands} />}
          </div>
        </div>

        {/* Third Row - Employee & Department */}
        <div className="chart-item chart-item-half">
          <div className="chart-wrapper">
            <h3>Employee Requirements Distribution</h3>
            {chartData.demands && <EmployeeRequirementsChart demands={chartData.demands} />}
          </div>
        </div>

        <div className="chart-item chart-item-half">
          <div className="chart-wrapper">
            <h3>Demands by Department</h3>
            {chartData.demands && <DepartmentChart demands={chartData.demands} />}
          </div>
        </div>

        {/* Fourth Row - Skills */}
        <div className="chart-item chart-item-full">
          <div className="chart-wrapper">
            <h3>Top Required Skills</h3>
            {chartData.demands && <SkillsChart demands={chartData.demands} />}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {(!chartData.demands || chartData.demands.length === 0) && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Data Available</h3>
          <p>No demands found for the selected filters. Try adjusting your date range or filters.</p>
        </div>
      )}
    </div>
  );
};
