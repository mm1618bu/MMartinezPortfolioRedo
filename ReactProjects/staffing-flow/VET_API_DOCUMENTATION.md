# VET Publishing API Documentation

## Overview

The VET (Voluntary Extra Time) Publishing API enables managers to publish overtime opportunities and employees to respond to them. This system facilitates efficient labor management during high-demand periods by allowing voluntary shift pickups.

## Base URL

```
/api/labor-actions
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Publish VET Offer

**POST** `/api/labor-actions/vet/publish`

Publish a new VET opportunity for employees to accept.

#### Request Body

```json
{
  "organization_id": "uuid",
  "department_id": "uuid",           // Optional - omit to target all departments
  "shift_template_id": "uuid",       // Optional - can specify custom time range
  "target_date": "2026-02-15",      // ISO date (YYYY-MM-DD)
  "start_time": "14:00:00",         // Time or ISO datetime
  "end_time": "22:00:00",           // Time or ISO datetime
  "positions_available": 5,          // Number of positions
  "priority_order": "first_come_first_serve", // Optional: seniority | performance | random | first_come_first_serve
  "offer_message": "Need extra coverage for Valentine's Day rush", // Optional
  "closes_at": "2026-02-14T23:59:59Z", // Optional - when offer expires
  "status": "open",                  // Optional: draft | open (default: open)
  "posted_by": "user-uuid"           // User ID of poster
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "vet-uuid",
    "action_type": "VET",
    "target_date": "2026-02-15",
    "start_time": "2026-02-15T14:00:00Z",
    "end_time": "2026-02-15T22:00:00Z",
    "department_id": "dept-uuid",
    "positions_available": 5,
    "positions_filled": 0,
    "status": "open",
    "posted_by": "user-uuid",
    "posted_at": "2026-01-31T10:00:00Z",
    "closes_at": "2026-02-14T23:59:59Z",
    "organization_id": "org-uuid",
    "created_at": "2026-01-31T10:00:00Z",
    "updated_at": "2026-01-31T10:00:00Z"
  },
  "message": "VET offer published successfully"
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "positions_available must be at least 1"
}
```

---

### 2. List VET Offers

**GET** `/api/labor-actions/vet`

Retrieve a list of VET offers with filtering and pagination.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | uuid | Yes | Organization ID |
| `department_id` | uuid | No | Filter by department |
| `status` | string | No | Filter by status (draft, open, closed, cancelled) |
| `target_date_from` | date | No | Start date filter (YYYY-MM-DD) |
| `target_date_to` | date | No | End date filter (YYYY-MM-DD) |
| `action_type` | string | No | Filter by type (VET or VTO, default: VET) |
| `limit` | number | No | Results per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

#### Example Request

```
GET /api/labor-actions/vet?organization_id=abc123&status=open&limit=20
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "vet-uuid-1",
      "action_type": "VET",
      "target_date": "2026-02-15",
      "start_time": "2026-02-15T14:00:00Z",
      "end_time": "2026-02-15T22:00:00Z",
      "positions_available": 5,
      "positions_filled": 3,
      "status": "open",
      "response_count": 8,
      "accepted_count": 3,
      "pending_count": 2,
      "declined_count": 3,
      "waitlisted_count": 0,
      "posted_at": "2026-01-31T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

### 3. Get VET Offer Details

**GET** `/api/labor-actions/vet/:id`

Retrieve detailed information about a specific VET offer, including all employee responses.

#### Path Parameters

