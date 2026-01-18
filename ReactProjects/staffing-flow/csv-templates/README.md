# CSV Import Template Files

This directory contains example CSV templates for bulk importing data into the Staffing Flow application.

## Available Templates

### 1. `staff_import_template.csv`
Template for importing staff members with sample data.

**Usage:**
1. Download and open in spreadsheet software (Excel, Google Sheets, etc.)
2. Replace sample data with your actual staff information
3. Ensure department_id values reference existing departments
4. Save as CSV (UTF-8 encoding)
5. Import via API: `POST /api/v1/staff/import`

### 2. `schedule_import_template.csv`
Template for importing work schedules with sample shifts.

**Usage:**
1. Replace sample data with your actual schedules
2. Ensure staff_id values reference existing staff members
3. Use ISO 8601 datetime format for start_time and end_time
4. Import via API: `POST /api/v1/schedules/import`

### 3. `timeoff_import_template.csv`
Template for importing time off requests.

**Usage:**
1. Replace sample data with actual time off requests
2. Ensure staff_id values reference existing staff members
3. Use ISO 8601 date format (YYYY-MM-DD)
4. Import via API: `POST /api/v1/timeoff/import`

### 4. `department_import_template.csv`
Template for importing departments/teams.

**Usage:**
1. Import departments FIRST before importing staff
2. Replace with your organization's departments
3. manager_id is optional
4. Import via API: `POST /api/v1/departments/import`

### 5. `user_import_template.csv`
Template for importing user accounts.

**Usage:**
1. For creating login accounts for managers/admins
2. Set send_invite=true to email invitation
3. Can link to staff records after creation
4. Import via API: `POST /api/v1/users/import` (requires admin permission)

## Import Order

For a fresh setup, import in this order:

1. **Departments** - Required before staff
2. **Users** (optional) - Can be linked to staff
3. **Staff** - Required before schedules and time off
4. **Schedules** - Depends on staff
5. **Time Off** - Depends on staff

## Customization

### Replacing Sample UUIDs

The templates use example UUIDs. You'll need to replace these with your actual UUIDs:

```bash
# Get your organization's department UUIDs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.staffingflow.com/v1/departments

# Get staff member UUIDs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.staffingflow.com/v1/staff
```

### Generating UUIDs

If you need to generate UUIDs for testing:

**Python:**
```python
import uuid
print(uuid.uuid4())
```

**JavaScript:**
```javascript
crypto.randomUUID()
```

**Online:**
https://www.uuidgenerator.net/

## File Encoding

Always save CSV files with **UTF-8 encoding**:

- **Excel**: File → Save As → CSV UTF-8 (Comma delimited)
- **Google Sheets**: File → Download → Comma-separated values (.csv)
- **LibreOffice**: Save As → Text CSV → Character set: Unicode (UTF-8)

## Testing Your Import

Before importing production data:

1. **Validate only** - Test without importing:
```bash
curl -X POST https://api.staffingflow.com/v1/staff/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@your_file.csv" \
  -F "validate_only=true"
```

2. **Small test** - Import 5-10 rows first
3. **Review results** - Check for any errors
4. **Full import** - Import complete dataset

## Common Issues

### Excel Date Formatting
Excel often converts dates to its own format. To prevent this:
- Format date columns as "Text" before pasting dates
- Use YYYY-MM-DD format consistently
- Don't use Excel's date autocomplete

### Special Characters
For names or notes with commas, quotes, or newlines:
- Enclose the entire field in double quotes
- Example: `"Smith, Jr.",John` or `"Note with ""quotes"""`

### Large Files
For files over 10,000 rows:
- Split into multiple files
- Import during off-peak hours
- Use `skip_errors=true` to continue on failures

## Documentation

For complete documentation, see:
- [CSV_IMPORT_TEMPLATES.md](../CSV_IMPORT_TEMPLATES.md) - Full import specification
- [API_GUIDE.md](../API_GUIDE.md) - API usage examples
- [openapi.yaml](../openapi.yaml) - API schema reference

## Support

Questions or issues? Contact support@staffingflow.com
