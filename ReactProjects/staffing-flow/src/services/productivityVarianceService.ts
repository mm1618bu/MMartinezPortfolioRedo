/**
 * Productivity Variance Service
 * Service for interacting with the productivity variance simulation API
 */

import { config } from '../config';
import type {
  VarianceSimulationRequest,
  VarianceSimulationResponse,
  QuickAnalysisResponse,
  VariancePreset,
  VarianceFactorInfo,
  VarianceScenario,
  ProductivityVarianceProfile,
} from '../types/productivityVariance.types';

const SIMULATION_API_BASE_URL = config.api.pythonUrl || 'http://localhost:8000';

/**
 * Productivity Variance Service
 * Handles all productivity variance simulation operations
 */
class ProductivityVarianceService {
  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Run a full productivity variance simulation
   */
  async runVarianceSimulation(
    request: VarianceSimulationRequest
  ): Promise<VarianceSimulationResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/productivity/variance`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(
        `Failed to run variance simulation: ${error.detail || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Run a quick productivity variance analysis with preset profile
   */
  async quickAnalysis(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
    scenario: VarianceScenario;
    baselineStaff: number;
    baselineUnitsPerHour: number;
  }): Promise<QuickAnalysisResponse> {
    const queryParams = new URLSearchParams({
      organization_id: params.organizationId,
      start_date: params.startDate,
      end_date: params.endDate,
      scenario: params.scenario,
      baseline_staff: params.baselineStaff.toString(),
      baseline_units_per_hour: params.baselineUnitsPerHour.toString(),
    });

    const response = await fetch(
      `${SIMULATION_API_BASE_URL}/sim/productivity/quick-analysis?${queryParams}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Failed to run quick analysis: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available preset variance profiles
   */
  async getVariancePresets(): Promise<VariancePreset[]> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/productivity/presets`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get variance presets: ${response.statusText}`);
    }

    const data = await response.json();
    return data.presets || [];
  }

  /**
   * Get common productivity variance factors
   */
  async getCommonFactors(): Promise<{
    factors: VarianceFactorInfo[];
    categories: string[];
  }> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/productivity/factors`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get common factors: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate a variance simulation with a specific preset
   */
  async simulateWithPreset(
    organizationId: string,
    startDate: string,
    endDate: string,
    scenario: VarianceScenario,
    options?: {
      baselineUnitsPerHour?: number;
      baselineStaffNeeded?: number;
      monteCarloRuns?: number;
      seed?: number;
    }
  ): Promise<VarianceSimulationResponse> {
    // Get the preset profile
    const presets = await this.getVariancePresets();
    const preset = presets.find((p) => p.scenario === scenario);

    if (!preset) {
      throw new Error(`Preset not found for scenario: ${scenario}`);
    }

    const request: VarianceSimulationRequest = {
      organization_id: organizationId,
      start_date: startDate,
      end_date: endDate,
      variance_scenario: scenario,
      profile: preset.profile,
      baseline_units_per_hour: options?.baselineUnitsPerHour ?? 15.0,
      baseline_staff_needed: options?.baselineStaffNeeded ?? 10,
      monte_carlo_runs: options?.monteCarloRuns ?? 1,
      seed: options?.seed,
    };

    return this.runVarianceSimulation(request);
  }

  /**
   * Compare multiple variance scenarios
   */
  async compareScenarios(
    organizationId: string,
    startDate: string,
    endDate: string,
    scenarios: VarianceScenario[],
    baselineUnitsPerHour: number = 15.0,
    baselineStaffNeeded: number = 10
  ): Promise<{
    scenarios: VarianceSimulationResponse[];
    comparison: {
      scenario: string;
      avgProductivity: number;
      avgStaffingVariance: number;
      riskLevel: 'low' | 'medium' | 'high';
    }[];
  }> {
    // Run all simulations in parallel
    const simulations = await Promise.all(
      scenarios.map((scenario) =>
        this.simulateWithPreset(organizationId, startDate, endDate, scenario, {
          baselineUnitsPerHour,
          baselineStaffNeeded,
        })
      )
    );

    // Create comparison summary
    const comparison = simulations.map((sim) => {
      const avgProductivity = sim.productivity_stats.mean;
      const avgStaffingVariance = Math.abs(sim.staffing_impact.avg_variance);
      const riskLevel =
        sim.risk_metrics.probability_below_80pct > 0.1
          ? 'high'
          : sim.risk_metrics.probability_below_90pct > 0.2
          ? 'medium'
          : 'low';

      return {
        scenario: sim.variance_scenario,
        avgProductivity,
        avgStaffingVariance,
        riskLevel,
      };
    });

    return {
      scenarios: simulations,
      comparison,
    };
  }

  /**
   * Calculate cost impact of productivity variance
   */
  calculateCostImpact(
    simulationResult: VarianceSimulationResponse,
    hourlyLaborCost: number
  ): {
    baselineCost: number;
    additionalCost: number;
    totalCost: number;
    costVariancePercentage: number;
  } {
    const baselineStaff = simulationResult.data_points[0]?.baseline_staff_needed || 0;
    const totalDays = simulationResult.total_days;
    const hoursPerDay = 8; // Assuming 8-hour shifts

    // Calculate baseline cost
    const baselineCost = baselineStaff * hoursPerDay * totalDays * hourlyLaborCost;

    // Calculate additional cost from staffing variance
    const totalAdditionalStaffDays =
      simulationResult.staffing_impact.total_additional_staff_days;
    const additionalCost = totalAdditionalStaffDays * hoursPerDay * hourlyLaborCost;

    const totalCost = baselineCost + additionalCost;
    const costVariancePercentage = (additionalCost / baselineCost) * 100;

    return {
      baselineCost,
      additionalCost,
      totalCost,
      costVariancePercentage,
    };
  }

  /**
   * Get recommended staffing buffer based on variance analysis
   */
  getRecommendedBuffer(
    simulationResult: VarianceSimulationResponse,
    confidenceLevel: number = 0.95
  ): {
    recommendedBuffer: number;
    bufferPercentage: number;
    rationale: string;
  } {
    const maxAdditionalStaff = simulationResult.staffing_impact.max_additional_staff;
    const baselineStaff = simulationResult.data_points[0]?.baseline_staff_needed || 0;
    const percentile90 = simulationResult.productivity_stats.percentile_90;

    // Use 90th percentile for buffer recommendation
    const recommendedBuffer = Math.ceil(maxAdditionalStaff * (1 - confidenceLevel / 1));
    const bufferPercentage = (recommendedBuffer / baselineStaff) * 100;

    let rationale = `Based on ${simulationResult.variance_scenario} scenario analysis: `;

    if (bufferPercentage < 10) {
      rationale += 'Low variance detected. A small buffer is sufficient.';
    } else if (bufferPercentage < 20) {
      rationale += 'Moderate variance detected. Standard buffer recommended.';
    } else {
      rationale += 'High variance detected. Larger buffer strongly recommended.';
    }

    return {
      recommendedBuffer,
      bufferPercentage,
      rationale,
    };
  }

  /**
   * Analyze productivity trends from simulation data
   */
  analyzeTrends(simulationResult: VarianceSimulationResponse): {
    trend: 'improving' | 'declining' | 'stable' | 'volatile';
    trendStrength: number; // 0-1
    weekdayPattern: boolean;
    recommendations: string[];
  } {
    const dataPoints = simulationResult.data_points;
    const productivityValues = dataPoints.map((dp) => dp.productivity_modifier);

    // Calculate trend using linear regression
    const n = productivityValues.length;
    const xSum = (n * (n - 1)) / 2; // Sum of 0, 1, 2, ..., n-1
    const ySum = productivityValues.reduce((sum, val) => sum + val, 0);
    const xySum = productivityValues.reduce((sum, val, idx) => sum + val * idx, 0);
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const stdDev = simulationResult.productivity_stats.std_dev;

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' | 'volatile';
    if (stdDev > 0.2) {
      trend = 'volatile';
    } else if (slope > 0.001) {
      trend = 'improving';
    } else if (slope < -0.001) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    const trendStrength = Math.abs(slope);

    // Check for weekday pattern
    const weekdayPattern = simulationResult.variance_scenario === 'cyclical';

    // Generate recommendations
    const recommendations: string[] = [];

    if (trend === 'declining') {
      recommendations.push('Investigate causes of productivity decline');
      recommendations.push('Consider additional training or process improvements');
    } else if (trend === 'volatile') {
      recommendations.push('Implement variance reduction initiatives');
      recommendations.push('Increase staffing buffers to account for unpredictability');
    } else if (trend === 'improving') {
      recommendations.push('Document best practices driving improvement');
      recommendations.push('Consider reducing buffers as performance stabilizes');
    } else {
      recommendations.push('Maintain current operations and monitoring');
    }

    if (weekdayPattern) {
      recommendations.push('Consider variable staffing by day of week');
    }

    return {
      trend,
      trendStrength,
      weekdayPattern,
      recommendations,
    };
  }
}

// Export singleton instance
export const productivityVarianceService = new ProductivityVarianceService();
export default productivityVarianceService;
