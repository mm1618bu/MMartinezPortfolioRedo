-- =============================================
-- PRODUCTIVITY VARIANCE ENGINE
-- Database schema for tracking and simulating productivity variations
-- =============================================

-- Create productivity_variance_profiles table
-- Defines variance characteristics for departments or task types
CREATE TABLE IF NOT EXISTS productivity_variance_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  
  -- Variance characteristics
  mean_productivity_modifier DECIMAL(5,2) DEFAULT 1.00, -- Multiplier: 1.0 = baseline, 1.2 = 20% above
  std_deviation DECIMAL(5,2) DEFAULT 0.15, -- Standard deviation (e.g., 0.15 = ±15%)
  min_modifier DECIMAL(5,2) DEFAULT 0.70, -- Minimum productivity multiplier (e.g., 0.70 = 70%)
  max_modifier DECIMAL(5,2) DEFAULT 1.30, -- Maximum productivity multiplier (e.g., 1.30 = 130%)
  
  -- Distribution type
  distribution_type TEXT DEFAULT 'normal' CHECK (distribution_type IN ('normal', 'uniform', 'beta', 'exponential', 'custom')),
  distribution_params JSONB, -- Additional parameters for complex distributions
  
  -- Temporal patterns
  time_of_day_impact JSONB, -- Hour-based productivity multipliers
  day_of_week_impact JSONB, -- Day-based productivity multipliers
  seasonal_impact JSONB, -- Month/season-based productivity multipliers
  
  -- Learning curves and trends
  learning_curve_enabled BOOLEAN DEFAULT false,
  learning_rate DECIMAL(5,4), -- Rate of improvement over time
  plateau_weeks INTEGER, -- Weeks until learning plateaus
  
  -- Correlation settings
  autocorrelation DECIMAL(3,2), -- Day-to-day correlation (0-1)
  
  -- Metadata
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_variance_profile UNIQUE (organization_id, department_id, name, effective_date)
);

-- Create productivity_variance_history table
-- Tracks historical productivity variance data (observed or simulated)
CREATE TABLE IF NOT EXISTS productivity_variance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  variance_profile_id UUID REFERENCES productivity_variance_profiles(id) ON DELETE SET NULL,
  
  -- Time dimension
  variance_date DATE NOT NULL,
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  
  -- Labor standard reference
  labor_standard_id UUID REFERENCES labor_standards(id) ON DELETE SET NULL,
  task_type TEXT,
  
  -- Productivity metrics
  baseline_units_per_hour DECIMAL(10,2),
  actual_units_per_hour DECIMAL(10,2),
  productivity_modifier DECIMAL(5,2), -- actual / baseline
  variance_percentage DECIMAL(5,2), -- (actual - baseline) / baseline * 100
  
  -- Impact on staffing
  baseline_staff_needed INTEGER,
  adjusted_staff_needed INTEGER,
  staffing_variance INTEGER, -- Difference in staff needed
  
  -- Context
  data_source TEXT CHECK (data_source IN ('observed', 'simulated', 'forecasted')),
  simulation_run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_variance_history UNIQUE (organization_id, department_id, variance_date, hour_of_day, task_type)
);

-- Create productivity_variance_simulations table
-- Stores simulation configurations and results
CREATE TABLE IF NOT EXISTS productivity_variance_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  variance_profile_id UUID REFERENCES productivity_variance_profiles(id) ON DELETE SET NULL,
  scenario_id UUID REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
  
  -- Simulation configuration
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Variance parameters
  variance_scenario TEXT CHECK (variance_scenario IN (
    'consistent', -- Low variance, predictable productivity
    'volatile', -- High variance, unpredictable swings
    'declining', -- Gradual decline over time
    'improving', -- Gradual improvement over time
    'cyclical', -- Repeating patterns (weekly, monthly)
    'shock', -- Sudden disruption events
    'custom' -- User-defined profile
  )),
  
  -- Simulation settings
  seed INTEGER, -- Random seed for reproducibility
  monte_carlo_runs INTEGER DEFAULT 1, -- Number of simulation runs
  confidence_level DECIMAL(3,2) DEFAULT 0.95, -- For confidence intervals
  
  -- Results summary
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  execution_started_at TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  execution_duration_ms INTEGER,
  
  -- Statistical results
  results_summary JSONB, -- Min, max, mean, median, percentiles
  staffing_impact JSONB, -- Overall staffing variance analysis
  cost_impact JSONB, -- Financial impact calculations
  risk_metrics JSONB, -- Risk assessment results
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_variance_simulation UNIQUE (organization_id, name, created_at)
);

