/**
 * TypeScript Type Definitions for Backlog Propagation
 * 
 * Models for tracking and simulating how unmet demand accumulates
 * and propagates through time periods
 */

// ============================================================================
// Enums
// ============================================================================

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DEFERRED = 'deferred',
  ESCALATED = 'escalated',
  REJECTED = 'rejected',
  OUTSOURCED = 'outsourced'
}

export enum Complexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex'
}

export enum OverflowStrategy {
  REJECT = 'reject',
  DEFER = 'defer',
  ESCALATE = 'escalate',
  OUTSOURCE = 'outsource'
}

export enum BacklogLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// Core Models
// ============================================================================

export interface BacklogPropagationProfile {
  propagation_rate: number;
  decay_rate: number;
  max_backlog_capacity: number | null;
  aging_enabled: boolean;
  aging_threshold_days: number;
  overflow_strategy: OverflowStrategy;
  sla_breach_threshold_days: number;
  sla_penalty_per_day: number;
  customer_satisfaction_impact: number;
  recovery_rate_multiplier: number;
  recovery_priority_boost: number;
}

export interface BacklogItem {
  id: string;
  item_type: string;
  priority: Priority;
  original_priority: Priority;
  complexity: Complexity;
  estimated_effort_minutes: number;
  
  created_date: string;
  due_date: string | null;
  completed_date: string | null;
  
  status: ItemStatus;
  sla_breached: boolean;
  days_in_backlog: number;
  propagation_count: number;
  aging_date: string | null;
}

export interface DailyCapacity {
  date: string;
  total_capacity_hours: number;
  backlog_capacity_hours: number;
  new_work_capacity_hours: number;
  staff_count: number;
  productivity_modifier: number;
  max_items_per_day: number | null;
  max_complex_items_per_day: number | null;
}

export interface DailyDemand {
  date: string;
  new_items_by_priority: Record<Priority, number>;
  new_items_by_complexity: Record<Complexity, number>;
  total_estimated_effort_hours: number;
}

export interface BacklogSnapshot {
  snapshot_date: string;
  total_items: number;
  items_by_priority: Record<string, number>;
  items_by_age: Record<string, number>;
  
  total_estimated_effort_hours: number;
  avg_age_days: number;
  oldest_item_age_days: number;
  
  sla_breached_count: number;
  sla_at_risk_count: number;
  sla_compliance_rate: number;
  
  capacity_utilization: number;
  overflow_count: number;
  
  items_propagated: number;
  items_aged_up: number;
  items_resolved: number;
  new_items: number;
  
  estimated_recovery_days: number;
  customer_impact_score: number;
  financial_impact: number;
}

// ============================================================================
// Request/Response Models
// ============================================================================

export interface BacklogPropagationRequest {
  organization_id: string;
  start_date: string;
  end_date: string;
  
  profile: BacklogPropagationProfile;
  
  initial_backlog_items: BacklogItem[];
  daily_capacities: DailyCapacity[];
  daily_demands: DailyDemand[];
  
  seed?: number | null;
  enable_priority_aging: boolean;
  enable_sla_tracking: boolean;
}

export interface BacklogPropagationResponse {
  organization_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  
  daily_snapshots: BacklogSnapshot[];
  final_backlog_items: BacklogItem[];
  final_backlog_count: number;
  
  summary_stats: BacklogSummaryStats;
  
  execution_duration_ms: number;
  seed_used: number | null;
}

export interface BacklogSummaryStats {
  total_items_processed: number;
  total_new_items: number;
  net_backlog_change: number;
  avg_daily_backlog: number;
  max_daily_backlog: number;
  avg_sla_compliance_rate: number;
  total_sla_breaches: number;
  avg_recovery_days: number;
  total_financial_impact: number;
  final_backlog_size: number;
}

// ============================================================================
// Quick Scenarios Models
// ============================================================================

export interface QuickBacklogScenariosRequest {
  organization_id: string;
  start_date: string;
  days: number;
  daily_demand_count: number;
  daily_capacity_hours: number;
  initial_backlog_count: number;
}

