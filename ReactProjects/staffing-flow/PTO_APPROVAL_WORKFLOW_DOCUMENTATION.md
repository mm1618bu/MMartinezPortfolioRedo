# PTO Approval Workflow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Auto-Approval Rules](#auto-approval-rules)
4. [Automated Processing](#automated-processing)
5. [Batch Operations](#batch-operations)
6. [Approval Delegation](#approval-delegation)
7. [Manager Dashboard](#manager-dashboard)
8. [Analytics & Reporting](#analytics--reporting)
9. [API Reference](#api-reference)
10. [Database Schema](#database-schema)
11. [Integration Guide](#integration-guide)
12. [Best Practices](#best-practices)

---

## Overview

The PTO Approval Workflow system adds enterprise-grade automation to PTO management. It transforms manual one-by-one approvals into an intelligent, rule-based system that can:

- **Auto-approve simple requests** (sick days, short vacations) instantly
- **Process batches** of requests simultaneously for manager efficiency
- **Enforce business rules** (blackout dates, team coverage limits)
- **Delegate authority** temporarily when managers are unavailable
- **Prioritize requests** based on urgency (start date proximity)
- **Track metrics** (auto-approval rates, response times, bottlenecks)

### Key Benefits

| Benefit | Impact |
|---------|--------|
| **Manager Time Savings** | Reduce approval time by 70%+ with batch operations and auto-approval |
| **Employee Experience** | Instant approval for simple requests (no waiting) |
| **Consistency** | Rules ensure fair, predictable decisions across all employees |
| **Business Protection** | Prevent operational issues (holiday blackouts, understaffing) |
| **Scalability** | Handle high-volume periods (summer vacations, holidays) effortlessly |
| **Compliance** | Full audit trail, configurable rules, delegation tracking |

### How It Works

```
Employee Submits Request
         ↓
   Check Auto-Approval Rules
         ↓
    ┌────┴────┐
    ↓         ↓
Auto-Approve  Manual Review Required
    ↓         ↓
 Balance    Manager Queue
 Updated    (Prioritized)
    ↓         ↓
Employee   Manager Reviews
Notified   & Approves/Denies
```

---

## Architecture

### Components

1. **Auto-Approval Rules Engine** (`pto-approval-workflow.service.ts`)
   - Evaluates requests against configurable rules
   - Matches first applicable rule by priority
   - Auto-approves or flags for manual review

2. **Batch Operations Processor**
   - Processes multiple requests simultaneously
   - Continues on individual failures
   - Returns detailed success/failure per request

3. **Priority Queue Manager**
   - Categorizes by urgency (urgent/normal/future)
   - Flags requests with conflicts
   - Tracks oldest pending request

4. **Delegation Manager**
   - Temporary authority transfer
   - Date range enforcement
   - Optional department filtering

5. **Analytics Engine**
   - Auto-approval rate tracking
   - Response time metrics
   - Per-manager and per-rule breakdowns

### Data Flow

```
┌─────────────────┐
│ PTO Request     │
│ (pending)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Rules Engine    │
│ - Check criteria│
│ - Match rule    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│Auto-   │ │Manual    │
│Approve │ │Review    │
└───┬────┘ └────┬─────┘
    │           │
    ↓           ↓
┌────────────────┐
│ Update Balance │
│ Notify Users   │
│ Log Action     │
└────────────────┘
```

---

## Auto-Approval Rules

### Rule Structure

Auto-approval rules define criteria for automatic approval. Rules are evaluated in priority order (highest first).

```typescript
interface PTOAutoApprovalRule {
  rule_id: string;
  organization_id: string;
  department_id?: string;  // Optional: dept-specific rule
  rule_name: string;
  pto_types: PTOType[];    // Which PTO types eligible
  max_days?: number;       // Max days for auto-approval
  max_consecutive_days?: number;  // Max consecutive days
  min_notice_days?: number;  // Minimum advance notice
  auto_approve_sick?: boolean;  // Auto-approve sick leave
  requires_documentation?: boolean;
  blackout_dates?: string[];  // Blocked dates
  max_team_members_out?: number;  // Coverage limit
  enabled: boolean;
  priority: number;  // Higher = evaluated first
}
```

### Rule Evaluation Order

1. **Sort by priority** (highest first)
2. **For each rule**:
   - Check PTO type match
   - Check max_days limit
   - Check max_consecutive_days limit
   - Check min_notice_days requirement
   - Check auto_approve_sick flag
   - Check blackout_dates overlap
   - Check max_team_members_out constraint
   - Check documentation requirement
3. **Stop at first matching rule**

### Example Rules

#### Rule 1: Auto-Approve Sick Leave
```json
{
  "rule_name": "Auto-approve sick leave",
  "pto_types": ["sick"],
  "max_days": 5,
  "auto_approve_sick": true,
  "priority": 100,
  "enabled": true
}
```
**Effect**: Sick leave requests ≤ 5 days are approved instantly.

#### Rule 2: Auto-Approve Short Vacations
```json
{
  "rule_name": "Auto-approve short vacations",
  "pto_types": ["vacation"],
  "max_days": 3,
  "min_notice_days": 7,
  "max_team_members_out": 2,
  "priority": 50,
  "enabled": true
}
```
**Effect**: Vacations ≤ 3 days with ≥ 7 days notice and ≤ 2 team members out are auto-approved.

#### Rule 3: Blackout Dates
```json
{
  "rule_name": "Block holiday blackouts",
  "pto_types": ["vacation", "personal"],
  "blackout_dates": ["2026-12-24", "2026-12-25", "2026-12-26"],
  "priority": 90,
  "enabled": true
}
```
**Effect**: Requests overlapping Dec 24-26 require manual review (no auto-approval).

#### Rule 4: Department-Specific
```json
{
  "rule_name": "Warehouse auto-approve personal days",
  "department_id": "dept-warehouse-001",
  "pto_types": ["personal"],
  "max_days": 1,
  "min_notice_days": 3,
  "priority": 40,
  "enabled": true
}
```
**Effect**: Warehouse personal days (1 day, ≥ 3 days notice) are auto-approved.

### Rule Management

#### Create Rule
```http
POST /api/labor-actions/pto/workflow/rules
Content-Type: application/json

{
  "organization_id": "org-123",
  "department_id": "dept-456",
  "rule_name": "Auto-approve bereavement",
  "pto_types": ["bereavement"],
  "max_days": 3,
  "auto_approve_sick": true,
  "requires_documentation": true,
  "priority": 80,
  "enabled": true
}
```

#### Update Rule
```http
PUT /api/labor-actions/pto/workflow/rules/{rule_id}
Content-Type: application/json

{
  "enabled": false,
  "priority": 70
}
```

#### Rule Priority Best Practices

| Priority Range | Use Case |
|----------------|----------|
| **90-100** | Emergency/urgent types (sick, bereavement) |
| **70-89** | Blackout dates, coverage restrictions |
| **50-69** | Standard vacation auto-approval |
| **30-49** | Department-specific rules |
| **10-29** | Low-priority types (unpaid, other) |

---

## Automated Processing

### Process Pending Requests

The `processPendingRequests` method is the core automation engine. It can be triggered:
- **Scheduled** (e.g., cron job every 15 minutes)
- **On-demand** (admin triggers manual run)
- **Post-submission** (check immediately after employee submits)

#### Request
```http
POST /api/labor-actions/pto/workflow/process-pending
Content-Type: application/json

{
  "organization_id": "org-123",
  "department_id": "dept-456",  // Optional: process only this dept
  "dry_run": false  // true = preview without applying changes
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "processed_count": 25,
    "auto_approved_count": 18,
    "auto_denied_count": 2,
    "requires_manual_review_count": 5,
    "details": [
      {
        "request_id": "req-001",
        "action": "auto_approved",
        "rule_matched": "rule-vacation-short",
        "reason": "Matched rule: Auto-approve short vacations"
      },
      {
        "request_id": "req-002",
        "action": "auto_denied",
        "reason": "Insufficient PTO balance (has 2 days, needs 5)"
      },
      {
        "request_id": "req-003",
        "action": "requires_manual_review",
        "reason": "No matching auto-approval rule"
      }
    ]
  }
}
```

### Processing Logic

```typescript
For each pending request:
  1. Check auto-approval eligibility
     ↓
  2a. If eligible:
      - Auto-approve via reviewPTORequest
      - Update balance
      - Log action: "auto_approved"
     
  2b. If should auto-deny:
      - Check blocking conflicts
      - Auto-deny if insufficient balance
      - Log action: "auto_denied"
     
  2c. Otherwise:
      - Flag for manual review
      - Add to manager queue
      - Log action: "requires_manual_review"
```

### Dry Run Mode

Use `dry_run: true` to preview automation without making changes:

```http
POST /api/labor-actions/pto/workflow/process-pending
{
  "organization_id": "org-123",
  "dry_run": true
}
```

**Response**: Same format, but no database changes. Useful for:
- Testing new rules before enabling
- Previewing impact of rule changes
- Debugging auto-approval logic

---

## Batch Operations

Batch operations allow managers to approve or deny multiple requests simultaneously.

### Batch Approve

#### Request
```http
POST /api/labor-actions/pto/workflow/batch-approve
Content-Type: application/json

{
  "organization_id": "org-123",
  "request_ids": ["req-001", "req-002", "req-003"],
  "approved_by": "mgr-456",
  "approval_notes": "Approved for Q2 staffing"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "total": 3,
    "approved": 2,
    "failed": 1,
    "results": [
      {
        "request_id": "req-001",
        "success": true,
        "message": "Approved successfully"
      },
      {
        "request_id": "req-002",
        "success": true,
        "message": "Approved successfully"
      },
      {
        "request_id": "req-003",
        "success": false,
        "error": "Insufficient PTO balance"
      }
    ]
  }
}
```

### Batch Deny

#### Request
```http
POST /api/labor-actions/pto/workflow/batch-deny
Content-Type: application/json

{
  "organization_id": "org-123",
  "request_ids": ["req-004", "req-005"],
  "denied_by": "mgr-456",
  "denial_reason": "Coverage requirements not met"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "total": 2,
    "denied": 2,
    "failed": 0,
    "results": [
      {
        "request_id": "req-004",
        "success": true,
        "message": "Denied successfully"
      },
      {
        "request_id": "req-005",
        "success": true,
        "message": "Denied successfully"
      }
    ]
  }
}
```

### Error Handling

Batch operations **continue on failure**:
- Failed requests are logged but don't stop processing
- Partial success is common (e.g., 8/10 approved, 2 failed)
- Check `results` array for per-request status

---

## Approval Delegation

Delegation allows managers to temporarily transfer approval authority (e.g., during vacation).

### Create Delegation

#### Request
```http
POST /api/labor-actions/pto/workflow/delegate
Content-Type: application/json

{
  "organization_id": "org-123",
  "delegator_id": "mgr-456",
  "delegate_id": "mgr-789",
  "start_date": "2026-06-01",
  "end_date": "2026-06-15",
  "department_ids": ["dept-001", "dept-002"],  // Optional
  "reason": "Manager vacation June 1-15",
  "active": true
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "delegation_id": "deleg-001",
    "delegator_id": "mgr-456",
    "delegate_id": "mgr-789",
    "start_date": "2026-06-01",
    "end_date": "2026-06-15",
    "department_ids": ["dept-001", "dept-002"],
    "reason": "Manager vacation June 1-15",
    "active": true,
    "created_at": "2026-05-15T10:30:00Z"
  }
}
```

### Delegation Lifecycle

```
┌──────────────────┐
│ Manager A        │
│ (Out June 1-15)  │
└────────┬─────────┘
         │
         ↓ Delegates to
┌──────────────────┐
│ Manager B        │
│ (Temp Authority) │
└────────┬─────────┘
         │
         ↓ June 1-15
┌──────────────────┐
│ Approves/Denies  │
│ Manager A's Queue│
└────────┬─────────┘
         │
         ↓ After June 15
┌──────────────────┐
│ Auto-Reverts to  │
│ Manager A        │
└──────────────────┘
```

### Delegation Query

When fetching pending approvals, delegations are checked:

```typescript
getPendingApprovals({
  organization_id: "org-123",
  approver_id: "mgr-456",
  include_delegated: true  // Include delegated queues
})
```

**Returns**: Manager's own queue + delegated queues (if active delegation exists).

---

## Manager Dashboard

### Get Pending Approvals

Provides a prioritized summary of pending requests for the manager's review.

#### Request
```http
GET /api/labor-actions/pto/workflow/pending-approvals?organization_id=org-123&approver_id=mgr-456&department_id=dept-001&include_delegated=true
```

#### Response
```json
{
  "success": true,
  "data": {
    "total_pending": 12,
    "oldest_request_age_hours": 72,
    "by_priority": {
      "urgent": 3,    // < 7 days away
      "normal": 5,    // 7-14 days away
      "future": 4     // > 14 days away
    },
    "by_type": {
      "vacation": 8,
      "sick": 2,
      "personal": 2
    },
    "requests": [
      {
        "request_id": "req-001",
        "employee_id": "emp-789",
        "employee_name": "John Doe",
        "pto_type": "vacation",
        "start_date": "2026-05-20",
        "end_date": "2026-05-24",
        "days_requested": 5,
        "requested_at": "2026-05-12T14:30:00Z",
        "priority": "urgent",
        "days_until_start": 5,
        "has_conflicts": true,
        "conflict_reason": "3 team members already out May 20-22"
      },
      {
        "request_id": "req-002",
        "employee_id": "emp-456",
        "employee_name": "Jane Smith",
        "pto_type": "sick",
        "start_date": "2026-05-25",
        "end_date": "2026-05-26",
        "days_requested": 2,
        "requested_at": "2026-05-13T09:15:00Z",
        "priority": "normal",
        "days_until_start": 10,
        "has_conflicts": false
      }
    ]
  }
}
```

### Priority Categorization

| Priority | Days Until Start | Color | Action |
|----------|-----------------|-------|--------|
| **urgent** | < 7 days | 🔴 Red | Review immediately |
| **normal** | 7-14 days | 🟡 Yellow | Review within 24-48 hours |
| **future** | > 14 days | 🟢 Green | Review when convenient |

### Dashboard UI Recommendations

```jsx
// Example React component structure
<Dashboard>
  <SummaryCards>
    <Card title="Total Pending" value={12} />
    <Card title="Urgent" value={3} color="red" />
    <Card title="Oldest Request" value="3 days ago" />
  </SummaryCards>
  
  <Filters>
    <Select name="priority" options={["urgent", "normal", "future"]} />
    <Select name="pto_type" options={["vacation", "sick", "personal"]} />
  </Filters>
  
  <RequestsList>
    {requests.map(req => (
      <RequestCard
        key={req.request_id}
        request={req}
        onApprove={handleApprove}
        onDeny={handleDeny}
        showConflictWarning={req.has_conflicts}
      />
    ))}
  </RequestsList>
  
  <BatchActions>
    <Button onClick={handleBatchApprove}>Approve Selected</Button>
    <Button onClick={handleBatchDeny}>Deny Selected</Button>
  </BatchActions>
</Dashboard>
```

---

## Analytics & Reporting

### Get Approval Analytics

#### Request
```http
GET /api/labor-actions/pto/workflow/analytics?organization_id=org-123&start_date=2026-01-01&end_date=2026-12-31&department_id=dept-001
```

#### Response
```json
{
  "success": true,
  "data": {
    "total_requests": 250,
    "auto_approved": 175,
    "manually_approved": 60,
    "denied": 10,
    "pending": 5,
    "auto_approval_rate": 70.0,
    "avg_approval_time_hours": 18.5,
    "by_approver": [
      {
        "approver_id": "mgr-456",
        "approver_name": "Manager A",
        "total_reviewed": 80,
        "approved": 72,
        "denied": 8,
        "avg_response_time_hours": 12.3
      },
      {
        "approver_id": "mgr-789",
        "approver_name": "Manager B",
        "total_reviewed": 50,
        "approved": 48,
        "denied": 2,
        "avg_response_time_hours": 24.7
      }
    ],
    "by_rule": [
      {
        "rule_id": "rule-001",
        "rule_name": "Auto-approve sick leave",
        "times_triggered": 45,
        "success_rate": 100.0
      },
      {
        "rule_id": "rule-002",
        "rule_name": "Auto-approve short vacations",
        "times_triggered": 130,
        "success_rate": 95.4
      }
    ]
  }
}
```

### Key Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Auto-Approval Rate** | % of requests auto-approved | 60-80% |
| **Avg Approval Time** | Time from request to approval | < 24 hours |
| **Pending Backlog** | Requests awaiting review | < 5% |
| **Denial Rate** | % of requests denied | < 10% |
| **Rule Success Rate** | % rule-matched requests approved | > 90% |

### Analytics Dashboard

```
┌─────────────────────────────────────────┐
│ PTO Approval Analytics (Q2 2026)       │
├─────────────────────────────────────────┤
│                                         │
│  Total Requests: 250                    │
│  Auto-Approved: 175 (70%)              │
│  Manual Approved: 60 (24%)             │
│  Denied: 10 (4%)                       │
│  Pending: 5 (2%)                       │
│                                         │
│  Avg Response Time: 18.5 hours         │
│                                         │
├─────────────────────────────────────────┤
│ Top Performers                          │
│  1. Manager A - 12.3 hour avg          │
│  2. Manager B - 24.7 hour avg          │
│                                         │
├─────────────────────────────────────────┤
│ Top Rules                               │
│  1. Short vacations - 130 triggers     │
│  2. Sick leave - 45 triggers           │
│                                         │
└─────────────────────────────────────────┘
```

---

## API Reference

### Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/pto/workflow/process-pending` | POST | Run automated processing |
| `/pto/workflow/batch-approve` | POST | Bulk approve requests |
| `/pto/workflow/batch-deny` | POST | Bulk deny requests |
| `/pto/workflow/check-auto-approval` | POST | Pre-flight eligibility check |
| `/pto/workflow/pending-approvals` | GET | Manager dashboard data |
| `/pto/workflow/delegate` | POST | Create delegation |
| `/pto/workflow/analytics` | GET | Approval metrics |
| `/pto/workflow/rules` | POST | Create approval rule |
| `/pto/workflow/rules/:id` | PUT | Update approval rule |

### Check Auto-Approval Eligibility

Pre-flight check before submitting request. Shows employee if request will be auto-approved.

#### Request
```http
POST /api/labor-actions/pto/workflow/check-auto-approval
Content-Type: application/json

{
  "organization_id": "org-123",
  "employee_id": "emp-456",
  "department_id": "dept-789",
  "pto_type": "vacation",
  "start_date": "2026-06-01",
  "end_date": "2026-06-03",
  "days_requested": 3
}
```

#### Response (Eligible)
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "rule_matched": "rule-vacation-short",
    "reasons": [
      "Matched rule: Auto-approve short vacations",
      "Request is within 3 day limit",
      "Notice period is 20 days (>= 7 days required)",
      "No blackout dates overlap",
      "Team coverage OK (1 member out, max 2 allowed)"
    ],
    "requires_documentation": false,
    "estimated_approval_time": "immediate"
  }
}
```

#### Response (Not Eligible)
```json
{
  "success": true,
  "data": {
    "eligible": false,
    "reasons": [
      "No matching auto-approval rule found",
      "Request exceeds 3 day limit for short vacations",
      "Requires manual review by manager"
    ],
    "estimated_approval_time": "manual"
  }
}
```

### Estimated Approval Time

| Value | Meaning |
|-------|---------|
| `immediate` | Auto-approved instantly |
| `24_hours` | Manual review, typically within 24 hours |
| `48_hours` | Manual review, typically within 48 hours |
| `manual` | Manual review required, no time estimate |

---

## Database Schema

### pto_auto_approval_rules

Stores auto-approval rule configurations.

```sql
CREATE TABLE pto_auto_approval_rules (
  rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(organization_id),
  department_id UUID REFERENCES departments(department_id),
  rule_name VARCHAR(255) NOT NULL,
  pto_types TEXT[] NOT NULL,  -- Array of PTO type names
  max_days INTEGER,
  max_consecutive_days INTEGER,
  min_notice_days INTEGER,
  auto_approve_sick BOOLEAN DEFAULT FALSE,
  requires_documentation BOOLEAN DEFAULT FALSE,
  blackout_dates DATE[],
  max_team_members_out INTEGER,
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rules_org ON pto_auto_approval_rules(organization_id);
CREATE INDEX idx_rules_dept ON pto_auto_approval_rules(department_id);
CREATE INDEX idx_rules_enabled ON pto_auto_approval_rules(enabled);
CREATE INDEX idx_rules_priority ON pto_auto_approval_rules(priority DESC);
```

### pto_approval_delegations

Stores temporary approval authority transfers.

```sql
CREATE TABLE pto_approval_delegations (
  delegation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(organization_id),
  delegator_id UUID NOT NULL REFERENCES employees(employee_id),
  delegate_id UUID NOT NULL REFERENCES employees(employee_id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  department_ids UUID[],  -- Optional: limit to specific departments
  reason TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delegations_delegator ON pto_approval_delegations(delegator_id);
CREATE INDEX idx_delegations_delegate ON pto_approval_delegations(delegate_id);
CREATE INDEX idx_delegations_dates ON pto_approval_delegations(start_date, end_date);
CREATE INDEX idx_delegations_active ON pto_approval_delegations(active);
```

### pto_requests (Modifications)

Add fields to track auto-approval:

```sql
ALTER TABLE pto_requests
ADD COLUMN auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN rule_matched UUID REFERENCES pto_auto_approval_rules(rule_id),
ADD COLUMN auto_approval_reason TEXT;

CREATE INDEX idx_pto_auto_approved ON pto_requests(auto_approved);
CREATE INDEX idx_pto_rule_matched ON pto_requests(rule_matched);
```

---

## Integration Guide

### Frontend Integration

#### 1. Pre-Submission Check

Show employees if their request will be auto-approved:

```typescript
async function checkAutoApproval(request: PTORequestData) {
  const response = await fetch('/api/labor-actions/pto/workflow/check-auto-approval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  const { data } = await response.json();
  
  if (data.eligible) {
    // Show success message
    showMessage('Your request will be approved immediately!');
  } else {
    // Show manual review message
    showMessage(`Your request requires manager review (${data.estimated_approval_time})`);
  }
}
```

#### 2. Manager Dashboard

```typescript
async function loadPendingApprovals() {
  const response = await fetch(
    `/api/labor-actions/pto/workflow/pending-approvals?` +
    `organization_id=${orgId}&approver_id=${managerId}&include_delegated=true`
  );
  
  const { data } = await response.json();
  
  // Render summary
  renderSummary({
    total: data.total_pending,
    urgent: data.by_priority.urgent,
    oldestAge: data.oldest_request_age_hours
  });
  
  // Render request list
  data.requests.forEach(req => {
    renderRequest(req, {
      showUrgentBadge: req.priority === 'urgent',
      showConflictWarning: req.has_conflicts
    });
  });
}
```

#### 3. Batch Operations

```typescript
async function batchApprove(requestIds: string[]) {
  const response = await fetch('/api/labor-actions/pto/workflow/batch-approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: orgId,
      request_ids: requestIds,
      approved_by: managerId,
      approval_notes: 'Batch approved'
    })
  });
  
  const { data } = await response.json();
  
  // Show results
  showMessage(`Approved ${data.approved}/${data.total} requests`);
  
  // Handle failures
  data.results.filter(r => !r.success).forEach(r => {
    showError(`Failed to approve ${r.request_id}: ${r.error}`);
  });
}
```

### Scheduled Jobs

#### Automated Processing (Cron)

Run every 15 minutes to process pending requests:

```typescript
// cron.ts
import cron from 'node-cron';
import { ptoApprovalWorkflowService } from './services/pto-approval-workflow.service';

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running automated PTO processing...');
  
  // Get all organizations
  const orgs = await getOrganizations();
  
  for (const org of orgs) {
    try {
      const result = await ptoApprovalWorkflowService.processPendingRequests({
        organization_id: org.organization_id,
        dry_run: false
      });
      
      console.log(`Org ${org.organization_id}: Processed ${result.processed_count} requests`);
      console.log(`  Auto-approved: ${result.auto_approved_count}`);
      console.log(`  Manual review: ${result.requires_manual_review_count}`);
    } catch (error) {
      console.error(`Failed to process org ${org.organization_id}:`, error);
    }
  }
});
```

#### Delegation Cleanup

Deactivate expired delegations daily:

```typescript
cron.schedule('0 0 * * *', async () => {
  console.log('Cleaning up expired delegations...');
  
  await supabase
    .from('pto_approval_delegations')
    .update({ active: false })
    .lt('end_date', new Date().toISOString())
    .eq('active', true);
});
```

### Notifications

#### Auto-Approval Notification

```typescript
async function notifyAutoApproval(request: PTORequest) {
  await sendEmail({
    to: request.employee_email,
    subject: 'PTO Request Auto-Approved',
    body: `
      Your ${request.pto_type} request has been automatically approved!
      
      Dates: ${request.start_date} to ${request.end_date}
      Days: ${request.days_requested}
      
      Rule matched: ${request.rule_matched_name}
      
      No further action needed. Enjoy your time off!
    `
  });
}
```

#### Manual Review Notification

```typescript
async function notifyManualReview(request: PTORequest, manager: Employee) {
  await sendEmail({
    to: manager.email,
    subject: 'New PTO Request Awaiting Review',
    body: `
      ${request.employee_name} submitted a ${request.pto_type} request:
      
      Dates: ${request.start_date} to ${request.end_date}
      Days: ${request.days_requested}
      Priority: ${request.priority}
      
      Please review in the manager dashboard.
    `
  });
}
```

---

## Best Practices

### Rule Design

1. **Start with high-value automation**:
   - Sick leave (< 5 days) → 90%+ auto-approval rate
   - Short vacations (< 3 days, good notice) → 70%+ auto-approval rate
   - Personal days (1 day, advance notice) → 80%+ auto-approval rate

2. **Use priority strategically**:
   - Emergency types (sick, bereavement): Priority 90-100
   - Blackout/coverage rules: Priority 70-89
   - Standard vacation: Priority 50-69
   - Department-specific: Priority 30-49

3. **Balance automation with oversight**:
   - Don't auto-approve everything (aim for 60-80% auto-approval)
   - Keep manual review for complex cases (long vacations, peak periods)
   - Use `requires_documentation` for accountability

4. **Test before enabling**:
   ```typescript
   // Test with dry_run first
   const preview = await processPendingRequests({
     organization_id: 'org-123',
     dry_run: true
   });
   
   // Review results
   console.log('Would auto-approve:', preview.auto_approved_count);
   console.log('Would flag for review:', preview.requires_manual_review_count);
   
   // Enable if satisfied
   await updateRule({ rule_id: 'rule-001', enabled: true });
   ```

### Manager Workflow

1. **Daily Review**:
   - Check urgent requests (< 7 days) first
   - Use batch operations for similar requests
   - Address conflicts immediately

2. **Weekly Planning**:
   - Review analytics for bottlenecks
   - Adjust rules based on patterns
   - Update blackout dates for upcoming holidays

3. **Delegation Setup**:
   - Set up delegations 2 weeks before vacation
   - Include all relevant departments
   - Notify delegate and team

### Performance Optimization

1. **Batch Processing**:
   ```typescript
   // Instead of processing one-by-one
   for (const req of requests) {
     await approveRequest(req);  // ❌ Slow
   }
   
   // Use batch operations
   await batchApprove({
     request_ids: requests.map(r => r.request_id),
     approved_by: managerId
   });  // ✅ Fast
   ```

2. **Caching Rules**:
   ```typescript
   // Cache rules for 5 minutes to reduce DB queries
   const ruleCache = new Map<string, PTOAutoApprovalRule[]>();
   
   async function getCachedRules(orgId: string) {
     const cached = ruleCache.get(orgId);
     if (cached && Date.now() - cached.timestamp < 300000) {
       return cached.rules;
     }
     
     const rules = await getApprovalRules(orgId);
     ruleCache.set(orgId, { rules, timestamp: Date.now() });
     return rules;
   }
   ```

3. **Parallel Processing**:
   ```typescript
   // Process multiple orgs in parallel
   const results = await Promise.all(
     orgs.map(org => processPendingRequests({
       organization_id: org.organization_id
     }))
   );
   ```

### Security Considerations

1. **Authorization**:
   - Verify manager has permission for department
   - Check delegation is active and within date range
   - Validate employee belongs to organization

2. **Audit Trail**:
   - Log all auto-approval decisions
   - Track rule changes with timestamps
   - Record delegation history

3. **Rate Limiting**:
   ```typescript
   // Limit batch operations to prevent abuse
   if (request_ids.length > 100) {
     throw new Error('Batch size limited to 100 requests');
   }
   ```

### Monitoring & Alerts

1. **Key Metrics to Monitor**:
   - Auto-approval rate (target: 60-80%)
   - Avg approval time (target: < 24 hours)
   - Pending backlog size (alert if > 50)
   - Rule failure rate (alert if > 10%)

2. **Alerting Rules**:
   ```typescript
   // Alert if approval time exceeds threshold
   if (avgApprovalTimeHours > 48) {
     sendAlert({
       type: 'slow_approvals',
       message: `Avg approval time is ${avgApprovalTimeHours} hours`,
       severity: 'warning'
     });
   }
   
   // Alert if pending queue grows too large
   if (totalPending > 50) {
     sendAlert({
       type: 'large_backlog',
       message: `${totalPending} requests pending approval`,
       severity: 'critical'
     });
   }
   ```

---

## Troubleshooting

### Common Issues

#### Issue: Low Auto-Approval Rate (< 40%)

**Symptoms**: Most requests require manual review.

**Causes**:
- Rules too restrictive (max_days too low, min_notice_days too high)
- Not enough rules configured
- Rules disabled

**Solutions**:
1. Review analytics to find common request patterns
2. Create rules for high-volume scenarios
3. Adjust existing rule thresholds
4. Use dry_run to test rule changes

```typescript
// Example: Identify patterns
const analytics = await getApprovalAnalytics({
  organization_id: 'org-123',
  start_date: '2026-01-01',
  end_date: '2026-12-31'
});

// Find most common denied requests
const deniedByReason = analytics.denied_requests.reduce((acc, req) => {
  acc[req.denial_reason] = (acc[req.denial_reason] || 0) + 1;
  return acc;
}, {});

console.log('Top denial reasons:', deniedByReason);
// Output: { 'Exceeds 3 day limit': 45, 'Insufficient notice': 30, ... }

// Create rule to address top issue
await createApprovalRule({
  organization_id: 'org-123',
  rule_name: 'Auto-approve 5-day vacations',
  pto_types: ['vacation'],
  max_days: 5,  // Increase from 3 to 5
  min_notice_days: 7,
  priority: 50
});
```

#### Issue: Rules Not Matching

**Symptoms**: Requests that should auto-approve require manual review.

**Causes**:
- Rule priority too low (higher priority rule matches first and fails)
- Criteria too strict (one condition failing)
- Rule disabled

**Solutions**:
1. Use check-auto-approval endpoint to debug
2. Review rule evaluation order
3. Check rule enabled status

```typescript
// Debug why request isn't matching
const check = await checkAutoApprovalEligibility({
  organization_id: 'org-123',
  employee_id: 'emp-456',
  department_id: 'dept-789',
  pto_type: 'vacation',
  start_date: '2026-06-01',
  end_date: '2026-06-03',
  days_requested: 3
});

console.log('Eligible:', check.eligible);
console.log('Reasons:', check.reasons);
// Output: 
// Eligible: false
// Reasons: ['No matching rule', 'Exceeds team coverage limit (3/2)']

// Fix: Increase max_team_members_out
await updateApprovalRule({
  rule_id: 'rule-vacation-short',
  max_team_members_out: 5  // Increase from 2 to 5
});
```

#### Issue: Slow Approval Times

**Symptoms**: Avg approval time > 48 hours.

**Causes**:
- Manager not checking dashboard regularly
- Too many manual reviews (low auto-approval rate)
- Large pending backlog

**Solutions**:
1. Increase auto-approval rate with more rules
2. Set up delegation during manager absences
3. Send daily digest emails to managers
4. Use batch operations for efficiency

```typescript
// Daily digest email
cron.schedule('0 8 * * *', async () => {
  const pending = await getPendingApprovals({
    organization_id: 'org-123',
    approver_id: managerId
  });
  
  if (pending.total_pending > 0) {
    sendEmail({
      to: manager.email,
      subject: `You have ${pending.total_pending} PTO requests pending`,
      body: `
        Urgent: ${pending.by_priority.urgent}
        Normal: ${pending.by_priority.normal}
        Future: ${pending.by_priority.future}
        
        Oldest request: ${pending.oldest_request_age_hours} hours ago
        
        [Review Now]
      `
    });
  }
});
```

---

## Migration Guide

### From Manual Approval System

1. **Phase 1: Enable Read-Only Mode** (Week 1)
   - Deploy approval workflow code
   - Create initial rules (disabled)
   - Run dry_run tests
   - Monitor results

2. **Phase 2: Gradual Rollout** (Week 2-3)
   - Enable high-confidence rules (sick leave, short personal days)
   - Monitor auto-approval rate
   - Collect manager feedback

3. **Phase 3: Full Automation** (Week 4)
   - Enable all rules
   - Set up scheduled processing
   - Train managers on batch operations

4. **Phase 4: Optimization** (Week 5+)
   - Analyze metrics
   - Adjust rules based on patterns
   - Add delegation workflows

### Example Migration Plan

```typescript
// Week 1: Create rules (disabled)
const rules = [
  {
    rule_name: 'Auto-approve sick leave',
    pto_types: ['sick'],
    max_days: 5,
    auto_approve_sick: true,
    priority: 100,
    enabled: false  // Disabled initially
  },
  {
    rule_name: 'Auto-approve personal days',
    pto_types: ['personal'],
    max_days: 1,
    min_notice_days: 3,
    priority: 80,
    enabled: false
  }
];

for (const rule of rules) {
  await createApprovalRule(rule);
}

// Week 1: Test with dry_run
const dryRunResult = await processPendingRequests({
  organization_id: 'org-123',
  dry_run: true
});
console.log('Dry run results:', dryRunResult);
// Review: Would auto-approve 75% of requests

// Week 2: Enable sick leave rule
await updateApprovalRule({
  rule_id: 'rule-sick-leave',
  enabled: true
});

// Week 3: Enable personal days rule
await updateApprovalRule({
  rule_id: 'rule-personal-days',
  enabled: true
});

// Week 4: Enable automated processing
cron.schedule('*/15 * * * *', async () => {
  await processPendingRequests({
    organization_id: 'org-123',
    dry_run: false
  });
});

// Week 5+: Monitor and optimize
setInterval(async () => {
  const analytics = await getApprovalAnalytics({
    organization_id: 'org-123',
    start_date: getLastWeek(),
    end_date: new Date()
  });
  
  if (analytics.auto_approval_rate < 60) {
    console.warn('Auto-approval rate below target:', analytics.auto_approval_rate);
    // Review and adjust rules
  }
}, 86400000); // Daily
```

---

## Summary

The PTO Approval Workflow system provides:

✅ **Automated Processing**: Rule-based auto-approval for simple requests  
✅ **Batch Operations**: Approve/deny multiple requests simultaneously  
✅ **Priority Queues**: Urgent/normal/future categorization  
✅ **Delegation**: Temporary authority transfer for manager coverage  
✅ **Analytics**: Auto-approval rates, response times, bottleneck identification  
✅ **Scalability**: Handle high-volume periods effortlessly  
✅ **Audit Trail**: Full tracking of all approval decisions  

**Target Metrics**:
- Auto-approval rate: 60-80%
- Avg approval time: < 24 hours
- Manager time savings: 70%+
- Employee satisfaction: Instant approval for simple requests

For questions or issues, refer to the [API Reference](#api-reference) or [Troubleshooting](#troubleshooting) sections.
