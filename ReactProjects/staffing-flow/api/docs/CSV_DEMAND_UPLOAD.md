# CSV Demand Upload API

API for bulk uploading workforce demand forecasts via CSV files.

## Overview

The CSV Demand Upload API allows you to import multiple demand records at once by uploading a CSV file. This is useful for:
- Bulk importing demand forecasts
- Migrating data from other systems
- Batch updates to existing demand records

## Endpoints

### 1. Upload CSV

**POST** `/api/demands/upload`

Upload a CSV file with demand data.

#### Request

- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (Bearer token)

**Form Fields:**
- `file` (required): CSV file
- `organization_id` (required): Organization UUID
- `override_existing` (optional, default: false): Update existing records if duplicate found
- `validate_only` (optional, default: false): Validate without importing (dry run)

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/demands/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@demand_data.csv" \
  -F "organization_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "override_existing=true" \
  -F "validate_only=false"
```

**Example using JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('organization_id', 'your-org-id');
formData.append('override_existing', 'true');
formData.append('validate_only', 'false');

const response = await fetch('http://localhost:3001/api/demands/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

#### Response

**Success (200/207):**
```json
{
  "success": true,
  "total_rows": 100,
  "valid_rows": 95,
  "invalid_rows": 5,
  "inserted_rows": 85,
  "updated_rows": 10,
  "errors": [
    {
      "row": 3,
      "field": "date",
      "message": "Invalid date format. Expected YYYY-MM-DD"
    },
    {
      "row": 15,
      "message": "Department not found: Sales Department"
    }
  ],
  "warnings": [
    {
      "row": 7,
      "message": "Shift type not specified, defaulting to null"
    }
  ]
}
```

**Status Codes:**
- `200`: All rows processed successfully
- `207`: Partial success (some rows failed)
- `400`: Invalid request (bad file, missing parameters)
- `401`: Unauthorized
- `500`: Server error

### 2. Download CSV Template

**GET** `/api/demands/template`

Download a CSV template with example data.

#### Request

- **Authentication**: Required

**Example:**
```bash
curl -X GET http://localhost:3001/api/demands/template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o demand_template.csv
```

#### Response

Returns a CSV file with headers and example data.

### 3. Get All Demands

**GET** `/api/demands`

Retrieve demand records with optional filtering.

#### Query Parameters

- `organizationId` (required): Organization UUID
- `departmentId` (optional): Filter by department
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `shiftType` (optional): Filter by shift type
- `priority` (optional): Filter by priority level
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page

**Example:**
```bash
curl -X GET "http://localhost:3001/api/demands?organizationId=123&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Demand by ID

**GET** `/api/demands/:id`

Retrieve a single demand record.

### 5. Create Demand

**POST** `/api/demands`

Create a new demand record.

### 6. Update Demand

**PUT** `/api/demands/:id`

Update an existing demand record.

### 7. Delete Demand

**DELETE** `/api/demands/:id`

Delete a demand record.

### 8. Get Statistics

**GET** `/api/demands/statistics`

Get aggregated demand statistics.

#### Query Parameters

- `organizationId` (required): Organization UUID
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Example Response:**
```json
{
  "totalRecords": 250,
  "totalDemand": 1250,
  "averageDemand": 5,
  "uniqueDepartments": 8,
  "priorityCounts": {
    "low": 50,
    "medium": 100,
    "high": 75,
    "critical": 25
  }
}
```

## CSV Format

### Required Fields

- **date**: Date in YYYY-MM-DD format
- **required_employees**: Positive integer (number of employees needed)
- **department_id** OR **department_name**: Department identifier

### Optional Fields

- **shift_type**: One of: `morning`, `afternoon`, `evening`, `night`, `split`, `all_day`
- **start_time**: Time in HH:MM format (24-hour)
- **end_time**: Time in HH:MM format (24-hour)
- **required_skills**: Comma-separated list of skill names
- **priority**: One of: `low`, `medium` (default), `high`, `critical`
- **notes**: Text description (max 500 characters)

### CSV Example

