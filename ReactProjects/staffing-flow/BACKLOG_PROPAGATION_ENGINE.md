# Backlog Propagation Engine

## Overview

The Backlog Propagation Engine simulates how unmet demand accumulates and propagates through time periods, enabling better capacity planning, SLA management, and overflow handling in workforce scheduling systems.

## Key Concepts

### Backlog Propagation
**Backlog propagation** refers to the process of work items carrying forward from one time period to the next when capacity is insufficient to complete them. The engine models how backlogs grow, age, and resolve over time based on:

- **Demand Arrival**: New work items entering the system
- **Capacity Availability**: Staff and time available to process work
- **Processing Priority**: How items are selected for resolution
- **Item Aging**: Items increasing in priority over time
- **Overflow Handling**: Strategies for managing capacity exceedance
- **SLA Management**: Tracking and preventing deadline breaches

### Core Components

#### 1. Backlog Items
Individual work items tracked through the system:
- **Priority**: LOW, MEDIUM, HIGH, CRITICAL
- **Complexity**: SIMPLE, MODERATE, COMPLEX  
- **Status**: PENDING, IN_PROGRESS, COMPLETED, DEFERRED, ESCALATED, REJECTED, OUTSOURCED
- **SLA Tracking**: Due dates, breach status, days remaining
- **Aging**: Days in backlog, propagation count

#### 2. Propagation Profiles
Configuration defining backlog behavior:
- **Propagation Rate** (0-1): Portion of backlog carrying forward
- **Decay Rate** (0-1): Natural resolution rate (some items resolve themselves)
- **Max Capacity**: Maximum sustainable backlog size
- **Aging Settings**: When/how items upgrade priority
- **Overflow Strategy**: How to handle capacity exceedance
- **SLA Configuration**: Breach thresholds and penalties
- **Recovery Settings**: Parameters for backlog clearance modes

#### 3. Capacity Plans
Available processing capacity by day:
- **Total Capacity Hours**: Staff time available
- **Backlog Allocation**: Portion dedicated to clearing backlog
- **New Work Allocation**: Portion for new incoming work
- **Staff Count**: Number of available workers
- **Productivity Modifier**: Performance adjustment factor
- **Item Limits**: Maximum items processable per day

#### 4. Propagation Rules
Conditional actions triggered by backlog state:
- **Escalation Rules**: Auto-upgrade priority under conditions
- **Overflow Rules**: Actions when capacity exceeded
- **Aging Rules**: Time-based priority increases
- **Outsourcing Rules**: When to engage external capacity
- **Rejection Rules**: When to decline new work

## Overflow Strategies

### REJECT
**Behavior**: Refuse new items when backlog exceeds capacity  
**Use Case**: Strict capacity limits, protect existing commitments  
**Impact**: New work rejected, existing backlog preserved  
**Risk**: High - potential customer dissatisfaction

### DEFER
**Behavior**: Postpone lower-priority items to future periods  
**Use Case**: Temporary overflow, expecting capacity recovery  
**Impact**: Items moved forward, SLA dates extended  
**Risk**: Medium - deferred work accumulates

### ESCALATE
**Behavior**: Upgrade priority of overflow items  
**Use Case**: All work important, need urgent attention  
**Impact**: Priority inflation, increased pressure on high-priority lanes  
**Risk**: Medium - can create priority bottlenecks

### OUTSOURCE
**Behavior**: Mark items for external team processing  
**Use Case**: Consistent overflow, available external capacity  
**Impact**: Items removed from internal backlog, outsourcing cost incurred  
**Risk**: Low - work gets done, manageable cost

## Profile Templates

### Standard Flow
**Best For**: Normal operations, predictable demand  
**Configuration**:
- Propagation Rate: 1.0
- Decay Rate: 0.05
- Max Capacity: 500 items
- Aging: Every 3 days
- Overflow: DEFER
- SLA Threshold: 2 days
- Penalty: $100/day

**Characteristics**: Balanced approach with moderate constraints

### High Volume
**Best For**: High-demand environments, strict capacity constraints  
**Configuration**:
- Propagation Rate: 1.0
- Decay Rate: 0.02
- Max Capacity: 300 items
- Aging: Every 2 days
- Overflow: REJECT
- SLA Threshold: 1 day
- Penalty: $150/day

**Characteristics**: Aggressive overflow management, tight SLA requirements

### Recovery Mode
**Best For**: Backlog reduction initiatives, capacity boost periods  
**Configuration**:
- Propagation Rate: 0.8
- Decay Rate: 0.10
- Max Capacity: 1000 items
- Aging: Disabled
- Overflow: DEFER
- SLA Threshold: 3 days
- Penalty: $100/day
- Recovery Multiplier: 1.5x

