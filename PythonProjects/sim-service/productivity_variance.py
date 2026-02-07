"""
Productivity Variance Engine
Advanced simulation of productivity variations and their staffing impact
"""
from typing import List, Dict, Optional, Tuple, Any
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
import random
import math
import numpy as np
from scipy import stats


# ============================================================================
# Models
# ============================================================================

class DistributionType(str, Enum):
    NORMAL = "normal"
    UNIFORM = "uniform"
    BETA = "beta"
    EXPONENTIAL = "exponential"
    CUSTOM = "custom"


class VarianceScenario(str, Enum):
    CONSISTENT = "consistent"  # Low variance, predictable
    VOLATILE = "volatile"  # High variance, unpredictable
    DECLINING = "declining"  # Gradual decline over time
    IMPROVING = "improving"  # Gradual improvement over time
    CYCLICAL = "cyclical"  # Repeating patterns
    SHOCK = "shock"  # Sudden disruption events
    CUSTOM = "custom"  # User-defined


class FactorCategory(str, Enum):
    ENVIRONMENTAL = "environmental"
    EQUIPMENT = "equipment"
    TRAINING = "training"
    STAFFING = "staffing"
    WORKLOAD = "workload"
    TEMPORAL = "temporal"
    EXTERNAL = "external"


class ProductivityVarianceProfile(BaseModel):
    """Configuration for productivity variance behavior"""
    mean_productivity_modifier: float = Field(default=1.0, ge=0.1, le=3.0)
    std_deviation: float = Field(default=0.15, ge=0.0, le=1.0)
    min_modifier: float = Field(default=0.7, ge=0.1, le=1.0)
    max_modifier: float = Field(default=1.3, ge=1.0, le=3.0)
    distribution_type: DistributionType = DistributionType.NORMAL
    
    # Temporal patterns
    time_of_day_impact: Optional[Dict[int, float]] = None  # Hour -> multiplier
    day_of_week_impact: Optional[Dict[int, float]] = None  # 0=Monday -> multiplier
    seasonal_impact: Optional[Dict[int, float]] = None  # Month -> multiplier
    
    # Learning curve
    learning_curve_enabled: bool = False
    learning_rate: float = Field(default=0.001, ge=0.0, le=0.1)
    plateau_weeks: int = Field(default=12, ge=1, le=104)
    
    # Autocorrelation
    autocorrelation: float = Field(default=0.0, ge=0.0, le=0.99)


class ProductivityVarianceFactor(BaseModel):
    """A specific factor that influences productivity"""
    name: str
    category: FactorCategory
    impact_magnitude: float = Field(..., ge=-1.0, le=1.0)  # -100% to +100%
    probability: float = Field(default=1.0, ge=0.0, le=1.0)  # Chance of occurring
    duration_hours: int = Field(default=1, ge=1, le=24)


class VarianceSimulationRequest(BaseModel):
    """Request for productivity variance simulation"""
    organization_id: str
    start_date: date
    end_date: date
    variance_scenario: VarianceScenario = VarianceScenario.CONSISTENT
    profile: ProductivityVarianceProfile = ProductivityVarianceProfile()
    
    # Baseline metrics
    baseline_units_per_hour: float = Field(default=15.0, gt=0)
    baseline_staff_needed: int = Field(default=10, ge=1)
    
    # Simulation parameters
    monte_carlo_runs: int = Field(default=1, ge=1, le=10000)
    confidence_level: float = Field(default=0.95, ge=0.8, le=0.99)
    seed: Optional[int] = None
    
    # Optional factors
    variance_factors: List[ProductivityVarianceFactor] = []
    shock_events: Optional[List[Dict]] = None  # [{date, impact}]


class ProductivityDataPoint(BaseModel):
    """Single productivity measurement"""
    date: str
    hour_of_day: Optional[int] = None
    baseline_units_per_hour: float
    actual_units_per_hour: float
    productivity_modifier: float
    variance_percentage: float
    baseline_staff_needed: int
    adjusted_staff_needed: int
    staffing_variance: int
    contributing_factors: List[str] = []


class VarianceSimulationResponse(BaseModel):
    """Results from productivity variance simulation"""
    organization_id: str
    variance_scenario: str
    start_date: str
    end_date: str
    total_days: int
    monte_carlo_runs: int
    
    # Data points
    data_points: List[ProductivityDataPoint]
    
    # Statistical summary
    productivity_stats: Dict[str, float]
    staffing_impact: Dict[str, Any]
    risk_metrics: Dict[str, float]
    confidence_intervals: Dict[str, Dict[str, float]]
    
    # Execution metadata
    execution_duration_ms: float
    seed_used: Optional[int]


# ============================================================================
# Productivity Variance Engine
# ============================================================================

