# Database Setup Verification Guide

## Overview

Your Staffing Flow application is configured to use **Supabase**, a PostgreSQL-based backend-as-a-service platform. This guide helps you verify that your database is properly hooked up and functioning correctly.

## Database Configuration

### Environment Variables

Your database connection is configured in `.env`:

```dotenv
VITE_SUPABASE_URL=https://cexhfbreotogzlhisfxd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_c1q20_xzXDK2Nwk9v2HwAA_X2wppVn-
```

### Client Initialization

The Supabase client is initialized in `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
});
```

## Database Health Check

### Using the UI

The easiest way to verify your database connection is through the **Database Health Check** tool:

1. **Navigate to Database Health** in the nav bar (🗄️ Database Health)
2. Click **Refresh** to run the health check
3. Review the results:
   - ✅ **Green indicators** = Everything is working
   - ⚠️ **Yellow/Orange** = Issues detected
   - ❌ **Red indicators** = Connection failed

### What the Health Check Tests

The health check utility (`src/lib/database-health-check.ts`) performs:

**1. Connection Test**
- Attempts to connect to Supabase
- Verifies authentication credentials
- Tests basic query execution

**2. Schema Verification**
- Confirms all required tables exist:
  - `organizations`
  - `sites`
  - `departments`
  - `shift_templates`
  - `employees`
  - `labor_standards`
  - `demands`

**3. Row Count Statistics**
- Shows how many records exist in each table
- Helps verify that data is being persisted

## Manual Connection Testing

### Option 1: Using the API

Test the database connection programmatically:

```typescript
import { runFullHealthCheck } from './lib/database-health-check';

const result = await runFullHealthCheck();
console.log(result);
```

Expected output:
```json
{
  "connection": {
    "connected": true,
    "tables": [],
    "errors": [],
    "timestamp": "2026-01-24T22:00:00.000Z"
  },
  "schema": {
    "valid": true,
    "tables": [
      { "name": "organizations", "exists": true },
      { "name": "sites", "exists": true },
      // ... more tables
    ]
  },
  "stats": {
    "rowCounts": {
      "organizations": 1,
      "sites": 5,
      // ... more tables
    },
    "errors": []
  },
  "healthy": true
}
```

### Option 2: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **staffing-flow**
3. Navigate to **SQL Editor** to run queries
4. Execute test queries:

```sql
-- Test connection
SELECT NOW();

-- Check table structure
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check row counts
SELECT 
  'sites' as table_name, COUNT(*) as row_count FROM sites
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'demands', COUNT(*) FROM demands;
```

### Option 3: Using JavaScript Console

In your browser's developer console:

```javascript
// Import the Supabase client
import { supabase } from '/src/lib/supabase.ts';

// Test basic query
const { data, error } = await supabase
  .from('sites')
  .select('id, name')
  .limit(5);

console.log('Data:', data);
console.log('Error:', error);
```

## Common Issues and Solutions

### Issue 1: "Missing Supabase environment variables"

**Cause:** `.env` file is missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

