-- =============================================
-- BACKLOG PROPAGATION MODEL
-- Database schema for tracking and simulating backlog accumulation and propagation
-- =============================================

-- Create backlog_propagation_profiles table
-- Defines how backlogs behave and propagate in different scenarios
CREATE TABLE IF NOT EXISTS backlog_propagation_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Propagation behavior
  propagation_rate DECIMAL(3,2) DEFAULT 1.00, -- How much backlog carries forward (1.0 = 100%)
  decay_rate DECIMAL(5,4) DEFAULT 0.0000, -- Daily decay of backlog (e.g., 0.05 = 5% daily decay)
  max_backlog_capacity INTEGER, -- Maximum backlog items before overflow
  
  -- Priority handling
  priority_multiplier JSONB, -- Priority level to propagation rate multipliers
  aging_enabled BOOLEAN DEFAULT true, -- Whether backlog items age and increase priority
  aging_threshold_days INTEGER DEFAULT 3, -- Days before item ages to next priority
  
  -- Overflow behavior
  overflow_strategy TEXT DEFAULT 'reject' CHECK (overflow_strategy IN (
    'reject', -- Reject new items when at capacity
    'defer', -- Defer to future periods
    'escalate', -- Increase priority
    'outsource' -- Mark for external handling
  )),
  
  -- Service level impact
  sla_breach_threshold_days INTEGER DEFAULT 1, -- Days in backlog before SLA breach
  sla_penalty_per_day DECIMAL(10,2), -- Cost penalty per day in backlog
  customer_satisfaction_impact DECIMAL(3,2), -- Impact multiplier on satisfaction
  
  -- Recovery parameters
  recovery_rate_multiplier DECIMAL(3,2) DEFAULT 1.20, -- Extra capacity needed for recovery (20% over normal)
  recovery_priority_boost INTEGER DEFAULT 1, -- Priority levels to boost during recovery
  
  -- Metadata
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_backlog_profile UNIQUE (organization_id, department_id, name, effective_date)
);

-- Create backlog_items table
-- Individual backlog items being tracked
CREATE TABLE IF NOT EXISTS backlog_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES backlog_propagation_profiles(id) ON DELETE SET NULL,
  
  -- Item identification
  item_type TEXT NOT NULL, -- Type of work (e.g., 'order', 'ticket', 'task')
  external_id TEXT, -- External system reference
  
  -- Priority and classification
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  original_priority TEXT NOT NULL, -- Priority when created
  complexity TEXT CHECK (complexity IN ('simple', 'moderate', 'complex')),
  estimated_effort_minutes INTEGER, -- Estimated time to complete
  
  -- Timing
  created_date DATE NOT NULL,
  due_date DATE,
  aged_date DATE, -- When item last aged up in priority
  completed_date DATE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', -- Waiting to be worked
    'in_progress', -- Currently being worked
    'completed', -- Finished
    'deferred', -- Pushed to future period
    'escalated', -- Priority increased
    'rejected', -- Could not be accommodated
    'outsourced' -- Sent to external handler
  )),
  
  -- SLA tracking
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  days_in_backlog INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_date DATE,
  
  -- Propagation history
  propagation_count INTEGER DEFAULT 0, -- How many times carried forward
  propagation_path JSONB, -- History of propagation [{date, reason, priority}]
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_backlog_item UNIQUE (organization_id, external_id) WHERE external_id IS NOT NULL
);