class ProductivityVarianceEngine:
    """Core engine for simulating productivity variance"""
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize the variance engine"""
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)
        self.previous_value = None  # For autocorrelation
    
    def _generate_base_variance(
        self,
        profile: ProductivityVarianceProfile,
        day_number: int = 0
    ) -> float:
        """Generate base productivity modifier from distribution"""
        
        if profile.distribution_type == DistributionType.NORMAL:
            # Normal distribution
            value = np.random.normal(
                profile.mean_productivity_modifier,
                profile.std_deviation
            )
        
        elif profile.distribution_type == DistributionType.UNIFORM:
            # Uniform distribution between min and max
            value = np.random.uniform(
                profile.min_modifier,
                profile.max_modifier
            )
        
        elif profile.distribution_type == DistributionType.BETA:
            # Beta distribution (good for bounded values)
            alpha = 2.0
            beta_param = 2.0
            scaled = np.random.beta(alpha, beta_param)
            value = profile.min_modifier + scaled * (profile.max_modifier - profile.min_modifier)
        
        elif profile.distribution_type == DistributionType.EXPONENTIAL:
            # Exponential distribution (for modeling delays/disruptions)
            value = profile.mean_productivity_modifier * np.random.exponential(1.0)
        
        else:
            # Default to mean
            value = profile.mean_productivity_modifier
        
        # Apply autocorrelation if enabled and we have previous value
        if profile.autocorrelation > 0 and self.previous_value is not None:
            value = (profile.autocorrelation * self.previous_value + 
                    (1 - profile.autocorrelation) * value)
        
        # Clamp to min/max
        value = max(profile.min_modifier, min(profile.max_modifier, value))
        self.previous_value = value
        
        return value
    
    def _apply_learning_curve(
        self,
        base_value: float,
        day_number: int,
        profile: ProductivityVarianceProfile
    ) -> float:
        """Apply learning curve effect"""
        if not profile.learning_curve_enabled:
            return base_value
        
        # Sigmoid learning curve
        plateau_days = profile.plateau_weeks * 7
        learning_factor = 1.0 / (1.0 + math.exp(-profile.learning_rate * (day_number - plateau_days / 2)))
        
        # Learning improves productivity
        max_improvement = 0.2  # Up to 20% improvement
        improvement = learning_factor * max_improvement
        
        return base_value * (1.0 + improvement)
    
    def _apply_temporal_patterns(
        self,
        base_value: float,
        current_date: date,
        hour: Optional[int],
        profile: ProductivityVarianceProfile
    ) -> float:
        """Apply time-based patterns"""
        value = base_value
        
        # Time of day impact
        if hour is not None and profile.time_of_day_impact:
            multiplier = profile.time_of_day_impact.get(hour, 1.0)
            value *= multiplier
        
        # Day of week impact
        if profile.day_of_week_impact:
            dow = current_date.weekday()
            multiplier = profile.day_of_week_impact.get(dow, 1.0)
            value *= multiplier
        
        # Seasonal impact (month)
        if profile.seasonal_impact:
            month = current_date.month
            multiplier = profile.seasonal_impact.get(month, 1.0)
            value *= multiplier
        
        return value
    
    def _apply_variance_factors(
        self,
        base_value: float,
        variance_factors: List[ProductivityVarianceFactor],
        current_date: date
    ) -> Tuple[float, List[str]]:
        """Apply specific variance factors"""
        value = base_value
        applied_factors = []
        
        for factor in variance_factors:
            # Check if factor occurs (probability check)
            if random.random() < factor.probability:
                impact = 1.0 + factor.impact_magnitude
                value *= impact
                applied_factors.append(factor.name)
        
        return value, applied_factors
    
    def _apply_shock_events(
        self,
        base_value: float,
        current_date: date,
        shock_events: Optional[List[Dict]]
    ) -> Tuple[float, List[str]]:
        """Apply sudden shock events"""
        if not shock_events:
            return base_value, []
        
        value = base_value
        applied_shocks = []
        
        for shock in shock_events:
            shock_date = datetime.strptime(shock['date'], '%Y-%m-%d').date()
            if shock_date == current_date:
                impact = 1.0 + shock.get('impact', 0.0)
                value *= impact
                shock_name = shock.get('name', f'Shock on {shock_date}')
                applied_shocks.append(shock_name)
        
        return value, applied_shocks
    
    def _apply_scenario_pattern(
        self,
        base_value: float,
        day_number: int,
        total_days: int,
        scenario: VarianceScenario
    ) -> float:
        """Apply scenario-specific patterns"""
        
        if scenario == VarianceScenario.CONSISTENT:
            # Low variance, stays close to base
            variance = np.random.normal(0, 0.05)
            return base_value * (1.0 + variance)
        
        elif scenario == VarianceScenario.VOLATILE:
            # High variance, large swings
            variance = np.random.normal(0, 0.25)
            return base_value * (1.0 + variance)
        
        elif scenario == VarianceScenario.DECLINING:
            # Linear decline over time
            decline_rate = 0.3 / total_days  # 30% decline over period
            decline = decline_rate * day_number
            return base_value * (1.0 - decline)
        
        elif scenario == VarianceScenario.IMPROVING:
            # Linear improvement over time
            improve_rate = 0.3 / total_days  # 30% improvement over period
            improvement = improve_rate * day_number
            return base_value * (1.0 + improvement)
        
        elif scenario == VarianceScenario.CYCLICAL:
            # Weekly cycle (7-day period)
            cycle = math.sin(2 * math.pi * day_number / 7)
            return base_value * (1.0 + 0.15 * cycle)
        
        elif scenario == VarianceScenario.SHOCK:
            # Random shock events (10% chance per day)
            if random.random() < 0.1:
                shock = random.choice([-0.3, -0.2, 0.2, 0.3])
                return base_value * (1.0 + shock)
        
        return base_value
    
    def _calculate_staffing_adjustment(
        self,
        baseline_staff: int,
        productivity_modifier: float
    ) -> int:
        """Calculate adjusted staffing needs"""
        # If productivity is lower, more staff needed
        adjusted = math.ceil(baseline_staff / productivity_modifier)
        return max(1, adjusted)
    
    def simulate_variance(
        self,
        request: VarianceSimulationRequest
    ) -> VarianceSimulationResponse:
        """Run productivity variance simulation"""
        start_time = datetime.now()
        
        # Initialize
        current_date = request.start_date
        day_number = 0
        total_days = (request.end_date - request.start_date).days + 1
        data_points = []
        
        # Reset autocorrelation
        self.previous_value = None
        
        # Generate data points for each day
        while current_date <= request.end_date:
            # Generate base variance
            variance_value = self._generate_base_variance(request.profile, day_number)
            
            # Apply scenario pattern
            variance_value = self._apply_scenario_pattern(
                variance_value,
                day_number,
                total_days,
                request.variance_scenario
            )
            
            # Apply learning curve
            variance_value = self._apply_learning_curve(
                variance_value,
                day_number,
                request.profile
            )
            
            # Apply temporal patterns
            variance_value = self._apply_temporal_patterns(
                variance_value,
                current_date,
                None,  # Could add hour-by-hour simulation
                request.profile
            )
            
            # Apply variance factors
            variance_value, factor_names = self._apply_variance_factors(
                variance_value,
                request.variance_factors,
                current_date
            )
            
            # Apply shock events
            variance_value, shock_names = self._apply_shock_events(
                variance_value,
                current_date,
                request.shock_events
            )
            
            # Calculate metrics
            actual_units = request.baseline_units_per_hour * variance_value
            variance_pct = ((variance_value - 1.0) * 100)
            adjusted_staff = self._calculate_staffing_adjustment(
                request.baseline_staff_needed,
                variance_value
            )
            staffing_variance = adjusted_staff - request.baseline_staff_needed
            
            # Create data point
            data_point = ProductivityDataPoint(
                date=current_date.isoformat(),
                hour_of_day=None,
                baseline_units_per_hour=request.baseline_units_per_hour,
                actual_units_per_hour=round(actual_units, 2),
                productivity_modifier=round(variance_value, 3),
                variance_percentage=round(variance_pct, 2),
                baseline_staff_needed=request.baseline_staff_needed,
                adjusted_staff_needed=adjusted_staff,
                staffing_variance=staffing_variance,
                contributing_factors=factor_names + shock_names
            )
            data_points.append(data_point)
            
            # Next day
            current_date += timedelta(days=1)
            day_number += 1
        
        # Calculate statistics
        productivity_values = [dp.productivity_modifier for dp in data_points]
        variance_values = [dp.variance_percentage for dp in data_points]
        staffing_variances = [dp.staffing_variance for dp in data_points]
        
        productivity_stats = {
            "mean": float(np.mean(productivity_values)),
            "median": float(np.median(productivity_values)),
            "std_dev": float(np.std(productivity_values)),
            "min": float(np.min(productivity_values)),
            "max": float(np.max(productivity_values)),
            "percentile_25": float(np.percentile(productivity_values, 25)),
            "percentile_75": float(np.percentile(productivity_values, 75)),
            "percentile_90": float(np.percentile(productivity_values, 90)),
        }
        
        staffing_impact = {
            "avg_variance": float(np.mean(staffing_variances)),
            "max_additional_staff": int(max(staffing_variances)),
            "min_additional_staff": int(min(staffing_variances)),
            "total_additional_staff_days": int(sum(max(0, sv) for sv in staffing_variances)),
            "days_understaffed": int(sum(1 for sv in staffing_variances if sv > 0)),
            "days_overstaffed": int(sum(1 for sv in staffing_variances if sv < 0)),
        }
        
        # Risk metrics
        days_low_productivity = sum(1 for pv in productivity_values if pv < 0.9)
        days_critical_productivity = sum(1 for pv in productivity_values if pv < 0.8)
        
        risk_metrics = {
            "probability_below_90pct": float(days_low_productivity / len(productivity_values)),
            "probability_below_80pct": float(days_critical_productivity / len(productivity_values)),
            "volatility": float(np.std(variance_values)),
            "coefficient_of_variation": float(np.std(productivity_values) / np.mean(productivity_values)),
        }
        
        # Confidence intervals (for monte carlo, would need multiple runs)
        confidence_intervals = {
            "productivity_modifier": {
                "lower": float(np.percentile(productivity_values, (1 - request.confidence_level) * 50)),
                "upper": float(np.percentile(productivity_values, 100 - (1 - request.confidence_level) * 50)),
            },
            "staffing_variance": {
                "lower": float(np.percentile(staffing_variances, (1 - request.confidence_level) * 50)),
                "upper": float(np.percentile(staffing_variances, 100 - (1 - request.confidence_level) * 50)),
            }
        }
        
        # Calculate execution time
        end_time = datetime.now()
        duration_ms = (end_time - start_time).total_seconds() * 1000
        
        return VarianceSimulationResponse(
            organization_id=request.organization_id,
            variance_scenario=request.variance_scenario.value,
            start_date=request.start_date.isoformat(),
            end_date=request.end_date.isoformat(),
            total_days=total_days,
            monte_carlo_runs=request.monte_carlo_runs,
            data_points=data_points,
            productivity_stats=productivity_stats,
            staffing_impact=staffing_impact,
            risk_metrics=risk_metrics,
            confidence_intervals=confidence_intervals,
            execution_duration_ms=round(duration_ms, 2),
            seed_used=request.seed
        )


# ============================================================================
# Convenience Functions
# ============================================================================

def create_preset_profile(scenario: VarianceScenario) -> ProductivityVarianceProfile:
    """Create a preset variance profile for common scenarios"""
    
    presets = {
        VarianceScenario.CONSISTENT: ProductivityVarianceProfile(
            mean_productivity_modifier=1.0,
            std_deviation=0.05,
            min_modifier=0.90,
            max_modifier=1.10,
            autocorrelation=0.7
        ),
        VarianceScenario.VOLATILE: ProductivityVarianceProfile(
            mean_productivity_modifier=1.0,
            std_deviation=0.25,
            min_modifier=0.60,
            max_modifier=1.40,
            autocorrelation=0.3
        ),
        VarianceScenario.DECLINING: ProductivityVarianceProfile(
            mean_productivity_modifier=1.0,
            std_deviation=0.10,
            min_modifier=0.70,
            max_modifier=1.10,
        ),
        VarianceScenario.IMPROVING: ProductivityVarianceProfile(
            mean_productivity_modifier=0.9,
            std_deviation=0.10,
            min_modifier=0.80,
            max_modifier=1.20,
            learning_curve_enabled=True,
            learning_rate=0.005
        ),
        VarianceScenario.CYCLICAL: ProductivityVarianceProfile(
            mean_productivity_modifier=1.0,
            std_deviation=0.10,
            min_modifier=0.85,
            max_modifier=1.15,
            day_of_week_impact={0: 0.9, 1: 0.95, 2: 1.0, 3: 1.05, 4: 1.1, 5: 0.85, 6: 0.80}
        ),
        VarianceScenario.SHOCK: ProductivityVarianceProfile(
            mean_productivity_modifier=1.0,
            std_deviation=0.15,
            min_modifier=0.50,
            max_modifier=1.20,
            autocorrelation=0.5
        ),
    }
    
    return presets.get(scenario, ProductivityVarianceProfile())


def create_common_factors() -> List[ProductivityVarianceFactor]:
    """Create a list of common productivity variance factors"""
    return [
        ProductivityVarianceFactor(
            name="Equipment Downtime",
            category=FactorCategory.EQUIPMENT,
            impact_magnitude=-0.30,
            probability=0.05,
            duration_hours=2
        ),
        ProductivityVarianceFactor(
            name="Peak Fatigue",
            category=FactorCategory.TEMPORAL,
            impact_magnitude=-0.15,
            probability=0.20,
            duration_hours=4
        ),
        ProductivityVarianceFactor(
            name="Training Session",
            category=FactorCategory.TRAINING,
            impact_magnitude=-0.25,
            probability=0.03,
            duration_hours=8
        ),
        ProductivityVarianceFactor(
            name="Process Improvement",
            category=FactorCategory.WORKLOAD,
            impact_magnitude=0.15,
            probability=0.10,
            duration_hours=24
        ),
    ]
