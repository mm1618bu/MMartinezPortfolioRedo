# PTO Workflow - Quick Reference

## 🎯 Quick Overview

Employee requests time off → Manager reviews → Approve/Deny → Balance updated

---

## ⚡ API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/pto/request` | POST | Submit PTO request |
| `/pto/:id` | PUT | Update pending request |
| `/pto/:id/review` | POST | Approve/deny request |
| `/pto/:id/cancel` | POST | Cancel request |
| `/pto` | GET | List requests |
| `/pto/check-availability` | POST | Check conflicts |
| `/pto/balance` | GET | Get balance |
| `/pto/analytics` | GET | Get analytics |

---

## 📋 PTO Types

- `vacation` - Planned time off
- `sick` - Illness/medical
- `personal` - Personal days
- `bereavement` - Family death
- `jury_duty` - Court service
- `military` - Military service
- `other` - Other reasons

---

## 🚦 Status Flow

```
PENDING → APPROVED → (active)
        → DENIED
        → CANCELLED
```

---

## 🔥 Quick Start

### 1. Submit Request

```bash
POST /api/labor-actions/pto/request
```

```json
{
  "organization_id": "org-1",
  "employee_id": "emp-1",
  "department_id": "dept-1",
  "pto_type": "vacation",
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "reason": "Family vacation"
}
```

**Response:** `201 Created` (status: pending)

---

### 2. Check Availability First (Recommended)

```bash
POST /api/labor-actions/pto/check-availability
```

```json
{
  "organization_id": "org-1",
  "employee_id": "emp-1",
  "department_id": "dept-1",
  "start_date": "2026-03-01",
  "end_date": "2026-03-05"
}
```

**Response:** Conflicts, balance, staffing level

---

### 3. Approve Request (Manager)

```bash
POST /api/labor-actions/pto/{id}/review
```

```json
{
  "action": "approve",
  "reviewed_by": "manager-1",
  "approval_notes": "Approved"
}
```

**Response:** `200 OK` (status: approved)

---

### 4. Deny Request (Manager)

```json
{
  "action": "deny",
  "reviewed_by": "manager-1",
  "approval_notes": "Peak season - insufficient coverage"
}
```

**Response:** `200 OK` (status: denied)

---

### 5. Cancel Request (Employee)

```bash
POST /api/labor-actions/pto/{id}/cancel
```

```json
{
  "employee_id": "emp-1",
  "reason": "Plans changed"
}
```

**Response:** `200 OK` (status: cancelled)

---

## 📊 Balance Calculation

```
Available Hours = Balance - Used - Pending

Example:
Balance: 120 hours
Used: 32 hours
Pending: 8 hours
Available: 80 hours (120 - 32 - 8)
```

---

## 🔍 Conflict Types

| Type | Severity | Blocks Request |
|------|----------|----------------|
| **Overlapping Request** | Blocking | ✅ Yes |
| **Insufficient Balance** | Blocking | ✅ Yes |
| **Minimum Staffing** | Warning | ❌ No (warns only) |
| **Blackout Date** | Blocking | ✅ Yes |

---

## 📅 Day Type Calculation

| Type | Hours Calculation |
|------|-------------------|
| **full_day** | Business days × 8 |
| **half_day** | Business days × 4 |
| **hours** | Custom value |

**Business Days:** Excludes weekends (Saturday/Sunday)

Example:
- March 1-5 (Mon-Fri) = 5 business days
- full_day = 5 × 8 = 40 hours
- half_day = 5 × 4 = 20 hours

---

## 🎨 Request States

### Pending
- Employee can **edit** or **cancel**
- Manager can **approve** or **deny**
- Balance: hours in **pending**

### Approved
- Employee can **cancel**
- Balance: hours in **used**

### Denied
- No further actions
- Balance: hours returned

### Cancelled
- No further actions
- Balance: hours returned

---

## 🔐 Permissions

