/**
 * Schedule Grid UI Components
 * Comprehensive schedule visualization and management interface
 */

export { ScheduleGrid } from './ScheduleGrid';
export { AssignmentCell } from './AssignmentCell';
export { ScheduleLegend } from './ScheduleLegend';
export { ScheduleStatisticsPanel } from './ScheduleStatisticsPanel';
export { ScheduleFilterPanel, type FilterOptions } from './ScheduleFilterPanel';

// Drag and Drop Components
export { DragDropProvider, useDragDrop, type DragDropContextType } from './DragDropContext';
export { DraggableAssignmentCell } from './DraggableAssignmentCell';
export { DroppableShiftSlot } from './DroppableShiftSlot';
export { DropValidationService, type DropValidationResult } from './DropValidationService';

// Real-time Validation Components
export { ValidationWarningsPanel } from './ValidationWarningsPanel';
export { AssignmentValidationIndicator, AssignmentValidationHighlight, ValidationBadge } from './AssignmentValidationIndicator';
export { RealtimeValidationService, type ValidationWarning, type ValidationContext } from './RealtimeValidationService';
export { useRealtimeValidation } from './useRealtimeValidation';

// Styles
export * from './ScheduleGrid.scss';
export * from './ScheduleGridRow.scss';
export * from './AssignmentCell.scss';
export * from './TimeIndicator.scss';
export * from './DropZone.scss';
export * from './ValidationWarningsPanel.scss';
export * from './AssignmentValidationIndicator.scss';
