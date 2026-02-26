# TripSync Feature Implementation: Balances & Settlement System (FR-5)

## Overview
This document describes the implementation of the balance tracking and settlement system for TripSync, which includes three main features:

- **FR-5.1**: Balances View - Shows each member's net balance in real time
- **FR-5.2**: Settlement Plan View - Computes minimum transactions to settle all debts
- **FR-5.3**: Payment Recording & Settlement - Track and mark payments as settled

---

## Database Schema Changes

### New `payments` Table
A new table has been added to track settlement transactions:

```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    settled_at TIMESTAMP WITH TIME ZONE,
    
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'settled'
    notes TEXT
);
```

### Indexes
Performance indexes have been added:
- `idx_payments_trip_id` - Query payments by trip
- `idx_payments_from_user` - Find payments from a user
- `idx_payments_to_user` - Find payments to a user

### Row-Level Security (RLS)
All payment operations are protected by RLS policies:
- Trip participants can view payments
- Trip participants can create/update/delete payments
- Users must be trip members to interact with payment records

---

## Service Layer: `balanceService.js`

New service file: `/src/services/balanceService.js`

### Functions

#### `getTripBalances(tripId, participants, expenses)`
**Purpose**: Calculates the net balance for each trip member (FR-5.1)

**Algorithm**:
1. Sums total amount paid by each user from the `expenses` table
2. Sums total amount owed by each user from the `expense_splits` table
3. Calculates balance = paid - owed
   - Positive balance = person is owed money
   - Negative balance = person owes money
   - Zero = settled

**Returns**:
```javascript
{
  userId: {
    userId: string,
    name: string,
    email: string,
    paidCents: number,
    owedCents: number,
    balanceCents: number,    // owed - paid
    paidFormatted: string,   // "$X.XX"
    owedFormatted: string,   // "$X.XX"
    balanceFormatted: string // "$X.XX"
  }
}
```

#### `getSettlementPlan(tripId, participants, expenses)`
**Purpose**: Generates a minimum-transaction settlement plan (FR-5.2)

**Algorithm**: Greedy matching algorithm
1. Gets current balances for all participants
2. Separates participants into debtors (negative balance) and creditors (positive balance)
3. Matches debtors to creditors, minimizing transaction count
4. Process: For each debtor, pays creditors in order until fully settled

**Example**:
```
Input participants' balances:
- Alice: owes $30 (balance: -30)
- Bob: gets back $40 (balance: +40)
- Carol: gets back $20 (balance: +20)

Output settlements:
- Alice pays $30 to Bob
- Alice pays $0 to Carol
- [Carol still needs $20] → Second debtor would cover it
```

**Returns**:
```javascript
[
  {
    fromId: uuid,
    from: string,        // debtor name
    toId: uuid,
    to: string,          // creditor name
    amount_cents: number,
    amountFormatted: string
  }
]
```

#### `recordPayment(tripId, fromUserId, toUserId, amountCents, notes)`
**Purpose**: Records a payment transaction (FR-5.3)

Creates a new payment record with:
- Status: 'pending' (not yet marked as settled)
- Created timestamp (auto)
- Amount in cents for precision

**Returns**: Newly created payment object

#### `settlePayment(paymentId)`
**Purpose**: Marks a payment as settled, recording the date

Updates the payment record:
- Status: 'settled'
- `settled_at`: Current timestamp

**Returns**: Updated payment object

#### `getTripPayments(tripId)`
**Purpose**: Retrieves all payment records for a trip

Returns array of all payments (pending and settled) with formatted amounts.

#### `getUnpaidSettlements(tripId)`
**Purpose**: Retrieves only pending (unpaid) settlements

Used internally for alerts and status checking.

---

## Components

### 1. `BalancesView.jsx` (FR-5.1)
**Path**: `/src/components/BalancesView.jsx`

**Features**:
- Real-time balance display for all trip members
- Shows paid, owed, and net balance columns
- Color-coded balances (green for owed back, red for owes)
- Auto-refreshes when expenses/splits change via Supabase subscriptions
- Manual refresh button
- Explains balance interpretation

