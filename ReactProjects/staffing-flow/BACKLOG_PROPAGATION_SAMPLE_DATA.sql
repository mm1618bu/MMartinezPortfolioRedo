-- ============================================================================
-- Backlog Propagation Sample Data
-- Sample profiles, items, and scenarios for testing backlog propagation
-- ============================================================================

-- Sample Organizations (reusing from existing data)
-- Assumes 'Demo Corporation' with org_id exists

-- ============================================================================
-- Backlog Propagation Profiles
-- ============================================================================

-- Profile 1: Standard Flow - Balanced propagation
INSERT INTO backlog_propagation_profiles (
    organization_id,
    profile_name,
    description,
    propagation_rate,
    decay_rate,
    max_backlog_capacity,
    aging_enabled,
    aging_threshold_days,
    priority_upgrade_strategy,
    overflow_strategy,
    overflow_threshold_items,
    sla_breach_threshold_days,
    sla_penalty_per_day,
    customer_satisfaction_impact,
    recovery_rate_multiplier,
    recovery_priority_boost,
    is_active
) VALUES (
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'Standard Flow',
    'Balanced propagation with moderate constraints for normal operations',
    1.0,
    0.05,
    500,
    TRUE,
    3,
    'age_based',
    'defer',
    450,
    2,
    100.00,
    -0.05,
    1.0,
    1,
    TRUE
);

-- Profile 2: High Volume - Strict capacity limits
INSERT INTO backlog_propagation_profiles (
    organization_id,
    profile_name,
    description,
    propagation_rate,
    decay_rate,
    max_backlog_capacity,
    aging_enabled,
    aging_threshold_days,
    priority_upgrade_strategy,
    overflow_strategy,
    overflow_threshold_items,
    sla_breach_threshold_days,
    sla_penalty_per_day,
    customer_satisfaction_impact,
    recovery_rate_multiplier,
    recovery_priority_boost,
    is_active
) VALUES (
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'High Volume',
    'Handles high demand with strict capacity limits and overflow management',
    1.0,
    0.02,
    300,
    TRUE,
    2,
    'age_based',
    'reject',
    280,
    1,
    150.00,
    -0.10,
    1.0,
    1,
    TRUE
);

-- Profile 3: Recovery Mode - Optimized for backlog clearance
INSERT INTO backlog_propagation_profiles (
    organization_id,
    profile_name,
    description,
    propagation_rate,
    decay_rate,
    max_backlog_capacity,
    aging_enabled,
    aging_threshold_days,
    priority_upgrade_strategy,
    overflow_strategy,
    overflow_threshold_items,
    sla_breach_threshold_days,
    sla_penalty_per_day,
    customer_satisfaction_impact,
    recovery_rate_multiplier,
    recovery_priority_boost,
    is_active
) VALUES (
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'Recovery Mode',
    'Optimized for clearing existing backlog with capacity boost',
    0.8,
    0.10,
    1000,
    FALSE,
    5,
    'none',
    'defer',
    900,
    3,
    100.00,
    -0.03,
    1.50,
    2,
    TRUE
);

-- Profile 4: Strict SLA - Prioritizes compliance
INSERT INTO backlog_propagation_profiles (
    organization_id,
    profile_name,
    description,
    propagation_rate,
    decay_rate,
    max_backlog_capacity,
    aging_enabled,
    aging_threshold_days,
    priority_upgrade_strategy,
    overflow_strategy,
    overflow_threshold_items,
    sla_breach_threshold_days,
    sla_penalty_per_day,
    customer_satisfaction_impact,
    recovery_rate_multiplier,
    recovery_priority_boost,
    is_active
) VALUES (
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'Strict SLA',
    'Prioritizes SLA compliance and rapid resolution with aggressive aging',
    1.0,
    0.03,
    400,
    TRUE,
    1,
    'sla_based',
    'escalate',
    380,
    1,
    250.00,
    -0.15,
    1.20,
    1,
    TRUE
);