-- Create productivity_variance_factors table
-- Tracks specific factors that influence productivity variance
CREATE TABLE IF NOT EXISTS productivity_variance_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Factor definition
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'environmental', -- Temperature, lighting, noise
    'equipment', -- System performance, tool availability
    'training', -- Experience level, skill gaps
    'staffing', -- Understaffing, overstaffing
    'workload', -- Volume, complexity
    'temporal', -- Time of day, day of week
    'external' -- Market conditions, supply chain
  )),
  
  -- Impact characteristics
  impact_magnitude DECIMAL(5,2), -- Expected % impact on productivity
  impact_frequency TEXT CHECK (impact_frequency IN ('constant', 'periodic', 'random', 'event-driven')),
  impact_duration_hours INTEGER,
  
  -- Detection and measurement
  measurement_method TEXT,
  data_sources TEXT[],
  
  -- Mitigation strategies
  mitigation_strategies TEXT[],
  mitigation_effectiveness DECIMAL(3,2), -- 0-1 scale
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_variance_factor UNIQUE (organization_id, name)
);

-- Create productivity_variance_factor_instances table
-- Tracks specific occurrences of variance factors
CREATE TABLE IF NOT EXISTS productivity_variance_factor_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  factor_id UUID NOT NULL REFERENCES productivity_variance_factors(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Occurrence details
  occurrence_date DATE NOT NULL,
  start_hour INTEGER,
  end_hour INTEGER,
  actual_impact DECIMAL(5,2), -- Measured impact %
  
  -- Context
  description TEXT,
  affected_employees INTEGER,
  mitigation_applied TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Variance profiles
CREATE INDEX idx_variance_profiles_org_dept ON productivity_variance_profiles(organization_id, department_id);
CREATE INDEX idx_variance_profiles_active ON productivity_variance_profiles(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_variance_profiles_dates ON productivity_variance_profiles(effective_date, end_date);

-- Variance history
CREATE INDEX idx_variance_history_org_date ON productivity_variance_history(organization_id, variance_date DESC);
CREATE INDEX idx_variance_history_dept_date ON productivity_variance_history(department_id, variance_date DESC);
CREATE INDEX idx_variance_history_profile ON productivity_variance_history(variance_profile_id, variance_date DESC);
CREATE INDEX idx_variance_history_sim_run ON productivity_variance_history(simulation_run_id);
CREATE INDEX idx_variance_history_source ON productivity_variance_history(data_source, variance_date DESC);

-- Variance simulations
CREATE INDEX idx_variance_simulations_org ON productivity_variance_simulations(organization_id, created_at DESC);
CREATE INDEX idx_variance_simulations_profile ON productivity_variance_simulations(variance_profile_id);
CREATE INDEX idx_variance_simulations_scenario ON productivity_variance_simulations(scenario_id);
CREATE INDEX idx_variance_simulations_status ON productivity_variance_simulations(status, created_at DESC);
CREATE INDEX idx_variance_simulations_dates ON productivity_variance_simulations(start_date, end_date);

-- Variance factors
CREATE INDEX idx_variance_factors_org_active ON productivity_variance_factors(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_variance_factors_category ON productivity_variance_factors(category);

-- Variance factor instances
CREATE INDEX idx_variance_factor_instances_org_date ON productivity_variance_factor_instances(organization_id, occurrence_date DESC);
CREATE INDEX idx_variance_factor_instances_factor ON productivity_variance_factor_instances(factor_id, occurrence_date DESC);
CREATE INDEX idx_variance_factor_instances_dept ON productivity_variance_factor_instances(department_id, occurrence_date DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE productivity_variance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_variance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_variance_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_variance_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_variance_factor_instances ENABLE ROW LEVEL SECURITY;

-- Policies for productivity_variance_profiles
CREATE POLICY "Users can view variance profiles in their organization"
  ON productivity_variance_profiles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage variance profiles in their organization"
  ON productivity_variance_profiles FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super_admin')
  ));

-- Policies for productivity_variance_history
CREATE POLICY "Users can view variance history in their organization"
  ON productivity_variance_history FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can insert variance history"
  ON productivity_variance_history FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid()
  ));

