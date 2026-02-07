"""
FastAPI Simulation Service
Workforce scheduling and demand simulation service
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, date, timedelta
import random
from enum import Enum

app = FastAPI(
    title="Workforce Simulation Service",
    description="API for simulating workforce scheduling scenarios and demand forecasting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Models
# ============================================================================

class ShiftType(str, Enum):
    ALL_DAY = "all_day"
    MORNING = "morning"
    EVENING = "evening"
    NIGHT = "night"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SimulationScenario(str, Enum):
    BASELINE = "baseline"
    HIGH_DEMAND = "high_demand"
    LOW_DEMAND = "low_demand"
    SEASONAL_PEAK = "seasonal_peak"
    RANDOM_VARIATION = "random_variation"

class DemandSimulationRequest(BaseModel):
    organization_id: str
    start_date: date
    end_date: date
    scenario: SimulationScenario = SimulationScenario.BASELINE
    department_id: Optional[str] = None
    base_employees: int = Field(default=10, ge=1, le=1000)
    variance_percentage: float = Field(default=0.2, ge=0, le=1)

class SimulatedDemand(BaseModel):
    date: str
    shift_type: ShiftType
    required_employees: int
    priority: Priority
    department_id: Optional[str] = None
    notes: Optional[str] = None

class DemandSimulationResponse(BaseModel):
    organization_id: str
    scenario: str
    total_demands: int
    total_employees_needed: int
    average_per_day: float
    demands: List[SimulatedDemand]

class ScheduleOptimizationRequest(BaseModel):
    demands: List[SimulatedDemand]
    available_employees: int
    max_hours_per_employee: int = Field(default=40, ge=1, le=80)
    min_hours_per_employee: int = Field(default=20, ge=0, le=40)

class EmployeeAssignment(BaseModel):
    employee_id: str
    shift_date: str
    shift_type: ShiftType
    hours: float
    department_id: Optional[str] = None

class ScheduleOptimizationResponse(BaseModel):
    total_shifts: int
    employees_utilized: int
    coverage_percentage: float
    total_hours: float
    assignments: List[EmployeeAssignment]
    unmet_demands: List[SimulatedDemand]

# ============================================================================
# Simulation Logic
# ============================================================================

def generate_demands(request: DemandSimulationRequest) -> List[SimulatedDemand]:
    """Generate simulated demand data based on scenario"""
    demands = []
    current_date = request.start_date
    
    while current_date <= request.end_date:
        # Determine number of shifts for the day
        shifts = [ShiftType.MORNING, ShiftType.EVENING]
        
        # Scenario-based adjustments
        if request.scenario == SimulationScenario.HIGH_DEMAND:
            base = int(request.base_employees * 1.5)
            shifts.append(ShiftType.NIGHT)
        elif request.scenario == SimulationScenario.LOW_DEMAND:
            base = int(request.base_employees * 0.6)
        elif request.scenario == SimulationScenario.SEASONAL_PEAK:
            # Simulate seasonal variation (higher on weekends)
            if current_date.weekday() >= 5:  # Weekend
                base = int(request.base_employees * 1.8)
                shifts.append(ShiftType.NIGHT)
            else:
                base = request.base_employees
        else:
            base = request.base_employees
        
        # Generate demand for each shift
        for shift in shifts:
            # Add variance
            variance = random.uniform(-request.variance_percentage, request.variance_percentage)
            required = max(1, int(base * (1 + variance)))
            
            # Determine priority based on required employees
            if required >= base * 1.3:
                priority = Priority.HIGH
            elif required >= base * 1.1:
                priority = Priority.MEDIUM
            else:
                priority = Priority.LOW
            
            demand = SimulatedDemand(
                date=current_date.isoformat(),
                shift_type=shift,
                required_employees=required,
                priority=priority,
                department_id=request.department_id,
                notes=f"Simulated {request.scenario.value} scenario"
            )
            demands.append(demand)
        
        current_date += timedelta(days=1)
    
    return demands

def optimize_schedule(request: ScheduleOptimizationRequest) -> ScheduleOptimizationResponse:
    """Simulate schedule optimization"""
    assignments = []
    unmet_demands = []
    
    # Simple greedy allocation
    total_required = sum(d.required_employees for d in request.demands)
    employees_needed = min(request.available_employees, total_required)
    
    # Simulate assignments
    employee_hours = {}
    covered_demands = 0
    total_shifts = 0
    
    for idx, demand in enumerate(request.demands):
        # Simulate 8-hour shifts
        shift_hours = 8.0
        employees_assigned = 0
        
        for emp_id in range(employees_needed):
            emp_key = f"EMP-{emp_id:04d}"
            current_hours = employee_hours.get(emp_key, 0)
            
            if current_hours + shift_hours <= request.max_hours_per_employee:
                assignments.append(EmployeeAssignment(
                    employee_id=emp_key,
                    shift_date=demand.date,
                    shift_type=demand.shift_type,
                    hours=shift_hours,
                    department_id=demand.department_id
                ))
                employee_hours[emp_key] = current_hours + shift_hours
                employees_assigned += 1
                total_shifts += 1
                
                if employees_assigned >= demand.required_employees:
                    covered_demands += 1
                    break
        
        if employees_assigned < demand.required_employees:
            unmet_demands.append(demand)
    
    coverage = (covered_demands / len(request.demands)) * 100 if request.demands else 0
    total_hours = sum(employee_hours.values())
    
    return ScheduleOptimizationResponse(
        total_shifts=total_shifts,
        employees_utilized=len(employee_hours),
        coverage_percentage=round(coverage, 2),
        total_hours=round(total_hours, 2),
        assignments=assignments,
        unmet_demands=unmet_demands
    )

# ============================================================================
# Routes
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Workforce Simulation Service",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime": "operational"
    }

@app.post("/sim/demand/generate", response_model=DemandSimulationResponse)
async def simulate_demand(request: DemandSimulationRequest):
    """
    Generate simulated demand data for workforce planning
    
    Scenarios:
    - baseline: Normal demand patterns
    - high_demand: 50% increase in requirements
    - low_demand: 40% decrease in requirements
    - seasonal_peak: Weekend surge patterns
    - random_variation: Random daily fluctuations
    """
    try:
        demands = generate_demands(request)
        total_employees = sum(d.required_employees for d in demands)
        days = (request.end_date - request.start_date).days + 1
        
        return DemandSimulationResponse(
            organization_id=request.organization_id,
            scenario=request.scenario.value,
            total_demands=len(demands),
            total_employees_needed=total_employees,
            average_per_day=round(total_employees / days, 2) if days > 0 else 0,
            demands=demands
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/sim/schedule/optimize", response_model=ScheduleOptimizationResponse)
async def optimize_schedule_endpoint(request: ScheduleOptimizationRequest):
    """
    Optimize employee scheduling based on demand
    
    Uses greedy allocation algorithm to assign employees to shifts
    while respecting hour constraints
    """
    try:
        result = optimize_schedule(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/sim/scenarios")
async def list_scenarios():
    """List available simulation scenarios"""
    return {
        "scenarios": [
            {
                "name": "baseline",
                "description": "Normal demand patterns with specified variance"
            },
            {
                "name": "high_demand",
                "description": "50% increase in demand, includes night shifts"
            },
            {
                "name": "low_demand",
                "description": "40% decrease in demand"
            },
            {
                "name": "seasonal_peak",
                "description": "80% increase on weekends, normal on weekdays"
            },
            {
                "name": "random_variation",
                "description": "Random daily fluctuations within variance range"
            }
        ]
    }

@app.get("/sim/stats")
async def simulation_stats():
    """Get simulation service statistics"""
    return {
        "supported_scenarios": len(SimulationScenario),
        "shift_types": [s.value for s in ShiftType],
        "priority_levels": [p.value for p in Priority],
        "max_simulation_days": 365,
        "features": [
            "Demand generation",
            "Schedule optimization",
            "Scenario modeling",
            "Capacity planning"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
