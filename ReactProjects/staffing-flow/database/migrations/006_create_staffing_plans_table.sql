-- =============================================
-- STAFFING PLANS TABLE
-- =============================================
-- Stores staffing plans that combine demands, buffers, and SLAs
-- into executable staffing schedules

CREATE TABLE IF NOT EXISTS staffing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Plan Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Plan Configuration
  -- References related data (demands, buffers, SLAs)
  demand_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Array of demand IDs included in this plan
  staffing_buffer_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Array of buffer IDs applied
  sla_window_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Array of SLA IDs enforced
  
  -- Staffing Metrics
  planned_headcount INTEGER, -- Total staff planned
  current_assignments INTEGER DEFAULT 0, -- Number of assigned staff
  unassigned_positions INTEGER DEFAULT 0, -- Positions needing assignment
  
  -- Status and Approval
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'active', 'completed', 'archived')),
  
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Approval Tracking
  created_by UUID, -- User who created the plan
  approved_by UUID, -- User who approved the plan
  approval_date TIMESTAMPTZ,
  
  -- Notes and Comments
  notes TEXT,
  internal_comments TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_headcount CHECK (planned_headcount IS NULL OR planned_headcount > 0),
  UNIQUE(organization_id, department_id, name, start_date)
);

-- Indexes for performance
CREATE INDEX idx_staffing_plans_org ON staffing_plans(organization_id);
CREATE INDEX idx_staffing_plans_dept ON staffing_plans(department_id);
CREATE INDEX idx_staffing_plans_status ON staffing_plans(status);
CREATE INDEX idx_staffing_plans_priority ON staffing_plans(priority);
CREATE INDEX idx_staffing_plans_start_date ON staffing_plans(start_date);
CREATE INDEX idx_staffing_plans_active ON staffing_plans(status) 
  WHERE status IN ('active', 'scheduled', 'approved');

-- GIN index for array searches (for demand_ids, buffer_ids, sla_window_ids)
CREATE INDEX idx_staffing_plans_demand_ids ON staffing_plans USING GIN(demand_ids);
CREATE INDEX idx_staffing_plans_buffer_ids ON staffing_plans USING GIN(staffing_buffer_ids);
CREATE INDEX idx_staffing_plans_sla_ids ON staffing_plans USING GIN(sla_window_ids);

-- =============================================
-- STAFFING PLAN ASSIGNMENTS TABLE
-- =============================================
-- Tracks individual employee assignments to a staffing plan

CREATE TABLE IF NOT EXISTS staffing_plan_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staffing_plan_id UUID NOT NULL REFERENCES staffing_plans(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Assignment Details
  assignment_date DATE NOT NULL,
  assignment_end_date DATE,
  
  -- Role and Responsibilities
  assigned_role TEXT, -- e.g., 'lead', 'associate', 'support'
  shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'assigned', 'confirmed', 'active', 'completed', 'cancelled')),
  
  -- Confirmation
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_assignment_dates CHECK (assignment_end_date IS NULL OR assignment_end_date >= assignment_date),
  UNIQUE(staffing_plan_id, employee_id, assignment_date)
);

-- Indexes for performance
CREATE INDEX idx_assignments_plan ON staffing_plan_assignments(staffing_plan_id);
CREATE INDEX idx_assignments_employee ON staffing_plan_assignments(employee_id);
CREATE INDEX idx_assignments_org ON staffing_plan_assignments(organization_id);
CREATE INDEX idx_assignments_status ON staffing_plan_assignments(status);
CREATE INDEX idx_assignments_date ON staffing_plan_assignments(assignment_date);

-- =============================================
-- FUNCTION: Auto-update staffing_plans.updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_staffing_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_staffing_plans_update_timestamp
BEFORE UPDATE ON staffing_plans
FOR EACH ROW
EXECUTE FUNCTION update_staffing_plans_timestamp();

-- =============================================
-- FUNCTION: Auto-update assignments timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_plan_assignments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assignments_update_timestamp
BEFORE UPDATE ON staffing_plan_assignments
FOR EACH ROW
EXECUTE FUNCTION update_plan_assignments_timestamp();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE staffing_plans IS 'Master staffing plans that combine demands, buffers, and SLAs into executable schedules';
COMMENT ON COLUMN staffing_plans.status IS 'Lifecycle status: draft -> pending_approval -> approved -> scheduled -> active -> completed/archived';
COMMENT ON COLUMN staffing_plans.demand_ids IS 'Array of demand record IDs that this plan addresses';
COMMENT ON COLUMN staffing_plans.staffing_buffer_ids IS 'Array of staffing buffer IDs applied to headcount calculations';
COMMENT ON COLUMN staffing_plans.sla_window_ids IS 'Array of SLA window IDs that define service level requirements';
COMMENT ON COLUMN staffing_plans.planned_headcount IS 'Target number of staff needed (calculated from demands + buffers)';

COMMENT ON TABLE staffing_plan_assignments IS 'Individual employee assignments within a staffing plan';
COMMENT ON COLUMN staffing_plan_assignments.status IS 'Assignment status: proposed -> assigned -> confirmed -> active -> completed/cancelled';
COMMENT ON COLUMN staffing_plan_assignments.shift_template_id IS 'Optional reference to a shift template if this assignment follows a template';