-- Policies for productivity_variance_simulations
CREATE POLICY "Users can view variance simulations in their organization"
  ON productivity_variance_simulations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage variance simulations"
  ON productivity_variance_simulations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super_admin')
  ));

-- Policies for productivity_variance_factors
CREATE POLICY "Users can view variance factors in their organization"
  ON productivity_variance_factors FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage variance factors"
  ON productivity_variance_factors FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super_admin')
  ));

-- Policies for productivity_variance_factor_instances
CREATE POLICY "Users can view variance factor instances in their organization"
  ON productivity_variance_factor_instances FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can record variance factor instances"
  ON productivity_variance_factor_instances FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_productivity_variance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_variance_profiles_updated_at
  BEFORE UPDATE ON productivity_variance_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_productivity_variance_updated_at();

CREATE TRIGGER update_variance_simulations_updated_at
  BEFORE UPDATE ON productivity_variance_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_productivity_variance_updated_at();

CREATE TRIGGER update_variance_factors_updated_at
  BEFORE UPDATE ON productivity_variance_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_productivity_variance_updated_at();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for active variance profiles with statistics
CREATE OR REPLACE VIEW active_variance_profiles_with_stats AS
SELECT 
  vp.*,
  d.name AS department_name,
  COUNT(DISTINCT vh.id) AS historical_data_points,
  AVG(vh.variance_percentage) AS avg_historical_variance,
  STDDEV(vh.variance_percentage) AS historical_std_dev
FROM productivity_variance_profiles vp
LEFT JOIN departments d ON vp.department_id = d.id
LEFT JOIN productivity_variance_history vh ON vp.id = vh.variance_profile_id
WHERE vp.is_active = true
  AND (vp.end_date IS NULL OR vp.end_date >= CURRENT_DATE)
GROUP BY vp.id, d.name;

-- View for recent variance trends
CREATE OR REPLACE VIEW recent_variance_trends AS
SELECT 
  vh.organization_id,
  vh.department_id,
  d.name AS department_name,
  vh.variance_date,
  AVG(vh.productivity_modifier) AS avg_productivity,
  AVG(vh.variance_percentage) AS avg_variance,
  SUM(vh.staffing_variance) AS total_staffing_impact,
  COUNT(*) AS data_points
FROM productivity_variance_history vh
LEFT JOIN departments d ON vh.department_id = d.id
WHERE vh.variance_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY vh.organization_id, vh.department_id, d.name, vh.variance_date
ORDER BY vh.variance_date DESC;

-- View for simulation summary
CREATE OR REPLACE VIEW variance_simulation_summary AS
SELECT 
  vs.id,
  vs.organization_id,
  vs.name,
  vs.variance_scenario,
  vs.start_date,
  vs.end_date,
  vs.status,
  vs.monte_carlo_runs,
  COUNT(DISTINCT vh.variance_date) AS days_simulated,
  AVG(vh.variance_percentage) AS avg_variance,
  MIN(vh.productivity_modifier) AS min_productivity,
  MAX(vh.productivity_modifier) AS max_productivity,
  vs.created_at
