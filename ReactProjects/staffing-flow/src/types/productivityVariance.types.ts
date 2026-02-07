/**
 * Productivity Variance Types
 * TypeScript type definitions for productivity variance simulation features
 */

// ============================================================================
// Enums
// ============================================================================

export enum DistributionType {
  NORMAL = 'normal',
  UNIFORM = 'uniform',
  BETA = 'beta',
  EXPONENTIAL = 'exponential',
  CUSTOM = 'custom',
}

export enum VarianceScenario {
  CONSISTENT = 'consistent',
  VOLATILE = 'volatile',
  DECLINING = 'declining',
  IMPROVING = 'improving',
  CYCLICAL = 'cyclical',
  SHOCK = 'shock',
  CUSTOM = 'custom',
}

export enum FactorCategory {
  ENVIRONMENTAL = 'environmental',
  EQUIPMENT = 'equipment',
  TRAINING = 'training',
  STAFFING = 'staffing',
  WORKLOAD = 'workload',
  TEMPORAL = 'temporal',
  EXTERNAL = 'external',
}

// ============================================================================
// Core Types
// ============================================================================

export interface ProductivityVarianceProfile {
  mean_productivity_modifier: number;  // 1.0 = baseline
  std_deviation: number;  // Standard deviation
  min_modifier: number;  // Minimum multiplier
  max_modifier: number;  // Maximum multiplier
  distribution_type: DistributionType;
  
  // Temporal patterns
  time_of_day_impact?: Record<number, number>;  // Hour -> multiplier
  day_of_week_impact?: Record<number, number>;  // 0=Monday -> multiplier
  seasonal_impact?: Record<number, number>;  // Month -> multiplier
  
  // Learning curve
  learning_curve_enabled: boolean;
  learning_rate?: number;
  plateau_weeks?: number;
  
  // Autocorrelation
  autocorrelation: number;  // 0-1
}

export interface ProductivityVarianceFactor {
  name: string;
  category: FactorCategory;
  impact_magnitude: number;  // -1.0 to 1.0 (-100% to +100%)
  probability: number;  // 0.0 to 1.0
  duration_hours: number;
}

export interface ShockEvent {
  date: string;  // ISO date
  impact: number;  // Percentage impact
  name?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface VarianceSimulationRequest {
  organization_id: string;
  start_date: string;  // ISO date
  end_date: string;  // ISO date
  variance_scenario: VarianceScenario;
  profile?: ProductivityVarianceProfile;
  
  // Baseline metrics
  baseline_units_per_hour: number;
  baseline_staff_needed: number;
  
  // Simulation parameters
  monte_carlo_runs?: number;
  confidence_level?: number;
  seed?: number;
  
  // Optional factors
  variance_factors?: ProductivityVarianceFactor[];
  shock_events?: ShockEvent[];
}

export interface ProductivityDataPoint {
  date: string;
  hour_of_day?: number;
  baseline_units_per_hour: number;
  actual_units_per_hour: number;
  productivity_modifier: number;
  variance_percentage: number;
  baseline_staff_needed: number;
  adjusted_staff_needed: number;
  staffing_variance: number;
  contributing_factors: string[];
}

export interface VarianceSimulationResponse {
  organization_id: string;
  variance_scenario: string;
  start_date: string;
  end_date: string;
  total_days: number;
  monte_carlo_runs: number;
  
  // Data points
  data_points: ProductivityDataPoint[];
  
  // Statistical summary
  productivity_stats: {
    mean: number;
    median: number;
    std_dev: number;
    min: number;
    max: number;
    percentile_25: number;
    percentile_75: number;
    percentile_90: number;
  };
  
  staffing_impact: {
    avg_variance: number;
    max_additional_staff: number;
    min_additional_staff: number;
    total_additional_staff_days: number;
    days_understaffed: number;
    days_overstaffed: number;
  };
  
  risk_metrics: {
    probability_below_90pct: number;
    probability_below_80pct: number;
    volatility: number;
    coefficient_of_variation: number;
  };
  
  confidence_intervals: {
    productivity_modifier: {
      lower: number;
      upper: number;
    };
    staffing_variance: {
      lower: number;
      upper: number;
    };
  };
  
