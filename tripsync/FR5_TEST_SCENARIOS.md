# FR-5 Test Scenarios & Verification

Comprehensive test scenarios to validate the Balance & Settlement System implementation.

---

## Test Environment Setup

### Prerequisites
1. TripSync deployed locally or on staging environment
2. Test database with sample data
3. Multiple test user accounts created
4. Trip created with 2-3 participants

### Test Data Creation
```
Trip: "Weekend Getaway"
Participants:
  - Alice (creator)
  - Bob
  - Carol

Initial State:
  - No expenses
  - No expenses_splits
  - No payments
```

---

## Scenario 1: Simple Two-Person Split

### Setup
```
Participants: Alice, Bob
Trip Budget Split: $100 each = $200 total
```

### Actions
1. **Alice adds accommodation expense**:
   - Amount: $200
   - Payer: Alice
   - Split: Alice $100, Bob $100

2. **Check Balances (FR-5.1)**:
   - Click "💰 Balances" tab
   - Verify display:
     ```
     Alice:
       Paid: $200.00
       Owes: $100.00
       Balance: +$100.00  ← GREEN (gets money back)
     
     Bob:
       Paid: $0.00
       Owes: $100.00
       Balance: -$100.00  ← RED (owes money)
     ```

3. **Check Settlement Plan (FR-5.2)**:
   - Click "📋 Settlement Plan" tab
   - Should show:
     ```
     Bob → Alice: $100.00
     (1 transaction needed)
     ```
   - If logged in as Bob: "✓ Record" button visible
   - If logged in as Alice: No record button (recipient)

4. **Record Payment (FR-5.3)**:
   - If Bob: Click "✓ Record"
   - System creates payment: Bob → Alice, $100, status: pending
   - Verify no error messages

5. **Check Payment History**:
   - Click "📜 Payment History" tab
   - "All" tab shows: Bob → Alice, $100.00, Status: ⏳ Pending
   - "Pending" tab shows same record
   - "Settled" tab shows empty
   - Created date is today

### Verification Checklist
- [ ] Balances calculated correctly
- [ ] Settlement plan shows 1 transaction
- [ ] Payment recorded in database
- [ ] Payment appears in history with correct status
- [ ] Real-time updates work (refresh button updates)
- [ ] No console errors

---

## Scenario 2: Multi-Person Complex Split

### Setup
```
Participants: Alice, Bob, Carol
Expenses:
  1. Restaurant: $150 (Alice pays, split 3 ways)
  2. Hotel: $90 (Bob pays, split 3 ways)
  3. Activity: $60 (Carol pays, split 3 ways)

Total: $300 = $100 per person
```

### Expected Calculations
```
Each person should owe/pay:
  Per person share = $300 / 3 = $100

Alice:
  Paid: $150
  Owes: $100
  Balance: +$50 (gets back)

Bob:
  Paid: $90
  Owes: $100
  Balance: -$10 (owes)

Carol:
  Paid: $60
  Owes: $100
  Balance: -$40 (owes)
```

### Test Steps

1. **Add Three Expenses**:
   - Expense 1: Amount $150, Payer Alice, Split: [Alice $50, Bob $50, Carol $50]
   - Expense 2: Amount $90, Payer Bob, Split: [Alice $30, Bob $30, Carol $30]
   - Expense 3: Amount $60, Payer Carol, Split: [Alice $20, Bob $20, Carol $20]

2. **Verify Balances**:
   ```
   Click "💰 Balances":
     Alice: $150 paid, $100 owed → +$50 (Green)
     Bob: $90 paid, $100 owed → -$10 (Red)
     Carol: $60 paid, $100 owed → -$40 (Red)
   ```

3. **Verify Settlement Plan**:
   ```
   Click "📋 Settlement Plan":
     Bob → Alice: $10
     Carol → Alice: $40
     (2 transactions total)
   
   Minimum check: 3 people with unequal debts
     should need 2 transactions, not 3+
   ```

4. **Record Payments**:
   - If logged as Bob: Record $10 to Alice
   - If logged as Carol: Record $40 to Alice
   - Check history after each record

5. **Verify History**:
   ```
   "All Payments" tab:
     Bob → Alice, $10, ⏳ Pending
     Carol → Alice, $40, ⏳ Pending
   ```