- `id` - VET offer UUID

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "vet-uuid",
    "action_type": "VET",
    "target_date": "2026-02-15",
    "start_time": "2026-02-15T14:00:00Z",
    "end_time": "2026-02-15T22:00:00Z",
    "department_id": "dept-uuid",
    "department_name": "Fulfillment",
    "shift_template_name": "Afternoon Shift",
    "positions_available": 5,
    "positions_filled": 3,
    "priority_order": "first_come_first_serve",
    "offer_message": "Need extra coverage for Valentine's Day rush",
    "status": "open",
    "posted_by": "user-uuid",
    "posted_by_name": "Jane Manager",
    "posted_at": "2026-01-31T10:00:00Z",
    "closes_at": "2026-02-14T23:59:59Z",
    "response_count": 8,
    "accepted_count": 3,
    "pending_count": 2,
    "declined_count": 3,
    "waitlisted_count": 0,
    "responses": [
      {
        "id": "response-uuid-1",
        "employee_id": "emp-uuid-1",
        "employee_name": "John Smith",
        "employee_number": "EMP001",
        "response_status": "accepted",
        "response_time": "2026-01-31T10:15:00Z",
        "priority_score": 95.5,
        "approved_by": "user-uuid",
        "approved_at": "2026-01-31T10:30:00Z",
        "notes": "Happy to help!"
      }
    ]
  }
}
```

---

### 4. Update VET Offer

**PUT** `/api/labor-actions/vet/:id`

Update an existing VET offer.

#### Path Parameters

- `id` - VET offer UUID

#### Request Body

All fields are optional:

```json
{
  "positions_available": 7,
  "priority_order": "seniority",
  "offer_message": "Updated: Urgent need for extra staff",
  "closes_at": "2026-02-14T20:00:00Z",
  "status": "open"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    // Updated VET offer object
  },
  "message": "VET offer updated successfully"
}
```

---

### 5. Close VET Offer

**POST** `/api/labor-actions/vet/:id/close`

Manually close a VET offer (prevents new responses).

#### Path Parameters

- `id` - VET offer UUID

#### Request Body

```json
{
  "closed_by": "user-uuid"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    // Updated VET offer with status "closed"
  },
  "message": "VET offer closed successfully"
}
```

---

### 6. Cancel VET Offer

**POST** `/api/labor-actions/vet/:id/cancel`

Cancel a VET offer (invalidates all responses).

#### Path Parameters

- `id` - VET offer UUID

#### Request Body

```json
{
  "cancelled_by": "user-uuid"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    // Updated VET offer with status "cancelled"
  },
  "message": "VET offer cancelled successfully"
}
```

---

### 7. Employee Respond to VET

**POST** `/api/labor-actions/vet/respond`

Employee accepts or declines a VET offer.

#### Request Body

```json
{
  "labor_action_id": "vet-uuid",
  "employee_id": "emp-uuid",
  "response_status": "accepted",  // accepted | declined
  "notes": "I'm available!"       // Optional
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "response-uuid",
    "labor_action_id": "vet-uuid",
    "employee_id": "emp-uuid",
    "response_status": "accepted",
    "response_time": "2026-01-31T10:15:00Z",
    "notes": "I'm available!",
    "created_at": "2026-01-31T10:15:00Z"
  },
  "message": "Response submitted successfully"
}
```

**Note:** If the employee has already responded, this endpoint will update their existing response.

---

### 8. Get VET Responses

**GET** `/api/labor-actions/vet/:id/responses`

Get all employee responses for a specific VET offer.

#### Path Parameters

- `id` - VET offer UUID

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "response-uuid-1",
      "employee_id": "emp-uuid-1",
      "employee_name": "John Smith",
      "employee_number": "EMP001",
      "response_status": "accepted",
      "response_time": "2026-01-31T10:15:00Z",
      "priority_score": 95.5,
      "approved_by": "user-uuid",
      "approved_at": "2026-01-31T10:30:00Z"
    }
  ]
}
```

---

### 9. Approve/Reject Employee Response

**POST** `/api/labor-actions/vet/response/approve`

Manager approves or rejects an employee's VET response.

#### Request Body

```json
{
  "response_id": "response-uuid",
  "approved": true,              // true = approved, false = rejected
  "approved_by": "user-uuid",    // Manager user ID
  "notes": "Approved - excellent performance record"  // Optional
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "response-uuid",
    "response_status": "accepted",
    "approved_by": "user-uuid",
    "approved_at": "2026-01-31T11:00:00Z",
    "notes": "Approved - excellent performance record"
  },
  "message": "Response approved successfully"
}
```

---

### 10. Check VET Eligibility

**POST** `/api/labor-actions/vet/check-eligibility`

Check if an employee is eligible for a specific VET offer.

#### Request Body

```json
{
  "employee_id": "emp-uuid",
  "labor_action_id": "vet-uuid"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "eligible": true,
    "reasons": [
      "Employee meets all eligibility criteria"
    ],
    "restrictions": {
      "max_weekly_hours_exceeded": false,
      "already_scheduled": false,
      "missing_qualifications": [],
      "blackout_period": false
    }
  }
}
```

#### Ineligible Example

```json
{
  "success": true,
  "data": {
    "eligible": false,
    "reasons": [
      "Employee is not active",
      "All positions have been filled"
    ]
  }
}
```

---

### 11. Get VET Analytics

**GET** `/api/labor-actions/vet/analytics`

Retrieve analytics and metrics for VET offers over a date range.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | uuid | Yes | Organization ID |
| `department_id` | uuid | No | Filter by department |
| `date_from` | date | Yes | Start date (YYYY-MM-DD) |
| `date_to` | date | Yes | End date (YYYY-MM-DD) |

#### Example Request

```
GET /api/labor-actions/vet/analytics?organization_id=abc123&date_from=2026-01-01&date_to=2026-01-31
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "total_offers": 25,
    "total_positions": 150,
    "filled_positions": 132,
    "fill_rate": 88.0,
    "avg_response_time_minutes": 45.5,
    "offers_by_status": {
      "draft": 2,
      "open": 8,
      "closed": 14,
      "cancelled": 1
    },
    "responses_by_status": {
      "accepted": 132,
      "declined": 45,
      "pending": 12,
      "waitlisted": 8
    },
    "top_responding_employees": [
      {
        "employee_id": "emp-uuid-1",
        "employee_name": "John Smith",
        "response_count": 15,
        "acceptance_rate": 93.3
      }
    ],
    "department_breakdown": [
      {
        "department_id": "dept-uuid-1",
        "department_name": "Fulfillment",
        "offers_count": 12,
        "fill_rate": 91.7
      }
    ]
  }
}
```

