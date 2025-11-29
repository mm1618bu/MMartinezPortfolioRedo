#!/usr/bin/env python3
import sys
import math
import random
import csv
from datetime import datetime, time

# -------------------- Config --------------------
WAREHOUSES = ["DCB8", "DB09", "DB02", "DB04", "DB06", "DB03", "UHA2", "UHA4", "UHA6", "UHA8"]
MIN_PACKAGES = 36000
MAX_PACKAGES = 98000

# Default operating window (24h clock). You can change at runtime via menu.
DEFAULT_START_HOUR = 6   # 06:00
DEFAULT_END_HOUR   = 18  # 18:00 (exclusive) -> hours 6..17 (12 hours)

ROLE_NAMES = [
    "Unloader",
    "Induct",
    "ASL Unload",
    "ASL Induct",
    "Diverter",
    "Pick to buffer",
    "Stow",
    "OVs",
]

# -------------------- Helpers --------------------
def ceildiv(a, b):
    return (a + b - 1) // b

def fmt_int(n):
    return f"{n:,}"

def print_table(headers, rows):
    widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(str(cell)))
    def line():
        return "+" + "+".join("-"*(w+2) for w in widths) + "+"
    def fmt_row(row):
        return "| " + " | ".join(str(cell).ljust(widths[i]) for i, cell in enumerate(row)) + " |"
    print(line())
    print(fmt_row(headers))
    print(line())
    for row in rows:
        print(fmt_row(row))
    print(line())

def prompt_choice(prompt, choices):
    while True:
        ans = input(prompt).strip().lower()
        if ans in choices:
            return ans
        print(f"Please enter one of: {', '.join(sorted(choices))}")

def prompt_int(prompt, min_val=None, max_val=None, allow_blank=False, default=None):
    while True:
        s = input(prompt).strip().replace(",", "")
        if allow_blank and s == "":
            return default
        try:
            val = int(s)
            if min_val is not None and val < min_val:
                print(f"Must be >= {min_val}")
                continue
            if max_val is not None and val > max_val:
                print(f"Must be <= {max_val}")
                continue
            return val
        except ValueError:
            print("Please enter a valid integer.")

# -------------------- Staffing Math --------------------
def compute_staff_for_packages(pkgs: int) -> dict:
    """Daily baseline per your rules."""
    per10k = math.ceil(pkgs / 10_000)
    role_counts = {
        "Unloader": per10k,
        "Induct": per10k,
        "ASL Unload": per10k,
        "ASL Induct": per10k,
        "Diverter": 6,
        "Pick to buffer": 5 * per10k,
        "Stow": 5 * per10k,
        "OVs": min(8, math.ceil(pkgs / 100)),
    }
    role_counts["__total__"] = sum(role_counts[r] for r in ROLE_NAMES)
    return role_counts

def compute_hourly_staff_for_packages(pkgs: int) -> dict:
    """Hourly requirement using the SAME rules, scaled on the hour's package volume."""
    per10k = math.ceil(pkgs / 10_000) if pkgs > 0 else 0
    role_counts = {
        "Unloader": per10k,
        "Induct": per10k,
        "ASL Unload": per10k,
        "ASL Induct": per10k,
        # Diverter assumed fixed presence (6) during operational hours
        "Diverter": 6 if pkgs > 0 else 0,
        "Pick to buffer": 5 * per10k,
        "Stow": 5 * per10k,
        "OVs": min(8, math.ceil(pkgs / 100)) if pkgs > 0 else 0,
    }
    role_counts["__total__"] = sum(role_counts[r] for r in ROLE_NAMES)
    return role_counts

# -------------------- Volume Generation --------------------
def generate_daily_packages(seed=None):
    if seed is not None:
        random.seed(seed)
    return {wh: random.randint(MIN_PACKAGES, MAX_PACKAGES) for wh in WAREHOUSES}

