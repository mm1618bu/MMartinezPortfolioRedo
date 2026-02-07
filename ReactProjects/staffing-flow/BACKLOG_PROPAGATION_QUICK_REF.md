# Backlog Propagation Quick Reference

## Quick Start

### 1. Run Quick Scenarios (Fastest)
```bash
POST /sim/backlog/quick-scenarios?organization_id=org-123&start_date=2024-01-01&days=30&daily_demand_count=50&daily_capacity_hours=40&initial_backlog_count=50
```

**What it does**: Runs 4 preset scenarios (Balanced, Overflow, Recovery, High Priority Aging) and compares results.

**When to use**: Initial analysis, scenario comparison, quick what-if testing.

---

### 2. Run Full Simulation
```python
from backlog_propagation import *

profile = BacklogPropagationProfile(
    propagation_rate=1.0,
    decay_rate=0.05,
    max_backlog_capacity=500,
    overflow_strategy=OverflowStrategy.DEFER,
    sla_breach_threshold_days=2
)

request = BacklogPropagationRequest(
    organization_id="org-123",
    start_date=date.today(),
    end_date=date.today() + timedelta(days=30),
    profile=profile,
    initial_backlog_items=[],
    daily_capacities=generate_capacities(),
    daily_demands=generate_demands(),
    seed=42
)

engine = BacklogPropagationEngine(seed=42)
result = engine.simulate_propagation(request)
```

**When to use**: Custom configurations, detailed analysis, integration with other systems.

---

## Profile Templates

| Template | Use Case | Max Capacity | Aging | Overflow | SLA Threshold |
|----------|----------|--------------|-------|----------|---------------|
| **Standard Flow** | Normal operations | 500 | 3 days | DEFER | 2 days |
| **High Volume** | High demand, strict limits | 300 | 2 days | REJECT | 1 day |
| **Recovery Mode** | Backlog clearance | 1000 | Disabled | DEFER | 3 days |
| **Strict SLA** | SLA-sensitive work | 400 | 1 day | ESCALATE | 1 day |
| **Flexible Flow** | Variable demand | Unlimited | 4 days | DEFER | 3 days |

---

## Overflow Strategies

| Strategy | Description | Risk Level | When to Use |
|----------|-------------|------------|-------------|
| **REJECT** | Refuse new items | 🔴 High | Capacity strictly limited |
| **DEFER** | Postpone items | 🟡 Medium | Temporary overflow |
| **ESCALATE** | Upgrade priority | 🟡 Medium | All work important |
| **OUTSOURCE** | Send to external team | 🟢 Low | Consistent overflow |

---

## Common Configurations

### High Backlog Clearance
```python
profile = BacklogPropagationProfile(
    propagation_rate=0.8,
    decay_rate=0.10,
    max_backlog_capacity=1000,
    aging_enabled=False,
    overflow_strategy=OverflowStrategy.DEFER,
    recovery_rate_multiplier=1.50  # 50% boost
)

# Increase capacity allocation
capacity = DailyCapacity(
    total_capacity_hours=52.0,      # +30%
    backlog_capacity_hours=40.0,    # 77% to backlog
    productivity_modifier=1.20       # +20% productivity
)
```

### Strict SLA Compliance
```python
profile = BacklogPropagationProfile(
    propagation_rate=1.0,
    decay_rate=0.03,
    max_backlog_capacity=400,
    aging_enabled=True,
    aging_threshold_days=1,          # Age up daily
    overflow_strategy=OverflowStrategy.ESCALATE,
    sla_breach_threshold_days=1,
    sla_penalty_per_day=250.0
)
```

### Variable Demand Handling
```python
profile = BacklogPropagationProfile(
    propagation_rate=1.0,
    decay_rate=0.07,
    max_backlog_capacity=None,       # Unlimited
    aging_enabled=True,
    aging_threshold_days=4,
    overflow_strategy=OverflowStrategy.DEFER,
    sla_breach_threshold_days=3
)
```

---

## Key Metrics Explained

