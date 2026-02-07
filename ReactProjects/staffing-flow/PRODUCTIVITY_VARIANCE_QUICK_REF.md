# Productivity Variance Engine - Quick Reference

## Installation

```bash
cd PythonProjects/sim-service
pip install -r requirements.txt
python main.py
```

Service runs on: `http://localhost:8000`

## API Endpoints

### 1. Full Variance Simulation
**POST** `/sim/productivity/variance`

```json
{
  "organization_id": "org-123",
  "start_date": "2026-03-01",
  "end_date": "2026-03-31",
  "variance_scenario": "consistent",
  "baseline_units_per_hour": 15.0,
  "baseline_staff_needed": 10
}
```

### 2. Quick Analysis
**POST** `/sim/productivity/quick-analysis?organization_id=org-123&start_date=2026-03-01&end_date=2026-03-31&scenario=consistent&baseline_staff=10&baseline_units_per_hour=15`

### 3. Get Presets
**GET** `/sim/productivity/presets`

### 4. Get Common Factors
**GET** `/sim/productivity/factors`

## Variance Scenarios

| Scenario | Variance | Use Case |
|----------|----------|----------|
| `consistent` | ±5% | Stable operations |
| `volatile` | ±25% | High uncertainty |
| `declining` | -30% over period | Equipment aging |
| `improving` | +30% over period | New hires, training |
| `cyclical` | ±15% weekly | Weekly patterns |
| `shock` | Random ±30% | Risk planning |

## TypeScript Usage

### Quick Analysis
```typescript
import { productivityVarianceService } from './services/productivityVarianceService';
import { VarianceScenario } from './types/productivityVariance.types';

const result = await productivityVarianceService.quickAnalysis({
  organizationId: 'org-123',
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  scenario: VarianceScenario.CONSISTENT,
  baselineStaff: 10,
  baselineUnitsPerHour: 15.0,
});
```

### Full Simulation
```typescript
const result = await productivityVarianceService.simulateWithPreset(
  'org-123',
  '2026-03-01',
  '2026-03-31',
  VarianceScenario.VOLATILE,
  {
    baselineUnitsPerHour: 15.0,
    baselineStaffNeeded: 10,
    seed: 12345
  }
);
```

### Scenario Comparison
```typescript
const comparison = await productivityVarianceService.compareScenarios(
  'org-123',
  '2026-03-01',
  '2026-03-31',
  [VarianceScenario.CONSISTENT, VarianceScenario.VOLATILE, VarianceScenario.DECLINING]
);
```

### Cost Impact
```typescript
const costImpact = productivityVarianceService.calculateCostImpact(
  simulationResult,
  25.00 // hourly labor cost
);
```

### Buffer Recommendation
```typescript
const buffer = productivityVarianceService.getRecommendedBuffer(
  simulationResult,
  0.95 // confidence level
);
```

## Database Setup

```sql
-- Create schema
\i PRODUCTIVITY_VARIANCE_SCHEMA.sql

-- Load sample data
\i PRODUCTIVITY_VARIANCE_SAMPLE_DATA.sql

-- Query active profiles
SELECT * FROM active_variance_profiles_with_stats;

-- Query recent trends
SELECT * FROM recent_variance_trends LIMIT 20;

-- Query simulation summary
SELECT * FROM variance_simulation_summary;
```

## Key Response Fields

### Productivity Stats
- `mean`: Average productivity modifier
- `std_dev`: Standard deviation
- `min/max`: Range of values
- `percentile_90`: 90th percentile value

### Staffing Impact
- `avg_variance`: Average staffing adjustment needed
- `max_additional_staff`: Peak additional staff required
- `days_understaffed`: Number of days needing extra staff
- `total_additional_staff_days`: Total staff-days of extra coverage

### Risk Metrics
- `probability_below_90pct`: Chance of <90% productivity
- `probability_below_80pct`: Chance of <80% productivity (critical)
- `volatility`: Overall variance level
- `coefficient_of_variation`: Normalized volatility measure

## Common Patterns

### Custom Profile
```typescript
{
  mean_productivity_modifier: 1.0,
  std_deviation: 0.15,
  min_modifier: 0.7,
  max_modifier: 1.3,
  distribution_type: DistributionType.NORMAL,
  autocorrelation: 0.5
}
```

### Time-of-Day Pattern
```typescript
{
  time_of_day_impact: {
    6: 0.85, 9: 1.00, 10: 1.05, 17: 0.95, 19: 0.85
  }
}
```

### Day-of-Week Pattern
```typescript
{
  day_of_week_impact: {
    0: 0.95, // Monday
    1: 1.00, // Tuesday
    2: 1.05, // Wednesday (peak)
    3: 1.05, // Thursday
    4: 0.95, // Friday
    5: 0.90, // Saturday
    6: 0.85  // Sunday
  }
}
```

### Variance Factors
```typescript
[
  {
    name: "Equipment Downtime",
    category: FactorCategory.EQUIPMENT,
    impact_magnitude: -0.30, // -30%
    probability: 0.05,       // 5% chance
    duration_hours: 2
  }
]
```

### Shock Events
```typescript
[
  {
    date: "2026-03-15",
    impact: -0.25, // -25%
    name: "System Outage"
  }
]
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Unrealistic results | Check min/max bounds, verify std_deviation |
| Simulation too slow | Reduce monte_carlo_runs, shorten date range |
| High variance warnings | Review risk metrics, increase buffers |

## Files

| File | Purpose |
|------|---------|
| `PRODUCTIVITY_VARIANCE_SCHEMA.sql` | Database tables, indexes, functions |
| `PRODUCTIVITY_VARIANCE_SAMPLE_DATA.sql` | Sample profiles, factors, history |
| `productivity_variance.py` | Python simulation engine |
| `main.py` | FastAPI endpoints |
| `productivityVarianceService.ts` | TypeScript service |
| `productivityVariance.types.ts` | TypeScript types |
| `PRODUCTIVITY_VARIANCE_ENGINE.md` | Full documentation |

## Best Practices

1. ✅ Start with preset profiles
2. ✅ Calibrate using historical data when available
3. ✅ Set realistic min/max bounds (0.70-1.30)
4. ✅ Use appropriate autocorrelation (0.7 for stable, 0.3 for volatile)
5. ✅ Include relevant variance factors
6. ✅ Run multiple scenarios for comparison
7. ✅ Cache presets and common factors

## Version

**v1.0.0** (2026-02-07)
