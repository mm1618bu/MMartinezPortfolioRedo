import { describe, it, expect, beforeEach } from 'vitest';
import {
  DemandValidator,
  DemandErrorFormatter,
  ErrorAggregator,
  DemandErrorType,
  ErrorSeverity,
} from '../utils/demand-validation';
import { ZodError } from 'zod';
import { demandRecordSchema } from '../schemas/demand.schema';

describe('DemandValidator', () => {
  describe('validateDateRange', () => {
    const today = new Date();
    const formatDate = (date: Date): string => {
      const parts = date.toISOString().split('T');
      return parts[0] || '';
    };

    it('should accept valid current date', () => {
      const result = DemandValidator.validateDateRange(formatDate(today));
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject dates older than 1 year', () => {
      const oldDate = new Date(today);
      oldDate.setFullYear(today.getFullYear() - 2);

      const result = DemandValidator.validateDateRange(formatDate(oldDate));
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('older than 1 year');
    });

    it('should reject dates more than 2 years in future', () => {
      const futureDate = new Date(today);
      futureDate.setFullYear(today.getFullYear() + 3);

      const result = DemandValidator.validateDateRange(formatDate(futureDate));
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('more than 2 years in the future');
    });

    it('should warn for past dates within 1 year', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 30); // 30 days ago

      const result = DemandValidator.validateDateRange(formatDate(pastDate));
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('in the past');
    });

    it('should warn for dates more than 6 months in future', () => {
      const futureDate = new Date(today);
      futureDate.setMonth(today.getMonth() + 9); // 9 months

      const result = DemandValidator.validateDateRange(formatDate(futureDate));
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('more than 6 months');
    });
  });

  describe('validateTimeRange', () => {
    it('should accept valid time range', () => {
      const result = DemandValidator.validateTimeRange('08:00', '16:00');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject end time before start time', () => {
      const result = DemandValidator.validateTimeRange('16:00', '08:00');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('end_time');
      expect(result.errors[0]?.message).toContain('must be after');
    });

    it('should reject start time without end time', () => {
      const result = DemandValidator.validateTimeRange('08:00', undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('end_time');
    });

    it('should reject end time without start time', () => {
      const result = DemandValidator.validateTimeRange(undefined, '16:00');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('start_time');
    });

    it('should warn for very short shifts (< 2 hours)', () => {
      const result = DemandValidator.validateTimeRange('08:00', '09:30');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('1h 30m');
    });

    it('should warn for very long shifts (> 12 hours)', () => {
      const result = DemandValidator.validateTimeRange('07:00', '21:00');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('14h');
    });

    it('should accept empty times', () => {
      const result = DemandValidator.validateTimeRange(undefined, undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateRequiredEmployees', () => {
    it('should accept valid employee count', () => {
      const result = DemandValidator.validateRequiredEmployees(5);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject zero employees', () => {
      const result = DemandValidator.validateRequiredEmployees(0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toContain('positive number');
    });

    it('should reject negative employees', () => {
      const result = DemandValidator.validateRequiredEmployees(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toContain('positive number');
    });

    it('should reject count over 1000', () => {
      const result = DemandValidator.validateRequiredEmployees(1500);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toContain('exceeds reasonable limit');
    });

    it('should warn for unusually high count (> 100)', () => {
      const result = DemandValidator.validateRequiredEmployees(250);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('unusually high');
    });
  });

  describe('validateShiftTypeConsistency', () => {
    it('should accept all_day without times', () => {
      const result = DemandValidator.validateShiftTypeConsistency('all_day', undefined, undefined);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn for all_day with times', () => {
      const result = DemandValidator.validateShiftTypeConsistency('all_day', '08:00', '16:00');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('Times will be ignored');
    });

    it('should warn for specific shift without times', () => {
      const result = DemandValidator.validateShiftTypeConsistency('morning', undefined, undefined);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('Consider adding start_time and end_time');
    });

    it('should accept specific shift with times', () => {
      const result = DemandValidator.validateShiftTypeConsistency('morning', '08:00', '16:00');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateDemandRecord', () => {
    it('should validate complete valid record', () => {
      const result = DemandValidator.validateDemandRecord({
        date: '2026-02-15',
        required_employees: 5,
        shift_type: 'morning',
        start_time: '08:00',
        end_time: '16:00',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toBeDefined();
    });

    it('should collect multiple errors', () => {
      const result = DemandValidator.validateDemandRecord({
        date: '2020-01-01', // Too old
        required_employees: -5, // Negative
        shift_type: 'morning',
        start_time: '16:00',
        end_time: '08:00', // Before start
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should collect warnings alongside validation', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 9);
      const dateStr = futureDate.toISOString().split('T')[0] || '';

      const result = DemandValidator.validateDemandRecord({
        date: dateStr,
        required_employees: 150, // High but valid
        shift_type: 'morning',
        start_time: '08:00',
        end_time: '09:30', // Short shift
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(1);
    });
  });
});

describe('DemandErrorFormatter', () => {
  describe('formatZodError', () => {
    it('should format validation errors', () => {
      const invalidData = {
        date: 'invalid-date',
        required_employees: 'not-a-number',
      };

      try {
        demandRecordSchema.parse(invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        if (error instanceof ZodError) {
          const formatted = DemandErrorFormatter.formatZodError(error, 5);
          expect(formatted.length).toBeGreaterThan(0);
          expect(formatted[0]?.type).toBe(DemandErrorType.VALIDATION);
          expect(formatted[0]?.row).toBe(5);
        }
      }
    });

    it('should format missing field errors', () => {
      const invalidData = {
        // Missing date and required_employees
        shift_type: 'morning',
      };

      try {
        demandRecordSchema.parse(invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        if (error instanceof ZodError) {
          const formatted = DemandErrorFormatter.formatZodError(error);
          expect(formatted.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('createValidationError', () => {
    it('should create properly formatted validation error', () => {
      const error = DemandErrorFormatter.createValidationError(
        'Invalid date format',
        'date',
        5,
        '2024/02/15'
      );

      expect(error.type).toBe(DemandErrorType.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.message).toBe('Invalid date format');
      expect(error.field).toBe('date');
      expect(error.row).toBe(5);
      expect(error.value).toBe('2024/02/15');
    });
  });

  describe('createBusinessRuleError', () => {
    it('should create business rule error', () => {
      const error = DemandErrorFormatter.createBusinessRuleError(
        'Date too far in future',
        'date',
        10
      );

      expect(error.type).toBe(DemandErrorType.BUSINESS_RULE);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.field).toBe('date');
      expect(error.row).toBe(10);
    });
  });

  describe('createWarning', () => {
    it('should create warning with suggested fix', () => {
      const warning = DemandErrorFormatter.createWarning(
        'Shift duration is short',
        5,
        'end_time',
        'Consider extending to at least 4 hours'
      );

      expect(warning.message).toBe('Shift duration is short');
      expect(warning.row).toBe(5);
      expect(warning.field).toBe('end_time');
      expect(warning.suggestedFix).toBe('Consider extending to at least 4 hours');
    });
  });
});

describe('ErrorAggregator', () => {
  let aggregator: ErrorAggregator;

  beforeEach(() => {
    aggregator = new ErrorAggregator();
  });

  it('should start with no errors or warnings', () => {
    expect(aggregator.hasErrors()).toBe(false);
    expect(aggregator.hasWarnings()).toBe(false);
    expect(aggregator.getErrors()).toHaveLength(0);
    expect(aggregator.getWarnings()).toHaveLength(0);
  });

  it('should add and retrieve errors', () => {
    const error = DemandErrorFormatter.createValidationError('Test error', 'field', 1);
    aggregator.addError(error);

    expect(aggregator.hasErrors()).toBe(true);
    expect(aggregator.getErrors()).toHaveLength(1);
    expect(aggregator.getErrors()[0]).toBe(error);
  });

  it('should add and retrieve warnings', () => {
    const warning = DemandErrorFormatter.createWarning('Test warning', 1);
    aggregator.addWarning(warning);

    expect(aggregator.hasWarnings()).toBe(true);
    expect(aggregator.getWarnings()).toHaveLength(1);
    expect(aggregator.getWarnings()[0]).toBe(warning);
  });

  it('should add multiple errors at once', () => {
    const errors = [
      DemandErrorFormatter.createValidationError('Error 1', 'field1', 1),
      DemandErrorFormatter.createValidationError('Error 2', 'field2', 2),
    ];

    aggregator.addErrors(errors);
    expect(aggregator.getErrors()).toHaveLength(2);
  });

  it('should filter errors by type', () => {
    aggregator.addError(DemandErrorFormatter.createValidationError('Val error', 'f1', 1));
    aggregator.addError(DemandErrorFormatter.createBusinessRuleError('Rule error', 'f2', 2));
    aggregator.addError(DemandErrorFormatter.createValidationError('Val error 2', 'f3', 3));

    const validationErrors = aggregator.getErrorsByType(DemandErrorType.VALIDATION);
    expect(validationErrors).toHaveLength(2);

    const ruleErrors = aggregator.getErrorsByType(DemandErrorType.BUSINESS_RULE);
    expect(ruleErrors).toHaveLength(1);
  });

  it('should filter errors by severity', () => {
    aggregator.addError(DemandErrorFormatter.createValidationError('Error', 'f', 1));
    aggregator.addError(DemandErrorFormatter.createDuplicateError('Duplicate', 2));

    const errors = aggregator.getErrorsBySeverity(ErrorSeverity.ERROR);
    const warnings = aggregator.getErrorsBySeverity(ErrorSeverity.WARNING);

    expect(errors).toHaveLength(1);
    expect(warnings).toHaveLength(1);
  });

  it('should provide summary statistics', () => {
    aggregator.addError(DemandErrorFormatter.createValidationError('Val 1', 'f', 1));
    aggregator.addError(DemandErrorFormatter.createValidationError('Val 2', 'f', 2));
    aggregator.addError(DemandErrorFormatter.createBusinessRuleError('Rule 1', 'f', 3));
    aggregator.addWarning(DemandErrorFormatter.createWarning('Warn 1', 4));
    aggregator.addWarning(DemandErrorFormatter.createWarning('Warn 2', 5));

    const summary = aggregator.getSummary();

    expect(summary.totalErrors).toBe(3);
    expect(summary.totalWarnings).toBe(2);
    expect(summary.errorsByType[DemandErrorType.VALIDATION]).toBe(2);
    expect(summary.errorsByType[DemandErrorType.BUSINESS_RULE]).toBe(1);
  });

  it('should clear all errors and warnings', () => {
    aggregator.addError(DemandErrorFormatter.createValidationError('Error', 'f', 1));
    aggregator.addWarning(DemandErrorFormatter.createWarning('Warning', 2));

    expect(aggregator.hasErrors()).toBe(true);
    expect(aggregator.hasWarnings()).toBe(true);

    aggregator.clear();

    expect(aggregator.hasErrors()).toBe(false);
    expect(aggregator.hasWarnings()).toBe(false);
    expect(aggregator.getErrors()).toHaveLength(0);
    expect(aggregator.getWarnings()).toHaveLength(0);
  });
});

describe('Integration Tests', () => {
  it('should validate full CSV upload workflow', () => {
    const aggregator = new ErrorAggregator();

    // Simulate processing multiple CSV rows
    const csvRecords = [
      {
        date: '2026-02-15',
        required_employees: 5,
        shift_type: 'morning',
        start_time: '08:00',
        end_time: '16:00',
      },
      {
        date: '2020-01-01', // Too old
        required_employees: 5,
        shift_type: 'afternoon',
        start_time: '14:00',
        end_time: '22:00',
      },
      {
        date: '2026-03-01',
        required_employees: -5, // Invalid
        shift_type: 'evening',
        start_time: '18:00',
        end_time: '02:00',
      },
    ];

    csvRecords.forEach((record) => {
      const validation = DemandValidator.validateDemandRecord(record);
      aggregator.addErrors(validation.errors);
      aggregator.addWarnings(validation.warnings);
    });

    const summary = aggregator.getSummary();

    expect(summary.totalErrors).toBeGreaterThan(0);
    expect(aggregator.getErrorsByType(DemandErrorType.BUSINESS_RULE).length).toBeGreaterThan(0);
    expect(aggregator.getErrorsByType(DemandErrorType.VALIDATION).length).toBeGreaterThan(0);
  });
});
