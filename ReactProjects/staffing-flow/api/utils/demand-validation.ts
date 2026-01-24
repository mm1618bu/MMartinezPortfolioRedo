import { ZodError, ZodIssue } from 'zod';

/**
 * Error types for demand validation
 */
export enum DemandErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  BUSINESS_RULE = 'BUSINESS_RULE_VIOLATION',
  CSV_FORMAT = 'CSV_FORMAT_ERROR',
  DUPLICATE = 'DUPLICATE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION_DENIED',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Structured error for demand operations
 */
export interface DemandError {
  type: DemandErrorType;
  severity: ErrorSeverity;
  message: string;
  field?: string;
  row?: number;
  value?: any;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Warning for non-critical issues
 */
export interface DemandWarning {
  row?: number;
  field?: string;
  message: string;
  suggestedFix?: string;
}

/**
 * Validation result with errors and warnings
 */
export interface ValidationResult {
  isValid: boolean;
  errors: DemandError[];
  warnings: DemandWarning[];
  validatedData?: any;
}

/**
 * Error formatter for Zod validation errors
 */
export class DemandErrorFormatter {
  /**
   * Format Zod validation errors into structured demand errors
   */
  static formatZodError(error: ZodError, row?: number): DemandError[] {
    return error.issues.map((issue) => this.formatZodIssue(issue, row));
  }

  /**
   * Format a single Zod issue
   */
  static formatZodIssue(issue: ZodIssue, row?: number): DemandError {
    const field = issue.path.join('.');
    const value = (issue as any).received;

    return {
      type: DemandErrorType.VALIDATION,
      severity: ErrorSeverity.ERROR,
      message: this.getReadableMessage(issue),
      field,
      row,
      value,
      code: issue.code,
      details: {
        zodCode: issue.code,
        path: issue.path,
      },
    };
  }

  /**
   * Get human-readable error message from Zod issue
   */
  static getReadableMessage(issue: ZodIssue): string {
    const field = String(issue.path[issue.path.length - 1] || 'field');

    // Use the issue message as fallback
    const defaultMessage = issue.message || `${field}: Validation failed`;

    switch (issue.code) {
      case 'invalid_type':
        return `${field}: Expected ${(issue as any).expected}, but received ${(issue as any).received}`;

      case 'too_small':
        const minType = (issue as any).type;
        if (minType === 'string') {
          return `${field}: Must be at least ${issue.minimum} characters`;
        }
        if (minType === 'number') {
          return `${field}: Must be at least ${issue.minimum}`;
        }
        if (minType === 'array') {
          return `${field}: Must contain at least ${issue.minimum} items`;
        }
        return `${field}: Value too small`;

      case 'too_big':
        const maxType = (issue as any).type;
        if (maxType === 'string') {
          return `${field}: Must be at most ${issue.maximum} characters`;
        }
        if (maxType === 'number') {
          return `${field}: Must be at most ${issue.maximum}`;
        }
        if (maxType === 'array') {
          return `${field}: Must contain at most ${issue.maximum} items`;
        }
        return `${field}: Value too large`;

      case 'custom':
        return issue.message || `${field}: Custom validation failed`;

      default:
        return defaultMessage;
    }
  }

  /**
   * Create a validation error
   */
  static createValidationError(
    message: string,
    field?: string,
    row?: number,
    value?: any
  ): DemandError {
    return {
      type: DemandErrorType.VALIDATION,
      severity: ErrorSeverity.ERROR,
      message,
      field,
      row,
      value,
    };
  }

  /**
   * Create a database error
   */
  static createDatabaseError(message: string, details?: Record<string, any>): DemandError {
    return {
      type: DemandErrorType.DATABASE,
      severity: ErrorSeverity.ERROR,
      message,
      details,
    };
  }

  /**
   * Create a business rule error
   */
  static createBusinessRuleError(
    message: string,
    field?: string,
    row?: number
  ): DemandError {
    return {
      type: DemandErrorType.BUSINESS_RULE,
      severity: ErrorSeverity.ERROR,
      message,
      field,
      row,
    };
  }

