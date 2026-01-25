# Database Connection Diagnostics Report

**Generated:** January 24, 2025  
**Project:** Staffing Flow  
**Status:** ⚠️ Database Configuration Issues Detected

---

## Executive Summary

Your Supabase database has **partial connectivity** but is **missing critical tables and has RLS policy errors**.

### Current Status:
- ✅ **Network:** Reachable (https://cexhfbreotogzlhisfxd.supabase.co)
- ✅ **API Key:** Valid and present
- ✅ **Some tables working:** shift_templates, labor_standards
- ❌ **Missing table:** sites (404 Not Found)
- ❌ **RLS policy errors:** organizations, departments, employees, demands (Infinite recursion)

---

## Detailed Issues

### Issue #1: Missing "sites" Table
**Error:** `Could not find the table 'public.sites' in the schema cache`  
**Impact:** Critical - App cannot load site management features  
**Root Cause:** Database schema was not fully initialized

### Issue #2: Infinite Recursion in RLS Policies  
**Error:** `infinite recursion detected in policy for relation "users"`  
**Affected Tables:** organizations, departments, employees, demands  
**Impact:** High - These tables cannot be queried  
**Root Cause:** RLS (Row Level Security) policies have circular dependencies

### Issue #3: Incomplete Schema Setup
**Missing Tables:**
1. organizations
2. sites  
3. departments
4. employees
5. demands

**Existing Tables:**
1. shift_templates ✓
2. labor_standards ✓

---

## Solution Steps

### Step 1: Disable RLS Policies (Temporary)

⚠️ **For Development Only** - Do not do this in production!

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project: **cexhfbreotogzlhisfxd**
3. Navigate to **Authentication > Policies**
4. Disable all RLS policies for these tables:
   - organizations
   - departments
   - employees
   - demands

You can also disable RLS per-table:
- Click each table in SQL Editor sidebar
- Look for "RLS" toggle at the top
- Turn it OFF

### Step 2: Create Missing Tables

Execute this SQL in Supabase SQL Editor:

```sql
-- Enable UUID if not already enabled
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

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_demands_org_date ON demands(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_demands_department ON demands(department_id);
CREATE INDEX IF NOT EXISTS idx_demands_date_range ON demands(date);
CREATE INDEX IF NOT EXISTS idx_demands_priority ON demands(priority) WHERE priority IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_demands_org_dept_date ON demands(organization_id, department_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);

-- Create auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS trigger_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS trigger_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS trigger_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER IF NOT EXISTS trigger_demands_updated_at BEFORE UPDATE ON demands FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Step 3: Create Sample Data (Optional)

```sql
-- Create a sample organization
INSERT INTO organizations (name) VALUES ('Demo Company')
ON CONFLICT DO NOTHING;

-- Get the organization ID from the insert, then create other records
-- (Replace 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' with actual ID)
INSERT INTO sites (name, organization_id) 
VALUES ('Main Office', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
ON CONFLICT DO NOTHING;
```

### Step 4: Verify in App

1. In the app, navigate to **Database Health** in the navigation bar
2. Click the **Refresh** button
3. Verify all tables now show as connected ✓
4. Click **🔍 Diagnostics** to see detailed connection info

You should see all 7 tables marked as ✓ Connected.

### Step 5: Test App Features

Try these features to verify everything works:
- Navigate to **Sites** → Create a new site
- Navigate to **Departments** → Create a new department  
- Navigate to **Employees** → Add an employee
- Navigate to **Demand Planning** → Create a demand forecast

### Step 6: Enable RLS (Production)

Once verified, enable RLS policies for security:

1. Go back to Supabase Dashboard
2. For each table, re-enable RLS:
   - Go to **Authentication > Policies**
   - Or click table in SQL Editor and toggle RLS ON
3. Create proper policies:
   - Allow SELECT/INSERT/UPDATE/DELETE filtered by organization_id
   - Restrict users to their own organization's data

---

## Quick Diagnosis Commands

You can test connectivity directly in the browser console:

```javascript
// Test if tables exist
const tables = ['sites', 'organizations', 'departments', 'employees', 'demands'];
for (const table of tables) {
  supabase.from(table).select('id').limit(1).then(({data, error}) => {
    console.log(`${table}: ${error ? '❌ ' + error.message : '✓'}`);
  });
}
```

---

## Environment Variables

Verify your `.env` file has these variables set:

```env
VITE_SUPABASE_URL=https://cexhfbreotogzlhisfxd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_c1q20_xzXDK2Nwk9v2HwAA_X2wppVn-
```

The app is currently using these from your `.env` file. If you change these, restart the dev server.

---

## Common Issues & Solutions

### Error: "infinite recursion detected in policy"
**Solution:** Disable RLS policies as shown in Step 1

### Error: "Could not find the table"
**Solution:** Run the CREATE TABLE SQL from Step 2

### Error: "No API key found in request"
**Solution:** Check VITE_SUPABASE_ANON_KEY in .env file

### Error: "Unauthorized (401)"
**Solution:** Generate a new anon key from Supabase dashboard

### Still seeing "Database Disconnected" after setup?
**Solution:**
1. Check browser console for detailed error messages
2. Click "🔍 Diagnostics" button to see what's failing
3. Review the error message and follow the recommendation
4. Restart the dev server (`npm run dev`)

---

## Next Steps

1. ✅ Follow the solution steps above (1-5)
2. ✅ Verify all tables show connected in Database Health
3. ✅ Test the app features
4. ✅ Enable RLS policies for production
5. ✅ Commit the DATABASE_SETUP.md file to version control

---

## Reference

- Supabase Project: https://app.supabase.com/project/cexhfbreotogzlhisfxd
- Database URL: https://cexhfbreotogzlhisfxd.supabase.co
- Documentation: See BUFFER_SLA_CONFIGURATION.md and other docs in repo

**Need help?** Check the DATABASE_SETUP.md file or review the diagnostics output in the Database Health page.