---

### 12. Get Active VET Offers

**GET** `/api/labor-actions/vet/active`

Retrieve all currently active (open) VET offers.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | uuid | Yes | Organization ID |
| `department_id` | uuid | No | Filter by department |

#### Example Request

```
GET /api/labor-actions/vet/active?organization_id=abc123
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "vet-uuid-1",
      "target_date": "2026-02-15",
      "start_time": "2026-02-15T14:00:00Z",
      "end_time": "2026-02-15T22:00:00Z",
      "positions_available": 5,
      "positions_filled": 3,
      "status": "open",
      "response_count": 8
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}
```

---

### 13. Health Check

**GET** `/api/labor-actions/health`

Check if the Labor Actions API is operational.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Labor Actions API is running",
  "timestamp": "2026-01-31T10:00:00Z"
}
```

---

## Data Models

### LaborAction (VET Offer)

```typescript
{
  id: string;                    // UUID
  action_type: "VET" | "VTO";
  target_date: string;           // ISO date (YYYY-MM-DD)
  shift_template_id?: string;    // Optional shift template reference
  start_time: string;            // ISO datetime
  end_time: string;              // ISO datetime
  department_id?: string;        // Optional department filter
  positions_available: number;
  positions_filled: number;
  priority_order?: "seniority" | "performance" | "random" | "first_come_first_serve";
  offer_message?: string;
  status: "draft" | "open" | "closed" | "cancelled";
  posted_by: string;             // User ID
  posted_at: string;             // ISO datetime
  closes_at?: string;            // ISO datetime
  organization_id: string;
  created_at: string;
  updated_at: string;
}
```

### LaborActionResponse

```typescript
{
  id: string;                    // UUID
  labor_action_id: string;       // VET offer ID
  employee_id: string;
  response_status: "accepted" | "declined" | "pending" | "waitlisted";
  response_time: string;         // ISO datetime
  priority_score?: number;       // For ranking
  approved_by?: string;          // User ID
  approved_at?: string;          // ISO datetime
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid or missing parameters |
| 401 | Unauthorized - Invalid or missing JWT token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Common Use Cases

### 1. Manager Publishes VET for Weekend Coverage

```bash
curl -X POST https://api.example.com/api/labor-actions/vet/publish \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-123",
    "department_id": "dept-456",
    "target_date": "2026-02-15",
    "start_time": "08:00:00",
    "end_time": "16:00:00",
    "positions_available": 10,
    "priority_order": "first_come_first_serve",
    "offer_message": "Extra coverage needed for weekend rush",
    "closes_at": "2026-02-14T20:00:00Z",
    "posted_by": "manager-uuid"
  }'
```

### 2. Employee Accepts VET Offer

```bash
curl -X POST https://api.example.com/api/labor-actions/vet/respond \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "labor_action_id": "vet-uuid",
    "employee_id": "emp-uuid",
    "response_status": "accepted",
    "notes": "Available for this shift!"
  }'
```

### 3. Manager Reviews Responses

```bash
curl -X GET "https://api.example.com/api/labor-actions/vet/vet-uuid/responses" \
  -H "Authorization: Bearer <token>"
```

### 4. Manager Approves Employee

```bash
curl -X POST https://api.example.com/api/labor-actions/vet/response/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "response_id": "response-uuid",
    "approved": true,
    "approved_by": "manager-uuid",
    "notes": "Approved - great performance"
  }'
```

### 5. View Analytics

```bash
curl -X GET "https://api.example.com/api/labor-actions/vet/analytics?organization_id=org-123&date_from=2026-01-01&date_to=2026-01-31" \
  -H "Authorization: Bearer <token>"
```

---

## Best Practices

1. **Set Reasonable Close Times**: Always set `closes_at` to prevent late responses
2. **Monitor Fill Rates**: Use analytics to optimize position counts
3. **Priority Orders**: Use `seniority` for fair distribution, `first_come_first_serve` for urgent needs
4. **Clear Messages**: Provide context in `offer_message` to increase acceptance rates
5. **Prompt Approvals**: Review and approve responses quickly to avoid uncertainty
6. **Check Eligibility**: Validate eligibility before allowing responses to prevent issues

---

## Webhook Events (Future Enhancement)

The following webhook events can be subscribed to:

- `vet.published` - New VET offer created
- `vet.closed` - VET offer closed
- `vet.cancelled` - VET offer cancelled
- `vet.response.submitted` - Employee responds
- `vet.response.approved` - Manager approves response
- `vet.response.rejected` - Manager rejects response
- `vet.positions.filled` - All positions filled

---

## Rate Limits

- **General**: 100 requests per minute per user
- **Publishing**: 20 VET offers per minute per organization
- **Responses**: 50 responses per minute per employee

---

## Support

For API support or questions:
- Documentation: [Internal Wiki Link]
- Support Email: api-support@example.com
- Slack Channel: #labor-actions-api

---

**Version**: 1.0.0  
**Last Updated**: January 31, 2026  
**Status**: ✅ Production Ready
