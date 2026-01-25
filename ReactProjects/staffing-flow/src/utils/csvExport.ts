import { Demand } from '../services/demandService';

/**
 * CSV Export Utility for Demands
 * Handles formatting, escaping, and generation of CSV files
 */

export interface CSVExportOptions {
  includeColumns?: (keyof Demand)[];
  dateFormat?: 'ISO' | 'US' | 'EU';
  includeHeaders?: boolean;
  includeMetadata?: boolean;
  filename?: string;
}

// Default columns to export
const DEFAULT_COLUMNS: (keyof Demand)[] = [
  'id',
  'date',
  'shift_type',
  'start_time',
  'end_time',
  'required_employees',
  'required_skills',
  'priority',
  'department_id',
  'notes',
  'created_at',
];

/**
 * Escape CSV field values according to RFC 4180
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }

  let value = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }

  return value;
}

/**
 * Format date based on specified format
 */
function formatDate(dateString: string, format: 'ISO' | 'US' | 'EU'): string {
  const date = new Date(dateString);

  switch (format) {
    case 'US':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'EU':
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'ISO':
    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Format time (HH:MM format)
 */
function formatTime(timeString: string | undefined): string {
  if (!timeString) return '';
  // If it's already in HH:MM format, return as-is
  if (/^\d{2}:\d{2}/.test(timeString)) return timeString;
  // Otherwise try to parse as ISO and format
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeString;
  }
}

/**
 * Format shift type with readable labels
 */
function formatShiftType(shiftType: string): string {
  const labels: Record<string, string> = {
    all_day: 'All Day',
    morning: 'Morning',
    evening: 'Evening',
    night: 'Night',
  };
  return labels[shiftType] || shiftType;
}

/**
 * Format priority with readable labels
 */
function formatPriority(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return labels[priority] || priority;
}

/**
 * Format skills array
 */
function formatSkills(skills: string[] | undefined): string {
  if (!skills || skills.length === 0) return '';
  return skills.join('; ');
}

/**
 * Get human-readable column header
 */
function getColumnHeader(column: keyof Demand): string {
  const headers: Record<string, string> = {
    id: 'ID',
    date: 'Date',
    shift_type: 'Shift Type',
    start_time: 'Start Time',
    end_time: 'End Time',
    required_employees: 'Employees Needed',
    required_skills: 'Required Skills',
    priority: 'Priority',
    notes: 'Notes',
    organization_id: 'Organization',
    department_id: 'Department',
    created_at: 'Created',
    updated_at: 'Updated',
    created_by: 'Created By',
  };
  return headers[String(column)] || String(column);
}

/**
 * Format demand row for CSV export
 */
function formatDemandRow(
  demand: Demand,
  columns: (keyof Demand)[],
  dateFormat: 'ISO' | 'US' | 'EU'
): string[] {
  return columns.map((column) => {
    let value: any = demand[column];

    // Apply formatting based on column type
    switch (column) {
      case 'date':
        return escapeCSVField(formatDate(value, dateFormat));
      case 'start_time':
      case 'end_time':
        return escapeCSVField(formatTime(value));
      case 'shift_type':
        return escapeCSVField(formatShiftType(value));
      case 'priority':
        return escapeCSVField(formatPriority(value));
      case 'required_skills':
        return escapeCSVField(formatSkills(value));
      case 'created_at':
      case 'updated_at':
        return escapeCSVField(new Date(value).toLocaleString());
      default:
        return escapeCSVField(value);
    }
  });
}

/**
 * Generate CSV content from demands
 */
export function generateCSVContent(
  demands: Demand[],
  options: CSVExportOptions = {}
): string {
  const {
    includeColumns = DEFAULT_COLUMNS,
    dateFormat = 'ISO',
    includeHeaders = true,
    includeMetadata = true,
  } = options;

  const lines: string[] = [];

  // Add metadata header if requested
  if (includeMetadata) {
    lines.push(`# Demand Export - Generated ${new Date().toLocaleString()}`);
    lines.push(`# Total Records: ${demands.length}`);
    if (demands.length > 0) {
      const dates = demands.map(d => new Date(d.date).getTime());
      const startDate = formatDate(new Date(Math.min(...dates)).toISOString(), dateFormat);
      const endDate = formatDate(new Date(Math.max(...dates)).toISOString(), dateFormat);
      lines.push(`# Date Range: ${startDate} to ${endDate}`);
    }
    lines.push('');
  }

  // Add header row if requested
  if (includeHeaders) {
    const headers = includeColumns.map(col => getColumnHeader(col));
    lines.push(headers.map(h => escapeCSVField(h)).join(','));
  }

  // Add data rows
  demands.forEach((demand) => {
    const row = formatDemandRow(demand, includeColumns, dateFormat);
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Generate CSV Blob from demands
 */
export function generateCSVBlob(demands: Demand[], options: CSVExportOptions = {}): Blob {
  const content = generateCSVContent(demands, options);
  return new Blob([content], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download CSV file
 */
export function downloadCSV(
  demands: Demand[],
  filename: string = `demands-${new Date().toISOString().split('T')[0]}.csv`,
  options: CSVExportOptions = {}
): void {
  const blob = generateCSVBlob(demands, options);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copy CSV content to clipboard
 */
export async function copyCSVToClipboard(
  demands: Demand[],
  options: CSVExportOptions = {}
): Promise<void> {
  const content = generateCSVContent(demands, options);
  try {
    await navigator.clipboard.writeText(content);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Generate summary statistics as CSV
 */
export function generateSummaryCSV(demands: Demand[]): string {
  const lines: string[] = [];

  lines.push('Demand Summary Report');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  // Basic statistics
  lines.push('Basic Statistics');
  lines.push(`Total Demands,${demands.length}`);
  lines.push(`Total Employees Needed,${demands.reduce((sum, d) => sum + d.required_employees, 0)}`);
  lines.push(
    `Average Employees per Demand,${(demands.reduce((sum, d) => sum + d.required_employees, 0) / demands.length).toFixed(2)}`
  );
  lines.push('');

  // Priority breakdown
  const priorityCounts = {
    low: demands.filter(d => d.priority === 'low').length,
    medium: demands.filter(d => d.priority === 'medium').length,
    high: demands.filter(d => d.priority === 'high').length,
  };
  lines.push('Priority Breakdown');
  lines.push(`Low,${priorityCounts.low}`);
  lines.push(`Medium,${priorityCounts.medium}`);
  lines.push(`High,${priorityCounts.high}`);
  lines.push('');

  // Shift type breakdown
  const shiftCounts = {
    all_day: demands.filter(d => d.shift_type === 'all_day').length,
    morning: demands.filter(d => d.shift_type === 'morning').length,
    evening: demands.filter(d => d.shift_type === 'evening').length,
    night: demands.filter(d => d.shift_type === 'night').length,
  };
  lines.push('Shift Type Breakdown');
  lines.push(`All Day,${shiftCounts.all_day}`);
  lines.push(`Morning,${shiftCounts.morning}`);
  lines.push(`Evening,${shiftCounts.evening}`);
  lines.push(`Night,${shiftCounts.night}`);
  lines.push('');

  // Department breakdown
  const deptMap = new Map<string, number>();
  demands.forEach(d => {
    const dept = d.department_id || 'Unassigned';
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });
  lines.push('Department Breakdown');
  Array.from(deptMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([dept, count]) => {
      lines.push(`${dept},${count}`);
    });
  lines.push('');

  // Skills breakdown
  const skillMap = new Map<string, number>();
  demands.forEach(d => {
    if (d.required_skills) {
      d.required_skills.forEach((skill: string) => {
        skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
      });
    }
  });
  if (skillMap.size > 0) {
    lines.push('Top 10 Required Skills');
    Array.from(skillMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([skill, count]) => {
        lines.push(`${skill},${count}`);
      });
  }

  return lines.join('\n');
}

/**
 * Export template for bulk import
 */
export function generateImportTemplate(): string {
  const columns = DEFAULT_COLUMNS.filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at' && col !== 'created_by');
  const headers = columns.map(col => getColumnHeader(col));

  const lines: string[] = [];
  lines.push('# Demand Import Template');
  lines.push(`# Columns: ${headers.join(', ')}`);
  lines.push(headers.map(h => escapeCSVField(h)).join(','));

  // Add example row
  const exampleRow = [
    new Date().toISOString().split('T')[0],
    'Morning',
    '08:00',
    '12:00',
    '5',
    'JavaScript;React',
    'High',
    'Engineering',
    'Example demand',
    new Date().toISOString(),
  ];
  lines.push(exampleRow.map(v => escapeCSVField(v)).join(','));

  return lines.join('\n');
}
