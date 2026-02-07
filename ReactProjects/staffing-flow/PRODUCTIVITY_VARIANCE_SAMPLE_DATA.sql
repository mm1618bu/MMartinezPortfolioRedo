-- =============================================
-- SAMPLE DATA FOR PRODUCTIVITY VARIANCE ENGINE
-- Run this AFTER creating the productivity variance schema
-- =============================================

-- This sample data demonstrates the productivity variance system with:
-- 1. Variance profiles for different departments
-- 2. Historical variance data
-- 3. Variance factors
-- 4. Sample simulations

-- Note: Replace UUIDs with actual IDs from your database
-- The script uses sample organization and department IDs

-- =============================================
-- SAMPLE PRODUCTIVITY VARIANCE PROFILES
-- =============================================

-- Profile 1: Consistent Customer Service
INSERT INTO productivity_variance_profiles (
  organization_id,
  department_id,
  name,
  description,
  task_type,
  mean_productivity_modifier,
  std_deviation,
  min_modifier,
  max_modifier,
  distribution_type,
  time_of_day_impact,
  day_of_week_impact,
  learning_curve_enabled,
  autocorrelation,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'Consistent CS Performance',
  'Stable, predictable customer service productivity with minimal variance',
  'customer_service',
  1.00,  -- Baseline productivity
  0.05,  -- Low standard deviation (±5%)
  0.90,  -- Min 90% of baseline
  1.10,  -- Max 110% of baseline
  'normal',
  -- Time of day impact: lower productivity early morning and late evening
  '{"6": 0.85, "7": 0.90, "8": 0.95, "9": 1.00, "10": 1.05, "11": 1.05, "12": 0.95, "13": 1.00, "14": 1.05, "15": 1.05, "16": 1.00, "17": 0.95, "18": 0.90, "19": 0.85}'::jsonb,
  -- Day of week: slightly lower on Mondays and Fridays
  '{"0": 0.95, "1": 1.00, "2": 1.05, "3": 1.05, "4": 0.95, "5": 0.90, "6": 0.85}'::jsonb,
  false,
  0.7,  -- High autocorrelation (yesterday predicts today)
  CURRENT_DATE,
  true
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, name, effective_date) DO NOTHING;

