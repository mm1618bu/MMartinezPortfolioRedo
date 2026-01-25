# Demand Grid CRUD API

Complete REST API for demand management with advanced grid features including filtering, sorting, pagination, bulk operations, and data export.

## Base URL

```
/api/demands
```

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Get Grid Data

**GET** `/grid`

Fetch demand records with advanced filtering, sorting, and pagination for data grid display.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organizationId` | UUID | ✓ | - | Organization ID filter |
| `page` | integer | ✗ | 1 | Page number (1-based) |
| `pageSize` | integer | ✗ | 50 | Records per page (max 1000) |
| `sortBy` | enum | ✗ | - | Field to sort by |
| `sortOrder` | enum | ✗ | asc | Sort direction: `asc` or `desc` |
| `departmentIds` | string | ✗ | - | Comma-separated department IDs |
| `shiftTypes` | string | ✗ | - | Comma-separated shift types |
| `priorities` | string | ✗ | - | Comma-separated priorities |
| `startDate` | date | ✗ | - | Start date (YYYY-MM-DD) |
| `endDate` | date | ✗ | - | End date (YYYY-MM-DD) |
| `minEmployees` | integer | ✗ | - | Minimum required employees |
| `maxEmployees` | integer | ✗ | - | Maximum required employees |
| `search` | string | ✗ | - | Search across notes and department name |

#### Sort Fields

- `date`
- `department`
- `shift_type`
- `required_employees`
- `priority`
- `created_at`

#### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-02-15",
      "shift_type": "morning",
      "start_time": "08:00",
      "end_time": "16:00",
      "required_employees": 5,
      "required_skills": ["customer service", "data entry"],
      "priority": "high",
      "notes": "Peak season demand",
      "created_at": "2026-01-24T10:00:00Z",
      "updated_at": "2026-01-24T10:00:00Z",
      "department": {
        "id": "dept-uuid",
        "name": "Customer Service",
        "description": "Main support team"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 250,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  },
  "filters": {
    "applied": {
      "departmentIds": ["dept-1", "dept-2"],
      "shiftTypes": ["morning", "afternoon"],
      "startDate": "2026-01-01",
      "endDate": "2026-12-31"
    },
    "available": {
      "departments": [
        { "id": "uuid", "name": "Customer Service" },
        { "id": "uuid", "name": "Sales" }
      ],
      "shiftTypes": [
        { "value": "morning", "label": "morning" },
        { "value": "afternoon", "label": "afternoon" }
      ],
      "priorities": [
        { "value": "low", "label": "Low" },
        { "value": "medium", "label": "Medium" },
        { "value": "high", "label": "High" },
        { "value": "critical", "label": "Critical" }
      ]
    }
  },
  "sort": {
    "field": "date",
    "order": "asc"
  }
}
```

#### Example Requests

**Basic pagination:**
```bash
GET /api/demands/grid?organizationId=org-uuid&page=1&pageSize=20
```

**With filtering:**
```bash
GET /api/demands/grid?organizationId=org-uuid&departmentIds=dept1,dept2&priorities=high,critical&page=1
```

**With sorting:**
```bash
GET /api/demands/grid?organizationId=org-uuid&sortBy=required_employees&sortOrder=desc
```

**With date range:**
```bash
GET /api/demands/grid?organizationId=org-uuid&startDate=2026-01-01&endDate=2026-12-31
```

**With search:**
```bash
GET /api/demands/grid?organizationId=org-uuid&search=peak%20season
```

---

### 2. Get Single Demand

**GET** `/grid/:id`

Fetch a specific demand record by ID.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | UUID | ✓ | Organization ID (for access control) |

#### Response

```json
{
  "id": "uuid",
  "date": "2026-02-15",
  "shift_type": "morning",
  "start_time": "08:00",
  "end_time": "16:00",
  "required_employees": 5,
  "required_skills": ["customer service"],
  "priority": "high",
  "notes": "Peak season",
  "created_at": "2026-01-24T10:00:00Z",
  "updated_at": "2026-01-24T10:00:00Z",
  "department": {
    "id": "dept-uuid",
    "name": "Customer Service"
  }
}
```

#### Example

```bash
GET /api/demands/grid/550e8400-e29b-41d4-a716-446655440000?organizationId=org-uuid
```

---

### 3. Create Demand

**POST** `/grid`

Create a new demand record.

#### Request Body

