# Productivity Variance Engine Documentation

## Overview

The Productivity Variance Engine is a comprehensive simulation system that models realistic productivity fluctuations in workforce planning. It helps organizations understand how productivity variations affect staffing requirements, costs, and operational risks.

## Key Features

- **Advanced Statistical Modeling**: Multiple distribution types (normal, uniform, beta, exponential)
- **Temporal Patterns**: Time-of-day, day-of-week, and seasonal productivity variations
- **Learning Curves**: Model employee ramp-up and improvement over time
- **Variance Factors**: Track specific events that impact productivity
- **Shock Events**: Simulate sudden disruptions or improvements
- **Monte Carlo Simulation**: Run multiple scenarios for risk analysis
- **Autocorrelation**: Model day-to-day productivity dependencies
- **Cost Impact Analysis**: Calculate financial implications of variance
- **Risk Metrics**: Assess probability of underperformance

## Architecture

### Components

1. **Database Layer** (`PRODUCTIVITY_VARIANCE_SCHEMA.sql`)
   - Variance profiles
   - Historical variance data
   - Simulation configurations
   - Variance factors and instances

2. **Python Simulation Engine** (`productivity_variance.py`)
   - Core variance generation algorithms
   - Statistical calculations
   - Staffing impact analysis

3. **API Endpoints** (`main.py`)
   - REST API for running simulations
   - Preset profiles and factors
   - Quick analysis tools

4. **TypeScript Service** (`productivityVarianceService.ts`)
   - Frontend integration
   - Response type definitions
   - Helper utilities

## Quick Start

### 1. Database Setup

```sql
-- Run the schema creation
\i PRODUCTIVITY_VARIANCE_SCHEMA.sql

-- Load sample data
\i PRODUCTIVITY_VARIANCE_SAMPLE_DATA.sql
```

### 2. Start Python Simulation Service

```bash
cd PythonProjects/sim-service

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
```

The service will run on `http://localhost:8000`

### 3. Run a Simulation

```typescript
import { productivityVarianceService } from './services/productivityVarianceService';
import { VarianceScenario } from './types/productivityVariance.types';

// Quick analysis
const result = await productivityVarianceService.quickAnalysis({
  organizationId: 'org-123',
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  scenario: VarianceScenario.CONSISTENT,
  baselineStaff: 10,
  baselineUnitsPerHour: 15.0,
});

console.log('Staffing Impact:', result.staffing_impact);
console.log('Risk Assessment:', result.risk_assessment);
```

## Variance Scenarios

### 1. Consistent Performance
- **Use Case**: Mature, stable operations
- **Variance**: ±5%
- **Autocorrelation**: High (0.7)
- **Example**: Established customer service team

```typescript
{
  variance_scenario: VarianceScenario.CONSISTENT,
  mean_productivity_modifier: 1.0,
  std_deviation: 0.05,
  min_modifier: 0.90,
  max_modifier: 1.10
}
```

### 2. Volatile Performance
- **Use Case**: New operations, high uncertainty
- **Variance**: ±25%
- **Autocorrelation**: Low (0.3)
- **Example**: Newly launched service line

```typescript
{
  variance_scenario: VarianceScenario.VOLATILE,
  mean_productivity_modifier: 1.0,
  std_deviation: 0.25,
  min_modifier: 0.60,
  max_modifier: 1.40
}
```

### 3. Declining Performance
- **Use Case**: Equipment aging, employee burnout
- **Variance**: 30% decline over period
- **Pattern**: Linear decline
- **Example**: Aging infrastructure without maintenance

### 4. Improving Performance
- **Use Case**: New hires, training periods
- **Variance**: 30% improvement over period
- **Learning Curve**: Sigmoid function
- **Example**: New employee onboarding

### 5. Cyclical Performance
- **Use Case**: Weekly demand cycles
- **Variance**: ±15% weekly cycle
- **Pattern**: Better mid-week, worse weekends
- **Example**: Retail operations

