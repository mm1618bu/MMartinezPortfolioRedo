#!/usr/bin/env python3
"""
Test script for Productivity Variance Engine
Verifies that the implementation is working correctly
"""

import sys
import json
from datetime import date, timedelta

# Import the productivity variance engine
try:
    from productivity_variance import (
        ProductivityVarianceEngine,
        VarianceSimulationRequest,
        VarianceScenario,
        ProductivityVarianceProfile,
        ProductivityVarianceFactor,
        FactorCategory,
        create_preset_profile,
        create_common_factors,
    )
    print("✅ Successfully imported productivity_variance module")
except ImportError as e:
    print(f"❌ Failed to import productivity_variance: {e}")
    sys.exit(1)


def test_basic_simulation():
    """Test basic variance simulation"""
    print("\n" + "="*60)
    print("TEST 1: Basic Variance Simulation")
    print("="*60)
    
    engine = ProductivityVarianceEngine(seed=12345)
    
    request = VarianceSimulationRequest(
        organization_id="test-org-123",
        start_date=date(2026, 3, 1),
        end_date=date(2026, 3, 7),  # 1 week
        variance_scenario=VarianceScenario.CONSISTENT,
        baseline_units_per_hour=15.0,
        baseline_staff_needed=10,
        monte_carlo_runs=1,
    )
    
    try:
        result = engine.simulate_variance(request)
        print(f"✅ Simulation completed successfully")
        print(f"   Total days: {result.total_days}")
        print(f"   Data points: {len(result.data_points)}")
        print(f"   Mean productivity: {result.productivity_stats['mean']:.3f}")
        print(f"   Std deviation: {result.productivity_stats['std_dev']:.3f}")
        print(f"   Avg staffing variance: {result.staffing_impact['avg_variance']:.1f}")
        print(f"   Execution time: {result.execution_duration_ms:.2f}ms")
        return True
    except Exception as e:
        print(f"❌ Simulation failed: {e}")
        return False


def test_all_scenarios():
    """Test all variance scenarios"""
    print("\n" + "="*60)
    print("TEST 2: All Variance Scenarios")
    print("="*60)
    
    engine = ProductivityVarianceEngine()
    all_passed = True
    
    for scenario in VarianceScenario:
        if scenario == VarianceScenario.CUSTOM:
            continue  # Skip custom scenario
            
        try:
            request = VarianceSimulationRequest(
                organization_id="test-org-123",
                start_date=date(2026, 3, 1),
                end_date=date(2026, 3, 7),
                variance_scenario=scenario,
                baseline_units_per_hour=15.0,
                baseline_staff_needed=10,
            )
            
            result = engine.simulate_variance(request)
            print(f"✅ {scenario.value:15s} - Mean: {result.productivity_stats['mean']:.3f}, "
                  f"StdDev: {result.productivity_stats['std_dev']:.3f}")
        except Exception as e:
            print(f"❌ {scenario.value:15s} - Failed: {e}")
            all_passed = False
    
    return all_passed


def test_preset_profiles():
    """Test preset profile creation"""
    print("\n" + "="*60)
    print("TEST 3: Preset Profiles")
    print("="*60)
    
    all_passed = True
    
    for scenario in VarianceScenario:
        if scenario == VarianceScenario.CUSTOM:
            continue
            
        try:
            profile = create_preset_profile(scenario)
            print(f"✅ {scenario.value:15s} - Mean: {profile.mean_productivity_modifier:.2f}, "
                  f"StdDev: {profile.std_deviation:.2f}, "
                  f"Range: [{profile.min_modifier:.2f}, {profile.max_modifier:.2f}]")
        except Exception as e:
            print(f"❌ {scenario.value:15s} - Failed: {e}")
            all_passed = False
    
    return all_passed


def test_variance_factors():
    """Test variance factor application"""
    print("\n" + "="*60)
    print("TEST 4: Variance Factors")
    print("="*60)
    
    engine = ProductivityVarianceEngine(seed=42)
    
    # Create common factors
    factors = create_common_factors()
    print(f"✅ Created {len(factors)} common factors:")
    for factor in factors:
        print(f"   - {factor.name}: {factor.impact_magnitude:+.0%} impact, "
              f"{factor.probability:.0%} probability")
    
    # Run simulation with factors
    try:
        request = VarianceSimulationRequest(
            organization_id="test-org-123",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 31),
            variance_scenario=VarianceScenario.CONSISTENT,
            baseline_units_per_hour=15.0,
            baseline_staff_needed=10,
            variance_factors=factors,
        )
        
        result = engine.simulate_variance(request)
        
        # Count days with factors applied
        days_with_factors = sum(1 for dp in result.data_points if dp.contributing_factors)
        print(f"✅ Simulation with factors completed")
        print(f"   Days with factors applied: {days_with_factors}/{result.total_days}")
        
        return True
    except Exception as e:
        print(f"❌ Simulation with factors failed: {e}")
        return False


