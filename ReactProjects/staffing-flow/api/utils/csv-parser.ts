import { parse } from 'csv-parse/sync';
import { DemandRecord, demandRecordSchema } from '../schemas/demand.schema';
import {
  DemandErrorFormatter,
  DemandValidator,
} from './demand-validation';

export interface ParseError {
  row: number;
  field?: string;
  message: string;
}

export interface ParseWarning {
  row: number;
  message: string;
}

export interface CSVParseResult {
  records: DemandRecord[];
  errors: ParseError[];
  warnings: ParseWarning[];
  totalRows: number;
}

/**
 * Parse CSV content into demand records
 */
export function parseCSV(csvContent: string): CSVParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const validRecords: DemandRecord[] = [];

  try {
    // Parse CSV with headers
    const rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Cast numeric fields
        if (context.column === 'required_employees') {
          const num = parseInt(value, 10);
          return isNaN(num) ? value : num;
        }
        return value;
      },
    });

    // Process each record
    rawRecords.forEach((rawRecord: any, index: number) => {
      const rowNumber = index + 2; // +2 because index is 0-based and row 1 is header

      try {
        // Transform raw record to match schema
        const record: any = {
          date: rawRecord.date || rawRecord.Date,
          department_id: rawRecord.department_id || rawRecord.department_uuid,
          department_name: rawRecord.department_name || rawRecord.department,
          shift_type: rawRecord.shift_type?.toLowerCase(),
          start_time: rawRecord.start_time,
          end_time: rawRecord.end_time,
          required_employees: rawRecord.required_employees || rawRecord.employees_needed,
          priority: rawRecord.priority?.toLowerCase() || 'medium',
          notes: rawRecord.notes || rawRecord.comments,
        };

        // Parse skills if provided (comma-separated or array)
        if (rawRecord.required_skills) {
          if (typeof rawRecord.required_skills === 'string') {
            record.required_skills = rawRecord.required_skills
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s);
          } else if (Array.isArray(rawRecord.required_skills)) {
            record.required_skills = rawRecord.required_skills;
          }
        }

        // Validate with Zod schema
        const validation = demandRecordSchema.safeParse(record);

        if (validation.success) {
          // Perform business rule validation
          const businessValidation = DemandValidator.validateDemandRecord({
            date: validation.data.date,
            required_employees: validation.data.required_employees,
            shift_type: validation.data.shift_type,
            start_time: validation.data.start_time,
            end_time: validation.data.end_time,
          });

          // Add business rule errors
          if (!businessValidation.isValid) {
            businessValidation.errors.forEach((err) => {
              errors.push({
                row: rowNumber,
                field: err.field,
                message: err.message,
              });
            });
          } else {
            // Only add valid records
            validRecords.push(validation.data);
          }

          // Add business rule warnings
          businessValidation.warnings.forEach((warn) => {
            warnings.push({
              row: rowNumber,
              message: warn.message,
            });
          });

          // Add warnings for optional missing fields
          if (!record.shift_type) {
            warnings.push({
              row: rowNumber,
              message: 'Shift type not specified, demand will apply to all shifts',
            });
          }
        } else {
          // Collect Zod validation errors with improved formatting
          const formattedErrors = DemandErrorFormatter.formatZodError(validation.error, rowNumber);
          formattedErrors.forEach((err) => {
            errors.push({
              row: rowNumber,
              field: err.field,
              message: err.message,
            });
          });
        }
      } catch (err: any) {
        errors.push({
          row: rowNumber,
          message: `Failed to process row: ${err.message}`,
        });
      }
    });

    return {
      records: validRecords,
      errors,
      warnings,
      totalRows: rawRecords.length,
    };
  } catch (err: any) {
    // CSV parsing error
    return {
      records: [],
      errors: [
        {
          row: 0,
          message: `CSV parsing error: ${err.message}`,
        },
      ],
      warnings: [],
      totalRows: 0,
    };
  }
}

/**
 * Validate CSV headers
 */
export function validateCSVHeaders(csvContent: string): { valid: boolean; errors: string[] } {
  const requiredHeaders = ['date', 'required_employees'];

  const errors: string[] = [];

  try {
    const records = parse(csvContent, {
      columns: true,
      to_line: 1, // Only read header
    });

    if (records.length === 0) {
      errors.push('CSV file is empty or has no header row');
      return { valid: false, errors };
    }

    // Get actual headers
    const headers = Object.keys(records[0] || {}).map((h) => h.toLowerCase());

    // Check required headers
    requiredHeaders.forEach((required) => {
      if (!headers.includes(required)) {
        errors.push(`Missing required header: ${required}`);
      }
    });

    // Check for department identifier
    if (!headers.includes('department_id') && !headers.includes('department_name')) {
      errors.push('Must include either "department_id" or "department_name" column');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Failed to parse CSV headers: ${err.message}`],
    };
  }
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    'date',
    'department_id',
    'department_name',
    'shift_type',
    'start_time',
    'end_time',
    'required_employees',
    'required_skills',
    'priority',
    'notes',
  ];

  const example = [
    '2026-02-01',
    'uuid-here-or-leave-blank',
    'Operations',
    'morning',
    '08:00',
    '16:00',
    '15',
    'forklift,inventory',
    'high',
    'Peak season demand',
  ];

  return `${headers.join(',')}\n${example.join(',')}\n`;
}