-- Profile 5: Flexible Flow - Accommodates variability
INSERT INTO backlog_propagation_profiles (
    organization_id,
    profile_name,
    description,
    propagation_rate,
    decay_rate,
    max_backlog_capacity,
    aging_enabled,
    aging_threshold_days,
    priority_upgrade_strategy,
    overflow_strategy,
    overflow_threshold_items,
    sla_breach_threshold_days,
    sla_penalty_per_day,
    customer_satisfaction_impact,
    recovery_rate_multiplier,
    recovery_priority_boost,
    is_active
) VALUES (
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'Flexible Flow',
    'Accommodates variability with elastic capacity for internal work',
    1.0,
    0.07,
    NULL,
    TRUE,
    4,
    'age_based',
    'defer',
    NULL,
    3,
    75.00,
    -0.02,
    1.10,
    1,
    TRUE
);

-- ============================================================================
-- Backlog Propagation Rules
-- ============================================================================

-- Rule 1: Escalate critical items approaching SLA
INSERT INTO backlog_propagation_rules (
    profile_id,
    rule_name,
    description,
    rule_condition,
    action_type,
    action_parameters,
    priority_threshold,
    age_threshold_days,
    sla_days_remaining_threshold,
    execution_order,
    is_active
) VALUES (
    (SELECT id FROM backlog_propagation_profiles WHERE profile_name = 'Strict SLA' LIMIT 1),
    'Escalate Near-SLA Critical Items',
    'Automatically escalate critical priority items within 1 day of SLA breach',
    'sla_approach',
    'priority_upgrade',
    '{"levels": 1, "notify": true}',
    'critical',
    NULL,
    1,
    1,
    TRUE
);

-- Rule 2: Outsource complex items during overflow
INSERT INTO backlog_propagation_rules (
    profile_id,
    rule_name,
    description,
    rule_condition,
    action_type,
    action_parameters,
    complexity_threshold,
    overflow_threshold_pct,
    execution_order,
    is_active
) VALUES (
    (SELECT id FROM backlog_propagation_profiles WHERE profile_name = 'High Volume' LIMIT 1),
    'Outsource Complex Overflow Items',
    'Mark complex items for outsourcing when backlog exceeds 90% capacity',
    'overflow',
    'outsource',
    '{"vendor": "external_team", "max_items": 20}',
    'complex',
    90.0,
    2,
    TRUE
);

-- Rule 3: Defer low priority items during high load
INSERT INTO backlog_propagation_rules (
    profile_id,
    rule_name,
    description,
    rule_condition,
    action_type,
    action_parameters,
    priority_threshold,
    overflow_threshold_pct,
    execution_order,
    is_active
) VALUES (
    (SELECT id FROM backlog_propagation_profiles WHERE profile_name = 'Standard Flow' LIMIT 1),
    'Defer Low Priority on High Load',
    'Defer low priority items when backlog exceeds 85% capacity',
    'overflow',
    'defer',
    '{"defer_days": 7, "notify": false}',
    'low',
    85.0,
    3,
    TRUE
);

-- Rule 4: Age up high priority items rapidly
INSERT INTO backlog_propagation_rules (
    profile_id,
    rule_name,
    description,
    rule_condition,
    action_type,
    action_parameters,
    priority_threshold,
    age_threshold_days,
    execution_order,
    is_active
) VALUES (
    (SELECT id FROM backlog_propagation_profiles WHERE profile_name = 'Strict SLA' LIMIT 1),
    'Rapid Aging for High Priority',
    'Upgrade high priority items to critical after 2 days in backlog',
    'age',
    'priority_upgrade',
    '{"levels": 1, "notify": true}',
    'high',
    2,
    1,
    TRUE
);

-- Rule 5: Reject new low priority during recovery
INSERT INTO backlog_propagation_rules (
    profile_id,
    rule_name,
    description,
    rule_condition,
    action_type,
    action_parameters,
    priority_threshold,
    backlog_size_threshold,
    execution_order,
    is_active
) VALUES (
    (SELECT id FROM backlog_propagation_profiles WHERE profile_name = 'Recovery Mode' LIMIT 1),
    'Reject Low Priority During Recovery',
    'Reject new low priority items during recovery mode to focus on backlog clearance',
    'new_item',
    'reject',
    '{"reason": "recovery_mode", "notify": true}',
    'low',
    100,
    1,
    TRUE
);

