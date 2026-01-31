# PTO Request Workflow - Complete Documentation

## 🎯 Overview

The **PTO (Paid Time Off) Request Workflow** enables employees to request time off and managers to review and approve/deny these requests. The system tracks PTO balances, checks for conflicts, and ensures minimum staffing requirements are maintained.

---

## 🔄 Workflow Overview

```
┌─────────────┐
│   Employee  │
│   Submits   │
│ PTO Request │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  System Checks  │
│  • Balance      │
│  • Conflicts    │
│  • Staffing     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Status:        │
│  PENDING        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Manager       │
│   Reviews       │
│   Request       │
└──────┬──────────┘
       │
       ├──────────┐
       │          │
   APPROVE     DENY
       │          │
       ▼          ▼
┌──────────┐ ┌──────────┐
│ Status:  │ │ Status:  │
│ APPROVED │ │ DENIED   │
└──────────┘ └──────────┘
```

---

## 📊 PTO Types

| Type | Description | Use Case |
|------|-------------|----------|
| **vacation** | Planned time off for rest/travel | Holidays, vacations |
| **sick** | Time off due to illness | Personal illness, medical appointments |
| **personal** | Personal days for any reason | Personal matters, errands |
| **bereavement** | Time off for family death | Funeral attendance |
| **jury_duty** | Required court service | Jury duty, court appearances |
| **military** | Military service leave | Active duty, training |
| **other** | Other approved reasons | Special circumstances |

---

## 📋 PTO Statuses

| Status | Description | Who Can Update |
|--------|-------------|----------------|
| **pending** | Awaiting manager review | Employee (edit), Manager (review) |
| **approved** | Manager approved the request | Employee (cancel), Manager |
| **denied** | Manager denied the request | Manager only |
| **cancelled** | Employee cancelled the request | Employee only |

---

## 🎨 Day Types

| Type | Description | Calculation |
|------|-------------|-------------|
| **full_day** | Full workday (8 hours) | Business days × 8 hours |
| **half_day** | Half workday (4 hours) | Business days × 4 hours |
| **hours** | Specific number of hours | Custom hours specified |

---

## 🚀 API Endpoints

### 1. Request PTO

**POST** `/api/labor-actions/pto/request`

Submit a new PTO request.

#### Request Body

