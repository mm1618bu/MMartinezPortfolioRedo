# Express API Structure

Complete Express API for the Staffing Flow application with authentication, authorization, and CRUD operations.

## Project Structure

```
api/
├── server.ts                 # Main Express app entry point
├── config.ts                 # Configuration management
├── routes/
│   ├── index.ts             # Route aggregator
│   ├── health.routes.ts     # Health check endpoints
│   ├── auth.routes.ts       # Authentication endpoints
│   ├── staff.routes.ts      # Employee management
│   ├── schedule.routes.ts   # Schedule/shift management
│   └── department.routes.ts # Department management
├── controllers/
│   ├── health.controller.ts
│   ├── auth.controller.ts
│   ├── staff.controller.ts
│   ├── schedule.controller.ts
│   └── department.controller.ts
├── services/
│   ├── auth.service.ts      # Authentication business logic
│   ├── staff.service.ts     # Staff CRUD operations
│   ├── schedule.service.ts  # Schedule operations
│   └── department.service.ts
├── middleware/
│   ├── auth.middleware.ts   # JWT authentication
│   ├── rbac.middleware.ts   # Role-based access control
│   ├── error.middleware.ts  # Error handling
│   └── logging.middleware.ts
├── lib/
│   └── supabase.ts          # Supabase client
├── utils/
│   └── error-handler.ts     # Error utilities
└── types/
    └── database.types.ts    # TypeScript types
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Staff Management
All routes require authentication. RBAC applied per endpoint.

- `GET /api/staff` - Get all employees (admin, manager, viewer)
- `GET /api/staff/:id` - Get employee by ID (admin, manager, viewer)
- `POST /api/staff` - Create employee (admin, manager)
- `PUT /api/staff/:id` - Update employee (admin, manager)
- `DELETE /api/staff/:id` - Delete employee (admin)
- `POST /api/staff/import` - Bulk import from CSV (admin, manager)

### Schedule Management
- `GET /api/schedules` - Get all shift assignments
- `GET /api/schedules/:id` - Get shift by ID
- `POST /api/schedules` - Create shift assignment
- `PUT /api/schedules/:id` - Update shift
- `DELETE /api/schedules/:id` - Delete shift
- `POST /api/schedules/assign` - Assign shift to employee
- `POST /api/schedules/bulk-assign` - Bulk shift assignment

### Department Management
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department (admin)
- `PUT /api/departments/:id` - Update department (admin, manager)
- `DELETE /api/departments/:id` - Delete department (admin)

## Authentication Flow

1. **Signup/Login**: Returns JWT token from Supabase Auth
2. **Token Storage**: Client stores token (localStorage/cookie)
3. **Protected Requests**: Include token in Authorization header:
   ```
   Authorization: Bearer <token>
   ```
4. **Token Verification**: Middleware validates token and attaches user to request

## RBAC Roles

- `super_admin` - Full access to all resources
- `admin` - Manage organization, users, departments
- `manager` - Manage employees and schedules in their department
- `staff` - View own schedule, request time off
- `viewer` - Read-only access

## Middleware Pipeline

1. **CORS** - Handle cross-origin requests
2. **Body Parser** - Parse JSON/URL-encoded bodies
3. **Request Logger** - Log all requests (development only)
4. **Authentication** - Verify JWT token
5. **Authorization** - Check user role permissions
6. **Error Handler** - Catch and format errors

## Error Handling

All errors are caught and formatted consistently:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (delete success)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Required in `.env`:

```env
NODE_ENV=development
PORT=3001
API_HOST=localhost
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Running the API

```bash
# Development (with hot reload)
npm run dev:api

# Build
npm run build:api

# Type check
npm run type-check:api
```

## Testing Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Get Staff (with auth)
```bash
curl http://localhost:3001/api/staff \
  -H "Authorization: Bearer <your_token>"
```

## Next Steps

1. Add more entity routes (PTO, attendance, labor actions, etc.)
2. Implement data validation with Zod or Joi
3. Add request rate limiting
4. Implement API versioning (/api/v1)
5. Add OpenAPI/Swagger documentation
6. Implement caching with Redis
7. Add comprehensive test suite
8. Set up API monitoring and logging