export interface ScenarioSummary {
  final_backlog_count: number;
  total_items_processed: number;
  total_new_items: number;
  net_change: number;
  avg_daily_backlog: number;
  max_daily_backlog: number;
  avg_sla_compliance: number;
  total_sla_breaches: number;
  total_financial_impact: number;
  avg_recovery_days: number;
}

export interface QuickBacklogScenariosResponse {
  organization_id: string;
  simulation_period: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
  input_parameters: {
    daily_demand_count: number;
    daily_capacity_hours: number;
    initial_backlog_count: number;
  };
  scenario_summaries: Record<string, ScenarioSummary>;
  recommendations: Record<string, string>;
}

// ============================================================================
// Templates & Configuration
// ============================================================================

export interface OverflowStrategyInfo {
  name: OverflowStrategy;
  description: string;
  use_case: string;
  impact: string;
}

export interface OverflowStrategiesResponse {
  strategies: OverflowStrategyInfo[];
  selection_guidance: Record<string, OverflowStrategy>;
}

export interface ProfileTemplate {
  name: string;
  description: string;
  profile: Partial<BacklogPropagationProfile>;
  best_for: string;
}

export interface ProfileTemplatesResponse {
  templates: Record<string, ProfileTemplate>;
}

// ============================================================================
// UI Helper Types
// ============================================================================

export interface BacklogChartData {
  date: string;
  total_items: number;
  pending: number;
  in_progress: number;
  completed: number;
  sla_breached: number;
  capacity_utilization: number;
}

export interface PriorityDistribution {
  priority: Priority;
  count: number;
  percentage: number;
  avg_age_days: number;
}

export interface ComplexityDistribution {
  complexity: Complexity;
  count: number;
  percentage: number;
  avg_effort_minutes: number;
}

export interface SLAMetrics {
  total_items: number;
  items_with_sla: number;
  breached_count: number;
  at_risk_count: number;
  compliance_rate: number;
  avg_days_to_breach: number;
}

export interface CapacityMetrics {
  total_capacity_hours: number;
  utilized_hours: number;
  available_hours: number;
  utilization_percentage: number;
  items_processed: number;
  avg_minutes_per_item: number;
}

export interface RecoveryAnalysis {
  current_backlog_size: number;
  estimated_effort_hours: number;
  daily_capacity_hours: number;
  recovery_days_normal: number;
  recovery_days_boosted: number;
  items_per_day_needed: number;
  staff_increase_needed: number;
}

// ============================================================================
// Metadata & Constants
// ============================================================================

export const PRIORITY_METADATA: Record<Priority, {
  label: string;
  color: string;
  order: number;
  description: string;
}> = {
  [Priority.LOW]: {
    label: 'Low',
    color: '#10b981',
    order: 1,
    description: 'Non-urgent work, flexible timeline'
  },
  [Priority.MEDIUM]: {
    label: 'Medium',
    color: '#3b82f6',
    order: 2,
    description: 'Standard work, normal SLA expectations'
  },
  [Priority.HIGH]: {
    label: 'High',
    color: '#f59e0b',
    order: 3,
    description: 'Important work, tight SLA requirements'
  },
  [Priority.CRITICAL]: {
    label: 'Critical',
    color: '#dc2626',
    order: 4,
    description: 'Urgent work, immediate attention required'
  }
};

export const STATUS_METADATA: Record<ItemStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  [ItemStatus.PENDING]: {
    label: 'Pending',
    color: '#6b7280',
    icon: '⏸',
    description: 'Waiting in queue'
  },
  [ItemStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3b82f6',
    icon: '▶',
    description: 'Currently being worked'
  },
  [ItemStatus.COMPLETED]: {
    label: 'Completed',
    color: '#10b981',
    icon: '✓',
    description: 'Successfully resolved'
  },
  [ItemStatus.DEFERRED]: {
    label: 'Deferred',
    color: '#f59e0b',
    icon: '⏭',
    description: 'Postponed to future period'
  },
  [ItemStatus.ESCALATED]: {
    label: 'Escalated',
    color: '#dc2626',
    icon: '⬆',
    description: 'Escalated to higher priority'
  },
  [ItemStatus.REJECTED]: {
    label: 'Rejected',
    color: '#6b7280',
    icon: '✗',
    description: 'Rejected due to overflow'
  },
  [ItemStatus.OUTSOURCED]: {
    label: 'Outsourced',
    color: '#8b5cf6',
    icon: '↗',
    description: 'Sent to external team'
  }
};

