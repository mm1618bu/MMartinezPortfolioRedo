# 🚀 Quick Fix Guide - Database Setup

**⏱️ Time Required:** 5 minutes  
**📌 Difficulty:** Easy

## The Problem

Your database shows "Disconnected" because:
1. Missing `sites` table and 3 other core tables
2. Some tables have broken RLS (Row Level Security) policies

## The Solution (5 Steps)

### 1️⃣ Open Supabase Dashboard

Go to: https://app.supabase.com/  
Select your project: **cexhfbreotogzlhisfxd**

### 2️⃣ Disable RLS Temporarily

Click **Authentication** → **Policies**

Disable RLS for these tables:
- organizations
- departments  
- employees
- demands

Or per-table method:
1. Click table in SQL sidebar
2. Toggle "RLS" OFF at the top

### 3️⃣ Create Tables

Click **SQL Editor** (left sidebar)  
Paste this SQL:

```sql
-- Enable UUID
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_demands_org_date ON demands(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_demands_department ON demands(department_id);
CREATE INDEX IF NOT EXISTS idx_demands_date_range ON demands(date);
CREATE INDEX IF NOT EXISTS idx_demands_priority ON demands(priority) WHERE priority IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_demands_org_dept_date ON demands(organization_id, department_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);

-- Auto-update triggers
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

Click **Run** button

### 4️⃣ Test in App

Go to app: http://localhost:5175/  
Click **Database Health** in nav bar  
Click **Refresh** button  
All tables should show ✓ Connected

### 5️⃣ Done! ✅

Everything should work now. You can:
- Create sites
- Add departments
- Add employees
- Create demand forecasts

## For Production Later

Re-enable RLS policies:
1. Go to Supabase → Authentication → Policies
2. For each table, enable RLS and create policies:
   ```sql
   -- Only access org's own data
   SELECT: organization_id = auth.user.organization_id
   ```

## Troubleshooting

**Still seeing errors?**

Click **Database Health** → **🔍 Diagnostics** button to see exact error messages and follow the recommendations.

**Need more help?**

See these files:
- DIAGNOSTICS_REPORT.md - Detailed report
- DATABASE_SETUP.md - Complete setup guide
- HEALTH_CHECKS.md - Health check documentation
