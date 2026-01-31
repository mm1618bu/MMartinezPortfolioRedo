-- =============================================
-- GENERATED SCHEDULES TABLE
-- =============================================
-- Stores generated schedules with optimization metrics and quality scores

CREATE TABLE IF NOT EXISTS generated_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staffing_plan_id UUID NOT NULL REFERENCES staffing_plans(id) ON DELETE CASCADE,
  
  -- Schedule Metadata
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  generation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Generation Configuration
  algorithm VARCHAR(50) NOT NULL DEFAULT 'greedy', -- 'greedy', 'genetic', 'simulated_annealing', etc.
  algorithm_parameters JSONB DEFAULT '{}',
  
  -- Schedule Period
  schedule_start_date DATE NOT NULL,
  schedule_end_date DATE NOT NULL,
  
  -- Generation Metrics
  total_shifts INTEGER NOT NULL,
  assigned_shifts INTEGER NOT NULL DEFAULT 0,
  unassigned_shifts INTEGER NOT NULL DEFAULT 0,
  coverage_percentage NUMERIC(5,2) NOT NULL,
  
  -- Quality Metrics (from coverage scoring)
  quality_score NUMERIC(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
  constraint_violation_count INTEGER DEFAULT 0,
  hard_violation_count INTEGER DEFAULT 0,
  soft_violation_count INTEGER DEFAULT 0,
  warning_violation_count INTEGER DEFAULT 0,
  
  -- Workload Distribution
  workload_balance_score NUMERIC(5,2),
  average_employee_hours NUMERIC(8,2),
  max_employee_hours NUMERIC(8,2),
  min_employee_hours NUMERIC(8,2),
  workload_std_deviation NUMERIC(8,2),
  
  -- Schedule Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published', 'archived'
  is_locked BOOLEAN DEFAULT FALSE,
  lock_reason TEXT,
  locked_by UUID,
  locked_at TIMESTAMP WITH TIME ZONE,
  
  -- Approval Workflow
  created_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Schedule Data (compressed)
  schedule_data JSONB NOT NULL DEFAULT '{}', -- Full assignment data
  coverage_metrics JSONB DEFAULT '{}', -- Coverage scoring results
  
  -- Notes and Comments
  generation_notes TEXT,
  review_notes TEXT,
  approval_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (schedule_end_date >= schedule_start_date),
  CONSTRAINT valid_coverage CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  CONSTRAINT valid_shift_counts CHECK (assigned_shifts + unassigned_shifts = total_shifts),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  CONSTRAINT unique_schedule_per_plan_version UNIQUE (staffing_plan_id, version)
);

-- =============================================
-- SCHEDULE ASSIGNMENTS TABLE
-- =============================================
-- Individual shift assignments within a generated schedule

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES generated_schedules(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shift_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Assignment Details
  assignment_date DATE NOT NULL,
  shift_date DATE NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  duration_hours NUMERIC(5,2) NOT NULL,
  
  -- Assignment Quality
  match_score NUMERIC(5,2) CHECK (match_score >= 0 AND match_score <= 100),
  skill_match_percentage NUMERIC(5,2),
  availability_confirmed BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  constraint_violations_count INTEGER DEFAULT 0,
  has_hard_violations BOOLEAN DEFAULT FALSE,
  has_soft_violations BOOLEAN DEFAULT FALSE,
  constraint_violation_details JSONB DEFAULT '{}',
  
  -- Assignment Status
  status VARCHAR(50) NOT NULL DEFAULT 'proposed', -- 'proposed', 'assigned', 'confirmed', 'active', 'completed', 'cancelled'
  confirmation_date TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID,
  
  -- Override/Exceptions
  override_required BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_approved_by UUID,
  override_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_shift_duration CHECK (shift_end_time > shift_start_time),
  CONSTRAINT valid_status CHECK (status IN ('proposed', 'assigned', 'confirmed', 'active', 'completed', 'cancelled')),
  CONSTRAINT unique_assignment UNIQUE (schedule_id, employee_id, shift_id, shift_date)
);

-- =============================================
-- SCHEDULE VERSIONS TABLE
-- =============================================
-- Tracks version history of schedules for comparison and rollback