def hourly_distribution_template(hours, template="flat"):
    """Return a list of length=len(hours) with proportions summing to 1.0."""
    n = len(hours)
    if n == 0:
        return []
    if template == "flat":
        return [1.0 / n] * n
    elif template == "front":
        # Front-loaded: linear descending
        weights = [n - i for i in range(n)]
    elif template == "back":
        # Back-loaded: linear ascending
        weights = [i + 1 for i in range(n)]
    elif template == "bell":
        # Simple bell curve via triangular distribution around center
        center = (n - 1) / 2.0
        weights = [ (1.0 - abs(i - center)/center) if center != 0 else 1.0 for i in range(n) ]
        weights = [max(w, 0.2) for w in weights]  # avoid zeros on edges
    else:
        return [1.0 / n] * n
    s = sum(weights)
    return [w / s for w in weights]

def custom_distribution(hours):
    n = len(hours)
    print(f"Enter {n} percentages (must sum to 100). Leave blank to accept 0 for that hour.")
    vals = []
    for h in hours:
        v = input(f"  Hour {h:02d}: ").strip()
        vals.append(float(v) if v else 0.0)
    s = sum(vals)
    if s <= 0:
        print("All zeros entered; defaulting to flat.")
        return [1.0 / n] * n
    return [v / s for v in vals]

def make_hour_range(start_hour, end_hour):
    """Half-open [start, end) list of hour integers."""
    if end_hour <= start_hour:
        # Wrap over midnight if needed
        hours = list(range(start_hour, 24)) + list(range(0, end_hour))
    else:
        hours = list(range(start_hour, end_hour))
    return hours

def split_daily_to_hourly(total_pkgs, hours, mode="flat"):
    if mode == "custom":
        dist = custom_distribution(hours)
    else:
        dist = hourly_distribution_template(hours, mode)
    hourly = {h: int(round(total_pkgs * p)) for h, p in zip(hours, dist)}
    # Adjust rounding to match total exactly
    delta = total_pkgs - sum(hourly.values())
    # Add/subtract the delta to the largest buckets
    if delta != 0:
        # sort hours by current share descending
        order = sorted(hours, key=lambda x: -hourly[x])
        i = 0
        step = 1 if delta > 0 else -1
        for _ in range(abs(delta)):
            hourly[order[i]] += step
            i = (i + 1) % len(order)
    return hourly

# -------------------- Reporting / Views --------------------
def build_baseline(packages_by_wh: dict) -> dict:
    return {wh: compute_staff_for_packages(pkgs) for wh, pkgs in packages_by_wh.items()}

def show_staffing_overview(packages_by_wh, baseline_by_wh):
    headers = ["Warehouse", "Packages", *ROLE_NAMES, "Baseline Total"]
    rows = []
    for wh in WAREHOUSES:
        pkgs = packages_by_wh[wh]
        roles = baseline_by_wh[wh]
        row = [wh, fmt_int(pkgs)] + [fmt_int(roles[r]) for r in ROLE_NAMES] + [fmt_int(roles["__total__"])]
        rows.append(row)
    print_table(headers, rows)
    grand_total = sum(baseline_by_wh[wh]["__total__"] for wh in WAREHOUSES)
    total_pkgs = sum(packages_by_wh.values())
    print(f"Grand Total Packages: {fmt_int(total_pkgs)}")
    print(f"Grand Baseline Headcount (all roles, all warehouses): {fmt_int(grand_total)}")

def export_csv(packages_by_wh, baseline_by_wh, path=None):
    if path is None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = f"staffing_plan_{ts}.csv"
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Warehouse", "Packages", *ROLE_NAMES, "Baseline Total"])
        for wh in WAREHOUSES:
            pkgs = packages_by_wh[wh]
            roles = baseline_by_wh[wh]
            row = [wh, pkgs] + [roles[r] for r in ROLE_NAMES] + [roles["__total__"]]
            writer.writerow(row)
        total_pkgs = sum(packages_by_wh.values())
        grand_total = sum(baseline_by_wh[wh]["__total__"] for wh in WAREHOUSES)
        writer.writerow([])
        writer.writerow(["TOTAL", total_pkgs, "", "", "", "", "", "", "", grand_total])
    print(f"Saved: {path}")

