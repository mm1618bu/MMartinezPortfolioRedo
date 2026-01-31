import React, { createContext, useState, useCallback, useContext, ReactNode, useRef, useEffect } from 'react';
import type { ScheduleAssignment } from '../../types/scheduleAPI';

export interface DragState {
  draggedAssignment: ScheduleAssignment | null;
  sourceEmployeeId: string | null;
  sourceDate: string | null;
  isDragging: boolean;
  dragError: string | null;
}

export interface DropZoneCoordinates {
  employeeId: string;
  date: string;
}

type OnDropCallback = (
  assignment: ScheduleAssignment,
  targetEmployeeId: string,
  targetDate: string
) => Promise<void>;

interface DragContextType {
  dragState: DragState;
  startDrag: (assignment: ScheduleAssignment, employeeId: string, date: string) => void;
  endDrag: () => void;
  setDragError: (error: string | null) => void;
  canDropAt: (targetEmployeeId: string, targetDate: string) => boolean;
  onDrop: (targetEmployeeId: string, targetDate: string) => Promise<void>;
  onDropCallback?: OnDropCallback;
  setOnDropCallback: (callback: OnDropCallback | undefined) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

interface DragDropProviderProps {
  children: ReactNode;
  onAssignmentDrop?: (
    assignment: ScheduleAssignment,
    targetEmployeeId: string,
    targetDate: string
  ) => Promise<void>;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onAssignmentDrop,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedAssignment: null,
    sourceEmployeeId: null,
    sourceDate: null,
    isDragging: false,
    dragError: null,
  });

  const onDropCallbackRef = useRef<OnDropCallback | undefined>(onAssignmentDrop);

  useEffect(() => {
    onDropCallbackRef.current = onAssignmentDrop;
  }, [onAssignmentDrop]);

  const startDrag = useCallback(
    (assignment: ScheduleAssignment, employeeId: string, date: string) => {
      setDragState({
        draggedAssignment: assignment,
        sourceEmployeeId: employeeId,
        sourceDate: date,
        isDragging: true,
        dragError: null,
      });
    },
    []
  );

  const endDrag = useCallback(() => {
    setDragState({
      draggedAssignment: null,
      sourceEmployeeId: null,
      sourceDate: null,
      isDragging: false,
      dragError: null,
    });
  }, []);

  const setDragError = useCallback((error: string | null) => {
    setDragState((prev) => ({
      ...prev,
      dragError: error,
    }));
  }, []);

  const canDropAt = useCallback(
    (targetEmployeeId: string, targetDate: string) => {
      if (!dragState.draggedAssignment) return false;

      // Cannot drop on same location
      if (
        targetEmployeeId === dragState.sourceEmployeeId &&
        targetDate === dragState.sourceDate
      ) {
        return false;
      }

      // Additional validation can be added here
      // (e.g., check employee availability, skill match, etc.)

      return true;
    },
    [dragState.draggedAssignment, dragState.sourceEmployeeId, dragState.sourceDate]
  );

  const onDrop = useCallback(
    async (targetEmployeeId: string, targetDate: string) => {
      if (!dragState.draggedAssignment) {
        setDragError('No assignment to drop');
        return;
      }

      if (!canDropAt(targetEmployeeId, targetDate)) {
        setDragError('Cannot drop assignment at this location');
        return;
      }

      try {
        if (onDropCallbackRef.current) {
          await onDropCallbackRef.current(dragState.draggedAssignment, targetEmployeeId, targetDate);
        }
        endDrag();
      } catch (error) {
        setDragError((error as Error).message || 'Failed to move assignment');
      }
    },
    [dragState.draggedAssignment, canDropAt, endDrag]
  );

  const setOnDropCallback = useCallback((callback: OnDropCallback | undefined) => {
    onDropCallbackRef.current = callback;
  }, []);

  const value: DragContextType = {
    dragState,
    startDrag,
    endDrag,
    setDragError,
    canDropAt,
    onDrop,
    onDropCallback: onDropCallbackRef.current,
    setOnDropCallback,
  };

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
};

export const useDragDrop = (): DragContextType => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};
