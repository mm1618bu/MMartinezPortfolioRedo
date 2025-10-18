"""
Secret Santa matcher with role-based constraints.

Features:
- No one can draw themselves.
- Role constraints (e.g., Managers cannot draw Directors, interns can't draw interns, etc.).
- Optional constraints:
    * no_same_role: block gifting to someone with the same role
    * no_same_team: block gifting within the same team
    * no_same_household: block gifting within the same household
- Deterministic runs with a seed.
- Clear error message if a valid assignment cannot be found.

Customize:
- Edit PARTICIPANTS below.
- Edit CONSTRAINT_CONFIG to fit your org’s rules.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Set
import random

# ----------------------------
# Data model
# ----------------------------
@dataclass(frozen=True)
class Person:
    name: str
    role: str
    team: Optional[str] = None
    household: Optional[str] = None  # e.g., "SmithHome" to avoid matching people who live together

# ----------------------------
# Example input data
# ----------------------------
PARTICIPANTS: List[Person] = [
    Person("Alice Johnson",  role="Engineer", team="Platform", household="H1"),
    Person("Bob Brown",      role="Engineer", team="Platform", household=None),
    Person("Carol Smith",    role="Designer", team="Product",  household="H2"),
    Person("David Lee",      role="Engineer", team="Infra",    household=None),
    Person("Erin Davis",     role="Manager",  team="Platform", household="H1"),
    Person("Frank Moore",    role="Manager",  team="Product",  household=None),
    Person("Gina Patel",     role="Intern",   team="Platform", household=None),
    Person("Hector Chan",    role="Director", team="Product",  household="H2"),
]

# ----------------------------
# Constraint configuration
# ----------------------------
CONSTRAINT_CONFIG = {
    # If a giver has role X, they cannot draw anyone whose role is in incompatible_roles[X]
    # (Use an empty list for roles without special restrictions.)
    "incompatible_roles": {
        "Manager":  ["Director"],   # Managers cannot draw Directors
        "Director": ["Director"],   # Directors cannot draw Directors
        "Intern":   ["Intern"],     # Interns cannot draw Interns
        # Add more as needed, e.g.:
        # "Engineer": []
    },

    # Optional global toggles
    "no_same_role": False,       # If True, blocks giver->receiver when roles are equal
    "no_same_team": True,        # If True, blocks matches within the same team
    "no_same_household": True,   # If True, blocks matches within the same household

    # Random seed for reproducibility (set to None for fresh randomness each run)
    "seed": 42,
}

# ----------------------------
# Core logic
# ----------------------------
def is_valid_pair(giver: Person, receiver: Person, cfg: Dict) -> bool:
    if giver is receiver:
        return False  # no self

    # Role incompatibilities
    incompatible_roles: Dict[str, List[str]] = cfg.get("incompatible_roles", {})
    forbidden_for_giver: List[str] = incompatible_roles.get(giver.role, [])
    if receiver.role in forbidden_for_giver:
        return False

    # Optional toggles
    if cfg.get("no_same_role", False) and giver.role == receiver.role:
        return False
    if cfg.get("no_same_team", False) and giver.team and giver.team == receiver.team:
        return False
    if cfg.get("no_same_household", False) and giver.household and giver.household == receiver.household:
        return False

    return True


def build_options(people: List[Person], cfg: Dict) -> Dict[Person, List[Person]]:
    options: Dict[Person, List[Person]] = {}
    for g in people:
        cand = [r for r in people if is_valid_pair(g, r, cfg)]
        options[g] = cand
    return options


def backtrack_assign(
    givers_sorted: List[Person],
    options: Dict[Person, List[Person]],
    used_receivers: Set[Person],
    assignment: Dict[Person, Person],
) -> bool:
    # If all givers assigned, success
    if len(assignment) == len(givers_sorted):
        return True

    giver = givers_sorted[len(assignment)]

    # Try receivers that are not used yet
    for r in options[giver]:
        if r not in used_receivers:
            assignment[giver] = r
            used_receivers.add(r)
            if backtrack_assign(givers_sorted, options, used_receivers, assignment):
                return True
            # backtrack
            used_receivers.remove(r)
            del assignment[giver]
    return False


def make_secret_santa_pairs(
    people: List[Person],
    cfg: Dict,
    shuffle_candidates: bool = True,
) -> Dict[str, str]:
    if cfg.get("seed") is not None:
        random.seed(cfg["seed"])

    # Precompute options per giver
    opts = build_options(people, cfg)

    # Quick feasibility check: every giver must have at least one option
    for g, cands in opts.items():
        if not cands:
            raise ValueError(
                f"No valid recipients for giver '{g.name}'. "
                f"Loosen constraints or adjust participants."
            )

    # Heuristic: sort givers by fewest options (MRV: minimum remaining values)
    givers_sorted = sorted(people, key=lambda p: len(opts[p]))

    # Optionally shuffle candidate lists to get varied results with same constraints
    if shuffle_candidates:
        for g in opts:
            random.shuffle(opts[g])

    assignment: Dict[Person, Person] = {}
    success = backtrack_assign(givers_sorted, opts, set(), assignment)
    if not success:
        raise RuntimeError(
            "Could not find a valid Secret Santa assignment with the given constraints."
        )

    # Convert to a neat {giver_name: receiver_name} dict
    return {g.name: r.name for g, r in assignment.items()}

# ----------------------------
# Pretty-print utility
# ----------------------------
def print_pairs(pairs: Dict[str, str], people: List[Person]) -> None:
    # Make a quick role lookup for clarity
    role_of = {p.name: p.role for p in people}
    team_of = {p.name: p.team for p in people}
    for giver, receiver in sorted(pairs.items(), key=lambda kv: kv[0]):
        print(f"- {giver} ({role_of[giver]}, {team_of[giver]}) ➜ {receiver} ({role_of[receiver]}, {team_of[receiver]})")


# ----------------------------
# Run example
# ----------------------------
if __name__ == "__main__":
    pairs = make_secret_santa_pairs(PARTICIPANTS, CONSTRAINT_CONFIG, shuffle_candidates=True)
    print("Secret Santa Pairs")
    print("===================")
    print_pairs(pairs, PARTICIPANTS)
