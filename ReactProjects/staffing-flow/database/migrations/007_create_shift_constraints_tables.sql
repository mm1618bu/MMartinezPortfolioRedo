-- Create shift constraint rules table
CREATE TABLE IF NOT EXISTS shift_constraint_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  constraint_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'hard', -- 'hard', 'soft', 'warning'
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Constraint parameters stored as JSONB for flexibility
  parameters JSONB DEFAULT '{}',
  
  -- Rule configuration
  is_active BOOLEAN DEFAULT TRUE,
  applies_to_roles TEXT[],
  applies_to_employees UUID[],
  excluded_employees UUID[],
  
  -- Effective dates
  effective_from TIMESTAMP WITH TIME ZONE,
  effective_until TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_severity CHECK (severity IN ('hard', 'soft', 'warning')),
  CONSTRAINT valid_constraint_type CHECK (constraint_type IN (
    'no_double_booking',
    'max_consecutive_shifts',
    'min_rest_between_shifts',
    'max_hours_per_day',
    'max_hours_per_week',
    'required_skill',
    'skill_certification',
    'employee_availability',
    'employee_time_off',
    'shift_preference',
    'location_preference',
    'min_coverage',
    'max_coverage',
    'department_staffing',
    'union_rules',
    'break_requirements',
    'wage_regulations'
  ))
);

-- Create constraint violations log table
CREATE TABLE IF NOT EXISTS constraint_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constraint_rule_id UUID NOT NULL REFERENCES shift_constraint_rules(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES staffing_plan_assignments(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  violation_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'hard',
  message TEXT NOT NULL,
  suggested_action TEXT,
  violation_details JSONB DEFAULT '{}',
  
  -- Override tracking
  override_requested BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_approved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  override_approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_violation_severity CHECK (severity IN ('hard', 'soft', 'warning'))
);

-- Create indexes for performance
CREATE INDEX idx_constraint_rules_org ON shift_constraint_rules(organization_id);
CREATE INDEX idx_constraint_rules_dept ON shift_constraint_rules(department_id);
CREATE INDEX idx_constraint_rules_type ON shift_constraint_rules(constraint_type);
CREATE INDEX idx_constraint_rules_active ON shift_constraint_rules(is_active);
CREATE INDEX idx_constraint_rules_effective_dates ON shift_constraint_rules(effective_from, effective_until);

CREATE INDEX idx_violations_rule ON constraint_violations(constraint_rule_id);
CREATE INDEX idx_violations_assignment ON constraint_violations(assignment_id);
CREATE INDEX idx_violations_employee ON constraint_violations(employee_id);
CREATE INDEX idx_violations_severity ON constraint_violations(severity);
CREATE INDEX idx_violations_created ON constraint_violations(created_at);

-- GIN indexes for array searches
CREATE INDEX idx_constraint_rules_employees ON shift_constraint_rules USING GIN (applies_to_employees);
CREATE INDEX idx_constraint_rules_excluded ON shift_constraint_rules USING GIN (excluded_employees);
CREATE INDEX idx_constraint_rules_roles ON shift_constraint_rules USING GIN (applies_to_roles);

-- Create auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_constraint_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_constraint_rules_timestamp_trigger ON shift_constraint_rules;
CREATE TRIGGER update_constraint_rules_timestamp_trigger
BEFORE UPDATE ON shift_constraint_rules
FOR EACH ROW
EXECUTE FUNCTION update_constraint_rules_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON shift_constraint_rules TO authenticated;
GRANT SELECT, INSERT ON constraint_violations TO authenticated;