**Characteristics**: Optimized for clearing existing backlog, extended SLA tolerance

### Strict SLA
**Best For**: SLA-sensitive operations, customer-facing work  
**Configuration**:
- Propagation Rate: 1.0
- Decay Rate: 0.03
- Max Capacity: 400 items
- Aging: Every 1 day
- Overflow: ESCALATE
- SLA Threshold: 1 day
- Penalty: $250/day
- Recovery Multiplier: 1.2x

**Characteristics**: Prioritizes compliance and rapid resolution

### Flexible Flow
**Best For**: Variable demand, flexible capacity, internal work  
**Configuration**:
- Propagation Rate: 1.0
- Decay Rate: 0.07
- Max Capacity: Unlimited
- Aging: Every 4 days
- Overflow: DEFER
- SLA Threshold: 3 days
- Penalty: $75/day

**Characteristics**: Elastic capacity, accommodates variability

## Usage

### Python API

#### Basic Simulation

```python
from backlog_propagation import (
    BacklogPropagationEngine,
    BacklogPropagationRequest,
    BacklogPropagationProfile,
    DailyCapacity,
    DailyDemand,
    Priority,
    Complexity,
    OverflowStrategy
)
from datetime import date, timedelta

# Create profile
profile = BacklogPropagationProfile(
    propagation_rate=1.0,
    decay_rate=0.05,
    max_backlog_capacity=500,
    aging_enabled=True,
    aging_threshold_days=3,
    overflow_strategy=OverflowStrategy.DEFER,
    sla_breach_threshold_days=2,
    sla_penalty_per_day=100.0,
    recovery_rate_multiplier=1.0
)

# Define capacity (30 days)
start_date = date.today()
end_date = start_date + timedelta(days=29)
capacities = [
    DailyCapacity(
        date=start_date + timedelta(days=i),
        total_capacity_hours=40.0,
        backlog_capacity_hours=24.0,
        new_work_capacity_hours=16.0,
        staff_count=10,
        productivity_modifier=1.0,
        max_items_per_day=100,
        max_complex_items_per_day=10
    )
    for i in range(30)
]

# Define demand
demands = [
    DailyDemand(
        date=start_date + timedelta(days=i),
        new_items_by_priority={
            Priority.LOW: 20,
            Priority.MEDIUM: 15,
            Priority.HIGH: 10,
            Priority.CRITICAL: 5
        },
        new_items_by_complexity={
            Complexity.SIMPLE: 25,
            Complexity.MODERATE: 17,
            Complexity.COMPLEX: 8
        },
        total_estimated_effort_hours=25.0
    )
    for i in range(30)
]

# Create request
request = BacklogPropagationRequest(
    organization_id="org-123",
    start_date=start_date,
    end_date=end_date,
    profile=profile,
    initial_backlog_items=[],
    daily_capacities=capacities,
    daily_demands=demands,
    seed=42
)

# Run simulation
engine = BacklogPropagationEngine(seed=42)
result = engine.simulate_propagation(request)

# Analyze results
print(f"Final backlog: {result.final_backlog_count} items")
print(f"SLA compliance: {result.summary_stats['avg_sla_compliance_rate']:.1f}%")
print(f"Financial impact: ${result.summary_stats['total_financial_impact']:,.0f}")
print(f"Recovery time: {result.summary_stats['avg_recovery_days']:.1f} days")
```

#### Quick Scenario Comparison

```python
# Run 4 preset scenarios at once
scenarios = await quick_backlog_scenarios(
    organization_id="org-123",
    start_date=date.today(),
    days=30,
    daily_demand_count=50,
    daily_capacity_hours=40.0,
    initial_backlog_count=50
)

# Compare results
for name, summary in scenarios['scenario_summaries'].items():
    print(f"\n{name.upper()}:")
    print(f"  Final backlog: {summary['final_backlog_count']}")
    print(f"  Items processed: {summary['total_items_processed']}")
    print(f"  SLA compliance: {summary['avg_sla_compliance']:.1f}%")
    print(f"  Financial impact: ${summary['total_financial_impact']:,.0f}")
```

### REST API

#### Run Full Simulation

```bash
POST /sim/backlog/propagate
Content-Type: application/json

{
  "organization_id": "org-123",
  "start_date": "2024-01-01",
  "end_date": "2024-01-30",
  "profile": {
    "propagation_rate": 1.0,
    "decay_rate": 0.05,
    "max_backlog_capacity": 500,
    "aging_enabled": true,
    "aging_threshold_days": 3,
    "overflow_strategy": "defer",
    "sla_breach_threshold_days": 2,
    "sla_penalty_per_day": 100.0,
    "recovery_rate_multiplier": 1.0
  },
  "initial_backlog_items": [],
  "daily_capacities": [...],
  "daily_demands": [...],
  "seed": 42
}
```