-- Create backlog_snapshots table
-- Point-in-time backlog state for tracking and analysis
CREATE TABLE IF NOT EXISTS backlog_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES backlog_propagation_profiles(id) ON DELETE SET NULL,
  
  -- Snapshot timing
  snapshot_date DATE NOT NULL,
  snapshot_hour INTEGER CHECK (snapshot_hour >= 0 AND snapshot_hour <= 23),
  snapshot_type TEXT DEFAULT 'scheduled' CHECK (snapshot_type IN ('scheduled', 'simulation', 'event-driven')),
  
  -- Backlog metrics
  total_items INTEGER NOT NULL DEFAULT 0,
  items_by_priority JSONB, -- Count by priority level
  items_by_age JSONB, -- Count by age buckets
  items_by_complexity JSONB, -- Count by complexity
  
  -- Aggregated metrics
  total_estimated_effort_hours DECIMAL(10,2),
  avg_age_days DECIMAL(5,2),
  oldest_item_age_days INTEGER,
  
  -- SLA metrics
  sla_breached_count INTEGER DEFAULT 0,
  sla_at_risk_count INTEGER DEFAULT 0, -- Items approaching SLA deadline
  sla_compliance_rate DECIMAL(5,2), -- Percentage meeting SLA
  
  -- Capacity metrics
  capacity_utilization DECIMAL(5,2), -- Percentage of max capacity used
  overflow_count INTEGER DEFAULT 0, -- Items rejected due to overflow
  
  -- Propagation metrics
  items_propagated_today INTEGER DEFAULT 0,
  items_aged_up INTEGER DEFAULT 0,
  items_resolved_today INTEGER DEFAULT 0,
  new_items_today INTEGER DEFAULT 0,
  
  -- Impact metrics
  estimated_recovery_days DECIMAL(5,2), -- Days needed to clear current backlog
  customer_impact_score DECIMAL(5,2), -- Calculated customer satisfaction impact
  financial_impact DECIMAL(12,2), -- Estimated cost of current backlog
  
  -- Simulation context
  simulation_run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_backlog_snapshot UNIQUE (organization_id, department_id, snapshot_date, snapshot_hour)
);

-- Create backlog_propagation_rules table
-- Define rules for how items propagate under different conditions
CREATE TABLE IF NOT EXISTS backlog_propagation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES backlog_propagation_profiles(id) ON DELETE CASCADE,
  
  -- Rule definition
  rule_name TEXT NOT NULL,
  description TEXT,
  rule_order INTEGER DEFAULT 100, -- Execution order (lower first)
  
  -- Conditions (all must match)
  condition_priority TEXT[], -- Match these priorities
  condition_age_min_days INTEGER, -- Minimum age
  condition_age_max_days INTEGER, -- Maximum age
  condition_complexity TEXT[], -- Match these complexities
  condition_item_types TEXT[], -- Match these item types
  condition_backlog_level TEXT CHECK (condition_backlog_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Actions (applied when conditions match)
  action_type TEXT NOT NULL CHECK (action_type IN (
    'change_priority', -- Adjust priority level
    'change_propagation_rate', -- Modify how much carries forward
    'defer_to_date', -- Push to specific future date
    'escalate', -- Trigger escalation workflow
    'notify', -- Send notification
    'outsource' -- Mark for external handling
  )),
  action_parameters JSONB, -- Action-specific parameters
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_propagation_rule UNIQUE (organization_id, profile_id, rule_name)
);

-- Create backlog_propagation_events table
-- Log of propagation events and decisions
CREATE TABLE IF NOT EXISTS backlog_propagation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  backlog_item_id UUID REFERENCES backlog_items(id) ON DELETE CASCADE,
  
  -- Event details
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', -- Item added to backlog
    'propagated', -- Carried forward to next period
    'aged_up', -- Priority increased due to age
    'resolved', -- Item completed
    'deferred', -- Item pushed to future
    'escalated', -- Item escalated
    'rejected', -- Item rejected (overflow)
    'outsourced', -- Item sent external
    'sla_breached' -- SLA deadline passed
  )),
  
  -- Before/after state
  previous_priority TEXT,
  new_priority TEXT,
  previous_status TEXT,
  new_status TEXT,
  
  -- Context
  rule_applied_id UUID REFERENCES backlog_propagation_rules(id),
  reason TEXT,
  automated BOOLEAN DEFAULT true, -- Whether system or manual action
  
  -- Metrics
  days_in_backlog INTEGER,
  propagation_count INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create backlog_capacity_plans table