  /**
   * Create a CSV format error
   */
  static createCSVFormatError(message: string, row?: number): DemandError {
    return {
      type: DemandErrorType.CSV_FORMAT,
      severity: ErrorSeverity.ERROR,
      message,
      row,
    };
  }

  /**
   * Create a duplicate error
   */
  static createDuplicateError(message: string, row?: number, details?: Record<string, any>): DemandError {
    return {
      type: DemandErrorType.DUPLICATE,
      severity: ErrorSeverity.WARNING,
      message,
      row,
      details,
    };
  }

  /**
   * Create a warning
   */
  static createWarning(
    message: string,
    row?: number,
    field?: string,
    suggestedFix?: string
  ): DemandWarning {
    return {
      row,
      field,
      message,
      suggestedFix,
    };
  }
}

/**
 * Business rule validators
 */
export class DemandValidator {
  /**
   * Validate date is within acceptable range
   */
  static validateDateRange(date: string): ValidationResult {
    const errors: DemandError[] = [];
    const warnings: DemandWarning[] = [];

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const twoYearsFromNow = new Date(today);
    twoYearsFromNow.setFullYear(today.getFullYear() + 2);

    // Error: Date too far in the past
    if (targetDate < oneYearAgo) {
      errors.push(
        DemandErrorFormatter.createValidationError(
          `Date ${date} is older than 1 year. Historical data should not exceed 1 year.`,
          'date',
          undefined,
          date
        )
      );
    }

    // Error: Date too far in the future
    if (targetDate > twoYearsFromNow) {
      errors.push(
        DemandErrorFormatter.createValidationError(
          `Date ${date} is more than 2 years in the future. Forecasts should not exceed 2 years.`,
          'date',
          undefined,
          date
        )
      );
    }

    // Warning: Date in the past
    if (targetDate < today && targetDate >= oneYearAgo) {
      warnings.push(
        DemandErrorFormatter.createWarning(
          `Date ${date} is in the past. Consider if this is intentional.`,
          undefined,
          'date'
        )
      );
    }

    // Warning: Date far in the future (6+ months)
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    if (targetDate > sixMonthsFromNow && targetDate <= twoYearsFromNow) {
      warnings.push(
        DemandErrorFormatter.createWarning(
          `Date ${date} is more than 6 months in the future. Long-term forecasts may be less accurate.`,
          undefined,
          'date'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate time range
   */
  static validateTimeRange(startTime?: string, endTime?: string): ValidationResult {
    const errors: DemandError[] = [];
    const warnings: DemandWarning[] = [];

    if (!startTime && !endTime) {
      return { isValid: true, errors, warnings };
    }

    if (startTime && !endTime) {
      errors.push(
        DemandErrorFormatter.createValidationError(
          'Start time is specified but end time is missing',
          'end_time'
        )
      );
    }

    if (!startTime && endTime) {
      errors.push(
        DemandErrorFormatter.createValidationError(
          'End time is specified but start time is missing',
          'start_time'
        )
      );
    }

    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      // Check for valid time parts
      if (
        startHour === undefined ||
        startMin === undefined ||
        endHour === undefined ||
        endMin === undefined ||
        isNaN(startHour) ||
        isNaN(startMin) ||
        isNaN(endHour) ||
        isNaN(endMin)
      ) {
        errors.push(
          DemandErrorFormatter.createValidationError(
            'Invalid time format. Expected HH:MM',
            startHour === undefined || startMin === undefined ? 'start_time' : 'end_time'
          )
        );
        return { isValid: false, errors, warnings };
      }

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        errors.push(
          DemandErrorFormatter.createBusinessRuleError(
            `End time (${endTime}) must be after start time (${startTime})`,
            'end_time'
          )
        );
      }

      // Warning: Very short shift (< 2 hours)
      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 120) {
        warnings.push(
          DemandErrorFormatter.createWarning(
            `Shift duration is only ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m. Consider if this is sufficient.`,
            undefined,
            'end_time'
          )
        );
      }

      // Warning: Very long shift (> 12 hours)
      if (durationMinutes > 720) {
        warnings.push(
          DemandErrorFormatter.createWarning(
            `Shift duration is ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m. Consider splitting into multiple shifts.`,
            undefined,
            'end_time'
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate required employees count
   */
  static validateRequiredEmployees(count: number): ValidationResult {
    const errors: DemandError[] = [];
    const warnings: DemandWarning[] = [];

    if (count <= 0) {
      errors.push(
        DemandErrorFormatter.createValidationError(
          'Required employees must be a positive number',
          'required_employees',
          undefined,
          count
        )
      );
    }

    if (count > 1000) {
      errors.push(
        DemandErrorFormatter.createBusinessRuleError(
          `Required employees (${count}) exceeds reasonable limit of 1000`,
          'required_employees'
        )
      );
    }

    // Warning: Unusually high demand
    if (count > 100 && count <= 1000) {
      warnings.push(
        DemandErrorFormatter.createWarning(
          `Required employees (${count}) is unusually high. Please verify this is correct.`,
          undefined,
          'required_employees'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate shift type matches time range
   */
  static validateShiftTypeConsistency(
    shiftType?: string,
    startTime?: string,
    endTime?: string
  ): ValidationResult {
    const warnings: DemandWarning[] = [];

    if (!shiftType) {
      return { isValid: true, errors: [], warnings };
    }

    if (shiftType === 'all_day') {
      if (startTime || endTime) {
        warnings.push(
          DemandErrorFormatter.createWarning(
            'Shift type is "all_day" but specific times are provided. Times will be ignored.',
            undefined,
            'shift_type',
            'Remove start_time and end_time for all_day shifts'
          )
        );
      }
    } else {
      if (!startTime || !endTime) {
        warnings.push(
          DemandErrorFormatter.createWarning(
            `Shift type "${shiftType}" is specified but times are missing. Consider adding start_time and end_time.`,
            undefined,
            'shift_type',
            'Add start_time and end_time for specific shift types'
          )
        );
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  /**
   * Comprehensive validation for a demand record
   */
  static validateDemandRecord(record: {
    date: string;
    required_employees: number;
    shift_type?: string;
    start_time?: string;
    end_time?: string;
  }): ValidationResult {
    const allErrors: DemandError[] = [];
    const allWarnings: DemandWarning[] = [];

    // Validate date range
    const dateValidation = this.validateDateRange(record.date);
    allErrors.push(...dateValidation.errors);
    allWarnings.push(...dateValidation.warnings);

    // Validate time range
    const timeValidation = this.validateTimeRange(record.start_time, record.end_time);
    allErrors.push(...timeValidation.errors);
    allWarnings.push(...timeValidation.warnings);

    // Validate required employees
    const employeesValidation = this.validateRequiredEmployees(record.required_employees);
    allErrors.push(...employeesValidation.errors);
    allWarnings.push(...employeesValidation.warnings);

    // Validate shift type consistency
    const shiftValidation = this.validateShiftTypeConsistency(
      record.shift_type,
      record.start_time,
      record.end_time
    );
    allWarnings.push(...shiftValidation.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      validatedData: allErrors.length === 0 ? record : undefined,
    };
  }
}

/**
 * Error aggregator for batch operations
 */
export class ErrorAggregator {
  private errors: DemandError[] = [];
  private warnings: DemandWarning[] = [];

  /**
   * Add an error
   */
  addError(error: DemandError): void {
    this.errors.push(error);
  }

  /**
   * Add multiple errors
   */
  addErrors(errors: DemandError[]): void {
    this.errors.push(...errors);
  }

  /**
   * Add a warning
   */
  addWarning(warning: DemandWarning): void {
    this.warnings.push(warning);
  }

  /**
   * Add multiple warnings
   */
  addWarnings(warnings: DemandWarning[]): void {
    this.warnings.push(...warnings);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if there are any warnings
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  /**
   * Get all errors
   */
  getErrors(): DemandError[] {
    return this.errors;
  }

  /**
   * Get all warnings
   */
  getWarnings(): DemandWarning[] {
    return this.warnings;
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: DemandErrorType): DemandError[] {
    return this.errors.filter((e) => e.type === type);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): DemandError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalErrors: number;
    totalWarnings: number;
    errorsByType: Record<DemandErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errors.forEach((error) => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsByType: errorsByType as Record<DemandErrorType, number>,
      errorsBySeverity: errorsBySeverity as Record<ErrorSeverity, number>,
    };
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}
