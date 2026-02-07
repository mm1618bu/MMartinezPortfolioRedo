"""
Backlog Propagation Engine
Simulates how unmet demand accumulates and propagates through time periods
"""
from typing import List, Dict, Optional, Tuple, Any
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
import random
import numpy as np
from collections import defaultdict


# ============================================================================
# Models
# ============================================================================

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ItemStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DEFERRED = "deferred"
    ESCALATED = "escalated"
    REJECTED = "rejected"
    OUTSOURCED = "outsourced"


class Complexity(str, Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class OverflowStrategy(str, Enum):
    REJECT = "reject"
    DEFER = "defer"
    ESCALATE = "escalate"
    OUTSOURCE = "outsource"


class BacklogLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BacklogPropagationProfile(BaseModel):
    """Configuration for how backlogs propagate"""
    propagation_rate: float = Field(default=1.0, ge=0.0, le=1.0)
    decay_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    max_backlog_capacity: Optional[int] = None
    
    # Priority handling
    aging_enabled: bool = True
    aging_threshold_days: int = 3
    
    # Overflow
    overflow_strategy: OverflowStrategy = OverflowStrategy.REJECT
    
    # SLA
    sla_breach_threshold_days: int = 1
    sla_penalty_per_day: float = 100.0
    customer_satisfaction_impact: float = -0.05
    
    # Recovery
    recovery_rate_multiplier: float = 1.20
    recovery_priority_boost: int = 1


class BacklogItem(BaseModel):
    """Individual backlog item"""
    id: str
    item_type: str
    priority: Priority
    original_priority: Priority
    complexity: Complexity = Complexity.MODERATE
    estimated_effort_minutes: int = Field(default=30, ge=1)
    
    created_date: date
    due_date: Optional[date] = None
    completed_date: Optional[date] = None
    
    status: ItemStatus = ItemStatus.PENDING
    sla_breached: bool = False
    days_in_backlog: int = 0
    propagation_count: int = 0
    
    aging_date: Optional[date] = None


class DailyCapacity(BaseModel):
    """Available capacity for a day"""
    date: date
    total_capacity_hours: float
    backlog_capacity_hours: float
    new_work_capacity_hours: float
    
    staff_count: int = 10
    productivity_modifier: float = 1.0
    
    max_items_per_day: Optional[int] = None
    max_complex_items_per_day: Optional[int] = None


class DailyDemand(BaseModel):
    """Incoming work demand for a day"""
    date: date
    new_items_by_priority: Dict[Priority, int]
    new_items_by_complexity: Dict[Complexity, int]
    total_estimated_effort_hours: float


class BacklogSnapshot(BaseModel):
    """Point-in-time backlog state"""
    snapshot_date: date
    total_items: int
    items_by_priority: Dict[Priority, int]
    items_by_age: Dict[str, int]  # Age buckets
    
    total_estimated_effort_hours: float
    avg_age_days: float
    oldest_item_age_days: int
    
    sla_breached_count: int
    sla_at_risk_count: int
    sla_compliance_rate: float
    
    capacity_utilization: float
    overflow_count: int
    
    items_propagated: int
    items_aged_up: int
    items_resolved: int
    new_items: int
    
    estimated_recovery_days: float
    customer_impact_score: float
    financial_impact: float


class BacklogPropagationRequest(BaseModel):
    """Request to simulate backlog propagation"""
    organization_id: str
    start_date: date
    end_date: date
    
    profile: BacklogPropagationProfile = BacklogPropagationProfile()
    
    # Initial state
    initial_backlog_items: List[BacklogItem] = []
    
    # Daily inputs
    daily_capacities: List[DailyCapacity]
    daily_demands: List[DailyDemand]
    
    # Simulation options
    seed: Optional[int] = None
    enable_priority_aging: bool = True
    enable_sla_tracking: bool = True


class BacklogPropagationResponse(BaseModel):
    """Results from backlog propagation simulation"""
    organization_id: str
    start_date: str
    end_date: str
    total_days: int
    
    # Daily snapshots
    daily_snapshots: List[BacklogSnapshot]
    
    # Final state
    final_backlog_items: List[BacklogItem]
    final_backlog_count: int
    
    # Summary statistics
    summary_stats: Dict[str, Any]
    
    # Execution metadata
    execution_duration_ms: float
    seed_used: Optional[int]


# ============================================================================
# Backlog Propagation Engine
# ============================================================================

class BacklogPropagationEngine:
    """Core engine for simulating backlog propagation"""
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize the propagation engine"""
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)
        
        self.backlog_items: List[BacklogItem] = []
        self.event_log: List[Dict] = []
        self.item_counter = 0
    
    def _generate_item_id(self) -> str:
        """Generate unique item ID"""
        self.item_counter += 1
        return f"ITEM-{self.item_counter:06d}"
    
    def _get_priority_order(self, priority: Priority) -> int:
        """Get numeric priority for sorting"""
        order = {
            Priority.LOW: 1,
            Priority.MEDIUM: 2,
            Priority.HIGH: 3,
            Priority.CRITICAL: 4
        }
        return order.get(priority, 2)
    
    def _upgrade_priority(self, current: Priority) -> Priority:
        """Upgrade to next priority level"""
        if current == Priority.LOW:
            return Priority.MEDIUM
        elif current == Priority.MEDIUM:
            return Priority.HIGH
        elif current == Priority.HIGH:
            return Priority.CRITICAL
        return Priority.CRITICAL
    
    def _calculate_backlog_level(
        self,
        current_count: int,
        max_capacity: Optional[int]
    ) -> BacklogLevel:
        """Determine backlog severity level"""
        if max_capacity is None or max_capacity == 0:
            if current_count < 50:
                return BacklogLevel.LOW
            elif current_count < 100:
                return BacklogLevel.MEDIUM
            elif current_count < 200:
                return BacklogLevel.HIGH
            else:
                return BacklogLevel.CRITICAL
        
        utilization = current_count / max_capacity
        
        if utilization < 0.5:
            return BacklogLevel.LOW
        elif utilization < 0.75:
            return BacklogLevel.MEDIUM
        elif utilization < 0.95:
            return BacklogLevel.HIGH
        else:
            return BacklogLevel.CRITICAL
    
    def _apply_aging(
        self,
        item: BacklogItem,
        current_date: date,
        profile: BacklogPropagationProfile
    ) -> bool:
        """Age up item priority if threshold reached"""
        if not profile.aging_enabled:
            return False
        
        if item.priority == Priority.CRITICAL:
            return False  # Already at max priority
        
        days_since_aging = (current_date - (item.aging_date or item.created_date)).days
        
        if days_since_aging >= profile.aging_threshold_days:
            item.priority = self._upgrade_priority(item.priority)
            item.aging_date = current_date
            return True
        
        return False
    
    def _apply_decay(
        self,
        items: List[BacklogItem],
        decay_rate: float
    ) -> List[BacklogItem]:
        """Apply natural decay to backlog (some items resolve themselves)"""
        if decay_rate <= 0:
            return items
        
        remaining_items = []
        decayed_count = 0
        
        for item in items:
            if random.random() >= decay_rate:
                remaining_items.append(item)
            else:
                item.status = ItemStatus.COMPLETED
                item.completed_date = date.today()
                decayed_count += 1
        
        if decayed_count > 0:
            self.event_log.append({
                "event": "natural_decay",
                "count": decayed_count,
                "rate": decay_rate
            })
        
        return remaining_items
    
    def _process_new_items(
        self,
        demand: DailyDemand,
        current_date: date,
        profile: BacklogPropagationProfile
    ) -> List[BacklogItem]:
        """Create new backlog items from demand"""
        new_items = []
        
        # Generate items by priority
        for priority, count in demand.new_items_by_priority.items():
            for _ in range(count):
                # Determine complexity (weighted distribution)
                complexity_weights = {
                    Complexity.SIMPLE: 0.5,
                    Complexity.MODERATE: 0.35,
                    Complexity.COMPLEX: 0.15
                }
                complexity = random.choices(
                    list(complexity_weights.keys()),
                    weights=list(complexity_weights.values())
                )[0]
                
                # Estimate effort based on complexity
                effort_ranges = {
                    Complexity.SIMPLE: (15, 30),
                    Complexity.MODERATE: (30, 60),
                    Complexity.COMPLEX: (60, 120)
                }
                effort_min, effort_max = effort_ranges[complexity]
                effort = random.randint(effort_min, effort_max)
                
                # Calculate SLA deadline
                due_date = None
                if profile.sla_breach_threshold_days > 0:
                    due_date = current_date + timedelta(days=profile.sla_breach_threshold_days)
                
                item = BacklogItem(
                    id=self._generate_item_id(),
                    item_type="work_item",
                    priority=priority,
                    original_priority=priority,
                    complexity=complexity,
                    estimated_effort_minutes=effort,
                    created_date=current_date,
                    due_date=due_date,
                    status=ItemStatus.PENDING,
                    days_in_backlog=0,
                    propagation_count=0
                )
                
                new_items.append(item)
        
        return new_items
    
    def _resolve_items(
        self,
        items: List[BacklogItem],
        capacity: DailyCapacity,
        current_date: date
    ) -> Tuple[List[BacklogItem], int, float]:
        """Resolve items with available capacity"""
        # Sort by priority (highest first), then age (oldest first)
        sorted_items = sorted(
            items,
            key=lambda x: (
                -self._get_priority_order(x.priority),
                x.days_in_backlog
            ),
            reverse=True
        )
        
        resolved_items = []
        remaining_items = []
        
        available_hours = capacity.backlog_capacity_hours * capacity.productivity_modifier
        items_processed = 0
        complex_items_processed = 0
        
        for item in sorted_items:
            effort_hours = item.estimated_effort_minutes / 60.0
            
            # Check capacity constraints
            if effort_hours > available_hours:
                remaining_items.append(item)
                continue
            
            if capacity.max_items_per_day and items_processed >= capacity.max_items_per_day:
                remaining_items.append(item)
                continue
            
            if (item.complexity == Complexity.COMPLEX and 
                capacity.max_complex_items_per_day and 
                complex_items_processed >= capacity.max_complex_items_per_day):
                remaining_items.append(item)
                continue
            
            # Process the item
            item.status = ItemStatus.COMPLETED
            item.completed_date = current_date
            resolved_items.append(item)
            
            available_hours -= effort_hours
            items_processed += 1
            if item.complexity == Complexity.COMPLEX:
                complex_items_processed += 1
        
        hours_used = capacity.backlog_capacity_hours * capacity.productivity_modifier - available_hours
        
        return remaining_items, len(resolved_items), hours_used
    
    def _handle_overflow(
        self,
        items: List[BacklogItem],
        max_capacity: Optional[int],
        overflow_strategy: OverflowStrategy,
        current_date: date
    ) -> Tuple[List[BacklogItem], int]:
        """Handle overflow when backlog exceeds capacity"""
        if max_capacity is None or len(items) <= max_capacity:
            return items, 0
        
        overflow_count = len(items) - max_capacity
        
        if overflow_strategy == OverflowStrategy.REJECT:
            # Keep highest priority, newest items
            sorted_items = sorted(
                items,
                key=lambda x: (self._get_priority_order(x.priority), -x.days_in_backlog),
                reverse=True
            )
            kept_items = sorted_items[:max_capacity]
            rejected_items = sorted_items[max_capacity:]
            
            for item in rejected_items:
                item.status = ItemStatus.REJECTED
            
            return kept_items, overflow_count
        
        elif overflow_strategy == OverflowStrategy.DEFER:
            # Defer lowest priority items
            sorted_items = sorted(items, key=lambda x: self._get_priority_order(x.priority))
            deferred = sorted_items[:overflow_count]
            
            for item in deferred:
                item.status = ItemStatus.DEFERRED
                item.due_date = current_date + timedelta(days=7)  # Defer 1 week
            
            return items, overflow_count
        
        elif overflow_strategy == OverflowStrategy.ESCALATE:
            # Escalate items to higher priority lanes
            sorted_items = sorted(items, key=lambda x: self._get_priority_order(x.priority))
            escalated = sorted_items[:overflow_count]
            
            for item in escalated:
                item.priority = self._upgrade_priority(item.priority)
                item.status = ItemStatus.ESCALATED
            
            return items, overflow_count
        
        elif overflow_strategy == OverflowStrategy.OUTSOURCE:
            # Mark for outsourcing
            sorted_items = sorted(items, key=lambda x: self._get_priority_order(x.priority))
            outsourced = sorted_items[:overflow_count]
            
            for item in outsourced:
                item.status = ItemStatus.OUTSOURCED
            
            return [item for item in items if item.status != ItemStatus.OUTSOURCED], overflow_count
        
        return items, 0
    
    def _check_sla_breaches(
        self,
        items: List[BacklogItem],
        current_date: date
    ) -> int:
        """Check and mark SLA breaches"""
        breach_count = 0
        
        for item in items:
            if item.due_date and current_date > item.due_date and not item.sla_breached:
                item.sla_breached = True
                breach_count += 1
        
        return breach_count
    
    def _create_snapshot(
        self,
        items: List[BacklogItem],
        current_date: date,
        profile: BacklogPropagationProfile,
        metrics: Dict
    ) -> BacklogSnapshot:
        """Create snapshot of current backlog state"""
        # Count by priority
        priority_counts = defaultdict(int)
        for item in items:
            priority_counts[item.priority] += 1
        
        # Count by age buckets
        age_buckets = defaultdict(int)
        for item in items:
            if item.days_in_backlog < 1:
                age_buckets["0-1 days"] += 1
            elif item.days_in_backlog <= 3:
                age_buckets["1-3 days"] += 1
            elif item.days_in_backlog <= 7:
                age_buckets["4-7 days"] += 1
            elif item.days_in_backlog <= 14:
                age_buckets["8-14 days"] += 1
            else:
                age_buckets["15+ days"] += 1
        
        # Calculate metrics
        total_effort = sum(item.estimated_effort_minutes for item in items) / 60.0
        avg_age = sum(item.days_in_backlog for item in items) / len(items) if items else 0
        oldest_age = max((item.days_in_backlog for item in items), default=0)
        
        sla_breached = sum(1 for item in items if item.sla_breached)
        sla_at_risk = sum(
            1 for item in items 
            if item.due_date and (item.due_date - current_date).days <= 1 and not item.sla_breached
        )
        total_with_sla = sum(1 for item in items if item.due_date is not None)
        sla_compliance = ((total_with_sla - sla_breached) / total_with_sla * 100) if total_with_sla > 0 else 100.0
        
        # Capacity utilization
        max_cap = profile.max_backlog_capacity or 1000
        capacity_util = (len(items) / max_cap) * 100
        
        # Financial impact
        total_days_in_backlog = sum(item.days_in_backlog for item in items)
        financial_impact = total_days_in_backlog * profile.sla_penalty_per_day
        
        # Customer impact
        customer_impact = sla_breached * profile.customer_satisfaction_impact
        
        # Recovery time
        daily_capacity = metrics.get('daily_capacity_hours', 40)
        recovery_days = total_effort / (daily_capacity * profile.recovery_rate_multiplier) if daily_capacity > 0 else 0
        
        return BacklogSnapshot(
            snapshot_date=current_date,
            total_items=len(items),
            items_by_priority=dict(priority_counts),
            items_by_age=dict(age_buckets),
            total_estimated_effort_hours=total_effort,
            avg_age_days=avg_age,
            oldest_item_age_days=oldest_age,
            sla_breached_count=sla_breached,
            sla_at_risk_count=sla_at_risk,
            sla_compliance_rate=sla_compliance,
            capacity_utilization=capacity_util,
            overflow_count=metrics.get('overflow_count', 0),
            items_propagated=metrics.get('propagated', 0),
            items_aged_up=metrics.get('aged_up', 0),
            items_resolved=metrics.get('resolved', 0),
            new_items=metrics.get('new_items', 0),
            estimated_recovery_days=recovery_days,
            customer_impact_score=customer_impact,
            financial_impact=financial_impact
        )
    
    def simulate_propagation(
        self,
        request: BacklogPropagationRequest
    ) -> BacklogPropagationResponse:
        """Run backlog propagation simulation"""
        start_time = datetime.now()
        
        # Initialize
        self.backlog_items = request.initial_backlog_items.copy()
        self.event_log = []
        self.item_counter = len(self.backlog_items)
        
        daily_snapshots = []
        current_date = request.start_date
        
        # Create lookups for daily inputs
        capacity_by_date = {cap.date: cap for cap in request.daily_capacities}
        demand_by_date = {dem.date: dem for dem in request.daily_demands}
        
        # Simulate each day
        while current_date <= request.end_date:
            daily_metrics = {}
            
            # Get inputs for today
            capacity = capacity_by_date.get(current_date)
            demand = demand_by_date.get(current_date)
            
            if not capacity:
                # Skip if no capacity defined
                current_date += timedelta(days=1)
                continue
            
            # 1. Age existing items
            aged_count = 0
            for item in self.backlog_items:
                item.days_in_backlog += 1
                if request.enable_priority_aging:
                    if self._apply_aging(item, current_date, request.profile):
                        aged_count += 1
            daily_metrics['aged_up'] = aged_count
            
            # 2. Apply natural decay
            self.backlog_items = self._apply_decay(
                self.backlog_items,
                request.profile.decay_rate
            )
            
            # 3. Process new demand
            new_items = []
            if demand:
                new_items = self._process_new_items(demand, current_date, request.profile)
                self.backlog_items.extend(new_items)
            daily_metrics['new_items'] = len(new_items)
            
            # 4. Check SLA breaches
            if request.enable_sla_tracking:
                breach_count = self._check_sla_breaches(self.backlog_items, current_date)
                daily_metrics['sla_breaches'] = breach_count
            
            # 5. Resolve items with available capacity
            self.backlog_items, resolved_count, hours_used = self._resolve_items(
                self.backlog_items,
                capacity,
                current_date
            )
            daily_metrics['resolved'] = resolved_count
            daily_metrics['capacity_used_hours'] = hours_used
            daily_metrics['daily_capacity_hours'] = capacity.backlog_capacity_hours
            
            # 6. Handle overflow
            self.backlog_items, overflow_count = self._handle_overflow(
                self.backlog_items,
                request.profile.max_backlog_capacity,
                request.profile.overflow_strategy,
                current_date
            )
            daily_metrics['overflow_count'] = overflow_count
            
            # 7. Count propagated items (items stillin backlog)
            propagated_count = len(self.backlog_items)
            daily_metrics['propagated'] = propagated_count
            
            # 8. Update propagation counts
            for item in self.backlog_items:
                if item.status == ItemStatus.PENDING:
                    item.propagation_count += 1
            
            # 9. Create daily snapshot
            snapshot = self._create_snapshot(
                self.backlog_items,
                current_date,
                request.profile,
                daily_metrics
            )
            daily_snapshots.append(snapshot)
            
            # Move to next day
            current_date += timedelta(days=1)
        
        # Calculate summary statistics
        total_resolved = sum(s.items_resolved for s in daily_snapshots)
        total_new = sum(s.new_items for s in daily_snapshots)
        avg_backlog = np.mean([s.total_items for s in daily_snapshots])
        max_backlog = max([s.total_items for s in daily_snapshots])
        avg_sla_compliance = np.mean([s.sla_compliance_rate for s in daily_snapshots])
        total_sla_breaches = sum(s.sla_breached_count for s in daily_snapshots)
        avg_recovery_days = np.mean([s.estimated_recovery_days for s in daily_snapshots])
        total_financial_impact = sum(s.financial_impact for s in daily_snapshots)
        
        summary_stats = {
            "total_items_processed": total_resolved,
            "total_new_items": total_new,
            "net_backlog_change": len(self.backlog_items) - len(request.initial_backlog_items),
            "avg_daily_backlog": float(avg_backlog),
            "max_daily_backlog": int(max_backlog),
            "avg_sla_compliance_rate": float(avg_sla_compliance),
            "total_sla_breaches": int(total_sla_breaches),
            "avg_recovery_days": float(avg_recovery_days),
            "total_financial_impact": float(total_financial_impact),
            "final_backlog_size": len(self.backlog_items)
        }
        
        # Calculate execution time
        end_time = datetime.now()
        duration_ms = (end_time - start_time).total_seconds() * 1000
        
        return BacklogPropagationResponse(
            organization_id=request.organization_id,
            start_date=request.start_date.isoformat(),
            end_date=request.end_date.isoformat(),
            total_days=(request.end_date - request.start_date).days + 1,
            daily_snapshots=daily_snapshots,
            final_backlog_items=self.backlog_items,
            final_backlog_count=len(self.backlog_items),
            summary_stats=summary_stats,
            execution_duration_ms=duration_ms,
            seed_used=request.seed
        )