```json
{
  "date": "2026-02-15",
  "department_id": "dept-uuid",
  "shift_type": "morning",
  "start_time": "08:00",
  "end_time": "16:00",
  "required_employees": 5,
  "required_skills": ["customer service", "data entry"],
  "priority": "high",
  "notes": "Peak season demand",
  "organization_id": "org-uuid"
}
```

#### Response

```json
{
  "data": {
    "id": "new-uuid",
    "date": "2026-02-15",
    ...
  },
  "warnings": [
    {
      "row": 1,
      "field": "date",
      "message": "Date is more than 6 months in the future",
      "suggestedFix": null
    }
  ]
}
```

#### Status Codes

- `201 Created` - Record created successfully
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

#### Example

```bash
curl -X POST http://localhost:3001/api/demands/grid \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15",
    "department_id": "dept-uuid",
    "shift_type": "morning",
    "start_time": "08:00",
    "end_time": "16:00",
    "required_employees": 5,
    "priority": "high",
    "organization_id": "org-uuid"
  }'
```

---

### 4. Update Demand

**PUT** `/grid/:id`

Update an existing demand record.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | UUID | ✓ | Organization ID (in body) |

#### Request Body (Partial)

```json
{
  "organizationId": "org-uuid",
  "priority": "critical",
  "required_employees": 8,
  "notes": "Updated: extra demand expected"
}
```

#### Response

```json
{
  "data": {
    "id": "uuid",
    "date": "2026-02-15",
    ...
  },
  "warnings": []
}
```

#### Example

```bash
curl -X PUT http://localhost:3001/api/demands/grid/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-uuid",
    "priority": "critical",
    "required_employees": 8
  }'
```

---

### 5. Delete Demand

**DELETE** `/grid/:id`

Delete a demand record.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | UUID | ✓ | Organization ID (for access control) |

#### Response

- `204 No Content` - Successfully deleted

#### Example

```bash
curl -X DELETE http://localhost:3001/api/demands/grid/550e8400-e29b-41d4-a716-446655440000?organizationId=org-uuid \
  -H "Authorization: Bearer TOKEN"
```

---

### 6. Bulk Delete

**POST** `/grid/bulk-delete`

Delete multiple demand records at once (max 100).

#### Request Body

```json
{
  "ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "organizationId": "org-uuid"
}
```

#### Response

```json
{
  "success": true,
  "deletedCount": 3
}
```

#### Example

```bash
curl -X POST http://localhost:3001/api/demands/grid/bulk-delete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["uuid-1", "uuid-2"],
    "organizationId": "org-uuid"
  }'
```

---

### 7. Bulk Update

**POST** `/grid/bulk-update`

Update multiple demand records at once (max 100).

#### Request Body

```json
{
  "ids": ["uuid-1", "uuid-2"],
  "organizationId": "org-uuid",
  "updates": {
    "priority": "critical",
    "shift_type": "all_day",
    "notes": "Updated batch"
  }
}
```

#### Response

```json
{
  "success": true,
  "updatedCount": 2,
  "updated": [
    { "id": "uuid-1", "priority": "critical", ... },
    { "id": "uuid-2", "priority": "critical", ... }
  ]
}
```

#### Updatable Fields

- `priority`
- `shift_type`
- `notes`

#### Example

```bash
curl -X POST http://localhost:3001/api/demands/grid/bulk-update \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["uuid-1", "uuid-2"],
    "organizationId": "org-uuid",
    "updates": {
      "priority": "high",
      "notes": "Batch update"
    }
  }'
```

---

### 8. Export Data

**POST** `/grid/export`

Export demand records to CSV, JSON, or XLSX format.

#### Request Body

```json
{
  "organizationId": "org-uuid",
  "format": "csv",
  "filters": {
    "organizationId": "org-uuid",
    "departmentIds": ["dept-1"],
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  },
  "columns": [
    "date",
    "department",
    "shift_type",
    "required_employees",
    "priority",
    "notes"
  ]
}
```

#### Query Parameters

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `format` | enum | ✗ | csv, json, xlsx | Export format (default: csv) |
| `columns` | array | ✗ | See below | Selected columns to export |

#### Available Columns

- `date`
- `department`
- `shift_type`
- `start_time`
- `end_time`
- `required_employees`
- `required_skills`
- `priority`
- `notes`

#### Response

File download with appropriate content type:
- CSV: `text/csv`
- JSON: `application/json`
- XLSX: Returned as JSON for frontend processing

#### Example

