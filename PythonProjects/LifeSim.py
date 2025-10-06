#!/usr/bin/env python3
# Text Life Simulator (mortgage + credit + crime pack)
# Run: python life_sim.py  [--seed 123] [--load save.json]
import argparse, json, random, sys, math
from dataclasses import dataclass, asdict, field
from typing import Callable, Dict, List, Optional, Tuple

# ============================================================
# Core data models
# ============================================================
@dataclass
class Person:
    name: str
    age: int = 0
    alive: bool = True

    # Core stats
    health: int = 70            # 0..100
    happiness: int = 70         # 0..100
    intelligence: int = 50      # 0..100
    stress: int = 30            # 0..100
    wealth: int = 0             # liquid cash
    debt: int = 0               # non-mortgage loans (student, personal)

    # Credit
    credit_score: int = 620     # 300..850
    credit_limit: int = 0       # revolving limit
    credit_balance: int = 0     # revolving balance
    credit_history: List[str] = field(default_factory=list)  # audit trail

    # Education
    education: str = "None"     # None, Primary, HS, Vocational, College, Grad
    major: Optional[str] = None # STEM, Business, Arts, Trades, None
    gpa: float = 0.0            # 0.0 .. 4.0
    certifications: List[str] = field(default_factory=list)

    # Career
    career: Optional[str] = None
    career_level: int = 0       # 0 entry, 1 mid, 2 senior, 3 lead
    unemployed_years: int = 0
    job_history: List[str] = field(default_factory=list)
    reputation: int = 50        # 0..100 (affects offers/opportunities)

    # Social & family
    relationships: Dict[str, int] = field(default_factory=lambda: {
        "family": 60, "friends": 50, "partner": 50
    })
    traits: Dict[str, int] = field(default_factory=lambda: {
        "discipline": 50,
        "charisma": 50,
        "portfolio": 0,       # invested principal (compounds)
        "resilience": 50,     # buffers setbacks / layoffs
        "ambition": 50,       # helps promotions/offers
        "ethics": 60,         # affects legal trouble incidence
    })
    partner_status: Optional[str] = None  # None, Dating, Married, Divorced
    children: int = 0

    # Housing & mortgage
    housing: str = "Family"     # Family, Rent, Own
    rent: int = 0
    mortgage: int = 0           # annual payment target (budgeted)
    home_equity: int = 0
    mortgage_balance: int = 0   # remaining principal
    mortgage_rate: float = 0.0  # APR (e.g., 0.05)
    mortgage_term_remaining: int = 0  # years
    missed_mortgage_years: int = 0    # for foreclosure risk

    # Insurance
    health_insurance: bool = False

    # Place & travel
    city: str = "Hometown"
    country: str = "USA"
    visited_countries: List[str] = field(default_factory=lambda: ["USA"])

    # Pets / hobbies
    pets: List[str] = field(default_factory=list)
    hobbies: List[str] = field(default_factory=list)

    # Crime / justice
    criminal_record: bool = False
    probation_years: int = 0

    # Log
    log: List[str] = field(default_factory=list)

    # Helpers
    def clamp(self):
        for k in ("health", "happiness", "intelligence", "stress", "reputation"):
            setattr(self, k, max(0, min(100, getattr(self, k))))
        for k, v in list(self.relationships.items()):
            self.relationships[k] = max(0, min(100, v))
        for k, v in list(self.traits.items()):
            self.traits[k] = max(0, min(100, v))
        self.gpa = max(0.0, min(4.0, float(self.gpa)))
        self.credit_score = max(300, min(850, int(self.credit_score)))
        self.credit_balance = max(0, self.credit_balance)
        self.credit_limit = max(0, self.credit_limit)
        self.mortgage_balance = max(0, self.mortgage_balance)
        self.mortgage_rate = max(0.0, self.mortgage_rate)
        self.mortgage_term_remaining = max(0, self.mortgage_term_remaining)

    def add_log(self, msg: str):
        entry = f"Age {self.age}: {msg}"
        print("  ->", entry)
        self.log.append(entry)

    def add_country(self, c: str):
        if c not in self.visited_countries:
            self.visited_countries.append(c)

# ============================================================
# World data
# ============================================================
CITY_COL = {
    "Hometown": 1.00, "Austin": 1.05, "Chicago": 1.08, "Seattle": 1.20,
    "New York": 1.35, "San Francisco": 1.45, "Atlanta": 1.00,
    "Denver": 1.06, "Miami": 1.10, "Boston": 1.22, "Los Angeles": 1.25,
}
COUNTRY_ADJ = {
    "USA": 1.00, "Canada": 0.95, "UK": 0.92, "Germany": 0.96, "Japan": 0.90,
    "India": 0.55, "Australia": 0.98, "Brazil": 0.60, "Mexico": 0.58, "Italy": 0.85,
}

def col_multiplier(p: Person) -> float:
    return CITY_COL.get(p.city, 1.0) * COUNTRY_ADJ.get(p.country, 1.0)

# ============================================================
# Event system
# ============================================================
ChoiceHandler = Callable[[Person, random.Random], str]
Condition = Callable[[Person], bool]

@dataclass
class Choice:
    key: str
    label: str
    apply: ChoiceHandler

@dataclass
class Event:
    code: str
    title: str
    ages: Tuple[int, int]
    condition: Condition
    prompt: str
    choices: List[Choice]
    once: bool = False

    def is_applicable(self, p: Person) -> bool:
        return self.ages[0] <= p.age <= self.ages[1] and self.condition(p)

# ============================================================
# IO helpers & HUD
# ============================================================
def ask_choice(event: Event) -> str:
    print(f"\n— {event.title} —")
    print(event.prompt)
    for c in event.choices:
        print(f"[{c.key}] {c.label}")
    valid = {c.key.lower() for c in event.choices}
    while True:
        ans = input("> ").strip().lower()
        if ans in valid:
            return ans
        print(f"Please choose one of: {', '.join(sorted(valid))}")

