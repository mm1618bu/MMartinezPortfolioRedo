# CSV Import Templates

This document defines the CSV templates for bulk importing data into the Staffing Flow application.

## General Guidelines

### File Format
- **Encoding**: UTF-8
- **Delimiter**: Comma (`,`)
- **Line Ending**: LF (`\n`) or CRLF (`\r\n`)
- **Header Row**: Required (first row must contain column names)
- **Quote Character**: Double quotes (`"`) for fields containing commas, newlines, or quotes
- **Date Format**: ISO 8601 (`YYYY-MM-DD`)
- **DateTime Format**: ISO 8601 (`YYYY-MM-DDTHH:MM:SS` or `YYYY-MM-DDTHH:MM:SSZ`)
- **Boolean Values**: `true`/`false` or `1`/`0`

### Validation Rules
- All required fields must be present and non-empty
- UUID fields can be empty for auto-generation or provided for specific IDs
- Enum values must match exactly (case-sensitive)
- Email addresses must be valid format
- Phone numbers can be in any reasonable format
- Numeric values must be valid numbers

### Error Handling
- Invalid rows will be logged with specific error messages
- Valid rows will be imported even if some rows fail
- Import summary report will be generated showing success/failure counts

---

## 1. Staff Import Template

### File Name Convention
`staff_import_YYYY-MM-DD.csv`

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| first_name | string | ✓ | Staff member's first name | John |
| last_name | string | ✓ | Staff member's last name | Smith |
| email | string | ✓ | Valid email address (unique) | john.smith@example.com |
| phone | string | | Phone number | (555) 123-4567 |
| department_id | uuid | ✓ | Department UUID (must exist) | 550e8400-e29b-41d4-a716-446655440000 |
| position | string | ✓ | Job position/title | Nurse |
| hire_date | date | ✓ | Date of hire (YYYY-MM-DD) | 2024-01-15 |
| status | enum | | active, inactive, on_leave, terminated | active |
| hourly_rate | number | | Hourly pay rate | 25.50 |
| weekly_hours | number | | Expected weekly hours | 40 |
| user_id | uuid | | Link to existing user account | |

### Optional/Derived Fields
- `id`: Auto-generated if not provided
- `status`: Defaults to `active` if not provided
- `weekly_hours`: Defaults to `40` if not provided
- `organization_id`: Automatically set from authenticated user's organization
- `created_at`: Auto-generated
- `updated_at`: Auto-generated

### Example CSV

```csv
first_name,last_name,email,phone,department_id,position,hire_date,status,hourly_rate,weekly_hours
John,Smith,john.smith@example.com,(555) 123-4567,550e8400-e29b-41d4-a716-446655440000,Registered Nurse,2024-01-15,active,32.50,40
Sarah,Johnson,sarah.j@example.com,(555) 234-5678,550e8400-e29b-41d4-a716-446655440000,Nurse Practitioner,2024-02-01,active,45.00,36
Michael,Williams,mike.w@example.com,,550e8400-e29b-41d4-a716-446655440001,Physician Assistant,2023-11-20,active,55.00,40
Emily,Davis,emily.d@example.com,(555) 456-7890,550e8400-e29b-41d4-a716-446655440001,Medical Assistant,2024-03-10,active,22.50,32
```

### Validation Rules
- `email`: Must be valid email format and unique across organization
- `department_id`: Must reference existing department
- `status`: Must be one of: active, inactive, on_leave, terminated
- `hire_date`: Cannot be in the future
- `hourly_rate`: Must be positive number if provided
- `weekly_hours`: Must be between 1 and 168

---

## 2. Schedule Import Template

### File Name Convention
`schedule_import_YYYY-MM-DD.csv`

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| staff_id | uuid | ✓ | Staff member UUID (must exist) | 550e8400-e29b-41d4-a716-446655440000 |
| start_time | datetime | ✓ | Shift start date and time | 2024-03-20T08:00:00 |
| end_time | datetime | ✓ | Shift end date and time | 2024-03-20T16:00:00 |
| position | string | ✓ | Position for this shift | Registered Nurse |
| notes | string | | Additional notes | ICU assignment |
| status | enum | | draft, published, archived | published |

### Optional/Derived Fields
- `id`: Auto-generated
- `status`: Defaults to `draft` if not provided
- `created_by`: Set to authenticated user's ID
- `organization_id`: Automatically set from authenticated user's organization
- `created_at`: Auto-generated
- `updated_at`: Auto-generated