-- Define available capacity for working down backlogs
CREATE TABLE IF NOT EXISTS backlog_capacity_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Planning period
  plan_date DATE NOT NULL,
  plan_type TEXT DEFAULT 'standard' CHECK (plan_type IN ('standard', 'recovery', 'reduced')),
  
  -- Capacity allocation
  total_capacity_hours DECIMAL(10,2) NOT NULL, -- Total available hours
  backlog_capacity_hours DECIMAL(10,2) NOT NULL, -- Hours dedicated to backlog
  new_work_capacity_hours DECIMAL(10,2), -- Hours for new incoming work
  
  -- Capacity by priority
  capacity_allocation_by_priority JSONB, -- Hours allocated per priority
  
  -- Staffing
  staff_count INTEGER,
  staff_productivity_modifier DECIMAL(3,2) DEFAULT 1.00, -- Link to variance engine
  
  -- Constraints
  max_items_per_day INTEGER, -- Throughput limit
  max_complex_items_per_day INTEGER, -- Limit on complex items
  
  -- Simulation context
  simulation_run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_capacity_plan UNIQUE (organization_id, department_id, plan_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Backlog propagation profiles
CREATE INDEX idx_backlog_profiles_org_dept ON backlog_propagation_profiles(organization_id, department_id);
CREATE INDEX idx_backlog_profiles_active ON backlog_propagation_profiles(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_backlog_profiles_dates ON backlog_propagation_profiles(effective_date, end_date);

-- Backlog items
CREATE INDEX idx_backlog_items_org_dept ON backlog_items(organization_id, department_id);
CREATE INDEX idx_backlog_items_status ON backlog_items(status, created_date DESC);
CREATE INDEX idx_backlog_items_priority ON backlog_items(priority, created_date DESC);
CREATE INDEX idx_backlog_items_due_date ON backlog_items(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_backlog_items_sla_breach ON backlog_items(sla_breached, organization_id) WHERE sla_breached = true;
CREATE INDEX idx_backlog_items_assigned ON backlog_items(assigned_to, status);
CREATE INDEX idx_backlog_items_created ON backlog_items(created_date DESC);
CREATE INDEX idx_backlog_items_profile ON backlog_items(profile_id);

-- Backlog snapshots
CREATE INDEX idx_backlog_snapshots_org_dept_date ON backlog_snapshots(organization_id, department_id, snapshot_date DESC);
CREATE INDEX idx_backlog_snapshots_sim_run ON backlog_snapshots(simulation_run_id);
CREATE INDEX idx_backlog_snapshots_date ON backlog_snapshots(snapshot_date DESC);

-- Backlog propagation rules
CREATE INDEX idx_propagation_rules_profile ON backlog_propagation_rules(profile_id, rule_order);
CREATE INDEX idx_propagation_rules_active ON backlog_propagation_rules(organization_id, is_active) WHERE is_active = true;

-- Backlog propagation events
CREATE INDEX idx_propagation_events_item ON backlog_propagation_events(backlog_item_id, event_date DESC);
CREATE INDEX idx_propagation_events_org_date ON backlog_propagation_events(organization_id, event_date DESC);
CREATE INDEX idx_propagation_events_type ON backlog_propagation_events(event_type, event_date DESC);

-- Backlog capacity plans
CREATE INDEX idx_capacity_plans_org_dept_date ON backlog_capacity_plans(organization_id, department_id, plan_date DESC);
CREATE INDEX idx_capacity_plans_sim_run ON backlog_capacity_plans(simulation_run_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE backlog_propagation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_propagation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_propagation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_capacity_plans ENABLE ROW LEVEL SECURITY;

-- Policies for backlog_propagation_profiles
CREATE POLICY "Users can view backlog profiles in their organization"
  ON backlog_propagation_profiles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage backlog profiles"
  ON backlog_propagation_profiles FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super_admin')
  ));

-- Policies for backlog_items
CREATE POLICY "Users can view backlog items in their organization"
  ON backlog_items FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage backlog items in their organization"
  ON backlog_items FOR ALL
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Policies for backlog_snapshots
CREATE POLICY "Users can view backlog snapshots in their organization"
  ON backlog_snapshots FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can create backlog snapshots"
  ON backlog_snapshots FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Policies for backlog_propagation_rules
CREATE POLICY "Users can view propagation rules in their organization"
  ON backlog_propagation_rules FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage propagation rules"
  ON backlog_propagation_rules FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super_admin')
  ));

-- Policies for backlog_propagation_events
CREATE POLICY "Users can view propagation events in their organization"
  ON backlog_propagation_events FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can log propagation events"
  ON backlog_propagation_events FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Policies for backlog_capacity_plans
