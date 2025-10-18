#!/usr/bin/env python3
"""
Mail Center Router (Aisles + 24 Bags each)
------------------------------------------
- 26 aisles: A..Z
- Any size can go to any aisle
- Default capacity: 100 per aisle
- 25% of aisles (6) limited to 80 capacity
- Each aisle has 24 bags labeled "01".."24"
- Bag capacities are balanced to sum to the aisle capacity
- Region-preferred bands with spillover

Outputs per package: ID, Size, Region, Aisle, Bag, Reason.
"""

from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Tuple, Optional
import re

# -----------------------------
# Config
# -----------------------------

class Size(Enum):
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"
    OVERSIZE = "OVERSIZE"

class Region(Enum):
    EAST = "EAST"
    CENTRAL = "CENTRAL"
    WEST = "WEST"
    INTL = "INTL"
    UNKNOWN = "UNKNOWN"

# Size thresholds (tweak as needed)
SIZE_LIMITS = {
    Size.SMALL:  {"max_dim": 12, "max_weight": 2},
    Size.MEDIUM: {"max_dim": 24, "max_weight": 20},
    Size.LARGE:  {"max_dim": 36, "max_weight": 70},
    # else OVERSIZE
}

# Aisles A..Z
AISLES: List[str] = [chr(c) for c in range(ord('A'), ord('Z') + 1)]

# Capacity: default 100, last 6 aisles constrained to 80 (≈25% of 26)
LOW_CAP_COUNT = len(AISLES) // 4  # 26//4 = 6
LOW_CAP_AISLES = AISLES[-LOW_CAP_COUNT:]  # ['U','V','W','X','Y','Z']
DEFAULT_CAPACITY = 100
LOW_CAPACITY = 80

# Fixed bag labels per aisle
BAG_LABELS: List[str] = [f"{i:02d}" for i in range(1, 25)]  # "01".."24"

# Region → preferred aisle bands (tweak freely)
PREFERRED_GROUPS: Dict[Region, List[List[str]]] = {
    Region.EAST:    [AISLES[0:6]],     # A-F
    Region.CENTRAL: [AISLES[6:12]],    # G-L
    Region.WEST:    [AISLES[12:18]],   # M-R
    Region.INTL:    [AISLES[18:26]],   # S-Z
    Region.UNKNOWN: [AISLES],          # unknown: try anywhere
}
ALL_GROUPS_SEQUENCE: List[List[str]] = [AISLES[0:6], AISLES[6:12], AISLES[12:18], AISLES[18:26]]

# -----------------------------
# Data model
# -----------------------------

@dataclass(frozen=True)
class Box:
    id: str
    length_in: float
    width_in: float
    height_in: float
    weight_lb: float
    destination: str  # ZIP or country text

@dataclass
class RoutingDecision:
    aisle: Optional[str]   # None if cannot place
    bag: Optional[str]     # None if cannot place
    size: Size
    region: Region
    reason: str

# -----------------------------
# Helpers
# -----------------------------

ZIP_RE = re.compile(r"^\s*(\d{5})\s*$")

def compute_size(length: float, width: float, height: float, weight: float) -> Size:
    max_dim = max(length, width, height)
    for bucket, limits in SIZE_LIMITS.items():
        if max_dim <= limits["max_dim"] and weight <= limits["max_weight"]:
            return bucket
    return Size.OVERSIZE

def derive_region(destination: str) -> Region:
    if not destination or not destination.strip():
        return Region.UNKNOWN
    m = ZIP_RE.match(destination)
    if m:
        first = m.group(1)[0]
        if first in "0123":
            return Region.EAST
        if first in "456":
            return Region.CENTRAL
        if first in "789":
            return Region.WEST
        return Region.UNKNOWN
    return Region.INTL

# -----------------------------
# Aisle + Bag Manager
# -----------------------------

class AisleManager:
    """
    Tracks capacities at aisle and bag level.
    Each aisle has 24 bags; bag capacities are balanced to sum to aisle capacity.
    """
    def __init__(self, aisles: List[str]):
        # Aisle total capacities
        self.aisle_capacity: Dict[str, int] = {
            a: (LOW_CAPACITY if a in LOW_CAP_AISLES else DEFAULT_CAPACITY) for a in aisles
        }
        self.aisle_load: Dict[str, int] = {a: 0 for a in aisles}

        # Per-bag capacities & loads, balanced across 24 bags
        self.bag_capacity: Dict[str, Dict[str, int]] = {}
        self.bag_load: Dict[str, Dict[str, int]] = {}

        for a in aisles:
            cap = self.aisle_capacity[a]
            base = cap // len(BAG_LABELS)
            remainder = cap % len(BAG_LABELS)  # first `remainder` bags get +1
            caps = {}
            for i, label in enumerate(BAG_LABELS):
                caps[label] = base + (1 if i < remainder else 0)
            self.bag_capacity[a] = caps
            self.bag_load[a] = {label: 0 for label in BAG_LABELS}

    # Aisle capacity checks
    def aisle_has_space(self, aisle: str) -> bool:
        return self.aisle_load[aisle] < self.aisle_capacity[aisle]

    def first_aisle_with_space(self, candidates: List[str]) -> Optional[str]:
        for a in candidates:
            if self.aisle_has_space(a) and self.first_bag_with_space(a) is not None:
                return a
        return None

    # Bag placement
    def first_bag_with_space(self, aisle: str) -> Optional[str]:
        for label in BAG_LABELS:
            if self.bag_load[aisle][label] < self.bag_capacity[aisle][label]:
                return label
        return None

    def place(self, aisle: str, bag: str) -> None:
        if not self.aisle_has_space(aisle):
            raise RuntimeError(f"Aisle {aisle} is full")
        if bag not in self.bag_load[aisle]:
            raise RuntimeError(f"Bag {bag} does not exist in aisle {aisle}")
        if self.bag_load[aisle][bag] >= self.bag_capacity[aisle][bag]:
            raise RuntimeError(f"Bag {aisle}-{bag} is full")
        self.bag_load[aisle][bag] += 1
        self.aisle_load[aisle] += 1

    def global_first_with_space(self) -> Optional[Tuple[str, str]]:
        for a in AISLES:
            b = self.first_bag_with_space(a)
            if b is not None:
                return a, b
        return None

    def snapshot(self) -> str:
        # Compact utilization snapshot per aisle (e.g., A:17/100, B:23/100, ...)
        parts = []
        for a in AISLES:
            parts.append(f"{a}:{self.aisle_load[a]}/{self.aisle_capacity[a]}")
        return " ".join(parts)

    def top_bag_snapshot(self, aisle: str, n: int = 6) -> str:
        # Show first n bags’ load/cap for a quick glance
        items = [f"{label}:{self.bag_load[aisle][label]}/{self.bag_capacity[aisle][label]}" for label in BAG_LABELS[:n]]
        return f"{aisle}[" + " ".join(items) + " ...]"