```csv
date,department_name,shift_type,start_time,end_time,required_employees,required_skills,priority,notes
2024-02-01,Customer Service,morning,08:00,16:00,5,"customer service,data entry",high,Peak season
2024-02-01,Sales,afternoon,12:00,20:00,3,sales,medium,Regular coverage
2024-02-02,IT,all_day,00:00,23:59,2,"technical support,networking",critical,System maintenance
```

### Important Notes

1. **Department Identification**: You can use either:
   - `department_id`: UUID of the department
   - `department_name`: Name of the department (will be resolved to ID)

2. **Skills**: Can be provided as:
   - Comma-separated string: `"skill1,skill2,skill3"`
   - Array format: `["skill1","skill2","skill3"]`

3. **Duplicate Handling**:
   - With `override_existing=false`: Duplicates are skipped
   - With `override_existing=true`: Existing records are updated
   - Duplicate detection: Same date + department + organization

4. **Validation Mode**:
   - Use `validate_only=true` to check CSV without importing
   - Returns validation results with errors/warnings
   - No database changes are made

5. **Error Handling**:
   - Row-level errors are tracked individually
   - Partial success is possible (some rows succeed, others fail)
   - Check the `errors` array for details on failed rows

## Validation Rules

### Date Format
- Must be in YYYY-MM-DD format
- Example: `2024-02-15`

### Time Format
- Must be in HH:MM format (24-hour)
- Example: `14:30`

### Required Employees
- Must be a positive integer
- Example: `5`

### Shift Type
- Valid values: `morning`, `afternoon`, `evening`, `night`, `split`, `all_day`
- Case-sensitive

### Priority
- Valid values: `low`, `medium`, `high`, `critical`
- Default: `medium`
- Case-sensitive

### Notes
- Maximum 500 characters
- Optional

## Error Messages

Common error messages and how to fix them:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid date format" | Date not in YYYY-MM-DD | Use format: 2024-02-15 |
| "Department not found" | Department name doesn't exist | Check department name or use department_id |
| "Invalid shift type" | Unknown shift type value | Use: morning, afternoon, evening, night, split, or all_day |
| "Required field missing" | Missing date or required_employees | Ensure all required fields are present |
| "Invalid time format" | Time not in HH:MM | Use 24-hour format: 14:30 |
| "required_employees must be positive" | Zero or negative value | Use positive integer: 5 |

## Best Practices

1. **Always validate first**: Use `validate_only=true` before actual import
2. **Start small**: Test with a few rows before bulk uploading
3. **Use department names**: More readable than UUIDs in CSV
4. **Check results**: Review `errors` and `warnings` arrays
5. **Handle partial success**: Some rows may succeed even if others fail
6. **Download template**: Use `/api/demands/template` to get correct format
7. **Backup data**: Before using `override_existing=true`

## Example Workflow

### 1. Download Template
```bash
curl http://localhost:3001/api/demands/template \
  -H "Authorization: Bearer TOKEN" \
  -o template.csv
```

### 2. Fill in Data
Edit `template.csv` with your demand data.

### 3. Validate CSV
```bash
curl -X POST http://localhost:3001/api/demands/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@template.csv" \
  -F "organization_id=YOUR_ORG_ID" \
  -F "validate_only=true"
```

### 4. Review Validation Results
Check the response for errors and warnings.

### 5. Import Data
```bash
curl -X POST http://localhost:3001/api/demands/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@template.csv" \
  -F "organization_id=YOUR_ORG_ID" \
  -F "override_existing=false"
```

### 6. Verify Import
```bash
curl http://localhost:3001/api/demands/statistics?organizationId=YOUR_ORG_ID \
  -H "Authorization: Bearer TOKEN"
```

## File Size Limits

- Maximum file size: **10 MB**
- Recommended: Keep files under 5 MB for optimal performance
- For larger datasets, split into multiple files

## Rate Limiting

CSV uploads are subject to the API's standard rate limiting:
- Standard rate limit applies
- Consider splitting very large imports across multiple requests

## Support

For issues or questions:
1. Check validation errors in the response
2. Review this documentation
3. Verify CSV format matches template
4. Check authentication token is valid
5. Ensure organization_id exists and is accessible
