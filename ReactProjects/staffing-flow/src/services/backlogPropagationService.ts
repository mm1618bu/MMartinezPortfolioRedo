/**
 * Backlog Propagation Service
 * 
 * API integration for backlog propagation simulation and analysis
 */

import {
  BacklogPropagationRequest,
  BacklogPropagationResponse,
  QuickBacklogScenariosRequest,
  QuickBacklogScenariosResponse,
  OverflowStrategiesResponse,
  ProfileTemplatesResponse,
  BacklogItem,
  DailyCapacity,
  DailyDemand,
  BacklogPropagationProfile,
  Priority,
  Complexity,
  OverflowStrategy,
  RecoveryAnalysis,
  BacklogSummaryStats
} from './backlogPropagation.types';

const API_BASE_URL = process.env.REACT_APP_SIM_API_URL || 'http://localhost:8000';

// ============================================================================
// Main Simulation Methods
// ============================================================================

/**
 * Run full backlog propagation simulation
 */
export async function runBacklogPropagation(
  request: BacklogPropagationRequest
): Promise<BacklogPropagationResponse> {
  const response = await fetch(`${API_BASE_URL}/sim/backlog/propagate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Backlog propagation simulation failed');
  }

  return response.json();
}

/**
 * Run quick scenario comparisons with common configurations
 */
export async function runQuickBacklogScenarios(
  params: QuickBacklogScenariosRequest
): Promise<QuickBacklogScenariosResponse> {
  const queryParams = new URLSearchParams({
    organization_id: params.organization_id,
    start_date: params.start_date,
    days: params.days.toString(),
    daily_demand_count: params.daily_demand_count.toString(),
    daily_capacity_hours: params.daily_capacity_hours.toString(),
    initial_backlog_count: params.initial_backlog_count.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/sim/backlog/quick-scenarios?${queryParams}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Quick backlog scenarios failed');
  }

  return response.json();
}

// ============================================================================
// Configuration & Templates
// ============================================================================

/**
 * Get available overflow strategies with descriptions
 */
export async function getOverflowStrategies(): Promise<OverflowStrategiesResponse> {
  const response = await fetch(`${API_BASE_URL}/sim/backlog/overflow-strategies`);

  if (!response.ok) {
    throw new Error('Failed to fetch overflow strategies');
  }

  return response.json();
}

/**
 * Get pre-configured profile templates
 */
export async function getProfileTemplates(): Promise<ProfileTemplatesResponse> {
  const response = await fetch(`${API_BASE_URL}/sim/backlog/profile-templates`);

  if (!response.ok) {
    throw new Error('Failed to fetch profile templates');
  }

  return response.json();
}

// ============================================================================
// Helper Functions for Building Requests
// ============================================================================

/**
 * Create default backlog propagation profile
 */
export function createDefaultProfile(): BacklogPropagationProfile {
  return {
    propagation_rate: 1.0,
    decay_rate: 0.05,
    max_backlog_capacity: 500,
    aging_enabled: true,
    aging_threshold_days: 3,
    overflow_strategy: OverflowStrategy.DEFER,
    sla_breach_threshold_days: 2,
    sla_penalty_per_day: 100.0,
    customer_satisfaction_impact: -0.05,
    recovery_rate_multiplier: 1.0,
    recovery_priority_boost: 1
  };
}

/**
 * Generate daily capacities for a date range
 */
export function generateDailyCapacities(
  startDate: Date,
  endDate: Date,
  baseCapacityHours: number = 40,
  staffCount: number = 10,
  backlogAllocation: number = 0.6
): DailyCapacity[] {
  const capacities: DailyCapacity[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    capacities.push({
      date: current.toISOString().split('T')[0],
      total_capacity_hours: baseCapacityHours,
      backlog_capacity_hours: baseCapacityHours * backlogAllocation,
      new_work_capacity_hours: baseCapacityHours * (1 - backlogAllocation),
      staff_count: staffCount,
      productivity_modifier: 1.0,
      max_items_per_day: 100,
      max_complex_items_per_day: 10
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return capacities;
}

/**
 * Generate daily demands for a date range
 */
export function generateDailyDemands(
  startDate: Date,
  endDate: Date,
  dailyItemCount: number = 50,
  priorityDistribution: Record<Priority, number> = {
    [Priority.LOW]: 0.4,
    [Priority.MEDIUM]: 0.3,
    [Priority.HIGH]: 0.2,
    [Priority.CRITICAL]: 0.1
  },
  complexityDistribution: Record<Complexity, number> = {
    [Complexity.SIMPLE]: 0.5,
    [Complexity.MODERATE]: 0.35,
    [Complexity.COMPLEX]: 0.15
  }
): DailyDemand[] {
  const demands: DailyDemand[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const items_by_priority: Record<Priority, number> = {
      [Priority.LOW]: Math.floor(dailyItemCount * priorityDistribution[Priority.LOW]),
      [Priority.MEDIUM]: Math.floor(dailyItemCount * priorityDistribution[Priority.MEDIUM]),
      [Priority.HIGH]: Math.floor(dailyItemCount * priorityDistribution[Priority.HIGH]),
      [Priority.CRITICAL]: Math.floor(dailyItemCount * priorityDistribution[Priority.CRITICAL])
    };
    
    const items_by_complexity: Record<Complexity, number> = {
      [Complexity.SIMPLE]: Math.floor(dailyItemCount * complexityDistribution[Complexity.SIMPLE]),
      [Complexity.MODERATE]: Math.floor(dailyItemCount * complexityDistribution[Complexity.MODERATE]),
      [Complexity.COMPLEX]: Math.floor(dailyItemCount * complexityDistribution[Complexity.COMPLEX])
    };
    
    demands.push({
      date: current.toISOString().split('T')[0],
      new_items_by_priority: items_by_priority,
      new_items_by_complexity: items_by_complexity,
      total_estimated_effort_hours: dailyItemCount * 0.5
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return demands;
}

/**
 * Create initial backlog items
 */
export function generateInitialBacklog(
  count: number,
  startDate: Date,
  maxAge: number = 5
): BacklogItem[] {
  const items: BacklogItem[] = [];
  const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL];
  const complexities = [Complexity.SIMPLE, Complexity.MODERATE, Complexity.COMPLEX];
  
  for (let i = 0; i < count; i++) {
    const daysOld = Math.floor(Math.random() * maxAge) + 1;
    const createdDate = new Date(startDate);
    createdDate.setDate(createdDate.getDate() - daysOld);
    
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const complexity = complexities[Math.floor(Math.random() * complexities.length)];
    
    const effortMinutes = 
      complexity === Complexity.SIMPLE ? Math.floor(Math.random() * 20) + 15 :
      complexity === Complexity.MODERATE ? Math.floor(Math.random() * 40) + 30 :
      Math.floor(Math.random() * 60) + 60;
    
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 1);
    
    items.push({
      id: `INITIAL-${(i + 1).toString().padStart(4, '0')}`,
      item_type: 'work_item',
      priority,
      original_priority: priority,
      complexity,
      estimated_effort_minutes: effortMinutes,
      created_date: createdDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      completed_date: null,
      status: 'pending' as any,
      sla_breached: false,
      days_in_backlog: daysOld,
      propagation_count: daysOld,
      aging_date: null
    });
  }
  
  return items;
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Calculate recovery time analysis
 */
export function calculateRecoveryAnalysis(
  backlogItems: BacklogItem[],
  dailyCapacityHours: number,
  recoveryBoost: number = 1.0
): RecoveryAnalysis {
  const totalEffortHours = backlogItems.reduce(
    (sum, item) => sum + (item.estimated_effort_minutes / 60),
    0
  );
  
  const effectiveCapacity = dailyCapacityHours * recoveryBoost;
  const recoveryDaysNormal = dailyCapacityHours > 0 ? totalEffortHours / dailyCapacityHours : 0;
  const recoveryDaysBoosted = effectiveCapacity > 0 ? totalEffortHours / effectiveCapacity : 0;
  
  const itemsPerDay = backlogItems.length / recoveryDaysNormal;
  const avgMinutesPerItem = backlogItems.length > 0
    ? backlogItems.reduce((sum, item) => sum + item.estimated_effort_minutes, 0) / backlogItems.length
    : 0;
  
  const staffIncrease = recoveryBoost > 1.0 
    ? Math.ceil((recoveryBoost - 1.0) * 10)  // Assuming 10 base staff
    : 0;
  
  return {
    current_backlog_size: backlogItems.length,
    estimated_effort_hours: totalEffortHours,
    daily_capacity_hours: dailyCapacityHours,
    recovery_days_normal: Math.ceil(recoveryDaysNormal),
    recovery_days_boosted: Math.ceil(recoveryDaysBoosted),
    items_per_day_needed: Math.ceil(itemsPerDay),
    staff_increase_needed: staffIncrease
  };
}

/**
 * Compare two simulation results
 */
export function compareSimulations(
  baseline: BacklogPropagationResponse,
  alternative: BacklogPropagationResponse
): {
  backlog_change_diff: number;
  sla_compliance_diff: number;
  financial_impact_diff: number;
  recovery_time_diff: number;
  recommendation: string;
} {
  const backlogDiff = alternative.summary_stats.net_backlog_change - baseline.summary_stats.net_backlog_change;
  const slaDiff = alternative.summary_stats.avg_sla_compliance_rate - baseline.summary_stats.avg_sla_compliance_rate;
  const financialDiff = alternative.summary_stats.total_financial_impact - baseline.summary_stats.total_financial_impact;
  const recoveryDiff = alternative.summary_stats.avg_recovery_days - baseline.summary_stats.avg_recovery_days;
  
  let recommendation = '';
  
  if (backlogDiff < -10 && slaDiff > 5) {
    recommendation = 'Alternative configuration significantly improves backlog and SLA metrics. Recommended for implementation.';
  } else if (financialDiff < -1000) {
    recommendation = 'Alternative configuration reduces financial impact substantially. Consider adopting.';
  } else if (backlogDiff > 20 || slaDiff < -10) {
    recommendation = 'Alternative configuration underperforms baseline. Maintain current approach.';
  } else {
    recommendation = 'Configurations perform similarly. Choose based on operational constraints.';
  }
  
  return {
    backlog_change_diff: backlogDiff,
    sla_compliance_diff: slaDiff,
    financial_impact_diff: financialDiff,
    recovery_time_diff: recoveryDiff,
    recommendation
  };
}

/**
 * Calculate optimal capacity for target backlog level
 */
export function calculateOptimalCapacity(
  avgDailyDemandItems: number,
  avgEffortMinutesPerItem: number,
  targetBacklogDays: number = 2,
  staffWorkHoursPerDay: number = 8
): {
  required_capacity_hours: number;
  required_staff_count: number;
  backlog_allocation_pct: number;
  new_work_allocation_pct: number;
} {
  // Calculate effort needed to process daily demand
  const dailyDemandHours = (avgDailyDemandItems * avgEffortMinutesPerItem) / 60;
  
  // Add buffer for target backlog clearance
  const bufferHours = dailyDemandHours * (1 / targetBacklogDays);
  
  const requiredCapacityHours = dailyDemandHours + bufferHours;
  const requiredStaff = Math.ceil(requiredCapacityHours / staffWorkHoursPerDay);
  
  // Allocate 60% to backlog clearance, 40% to new work
  const backlogAllocation = 0.6;
  const newWorkAllocation = 0.4;
  
  return {
    required_capacity_hours: requiredCapacityHours,
    required_staff_count: requiredStaff,
    backlog_allocation_pct: backlogAllocation * 100,
    new_work_allocation_pct: newWorkAllocation * 100
  };
}

/**
 * Analyze trend from snapshots
 */
export function analyzeTrend(
  snapshots: BacklogPropagationResponse['daily_snapshots'],
  metric: keyof BacklogSummaryStats
): {
  trend: 'improving' | 'stable' | 'degrading';
  change_rate: number;
  start_value: number;
  end_value: number;
} {
  if (snapshots.length < 2) {
    return {
      trend: 'stable',
      change_rate: 0,
      start_value: 0,
      end_value: 0
    };
  }
  
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  
  // Use total_items as proxy if metric not directly available
  const startValue = first.total_items;
  const endValue = last.total_items;
  
  const changeRate = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  
  let trend: 'improving' | 'stable' | 'degrading' = 'stable';
  
  if (changeRate < -5) {
    trend = 'improving';
  } else if (changeRate > 5) {
    trend = 'degrading';
  }
  
  return {
    trend,
    change_rate: changeRate,
    start_value: startValue,
    end_value: endValue
  };
}

/**
 * Generate recommendations based on simulation results
 */
export function generateRecommendations(
  response: BacklogPropagationResponse
): string[] {
  const recommendations: string[] = [];
  const stats = response.summary_stats;
  
  // Backlog growth
  if (stats.net_backlog_change > 20) {
    recommendations.push(
      `⚠️ Backlog grew by ${stats.net_backlog_change} items. Increase capacity or reduce demand intake.`
    );
  } else if (stats.net_backlog_change < -20) {
    recommendations.push(
      `✓ Backlog reduced by ${Math.abs(stats.net_backlog_change)} items. Current strategy is effective.`
    );
  }
  
  // SLA compliance
  if (stats.avg_sla_compliance_rate < 80) {
    recommendations.push(
      `⚠️ SLA compliance at ${stats.avg_sla_compliance_rate.toFixed(1)}%. Consider extending SLA thresholds or prioritizing backlog work.`
    );
  } else if (stats.avg_sla_compliance_rate >= 95) {
    recommendations.push(
      `✓ Excellent SLA compliance at ${stats.avg_sla_compliance_rate.toFixed(1)}%. Maintain current practices.`
    );
  }
  
  // Financial impact
  if (stats.total_financial_impact > 10000) {
    recommendations.push(
      `💰 High financial impact (${(stats.total_financial_impact / 1000).toFixed(1)}K). Implement recovery measures.`
    );
  }
  
  // Recovery time
  if (stats.avg_recovery_days > 7) {
    recommendations.push(
      `📅 Extended recovery time (${stats.avg_recovery_days.toFixed(1)} days). Consider capacity boost or demand reduction.`
    );
  } else if (stats.avg_recovery_days <= 3) {
    recommendations.push(
      `✓ Quick recovery time (${stats.avg_recovery_days.toFixed(1)} days). Capacity is well-aligned with demand.`
    );
  }
  
  // Backlog size
  if (stats.max_daily_backlog > 200) {
    recommendations.push(
      `📊 Peak backlog reached ${stats.max_daily_backlog} items. Monitor for sustained overflow.`
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✓ Backlog management is within acceptable parameters. Continue monitoring.');
  }
  
  return recommendations;
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  // Main simulation
  runBacklogPropagation,
  runQuickBacklogScenarios,
  
  // Configuration
  getOverflowStrategies,
  getProfileTemplates,
  createDefaultProfile,
  
  // Request builders
  generateDailyCapacities,
  generateDailyDemands,
  generateInitialBacklog,
  
  // Analysis
  calculateRecoveryAnalysis,
  compareSimulations,
  calculateOptimalCapacity,
  analyzeTrend,
  generateRecommendations
};