export const COMPLEXITY_METADATA: Record<Complexity, {
  label: string;
  color: string;
  typical_effort_minutes: number;
  description: string;
}> = {
  [Complexity.SIMPLE]: {
    label: 'Simple',
    color: '#10b981',
    typical_effort_minutes: 20,
    description: 'Quick, straightforward tasks'
  },
  [Complexity.MODERATE]: {
    label: 'Moderate',
    color: '#f59e0b',
    typical_effort_minutes: 45,
    description: 'Standard complexity, moderate effort'
  },
  [Complexity.COMPLEX]: {
    label: 'Complex',
    color: '#dc2626',
    typical_effort_minutes: 90,
    description: 'Complex tasks requiring significant effort'
  }
};

export const OVERFLOW_STRATEGY_METADATA: Record<OverflowStrategy, {
  label: string;
  color: string;
  icon: string;
  risk_level: 'low' | 'medium' | 'high';
}> = {
  [OverflowStrategy.REJECT]: {
    label: 'Reject',
    color: '#dc2626',
    icon: '🛑',
    risk_level: 'high'
  },
  [OverflowStrategy.DEFER]: {
    label: 'Defer',
    color: '#f59e0b',
    icon: '⏭',
    risk_level: 'medium'
  },
  [OverflowStrategy.ESCALATE]: {
    label: 'Escalate',
    color: '#ef4444',
    icon: '⬆️',
    risk_level: 'medium'
  },
  [OverflowStrategy.OUTSOURCE]: {
    label: 'Outsource',
    color: '#8b5cf6',
    icon: '↗️',
    risk_level: 'low'
  }
};

