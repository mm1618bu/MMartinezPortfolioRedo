# UPT (Unpaid Time) Tracking Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Exception Types](#exception-types)
4. [UPT Balance Management](#upt-balance-management)
5. [Policy Configuration](#policy-configuration)
6. [Automated Detection](#automated-detection)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Integration Guide](#integration-guide)
10. [Best Practices](#best-practices)

---

## Overview

The UPT (Unpaid Time) Tracking system is an automated attendance exception detection and management system that:

- **Detects attendance violations** automatically from timeclock data
- **Tracks UPT balance** for each employee (hours allowed before termination)
- **Enforces attendance policies** with configurable rules and thresholds
- **Manages exception lifecycle** (detection → notification → excuse/approval)
- **Provides analytics** on attendance patterns and at-risk employees
- **Supports manual overrides** for exceptions and balance adjustments

### Key Benefits

| Benefit | Impact |
|---------|--------|
| **Automated Enforcement** | Eliminate manual attendance tracking |
| **Fair & Consistent** | Apply same rules to all employees |
| **Early Warning System** | Identify at-risk employees before termination |
| **Time Savings** | Reduce HR admin time by 80%+ |
| **Compliance** | Full audit trail for attendance discipline |
| **Data-Driven** | Analytics reveal attendance patterns |

### How It Works

```
┌──────────────────────┐
│ Attendance Snapshot  │
│ (Clock in/out data)  │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ Exception Detection  │
│ (System analyzes)    │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    ↓             ↓
┌─────────┐  ┌──────────┐
│ Excused │  │ Deduct   │
│ (PTO,   │  │ UPT      │
│  Sick)  │  │ Hours    │
└─────────┘  └─────┬────┘
                   ↓
           ┌───────────────┐
           │ Update Balance│
           │ Notify Emp/Mgr│
           └───────────────┘
```

---

## Core Concepts

### UPT (Unpaid Time)

UPT is a point-based attendance system where:
- Employees start with an **initial balance** (e.g., 20 hours)
- **Exceptions deduct hours** from the balance
- **Balance reaches 0** = termination eligible
- **Balance resets** based on policy (annual, quarterly, or never)

### Exception Lifecycle

1. **Detection**: System identifies exception from attendance data
2. **Recording**: Exception created and UPT deducted
3. **Notification**: Employee and manager notified
4. **Review**: Manager can excuse exception (refunds UPT)
5. **Escalation**: Low balance triggers warnings/coaching

### Balance Status

| Status | Balance Range | Action Required |
|--------|--------------|-----------------|
| **Healthy** | > Warning threshold | Monitor only |
| **Warning** | ≤ Warning threshold (e.g., 10 hrs) | Coaching conversation |
| **Critical** | ≤ Critical threshold (e.g., 5 hrs) | Written warning |
| **Terminated** | ≤ 0 hours | Termination review |

---

## Exception Types

### 1. Absence
Full absence without approved PTO.

**Deduction**: 8 hours (full shift)  
**Severity**: Critical  
**Example**: Employee scheduled but doesn't clock in

### 2. No Call No Show
Absence without notification to manager.

**Deduction**: 16 hours (2x penalty)  
**Severity**: Critical  
**Example**: Employee doesn't show up and doesn't call

### 3. Tardiness
Late clock-in beyond grace period.

**Deduction**: Minutes late × deduction rate  
**Severity**: Minor to Moderate (depends on minutes)  
**Example**: Employee clocks in 30 minutes late (grace period: 5 min)

### 4. Early Departure
Left early without approval.

**Deduction**: Minutes early × deduction rate  
**Severity**: Minor to Moderate  
**Example**: Employee leaves 45 minutes before shift end

### 5. Extended Break
Break exceeded allowed time beyond grace period.

**Deduction**: Overage minutes converted to hours  
**Severity**: Minor  
**Example**: 30-minute break taken for 45 minutes (grace: 5 min)

### 6. Missed Punch
Missing clock in or clock out (no time missed).

**Deduction**: 0 hours (warning only)  
**Severity**: Minor  
**Example**: Employee forgets to clock out at end of shift

### 7. Partial Absence
Missed part of shift without approval.

**Deduction**: Hours missed  
**Severity**: Moderate to Major  
**Example**: Employee scheduled 8-hour shift but only works 4 hours

---

## UPT Balance Management

### Initial Balance Allocation

Typical starting balances:
- **Standard**: 20 hours
- **Probationary**: 10 hours
- **Seasonal**: 40 hours (higher due to temp nature)

### Deduction Calculation

```typescript
// Tardiness example
minutesLate = 30
gracePeriod = 5
deductionRate = 0.017 // 1 hour per 60 min

effectiveMinutes = max(0, minutesLate - gracePeriod) // 25 min
hoursDeducted = effectiveMinutes * deductionRate // 0.425 hours

// Round to nearest 15 minutes
roundTo = 15 / 60 // 0.25 hours
finalDeduction = ceiling(0.425 / 0.25) * 0.25 // 0.5 hours
```

### Threshold Examples

```typescript
// Example UPT policy
{
  initial_upt_hours: 20,
  warning_threshold_hours: 10,   // Yellow - coaching
  critical_threshold_hours: 5,   // Red - written warning
  termination_threshold_hours: 0 // Termination eligible
}

// Employee journey
Start: 20 hours (Healthy - Green)
After 3 absences (8 hrs each): 20 - 24 = -4 hours (Terminated - Red)

// More typical
Start: 20 hours
After 5 tardiness (0.5 hrs each): 17.5 hours (Healthy)
After 1 absence (8 hrs): 9.5 hours (Warning - Yellow)
After 2 more absences: -6.5 hours (Terminated)
```

### Balance Resets

| Reset Frequency | Reset Date | Use Case |
|----------------|------------|----------|
| **Never** | N/A | Warehouse (strict attendance) |
| **Annual** | Hire anniversary or Jan 1 | Most common |
| **Quarterly** | Every 3 months | Less common |
| **Monthly** | 1st of month | Very lenient (not recommended) |

---

## Policy Configuration

### UPT Policy Structure

```typescript
{
  // Identification
  organization_id: "org-123",
  department_id: null, // null = org-wide, or dept-specific
  policy_name: "Standard Warehouse UPT Policy",
  
  // Initial allocation
  initial_upt_hours: 20,
  reset_frequency: "annual",
  reset_date: "hire_anniversary",
  
  // Thresholds
  warning_threshold_hours: 10,
  critical_threshold_hours: 5,
  termination_threshold_hours: 0,
  
  // Grace periods (minutes)
  tardiness_grace_period_minutes: 5,
  early_departure_grace_period_minutes: 5,
  break_grace_period_minutes: 5,
  
  // Deduction rates
  deduction_rate_tardiness: 0.017, // 1 hour per 60 min
  deduction_rate_early_departure: 0.017,
  deduction_rate_absence: 8, // 8 hours per full day
  deduction_rate_no_call_no_show: 16, // 2x penalty
  
  // Rounding
  round_to_nearest_minutes: 15,
  always_round_up: true,
  
  // Excuses
  allow_excused_absences: true,
  require_documentation: true,
  documentation_types: ["doctor_note", "court_summons", "death_certificate"],
  excuse_approval_required: true,
  
  // Notifications
  notify_employee_on_exception: true,
  notify_manager_on_exception: true,
  notify_hr_on_critical: true,
  notify_on_warning_threshold: true,
  notify_on_critical_threshold: true,
  
  // Automation
  auto_detect_exceptions: true,
  detection_schedule_minutes: 30, // Check every 30 min
  
  is_active: true,
  effective_date: "2026-01-01"
}
```

### Policy Examples

#### Strict Policy (Warehouse)
```json
{
  "policy_name": "Strict Warehouse Policy",
  "initial_upt_hours": 20,
  "reset_frequency": "never",
  "warning_threshold_hours": 10,
  "critical_threshold_hours": 5,
  "termination_threshold_hours": 0,
  "tardiness_grace_period_minutes": 2,
  "deduction_rate_no_call_no_show": 24,
  "always_round_up": true
}
```
**Impact**: Very strict. 3 absences = terminated.

#### Lenient Policy (Office)
```json
{
  "policy_name": "Lenient Office Policy",
  "initial_upt_hours": 40,
  "reset_frequency": "quarterly",
  "warning_threshold_hours": 20,
  "critical_threshold_hours": 10,
  "termination_threshold_hours": 0,
  "tardiness_grace_period_minutes": 15,
  "deduction_rate_no_call_no_show": 8,
  "always_round_up": false
}
```
**Impact**: More forgiving. 5 absences before termination.

#### Seasonal Policy
```json
{
  "policy_name": "Peak Season Policy",
  "initial_upt_hours": 80,
  "reset_frequency": "never",
  "warning_threshold_hours": 40,
  "critical_threshold_hours": 20,
  "termination_threshold_hours": 0,
  "tardiness_grace_period_minutes": 5,
  "deduction_rate_no_call_no_show": 16
}
```
**Impact**: Higher balance for seasonal workers. 10 absences tolerated.

---

## Automated Detection

### Detection Process

1. **Scheduled Scan**: Every 30 minutes (configurable)
2. **Query Attendance**: Get attendance snapshots for period
3. **Analyze Each Snapshot**: Compare actual vs scheduled
4. **Identify Exceptions**: Apply grace periods and rules
5. **Create Records**: Record exceptions in database
6. **Deduct UPT**: Update employee balance
7. **Send Notifications**: Alert employee and manager

### Detection Logic

```typescript
// Pseudo-code for detection
for each attendance_snapshot in period:
  // Check absence
  if scheduled_start AND no clock_in:
    if no_notification_sent:
      exception = "no_call_no_show"
      deduction = 16 hours
    else:
      exception = "absence"
      deduction = 8 hours
  
  // Check tardiness
  if clock_in AND scheduled_start:
    late_minutes = clock_in - scheduled_start
    if late_minutes > grace_period:
      exception = "tardiness"
      deduction = late_minutes * deduction_rate
  
  // Check early departure
  if clock_out AND scheduled_end:
    early_minutes = scheduled_end - clock_out
    if early_minutes > grace_period:
      exception = "early_departure"
      deduction = early_minutes * deduction_rate
  
  // Check extended break
  if break_duration > expected_duration + grace_period:
    exception = "extended_break"
    deduction = (break_duration - expected_duration) / 60
  
  // Record exception and deduct UPT
  if exception:
    create_exception(exception, deduction)
    update_balance(employee_id, -deduction)
    notify(employee, manager)
```

### Manual Detection

Managers can also manually trigger detection:

```http
POST /api/labor-actions/upt/detect-exceptions
{
  "organization_id": "org-123",
  "department_id": "dept-456",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "auto_deduct_upt": true,
  "send_notifications": true
}
```

Response:
```json
{
  "success": true,
  "exceptions_detected": 45,
  "exceptions_created": 45,
  "exceptions_skipped": 0,
  "upt_hours_deducted": 87.5,
  "employees_affected": 12,
  "details": [...]
}
```

---

## API Reference

### Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/upt/detect-exceptions` | POST | Detect exceptions from attendance data |
| `/upt/exceptions` | POST | Record exception manually |
| `/upt/exceptions` | GET | List exceptions with filters |
| `/upt/exceptions/:id/excuse` | POST | Excuse exception (refund UPT) |
| `/upt/balance` | GET | Get employee UPT balance |
| `/upt/balance/adjust` | POST | Manually adjust balance |
| `/upt/employees-at-risk` | GET | Get employees with low balance |
| `/upt/analytics` | GET | Get attendance analytics |
| `/upt/policies` | POST | Create UPT policy |
| `/upt/policies/:id` | PUT | Update UPT policy |

### Detect Exceptions

**Endpoint**: `POST /api/labor-actions/upt/detect-exceptions`

Analyzes attendance data to automatically identify UPT exceptions.

#### Request
```http
POST /api/labor-actions/upt/detect-exceptions
Content-Type: application/json

{
  "organization_id": "org-123",
  "department_id": "dept-456",
  "employee_ids": ["emp-001", "emp-002"],
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "exception_types": ["absence", "tardiness"],
  "auto_deduct_upt": true,
  "send_notifications": true
}
```

#### Response
```json
{
  "success": true,
  "exceptions_detected": 25,
  "exceptions_created": 23,
  "exceptions_skipped": 2,
  "upt_hours_deducted": 45.5,
  "employees_affected": 8,
  "details": [
    {
      "employee_id": "emp-001",
      "employee_name": "John Doe",
      "exception_type": "tardiness",
      "exception_date": "2026-01-15",
      "minutes_missed": 30,
      "upt_hours_deducted": 0.5,
      "new_balance_hours": 18.5,
      "balance_status": "healthy",
      "created": true
    }
  ]
}
```

### Record Exception Manually

**Endpoint**: `POST /api/labor-actions/upt/exceptions`

Manually record a UPT exception (used for non-automated scenarios).

#### Request
```http
POST /api/labor-actions/upt/exceptions
Content-Type: application/json

{
  "organization_id": "org-123",
  "employee_id": "emp-001",
  "exception_type": "absence",
  "exception_date": "2026-01-15",
  "occurrence_time": "2026-01-15T08:00:00Z",
  "minutes_missed": 480,
  "shift_id": "shift-001",
  "scheduled_start": "2026-01-15T08:00:00Z",
  "scheduled_end": "2026-01-15T17:00:00Z",
  "notes": "Employee called in sick but has no PTO",
  "detected_by": "manager",
  "auto_deduct_upt": true,
  "send_notifications": true
}
```

#### Response
```json
{
  "success": true,
  "exception": {
    "exception_id": "exc-001",
    "organization_id": "org-123",
    "employee_id": "emp-001",
    "employee_name": "John Doe",
    "exception_type": "absence",
    "exception_date": "2026-01-15",
    "severity": "critical",
    "minutes_missed": 480,
    "upt_hours_deducted": 8.0,
    "is_excused": false,
    "created_at": "2026-01-15T10:30:00Z"
  },
  "upt_balance": {
    "current_balance_hours": 12.0,
    "balance_status": "warning",
    "is_negative": false
  },
  "message": "Exception recorded. 8 hours deducted from UPT balance."
}
```

### Excuse Exception

**Endpoint**: `POST /api/labor-actions/upt/exceptions/:exception_id/excuse`

Excuse a UPT exception and refund the deducted hours.

#### Request
```http
POST /api/labor-actions/upt/exceptions/exc-001/excuse
Content-Type: application/json

{
  "organization_id": "org-123",
  "excuse_reason": "Employee provided doctor's note",
  "excuse_documentation": "https://docs.example.com/doctor-note-123.pdf",
  "approved_by": "mgr-456",
  "refund_upt": true,
  "notes": "Approved sick leave with documentation"
}
```

#### Response
```json
{
  "success": true,
  "exception": {
    "exception_id": "exc-001",
    "is_excused": true,
    "excuse_reason": "Employee provided doctor's note",
    "approved_by": "mgr-456",
    "approved_at": "2026-01-16T09:00:00Z"
  },
  "upt_balance": {
    "current_balance_hours": 20.0,
    "balance_status": "healthy"
  },
  "upt_refunded_hours": 8.0,
  "message": "Exception excused. 8 hours refunded."
}
```

### Get UPT Balance

**Endpoint**: `GET /api/labor-actions/upt/balance`

Get current UPT balance for an employee.

#### Request
```http
GET /api/labor-actions/upt/balance?organization_id=org-123&employee_id=emp-001
```

#### Response
```json
{
  "success": true,
  "balance": {
    "balance_id": "bal-001",
    "employee_id": "emp-001",
    "employee_name": "John Doe",
    "current_balance_hours": 15.5,
    "initial_balance_hours": 20.0,
    "total_used_hours": 4.5,
    "total_excused_hours": 0,
    "warning_threshold_hours": 10,
    "critical_threshold_hours": 5,
    "termination_threshold_hours": 0,
    "balance_status": "healthy",
    "is_negative": false,
    "exceptions_this_month": 3,
    "exceptions_this_year": 8,
    "last_exception_date": "2026-01-15",
    "last_balance_update": "2026-01-15T10:30:00Z"
  },
  "recent_exceptions": [
    {
      "exception_id": "exc-003",
      "exception_type": "tardiness",
      "exception_date": "2026-01-15",
      "upt_hours_deducted": 0.5,
      "is_excused": false
    },
    {
      "exception_id": "exc-002",
      "exception_type": "early_departure",
      "exception_date": "2026-01-10",
      "upt_hours_deducted": 1.0,
      "is_excused": false
    }
  ]
}
```

### List Exceptions

**Endpoint**: `GET /api/labor-actions/upt/exceptions`

List UPT exceptions with filters.

#### Request
```http
GET /api/labor-actions/upt/exceptions?organization_id=org-123&start_date=2026-01-01&end_date=2026-01-31&exception_types=absence,no_call_no_show&is_excused=false&balance_status=critical&limit=50&offset=0
```

#### Response
```json
{
  "success": true,
  "exceptions": [
    {
      "exception_id": "exc-005",
      "employee_id": "emp-002",
      "employee_name": "Jane Smith",
      "exception_type": "no_call_no_show",
      "exception_date": "2026-01-20",
      "severity": "critical",
      "upt_hours_deducted": 16.0,
      "is_excused": false
    }
  ],
  "total_count": 15,
  "page": 1,
  "limit": 50
}
```

### Get Employees at Risk

**Endpoint**: `GET /api/labor-actions/upt/employees-at-risk`

Get employees with low UPT balance.

#### Request
```http
GET /api/labor-actions/upt/employees-at-risk?organization_id=org-123&status_filter=warning,critical&sort_by=balance&limit=25
```

#### Response
```json
{
  "success": true,
  "employees": [
    {
      "employee_id": "emp-003",
      "employee_name": "Bob Johnson",
      "department_name": "Warehouse A",
      "current_balance_hours": 2.5,
      "balance_status": "critical",
      "is_negative": false,
      "total_exceptions": 15,
      "exceptions_last_30_days": 4,
      "last_exception_date": "2026-01-25",
      "days_until_termination": 7,
      "recommended_action": "Written warning and PIP"
    }
  ],
  "total_count": 8
}
```

### Get Analytics

**Endpoint**: `GET /api/labor-actions/upt/analytics`

Get UPT analytics and trends.

#### Request
```http
GET /api/labor-actions/upt/analytics?organization_id=org-123&start_date=2026-01-01&end_date=2026-01-31&group_by=employee
```

#### Response
```json
{
  "success": true,
  "summary": {
    "total_exceptions": 125,
    "total_employees_affected": 35,
    "total_upt_hours_deducted": 245.5,
    "total_upt_hours_excused": 32.0,
    "avg_exceptions_per_employee": 3.57,
    "avg_upt_hours_per_exception": 1.96,
    "employees_healthy": 50,
    "employees_warning": 8,
    "employees_critical": 3,
    "employees_terminated": 0,
    "absences": 45,
    "tardiness": 60,
    "early_departures": 15,
    "no_call_no_shows": 5
  },
  "by_employee": [
    {
      "employee_id": "emp-001",
      "employee_name": "John Doe",
      "current_balance_hours": 15.5,
      "balance_status": "healthy",
      "total_exceptions": 5,
      "total_upt_hours_deducted": 4.5,
      "most_common_exception_type": "tardiness",
      "trend": "stable"
    }
  ]
}
```

### Adjust Balance

**Endpoint**: `POST /api/labor-actions/upt/balance/adjust`

Manually adjust UPT balance (admin override).

#### Request
```http
POST /api/labor-actions/upt/balance/adjust
Content-Type: application/json

{
  "organization_id": "org-123",
  "employee_id": "emp-001",
  "adjustment_hours": 5.0,
  "reason": "Goodwill adjustment for system errors during implementation",
  "adjusted_by": "hr-admin-001",
  "notes": "One-time adjustment to account for false exceptions during system rollout"
}
```

#### Response
```json
{
  "success": true,
  "previous_balance_hours": 10.5,
  "new_balance_hours": 15.5,
  "adjustment_hours": 5.0,
  "upt_balance": {
    "current_balance_hours": 15.5,
    "balance_status": "healthy"
  },
  "message": "Balance adjusted by 5 hours. New balance: 15.5 hours."
}
```

### Create Policy

**Endpoint**: `POST /api/labor-actions/upt/policies`

Create a new UPT policy.

#### Request
```http
POST /api/labor-actions/upt/policies
Content-Type: application/json

{
  "organization_id": "org-123",
  "department_id": null,
  "policy_name": "Standard Warehouse Policy",
  "initial_upt_hours": 20,
  "warning_threshold_hours": 10,
  "critical_threshold_hours": 5,
  "termination_threshold_hours": 0,
  "tardiness_grace_period_minutes": 5,
  "deduction_rate_tardiness": 0.017,
  "deduction_rate_absence": 8,
  "deduction_rate_no_call_no_show": 16,
  "round_to_nearest_minutes": 15,
  "always_round_up": true,
  "allow_excused_absences": true,
  "notify_employee_on_exception": true,
  "auto_detect_exceptions": true,
  "detection_schedule_minutes": 30,
  "effective_date": "2026-01-01"
}
```

#### Response
```json
{
  "success": true,
  "policy": {
    "policy_id": "pol-001",
    "policy_name": "Standard Warehouse Policy",
    "initial_upt_hours": 20,
    "is_active": true
  },
  "message": "UPT policy created successfully"
}
```

---

## Database Schema

### upt_exceptions

Stores individual UPT exceptions.

```sql
CREATE TABLE upt_exceptions (
  exception_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id),
  
  -- Exception details
  exception_type TEXT NOT NULL CHECK (exception_type IN ('absence', 'tardiness', 'early_departure', 'missed_punch', 'extended_break', 'no_call_no_show', 'partial_absence')),
  exception_date DATE NOT NULL,
  occurrence_time TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  
  -- Time impact
  minutes_missed INTEGER NOT NULL,
  upt_hours_deducted NUMERIC(10, 2) NOT NULL,
  
  -- Context
  shift_id UUID REFERENCES shifts(id),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_clock_in TIMESTAMPTZ,
  actual_clock_out TIMESTAMPTZ,
  
  -- Approval
  is_excused BOOLEAN DEFAULT FALSE,
  excuse_reason TEXT,
  excuse_documentation TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Notifications
  employee_notified BOOLEAN DEFAULT FALSE,
  manager_notified BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  system_notes TEXT,
  
  -- Metadata
  detected_by TEXT CHECK (detected_by IN ('system', 'manager', 'manual')),
  detection_method TEXT,
  data_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upt_exceptions_employee ON upt_exceptions(employee_id);
CREATE INDEX idx_upt_exceptions_dept ON upt_exceptions(department_id);
CREATE INDEX idx_upt_exceptions_date ON upt_exceptions(exception_date);
CREATE INDEX idx_upt_exceptions_type ON upt_exceptions(exception_type);
CREATE INDEX idx_upt_exceptions_excused ON upt_exceptions(is_excused);
```

### upt_balances

Stores employee UPT balances.

```sql
CREATE TABLE upt_balances (
  balance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id),
  
  -- Balance
  current_balance_hours NUMERIC(10, 2) NOT NULL,
  initial_balance_hours NUMERIC(10, 2) NOT NULL,
  total_used_hours NUMERIC(10, 2) DEFAULT 0,
  total_excused_hours NUMERIC(10, 2) DEFAULT 0,
  
  -- Thresholds
  warning_threshold_hours NUMERIC(10, 2) NOT NULL,
  critical_threshold_hours NUMERIC(10, 2) NOT NULL,
  termination_threshold_hours NUMERIC(10, 2) NOT NULL,
  
  -- Status
  balance_status TEXT NOT NULL CHECK (balance_status IN ('healthy', 'warning', 'critical', 'terminated')),
  is_negative BOOLEAN DEFAULT FALSE,
  days_until_termination INTEGER,
  
  -- Period
  period_start_date DATE NOT NULL,
  period_end_date DATE,
  last_exception_date DATE,
  last_balance_update TIMESTAMPTZ NOT NULL,
  
  -- Trends
  exceptions_this_month INTEGER DEFAULT 0,
  exceptions_this_quarter INTEGER DEFAULT 0,
  exceptions_this_year INTEGER DEFAULT 0,
  avg_exceptions_per_month NUMERIC(10, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, employee_id)
);

CREATE INDEX idx_upt_balances_employee ON upt_balances(employee_id);
CREATE INDEX idx_upt_balances_dept ON upt_balances(department_id);
CREATE INDEX idx_upt_balances_status ON upt_balances(balance_status);
CREATE INDEX idx_upt_balances_negative ON upt_balances(is_negative);
```

### upt_policies

Stores UPT policy configurations.

```sql
CREATE TABLE upt_policies (
  policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  department_id UUID REFERENCES departments(id),
  
  policy_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Initial allocation
  initial_upt_hours NUMERIC(10, 2) NOT NULL,
  reset_frequency TEXT CHECK (reset_frequency IN ('never', 'annual', 'quarterly', 'monthly')),
  reset_date DATE,
  
  -- Thresholds
  warning_threshold_hours NUMERIC(10, 2) NOT NULL,
  critical_threshold_hours NUMERIC(10, 2) NOT NULL,
  termination_threshold_hours NUMERIC(10, 2) NOT NULL,
  
  -- Grace periods (minutes)
  tardiness_grace_period_minutes INTEGER DEFAULT 5,
  early_departure_grace_period_minutes INTEGER DEFAULT 5,
  break_grace_period_minutes INTEGER DEFAULT 5,
  
  -- Deduction rates
  deduction_rate_tardiness NUMERIC(10, 4) DEFAULT 0.017,
  deduction_rate_early_departure NUMERIC(10, 4) DEFAULT 0.017,
  deduction_rate_absence NUMERIC(10, 2) DEFAULT 8,
  deduction_rate_no_call_no_show NUMERIC(10, 2) DEFAULT 16,
  
  -- Rounding
  round_to_nearest_minutes INTEGER DEFAULT 15,
  always_round_up BOOLEAN DEFAULT TRUE,
  
  -- Excuses
  allow_excused_absences BOOLEAN DEFAULT TRUE,
  require_documentation BOOLEAN DEFAULT FALSE,
  documentation_types TEXT[],
  excuse_approval_required BOOLEAN DEFAULT TRUE,
  
  -- Notifications
  notify_employee_on_exception BOOLEAN DEFAULT TRUE,
  notify_manager_on_exception BOOLEAN DEFAULT TRUE,
  notify_hr_on_critical BOOLEAN DEFAULT TRUE,
  notify_on_warning_threshold BOOLEAN DEFAULT TRUE,
  notify_on_critical_threshold BOOLEAN DEFAULT TRUE,
  
  -- Automation
  auto_detect_exceptions BOOLEAN DEFAULT TRUE,
  detection_schedule_minutes INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE NOT NULL,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upt_policies_org ON upt_policies(organization_id);
CREATE INDEX idx_upt_policies_dept ON upt_policies(department_id);
CREATE INDEX idx_upt_policies_active ON upt_policies(is_active);
```

### upt_balance_adjustments

Audit log for manual balance adjustments.

```sql
CREATE TABLE upt_balance_adjustments (
  adjustment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  
  adjustment_hours NUMERIC(10, 2) NOT NULL,
  previous_balance_hours NUMERIC(10, 2) NOT NULL,
  new_balance_hours NUMERIC(10, 2) NOT NULL,
  
  reason TEXT NOT NULL,
  adjusted_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  
  adjustment_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upt_adjustments_employee ON upt_balance_adjustments(employee_id);
CREATE INDEX idx_upt_adjustments_adjusted_by ON upt_balance_adjustments(adjusted_by);
```

---

## Integration Guide

### Frontend Integration

#### Employee Dashboard

```typescript
// Get employee's UPT balance
async function loadUPTBalance() {
  const response = await fetch(
    `/api/labor-actions/upt/balance?` +
    `organization_id=${orgId}&employee_id=${employeeId}`
  );
  const { balance, recent_exceptions } = await response.json();
  
  // Display balance with color coding
  const color = balance.balance_status === 'healthy' ? 'green' :
               balance.balance_status === 'warning' ? 'yellow' :
               balance.balance_status === 'critical' ? 'red' : 'black';
  
  renderBalance({
    hours: balance.current_balance_hours,
    status: balance.balance_status,
    color,
    recentExceptions: recent_exceptions
  });
}
```

#### Manager Dashboard

```typescript
// Get employees at risk
async function loadAtRiskEmployees() {
  const response = await fetch(
    `/api/labor-actions/upt/employees-at-risk?` +
    `organization_id=${orgId}&department_id=${deptId}&` +
    `status_filter=warning,critical&sort_by=balance&limit=25`
  );
  const { employees } = await response.json();
  
  employees.forEach(emp => {
    renderEmployee({
      name: emp.employee_name,
      balance: emp.current_balance_hours,
      status: emp.balance_status,
      recentExceptions: emp.exceptions_last_30_days,
      recommendedAction: emp.recommended_action
    });
  });
}
```

#### Exception Review

```typescript
// Excuse an exception
async function excuseException(exceptionId, reason, documentation) {
  const response = await fetch(
    `/api/labor-actions/upt/exceptions/${exceptionId}/excuse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: orgId,
        excuse_reason: reason,
        excuse_documentation: documentation,
        approved_by: managerId,
        refund_upt: true
      })
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    showMessage(`Exception excused. ${result.upt_refunded_hours} hours refunded.`);
    reloadExceptions();
  }
}
```

### Scheduled Jobs

#### Automated Detection (Cron)

```typescript
// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running UPT exception detection...');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get all organizations
  const orgs = await getOrganizations();
  
  for (const org of orgs) {
    try {
      const result = await uptTrackingService.detectExceptions({
        organization_id: org.organization_id,
        start_date: today,
        end_date: today,
        auto_deduct_upt: true,
        send_notifications: true
      });
      
      console.log(`Org ${org.organization_id}:`);
      console.log(`  Detected: ${result.exceptions_detected}`);
      console.log(`  Created: ${result.exceptions_created}`);
      console.log(`  UPT deducted: ${result.upt_hours_deducted} hours`);
    } catch (error) {
      console.error(`Failed for org ${org.organization_id}:`, error);
    }
  }
});
```

#### Daily Summary Email

```typescript
// Send daily summary to HR at 8 AM
cron.schedule('0 8 * * *', async () => {
  const yesterday = getYesterday();
  
  // Get employees who went critical yesterday
  const { employees } = await uptTrackingService.getEmployeesAtRisk({
    organization_id: orgId,
    status_filter: ['critical'],
    sort_by: 'balance'
  });
  
  if (employees.length > 0) {
    await sendEmail({
      to: 'hr@company.com',
      subject: 'UPT Alert: Employees at Critical Balance',
      body: `
        ${employees.length} employees are at critical UPT balance:
        
        ${employees.map(e => `
          - ${e.employee_name}: ${e.current_balance_hours} hours remaining
            Last exception: ${e.last_exception_date}
            Action: ${e.recommended_action}
        `).join('\n')}
      `
    });
  }
});
```

### Notifications

#### Exception Notification

```typescript
async function notifyException(exception: UPTException, balance: UPTBalance) {
  // Email to employee
  await sendEmail({
    to: exception.employee_email,
    subject: 'Attendance Exception Recorded',
    body: `
      An attendance exception has been recorded:
      
      Type: ${exception.exception_type}
      Date: ${exception.exception_date}
      UPT Deducted: ${exception.upt_hours_deducted} hours
      
      Your current UPT balance: ${balance.current_balance_hours} hours
      Status: ${balance.balance_status}
      
      ${balance.balance_status === 'warning' ? 
        'WARNING: You are approaching the minimum UPT balance.' : ''}
      ${balance.balance_status === 'critical' ?
        'CRITICAL: You are at critical UPT balance. Further exceptions may result in termination.' : ''}
    `
  });
  
  // Notification to manager
  await sendEmail({
    to: manager.email,
    subject: `Attendance Exception: ${exception.employee_name}`,
    body: `
      ${exception.employee_name} has a new attendance exception:
      
      Type: ${exception.exception_type}
      Date: ${exception.exception_date}
      UPT Deducted: ${exception.upt_hours_deducted} hours
      New Balance: ${balance.current_balance_hours} hours (${balance.balance_status})
    `
  });
}
```

---

## Best Practices

### Policy Design

1. **Start with standard policy** across organization
2. **Adjust based on data** after 3-6 months
3. **Department-specific policies** only if necessary (e.g., office vs warehouse)
4. **Grace periods** should be consistent with company culture
5. **Reset frequency** should match attendance philosophy:
   - Strict: Never reset
   - Moderate: Annual reset
   - Lenient: Quarterly reset

### Implementation Rollout

#### Week 1-2: Planning
- Define UPT policy
- Configure thresholds
- Test with historical data

#### Week 3-4: Soft Launch
- Enable detection (dry run)
- Review results without deducting
- Train managers

#### Week 5-6: Full Launch
- Enable automated deduction
- Send notifications
- Monitor closely

#### Week 7+: Optimization
- Review analytics
- Adjust thresholds
- Refine policies

### Manager Training

Train managers on:
- **How UPT works**: Balance, deductions, thresholds
- **Exception types**: What counts as an exception
- **Excuse process**: When and how to excuse exceptions
- **Coaching conversations**: How to address attendance issues
- **Escalation path**: When to involve HR

### Employee Communication

Communicate to employees:
- **Initial UPT balance**: How many hours they start with
- **Exception types**: What behaviors result in deductions
- **Deduction rates**: How much is deducted for each type
- **Thresholds**: When they receive warnings
- **Excuse process**: How to request exception excuses
- **Reset policy**: When/if balance resets

### Analytics Review

Review monthly:
- **Exception rates**: By type, department, employee
- **At-risk employees**: Trending toward termination
- **Common patterns**: Peak exception times, days of week
- **Policy effectiveness**: Are thresholds appropriate?
- **Manager actions**: Are exceptions being reviewed/excused appropriately?

### Common Pitfalls

❌ **Too Strict**: Policy so strict employees hit termination threshold quickly  
✅ **Solution**: Increase initial balance or reduce deduction rates

❌ **Inconsistent Enforcement**: Some managers excuse everything, others nothing  
✅ **Solution**: Clear excuse criteria and manager training

❌ **No Reset**: Employees with bad start can never recover  
✅ **Solution**: Annual reset or path to earn back hours

❌ **Surprise Terminations**: Employees hit 0 without warning  
✅ **Solution**: Proactive notifications at warning/critical thresholds

❌ **False Positives**: System errors cause incorrect exceptions  
✅ **Solution**: Grace periods, manual review, easy excuse process

---

## Troubleshooting

### Issue: High False Positive Rate

**Symptoms**: Many exceptions being excused by managers

**Causes**:
- Grace periods too short
- Timeclock system errors
- Shift schedule mismatches

**Solutions**:
1. Increase grace periods (e.g., 5 min → 10 min)
2. Review timeclock reliability
3. Audit shift schedules vs attendance snapshots
4. Add pre-detection validation

### Issue: Employees Hitting Termination Too Quickly

**Symptoms**: Many employees at 0 hours within months

**Causes**:
- Initial balance too low
- Deduction rates too high
- No reset policy

**Solutions**:
1. Increase initial balance (20 → 40 hours)
2. Reduce deduction rates (especially for tardiness)
3. Implement annual reset
4. Allow employees to "earn back" hours (e.g., perfect attendance bonuses)

### Issue: Managers Not Reviewing Exceptions

**Symptoms**: All exceptions go unreviewed, low excuse rate

**Causes**:
- Managers unaware of review responsibility
- Process too complex
- No accountability

**Solutions**:
1. Train managers on review process
2. Send daily digest of pending exceptions
3. Add KPI for manager responsiveness
4. Simplify excuse workflow

### Issue: Notifications Overwhelming Employees

**Symptoms**: Employees complain about too many notifications

**Causes**:
- Notification on every exception
- Multiple notification channels
- No notification grouping

**Solutions**:
1. Batch notifications (daily digest instead of real-time)
2. Only notify on major exceptions (critical severity)
3. Allow employees to configure notification preferences
4. Use in-app notifications instead of email for minor exceptions

---

## Summary

The UPT Tracking system provides:

✅ **Automated Detection**: Identify exceptions from attendance data  
✅ **Balance Management**: Track UPT hours for each employee  
✅ **Policy Enforcement**: Configurable rules and thresholds  
✅ **Exception Lifecycle**: Detect → Record → Notify → Review → Excuse  
✅ **At-Risk Identification**: Early warning for employees approaching termination  
✅ **Analytics**: Attendance patterns and policy effectiveness  
✅ **Audit Trail**: Full history of exceptions and adjustments  

**Target Metrics**:
- Exception detection accuracy: > 95%
- False positive rate: < 5%
- Manager review time: < 2 min per exception
- Employee satisfaction: Transparent, fair, consistent enforcement

For questions or issues, refer to the [API Reference](#api-reference) or [Best Practices](#best-practices) sections.