def year_summary(p: Person):
    lvl = {0:"entry",1:"mid",2:"senior",3:"lead"}.get(p.career_level,"—")
    print("\n=== Year Summary ===")
    print(f"Name: {p.name} | Age: {p.age} | Alive: {p.alive} | Record: {'Yes' if p.criminal_record else 'No'} | Probation: {p.probation_years}")
    print(f"Health: {p.health} | Happiness: {p.happiness} | Stress: {p.stress} | Int: {p.intelligence}")
    print(f"Wealth: ${p.wealth} | Debt: ${p.debt} | Credit: {p.credit_score} | Revolve: ${p.credit_balance}/${p.credit_limit}")
    print(f"Edu: {p.education} ({p.major or '—'}) | GPA: {p.gpa:.2f}")
    print(f"Career: {p.career or '—'} ({lvl}) | Rep: {p.reputation} | City: {p.city}, {p.country}")
    print(f"Housing: {p.housing} (rent=${p.rent}, mortgage=${p.mortgage}, bal=${p.mortgage_balance}, rate={p.mortgage_rate:.2%}, term={p.mortgage_term_remaining}) | Insured: {p.health_insurance}")
    print(f"Partner: {p.partner_status or '—'} | Children: {p.children} | Pets: {', '.join(p.pets) or '—'}")
    print(f"Relationships: {p.relationships}")
    print(f"Traits: {p.traits}")
    print(f"Visited: {', '.join(p.visited_countries)}")
    print("====================\n")

def explain_commands():
    print("Commands: [enter]=continue  :save <file>  :log [N]  :help  :quit")

# ============================================================
# Career income ranges (COL-adjusted later)
# ============================================================
def base_income_range(career: Optional[str]) -> Tuple[int,int]:
    return {
        "Retail Associate": (2000, 5000),
        "Junior Developer": (7000, 14000),
        "Software Engineer": (12000, 22000),
        "Manager": (10000, 20000),
        "Entrepreneur": (0, 30000),   # volatile
        "Analyst": (8000, 15000),
        "Artist": (2000, 9000),
        "Tradesperson": (9000, 17000),
        None: (0, 0),
    }.get(career, (3000, 8000))

def career_income_range(p: Person) -> Tuple[int,int]:
    lo, hi = base_income_range(p.career)
    lvl_mult = [1.0, 1.3, 1.7, 2.2][min(max(p.career_level,0),3)]
    edu_mult = 1.0
    if p.education == "Grad": edu_mult += 0.15
    elif p.education == "College": edu_mult += 0.05
    elif p.education == "Vocational": edu_mult += 0.08
    if p.major == "STEM": edu_mult += 0.10
    elif p.major == "Business": edu_mult += 0.05
    elif p.major == "Trades": edu_mult += 0.10
    rep_mult = 1.0 + (p.reputation - 50) * 0.002
    col_mult = col_multiplier(p)
    lo = int(lo * lvl_mult * edu_mult * rep_mult * col_mult)
    hi = int(hi * lvl_mult * edu_mult * rep_mult * col_mult)
    return (max(0, lo), max(0, hi))

# ============================================================
# Education & early-life events (abbrev from earlier packs)
# ============================================================
def evt_childhood_checkup():
    def condition(p: Person): return p.age in (1, 3, 5, 7, 9)
    def a(p: Person, rng: random.Random):
        delta = rng.randint(1, 4)
        p.health += 2 + delta; p.happiness -= 1; p.clamp()
        return f"Doctor visit; health (+{2+delta}), nerves (−1 happiness)."
    def b(p: Person, rng: random.Random):
        delta = rng.randint(2, 6)
        p.health -= delta; p.clamp()
        return f"Skipped checkup; lingering issue (−{delta} health)."
    return Event("child_check","Childhood Checkup",(1,10),condition,
        "Pediatric checkup is due. Do you go?",
        [Choice("a","Go to the doctor", a), Choice("b","Skip it", b)], once=False)

def evt_school_path():
    def condition(p: Person): return p.age == 6 and p.education == "None"
    def a(p: Person, rng: random.Random):
        p.education = "Primary"; p.traits["discipline"] += 5; p.intelligence += 3; p.clamp()
        return "You enrolled in school. Discipline +5, Intelligence +3."
    def b(p: Person, rng: random.Random):
        p.happiness += 3; p.traits["discipline"] -= 7; p.clamp()
        return "You delay school. Fun now, structure later. Happiness +3, Discipline −7."
    return Event("school_start","Starting School",(5,7),condition,
        "You're of school age. Enroll now or delay?",
        [Choice("a","Enroll in school", a), Choice("b","Delay a year", b)], once=True)

def evt_highschool_decision():
    def condition(p: Person): return p.age == 14 and p.education in ("Primary", "HS")
    def a(p: Person, rng: random.Random):
        p.education = "HS"; p.intelligence += 5; p.relationships["friends"] += 5; p.clamp()
        return "You commit to high school. Intelligence +5, Friends +5."
    def b(p: Person, rng: random.Random):
        p.education = "None"; p.happiness += 5; p.traits["discipline"] -= 10; p.clamp()
        return "You drop out. Freedom now, cost later. Happiness +5, Discipline −10."
    return Event("hs_choice","High School Path",(13,15),condition,
        "Continue into high school or leave formal schooling?",
        [Choice("a","Continue high school", a), Choice("b","Drop out", b)], once=True)

