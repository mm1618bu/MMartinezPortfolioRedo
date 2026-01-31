# PTO Approval Workflow Quick Reference

## Table of Contents
- [Core Concepts](#core-concepts)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Common Workflows](#common-workflows)
- [Rule Examples](#rule-examples)
- [Troubleshooting](#troubleshooting)

---

## Core Concepts

### Auto-Approval Rules
Rules define criteria for automatic approval. Evaluated by priority (highest first).

**Key Fields**:
- `pto_types`: Which PTO types (vacation/sick/personal/etc.)
- `max_days`: Maximum days for auto-approval
- `min_notice_days`: Minimum advance notice required
- `max_team_members_out`: Team coverage limit
- `blackout_dates`: Blocked dates (holidays, peak periods)
- `priority`: Evaluation order (higher = first)

### Priority Categories
- **Urgent**: < 7 days away (🔴 Red)
- **Normal**: 7-14 days away (🟡 Yellow)
- **Future**: > 14 days away (🟢 Green)

### Processing Actions
- **auto_approved**: Rule matched, approved instantly
- **auto_denied**: Blocking conflict (insufficient balance)
- **requires_manual_review**: No rule match, needs manager

---

## Quick Start

### 1. Create Your First Rule

```bash
curl -X POST http://localhost:3000/api/labor-actions/pto/workflow/rules \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "rule_name": "Auto-approve sick leave",
    "pto_types": ["sick"],
    "max_days": 5,
    "auto_approve_sick": true,
    "priority": 100,
    "enabled": true
  }'
```

### 2. Test with Dry Run

```bash
curl -X POST http://localhost:3000/api/labor-actions/pto/workflow/process-pending \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "dry_run": true
  }'
```

### 3. Enable Automated Processing

```bash
curl -X POST http://localhost:3000/api/labor-actions/pto/workflow/process-pending \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "dry_run": false
  }'
```

### 4. Check Manager Dashboard

```bash
curl "http://localhost:3000/api/labor-actions/pto/workflow/pending-approvals?organization_id=org-123&approver_id=mgr-456"
```

---

## API Endpoints

### Process Pending Requests
Run automated processing of pending requests.

```http
POST /api/labor-actions/pto/workflow/process-pending
{
  "organization_id": "org-123",
  "department_id": "dept-456",  // Optional
  "dry_run": false
}

Response:
{
  "processed_count": 25,
  "auto_approved_count": 18,
  "auto_denied_count": 2,
  "requires_manual_review_count": 5
}
```

### Batch Approve
Approve multiple requests at once.

```http
POST /api/labor-actions/pto/workflow/batch-approve
{
  "organization_id": "org-123",
  "request_ids": ["req-001", "req-002"],
  "approved_by": "mgr-456",
  "approval_notes": "Approved for Q2"
}

Response:
{
  "total": 2,
  "approved": 2,
  "failed": 0
}
```

### Batch Deny
Deny multiple requests at once.

```http
POST /api/labor-actions/pto/workflow/batch-deny
{
  "organization_id": "org-123",
  "request_ids": ["req-003", "req-004"],
  "denied_by": "mgr-456",
  "denial_reason": "Coverage requirements not met"
}

Response:
{
  "total": 2,
  "denied": 2,
  "failed": 0
}
```

### Check Auto-Approval
Pre-flight check before submission.

```http
POST /api/labor-actions/pto/workflow/check-auto-approval
{
  "organization_id": "org-123",
  "employee_id": "emp-456",
  "department_id": "dept-789",
  "pto_type": "vacation",
  "start_date": "2026-06-01",
  "end_date": "2026-06-03",
  "days_requested": 3
}

Response:
{
  "eligible": true,
  "rule_matched": "rule-vacation-short",
  "estimated_approval_time": "immediate"
}
```

### Get Pending Approvals
Manager dashboard data.

```http
GET /api/labor-actions/pto/workflow/pending-approvals?organization_id=org-123&approver_id=mgr-456

Response:
{
  "total_pending": 12,
  "by_priority": {
    "urgent": 3,
    "normal": 5,
    "future": 4
  },
  "requests": [...]
}
```

### Delegate Approval
Temporary authority transfer.

```http
POST /api/labor-actions/pto/workflow/delegate
{
  "organization_id": "org-123",
  "delegator_id": "mgr-456",
  "delegate_id": "mgr-789",
  "start_date": "2026-06-01",
  "end_date": "2026-06-15",
  "reason": "Manager vacation"
}

Response:
{
  "delegation_id": "deleg-001",
  "active": true
}
```

### Get Analytics
Approval metrics.

```http
GET /api/labor-actions/pto/workflow/analytics?organization_id=org-123&start_date=2026-01-01&end_date=2026-12-31

Response:
{
  "total_requests": 250,
  "auto_approved": 175,
  "auto_approval_rate": 70.0,
  "avg_approval_time_hours": 18.5
}
```

### Create Rule
Create new auto-approval rule.

```http
POST /api/labor-actions/pto/workflow/rules
{
  "organization_id": "org-123",
  "rule_name": "Auto-approve personal days",
  "pto_types": ["personal"],
  "max_days": 1,
  "min_notice_days": 3,
  "priority": 80,
  "enabled": true
}

Response:
{
  "rule_id": "rule-001",
  "enabled": true
}
```

### Update Rule
Modify existing rule.

```http
PUT /api/labor-actions/pto/workflow/rules/{rule_id}
{
  "enabled": false,
  "priority": 90
}

Response:
{
  "rule_id": "rule-001",
  "enabled": false,
  "priority": 90
}
```

---

## Common Workflows

### Manager Daily Routine

```typescript
// 1. Check pending approvals
const pending = await getPendingApprovals({
  organization_id: 'org-123',
  approver_id: 'mgr-456'
});

// 2. Review urgent requests first
const urgent = pending.requests.filter(r => r.priority === 'urgent');

// 3. Batch approve similar requests
const toApprove = urgent.filter(r => !r.has_conflicts);
await batchApprove({
  request_ids: toApprove.map(r => r.request_id),
  approved_by: 'mgr-456'
});

// 4. Handle conflicts individually
const conflicts = urgent.filter(r => r.has_conflicts);
for (const req of conflicts) {
  // Review and decide
}
```

### Employee Pre-Submission Check

```typescript
// Before submitting, check if auto-approved
const check = await checkAutoApproval({
  organization_id: 'org-123',
  employee_id: 'emp-456',
  pto_type: 'vacation',
  start_date: '2026-06-01',
  end_date: '2026-06-03',
  days_requested: 3
});

if (check.eligible) {
  showMessage('✓ Your request will be approved immediately!');
} else {
  showMessage(`⏱ Requires manager review (${check.estimated_approval_time})`);
}

// Submit request
await submitPTORequest({...});
```

### Admin Rule Management

```typescript
// Review current performance
const analytics = await getAnalytics({
  organization_id: 'org-123',
  start_date: getLastMonth(),
  end_date: new Date()
});

if (analytics.auto_approval_rate < 60) {
  // Create rule for common pattern
  await createRule({
    organization_id: 'org-123',
    rule_name: 'Auto-approve short vacations',
    pto_types: ['vacation'],
    max_days: 3,
    min_notice_days: 7,
    priority: 50
  });
}

// Test with dry run
const preview = await processPending({
  organization_id: 'org-123',
  dry_run: true
});

console.log('Would auto-approve:', preview.auto_approved_count);

// Enable if satisfied
await updateRule({
  rule_id: 'rule-001',
  enabled: true
});
```

### Delegation Setup

```typescript
// Before going on vacation
await delegateApproval({
  organization_id: 'org-123',
  delegator_id: 'mgr-456',
  delegate_id: 'mgr-789',
  start_date: '2026-06-01',
  end_date: '2026-06-15',
  department_ids: ['dept-001', 'dept-002'],
  reason: 'Manager vacation June 1-15'
});

// Notify delegate
sendEmail({
  to: delegate.email,
  subject: 'You have been assigned as approver delegate',
  body: 'You will handle approvals for Manager A from June 1-15.'
});
```

---

## Rule Examples

### High-Value Rules (Quick Wins)

#### 1. Auto-Approve Sick Leave
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
**Impact**: 90%+ auto-approval rate for sick leave.

#### 2. Auto-Approve Short Vacations
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
**Impact**: 70%+ auto-approval for short vacations.

#### 3. Auto-Approve Personal Days
```json
{
  "rule_name": "Auto-approve personal days",
  "pto_types": ["personal"],
  "max_days": 1,
  "min_notice_days": 3,
  "priority": 80,
  "enabled": true
}
```
**Impact**: 80%+ auto-approval for personal days.

### Business Protection Rules

#### 4. Block Holiday Blackouts
```json
{
  "rule_name": "Block holiday blackouts",
  "pto_types": ["vacation", "personal"],
  "blackout_dates": [
    "2026-12-24", "2026-12-25", "2026-12-26",
    "2026-11-26", "2026-11-27"
  ],
  "priority": 90,
  "enabled": true
}
```
**Impact**: Prevents auto-approval during peak periods.

#### 5. Enforce Team Coverage
```json
{
  "rule_name": "Limit team coverage",
  "pto_types": ["vacation", "personal"],
  "max_team_members_out": 2,
  "priority": 85,
  "enabled": true
}
```
**Impact**: Prevents understaffing.

### Department-Specific Rules

#### 6. Warehouse Flex Days
```json
{
  "rule_name": "Warehouse auto-approve flex days",
  "department_id": "dept-warehouse-001",
  "pto_types": ["personal", "unpaid"],
  "max_days": 1,
  "min_notice_days": 1,
  "priority": 40,
  "enabled": true
}
```

#### 7. Office Remote Work Days
```json
{
  "rule_name": "Office auto-approve remote work",
  "department_id": "dept-office-001",
  "pto_types": ["other"],
  "max_days": 2,
  "min_notice_days": 1,
  "priority": 30,
  "enabled": true
}
```

### Advanced Rules

#### 8. Require Documentation for Long Leaves
```json
{
  "rule_name": "Document long medical leaves",
  "pto_types": ["sick", "medical"],
  "max_days": 10,
  "requires_documentation": true,
  "priority": 95,
  "enabled": true
}
```

#### 9. Bereavement Auto-Approve
```json
{
  "rule_name": "Auto-approve bereavement",
  "pto_types": ["bereavement"],
  "max_days": 3,
  "auto_approve_sick": true,
  "requires_documentation": true,
  "priority": 98,
  "enabled": true
}
```

---

## Troubleshooting

### Issue: Low Auto-Approval Rate

**Symptoms**: < 40% auto-approval rate

**Quick Fix**:
```typescript
// 1. Check analytics
const analytics = await getAnalytics({...});
console.log('Auto-approval rate:', analytics.auto_approval_rate);

// 2. Find common patterns
const manual = analytics.manually_approved;
const byType = manual.reduce((acc, req) => {
  acc[req.pto_type] = (acc[req.pto_type] || 0) + 1;
  return acc;
}, {});
console.log('Manual reviews by type:', byType);

// 3. Create rule for most common type
await createRule({
  rule_name: `Auto-approve ${mostCommonType}`,
  pto_types: [mostCommonType],
  max_days: 3,
  min_notice_days: 7,
  priority: 50
});
```

### Issue: Rule Not Matching

**Symptoms**: Expected auto-approval but requires manual review

**Debug**:
```typescript
// Use check-auto-approval to see why
const check = await checkAutoApproval({
  organization_id: 'org-123',
  employee_id: 'emp-456',
  pto_type: 'vacation',
  start_date: '2026-06-01',
  end_date: '2026-06-03',
  days_requested: 3
});

console.log('Eligible:', check.eligible);
console.log('Reasons:', check.reasons);
// Output: ['Exceeds team coverage limit (3/2)']

// Fix: Update rule
await updateRule({
  rule_id: 'rule-vacation-short',
  max_team_members_out: 5  // Increase limit
});
```

### Issue: Slow Approvals

**Symptoms**: Avg approval time > 48 hours

**Quick Fix**:
```typescript
// 1. Check pending backlog
const pending = await getPendingApprovals({...});
console.log('Pending:', pending.total_pending);
console.log('Oldest:', pending.oldest_request_age_hours);

// 2. Use batch operations
const toApprove = pending.requests
  .filter(r => !r.has_conflicts)
  .map(r => r.request_id);

await batchApprove({
  request_ids: toApprove,
  approved_by: managerId
});

// 3. Set up delegation if manager unavailable
await delegateApproval({
  delegator_id: managerId,
  delegate_id: backupManagerId,
  start_date: today,
  end_date: tomorrow
});
```

### Issue: Too Many Auto-Approvals

**Symptoms**: Requests being auto-approved that shouldn't be

**Quick Fix**:
```typescript
// 1. Review recent auto-approvals
const analytics = await getAnalytics({
  start_date: getLastWeek(),
  end_date: new Date()
});

const autoApproved = analytics.by_rule;
console.log('Auto-approvals by rule:', autoApproved);

// 2. Disable problematic rule temporarily
await updateRule({
  rule_id: problematicRuleId,
  enabled: false
});

// 3. Adjust criteria
await updateRule({
  rule_id: problematicRuleId,
  max_days: 3,  // Reduce from 5
  min_notice_days: 14,  // Increase from 7
  enabled: true
});
```

---

## Cheat Sheet

### Quick Commands

```bash
# Process pending (dry run)
curl -X POST .../process-pending -d '{"organization_id":"org-123","dry_run":true}'

# Process pending (live)
curl -X POST .../process-pending -d '{"organization_id":"org-123","dry_run":false}'

# Batch approve
curl -X POST .../batch-approve -d '{"organization_id":"org-123","request_ids":["req-1"],"approved_by":"mgr-1"}'

# Check pending
curl ".../pending-approvals?organization_id=org-123&approver_id=mgr-456"

# Get analytics
curl ".../analytics?organization_id=org-123&start_date=2026-01-01&end_date=2026-12-31"

# Create rule
curl -X POST .../rules -d '{"organization_id":"org-123","rule_name":"Test","pto_types":["sick"],"priority":100}'

# Update rule
curl -X PUT .../rules/rule-123 -d '{"enabled":false}'

# Delegate
curl -X POST .../delegate -d '{"organization_id":"org-123","delegator_id":"mgr-1","delegate_id":"mgr-2","start_date":"2026-06-01","end_date":"2026-06-15"}'
```

### Priority Guidelines

| Priority | Use Case |
|----------|----------|
| **90-100** | Emergency types (sick, bereavement) |
| **70-89** | Business protection (blackouts, coverage) |
| **50-69** | Standard automation (vacation, personal) |
| **30-49** | Department-specific rules |
| **10-29** | Low-priority types (unpaid, other) |

### Target Metrics

| Metric | Target |
|--------|--------|
| Auto-approval rate | 60-80% |
| Avg approval time | < 24 hours |
| Pending backlog | < 5% of requests |
| Rule success rate | > 90% |

### Recommended Cron Schedule

```typescript
// Process pending every 15 minutes
cron.schedule('*/15 * * * *', processPending);

// Cleanup delegations daily
cron.schedule('0 0 * * *', cleanupDelegations);

// Send manager digest daily at 8am
cron.schedule('0 8 * * *', sendManagerDigest);

// Generate weekly analytics Monday at 9am
cron.schedule('0 9 * * 1', generateWeeklyReport);
```

---

For detailed documentation, see [PTO_APPROVAL_WORKFLOW_DOCUMENTATION.md](./PTO_APPROVAL_WORKFLOW_DOCUMENTATION.md).
