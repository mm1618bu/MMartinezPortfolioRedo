#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
VTO / VET / MET Offer Planner — Ultra
-------------------------------------
Multi-warehouse labor planner with hourly demand curves, skill-mix capacity,
cross-site balancing, cost ceiling, and rich guardrails.

No external libraries required.
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple
import math, json, csv

# ----------------- Small CLI helpers -----------------
def ask_int(prompt: str, default: int=None, min_val: int=None) -> int:
    while True:
        raw = input(f"{prompt} " + (f"[default {default}]: " if default is not None else ": ")).strip()
        if not raw:
            if default is not None: return default
            print("Enter a number."); continue
        try:
            v = int(raw)
            if min_val is not None and v < min_val:
                print(f"Enter >= {min_val}"); continue
            return v
        except ValueError:
            print("Invalid integer.")

def ask_float(prompt: str, default: float=None, min_val: float=None) -> float:
    while True:
        raw = input(f"{prompt} " + (f"[default {default}]: " if default is not None else ": ")).strip()
        if not raw:
            if default is not None: return float(default)
            print("Enter a number."); continue
        try:
            v = float(raw)
            if min_val is not None and v < min_val:
                print(f"Enter >= {min_val}"); continue
            return v
        except ValueError:
            print("Invalid number.")

def ask_str(prompt: str, default: str=None) -> str:
    raw = input(f"{prompt} " + (f"[default '{default}']: " if default is not None else ": ")).strip()
    return raw if raw else (default if default is not None else "")

def yes_no(prompt: str, default_yes: bool=True) -> bool:
    tag = "Y/n" if default_yes else "y/N"
    while True:
        raw = input(f"{prompt} [{tag}]: ").strip().lower()
        if not raw: return default_yes
        if raw in ("y","yes"): return True
        if raw in ("n","no"): return False
        print("Please answer y or n.")

# ----------------- Data models -----------------
@dataclass
class SkillModel:
    name: str
    pph: float  # productivity per hour (packages/hr per person)
    mix_pct: float  # share of volume for this skill (0..1)

@dataclass
class SiteInput:
    name: str
    projected_volume: int
    scheduled_headcount: int
    hours_in_window: int = None            # integer hours in window (override)
    demand_curve: List[float] = None       # list of hour shares summing to 1.0
    skills: List[SkillModel] = None        # optional override of skill mix/productivity
    vto_blackout: bool = False             # if True, no VTO allowed
    buffer_pct: float = None               # optional override (0..1)

@dataclass
class Global:
    # Hours, curve, skills
    hours_in_window: int
    demand_curve: List[float]              # length == hours, sums to ~1.0
    skills: List[SkillModel]
    # Guardrails & policy
    buffer_pct: float
    round_up_required: bool
    vto_cap_pct_sched: float
    min_staff_floor_pct: float
    min_staff_floor_abs: int
    vet_cap_pct_sched: float
    met_cap_pct_req: float
    # Cost model
    wage_hourly: float
    vet_mult: float
    met_mult: float
    # Network behaviors
    prefer_vet_over_met: bool
    allow_cross_site_rebalance: bool
    transfer_cap_pct_sched: float          # max portion of a site's scheduled that can be transferred out
    # Budget
    delta_cost_ceiling: float              # absolute $; if negative or 0 => no ceiling

@dataclass
class SitePlan:
    name: str
    peak_required_headcount: int
    scheduled_headcount: int
    surplus_before_vto: int
    vto_offers: int
    post_vto_headcount: int
    deficit_after_vto: int
    vet_offers: int
    met_offers: int
    uncovered_deficit: int
    xfer_out: int
    xfer_in: int
    notes: str
    cost_baseline: float
    cost_with_plan: float
    cost_delta: float