**Data Flow**:
1. Fetches participants from props
2. Calls `getExpenses()` to get trip expenses
3. Calls `getTripBalances()` to calculate balances
4. Subscribes to `expenses` and `expense_splits` tables for real-time updates
5. Renders responsive grid showing each person's balance

**UI Elements**:
- Name and email column
- Paid column (green text)
- Owed column (red text)
- Balance column with color-coded badge
- Refresh button
- Help text explaining interpretation

---

### 2. `SettlementPlanView.jsx` (FR-5.2)
**Path**: `/src/components/SettlementPlanView.jsx`

**Features**:
- Displays minimum-transaction settlement plan
- Shows number of transactions needed
- Highlights transactions involving current user
- "Record Payment" button for user's transactions
- Auto-refreshes on expense changes
- Algorithm explanation

**Data Flow**:
1. Fetches expenses via `getExpenses()`
2. Calls `getSettlementPlan()` to compute minimum transactions
3. Highlights relevant transactions (user as payer)
4. On "Record Payment" click, calls `recordPayment()`
5. Refreshes settlement plan after recording

**UI Elements**:
- Transaction count summary
- List of settlements with from/to/amount
- Color highlighting for user's transactions
- "Record" button for user's payment obligations
- Algorithm explanation

**User Interaction**:
```
Settlement: "Alice → Bob → $50"
If current user is Alice:
  - Button appears: "Record" 
  - Click → creates pending payment
  - Settlement list refreshes
```

---

### 3. `PaymentHistory.jsx` (FR-5.3)
**Path**: `/src/components/PaymentHistory.jsx`

**Features**:
- Tabbed interface: All | Pending | Settled
- Shows all recorded payments with dates
- Marks user's involved payments
- No direct "settle" button in this view (users mark as settled via settlement plan)
- Real-time updates on payment status changes
- Clear visual distinction between pending and settled

**Data Flow**:
1. Fetches all payments via `getTripPayments()`
2. Filters by status based on active tab
3. Shows payment flow (from date, settled date)
4. Highlights user's involved transactions
5. Subscribes to `payments` table for live updates

**Tabs**:
- **All**: All payments recorded for the trip
- **Pending**: Payments awaiting settlement confirmation
- **Settled**: Completed payments with settlement dates

**UI Elements**:
- Tab navigation
- Payment grid: From | Location | To | Amount | Date | Status
- Status badges (⏳ Pending / ✅ Settled)
- Color highlighting for user involvement
- Tab counts

**Status Badges**:
- Pending (yellow): Money transferred but not yet confirmed settled
- Settled (green): Payment confirmed settled with date

---

## Integration into Trip View

The three components are integrated into `TripChoices.jsx` with a tabbed interface:

```jsx
{/* New Finances Section */}
<div style={{ padding: '20px', background: '#f9f9f9' }}>
  {/* Tabs: 💰 Balances | 📋 Settlement Plan | 📜 Payment History */}
  
  {financesTab === 'balances' && <BalancesView ... />}
  {financesTab === 'settlements' && <SettlementPlanView ... />}
  {financesTab === 'payments' && <PaymentHistory ... />}
</div>
```

---

## User Workflow

### Example: Trip with 3 people, shared expenses

1. **Expense Tracking**:
   - Alice pays $90 for 3 people at restaurant
   - Bob pays $60 for 3 people at hotel
   - Carol pays $30 for her accommodation

   Total: Alice paid $90, Bob paid $60, Carol paid $30

2. **Balances View (FR-5.1)**:
   - Each person owes: $180 / 3 = $60
   - Alice: Paid $90, owes $60 → Balance: +$30 (gets back $30)
   - Bob: Paid $60, owes $60 → Balance: $0 (even)
   - Carol: Paid $30, owes $60 → Balance: -$30 (owes $30)

3. **Settlement Plan (FR-5.2)**:
   - "Carol pays $30 to Alice"
   - Result: All balances settle to zero with 1 transaction

4. **Record Payment (FR-5.3)**:
   - Carol clicks "Record" on the settlement
   - System creates a pending payment: Carol → Alice, $30
   - Carol can note: "Transferred via Venmo"

5. **Payment History (FR-5.3)**:
   - Shows payment record created
   - Once Carol confirms Alice received it:
     - Either Alice marks it settled in history
     - Or it's automatically marked upon confirmation
   - Shows settled date

