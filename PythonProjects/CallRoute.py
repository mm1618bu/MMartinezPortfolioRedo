# call_router_advanced.py
# End-to-end skill-based, seniority-aware call routing with:
# - Agent states (AVAILABLE/ONCALL/ACW/PAUSED/OFFLINE)
# - Priority aging to prevent starvation
# - Required vs preferred skills
# - Sticky routing (try prior agent first)
# - SLA-based partial-match with guardrails
# - Fairness (round-robin within seniority rank)
# - Concurrency limits per agent + thread safety
# - Simple metrics hooks
# - Minimal demo at the bottom

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Callable
from enum import Enum, auto
from collections import defaultdict, deque
import heapq
import threading
import time
import uuid
import logging

# ---------------------------- Logging ----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("call_router")

# ---------------------------- Types & Models ----------------------------

class AgentState(Enum):
    OFFLINE = auto()
    AVAILABLE = auto()
    ONCALL = auto()
    ACW = auto()        # After-Call Work (wrap-up)
    PAUSED = auto()     # breaks, meetings, training


@dataclass(order=True)
class Call:
    # NOTE: `sort_index` used only for heap ordering; recomputed with aging on pop.
    sort_index: Tuple[float, float] = field(init=False, repr=False)
    priority: int                   # Lower number = higher priority (0 is highest)
    arrival_ts: float               # Unix epoch or monotonic timestamp
    required_skills: Dict[str, int] # strict minimums (skill -> required level)
    preferred_skills: Dict[str, int] = field(default_factory=dict)  # nice-to-have
    max_wait_seconds: int = 60      # SLA threshold before partial-match fallback
    estimated_aht_seconds: int = 360  # for capacity-aware choices (optional)
    metadata: Dict = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def __post_init__(self):
        # Initial sort index (re-aged on every routing attempt)
        self.sort_index = (float(self.priority), self.arrival_ts)


@dataclass
class Agent:
    name: str
    seniority_rank: int             # Lower = more senior (1 is most senior)
    skills: Dict[str, int]          # skill -> level
    max_concurrent: int = 1
    state: AgentState = AgentState.AVAILABLE
    acw_seconds: int = 20
    current_calls: int = 0
    last_assigned_ts: float = 0.0
    team: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def is_available(self) -> bool:
        return self.state == AgentState.AVAILABLE and self.current_calls < self.max_concurrent

    def can_handle(self, required: Dict[str, int]) -> bool:
        for skill, min_level in required.items():
            if self.skills.get(skill, -1) < min_level:
                return False
        return True

    def proficiency_score(self, required: Dict[str, int], preferred: Dict[str, int]) -> int:
        """
        Higher is better. Measures how much the agent exceeds required minimums,
        and adds a small bonus for matching preferred skills.
        """
        score = 0
        for skill, min_level in required.items():
            score += self.skills.get(skill, 0) - min_level
        # Preferred gives a small boost (weight = 1 by default)
        for skill, min_level in preferred.items():
            agent_level = self.skills.get(skill, 0)
            if agent_level >= min_level:
                score += (agent_level - min_level)  # bonus for preferred
        return score


# ---------------------------- Scoring Strategy ----------------------------

class ScoringStrategy:
    """Override to customize within-rank selection."""
    def key(self, agent: Agent, call: Call) -> Tuple:
        # Default: proficiency surplus, then load, then idle time, then deterministic id
        return (
            -agent.proficiency_score(call.required_skills, call.preferred_skills),
            agent.current_calls,
            agent.last_assigned_ts,
            agent.id
        )


# ---------------------------- Router ----------------------------

