# API Guide - Staffing Flow

## Overview

The Staffing Flow API is a RESTful API that provides endpoints for managing staff, schedules, time off requests, and more. The API follows OpenAPI 3.0.3 specification and implements JWT-based authentication with role-based access control (RBAC).

## Quick Start

### Base URLs

- **Local Python API**: `http://localhost:8000/api/v1`
- **Local Node API**: `http://localhost:3001/api/v1`
- **Production**: `https://api.staffingflow.com/v1`

### Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```bash
Authorization: Bearer <your_jwt_token>
```

**Get a token:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

## API Documentation

### Interactive Documentation

When running locally, access interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### OpenAPI Specification

The complete API contract is defined in [openapi.yaml](openapi.yaml).

## Common Patterns

### Pagination

List endpoints support pagination via query parameters:

```bash
GET /api/v1/staff?page=1&limit=20
```

**Response includes pagination metadata:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Sorting

Use the `sort` parameter with field name and direction:

```bash
GET /api/v1/users?sort=created_at:desc
GET /api/v1/staff?sort=name:asc
```

### Filtering

Most list endpoints support filtering:

```bash
GET /api/v1/staff?department_id=abc123&status=active
GET /api/v1/schedules?start_date=2026-01-01&end_date=2026-01-31
```

### Error Handling

All errors follow a consistent format:

```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "details": {
    "resource": "staff",
    "id": "abc123"
  }
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## API Endpoints by Category

### Authentication

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| POST   | `/auth/register` | Register new user    |
| POST   | `/auth/login`    | User login           |
| POST   | `/auth/refresh`  | Refresh access token |
| POST   | `/auth/logout`   | User logout          |
| GET    | `/auth/me`       | Get current user     |

### Users

| Method | Endpoint      | Description    | Permission    |
| ------ | ------------- | -------------- | ------------- |
| GET    | `/users`      | List users     | `user.read`   |
| POST   | `/users`      | Create user    | `user.create` |
| GET    | `/users/{id}` | Get user by ID | `user.read`   |
| PUT    | `/users/{id}` | Update user    | `user.update` |
| DELETE | `/users/{id}` | Delete user    | `user.delete` |

### Staff

| Method | Endpoint      | Description     | Permission     |
| ------ | ------------- | --------------- | -------------- |
| GET    | `/staff`      | List staff      | `staff.read`   |
| POST   | `/staff`      | Create staff    | `staff.create` |
| GET    | `/staff/{id}` | Get staff by ID | `staff.read`   |
| PUT    | `/staff/{id}` | Update staff    | `staff.update` |
| DELETE | `/staff/{id}` | Delete staff    | `staff.delete` |

### Schedules

| Method | Endpoint                  | Description        | Permission         |
| ------ | ------------------------- | ------------------ | ------------------ |
| GET    | `/schedules`              | List schedules     | `schedule.read`    |
| POST   | `/schedules`              | Create schedule    | `schedule.create`  |
| GET    | `/schedules/{id}`         | Get schedule by ID | `schedule.read`    |
| PUT    | `/schedules/{id}`         | Update schedule    | `schedule.update`  |
| DELETE | `/schedules/{id}`         | Delete schedule    | `schedule.delete`  |
| POST   | `/schedules/{id}/publish` | Publish schedule   | `schedule.publish` |

### Time Off

| Method | Endpoint                | Description       | Permission         |
| ------ | ----------------------- | ----------------- | ------------------ |
| GET    | `/timeoff`              | List requests     | `timeoff.read`     |
| POST   | `/timeoff`              | Create request    | `timeoff.create`   |
| GET    | `/timeoff/{id}`         | Get request by ID | `timeoff.read.own` |
| DELETE | `/timeoff/{id}`         | Cancel request    | `timeoff.cancel`   |
| POST   | `/timeoff/{id}/approve` | Approve request   | `timeoff.approve`  |
| POST   | `/timeoff/{id}/deny`    | Deny request      | `timeoff.approve`  |

### Departments

| Method | Endpoint            | Description          | Permission          |
| ------ | ------------------- | -------------------- | ------------------- |
| GET    | `/departments`      | List departments     | `department.read`   |
| POST   | `/departments`      | Create department    | `department.create` |
| GET    | `/departments/{id}` | Get department by ID | `department.read`   |
| PUT    | `/departments/{id}` | Update department    | `department.update` |
| DELETE | `/departments/{id}` | Delete department    | `department.delete` |