CREATE POLICY "Users can view capacity plans in their organization"
  ON backlog_capacity_plans FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage capacity plans"
  ON backlog_capacity_plans FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super_admin')
  ));

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_backlog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_backlog_profiles_updated_at
  BEFORE UPDATE ON backlog_propagation_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_backlog_updated_at();

CREATE TRIGGER update_backlog_items_updated_at
  BEFORE UPDATE ON backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_backlog_updated_at();

CREATE TRIGGER update_backlog_rules_updated_at
  BEFORE UPDATE ON backlog_propagation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_backlog_updated_at();

CREATE TRIGGER update_capacity_plans_updated_at
  BEFORE UPDATE ON backlog_capacity_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_backlog_updated_at();

-- Function to calculate days in backlog
CREATE OR REPLACE FUNCTION calculate_days_in_backlog(
  p_created_date DATE,
  p_completed_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
  IF p_completed_date IS NOT NULL THEN
    RETURN p_completed_date - p_created_date;
  ELSE
    RETURN CURRENT_DATE - p_created_date;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine backlog level
CREATE OR REPLACE FUNCTION get_backlog_level(
  p_current_count INTEGER,
  p_max_capacity INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_utilization DECIMAL;
BEGIN
  IF p_max_capacity IS NULL OR p_max_capacity = 0 THEN
    RETURN 'unknown';
  END IF;
  
  v_utilization := p_current_count::DECIMAL / p_max_capacity;
  
  IF v_utilization < 0.5 THEN
    RETURN 'low';
  ELSIF v_utilization < 0.75 THEN
    RETURN 'medium';
  ELSIF v_utilization < 0.95 THEN
    RETURN 'high';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate recovery time
CREATE OR REPLACE FUNCTION calculate_recovery_time(
  p_backlog_hours DECIMAL,
  p_daily_capacity_hours DECIMAL,
  p_recovery_rate_multiplier DECIMAL DEFAULT 1.2
)
RETURNS DECIMAL AS $$
BEGIN
  IF p_daily_capacity_hours <= 0 THEN
    RETURN NULL;
  END IF;
  
  -- Recovery capacity = normal capacity * multiplier
  RETURN p_backlog_hours / (p_daily_capacity_hours * p_recovery_rate_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to log backlog item changes
CREATE OR REPLACE FUNCTION log_backlog_item_change()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'completed' THEN
        v_event_type := 'resolved';
      ELSIF NEW.status = 'deferred' THEN
        v_event_type := 'deferred';
      ELSIF NEW.status = 'escalated' THEN
        v_event_type := 'escalated';
      ELSIF NEW.status = 'rejected' THEN
        v_event_type := 'rejected';
      ELSIF NEW.status = 'outsourced' THEN
        v_event_type := 'outsourced';
      ELSE
        v_event_type := 'propagated';
      END IF;
    ELSIF OLD.priority != NEW.priority THEN
      v_event_type := 'aged_up';
    ELSE
      RETURN NEW;  -- No significant change
    END IF;
    
    IF NEW.sla_breached = true AND OLD.sla_breached = false THEN
      v_event_type := 'sla_breached';
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Log the event
  INSERT INTO backlog_propagation_events (
    organization_id,
    backlog_item_id,
    event_date,
    event_type,
    previous_priority,
    new_priority,
    previous_status,
    new_status,
    days_in_backlog,
    propagation_count,
    automated
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    CURRENT_DATE,
    v_event_type,
    OLD.priority,
    NEW.priority,
    OLD.status,
    NEW.status,
    NEW.days_in_backlog,
    NEW.propagation_count,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to backlog_items
CREATE TRIGGER track_backlog_item_changes
  AFTER INSERT OR UPDATE ON backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION log_backlog_item_change();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for active backlog summary by department
CREATE OR REPLACE VIEW active_backlog_summary AS
SELECT 
  bi.organization_id,
  bi.department_id,
  d.name AS department_name,
  COUNT(*) AS total_items,
  COUNT(*) FILTER (WHERE bi.priority = 'low') AS low_priority_count,
  COUNT(*) FILTER (WHERE bi.priority = 'medium') AS medium_priority_count,
  COUNT(*) FILTER (WHERE bi.priority = 'high') AS high_priority_count,
  COUNT(*) FILTER (WHERE bi.priority = 'critical') AS critical_priority_count,
  COUNT(*) FILTER (WHERE bi.sla_breached = true) AS sla_breached_count,
  AVG(bi.days_in_backlog) AS avg_days_in_backlog,
  MAX(bi.days_in_backlog) AS max_days_in_backlog,
  SUM(bi.estimated_effort_minutes) / 60.0 AS total_effort_hours
FROM backlog_items bi
LEFT JOIN departments d ON bi.department_id = d.id
WHERE bi.status IN ('pending', 'in_progress')
GROUP BY bi.organization_id, bi.department_id, d.name;

-- View for backlog trends (last 30 days)
CREATE OR REPLACE VIEW backlog_trends AS
SELECT 
  bs.organization_id,
  bs.department_id,
  d.name AS department_name,
  bs.snapshot_date,
  bs.total_items,
  bs.sla_breached_count,
  bs.sla_compliance_rate,
  bs.avg_age_days,
  bs.capacity_utilization,
  bs.estimated_recovery_days,
  bs.items_propagated_today,
  bs.items_resolved_today,
  bs.new_items_today
FROM backlog_snapshots bs
LEFT JOIN departments d ON bs.department_id = d.id
WHERE bs.snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY bs.snapshot_date DESC;

-- View for items at risk of SLA breach
CREATE OR REPLACE VIEW backlog_sla_at_risk AS
SELECT 
  bi.*,
  d.name AS department_name,
  bp.sla_breach_threshold_days,
  (bi.sla_deadline - NOW()) AS time_until_breach,
  CASE 
    WHEN bi.sla_breached THEN 'breached'
    WHEN bi.sla_deadline < NOW() + INTERVAL '4 hours' THEN 'critical'
    WHEN bi.sla_deadline < NOW() + INTERVAL '1 day' THEN 'high_risk'
    ELSE 'medium_risk'
  END AS risk_level
FROM backlog_items bi
LEFT JOIN departments d ON bi.department_id = d.id
LEFT JOIN backlog_propagation_profiles bp ON bi.profile_id = bp.id
WHERE bi.status IN ('pending', 'in_progress')
  AND (bi.sla_breached = true OR bi.sla_deadline < NOW() + INTERVAL '2 days')
ORDER BY bi.sla_deadline ASC NULLS LAST;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE backlog_propagation_profiles IS 'Defines how backlogs propagate and accumulate over time';
COMMENT ON TABLE backlog_items IS 'Individual backlog items being tracked through the system';
COMMENT ON TABLE backlog_snapshots IS 'Point-in-time snapshots of backlog state for trend analysis';
COMMENT ON TABLE backlog_propagation_rules IS 'Rules defining how items propagate under different conditions';
COMMENT ON TABLE backlog_propagation_events IS 'Event log of all backlog item state changes';
COMMENT ON TABLE backlog_capacity_plans IS 'Planned capacity for working down backlogs';

COMMENT ON COLUMN backlog_propagation_profiles.propagation_rate IS 'Percentage of backlog that carries forward each period (1.0 = 100%)';
COMMENT ON COLUMN backlog_propagation_profiles.decay_rate IS 'Daily decay rate (e.g., 0.05 = 5% items resolved naturally per day)';
COMMENT ON COLUMN backlog_propagation_profiles.aging_threshold_days IS 'Days before items age to next priority level';
COMMENT ON COLUMN backlog_items.propagation_count IS 'Number of times item has been carried forward';
COMMENT ON COLUMN backlog_items.days_in_backlog IS 'Total days item has been in backlog state';
COMMENT ON COLUMN backlog_snapshots.capacity_utilization IS 'Percentage of maximum backlog capacity currently used';

COMMENT ON FUNCTION calculate_days_in_backlog IS 'Calculate how many days an item has been in backlog';
COMMENT ON FUNCTION get_backlog_level IS 'Determine backlog severity level based on utilization';
COMMENT ON FUNCTION calculate_recovery_time IS 'Calculate days needed to clear backlog with recovery capacity';
