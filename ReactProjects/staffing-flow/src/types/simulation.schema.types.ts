/**
 * Simulation Schema Types
 * Frontend type definitions for simulation API (extracted from backend Zod schemas)
 */

// Enums
export type ShiftType = 'all_day' | 'morning' | 'evening' | 'night';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type SimulationScenario = 
  | 'baseline'
  | 'high_demand'
  | 'low_demand'
  | 'seasonal_peak'
  | 'random_variation';

/**
 * Demand Simulation Request
 */
export interface DemandSimulationRequest {
  organization_id: string;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  scenario?: SimulationScenario;
  department_id?: string;
  base_employees?: number;
  variance_percentage?: number;
}

/**
 * Simulated Demand
 */
export interface SimulatedDemand {
  date: string;
  shift_type: ShiftType;
  required_employees: number;
  priority: Priority;
  department_id: string | null;
  notes: string | null;
}

/**
 * Demand Simulation Response
 */
export interface DemandSimulationResponse {
  organization_id: string;
  scenario: string;
  total_demands: number;
  total_employees_needed: number;
  average_per_day: number;
  demands: SimulatedDemand[];
}

/**
 * Schedule Optimization Request
 */
export interface ScheduleOptimizationRequest {
  demands: SimulatedDemand[];
  available_employees: number;
  max_hours_per_employee?: number;
  min_hours_per_employee?: number;
}

/**
 * Employee Assignment
 */
export interface EmployeeAssignment {
  employee_id: string;
  shift_date: string;
  shift_type: ShiftType;
  hours: number;
  department_id: string | null;
}

/**
 * Schedule Optimization Response
 */
export interface ScheduleOptimizationResponse {
  total_shifts: number;
  employees_utilized: number;
  coverage_percentage: number;
  total_hours: number;
  assignments: EmployeeAssignment[];
  unmet_demands: SimulatedDemand[];
}

/**
 * Scenario Info
 */
export interface ScenarioInfo {
  name: string;
  description: string;
}

/**
 * Scenarios List Response
 */
export interface ScenariosListResponse {
  scenarios: ScenarioInfo[];
}

/**
 * Simulation Stats Response
 */
export interface SimulationStatsResponse {
  supported_scenarios: number;
  shift_types: string[];
  priority_levels: string[];
  max_simulation_days: number;
  features: string[];
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  service: string;
  status: string;
  version: string;
  timestamp: string;
}

/**
 * Type guards
 */
export function isValidScenario(scenario: string): scenario is SimulationScenario {
  return ['baseline', 'high_demand', 'low_demand', 'seasonal_peak', 'random_variation'].includes(scenario);
}

export function isValidShiftType(shiftType: string): shiftType is ShiftType {
  return ['all_day', 'morning', 'evening', 'night'].includes(shiftType);
}

export function isValidPriority(priority: string): priority is Priority {
  return ['low', 'medium', 'high', 'critical'].includes(priority);
}

/**
 * Simple validation helpers (non-throwing)
 */
export function validateDemandSimulationResponse(data: unknown): DemandSimulationResponse {
  // Frontend just returns as-is, backend does real validation
  return data as DemandSimulationResponse;
}

export function validateScheduleOptimizationResponse(data: unknown): ScheduleOptimizationResponse {
  // Frontend just returns as-is, backend does real validation
  return data as ScheduleOptimizationResponse;
}
