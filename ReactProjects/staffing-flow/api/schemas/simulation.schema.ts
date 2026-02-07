import { z } from 'zod';

/**
 * Simulation Scenario Schema
 * Defines validation schemas for workforce simulation API
 */

// Enums
export const ShiftTypeEnum = z.enum(['all_day', 'morning', 'evening', 'night']);
export const PriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const SimulationScenarioEnum = z.enum([
  'baseline',
  'high_demand',
  'low_demand',
  'seasonal_peak',
  'random_variation',
]);

export type ShiftType = z.infer<typeof ShiftTypeEnum>;
export type Priority = z.infer<typeof PriorityEnum>;
export type SimulationScenario = z.infer<typeof SimulationScenarioEnum>;

/**
 * Demand Simulation Request Schema
 */
export const demandSimulationRequestSchema = z.object({
  organization_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scenario: SimulationScenarioEnum.default('baseline'),
  department_id: z.string().uuid().optional(),
  base_employees: z.number().int().min(1).max(1000).default(10),
  variance_percentage: z.number().min(0).max(1).default(0.2),
});

export type DemandSimulationRequest = z.infer<typeof demandSimulationRequestSchema>;

/**
 * Simulated Demand Schema
 */
export const simulatedDemandSchema = z.object({
  date: z.string(),
  shift_type: ShiftTypeEnum,
  required_employees: z.number().int().positive(),
  priority: PriorityEnum,
  department_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
});

export type SimulatedDemand = z.infer<typeof simulatedDemandSchema>;

/**
 * Demand Simulation Response Schema
 */
export const demandSimulationResponseSchema = z.object({
  organization_id: z.string().uuid(),
  scenario: z.string(),
  total_demands: z.number().int().nonnegative(),
  total_employees_needed: z.number().int().nonnegative(),
  average_per_day: z.number().nonnegative(),
  demands: z.array(simulatedDemandSchema),
});

export type DemandSimulationResponse = z.infer<typeof demandSimulationResponseSchema>;

/**
 * Schedule Optimization Request Schema
 */
export const scheduleOptimizationRequestSchema = z.object({
  demands: z.array(simulatedDemandSchema),
  available_employees: z.number().int().positive(),
  max_hours_per_employee: z.number().int().min(1).max(80).default(40),
  min_hours_per_employee: z.number().int().min(0).max(40).default(20),
});

export type ScheduleOptimizationRequest = z.infer<typeof scheduleOptimizationRequestSchema>;

/**
 * Employee Assignment Schema
 */
export const employeeAssignmentSchema = z.object({
  employee_id: z.string(),
  shift_date: z.string(),
  shift_type: ShiftTypeEnum,
  hours: z.number().positive(),
  department_id: z.string().uuid().nullable(),
});

export type EmployeeAssignment = z.infer<typeof employeeAssignmentSchema>;

/**
 * Schedule Optimization Response Schema
 */
export const scheduleOptimizationResponseSchema = z.object({
  total_shifts: z.number().int().nonnegative(),
  employees_utilized: z.number().int().nonnegative(),
  coverage_percentage: z.number().min(0).max(100),
  total_hours: z.number().nonnegative(),
  assignments: z.array(employeeAssignmentSchema),
  unmet_demands: z.array(simulatedDemandSchema),
});

export type ScheduleOptimizationResponse = z.infer<typeof scheduleOptimizationResponseSchema>;

/**
 * Scenario Info Schema
 */
export const scenarioInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type ScenarioInfo = z.infer<typeof scenarioInfoSchema>;

/**
 * Scenarios List Response Schema
 */
export const scenariosListResponseSchema = z.object({
  scenarios: z.array(scenarioInfoSchema),
});

export type ScenariosListResponse = z.infer<typeof scenariosListResponseSchema>;

/**
 * Simulation Stats Response Schema
 */
export const simulationStatsResponseSchema = z.object({
  supported_scenarios: z.number().int().positive(),
  shift_types: z.array(z.string()),
  priority_levels: z.array(z.string()),
  max_simulation_days: z.number().int().positive(),
  features: z.array(z.string()),
});

export type SimulationStatsResponse = z.infer<typeof simulationStatsResponseSchema>;

/**
 * Health Check Response Schema
 */
export const healthCheckResponseSchema = z.object({
  service: z.string(),
  status: z.string(),
  version: z.string(),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;

/**
 * Validation helpers
 */
export function validateDemandSimulationRequest(data: unknown): DemandSimulationRequest {
  return demandSimulationRequestSchema.parse(data);
}

export function validateDemandSimulationResponse(data: unknown): DemandSimulationResponse {
  return demandSimulationResponseSchema.parse(data);
}

export function validateScheduleOptimizationRequest(data: unknown): ScheduleOptimizationRequest {
  return scheduleOptimizationRequestSchema.parse(data);
}

export function validateScheduleOptimizationResponse(data: unknown): ScheduleOptimizationResponse {
  return scheduleOptimizationResponseSchema.parse(data);
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
