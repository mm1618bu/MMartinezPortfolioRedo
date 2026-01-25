/**
 * Buffer and SLA Configuration Management
 * Defines staffing buffers and Service Level Agreement windows for workforce planning
 */

/**
 * Buffer configuration for headcount
 */
export interface BufferConfig {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
}

/**
 * SLA window definition
 */
export interface SlaWindow {
  id: string;
  name: string;
  description?: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  minimumStaffPercentage: number; // 0-100%
  enabled: boolean;
}

/**
 * Full buffer and SLA configuration
 */
export interface BufferSlaConfiguration {
  organizationId: string;
  buffers: {
    overall: BufferConfig;
    byPriority: {
      low: BufferConfig;
      medium: BufferConfig;
      high: BufferConfig;
    };
    byDepartment: Record<string, BufferConfig>;
  };
  slaWindows: SlaWindow[];
  lastUpdated: string;
  updatedBy?: string;
}

/**
 * Headcount calculation with buffer applied
 */
export interface BufferedHeadcount {
  baseHeadcount: number;
  bufferAmount: number;
  bufferPercentage: number;
  totalWithBuffer: number;
  rounding: 'up' | 'down' | 'nearest';
}

/**
 * SLA compliance status
 */
export interface SlaComplianceStatus {
  windowId: string;
  windowName: string;
  required: number;
  actual: number;
  compliancePercentage: number;
  isCompliant: boolean;
  gapOrSurplus: number;
}

/**
 * Default buffer configuration
 */
export const DEFAULT_BUFFER_CONFIG: BufferConfig = {
  enabled: true,
  type: 'percentage',
  value: 10, // 10% default buffer
  description: 'Default staffing buffer',
};

/**
 * Default SLA windows
 */
export const DEFAULT_SLA_WINDOWS: SlaWindow[] = [
  {
    id: 'sla-peak-hours',
    name: 'Peak Hours (9 AM - 5 PM)',
    description: 'Maintain minimum staffing during peak business hours',
    startTime: '09:00',
    endTime: '17:00',
    minimumStaffPercentage: 95,
    enabled: true,
  },
  {
    id: 'sla-business-hours',
    name: 'Business Hours (8 AM - 6 PM)',
    description: 'Maintain minimum staffing during extended business hours',
    startTime: '08:00',
    endTime: '18:00',
    minimumStaffPercentage: 85,
    enabled: true,
  },
  {
    id: 'sla-full-day',
    name: 'Full Day Coverage',
    description: 'Maintain minimum staffing across entire day',
    startTime: '00:00',
    endTime: '23:59',
    minimumStaffPercentage: 70,
    enabled: true,
  },
];

/**
 * Default configuration
 */
export const createDefaultConfiguration = (organizationId: string): BufferSlaConfiguration => ({
  organizationId,
  buffers: {
    overall: DEFAULT_BUFFER_CONFIG,
    byPriority: {
      low: { enabled: true, type: 'percentage', value: 5, description: 'Buffer for low priority' },
      medium: { enabled: true, type: 'percentage', value: 10, description: 'Buffer for medium priority' },
      high: { enabled: true, type: 'percentage', value: 15, description: 'Buffer for high priority' },
    },
    byDepartment: {},
  },
  slaWindows: DEFAULT_SLA_WINDOWS,
  lastUpdated: new Date().toISOString(),
});

/**
 * Calculate buffered headcount
 */
export function calculateBufferedHeadcount(
  baseHeadcount: number,
  buffer: BufferConfig,
  rounding: 'up' | 'down' | 'nearest' = 'up'
): BufferedHeadcount {
  if (!buffer.enabled || buffer.value === 0) {
    return {
      baseHeadcount,
      bufferAmount: 0,
      bufferPercentage: 0,
      totalWithBuffer: baseHeadcount,
      rounding,
    };
  }

  let bufferAmount: number;
  let bufferPercentage: number;

  if (buffer.type === 'percentage') {
    bufferPercentage = buffer.value;
    bufferAmount = (baseHeadcount * buffer.value) / 100;
  } else {
    // fixed amount
    bufferAmount = buffer.value;
    bufferPercentage = (buffer.value / baseHeadcount) * 100;
  }

  let totalWithBuffer = baseHeadcount + bufferAmount;

  // Apply rounding
  if (rounding === 'up') {
    totalWithBuffer = Math.ceil(totalWithBuffer);
  } else if (rounding === 'down') {
    totalWithBuffer = Math.floor(totalWithBuffer);
  } else {
    totalWithBuffer = Math.round(totalWithBuffer);
  }

  return {
    baseHeadcount,
    bufferAmount: Math.round(bufferAmount * 100) / 100,
    bufferPercentage: Math.round(bufferPercentage * 100) / 100,
    totalWithBuffer,
    rounding,
  };
}