# -----------------------------
# Router
# -----------------------------

def candidate_groups_for(region: Region) -> List[List[str]]:
    primary = PREFERRED_GROUPS.get(region, [AISLES])
    remaining = [g for g in ALL_GROUPS_SEQUENCE if g not in primary]
    return primary + remaining

def route_box(box: Box, am: AisleManager) -> RoutingDecision:
    size = compute_size(box.length_in, box.width_in, box.height_in, box.weight_lb)
    region = derive_region(box.destination)
    tried: List[str] = []

    for group in candidate_groups_for(region):
        a = am.first_aisle_with_space(group)
        band = f"{group[0]}-{group[-1]}"
        if a:
            b = am.first_bag_with_space(a)
            am.place(a, b)
            return RoutingDecision(
                aisle=a,
                bag=b,
                size=size,
                region=region,
                reason=f"{size.value}/{region.value} → band {band}, placed at {a}-{b}"
            )
        tried.append(f"{band} full")

    # Global fallback
    fallback = am.global_first_with_space()
    if fallback:
        a, b = fallback
        am.place(a, b)
        return RoutingDecision(
            aisle=a,
            bag=b,
            size=size,
            region=region,
            reason=f"{size.value}/{region.value} → global fallback, placed at {a}-{b} (preferred full: {'; '.join(tried)})"
        )

    return RoutingDecision(
        aisle=None,
        bag=None,
        size=size,
        region=region,
        reason="All aisles and bags are at capacity — cannot place"
    )

# -----------------------------
# Demo data (in-script)
# -----------------------------

DEMO_PACKAGES: List[Box] = [
    Box("P-001", 10, 7, 4, 1.2, "02139"),   # EAST
    Box("P-002", 22, 12, 8, 12.0, "60601"), # CENTRAL
    Box("P-003", 28, 19, 12, 18.0, "94105"),# WEST (LARGE)
    Box("P-004", 40, 20, 20, 30.0, "10001"),# OVERSIZE, EAST
    Box("P-005", 9, 9, 9, 1.0, "Germany"),  # INTL
    Box("P-006", 24, 24, 24, 70.0, "85001"),# WEST (LARGE)
    Box("P-007", 15, 10, 4, 25.0, "99999"), # WEST (LARGE by weight)
    Box("P-008", 10, 8, 4, 1.3, ""),        # UNKNOWN
] + [
    # Bulk loads to exercise distribution into bags
    Box(f"BULK-E-{i:03d}", 12, 10, 6, 5.0, "01234") for i in range(110)
] + [
    Box(f"BULK-W-{i:03d}", 20, 14, 10, 12.0, "90001") for i in range(110)
] + [
    Box(f"BULK-I-{i:03d}", 8, 6, 4, 1.0, "Canada") for i in range(70)
]

# -----------------------------
# Runner
# -----------------------------

def main():
    am = AisleManager(AISLES)
    results: List[Tuple[Box, RoutingDecision]] = []

    for box in DEMO_PACKAGES:
        decision = route_box(box, am)
        results.append((box, decision))

    # Print a sample of routes
    print(f"{'ID':<12} {'Size':<9} {'Region':<8} {'Aisle':<6} {'Bag':<4} Reason")
    print("-" * 100)
    show = min(50, len(results))
    for box, d in results[:show]:
        aisle = d.aisle or "NONE"
        bag = d.bag or "--"
        print(f"{box.id:<12} {d.size.value:<9} {d.region.value:<8} {aisle:<6} {bag:<4} {d.reason}")
    if len(results) > show:
        print(f"... ({len(results)-show} more routed not shown)")

    # Capacity snapshots
    print("\nAisle totals (load/cap):")
    print(am.snapshot())

    # Peek into a couple aisles’ first 6 bags
    print("\nBag snapshots:")
    for a in ("A", "M", "S", "Z"):
        print(am.top_bag_snapshot(a))

    # Report any failures
    failures = [r for _, r in results if r.aisle is None]
    if failures:
        print(f"\nUNPLACED: {len(failures)} (no remaining capacity)")
    else:
        print("\nAll packages placed within aisle & bag capacity constraints.")

if __name__ == "__main__":
    main()