# -------------------- VTO Planning --------------------
def plan_hourly_vto(for_wh, daily_pkgs, start_hour, end_hour, flow_mode):
    hours = make_hour_range(start_hour, end_hour)
    hourly_pkgs = split_daily_to_hourly(daily_pkgs, hours, mode=flow_mode)

    # Baseline hourly requirements
    hourly_need = {h: compute_hourly_staff_for_packages(hourly_pkgs[h]) for h in hours}

    # Show hourly package plan
    headers = ["Hour", "Pkgs", *ROLE_NAMES, "Total Need"]
    rows = []
    for h in hours:
        need = hourly_need[h]
        row = [f"{h:02d}:00", fmt_int(hourly_pkgs[h])] + [fmt_int(need[r]) for r in ROLE_NAMES] + [fmt_int(need["__total__"])]
        rows.append(row)
    print("\nHourly package plan & required staffing (baseline):")
    print_table(headers, rows)

    # Collect CURRENT on-shift staffing (assumed constant for the whole window)
    print("\nEnter CURRENT on-shift headcount by role for this window.")
    current_by_role = {}
    for r in ROLE_NAMES:
        val = prompt_int(f"  {r}: ", min_val=0)
        current_by_role[r] = val
    current_total = sum(current_by_role.values())

    # Compare hourly and propose VTO slots
    headers2 = ["Hour", "Need Total", "Current Total", "Surplus (+) / Deficit (-)", "Suggested VTO (max)"]
    rows2 = []
    vto_suggestions = {}
    for h in hours:
        need_total = hourly_need[h]["__total__"]
        surplus = current_total - need_total
        suggest_vto = max(0, surplus)
        rows2.append([f"{h:02d}:00", fmt_int(need_total), fmt_int(current_total), f"{surplus:+}", fmt_int(suggest_vto)])
        vto_suggestions[h] = suggest_vto
    print("\nHourly VTO summary (all roles combined):")
    print_table(headers2, rows2)

    # Optional: role-aware VTO cap so you don’t drop below any role’s need.
    print("\nRole-aware VTO guardrails (max you can release per role at each hour without going under):")
    headers3 = ["Hour"] + ROLE_NAMES
    rows3 = []
    for h in hours:
        caps = []
        for r in ROLE_NAMES:
            cap = max(0, current_by_role[r] - hourly_need[h][r])
            caps.append(fmt_int(cap))
        rows3.append([f"{h:02d}:00", *caps])
    print_table(headers3, rows3)

    print("Notes:")
    print(" • 'Suggested VTO' shows the maximum people you could release at that hour without dropping below the total baseline.")
    print(" • Use the role guardrails to ensure you don’t over-VTO a critical role (e.g., Diverter).")
    print(" • Diverter baseline is 6 whenever there is flow; set your current Diverter accordingly.\n")