def evt_post_hs_paths():
    def condition(p: Person): return p.age in (17,18,19) and p.education in ("HS","None")
    def a(p: Person, rng: random.Random):
        p.education = "College"; cost = 10000 + rng.randint(0,5000)
        p.debt += cost; p.intelligence += 5; p.traits["discipline"] += 5; p.gpa = 3.0; p.clamp()
        return f"You attend college. Debt +${cost}, GPA starts at 3.0."
    def b(p: Person, rng: random.Random):
        p.education = "Vocational"; cost = 6000 + rng.randint(0,3000)
        p.debt += cost; p.major = "Trades"; p.intelligence += 3; p.gpa = 3.2; p.clamp()
        return f"You enroll in vocational school (Trades). Debt +${cost}."
    def c(p: Person, rng: random.Random):
        start = 2000 + rng.randint(0,2000); p.wealth += start
        p.career = "Retail Associate"; p.career_level = 0
        p.job_history.append("Retail Associate"); p.clamp()
        return f"You start working retail. Wealth +${start}."
    def d(p: Person, rng: random.Random):
        p.traits["discipline"] += 2; p.happiness += 1; p.clamp()
        return "Gap year to learn/travel. Discipline +2, Happiness +1."
    return Event("post_hs","After High School",(17,19),condition,
        "Pick a path after high school:",
        [Choice("a","College", a), Choice("b","Vocational school (Trades)", b),
         Choice("c","Work immediately", c), Choice("d","Gap year", d)], once=True)

# (College detail, jobs, health, relationships, travel etc. — subset for brevity but still full-featured)
def evt_choose_major():
    def condition(p: Person): return p.education == "College" and p.major is None and 18 <= p.age <= 21
    def a(p: Person, rng: random.Random):
        p.major = "STEM"; p.intelligence += 5; p.traits["ambition"] += 5; p.clamp()
        return "You choose a STEM major. Intelligence +5, Ambition +5."
    def b(p: Person, rng: random.Random):
        p.major = "Business"; p.traits["charisma"] += 5; p.clamp()
        return "You choose Business. Charisma +5."
    def c(p: Person, rng: random.Random):
        p.major = "Arts"; p.happiness += 5; p.clamp()
        return "You choose Arts. Happiness +5."
    def d(p: Person, rng: random.Random):
        p.major = "None"; p.clamp()
        return "You stay undeclared for now."
    return Event("choose_major","Choose Your Major",(18,21),condition,
        "Pick a college major:",
        [Choice("a","STEM", a), Choice("b","Business", b), Choice("c","Arts", c), Choice("d","Undeclared", d)], once=True)

def evt_grad_or_cert():
    def condition(p: Person): return 21 <= p.age <= 30 and p.education in ("College","Vocational")
    def a(p: Person, rng: random.Random):
        cost = 12000 + rng.randint(0,6000); p.debt += cost
        p.education = "Grad"; p.intelligence += 6; p.traits["discipline"] += 4; p.gpa = 3.3; p.clamp()
        return f"You pursue grad school. Debt +${cost}, Intelligence +6."
    def b(p: Person, rng: random.Random):
        cert = random.choice(["PMP","AWS","CPA","Security+","DataSci Cert","Welding Pro","Electrician License"])
        fee = 800 + rng.randint(0,700); p.debt += fee
        p.certifications.append(cert); p.traits["discipline"] += 2; p.reputation += 2; p.clamp()
        return f"You earn a certification ({cert}). Fee +${fee}."
    def c(p: Person, rng: random.Random):
        p.happiness += 2; p.clamp()
        return "You skip further schooling for now. Happiness +2."
    return Event("grad_or_cert","Post-School Options",(21,30),condition,
        "Further education?",
        [Choice("a","Grad school", a), Choice("b","Professional certification", b), Choice("c","No for now", c)], once=True)

def evt_job_search_if_unemployed():
    def condition(p: Person): return p.career is None and p.age >= 18
    def a(p: Person, rng: random.Random):
        offers = ["Retail Associate","Junior Developer","Analyst","Tradesperson","Artist"]
        weighted = []
        for role in offers:
            w = 1
            if role in ("Junior Developer","Software Engineer") and p.major == "STEM": w += 2
            if role == "Analyst" and p.education in ("College","Grad"): w += 1
            if role == "Tradesperson" and p.education == "Vocational": w += 2
            if role == "Artist" and p.major == "Arts": w += 2
            if p.reputation > 60: w += 1
            weighted += [role]*w
        picks = list({rng.choice(weighted) for _ in range(12)})
        rng.shuffle(picks)
        picks = (picks + ["Keep searching"])[:3]
        dyn = []
        def mk(role):
            def apply(p2: Person, r: random.Random):
                if role == "Keep searching":
                    p2.wealth -= 500; p2.unemployed_years += 1; p2.happiness -= 1; p2.clamp()
                    return "You keep searching. Money −$500, morale dips."
                p2.career = role; p2.career_level = 0; p2.job_history.append(role); p2.unemployed_years = 0
                bonus = r.randint(500, 3000); p2.wealth += bonus; p2.happiness += 1; p2.clamp()
                return f"You accept {role} (start bonus +${bonus})."
            return apply
        for i, role in enumerate(picks):
            dyn.append(Choice(chr(ord('a')+i), f"Accept: {role}", mk(role)))
        if "Keep searching" not in picks:
            dyn.append(Choice(chr(ord('a')+len(dyn)), "Keep searching", mk("Keep searching")))
        ev = Event("job_search","Job Search",(18,90),lambda _: True,"You’re unemployed. Offers on the table:", dyn, once=True)
        ans = ask_choice(ev); chosen = next(c for c in ev.choices if c.key.lower() == ans)
        return chosen.apply(p, rng)
    return Event("job_search_bootstrap","(Internal) Job Search Trigger",(18,90),condition,
                 "You are job hunting…", [Choice("a","Search now", a)], once=True)

def evt_promotion_or_switch():
    def condition(p: Person): return p.career is not None and 22 <= p.age <= 55
    def a(p: Person, rng: random.Random):
        chance = 0.22 + 0.01*(p.traits["ambition"]-50) + 0.01*(p.traits["discipline"]-50) + 0.005*(p.reputation-50)
        if rng.random() < max(0.05, min(0.7, chance)):
            p.career_level = min(3, p.career_level + 1)
            p.happiness += 2; p.traits["ambition"] += 2; p.reputation += 2; p.clamp()
            return f"Promotion! New level {p.career_level}."
        p.happiness -= 1; p.traits["resilience"] += 2; p.clamp()
        return "Promotion attempt failed. Resilience +2, Happiness −1."
    def b(p: Person, rng: random.Random):
        new = rng.choice(["Software Engineer","Analyst","Artist","Manager","Entrepreneur","Tradesperson"])
        p.career = new; p.career_level = 0; p.job_history.append(new)
        p.happiness += 1; p.traits["ambition"] += 1; p.clamp()
        return f"You switch careers to {new}."
    def c(p: Person, rng: random.Random):
        p.happiness += 1; p.clamp()
        return "Stay the course this year. Small morale boost."
    return Event("promote_or_switch","Career Crossroads",(22,55),condition,
        "Career development options?",
        [Choice("a","Push for promotion", a), Choice("b","Switch career", b), Choice("c","Stay the course", c)], once=False)