### 6. Shock Events
- **Use Case**: Risk planning, contingency
- **Variance**: Random ±30% disruptions
- **Frequency**: 10% daily chance
- **Example**: Equipment failures, system outages

## API Reference

### Full Variance Simulation

**Endpoint**: `POST /sim/productivity/variance`

```json
{
  "organization_id": "org-123",
  "start_date": "2026-03-01",
  "end_date": "2026-03-31",
  "variance_scenario": "consistent",
  "baseline_units_per_hour": 15.0,
  "baseline_staff_needed": 10,
  "monte_carlo_runs": 1,
  "confidence_level": 0.95,
  "seed": 12345,
  "profile": {
    "mean_productivity_modifier": 1.0,
    "std_deviation": 0.15,
    "min_modifier": 0.7,
    "max_modifier": 1.3,
    "distribution_type": "normal"
  }
}
```

**Response**:
```json
{
  "organization_id": "org-123",
  "variance_scenario": "consistent",
  "total_days": 31,
  "data_points": [...],
  "productivity_stats": {
    "mean": 1.00,
    "median": 1.01,
    "std_dev": 0.05,
    "min": 0.91,
    "max": 1.09,
    "percentile_90": 1.05
  },
  "staffing_impact": {
    "avg_variance": 0.2,
    "max_additional_staff": 2,
    "days_understaffed": 8,
    "total_additional_staff_days": 15
  },
  "risk_metrics": {
    "probability_below_90pct": 0.05,
    "probability_below_80pct": 0.00,
    "volatility": 0.05
  }
}
```

### Quick Analysis

**Endpoint**: `POST /sim/productivity/quick-analysis`

Query parameters:
- `organization_id`
- `start_date`
- `end_date`
- `scenario`
- `baseline_staff`
- `baseline_units_per_hour`

Returns simplified summary with key metrics.

### Get Presets

**Endpoint**: `GET /sim/productivity/presets`

Returns all preset variance profiles for each scenario.

### Get Common Factors

**Endpoint**: `GET /sim/productivity/factors`

Returns common productivity variance factors with descriptions.

## Common Use Cases

### 1. Buffer Planning

Determine appropriate staffing buffers based on historical variance:

```typescript
const simulation = await productivityVarianceService.simulateWithPreset(
  'org-123',
  '2026-03-01',
  '2026-06-30',
  VarianceScenario.CONSISTENT
);

const buffer = productivityVarianceService.getRecommendedBuffer(
  simulation,
  0.95 // 95% confidence level
);

console.log(`Recommended buffer: ${buffer.bufferPercentage}%`);
console.log(`Rationale: ${buffer.rationale}`);
```

### 2. Cost Impact Analysis

Calculate financial implications of productivity variance:

```typescript
const simulation = await productivityVarianceService.simulateWithPreset(
  'org-123',
  '2026-03-01',
  '2026-03-31',
  VarianceScenario.VOLATILE
);

const costImpact = productivityVarianceService.calculateCostImpact(
  simulation,
  25.00 // $25/hour labor cost
);

console.log(`Baseline cost: $${costImpact.baselineCost}`);
console.log(`Additional cost: $${costImpact.additionalCost}`);
console.log(`Cost variance: ${costImpact.costVariancePercentage}%`);
```

### 3. Scenario Comparison

Compare multiple scenarios side-by-side:

```typescript
const comparison = await productivityVarianceService.compareScenarios(
  'org-123',
  '2026-03-01',
  '2026-03-31',
  [
    VarianceScenario.CONSISTENT,
    VarianceScenario.VOLATILE,
    VarianceScenario.DECLINING
  ],
  15.0, // baseline units/hour
  10    // baseline staff
);

comparison.comparison.forEach(comp => {
  console.log(`${comp.scenario}:`);
  console.log(`  Avg Productivity: ${comp.avgProductivity.toFixed(2)}`);
  console.log(`  Avg Staffing Variance: ${comp.avgStaffingVariance.toFixed(1)}`);
  console.log(`  Risk Level: ${comp.riskLevel}`);
});
```

