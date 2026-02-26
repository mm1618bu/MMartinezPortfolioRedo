# FR-5 Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Balance & Settlement System (FR-5) to your TripSync deployment.

---

## Prerequisites
- Supabase project set up
- TripSync database configured
- Access to Supabase SQL Editor
- React dev environment with npm

---

## Step 1: Deploy Database Schema

### 1.1 Open Supabase SQL Editor
1. Log in to [Supabase Console](https://supabase.com)
2. Select your TripSync project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### 1.2 Run Schema Updates

Copy and paste these commands in sequence:

#### A. Create `payments` Table
```sql
-- Create the payments table for tracking settlement transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    settled_at TIMESTAMP WITH TIME ZONE,

    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    
    -- Payment status: 'pending', 'settled'
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Notes or reference (optional)
    notes TEXT
);
```

**Click:** Execute

#### B. Create Indexes
```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user ON payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user ON payments(to_user_id);
```

**Click:** Execute

#### C. Enable Row-Level Security
```sql
-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

**Click:** Execute

#### D. Create RLS Policies

Run each policy creation individually:

```sql
-- Allow trip participants to view payments
CREATE POLICY "Trip participants can view payments"
    ON payments FOR SELECT
    USING (
        trip_id IN (
            SELECT trip_id FROM trip_participants WHERE user_id = auth.uid()
        )
    );
```

```sql
-- Allow trip participants to create payments
CREATE POLICY "Trip participants can create payments"
    ON payments FOR INSERT
    WITH CHECK (
        trip_id IN (
            SELECT trip_id FROM trip_participants WHERE user_id = auth.uid()
        )
    );
```

```sql
-- Allow trip participants to update payments
CREATE POLICY "Trip participants can update payments"
    ON payments FOR UPDATE
    USING (
        trip_id IN (
            SELECT trip_id FROM trip_participants WHERE user_id = auth.uid()
        )
    );
```

```sql
-- Allow trip participants to delete payments
CREATE POLICY "Trip participants can delete payments"
    ON payments FOR DELETE
    USING (
        trip_id IN (
            SELECT trip_id FROM trip_participants WHERE user_id = auth.uid()
        )
    );
```

**Click:** Execute for each

### 1.3 Verify Schema
In Supabase Console, check **Table Editor**:
- ✅ New `payments` table should appear
- ✅ Columns: id, created_at, settled_at, trip_id, from_user_id, to_user_id, amount_cents, status, notes
- ✅ RLS should be enabled (green toggle)

---

## Step 2: Deploy Code Changes

### 2.1 Pull Latest Code
```bash
cd /workspaces/MMartinezPortfolioRedo/tripsync
git pull origin main
```

### 2.2 Install Dependencies (if needed)
```bash
npm install
```

### 2.3 Verify No Lint Errors
```bash
npm run lint
```

If errors appear, fix before proceeding.

### 2.4 Build Application
```bash
npm run build
```

Ensure build completes without errors.

---

## Step 3: Test Locally

### 3.1 Start Development Server
```bash
npm start
```

### 3.2 Test Features

**Test FR-5.1 (Balances View)**:
1. Create/join a trip
2. Add 2-3 participants
3. Add expenses (different payer each time)
4. Navigate to trip → Click "💰 Balances" tab
5. Verify balances display correctly
6. Click refresh button → Should update

**Test FR-5.2 (Settlement Plan)**:
1. With same trip data
2. Click "📋 Settlement Plan" tab
3. Verify minimum transactions shown
4. Check if you're involved, "✓ Record" button appears
5. Click "✓ Record" on a settlement
6. Verify payment created (warning: goes to database)

**Test FR-5.3 (Payment History)**:
1. Click "📜 Payment History" tab
2. Verify recorded payment appears under "⏳ Pending"
3. View shows: From | Amount | To | Date | Status
4. Status shows yellow "⏳ Pending" badge

### 3.3 Test Real-Time Updates
1. In Chrome DevTools, open Database:
   - Supabase Console → SQL Editor → payments table
2. Add expense in trip view
3. Watch "💰 Balances" tab auto-refresh
4. Add payment in "📋 Settlement Plan"
5. Watch "📜 Payment History" auto-update

---

## Step 4: Production Deployment

### 4.1 Database Backup (CRITICAL)
```bash
# In Supabase Console, go to Settings → Backups
# Click "Create Backup" to save current state
#  before making schema changes
```

### 4.2 Deploy to Production
```bash
# Via your CI/CD pipeline or:
npm run build
# Deploy build/ directory to production hosting
```

### 4.3 Smoke Tests in Production
1. Log in to production TripSync
2. Navigate to existing trip
3. Verify FR-5 tabs visible and functional
4. Create new test expense
5. Verify balances calculate
6. Record test payment
7. Verify appears in history

---

## Step 5: Verify Deployment

### 5.1 Check Database
In Supabase Console:
- [ ] `payments` table exists
- [ ] Has data (sample payments)
- [ ] Indexes created (check Table Editor → Indexes)
- [ ] RLS policies enabled (green toggle)

### 5.2 Check Application
- [ ] No console errors in browser DevTools
- [ ] All three tabs visible in trip view
- [ ] Balances display correctly
- [ ] Settlement plan calculates
- [ ] Can record payments without errors

### 5.3 Monitor First 24 Hours
- [ ] No error reports from users
- [ ] Payment records created successfully
- [ ] Balance calculations accurate
- [ ] Real-time updates working

---

## Troubleshooting

### Issue: "Permission denied" on payments table
**Cause**: RLS policies not created correctly
**Fix**: 
1. Go to Supabase Console → Authentication → Policies
2. Verify all 5 policies exist for `payments` table
3. Re-run policy creation SQL if missing

### Issue: Balances not calculating
**Cause**: Expenses/splits not properly linked
**Fix**:
1. Verify expenses and expense_splits tables have data
2. Check `getTripBalances` returns data in browser console
3. Verify participant IDs match across tables

### Issue: Real-time updates not working
**Cause**: Supabase subscriptions not connecting
**Fix**:
1. Check internet connection
2. Verify Supabase project is active
3. Check browser console for subscription errors
4. Restart development server: `npm start`

### Issue: "Unknown file extension" error
**Cause**: JSX not properly imported
**Fix**:
1. Verify file paths in imports
2. Use `.jsx` extension for component files
3. Clear build cache: `rm -rf node_modules/.cache`

### Issue: Payment records not saving
**Cause**: Network error or RLS blocking
**Fix**:
1. Check browser developer tools → Network tab
2. Verify user is trip participant
3. Check Supabase logs for RLS errors
4. Verify `from_user_id` and `to_user_id` are valid UUIDs

---

## File Checklist

Verify all new files are in place:

```
tripsync/
├── src/
│   ├── components/
│   │   ├── BalancesView.jsx                ✅ (234 lines)
│   │   ├── SettlementPlanView.jsx         ✅ (267 lines)
│   │   ├── PaymentHistory.jsx             ✅ (313 lines)
│   │   └── TripChoices.jsx                ✅ (Modified)
│   └── services/
│       └── balanceService.js              ✅ (280 lines)
├── supabase_schema.sql                     ✅ (Updated)
├── FEATURES_FR5_IMPLEMENTATION.md          ✅ (Documentation)
└── FR5_IMPLEMENTATION_SUMMARY.md           ✅ (Summary)
```

---

## Rollback Plan

If issues occur, rollback is simple since original settlement logic remains:

### To Rollback Code:
```bash
git revert <commit-hash>
npm run build
# Redeploy
```

### To Rollback Database:
```sql
-- In Supabase SQL Editor:
DROP TABLE IF EXISTS payments CASCADE;

-- RLS policies auto-delete with table
-- No data loss to existing tables
```

**Note**: Original settlement display in expenses section still works if FR-5 components are disabled.

---

## Support

For issues or questions:

1. Check **FEATURES_FR5_IMPLEMENTATION.md** for architecture details
2. Check **FR5_IMPLEMENTATION_SUMMARY.md** for user workflow
3. Review **Troubleshooting** section above
4. Check Supabase logs: Console → Logs → Database
5. Check application logs: Browser DevTools → Console

---

## Success Criteria

After deployment, verify:

- [x] All 3 components load without errors
- [x] Balances calculate correctly for test data
- [x] Settlement plan shows minimum transactions
- [x] Can record payments (appear in database)
- [x] Payment history displays recorded payments
- [x] Real-time updates work
- [x] No RLS errors in Supabase logs
- [x] No console errors in browser
- [x] Users can interact with tabs
- [x] Data persists after page reload

---

## Post-Deployment Tasks

1. **Monitor**: Check Supabase dashboard for errors/slow queries
2. **Communicate**: Notify users of new FR-5 features
3. **Feedback**: Gather user feedback on balance/settlement features
4. **Analytics**: Track feature usage (which tab most used, etc.)
5. **Optimize**: Add caching or database query optimizations if needed

---

## Version Log

| Version | Date | Deployed | Status |
|---------|------|----------|--------|
| 1.0 | 2026-02-23 | Staging | ✅ Ready |
| | | Production | ⏳ Pending |

---

**Deployment is ready to proceed!**