-- ============================================================================
-- Sample Backlog Items
-- ============================================================================

-- Helper function to generate sample items
DO $$
DECLARE
    org_id uuid;
    profile_id uuid;
    item_date date;
    priority_val text;
    complexity_val text;
    item_count integer := 0;
BEGIN
    -- Get org and profile IDs
    SELECT id INTO org_id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1;
    SELECT id INTO profile_id FROM backlog_propagation_profiles WHERE profile_name = 'Standard Flow' LIMIT 1;
    
    -- Generate 50 sample backlog items over past 7 days
    FOR day_offset IN 0..6 LOOP
        item_date := CURRENT_DATE - day_offset;
        
        -- Create 5-10 items per day with varying priorities
        FOR item_idx IN 1..8 LOOP
            item_count := item_count + 1;
            
            -- Vary priority (weighted distribution)
            CASE (item_count % 10)
                WHEN 0, 1, 2, 3 THEN priority_val := 'low';
                WHEN 4, 5, 6 THEN priority_val := 'medium';
                WHEN 7, 8 THEN priority_val := 'high';
                ELSE priority_val := 'critical';
            END CASE;
            
            -- Vary complexity
            CASE (item_count % 3)
                WHEN 0 THEN complexity_val := 'simple';
                WHEN 1 THEN complexity_val := 'moderate';
                ELSE complexity_val := 'complex';
            END CASE;
            
            INSERT INTO backlog_items (
                organization_id,
                profile_id,
                item_type,
                external_reference_id,
                priority,
                original_priority,
                complexity,
                estimated_effort_minutes,
                created_date,
                due_date,
                status,
                sla_breached,
                days_in_backlog,
                propagation_count,
                metadata
            ) VALUES (
                org_id,
                profile_id,
                'work_request',
                'REQ-' || LPAD(item_count::text, 6, '0'),
                priority_val,
                priority_val,
                complexity_val,
                CASE complexity_val
                    WHEN 'simple' THEN 15 + (item_count % 15)
                    WHEN 'moderate' THEN 30 + (item_count % 30)
                    ELSE 60 + (item_count % 60)
                END,
                item_date,
                item_date + INTERVAL '2 days',
                'pending',
                FALSE,
                day_offset,
                day_offset,
                jsonb_build_object(
                    'source', 'sample_data',
                    'category', 'customer_request',
                    'requester', 'sample_user_' || (item_count % 10)
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- Backlog Capacity Plans
-- ============================================================================

-- Capacity plan for standard operations (next 30 days)
DO $$
DECLARE
    org_id uuid;
    dept_id uuid;
    plan_date date;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1;
    SELECT id INTO dept_id FROM departments WHERE name = 'Operations' AND organization_id = org_id LIMIT 1;
    
    -- Generate 30 days of capacity data
    FOR day_offset IN 0..29 LOOP
        plan_date := CURRENT_DATE + day_offset;
        
        INSERT INTO backlog_capacity_plans (
            organization_id,
            department_id,
            plan_date,
            total_capacity_hours,
            backlog_capacity_hours,
            new_work_capacity_hours,
            available_staff_count,
            productivity_modifier,
            max_items_per_day,
            max_complex_items_per_day,
            notes
        ) VALUES (
            org_id,
            dept_id,
            plan_date,
            40.0,  -- Base capacity
            24.0,  -- 60% to backlog
            16.0,  -- 40% to new work
            10,    -- Staff count
            1.0,   -- Normal productivity
            100,   -- Max items
            10,    -- Max complex items
            CASE 
                WHEN EXTRACT(DOW FROM plan_date) IN (0, 6) THEN 'Weekend - reduced capacity'
                WHEN day_offset BETWEEN 14 AND 16 THEN 'Holiday period - reduced staffing'
                ELSE NULL
            END
        );
    END LOOP;
END $$;

-- Capacity plan for recovery period (boost capacity)
DO $$
DECLARE
    org_id uuid;
    dept_id uuid;
    plan_date date;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1;
    SELECT id INTO dept_id FROM departments WHERE name = 'Operations' AND organization_id = org_id LIMIT 1;
    
    -- Add recovery capacity for days 30-44 (2 weeks)
    FOR day_offset IN 30..43 LOOP
        plan_date := CURRENT_DATE + day_offset;
        
        INSERT INTO backlog_capacity_plans (
            organization_id,
            department_id,
            plan_date,
            total_capacity_hours,
            backlog_capacity_hours,
            new_work_capacity_hours,
            available_staff_count,
            productivity_modifier,
            max_items_per_day,
            max_complex_items_per_day,
            notes
        ) VALUES (
            org_id,
            dept_id,
            plan_date,
            52.0,  -- Increased capacity (30% boost)
            40.0,  -- 77% to backlog (recovery focus)
            12.0,  -- 23% to new work
            13,    -- Increased staff
            1.20,  -- Productivity boost
            130,   -- Increased max items
            15,    -- Increased complex items
            'Recovery mode - Extra capacity allocated for backlog clearance'
        );
    END LOOP;
END $$;

-- ============================================================================
-- Simulation Runs for Documentation
-- ============================================================================

-- Create sample simulation runs to demonstrate the system
INSERT INTO simulation_runs (
    organization_id,
    simulation_type,
    name,
    description,
    start_date,
    end_date,
    parameters,
    status
) VALUES 
(
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'backlog_propagation',
    'Standard Flow - 30 Day Projection',
    'Baseline simulation of backlog propagation with standard profile',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    jsonb_build_object(
        'profile_name', 'Standard Flow',
        'initial_backlog_count', 50,
        'daily_demand_count', 45,
        'daily_capacity_hours', 40
    ),
    'draft'
),
(
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'backlog_propagation',
    'High Volume Stress Test',
    'Simulation with elevated demand to test overflow handling',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    jsonb_build_object(
        'profile_name', 'High Volume',
        'initial_backlog_count', 80,
        'daily_demand_count', 75,
        'daily_capacity_hours', 40
    ),
    'draft'
),
(
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'backlog_propagation',
    'Recovery Mode - Backlog Clearance',
    'Simulation demonstrating backlog reduction with recovery profile',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    jsonb_build_object(
        'profile_name', 'Recovery Mode',
        'initial_backlog_count', 150,
        'daily_demand_count', 25,
        'daily_capacity_hours', 52,
        'recovery_boost', 1.5
    ),
    'draft'
),
(
    (SELECT id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1),
    'backlog_propagation',
    'Strict SLA Compliance Test',
    'Simulation with aggressive SLA requirements and priority aging',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    jsonb_build_object(
        'profile_name', 'Strict SLA',
        'initial_backlog_count', 40,
        'daily_demand_count', 50,
        'daily_capacity_hours', 45
    ),
    'draft'
);

-- ============================================================================
-- Sample Snapshots (Historical data for trend analysis)
-- ============================================================================

-- Generate 7 days of historical snapshots
DO $$
DECLARE
    org_id uuid;
    snapshot_date date;
    backlog_count integer;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE name = 'Demo Corporation' LIMIT 1;
    
    -- Generate decreasing backlog (successful clearance trend)
    FOR day_offset IN 0..6 LOOP
        snapshot_date := CURRENT_DATE - (7 - day_offset);
        backlog_count := 120 - (day_offset * 10);  -- Decreasing from 120 to 60
        
        INSERT INTO backlog_snapshots (
            organization_id,
            snapshot_date,
            total_items,
            items_by_priority,
            items_by_age,
            items_by_status,
            total_estimated_effort_hours,
            avg_age_days,
            oldest_item_age_days,
            sla_breached_count,
            sla_at_risk_count,
            sla_compliance_rate,
            capacity_utilization_pct,
            overflow_count,
            items_propagated,
            items_aged_up,
            items_resolved,
            new_items,
            estimated_recovery_days,
            customer_impact_score,
            financial_impact,
            metadata
        ) VALUES (
            org_id,
            snapshot_date,
            backlog_count,
            jsonb_build_object(
                'low', backlog_count * 0.35,
                'medium', backlog_count * 0.30,
                'high', backlog_count * 0.25,
                'critical', backlog_count * 0.10
            ),
            jsonb_build_object(
                '0-1 days', backlog_count * 0.20,
                '1-3 days', backlog_count * 0.30,
                '4-7 days', backlog_count * 0.30,
                '8-14 days', backlog_count * 0.15,
                '15+ days', backlog_count * 0.05
            ),
            jsonb_build_object(
                'pending', backlog_count * 0.75,
                'in_progress', backlog_count * 0.20,
                'deferred', backlog_count * 0.05
            ),
            backlog_count * 0.5,  -- Estimated effort
            3.5 - (day_offset * 0.2),  -- Decreasing age
            14 - day_offset,
            backlog_count * 0.05,  -- SLA breaches
            backlog_count * 0.10,  -- At risk
            92.0 + (day_offset * 0.5),  -- Improving compliance
            (backlog_count / 500.0) * 100,  -- Capacity utilization
            GREATEST(0, backlog_count - 450),  -- Overflow
            GREATEST(0, backlog_count - 10),  -- Propagated
            5,  -- Aged up
            55 - day_offset,  -- Resolved (increasing)
            45 + day_offset,  -- New items (decreasing)
            backlog_count / 45.0,  -- Recovery days
            -0.05 * (backlog_count * 0.05),  -- Customer impact
            (backlog_count * 3.5) * 50.0,  -- Financial impact
            jsonb_build_object(
                'note', 'Historical snapshot',
                'trend', 'improving'
            )
        );
    END LOOP;
END $$;

-- ============================================================================
-- Summary Statistics View
-- ============================================================================

-- Create a view for easy access to backlog statistics
CREATE OR REPLACE VIEW backlog_statistics_summary AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    COUNT(DISTINCT bi.id) AS total_backlog_items,
    COUNT(DISTINCT CASE WHEN bi.status = 'pending' THEN bi.id END) AS pending_items,
    COUNT(DISTINCT CASE WHEN bi.sla_breached THEN bi.id END) AS sla_breached_items,
    ROUND(AVG(bi.days_in_backlog), 2) AS avg_days_in_backlog,
    MAX(bi.days_in_backlog) AS max_days_in_backlog,
    SUM(bi.estimated_effort_minutes) / 60.0 AS total_estimated_hours,
    COUNT(DISTINCT bp.id) AS active_profiles,
    COUNT(DISTINCT br.id) AS active_rules,
    (
        SELECT snapshot_date
        FROM backlog_snapshots bs
        WHERE bs.organization_id = o.id
        ORDER BY snapshot_date DESC
        LIMIT 1
    ) AS latest_snapshot_date
FROM organizations o
LEFT JOIN backlog_items bi ON bi.organization_id = o.id AND bi.status IN ('pending', 'in_progress')
LEFT JOIN backlog_propagation_profiles bp ON bp.organization_id = o.id AND bp.is_active = TRUE
LEFT JOIN backlog_propagation_rules br ON br.profile_id = bp.id AND br.is_active = TRUE
GROUP BY o.id, o.name;

-- ============================================================================
-- Sample Data Summary
-- ============================================================================

-- Output summary of created data
DO $$
DECLARE
    profile_count integer;
    item_count integer;
    rule_count integer;
    capacity_count integer;
    snapshot_count integer;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM backlog_propagation_profiles;
    SELECT COUNT(*) INTO item_count FROM backlog_items;
    SELECT COUNT(*) INTO rule_count FROM backlog_propagation_rules;
    SELECT COUNT(*) INTO capacity_count FROM backlog_capacity_plans;
    SELECT COUNT(*) INTO snapshot_count FROM backlog_snapshots;
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Backlog Propagation Sample Data Created';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Profiles created: %', profile_count;
    RAISE NOTICE 'Backlog items created: %', item_count;
    RAISE NOTICE 'Propagation rules created: %', rule_count;
    RAISE NOTICE 'Capacity plans created: %', capacity_count;
    RAISE NOTICE 'Historical snapshots created: %', snapshot_count;
    RAISE NOTICE '=================================================';
END $$;