-- Profile 2: Volatile Operations
INSERT INTO productivity_variance_profiles (
  organization_id,
  department_id,
  name,
  description,
  task_type,
  mean_productivity_modifier,
  std_deviation,
  min_modifier,
  max_modifier,
  distribution_type,
  learning_curve_enabled,
  autocorrelation,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'Volatile Operations',
  'High variance operations with unpredictable productivity swings',
  'operations',
  1.00,
  0.25,  -- High variance (±25%)
  0.60,  -- Can drop to 60%
  1.40,  -- Can spike to 140%
  'normal',
  false,
  0.3,  -- Low autocorrelation (more random)
  CURRENT_DATE,
  true
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Operations'
ON CONFLICT (organization_id, department_id, name, effective_date) DO NOTHING;

-- Profile 3: Learning Curve for New Hires
INSERT INTO productivity_variance_profiles (
  organization_id,
  department_id,
  name,
  description,
  task_type,
  mean_productivity_modifier,
  std_deviation,
  min_modifier,
  max_modifier,
  distribution_type,
  learning_curve_enabled,
  learning_rate,
  plateau_weeks,
  autocorrelation,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'New Hire Ramp-Up',
  'Productivity profile for new employees with learning curve',
  'customer_service',
  0.80,  -- Start at 80% productivity
  0.10,
  0.70,
  1.10,
  'normal',
  true,   -- Learning curve enabled
  0.005,  -- 0.5% improvement rate
  12,     -- Plateau after 12 weeks
  0.6,
  CURRENT_DATE,
  true
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, name, effective_date) DO NOTHING;

-- Profile 4: Cyclical Weekly Pattern
INSERT INTO productivity_variance_profiles (
  organization_id,
  department_id,
  name,
  description,
  task_type,
  mean_productivity_modifier,
  std_deviation,
  min_modifier,
  max_modifier,
  distribution_type,
  day_of_week_impact,
  seasonal_impact,
  autocorrelation,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'Weekly Cycle Pattern',
  'Productivity varies by day of week and season',
  'sales',
  1.00,
  0.12,
  0.85,
  1.20,
  'normal',
  -- Strong weekly pattern (Mon-Thu high, Fri-Sun low)
  '{"0": 0.90, "1": 1.05, "2": 1.10, "3": 1.10, "4": 1.00, "5": 0.85, "6": 0.80}'::jsonb,
  -- Seasonal pattern (Q4 higher, Q2 lower)
  '{"1": 0.95, "2": 0.90, "3": 0.95, "4": 1.00, "5": 1.00, "6": 0.95, "7": 0.95, "8": 1.00, "9": 1.05, "10": 1.10, "11": 1.15, "12": 1.10}'::jsonb,
  0.5,
  CURRENT_DATE,
  true
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Sales'
ON CONFLICT (organization_id, department_id, name, effective_date) DO NOTHING;

-- =============================================
-- SAMPLE PRODUCTIVITY VARIANCE FACTORS
-- =============================================

INSERT INTO productivity_variance_factors (
  organization_id,
  name,
  description,
  category,
  impact_magnitude,
  impact_frequency,
  impact_duration_hours,
  measurement_method,
  mitigation_strategies,
  mitigation_effectiveness,
  is_active
)
VALUES 
(
  'a0000000-0000-4000-8000-000000000001',
  'System Downtime',
  'IT system outages or slowdowns affecting work capacity',
  'equipment',
  -30.00,  -- 30% productivity loss
  'random',
  2,
  'IT monitoring logs',
  ARRAY['Redundant systems', 'Faster incident response', 'Offline procedures'],
  0.70,
  true
),
(
  'a0000000-0000-4000-8000-000000000001',
  'Early Morning Fatigue',
  'Reduced productivity during early morning hours (6-8 AM)',
  'temporal',
  -15.00,
  'constant',
  2,
  'Time-based productivity tracking',
  ARRAY['Later start times', 'Morning break protocol', 'Task scheduling'],
  0.50,
  true
),
(
  'a0000000-0000-4000-8000-000000000001',
  'Training Session',
  'Scheduled training reducing available working time',
  'training',
  -25.00,
  'periodic',
  4,
  'Training schedule',
  ARRAY['Off-shift training', 'Compressed training modules'],
  0.30,
  true
),
(
  'a0000000-0000-4000-8000-000000000001',
  'Peak Demand Stress',
  'Reduced efficiency during high-volume periods',
  'workload',
  -20.00,
  'periodic',
  3,
  'Volume vs. productivity correlation',
  ARRAY['Additional staffing', 'Process simplification', 'Priority queuing'],
  0.60,
  true
),
(
  'a0000000-0000-4000-8000-000000000001',
  'Process Improvement',
  'Productivity gains from new tools or processes',
  'equipment',
  15.00,
  'event-driven',
  240,  -- 10 days
  'Before/after productivity comparison',
  ARRAY['Change management', 'Training support'],
  0.80,
  true
),
(
  'a0000000-0000-4000-8000-000000000001',
  'Weather Impact',
  'Severe weather affecting commute and attendance',
  'external',
  -10.00,
  'random',
  8,
  'Weather correlation analysis',
  ARRAY['Remote work options', 'Flexible schedules'],
  0.75,
  true
),
(
  'a0000000-0000-4000-8000-000000000001',
  'Equipment Aging',
  'Gradual performance degradation of equipment over time',
  'equipment',
  -5.00,
  'constant',
  2160,  -- 90 days
  'Maintenance logs',
  ARRAY['Preventive maintenance', 'Equipment replacement cycle'],
  0.85,
  true
)
ON CONFLICT (organization_id, name) DO NOTHING;

-- =============================================
-- SAMPLE PRODUCTIVITY VARIANCE HISTORY
-- =============================================

-- Generate 30 days of historical variance data for Customer Service
-- This demonstrates realistic productivity fluctuations

DO $$
DECLARE
  v_org_id UUID := 'a0000000-0000-4000-8000-000000000001';
  v_dept_id UUID;
  v_profile_id UUID;
  v_labor_std_id UUID;
  v_date DATE;
  v_modifier DECIMAL;
  v_baseline DECIMAL := 15.00;  -- 15 units per hour baseline
  v_actual DECIMAL;
  v_baseline_staff INTEGER := 10;
  v_adjusted_staff INTEGER;
BEGIN
  -- Get department and profile IDs
  SELECT id INTO v_dept_id 
  FROM departments 
  WHERE organization_id = v_org_id AND name = 'Customer Service';
  
  SELECT id INTO v_profile_id
  FROM productivity_variance_profiles
  WHERE organization_id = v_org_id AND name = 'Consistent CS Performance';
  
  SELECT id INTO v_labor_std_id
  FROM labor_standards
  WHERE organization_id = v_org_id AND department_id = v_dept_id
  LIMIT 1;
  
  -- Generate data for the last 30 days
  FOR i IN 0..29 LOOP
    v_date := CURRENT_DATE - i;
    
    -- Simulate productivity variance (random within range)
    v_modifier := 0.90 + (random() * 0.20);  -- Between 0.90 and 1.10
    
    -- Apply day of week effect
    IF EXTRACT(DOW FROM v_date) IN (0, 6) THEN
      v_modifier := v_modifier * 0.85;  -- Weekends lower
    END IF;
    
    v_actual := v_baseline * v_modifier;
    v_adjusted_staff := CEIL(v_baseline_staff / v_modifier);
    
    INSERT INTO productivity_variance_history (
      organization_id,
      department_id,
      variance_profile_id,
      variance_date,
      labor_standard_id,
      task_type,
      baseline_units_per_hour,
      actual_units_per_hour,
      productivity_modifier,
      variance_percentage,
      baseline_staff_needed,
      adjusted_staff_needed,
      staffing_variance,
      data_source,
      notes
    )
    VALUES (
      v_org_id,
      v_dept_id,
      v_profile_id,
      v_date,
      v_labor_std_id,
      'customer_service',
      v_baseline,
      v_actual,
      v_modifier,
      ((v_modifier - 1.0) * 100),
      v_baseline_staff,
      v_adjusted_staff,
      (v_adjusted_staff - v_baseline_staff),
      'observed',
      CASE 
        WHEN v_modifier < 0.95 THEN 'Below average productivity'
        WHEN v_modifier > 1.05 THEN 'Above average productivity'
        ELSE 'Normal productivity'
      END
    )
    ON CONFLICT (organization_id, department_id, variance_date, hour_of_day, task_type) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SAMPLE VARIANCE SIMULATIONS
-- =============================================

-- Example: Consistent scenario simulation
INSERT INTO productivity_variance_simulations (
  organization_id,
  name,
  description,
  start_date,
  end_date,
  variance_scenario,
  seed,
  monte_carlo_runs,
  confidence_level,
  status,
  results_summary,
  staffing_impact,
  risk_metrics
)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Q1 2026 Consistent Planning',
  'Baseline productivity simulation for Q1 planning',
  '2026-01-01',
  '2026-03-31',
  'consistent',
  12345,
  1,
  0.95,
  'completed',
  '{"mean": 1.00, "std_dev": 0.05, "min": 0.90, "max": 1.10, "percentile_90": 1.05}'::jsonb,
  '{"avg_variance": 0.2, "max_additional_staff": 2, "days_understaffed": 8, "total_additional_staff_days": 15}'::jsonb,
  '{"probability_below_90pct": 0.05, "probability_below_80pct": 0.00, "volatility": 0.05}'::jsonb
);

-- Example: High variance scenario
INSERT INTO productivity_variance_simulations (
  organization_id,
  name,
  description,
  start_date,
  end_date,
  variance_scenario,
  seed,
  monte_carlo_runs,
  confidence_level,
  status,
  results_summary,
  staffing_impact,
  risk_metrics
)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Volatile Operations Analysis',
  'High variance scenario for operations department',
  '2026-02-01',
  '2026-02-29',
  'volatile',
  54321,
  1,
  0.95,
  'completed',
  '{"mean": 1.00, "std_dev": 0.25, "min": 0.60, "max": 1.40, "percentile_90": 1.20}'::jsonb,
  '{"avg_variance": 1.5, "max_additional_staff": 7, "days_understaffed": 18, "total_additional_staff_days": 42}'::jsonb,
  '{"probability_below_90pct": 0.30, "probability_below_80pct": 0.15, "volatility": 0.25}'::jsonb
);

