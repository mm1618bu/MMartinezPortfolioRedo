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

# Import productivity variance engine
from productivity_variance import (
    ProductivityVarianceEngine,
    VarianceSimulationRequest,
    VarianceSimulationResponse,
    ProductivityVarianceProfile,
    ProductivityVarianceFactor,
    VarianceScenario,
    FactorCategory,
    create_preset_profile,
    create_common_factors,
)

# Import backlog propagation engine
from backlog_propagation import (
    BacklogPropagationEngine,
    BacklogPropagationRequest,
    BacklogPropagationResponse,
    BacklogPropagationProfile,
    BacklogItem,
    DailyCapacity,
    DailyDemand,
    Priority as BacklogPriority,
    ItemStatus,
    Complexity,
    OverflowStrategy,
    BacklogLevel,
)

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

# ============================================================================
# Productivity Variance Endpoints
# ============================================================================

@app.post("/sim/productivity/variance", response_model=VarianceSimulationResponse)
async def simulate_productivity_variance(request: VarianceSimulationRequest):
    """
    Simulate productivity variance over time
    
    Generates realistic productivity fluctuations based on:
    - Statistical distributions (normal, uniform, beta, etc.)
    - Temporal patterns (time of day, day of week, seasonal)
    - Learning curves and trends
    - Specific variance factors
    - Shock events
    
    Returns detailed productivity metrics and staffing impact analysis
    """
    try:
        engine = ProductivityVarianceEngine(seed=request.seed)
        result = engine.simulate_variance(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Productivity variance simulation failed: {str(e)}"
        )

@app.get("/sim/productivity/presets")
async def get_variance_presets():
    """Get preset productivity variance profiles"""
    return {
        "presets": [
            {
                "scenario": "consistent",
                "name": "Consistent Performance",
                "description": "Low variance, predictable productivity (±5%)",
                "profile": create_preset_profile(VarianceScenario.CONSISTENT).dict()
            },
            {
                "scenario": "volatile",
                "name": "Volatile Performance",
                "description": "High variance, unpredictable swings (±25%)",
                "profile": create_preset_profile(VarianceScenario.VOLATILE).dict()
            },
            {
                "scenario": "declining",
                "name": "Declining Performance",
                "description": "Gradual 30% decline over time period",
                "profile": create_preset_profile(VarianceScenario.DECLINING).dict()
            },
            {
                "scenario": "improving",
                "name": "Improving Performance",
                "description": "Learning curve with gradual improvement",
                "profile": create_preset_profile(VarianceScenario.IMPROVING).dict()
            },
            {
                "scenario": "cyclical",
                "name": "Cyclical Performance",
                "description": "Weekly patterns (better mid-week, worse weekends)",
                "profile": create_preset_profile(VarianceScenario.CYCLICAL).dict()
            },
            {
                "scenario": "shock",
                "name": "Shock Events",
                "description": "Random disruption events (10% daily chance)",
                "profile": create_preset_profile(VarianceScenario.SHOCK).dict()
            },
        ]
    }

@app.get("/sim/productivity/factors")
async def get_common_factors():
    """Get common productivity variance factors"""
    factors = create_common_factors()
    return {
        "factors": [
            {
                "name": f.name,
                "category": f.category.value,
                "impact_magnitude": f.impact_magnitude,
                "impact_percentage": f"{f.impact_magnitude * 100:+.0f}%",
                "probability": f.probability,
                "duration_hours": f.duration_hours,
                "description": _get_factor_description(f)
            }
            for f in factors
        ],
        "categories": [c.value for c in FactorCategory]
    }

def _get_factor_description(factor: ProductivityVarianceFactor) -> str:
    """Generate description for a variance factor"""
    impact_dir = "decreases" if factor.impact_magnitude < 0 else "increases"
    impact_pct = abs(factor.impact_magnitude * 100)
    prob_pct = factor.probability * 100
    
    return (
        f"{factor.category.value.title()} factor that {impact_dir} productivity by "
        f"{impact_pct:.0f}%. Occurs {prob_pct:.0f}% of the time for approximately "
        f"{factor.duration_hours} hours."
    )

