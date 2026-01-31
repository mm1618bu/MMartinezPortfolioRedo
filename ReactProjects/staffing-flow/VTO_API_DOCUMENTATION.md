# VTO (Voluntary Time Off) API - Complete Documentation

## Overview

The VTO API enables organizations to manage **Voluntary Time Off** offers when there is overstaffing. Employees can volunteer to take time off (paid or unpaid), helping organizations reduce labor costs while maintaining operational flexibility.

## 🎯 Use Cases

### When to Offer VTO
- **Overstaffing** - More employees scheduled than needed
- **Low Volume** - Slower than expected customer demand
- **Budget Management** - Need to reduce labor costs
- **Seasonal Adjustments** - Post-peak period staffing reduction
- **Weather Events** - Reduced traffic due to bad weather
- **System Downtime** - Technical issues limiting work capacity

### VTO vs VET

| Feature | VTO (Time Off) | VET (Extra Time) |
|---------|----------------|------------------|
| Purpose | Reduce labor | Increase labor |
| Employee Action | Takes time off | Works extra hours |
| Pay Impact | Usually unpaid (optional paid) | Extra wages earned |
| Urgency | Immediate (same day) | Advance notice typical |
| Approval | Often auto-approved | Priority-based selection |

---

## 📋 Core Concepts

### VTO Offer Lifecycle

```
Draft → Open → Closed/Cancelled
         ↓
    Employees Respond (Accept/Decline)
         ↓
    Manager Reviews/Approves (if required)
         ↓
    Employee Takes Time Off
```

### Key Attributes

- **Paid/Unpaid** - Organizations can offer paid or unpaid VTO
- **Requires Approval** - Optional manager approval step
- **Priority Order** - How to select employees (seniority, performance, random, FCFS)
- **Positions Available** - Number of employees who can take VTO
- **Auto-Close** - Automatically closes when slots filled

---

## 🚀 API Endpoints

### Base URL
```
http://localhost:5000/api/labor-actions
```

---

## 1. Publish VTO Offer

**POST** `/vto/publish`

Create and publish a new VTO offer to employees.

### Request Body

```json
{
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",          // Optional - target specific department
  "shift_template_id": "shift-uuid",     // Optional - use shift template
  "target_date": "2026-02-15",           // Required - ISO date (YYYY-MM-DD)
  "start_time": "14:00:00",              // Required - Time or ISO datetime
  "end_time": "22:00:00",                // Required - Time or ISO datetime
  "positions_available": 3,              // Required - Number of employees who can take VTO
  "priority_order": "seniority",         // Optional - "seniority" | "performance" | "random" | "first_come_first_serve"
  "offer_message": "Low volume - offering VTO for PM shift", // Optional
  "closes_at": "2026-02-15T13:00:00Z",   // Optional - When offer expires
  "status": "open",                      // Optional - "draft" | "open" (default: "open")
  "posted_by": "manager-uuid",           // Required - User ID
  "paid": false,                         // Optional - Paid VTO? (default: false)
  "requires_approval": true              // Optional - Manager approval required? (default: true)
}
```

### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "action_type": "VTO",
    "organization_id": "org-uuid",
    "department_id": "dept-uuid",
    "target_date": "2026-02-15",
    "start_time": "2026-02-15T14:00:00Z",
    "end_time": "2026-02-15T22:00:00Z",
    "positions_available": 3,
    "positions_filled": 0,
    "priority_order": "seniority",
    "offer_message": "Low volume - offering VTO for PM shift",
    "status": "open",
    "posted_by": "manager-uuid",
    "posted_at": "2026-02-15T10:00:00Z",
    "closes_at": "2026-02-15T13:00:00Z",
    "paid": false,
    "requires_approval": true,
    "created_at": "2026-02-15T10:00:00Z",
    "updated_at": "2026-02-15T10:00:00Z"
  },
  "message": "VTO offer published successfully"
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "positions_available must be at least 1"
}
```

---

## 2. Update VTO Offer

**PUT** `/vto/:id`

Update an existing VTO offer.

### Request Body

```json
{
  "positions_available": 5,
  "offer_message": "Updated message - increased slots",
  "closes_at": "2026-02-15T14:00:00Z",
  "status": "open",
  "paid": true,
  "requires_approval": false
}
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "positions_available": 5,
    "offer_message": "Updated message - increased slots",
    "paid": true,
    "requires_approval": false,
    "updated_at": "2026-02-15T11:00:00Z"
  },
  "message": "VTO offer updated successfully"
}
```

---

## 3. Get VTO Offer Details

**GET** `/vto/:id`

Retrieve detailed information about a VTO offer including all employee responses.

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "action_type": "VTO",
    "target_date": "2026-02-15",
    "start_time": "2026-02-15T14:00:00Z",
    "end_time": "2026-02-15T22:00:00Z",
    "department_id": "dept-uuid",
    "department_name": "Fulfillment",
    "positions_available": 3,
    "positions_filled": 2,
    "priority_order": "seniority",
    "offer_message": "Low volume - offering VTO",
    "status": "open",
    "posted_by": "manager-uuid",
    "posted_by_name": "Sarah Manager",
    "posted_at": "2026-02-15T10:00:00Z",
    "closes_at": "2026-02-15T13:00:00Z",
    "paid": false,
    "requires_approval": true,
    "response_count": 5,
    "accepted_count": 3,
    "pending_count": 1,
    "declined_count": 1,
    "waitlisted_count": 0,
    "responses": [
      {
        "id": "resp-1",
        "labor_action_id": "vto-uuid",
        "employee_id": "emp-1",
        "employee_name": "John Smith",
        "employee_number": "12345",
        "response_status": "accepted",
        "response_time": "2026-02-15T10:05:00Z",
        "approved_by": "manager-uuid",
        "approved_at": "2026-02-15T10:10:00Z",
        "notes": "Taking time off for appointment",
        "created_at": "2026-02-15T10:05:00Z",
        "updated_at": "2026-02-15T10:10:00Z"
      },
      {
        "id": "resp-2",
        "labor_action_id": "vto-uuid",
        "employee_id": "emp-2",
        "employee_name": "Jane Doe",
        "employee_number": "12346",
        "response_status": "pending",
        "response_time": "2026-02-15T10:08:00Z",
        "notes": null
      },
      {
        "id": "resp-3",
        "labor_action_id": "vto-uuid",
        "employee_id": "emp-3",
        "employee_name": "Bob Wilson",
        "employee_number": "12347",
        "response_status": "declined",
        "response_time": "2026-02-15T10:12:00Z",
        "notes": "Need the hours"
      }
    ]
  }
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "VTO offer not found"
}
```

---

## 4. Close VTO Offer

**POST** `/vto/:id/close`

Manually close a VTO offer (no more responses accepted).

### Request Body

```json
{
  "closed_by": "manager-uuid"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "status": "closed",
    "updated_at": "2026-02-15T13:00:00Z"
  },
  "message": "VTO offer closed successfully"
}
```

---

## 5. Cancel VTO Offer

**POST** `/vto/:id/cancel`

Cancel a VTO offer (revokes existing approvals).

### Request Body

```json
{
  "cancelled_by": "manager-uuid"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "status": "cancelled",
    "updated_at": "2026-02-15T12:00:00Z"
  },
  "message": "VTO offer cancelled successfully"
}
```

---

## 6. Employee Responds to VTO

**POST** `/vto/respond`

Employee accepts or declines VTO offer.

### Request Body

```json
{
  "labor_action_id": "vto-uuid",
  "employee_id": "emp-uuid",
  "response_status": "accepted",           // "accepted" | "declined"
  "notes": "Need time for personal errands"
}
```

### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "resp-uuid",
    "labor_action_id": "vto-uuid",
    "employee_id": "emp-uuid",
    "response_status": "accepted",
    "response_time": "2026-02-15T10:15:00Z",
    "notes": "Need time for personal errands",
    "created_at": "2026-02-15T10:15:00Z",
    "updated_at": "2026-02-15T10:15:00Z"
  },
  "message": "Response submitted successfully"
}
```

### Update Existing Response

If employee already responded, the endpoint updates the existing response:

```json
{
  "success": true,
  "data": {
    "id": "resp-uuid",
    "response_status": "declined",
    "response_time": "2026-02-15T11:00:00Z",
    "updated_at": "2026-02-15T11:00:00Z"
  },
  "message": "Response updated successfully"
}
```

---

## 7. Get VTO Analytics

**GET** `/vto/analytics`

Retrieve VTO analytics and metrics.

### Query Parameters

```
?organization_id=org-uuid
&department_id=dept-uuid        // Optional
&date_from=2026-02-01
&date_to=2026-02-28
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "total_offers": 15,
    "total_positions_offered": 45,
    "positions_taken": 38,
    "acceptance_rate": 84.44,
    "avg_response_time_minutes": 12.5,
    "offers_by_status": {
      "draft": 0,
      "open": 3,
      "closed": 10,
      "cancelled": 2
    },
    "responses_by_status": {
      "accepted": 38,
      "declined": 15,
      "pending": 5,
      "waitlisted": 0
    },
    "top_accepting_employees": [
      {
        "employee_id": "emp-1",
        "employee_name": "John Smith",
        "vto_count": 8
      },
      {
        "employee_id": "emp-2",
        "employee_name": "Jane Doe",
        "vto_count": 6
      }
    ],
    "department_breakdown": [
      {
        "department_id": "dept-1",
        "department_name": "Fulfillment",
        "offers_count": 10,
        "acceptance_rate": 85.0
      },
      {
        "department_id": "dept-2",
        "department_name": "Customer Service",
        "offers_count": 5,
        "acceptance_rate": 82.5
      }
    ],
    "cost_savings": 15200.50
  }
}
```

---

## 📊 Common Workflows

### Workflow 1: Same-Day VTO (Immediate)

**Scenario:** Volume drops unexpectedly, need to send employees home early

```bash
# 1. Manager publishes VTO (auto-approve, no approval required)
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "department_id": "fulfillment",
    "target_date": "2026-02-15",
    "start_time": "15:00:00",
    "end_time": "22:00:00",
    "positions_available": 5,
    "priority_order": "first_come_first_serve",
    "offer_message": "Low volume - VTO available for rest of shift",
    "closes_at": "2026-02-15T14:45:00Z",
    "posted_by": "manager-1",
    "paid": false,
    "requires_approval": false
  }'