-- =============================================
-- SAMPLE VARIANCE FACTOR INSTANCES
-- =============================================

-- Record some specific occurrences of variance factors
INSERT INTO productivity_variance_factor_instances (
  organization_id,
  factor_id,
  department_id,
  occurrence_date,
  start_hour,
  end_hour,
  actual_impact,
  description,
  affected_employees,
  mitigation_applied
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  f.id,
  d.id,
  CURRENT_DATE - 5,
  9,
  11,
  -28.00,
  'Network outage affecting all customer service systems',
  25,
  ARRAY['Switched to backup system', 'Deployed offline procedures']
FROM productivity_variance_factors f
CROSS JOIN departments d
WHERE f.organization_id = 'a0000000-0000-4000-8000-000000000001'
  AND f.name = 'System Downtime'
  AND d.organization_id = 'a0000000-0000-4000-8000-000000000001'
  AND d.name = 'Customer Service';

INSERT INTO productivity_variance_factor_instances (
  organization_id,
  factor_id,
  department_id,
  occurrence_date,
  start_hour,
  end_hour,
  actual_impact,
  description,
  affected_employees,
  mitigation_applied
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  f.id,
  d.id,
  CURRENT_DATE - 10,
  13,
  17,
  -22.00,
  'Mandatory training on new product line',
  15,
  ARRAY['Scheduled during lower volume period']
FROM productivity_variance_factors f
CROSS JOIN departments d
WHERE f.organization_id = 'a0000000-0000-4000-8000-000000000001'
  AND f.name = 'Training Session'
  AND d.organization_id = 'a0000000-0000-4000-8000-000000000001'
  AND d.name = 'Customer Service';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- View variance profiles
-- SELECT * FROM active_variance_profiles_with_stats;

-- View recent variance history
-- SELECT * FROM recent_variance_trends LIMIT 20;

-- View simulation summary
-- SELECT * FROM variance_simulation_summary;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN productivity_variance_profiles.time_of_day_impact IS 
  'Example: {"9": 1.05, "17": 0.95} means 5% higher productivity at 9 AM, 5% lower at 5 PM';

COMMENT ON COLUMN productivity_variance_profiles.day_of_week_impact IS 
  'Example: {"0": 0.90, "4": 1.05} means 10% lower on Monday (0), 5% higher on Friday (4)';

COMMENT ON COLUMN productivity_variance_profiles.seasonal_impact IS 
  'Example: {"12": 1.10, "6": 0.95} means 10% higher in December, 5% lower in June';