# -------------------- Main CLI --------------------
def main():
    print("=== Warehouse Staffing Planner (Daily + Hourly Flow + VTO) ===")
    print("Warehouses:", ", ".join(WAREHOUSES))

    # Operating window setup (can be changed via menu)
    start_hour = DEFAULT_START_HOUR
    end_hour = DEFAULT_END_HOUR
    flow_mode = "flat"  # flat | front | back | bell | custom

    # initial packages + baseline
    packages_by_wh = generate_daily_packages()
    baseline_by_wh = build_baseline(packages_by_wh)

    while True:
        print("\nChoose an action:")
        print("  1) Show daily package loads & baseline staffing (per warehouse)")
        print("  2) Regenerate random daily package loads")
        print("  3) Override a warehouse's daily package count")
        print(f"  4) Set operating window (current: {start_hour:02d}:00–{end_hour:02d}:00)")
        print(f"  5) Set hourly flow shape (current: {flow_mode})")
        print("  6) Compare against CURRENT staffing (TOTAL headcount, all warehouses)")
        print("  7) Compare against CURRENT staffing (BY ROLE for a warehouse)")
        print("  8) Plan hourly VTO for a warehouse (hourly flow & guardrails)")
        print("  9) Export current DAILY plan to CSV")
        print("  0) Quit")
        choice = prompt_choice("> ", set(list("0123456789")))

        if choice == "1":
            show_staffing_overview(packages_by_wh, baseline_by_wh)

        elif choice == "2":
            seed_ans = input("Optional: seed for reproducibility (blank to skip): ").strip()
            seed = int(seed_ans) if seed_ans else None
            packages_by_wh = generate_daily_packages(seed=seed)
            baseline_by_wh = build_baseline(packages_by_wh)
            print("✅ New daily loads generated and baseline recomputed.")

        elif choice == "3":
            print("Warehouse codes:", ", ".join(WAREHOUSES))
            wh = input("> ").strip().upper()
            if wh not in WAREHOUSES:
                print("Not a valid warehouse.")
                continue
            new_pkgs = prompt_int(f"Enter DAILY packages for {wh} ({MIN_PACKAGES}-{MAX_PACKAGES}): ",
                                  MIN_PACKAGES, MAX_PACKAGES)
            packages_by_wh[wh] = new_pkgs
            baseline_by_wh[wh] = compute_staff_for_packages(new_pkgs)
            print(f"✅ {wh} updated and baseline recomputed.")

        elif choice == "4":
            sh = prompt_int("Start hour (0-23): ", 0, 23)
            eh = prompt_int("End hour (0-23, exclusive): ", 0, 23)
            start_hour, end_hour = sh, eh
            print(f"✅ Window set to {start_hour:02d}:00–{end_hour:02d}:00")

        elif choice == "5":
            print("Flow shapes: flat, front (AM heavy), back (PM heavy), bell, custom")
            m = input("Enter shape: ").strip().lower()
            if m in {"flat", "front", "back", "bell", "custom"}:
                flow_mode = m
                print(f"✅ Flow shape set to {flow_mode}")
            else:
                print("Unknown shape; keeping previous.")

        elif choice == "6":
            baseline_total = sum(baseline_by_wh[wh]["__total__"] for wh in WAREHOUSES)
            print(f"Baseline TOTAL (all warehouses): {fmt_int(baseline_total)}")
            current = prompt_int("Enter your CURRENT total staffed headcount (all roles): ", 0)
            delta = current - baseline_total
            if delta == 0:
                print("✅ Exactly at baseline. No VTO/VET needed.")
            elif delta > 0:
                print(f"📉 Over by {fmt_int(delta)} → Offer VTO to {fmt_int(delta)} people.")
            else:
                print(f"📈 Under by {fmt_int(-delta)} → Offer VET to {fmt_int(-delta)} people.")

        elif choice == "7":
            wh = input("Warehouse code: ").strip().upper()
            if wh not in WAREHOUSES:
                print("Not a valid warehouse.")
                continue
            roles = baseline_by_wh[wh]
            print(f"\n{wh} baseline (packages: {fmt_int(packages_by_wh[wh])}):")
            headers = ["Role", "Baseline"]
            rows = [[r, fmt_int(roles[r])] for r in ROLE_NAMES]
            print_table(headers, rows)
            print("\nEnter CURRENT staffed headcount by role:")
            total_delta = 0
            headers2, rows2 = ["Role", "Baseline", "Current", "Delta", "Action"], []
            for r in ROLE_NAMES:
                have = prompt_int(f"  {r}: ", 0)
                delta = have - roles[r]
                total_delta += delta
                action = "OK" if delta == 0 else (f"VTO {fmt_int(delta)}" if delta > 0 else f"VET {fmt_int(-delta)}")
                rows2.append([r, fmt_int(roles[r]), fmt_int(have), f"{delta:+}", action])
            print()
            print_table(headers2, rows2)
            if total_delta == 0:
                print("✅ Net total matches baseline across roles.")
            elif total_delta > 0:
                print(f"📉 Net over by {fmt_int(total_delta)} (favor VTO).")
            else:
                print(f"📈 Net under by {fmt_int(-total_delta)} (favor VET).")

        elif choice == "8":
            wh = input("Warehouse code: ").strip().upper()
            if wh not in WAREHOUSES:
                print("Not a valid warehouse.")
                continue
            print(f"{wh} has {fmt_int(packages_by_wh[wh])} daily packages.")
            plan_hourly_vto(wh, packages_by_wh[wh], start_hour, end_hour, flow_mode)

        elif choice == "9":
            path = input("CSV path (blank for auto name): ").strip() or None
            export_csv(packages_by_wh, baseline_by_wh, path)

        elif choice == "0":
            print("Goodbye!")
            break

        else:
            print("Unknown choice. Try again.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. Goodbye!")
        sys.exit(0)
