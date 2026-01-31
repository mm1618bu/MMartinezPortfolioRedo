import React, { useState, useCallback, useMemo, useRef } from 'react';
import ScheduleLegend from './ScheduleLegend';
import ScheduleStatisticsPanel from './ScheduleStatisticsPanel';
import ScheduleFilterPanel, { FilterOptions } from './ScheduleFilterPanel';
import DraggableAssignmentCell from './DraggableAssignmentCell';
import DroppableShiftSlot from './DroppableShiftSlot';
import { DragDropProvider } from './DragDropContext';
import DropValidationService from './DropValidationService';
import { ValidationWarningsPanel } from './ValidationWarningsPanel';
import { ValidationToastContainer } from './ValidationToast';
import { CoverageHeatmap } from './CoverageHeatmap';
import { useRealtimeValidation } from './useRealtimeValidation';
import './ScheduleGrid.scss';
import type { Schedule, ScheduleAssignment } from '../../types/scheduleAPI';

interface ScheduleGridProps {
  schedule: Schedule;
  assignments: ScheduleAssignment[];
  onAssignmentSelect?: (assignment: ScheduleAssignment) => void;
  onAssignmentEdit?: (assignment: ScheduleAssignment) => void;
  onAssignmentDelete?: (assignmentId: string) => void;
  onAssignmentMove?: (assignmentId: string, targetEmployeeId: string, targetDate: string) => Promise<void>;
  onSchedulePublish?: () => void;
  onScheduleExport?: (format: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedule,
  assignments,
  onAssignmentSelect,
  onAssignmentEdit,
  onAssignmentDelete,
  onAssignmentMove,
  onSchedulePublish,
  onScheduleExport,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduleAssignment | null>(null);
  const [dateRange, setDateRange] = useState([
    schedule.schedule_start_date,
    schedule.schedule_end_date,
  ]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const gridContentRef = useRef<HTMLDivElement>(null);

  // Initialize real-time validation
  const {
    warnings,
    totalWarnings,
    criticalCount,
    warningCount,
    dismissWarning,
    getAssignmentSeverity,
  } = useRealtimeValidation(schedule, assignments, {
    autoValidate: true,
    validationDebounceMs: 300,
  });

  // Generate date range based on view mode
  const displayDates = useMemo(() => {
    const start = new Date(dateRange[0]);
    const end = new Date(dateRange[1]);
    const dates: string[] = [];

    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }, [dateRange]);

  // Group assignments by employee
  const assignmentsByEmployee = useMemo(() => {
    const grouped = new Map<string, ScheduleAssignment[]>();

    const filteredAssignments = assignments.filter((a) => {
      if (filters.statuses && !filters.statuses.includes(a.status)) return false;
      if (filters.violationTypes) {
        if (
          filters.violationTypes.includes('hard') &&
          !a.has_hard_violations
        )
          return false;
        if (
          filters.violationTypes.includes('soft') &&
          !a.has_soft_violations
        )
          return false;
      }
      if (
        filters.qualityRange &&
        a.match_score &&
        (a.match_score < filters.qualityRange[0] || a.match_score > filters.qualityRange[1])
      )
        return false;

      return true;
    });

    filteredAssignments.forEach((assignment) => {
      if (!grouped.has(assignment.employee_id)) {
        grouped.set(assignment.employee_id, []);
      }
      grouped.get(assignment.employee_id)!.push(assignment);
    });

    return grouped;
  }, [assignments, filters]);

  const handleAssignmentSelect = useCallback(
    (assignment: ScheduleAssignment) => {
      setSelectedAssignment(assignment);
      onAssignmentSelect?.(assignment);
    },
    [onAssignmentSelect]
  );

  const handleAssignmentMove = useCallback(
    async (
      assignment: ScheduleAssignment,
      targetEmployeeId: string,
      targetDate: string
    ) => {
      // Validate the drop
      const validation = DropValidationService.validateDrop(
        assignment,
        targetEmployeeId,
        targetDate,
        assignments
      );

      if (!validation.isValid) {
        const errorMsg = DropValidationService.getValidationMessage(validation);
        throw new Error(errorMsg);
      }

      // Warn about warnings but allow move
      if (validation.warnings.length > 0) {
        console.warn('Drop warnings:', validation.warnings);
      }

      // Call the parent's move handler
      try {
        await onAssignmentMove?.(assignment.id, targetEmployeeId, targetDate);
        setSelectedAssignment(null);
      } catch (error) {
        throw error;
      }
    },
    [assignments, onAssignmentMove]
  );

  const handleFilterApply = useCallback((appliedFilters: FilterOptions) => {
    setFilters(appliedFilters);
    setShowFilters(false);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({});
  }, []);

  const handleExport = useCallback(
    (format: string) => {
      onScheduleExport?.(format);
    },
    [onScheduleExport]
  );

  const handleGridScroll = () => {
    // Scroll synchronization logic would go here
  };

  return (
    <DragDropProvider onAssignmentDrop={handleAssignmentMove}>
      <div className="schedule-grid-container">
        {/* Toast Notifications for Critical Warnings */}
        <ValidationToastContainer
          warnings={warnings}
          onDismiss={dismissWarning}
          maxToasts={3}
          position="top-right"
        />

        {/* Header */}
        <div className="schedule-grid-header">
          <div className="header-left">
            <h2>{schedule.name}</h2>
            <div className={`schedule-status ${schedule.status}`}>
              <span>{schedule.status.toUpperCase()}</span>
              {schedule.quality_score !== undefined && (
                <span>Quality: {Math.round(schedule.quality_score)}/100</span>
              )}
            </div>
          </div>
          <div className="header-right">
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)} 
              className={`btn-secondary heatmap-toggle ${showHeatmap ? 'active' : ''}`}
              title="Toggle coverage heatmap visualization"
            >
              {showHeatmap ? '📊 Hide' : '📊 Show'} Heatmap
            </button>
            <button 
              onClick={() => setShowValidationPanel(!showValidationPanel)} 
              className={`btn-secondary validation-toggle ${
                criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : ''
              }`}
            >
              {showValidationPanel ? 'Hide' : 'Show'} Validation
              {totalWarnings > 0 && (
                <span className="warning-badge">{totalWarnings}</span>
              )}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button 
              onClick={onSchedulePublish} 
              className="btn-primary" 
              disabled={schedule.status !== 'draft' || criticalCount > 0}
              title={criticalCount > 0 ? 'Cannot publish: schedule has critical violations' : ''}
            >
              Publish Schedule
            </button>
            <button onClick={() => handleExport('csv')} className="btn-secondary">
              Export CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="btn-secondary">
              Export PDF
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="schedule-toolbar">
          <div className="toolbar-left">
            <div className="view-switcher">
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  className={viewMode === mode ? 'active' : ''}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <div className="date-range-picker">
              <input
                type="date"
                value={dateRange[0]}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
              Filters
            </button>
          </div>
        </div>

        {/* Validation Warnings Panel */}
        {showValidationPanel && totalWarnings > 0 && (
          <div style={{ padding: '16px', backgroundColor: '#fff9e6', borderBottom: '2px solid #ffa500' }}>
            <ValidationWarningsPanel
              warnings={warnings}
              onDismiss={dismissWarning}
              onNavigateToAssignment={(assignmentId) => {
                const assignment = assignments.find(a => a.id === assignmentId);
                if (assignment) {
                  handleAssignmentSelect(assignment);
                }
              }}
              compactMode={false}
            />
          </div>
        )}

        {/* Coverage Heatmap */}
        {showHeatmap && (
          <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
            <CoverageHeatmap
              schedule={schedule}
              assignments={assignments}
              viewMode={viewMode === 'day' ? 'hourly' : viewMode === 'week' ? 'daily' : 'weekly'}
              showLegend={true}
              onCellClick={(date) => {
                // Navigate to specific date/time
                setDateRange([date, date]);
                setViewMode('day');
              }}
            />
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <ScheduleFilterPanel
                onApplyFilters={handleFilterApply}
                onResetFilters={handleFilterReset}
                totalAssignments={assignments.length}
              />

              <ScheduleStatisticsPanel
                assignments={assignments}
                scheduleMetrics={{
                  quality_score: schedule.quality_score,
                  coverage_percentage: schedule.coverage_percentage,
                  workload_balance_score: schedule.workload_balance_score,
                  hard_violation_count: schedule.hard_violation_count,
                  soft_violation_count: schedule.soft_violation_count,
                }}
              />

              <ScheduleLegend assignments={assignments} />
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="schedule-grid-main">
          {/* Frozen Left Column */}
          <div className="grid-frozen">
            <div className="frozen-header">Employee</div>
            <div className="frozen-rows">
              {Array.from(assignmentsByEmployee.keys()).map((employeeId) => (
                <div
                  key={employeeId}
                  className={`employee-cell ${
                    selectedAssignment?.employee_id === employeeId ? 'highlighted' : ''
                  }`}
                >
                  <div className="employee-name">
                    Employee {employeeId.substring(0, 8)}
                  </div>
                  <div className="employee-meta">
                    <span>
                      {assignmentsByEmployee.get(employeeId)?.length || 0} assignments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Grid Content */}
          <div className="grid-content">
            <div className="grid-header-row" ref={gridContentRef}>
              {displayDates.map((date) => (
                <div key={date} className="time-header">
                  <div className="date">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </div>
                  <div className="day-of-week">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid-rows" onScroll={handleGridScroll}>
              {Array.from(assignmentsByEmployee.entries()).map(([employeeId, empAssignments]) => (
                <div key={employeeId} className="schedule-grid-row">
                  <div className="shifts-container">
                    {displayDates.map((date) => {
                      const dayAssignments = empAssignments.filter(
                        (a) => a.shift_date === date
                      );

                      return (
                        <DroppableShiftSlot
                          key={`${employeeId}-${date}`}
                          employeeId={employeeId}
                          date={date}
                          assignments={dayAssignments}
                        >
                          {dayAssignments.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {dayAssignments.map((assignment) => {
                                const severity = getAssignmentSeverity(assignment.id);
                                return (
                                  <div
                                    key={assignment.id}
                                    className={`assignment-wrapper ${
                                      severity ? `has-${severity}-warning` : ''
                                    }`}
                                    title={
                                      severity
                                        ? `Has ${severity} validation warning(s)`
                                        : undefined
                                    }
                                  >
                                    <DraggableAssignmentCell
                                      assignment={assignment}
                                      employeeId={employeeId}
                                      date={date}
                                      onSelect={handleAssignmentSelect}
                                      onEdit={onAssignmentEdit}
                                      onDelete={onAssignmentDelete}
                                      isSelected={selectedAssignment?.id === assignment.id}
                                    />
                                    {severity && (
                                      <span className={`validation-indicator ${severity}`}>
                                        {severity === 'critical' ? '⚠️' : severity === 'warning' ? '⚡' : 'ℹ️'}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="empty">-</span>
                          )}
                        </DroppableShiftSlot>
                      );
                    })}
                  </div>

                  <div className="hours-summary">
                    <div className="hours-value">
                      {empAssignments.reduce((sum, a) => sum + (a.duration_hours || 0), 0).toFixed(1)}
                    </div>
                    <div className="hours-label">hrs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="schedule-grid-footer">
          <div className="footer-stats">
            <div className="stat">
              <span className="label">Total Shifts:</span>
              <span className="value">{schedule.total_shifts}</span>
            </div>
            <div className="stat">
              <span className="label">Assigned:</span>
              <span className="value">{schedule.assigned_shifts}</span>
            </div>
            <div className="stat">
              <span className="label">Coverage:</span>
              <span className="value">{Math.round(schedule.coverage_percentage)}%</span>
            </div>
            <div className="stat">
              <span className="label">Quality:</span>
              <span className="value">
                {schedule.quality_score !== undefined ? Math.round(schedule.quality_score) : 'N/A'}/100
              </span>
            </div>
          </div>
          <div className="footer-actions">
            <button onClick={() => handleExport('json')} className="btn-secondary">
              JSON
            </button>
            <button onClick={() => handleExport('excel')} className="btn-secondary">
              Excel
            </button>
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
};

export default ScheduleGrid;
