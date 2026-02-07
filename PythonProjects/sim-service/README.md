# Simulation Service API

Production-ready FastAPI service providing advanced workforce simulation capabilities including productivity variance modeling and backlog propagation analysis.

## 🚀 Features

### Productivity Variance Engine
- 7 preset scenarios (consistent, volatile, declining, improving, cyclical, shock, custom)
- Statistical distributions (normal, uniform, beta, exponential)
- Temporal patterns (time-of-day, day-of-week, seasonal)
- Learning curve modeling
- Monte Carlo simulation (up to 1000 runs)
- Autocorrelation support

### Backlog Propagation Engine
- 4 overflow strategies (reject, defer, escalate, outsource)
- Priority aging system (normal, aggressive, accelerated)
- SLA tracking and compliance monitoring
- 5 profile templates (standard, high_volume, recovery_mode, strict_sla, flexible_capacity)
- Natural decay modeling
- Recovery mode with capacity boost

## 📋 Requirements

- Python 3.12+
- FastAPI 0.115.0
- Pydantic 2.9.2
- NumPy 1.26.2
- SciPy 1.11.4
- Uvicorn 0.32.0

## 🛠️ Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import main; print('✓ Service ready')"
```

## 🌐 Running the Service

```bash
# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000

# With auto-reload for development
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or run directly
python main.py
```

Service will be available at: http://localhost:8000

## 📚 API Endpoints

### Health & Info (4 endpoints)
- `GET /` - Service information and version
- `GET /health` - Health check with uptime
- `GET /sim/stats` - Service statistics (12 endpoints, 7 scenarios, 4 strategies)
- `GET /sim/scenarios` - Available simulation scenarios

### Productivity Variance (4 endpoints)
- `POST /sim/productivity/variance` - Full variance simulation with custom parameters
- `POST /sim/productivity/quick-analysis` - Quick analysis with preset scenarios
- `GET /sim/productivity/presets` - List 7 preset variance profiles
- `GET /sim/productivity/factors` - Common productivity variance factors

### Backlog Propagation (4 endpoints)
- `POST /sim/backlog/propagate` - Full propagation simulation with custom config
- `POST /sim/backlog/quick-scenarios` - Compare 4 preset scenarios
- `GET /sim/backlog/overflow-strategies` - List 4 overflow strategies
- `GET /sim/backlog/profile-templates` - Get 5 profile templates

## API Documentation

## 📖 API Documentation

Interactive documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🧪 Testing

### Run Comprehensive Test Suite

```bash
# Test all 12 endpoints
python test_api_endpoints.py

# View first 100 lines of output
python test_api_endpoints.py 2>&1 | head -100

# View final results
python test_api_endpoints.py 2>&1 | tail -30
```

### Test Individual Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Service statistics
curl http://localhost:8000/sim/stats

# Get presets
curl http://localhost:8000/sim/productivity/presets

# Get overflow strategies
curl http://localhost:8000/sim/backlog/overflow-strategies
```

## 📊 Quick Start Examples

### Productivity Variance - Quick Analysis

```bash
curl -X POST "http://localhost:8000/sim/productivity/quick-analysis?scenario=consistent&days=30&baseline_units_per_hour=8.5&baseline_staff=10&start_date=2024-01-01&end_date=2024-01-30&organization_id=org-123"
```

Expected result:
```json
{
  "scenario": "consistent",
  "summary": {
    "total_days": 30,
    "mean_productivity": 1.0,
    "productivity_variance": 0.05,
    "baseline_capacity": 680.0,
    "net_staffing_impact": 0
  },
  "execution_time_ms": 5.4
}
```

### Backlog Propagation - Quick Scenarios

```bash
curl -X POST "http://localhost:8000/sim/backlog/quick-scenarios?organization_id=org-123&start_date=2024-01-01&days=30&daily_demand_count=50&daily_capacity_hours=40&initial_backlog_count=50"
```

Expected result:
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

### Full Variance Simulation

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
      "distribution_type": "normal",
      "time_of_day_pattern": {"morning": 1.1, "afternoon": 0.95, "evening": 0.9}
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

### Full Backlog Propagation

```bash
curl -X POST "http://localhost:8000/sim/backlog/propagate" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "start_date": "2024-01-01",
    "simulation_days": 30,
    "demand_items": [
      {"date": "2024-01-01", "priority": "high", "complexity": 2.0, "count": 50},
      {"date": "2024-01-02", "priority": "medium", "complexity": 1.5, "count": 45}
    ],
    "capacity_profile": {
      "daily_capacity_hours": 40,
      "avg_item_hours": 0.5,
      "efficiency_factor": 0.95
    },
    "initial_backlog": {"high": 10, "medium": 20, "low": 15}
  }'
```

## 📈 Performance Benchmarks

