# VET Acceptance Workflow - Complete Guide

## Overview

The VET Acceptance Workflow automates the processing of employee responses to VET (Voluntary Extra Time) offers using intelligent priority scoring, automatic approvals, and waitlist management.

## 🎯 Key Features

### Automated Processing
- ✅ **Priority-Based Scoring** - Ranks employees using 7 weighted factors
- ✅ **Auto-Approval** - Automatically approves qualified responses
- ✅ **Smart Waitlisting** - Manages waitlist when positions fill
- ✅ **Auto-Close** - Closes offers when capacity reached
- ✅ **Batch Operations** - Approve/reject multiple responses at once
- ✅ **Notifications** - Automated status updates to employees

### Priority Scoring System
Employees are scored (0-100) using weighted factors:
- **Seniority** (25%) - Years of service
- **Performance** (20%) - Performance rating
- **Attendance** (15%) - Attendance record  
- **History** (15%) - Previous VET participation
- **Recency** (10%) - Time since last VET
- **Speed** (10%) - Response time
- **Skills** (5%) - Skills match for the role

---

## 📊 Workflow Configuration

### Default Configuration

```typescript
{
  auto_approve_enabled: true,        // Auto-approve qualified responses
  auto_waitlist_enabled: true,       // Auto-add to waitlist when full
  auto_close_when_filled: true,      // Close offer when filled
  send_notifications: true,          // Send status notifications
  priority_scoring_enabled: true,    // Use priority scoring
  max_waitlist_size: 20,            // Maximum waitlist entries
  approval_timeout_minutes: 1440     // 24 hours
}
```

### Priority Weights

```typescript
{
  seniority: 0.25,     // 25% weight
  performance: 0.20,   // 20% weight
  attendance: 0.15,    // 15% weight
  history: 0.15,       // 15% weight
  recency: 0.10,       // 10% weight
  speed: 0.10,         // 10% weight
  skills: 0.05         // 5% weight
}
```

---

## 🔄 Workflow Process

### Step 1: Employee Response
```
Employee sees VET offer → Accepts/Declines → Response status = "pending"
```

### Step 2: Priority Scoring
```
System calculates priority score based on:
- Seniority: Years of service (0-10+ years = 0-100 points)
- Performance: Rating from HR system
- Attendance: Historical attendance rate
- History: Number of previously accepted VETs
- Recency: Days since last VET worked
- Speed: Minutes to respond to offer
- Skills: Match against required qualifications
```

### Step 3: Automated Processing
```
FOR each pending response (sorted by priority score):
  IF positions available AND auto-approve enabled:
    IF priority score >= 60:
      → APPROVE (status = "accepted")
      → Send approval notification
    ELSE:
      → HOLD (status = "pending")
      → Requires manual review
  
  ELSE IF no positions available AND auto-waitlist enabled:
    IF waitlist not full:
      → WAITLIST (status = "waitlisted")
      → Send waitlist notification
    ELSE:
      → REJECT (status = "declined")
      → Send rejection notification
```

### Step 4: Post-Processing
```
- Update positions_filled count
- IF auto_close_when_filled AND all positions filled:
    → Close offer
- Send summary notification to manager
```

---

## 🚀 API Endpoints

### 1. Process Responses (Automated Workflow)

**POST** `/api/labor-actions/vet/:id/process`

Execute automated workflow for all pending responses.

#### Request Body

```json
{
  "processed_by": "manager-uuid",
  "workflow_config": {
    "auto_approve_enabled": true,
    "auto_waitlist_enabled": true,
    "auto_close_when_filled": true,
    "send_notifications": true,
    "max_waitlist_size": 20
  },
  "priority_weights": {
    "seniority": 0.25,
    "performance": 0.20,
    "attendance": 0.15,
    "history": 0.15,
    "recency": 0.10,
    "speed": 0.10,
    "skills": 0.05
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "success": true,
    "labor_action_id": "vet-uuid",
    "total_responses": 15,
    "processed_count": 15,
    "approved_count": 5,
    "waitlisted_count": 7,
    "rejected_count": 1,
    "no_action_count": 2,
    "positions_filled": 5,
    "positions_available": 5,
    "offer_closed": true,
    "processing_details": [
      {
        "response_id": "resp-1",
        "employee_id": "emp-1",
        "employee_name": "John Smith",
        "original_status": "pending",
        "new_status": "accepted",
        "priority_score": 87.5,
        "action_taken": "approved",
        "reason": "Auto-approved: Priority score 87.5 meets threshold"
      }
    ],
    "notifications_sent": 13,
    "execution_time_ms": 1250
  },
  "message": "Workflow executed successfully"
}
```

---

### 2. Batch Approve Responses