| Metric | Description | Target Range |
|--------|-------------|--------------|
| **Net Backlog Change** | Final backlog - Initial backlog | < 0 (decreasing) |
| **SLA Compliance Rate** | % of items meeting deadline | > 90% |
| **Avg Daily Backlog** | Mean items in backlog per day | Stable or decreasing |
| **Total SLA Breaches** | Count of missed deadlines | < 5% of total items |
| **Capacity Utilization** | % of capacity used | 80-90% |
| **Recovery Days** | Days to clear current backlog | < 5 days |
| **Financial Impact** | Total SLA penalties | Minimize |

---

## Analysis Workflow

### 1. **Run Baseline**
```python
baseline = engine.simulate_propagation(baseline_request)
```

### 2. **Identify Issues**
```python
if baseline.summary_stats['avg_sla_compliance_rate'] < 80:
    print("⚠️ Low SLA compliance")
    
if baseline.summary_stats['net_backlog_change'] > 20:
    print("⚠️ Backlog growing")
    
if baseline.summary_stats['max_daily_backlog'] > 200:
    print("⚠️ Peak overflow detected")
```

### 3. **Test Alternatives**
```python
# Increase capacity
alt1_request = baseline_request.copy()
alt1_request.daily_capacities = [
    cap.copy(total_capacity_hours=cap.total_capacity_hours * 1.2)
    for cap in baseline_request.daily_capacities
]

# Change overflow strategy
alt2_request = baseline_request.copy()
alt2_request.profile.overflow_strategy = OverflowStrategy.OUTSOURCE

# Run both
alt1 = engine.simulate_propagation(alt1_request)
alt2 = engine.simulate_propagation(alt2_request)
```

### 4. **Compare Results**
```python
from backlogPropagationService import compareSimulations

comparison = compareSimulations(baseline, alt1)
print(f"Backlog change diff: {comparison['backlog_change_diff']}")
print(f"SLA compliance diff: {comparison['sla_compliance_diff']}%")
print(f"Recommendation: {comparison['recommendation']}")
```

---

## Integration with Productivity Variance

### Combined Simulation
```python
# 1. Run productivity variance
variance_result = variance_engine.simulate_variance(variance_request)

# 2. Extract productivity modifiers
modifiers = {
    day.date: day.actual_productivity / day.baseline_productivity
    for day in variance_result.daily_results
}

# 3. Apply to backlog capacities
capacities = [
    DailyCapacity(
        date=day,
        total_capacity_hours=40.0,
        backlog_capacity_hours=24.0,
        productivity_modifier=modifiers.get(day, 1.0)  # Apply variance
    )
    for day in date_range
]

# 4. Run backlog propagation
backlog_request.daily_capacities = capacities
result = backlog_engine.simulate_propagation(backlog_request)
```

---

## Troubleshooting

### Problem: High SLA Breach Rate
```
Symptoms: Compliance < 80%, many breached items
```

**Quick Fixes**:
1. Extend SLA threshold: `sla_breach_threshold_days = 3`
2. Increase capacity: `backlog_capacity_hours *= 1.2`
3. Enable priority aging: `aging_enabled = True, aging_threshold_days = 2`
4. Switch to recovery mode profile

---

### Problem: Backlog Keeps Growing
```
Symptoms: Net change > 0, increasing avg backlog
```

**Quick Fixes**:
1. Increase staff: `staff_count += 3`
2. Boost productivity: `productivity_modifier = 1.2`
3. Implement overflow strategy: `overflow_strategy = OverflowStrategy.REJECT`
4. Reduce demand intake
5. Schedule recovery period

---

### Problem: Capacity Underutilized
```
Symptoms: Utilization < 60%, low processing
```

**Quick Fixes**:
1. Reallocate to new work: `Increase new_work_capacity_hours`
2. Remove item limits: `max_items_per_day = None`
3. Review backlog availability
4. Adjust complexity limits: `max_complex_items_per_day += 5`

---

### Problem: Priority Inflation
```
Symptoms: Most items at HIGH/CRITICAL
```

