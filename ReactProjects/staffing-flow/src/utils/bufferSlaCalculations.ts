/**
 * Buffer and SLA Calculation Functions
 * Applies buffer and SLA logic to demand and headcount calculations
 */

import type { HeadcountSummary } from './headcountCalculations';
import {
  BufferSlaConfiguration,
  type BufferedHeadcount,
  type SlaComplianceStatus,
  validateSlaCompliance,
  checkAllSlaCompliance,
  calculateRecommendedHeadcount,
} from './bufferSlaConfig';

/**
 * Extended headcount summary with buffer information
 */
export interface BufferedHeadcountSummary extends HeadcountSummary {
  buffer: {
    baseTotal: number;
    bufferPercentage: number;
    bufferAmount: number;
    recommendedTotal: number;
  };
  slaCompliance: {
    overall: number; // percentage of SLA windows met
    windows: SlaComplianceStatus[];
  };
}

/**
 * Demand with buffer information
 */
export interface DemandWithBuffer {
  id: string;
  date: string;
  shift_type: 'all_day' | 'morning' | 'evening' | 'night';
  start_time?: string;
  end_time?: string;
  required_employees: number;
  required_skills?: string[];
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  organization_id: string;
  department_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  baseHeadcount: number;
  bufferedHeadcount: number;
  bufferAmount: number;
  slaStatus: SlaComplianceStatus[];
  meetsAllSla: boolean;
}

/**
 * Add buffer to a single headcount value
 */
export function applyBufferToHeadcount(
  headcount: number,
  config: BufferSlaConfiguration,
  priority?: 'low' | 'medium' | 'high'
): BufferedHeadcount {
  return calculateRecommendedHeadcount(headcount, config, priority);
}

/**
 * Apply buffer to demands
 */
export function applyBufferToDemands(
  demands: DemandWithBuffer[],
  config: BufferSlaConfiguration
): DemandWithBuffer[] {
  return demands.map(demand => {
    const baseHeadcount = demand.required_employees || 0;

    // Get priority if available
    const priority = (demand.priority as 'low' | 'medium' | 'high') || undefined;

    // Calculate buffered headcount
    const buffered = calculateRecommendedHeadcount(baseHeadcount, config, priority);

    // Check SLA compliance
    const slaStatus = checkAllSlaCompliance(baseHeadcount, baseHeadcount, config.slaWindows);
    const meetsAllSla = slaStatus.every(status => status.isCompliant);

    return {
      ...demand,
      baseHeadcount,
      bufferedHeadcount: buffered.totalWithBuffer,
      bufferAmount: buffered.bufferAmount,
      slaStatus,
      meetsAllSla,
    };
  });
}

/**
 * Calculate buffered headcount summary
 */
export function calculateBufferedHeadcountSummary(
  _demands: DemandWithBuffer[],
  config: BufferSlaConfiguration,
  baseSummary: HeadcountSummary
): BufferedHeadcountSummary {
  const baseTotal = baseSummary.totalHeadcount;

  // Calculate buffer using overall buffer config
  const buffered = calculateRecommendedHeadcount(baseTotal, config);

  // Check SLA compliance for total headcount
  const slaWindows = config.slaWindows.filter(w => w.enabled);
  const slaComplianceResults = slaWindows.map(window =>
    validateSlaCompliance(baseTotal, baseTotal, window)
  );

  const compliantWindows = slaComplianceResults.filter(s => s.isCompliant).length;
  const overallSlaCompliance =
    slaWindows.length > 0 ? (compliantWindows / slaWindows.length) * 100 : 100;

  return {
    ...baseSummary,
    buffer: {
      baseTotal,
      bufferPercentage: buffered.bufferPercentage,
      bufferAmount: buffered.bufferAmount,
      recommendedTotal: buffered.totalWithBuffer,
    },
    slaCompliance: {
      overall: Math.round(overallSlaCompliance * 100) / 100,
      windows: slaComplianceResults,
    },
  };
}

/**
 * Get buffer statistics for demands
 */
export interface BufferStatistics {
  totalDemands: number;
  averageBufferPercentage: number;
  minBuffer: number;
  maxBuffer: number;
  totalBaseHeadcount: number;
  totalBufferAmount: number;
  totalBufferedHeadcount: number;
  slaMeetsCount: number;
  slaFailureCount: number;
  slaCompliancePercentage: number;
}