#### Quick Scenarios

```bash
POST /sim/backlog/quick-scenarios?organization_id=org-123&start_date=2024-01-01&days=30&daily_demand_count=50&daily_capacity_hours=40&initial_backlog_count=50
```

#### Get Overflow Strategies

```bash
GET /sim/backlog/overflow-strategies
```

#### Get Profile Templates

```bash
GET /sim/backlog/profile-templates
```

### TypeScript/React Integration

```typescript
import {
  runBacklogPropagation,
  runQuickBacklogScenarios,
  generateDailyCapacities,
  generateDailyDemands,
  createDefaultProfile
} from './services/backlogPropagationService';

// Run quick scenarios
const scenarios = await runQuickBacklogScenarios({
  organization_id: 'org-123',
  start_date: '2024-01-01',
  days: 30,
  daily_demand_count: 50,
  daily_capacity_hours: 40,
  initial_backlog_count: 50
});

// Full simulation with custom configuration
const startDate = new Date();
const endDate = new Date(startDate);
endDate.setDate(endDate.getDate() + 30);

const result = await runBacklogPropagation({
  organization_id: 'org-123',
  start_date: startDate.toISOString().split('T')[0],
  end_date: endDate.toISOString().split('T')[0],
  profile: createDefaultProfile(),
  initial_backlog_items: [],
  daily_capacities: generateDailyCapacities(startDate, endDate, 40, 10, 0.6),
  daily_demands: generateDailyDemands(startDate, endDate, 50),
  seed: 42,
  enable_priority_aging: true,
  enable_sla_tracking: true
});

// Display results
console.log(`Final backlog: ${result.final_backlog_count}`);
console.log(`SLA compliance: ${result.summary_stats.avg_sla_compliance_rate.toFixed(1)}%`);
```

## Simulation Outputs

### Daily Snapshots
Point-in-time backlog state for each day:
- Total items and breakdown by priority/age
- SLA compliance metrics
- Capacity utilization
- Items resolved, propagated, aged up
- Financial and customer impact
- Estimated recovery time

### Summary Statistics
Aggregate metrics across simulation:
- Total items processed
- Net backlog change
- Average and peak backlog size
- SLA compliance rate and breach count
- Total financial impact
- Average recovery days

### Final State
End-of-simulation backlog:
- Remaining items with full details
- Priority and complexity distribution
- SLA status breakdown  
- Age distribution

## Integration Patterns

### With Productivity Variance Engine

Combine backlog propagation with productivity variance to model realistic scenarios:

```python
# 1. Run productivity variance simulation
variance_result = variance_engine.simulate_variance(variance_request)

# 2. Extract productivity modifiers by day
productivity_by_day = {
    day.date: day.actual_productivity / day.baseline_productivity
    for day in variance_result.daily_results
}

# 3. Apply to backlog capacity planning
capacities = []
for day in date_range:
    modifier = productivity_by_day.get(day, 1.0)
    capacities.append(DailyCapacity(
        date=day,
        total_capacity_hours=40.0,
        backlog_capacity_hours=24.0,
        new_work_capacity_hours=16.0,
        staff_count=10,
        productivity_modifier=modifier,  # Apply variance
        max_items_per_day=int(100 * modifier),
        max_complex_items_per_day=int(10 * modifier)
    ))

# 4. Run backlog propagation with variable productivity
backlog_result = backlog_engine.simulate_propagation(request)
```

### With Demand Forecasting

Use historical patterns to project future demand:

```python
# Historical demand analysis
historical_avg = calculate_avg_daily_demand(last_30_days)
seasonal_factor = get_seasonal_adjustment(target_month)
growth_rate = calculate_trend(last_90_days)

# Project demand
projected_demands = []
for day in simulation_range:
    base_demand = historical_avg * seasonal_factor * (1 + growth_rate)
    
    # Add variance
    daily_demand = int(base_demand * random.gauss(1.0, 0.15))
    
    projected_demands.append(DailyDemand(
        date=day,
        new_items_by_priority=distribute_by_priority(daily_demand),
        new_items_by_complexity=distribute_by_complexity(daily_demand),
        total_estimated_effort_hours=daily_demand * avg_effort
    ))
```

## Performance Considerations

### Simulation Speed
- **Small simulations** (< 100 items, 30 days): < 100ms
- **Medium simulations** (500 items, 60 days): 200-500ms
- **Large simulations** (2000+ items, 90 days): 1-3 seconds

### Optimization Tips
1. **Limit simulation days**: Run shorter periods for quick analysis
2. **Use quick scenarios**: Preset configurations for common cases
3. **Batch simulations**: Cache profile configurations
4. **Parallel execution**: Run independent scenarios concurrently