class CallRouter:
    """
    Production-ready routing core.

    Thread-safe with a single global lock to protect queue, agents, and assignments.
    For high throughput, shard by queue or use a broker/DB with row-level locks.
    """
    def __init__(
        self,
        scoring_strategy: Optional[ScoringStrategy] = None,
        priority_aging_rate_per_min: float = 0.05,   # each minute reduces effective priority by 0.05 (cap 0.9)
        max_partial_fraction: float = 0.25,          # guardrail: at most 25% of active assignments are partial
        max_skill_deficit: int = 1,                  # how far below required we allow on partial (per skill)
        metrics_hook: Optional[Callable[[str, Dict], None]] = None,
    ):
        self._global_queue: List[Tuple[Tuple[float, float], str]] = []   # (sort_index, call_id)
        self._call_store: Dict[str, Call] = {}
        self._agents: Dict[str, Agent] = {}
        self._waiting_since: Dict[str, float] = {}
        self._round_robin_counters: Dict[Tuple[int, Tuple[str, ...]], int] = defaultdict(int)

        self._lock = threading.RLock()
        self.scoring = scoring_strategy or ScoringStrategy()
        self.aging_rate = priority_aging_rate_per_min
        self.max_partial_fraction = max(0.0, min(1.0, max_partial_fraction))
        self.max_skill_deficit = max_skill_deficit
        self.metrics_hook = metrics_hook or self._default_metrics

        self._active_assignments_total = 0
        self._active_assignments_partial = 0

    # ---------- Metrics ----------
    def _default_metrics(self, event: str, payload: Dict):
        # Lightweight default; replace with StatsD/Prometheus/OpenTelemetry.
        logger.debug("METRIC %s %s", event, payload)

    # ---------- Agent Management ----------
    def add_agent(self, agent: Agent):
        with self._lock:
            self._agents[agent.id] = agent
            self.metrics_hook("agent_added", {"agent_id": agent.id, "name": agent.name})

    def update_agent(self, agent_id: str, **fields):
        with self._lock:
            agent = self._agents[agent_id]
            for k, v in fields.items():
                setattr(agent, k, v)
            self.metrics_hook("agent_updated", {"agent_id": agent_id, "fields": list(fields.keys())})

    def set_agent_state(self, agent_id: str, state: AgentState):
        with self._lock:
            a = self._agents[agent_id]
            a.state = state
            self.metrics_hook("agent_state", {"agent_id": agent_id, "state": state.name})

    # ---------- Call Intake ----------
    def enqueue_call(self, call: Call):
        with self._lock:
            self._call_store[call.id] = call
            heapq.heappush(self._global_queue, (call.sort_index, call.id))
            self._waiting_since[call.id] = call.arrival_ts
            self.metrics_hook("call_enqueued", {
                "call_id": call.id,
                "priority": call.priority,
                "required_skills": list(call.required_skills.keys())
            })

    # ---------- Priority Aging ----------
    def _effective_priority(self, call: Call, now: float) -> float:
        # Lower is better. Each minute waiting reduces priority by aging_rate; cap 0.9 reduction
        age_minutes = max(0.0, (now - call.arrival_ts) / 60.0)
        reduction = min(0.9, self.aging_rate * age_minutes)
        return max(-100.0, call.priority - reduction)  # clamp very low just in case

    # ---------- Selection Helpers ----------
    def _eligible_agents(self, call: Call) -> List[Agent]:
        return [a for a in self._agents.values() if a.is_available() and a.can_handle(call.required_skills)]

    def _try_sticky(self, call: Call) -> Optional[Agent]:
        # Prefer the last agent if suitable
        sticky_id = call.metadata.get("last_agent_id")
        if sticky_id:
            a = self._agents.get(sticky_id)
            if a and a.is_available() and a.can_handle(call.required_skills):
                return a
        return None

    def _pick_agent(self, call: Call) -> Optional[Agent]:
        # Sticky first
        sticky = self._try_sticky(call)
        if sticky:
            return sticky

        candidates = self._eligible_agents(call)
        if not candidates:
            return None

        # Choose most-senior rank that has candidates
        tiered: Dict[int, List[Agent]] = defaultdict(list)
        for a in candidates:
            tiered[a.seniority_rank].append(a)
        best_rank = min(tiered.keys())
        same_rank = tiered[best_rank]

        # Sort by scoring strategy
        same_rank.sort(key=lambda a: self.scoring.key(a, call))

        # Fair distribution within same rank/skills via round-robin
        skill_sig = tuple(sorted(call.required_skills.keys()))
        key = (best_rank, skill_sig)
        idx = self._round_robin_counters[key] % len(same_rank)
        self._round_robin_counters[key] += 1
        return same_rank[idx]

    def _partial_allowed(self) -> bool:
        if self._active_assignments_total == 0:
            return self.max_partial_fraction > 0
        frac = self._active_assignments_partial / float(self._active_assignments_total)
        return frac < self.max_partial_fraction - 1e-9

    def _find_best_partial_match(self, call: Call) -> Optional[Agent]:
        """
        Partial match if: (a) caller waited past SLA, (b) partial mix is within guardrails.
        We allow an agent that misses some required skills by at most `max_skill_deficit`.
        Score by (#skills_matched DESC, seniority ASC, proficiency DESC, load ASC, idle ASC).
        """
        if not self._partial_allowed():
            return None

        req = call.required_skills
        candidates = []
        for a in self._agents.values():
            if not a.is_available():
                continue
            # Compute matched and deficits
            matched, deficits = [], []
            for s, level in req.items():
                diff = a.skills.get(s, 0) - level
                if diff >= 0:
                    matched.append(s)
                elif -diff <= self.max_skill_deficit:
                    deficits.append((s, diff))  # negative diff
                else:
                    break  # too big a deficit; reject
            else:
                # passed per-skill deficit guardrail
                if matched:
                    candidates.append((
                        -len(matched),
                        a.seniority_rank,
                        -a.proficiency_score({s: req[s] for s in matched}, call.preferred_skills),
                        a.current_calls,
                        a.last_assigned_ts,
                        a
                    ))

        if not candidates:
            return None
        candidates.sort()
        return candidates[0][-1]

    def _assign_locked(self, call: Call, agent: Agent, *, partial: bool, now: float) -> Tuple[str, str]:
        # Assumes lock held
        agent.current_calls += 1
        agent.last_assigned_ts = now
        agent.state = AgentState.ONCALL
        # queue cleanup
        self._waiting_since.pop(call.id, None)
        self._call_store.pop(call.id, None)
        self._active_assignments_total += 1
        if partial:
            self._active_assignments_partial += 1

        self.metrics_hook("assigned", {
            "call_id": call.id,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "seniority_rank": agent.seniority_rank,
            "partial": partial
        })
        return call.id, agent.id

    # ---------- Routing ----------
    def try_route_once(self, now: Optional[float] = None) -> Optional[Tuple[str, str]]:
        with self._lock:
            if not self._global_queue:
                return None
            now = now or time.time()

            buffer = []
            assignment = None

            while self._global_queue:
                (_, call_id) = heapq.heappop(self._global_queue)
                call = self._call_store.get(call_id)
                if call is None:
                    continue

                # Recompute aging-based sort index
                eff = (self._effective_priority(call, now), call.arrival_ts)
                call.sort_index = eff

                # Primary: strict match
                agent = self._pick_agent(call)

                waited = now - self._waiting_since.get(call.id, call.arrival_ts)
                partial = False
                if agent is None and waited >= call.max_wait_seconds:
                    # SLA fallback: best partial match with guardrails
                    agent = self._find_best_partial_match(call)
                    partial = agent is not None

                if agent is not None:
                    assignment = self._assign_locked(call, agent, partial=partial, now=now)
                    break
                else:
                    buffer.append((eff, call_id))

            # Requeue unassigned calls
            for item in buffer:
                heapq.heappush(self._global_queue, item)

            return assignment

    def drain(self, limit: Optional[int] = None) -> List[Tuple[str, str]]:
        assigned = []
        n = 0
        while True:
            if limit is not None and n >= limit:
                break
            res = self.try_route_once()
            if res is None:
                break
            assigned.append(res)
            n += 1
        return assigned

    # ---------- Lifecycle ----------
    def complete_call(self, agent_id: str):
        """
        Mark 1 call complete for an agent, move to ACW, then back to AVAILABLE after acw_seconds.
        """
        def _to_available():
            with self._lock:
                a = self._agents.get(agent_id)
                if a and a.state == AgentState.ACW:
                    a.state = AgentState.AVAILABLE
                    self.metrics_hook("agent_available", {"agent_id": agent_id})

        with self._lock:
            a = self._agents[agent_id]
            prev_state = a.state
            a.current_calls = max(0, a.current_calls - 1)
            if self._active_assignments_total > 0:
                self._active_assignments_total -= 1
            if prev_state == AgentState.ONCALL:
                # The assignment might have been partial; we cannot tell here—ok to leave metric as-is.

                a.state = AgentState.ACW
                self.metrics_hook("agent_acw", {"agent_id": agent_id, "seconds": a.acw_seconds})
                t = threading.Timer(a.acw_seconds, _to_available)
                t.daemon = True
                t.start()
            else:
                # If called from a different state, just ensure availability if load is zero
                if a.current_calls == 0 and a.state not in (AgentState.PAUSED, AgentState.OFFLINE):
                    a.state = AgentState.AVAILABLE

    # ---------- Introspection ----------
    def pending_calls(self) -> int:
        with self._lock:
            return len(self._call_store)

    def queue_snapshot(self) -> List[str]:
        with self._lock:
            return [cid for (_, cid) in self._global_queue]

    def agent_snapshot(self) -> List[Dict]:
        with self._lock:
            out = []
            for a in sorted(self._agents.values(), key=lambda x: (x.seniority_rank, x.name)):
                out.append({
                    "name": a.name,
                    "id": a.id,
                    "state": a.state.name,
                    "seniority_rank": a.seniority_rank,
                    "skills": dict(a.skills),
                    "max_concurrent": a.max_concurrent,
                    "current_calls": a.current_calls,
                    "last_assigned_ts": a.last_assigned_ts
                })
            return out