**POST** `/api/labor-actions/vet/:id/batch-approve`

Approve multiple responses at once.

#### Request Body

```json
{
  "response_ids": ["resp-1", "resp-2", "resp-3"],
  "approved_by": "manager-uuid",
  "notes": "Approved for excellent performance"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "success": true,
    "total_requested": 3,
    "successful_count": 3,
    "failed_count": 0,
    "results": [
      { "response_id": "resp-1", "success": true },
      { "response_id": "resp-2", "success": true },
      { "response_id": "resp-3", "success": true }
    ]
  }
}
```

---

### 3. Batch Reject Responses

**POST** `/api/labor-actions/vet/:id/batch-reject`

Reject multiple responses at once.

#### Request Body

```json
{
  "response_ids": ["resp-4", "resp-5"],
  "rejected_by": "manager-uuid",
  "reason": "Positions filled by higher priority candidates"
}
```

---

### 4. Get Workflow Status

**GET** `/api/labor-actions/vet/:id/workflow-status`

Check current workflow state for a VET offer.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "labor_action_id": "vet-uuid",
    "offer_status": "open",
    "positions_available": 5,
    "positions_filled": 3,
    "pending_responses": 5,
    "approved_responses": 3,
    "waitlisted_responses": 2,
    "workflow_enabled": true,
    "last_processed_at": "2026-01-31T10:30:00Z"
  }
}
```

---

### 5. Process Waitlist

**POST** `/api/labor-actions/vet/:id/process-waitlist`

Promote waitlisted employees when positions become available.

#### Request Body

```json
{
  "positions_available": 2
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "promoted_count": 2,
    "promoted_employees": [
      {
        "employee_id": "emp-5",
        "employee_name": "Jane Doe",
        "from_position": 1
      },
      {
        "employee_id": "emp-7",
        "employee_name": "Bob Johnson",
        "from_position": 2
      }
    ],
    "remaining_waitlist": 3
  }
}
```

---

## 📈 Priority Scoring Examples

### Example 1: Senior Employee - Fast Response

```
Employee: John Smith
- Seniority: 8 years → Score: 80
- Performance: 92/100 → Score: 92
- Attendance: 98% → Score: 98
- VET History: 12 accepted → Score: 60
- Last VET: 45 days ago → Score: 100
- Response Time: 3 minutes → Score: 100
- Skills Match: 100% → Score: 100

Weighted Total = (80×0.25) + (92×0.20) + (98×0.15) + (60×0.15) + 
                 (100×0.10) + (100×0.10) + (100×0.05)
               = 20 + 18.4 + 14.7 + 9 + 10 + 10 + 5
               = 87.1 points

Result: AUTO-APPROVED ✅
```

### Example 2: New Employee - Slow Response

```
Employee: Sarah New
- Seniority: 6 months → Score: 5
- Performance: 75/100 → Score: 75
- Attendance: 100% → Score: 100
- VET History: 0 accepted → Score: 0
- Last VET: Never → Score: 100
- Response Time: 90 minutes → Score: 0
- Skills Match: 80% → Score: 80

Weighted Total = (5×0.25) + (75×0.20) + (100×0.15) + (0×0.15) + 
                 (100×0.10) + (0×0.10) + (80×0.05)
               = 1.25 + 15 + 15 + 0 + 10 + 0 + 4
               = 45.25 points

Result: MANUAL REVIEW REQUIRED ⏸️
```

---

## 🔔 Notifications

### Notification Types

| Event | Recipient | Priority | Channels |
|-------|-----------|----------|----------|
| Response Approved | Employee | High | Email, Push, In-App |
| Added to Waitlist | Employee | Normal | Email, Push, In-App |
| Promoted from Waitlist | Employee | High | Email, SMS, Push |
| Response Rejected | Employee | Normal | Email, In-App |
| Offer Closed | Manager | Normal | Email, In-App |
| Manual Review Needed | Manager | High | Email, Push |

### Sample Notification (Approval)

```
Subject: VET Approved for February 15, 2026

Your VET request for February 15, 2026 (2:00 PM - 10:00 PM) 
has been approved! 

Auto-approved: Priority score 87.5 meets threshold

Please confirm your attendance by February 14.
```

---

## 🧪 Testing the Workflow

### Test Scenario 1: Simple Auto-Approval

```bash
# 1. Create VET with 3 positions
curl -X POST http://localhost:5000/api/labor-actions/vet/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "target_date": "2026-02-15",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "positions_available": 3,
    "posted_by": "manager-1"
  }'

# 2. Employees respond
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/labor-actions/vet/respond \
    -H "Content-Type: application/json" \
    -d "{
      \"labor_action_id\": \"vet-uuid\",
      \"employee_id\": \"emp-$i\",
      \"response_status\": \"accepted\"
    }"
