import { config } from '../config';
import {
  DemandSimulationRequest,
  DemandSimulationResponse,
  ScheduleOptimizationRequest,
  ScheduleOptimizationResponse,
  ScenariosListResponse,
  SimulationStatsResponse,
  HealthCheckResponse,
  SimulationScenario,
  validateDemandSimulationResponse,
  validateScheduleOptimizationResponse,
} from '../types/simulation.schema.types';

/**
 * Simulation Service
 * Handles communication with the Python FastAPI simulation service
 */

const SIMULATION_API_BASE_URL = config.api.pythonUrl || 'http://localhost:8000';

class SimulationService {
  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Health check for simulation service
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Simulation service health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get detailed health information
   */
  async getHealth(): Promise<HealthCheckResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/health`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get simulation service health: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate simulated demand data
   */
  async generateDemand(request: DemandSimulationRequest): Promise<DemandSimulationResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/demand/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Failed to generate demand simulation: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return validateDemandSimulationResponse(data);
  }

  /**
   * Optimize employee schedules based on demand
   */
  async optimizeSchedule(
    request: ScheduleOptimizationRequest
  ): Promise<ScheduleOptimizationResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/schedule/optimize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Failed to optimize schedule: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return validateScheduleOptimizationResponse(data);
  }

  /**
   * Get list of available simulation scenarios
   */
  async getScenarios(): Promise<ScenariosListResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/scenarios`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get scenarios: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get simulation service statistics
   */
  async getStats(): Promise<SimulationStatsResponse> {
    const response = await fetch(`${SIMULATION_API_BASE_URL}/sim/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get simulation stats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate demand for a specific scenario with defaults
   */
  async generateScenario(
    organizationId: string,
    scenario: SimulationScenario,
    startDate: string,
    endDate: string,
    options?: {
      departmentId?: string;
      baseEmployees?: number;
      variancePercentage?: number;
    }
  ): Promise<DemandSimulationResponse> {
    const request: DemandSimulationRequest = {
      organization_id: organizationId,
      start_date: startDate,
      end_date: endDate,
      scenario,
      department_id: options?.departmentId,
      base_employees: options?.baseEmployees ?? 10,
      variance_percentage: options?.variancePercentage ?? 0.2,
    };

    return this.generateDemand(request);
  }

  /**
   * Quick simulation: Generate demand and optimize schedule in one call
   */
  async simulateAndOptimize(
    organizationId: string,
    scenario: SimulationScenario,
    startDate: string,
    endDate: string,
    availableEmployees: number,
    options?: {
      departmentId?: string;
      baseEmployees?: number;
      variancePercentage?: number;
      maxHoursPerEmployee?: number;
      minHoursPerEmployee?: number;
    }
  ): Promise<{
    simulation: DemandSimulationResponse;
    optimization: ScheduleOptimizationResponse;
  }> {
    // Generate demand
    const simulation = await this.generateScenario(
      organizationId,
      scenario,
      startDate,
      endDate,
      options
    );

    // Optimize schedule
    const optimization = await this.optimizeSchedule({
      demands: simulation.demands,
      available_employees: availableEmployees,
      max_hours_per_employee: options?.maxHoursPerEmployee ?? 40,
      min_hours_per_employee: options?.minHoursPerEmployee ?? 20,
    });

    return { simulation, optimization };
  }

  /**
   * Calculate coverage statistics from optimization result
   */
  calculateCoverageStats(optimization: ScheduleOptimizationResponse): {
    coveredDemands: number;
    unmetDemands: number;
    coveragePercentage: number;
    averageHoursPerEmployee: number;
    utilizationRate: number;
  } {
    const totalDemands = optimization.total_shifts + optimization.unmet_demands.length;
    const coveredDemands = optimization.total_shifts;
    const unmetDemands = optimization.unmet_demands.length;
    const coveragePercentage = (coveredDemands / totalDemands) * 100;
    const averageHoursPerEmployee =
      optimization.employees_utilized > 0
        ? optimization.total_hours / optimization.employees_utilized
        : 0;
    const utilizationRate = optimization.coverage_percentage;

    return {
      coveredDemands,
      unmetDemands,
      coveragePercentage,
      averageHoursPerEmployee,
      utilizationRate,
    };
  }
}

export const simulationService = new SimulationService();
export default simulationService;
