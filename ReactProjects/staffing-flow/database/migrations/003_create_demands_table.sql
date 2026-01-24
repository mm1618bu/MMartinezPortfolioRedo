-- =============================================
-- DEMANDS TABLE (CSV Upload Support)
-- =============================================
-- This table stores workforce demand forecasts that can be imported via CSV
-- Complements demand_intervals with simplified day/shift-level demand tracking

CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Date and timing
  date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'split', 'all_day')),
  start_time TIME,
  end_time TIME,
  
  -- Department linkage
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Staffing requirements
  required_employees INTEGER NOT NULL CHECK (required_employees > 0),
  required_skills TEXT[], -- Array of skill names required for this demand
  
  -- Priority and metadata
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT CHECK (LENGTH(notes) <= 500),
  
  -- Organization and audit
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time OR (start_time IS NULL AND end_time IS NULL)),
  CONSTRAINT unique_demand_per_day UNIQUE (organization_id, department_id, date, shift_type)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Primary lookup by organization and date range
CREATE INDEX idx_demands_org_date ON demands(organization_id, date DESC);

-- Department-specific queries
CREATE INDEX idx_demands_department ON demands(department_id);

-- Date range queries
CREATE INDEX idx_demands_date_range ON demands(date);

-- Priority-based filtering
CREATE INDEX idx_demands_priority ON demands(priority) WHERE priority IN ('high', 'critical');

-- Composite index for common queries (org + dept + date)
CREATE INDEX idx_demands_org_dept_date ON demands(organization_id, department_id, date DESC);

-- Shift type filtering
CREATE INDEX idx_demands_shift_type ON demands(shift_type) WHERE shift_type IS NOT NULL;

-- Skills search (GIN index for array operations)
CREATE INDEX idx_demands_skills ON demands USING GIN(required_skills);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_demands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW
  EXECUTE FUNCTION update_demands_updated_at();

-- Validate business rules
CREATE OR REPLACE FUNCTION validate_demand_business_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure date is not too far in the past (older than 1 year)
  IF NEW.date < CURRENT_DATE - INTERVAL '1 year' THEN
    RAISE EXCEPTION 'Demand date cannot be older than 1 year: %', NEW.date;
  END IF;
  
  -- Ensure date is not too far in the future (more than 2 years)
  IF NEW.date > CURRENT_DATE + INTERVAL '2 years' THEN
    RAISE EXCEPTION 'Demand date cannot be more than 2 years in the future: %', NEW.date;
  END IF;
  
  -- If shift_type requires time, ensure start_time and end_time are set
  IF NEW.shift_type IS NOT NULL AND NEW.shift_type != 'all_day' THEN
    IF NEW.start_time IS NULL OR NEW.end_time IS NULL THEN
      RAISE WARNING 'Shift type "%" should have start_time and end_time specified', NEW.shift_type;
    END IF;
  END IF;
  
  -- Reasonable employee limits
  IF NEW.required_employees > 1000 THEN
    RAISE EXCEPTION 'Required employees (%) exceeds reasonable limit of 1000', NEW.required_employees;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_demand_rules
  BEFORE INSERT OR UPDATE ON demands
  FOR EACH ROW
  EXECUTE FUNCTION validate_demand_business_rules();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see demands for their organization
CREATE POLICY demands_select_policy ON demands
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins and managers can insert demands
CREATE POLICY demands_insert_policy ON demands
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- Policy: Admins and managers can update demands in their org
CREATE POLICY demands_update_policy ON demands
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- Policy: Admins can delete demands in their org
CREATE POLICY demands_delete_policy ON demands
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get demand statistics for a date range
CREATE OR REPLACE FUNCTION get_demand_statistics(
  p_organization_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_records BIGINT,
  total_demand BIGINT,
  average_demand NUMERIC,
  unique_departments BIGINT,
  priority_low BIGINT,
  priority_medium BIGINT,
  priority_high BIGINT,
  priority_critical BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_records,
    SUM(required_employees)::BIGINT as total_demand,
    ROUND(AVG(required_employees), 2) as average_demand,
    COUNT(DISTINCT department_id)::BIGINT as unique_departments,
    COUNT(*) FILTER (WHERE priority = 'low')::BIGINT as priority_low,
    COUNT(*) FILTER (WHERE priority = 'medium')::BIGINT as priority_medium,
    COUNT(*) FILTER (WHERE priority = 'high')::BIGINT as priority_high,
    COUNT(*) FILTER (WHERE priority = 'critical')::BIGINT as priority_critical
  FROM demands
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for overlapping demands
CREATE OR REPLACE FUNCTION check_demand_overlap(
  p_department_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  shift_type TEXT,
  start_time TIME,
  end_time TIME,
  required_employees INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.shift_type,
    d.start_time,
    d.end_time,
    d.required_employees
  FROM demands d
  WHERE d.department_id = p_department_id
    AND d.date = p_date
    AND (p_exclude_id IS NULL OR d.id != p_exclude_id)
    AND (
      -- Check for time overlap
      (d.start_time IS NOT NULL AND d.end_time IS NOT NULL AND
       p_start_time IS NOT NULL AND p_end_time IS NOT NULL AND
       (d.start_time, d.end_time) OVERLAPS (p_start_time, p_end_time))
      OR
      -- All-day shifts overlap with everything
      (d.shift_type = 'all_day' OR p_start_time IS NULL OR p_end_time IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE demands IS 'Workforce demand forecasts organized by date, shift, and department';
COMMENT ON COLUMN demands.date IS 'The date for which this demand forecast applies';
COMMENT ON COLUMN demands.shift_type IS 'Type of shift: morning, afternoon, evening, night, split, or all_day';
COMMENT ON COLUMN demands.required_employees IS 'Number of employees required for this demand period';
COMMENT ON COLUMN demands.required_skills IS 'Array of skill names needed for this demand';
COMMENT ON COLUMN demands.priority IS 'Priority level: low, medium, high, or critical';
COMMENT ON COLUMN demands.notes IS 'Additional notes or context (max 500 characters)';

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================
-- Uncomment to insert sample data

/*
INSERT INTO demands (date, department_id, shift_type, start_time, end_time, required_employees, required_skills, priority, notes, organization_id)
SELECT
  CURRENT_DATE + (n || ' days')::INTERVAL,
  (SELECT id FROM departments LIMIT 1),
  CASE 
    WHEN n % 3 = 0 THEN 'morning'
    WHEN n % 3 = 1 THEN 'afternoon'
    ELSE 'evening'
  END,
  CASE 
    WHEN n % 3 = 0 THEN '08:00'::TIME
    WHEN n % 3 = 1 THEN '14:00'::TIME
    ELSE '18:00'::TIME
  END,
  CASE 
    WHEN n % 3 = 0 THEN '16:00'::TIME
    WHEN n % 3 = 1 THEN '22:00'::TIME
    ELSE '02:00'::TIME
  END,
  3 + (n % 5),
  ARRAY['customer service', 'data entry'],
  CASE 
    WHEN n % 4 = 0 THEN 'high'
    WHEN n % 4 = 1 THEN 'medium'
    WHEN n % 4 = 2 THEN 'low'
    ELSE 'critical'
  END,
  'Sample demand for testing',
  (SELECT id FROM organizations LIMIT 1)
FROM generate_series(1, 30) n;
*/