done

# 3. Run workflow
curl -X POST http://localhost:5000/api/labor-actions/vet/vet-uuid/process \
  -H "Content-Type: application/json" \
  -d '{
    "processed_by": "manager-1"
  }'

# Expected Result:
# - Top 3 scored employees: APPROVED
# - Next 2: WAITLISTED (if enabled)
```

### Test Scenario 2: Batch Operations

```bash
# Approve specific employees
curl -X POST http://localhost:5000/api/labor-actions/vet/vet-uuid/batch-approve \
  -H "Content-Type: application/json" \
  -d '{
    "response_ids": ["resp-1", "resp-2", "resp-3"],
    "approved_by": "manager-1",
    "notes": "Selected for skills match"
  }'
```

---

## 💡 Best Practices

### 1. Configure Weights Based on Business Needs

**Customer Service Roles:**
```json
{
  "performance": 0.30,    // Prioritize performance
  "attendance": 0.25,     // High attendance critical
  "seniority": 0.20,
  "speed": 0.15,          // Quick response valued
  "history": 0.05,
  "recency": 0.03,
  "skills": 0.02
}
```

**Warehouse Roles:**
```json
{
  "seniority": 0.30,      // Experience valued
  "attendance": 0.25,     // Reliability key
  "skills": 0.20,         // Physical capabilities
  "performance": 0.15,
  "history": 0.05,
  "speed": 0.03,
  "recency": 0.02
}
```

### 2. Monitor Workflow Performance

Track metrics:
- Average processing time
- Auto-approval rate
- Employee acceptance rate by priority score
- Waitlist promotion rate
- Manager override frequency

### 3. Adjust Thresholds

- **Low auto-approval rate?** → Lower min score from 60 to 50
- **Too many waitlisted?** → Increase max_waitlist_size
- **Positions not filling?** → Adjust priority weights
- **Too many manual reviews?** → Lower approval threshold

### 4. Fair Distribution

Use recency factor to ensure:
- Employees who haven't worked VET recently get priority
- Regular VET workers don't monopolize opportunities
- New employees get fair chances

### 5. Communication

- Always send notifications for status changes
- Explain rejection reasons clearly
- Provide feedback on priority scores
- Set clear expectations about timeline

---

## 🔧 Customization Options

### Custom Auto-Approval Rules

```typescript
// Future enhancement: Define custom rules
{
  "rule_name": "Senior Performers",
  "conditions": [
    { "field": "seniority", "operator": "gte", "value": 5, "required": true },
    { "field": "performance", "operator": "gte", "value": 80, "required": true }
  ],
  "auto_approve": true
}
```

### Department-Specific Scoring

```typescript
// Future enhancement: Override weights by department
{
  "department_id": "fulfillment",
  "weights": {
    "attendance": 0.40,  // Higher weight for fulfillment
    "speed": 0.20,
    ...
  }
}
```

---

## 📊 Workflow Analytics

### Key Metrics to Track

1. **Processing Efficiency**
   - Average execution time
   - Responses processed per minute
   - Error rate

2. **Approval Rates**
   - Auto-approval percentage
   - Manual review percentage
   - Rejection percentage

3. **Employee Satisfaction**
   - Average priority score
   - Acceptance rate by score range
   - Waitlist conversion rate

4. **Business Impact**
   - Fill rate improvement
   - Time to fill reduction
   - Manager time saved

---

## 🚨 Troubleshooting

### Issue: Low Auto-Approval Rate

**Symptoms:** Most responses require manual review

**Solutions:**
1. Lower minimum priority score threshold
2. Adjust priority weights to favor more factors
3. Review scoring algorithm accuracy

### Issue: Unfair Distribution

**Symptoms:** Same employees always selected

**Solutions:**
1. Increase recency weight
2. Cap maximum VETs per employee per month
3. Implement rotation logic

### Issue: Slow Workflow Execution

**Symptoms:** Processing takes > 5 seconds

**Solutions:**
1. Optimize database queries
2. Cache employee data
3. Process in smaller batches
4. Use background job queue

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] ML-based priority scoring
- [ ] Predictive acceptance likelihood
- [ ] Automated scheduling conflict detection
- [ ] Skills-based matching engine
- [ ] Employee preference learning
- [ ] Dynamic weight adjustment
- [ ] Integration with payroll limits
- [ ] Union rule compliance checking

---

## 📚 Related Documentation

- [VET API Documentation](./VET_API_DOCUMENTATION.md)
- [VET Quick Reference](./VET_API_QUICK_REFERENCE.md)
- [VET Implementation Summary](./VET_API_IMPLEMENTATION.md)

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 31, 2026