### 4. Trend Analysis

Analyze productivity trends from simulation data:

```typescript
const simulation = await productivityVarianceService.simulateWithPreset(
  'org-123',
  '2026-01-01',
  '2026-12-31',
  VarianceScenario.IMPROVING
);

const analysis = productivityVarianceService.analyzeTrends(simulation);

console.log(`Trend: ${analysis.trend}`);
console.log(`Strength: ${analysis.trendStrength}`);
console.log(`Recommendations:`);
analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
```

## Variance Factors

### Categories

1. **Environmental**: Temperature, lighting, noise
2. **Equipment**: System performance, tool availability
3. **Training**: Experience level, skill gaps
4. **Staffing**: Understaffing, overstaffing
5. **Workload**: Volume, complexity
6. **Temporal**: Time of day, day of week
7. **External**: Market conditions, supply chain

### Example Factors

```typescript
const factors = [
  {
    name: "Equipment Downtime",
    category: FactorCategory.EQUIPMENT,
    impact_magnitude: -0.30, // -30%
    probability: 0.05,        // 5% chance
    duration_hours: 2
  },
  {
    name: "Process Improvement",
    category: FactorCategory.WORKLOAD,
    impact_magnitude: 0.15,   // +15%
    probability: 0.10,        // 10% chance
    duration_hours: 24
  }
];
```

## Temporal Patterns

### Time of Day

Model how productivity varies throughout the day:

```typescript
{
  time_of_day_impact: {
    6: 0.85,   // 85% productivity at 6 AM
    9: 1.00,   // 100% at 9 AM
    10: 1.05,  // 105% at 10 AM (peak)
    17: 0.95,  // 95% at 5 PM
    19: 0.85   // 85% at 7 PM
  }
}
```

### Day of Week

Model weekly patterns:

```typescript
{
  day_of_week_impact: {
    0: 0.95,  // Monday (0) - 95%
    1: 1.00,  // Tuesday - 100%
    2: 1.05,  // Wednesday - 105% (peak)
    3: 1.05,  // Thursday - 105%
    4: 0.95,  // Friday - 95%
    5: 0.90,  // Saturday - 90%
    6: 0.85   // Sunday - 85%
  }
}
```

### Seasonal

Model annual patterns:

```typescript
{
  seasonal_impact: {
    1: 0.95,   // January
    6: 1.00,   // June
    11: 1.10,  // November (peak season)
    12: 1.15   // December (holiday peak)
  }
}
```

## Learning Curves

Model employee productivity improvement over time:

```typescript
{
  learning_curve_enabled: true,
  learning_rate: 0.005,      // 0.5% daily improvement
  plateau_weeks: 12,         // Plateau after 12 weeks
}
```

Uses sigmoid function: productivity gradually improves from starting level to plateau over the specified period.

## Database Queries

### Active Variance Profiles

```sql
SELECT * FROM active_variance_profiles_with_stats
WHERE organization_id = 'org-123'
ORDER BY avg_historical_variance DESC;
```

### Recent Variance Trends

```sql
SELECT 
  department_name,
  variance_date,
  avg_productivity,
  avg_variance,
  total_staffing_impact
FROM recent_variance_trends
WHERE organization_id = 'org-123'
  AND variance_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY variance_date DESC;
```

### Simulation Summary

```sql
SELECT 
  name,
  variance_scenario,
  days_simulated,
  avg_variance,
  min_productivity,
  max_productivity
FROM variance_simulation_summary
WHERE organization_id = 'org-123'
ORDER BY created_at DESC
LIMIT 10;
```

## Best Practices

### 1. Start with Presets

Use preset profiles before creating custom configurations:

