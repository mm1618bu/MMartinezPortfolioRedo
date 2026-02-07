# Workforce Simulation Service

FastAPI-based simulation service for workforce scheduling and demand forecasting.

## Features

- **Demand Generation**: Simulate workforce demand patterns with various scenarios
- **Schedule Optimization**: Optimize employee assignments based on constraints
- **Scenario Modeling**: Test different demand patterns (baseline, high, low, seasonal)
- **RESTful API**: Easy integration with frontend applications

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Running the Service

```bash
# Development server
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- `GET /` - Service status
- `GET /health` - Detailed health check

### Simulation
- `POST /sim/demand/generate` - Generate simulated demand data
- `POST /sim/schedule/optimize` - Optimize employee schedules
- `GET /sim/scenarios` - List available scenarios
- `GET /sim/stats` - Service statistics

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Example Request

### Generate Demand

```bash
curl -X POST "http://localhost:8000/sim/demand/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "a0000000-0000-4000-8000-000000000001",
    "start_date": "2026-02-01",
    "end_date": "2026-02-07",
    "scenario": "high_demand",
    "base_employees": 15,
    "variance_percentage": 0.2
  }'
```

### Optimize Schedule

```bash
curl -X POST "http://localhost:8000/sim/schedule/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "demands": [...],
    "available_employees": 20,
    "max_hours_per_employee": 40,
    "min_hours_per_employee": 20
  }'
```

## Simulation Scenarios

1. **Baseline**: Normal demand patterns with specified variance
2. **High Demand**: 50% increase, includes night shifts
3. **Low Demand**: 40% decrease
4. **Seasonal Peak**: 80% increase on weekends
5. **Random Variation**: Random daily fluctuations

## Integration with Staffing Flow

This service integrates with the Staffing Flow application to provide:
- Demand forecasting simulations
- What-if scenario analysis
- Schedule optimization testing
- Capacity planning insights