def evt_layoff_or_downturn():
    def condition(p: Person): return p.career is not None and 23 <= p.age <= 60
    def a(p: Person, rng: random.Random):
        risk = 0.10 - 0.002*(p.traits["resilience"]-50)
        if rng.random() < max(0.02, risk):
            p.career = None; p.career_level = 0
            loss = rng.randint(1000, 5000); p.wealth = max(0, p.wealth - loss)
            p.happiness -= 5; p.stress += 8; p.traits["resilience"] += 5; p.reputation -= 2; p.clamp()
            return f"Layoff hits. Wealth −${loss}. You’ll bounce back (Resilience +5)."
        p.happiness += 1; p.clamp()
        return "Market wobbles, but you hold your job. Happiness +1."
    def b(p: Person, rng: random.Random):
        invest = min(3000, max(500, p.wealth // 5))
        p.wealth -= invest
        p.career = "Entrepreneur"; p.career_level = 0; p.job_history.append("Entrepreneur")
        p.traits["ambition"] += 4; p.happiness += 2; p.clamp()
        return f"You found a startup. Invest ${invest}. High risk, high reward."
    return Event("layoff_or_side","Choppy Economy",(23,60),condition,
        "Economic jitters. What’s your move?",
        [Choice("a","Ride it out", a), Choice("b","Launch a venture", b)], once=False)

def evt_invest_or_spend():
    def condition(p: Person): return p.age >= 22 and p.wealth >= 500 and p.alive
    def a(p: Person, rng: random.Random):
        amt = min(4000, max(500, p.wealth // 4))
        p.wealth -= amt; p.traits["portfolio"] = p.traits.get("portfolio",0) + amt; p.clamp()
        return f"You invest ${amt}. It may grow over time."
    def b(p: Person, rng: random.Random):
        spend = min(2000, p.wealth // 3); p.wealth -= spend; p.happiness += 5; p.clamp()
        return f"You treat yourself, spending ${spend}. Happiness +5."
    def c(p: Person, rng: random.Random):
        return "You hold cash, awaiting a better moment."
    return Event("invest_spend","Money Choices",(22,90),condition,
        "You’ve saved some money. What do you do?",
        [Choice("a","Invest a chunk", a), Choice("b","Spend on experiences", b), Choice("c","Hold cash", c)], once=False)

# ============================================================
# Housing & Mortgage events (buy, refi, foreclosure)
# ============================================================
def evt_housing_choice():
    def condition(p: Person): return p.age >= 18 and p.housing == "Family"
    def a(p: Person, rng: random.Random):
        base = int(800 * col_multiplier(p))
        p.housing = "Rent"; p.rent = base; p.wealth = max(0, p.wealth - base)
        p.happiness += 2; p.relationships["family"] -= 5; p.clamp()
        return f"You rent a place (annualized rent ~${base} paid across the year). Independence!"
    def b(p: Person, rng: random.Random):
        down = 12000; price_factor = int(12000 * col_multiplier(p))
        if p.wealth >= down:
            # Create/initialize a mortgage
            p.wealth -= down
            p.housing = "Own"
            p.mortgage_rate = round(0.035 + rng.uniform(-0.01, 0.02), 4)  # ~2.5%..5.5%
            p.mortgage_term_remaining = 30
            home_price = price_factor + rng.randint(0, 15000)
            p.mortgage_balance = home_price - down
            # Approx annual payment using simple amortization formula
            r = p.mortgage_rate
            n = p.mortgage_term_remaining
            if r == 0:
                annual_pay = p.mortgage_balance // n
            else:
                annual_pay = int(p.mortgage_balance * (r*(1+r)**n)/((1+r)**n - 1))
            p.mortgage = max(4000, annual_pay)
            p.home_equity += down
            p.happiness += 3; p.clamp()
            return f"You buy a home ~${home_price}. Down ${down}, rate {p.mortgage_rate:.2%}, annual payment ~${p.mortgage}."
        p.happiness -= 1; p.clamp()
        return "You cannot afford a down payment yet. Wait and save."
    def c(p: Person, rng: random.Random):
        p.happiness += 1; p.wealth += 300; p.clamp()
        return "You stay with family awhile. Save a bit more (+$300)."
    return Event("housing_choice","Housing Decision",(18,45),condition,
        "Time to consider housing:",
        [Choice("a","Rent a place", a), Choice("b","Buy a modest home", b), Choice("c","Stay with family", c)], once=False)

def evt_home_repairs():
    def condition(p: Person): return p.housing == "Own" and 20 <= p.age <= 80
    def a(p: Person, rng: random.Random):
        cost = rng.randint(500, 5000); p.wealth = max(0, p.wealth - cost); p.home_equity += cost//3; p.clamp()
        return f"Home repairs (${cost}). Equity rises a little."
    def b(p: Person, rng: random.Random):
        p.stress += 5; p.happiness -= 1; p.clamp()
        return "You defer repairs. Stress +5."
    return Event("home_repairs","House Maintenance",(20,80),condition,
        "Your house needs maintenance:",
        [Choice("a","Pay for repairs", a), Choice("b","Defer (risky)", b)], once=False)

def evt_mortgage_refi():
    def condition(p: Person):
        return p.housing == "Own" and p.mortgage_balance > 0 and p.mortgage_term_remaining > 5 and p.credit_score >= 660
    def a(p: Person, rng: random.Random):
        new_rate = max(0.01, p.mortgage_rate - rng.uniform(0.005, 0.02))
        closing = 2000 + rng.randint(0, 2000)
        if p.wealth < closing:
            p.credit_history.append("Refi attempt failed: insufficient cash for closing")
            p.stress += 1; p.clamp()
            return "Refi attempt failed (not enough for closing costs)."
        p.wealth -= closing
        p.mortgage_rate = round(new_rate, 4)
        p.mortgage_term_remaining = min(30, p.mortgage_term_remaining + rng.randint(-2, 2))
        # recalc annual payment
        r = p.mortgage_rate
        n = max(1, p.mortgage_term_remaining)
        if r == 0:
            annual_pay = p.mortgage_balance // n
        else:
            annual_pay = int(p.mortgage_balance * (r*(1+r)**n)/((1+r)**n - 1))
        p.mortgage = max(3000, annual_pay)
        p.credit_history.append(f"Refinanced: rate {p.mortgage_rate:.2%}, term {p.mortgage_term_remaining}, closing ${closing}")
        p.credit_score += 5; p.happiness += 1; p.clamp()
        return f"Refinanced mortgage to {p.mortgage_rate:.2%}. New annual payment ~${p.mortgage} (paid closing ${closing})."
    def b(p: Person, rng: random.Random):
        p.happiness += 0; p.clamp()
        return "You keep your current mortgage."
    return Event("mortgage_refi","Mortgage Refinance",(25,70),condition,
        "Rates shift; you might refinance:",
        [Choice("a","Refinance now", a), Choice("b","Keep current terms", b)], once=False)

# ============================================================
# Credit events (cards, paydown, checkup)
# ============================================================
def credit_utilization(p: Person) -> float:
    if p.credit_limit <= 0: return 0.0
    return min(1.0, p.credit_balance / p.credit_limit)

def adjust_credit_score(p: Person, delta: int, note: str):
    p.credit_score = max(300, min(850, p.credit_score + delta))
    if note: p.credit_history.append(f"{'+' if delta>=0 else ''}{delta} -> {note}")

def evt_credit_card_offer():
    def condition(p: Person):
        return p.age >= 18 and p.credit_limit == 0 and p.credit_score >= 580
    def a(p: Person, rng: random.Random):
        limit = 2000 + rng.randint(0, 3000)
        apr = 0.18 + rng.uniform(-0.04, 0.06)   # ~14%..24%
        p.credit_limit = limit
        p.credit_history.append(f"New credit card approved (limit ${limit}, APR {apr:.2%})")
        adjust_credit_score(p, +15, "New credit line (lower utilization potential)")
        p.happiness += 1; p.clamp()
        return f"You open a starter credit card (limit ${limit})."
    def b(p: Person, rng: random.Random):
        p.happiness += 0; p.clamp()
        return "You decline the card offer."
    return Event("cc_offer","Credit Card Offer",(18,70),condition,
        "A bank offers you a starter credit card.",
        [Choice("a","Accept", a), Choice("b","Decline", b)], once=True)

def evt_credit_checkup():
    def condition(p: Person):
        return p.age >= 19 and (p.credit_limit > 0 or p.debt > 0)
    def a(p: Person, rng: random.Random):
        # Pay some balance if you can
        payoff = min(p.wealth // 4, p.credit_balance)
        p.wealth -= payoff; p.credit_balance -= payoff
        util = credit_utilization(p)
        # Good behavior
        adjust_credit_score(p, +5 if util < 0.3 else +1, "On-time payments & reasonable utilization")
        p.happiness += 1; p.clamp()
        return f"You make payments of ${payoff}. Utilization now {util:.0%}."
    def b(p: Person, rng: random.Random):
        # Miss a payment (hurts)
        fee = 35 + rng.randint(0, 25)
        interest = int(p.credit_balance * 0.2)
        p.credit_balance += fee + interest
        adjust_credit_score(p, -25, "Missed payment reported")
        p.stress += 6; p.happiness -= 3; p.clamp()
        return f"You miss a payment: fees+interest ${fee+interest}. Credit score drops."
    def c(p: Person, rng: random.Random):
        # Balance transfer attempt
        if p.credit_score >= 700 and p.credit_balance > 0:
            savings = int(p.credit_balance * 0.05)
            p.credit_balance = max(0, p.credit_balance - savings)
            adjust_credit_score(p, +8, "Balance transfer managed well")
            p.happiness += 1; p.clamp()
            return f"Balance transfer saves about ${savings}. Score inches up."
        p.happiness += 0; p.clamp()
        return "No action this year."
    return Event("cc_checkup","Credit Checkup",(19,80),condition,
        "Manage your revolving credit:",
        [Choice("a","Pay down balance", a), Choice("b","Miss a payment (not advised)", b), Choice("c","Try balance transfer", c)], once=False)

# ============================================================
# Health & insurance (abbrev)
# ============================================================
def evt_health_event():
    def condition(p: Person): return p.age >= 25 and p.alive
    def a(p: Person, rng: random.Random):
        p.health += 6; p.traits["discipline"] += 3; p.stress -= 3; p.clamp()
        return "You adopt a consistent exercise habit. Health +6, Stress −3."
    def b(p: Person, rng: random.Random):
        hit = 3 + rng.randint(0,8); p.health -= hit; p.stress += 3; p.clamp()
        return f"You neglect health this year. Health −{hit}, Stress +3."
    def c(p: Person, rng: random.Random):
        p.health += 2; p.wealth -= 300; p.clamp()
        return "You get a thorough checkup. Health +2, Wealth −$300."
    return Event("health_turn","Health Fork in the Road",(25,90),condition,
        "A year passes—how do you approach health?",
        [Choice("a","Exercise routinely", a), Choice("b","Ignore it", b), Choice("c","Doctor & screening", c)], once=False)

def evt_health_insurance():
    def condition(p: Person): return p.age >= 22 and not p.health_insurance
    def a(p: Person, rng: random.Random):
        p.health_insurance = True; p.happiness -= 1; p.clamp()
        return "You enroll in health insurance. Premiums will apply; risk reduced."
    def b(p: Person, rng: random.Random):
        p.happiness += 1; p.clamp()
        return "You pass for now (risky)."
    return Event("health_ins","Health Insurance",(22,90),condition,
        "Consider health insurance:",
        [Choice("a","Enroll", a), Choice("b","Skip", b)], once=True)

def evt_accident_or_bill():
    def condition(p: Person): return p.age >= 18 and p.alive
    def a(p: Person, rng: random.Random):
        risk = 0.08
        if rng.random() < risk:
            cost = rng.randint(1000, 8000)
            if p.health_insurance:
                cost = cost // 3
            p.wealth = max(0, p.wealth - cost)
            p.health -= rng.randint(2, 10); p.stress += 6; p.clamp()
            adjust_credit_score(p, -5, "Unexpected medical bill hit cash buffer")
            return f"Unexpected medical bill (−${cost}). Health hit; Stress rises."
        p.happiness += 1; p.clamp()
        return "Lucky year, no major medical issues. Happiness +1."
    return Event("accident","Health Surprise",(18,90),condition,
        "Health events can surprise anyone:",
        [Choice("a","Proceed", a)], once=False)

# ============================================================
# Relationships & travel (abbrev)
# ============================================================
def evt_romance():
    def condition(p: Person): return 18 <= p.age <= 40 and p.partner_status is None and p.relationships.get("friends",50) >= 40
    def a(p: Person, rng: random.Random):
        p.partner_status = "Dating"; p.happiness += 4; p.traits["charisma"] += 2; p.clamp()
        return "You start dating someone special. Happiness +4."
    def b(p: Person, rng: random.Random):
        p.traits["ambition"] += 3; p.happiness += 1; p.clamp()
        return "You focus on career and pass on dating. Ambition +3."
    def c(p: Person, rng: random.Random):
        p.relationships["friends"] += 5; p.happiness += 2; p.clamp()
        return "You keep it casual and expand your social circle. Friends +5."
    return Event("romance","Romance Opportunity",(18,40),condition,
        "A chance at romance appears:",
        [Choice("a","Start a serious relationship", a), Choice("b","Prioritize career", b), Choice("c","Keep things casual", c)], once=True)

def evt_commitment():
    def condition(p: Person): return 22 <= p.age <= 45 and p.partner_status == "Dating"
    def a(p: Person, rng: random.Random):
        cost = 5000 + rng.randint(0,5000)
        p.wealth = max(0, p.wealth - cost)
        p.partner_status = "Married"; p.happiness += 5; p.relationships["family"] += 5; p.reputation += 2; p.clamp()
        return f"You get married. Wedding/relocation costs ${cost}. Happiness +5."
    def b(p: Person, rng: random.Random):
        p.happiness += 2; p.clamp()
        return "You keep dating without changing status. Happiness +2."
    def c(p: Person, rng: random.Random):
        p.partner_status = None; p.happiness -= 3; p.clamp()
        return "You end the relationship. Happiness −3."
    return Event("commitment","Commitment Decision",(22,45),condition,
        "Relationship is getting serious. Next step?",
        [Choice("a","Marry / move in", a), Choice("b","Stay the course", b), Choice("c","Break up", c)], once=False)

def evt_travel_opportunity():
    def condition(p: Person): return p.age >= 16 and p.wealth >= 300
    def a(p: Person, rng: random.Random):
        cost = int((600 + rng.randint(0,600)) * col_multiplier(p))
        p.wealth = max(0, p.wealth - cost); p.happiness += 2; p.traits["charisma"] += 1
        p.add_country("Canada"); p.clamp()
        return f"Short trip (${cost}). Charisma +1, Happiness +2. Visited: Canada."
    def b(p: Person, rng: random.Random):
        cost = int((1500 + rng.randint(0,1500)) * col_multiplier(p))
        dest = rng.choice(["Japan","Italy","Mexico","UK","India","Australia","Brazil","Germany","Spain"])
        p.wealth = max(0, p.wealth - cost); p.happiness += 4; p.intelligence += 1
        p.add_country(dest); p.clamp()
        return f"International travel to {dest} (${cost}). Happiness +4, Intelligence +1."
    def c(p: Person, rng: random.Random):
        p.happiness += 1; p.clamp()
        return "Stay local and explore your city. Happiness +1."
    return Event("travel","Travel Opportunity",(16,90),condition,
        "A chance to travel appears:",
        [Choice("a","Short trip (nearby)", a), Choice("b","International trip", b), Choice("c","Stay local", c)], once=False)

# ============================================================
# Crime & justice events (safe, non-instructional)
# ============================================================
def evt_crime_temptation():
    def condition(p: Person):
        # Economic stress, low ethics, or peer pressure increases chance to see this
        return 18 <= p.age <= 60 and (p.wealth < 1000 or p.traits["ethics"] < 50 or p.reputation < 45)
    def a(p: Person, rng: random.Random):
        # Say no (recommended)
        p.reputation += 2; p.traits["ethics"] += 3; p.happiness += 1; p.clamp()
        return "You refuse questionable activity. Reputation +2, Ethics +3."
    def b(p: Person, rng: random.Random):
        # Petty wrongdoing -> likely fine/community service
        if rng.random() < 0.6:
            fine = 300 + rng.randint(0, 700)
            p.wealth = max(0, p.wealth - fine)
            p.reputation -= 6; p.traits["ethics"] -= 4; p.stress += 6; p.criminal_record = True
            p.credit_history.append("Derogatory mark: legal fine")
            adjust_credit_score(p, -20, "Court fine recorded")
            p.clamp()
            return f"You’re cited and fined (−${fine}). Record noted."
        else:
            gain = rng.randint(100, 600)
            p.wealth += gain; p.reputation -= 4; p.traits["ethics"] -= 2; p.stress += 3; p.clamp()
            return f"You narrowly avoid consequences, gain ${gain}, but reputation suffers."
    def c(p: Person, rng: random.Random):
        # White-collar scheme (not advised) — higher stakes
        risk = 0.5 - 0.002*(p.intelligence-50) - 0.002*(p.traits["discipline"]-50)
        if rng.random() < max(0.15, risk):
            # Caught → probation/jail, big hit
            penalty = 3000 + rng.randint(0,7000)
            p.wealth = max(0, p.wealth - penalty)
            p.reputation -= 20; p.traits["ethics"] -= 8; p.criminal_record = True
            p.probation_years = rng.randint(1, 3)
            p.stress += 12; adjust_credit_score(p, -60, "Felony/serious derogatory mark")
            p.career = None; p.career_level = 0
            p.add_log("Serious legal outcome: probation set; job lost")
            p.clamp()
            return f"You’re prosecuted. Penalties −${penalty}, probation {p.probation_years} years."
        else:
            gain = rng.randint(1000, 6000)
            p.wealth += gain; p.reputation -= 8; p.traits["ethics"] -= 5; p.stress += 6; p.clamp()
            return f"You avoid detection this year and gain ${gain}. Reputation and ethics suffer."
    return Event("crime_tempt","Questionable Offer",(18,60),condition,
        "Someone proposes something clearly unethical/illegal. What do you do?",
        [Choice("a","Refuse", a), Choice("b","Petty wrongdoing (risky)", b), Choice("c","White-collar scheme (very risky)", c)], once=False)

def evt_record_rehabilitation():
    def condition(p: Person):
        return p.criminal_record and p.age >= 21
    def a(p: Person, rng: random.Random):
        p.reputation += 6; p.traits["ethics"] += 5; p.happiness += 2; p.stress -= 3
        adjust_credit_score(p, +10, "Rehabilitation & stable history")
        p.clamp()
        return "You focus on rebuilding: counseling, community work, consistent routine."
    def b(p: Person, rng: random.Random):
        p.reputation += 1; p.clamp()
        return "You keep your head down. Slowly improving."
    return Event("rehab","Rebuilding After Mistakes",(21,90),condition,
        "You consider steps to rebuild your life and standing.",
        [Choice("a","Active rehabilitation", a), Choice("b","Quiet year", b)], once=False)

# ============================================================
# Passive yearly effects, mortgage amortization, credit aging, taxes & mortality
# ============================================================
def passive_year_effects(p: Person, rng: random.Random):
    # Investment growth
    port = p.traits.get("portfolio", 0)
    if port > 0:
        growth_rate = rng.uniform(0.00, 0.10)
        gain = int(port * growth_rate)
        p.traits["portfolio"] = port + gain
        realized = int(gain * 0.6)
        p.wealth += realized
        if gain > 0:
            p.add_log(f"Investments appreciated by ~{int(growth_rate*100)}% → +${realized} cash")

    # Debt interest (non-mortgage)
    if p.debt > 0:
        interest = int(p.debt * 0.03)
        p.debt += interest
        p.add_log(f"Debt interest accrued +${interest}")

    # Career/partner income
    income = 0
    if p.career:
        lo, hi = career_income_range(p)
        add = rng.randint(lo, hi)
        if p.career == "Entrepreneur" and rng.random() < 0.25:
            add = -rng.randint(1000, 8000)
        income += add
        p.add_log(f"Income from {p.career}: ${add}")
    if p.partner_status == "Married":
        add_p = rng.randint(1000, 4000)
        income += add_p
        p.add_log(f"Partner contributed ${add_p}")

    # Taxes (simple)
    taxes = 0
    if income > 0:
        if income < 6000: rate = 0.05
        elif income < 15000: rate = 0.10
        else: rate = 0.15
        taxes = int(income * rate)
        p.wealth += (income - taxes)
        p.add_log(f"Taxes paid −${taxes}")
    else:
        p.wealth += income  # negative income reduces wealth

    # Housing: Rent vs Mortgage
    if p.housing == "Rent":
        rent_cost = int(p.rent)
        if p.wealth >= rent_cost:
            p.wealth -= rent_cost
            p.add_log(f"Paid rent −${rent_cost}")
            adjust_credit_score(p, +2, "On-time rent & bills (proxy)")
        else:
            p.add_log("Could not cover full rent; stress +5")
            p.stress += 5
            adjust_credit_score(p, -10, "Missed rental/bill obligations (proxy)")

    elif p.housing == "Own":
        # Amortize mortgage annually (very simplified)
        if p.mortgage_balance > 0 and p.mortgage_term_remaining > 0:
            annual_due = p.mortgage
            if p.wealth >= annual_due:
                p.wealth -= annual_due
                # Split into interest and principal (roughly)
                interest = int(p.mortgage_balance * p.mortgage_rate)
                principal = max(0, annual_due - interest)
                principal = min(principal, p.mortgage_balance)
                p.mortgage_balance -= principal
                p.mortgage_term_remaining = max(0, p.mortgage_term_remaining - 1)
                p.home_equity += principal
                p.add_log(f"Mortgage paid −${annual_due} (principal ${principal}, interest ${interest})")
                p.missed_mortgage_years = 0
                adjust_credit_score(p, +6, "On-time mortgage payment")
            else:
                p.missed_mortgage_years += 1
                p.stress += 8
                p.add_log("Missed mortgage payment this year.")
                adjust_credit_score(p, -40, "Missed mortgage payment")
                # Foreclosure risk
                if p.missed_mortgage_years >= 2:
                    loss = int(p.home_equity * 0.5)
                    p.home_equity = 0
                    p.housing = "Rent"
                    p.rent = int(900 * col_multiplier(p))
                    p.mortgage_balance = 0
                    p.mortgage_term_remaining = 0
                    p.mortgage_rate = 0.0
                    p.mortgage = 0
                    p.add_log(f"Foreclosure occurs. Equity lost (−${loss}). You must rent now.")
                    adjust_credit_score(p, -80, "Foreclosure")
        # Appreciation (if still own)
        if p.housing == "Own":
            appr = int(max(0, rng.uniform(0.00, 0.04)) * (p.home_equity + 12000))
            p.home_equity += appr
            p.add_log(f"Home equity +${appr}")

    # Health insurance premiums
    if p.health_insurance:
        prem = int(800 * col_multiplier(p))
        p.wealth = max(0, p.wealth - prem)
        p.add_log(f"Health insurance premium −${prem}")

    # Child expense
    if p.children > 0:
        cost = int((800 + 500 * p.children) * col_multiplier(p))
        p.wealth = max(0, p.wealth - cost)
        p.add_log(f"Child-related expenses −${cost}")

    # Revolving credit interest if carrying balance
    if p.credit_limit > 0 and p.credit_balance > 0:
        apr = 0.20
        interest = int(p.credit_balance * apr)
        p.credit_balance += interest
        p.credit_history.append(f"Revolving interest +${interest}")
        p.add_log(f"Card interest charged +${interest}")
        # Utilization effect
        util = credit_utilization(p)
        if util > 0.8:
            adjust_credit_score(p, -8, "High utilization")
        elif util < 0.3:
            adjust_credit_score(p, +3, "Low utilization")

    # Probation countdown
    if p.probation_years > 0:
        p.probation_years -= 1
        p.add_log("Probation year served.")

    # Stress & health interplay
    if p.stress > 70:
        p.health -= rng.randint(1, 4)
    elif p.stress < 30:
        p.health += 1
    p.health = max(0, min(100, p.health))

    # Aging wear & tear
    if p.age >= 50:
        p.health -= rng.randint(0, 3)
    if p.age >= 75:
        p.health -= rng.randint(1, 4)

    p.clamp()

def mortality_check(p: Person, rng: random.Random) -> bool:
    """Returns True if death occurs this year."""
    age_factor = max(0, p.age - 60) * 0.012
    health_factor = (50 - p.health) * 0.005 if p.health < 50 else 0
    stress_factor = (p.stress - 70) * 0.004 if p.stress > 70 else 0
    risk = max(0.0, age_factor + health_factor + stress_factor)
    if rng.random() < risk:
        cause = "natural causes" if p.health >= 40 else "health complications"
        p.add_log(f"Passed away due to {cause}.")
        p.alive = False
        return True
    return False

# ============================================================
# Save / Load
# ============================================================
def save_game(p: Person, path: str, seed: int, done_events: set):
    data = {
        "person": asdict(p),
        "seed": seed,
        "done_events": list(done_events),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"\nGame saved to {path}")

def load_game(path: str):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    person = Person(**data["person"])
    return person, int(data["seed"]), set(data.get("done_events", []))

# ============================================================
# Event pack (curated)
# ============================================================
BUILTIN_EVENTS: List[Event] = [
    # Childhood & schooling
    evt_childhood_checkup(),
    evt_school_path(),
    evt_highschool_decision(),
    evt_post_hs_paths(),
    evt_choose_major(),
    evt_grad_or_cert(),

    # Jobs / money
    evt_job_search_if_unemployed(),
    evt_promotion_or_switch(),
    evt_layoff_or_downturn(),
    evt_invest_or_spend(),

    # Housing & Mortgage
    evt_housing_choice(),
    evt_home_repairs(),
    evt_mortgage_refi(),

    # Credit
    evt_credit_card_offer(),
    evt_credit_checkup(),

    # Health & insurance
    evt_health_event(),
    evt_health_insurance(),
    evt_accident_or_bill(),

    # Relationships & travel (kept compact)
    evt_romance(),
    evt_commitment(),
    evt_travel_opportunity(),

    # Crime & rehabilitation
    evt_crime_temptation(),
    evt_record_rehabilitation(),
]

# ============================================================
# Main loop
# ============================================================
def run(name: str, seed: Optional[int], load_path: Optional[str]):
    if load_path:
        person, seed_loaded, done_events = load_game(load_path)
        if seed is None:
            seed = seed_loaded
        print(f"Loaded {person.name}, age {person.age}.")
    else:
        person = Person(name=name)
        done_events: set = set()

    if seed is None:
        seed = random.randrange(1, 10**9)
    rng = random.Random(seed)
    print(f"(Random seed = {seed})\n")

    while person.alive and person.age <= 100:
        print(f"\n====== Age {person.age} ======")
        candidates = [e for e in BUILTIN_EVENTS if e.is_applicable(person) and (not e.once or e.code not in done_events)]
        rng.shuffle(candidates)
        surfaced = candidates[:4]  # up to 4 events per year

        for event in surfaced:
            ans = ask_choice(event)
            chosen = next(c for c in event.choices if c.key.lower() == ans)
            outcome = chosen.apply(person, rng)
            person.add_log(f"{event.title}: {outcome}")
            if event.once:
                done_events.add(event.code)
            if not person.alive:
                break

        if not person.alive:
            break

        passive_year_effects(person, rng)
        if mortality_check(person, rng):
            break

        year_summary(person)
        person.age += 1

        explain_commands()
        cmd = input("> ").strip()
        if cmd.startswith(":save"):
            parts = cmd.split(maxsplit=1)
            path = parts[1] if len(parts) > 1 else "save.json"
            save_game(person, path, seed, done_events)
        elif cmd.startswith(":log"):
            parts = cmd.split(maxsplit=1)
            try:
                n = int(parts[1]) if len(parts) > 1 else 10
            except:
                n = 10
            print("\n— Recent Log —")
            for line in person.log[-n:]:
                print(" -", line)
            print()
        elif cmd == ":help":
            explain_commands()
        elif cmd == ":quit":
            print("Exiting. Bye!")
            return

    print("\n===== Final Summary =====")
    year_summary(person)
    print("Life Log:")
    for line in person.log:
        print(" -", line)

# ============================================================
# Entrypoint
# ============================================================
def main():
    ap = argparse.ArgumentParser(description="Text life simulator (mortgage + credit + crime pack)")
    ap.add_argument("--name", default="Alex")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--load", type=str, default=None, help="Path to save.json")
    args = ap.parse_args()
    try:
        run(args.name, args.seed, args.load)
    except KeyboardInterrupt:
        print("\n\nInterrupted. See you next time!")

if __name__ == "__main__":
    main()