### Productivity Variance
- **Small** (30 days, baseline): < 50ms
- **Medium** (60 days, 5 factors): 100-200ms
- **Large** (90 days, 10 factors, 100 MC runs): 200-400ms

### Backlog Propagation
- **Small** (30 days, 100 items): < 100ms
- **Medium** (60 days, 500 items): 200-500ms
- **Large** (90 days, 2000 items): 1-3 seconds

### Combined Analysis
- **Quick scenarios** (both engines): 300-600ms
- **Full analysis** (30 days): 150-300ms
- **Extended simulation** (90 days): 2-5 seconds

## 🔧 Configuration

### Environment Variables

```bash
export CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
export LOG_LEVEL="info"
export PORT=8000
```

### CORS Configuration

Update in [main.py](main.py) for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🐳 Docker Deployment

### Create Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build and Run

```bash
docker build -t sim-service .
docker run -p 8000:8000 sim-service
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Configure CORS to specific origins
- [ ] Add API key authentication
- [ ] Implement rate limiting
- [ ] Enable HTTPS via reverse proxy
- [ ] Add request logging
- [ ] Set up monitoring/alerting
- [ ] Configure proper error handling

### Example API Key Middleware

```python
from fastapi import Security, HTTPException, Depends
from fastapi.security import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    if api_key != os.getenv("API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

@app.post("/sim/productivity/variance", dependencies=[Depends(verify_api_key)])
async def simulate_productivity_variance(request: VarianceSimulationRequest):
    ...
```

## 🔄 Integration Examples

### Python Client

```python
import requests

BASE_URL = "http://localhost:8000"

# Quick analysis
response = requests.post(
    f"{BASE_URL}/sim/productivity/quick-analysis",
    params={
        "scenario": "consistent",
        "days": 30,
        "baseline_units_per_hour": 8.5,
        "baseline_staff": 10,
        "organization_id": "org-123"
    }
)

result = response.json()
print(f"Mean productivity: {result['summary']['mean_productivity']}")
print(f"Staffing impact: {result['summary']['net_staffing_impact']}")
```

### JavaScript/TypeScript Client

```typescript
const BASE_URL = "http://localhost:8000";

async function runQuickAnalysis() {
  const params = new URLSearchParams({
    scenario: 'volatile',
    days: '30',
    baseline_units_per_hour: '8.5',
    baseline_staff: '10',
    organization_id: 'org-123'
  });
  
  const response = await fetch(
    `${BASE_URL}/sim/productivity/quick-analysis?${params}`
  );
  
  const result = await response.json();
  console.log('Productivity variance:', result.summary.productivity_variance);
  console.log('Execution time:', result.execution_time_ms, 'ms');
}
```

### cURL Examples

```bash
# Get all presets
curl http://localhost:8000/sim/productivity/presets | jq

# Get backlog templates
curl http://localhost:8000/sim/backlog/profile-templates | jq

# Quick productivity analysis
curl -X POST "http://localhost:8000/sim/productivity/quick-analysis?scenario=volatile&days=30&baseline_units_per_hour=8.5&baseline_staff=10&organization_id=org-123" | jq

# Quick backlog scenarios
curl -X POST "http://localhost:8000/sim/backlog/quick-scenarios?organization_id=org-123&start_date=2024-01-01&days=30&daily_demand_count=50&daily_capacity_hours=40" | jq
```

## 🐛 Troubleshooting

### Service won't start

```bash
# Check if port is in use
lsof -i :8000

# Kill existing process
kill -9 $(lsof -t -i:8000)

# Try different port
uvicorn main:app --port 8001
```

### Import errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Verify Python version
python --version  # Should be 3.12+

# Test imports
python -c "import main; print('✓ Success')"
```

### Slow performance

- Reduce `monte_carlo_runs` (default: 100, min: 10)
- Use quick analysis endpoints for faster results
- Limit simulation days for testing
- Check system resources (CPU, memory)

## 📝 Simulation Scenarios

### Productivity Variance Scenarios

1. **Consistent**: Low variance (σ=0.05), predictable output
2. **Volatile**: High variance (σ=0.25), unpredictable swings
3. **Declining**: 30% decline over simulation period
4. **Improving**: 30% improvement with learning curve
5. **Cyclical**: Weekly patterns (±15%)
6. **Shock**: Random disruption events (±30%)
7. **Custom**: User-defined parameters

### Backlog Overflow Strategies

1. **Reject**: Decline new work when at capacity
2. **Defer**: Push overflow to next day
3. **Escalate**: Route high-priority items to expedited processing
4. **Outsource**: Send overflow to external vendors

### Priority Aging Models

- **Normal**: Standard aging (0.1 points/day)
- **Aggressive**: Rapid aging (0.2 points/day)
- **Accelerated**: Very rapid aging (0.3 points/day)

## 📚 Related Documentation