# 2. Employees respond immediately (push notifications sent)
curl -X POST http://localhost:5000/api/labor-actions/vto/respond \
  -H "Content-Type: application/json" \
  -d '{
    "labor_action_id": "vto-uuid",
    "employee_id": "emp-1",
    "response_status": "accepted"
  }'

# 3. First 5 acceptances are auto-approved
# 4. VTO closes automatically when filled
```

### Workflow 2: Planned VTO (Advance Notice)

**Scenario:** Forecast shows low volume next week, proactively offer VTO

```bash
# 1. Manager publishes VTO 5 days in advance
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "target_date": "2026-02-20",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "positions_available": 10,
    "priority_order": "seniority",
    "offer_message": "Low forecasted volume - VTO available",
    "closes_at": "2026-02-18T17:00:00Z",
    "posted_by": "manager-1",
    "paid": false,
    "requires_approval": true
  }'

# 2. Employees have 3 days to respond
# 3. Manager reviews and approves based on priority
curl -X POST http://localhost:5000/api/labor-actions/vet/approve \
  -H "Content-Type: application/json" \
  -d '{
    "response_id": "resp-1",
    "approved": true,
    "approved_by": "manager-1"
  }'
```

### Workflow 3: Partial Shift VTO

**Scenario:** Need fewer employees for second half of shift

```bash
# Offer VTO for partial shift (last 4 hours)
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "target_date": "2026-02-15",
    "start_time": "18:00:00",
    "end_time": "22:00:00",
    "positions_available": 3,
    "offer_message": "VTO available for last 4 hours of shift",
    "posted_by": "manager-1",
    "paid": false
  }'
```

---

## 💡 Best Practices

### 1. Communication

**Clear Messaging:**
```json
{
  "offer_message": "Low customer volume due to weather. Offering unpaid VTO for remainder of shift (3.5 hours). Response needed by 2:00 PM."
}
```

**Include:**
- Reason for VTO (transparency)
- Paid or unpaid status
- Duration (hours affected)
- Response deadline
- Selection criteria

### 2. Fair Distribution

**Track VTO Usage:**
```javascript
// Monitor who takes VTO most frequently
GET /vto/analytics?date_from=2026-01-01&date_to=2026-02-28

// Adjust priority_order to balance:
{
  "priority_order": "random"  // Give everyone equal chance
}
```

**Avoid VTO Monopolization:**
- Track VTO hours per employee
- Set monthly VTO limits
- Rotate priority between seniority and random

### 3. Approval Strategy

**Auto-Approve for:**
- Same-day needs (urgent)
- Positions easily covered
- First-come-first-serve offers

**Require Approval for:**
- Advance-notice VTO
- Critical skill positions
- Department-wide impacts
- Paid VTO offers

### 4. Financial Tracking

**Cost Savings Calculation:**
```javascript
// Unpaid VTO = Direct labor savings
cost_savings = positions_taken × (shift_hours × hourly_wage)

// Example:
// 5 employees × (4 hours × $18/hr) = $360 saved
```

### 5. Employee Experience

**Quick Responses:**
- Push notifications for VTO offers
- Mobile-friendly response interface
- Immediate confirmation
- Clear status updates

**Fair Selection:**
- Transparent priority criteria
- Consistent application of rules
- No favoritism
- Audit trail

---

## 🔔 Notification Templates

### VTO Offered Notification

```
Subject: VTO Available - February 15, 2026