```bash
# Export to CSV
curl -X POST http://localhost:3001/api/demands/grid/export \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-uuid",
    "format": "csv",
    "columns": ["date", "department", "required_employees", "priority"]
  }' \
  -o demands.csv

# Export to JSON
curl -X POST http://localhost:3001/api/demands/grid/export \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-uuid",
    "format": "json"
  }' \
  -o demands.json
```

---

### 9. Get Grid Summary

**GET** `/grid/summary`

Get aggregated statistics for the demand grid.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | UUID | ✓ | Organization ID |
| `departmentIds` | string | ✗ | Comma-separated department IDs |
| `startDate` | date | ✗ | Start date (YYYY-MM-DD) |
| `endDate` | date | ✗ | End date (YYYY-MM-DD) |

#### Response

```json
{
  "totalRecords": 150,
  "totalEmployeesNeeded": 750,
  "averagePerDay": 25,
  "byPriority": {
    "low": 30,
    "medium": 80,
    "high": 35,
    "critical": 5
  }
}
```

#### Example

```bash
GET /api/demands/grid/summary?organizationId=org-uuid&startDate=2026-01-01&endDate=2026-12-31
```

---

### 10. Get Filter Options

**GET** `/grid/filters`

Get available filter options for dropdowns and filter controls.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | UUID | ✓ | Organization ID |

#### Response

```json
{
  "departments": [
    { "id": "uuid", "name": "Customer Service" },
    { "id": "uuid", "name": "Sales" },
    { "id": "uuid", "name": "IT" }
  ],
  "shiftTypes": [
    { "value": "morning", "label": "morning" },
    { "value": "afternoon", "label": "afternoon" },
    { "value": "evening", "label": "evening" }
  ],
  "priorities": [
    { "value": "low", "label": "Low" },
    { "value": "medium", "label": "Medium" },
    { "value": "high", "label": "High" },
    { "value": "critical", "label": "Critical" }
  ]
}
```

#### Example

```bash
GET /api/demands/grid/filters?organizationId=org-uuid
```

---

## Error Responses

### Validation Error

```json
{
  "error": "Validation failed",
  "details": [
    {
      "type": "VALIDATION_ERROR",
      "severity": "error",
      "message": "date: Invalid date format. Expected YYYY-MM-DD",
      "field": "date",
      "value": "2024/02/15"
    }
  ]
}
```

### Business Rule Violation

```json
{
  "error": "Business rule validation failed",
  "details": [
    {
      "type": "BUSINESS_RULE_VIOLATION",
      "severity": "error",
      "message": "End time (08:00) must be after start time (16:00)",
      "field": "end_time"
    }
  ]
}
```

### Not Found

```json
{
  "error": "Demand not found or access denied"
}
```

### Unauthorized

```json
{
  "error": "Not authenticated"
}
```

---

## Usage Examples

### React Component Example

```typescript
// Fetch grid data
const response = await fetch(
  `/api/demands/grid?organizationId=org-uuid&page=1&pageSize=50&sortBy=date&sortOrder=desc`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const gridData = await response.json();

// Create demand
const create = await fetch('/api/demands/grid', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    date: '2026-02-15',
    department_id: deptId,
    required_employees: 5,
    priority: 'high',
    organization_id: orgId
  })
});

// Bulk update
const update = await fetch('/api/demands/grid/bulk-update', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ids: selectedIds,
    organizationId: orgId,
    updates: { priority: 'critical' }
  })
});

// Export to CSV
const exportRes = await fetch('/api/demands/grid/export', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organizationId: orgId,
    format: 'csv',
    columns: ['date', 'department', 'required_employees', 'priority']
  })
});
const csv = await exportRes.text();
// Download or process CSV...
```

---

## Rate Limiting

Standard API rate limits apply:
- 100 requests per minute per user
- Bulk operations count as 1 request

## Best Practices

1. **Use pageSize wisely** - Keep between 20-100 for optimal performance
2. **Combine filters** - Multiple filters perform better than large result sets
3. **Sort efficiently** - Sort by indexed fields (date, priority) for better performance
4. **Batch operations** - Use bulk endpoints for large updates/deletes
5. **Export format** - Use CSV for large exports, JSON for data interchange
6. **Validation** - Check response warnings even on 201/200 responses

---

## Support

For issues or questions about the Grid API:
1. Check error details in response
2. Verify organizationId is correct
3. Confirm authentication token is valid
4. Review validation rules in DEMAND_VALIDATION.md
5. Check API logs for detailed error information