```typescript
const presets = await productivityVarianceService.getVariancePresets();
```

### 2. Use Historical Data

If available, calibrate profiles using historical productivity data:

```sql
SELECT 
  AVG(productivity_modifier) as mean,
  STDDEV(productivity_modifier) as std_dev,
  MIN(productivity_modifier) as min,
  MAX(productivity_modifier) as max
FROM productivity_variance_history
WHERE department_id = 'dept-123'
  AND variance_date >= CURRENT_DATE - INTERVAL '90 days';
```

### 3. Set Realistic Bounds

Ensure min/max modifiers reflect realistic productivity ranges:
- **Consistent operations**: 0.90 - 1.10 (±10%)
- **Volatile operations**: 0.60 - 1.40 (±40%)
- **Never below**: 0.50 (50% productivity minimum)

### 4. Use Autocorrelation Appropriately

- **High (0.7-0.9)**: Stable operations where yesterday predicts today
- **Medium (0.4-0.6)**: Moderate correlation
- **Low (0.0-0.3)**: Random, independent variations

### 5. Include Relevant Factors

Add variance factors specific to your operation:
- Equipment maintenance schedules
- Training calendars
- Seasonal patterns
- Known disruption events

### 6. Run Multiple Scenarios

Always compare multiple scenarios for robust planning:

```typescript
const scenarios = [
  VarianceScenario.CONSISTENT,  // Best case
  VarianceScenario.CYCLICAL,    // Expected
  VarianceScenario.VOLATILE     // Worst case
];
```

## Troubleshooting

### Issue: Unrealistic Results

**Solution**: Check profile parameters
- Verify min/max bounds are reasonable
- Ensure std_deviation matches expected variance
- Check temporal patterns for extreme values

### Issue: Simulation Too Slow

**Solution**: Reduce complexity
- Decrease monte_carlo_runs
- Shorten date range
- Remove unused variance_factors

### Issue: High Variance Warnings

**Solution**: Review risk metrics
- Check `probability_below_80pct`
- Analyze `volatility` metric
- Consider increasing staffing buffers

## Integration Examples

### React Component

```typescript
import React, { useState, useEffect } from 'react';
import { productivityVarianceService } from '../services/productivityVarianceService';
import { VarianceScenario } from '../types/productivityVariance.types';

export function VarianceSimulator() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const result = await productivityVarianceService.quickAnalysis({
        organizationId: 'org-123',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        scenario: VarianceScenario.CONSISTENT,
        baselineStaff: 10,
        baselineUnitsPerHour: 15.0,
      });
      setResult(result);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={runSimulation} disabled={loading}>
        {loading ? 'Simulating...' : 'Run Simulation'}
      </button>
      {result && (
        <div>
          <h3>Results: {result.scenario}</h3>
          <p>Avg Additional Staff: {result.staffing_impact.avg_additional_staff_needed}</p>
          <p>Days Needing Extra Staff: {result.staffing_impact.days_requiring_extra_staff}</p>
          <p>Risk: {result.risk_assessment.probability_underperformance}</p>
        </div>
      )}
    </div>
  );
}
```

## Performance Considerations

- **Date Range**: Keep simulations under 365 days for optimal performance
- **Monte Carlo Runs**: Use 1 for quick analysis, 100-1000 for risk analysis
- **Caching**: Cache preset profiles and common factors
- **Batch Operations**: Use `compareScenarios()` for multiple simulations

## Support

For issues or questions:
1. Check this documentation
2. Review sample data in `PRODUCTIVITY_VARIANCE_SAMPLE_DATA.sql`
3. Examine API endpoint documentation
4. Review type definitions in `productivityVariance.types.ts`

## Version History

- **v1.0.0** (2026-02-07): Initial release
  - Core variance engine
  - 6 preset scenarios
  - Database schema
  - TypeScript service
  - API endpoints
  - Sample data

## License

Internal use only.