/**
 * Validate headcount against SLA window requirements
 */
export function validateSlaCompliance(
  actualHeadcount: number,
  requiredHeadcount: number,
  slaWindow: SlaWindow
): SlaComplianceStatus {
  const minimumRequired = Math.ceil((requiredHeadcount * slaWindow.minimumStaffPercentage) / 100);
  const compliancePercentage = (actualHeadcount / requiredHeadcount) * 100;
  const isCompliant = actualHeadcount >= minimumRequired;
  const gapOrSurplus = actualHeadcount - minimumRequired;

  return {
    windowId: slaWindow.id,
    windowName: slaWindow.name,
    required: minimumRequired,
    actual: actualHeadcount,
    compliancePercentage: Math.round(compliancePercentage * 100) / 100,
    isCompliant,
    gapOrSurplus,
  };
}

/**
 * Check compliance against all enabled SLA windows
 */
export function checkAllSlaCompliance(
  actualHeadcount: number,
  requiredHeadcount: number,
  slaWindows: SlaWindow[]
): SlaComplianceStatus[] {
  return slaWindows
    .filter(window => window.enabled)
    .map(window => validateSlaCompliance(actualHeadcount, requiredHeadcount, window));
}

/**
 * Calculate recommended headcount with buffer applied
 */
export function calculateRecommendedHeadcount(
  baseHeadcount: number,
  config: BufferSlaConfiguration,
  priority?: 'low' | 'medium' | 'high'
): BufferedHeadcount {
  // Determine which buffer to use
  let buffer = config.buffers.overall;

  if (priority && config.buffers.byPriority[priority]) {
    buffer = config.buffers.byPriority[priority];
  }

  return calculateBufferedHeadcount(baseHeadcount, buffer);
}

/**
 * Get SLA window by time
 */
export function getSlaWindowByTime(
  time: string, // HH:MM format
  slaWindows: SlaWindow[]
): SlaWindow[] {
  return slaWindows.filter(window => {
    if (!window.enabled) return false;

    // Parse times
    const [winStartHour, winStartMin] = window.startTime.split(':').map(Number);
    const [winEndHour, winEndMin] = window.endTime.split(':').map(Number);
    const [timeHour, timeMin] = time.split(':').map(Number);

    const winStartTotalMin = winStartHour * 60 + winStartMin;
    const winEndTotalMin = winEndHour * 60 + winEndMin;
    const timeTotalMin = timeHour * 60 + timeMin;

    return timeTotalMin >= winStartTotalMin && timeTotalMin <= winEndTotalMin;
  });
}

/**
 * Validate buffer configuration
 */
export function validateBufferConfig(buffer: BufferConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (buffer.value < 0) {
    errors.push('Buffer value cannot be negative');
  }

  if (buffer.type === 'percentage' && buffer.value > 100) {
    errors.push('Percentage buffer cannot exceed 100%');
  }

  if (buffer.type === 'fixed' && !Number.isFinite(buffer.value)) {
    errors.push('Fixed buffer must be a valid number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate SLA window configuration
 */
export function validateSlaWindow(window: SlaWindow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!window.name || window.name.trim() === '') {
    errors.push('SLA window must have a name');
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(window.startTime)) {
    errors.push('Invalid start time format (use HH:MM)');
  }
  if (!timeRegex.test(window.endTime)) {
    errors.push('Invalid end time format (use HH:MM)');
  }

  if (window.minimumStaffPercentage < 0 || window.minimumStaffPercentage > 100) {
    errors.push('Minimum staff percentage must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export configuration as JSON
 */
export function exportConfiguration(config: BufferSlaConfiguration): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON
 */
export function importConfiguration(json: string): BufferSlaConfiguration {
  return JSON.parse(json);
}

export default {
  calculateBufferedHeadcount,
  validateSlaCompliance,
  checkAllSlaCompliance,
  calculateRecommendedHeadcount,
  getSlaWindowByTime,
  validateBufferConfig,
  validateSlaWindow,
  exportConfiguration,
  importConfiguration,
};