CREATE TABLE IF NOT EXISTS schedule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_schedule_id UUID NOT NULL REFERENCES generated_schedules(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version Details
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  change_description TEXT,
  change_type VARCHAR(50), -- 'generation', 'manual_edit', 'constraint_adjustment', 'optimization'
  
  -- Snapshot of Schedule State
  schedule_snapshot JSONB NOT NULL,
  quality_score_snapshot NUMERIC(5,2),
  coverage_metrics_snapshot JSONB,
  
  -- Comparison to Previous Version
  assignments_added INTEGER DEFAULT 0,
  assignments_removed INTEGER DEFAULT 0,
  assignments_modified INTEGER DEFAULT 0,
  quality_change NUMERIC(5,2), -- positive = improvement
  
  CONSTRAINT unique_version UNIQUE (original_schedule_id, version_number)
);

-- =============================================
-- SCHEDULE TEMPLATES TABLE
-- =============================================
-- Reusable schedule templates for faster generation

CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Template Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template Configuration
  template_data JSONB NOT NULL DEFAULT '{}',
  constraint_rules_applied UUID[] DEFAULT ARRAY[]::UUID[],
  algorithm_parameters JSONB DEFAULT '{}',
  
  -- Usage Tracking
  is_public BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SCHEDULE COMPARISON TABLE
-- =============================================
-- Stores results of schedule comparisons for analysis

CREATE TABLE IF NOT EXISTS schedule_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Schedules Being Compared
  schedule_id_a UUID NOT NULL REFERENCES generated_schedules(id) ON DELETE CASCADE,
  schedule_id_b UUID NOT NULL REFERENCES generated_schedules(id) ON DELETE CASCADE,
  
  -- Comparison Results
  compared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  comparison_data JSONB NOT NULL DEFAULT '{}',
  
  -- Metrics Comparison
  quality_score_a NUMERIC(5,2),
  quality_score_b NUMERIC(5,2),
  quality_score_difference NUMERIC(5,2),
  
  coverage_difference NUMERIC(5,2),
  workload_balance_difference NUMERIC(5,2),
  constraint_violations_difference INTEGER,
  
  -- Analysis
  recommendation TEXT,
  better_schedule_id UUID,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT different_schedules CHECK (schedule_id_a != schedule_id_b)
);

-- =============================================
-- SCHEDULE COMMENTS TABLE
-- =============================================
-- Collaborative comments on schedules