def test_shock_events():
    """Test shock event modeling"""
    print("\n" + "="*60)
    print("TEST 5: Shock Events")
    print("="*60)
    
    engine = ProductivityVarianceEngine()
    
    shock_events = [
        {"date": "2026-03-05", "impact": -0.30, "name": "System Outage"},
        {"date": "2026-03-15", "impact": 0.20, "name": "Process Improvement"},
    ]
    
    try:
        request = VarianceSimulationRequest(
            organization_id="test-org-123",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 31),
            variance_scenario=VarianceScenario.CONSISTENT,
            baseline_units_per_hour=15.0,
            baseline_staff_needed=10,
            shock_events=shock_events,
        )
        
        result = engine.simulate_variance(request)
        
        # Find days with shock events
        shock_days = [dp for dp in result.data_points if dp.contributing_factors]
        print(f"✅ Simulation with shock events completed")
        print(f"   Shock events detected: {len(shock_days)}")
        for dp in shock_days:
            print(f"   - {dp.date}: {', '.join(dp.contributing_factors)}")
        
        return True
    except Exception as e:
        print(f"❌ Simulation with shock events failed: {e}")
        return False


def test_temporal_patterns():
    """Test temporal pattern application"""
    print("\n" + "="*60)
    print("TEST 6: Temporal Patterns")
    print("="*60)
    
    engine = ProductivityVarianceEngine()
    
    # Create profile with temporal patterns
    profile = ProductivityVarianceProfile(
        mean_productivity_modifier=1.0,
        std_deviation=0.05,
        min_modifier=0.85,
        max_modifier=1.15,
        time_of_day_impact={9: 1.05, 17: 0.95},  # Higher morning, lower evening
        day_of_week_impact={0: 0.90, 2: 1.10},   # Lower Monday, higher Wednesday
        learning_curve_enabled=False,
        autocorrelation=0.5,
    )
    
    try:
        request = VarianceSimulationRequest(
            organization_id="test-org-123",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 14),  # 2 weeks
            variance_scenario=VarianceScenario.CONSISTENT,
            profile=profile,
            baseline_units_per_hour=15.0,
            baseline_staff_needed=10,
        )
        
        result = engine.simulate_variance(request)
        print(f"✅ Simulation with temporal patterns completed")
        print(f"   Total days: {result.total_days}")
        print(f"   Mean productivity: {result.productivity_stats['mean']:.3f}")
        
        return True
    except Exception as e:
        print(f"❌ Simulation with temporal patterns failed: {e}")
        return False


def test_learning_curve():
    """Test learning curve modeling"""
    print("\n" + "="*60)
    print("TEST 7: Learning Curve")
    print("="*60)
    
    engine = ProductivityVarianceEngine()
    
    # Create profile with learning curve
    profile = ProductivityVarianceProfile(
        mean_productivity_modifier=0.80,  # Start at 80%
        std_deviation=0.10,
        min_modifier=0.70,
        max_modifier=1.10,
        learning_curve_enabled=True,
        learning_rate=0.005,
        plateau_weeks=8,
        autocorrelation=0.6,
    )
    
    try:
        request = VarianceSimulationRequest(
            organization_id="test-org-123",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 5, 31),  # 3 months
            variance_scenario=VarianceScenario.IMPROVING,
            profile=profile,
            baseline_units_per_hour=15.0,
            baseline_staff_needed=10,
        )
        
        result = engine.simulate_variance(request)
        
        # Check for improvement trend
        first_week_avg = sum(dp.productivity_modifier for dp in result.data_points[:7]) / 7
        last_week_avg = sum(dp.productivity_modifier for dp in result.data_points[-7:]) / 7
        improvement = (last_week_avg - first_week_avg) / first_week_avg * 100
        
        print(f"✅ Learning curve simulation completed")
        print(f"   First week avg: {first_week_avg:.3f}")
        print(f"   Last week avg: {last_week_avg:.3f}")
        print(f"   Improvement: {improvement:+.1f}%")
        
        return True
    except Exception as e:
        print(f"❌ Learning curve simulation failed: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print(" PRODUCTIVITY VARIANCE ENGINE - TEST SUITE")
    print("="*70)
    
    tests = [
        test_basic_simulation,
        test_all_scenarios,
        test_preset_profiles,
        test_variance_factors,
        test_shock_events,
        test_temporal_patterns,
        test_learning_curve,
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"\n❌ Test {test_func.__name__} crashed: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "="*70)
    print(" TEST SUMMARY")
    print("="*70)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
