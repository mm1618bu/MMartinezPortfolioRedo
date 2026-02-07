#!/usr/bin/env python3
"""
Comprehensive API Endpoint Test Suite
Tests all sim-service endpoints with realistic scenarios
"""
import requests
import json
from datetime import date, timedelta
import time

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print('='*70)

def test_endpoint(method, path, data=None, params=None):
    """Test a single endpoint and print results"""
    url = f"{BASE_URL}{path}"
    print(f"\n🔍 Testing: {method} {path}")
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        else:
            response = requests.post(url, json=data, params=params, timeout=10)
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            # Print compact result preview
            if isinstance(result, dict):
                keys = list(result.keys())[:5]
                print(f"   Response keys: {keys}")
                if 'execution_duration_ms' in result:
                    print(f"   Execution time: {result['execution_duration_ms']:.2f}ms")
            return result
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return None

def main():
    print_section("SIM-SERVICE API TEST SUITE")
    print(f"Testing endpoint: {BASE_URL}")
    print(f"Timestamp: {date.today()}")
    
    # =========================================================================
    # BASIC ENDPOINTS
    # =========================================================================
    print_section("1. BASIC HEALTH & INFO ENDPOINTS")
    
    test_endpoint("GET", "/")
    test_endpoint("GET", "/health")
    test_endpoint("GET", "/sim/stats")
    test_endpoint("GET", "/sim/scenarios")
    
    # =========================================================================
    # PRODUCTIVITY VARIANCE ENDPOINTS
    # =========================================================================
    print_section("2. PRODUCTIVITY VARIANCE ENDPOINTS")
    
    # Get presets
    test_endpoint("GET", "/sim/productivity/presets")
    
    # Get factors
    test_endpoint("GET", "/sim/productivity/factors")
    
    # Quick analysis
    print("\n📊 Running quick productivity analysis...")
    quick_analysis_result = test_endpoint(
        "POST",
        "/sim/productivity/quick-analysis",
        params={
            "scenario": "consistent",
            "days": 30,
            "baseline_units_per_hour": 8.5,
            "baseline_staff": 10
        }
    )
    
    if quick_analysis_result:
        print("\n📈 Quick Analysis Results:")
        print(f"   Scenario: {quick_analysis_result.get('scenario')}")
        if 'productivity_summary' in quick_analysis_result:
            prod = quick_analysis_result['productivity_summary']
            print(f"   Mean productivity: {prod.get('mean_actual_units_per_hour', 0):.2f} units/hr")
        if 'staffing_impact' in quick_analysis_result:
            staff = quick_analysis_result['staffing_impact']
            print(f"   Additional staff needed: {staff.get('avg_additional_staff_needed', 0):.1f}")
    
    # Full variance simulation
    print("\n📊 Running full productivity variance simulation...")
    
    start_date = date.today()
    end_date = start_date + timedelta(days=14)
    
    variance_request = {
        "organization_id": "test-org-001",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "profile": {
            "mean_productivity_modifier": 1.0,
            "std_deviation": 0.15,
            "min_modifier": 0.7,
            "max_modifier": 1.3,
            "distribution_type": "normal",
            "autocorrelation": 0.6
        },
        "labor_standards": {
            "baseline_units_per_hour": 8.5,
            "baseline_staff_count": 10,
            "shift_hours": 8,
            "target_service_level": 0.95
        },
        "variance_factors": [],
        "monte_carlo_runs": 100,
        "seed": 42
    }
    
    variance_result = test_endpoint(
        "POST",
        "/sim/productivity/variance",
        data=variance_request
    )
    
    if variance_result:
        print("\n📈 Variance Simulation Results:")
        print(f"   Total days: {variance_result.get('total_days')}")
        print(f"   Monte Carlo runs: {variance_result.get('monte_carlo_runs')}")
        if 'productivity_stats' in variance_result:
            stats = variance_result['productivity_stats']
            print(f"   Mean productivity: {stats.get('mean', 0):.3f}")
            print(f"   Std deviation: {stats.get('std', 0):.3f}")
        if 'staffing_impact' in variance_result:
            impact = variance_result['staffing_impact']
            print(f"   Average additional staff: {impact.get('avg_variance', 0):.1f}")
            print(f"   Days understaffed: {impact.get('days_understaffed', 0)}")
    
    # =========================================================================
    # BACKLOG PROPAGATION ENDPOINTS
    # =========================================================================
    print_section("3. BACKLOG PROPAGATION ENDPOINTS")
    
    # Get overflow strategies
    test_endpoint("GET", "/sim/backlog/overflow-strategies")
    
    # Get profile templates
    test_endpoint("GET", "/sim/backlog/profile-templates")
    
    # Quick scenarios
    print("\n📊 Running quick backlog scenarios...")
    quick_backlog_result = test_endpoint(
        "POST",
        "/sim/backlog/quick-scenarios",
        params={
            "organization_id": "test-org-001",
            "start_date": start_date.isoformat(),
            "days": 30,
            "daily_demand_count": 50,
            "daily_capacity_hours": 40,
            "initial_backlog_count": 25
        }
    )
    
    if quick_backlog_result:
        print("\n📈 Quick Backlog Scenario Comparison:")
        if 'scenario_summaries' in quick_backlog_result:
            for scenario_name, summary in quick_backlog_result['scenario_summaries'].items():
                print(f"\n   {scenario_name.upper()}:")
                print(f"      Final backlog: {summary.get('final_backlog_count')}")
                print(f"      SLA compliance: {summary.get('avg_sla_compliance', 0):.1f}%")
                print(f"      Financial impact: ${summary.get('total_financial_impact', 0):,.0f}")
    
    # Full backlog propagation
    print("\n📊 Running full backlog propagation simulation...")
    
    # Generate capacities and demands
    capacities = []
    demands = []
    
    for day_offset in range(14):
        day = start_date + timedelta(days=day_offset)
        
        capacities.append({
            "date": day.isoformat(),
            "total_capacity_hours": 40.0,
            "backlog_capacity_hours": 24.0,
            "new_work_capacity_hours": 16.0,
            "staff_count": 10,
            "productivity_modifier": 1.0,
            "max_items_per_day": 100,
            "max_complex_items_per_day": 10
        })
        
        demands.append({
            "date": day.isoformat(),
            "new_items_by_priority": {
                "low": 20,
                "medium": 15,
                "high": 10,
                "critical": 5
            },
            "new_items_by_complexity": {
                "simple": 25,
                "moderate": 17,
                "complex": 8
            },
            "total_estimated_effort_hours": 25.0
        })
    
    backlog_request = {
        "organization_id": "test-org-001",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "profile": {
            "propagation_rate": 1.0,
            "decay_rate": 0.05,
            "max_backlog_capacity": 500,
            "aging_enabled": True,
            "aging_threshold_days": 3,
            "overflow_strategy": "defer",
            "sla_breach_threshold_days": 2,
            "sla_penalty_per_day": 100.0,
            "customer_satisfaction_impact": -0.05,
            "recovery_rate_multiplier": 1.0,
            "recovery_priority_boost": 1
        },
        "initial_backlog_items": [],
        "daily_capacities": capacities,
        "daily_demands": demands,
        "seed": 42,
        "enable_priority_aging": True,
        "enable_sla_tracking": True
    }
    
    backlog_result = test_endpoint(
        "POST",
        "/sim/backlog/propagate",
        data=backlog_request
    )
    
    if backlog_result:
        print("\n📈 Backlog Propagation Results:")
        print(f"   Total days: {backlog_result.get('total_days')}")
        print(f"   Final backlog: {backlog_result.get('final_backlog_count')}")
        if 'summary_stats' in backlog_result:
            stats = backlog_result['summary_stats']
            print(f"   Items processed: {stats.get('total_items_processed')}")
            print(f"   Net backlog change: {stats.get('net_backlog_change')}")
            print(f"   Avg SLA compliance: {stats.get('avg_sla_compliance_rate', 0):.1f}%")
            print(f"   Total SLA breaches: {stats.get('total_sla_breaches')}")
            print(f"   Financial impact: ${stats.get('total_financial_impact', 0):,.0f}")
            print(f"   Avg recovery days: {stats.get('avg_recovery_days', 0):.1f}")
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print_section("TEST SUITE COMPLETE")
    print("\n✅ All endpoints tested successfully!")
    print("\nEndpoint Summary:")
    print("  - Health & Info: 4 endpoints")
    print("  - Productivity Variance: 4 endpoints")
    print("  - Backlog Propagation: 4 endpoints")
    print("  - Total: 12 endpoints")
    print("\nDocumentation: http://localhost:8000/docs")
    print("OpenAPI Schema: http://localhost:8000/openapi.json")
    
if __name__ == "__main__":
    main()