@app.post("/sim/productivity/quick-analysis")
async def quick_productivity_analysis(
    organization_id: str,
    start_date: date,
    end_date: date,
    scenario: VarianceScenario = VarianceScenario.CONSISTENT,
    baseline_staff: int = 10,
    baseline_units_per_hour: float = 15.0
):
    """
    Quick productivity variance analysis with preset profile
    
    Simplified endpoint for rapid what-if analysis using preset profiles
    """
    try:
        profile = create_preset_profile(scenario)
        
        request = VarianceSimulationRequest(
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            variance_scenario=scenario,
            profile=profile,
            baseline_units_per_hour=baseline_units_per_hour,
            baseline_staff_needed=baseline_staff,
            monte_carlo_runs=1
        )
        
        engine = ProductivityVarianceEngine()
        result = engine.simulate_variance(request)
        
        # Return simplified summary
        return {
            "scenario": scenario.value,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "total_days": result.total_days
            },
            "productivity_summary": {
                "baseline_units_per_hour": baseline_units_per_hour,
                "mean_actual_units_per_hour": baseline_units_per_hour * result.productivity_stats["mean"],
                "range": {
                    "min": baseline_units_per_hour * result.productivity_stats["min"],
                    "max": baseline_units_per_hour * result.productivity_stats["max"]
                }
            },
            "staffing_impact": {
                "baseline_staff": baseline_staff,
                "avg_additional_staff_needed": result.staffing_impact["avg_variance"],
                "peak_additional_staff_needed": result.staffing_impact["max_additional_staff"],
                "days_requiring_extra_staff": result.staffing_impact["days_understaffed"],
                "total_additional_staff_days": result.staffing_impact["total_additional_staff_days"]
            },
            "risk_assessment": {
                "probability_underperformance": f"{result.risk_metrics['probability_below_90pct'] * 100:.1f}%",
                "probability_critical": f"{result.risk_metrics['probability_below_80pct'] * 100:.1f}%",
                "volatility": result.risk_metrics["volatility"]
            },
            "full_results_available": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quick analysis failed: {str(e)}"
        )


# ============================================================================
# Backlog Propagation Endpoints
# ============================================================================

@app.post("/sim/backlog/propagate", response_model=BacklogPropagationResponse)
async def run_backlog_propagation(request: BacklogPropagationRequest):
    """
    Run backlog propagation simulation
    
    Simulates how unmet demand accumulates and propagates through time periods,
    modeling overflow, SLA breaches, priority aging, and capacity constraints.
    """
    try:
        engine = BacklogPropagationEngine(seed=request.seed)
        result = engine.simulate_propagation(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Backlog propagation simulation failed: {str(e)}"
        )