# ----------------- Curves & Scenarios -----------------
CURVES = {
    "flat": lambda H: [1.0/H]*H,
    "am_peak": lambda H: _normalize([2 if i < H//3 else 1 for i in range(H)]),
    "pm_peak": lambda H: _normalize([1 if i < H//3*2 else 2 for i in range(H)]),
    "double_peak": lambda H: _normalize([2 if i in _double_peaks(H) else 1 for i in range(H)]),
}
def _double_peaks(H:int)->List[int]:
    return list(range(max(0,H//5), max(0,H//5)+max(1,H//10))) + list(range(max(0,H//5*3), max(0,H//5*3)+max(1,H//10)))
def _normalize(arr: List[float]) -> List[float]:
    s = float(sum(arr)) or 1.0
    return [x/s for x in arr]

DEFAULT_SKILLS = [
    SkillModel("Core", 200.0, 0.75),
    SkillModel("PIT", 180.0, 0.20),
    SkillModel("ProblemSolve", 120.0, 0.05),
]

# ----------------- Core computations -----------------
def headcount_per_hour(volume_total: int, hours: int, curve: List[float], skills: List[SkillModel], buffer_pct: float, round_up: bool) -> List[int]:
    req = []
    for h in range(hours):
        vol_h = volume_total * curve[h]
        # required people this hour = sum over skills of (vol_h * mix / pph_skill)
        need = 0.0
        for s in skills:
            vol_skill_h = vol_h * max(0.0, s.mix_pct)
            if s.pph <= 0: continue
            need += vol_skill_h / s.pph
        need *= (1.0 + max(0.0, buffer_pct))
        req.append(int(math.ceil(need)) if round_up else max(0, int(round(need))))
    return req

def clamp_vto(scheduled: int, required_peak: int, cap_pct: float, floor_pct: float, floor_abs: int, vto_blackout: bool) -> int:
    if vto_blackout: return 0
    surplus = max(0, scheduled - required_peak)
    cap = int(math.floor(max(0.0, cap_pct) * scheduled))
    floor_pct_people = int(math.ceil(max(0.0, floor_pct) * scheduled))
    floor_people = max(floor_abs, floor_pct_people, required_peak)
    max_by_floor = max(0, scheduled - floor_people)
    return min(surplus, cap, max_by_floor)

def vet_met_split(deficit: int, scheduled:int, required:int, vet_cap_pct: float, met_cap_pct: float, prefer_vet: bool) -> Tuple[int,int,int]:
    if deficit <= 0: return 0, 0, 0
    vet_cap = int(math.floor(max(0.0, vet_cap_pct) * scheduled))
    met_cap = int(math.floor(max(0.0, met_cap_pct) * max(1, required)))
    if prefer_vet:
        vet = min(deficit, vet_cap)
        rem = deficit - vet
        met = min(rem, met_cap)
    else:
        met = min(deficit, met_cap)
        rem = deficit - met
        vet = min(rem, vet_cap)
    leftover = deficit - vet - met
    return max(0,vet), max(0,met), max(0,leftover)

def costs(hours:int, wage:float, vet_mult:float, met_mult:float, scheduled:int, vto:int, vet:int, met:int) -> Tuple[float,float]:
    baseline = scheduled * hours * wage
    staffed = max(0, scheduled - vto + vet + met)
    base_cost = staffed * hours * wage
    vet_prem = vet * hours * wage * (max(1.0, vet_mult)-1.0)
    met_prem = met * hours * wage * (max(1.0, met_mult)-1.0)
    return baseline, base_cost + vet_prem + met_prem

# ----------------- Cross-site rebalance -----------------
def suggest_transfers(plans: List[SitePlan], transfer_cap_pct_sched: float) -> None:
    # Collect donors (post-VTO surplus) and takers (deficit before VET/MET)
    donors = []
    takers = []
    for p in plans:
        donor_cap = int(math.floor(transfer_cap_pct_sched * p.scheduled_headcount))
        surplus_post_vto = max(0, p.post_vto_headcount - p.peak_required_headcount)
        donate = min(surplus_post_vto, donor_cap)
        if donate > 0:
            donors.append([p, donate])
        if p.deficit_after_vto > 0:
            takers.append([p, p.deficit_after_vto])

    # Greedy match
    for t in takers:
        need = t[1]
        for d in donors:
            if need <= 0: break
            give = min(need, d[1])
            if give <= 0: continue
            # Apply transfer
            d[1] -= give
            t[1] -= give
            d[0].xfer_out += give
            t[0].xfer_in += give
            d[0].post_vto_headcount -= give
            t[0].post_vto_headcount += give
            # Update their deficits
            d[0].deficit_after_vto = max(0, d[0].peak_required_headcount - d[0].post_vto_headcount)
            t[0].deficit_after_vto = max(0, t[0].peak_required_headcount - t[0].post_vto_headcount)

# ----------------- Budget scaling -----------------
def apply_budget_ceiling(plans: List[SitePlan], hours:int, wage:float, vet_mult:float, met_mult:float, ceiling: float) -> None:
    """
    If total delta cost exceeds ceiling, scale down MET proportionally (then VET if still needed).
    Leaves uncovered_deficit if budget binds.
    """
    if ceiling <= 0: return
    total_delta = sum(p.cost_delta for p in plans)
    if total_delta <= ceiling: return

    # How much to cut
    to_cut = total_delta - ceiling

    # First cut MET across sites proportionally to their MET counts
    total_met = sum(p.met_offers for p in plans)
    if total_met > 0 and to_cut > 0:
        for p in plans:
            if p.met_offers <= 0: continue
            # Cost per MET head (approx)
            per_cost = hours * wage * (max(1.0, met_mult) - 1.0)
            alloc_cut = min(p.met_offers, int(math.floor((p.met_offers/total_met) * (to_cut / max(per_cost,1e-9)))))
            if alloc_cut > 0:
                p.met_offers -= alloc_cut
                p.uncovered_deficit += alloc_cut
                # Recompute plan cost deltas
                b, t = costs(hours, wage, vet_mult, met_mult, p.scheduled_headcount, p.vto_offers, p.vet_offers, p.met_offers)
                p.cost_baseline, p.cost_with_plan, p.cost_delta = b, t, t-b
        # Re-evaluate leftover to_cut
        total_delta = sum(p.cost_delta for p in plans)
        to_cut = max(0.0, total_delta - ceiling)

    # If still over budget, cut VET similarly
    total_vet = sum(p.vet_offers for p in plans)
    if total_vet > 0 and to_cut > 0:
        for p in plans:
            if p.vet_offers <= 0: continue
            per_cost = hours * wage * (max(1.0, vet_mult) - 1.0)
            alloc_cut = min(p.vet_offers, int(math.floor((p.vet_offers/total_vet) * (to_cut / max(per_cost,1e-9)))))
            if alloc_cut > 0:
                p.vet_offers -= alloc_cut
                p.uncovered_deficit += alloc_cut
                b, t = costs(hours, wage, vet_mult, met_mult, p.scheduled_headcount, p.vto_offers, p.vet_offers, p.met_offers)
                p.cost_baseline, p.cost_with_plan, p.cost_delta = b, t, t-b

# ----------------- Printing & export -----------------
def print_site_table(rows: List[SitePlan]) -> None:
    headers = ["Warehouse","Req(peak)","Sched","Surp(Before VTO)","VTO","Post-VTO","Def","Xfer In","Xfer Out","VET","MET","Uncov","Δ$","Notes"]
    data = []
    for r in rows:
        data.append([
            r.name,
            str(r.peak_required_headcount),
            str(r.scheduled_headcount),
            str(r.surplus_before_vto),
            str(r.vto_offers),
            str(r.post_vto_headcount),
            str(r.deficit_after_vto),
            str(r.xfer_in),
            str(r.xfer_out),
            str(r.vet_offers),
            str(r.met_offers),
            str(r.uncovered_deficit),
            f"{r.cost_delta:+.2f}",
            (r.notes or "-")
        ])
    widths = [len(h) for h in headers]
    for row in data:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))
    def fmt(vals): return " | ".join(vals[i].ljust(widths[i]) for i in range(len(vals)))
    sep = "-+-".join("-"*w for w in widths)
    print("\n" + fmt(headers))
    print(sep)
    for row in data:
        print(fmt(row))

def print_totals(rows: List[SitePlan]) -> None:
    req = sum(r.peak_required_headcount for r in rows)
    sched = sum(r.scheduled_headcount for r in rows)
    vto = sum(r.vto_offers for r in rows)
    vet = sum(r.vet_offers for r in rows)
    met = sum(r.met_offers for r in rows)
    x_in = sum(r.xfer_in for r in rows)
    x_out = sum(r.xfer_out for r in rows)
    unc = sum(r.uncovered_deficit for r in rows)
    delta = sum(r.cost_delta for r in rows)
    print("\n--- Network Totals ---")
    print(f"Peak Required: {req}")
    print(f"Scheduled:     {sched}")
    print(f"VTO:           {vto}")
    print(f"Transfers:     +{x_in} / -{x_out} (net {x_in - x_out})")
    print(f"VET:           {vet}")
    print(f"MET:           {met}")
    print(f"Uncovered:     {unc}")
    print(f"Δ Cost ($):    {delta:+.2f}")

def export_json(rows: List[SitePlan], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump([asdict(r) for r in rows], f, indent=2)

def export_csv(rows: List[SitePlan], path: str) -> None:
    fields = ["name","peak_required_headcount","scheduled_headcount","surplus_before_vto","vto_offers","post_vto_headcount","deficit_after_vto","xfer_in","xfer_out","vet_offers","met_offers","uncovered_deficit","cost_baseline","cost_with_plan","cost_delta","notes"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(asdict(r))

# ----------------- CLI Flow -----------------
def main():
    print("\n=== VTO / VET / MET Offer Planner — Ultra ===\n")

    # Scenario-like quick setup
    hours = ask_int("Hours in planning window (integer)", default=10, min_val=1)
    curve_choice = ask_str("Demand curve (flat / am_peak / pm_peak / double_peak / custom)", default="flat").lower()
    if curve_choice in CURVES:
        curve = CURVES[curve_choice](hours)
    else:
        print(f"Enter {hours} comma-separated hour weights (will be normalized). Example: 1,1,2,2,1,1,1,1,1,1")
        parts = [p.strip() for p in ask_str("Weights").split(",")]
        arr = []
        for p in parts:
            try: arr.append(float(p))
            except: arr.append(1.0)
        if len(arr) != hours:
            print("Length mismatch; falling back to flat.")
            curve = CURVES["flat"](hours)
        else:
            curve = _normalize(arr)

    # Global skills (override per-site later if desired)
    print("\nDefault skill model (you can override per site):")
    skills = DEFAULT_SKILLS.copy()
    if yes_no("Change default skills/productivity/mix?", default_yes=False):
        skills = []
        k = ask_int("How many skills?", default=3, min_val=1)
        for i in range(1, k+1):
            nm = ask_str(f"  Skill {i} name", default=f"Skill{i}")
            pph = ask_float(f"  {nm} productivity (packages/hr)", default=200.0, min_val=1e-6)
            mix = ask_float(f"  {nm} volume mix (0..1)", default=round(1.0/k,3), min_val=0.0)
            skills.append(SkillModel(nm, pph, mix))
        # Normalize mix
        s = sum(max(0.0, s.mix_pct) for s in skills) or 1.0
        for s in skills: s.mix_pct = max(0.0, s.mix_pct) / s

    buffer_pct = ask_float("Safety buffer on required headcount (0..1)", default=0.08, min_val=0.0)
    round_up = yes_no("Round required headcount up?", True)

    # Guardrails
    vto_cap = ask_float("Max % of scheduled allowed to take VTO (0..1)", default=0.25, min_val=0.0)
    floor_pct = ask_float("Minimum staffing floor as % of scheduled (0..1)", default=0.60, min_val=0.0)
    floor_abs = ask_int("Absolute staffing floor (people)", default=10, min_val=0)

    vet_cap = ask_float("VET cap as % of scheduled (0..1)", default=0.20, min_val=0.0)
    met_cap = ask_float("MET cap as % of REQUIRED (0..1)", default=0.60, min_val=0.0)
    prefer_vet = yes_no("Prefer VET over MET when covering deficits?", True)

    # Cost
    wage = ask_float("Baseline hourly wage ($/hr)", default=20.0, min_val=0.0)
    vet_mult = ask_float("VET premium multiplier (>=1.0)", default=1.25, min_val=1.0)
    met_mult = ask_float("MET premium multiplier (>=1.0)", default=1.50, min_val=1.0)
    ceiling = ask_float("Δ Cost budget ceiling ($, 0 for no ceiling)", default=0.0, min_val=0.0)

    # Network behaviors
    rebalance = yes_no("Allow cross-site rebalancing before VET/MET?", True)
    transfer_cap = ask_float("Max transfer out as % of scheduled (0..1)", default=0.10, min_val=0.0)

    g = Global(
        hours_in_window=hours,
        demand_curve=curve,
        skills=skills,
        buffer_pct=buffer_pct,
        round_up_required=round_up,
        vto_cap_pct_sched=vto_cap,
        min_staff_floor_pct=floor_pct,
        min_staff_floor_abs=floor_abs,
        vet_cap_pct_sched=vet_cap,
        met_cap_pct_req=met_cap,
        wage_hourly=wage,
        vet_mult=vet_mult,
        met_mult=met_mult,
        prefer_vet_over_met=prefer_vet,
        allow_cross_site_rebalance=rebalance,
        transfer_cap_pct_sched=transfer_cap,
        delta_cost_ceiling=ceiling,
    )

    # Sites
    n = ask_int("\nHow many warehouses?", default=12, min_val=1)
    sites: List[SiteInput] = []
    print("\nEnter per-warehouse inputs. (Press Enter to accept defaults.)")
    for i in range(1, n+1):
        print(f"\n--- Warehouse {i} ---")
        name = ask_str("Name", default=f"WH_{i:02d}")
        vol = ask_int("Projected total volume for window (packages)", default=50000, min_val=0)
        sched = ask_int("Scheduled headcount (people)", default=250, min_val=0)

        # Per-site overrides
        h_override = None
        curve_override = None
        skills_override = None
        buf_override = None
        if yes_no("Override hours/curve/skills/buffer for this site?", False):
            if yes_no("  Override hours?", False):
                h_override = ask_int("    Hours", default=hours, min_val=1)
            if yes_no("  Override demand curve?", False):
                h2 = h_override if h_override is not None else hours
                c = ask_str(f"    Curve type (flat/am_peak/pm_peak/double_peak/custom)", default="flat").lower()
                if c in CURVES:
                    curve_override = CURVES[c](h2)
                else:
                    print(f"    Enter {h2} weights, comma-separated (will normalize).")
                    parts = [p.strip() for p in ask_str("    Weights").split(",")]
                    arr = []
                    for p in parts:
                        try: arr.append(float(p))
                        except: arr.append(1.0)
                    if len(arr) != h2: curve_override = CURVES["flat"](h2)
                    else: curve_override = _normalize(arr)
            if yes_no("  Override skills?", False):
                k = ask_int("    How many skills?", default=len(skills), min_val=1)
                tmp = []
                for j in range(1,k+1):
                    nm = ask_str(f"    Skill {j} name", default=f"Skill{j}")
                    pph = ask_float(f"    {nm} pph", default=200.0, min_val=1e-6)
                    mix = ask_float(f"    {nm} mix (0..1)", default=round(1.0/k,3), min_val=0.0)
                    tmp.append(SkillModel(nm, pph, mix))
                ssum = sum(max(0.0,s.mix_pct) for s in tmp) or 1.0
                for s in tmp: s.mix_pct = max(0.0,s.mix_pct)/ssum
                skills_override = tmp
            if yes_no("  Override buffer?", False):
                buf_override = ask_float("    Buffer (0..1)", default=buffer_pct, min_val=0.0)

        vto_blackout = yes_no("VTO blackout at this site (no VTO)?", False)

        sites.append(SiteInput(
            name=name,
            projected_volume=vol,
            scheduled_headcount=sched,
            hours_in_window=h_override,
            demand_curve=curve_override,
            skills=skills_override,
            vto_blackout=vto_blackout,
            buffer_pct=buf_override
        ))

    # Build plans (peak-based with hourly detail internally)
    plans: List[SitePlan] = []
    for s in sites:
        H = s.hours_in_window if s.hours_in_window is not None else g.hours_in_window
        curve = s.demand_curve if s.demand_curve is not None else (g.demand_curve if len(g.demand_curve)==H else CURVES["flat"](H))
        skills = s.skills if s.skills is not None else g.skills
        buf = g.buffer_pct if s.buffer_pct is None else s.buffer_pct

        per_hour = headcount_per_hour(s.projected_volume, H, curve, skills, buf, g.round_up_required)
        peak_req = max(per_hour) if per_hour else 0

        surplus_before_vto = max(0, s.scheduled_headcount - peak_req)
        vto = clamp_vto(s.scheduled_headcount, peak_req, g.vto_cap_pct_sched, g.min_staff_floor_pct, g.min_staff_floor_abs, s.vto_blackout)
        post_vto = max(0, s.scheduled_headcount - vto)
        deficit_after_vto = max(0, peak_req - post_vto)

        # placeholder; VET/MET later (possibly after transfers)
        base, total = costs(H, g.wage_hourly, g.vet_mult, g.met_mult, s.scheduled_headcount, vto, 0, 0)

        plans.append(SitePlan(
            name=s.name,
            peak_required_headcount=peak_req,
            scheduled_headcount=s.scheduled_headcount,
            surplus_before_vto=surplus_before_vto,
            vto_offers=vto,
            post_vto_headcount=post_vto,
            deficit_after_vto=deficit_after_vto,
            vet_offers=0,
            met_offers=0,
            uncovered_deficit=0,
            xfer_out=0,
            xfer_in=0,
            notes="",
            cost_baseline=base,
            cost_with_plan=total,
            cost_delta=total-base
        ))

    # Optional network rebalance BEFORE VET/MET
    if g.allow_cross_site_rebalance:
        suggest_transfers(plans, g.transfer_cap_pct_sched)

    # Now cover remaining deficits with VET/MET
    for p in plans:
        deficit = max(0, p.peak_required_headcount - p.post_vto_headcount)  # recompute after transfers
        vet, met, left = vet_met_split(deficit, p.post_vto_headcount, p.peak_required_headcount, g.vet_cap_pct_sched, g.met_cap_pct_req, g.prefer_vet_over_met)
        p.vet_offers, p.met_offers, p.uncovered_deficit = vet, met, left
        # Recompute costs with VET/MET
        b, t = costs(g.hours_in_window, g.wage_hourly, g.vet_mult, g.met_mult,
                     p.scheduled_headcount, p.vto_offers, p.vet_offers, p.met_offers)
        p.cost_baseline, p.cost_with_plan, p.cost_delta = b, t, t-b
        if left > 0:
            p.notes = (p.notes + "; " if p.notes else "") + f"Uncovered deficit {left} (caps/budget)."

    # Apply network budget ceiling if needed
    if g.delta_cost_ceiling > 0:
        apply_budget_ceiling(plans, g.hours_in_window, g.wage_hourly, g.vet_mult, g.met_mult, g.delta_cost_ceiling)

    # Final print
    print_site_table(plans)
    print_totals(plans)

    # Export
    if yes_no("\nExport results to JSON?", False):
        path = ask_str("JSON file path", default="offers_plan_ultra.json")
        export_json(plans, path)
        print(f"Saved JSON to {path}")
    if yes_no("Export results to CSV?", False):
        path = ask_str("CSV file path", default="offers_plan_ultra.csv")
        export_csv(plans, path)
        print(f"Saved CSV to {path}")

    # Hints
    print("\nTips:")
    print("- Use AM/PM/double-peak curves to model wavey arrivals; raise buffer for SLA-sensitive windows.")
    print("- Enable cross-site rebalancing to reduce MET usage before mandating time.")
    print("- Set a Δ Cost ceiling to keep the plan under a spend target; uncovered deficits will be flagged.")
    print("- Per-site VTO blackout is handy for ramp days or training blocks.")
    print("Done.\n")

if __name__ == "__main__":
    main()
