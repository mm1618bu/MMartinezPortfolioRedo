/**
 * Simulation Types
 * TypeScript type definitions for simulation features
 */

import type {
  SimulationScenario,
  ShiftType,
  Priority,
  SimulatedDemand,
  DemandSimulationRequest,
  DemandSimulationResponse,
  ScheduleOptimizationRequest,
  ScheduleOptimizationResponse,
  EmployeeAssignment,
} from '../../api/schemas/simulation.schema';

// Re-export schema types
export type {
  SimulationScenario,
  ShiftType,
  Priority,
  SimulatedDemand,
  DemandSimulationRequest,
  DemandSimulationResponse,
  ScheduleOptimizationRequest,
  ScheduleOptimizationResponse,
  EmployeeAssignment,
};

/**
 * UI-specific simulation types
 */

export interface SimulationConfig {
  organizationId: string;
  scenario: SimulationScenario;
  dateRange: {
    start: string;
    end: string;
  };
  parameters: {
    baseEmployees: number;
    variancePercentage: number;
    departmentId?: string;
  };
  optimization?: {
    availableEmployees: number;
    maxHoursPerEmployee: number;
    minHoursPerEmployee: number;
  };
}

export interface SimulationResult {
  config: SimulationConfig;
  demand: DemandSimulationResponse;
  schedule?: ScheduleOptimizationResponse;
  timestamp: string;
  duration?: number; // milliseconds
}

export interface SimulationComparison {
  baseline: SimulationResult;
  scenarios: SimulationResult[];
  comparisonMetrics: {
    demandVariance: number;
    coverageImpact: number;
    resourcesNeeded: number[];
  };
}

export interface ScenarioMetadata {
  name: SimulationScenario;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  recommendedFor: string[];
}

/**
 * Scenario display metadata
 */
export const SCENARIO_METADATA: Record<SimulationScenario, ScenarioMetadata> = {
  baseline: {
    name: 'baseline',
    displayName: 'Baseline',
    description: 'Normal demand patterns with specified variance',
    color: '#3b82f6',
    icon: '📊',
    recommendedFor: ['Standard planning', 'Regular operations'],
  },
  high_demand: {
    name: 'high_demand',
    displayName: 'High Demand',
    description: '50% increase in requirements, includes night shifts',
    color: '#ef4444',
    icon: '📈',
    recommendedFor: ['Peak seasons', 'Product launches', 'Holiday periods'],
  },
  low_demand: {
    name: 'low_demand',
    displayName: 'Low Demand',
    description: '40% decrease in requirements',
    color: '#10b981',
    icon: '📉',
    recommendedFor: ['Off-season', 'Budget constraints', 'Slow periods'],
  },
  seasonal_peak: {
    name: 'seasonal_peak',
    displayName: 'Seasonal Peak',
    description: '80% increase on weekends, normal on weekdays',
    color: '#f59e0b',
    icon: '🌞',
    recommendedFor: ['Weekend surges', 'Event-driven demand', 'Retail patterns'],
  },
  random_variation: {
    name: 'random_variation',
    displayName: 'Random Variation',
    description: 'Random daily fluctuations within variance range',
    color: '#8b5cf6',
    icon: '🎲',
    recommendedFor: ['Uncertainty planning', 'Risk assessment', 'Stress testing'],
  },
};

/**
 * Priority display metadata
 */
export const PRIORITY_METADATA: Record<Priority, { color: string; icon: string; label: string }> = {
  low: {
    color: '#10b981',
    icon: '🟢',
    label: 'Low',
  },
  medium: {
    color: '#f59e0b',
    icon: '🟡',
    label: 'Medium',
  },
  high: {
    color: '#ef4444',
    icon: '🔴',
    label: 'High',
  },
  critical: {
    color: '#dc2626',
    icon: '🚨',
    label: 'Critical',
  },
};

/**
 * Shift type display metadata
 */
export const SHIFT_TYPE_METADATA: Record<
  ShiftType,
  { label: string; icon: string; timeRange: string }
> = {
  all_day: {
    label: 'All Day',
    icon: '⏰',
    timeRange: '00:00 - 23:59',
  },
  morning: {
    label: 'Morning',
    icon: '🌅',
    timeRange: '06:00 - 14:00',
  },
  evening: {
    label: 'Evening',
    icon: '🌆',
    timeRange: '14:00 - 22:00',
  },
  night: {
    label: 'Night',
    icon: '🌙',
    timeRange: '22:00 - 06:00',
  },
};

/**
 * Helper functions for simulation data
 */

export function getScenarioMetadata(scenario: SimulationScenario): ScenarioMetadata {
  return SCENARIO_METADATA[scenario];
}

export function getPriorityMetadata(priority: Priority) {
  return PRIORITY_METADATA[priority];
}

export function getShiftTypeMetadata(shiftType: ShiftType) {
  return SHIFT_TYPE_METADATA[shiftType];
}

export function formatScenarioName(scenario: SimulationScenario): string {
  return SCENARIO_METADATA[scenario]?.displayName || scenario;
}

export function calculateDateRangeDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function aggregateDemandsByDate(demands: SimulatedDemand[]): Map<string, SimulatedDemand[]> {
  const grouped = new Map<string, SimulatedDemand[]>();
  
  for (const demand of demands) {
    if (!grouped.has(demand.date)) {
      grouped.set(demand.date, []);
    }
    grouped.get(demand.date)!.push(demand);
  }
  
  return grouped;
}

export function aggregateDemandsByShift(demands: SimulatedDemand[]): Map<ShiftType, SimulatedDemand[]> {
  const grouped = new Map<ShiftType, SimulatedDemand[]>();
  
  for (const demand of demands) {
    if (!grouped.has(demand.shift_type)) {
      grouped.set(demand.shift_type, []);
    }
    grouped.get(demand.shift_type)!.push(demand);
  }
  
  return grouped;
}