### Verification Checklist
- [ ] Balances sum to zero (total owed = total paid)
- [ ] Settlement plan has minimum transactions
- [ ] Payment records created correctly
- [ ] Display formatting correct ($X.XX)
- [ ] User highlighting works in settlement plan
- [ ] Real-time updates on new expenses

---

## Scenario 3: Unequal Participant Splits

### Setup
```
Participants: Alice, Bob
Trip Plan: Alice stays 2 nights, Bob stays 1 night
Hotel Cost: $300 (should split by nights)

Split Option: Percentage-based
  Alice: 66.67% = $200
  Bob: 33.33% = $100
```

### Test Steps

1. **Add Expense with Custom Split**:
   - Description: "Hotel 2 nights"
   - Amount: $300
   - Payer: Alice
   - Split: Alice $200, Bob $100

2. **Check Balances**:
   ```
   Alice: Paid $300, Owes $200 → +$100
   Bob: Paid $0, Owes $100 → -$100
   ```

3. **Check Settlement**:
   ```
   Bob → Alice: $100
   ```

### Verification Checklist
- [ ] Unequal splits handled correctly
- [ ] Balance calculations precise
- [ ] Rounding handled correctly (cents level)
- [ ] Settlement amount exact

---

## Scenario 4: Real-Time Updates

### Setup
Make two browser windows side-by-side:
- Window 1: Trip view showing "💰 Balances" tab
- Window 2: Supabase console with payments table query

### Test Steps

1. **In Window 1**: View balances
   - Note the current balance display

2. **In Window 2**: 
   - Go to Supabase → SQL Editor
   - Run: `SELECT * FROM trips WHERE id = '[trip-id]';`
   - Verify trip exists

3. **Back in Window 1**:
   - Click "🔄 Refresh" button on BalancesView
   - Balances should remain same (no new expenses added)

4. **Record a Payment**:
   - In Settlement Plan view
   - Click "✓ Record" on a settlement
   - Watch payment history tab

5. **Verify Real-Time Update**:
   - Payment should appear immediately in history
   - No page refresh needed
   - "All" and "Pending" tabs both show it

### Verification Checklist
- [ ] Manual refresh works
- [ ] Auto-updates on new expenses
- [ ] Auto-updates on new payments
- [ ] Auto-updates on payment status changes
- [ ] No duplicate displays
- [ ] No memory leaks (subscriptions cleanup)

---

## Scenario 5: Edge Cases & Rounding

### Edge Case #1: Equal Split with Cents
```
3 people, $100.00 total
Expected split: $33.33, $33.33, $33.34 (distribution of remainder)

Verify: No floating-point errors
```

### Edge Case #2: Large Monetary Amounts
```
Trip cost: $10,000.00
Participants: 5 people
Expected per person: $2,000.00

Verify: Handles large numbers correctly
```

### Edge Case #3: Single Person Expense
```
Trip expense paid by Alice, only Alice in split
Expected: Alice Paid $X, Owes $X → Balance: $0
```

### Edge Case #4: Multiple Settlements to Same Person
```
3 debtors owing different amounts to 1 creditor

Verify: All settlements computed correctly
```

### Test Steps
1. Create expenses with these edge cases
2. Verify balances in "💰 Balances" tab
3. Check settlement plan for correctness
4. Record any payments
5. Verify no rounding errors in payment amounts

### Verification Checklist
- [ ] Cents calculations correct (no float errors)
- [ ] Large amounts handled
- [ ] Single-person splits work
- [ ] Multiple debtors correct
- [ ] Rounding consistent across views

---

## Scenario 6: User Permissions

### Setup
Create 3 test accounts with roles:
- alice@test.com (Creator)
- bob@test.com (Participant)
- carol@test.com (Participant)

### Test Steps

1. **As Alice (Creator)**:
   - Can view all balances ✅
   - Can view settlement plan ✅
   - Can add expenses ✅
   - Can remove participants ✅
   - Can record payments ✅
   - Can settle payments ✅

2. **As Bob (Participant)**:
   - Can view balances ✅
   - Can view settlement plan ✅
   - Can add expenses ✅
   - Can record payments (if user is debtor) ✅
   - Can view payment history ✅

3. **As Carol (Participant)**:
   - Same as Bob

4. **Not Logged In**:
   - Cannot see trip ❌
   - Cannot view balances ❌
   - Cannot access payment data ❌
   - Redirected to login ❌