CREATE TABLE IF NOT EXISTS schedule_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES generated_schedules(id) ON DELETE CASCADE,
  
  -- Comment Details
  author_id UUID NOT NULL REFERENCES staff(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  
  -- Threading
  parent_comment_id UUID REFERENCES schedule_comments(id) ON DELETE CASCADE,
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SCHEDULE EXPORT LOGS TABLE
-- =============================================
-- Tracks schedule exports for audit and compliance

CREATE TABLE IF NOT EXISTS schedule_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES generated_schedules(id) ON DELETE CASCADE,
  
  -- Export Details
  export_format VARCHAR(50) NOT NULL, -- 'pdf', 'csv', 'json', 'ical', 'excel'
  exported_by UUID NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- File Information
  file_path TEXT,
  file_size_bytes INTEGER,
  
  -- Distribution
  recipients TEXT[],
  distribution_method VARCHAR(50), -- 'email', 'download', 'api', 'print'
  
  -- Metadata
  custom_filters JSONB DEFAULT '{}',
  notes TEXT
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Generated Schedules Indexes
CREATE INDEX idx_generated_schedules_org ON generated_schedules(organization_id);
CREATE INDEX idx_generated_schedules_plan ON generated_schedules(staffing_plan_id);
CREATE INDEX idx_generated_schedules_status ON generated_schedules(status);
CREATE INDEX idx_generated_schedules_created ON generated_schedules(created_at DESC);
CREATE INDEX idx_generated_schedules_published ON generated_schedules(published_at DESC);
CREATE INDEX idx_generated_schedules_quality ON generated_schedules(quality_score DESC);
CREATE INDEX idx_generated_schedules_period ON generated_schedules(schedule_start_date, schedule_end_date);
CREATE INDEX idx_generated_schedules_version ON generated_schedules(staffing_plan_id, version);

-- Schedule Assignments Indexes
CREATE INDEX idx_schedule_assignments_schedule ON schedule_assignments(schedule_id);
CREATE INDEX idx_schedule_assignments_employee ON schedule_assignments(employee_id);
CREATE INDEX idx_schedule_assignments_shift ON schedule_assignments(shift_id);
CREATE INDEX idx_schedule_assignments_status ON schedule_assignments(status);
CREATE INDEX idx_schedule_assignments_date ON schedule_assignments(shift_date);
CREATE INDEX idx_schedule_assignments_violations ON schedule_assignments(has_hard_violations, has_soft_violations);
CREATE INDEX idx_schedule_assignments_match_score ON schedule_assignments(match_score DESC);

-- Schedule Versions Indexes
CREATE INDEX idx_schedule_versions_schedule ON schedule_versions(original_schedule_id);
CREATE INDEX idx_schedule_versions_version ON schedule_versions(version_number DESC);
CREATE INDEX idx_schedule_versions_created ON schedule_versions(created_at DESC);

-- Schedule Templates Indexes
CREATE INDEX idx_schedule_templates_org ON schedule_templates(organization_id);
CREATE INDEX idx_schedule_templates_public ON schedule_templates(is_public, is_archived);

-- Schedule Comparisons Indexes
CREATE INDEX idx_schedule_comparisons_org ON schedule_comparisons(organization_id);
CREATE INDEX idx_schedule_comparisons_schedule_a ON schedule_comparisons(schedule_id_a);
CREATE INDEX idx_schedule_comparisons_schedule_b ON schedule_comparisons(schedule_id_b);
CREATE INDEX idx_schedule_comparisons_created ON schedule_comparisons(created_at DESC);

-- Schedule Comments Indexes
CREATE INDEX idx_schedule_comments_schedule ON schedule_comments(schedule_id);
CREATE INDEX idx_schedule_comments_author ON schedule_comments(author_id);
CREATE INDEX idx_schedule_comments_parent ON schedule_comments(parent_comment_id);
CREATE INDEX idx_schedule_comments_resolved ON schedule_comments(is_resolved);

-- Schedule Exports Indexes
CREATE INDEX idx_schedule_exports_schedule ON schedule_exports(schedule_id);
CREATE INDEX idx_schedule_exports_exported_by ON schedule_exports(exported_by);
CREATE INDEX idx_schedule_exports_date ON schedule_exports(exported_at DESC);

-- GIN Indexes for Array Searches
CREATE INDEX idx_schedule_templates_constraints ON schedule_templates USING GIN(constraint_rules_applied);
CREATE INDEX idx_schedule_exports_recipients ON schedule_exports USING GIN(recipients);

-- =============================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_generated_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_generated_schedules_timestamp_trigger ON generated_schedules;
CREATE TRIGGER update_generated_schedules_timestamp_trigger
BEFORE UPDATE ON generated_schedules
FOR EACH ROW
EXECUTE FUNCTION update_generated_schedules_timestamp();

CREATE OR REPLACE FUNCTION update_schedule_assignments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_assignments_timestamp_trigger ON schedule_assignments;
CREATE TRIGGER update_schedule_assignments_timestamp_trigger
BEFORE UPDATE ON schedule_assignments
FOR EACH ROW
EXECUTE FUNCTION update_schedule_assignments_timestamp();

CREATE OR REPLACE FUNCTION update_schedule_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_templates_timestamp_trigger ON schedule_templates;
CREATE TRIGGER update_schedule_templates_timestamp_trigger
BEFORE UPDATE ON schedule_templates
FOR EACH ROW
EXECUTE FUNCTION update_schedule_templates_timestamp();

CREATE OR REPLACE FUNCTION update_schedule_comments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_comments_timestamp_trigger ON schedule_comments;
CREATE TRIGGER update_schedule_comments_timestamp_trigger
BEFORE UPDATE ON schedule_comments
FOR EACH ROW
EXECUTE FUNCTION update_schedule_comments_timestamp();

-- =============================================
-- PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON generated_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_assignments TO authenticated;
GRANT SELECT, INSERT ON schedule_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON schedule_comparisons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_comments TO authenticated;
GRANT SELECT, INSERT ON schedule_exports TO authenticated;