# ---------------------------- Demo ----------------------------

def _demo():
    now = time.time()

    router = CallRouter(
        priority_aging_rate_per_min=0.08,
        max_partial_fraction=0.34,
        max_skill_deficit=1
    )

    # Agents (note states & concurrency)
    a1 = Agent(name="Alice",   seniority_rank=1, skills={"billing": 3, "tech_support": 2}, max_concurrent=2)
    a2 = Agent(name="Bob",     seniority_rank=2, skills={"billing": 2, "sales": 3},       max_concurrent=1)
    a3 = Agent(name="Chandra", seniority_rank=1, skills={"tech_support": 4, "sales": 1},  max_concurrent=1)
    a4 = Agent(name="Diego",   seniority_rank=3, skills={"billing": 5, "tech_support": 1},max_concurrent=2)

    for a in (a1, a2, a3, a4):
        router.add_agent(a)

    print("Initial Agents:")
    for s in router.agent_snapshot():
        print(s)

    # Calls: required + preferred + sticky example
    c1 = Call(priority=0, arrival_ts=now,     required_skills={"billing": 2}, preferred_skills={"sales": 1})
    c2 = Call(priority=1, arrival_ts=now+1,   required_skills={"tech_support": 3}, preferred_skills={"billing": 2})
    c3 = Call(priority=2, arrival_ts=now+2,   required_skills={"sales": 2})
    c4 = Call(priority=1, arrival_ts=now+3,   required_skills={"billing": 4})  # hard billing
    c5 = Call(priority=1, arrival_ts=now+4,   required_skills={"tech_support": 5}, max_wait_seconds=0)  # force partial
    c6 = Call(priority=2, arrival_ts=now+5,   required_skills={"billing": 2}, metadata={"last_agent_id": a1.id})  # sticky

    for c in (c1, c2, c3, c4, c5, c6):
        router.enqueue_call(c)

    print("\nRouting...")
    assigned = router.drain()
    for call_id, agent_id in assigned:
        agent = next(ag for ag in (a1, a2, a3, a4) if ag.id == agent_id)
        # quick peek of call skills
        call = None
        for cc in (c1, c2, c3, c4, c5, c6):
            if cc.id == call_id:
                call = cc
                break
        print(f"Assigned Call({call.required_skills}, priority={call.priority}) -> Agent({agent.name}, rank={agent.seniority_rank}, state={agent.state.name})")

    print("\nAgents after assignment:")
    for s in router.agent_snapshot():
        print(s)

    # Complete one call to free capacity and demonstrate ACW→AVAILABLE
    print("\nCompleting one call for Alice → ACW → AVAILABLE...")
    router.complete_call(a1.id)
    time.sleep(a1.acw_seconds + 0.1)  # wait for the ACW timer in demo
    print("Alice state now:", next(s for s in router.agent_snapshot() if s["name"] == "Alice")["state"])

    print("\nRe-routing any remaining calls...")
    assigned2 = router.drain()
    for call_id, agent_id in assigned2:
        agent = next(ag for ag in (a1, a2, a3, a4) if ag.id == agent_id)
        call = None
        for cc in (c1, c2, c3, c4, c5, c6):
            if cc.id == call_id:
                call = cc
                break
        print(f"Assigned Call({call.required_skills}, priority={call.priority}) -> Agent({agent.name}, rank={agent.seniority_rank}, state={agent.state.name})")

    print("\nPending calls in queue:", router.pending_calls())


if __name__ == "__main__":
    _demo()
