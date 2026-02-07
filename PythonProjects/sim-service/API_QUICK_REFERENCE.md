# Simulation Service API - Quick Reference

## Service URL
```
http://localhost:8000
```

## 📊 Endpoint Summary

| Category | Endpoints | Methods |
|----------|-----------|---------|
| Health & Info | 4 | GET |
| Productivity Variance | 4 | GET (2), POST (2) |
| Backlog Propagation | 4 | GET (2), POST (2) |
| **Total** | **12** | **GET (8), POST (4)** |

---

## 🔍 Health & Info Endpoints

### GET `/`
Service information and version
```bash
curl http://localhost:8000/
```

### GET `/health`
Health check with uptime
```bash
curl http://localhost:8000/health
```

### GET `/sim/stats`
Service statistics
```bash
curl http://localhost:8000/sim/stats
```

### GET `/sim/scenarios`
Available simulation scenarios
```bash
curl http://localhost:8000/sim/scenarios
```

---

## 📈 Productivity Variance Endpoints

### GET `/sim/productivity/presets`
List 7 preset variance profiles (consistent, volatile, declining, improving, cyclical, shock, custom)
```bash
curl http://localhost:8000/sim/productivity/presets
```

### GET `/sim/productivity/factors`
Common productivity variance factors
```bash
curl http://localhost:8000/sim/productivity/factors
```

### POST `/sim/productivity/quick-analysis`
Quick analysis with preset scenarios
```bash
curl -X POST "http://localhost:8000/sim/productivity/quick-analysis?\
scenario=consistent&\
days=30&\
baseline_units_per_hour=8.5&\
baseline_staff=10&\
start_date=2024-01-01&\
end_date=2024-01-30&\
organization_id=org-123"
```

**Query Parameters:**
- `scenario`: consistent | volatile | declining | improving | cyclical | shock
- `days`: Integer (1-365)
- `baseline_units_per_hour`: Float
- `baseline_staff`: Integer
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `organization_id`: String

### POST `/sim/productivity/variance`
Full variance simulation with custom parameters
```bash
curl -X POST "http://localhost:8000/sim/productivity/variance" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "start_date": "2024-01-01",
    "end_date": "2024-01-30",
    "profile": {
      "mean_productivity_modifier": 1.0,
      "std_deviation": 0.15,
      "distribution_type": "normal"
    },
    "labor_standards": {
      "baseline_units_per_hour": 8.5,
      "baseline_staff_count": 10,
      "shift_hours": 8,
      "target_service_level": 0.95
    },
    "monte_carlo_runs": 100
  }'
```

**Request Body Fields:**
- `organization_id`: String (required)
- `start_date`: String (required, YYYY-MM-DD)
- `end_date`: String (required, YYYY-MM-DD)
- `profile`: Object (required)
  - `mean_productivity_modifier`: Float (0.1-2.0)
  - `std_deviation`: Float (0.01-0.5)
  - `distribution_type`: normal | uniform | beta | exponential
  - `time_of_day_pattern`: Object (optional)
  - `day_of_week_pattern`: Object (optional)
- `labor_standards`: Object (required)
  - `baseline_units_per_hour`: Float (> 0)
  - `baseline_staff_count`: Integer (> 0)
  - `shift_hours`: Float (1-24)
  - `target_service_level`: Float (0.5-1.0)
- `monte_carlo_runs`: Integer (10-1000, default: 100)

---

## 📦 Backlog Propagation Endpoints

### GET `/sim/backlog/overflow-strategies`
List 4 overflow strategies (reject, defer, escalate, outsource)
```bash
curl http://localhost:8000/sim/backlog/overflow-strategies
```

### GET `/sim/backlog/profile-templates`
Get 5 profile templates (standard, high_volume, recovery_mode, strict_sla, flexible_capacity)
```bash
curl http://localhost:8000/sim/backlog/profile-templates
```

### POST `/sim/backlog/quick-scenarios`
Compare 4 preset scenarios
```bash
curl -X POST "http://localhost:8000/sim/backlog/quick-scenarios?\
organization_id=org-123&\
start_date=2024-01-01&\
days=30&\
daily_demand_count=50&\
daily_capacity_hours=40&\
initial_backlog_count=50"
```

**Query Parameters:**
- `organization_id`: String (required)
- `start_date`: YYYY-MM-DD (required)
- `days`: Integer (1-365, required)
- `daily_demand_count`: Integer (> 0, required)
- `daily_capacity_hours`: Float (> 0, required)
- `initial_backlog_count`: Integer (>= 0, default: 0)

**Returns 4 scenarios:**
- `balanced`: Standard processing
- `overflow`: Overwhelmed capacity
- `recovery_mode`: Enhanced capacity
- `high_priority_aging`: Aggressive priority escalation

### POST `/sim/backlog/propagate`
Full propagation simulation with custom config
```bash
curl -X POST "http://localhost:8000/sim/backlog/propagate" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "start_date": "2024-01-01",
    "simulation_days": 30,
    "demand_items": [
      {
        "date": "2024-01-01",
        "priority": "high",
        "complexity": 2.0,
        "count": 50
      }
    ],
    "capacity_profile": {
      "daily_capacity_hours": 40,
      "avg_item_hours": 0.5,
      "efficiency_factor": 0.95
    },
    "initial_backlog": {
      "high": 10,
      "medium": 20,
      "low": 15
    },
    "overflow_strategy": "defer",
    "priority_aging": {
      "enabled": true,
      "aging_model": "normal"
    }
  }'
```