### Verification Checklist
- [ ] Correct users can access data
- [ ] Non-participants blocked
- [ ] RLS policies enforced
- [ ] No data leakage
- [ ] Appropriate error messages

---

## Scenario 7: Error Handling

### Test Invalid Inputs

1. **Invalid Amount**:
   - Try to record $0 payment
   - Try to record negative payment
   - Verify error message

2. **Invalid User**:
   - Try to record payment for non-participant
   - Verify error and RLS blocking

3. **Network Errors**:
   - Disable internet mid-action
   - Try to record payment
   - Verify graceful error handling

4. **Database Errors**:
   - (Requires Supabase admin)
   - Temporarily disable payments table
   - Try to access history
   - Verify error message shown

### Verification Checklist
- [ ] Invalid amounts rejected
- [ ] Invalid users blocked
- [ ] Network failures handled gracefully
- [ ] No undefined errors
- [ ] User-friendly error messages

---

## Scenario 8: Data Consistency

### Test Database Consistency

1. **After Recording Payment**:
   - Check Supabase → payments table
   - Verify: `from_user_id`, `to_user_id`, `amount_cents`, `status`, `created_at`
   - Verify: All values correct and not null (except `settled_at`)

2. **After Settlement**:
   - Update payment status to 'settled'
   - Verify `settled_at` timestamp recorded
   - Verify timestamp is reasonable (not future, not too old)

3. **Data Relationships**:
   - All `from_user_id` exist in `auth.users`
   - All `to_user_id` exist in `auth.users`
   - All `trip_id` exist in `trips`
   - All users are in `trip_participants`

### Verification Checklist
- [ ] All required fields populated
- [ ] No null values where not allowed
- [ ] All foreign key relationships valid
- [ ] Timestamps reasonable
- [ ] No orphaned records

---

## Scenario 9: Performance Test

### Test with Large Dataset

1. **Create Trip with Many Expenses**:
   - 50 expenses
   - 5 participants
   - Various split configurations
   
2. **Performance Checks**:
   - Balances view loads in <2 seconds
   - Settlement plan calculates in <1 second
   - History scrolls smoothly
   - No memory leaks with many renders

3. **Query Performance**:
   - Check Supabase logs for slow queries
   - Verify indexes being used
   - No N+1 queries

### Verification Checklist
- [ ] Fast load times
- [ ] Smooth UI interactions
- [ ] No memory leaks
- [ ] Indexes used correctly

---

## Scenario 10: Data Export & Audit Trail

### Test Audit Capabilities

1. **Check Created/Settled Dates**:
   - Payment created_at matches when recorded
   - Payment settled_at matches last status change
   - Timestamps in correct format (ISO 8601)

2. **Track Payment Changes**:
   - View progression: pending → settled
   - Check timestamps for accuracy

3. **Generate Report**:
   - List all payments for trip
   - Verify data complete and accurate

### Verification Checklist
- [ ] Timestamps accurate
- [ ] Data exportable
- [ ] Audit trail complete
- [ ] No data loss

---

## Post-Testing Summary

### Sign-Off Checklist
- [ ] All 10 scenarios tested
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] User permissions enforced
- [ ] Data consistency verified
- [ ] Real-time updates working
- [ ] Error handling adequate
- [ ] Edge cases handled
- [ ] Accessibility features working
- [ ] Documentation matches implementation

### Issues Found During Testing
```
Issue #: 
Description: 
Severity: [Critical | High | Medium | Low]
Steps to Reproduce:
Expected Behavior:
Actual Behavior:
Screenshots:
```

### Sign-Off
```
Testing Completed: ___________
Tested By: ___________
Date: ___________
Status: [PASS | FAIL with issues]
```

---

## Continuous Testing

After deployment, periodically verify:

1. **Weekly**: Sample payment recording works
2. **Monthly**: Complex split calculations accurate
3. **Quarterly**: Performance metrics still acceptable
4. **On Updates**: Re-run full test suite

---

## Test Data Reset

To reset test environment:

```sql
-- Delete test payments
DELETE FROM payments WHERE trip_id = 'test-trip-id';

-- Delete test expenses
DELETE FROM expenses WHERE trip_id = 'test-trip-id';

-- Delete test splits
DELETE FROM expense_splits WHERE trip_id = 'test-trip-id';

-- Delete test trip & participants (if needed)
DELETE FROM trips WHERE id = 'test-trip-id';
```