**Solution:**
1. Check `.env` file exists in project root
2. Verify both variables are set
3. Get keys from [Supabase Dashboard](https://app.supabase.com):
   - Settings → API → Project URL
   - Settings → API → Anon Public Key
4. Restart dev server: `npm run dev`

### Issue 2: "Authentication failed"

**Cause:** Invalid or expired credentials

**Solution:**
1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Verify your project is active
3. Get fresh API keys from Settings → API
4. Update `.env` with new keys
5. Clear browser localStorage: `localStorage.clear()`

### Issue 3: "Table does not exist"

**Cause:** Database schema hasn't been created or migrations haven't run

**Solution:**
1. Check Supabase Dashboard → SQL Editor
2. Verify tables exist with this query:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. If missing, you need to run migrations:
   - Check `database/migrations/` folder
   - Execute SQL files in Supabase SQL Editor

### Issue 4: "CORS error" or "Network request failed"

**Cause:** CORS configuration issue or network problem

**Solution:**
1. Verify `.env` has correct `VITE_SUPABASE_URL`
2. Check your Supabase project is accessible
3. In Supabase Dashboard, verify CORS settings:
   - Settings → API → CORS
   - Ensure `http://localhost:5173` is allowed
4. Try clearing cache: `npm run build && npm run preview`

### Issue 5: "Row counts are all zero"

**Cause:** Database is connected but empty (no data)

**Solution:** This is normal for a fresh installation. Add data through:
1. **UI Components:** Use Sites, Departments, etc. management pages
2. **SQL Editor:** Insert test data in Supabase Dashboard
3. **API:** POST requests to create records

## Database Schema

### Core Tables

#### organizations
```
- id: uuid (primary key)
- name: text
- description: text
- created_at: timestamp
- updated_at: timestamp
```

#### sites
```
- id: uuid
- organization_id: uuid
- name: text
- description: text
- capacity: integer
- created_at: timestamp
- updated_at: timestamp
```

#### departments
```
- id: uuid
- site_id: uuid
- name: text
- description: text
- created_at: timestamp
- updated_at: timestamp
```

#### employees
```
- id: uuid
- organization_id: uuid
- name: text
- email: text
- department_id: uuid
- skills: jsonb
- created_at: timestamp
- updated_at: timestamp
```

#### shift_templates
```
- id: uuid
- organization_id: uuid
- name: text
- start_time: time
- end_time: time
- recurrence_pattern: text
- created_at: timestamp
- updated_at: timestamp
```

#### labor_standards
```
- id: uuid
- organization_id: uuid
- name: text
- metric: text
- target: numeric
- period: text
- created_at: timestamp
- updated_at: timestamp
```

#### demands
```
- id: uuid
- organization_id: uuid
- date: date
- shift_type: text
- required_employees: integer
- priority: text
- notes: text
- created_at: timestamp
- updated_at: timestamp
```

## Health Check Results Interpretation

### ✅ All Green (Healthy)
Everything is working correctly. Your database is:
- Connected and accessible
- Has all required tables
- Contains data (optional)
- Ready for production

### ⚠️ Yellow/Orange (Warning)
Non-critical issues detected:
- Some tables might be missing (but not critical ones)
- Some data might not be present yet
- Schema might be incomplete

Action: Check the specific errors shown in the health check results.

### ❌ Red (Unhealthy)
Critical issues detected:
- Cannot connect to database
- Missing Supabase credentials
- Multiple tables missing
- Schema is incomplete

Action: Follow the "Common Issues" section above to resolve.

## Performance Tips

1. **Connection Pooling:** Supabase handles this automatically
2. **Query Optimization:** Use specific columns in SELECT
   ```typescript
   // Good
   await supabase.from('sites').select('id, name');
   
   // Avoid
   await supabase.from('sites').select('*');
   ```

3. **Pagination:** For large datasets
   ```typescript
   await supabase
     .from('demands')
     .select()
     .range(0, 9); // First 10 rows
   ```

4. **Indexing:** Check Supabase Dashboard → SQL Editor for index information

## Next Steps

1. ✅ Run the Database Health Check (🗄️ Database Health nav item)
2. ✅ Verify all tables show as "exists"
3. ✅ Add test data through UI or SQL Editor
4. ✅ Verify row counts increase after adding data
5. ✅ Test basic operations (Create, Read, Update, Delete)

## Getting Help

1. **Supabase Docs:** https://supabase.com/docs
2. **Status Page:** https://status.supabase.com
3. **Project Settings:** https://app.supabase.com (your project)
4. **Check browser console:** Press F12 → Console → Look for errors

## Related Files

- `src/lib/supabase.ts` - Client configuration
- `src/lib/database-health-check.ts` - Health check utility
- `src/components/admin/DatabaseHealthCheck.tsx` - UI component
- `.env` - Environment configuration
- `database/migrations/` - Schema migration files

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