```json
{
  "organization_id": "org-uuid",
  "employee_id": "emp-uuid",
  "department_id": "dept-uuid",
  "pto_type": "vacation",
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "day_type": "full_day",
  "reason": "Family vacation to Hawaii",
  "notes": "Will be unavailable for contact"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "pto-req-uuid",
    "organization_id": "org-uuid",
    "employee_id": "emp-uuid",
    "department_id": "dept-uuid",
    "pto_type": "vacation",
    "start_date": "2026-03-01",
    "end_date": "2026-03-05",
    "day_type": "full_day",
    "hours_requested": 40,
    "total_days": 5,
    "status": "pending",
    "reason": "Family vacation to Hawaii",
    "requested_at": "2026-02-01T10:00:00Z",
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

#### Response (400 Bad Request) - Insufficient Balance

```json
{
  "success": false,
  "error": "Insufficient PTO balance. Available: 24 hours, Requested: 40 hours"
}
```

---

### 2. Update PTO Request

**PUT** `/api/labor-actions/pto/:id`

Update a pending PTO request (only employee can update).

#### Request Body

```json
{
  "start_date": "2026-03-08",
  "end_date": "2026-03-10",
  "reason": "Changed dates due to flight availability"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "pto-req-uuid",
    "start_date": "2026-03-08",
    "end_date": "2026-03-10",
    "hours_requested": 24,
    "total_days": 3,
    "status": "pending",
    "updated_at": "2026-02-02T14:30:00Z"
  }
}
```

#### Error Cases

- **400**: Cannot update non-pending request
- **404**: Request not found

---

### 3. Review PTO Request (Approve/Deny)

**POST** `/api/labor-actions/pto/:id/review`

Manager approves or denies a PTO request.

#### Request Body (Approve)

```json
{
  "action": "approve",
  "reviewed_by": "manager-uuid",
  "approval_notes": "Approved. Coverage arranged with temp staff."
}
```

#### Request Body (Deny)

```json
{
  "action": "deny",
  "reviewed_by": "manager-uuid",
  "approval_notes": "Denied. Peak season - insufficient coverage available."
}
```

#### Response (200 OK) - Approved

```json
{
  "success": true,
  "data": {
    "id": "pto-req-uuid",
    "status": "approved",
    "reviewed_by": "manager-uuid",
    "reviewed_at": "2026-02-02T15:00:00Z",
    "approval_notes": "Approved. Coverage arranged with temp staff."
  }
}
```

#### Response (200 OK) - Denied

```json
{
  "success": true,
  "data": {
    "id": "pto-req-uuid",
    "status": "denied",
    "reviewed_by": "manager-uuid",
    "reviewed_at": "2026-02-02T15:00:00Z",
    "approval_notes": "Denied. Peak season - insufficient coverage available."
  }
}
```

---

### 4. Cancel PTO Request

**POST** `/api/labor-actions/pto/:id/cancel`

Employee cancels their own PTO request (works for pending or approved requests).

#### Request Body

```json
{
  "employee_id": "emp-uuid",
  "reason": "Plans changed - no longer need time off"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "pto-req-uuid",
    "status": "cancelled",
    "updated_at": "2026-02-05T09:00:00Z"
  }
}
```

---

### 5. List PTO Requests

**GET** `/api/labor-actions/pto`

List PTO requests with optional filters.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | string | Yes | Organization ID |
| `employee_id` | string | No | Filter by employee |
| `department_id` | string | No | Filter by department |
| `status` | string | No | Filter by status (pending/approved/denied/cancelled) |
| `pto_type` | string | No | Filter by PTO type |
| `start_date` | string | No | Filter by start date (>=) |
| `end_date` | string | No | Filter by end date (<=) |
| `limit` | number | No | Page size (default: 50) |
| `offset` | number | No | Page offset (default: 0) |

#### Example Request

```bash
GET /api/labor-actions/pto?organization_id=org-1&employee_id=emp-1&status=pending
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "pto-req-1",
      "employee_id": "emp-1",
      "pto_type": "vacation",
      "start_date": "2026-03-01",
      "end_date": "2026-03-05",
      "total_days": 5,
      "status": "pending",
      "requested_at": "2026-02-01T10:00:00Z"
    },
    {
      "id": "pto-req-2",
      "employee_id": "emp-1",
      "pto_type": "sick",
      "start_date": "2026-02-15",
      "end_date": "2026-02-15",
      "total_days": 1,
      "status": "approved",
      "requested_at": "2026-02-14T08:00:00Z",
      "reviewed_at": "2026-02-14T09:30:00Z"
    }
  ]
}
```

---

### 6. Check PTO Availability

**POST** `/api/labor-actions/pto/check-availability`

Pre-flight check before submitting PTO request. Checks balance, conflicts, and staffing.

#### Request Body

```json
{
  "organization_id": "org-uuid",
  "employee_id": "emp-uuid",
  "department_id": "dept-uuid",
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "day_type": "full_day"
}
```

#### Response (200 OK) - Available

```json
{
  "success": true,
  "data": {
    "available": true,
    "conflicts": [],
    "current_balance": 80,
    "required_balance": 40,
    "overlapping_requests": [],
    "staffing_level": {
      "scheduled_staff": 20,
      "requested_off": 2,
      "minimum_required": 12,
      "remaining_staff": 17
    },
    "recommendation": "PTO request can be submitted"
  }
}
```

#### Response (200 OK) - Has Conflicts

```json
{
  "success": true,
  "data": {
    "available": false,
    "conflicts": [
      {
        "conflict_type": "overlapping_request",
        "severity": "blocking",
        "message": "You have 1 overlapping PTO request(s) for this period",
        "details": [
          {
            "id": "pto-req-existing",
            "start_date": "2026-03-03",
            "end_date": "2026-03-07",
            "status": "approved"
          }
        ]
      }
    ],
    "current_balance": 80,
    "required_balance": 40,
    "recommendation": "PTO request cannot be approved due to conflicts"
  }
}
```

#### Response (200 OK) - Staffing Warning

```json
{
  "success": true,
  "data": {
    "available": true,
    "conflicts": [
      {
        "conflict_type": "minimum_staffing",
        "severity": "warning",
        "message": "Approving would leave 11 staff, below minimum of 12"
      }
    ],
    "recommendation": "PTO request may be approved with caution"
  }
}
```

---

### 7. Get PTO Balance

**GET** `/api/labor-actions/pto/balance`

Get PTO balance for an employee.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | string | Yes | Organization ID |
| `employee_id` | string | Yes | Employee ID |
| `year` | number | No | Year (default: current year) |
| `pto_type` | string | No | Specific PTO type or all types |

#### Example Request

```bash
GET /api/labor-actions/pto/balance?organization_id=org-1&employee_id=emp-1&year=2026
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "balance-1",
      "employee_id": "emp-1",
      "pto_type": "vacation",
      "balance_hours": 120,
      "used_hours": 32,
      "pending_hours": 8,
      "accrual_rate": 10,
      "year": 2026
    },
    {
      "id": "balance-2",
      "employee_id": "emp-1",
      "pto_type": "sick",
      "balance_hours": 40,
      "used_hours": 8,
      "pending_hours": 0,
      "accrual_rate": 3.33,
      "year": 2026
    }
  ]
}
```

**Balance Calculation:**
- **Available** = `balance_hours - used_hours - pending_hours`
- **Remaining** = `120 - 32 - 8 = 80 hours`

---

### 8. Get PTO Analytics

**GET** `/api/labor-actions/pto/analytics`

Get PTO analytics for organization or department.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | string | Yes | Organization ID |
| `department_id` | string | No | Filter by department |
| `start_date` | string | Yes | Analysis start date |
| `end_date` | string | Yes | Analysis end date |
| `group_by` | string | No | Group by: day/week/month/pto_type |

#### Example Request

```bash
GET /api/labor-actions/pto/analytics?organization_id=org-1&start_date=2026-01-01&end_date=2026-12-31
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "total_requests": 245,
    "approved_requests": 198,
    "denied_requests": 32,
    "pending_requests": 10,
    "cancelled_requests": 5,
    "total_days_requested": 1840,
    "total_days_approved": 1488,
    "approval_rate": 80.82,
    "average_response_time_hours": 18.5
  }
}
```

---

## 📋 Common Workflows

### Workflow 1: Employee Submits Vacation Request

```bash
# Step 1: Check availability (optional but recommended)
curl -X POST /api/labor-actions/pto/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "employee_id": "emp-1",
    "department_id": "dept-1",
    "start_date": "2026-07-01",
    "end_date": "2026-07-10"
  }'

