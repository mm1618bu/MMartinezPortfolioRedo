-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'viewer')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create sites table (physical locations/facilities)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  timezone TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, code)
);

-- =============================================
-- EMPLOYEE MANAGEMENT
-- =============================================

-- Create employees table (comprehensive employee data)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  termination_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
  hourly_rate NUMERIC(10, 2),
  salary NUMERIC(12, 2),
  weekly_hours NUMERIC(5, 2) DEFAULT 40,
  pto_balance NUMERIC(6, 2) DEFAULT 0,
  vet_eligible BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, employee_number),
  UNIQUE(organization_id, email)
);

-- Create skills table (master list of skills)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create certifications table (master list of certifications)
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  issuing_organization TEXT,
  validity_period_months INTEGER,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create employee_skills junction table
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  acquired_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, skill_id)
);

-- Create employee_certifications junction table
CREATE TABLE employee_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  expiration_date DATE,
  certification_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, certification_id, issue_date)
);

-- =============================================
-- SHIFT MANAGEMENT
-- =============================================

-- Create shift_templates table (reusable shift patterns)
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours NUMERIC(5, 2) NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'split')),
  required_skills UUID[], -- Array of skill IDs
  required_certifications UUID[], -- Array of certification IDs
  min_employees INTEGER DEFAULT 1,
  max_employees INTEGER,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create shift_assignments table (actual shifts assigned to employees)
CREATE TABLE shift_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- =============================================
-- DEMAND & LABOR PLANNING
-- =============================================

-- Create demand_intervals table (forecast/demand data)
CREATE TABLE demand_intervals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interval_start TIMESTAMPTZ NOT NULL,
  interval_end TIMESTAMPTZ NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  forecasted_volume NUMERIC(12, 2),
  actual_volume NUMERIC(12, 2),
  required_employees INTEGER,
  scheduled_employees INTEGER,
  units TEXT, -- e.g., 'orders', 'calls', 'patients'
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (interval_end > interval_start)
);

-- Create labor_standards table (productivity/performance standards)
CREATE TABLE labor_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  standard_units_per_hour NUMERIC(10, 2),
  standard_hours_per_unit NUMERIC(10, 4),
  quality_threshold_percentage NUMERIC(5, 2),
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE & TIME TRACKING
-- =============================================

-- Create attendance_events table (clock in/out, tardiness, etc.)
CREATE TABLE attendance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_assignment_id UUID REFERENCES shift_assignments(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('clock_in', 'clock_out', 'break_start', 'break_end', 'missed_punch', 'tardiness', 'early_departure', 'overtime')),
  event_time TIMESTAMPTZ NOT NULL,
  scheduled_time TIMESTAMPTZ,
  location TEXT,
  ip_address INET,
  device_info JSONB,
  variance_minutes INTEGER, -- Difference from scheduled time
  notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BACKLOG & WORKLOAD TRACKING
-- =============================================

-- Create backlog_snapshots table (work queue snapshots)
CREATE TABLE backlog_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_time TIMESTAMPTZ NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  work_type TEXT NOT NULL,
  total_items INTEGER NOT NULL,
  oldest_item_age_hours NUMERIC(10, 2),
  average_item_age_hours NUMERIC(10, 2),
  priority_breakdown JSONB, -- { "high": 50, "medium": 100, "low": 200 }
  sla_breach_count INTEGER DEFAULT 0,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LABOR ACTIONS (VET/VTO)
-- =============================================

-- Create labor_actions table (VET/VTO offers and responses)
CREATE TABLE labor_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL CHECK (action_type IN ('VET', 'VTO')), -- Voluntary Extra Time / Voluntary Time Off
  target_date DATE NOT NULL,
  shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  positions_available INTEGER NOT NULL,
  positions_filled INTEGER DEFAULT 0,
  priority_order TEXT, -- e.g., 'seniority', 'performance', 'random'
  offer_message TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'cancelled')),
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create labor_action_responses table
CREATE TABLE labor_action_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  labor_action_id UUID NOT NULL REFERENCES labor_actions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  response_status TEXT NOT NULL CHECK (response_status IN ('accepted', 'declined', 'pending', 'waitlisted')),
  response_time TIMESTAMPTZ DEFAULT NOW(),
  priority_score NUMERIC(10, 2), -- For ranking responses
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(labor_action_id, employee_id)
);

-- =============================================
-- PTO MANAGEMENT
-- =============================================

-- Create pto_requests table (comprehensive PTO tracking)
CREATE TABLE pto_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('vacation', 'sick', 'personal', 'unpaid', 'bereavement', 'jury_duty', 'parental', 'medical')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours NUMERIC(6, 2) NOT NULL,
  partial_day BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'withdrawn')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  auto_approved BOOLEAN DEFAULT false,
  affects_shifts UUID[], -- Array of shift_assignment IDs
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- =============================================
-- AUTHENTICATION & SECURITY
-- =============================================

