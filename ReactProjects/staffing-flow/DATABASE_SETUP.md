/**
 * Database Setup & Diagnostics Guide
 * 
 * This guide helps you set up the Supabase database for the Staffing Flow application.
 * 
 * Current Status: Database has issues
 * - Some tables missing (sites, organizations, departments, employees, demands)
 * - RLS policies have infinite recursion errors
 * - Only shift_templates and labor_standards tables are working
 */

# Database Setup Issues & Solutions

## Problem Summary

Your Supabase database has the following issues:

### Tables Status:
- ✓ **labor_standards** - Works correctly
- ✓ **shift_templates** - Works correctly  
- ✗ **sites** - Does not exist (404 error)
- ✗ **organizations** - RLS policy infinite recursion (500 error)
- ✗ **departments** - RLS policy infinite recursion (500 error)
- ✗ **employees** - RLS policy infinite recursion (500 error)
- ✗ **demands** - RLS policy infinite recursion (500 error)

### Root Causes:

1. **Incomplete Database Setup** - Not all tables were created during initialization
2. **RLS Policy Errors** - Row Level Security policies have circular dependencies causing infinite recursion

## Solution Steps

### Step 1: Disable RLS Temporarily (Testing Only)

1. Go to Supabase Dashboard: https://app.supabase.com
2. Navigate to your project: **staffing-flow-db**
3. Go to **SQL Editor** tab
4. For each table with RLS errors, disable policies:
   - Click the table name in the left sidebar
   - Go to the "RLS" section
   - Disable all RLS policies
   - Keep them disabled until we verify the schema works

### Step 2: Create Missing Tables

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites Table
CREATE TABLE IF NOT EXISTS sites (
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
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, code)
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, employee_number),
  UNIQUE(organization_id, email)
);

-- Demands Table
CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'split', 'all_day')),
  start_time TIME,
  end_time TIME,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  required_employees INTEGER NOT NULL CHECK (required_employees > 0),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT CHECK (LENGTH(notes) <= 500),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time OR (start_time IS NULL AND end_time IS NULL)),
  CONSTRAINT unique_demand_per_day UNIQUE (organization_id, department_id, date, shift_type)
);

-- Create Indexes
CREATE INDEX idx_demands_org_date ON demands(organization_id, date DESC);
CREATE INDEX idx_demands_department ON demands(department_id);
CREATE INDEX idx_demands_date_range ON demands(date);
CREATE INDEX idx_demands_priority ON demands(priority) WHERE priority IN ('high', 'critical');
CREATE INDEX idx_demands_org_dept_date ON demands(organization_id, department_id, date DESC);
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_sites_org ON sites(organization_id);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_demands_updated_at BEFORE UPDATE ON demands FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Step 3: Add Sample Data

```sql
-- Insert sample organization
INSERT INTO organizations (name) VALUES ('Sample Company')
ON CONFLICT DO NOTHING;

-- Get the organization ID (replace with actual ID from previous insert)
-- INSERT INTO sites (name, organization_id) 
-- VALUES ('Main Office', 'YOUR_ORG_ID_HERE');
```

### Step 4: Test Connection

After creating tables, run the database health check in the app:
- Navigate to "Database Health" in the nav bar
- Click "Refresh" button
- Check that all tables now show as connected
- Run "🔍 Diagnostics" to verify connection

### Step 5: Re-enable RLS (Production)

Once verified, enable RLS policies for security:
1. For each table in Supabase dashboard
2. Go to RLS section
3. Create policies to restrict access by organization_id
4. Test that app still works with RLS enabled

## Quick Test

To verify your setup, check if this table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- demands
- departments
- employees
- labor_standards
- organizations
- shift_templates
- sites

## Need Help?

If you still see connection errors after following these steps:

1. **Check environment variables** - Ensure .env has correct Supabase URL and key
2. **Check Supabase project status** - Make sure project isn't paused
3. **Check API key permissions** - Use an anon key with proper permissions
4. **Disable all RLS temporarily** - To test if RLS is blocking access
5. **Run diagnostics** - Click the Diagnostics button to see exact error messages

## Common Errors

### "Infinite recursion detected in policy"
- Solution: Disable RLS for all tables temporarily, then re-enable with proper policies

### "Could not find the table"
- Solution: Create the missing table using SQL above

### "401 Unauthorized"
- Solution: Check API key in .env matches Supabase dashboard
- Regenerate key if needed

### "CORS policy blocked"
- Solution: Add http://localhost:5173 to Supabase CORS settings