### Memory Usage
- Each backlog item: ~500 bytes
- Daily snapshot ~2KB
- Typical 30-day simulation with 500 items: ~1MB total

## Best Practices

### Profile Configuration
1. **Start with templates**: Use preset profiles, customize incrementally
2. **Test overflow strategies**: Run scenarios to evaluate impact
3. **Tune aging thresholds**: Balance urgency with priority inflation
4. **Set realistic capacities**: Account for meetings, breaks, variability
5. **Monitor SLA compliance**: Adjust thresholds based on business requirements

### Capacity Planning
1. **Allocate 60-70% to backlog**: Reserve capacity for clearing existing work
2. **Plan recovery periods**: Schedule capacity boosts for backlog reduction
3. **Account for productivity variance**: Use conservative estimates
4. **Include weekend/holiday adjustments**: Model realistic availability
5. **Track utilization**: Aim for 80-90% sustainable utilization

### Demand Modeling
1. **Use historical data**: Base projections on actual patterns
2. **Include seasonality**: Account for cyclical variations
3. **Model realistic distributions**: Match actual priority/complexity mix
4. **Add uncertainty**: Include demand variance in projections
5. **Validate forecasts**: Compare predictions to actuals regularly

### Analysis & Interpretation
1. **Review trends**: Look for sustained patterns, not daily fluctuations
2. **Benchmark scenarios**: Compare alternatives to baseline
3. **Focus on leading indicators**: Watch overflow, aging, SLA at-risk
4. **Calculate recovery time**: Understand timeline to clear backlog
5. **Estimate costs**: Quantify financial impact of delays

## Troubleshooting

### High SLA Breach Rate
**Symptoms**: Compliance < 80%, many breached items  
**Causes**:
- SLA thresholds too tight
- Insufficient capacity
- Poor priority management

**Solutions**:
- Extend SLA threshold days
- Increase backlog capacity allocation
- Enable priority aging to upgrade critical items
- Consider recovery mode with capacity boost

### Persistent Backlog Growth  
**Symptoms**: Net change > 0, increasing avg backlog  
**Causes**:
- Demand exceeds capacity
- Inefficient overflow handling
- Low productivity

**Solutions**:
- Increase staff count or hours
- Implement REJECT or OUTSOURCE overflow strategy
- Reduce new work intake
- Schedule recovery period
- Apply productivity improvements

### Capacity Underutilization
**Symptoms**: Utilization < 60%, low items processed  
**Causes**:
- Demand below capacity
- Max items limits too restrictive
- Complex items bottleneck

**Solutions**:
- Reallocate capacity to new work
- Increase max_items_per_day limits
- Increase max_complex_items_per_day
- Consider staff reallocation

### Priority Inflation
**Symptoms**: Most items at HIGH/CRITICAL priority  
**Causes**:
- Aging too aggressive
- ESC ALATE overflow strategy
- Long backlog ages

**Solutions**:
- Increase aging threshold days
- Switch to DEFER overflow strategy
- Improve capacity to clear backlog faster
- Disable aging during recovery

## Metrics Glossary

**Propagation Rate**: Fraction of backlog items carrying forward each day (1.0 = all items persist)

**Decay Rate**: Fraction of items naturally resolving without processing (0.05 = 5% resolve automatically)

**Capacity Utilization**: Percent of available capacity used (target: 80-90%)

**SLA Compliance Rate**: Percent of items meeting SLA deadline (target: > 90%)

**SLA At Risk**: Items within 1 day of breach but not yet breached

**Days in Backlog**: Calendar days since item creation

**Propagation Count**: Number of days item has carried forward

**Recovery Days**: Estimated days to clear current backlog at current capacity

**Financial Impact**: Total SLA penalty costs accumulated

**Customer Impact Score**: Aggregate satisfaction impact from delays

**Overflow Count**: Items exceeding max capacity

## Additional Resources

- [Quick Reference Guide](./BACKLOG_PROPAGATION_QUICK_REF.md)
- [Database Schema](./BACKLOG_PROPAGATION_SCHEMA.sql)
- [Sample Data](./BACKLOG_PROPAGATION_SAMPLE_DATA.sql)
- [API Implementation](./main.py) - See backlog propagation endpoints
- [TypeScript Types](./src/services/backlogPropagation.types.ts)
- [Service Layer](./src/services/backlogPropagationService.ts)

## Support

For questions or issues:
1. Check [Quick Reference](./BACKLOG_PROPAGATION_QUICK_REF.md) for common tasks
2. Review sample scenarios in [Sample Data](./BACKLOG_PROPAGATION_SAMPLE_DATA.sql)
3. Examine API endpoint documentation in [main.py](./main.py)
4. Consult [Productivity Variance Integration](./PRODUCTIVITY_VARIANCE_ENGINE.md) for combined simulations
