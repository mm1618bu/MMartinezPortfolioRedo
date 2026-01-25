# Database Setup Instructions

Your app is trying to fetch departments, but the `departments` table doesn't exist in Supabase yet.

## Quick Fix (5 minutes)

1. Go to your Supabase project: https://app.supabase.com/project/cexhfbreotogzlhisfxd

2. Click **SQL Editor** in the left sidebar

3. Click **New Query** and paste the SQL from `COMPLETE_DATABASE_SCHEMA.sql`

4. Click **Run** to execute

5. Hard refresh your browser (Ctrl+Shift+R)

That's it! All tables will be created and your app will load departments.

## What's Included

The SQL script creates:
- ✅ organizations
- ✅ sites (already exists)
- ✅ departments
- ✅ shift_templates
- ✅ labor_standards
- ✅ employees
- ✅ demands

All with proper indexes, constraints, and timestamps.