@app.post("/sim/backlog/quick-scenarios")
async def quick_backlog_scenarios(
    organization_id: str,
    start_date: date,
    days: int = 30,
    daily_demand_count: int = 50,
    daily_capacity_hours: float = 40.0,
    initial_backlog_count: int = 0
):
    """
    Run quick backlog scenarios with common configurations
   
    Scenarios:
    - Balanced: Normal flow, capacity meets demand
    - Overflow: Demand exceeds capacity  
    - Recovery: Clearing existing backlog with boost
    - High Priority: Critical items aging rapidly
    """
    try:
        end_date = start_date + timedelta(days=days - 1)
        
        # Generate daily capacities
        daily_capacities = []
        for day_offset in range(days):
            day = start_date + timedelta(days=day_offset)
            daily_capacities.append(DailyCapacity(
                date=day,
                total_capacity_hours=daily_capacity_hours,
                backlog_capacity_hours=daily_capacity_hours * 0.6,
                new_work_capacity_hours=daily_capacity_hours * 0.4,
                staff_count=10,
                productivity_modifier=1.0,
                max_items_per_day=100,
                max_complex_items_per_day=10
            ))
        
        # Generate daily demands
        daily_demands = []
        for day_offset in range(days):
            day = start_date + timedelta(days=day_offset)
            daily_demands.append(DailyDemand(
                date=day,
                new_items_by_priority={
                    BacklogPriority.LOW: int(daily_demand_count * 0.4),
                    BacklogPriority.MEDIUM: int(daily_demand_count * 0.3),
                    BacklogPriority.HIGH: int(daily_demand_count * 0.2),
                    BacklogPriority.CRITICAL: int(daily_demand_count * 0.1)
                },
                new_items_by_complexity={
                    Complexity.SIMPLE: int(daily_demand_count * 0.5),
                    Complexity.MODERATE: int(daily_demand_count * 0.35),
                    Complexity.COMPLEX: int(daily_demand_count * 0.15)
                },
                total_estimated_effort_hours=daily_demand_count * 0.5
            ))
        
        # Generate initial backlog if specified
        engine = BacklogPropagationEngine(seed=42)
        initial_items = []
        for i in range(initial_backlog_count):
            priority_weights = {
                BacklogPriority.LOW: 0.3,
                BacklogPriority.MEDIUM: 0.35,
                BacklogPriority.HIGH: 0.25,
                BacklogPriority.CRITICAL: 0.1
            }
            priority = random.choices(
                list(priority_weights.keys()),
                weights=list(priority_weights.values())
            )[0]
            
            # Items have been in backlog 1-5 days
            days_old = random.randint(1, 5)
            created = start_date - timedelta(days=days_old)
            
            item = BacklogItem(
                id=f"INITIAL-{i+1:04d}",
                item_type="work_item",
                priority=priority,
                original_priority=priority,
                complexity=random.choice([Complexity.SIMPLE, Complexity.MODERATE, Complexity.COMPLEX]),
                estimated_effort_minutes=random.randint(30, 90),
                created_date=created,
                due_date=start_date + timedelta(days=1),
                status=ItemStatus.PENDING,
                days_in_backlog=days_old,
                propagation_count=days_old
            )
            initial_items.append(item)
        
        scenarios = {}
        
        # Scenario 1: Balanced
        balanced_profile = BacklogPropagationProfile(
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
        
        balanced_request = BacklogPropagationRequest(
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            profile=balanced_profile,
            initial_backlog_items=initial_items.copy(),
            daily_capacities=daily_capacities.copy(),
            daily_demands=daily_demands.copy(),
            seed=42
        )
        
        engine_balanced = BacklogPropagationEngine(seed=42)
        scenarios["balanced"] = engine_balanced.simulate_propagation(balanced_request)
        
        # Scenario 2: Overflow
        overflow_profile = BacklogPropagationProfile(
            propagation_rate=1.0,
            decay_rate=0.02,
            max_backlog_capacity=200,
            aging_enabled=True,
            aging_threshold_days=2,
            overflow_strategy=OverflowStrategy.REJECT,
            sla_breach_threshold_days=1,
            sla_penalty_per_day=150.0,
            recovery_rate_multiplier=1.0
        )
        
        # Increase demand for overflow
        overflow_demands = []
        for day_offset in range(days):
            day = start_date + timedelta(days=day_offset)
            overflow_demands.append(DailyDemand(
                date=day,
                new_items_by_priority={
                    BacklogPriority.LOW: int(daily_demand_count * 0.6),
                    BacklogPriority.MEDIUM: int(daily_demand_count * 0.5),
                    BacklogPriority.HIGH: int(daily_demand_count * 0.3),
                    BacklogPriority.CRITICAL: int(daily_demand_count * 0.15)
                },
                new_items_by_complexity={
                    Complexity.SIMPLE: int(daily_demand_count * 0.5),
                    Complexity.MODERATE: int(daily_demand_count * 0.35),
                    Complexity.COMPLEX: int(daily_demand_count * 0.15)
                },
                total_estimated_effort_hours=daily_demand_count * 0.75
            ))
        
        overflow_request = BacklogPropagationRequest(
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            profile=overflow_profile,
            initial_backlog_items=initial_items.copy(),
            daily_capacities=daily_capacities.copy(),
            daily_demands=overflow_demands,
            seed=43
        )
        
        engine_overflow = BacklogPropagationEngine(seed=43)
        scenarios["overflow"] = engine_overflow.simulate_propagation(overflow_request)
        
        # Scenario 3: Recovery
        recovery_profile = BacklogPropagationProfile(
            propagation_rate=1.0,
            decay_rate=0.10,
            max_backlog_capacity=500,
            aging_enabled=False,  # Focus on clearing, not aging
            aging_threshold_days=5,
            overflow_strategy=OverflowStrategy.DEFER,
            sla_breach_threshold_days=3,
            sla_penalty_per_day=100.0,
            recovery_rate_multiplier=1.50  # 50% recovery boost
        )
        
        # Recovery capacities with boost
        recovery_capacities = []
        for day_offset in range(days):
            day = start_date + timedelta(days=day_offset)
            recovery_capacities.append(DailyCapacity(
                date=day,
                total_capacity_hours=daily_capacity_hours * 1.3,
                backlog_capacity_hours=daily_capacity_hours * 0.9,  # 90% to backlog
                new_work_capacity_hours=daily_capacity_hours * 0.4,
                staff_count=13,
                productivity_modifier=1.2,  # 20% productivity boost
                max_items_per_day=130,
                max_complex_items_per_day=15
            ))
        
        # Reduce demand during recovery
        recovery_demands = []
        for day_offset in range(days):
            day = start_date + timedelta(days=day_offset)
            recovery_demands.append(DailyDemand(
                date=day,
                new_items_by_priority={
                    BacklogPriority.LOW: int(daily_demand_count * 0.2),
                    BacklogPriority.MEDIUM: int(daily_demand_count * 0.15),
                    BacklogPriority.HIGH: int(daily_demand_count * 0.10),
                    BacklogPriority.CRITICAL: int(daily_demand_count * 0.05)
                },
                new_items_by_complexity={
                    Complexity.SIMPLE: int(daily_demand_count * 0.3),
                    Complexity.MODERATE: int(daily_demand_count * 0.15),
                    Complexity.COMPLEX: int(daily_demand_count * 0.05)
                },
                total_estimated_effort_hours=daily_demand_count * 0.25
            ))
        
        recovery_request = BacklogPropagationRequest(
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            profile=recovery_profile,
            initial_backlog_items=initial_items.copy(),
            daily_capacities=recovery_capacities,
            daily_demands=recovery_demands,
            seed=44
        )
        
        engine_recovery = BacklogPropagationEngine(seed=44)
        scenarios["recovery"] = engine_recovery.simulate_propagation(recovery_request)
        
        # Scenario 4: High Priority Aging
        aging_profile = BacklogPropagationProfile(
            propagation_rate=1.0,
            decay_rate=0.03,
            max_backlog_capacity=500,
            aging_enabled=True,
            aging_threshold_days=1,  # Rapid aging
            overflow_strategy=OverflowStrategy.ESCALATE,
            sla_breach_threshold_days=1,
            sla_penalty_per_day=200.0,
            recovery_rate_multiplier=1.0
        )
        
        aging_request = BacklogPropagationRequest(
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            profile=aging_profile,
            initial_backlog_items=initial_items.copy(),
            daily_capacities=daily_capacities.copy(),
            daily_demands=daily_demands.copy(),
            seed=45
        )
        
        engine_aging = BacklogPropagationEngine(seed=45)
        scenarios["high_priority_aging"] = engine_aging.simulate_propagation(aging_request)
        
        # Return summary comparisons
        return {
            "organization_id": organization_id,
            "simulation_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "total_days": days
            },
            "input_parameters": {
                "daily_demand_count": daily_demand_count,
                "daily_capacity_hours": daily_capacity_hours,
                "initial_backlog_count": initial_backlog_count
            },
            "scenario_summaries": {
                name: {
                    "final_backlog_count": scenario.final_backlog_count,
                    "total_items_processed": scenario.summary_stats["total_items_processed"],
                    "total_new_items": scenario.summary_stats["total_new_items"],
                    "net_change": scenario.summary_stats["net_backlog_change"],
                    "avg_daily_backlog": scenario.summary_stats["avg_daily_backlog"],
                    "max_daily_backlog": scenario.summary_stats["max_daily_backlog"],
                    "avg_sla_compliance": scenario.summary_stats["avg_sla_compliance_rate"],
                    "total_sla_breaches": scenario.summary_stats["total_sla_breaches"],
                    "total_financial_impact": scenario.summary_stats["total_financial_impact"],
                    "avg_recovery_days": scenario.summary_stats["avg_recovery_days"]
                }
                for name, scenario in scenarios.items()
            },
            "recommendations": _generate_backlog_recommendations(scenarios)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quick backlog scenarios failed: {str(e)}"
        )