### Example CSV

```csv
staff_id,start_time,end_time,position,notes,status
550e8400-e29b-41d4-a716-446655440000,2024-03-20T08:00:00,2024-03-20T16:00:00,Registered Nurse,ICU assignment,published
550e8400-e29b-41d4-a716-446655440001,2024-03-20T16:00:00,2024-03-21T00:00:00,Registered Nurse,ER night shift,published
550e8400-e29b-41d4-a716-446655440002,2024-03-21T08:00:00,2024-03-21T16:00:00,Nurse Practitioner,Clinic duty,published
550e8400-e29b-41d4-a716-446655440000,2024-03-21T08:00:00,2024-03-21T16:00:00,Registered Nurse,,draft
```

### Validation Rules
- `staff_id`: Must reference existing staff member
- `start_time`: Must be valid ISO 8601 datetime
- `end_time`: Must be after `start_time`
- `status`: Must be one of: draft, published, archived
- Shift duration should not exceed 24 hours
- Check for overlapping shifts for same staff member (warning, not error)

---

## 3. Time Off Import Template

### File Name Convention
`timeoff_import_YYYY-MM-DD.csv`

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| staff_id | uuid | ✓ | Staff member UUID (must exist) | 550e8400-e29b-41d4-a716-446655440000 |
| type | enum | ✓ | Type of time off | vacation |
| start_date | date | ✓ | First day of time off | 2024-04-15 |
| end_date | date | ✓ | Last day of time off | 2024-04-19 |
| reason | string | | Reason for time off request | Family vacation |
| status | enum | | pending, approved, denied, cancelled | pending |

### Optional/Derived Fields
- `id`: Auto-generated
- `total_days`: Automatically calculated from date range
- `status`: Defaults to `pending` if not provided
- `reviewed_by`: Set when status changes from pending
- `reviewed_at`: Set when status changes from pending
- `review_notes`: Optional notes from reviewer
- `organization_id`: Automatically set from authenticated user's organization
- `created_at`: Auto-generated
- `updated_at`: Auto-generated

### Example CSV

```csv
staff_id,type,start_date,end_date,reason,status
550e8400-e29b-41d4-a716-446655440000,vacation,2024-04-15,2024-04-19,Family vacation,approved
550e8400-e29b-41d4-a716-446655440001,sick,2024-03-25,2024-03-25,Medical appointment,approved
550e8400-e29b-41d4-a716-446655440002,personal,2024-05-01,2024-05-02,Personal matters,pending
550e8400-e29b-41d4-a716-446655440003,vacation,2024-06-10,2024-06-21,Summer vacation,pending
```

### Validation Rules
- `staff_id`: Must reference existing staff member
- `type`: Must be one of: vacation, sick, personal, unpaid, bereavement, jury_duty
- `start_date`: Cannot be more than 1 year in the past
- `end_date`: Must be same or after `start_date`
- `status`: Must be one of: pending, approved, denied, cancelled
- Check for overlapping time off requests (warning)

---

## 4. Department Import Template

### File Name Convention
`department_import_YYYY-MM-DD.csv`

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| name | string | ✓ | Department name (unique) | Emergency Department |
| description | string | | Department description | 24/7 emergency care services |
| manager_id | uuid | | User ID of department manager | 550e8400-e29b-41d4-a716-446655440000 |

### Optional/Derived Fields
- `id`: Auto-generated or provided
- `organization_id`: Automatically set from authenticated user's organization
- `created_at`: Auto-generated
- `updated_at`: Auto-generated

### Example CSV

```csv
name,description,manager_id
Emergency Department,24/7 emergency care services,550e8400-e29b-41d4-a716-446655440000
Intensive Care Unit,Critical care for severely ill patients,550e8400-e29b-41d4-a716-446655440001
Outpatient Clinic,General outpatient medical services,
Surgery,Surgical procedures and post-op care,550e8400-e29b-41d4-a716-446655440002
Radiology,Medical imaging and diagnostics,
```

### Validation Rules
- `name`: Must be unique within organization
- `manager_id`: Must reference existing user with appropriate role if provided

---

## 5. User Import Template

### File Name Convention
`user_import_YYYY-MM-DD.csv`

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| email | string | ✓ | Valid email address (unique) | admin@example.com |
| name | string | ✓ | Full name | John Smith |
| role | enum | ✓ | User role | manager |
| team_id | uuid | | Team/department assignment | 550e8400-e29b-41d4-a716-446655440000 |
| password | string | | Initial password (min 8 chars) | TempPass123! |
| send_invite | boolean | | Send invitation email | true |

