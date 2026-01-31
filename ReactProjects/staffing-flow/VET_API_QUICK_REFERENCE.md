# VET Publishing API - Quick Reference

## 🚀 Quick Start

### Base URL
```
/api/labor-actions
```

### Authentication
```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Common Operations

### 1️⃣ Publish VET Offer

**Endpoint:** `POST /api/labor-actions/vet/publish`

**Minimal Request:**
```json
{
  "organization_id": "uuid",
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "positions_available": 5,
  "posted_by": "user-uuid"
}
```

**Full Request:**
```json
{
  "organization_id": "uuid",
  "department_id": "uuid",
  "shift_template_id": "uuid",
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "positions_available": 5,
  "priority_order": "first_come_first_serve",
  "offer_message": "Need extra coverage",
  "closes_at": "2026-02-14T23:59:59Z",
  "status": "open",
  "posted_by": "user-uuid"
}
```

---

### 2️⃣ List VET Offers

**Endpoint:** `GET /api/labor-actions/vet`

**Query Parameters:**
```
?organization_id=uuid
&status=open
&target_date_from=2026-02-01
&target_date_to=2026-02-28
&limit=20
&offset=0
```

**cURL Example:**
```bash
curl -X GET "https://api.example.com/api/labor-actions/vet?organization_id=abc123&status=open" \
  -H "Authorization: Bearer <token>"
```

---

### 3️⃣ Get VET Details

**Endpoint:** `GET /api/labor-actions/vet/:id`

**cURL Example:**
```bash
curl -X GET "https://api.example.com/api/labor-actions/vet/vet-uuid" \
  -H "Authorization: Bearer <token>"
```

---

### 4️⃣ Employee Responds

**Endpoint:** `POST /api/labor-actions/vet/respond`

**Request:**
```json
{
  "labor_action_id": "vet-uuid",
  "employee_id": "emp-uuid",
  "response_status": "accepted",
  "notes": "I'm available!"
}
```

**cURL Example:**
```bash
curl -X POST "https://api.example.com/api/labor-actions/vet/respond" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "labor_action_id": "vet-uuid",
    "employee_id": "emp-uuid",
    "response_status": "accepted"
  }'
```

---

### 5️⃣ Approve Employee Response

**Endpoint:** `POST /api/labor-actions/vet/response/approve`

**Request:**
```json
{
  "response_id": "response-uuid",
  "approved": true,
  "approved_by": "manager-uuid",
  "notes": "Approved"
}
```

---

### 6️⃣ Get Analytics

**Endpoint:** `GET /api/labor-actions/vet/analytics`

**Query Parameters:**
```
?organization_id=uuid
&date_from=2026-01-01
&date_to=2026-01-31
```

---

## 🎯 Priority Orders

| Value | Description |
|-------|-------------|
| `seniority` | Senior employees get priority |
| `performance` | Based on performance metrics |
| `random` | Random selection |
| `first_come_first_serve` | First to respond wins |

---

## 📊 Status Values

### VET Offer Status
- `draft` - Not yet published
- `open` - Accepting responses
- `closed` - No longer accepting responses
- `cancelled` - Offer cancelled

### Response Status
- `accepted` - Employee accepted and approved
- `declined` - Employee declined
- `pending` - Awaiting manager approval
- `waitlisted` - On waitlist

---

## 🔄 Typical Workflow

```
1. Manager publishes VET
   POST /vet/publish
   
2. Employees see active offers
   GET /vet/active
   
3. Employee responds
   POST /vet/respond
   
4. Manager reviews responses
   GET /vet/:id/responses
   
5. Manager approves employees
   POST /vet/response/approve
   
6. Manager closes offer
   POST /vet/:id/close
```

---

## ⚡ Quick Actions

### Update VET Positions
```json
PUT /api/labor-actions/vet/:id
{
  "positions_available": 10
}
```

### Close VET
```json
POST /api/labor-actions/vet/:id/close
{
  "closed_by": "manager-uuid"
}
```

### Cancel VET
```json
POST /api/labor-actions/vet/:id/cancel
{
  "cancelled_by": "manager-uuid"
}
```

### Check Eligibility
```json
POST /api/labor-actions/vet/check-eligibility
{
  "employee_id": "emp-uuid",
  "labor_action_id": "vet-uuid"
}
```

---

## 🔍 Response Examples

### Successful Response
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

### List Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 📝 Field Requirements

### Publishing VET (Required)
✅ `organization_id`  
✅ `target_date`  
✅ `start_time`  
✅ `end_time`  
✅ `positions_available` (≥ 1)  
✅ `posted_by`

### Responding (Required)
✅ `labor_action_id`  
✅ `employee_id`  
✅ `response_status` (accepted | declined)

### Approving (Required)
✅ `response_id`  
✅ `approved` (boolean)  
✅ `approved_by`

---

## 🛠️ Testing Commands

### Publish Test VET
```bash
curl -X POST http://localhost:5000/api/labor-actions/vet/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "test-org",
    "target_date": "2026-02-15",
    "start_time": "08:00:00",
    "end_time": "16:00:00",
    "positions_available": 3,
    "posted_by": "test-manager"
  }'
```

### List All VET
```bash
curl -X GET "http://localhost:5000/api/labor-actions/vet?organization_id=test-org"
```

### Health Check
```bash
curl -X GET http://localhost:5000/api/labor-actions/health
```

---

## 💡 Tips & Best Practices

1. **Set Close Times**: Always specify `closes_at` to prevent stale offers
2. **Clear Messages**: Use `offer_message` to provide context
3. **Monitor Analytics**: Track fill rates and response times
4. **Validate Eligibility**: Check before allowing responses
5. **Prompt Approvals**: Review responses within 1-2 hours
6. **Use Priority**: Set `priority_order` based on business needs

---

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `organization_id is required` | Missing org ID | Include in request body |
| `positions_available must be at least 1` | Invalid count | Set to 1 or higher |
| `VET offer not found` | Invalid ID | Verify ID exists |
| `response_status must be either "accepted" or "declined"` | Invalid status | Use accepted/declined only |
| `All positions have been filled` | Offer full | Check positions_filled count |

---

## 📞 Support

- **Documentation**: Full docs in `VET_API_DOCUMENTATION.md`
- **Health Check**: `/api/labor-actions/health`
- **Rate Limits**: 100 req/min general, 20 req/min publishing

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 31, 2026