def _generate_backlog_recommendations(scenarios: Dict) -> Dict:
    """Generate recommendations based on scenario comparisons"""
    recommendations = {}
    
    # Compare scenarios
    balanced = scenarios["balanced"]
    overflow = scenarios["overflow"]
    recovery = scenarios["recovery"]
    aging = scenarios["high_priority_aging"]
    
    # Capacity recommendations
    if overflow.summary_stats["avg_daily_backlog"] > balanced.summary_stats["avg_daily_backlog"] * 1.5:
        recommendations["capacity"] = (
            "Overflow scenario shows significant backlog accumulation. "
            "Consider increasing capacity by 20-30% or implementing overflow strategies."
        )
    
    # SLA recommendations
    if balanced.summary_stats["avg_sla_compliance_rate"] < 80:
        recommendations["sla"] = (
            f"SLA compliance is low at {balanced.summary_stats['avg_sla_compliance_rate']:.1f}%. "
            "Consider extending SLA thresholds or prioritizing backlog resolution."
        )
    
    # Recovery effectiveness
    if recovery.summary_stats["net_backlog_change"] < -20:
        recommendations["recovery"] = (
            f"Recovery strategy is effective, clearing {abs(recovery.summary_stats['net_backlog_change'])} items. "
            "Consider implementing during backlog spikes."
        )
    
    # Priority aging impact
    aging_critical_count = aging.final_backlog_count
    balanced_critical_count = balanced.final_backlog_count
    if aging_critical_count > balanced_critical_count * 1.3:
        recommendations["priority_aging"] = (
            "Rapid priority aging creates pressure on high-priority lanes. "
            "Balance aging thresholds to avoid over-escalation."
        )
    
    return recommendations