-- Create refresh_tokens table (secure token storage)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Index for token lookups and cleanup
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE is_revoked = false;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE is_revoked = false;

-- =============================================
-- AUDIT & COMPLIANCE
-- =============================================

-- Create audit_logs table (system audit trail)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SIMULATION & PLANNING
-- =============================================

-- Create simulation_scenarios table (what-if scenarios)
CREATE TABLE simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT CHECK (scenario_type IN ('demand_spike', 'staffing_shortage', 'cost_optimization', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  parameters JSONB, -- Flexible parameter storage
  base_case_id UUID, -- Reference to another scenario for comparison
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'archived')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simulation_runs table (execution of scenarios)
CREATE TABLE simulation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
  run_number INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  input_data JSONB,
  output_data JSONB,
  metrics JSONB, -- Key metrics: cost, coverage, satisfaction, etc.
  error_message TEXT,
  execution_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scenario_id, run_number)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Core tables
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_departments_organization ON departments(organization_id);

-- Employees
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_number ON employees(employee_number);

-- Skills & Certifications
CREATE INDEX idx_skills_organization ON skills(organization_id);
CREATE INDEX idx_certifications_organization ON certifications(organization_id);
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);
CREATE INDEX idx_employee_certifications_employee ON employee_certifications(employee_id);
CREATE INDEX idx_employee_certifications_cert ON employee_certifications(certification_id);
CREATE INDEX idx_employee_certifications_status ON employee_certifications(status);

-- Shifts
CREATE INDEX idx_shift_templates_organization ON shift_templates(organization_id);
CREATE INDEX idx_shift_templates_department ON shift_templates(department_id);
CREATE INDEX idx_shift_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX idx_shift_assignments_date ON shift_assignments(shift_date);
CREATE INDEX idx_shift_assignments_dates ON shift_assignments(start_time, end_time);
CREATE INDEX idx_shift_assignments_status ON shift_assignments(status);
CREATE INDEX idx_shift_assignments_organization ON shift_assignments(organization_id);
-- Time-series indexes for shift queries
CREATE INDEX idx_shift_assignments_org_time ON shift_assignments(organization_id, start_time DESC);
CREATE INDEX idx_shift_assignments_dept_time ON shift_assignments(department_id, start_time DESC);
CREATE INDEX idx_shift_assignments_emp_time ON shift_assignments(employee_id, start_time DESC);

-- Demand & Labor
CREATE INDEX idx_demand_intervals_times ON demand_intervals(interval_start, interval_end);
CREATE INDEX idx_demand_intervals_department ON demand_intervals(department_id);
CREATE INDEX idx_demand_intervals_organization ON demand_intervals(organization_id);
CREATE INDEX idx_labor_standards_department ON labor_standards(department_id);
CREATE INDEX idx_labor_standards_effective_date ON labor_standards(effective_date);
-- Time-series indexes for demand queries
CREATE INDEX idx_demand_intervals_org_time ON demand_intervals(organization_id, interval_start DESC);
CREATE INDEX idx_demand_intervals_dept_time ON demand_intervals(department_id, interval_start DESC);
CREATE INDEX idx_labor_standards_dept_effective ON labor_standards(department_id, effective_date DESC);

-- Attendance
CREATE INDEX idx_attendance_events_employee ON attendance_events(employee_id);
CREATE INDEX idx_attendance_events_shift ON attendance_events(shift_assignment_id);
CREATE INDEX idx_attendance_events_time ON attendance_events(event_time);
CREATE INDEX idx_attendance_events_type ON attendance_events(event_type);
-- Time-series indexes for attendance queries
CREATE INDEX idx_attendance_events_org_time ON attendance_events(organization_id, event_time DESC);
CREATE INDEX idx_attendance_events_emp_time ON attendance_events(employee_id, event_time DESC);
CREATE INDEX idx_attendance_events_dept_time ON attendance_events(department_id, e
-- Time-series indexes for backlog queries
CREATE INDEX idx_backlog_snapshots_org_time ON backlog_snapshots(organization_id, snapshot_time DESC);
CREATE INDEX idx_backlog_snapshots_dept_time ON backlog_snapshots(department_id, snapshot_time DESC);vent_time DESC);
CREATE INDEX idx_attendance_events_type_time ON attendance_events(event_type, event_time DESC);

-- Backlog
CREATE INDEX idx_backlog_snapshots_time ON backlog_snapshots(snapshot_time);
CREATE INDEX idx_backlog_snapshots_department ON backlog_snapshots(department_id);