---

## Real-Time Updates

All views subscribe to Supabase table changes:

```javascript
// BalancesView subscribes to:
- expenses table (changes to what people paid)
- expense_splits table (changes to what people owe)

// SettlementPlanView subscribes to:
- expenses table (settlement plan changes with new expenses)

// PaymentHistory subscribes to:
- payments table (new/updated payments)
```

Any change automatically triggers view refresh without requiring page reload.

---

## Data Precision

All monetary amounts are stored and calculated in **cents** to avoid floating-point errors:
- $12.99 = 1299 cents
- Division rounding handled with floor/ceil and distribution algorithm
- Display formatted as "$X.XX" using `formatCents()` helper

---

## Algorithm Details

### Greedy Settlement Algorithm
The settlement plan uses a greedy algorithm to minimize transaction count:

```
1. Calculate balance = paid - owed for each participant
2. Separate into debtors (negative) and creditors (positive)
3. Loop while debtors and creditors remain:
   a. Match debtor with creditor
   b. Transaction = min(debtor amount, creditor amount)
   c. Reduce both by transaction amount
   d. Remove if fully settled
```

**Time Complexity**: O(n²) worst case, typically O(n log n)
**Space Complexity**: O(n)

This ensures each person pays/receives the minimum total payments needed.

---

## Security Considerations

1. **Row-Level Security**: All payment operations protected by RLS
2. **Data Validation**: 
   - Amounts must be positive
   - Users must be trip participants
   - Ids validated server-side
3. **Audit Trail**: 
   - `created_at` timestamps automatic
   - `settled_at` timestamp recorded when settled
   - No deletion of payment records (soft delete via status only recommended)

---

## Future Enhancements

Potential improvements for future releases:

1. **Payment Methods**:
   - Link to Venmo/PayPal/etc
   - Auto-splitting via payment platform APIs

2. **Notifications**:
   - Alert when you receive a settlement
   - Reminder when payment due

3. **Partial Payments**:
   - Support multiple payments for one settlement
   - Track partial settlement status

4. **Export**:
   - Export balances/settlements as PDF
   - Email summary to members

5. **Payment Disputes**:
   - Mark payments as disputed
   - Discussion threads for clarification

---

## Testing Recommendations

### Unit Tests
- `getTripBalances()` with various expense scenarios
- `getSettlementPlan()` correctness verification
- Edge cases: 2 people, unequal splits, rounding

### Integration Tests
- Full user flow: add expense → check balance → record payment
- Real-time updates via Supabase
- Concurrent payment recording

### UI Tests
- Tab switching in payment views
- Manual refresh button functionality
- Update intervals and data consistency

---

## Files Modified/Created

### New Files:
1. `/src/services/balanceService.js` - Balance calculations and payment management
2. `/src/components/BalancesView.jsx` - FR-5.1 implementation
3. `/src/components/SettlementPlanView.jsx` - FR-5.2 implementation  
4. `/src/components/PaymentHistory.jsx` - FR-5.3 implementation

### Modified Files:
1. `/supabase_schema.sql` - Added payments table, indexes, RLS policies
2. `/src/components/TripChoices.jsx` - Integrated new components with tabs

### No Changes Required:
- Business logic in `tripService.js` uses existing expense functions
- Real-time mechanisms already use established Supabase patterns
- Security via RLS (no app-level authorization changes needed)

---

## Deployment Checklist

Before deploying to production:

1. ✅ Run `npm run lint` - verify no style issues
2. ✅ Run `npm run test` - verify unit tests pass
3. ⚠️ **IMPORTANT**: Run the SQL schema migration:
   ```sql
   -- Copy all commands from supabase_schema.sql
   -- Particularly the new payments table and policies
   ```
4. ✅ Test locally with multiple users and transactions
5. ✅ Verify Supabase RLS policies are correctly enforced
6. ✅ Check real-time subscriptions work
7. ✅ Backup production database before applying schema

---

## Support & Questions

For issues or clarifications:
1. Check the algorithm details section above
2. Review the user workflow example
3. Examine component source code comments
4. Test with the example scenario provided

