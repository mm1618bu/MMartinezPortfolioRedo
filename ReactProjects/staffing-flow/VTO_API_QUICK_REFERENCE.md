# VTO API Quick Reference

## 🎯 What is VTO?

**Voluntary Time Off (VTO)** - Employees volunteer to take time off when there's overstaffing or low volume.

- **Purpose**: Reduce labor costs during slow periods
- **Employee Impact**: Takes time off (usually unpaid)
- **Timing**: Often same-day or short notice
- **Selection**: First-come-first-serve, seniority, or random

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/labor-actions/vto
```

### Endpoints Overview

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/publish` | Create VTO offer | Manager |
| PUT | `/:id` | Update VTO offer | Manager |
| GET | `/:id` | Get VTO details | Any |
| POST | `/:id/close` | Close VTO offer | Manager |
| POST | `/:id/cancel` | Cancel VTO offer | Manager |
| POST | `/respond` | Employee responds | Employee |
| GET | `/analytics` | Get VTO metrics | Manager |

---

## 🚀 Quick Start Examples

### 1. Publish VTO Offer

```bash
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "target_date": "2026-02-15",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "positions_available": 3,
    "offer_message": "Low volume - VTO available",
    "posted_by": "manager-456",
    "paid": false,
    "requires_approval": false
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "vto-789",
    "action_type": "VTO",
    "status": "open",
    "positions_available": 3,
    "positions_filled": 0
  },
  "message": "VTO offer published successfully"
}
```

### 2. Employee Accepts VTO

```bash
curl -X POST http://localhost:5000/api/labor-actions/vto/respond \
  -H "Content-Type: application/json" \
  -d '{
    "labor_action_id": "vto-789",
    "employee_id": "emp-123",
    "response_status": "accepted",
    "notes": "Taking time for appointment"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "resp-456",
    "response_status": "accepted",
    "response_time": "2026-02-15T10:05:00Z"
  },
  "message": "Response submitted successfully"
}
```

### 3. Get VTO Details

```bash
curl http://localhost:5000/api/labor-actions/vto/vto-789
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "vto-789",
    "target_date": "2026-02-15",
    "start_time": "2026-02-15T14:00:00Z",
    "end_time": "2026-02-15T22:00:00Z",
    "positions_available": 3,
    "positions_filled": 2,
    "status": "open",
    "paid": false,
    "requires_approval": false,
    "response_count": 5,
    "accepted_count": 2,
    "pending_count": 1,
    "declined_count": 2,
    "responses": [...]
  }
}
```

### 4. Close VTO Offer

```bash
curl -X POST http://localhost:5000/api/labor-actions/vto/vto-789/close \
  -H "Content-Type: application/json" \
  -d '{"closed_by": "manager-456"}'
```

### 5. Get VTO Analytics

```bash
curl "http://localhost:5000/api/labor-actions/vto/analytics?organization_id=org-123&date_from=2026-02-01&date_to=2026-02-28"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_offers": 15,
    "total_positions_offered": 45,
    "positions_taken": 38,
    "acceptance_rate": 84.44,
    "avg_response_time_minutes": 12.5,
    "cost_savings": 15200.50
  }
}
```

---

## 📋 Request Body Schemas

### Publish VTO

```typescript
{
  organization_id: string;          // Required
  department_id?: string;           // Optional
  target_date: string;              // Required - "YYYY-MM-DD"
  start_time: string;               // Required - "HH:MM:SS"
  end_time: string;                 // Required - "HH:MM:SS"
  positions_available: number;      // Required - Must be >= 1
  priority_order?: string;          // Optional - "seniority" | "performance" | "random" | "first_come_first_serve"
  offer_message?: string;           // Optional
  closes_at?: string;               // Optional - ISO datetime
  status?: string;                  // Optional - "draft" | "open" (default: "open")
  posted_by: string;                // Required - User ID
  paid?: boolean;                   // Optional - default: false
  requires_approval?: boolean;      // Optional - default: true
}
```

### Update VTO

```typescript
{
  positions_available?: number;
  priority_order?: string;
  offer_message?: string;
  closes_at?: string;
  status?: string;
  paid?: boolean;
  requires_approval?: boolean;
}
```

### Respond to VTO

```typescript
{
  labor_action_id: string;          // Required
  employee_id: string;              // Required
  response_status: string;          // Required - "accepted" | "declined"
  notes?: string;                   // Optional
}
```

---

## 🎨 Common Patterns

### Same-Day VTO (Urgent)

**Use Case:** Volume drops unexpectedly

```json
{
  "target_date": "2026-02-15",
  "start_time": "15:00:00",
  "end_time": "22:00:00",
  "positions_available": 5,
  "priority_order": "first_come_first_serve",
  "closes_at": "2026-02-15T14:45:00Z",
  "paid": false,
  "requires_approval": false
}
```