**Request Body Fields:**
- `organization_id`: String (required)
- `start_date`: String (required, YYYY-MM-DD)
- `simulation_days`: Integer (1-365, required)
- `demand_items`: Array (required)
  - `date`: String (YYYY-MM-DD)
  - `priority`: low | medium | high
  - `complexity`: Float (0.1-10.0)
  - `count`: Integer (> 0)
- `capacity_profile`: Object (required)
  - `daily_capacity_hours`: Float (> 0)
  - `avg_item_hours`: Float (> 0)
  - `efficiency_factor`: Float (0.1-1.0)
- `initial_backlog`: Object (optional)
  - `high`: Integer (>= 0)
  - `medium`: Integer (>= 0)
  - `low`: Integer (>= 0)
- `overflow_strategy`: reject | defer | escalate | outsource (default: defer)
- `priority_aging`: Object (optional)
  - `enabled`: Boolean
  - `aging_model`: normal | aggressive | accelerated

---

## 📊 Response Examples

### Productivity Variance Response
```json
{
  "organization_id": "org-123",
  "total_days": 30,
  "scenario_used": "consistent",
  "productivity_stats": {
    "mean": 1.02,
    "std_dev": 0.05,
    "min": 0.93,
    "max": 1.11
  },
  "staffing_impact": {
    "baseline_capacity_units": 2040,
    "actual_output_mean": 2081,
    "additional_staff_needed": 0,
    "days_understaffed": 0,
    "risk_level": "low"
  },
  "execution_time_ms": 5.4
}
```

### Backlog Propagation Response
```json
{
  "organization_id": "org-123",
  "simulation_summary": {
    "total_days": 30,
    "initial_backlog_count": 45,
    "final_backlog_count": 0,
    "items_processed": 1550,
    "net_backlog_change": -45
  },
  "sla_metrics": {
    "total_breaches": 0,
    "breach_rate": 0.0,
    "avg_compliance_pct": 100.0,
    "financial_impact_estimate": 0
  },
  "execution_time_ms": 21.8
}
```

### Quick Scenarios Response
```json
{
  "scenarios": {
    "balanced": {
      "final_backlog": 0,
      "sla_compliance": 100.0,
      "items_processed": 1550
    },
    "overflow": {
      "final_backlog": 200,
      "sla_compliance": 17.3,
      "items_processed": 1350
    },
    "recovery_mode": {
      "final_backlog": 0,
      "sla_compliance": 100.0,
      "items_processed": 1600
    },
    "high_priority_aging": {
      "final_backlog": 317,
      "sla_compliance": 20.5,
      "items_processed": 1233
    }
  },
  "execution_time_ms": 21.8
}
```

---

## ⚡ Performance Benchmarks

| Simulation Type | Size | Time |
|----------------|------|------|
| Productivity Variance (small) | 30 days, baseline | < 50ms |
| Productivity Variance (medium) | 60 days, 5 factors | 100-200ms |
| Productivity Variance (large) | 90 days, 10 factors, 100 MC | 200-400ms |
| Backlog Propagation (small) | 30 days, 100 items | < 100ms |
| Backlog Propagation (medium) | 60 days, 500 items | 200-500ms |
| Backlog Propagation (large) | 90 days, 2000 items | 1-3s |
| Quick Scenarios (both engines) | 30 days | 300-600ms |

---

## 🔤 Common Parameter Values

### Distribution Types
- `normal`: Bell curve distribution
- `uniform`: Equal probability across range
- `beta`: Skewed distribution
- `exponential`: Rapid decay pattern

### Priority Levels
- `high`: Urgent items (SLA: 1 day)
- `medium`: Standard items (SLA: 3 days)
- `low`: Non-urgent items (SLA: 7 days)

### Overflow Strategies
- `reject`: Decline new work when at capacity
- `defer`: Push overflow to next day
- `escalate`: Route high-priority to expedited processing
- `outsource`: Send overflow to external vendors

### Aging Models
- `normal`: 0.1 points increase per day
- `aggressive`: 0.2 points increase per day
- `accelerated`: 0.3 points increase per day

### Risk Levels
- `low`: < 5% risk of underperformance
- `medium`: 5-15% risk of underperformance
- `high`: > 15% risk of underperformance

---

## 🧪 Testing

### Run All Tests
```bash
python test_api_endpoints.py
```

### Test Individual Endpoint
```bash
# Health check
curl http://localhost:8000/health

# Quick analysis
curl -X POST "http://localhost:8000/sim/productivity/quick-analysis?scenario=consistent&days=30&baseline_units_per_hour=8.5&baseline_staff=10&organization_id=test"

# Quick scenarios
curl -X POST "http://localhost:8000/sim/backlog/quick-scenarios?organization_id=test&start_date=2024-01-01&days=30&daily_demand_count=50&daily_capacity_hours=40"
```

---

## 🐛 Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 200 | Success | Request processed successfully |
| 422 | Validation Error | Missing or invalid parameters |
| 500 | Internal Server Error | Simulation failed, check logs |

### Example Error Response
```json
{
  "detail": [
    {
      "loc": ["body", "organization_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 📖 Documentation Links

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **Full README**: [README.md](README.md)

---

## 🚀 Quick Start Checklist

- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Start service: `uvicorn main:app --host 0.0.0.0 --port 8000`
- [ ] Test health: `curl http://localhost:8000/health`
- [ ] View docs: http://localhost:8000/docs
- [ ] Run tests: `python test_api_endpoints.py`
- [ ] Try quick analysis: Use cURL examples above

---

**Tip**: Use the interactive Swagger UI at `/docs` for easy testing and to explore all parameters with built-in validation!