### Reports

| Method | Endpoint                     | Description       | Permission        |
| ------ | ---------------------------- | ----------------- | ----------------- |
| GET    | `/reports/staff-summary`     | Staff summary     | `report.generate` |
| GET    | `/reports/schedule-coverage` | Schedule coverage | `report.generate` |
| GET    | `/reports/timeoff-summary`   | Time off summary  | `report.generate` |

## Example Requests

### Create a Staff Member

```bash
curl -X POST http://localhost:8000/api/v1/staff \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0123",
    "department_id": "dept-123",
    "position": "Software Engineer",
    "hire_date": "2026-01-15",
    "hourly_rate": 45.00,
    "weekly_hours": 40
  }'
```

### Create a Schedule

```bash
curl -X POST http://localhost:8000/api/v1/schedules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "staff-456",
    "start_time": "2026-01-20T09:00:00Z",
    "end_time": "2026-01-20T17:00:00Z",
    "position": "Front Desk",
    "notes": "Morning shift"
  }'
```

### Submit Time Off Request

```bash
curl -X POST http://localhost:8000/api/v1/timeoff \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "staff-456",
    "type": "vacation",
    "start_date": "2026-02-10",
    "end_date": "2026-02-14",
    "reason": "Family vacation"
  }'
```

### Approve Time Off Request

```bash
curl -X POST http://localhost:8000/api/v1/timeoff/req-789/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Approved - enjoy your vacation!"
  }'
```

### Get Staff Summary Report

```bash
curl -X GET "http://localhost:8000/api/v1/reports/staff-summary?department_id=dept-123" \
  -H "Authorization: Bearer <token>"
```

## TypeScript Client Example

```typescript
import axios from 'axios';

// Create API client
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(email: string, password: string) {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  localStorage.setItem('access_token', response.data.access_token);
  localStorage.setItem('refresh_token', response.data.refresh_token);

  return response.data;
}

// Get staff list
async function getStaff(page = 1, limit = 20) {
  const response = await apiClient.get('/staff', {
    params: { page, limit },
  });

  return response.data;
}

// Create schedule
async function createSchedule(schedule: CreateScheduleRequest) {
  const response = await apiClient.post('/schedules', schedule);
  return response.data;
}
```

## Python Client Example

```python
import requests
from typing import Optional

class StaffingFlowClient:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers['Authorization'] = f'Bearer {token}'

    def login(self, email: str, password: str):
        response = self.session.post(
            f'{self.base_url}/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data['access_token']
        self.session.headers['Authorization'] = f'Bearer {self.token}'
        return data

    def get_staff(self, page: int = 1, limit: int = 20):
        response = self.session.get(
            f'{self.base_url}/staff',
            params={'page': page, 'limit': limit}
        )
        response.raise_for_status()
        return response.json()

    def create_schedule(self, schedule_data: dict):
        response = self.session.post(
            f'{self.base_url}/schedules',
            json=schedule_data
        )
        response.raise_for_status()
        return response.json()

# Usage
client = StaffingFlowClient('http://localhost:8000/api/v1')
client.login('user@example.com', 'password')

staff = client.get_staff(page=1, limit=20)
print(f"Found {staff['pagination']['total']} staff members")
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **List endpoints**: 60 requests per minute
- **Write operations**: 30 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1609459200
```

## Webhooks (Future)

Webhook support is planned for:

- Schedule published
- Time off request submitted
- Time off request approved/denied
- Staff member created/updated

## API Versioning

The API uses URL versioning (`/api/v1/`). Breaking changes will result in a new version (`/api/v2/`).

**Current version**: `v1.0.0`

## Support

- **Documentation**: [openapi.yaml](openapi.yaml)
- **RBAC Guide**: [RBAC.md](RBAC.md)
- **Issues**: Report issues on GitHub
- **Email**: support@staffingflow.com

## Testing

Use the provided Postman collection or generate one from the OpenAPI spec:

```bash
# Generate Postman collection from OpenAPI spec
npx openapi-to-postmanv2 -s openapi.yaml -o staffing-flow.postman.json
```

## Code Generation

Generate client SDKs from the OpenAPI spec:

```bash
# TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o src/generated/api

# Python client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o python/generated/client
```