**Key Features:**
- ✅ Auto-approve (no manager review)
- ✅ First-come-first-serve (fair and fast)
- ✅ Closes quickly (within 15 minutes)
- ✅ Unpaid VTO (cost savings)

### Planned VTO (Advance Notice)

**Use Case:** Forecasted low volume next week

```json
{
  "target_date": "2026-02-22",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "positions_available": 10,
  "priority_order": "seniority",
  "closes_at": "2026-02-20T17:00:00Z",
  "paid": false,
  "requires_approval": true
}
```

**Key Features:**
- ✅ Requires approval (manager selects)
- ✅ Seniority priority (rewards tenure)
- ✅ Longer response window (2 days)
- ✅ Manager reviews all responses

### Partial Shift VTO

**Use Case:** Need fewer employees for part of shift

```json
{
  "target_date": "2026-02-15",
  "start_time": "18:00:00",
  "end_time": "22:00:00",
  "positions_available": 3,
  "offer_message": "VTO available for last 4 hours"
}
```

### Paid VTO (Retention Strategy)

**Use Case:** Offer paid time off as employee benefit

```json
{
  "target_date": "2026-02-15",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "positions_available": 2,
  "paid": true,
  "requires_approval": true,
  "offer_message": "Paid VTO as thank you for great month"
}
```

---

## ⚡ Priority Order Options

| Option | Description | Best For |
|--------|-------------|----------|
| `first_come_first_serve` | First to respond gets VTO | Same-day urgent VTO |
| `seniority` | Senior employees prioritized | Planned VTO |
| `performance` | High performers prioritized | Retention strategy |
| `random` | Random selection | Fair distribution |

---

## 🔔 Response Status Flow

```
pending → accepted → approved (if requires_approval: true)
       → declined
       → (auto-approved if requires_approval: false)
```

---

## 💰 Cost Savings Calculation

### Unpaid VTO
```javascript
cost_savings = positions_taken × shift_hours × avg_hourly_wage

Example:
5 employees × 8 hours × $18/hr = $720 saved
```

### Paid VTO
```javascript
cost_impact = 0  // No savings (employee still paid)
benefit = employee_satisfaction_increase
```

---

## 📊 Analytics Metrics

### Key Metrics
- **Acceptance Rate** - % employees who accept VTO
- **Response Time** - How fast employees respond
- **Fill Rate** - % of offered positions taken
- **Cost Savings** - Total labor cost saved

### Query Analytics

```bash
GET /vto/analytics?organization_id=org-123&date_from=2026-02-01&date_to=2026-02-28
```

**Returns:**
- Total offers published
- Positions offered vs taken
- Acceptance rate by department
- Top VTO-accepting employees
- Estimated cost savings

---

## ⚠️ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `organization_id is required` | Missing field | Add `organization_id` |
| `positions_available must be at least 1` | Invalid value | Set to 1 or higher |
| `VTO offer not found` | Invalid ID | Check VTO ID |
| `response_status must be "accepted" or "declined"` | Invalid status | Use correct status |

---

## 🔐 Authorization

### Manager Operations
- Publish VTO
- Update VTO
- Close/Cancel VTO
- View analytics

### Employee Operations
- Respond to VTO
- View VTO details (own responses only)

### Public Operations
- None (all endpoints require authentication)

---

## 🧪 Testing Flow

```bash
# 1. Publish VTO
VTO_ID=$(curl -X POST .../vto/publish -d '{...}' | jq -r '.data.id')

# 2. Employee responds
curl -X POST .../vto/respond -d "{\"labor_action_id\": \"$VTO_ID\", ...}"

# 3. Check details
curl .../vto/$VTO_ID

# 4. Get analytics
curl ".../vto/analytics?organization_id=org-123&date_from=2026-02-01&date_to=2026-02-28"

# 5. Close VTO
curl -X POST .../vto/$VTO_ID/close -d '{"closed_by": "manager-456"}'
```

---

## 📚 Related Documentation

- [Full VTO API Documentation](./VTO_API_DOCUMENTATION.md)
- [VET API Documentation](./VET_API_DOCUMENTATION.md)
- [VET Workflow Guide](./VET_WORKFLOW_GUIDE.md)

---

## 💡 Pro Tips

### Maximize Acceptance Rate
1. **Clear Communication** - Explain why VTO is offered
2. **Fair Selection** - Use consistent priority criteria
3. **Quick Responses** - Set reasonable deadlines
4. **Track Usage** - Ensure fair distribution

### Cost Optimization
1. **Unpaid VTO First** - Maximize savings
2. **Monitor Trends** - Learn when VTO is most accepted
3. **Partial Shifts** - Offer VTO for specific hours
4. **Analytics** - Track ROI of VTO program

### Employee Satisfaction
1. **Voluntary** - Never force VTO
2. **Transparent** - Clear about paid/unpaid status
3. **Fair** - Rotate opportunities
4. **Flexible** - Allow decline without penalty

---

**Version**: 1.0.0  
**Last Updated**: January 31, 2026  
**Status**: ✅ Production Ready