FROM productivity_variance_simulations vs
LEFT JOIN productivity_variance_history vh ON vs.id = vh.simulation_run_id
GROUP BY vs.id;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to calculate staffing adjustment based on productivity variance
CREATE OR REPLACE FUNCTION calculate_staffing_adjustment(
  p_baseline_staff INTEGER,
  p_productivity_modifier DECIMAL
)
RETURNS INTEGER AS $$
BEGIN
  -- If productivity is lower, more staff needed; if higher, less staff needed
  -- Formula: adjusted_staff = baseline_staff / productivity_modifier
  RETURN CEIL(p_baseline_staff::DECIMAL / p_productivity_modifier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate variance based on profile
CREATE OR REPLACE FUNCTION generate_variance_sample(
  p_profile_id UUID,
  p_date DATE,
  p_hour INTEGER DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_profile RECORD;
  v_base_variance DECIMAL;
  v_time_adjustment DECIMAL := 1.0;
  v_day_adjustment DECIMAL := 1.0;
BEGIN
  -- Get variance profile
  SELECT * INTO v_profile
  FROM productivity_variance_profiles
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variance profile not found';
  END IF;
  
  -- Generate base variance using normal distribution approximation
  -- (In practice, you'd use a proper random number generator)
  v_base_variance := v_profile.mean_productivity_modifier + 
                     (random() - 0.5) * v_profile.std_deviation * 2;
  
  -- Clamp to min/max
  v_base_variance := GREATEST(v_profile.min_modifier, 
                              LEAST(v_profile.max_modifier, v_base_variance));
  
  -- Apply time-of-day adjustment if hour provided
  IF p_hour IS NOT NULL AND v_profile.time_of_day_impact IS NOT NULL THEN
    v_time_adjustment := COALESCE(
      (v_profile.time_of_day_impact->p_hour::TEXT)::DECIMAL,
      1.0
    );
  END IF;
  
  -- Apply day-of-week adjustment
  IF v_profile.day_of_week_impact IS NOT NULL THEN
    v_day_adjustment := COALESCE(
      (v_profile.day_of_week_impact->EXTRACT(DOW FROM p_date)::TEXT)::DECIMAL,
      1.0
    );
  END IF;
  
  RETURN v_base_variance * v_time_adjustment * v_day_adjustment;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE productivity_variance_profiles IS 'Defines productivity variance characteristics for departments or task types';
COMMENT ON TABLE productivity_variance_history IS 'Historical and simulated productivity variance data';
COMMENT ON TABLE productivity_variance_simulations IS 'Simulation configurations and results for productivity variance analysis';
COMMENT ON TABLE productivity_variance_factors IS 'Factors that influence productivity variance';
COMMENT ON TABLE productivity_variance_factor_instances IS 'Specific occurrences of variance factors';

COMMENT ON COLUMN productivity_variance_profiles.mean_productivity_modifier IS 'Average productivity multiplier: 1.0 = baseline, 1.2 = 20% above baseline';
COMMENT ON COLUMN productivity_variance_profiles.std_deviation IS 'Standard deviation of productivity variance';
COMMENT ON COLUMN productivity_variance_profiles.distribution_type IS 'Statistical distribution for variance generation';
COMMENT ON COLUMN productivity_variance_profiles.autocorrelation IS 'Day-to-day correlation: high values mean yesterday''s productivity predicts today''s';

COMMENT ON COLUMN productivity_variance_history.productivity_modifier IS 'Ratio of actual to baseline productivity';
COMMENT ON COLUMN productivity_variance_history.variance_percentage IS 'Percentage difference from baseline';
COMMENT ON COLUMN productivity_variance_history.data_source IS 'Whether data is observed (real), simulated, or forecasted';

COMMENT ON FUNCTION calculate_staffing_adjustment IS 'Calculate adjusted staffing needs based on productivity variance';
COMMENT ON FUNCTION generate_variance_sample IS 'Generate a variance sample for a specific date/time using variance profile';
