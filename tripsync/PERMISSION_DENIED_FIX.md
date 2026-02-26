# 🔧 FIXING "Permission Denied" Error - Step by Step

## What Happened?
Your database tables exist, but the security settings (RLS policies) are blocking you from saving trips.

## ✅ Quick 3-Step Fix

### STEP 1: Open Supabase
1. Go to: **https://app.supabase.com**
2. Click on your project (the one with your TripSync data)
3. On the left sidebar, find and click: **"SQL Editor"** 
4. Click the green **"New Query"** button at the top

### STEP 2: Run This SQL Code
Copy this entire block and paste it into the SQL editor:

```sql
-- Drop and recreate policies with proper authentication
DROP POLICY IF EXISTS "Users can view trips they participate in" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Trip creators can update trips" ON trips;
DROP POLICY IF EXISTS "Trip creators can delete trips" ON trips;
DROP POLICY IF EXISTS "Users can view trip participants" ON trip_participants;
DROP POLICY IF EXISTS "Trip creators can add participants" ON trip_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON trip_participants;
DROP POLICY IF EXISTS "Trip creators can remove participants" ON trip_participants;

CREATE POLICY "Users can view trips they participate in"
    ON trips FOR SELECT TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM trip_participants WHERE trip_id = trips.id));

CREATE POLICY "Users can create trips"
    ON trips FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Trip creators can update trips"
    ON trips FOR UPDATE TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Trip creators can delete trips"
    ON trips FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view trip participants"
    ON trip_participants FOR SELECT TO authenticated
    USING (trip_id IN (SELECT trip_id FROM trip_participants WHERE user_id = auth.uid()));

CREATE POLICY "Trip creators can add participants"
    ON trip_participants FOR INSERT TO authenticated
    WITH CHECK (trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can update their participation"
    ON trip_participants FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Trip creators can remove participants"
    ON trip_participants FOR DELETE TO authenticated
    USING (trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid()));
```

### STEP 3: Click RUN
1. After pasting the code, click the **"RUN"** button (bottom right corner)
2. You should see: "Success. No rows returned" 
3. ✅ Done! Close the SQL Editor

## Now Test Your App
1. Go back to your TripSync app
2. Make sure you're logged in
3. Try creating a trip
4. It should work now! 🎉

---

## 🆘 Still Not Working?

### Check These Things:

**1. Are you logged in?**
   - Look at the top right - do you see your email and a "Logout" button?
   - If not, click login and sign in

**2. Did the SQL run successfully?**
   - You should see "Success" message in Supabase
   - If you see an error, the tables might not exist yet
   - **Solution**: Run the full `supabase_schema.sql` file first

**3. Check browser console:**
   - Press F12 on your keyboard
   - Click "Console" tab
   - Look for red error messages
   - Share those messages for more specific help

**4. Wrong Supabase project?**
   - Make sure your `.env` file has the URL for the correct project
   - URL should match the project you're in on Supabase

---

## 🎯 Why Did This Happen?

Supabase Row Level Security (RLS) protects your data. The policies we just created tell Supabase:
- ✅ **Allow** logged-in users to create trips
- ✅ **Allow** users to see trips they're part of
- ✅ **Allow** trip creators to manage their trips
- ❌ **Block** everyone else

Without the `TO authenticated` part, the policies were too strict and blocked everyone.

---

## 📚 Related Files
- Full schema: `supabase_schema.sql`
- Quick fix: `fix_rls_policies.sql` 
- This guide: `PERMISSION_DENIED_FIX.md`