export const BACKLOG_LEVEL_METADATA: Record<BacklogLevel, {
  label: string;
  color: string;
  threshold: string;
  action: string;
}> = {
  [BacklogLevel.LOW]: {
    label: 'Low',
    color: '#10b981',
    threshold: '< 50% capacity',
    action: 'Monitor normally'
  },
  [BacklogLevel.MEDIUM]: {
    label: 'Medium',
    color: '#3b82f6',
    threshold: '50-75% capacity',
    action: 'Watch for trends'
  },
  [BacklogLevel.HIGH]: {
    label: 'High',
    color: '#f59e0b',
    threshold: '75-95% capacity',
    action: 'Plan intervention'
  },
  [BacklogLevel.CRITICAL]: {
    label: 'Critical',
    color: '#dc2626',
    threshold: '> 95% capacity',
    action: 'Immediate action required'
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function calculateBacklogLevel(
  current_count: number,
  max_capacity: number | null
): BacklogLevel {
  if (!max_capacity || max_capacity === 0) {
    if (current_count < 50) return BacklogLevel.LOW;
    if (current_count < 100) return BacklogLevel.MEDIUM;
    if (current_count < 200) return BacklogLevel.HIGH;
    return BacklogLevel.CRITICAL;
  }
  
  const utilization = current_count / max_capacity;
  
  if (utilization < 0.5) return BacklogLevel.LOW;
  if (utilization < 0.75) return BacklogLevel.MEDIUM;
  if (utilization < 0.95) return BacklogLevel.HIGH;
  return BacklogLevel.CRITICAL;
}

export function formatPriority(priority: Priority): string {
  return PRIORITY_METADATA[priority]?.label || priority;
}

export function formatStatus(status: ItemStatus): string {
  return STATUS_METADATA[status]?.label || status;
}

export function formatComplexity(complexity: Complexity): string {
  return COMPLEXITY_METADATA[complexity]?.label || complexity;
}

export function formatOverflowStrategy(strategy: OverflowStrategy): string {
  return OVERFLOW_STRATEGY_METADATA[strategy]?.label || strategy;
}

export function getPriorityColor(priority: Priority): string {
  return PRIORITY_METADATA[priority]?.color || '#6b7280';
}

export function getStatusColor(status: ItemStatus): string {
  return STATUS_METADATA[status]?.color || '#6b7280';
}

export function getComplexityColor(complexity: Complexity): string {
  return COMPLEXITY_METADATA[complexity]?.color || '#6b7280';
}

export function formatEffort(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remaining}m`;
}

export function formatFinancialImpact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateSLAStatus(item: BacklogItem): {
  status: 'compliant' | 'at_risk' | 'breached';
  days_remaining: number | null;
  urgency: 'low' | 'medium' | 'high' | 'critical';
} {
  if (item.sla_breached) {
    return {
      status: 'breached',
      days_remaining: null,
      urgency: 'critical'
    };
  }
  
  if (!item.due_date) {
    return {
      status: 'compliant',
      days_remaining: null,
      urgency: 'low'
    };
  }
  
  const today = new Date();
  const due = new Date(item.due_date);
  const days_remaining = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days_remaining <= 0) {
    return {
      status: 'breached',
      days_remaining: days_remaining,
      urgency: 'critical'
    };
  }
  
  if (days_remaining <= 1) {
    return {
      status: 'at_risk',
      days_remaining,
      urgency: 'high'
    };
  }
  
  if (days_remaining <= 3) {
    return {
      status: 'at_risk',
      days_remaining,
      urgency: 'medium'
    };
  }
  
  return {
    status: 'compliant',
    days_remaining,
    urgency: 'low'
  };
}

export function aggregatePriorityDistribution(items: BacklogItem[]): PriorityDistribution[] {
  const groups = items.reduce((acc, item) => {
    if (!acc[item.priority]) {
      acc[item.priority] = {
        items: [],
        total_age: 0
      };
    }
    acc[item.priority].items.push(item);
    acc[item.priority].total_age += item.days_in_backlog;
    return acc;
  }, {} as Record<Priority, { items: BacklogItem[]; total_age: number }>);
  
  const total = items.length;
  
  return Object.entries(groups).map(([priority, data]) => ({
    priority: priority as Priority,
    count: data.items.length,
    percentage: total > 0 ? (data.items.length / total) * 100 : 0,
    avg_age_days: data.items.length > 0 ? data.total_age / data.items.length : 0
  }));
}

export function aggregateComplexityDistribution(items: BacklogItem[]): ComplexityDistribution[] {
  const groups = items.reduce((acc, item) => {
    if (!acc[item.complexity]) {
      acc[item.complexity] = {
        items: [],
        total_effort: 0
      };
    }
    acc[item.complexity].items.push(item);
    acc[item.complexity].total_effort += item.estimated_effort_minutes;
    return acc;
  }, {} as Record<Complexity, { items: BacklogItem[]; total_effort: number }>);
  
  const total = items.length;
  
  return Object.entries(groups).map(([complexity, data]) => ({
    complexity: complexity as Complexity,
    count: data.items.length,
    percentage: total > 0 ? (data.items.length / total) * 100 : 0,
    avg_effort_minutes: data.items.length > 0 ? data.total_effort / data.items.length : 0
  }));
}

export function calculateSLAMetrics(items: BacklogItem[]): SLAMetrics {
  const items_with_sla = items.filter(item => item.due_date !== null);
  const breached = items.filter(item => item.sla_breached);
  const at_risk = items.filter(item => {
    if (!item.due_date || item.sla_breached) return false;
    const slaStatus = calculateSLAStatus(item);
    return slaStatus.status === 'at_risk';
  });
  
  return {
    total_items: items.length,
    items_with_sla: items_with_sla.length,
    breached_count: breached.length,
    at_risk_count: at_risk.length,
    compliance_rate: items_with_sla.length > 0 
      ? ((items_with_sla.length - breached.length) / items_with_sla.length) * 100 
      : 100,
    avg_days_to_breach: breached.length > 0
      ? breached.reduce((sum, item) => sum + item.days_in_backlog, 0) / breached.length
      : 0
  };
}

export function transformSnapshotToChartData(snapshot: BacklogSnapshot): BacklogChartData {
  return {
    date: snapshot.snapshot_date,
    total_items: snapshot.total_items,
    pending: snapshot.items_by_priority[Priority.MEDIUM] || 0,
    in_progress: 0, // Would need status breakdown from snapshot
    completed: snapshot.items_resolved,
    sla_breached: snapshot.sla_breached_count,
    capacity_utilization: snapshot.capacity_utilization
  };
}
