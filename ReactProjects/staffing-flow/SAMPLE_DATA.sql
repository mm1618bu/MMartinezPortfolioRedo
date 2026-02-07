/**
 * Sample Data for Staffing Flow
 * Run this AFTER creating the database schema
 * This provides initial data to get started with the application
 */

-- =============================================
-- SAMPLE ORGANIZATION
-- =============================================

INSERT INTO organizations (id, name, description, is_active)
VALUES 
  ('a0000000-0000-4000-8000-000000000001', 'Demo Corporation', 'Sample organization for testing and development', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SAMPLE SITES
-- =============================================

INSERT INTO sites (organization_id, name, code, description, city, state, timezone, is_active)
VALUES 
  ('a0000000-0000-4000-8000-000000000001', 'Headquarters', 'HQ', 'Main office location', 'Seattle', 'WA', 'America/Los_Angeles', true),
  ('a0000000-0000-4000-8000-000000000001', 'East Coast Center', 'EC', 'East coast operations', 'New York', 'NY', 'America/New_York', true)
ON CONFLICT (organization_id, code) DO NOTHING;

-- =============================================
-- SAMPLE DEPARTMENTS
-- =============================================

INSERT INTO departments (organization_id, name, description, is_active)
VALUES 
  ('a0000000-0000-4000-8000-000000000001', 'Customer Service', 'Customer support and service operations', true),
  ('a0000000-0000-4000-8000-000000000001', 'Operations', 'Day-to-day operations and fulfillment', true),
  ('a0000000-0000-4000-8000-000000000001', 'Sales', 'Sales and business development', true),
  ('a0000000-0000-4000-8000-000000000001', 'Engineering', 'Product development and engineering', true)
ON CONFLICT (organization_id, name) DO NOTHING;

-- =============================================
-- SAMPLE SHIFT TEMPLATES
-- =============================================

INSERT INTO shift_templates (organization_id, name, description, start_time, end_time, days_of_week, is_active)
VALUES 
  ('a0000000-0000-4000-8000-000000000001', 'Morning Shift', '9 AM to 5 PM weekday shift', '09:00', '17:00', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], true),
  ('a0000000-0000-4000-8000-000000000001', 'Afternoon Shift', '1 PM to 9 PM', '13:00', '21:00', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], true),
  ('a0000000-0000-4000-8000-000000000001', 'Evening Shift', '5 PM to 11 PM', '17:00', '23:00', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], true)
ON CONFLICT (organization_id, name) DO NOTHING;

-- =============================================
-- SAMPLE EMPLOYEES
-- =============================================

INSERT INTO employees (
  organization_id, 
  department_id, 
  employee_number, 
  first_name, 
  last_name, 
  email, 
  position, 
  hire_date, 
  employment_type, 
  status, 
  hourly_rate, 
  weekly_hours
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'EMP001',
  'John',
  'Smith',
  'john.smith@demo.com',
  'Senior Agent',
  '2024-01-15',
  'full_time',
  'active',
  25.00,
  40.0
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, employee_number) DO NOTHING;

INSERT INTO employees (
  organization_id, 
  department_id, 
  employee_number, 
  first_name, 
  last_name, 
  email, 
  position, 
  hire_date, 
  employment_type, 
  status, 
  hourly_rate, 
  weekly_hours
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'EMP002',
  'Jane',
  'Doe',
  'jane.doe@demo.com',
  'Operations Specialist',
  '2024-02-01',
  'full_time',
  'active',
  22.50,
  40.0
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Operations'
ON CONFLICT (organization_id, employee_number) DO NOTHING;

-- =============================================
-- SAMPLE DEMANDS (Next 7 days)
-- =============================================

INSERT INTO demands (
  organization_id,
  department_id,
  date,
  shift_type,
  start_time,
  end_time,
  required_employees,
  priority
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  CURRENT_DATE + i,
  'morning',
  '09:00',
  '17:00',
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + i) IN (0, 6) THEN 3 ELSE 5 END,
  'medium'
FROM departments d 
CROSS JOIN generate_series(0, 6) AS i
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, date, shift_type) DO NOTHING;

INSERT INTO demands (
  organization_id,
  department_id,
  date,
  shift_type,
  start_time,
  end_time,
  required_employees,
  priority
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  CURRENT_DATE + i,
  'afternoon',
  '13:00',
  '21:00',
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + i) IN (0, 6) THEN 2 ELSE 4 END,
  'medium'
FROM departments d 
CROSS JOIN generate_series(0, 6) AS i
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, date, shift_type) DO NOTHING;

-- =============================================
-- SAMPLE LABOR STANDARDS
-- =============================================

INSERT INTO labor_standards (
  organization_id,
  department_id,
  name,
  description,
  task_type,
  standard_units_per_hour,
  quality_threshold_percentage,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'Customer Service Standard',
  'Standard productivity for customer service representatives',
  'customer_service',
  15.00,
  95.00,
  CURRENT_DATE,
  true
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, task_type, effective_date) DO NOTHING;

-- =============================================
-- SAMPLE STAFFING BUFFERS
-- =============================================

INSERT INTO staffing_buffers (
  organization_id,
  department_id,
  name,
  description,
  buffer_percentage,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'Standard Buffer',
  'Standard 10% buffer for absences and variability',
  10.00,
  CURRENT_DATE,
  true
FROM departments d 
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, effective_date, day_of_week, start_time) DO NOTHING;

-- =============================================
-- SAMPLE SLA WINDOWS
-- =============================================

INSERT INTO sla_windows (
  organization_id,
  department_id,
  name,
  description,
  day_of_week,
  start_time,
  end_time,
  required_coverage_percentage,
  minimum_staff_count,
  priority,
  effective_date,
  is_active
)
SELECT 
  'a0000000-0000-4000-8000-000000000001',
  d.id,
  'Weekday Peak Hours',
  'High coverage requirement during peak business hours',
  dow,
  '09:00',
  '17:00',
  95.00,
  3,
  'high',
  CURRENT_DATE,
  true
FROM departments d 
CROSS JOIN (VALUES ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday'), ('Friday')) AS days(dow)
WHERE d.organization_id = 'a0000000-0000-4000-8000-000000000001' 
  AND d.name = 'Customer Service'
ON CONFLICT (organization_id, department_id, day_of_week, start_time, effective_date) DO NOTHING;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check what was created
SELECT 'Organizations' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL
SELECT 'Sites', COUNT(*) FROM sites
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Shift Templates', COUNT(*) FROM shift_templates
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Demands', COUNT(*) FROM demands
UNION ALL
SELECT 'Labor Standards', COUNT(*) FROM labor_standards
UNION ALL
SELECT 'Staffing Buffers', COUNT(*) FROM staffing_buffers
UNION ALL
SELECT 'SLA Windows', COUNT(*) FROM sla_windows
ORDER BY table_name;