| Action | Employee | Manager | Admin |
|--------|----------|---------|-------|
| Submit request | ✅ Own | ✅ | ✅ |
| Update pending | ✅ Own | ✅ | ✅ |
| Review request | ❌ | ✅ Department | ✅ |
| Cancel request | ✅ Own | ❌ | ✅ |
| View balance | ✅ Own | ✅ Team | ✅ All |
| View analytics | ❌ | ✅ Department | ✅ Org |

---

## 📊 Response Examples

### Success (Request Created)
```json
{
  "success": true,
  "data": {
    "id": "pto-123",
    "status": "pending",
    "hours_requested": 40,
    "total_days": 5
  }
}
```

### Error (Insufficient Balance)
```json
{
  "success": false,
  "error": "Insufficient PTO balance. Available: 24 hours, Requested: 40 hours"
}
```

### Error (Overlapping Request)
```json
{
  "success": false,
  "error": "You have 1 overlapping PTO request(s) for this period"
}
```

### Availability Check (Has Conflicts)
```json
{
  "available": false,
  "conflicts": [
    {
      "conflict_type": "overlapping_request",
      "severity": "blocking",
      "message": "You have 1 overlapping PTO request(s)"
    }
  ],
  "recommendation": "Cannot be approved due to conflicts"
}
```

---

## 💡 Common Use Cases

### 1. Employee Vacation Request
```bash
# Check availability
POST /pto/check-availability {...}

# Submit if available
POST /pto/request {...}

# Manager approves
POST /pto/{id}/review {"action": "approve", ...}
```

### 2. Sick Day (Same Day)
```bash
# Submit sick day request
POST /pto/request {
  "pto_type": "sick",
  "start_date": "2026-02-01",
  "end_date": "2026-02-01",
  "day_type": "full_day"
}

# Manager approves immediately
POST /pto/{id}/review {"action": "approve", ...}
```

### 3. Half Day Request
```bash
POST /pto/request {
  "pto_type": "personal",
  "start_date": "2026-02-15",
  "end_date": "2026-02-15",
  "day_type": "half_day",  # 4 hours
  "reason": "Dentist appointment"
}
```

### 4. Hours-Based Request
```bash
POST /pto/request {
  "pto_type": "personal",
  "start_date": "2026-02-15",
  "end_date": "2026-02-15",
  "day_type": "hours",
  "hours_requested": 2,  # Just 2 hours
  "reason": "Doctor appointment"
}
```

### 5. Cancel Approved PTO
```bash
# Plans changed, need to cancel
POST /pto/{id}/cancel {
  "employee_id": "emp-1",
  "reason": "Trip cancelled"
}

# Balance restored automatically
```

---

## 🚨 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 400 - Insufficient balance | Not enough PTO hours | Wait for accrual or reduce days |
| 400 - Cannot update | Status not pending | Cannot update approved/denied requests |
| 403 - Not authorized | Wrong employee/manager | Ensure correct user |
| 409 - Overlapping request | Dates overlap existing | Cancel other request or change dates |

---

## 📈 Analytics Queries

### Get My Balance
```bash
GET /pto/balance?organization_id=org-1&employee_id=emp-1
```

### List My Requests
```bash
GET /pto?organization_id=org-1&employee_id=emp-1
```

### List Pending Requests (Manager)
```bash
GET /pto?organization_id=org-1&department_id=dept-1&status=pending
```

### Department Analytics
```bash
GET /pto/analytics?organization_id=org-1&department_id=dept-1&start_date=2026-01-01&end_date=2026-12-31
```

---

## 🔗 Related Docs

- **Full Documentation:** [PTO_WORKFLOW_DOCUMENTATION.md](./PTO_WORKFLOW_DOCUMENTATION.md)
- **VET API:** [VET_API_DOCUMENTATION.md](./VET_API_DOCUMENTATION.md)
- **VTO API:** [VTO_API_DOCUMENTATION.md](./VTO_API_DOCUMENTATION.md)

---

**Version**: 1.0.0  
**Last Updated**: January 31, 2026