VTO (Voluntary Time Off) is available for:
- Date: February 15, 2026
- Time: 2:00 PM - 10:00 PM
- Type: Unpaid
- Slots: 3 available

Reason: Low customer volume

If interested, please respond by 1:00 PM.
Selection: First come, first served
```

### VTO Accepted Notification

```
Subject: VTO Approved - February 15, 2026

Your VTO request has been approved!

You are excused from:
- February 15, 2026
- 2:00 PM - 10:00 PM (8 hours)
- Type: Unpaid

Please confirm receipt. Contact your manager with questions.
```

### VTO Declined Notification

```
Subject: VTO Request Status

Your VTO request for February 15, 2026 (PM shift) could not be approved.

Reason: All VTO slots have been filled

You are scheduled to work your regular shift.
```

---

## ⚠️ Error Codes

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `organization_id is required` | Missing required field |
| 400 | `positions_available must be at least 1` | Invalid value |
| 400 | `response_status must be "accepted" or "declined"` | Invalid status |
| 404 | `VTO offer not found` | Invalid VTO ID |
| 500 | `Internal server error` | Server exception |

---

## 🔒 Security Considerations

### Authorization

```javascript
// Manager-only operations
POST /vto/publish          // Manager role required
PUT /vto/:id               // Manager role + ownership check
POST /vto/:id/close        // Manager role + ownership check
POST /vto/:id/cancel       // Manager role + ownership check

// Employee operations
POST /vto/respond          // Employee can only respond for self
GET /vto/:id               // Employee sees only their responses
```

### Data Validation

- Validate `organization_id` matches authenticated user
- Ensure `target_date` is not in past (except same-day VTO)
- Verify `employee_id` exists and is active
- Check `positions_available` > 0
- Validate time ranges (end_time > start_time)

---

## 📈 Metrics to Track

### Operational Metrics
- **Acceptance Rate** - % of employees who accept VTO
- **Response Time** - How quickly employees respond
- **Fill Rate** - % of offered positions taken
- **Same-Day VTO** - Frequency of urgent VTO

### Financial Metrics
- **Labor Cost Savings** - Total saved from unpaid VTO
- **Cost Per VTO Hour** - Average savings per hour
- **Paid VTO Cost** - Total cost of paid VTO

### Employee Metrics
- **VTO Frequency** - VTO hours per employee
- **Distribution Fairness** - VTO spread across workforce
- **Decline Rate** - % who decline VTO offers

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] **VTO Preferences** - Employees opt-in to VTO notifications
- [ ] **Automatic VTO Triggers** - Auto-publish when volume drops
- [ ] **VTO Balance Tracking** - Track paid/unpaid VTO hours used
- [ ] **Skills-Based Selection** - Consider cross-training coverage
- [ ] **Integration with Scheduling** - Auto-update schedules
- [ ] **Mobile Push Notifications** - Real-time VTO alerts
- [ ] **VTO Points System** - Gamify VTO acceptance
- [ ] **Predictive VTO** - ML forecasts VTO needs

---

## 📚 Related APIs

- [VET API Documentation](./VET_API_DOCUMENTATION.md) - Voluntary Extra Time
- [VET Workflow Guide](./VET_WORKFLOW_GUIDE.md) - Acceptance automation
- [Labor Actions Routes](./api/routes/labor-actions.routes.ts) - Full route definitions

---

## 🧪 Testing

### Test Scenario: Publish and Accept VTO

```bash
# Step 1: Publish VTO
RESPONSE=$(curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "test-org",
    "target_date": "2026-02-20",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "positions_available": 3,
    "posted_by": "manager-test",
    "paid": false,
    "requires_approval": false
  }')

VTO_ID=$(echo $RESPONSE | jq -r '.data.id')

# Step 2: Employee responds
curl -X POST http://localhost:5000/api/labor-actions/vto/respond \
  -H "Content-Type: application/json" \
  -d "{
    \"labor_action_id\": \"$VTO_ID\",
    \"employee_id\": \"emp-test-1\",
    \"response_status\": \"accepted\"
  }"

# Step 3: Get VTO details
curl http://localhost:5000/api/labor-actions/vto/$VTO_ID

# Step 4: Close VTO
curl -X POST http://localhost:5000/api/labor-actions/vto/$VTO_ID/close \
  -H "Content-Type: application/json" \
  -d '{"closed_by": "manager-test"}'
```

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 31, 2026  
**API Base**: `/api/labor-actions/vto`
