# Request Validation Middleware

Comprehensive validation system using Zod for type-safe request validation in the Express API.

## Overview

The validation middleware provides:
- ✅ **Type-safe validation** with Zod schemas
- ✅ **Body, query, and param validation**
- ✅ **Clear error messages** with field-level details
- ✅ **Automatic type inference** for TypeScript
- ✅ **Reusable validation schemas**

## Validation Functions

### `validate(schema)`
Validates `req.body` against the provided Zod schema.

```typescript
router.post('/staff', validate(createStaffSchema), staffController.create);
```

### `validateQuery(schema)`
Validates `req.query` parameters.

```typescript
router.get('/staff', validateQuery(staffQuerySchema), staffController.getAll);
```

### `validateParams(schema)`
Validates `req.params` (URL parameters).

```typescript
router.get('/staff/:id', validateParams(idParamSchema), staffController.getById);
```

### `validateUuidParam(paramName)`
Convenience function for validating UUID parameters (defaults to 'id').

```typescript
router.get('/staff/:id', validateUuidParam('id'), staffController.getById);
router.get('/dept/:deptId', validateUuidParam('deptId'), departmentController.getById);
```

## Validation Schemas

### Authentication Schemas

**Signup**
```typescript
{
  email: string (valid email),
  password: string (min 8 chars, 1 uppercase, 1 lowercase, 1 number),
  name: string (min 2 chars),
  organizationId: string (valid UUID)
}
```

**Login**
```typescript
{
  email: string (valid email),
  password: string (required)
}
```

### Staff Schemas

**Create Staff**
```typescript
{
  employee_number: string (required),
  first_name: string (required),
  last_name: string (required),
  email: string (valid email),
  phone?: string,
  hire_date: string (valid date),
  department_id: string (UUID),
  position: string (required),
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated',
  skills?: string[],
  certifications?: string[],
  organization_id: string (UUID)
}
```

**Update Staff**
- All fields from Create Staff are optional (partial)

**Staff Query**
```typescript
{
  organizationId?: string (UUID),
  departmentId?: string (UUID),
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated',
  page?: number,
  limit?: number
}
```

### Schedule Schemas

**Create Schedule**
```typescript
{
  employee_id: string (UUID),
  shift_template_id: string (UUID),
  shift_date: string (valid date),
  start_time: string (HH:MM or HH:MM:SS),
  end_time: string (HH:MM or HH:MM:SS),
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
  department_id: string (UUID),
  organization_id: string (UUID),
  notes?: string
}
```

**Assign Shift**
```typescript
{
  employeeId: string (UUID),
  shiftTemplateId: string (UUID),
  shiftDate: string (valid date)
}
```

**Bulk Assign**
```typescript
{
  assignments: Array<AssignShift> (min 1 item)
}
```

### Department Schemas

**Create Department**
```typescript
{
  name: string (required, max 100 chars),
  description?: string (max 500 chars),
  manager_id?: string (UUID),
  organization_id: string (UUID)
}
```

**Update Department**
- All fields optional, but at least one field required

## Common Validation Schemas

Reusable validation helpers in `common.schema.ts`:

- `uuidSchema` - Validates UUID format
- `paginationSchema` - Validates page, limit, sortBy, sortOrder
- `dateRangeSchema` - Validates start/end date with range check
- `emailSchema` - Validates email format
- `phoneSchema` - Validates phone number format

## Error Response Format

When validation fails, the API returns a 400 status with:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Usage Examples

### Adding Validation to New Route

```typescript
import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { createPTOSchema } from '../schemas/pto.schema';

const router = Router();

router.post('/pto', validate(createPTOSchema), ptoController.create);
```

### Creating New Validation Schema

```typescript
// schemas/pto.schema.ts
import { z } from 'zod';

export const createPTOSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  request_type: z.enum(['vacation', 'sick', 'personal', 'unpaid', 'other']),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  hours_requested: z.number().positive('Hours must be positive'),
  reason: z.string().max(500, 'Reason too long').optional(),
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  {
    message: 'Start date must be before or equal to end date',
    path: ['start_date'],
  }
);

export type CreatePTOInput = z.infer<typeof createPTOSchema>;
```

### Validating Multiple Sources

```typescript
router.post(
  '/schedule/:deptId',
  validateUuidParam('deptId'),           // Validate URL param
  validateQuery(dateRangeQuerySchema),   // Validate query string
  validate(createScheduleSchema),        // Validate request body
  scheduleController.create
);
```

## Advanced Validation

### Custom Refinements

Add custom validation logic:

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  age: z.number(),
}).refine(
  (data) => data.age >= 18,
  {
    message: 'User must be 18 or older',
    path: ['age'],
  }
);
```

### Conditional Validation

```typescript
const shiftSchema = z.object({
  type: z.enum(['regular', 'overtime']),
  hours: z.number(),
}).refine(
  (data) => data.type !== 'overtime' || data.hours <= 12,
  {
    message: 'Overtime shifts cannot exceed 12 hours',
    path: ['hours'],
  }
);
```

### Transform Values

```typescript
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number),
  limit: z.string().regex(/^\d+$/).transform(Number),
});
```

## Benefits

1. **Type Safety**: Automatic TypeScript types from schemas
2. **Runtime Validation**: Catch invalid data before it reaches your business logic
3. **Clear Errors**: Specific, field-level error messages
4. **Consistency**: Uniform validation across all endpoints
5. **Maintainability**: Centralized validation logic
6. **Security**: Prevent injection attacks and malformed data

## Testing Validation

```bash
# Valid request
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "organizationId": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Invalid request (missing field)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "weak"
  }'

# Response:
# {
#   "error": "Validation failed",
#   "details": [
#     { "field": "password", "message": "Password must be at least 8 characters" },
#     { "field": "name", "message": "Required" },
#     { "field": "organizationId", "message": "Required" }
#   ]
# }
```

## Best Practices

1. **Always validate input** - Never trust client data
2. **Validate early** - Place validation middleware before business logic
3. **Specific error messages** - Help developers debug issues
4. **Reuse schemas** - DRY principle for common validations
5. **Document requirements** - Clear schemas = clear API contracts
6. **Test edge cases** - Validate boundary conditions
7. **Consider performance** - Validation is fast but cumulative

## Next Steps

- Add validation for remaining entities (PTO, attendance, labor actions)
- Implement custom validators for business rules
- Add request sanitization middleware
- Create validation test suite
- Add API documentation with validated schemas
