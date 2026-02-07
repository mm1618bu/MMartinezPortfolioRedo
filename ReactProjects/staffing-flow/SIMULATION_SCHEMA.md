# Simulation Scenario Schema

Complete schema definitions for the workforce simulation service integration.

## Schema Files

### Backend (API)
- **`api/schemas/simulation.schema.ts`**
  - Zod validation schemas
  - Type inference from schemas
  - Validation helper functions
  - Type guards

### Frontend (Services)
- **`src/services/simulationService.ts`**
  - Service class for API communication
  - Health check methods
  - Demand generation
  - Schedule optimization
  - Quick simulation helpers

### Frontend (Types)
- **`src/types/simulation.types.ts`**
  - UI-specific type definitions
  - Display metadata for scenarios
  - Helper functions for aggregation
  - Formatting utilities

## Schema Structure

### Request Schemas

#### DemandSimulationRequest
```typescript
{
  organization_id: string (UUID)
  start_date: string (YYYY-MM-DD)
  end_date: string (YYYY-MM-DD)
  scenario: 'baseline' | 'high_demand' | 'low_demand' | 'seasonal_peak' | 'random_variation'
  department_id?: string (UUID)
  base_employees: number (1-1000, default: 10)
  variance_percentage: number (0-1, default: 0.2)
}
```

#### ScheduleOptimizationRequest
```typescript
{
  demands: SimulatedDemand[]
  available_employees: number (positive integer)
  max_hours_per_employee: number (1-80, default: 40)
  min_hours_per_employee: number (0-40, default: 20)
}
```

### Response Schemas

#### DemandSimulationResponse
```typescript
{
  organization_id: string
  scenario: string
  total_demands: number
  total_employees_needed: number
  average_per_day: number
  demands: SimulatedDemand[]
}
```

#### ScheduleOptimizationResponse
```typescript
{
  total_shifts: number
  employees_utilized: number
  coverage_percentage: number
  total_hours: number
  assignments: EmployeeAssignment[]
  unmet_demands: SimulatedDemand[]
}
```

## Enums

### SimulationScenario
- `baseline` - Normal demand patterns with specified variance
- `high_demand` - 50% increase in requirements, includes night shifts
- `low_demand` - 40% decrease in requirements
- `seasonal_peak` - 80% increase on weekends, normal on weekdays
- `random_variation` - Random daily fluctuations within variance range

### ShiftType
- `all_day` - Full day coverage (00:00 - 23:59)
- `morning` - Morning shift (06:00 - 14:00)
- `evening` - Evening shift (14:00 - 22:00)
- `night` - Night shift (22:00 - 06:00)

### Priority
- `low` - Low priority demand
- `medium` - Medium priority demand
- `high` - High priority demand
- `critical` - Critical priority demand

## Service Methods

### Core Methods
```typescript
// Health check
await simulationService.healthCheck()

// Generate demand
await simulationService.generateDemand(request)

// Optimize schedule
await simulationService.optimizeSchedule(request)

// Get available scenarios
await simulationService.getScenarios()

// Get service statistics
await simulationService.getStats()
```

### Helper Methods
```typescript
// Quick scenario generation
await simulationService.generateScenario(
  organizationId,
  'high_demand',
  '2026-02-01',
  '2026-02-07',
  { baseEmployees: 15 }
)

// Simulate and optimize in one call
await simulationService.simulateAndOptimize(
  organizationId,
  'seasonal_peak',
  '2026-02-01',
  '2026-02-28',
  20
)

// Calculate coverage statistics
const stats = simulationService.calculateCoverageStats(optimization)
```

## Display Metadata

### Scenario Metadata
Each scenario includes:
- Display name
- Description
- Color (for UI visualization)
- Icon emoji
- Recommended use cases

### Priority Metadata
- Color coding
- Icon representation
- Display label

### Shift Type Metadata
- Display label
- Icon representation
- Time range

## Validation

All schemas include Zod validation with:
- Type checking
- Range validation
- Format validation (UUIDs, dates)
- Required field enforcement
- Default values

## Type Safety

- Full TypeScript type inference from Zod schemas
- Type guards for runtime checking
- Compile-time type safety
- IDE autocomplete support

## Integration Example

```typescript
import { simulationService } from './services/simulationService';
import { SCENARIO_METADATA } from './types/simulation.types';

// Generate high demand scenario
const result = await simulationService.generateScenario(
  'a0000000-0000-4000-8000-000000000001',
  'high_demand',
  '2026-02-01',
  '2026-02-07',
  { baseEmployees: 15, variancePercentage: 0.2 }
);

// Display scenario metadata
const metadata = SCENARIO_METADATA['high_demand'];
console.log(`${metadata.icon} ${metadata.displayName}`);
console.log(metadata.description);

// Aggregate by date
const byDate = aggregateDemandsByDate(result.demands);
```

## API Endpoint Mapping

Frontend service methods map to Python FastAPI endpoints:

| Service Method | HTTP Method | Endpoint |
|----------------|-------------|----------|
| `healthCheck()` | GET | `/` |
| `getHealth()` | GET | `/health` |
| `generateDemand()` | POST | `/sim/demand/generate` |
| `optimizeSchedule()` | POST | `/sim/schedule/optimize` |
| `getScenarios()` | GET | `/sim/scenarios` |
| `getStats()` | GET | `/sim/stats` |

## Configuration

The simulation service URL is configured in:
- Frontend: `VITE_PYTHON_API_URL` environment variable
- Default fallback: `http://localhost:8000`

Current configuration uses `/python` proxy path in development.
