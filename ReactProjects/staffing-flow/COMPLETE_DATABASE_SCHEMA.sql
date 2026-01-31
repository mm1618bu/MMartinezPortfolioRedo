/**
 * Complete Supabase Database Schema for Staffing Flow
 * 
 * This script creates all required tables with proper structure,
 * indexes, triggers, and relationships.
 * 
 * Run this in Supabase SQL Editor to set up the entire database.
 * 
 * ⚠️ WARNING: This will drop existing tables - backup your data first!
 */

-- =============================================
-- EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DROP EXISTING TABLES (CAUTION: This deletes all data)
-- =============================================

DROP TABLE IF EXISTS demands CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS shift_templates CASCADE;
DROP TABLE IF EXISTS labor_standards CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- =============================================
-- CORE TABLES
-- =============================================

/**
 * ORGANIZATIONS TABLE
 * Top-level container for multi-tenant data
 */
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_active ON organizations(is_active);
CREATE INDEX idx_organizations_name ON organizations(name);

-- =============================================

/**
 * SITES TABLE
 * Physical locations/facilities where staff works
 */
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  
  -- Location Details
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  timezone TEXT,
  
  -- Contact Info
  phone TEXT,
  email TEXT,
  manager_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, code)
);

CREATE INDEX idx_sites_org ON sites(organization_id);
CREATE INDEX idx_sites_active ON sites(is_active);
CREATE INDEX idx_sites_code ON sites(code);

-- =============================================

/**
 * DEPARTMENTS TABLE
 * Organizational divisions (Sales, HR, Engineering, etc.)
 */
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Info
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_departments_active ON departments(is_active);

-- =============================================

/**
 * SHIFT TEMPLATES TABLE
 * Predefined shift patterns (9-5, 6AM-2PM, etc.)
 */
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Name and Description
  name TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours NUMERIC(5, 2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ) STORED,
  
  -- Configuration
  days_of_week TEXT[], -- e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  is_full_day BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, name),
  CONSTRAINT valid_times CHECK (end_time > start_time)
);

CREATE INDEX idx_shift_templates_org ON shift_templates(organization_id);
CREATE INDEX idx_shift_templates_active ON shift_templates(is_active);

-- =============================================

/**
 * LABOR STANDARDS TABLE
 * Productivity standards and performance metrics by task type
 * Defines productivity ratios, quality thresholds, and effectiveness dates
 */
CREATE TABLE labor_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Task Classification
  task_type TEXT NOT NULL, -- e.g., 'customer_service', 'data_entry', 'processing'
  
  -- Productivity Standards (choose one metric)
  standard_units_per_hour NUMERIC(10, 2), -- e.g., 50 units/hour
  standard_hours_per_unit NUMERIC(10, 2), -- e.g., 0.5 hours/unit (inverse metric)
  
  -- Quality Metrics
  quality_threshold_percentage NUMERIC(5, 2) CHECK (quality_threshold_percentage >= 0 AND quality_threshold_percentage <= 100),
  
  -- Effective Period
  effective_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, department_id, task_type, effective_date),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= effective_date),
  CONSTRAINT valid_productivity_metric CHECK (
    (standard_units_per_hour IS NOT NULL AND standard_hours_per_unit IS NULL) OR
    (standard_units_per_hour IS NULL AND standard_hours_per_unit IS NOT NULL) OR
    (standard_units_per_hour IS NULL AND standard_hours_per_unit IS NULL)
  )
);

CREATE INDEX idx_labor_standards_org ON labor_standards(organization_id);
CREATE INDEX idx_labor_standards_department ON labor_standards(department_id);
CREATE INDEX idx_labor_standards_task_type ON labor_standards(task_type);
CREATE INDEX idx_labor_standards_active ON labor_standards(is_active);
CREATE INDEX idx_labor_standards_effective_date ON labor_standards(effective_date);
CREATE INDEX idx_labor_standards_org_task_active ON labor_standards(organization_id, task_type, is_active);

-- =============================================

/**
 * EMPLOYEES TABLE
 * Staff member information
 */
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  
  -- Personal Information
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Employment Details
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  termination_date DATE,
  
  -- Employment Type
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  
  -- Compensation
  hourly_rate NUMERIC(10, 2),
  salary NUMERIC(12, 2),
  
  -- Schedule
  weekly_hours NUMERIC(5, 2) DEFAULT 40.0,
  
  -- Benefits
  pto_balance NUMERIC(6, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, employee_number),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_employment_type ON employees(employment_type);
CREATE INDEX idx_employees_email ON employees(email);

-- =============================================

/**
 * DEMANDS TABLE
 * Workforce demand forecasts (headcount requirements)
 */
CREATE TABLE demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Date and Time
  date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'split', 'all_day')),
  start_time TIME,
  end_time TIME,
  
  -- Requirements
  required_employees INTEGER NOT NULL CHECK (required_employees > 0),
  required_skills TEXT[], -- Array of skill names required
  
  -- Priority and Notes
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  CONSTRAINT valid_date_range CHECK (
    date >= CURRENT_DATE - INTERVAL '1 year' AND
    date <= CURRENT_DATE + INTERVAL '2 years'
  ),
  CONSTRAINT notes_length CHECK (LENGTH(notes) <= 500),
  UNIQUE(organization_id, department_id, date, shift_type)
);

CREATE INDEX idx_demands_org ON demands(organization_id);
CREATE INDEX idx_demands_org_date ON demands(organization_id, date DESC);
CREATE INDEX idx_demands_department ON demands(department_id);
CREATE INDEX idx_demands_date ON demands(date);
CREATE INDEX idx_demands_priority ON demands(priority) WHERE priority IN ('high', 'critical');
CREATE INDEX idx_demands_org_dept_date ON demands(organization_id, department_id, date DESC);
CREATE INDEX idx_demands_shift_type ON demands(shift_type) WHERE shift_type IS NOT NULL;
CREATE INDEX idx_demands_skills ON demands USING GIN(required_skills);