  // Execution metadata
  execution_duration_ms: number;
  seed_used?: number;
}

export interface QuickAnalysisResponse {
  scenario: string;
  date_range: {
    start: string;
    end: string;
    total_days: number;
  };
  productivity_summary: {
    baseline_units_per_hour: number;
    mean_actual_units_per_hour: number;
    range: {
      min: number;
      max: number;
    };
  };
  staffing_impact: {
    baseline_staff: number;
    avg_additional_staff_needed: number;
    peak_additional_staff_needed: number;
    days_requiring_extra_staff: number;
    total_additional_staff_days: number;
  };
  risk_assessment: {
    probability_underperformance: string;
    probability_critical: string;
    volatility: number;
  };
  full_results_available: boolean;
}

export interface VariancePreset {
  scenario: VarianceScenario;
  name: string;
  description: string;
  profile: ProductivityVarianceProfile;
}

export interface VarianceFactorInfo extends ProductivityVarianceFactor {
  impact_percentage: string;
  description: string;
}

// ============================================================================
// UI Display Types
// ============================================================================

export interface VarianceScenarioMetadata {
  scenario: VarianceScenario;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  useCase: string;
  expectedImpact: string;
}

export const VARIANCE_SCENARIO_METADATA: Record<VarianceScenario, VarianceScenarioMetadata> = {
  [VarianceScenario.CONSISTENT]: {
    scenario: VarianceScenario.CONSISTENT,
    displayName: 'Consistent Performance',
    description: 'Low variance, predictable productivity',
    color: '#10b981',
    icon: '📊',
    useCase: 'Mature, stable operations',
    expectedImpact: '±5% variance',
  },
  [VarianceScenario.VOLATILE]: {
    scenario: VarianceScenario.VOLATILE,
    displayName: 'Volatile Performance',
    description: 'High variance, unpredictable swings',
    color: '#ef4444',
    icon: '📈',
    useCase: 'New operations, high uncertainty',
    expectedImpact: '±25% variance',
  },
  [VarianceScenario.DECLINING]: {
    scenario: VarianceScenario.DECLINING,
    displayName: 'Declining Performance',
    description: 'Gradual decline over time',
    color: '#f97316',
    icon: '📉',
    useCase: 'Equipment aging, employee burnout',
    expectedImpact: '30% decline over period',
  },
  [VarianceScenario.IMPROVING]: {
    scenario: VarianceScenario.IMPROVING,
    displayName: 'Improving Performance',
    description: 'Learning curve with gradual improvement',
    color: '#3b82f6',
    icon: '📈',
    useCase: 'New hires, training periods',
    expectedImpact: '30% improvement over period',
  },
  [VarianceScenario.CYCLICAL]: {
    scenario: VarianceScenario.CYCLICAL,
    displayName: 'Cyclical Performance',
    description: 'Weekly patterns (better mid-week)',
    color: '#8b5cf6',
    icon: '🔄',
    useCase: 'Weekly demand cycles',
    expectedImpact: '±15% weekly cycle',
  },
  [VarianceScenario.SHOCK]: {
    scenario: VarianceScenario.SHOCK,
    displayName: 'Shock Events',
    description: 'Random disruption events',
    color: '#dc2626',
    icon: '⚡',
    useCase: 'Risk planning, contingency',
    expectedImpact: 'Random ±30% disruptions',
  },
  [VarianceScenario.CUSTOM]: {
    scenario: VarianceScenario.CUSTOM,
    displayName: 'Custom Profile',
    description: 'User-defined variance parameters',
    color: '#6b7280',
    icon: '⚙️',
    useCase: 'Specific scenarios',
    expectedImpact: 'User-defined',
  },
};

export const FACTOR_CATEGORY_METADATA: Record<FactorCategory, { color: string; icon: string; label: string }> = {
  [FactorCategory.ENVIRONMENTAL]: {
    color: '#10b981',
    icon: '🌡️',
    label: 'Environmental',
  },
  [FactorCategory.EQUIPMENT]: {
    color: '#f59e0b',
    icon: '⚙️',
    label: 'Equipment',
  },
  [FactorCategory.TRAINING]: {
    color: '#3b82f6',
    icon: '🎓',
    label: 'Training',
  },
  [FactorCategory.STAFFING]: {
    color: '#8b5cf6',
    icon: '👥',
    label: 'Staffing',
  },
  [FactorCategory.WORKLOAD]: {
    color: '#ef4444',
    icon: '📦',
    label: 'Workload',
  },
  [FactorCategory.TEMPORAL]: {
    color: '#06b6d4',
    icon: '🕐',
    label: 'Temporal',
  },
  [FactorCategory.EXTERNAL]: {
    color: '#ec4899',
    icon: '🌐',
    label: 'External',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getVarianceScenarioMetadata(scenario: VarianceScenario): VarianceScenarioMetadata {
  return VARIANCE_SCENARIO_METADATA[scenario];
}

export function getFactorCategoryMetadata(category: FactorCategory) {
  return FACTOR_CATEGORY_METADATA[category];
}

export function formatVariancePercentage(value: number, includeSign: boolean = true): string {
  const sign = includeSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatProductivityModifier(modifier: number): string {
  const percentage = (modifier - 1) * 100;
  return formatVariancePercentage(percentage);
}

export function getProductivityLevel(modifier: number): 'critical' | 'low' | 'normal' | 'high' {
  if (modifier < 0.8) return 'critical';
  if (modifier < 0.9) return 'low';
  if (modifier <= 1.1) return 'normal';
  return 'high';
}

export function getProductivityLevelColor(modifier: number): string {
  const level = getProductivityLevel(modifier);
  const colors = {
    critical: '#dc2626',
    low: '#f97316',
    normal: '#10b981',
    high: '#3b82f6',
  };
  return colors[level];
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_VARIANCE_PROFILE: ProductivityVarianceProfile = {
  mean_productivity_modifier: 1.0,
  std_deviation: 0.15,
  min_modifier: 0.7,
  max_modifier: 1.3,
  distribution_type: DistributionType.NORMAL,
  learning_curve_enabled: false,
  autocorrelation: 0.0,
};

export const DEFAULT_VARIANCE_REQUEST: Partial<VarianceSimulationRequest> = {
  variance_scenario: VarianceScenario.CONSISTENT,
  baseline_units_per_hour: 15.0,
  baseline_staff_needed: 10,
  monte_carlo_runs: 1,
  confidence_level: 0.95,
  variance_factors: [],
  shock_events: [],
};
