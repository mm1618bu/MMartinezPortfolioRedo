# QUICK FIX: "Failed to save trip" Error
# QUICK FIX: Permission Denied Error

## The Issue
You're getting "Permission denied. Please check your Supabase Row Level Security policies."

This means the database tables exist, but the security policies are blocking access.

## IMMEDIATE FIX (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the Fix
1. Open the file: `fix_rls_policies.sql` in your project folder
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"RUN"** (bottom right)
5. Wait for "Success. No rows returned"

### Step 3: Test Again
1. Go back to your app
2. Try creating a trip again
3. Should work now! ✅

---

## If First Time Setup

If you haven't run the database schema at all yet:

### Run Full Schema First:
1. Open `supabase_schema.sql` (the full file)
2. Copy everything
3. Paste in SQL Editor
4. Click RUN
5. Then try creating a trip

---

# Original "Failed to save trip" Troubleshooting

## Most Likely Cause
The database tables haven't been created yet in Supabase.

## Solution (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project: `uoawujfvnuhekrahitdj`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"** button

### Step 2: Run the Schema
1. Open the file: `supabase_schema.sql` in your project
2. Copy ALL the contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click **"RUN"** button (bottom right)
5. Wait for "Success" message

### Step 3: Verify Tables Created
1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - ✅ trips
   - ✅ trip_participants
   - ✅ accommodations
   - ✅ accommodation_votes
   - ✅ expenses

### Step 4: Restart Your App
```bash
# In terminal
npm start
```

### Step 5: Test Again
1. Login to your app
2. Create a trip
3. Should work now! ✅

---

## Other Possible Issues

### If you still get errors after running SQL:

**Check Browser Console:**
```
Press F12 → Console tab
Look for red error messages
```

**Common Error Messages:**

1. **"relation does not exist"**
   - Means: Tables not created
   - Fix: Run the SQL schema (Step 2 above)

2. **"permission denied" or "policy"**
   - Means: Row Level Security blocking access
   - Fix: Make sure you ran the ENTIRE SQL schema (includes RLS policies)

3. **"Invalid API key"**
   - Means: Wrong Supabase credentials
   - Fix: Check your `.env` file has correct `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`

4. **"network error" or "fetch failed"**
   - Means: Can't connect to Supabase
   - Fix: Check internet connection and Supabase URL

---

## Still Not Working?

### Check Console Logs:
The app now logs detailed info. Open browser console (F12) and look for:
- "Creating trip with data:" - Shows what's being sent
- "Trip creation error:" - Shows the actual error
- "Trip created successfully:" - Confirms it worked

### Share the Error:
Copy the full error message from the console and share it for more specific help.

---

## Quick Test if Database is Ready

Run this in Supabase SQL Editor:
```sql
SELECT * FROM trips LIMIT 1;
```

- **If it works**: Tables exist! ✅
- **If error**: Run the schema first

---

## Need the SQL file?
It's in your project: `/workspaces/MMartinezPortfolioRedo/tripsync/supabase_schema.sql`