### Optional/Derived Fields
- `id`: Auto-generated
- `organization_id`: Automatically set from authenticated user's organization
- `password`: If empty and `send_invite=true`, generates temporary password
- `created_at`: Auto-generated
- `updated_at`: Auto-generated

### Example CSV

```csv
email,name,role,team_id,password,send_invite
john.manager@example.com,John Manager,manager,550e8400-e29b-41d4-a716-446655440000,,true
sarah.admin@example.com,Sarah Admin,admin,,,true
mike.staff@example.com,Mike Staff,staff,550e8400-e29b-41d4-a716-446655440001,TempPass123!,false
emily.viewer@example.com,Emily Viewer,viewer,,,true
```

### Validation Rules
- `email`: Must be valid email format and unique across entire system
- `role`: Must be one of: super_admin, admin, manager, staff, viewer
- `team_id`: Must reference existing department if provided
- `password`: Must be at least 8 characters if provided
- Note: super_admin role can only be assigned by existing super_admin users

---

## Import API Endpoints

### Bulk Import Endpoint
```
POST /api/v1/{resource}/import
Content-Type: multipart/form-data

Parameters:
- file: CSV file (required)
- validate_only: boolean (optional) - Only validate without importing
- skip_errors: boolean (optional) - Continue on row errors
- update_existing: boolean (optional) - Update records with matching emails/IDs

Response:
{
  "success": true,
  "total_rows": 100,
  "imported": 95,
  "failed": 5,
  "errors": [
    {
      "row": 3,
      "field": "email",
      "message": "Email already exists",
      "value": "duplicate@example.com"
    }
  ]
}
```

### Available Import Endpoints
- `/api/v1/staff/import` - Import staff members
- `/api/v1/schedules/import` - Import schedules
- `/api/v1/timeoff/import` - Import time off requests
- `/api/v1/departments/import` - Import departments
- `/api/v1/users/import` - Import users (admin only)

### Import Permissions
- **Staff Import**: Requires `staff.create` permission
- **Schedule Import**: Requires `schedule.create` permission
- **Time Off Import**: Requires `timeoff.create` permission
- **Department Import**: Requires `department.create` permission
- **User Import**: Requires `user.create` permission

---

## Best Practices

### 1. Data Preparation
- Clean and validate data in spreadsheet software before export
- Remove extra columns not in template
- Ensure consistent data formats
- Test with small sample file first

### 2. Large Imports
- Split files larger than 10,000 rows
- Import during off-peak hours
- Use `validate_only=true` first to check for errors
- Monitor import progress via API or UI

### 3. Related Data Import Order
1. Departments (required for staff)
2. Users (optional, can be linked to staff)
3. Staff (required for schedules and time off)
4. Schedules
5. Time Off

### 4. Error Recovery
- Save error report from failed imports
- Fix errors in original CSV file
- Re-import with `update_existing=true` to update fixed records
- Use `skip_errors=true` for partial imports

### 5. Backup Before Import
- Export existing data before large imports
- Test import on staging environment first
- Keep original CSV files for reference

---

## Example Import Workflow

```bash
# 1. Validate file first
curl -X POST https://api.staffingflow.com/v1/staff/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@staff_import_2024-03-20.csv" \
  -F "validate_only=true"

# 2. Review validation errors and fix CSV

# 3. Perform actual import
curl -X POST https://api.staffingflow.com/v1/staff/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@staff_import_2024-03-20.csv" \
  -F "skip_errors=false"

# 4. Check import results
# Response will include success/failure counts and detailed errors
```

---

## Troubleshooting

### Common Errors

**"Email already exists"**
- Solution: Use `update_existing=true` or remove/change duplicate emails

**"Department not found"**
- Solution: Import departments first, verify department_id UUIDs are correct

**"Invalid date format"**
- Solution: Ensure dates are in YYYY-MM-DD format, not MM/DD/YYYY

**"Staff not found"**
- Solution: Import staff before schedules/time off, verify staff_id UUIDs

**"Permission denied"**
- Solution: Check user has required permission for import operation

**"File encoding error"**
- Solution: Save CSV as UTF-8 encoding

---

## Support

For questions or issues with CSV imports:
- Check validation errors in import response
- Review this documentation
- Contact support: support@staffingflow.com
- API Documentation: [API_GUIDE.md](./API_GUIDE.md)