-- =============================================

/**
 * STAFFING BUFFERS TABLE
 * Configuration for extra staff buffer percentages to handle surges and absences
 * Allows flexible buffer settings by department and time period
 */
CREATE TABLE staffing_buffers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Buffer Configuration
  name TEXT NOT NULL,
  description TEXT,
  buffer_percentage NUMERIC(5, 2) NOT NULL CHECK (buffer_percentage >= 0 AND buffer_percentage <= 100),
  buffer_minimum_count INTEGER CHECK (buffer_minimum_count IS NULL OR buffer_minimum_count >= 0),
  
  -- Time Period (optional - if NULL, applies globally)
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') OR day_of_week IS NULL),
  start_time TIME,
  end_time TIME,
  
  -- Effective Period
  effective_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= effective_date),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  UNIQUE(organization_id, department_id, effective_date, day_of_week, start_time)
);

CREATE INDEX idx_staffing_buffers_org ON staffing_buffers(organization_id);
CREATE INDEX idx_staffing_buffers_dept ON staffing_buffers(department_id);
CREATE INDEX idx_staffing_buffers_active ON staffing_buffers(is_active);
CREATE INDEX idx_staffing_buffers_effective ON staffing_buffers(effective_date);

-- =============================================

/**
 * SLA WINDOWS TABLE
 * Service Level Agreement definitions for specific time periods
 * Defines required service levels and coverage requirements
 */
CREATE TABLE sla_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  
  -- SLA Configuration
  name TEXT NOT NULL,
  description TEXT,
  
  -- Time Window (repeating pattern)
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Service Level Requirements
  required_coverage_percentage NUMERIC(5, 2) NOT NULL CHECK (required_coverage_percentage >= 0 AND required_coverage_percentage <= 100),
  minimum_staff_count INTEGER,
  
  -- Priority
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Effective Period
  effective_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= effective_date),
  CONSTRAINT valid_times CHECK (end_time > start_time),
  UNIQUE(organization_id, department_id, day_of_week, start_time, effective_date)
);

CREATE INDEX idx_sla_windows_org ON sla_windows(organization_id);
CREATE INDEX idx_sla_windows_dept ON sla_windows(department_id);
CREATE INDEX idx_sla_windows_active ON sla_windows(is_active);
CREATE INDEX idx_sla_windows_dow ON sla_windows(day_of_week);
CREATE INDEX idx_sla_windows_priority ON sla_windows(priority) WHERE priority IN ('high', 'critical');

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to all tables with updated_at
CREATE TRIGGER trigger_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sites_updated_at 
  BEFORE UPDATE ON sites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_departments_updated_at 
  BEFORE UPDATE ON departments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_shift_templates_updated_at 
  BEFORE UPDATE ON shift_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_labor_standards_updated_at 
  BEFORE UPDATE ON labor_standards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_demands_updated_at 
  BEFORE UPDATE ON demands 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_staffing_buffers_updated_at 
  BEFORE UPDATE ON staffing_buffers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sla_windows_updated_at 
  BEFORE UPDATE ON sla_windows 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- VIEWS (OPTIONAL - FOR COMMON QUERIES)
-- =============================================

/**
 * View: Active Employees by Department
 * Shows current staff count per department
 */
CREATE OR REPLACE VIEW active_employees_by_department AS
SELECT 
  d.id,
  d.name,
  o.id as organization_id,
  COUNT(e.id) as employee_count,
  COUNT(CASE WHEN e.employment_type = 'full_time' THEN 1 END) as full_time_count,
  COUNT(CASE WHEN e.employment_type = 'part_time' THEN 1 END) as part_time_count
FROM departments d
LEFT JOIN organizations o ON d.organization_id = o.id
LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
GROUP BY d.id, d.name, o.id;

-- =============================================
-- SAMPLE DATA (OPTIONAL - Comment out if not needed)
-- =============================================

/*
-- Insert sample organization
INSERT INTO organizations (name, description) 
VALUES ('Sample Company', 'A sample organization for testing');

-- Get the organization ID (you'll need to replace this with the actual ID)
-- SELECT id FROM organizations WHERE name = 'Sample Company';

-- Assuming organization ID is 'org-uuid-here', insert sample data:
-- INSERT INTO sites (organization_id, name, code) 
-- VALUES ('org-uuid-here', 'Main Office', 'HQ');

-- INSERT INTO departments (organization_id, name)
-- VALUES ('org-uuid-here', 'Sales');
*/

-- =============================================
-- SUMMARY
-- =============================================

/*
TABLES CREATED:
1. organizations - Top-level container
2. sites - Physical locations
3. departments - Organizational divisions
4. shift_templates - Predefined shifts
5. labor_standards - Staffing ratios
6. employees - Staff members
7. demands - Workforce forecasts

FEATURES:
✓ UUID primary keys for all tables
✓ Multi-tenant support (organization_id on all tables)
✓ Proper foreign key relationships with CASCADE deletes
✓ Comprehensive indexes for performance
✓ Auto-updating timestamps
✓ Data validation constraints
✓ Check constraints for valid values
✓ Unique constraints to prevent duplicates
✓ GIN index for array search (skills)

TO VERIFY TABLES:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

TO ENABLE ROW LEVEL SECURITY (PRODUCTION):
1. ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
2. Create policies for each table filtered by organization_id
3. Ensure users can only see their organization's data

TO DISABLE ROW LEVEL SECURITY (TESTING):
1. ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
2. Repeat for all other tables
*/
