import { logger } from '../utils/logger';
import config from '../config';

const SIM_SERVICE_URL = process.env.SIM_SERVICE_URL || 'http://localhost:8000';

interface SimServiceError {
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Simulation Service Client
 * Proxies requests to the Python FastAPI simulation service
 */
export class SimulationService {
  private baseUrl: string;

  constructor(baseUrl: string = SIM_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make HTTP request to sim-service
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      logger.debug(`Sim-service request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: SimServiceError = {
          message: errorData.detail || `Sim-service error: ${response.statusText}`,
          status: response.status,
          details: errorData,
        };
        throw error;
      }

      const data = await response.json();
      logger.debug(`Sim-service response: ${response.status}`);
      return data;
    } catch (error) {
      if ((error as SimServiceError).status) {
        throw error;
      }
      
      logger.error('Sim-service connection error:', error);
      throw {
        message: 'Failed to connect to simulation service',
        status: 503,
        details: error,
      } as SimServiceError;
    }
  }

  // ============================================================================
  // HEALTH & INFO
  // ============================================================================

  async getHealth() {
    return this.makeRequest('/health');
  }

  async getStats() {
    return this.makeRequest('/sim/stats');
  }

  async getScenarios() {
    return this.makeRequest('/sim/scenarios');
  }

  // ============================================================================
  // PRODUCTIVITY VARIANCE
  // ============================================================================

  async getProductivityPresets() {
    return this.makeRequest('/sim/productivity/presets');
  }

  async getProductivityFactors() {
    return this.makeRequest('/sim/productivity/factors');
  }

  async runProductivityQuickAnalysis(params: {
    scenario: string;
    days: number;
    baseline_units_per_hour: number;
    baseline_staff: number;
    start_date?: string;
    end_date?: string;
    organization_id?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    return this.makeRequest(
      `/sim/productivity/quick-analysis?${queryParams.toString()}`,
      { method: 'POST' }
    );
  }

  async runProductivityVariance(payload: {
    organization_id: string;
    start_date: string;
    end_date: string;
    profile: {
      mean_productivity_modifier: number;
      std_deviation: number;
      distribution_type: 'normal' | 'uniform' | 'beta' | 'exponential';
      time_of_day_pattern?: Record<string, number>;
      day_of_week_pattern?: Record<string, number>;
      seasonal_pattern?: Record<string, number>;
      learning_curve?: {
        enabled: boolean;
        rate: number;
      };
      autocorrelation?: number;
    };
    labor_standards: {
      baseline_units_per_hour: number;
      baseline_staff_count: number;
      shift_hours: number;
      target_service_level: number;
    };
    variance_factors?: Array<{
      name: string;
      category: string;
      impact_magnitude: number;
      probability: number;
      duration_days?: number;
    }>;
    monte_carlo_runs?: number;
    random_seed?: number;
  }) {
    return this.makeRequest('/sim/productivity/variance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ============================================================================
  // BACKLOG PROPAGATION
  // ============================================================================

  async getOverflowStrategies() {
    return this.makeRequest('/sim/backlog/overflow-strategies');
  }

  async getProfileTemplates() {
    return this.makeRequest('/sim/backlog/profile-templates');
  }

  async runBacklogQuickScenarios(params: {
    organization_id: string;
    start_date: string;
    days: number;
    daily_demand_count: number;
    daily_capacity_hours: number;
    initial_backlog_count?: number;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    return this.makeRequest(
      `/sim/backlog/quick-scenarios?${queryParams.toString()}`,
      { method: 'POST' }
    );
  }

  async runBacklogPropagation(payload: {
    organization_id: string;
    start_date: string;
    simulation_days: number;
    demand_items: Array<{
      date: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      complexity: number;
      count: number;
    }>;
    capacity_profile: {
      daily_capacity_hours: number;
      avg_item_hours: number;
      efficiency_factor: number;
      capacity_variance?: number;
    };
    initial_backlog?: {
      high?: number;
      medium?: number;
      low?: number;
      critical?: number;
    };
    overflow_strategy?: 'reject' | 'defer' | 'escalate' | 'outsource';
    priority_aging?: {
      enabled: boolean;
      aging_model: 'normal' | 'aggressive' | 'accelerated';
      thresholds?: Record<string, number>;
    };
    sla_config?: {
      high_days: number;
      medium_days: number;
      low_days: number;
      critical_days: number;
    };
  }) {
    return this.makeRequest('/sim/backlog/propagate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

// Export singleton instance
export const simulationService = new SimulationService();
