import type { ScheduleAssignment } from '../../types/scheduleAPI';

export interface DropValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canOverride: boolean;
}

export class DropValidationService {
  /**
   * Validate if an assignment can be dropped at a new location
   */
  static validateDrop(
    assignment: ScheduleAssignment,
    targetEmployeeId: string,
    targetDate: string,
    existingAssignments: ScheduleAssignment[]
  ): DropValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check 1: Same location
    if (
      assignment.employee_id === targetEmployeeId &&
      assignment.shift_date === targetDate
    ) {
      errors.push('Cannot move assignment to the same location');
    }

    // Check 2: Duplicate shift for target employee on target date
    const hasDuplicateShift = existingAssignments.some(
      (a) =>
        a.employee_id === targetEmployeeId &&
        a.shift_date === targetDate &&
        a.shift_id === assignment.shift_id &&
        a.id !== assignment.id
    );

    if (hasDuplicateShift) {
      errors.push(`Employee already assigned to this shift on ${targetDate}`);
    }

    // Check 3: Shift timing conflicts
    const timeConflicts = existingAssignments.filter(
      (a) =>
        a.employee_id === targetEmployeeId &&
        a.shift_date === targetDate &&
        a.id !== assignment.id &&
        this.shiftsOverlap(assignment, a)
    );

    if (timeConflicts.length > 0) {
      errors.push(`Time conflict with ${timeConflicts.length} existing shift(s)`);
    }

    // Check 4: Skill mismatch warning
    if (assignment.skill_match_percentage && assignment.skill_match_percentage < 50) {
      warnings.push(
        `Low skill match (${assignment.skill_match_percentage}%) for target employee`
      );
    }

    // Check 5: Existing violations
    if (assignment.has_hard_violations) {
      errors.push('Assignment has hard constraint violations');
    }

    if (assignment.has_soft_violations) {
      warnings.push('Assignment has soft constraint violations');
    }

    // Check 6: Workload validation
    const targetEmployeeWorkload = existingAssignments
      .filter((a) => a.employee_id === targetEmployeeId && a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.duration_hours || 0), 0);

    const newWorkload = targetEmployeeWorkload + (assignment.duration_hours || 0);
    if (newWorkload > 40) {
      warnings.push(
        `Target employee workload will exceed 40 hours (total: ${newWorkload.toFixed(1)}h)`
      );
    }

    if (newWorkload > 50) {
      errors.push(
        `Target employee workload exceeds maximum 50 hours (total: ${newWorkload.toFixed(1)}h)`
      );
    }

    const isValid = errors.length === 0;
    const canOverride = errors.length > 0 && errors.length <= 2; // Can override minor errors

    return {
      isValid,
      errors,
      warnings,
      canOverride,
    };
  }

  /**
   * Check if two shifts have overlapping time
   */
  private static shiftsOverlap(shift1: ScheduleAssignment, shift2: ScheduleAssignment): boolean {
    if (shift1.shift_date !== shift2.shift_date) return false;

    const start1 = this.timeToMinutes(shift1.shift_start_time);
    const end1 = this.timeToMinutes(shift1.shift_end_time);
    const start2 = this.timeToMinutes(shift2.shift_start_time);
    const end2 = this.timeToMinutes(shift2.shift_end_time);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Convert time string (HH:mm) to minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Get validation message for UI display
   */
  static getValidationMessage(result: DropValidationResult): string {
    if (result.isValid) {
      return 'Ready to move assignment';
    }

    if (result.errors.length > 0) {
      return `Cannot move: ${result.errors[0]}`;
    }

    return 'Move with caution';
  }

  /**
   * Get severity level for validation result
   */
  static getSeverity(result: DropValidationResult): 'success' | 'info' | 'warning' | 'error' {
    if (result.isValid && result.warnings.length === 0) {
      return 'success';
    }

    if (result.isValid && result.warnings.length > 0) {
      return 'warning';
    }

    if (result.errors.length > 0) {
      return 'error';
    }

    return 'info';
  }
}

export default DropValidationService;