-- Labor Actions
CREATE INDEX idx_labor_actions_date ON labor_actions(target_date);
CREATE INDEX idx_labor_actions_status ON labor_actions(status);
-- Time-series indexes for labor action queries
CREATE INDEX idx_labor_actions_org_date ON labor_actions(organization_id, target_date DESC);
CREATE INDEX idx_labor_actions_dept_date ON labor_actions(department_id, target_date DESC);
CREATE INDEX idx_labor_actions_status_date ON labor_actions(status, target_date DESC);
CREATE INDEX idx_labor_actions_time_range ON labor_actions(start_time, end_time);
CREATE INDEX idx_labor_actions_department ON labor_actions(department_id);
CREATE INDEX idx_labor_action_responses_action ON labor_action_responses(labor_action_id);
CREATE INDEX idx_labor_action_responses_employee ON labor_action_responses(employee_id);

-- Time-series indexes for PTO queries
CREATE INDEX idx_pto_requests_org_start ON pto_requests(organization_id, start_date DESC);
CREATE INDEX idx_pto_requests_emp_start ON pto_requests(employee_id, start_date DESC);
CREATE INDEX idx_pto_requests_status_start ON pto_requests(status, start_date DESC);
-- PTO
CREATE INDEX idx_pto_requests_employee ON pto_requests(employee_id);
CREATE INDEX idx_pto_requests_dates ON pto_requests(start_date, end_date);
CREATE INDEX idx_pto_requests_status ON pto_requests(status);
CREATE INDEX idx_pto_requests_organization ON pto_requests(organization_id);

-- Audit
-- Time-series indexes for audit log queries
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_table_created ON audit_logs(table_name, created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);

-- Time-series indexes for simulation queries
CREATE INDEX idx_simulation_scenarios_org_start ON simulation_scenarios(organization_id, start_date DESC);
CREATE INDEX idx_simulation_scenarios_created ON simulation_scenarios(created_at DESC);
CREATE INDEX idx_simulation_runs_scenario_created ON simulation_runs(scenario_id, created_at DESC);
CREATE INDEX idx_simulation_runs_started ON simulation_runs(started_at DESC) WHERE started_at IS NOT NULL;
CREATE INDEX idx_simulation_runs_completed ON simulation_runs(completed_at DESC) WHERE completed_at IS NOT NULL;
-- Simulation
CREATE INDEX idx_simulation_scenarios_dates ON simulation_scenarios(start_date, end_date);
CREATE INDEX idx_simulation_scenarios_status ON simulation_scenarios(status);
CREATE INDEX idx_simulation_runs_scenario ON simulation_runs(scenario_id);
CREATE INDEX idx_simulation_runs_status ON simulation_runs(status);

-- =============================================
-- TRIGGERS
-- =============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_skills_updated_at BEFORE UPDATE ON employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_certifications_updated_at BEFORE UPDATE ON employee_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at BEFORE UPDATE ON shift_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at BEFORE UPDATE ON shift_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demand_intervals_updated_at BEFORE UPDATE ON demand_intervals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_standards_updated_at BEFORE UPDATE ON labor_standards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_events_updated_at BEFORE UPDATE ON attendance_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_actions_updated_at BEFORE UPDATE ON labor_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_action_responses_updated_at BEFORE UPDATE ON labor_action_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pto_requests_updated_at BEFORE UPDATE ON pto_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_scenarios_updated_at BEFORE UPDATE ON simulation_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_runs_updated_at BEFORE UPDATE ON simulation_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUDIT LOG TRIGGER
-- =============================================

-- Function to automatically log changes to audit_logs
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id, organization_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), current_setting('app.current_user_id', true)::UUID, OLD.organization_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id, organization_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::UUID, NEW.organization_id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id, organization_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), current_setting('app.current_user_id', true)::UUID, NEW.organization_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to critical tables (add more as needed)
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_shift_assignments AFTER INSERT OR UPDATE OR DELETE ON shift_assignments
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_pto_requests AFTER INSERT OR UPDATE OR DELETE ON pto_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_labor_actions AFTER INSERT OR UPDATE OR DELETE ON labor_actions
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
```

### 5. Set Up Row Level Security (RLS)

Run this SQL to enable RLS and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_requests ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users policies
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND organization_id = users.organization_id
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND organization_id = users.organization_id
    )
  );

-- Departments policies
CREATE POLICY "Users can view departments in their organization"
  ON departments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Managers can insert departments"
  ON departments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id = departments.organization_id
    )
  );

CREATE POLICY "Managers can update departments"
  ON departments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id = departments.organization_id
    )
  );

-- Employees policies
CREATE POLICY "Users can view employees in their organization"
  ON employees FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Managers can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id = employees.organization_id
    )
  );

CREATE POLICY "Managers can update employees"
  ON employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id = employees.organization_id
    )
  );

-- Shift assignments policies
CREATE POLICY "Users can view shifts in their organization"
  ON shift_assignments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Managers can manage shifts"
  ON shift_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id = shift_assignments.organization_id
    )
  );

-- PTO requests policies
CREATE POLICY "Users can view PTO in their organization"
  ON pto_requests FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Employees can create their own PTO requests"
  ON pto_requests FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage PTO requests"
  ON pto_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id = pto_requests.organization_id
    )
  );