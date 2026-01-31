import { useState, useCallback, useMemo, useEffect } from 'react';
import RealtimeValidationService, { ValidationWarning } from './RealtimeValidationService';
import type { Schedule, ScheduleAssignment } from '../../types/scheduleAPI';

interface UseRealtimeValidationOptions {
  autoValidate?: boolean;
  validationDebounceMs?: number;
}

export const useRealtimeValidation = (
  schedule: Schedule | null,
  assignments: ScheduleAssignment[],
  options: UseRealtimeValidationOptions = {}
) => {
  const { autoValidate = true, validationDebounceMs = 500 } = options;

  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [dismissedWarningIds, setDismissedWarningIds] = useState<Set<string>>(new Set());

  // Validate schedule
  const validateSchedule = useCallback(async () => {
    if (!schedule) {
      setWarnings([]);
      return;
    }

    try {
      // Simulate async validation with setTimeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      const validationWarnings = RealtimeValidationService.validateSchedule(
        schedule,
        assignments
      );

      setWarnings(validationWarnings);
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [schedule, assignments]);

  // Auto-validate with debounce
  useEffect(() => {
    if (!autoValidate || !schedule) return;

    const debounceTimer = setTimeout(() => {
      validateSchedule();
    }, validationDebounceMs);

    return () => clearTimeout(debounceTimer);
  }, [schedule, assignments, autoValidate, validationDebounceMs, validateSchedule]);

  // Dismiss warning
  const dismissWarning = useCallback((warningId: string) => {
    setDismissedWarningIds((prev) => new Set([...prev, warningId]));
  }, []);

  // Dismiss all warnings of severity
  const dismissAllBySeverity = useCallback((severity: ValidationWarning['severity']) => {
    const toDelete = warnings
      .filter((w) => w.severity === severity)
      .map((w) => w.id);

    setDismissedWarningIds((prev) => new Set([...prev, ...toDelete]));
  }, [warnings]);

  // Clear all dismissed warnings
  const clearDismissed = useCallback(() => {
    setDismissedWarningIds(new Set());
  }, []);

  // Get visible warnings (excluding dismissed)
  const visibleWarnings = useMemo(() => {
    return warnings.filter((w) => !dismissedWarningIds.has(w.id));
  }, [warnings, dismissedWarningIds]);

  // Group warnings by severity
  const warningsBySeverity = useMemo(() => {
    return RealtimeValidationService.groupBySeverity(visibleWarnings);
  }, [visibleWarnings]);

  // Get warnings for specific assignment
  const getWarningsForAssignment = useCallback(
    (assignmentId: string) => {
      return RealtimeValidationService.getWarningsForAssignment(visibleWarnings, assignmentId);
    },
    [visibleWarnings]
  );

  // Get warnings for specific employee
  const getWarningsForEmployee = useCallback(
    (employeeId: string) => {
      return RealtimeValidationService.getWarningsForEmployee(visibleWarnings, employeeId);
    },
    [visibleWarnings]
  );

  // Check if assignment has critical issues
  const hasAssignmentIssues = useCallback(
    (assignmentId: string) => {
      const assignmentWarnings = getWarningsForAssignment(assignmentId);
      return assignmentWarnings.length > 0;
    },
    [getWarningsForAssignment]
  );

  // Get severity of assignment (highest severity warning)
  const getAssignmentSeverity = useCallback(
    (assignmentId: string): ValidationWarning['severity'] | null => {
      const assignmentWarnings = getWarningsForAssignment(assignmentId);
      if (assignmentWarnings.length === 0) return null;

      const severityOrder: Record<ValidationWarning['severity'], number> = {
        critical: 3,
        warning: 2,
        info: 1,
      };

      let highestSeverity: ValidationWarning['severity'] = 'info';
      for (const warning of assignmentWarnings) {
        if (severityOrder[warning.severity] > severityOrder[highestSeverity]) {
          highestSeverity = warning.severity;
        }
      }
      return highestSeverity;
    },
    [getWarningsForAssignment]
  );

  return {
    // State
    warnings: visibleWarnings,
    allWarnings: warnings,
    dismissedWarningIds,

    // Counts
    totalWarnings: visibleWarnings.length,
    criticalCount: warningsBySeverity.critical.length,
    warningCount: warningsBySeverity.warning.length,
    infoCount: warningsBySeverity.info.length,

    // Grouped warnings
    warningsBySeverity,

    // Methods
    validateSchedule,
    dismissWarning,
    dismissAllBySeverity,
    clearDismissed,
    getWarningsForAssignment,
    getWarningsForEmployee,
    hasAssignmentIssues,
    getAssignmentSeverity,
  };
};

export default useRealtimeValidation;