**Quick Fixes**:
1. Slow down aging: `aging_threshold_days = 5`
2. Change overflow: `overflow_strategy = OverflowStrategy.DEFER`
3. Disable aging temporarily: `aging_enabled = False`
4. Increase clearance capacity

---

## API Endpoints Cheat Sheet

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sim/backlog/propagate` | POST | Run full simulation |
| `/sim/backlog/quick-scenarios` | POST | Run 4 preset scenarios |
| `/sim/backlog/overflow-strategies` | GET | List overflow strategies |
| `/sim/backlog/profile-templates` | GET | Get profile templates |

---

## TypeScript Helper Functions

```typescript
import {
  generateDailyCapacities,
  generateDailyDemands,
  generateInitialBacklog,
  calculateRecoveryAnalysis,
  calculateOptimalCapacity,
  generateRecommendations
} from './services/backlogPropagationService';

// Generate inputs
const capacities = generateDailyCapacities(startDate, endDate, 40, 10, 0.6);
const demands = generateDailyDemands(startDate, endDate, 50);
const initialBacklog = generateInitialBacklog(50, startDate, 5);

// Analyze results
const recovery = calculateRecoveryAnalysis(backlogItems, 40, 1.2);
const optimal = calculateOptimalCapacity(50, 45, 2, 8);
const recommendations = generateRecommendations(result);
```

---

## Sample Data Quick Load

```sql
-- Load full sample dataset
\i BACKLOG_PROPAGATION_SAMPLE_DATA.sql

-- Query sample items
SELECT * FROM backlog_items LIMIT 10;

-- Query profiles
SELECT profile_name, max_backlog_capacity, overflow_strategy 
FROM backlog_propagation_profiles;

-- Query recent snapshots
SELECT snapshot_date, total_items, sla_compliance_rate
FROM backlog_snapshots
ORDER BY snapshot_date DESC
LIMIT 7;
```

---

## Performance Guidelines

| Simulation Size | Expected Time |
|-----------------|---------------|
| 30 days, 100 items | < 100ms |
| 60 days, 500 items | 200-500ms |
| 90 days, 2000 items | 1-3 seconds |

**Optimization Tips**:
- Use quick scenarios for initial analysis
- Limit days for iterative testing
- Cache profile configurations
- Run scenarios in parallel

---

## Common Pitfalls

❌ **Don't**: Set `max_backlog_capacity` too low without proper overflow handling  
✅ **Do**: Choose appropriate overflow strategy for your capacity limits

❌ **Don't**: Enable aggressive aging without increasing capacity  
✅ **Do**: Balance aging thresholds with clearance capacity

❌ **Don't**: Ignore productivity variance in capacity planning  
✅ **Do**: Use realistic productivity modifiers based on variance analysis

❌ **Don't**: Set unrealistic SLA thresholds  
✅ **Do**: Base thresholds on historical performance data

❌ **Don't**: Allocate 100% capacity to backlog  
✅ **Do**: Reserve 60-70% for backlog, rest for new work

---

## Next Steps

1. **Run Quick Scenarios**: Get baseline with preset configurations
2. **Analyze Results**: Identify issues and opportunities
3. **Test Alternatives**: Try different profiles and strategies
4. **Integrate Variance**: Combine with productivity variance for realistic modeling
5. **Monitor Metrics**: Track SLA compliance, backlog size, utilization
6. **Adjust & Iterate**: Refine configuration based on results

---

## Related Documentation

- [Full Engine Documentation](./BACKLOG_PROPAGATION_ENGINE.md)
- [Database Schema](./BACKLOG_PROPAGATION_SCHEMA.sql)
- [Sample Data](./BACKLOG_PROPAGATION_SAMPLE_DATA.sql)
- [Productivity Variance Integration](./PRODUCTIVITY_VARIANCE_ENGINE.md)
- [TypeScript Types](./src/services/backlogPropagation.types.ts)
- [Service Layer](./src/services/backlogPropagationService.ts)