export function calculateBufferStatistics(
  demandWithBuffer: DemandWithBuffer[]
): BufferStatistics {
  if (demandWithBuffer.length === 0) {
    return {
      totalDemands: 0,
      averageBufferPercentage: 0,
      minBuffer: 0,
      maxBuffer: 0,
      totalBaseHeadcount: 0,
      totalBufferAmount: 0,
      totalBufferedHeadcount: 0,
      slaMeetsCount: 0,
      slaFailureCount: 0,
      slaCompliancePercentage: 0,
    };
  }

  const totalDemands = demandWithBuffer.length;
  const totalBaseHeadcount = demandWithBuffer.reduce((sum, d) => sum + d.baseHeadcount, 0);
  const totalBufferAmount = demandWithBuffer.reduce((sum, d) => sum + d.bufferAmount, 0);
  const totalBufferedHeadcount = demandWithBuffer.reduce((sum, d) => sum + d.bufferedHeadcount, 0);

  const bufferPercentages = demandWithBuffer.map(d =>
    d.baseHeadcount > 0 ? (d.bufferAmount / d.baseHeadcount) * 100 : 0
  );

  const slaMeetsCount = demandWithBuffer.filter(d => d.meetsAllSla).length;
  const slaFailureCount = totalDemands - slaMeetsCount;

  return {
    totalDemands,
    averageBufferPercentage:
      bufferPercentages.length > 0
        ? bufferPercentages.reduce((a, b) => a + b, 0) / bufferPercentages.length
        : 0,
    minBuffer: Math.min(...bufferPercentages),
    maxBuffer: Math.max(...bufferPercentages),
    totalBaseHeadcount,
    totalBufferAmount: Math.round(totalBufferAmount * 100) / 100,
    totalBufferedHeadcount,
    slaMeetsCount,
    slaFailureCount,
    slaCompliancePercentage:
      totalDemands > 0 ? (slaMeetsCount / totalDemands) * 100 : 0,
  };
}

/**
 * Get recommendations for buffer adjustments
 */
export interface BufferRecommendation {
  type: 'increase' | 'decrease' | 'optimal';
  currentBuffer: number;
  suggestedBuffer: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export function getBufferRecommendations(
  stats: BufferStatistics,
  targetSlaCompliance: number = 95
): BufferRecommendation[] {
  const recommendations: BufferRecommendation[] = [];

  if (stats.slaCompliancePercentage < targetSlaCompliance) {
    const bufferIncrease = Math.ceil((targetSlaCompliance - stats.slaCompliancePercentage) / 5);
    recommendations.push({
      type: 'increase',
      currentBuffer: stats.averageBufferPercentage,
      suggestedBuffer: stats.averageBufferPercentage + bufferIncrease,
      reason: `Current SLA compliance (${stats.slaCompliancePercentage.toFixed(1)}%) is below target (${targetSlaCompliance}%)`,
      priority: 'high',
    });
  } else if (stats.slaCompliancePercentage > targetSlaCompliance + 10) {
    const bufferDecrease = Math.floor((stats.slaCompliancePercentage - targetSlaCompliance) / 5);
    recommendations.push({
      type: 'decrease',
      currentBuffer: stats.averageBufferPercentage,
      suggestedBuffer: Math.max(0, stats.averageBufferPercentage - bufferDecrease),
      reason: `Current SLA compliance (${stats.slaCompliancePercentage.toFixed(1)}%) exceeds target with room for optimization`,
      priority: 'low',
    });
  } else {
    recommendations.push({
      type: 'optimal',
      currentBuffer: stats.averageBufferPercentage,
      suggestedBuffer: stats.averageBufferPercentage,
      reason: `Current buffer level is optimal for target SLA compliance`,
      priority: 'low',
    });
  }

  // Check for high variance in buffer percentages
  if (stats.maxBuffer - stats.minBuffer > 20) {
    recommendations.push({
      type: 'increase',
      currentBuffer: stats.minBuffer,
      suggestedBuffer: stats.averageBufferPercentage,
      reason: `High variance in buffer percentages (${stats.minBuffer.toFixed(1)}% to ${stats.maxBuffer.toFixed(1)}%) - consider standardization`,
      priority: 'medium',
    });
  }

  return recommendations;
}

export default {
  applyBufferToHeadcount,
  applyBufferToDemands,
  calculateBufferedHeadcountSummary,
  calculateBufferStatistics,
  getBufferRecommendations,
};