# Response: available = true, required_balance = 80 hours

# Step 2: Submit request
curl -X POST /api/labor-actions/pto/request \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "employee_id": "emp-1",
    "department_id": "dept-1",
    "pto_type": "vacation",
    "start_date": "2026-07-01",
    "end_date": "2026-07-10",
    "reason": "Summer vacation"
  }'

# Success: Request created with status "pending"
```

### Workflow 2: Manager Reviews Pending Requests

```bash
# Step 1: List pending requests for department
curl -X GET "/api/labor-actions/pto?organization_id=org-1&department_id=dept-1&status=pending"

# Response: List of pending requests

# Step 2: Approve request
curl -X POST /api/labor-actions/pto/pto-req-1/review \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "reviewed_by": "manager-1",
    "approval_notes": "Approved"
  }'

# Success: Request status changed to "approved"
```

### Workflow 3: Employee Cancels Approved PTO

```bash
# Cancel the request
curl -X POST /api/labor-actions/pto/pto-req-1/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "emp-1",
    "reason": "Plans changed"
  }'

# Success: Request status changed to "cancelled", hours returned to balance
```

---

## 🗄️ Database Schema

### pto_requests Table

```sql
CREATE TABLE pto_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES users(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  pto_type TEXT NOT NULL CHECK (pto_type IN ('vacation', 'sick', 'personal', 'bereavement', 'jury_duty', 'military', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'full_day' CHECK (day_type IN ('full_day', 'half_day', 'hours')),
  hours_requested NUMERIC(5,2) NOT NULL,
  total_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  reason TEXT,
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT hours_for_hours_type CHECK (day_type != 'hours' OR hours_requested IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_pto_requests_org ON pto_requests(organization_id);
CREATE INDEX idx_pto_requests_employee ON pto_requests(employee_id);
CREATE INDEX idx_pto_requests_dept ON pto_requests(department_id);
CREATE INDEX idx_pto_requests_status ON pto_requests(status);
CREATE INDEX idx_pto_requests_dates ON pto_requests(start_date, end_date);
CREATE INDEX idx_pto_requests_requested_at ON pto_requests(requested_at DESC);
```

### pto_balances Table

```sql
CREATE TABLE pto_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES users(id),
  pto_type TEXT NOT NULL CHECK (pto_type IN ('vacation', 'sick', 'personal', 'bereavement', 'jury_duty', 'military', 'other')),
  balance_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  used_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  pending_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  accrual_rate NUMERIC(5,2),  -- Hours accrued per pay period
  max_balance NUMERIC(6,2),   -- Maximum accrual cap
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, employee_id, pto_type, year),
  CONSTRAINT non_negative_hours CHECK (balance_hours >= 0 AND used_hours >= 0 AND pending_hours >= 0)
);

-- Indexes
CREATE INDEX idx_pto_balances_org_emp ON pto_balances(organization_id, employee_id);
CREATE INDEX idx_pto_balances_year ON pto_balances(year);
```

---

## 🔍 Conflict Detection

The system automatically detects several types of conflicts:

### 1. Overlapping Requests

**Detected:** Employee already has a PTO request for overlapping dates

**Severity:** Blocking (prevents submission)

**Example:**
- Existing request: March 3-7
- New request: March 1-5
- **Conflict:** Dates overlap (March 3-5)

### 2. Insufficient Balance

**Detected:** Employee doesn't have enough PTO hours

**Severity:** Blocking (prevents submission)

**Calculation:**
```typescript
available_hours = balance_hours - used_hours - pending_hours
if (requested_hours > available_hours) {
  // CONFLICT: Insufficient balance
}
```

### 3. Minimum Staffing

**Detected:** Approving would violate minimum staffing requirements

**Severity:** Warning (allows with caution)

**Check:**
- Gets scheduled staff for date range
- Counts existing approved/pending PTO
- Compares remaining staff to safety floor minimum
- Warns if below threshold (but doesn't block)

---

## 📊 Balance Management

### Balance Components

```
┌───────────────────────────────────────┐
│         PTO Balance (120 hours)       │
├───────────────────────────────────────┤
│  Used Hours: 32                       │
│  ├─ Approved & taken: 24              │
│  └─ Approved & upcoming: 8            │
├───────────────────────────────────────┤
│  Pending Hours: 8                     │
│  └─ Awaiting approval: 8              │
├───────────────────────────────────────┤
│  Available: 80 hours                  │
│  (120 - 32 - 8 = 80)                  │
└───────────────────────────────────────┘
```

### Balance State Transitions

```
Request Submitted (Pending)
  → pending_hours += hours_requested

Request Approved
  → pending_hours -= hours_requested
  → used_hours += hours_requested

Request Denied
  → pending_hours -= hours_requested

Request Cancelled (was Pending)
  → pending_hours -= hours_requested

Request Cancelled (was Approved)
  → used_hours -= hours_requested
```

---

## 🎯 Best Practices

### For Employees

✅ **DO:**
- Check availability before submitting requests
- Submit requests well in advance (2+ weeks recommended)
- Provide clear reasons for PTO requests
- Monitor your balance regularly
- Cancel approved PTO as early as possible if plans change

❌ **DON'T:**
- Submit overlapping requests
- Request more PTO than your balance allows
- Wait until the last minute to request time off
- Submit requests during blackout periods

### For Managers

✅ **DO:**
- Review requests promptly (within 48-72 hours)
- Check staffing levels before approving
- Provide clear feedback in approval notes
- Consider fairness and consistency
- Document denial reasons clearly

❌ **DON'T:**
- Ignore pending requests
- Approve without checking coverage
- Deny without clear reasons
- Show favoritism in approvals

### For Administrators

✅ **DO:**
- Set up appropriate PTO balances for all employees
- Configure safety floor minimums
- Monitor approval rates and response times
- Review analytics regularly
- Ensure accrual rates are configured correctly

❌ **DON'T:**
- Allow negative balances
- Ignore staffing warnings
- Set unrealistic minimums
- Forget to update yearly balances

---

## 🚨 Error Handling

| Error Code | Meaning | Common Causes | Solution |
|------------|---------|---------------|----------|
| 400 | Bad Request | Missing required fields, invalid dates | Check request format |
| 401 | Unauthorized | Not authenticated | Log in |
| 403 | Forbidden | Not authorized for action | Check permissions |
| 404 | Not Found | PTO request doesn't exist | Verify request ID |
| 409 | Conflict | Overlapping requests | Cancel/modify existing request |
| 500 | Server Error | System error | Contact support |

---

## 📈 Analytics & Reporting

### Key Metrics

1. **Approval Rate** - % of requests approved
2. **Response Time** - Average hours from request to review
3. **Utilization Rate** - % of allocated PTO used
4. **Denial Reasons** - Top reasons for denials
5. **Peak Request Periods** - When most requests occur

### Sample Queries

```sql
-- Approval rate by department
SELECT 
  d.name AS department,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
  ROUND(100.0 * SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 2) AS approval_rate
FROM pto_requests pr
JOIN departments d ON pr.department_id = d.id
WHERE pr.requested_at >= NOW() - INTERVAL '90 days'
GROUP BY d.name
ORDER BY approval_rate DESC;

-- Average response time by manager
SELECT 
  u.name AS manager,
  COUNT(*) AS requests_reviewed,
  ROUND(AVG(EXTRACT(EPOCH FROM (reviewed_at - requested_at)) / 3600), 2) AS avg_response_hours
FROM pto_requests pr
JOIN users u ON pr.reviewed_by = u.id
WHERE pr.status IN ('approved', 'denied')
  AND pr.requested_at >= NOW() - INTERVAL '90 days'
GROUP BY u.name
ORDER BY avg_response_hours;

-- PTO usage by type
SELECT 
  pto_type,
  COUNT(*) AS requests,
  SUM(total_days) AS total_days,
  ROUND(AVG(total_days), 2) AS avg_days_per_request
FROM pto_requests
WHERE status = 'approved'
  AND start_date >= DATE_TRUNC('year', NOW())
GROUP BY pto_type
ORDER BY total_days DESC;
```

---

## 🔐 Security & Permissions

### Role-Based Access

| Role | Permissions |
|------|-------------|
| **Employee** | Submit own requests, update pending requests, cancel own requests, view own balance |
| **Manager** | All employee permissions + review requests for their department, view department analytics |
| **Admin** | All permissions + manage balances, configure accruals, view org-wide analytics |

### Authorization Checks

```typescript
// Employee can only submit for themselves
if (request.employee_id !== currentUser.id && !currentUser.isManager) {
  return 403; // Forbidden
}

// Only manager can review requests
if (action === 'review' && !currentUser.isManager) {
  return 403; // Forbidden
}

// Employee can only cancel their own requests
if (action === 'cancel' && request.employee_id !== currentUser.id) {
  return 403; // Forbidden
}
```

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] **Blackout Dates** - Block PTO requests for certain dates
- [ ] **Auto-Approval Rules** - Automatically approve requests meeting criteria
- [ ] **Carryover Rules** - Roll over unused PTO to next year
- [ ] **Accrual Automation** - Automatically accrue PTO each pay period
- [ ] **Team Calendar** - Visualize team PTO schedules
- [ ] **Approval Chains** - Multi-level approval workflows
- [ ] **PTO Payout** - Cash out unused PTO
- [ ] **Integration with Payroll** - Sync with payroll systems

---

## 📚 Related Documentation

- [VET API Documentation](./VET_API_DOCUMENTATION.md)
- [VTO API Documentation](./VTO_API_DOCUMENTATION.md)
- [Safety Floor Guide](./VTO_SAFETY_FLOOR_GUIDE.md)

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 31, 2026