@app.get("/sim/backlog/overflow-strategies")
async def get_overflow_strategies():
    """Get available overflow strategies and their descriptions"""
    return {
        "strategies": [
            {
                "name": OverflowStrategy.REJECT,
                "description": "Reject new items when backlog capacity is exceeded",
                "use_case": "Strict capacity limits, protect existing backlog",
                "impact": "New work is rejected, existing items preserved"
            },
            {
                "name": OverflowStrategy.DEFER,
                "description": "Defer lower priority items to future periods",
                "use_case": "Temporary overflow, expect capacity recovery",
                "impact": "Items moved to future, SLA extended"
            },
            {
                "name": OverflowStrategy.ESCALATE,
                "description": "Escalate items to higher priority lanes",
                "use_case": "Urgent work, need attention on overflow",
                "impact": "Priority inflation, increased pressure"
            },
            {
                "name": OverflowStrategy.OUTSOURCE,
                "description": "Mark items for outsourcing to external teams",
                "use_case": "Extended overflow, available external capacity",
                "impact": "Items removed from backlog, outsourcing cost"
            }
        ],
        "selection_guidance": {
            "low_volume_overflow": OverflowStrategy.DEFER,
            "high_volume_overflow": OverflowStrategy.REJECT,
            "critical_work": OverflowStrategy.ESCALATE,
            "consistent_overflow": OverflowStrategy.OUTSOURCE
        }
    }


