import React, { useState, useCallback } from 'react';
import { useDragDrop } from './DragDropContext';
import './DropZone.scss';
import type { ScheduleAssignment } from '../../types/scheduleAPI';

interface DroppableShiftSlotProps {
  employeeId: string;
  date: string;
  assignments: ScheduleAssignment[];
  children?: React.ReactNode;
}

export const DroppableShiftSlot: React.FC<DroppableShiftSlotProps> = ({
  employeeId,
  date,
  assignments: _assignments,
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const { dragState, canDropAt, onDrop } = useDragDrop();

  const canAcceptDrop = canDropAt(employeeId, date);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!canAcceptDrop) {
        e.dataTransfer.dropEffect = 'none';
        setIsDragOver(false);
        setDropError('Cannot drop here');
        return;
      }

      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
      setDropError(null);
    },
    [canAcceptDrop]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (canAcceptDrop) {
        setIsDragOver(true);
        setDropError(null);
      }
    },
    [canAcceptDrop]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragOver to false if we're leaving this specific element
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!canAcceptDrop) {
        setDropError('Cannot drop assignment here');
        return;
      }

      const assignmentId = e.dataTransfer.getData('application/assignment-id');
      if (!assignmentId) {
        setDropError('Invalid assignment data');
        return;
      }

      try {
        await onDrop(employeeId, date);
        setDropError(null);
      } catch (error) {
        setDropError((error as Error).message || 'Failed to move assignment');
      }
    },
    [employeeId, date, canAcceptDrop, onDrop]
  );

  const isEmpty = _assignments.length === 0;

  return (
    <div
      className={`droppable-shift-slot ${isDragOver && canAcceptDrop ? 'drag-over' : ''} ${
        isDragOver && !canAcceptDrop ? 'drag-over-invalid' : ''
      } ${isEmpty ? 'empty' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag over feedback */}
      {dragState.isDragging && canAcceptDrop && (
        <div className="drop-indicator">
          <div className="indicator-icon">📍</div>
          <div className="indicator-text">Drop assignment here</div>
        </div>
      )}

      {dragState.isDragging && !canAcceptDrop && dropError && (
        <div className="drop-error">
          <div className="error-icon">✕</div>
          <div className="error-text">{dropError}</div>
        </div>
      )}

      {/* Main content */}
      {isEmpty && !dragState.isDragging && <span className="empty-slot">-</span>}

      {children && <div className="slot-content">{children}</div>}
    </div>
  );
};

export default DroppableShiftSlot;