@app.get("/sim/backlog/profile-templates")
async def get_backlog_profile_templates():
    """Get pre-configured backlog propagation profile templates"""
    return {
        "templates": {
            "standard": {
                "name": "Standard Flow",
                "description": "Balanced propagation with moderate constraints",
                "profile": {
                    "propagation_rate": 1.0,
                    "decay_rate": 0.05,
                    "max_backlog_capacity": 500,
                    "aging_enabled": True,
                    "aging_threshold_days": 3,
                    "overflow_strategy": "defer",
                    "sla_breach_threshold_days": 2,
                    "sla_penalty_per_day": 100.0,
                    "recovery_rate_multiplier": 1.0
                },
                "best_for": "Normal operations, predictable demand"
            },
            "high_volume": {
                "name": "High Volume",
                "description": "Handles high demand with strict capacity limits",
                "profile": {
                    "propagation_rate": 1.0,
                    "decay_rate": 0.02,
                    "max_backlog_capacity": 300,
                    "aging_enabled": True,
                    "aging_threshold_days": 2,
                    "overflow_strategy": "reject",
                    "sla_breach_threshold_days": 1,
                    "sla_penalty_per_day": 150.0,
                    "recovery_rate_multiplier": 1.0
                },
                "best_for": "High demand environments, capacity constraints"
            },
            "recovery_mode": {
                "name": "Recovery Mode",
                "description": "Optimized for clearing existing backlog",
                "profile": {
                    "propagation_rate": 0.8,
                    "decay_rate": 0.10,
                    "max_backlog_capacity": 1000,
                    "aging_enabled": False,
                    "aging_threshold_days": 5,
                    "overflow_strategy": "defer",
                    "sla_breach_threshold_days": 3,
                    "sla_penalty_per_day": 100.0,
                    "recovery_rate_multiplier": 1.50
                },
                "best_for": "Backlog reduction initiatives, capacity boost periods"
            },
            "strict_sla": {
                "name": "Strict SLA",
                "description": "Prioritizes SLA compliance and rapid resolution",
                "profile": {
                    "propagation_rate": 1.0,
                    "decay_rate": 0.03,
                    "max_backlog_capacity": 400,
                    "aging_enabled": True,
                    "aging_threshold_days": 1,
                    "overflow_strategy": "escalate",
                    "sla_breach_threshold_days": 1,
                    "sla_penalty_per_day": 250.0,
                    "recovery_rate_multiplier": 1.2
                },
                "best_for": "SLA-sensitive operations, customer-facing work"
            },
            "flexible": {
                "name": "Flexible Flow",
                "description": "Accommodates variability with elastic capacity",
                "profile": {
                    "propagation_rate": 1.0,
                    "decay_rate": 0.07,
                    "max_backlog_capacity": None,
                    "aging_enabled": True,
                    "aging_threshold_days": 4,
                    "overflow_strategy": "defer",
                    "sla_breach_threshold_days": 3,
                    "sla_penalty_per_day": 75.0,
                    "recovery_rate_multiplier": 1.1
                },
                "best_for": "Variable demand, flexible capacity, internal work"
            }
        }
    }


# ============================================================================
# Service Statistics
# ============================================================================

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
            "Capacity planning",
            "Productivity variance simulation",
            "Backlog propagation modeling"
        ],
        "productivity_variance": {
            "scenarios": [s.value for s in VarianceScenario],
            "factor_categories": [c.value for c in FactorCategory],
            "supported_distributions": ["normal", "uniform", "beta", "exponential"],
            "temporal_patterns": True,
            "learning_curves": True
        },
        "backlog_propagation": {
            "overflow_strategies": [s.value for s in OverflowStrategy],
            "item_priorities": [p.value for p in BacklogPriority],
            "complexity_levels": [c.value for c in Complexity],
            "sla_tracking": True,
            "priority_aging": True,
            "profile_templates": 5
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
