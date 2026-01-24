# Demand Schema Validation and Error Reporting

## Overview

The Demand CSV Upload API includes comprehensive validation and error reporting to ensure data quality and provide actionable feedback when issues occur.

## Validation Layers

### 1. **Schema Validation (Zod)**
Validates data types, formats, and basic constraints.

### 2. **Business Rule Validation**
Validates business logic and reasonable operational constraints.

### 3. **Database Validation**
Validates referential integrity and database-level constraints.

## Error Types

### `VALIDATION_ERROR`
Schema or format validation failures.

**Examples:**
- Invalid date format
- Missing required field
- Wrong data type
- Invalid enum value

**Response:**
```json
{
  "type": "VALIDATION_ERROR",
  "severity": "error",
  "message": "date: Invalid date format. Expected YYYY-MM-DD",
  "field": "date",
  "row": 5,
  "value": "2024/02/15"
}
```

### `BUSINESS_RULE_VIOLATION`
Business logic constraint failures.

**Examples:**
- Date too far in past/future
- Required employees exceeds limit (1000)
- End time before start time
- Shift duration unreasonable

**Response:**
```json
{
  "type": "BUSINESS_RULE_VIOLATION",
  "severity": "error",
  "message": "End time (08:00) must be after start time (16:00)",
  "field": "end_time",
  "row": 12
}
```

### `CSV_FORMAT_ERROR`
CSV file structure or formatting issues.

**Examples:**
- Missing required headers
- Malformed CSV
- Invalid encoding

**Response:**
```json
{
  "type": "CSV_FORMAT_ERROR",
  "severity": "error",
  "message": "Missing required header: date",
  "row": 0
}
```

### `DATABASE_ERROR`
Database operation failures.

**Examples:**
- Foreign key violation
- Unique constraint violation
- Connection error

**Response:**
```json
{
  "type": "DATABASE_ERROR",
  "severity": "error",
  "message": "Department not found with name: Marketing",
  "details": {
    "department_name": "Marketing"
  }
}
```

### `DUPLICATE_ERROR`
Duplicate record detection.

**Examples:**
- Same date/department/shift already exists

**Response:**
```json
{
  "type": "DUPLICATE_ERROR",
  "severity": "warning",
  "message": "Duplicate demand for 2024-02-15, Sales, morning shift",
  "row": 8,
  "details": {
    "date": "2024-02-15",
    "department": "Sales",
    "shift_type": "morning"
  }
}
```

### `NOT_FOUND`
Referenced entity not found.

**Examples:**
- Department doesn't exist
- Organization not found

**Response:**
```json
{
  "type": "NOT_FOUND",
  "severity": "error",
  "message": "Department 'IT Support' not found in organization"
}
```

### `PERMISSION_DENIED`
Authorization failures.

**Examples:**
- User lacks required role
- Cross-organization access attempt

**Response:**
```json
{
  "type": "PERMISSION_DENIED",
  "severity": "error",
  "message": "Insufficient permissions to create demands"
}
```

## Error Severity Levels

### `error` (Severity)
**Critical issues that prevent processing.**

- Record will not be imported
- Must be fixed before retry
- Counts toward invalid_rows

### `warning` (Severity)
**Non-critical issues that allow processing.**

- Record will be imported
- May indicate potential problems
- Should be reviewed but not blocking

### `info` (Severity)
**Informational messages.**

- No action required
- Helpful context
- Best practice suggestions

## Validation Rules

### Date Validation

#### Required Format
`YYYY-MM-DD` (ISO 8601)

**Valid:** `2024-02-15`  
**Invalid:** `02/15/2024`, `15-Feb-2024`, `2024-2-15`

#### Date Range Constraints

| Constraint | Error/Warning | Rule |
|------------|---------------|------|
| > 1 year in past | ERROR | Historical data limit |
| > 2 years in future | ERROR | Forecast horizon limit |
| In the past | WARNING | Possibly historical |
| > 6 months future | WARNING | Long-term forecast uncertainty |

**Examples:**

```typescript
// ERROR: Too old
{ date: "2023-01-15" } // If today is 2025-02-15

// ERROR: Too far future
{ date: "2028-01-15" } // If today is 2026-01-15

// WARNING: Historical
{ date: "2025-12-01" } // If today is 2026-01-15

// WARNING: Long-term forecast
{ date: "2026-09-15" } // If today is 2026-01-15
```

### Time Validation

#### Required Format
`HH:MM` (24-hour format)

**Valid:** `08:00`, `14:30`, `23:59`  
**Invalid:** `8:00`, `2:30 PM`, `25:00`

#### Time Range Constraints

| Constraint | Error/Warning | Rule |
|------------|---------------|------|
| end_time ≤ start_time | ERROR | Logical impossibility |
| Missing start_time with end_time | ERROR | Incomplete time range |
| Duration < 2 hours | WARNING | Very short shift |
| Duration > 12 hours | WARNING | Very long shift |

**Examples:**

```typescript
// ERROR: End before start
{ start_time: "16:00", end_time: "08:00" }

// ERROR: Incomplete range
{ start_time: "08:00", end_time: null }

// WARNING: Short shift
{ start_time: "08:00", end_time: "09:30" } // 1.5 hours

// WARNING: Long shift
{ start_time: "07:00", end_time: "21:00" } // 14 hours
```

### Required Employees Validation

#### Constraints

| Constraint | Error/Warning | Rule |
|------------|---------------|------|
| ≤ 0 | ERROR | Must be positive |
| > 1000 | ERROR | Exceeds reasonable limit |
| > 100 | WARNING | Unusually high demand |

**Examples:**

```typescript
// ERROR: Not positive
{ required_employees: 0 }
{ required_employees: -5 }

// ERROR: Exceeds limit
{ required_employees: 1500 }

// WARNING: High demand
{ required_employees: 250 }

// VALID
{ required_employees: 5 }
{ required_employees: 50 }
```

### Shift Type Validation

#### Valid Values
- `morning`
- `afternoon`
- `evening`
- `night`
- `split`
- `all_day`

#### Consistency Rules

| Scenario | Validation | Message |
|----------|-----------|---------|
| `all_day` + times specified | WARNING | Times ignored for all_day |
| Specific shift + no times | WARNING | Consider adding times |
| No shift type | WARNING | Applies to all shifts |

**Examples:**

```typescript
// WARNING: Conflicting all_day
{
  shift_type: "all_day",
  start_time: "08:00",
  end_time: "16:00"
}
// Message: "Times will be ignored for all_day shifts"

// WARNING: Missing times
{
  shift_type: "morning",
  start_time: null,
  end_time: null
}
// Message: "Consider adding start_time and end_time"
```

### Priority Validation

#### Valid Values
- `low`
- `medium` (default)
- `high`
- `critical`

**Case-insensitive:** Values are normalized to lowercase

### Skills Validation

#### Accepted Formats

**Comma-separated string:**
```csv
required_skills
"customer service,data entry,typing"
```

**Array (in JSON):**
```json
{
  "required_skills": ["customer service", "data entry", "typing"]
}
```

**Normalized output:** Always array of strings

### Department Validation

#### Identification Methods

**Option 1: Department ID (UUID)**
```csv
department_id
123e4567-e89b-12d3-a456-426614174000
```

**Option 2: Department Name**
```csv
department_name
Customer Service
```

#### Validation Rules

| Rule | Error Type | Message |
|------|-----------|---------|
| Both missing | VALIDATION_ERROR | Must provide department_id or department_name |
| Name not found | NOT_FOUND | Department 'X' not found |
| ID not found | NOT_FOUND | Department ID not found |

## Error Response Format

### Upload Response Structure

```json
{
  "success": false,
  "total_rows": 100,
  "valid_rows": 85,
  "invalid_rows": 15,
  "inserted_rows": 0,
  "updated_rows": 0,
  "errors": [
    {
      "type": "VALIDATION_ERROR",
      "severity": "error",
      "message": "date: Invalid date format. Expected YYYY-MM-DD",
      "field": "date",
      "row": 3,
      "value": "2024/02/15",
      "code": "invalid_string"
    },
    {
      "type": "BUSINESS_RULE_VIOLATION",
      "severity": "error",
      "message": "End time (08:00) must be after start time (16:00)",
      "field": "end_time",
      "row": 12
    },
    {
      "type": "NOT_FOUND",
      "severity": "error",
      "message": "Department 'Marketing' not found in organization",
      "row": 25
    }
  ],
  "warnings": [
    {
      "row": 7,
      "field": "date",
      "message": "Date 2025-12-01 is in the past. Consider if this is intentional.",
      "suggestedFix": null
    },
    {
      "row": 18,
      "field": "end_time",
      "message": "Shift duration is only 1h 30m. Consider if this is sufficient.",
      "suggestedFix": null
    },
    {
      "row": 42,
      "field": "shift_type",
      "message": "Shift type is \"all_day\" but specific times are provided. Times will be ignored.",
      "suggestedFix": "Remove start_time and end_time for all_day shifts"
    }
  ]
}
```

### Field Descriptions

#### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | True if all valid rows processed successfully |
| `total_rows` | number | Total rows in CSV (excluding header) |
| `valid_rows` | number | Rows that passed validation |
| `invalid_rows` | number | Rows that failed validation |
| `inserted_rows` | number | New records created |
| `updated_rows` | number | Existing records updated |

#### Error Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Error type (see Error Types above) |
| `severity` | string | Yes | `error`, `warning`, or `info` |
| `message` | string | Yes | Human-readable error description |
| `field` | string | No | Field that caused the error |
| `row` | number | No | Row number (1-based, excluding header) |
| `value` | any | No | Invalid value that caused error |
| `code` | string | No | Error code for programmatic handling |
| `details` | object | No | Additional context |

#### Warning Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `row` | number | No | Row number where warning occurred |
| `field` | string | No | Field related to warning |
| `message` | string | Yes | Warning description |
| `suggestedFix` | string | No | Suggested resolution |

## Using Validation in Code

### TypeScript Usage

```typescript
import { DemandValidator, DemandErrorFormatter } from './utils/demand-validation';

// Validate a single demand record
const validation = DemandValidator.validateDemandRecord({
  date: '2024-02-15',
  required_employees: 5,
  shift_type: 'morning',
  start_time: '08:00',
  end_time: '16:00',
});

if (validation.isValid) {
  console.log('Valid:', validation.validatedData);
} else {
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}

// Format Zod errors
try {
  demandRecordSchema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    const formattedErrors = DemandErrorFormatter.formatZodError(error);
    console.log('Formatted errors:', formattedErrors);
  }
}

// Use error aggregator for batch operations
const aggregator = new ErrorAggregator();

records.forEach((record, index) => {
  const validation = DemandValidator.validateDemandRecord(record);
  aggregator.addErrors(validation.errors);
  aggregator.addWarnings(validation.warnings);
});

console.log('Summary:', aggregator.getSummary());
// {
//   totalErrors: 12,
//   totalWarnings: 5,
//   errorsByType: { VALIDATION_ERROR: 8, BUSINESS_RULE_VIOLATION: 4 },
//   errorsBySeverity: { error: 12 }
// }
```

## Validation Best Practices

### 1. **Validate Early**
Run `validate_only=true` before actual import to catch issues.

```bash
curl -X POST /api/demands/upload \
  -F "file=@data.csv" \
  -F "organization_id=..." \
  -F "validate_only=true"
```

### 2. **Review Warnings**
Warnings indicate potential issues that don't block import but may need attention.

### 3. **Fix Errors Incrementally**
Focus on one error type at a time:
1. CSV format errors (row 0)
2. Validation errors (data types, formats)
3. Business rule violations
4. Database errors (missing references)

### 4. **Use Error Aggregation**
Group errors by type or field to identify patterns:

```typescript
const errorsByField = errors.reduce((acc, err) => {
  const field = err.field || 'unknown';
  acc[field] = (acc[field] || 0) + 1;
  return acc;
}, {});

// Result: { date: 15, required_employees: 3, department_name: 8 }
```

### 5. **Leverage Suggested Fixes**
Warnings may include `suggestedFix` field with actionable guidance.

## Database-Level Validation

### Triggers

The `demands` table includes database triggers for additional validation:

#### 1. **Business Rules Trigger**
```sql
trigger_validate_demand_rules
```

**Validations:**
- Date not older than 1 year
- Date not more than 2 years in future
- Required employees ≤ 1000
- Warns if shift type lacks times

#### 2. **Updated Timestamp Trigger**
```sql
trigger_demands_updated_at
```

Automatically updates `updated_at` field on record changes.

### Constraints

#### Check Constraints

```sql
-- Required employees must be positive
CHECK (required_employees > 0)

-- Valid priority values
CHECK (priority IN ('low', 'medium', 'high', 'critical'))

-- Valid shift types
CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'split', 'all_day'))

-- End time after start time (if both specified)
CHECK (end_time > start_time OR (start_time IS NULL AND end_time IS NULL))

-- Notes length limit
CHECK (LENGTH(notes) <= 500)
```

#### Unique Constraints

```sql
-- One demand per organization/department/date/shift combination
UNIQUE (organization_id, department_id, date, shift_type)
```

**Error if violated:**
```json
{
  "type": "DUPLICATE_ERROR",
  "severity": "error",
  "message": "Demand already exists for this date, department, and shift",
  "details": {
    "conflict": "unique_demand_per_day"
  }
}
```

## Common Validation Scenarios

### Scenario 1: Missing Required Field

**CSV Row:**
```csv
date,department_name,shift_type,required_employees
,Customer Service,morning,5
```

**Error:**
```json
{
  "type": "VALIDATION_ERROR",
  "severity": "error",
  "message": "date: Required",
  "field": "date",
  "row": 2
}
```

### Scenario 2: Invalid Date Format

**CSV Row:**
```csv
date,department_name,required_employees
02/15/2024,Sales,5
```

**Error:**
```json
{
  "type": "VALIDATION_ERROR",
  "severity": "error",
  "message": "date: Invalid date format. Expected YYYY-MM-DD",
  "field": "date",
  "row": 2,
  "value": "02/15/2024"
}
```

### Scenario 3: Business Rule Violation

**CSV Row:**
```csv
date,department_name,required_employees,start_time,end_time
2024-02-15,IT,5,16:00,08:00
```

**Error:**
```json
{
  "type": "BUSINESS_RULE_VIOLATION",
  "severity": "error",
  "message": "End time (08:00) must be after start time (16:00)",
  "field": "end_time",
  "row": 2
}
```

### Scenario 4: Department Not Found

**CSV Row:**
```csv
date,department_name,required_employees
2024-02-15,NonExistent Dept,5
```

**Error:**
```json
{
  "type": "NOT_FOUND",
  "severity": "error",
  "message": "Department 'NonExistent Dept' not found in organization",
  "row": 2
}
```

### Scenario 5: Warnings Only

**CSV Row:**
```csv
date,department_name,required_employees,shift_type,start_time,end_time
2026-08-15,Sales,150,morning,08:00,09:30
```

**Warnings:**
```json
[
  {
    "row": 2,
    "field": "date",
    "message": "Date 2026-08-15 is more than 6 months in the future. Long-term forecasts may be less accurate."
  },
  {
    "row": 2,
    "field": "required_employees",
    "message": "Required employees (150) is unusually high. Please verify this is correct."
  },
  {
    "row": 2,
    "field": "end_time",
    "message": "Shift duration is only 1h 30m. Consider if this is sufficient."
  }
]
```

**Result:** Record is imported successfully despite warnings.

## Error Codes Reference

| Code | Description | Example |
|------|-------------|---------|
| `invalid_type` | Wrong data type | String instead of number |
| `invalid_string` | String format invalid | Bad date/time format |
| `invalid_enum_value` | Value not in allowed list | Invalid shift_type |
| `too_small` | Value below minimum | required_employees < 1 |
| `too_big` | Value above maximum | notes > 500 chars |
| `custom` | Custom validation failed | Business rule violation |

## Testing Validation

### Unit Tests

```typescript
describe('DemandValidator', () => {
  it('should reject dates older than 1 year', () => {
    const result = DemandValidator.validateDateRange('2023-01-01');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toContain('older than 1 year');
  });

  it('should warn for dates in the past', () => {
    const result = DemandValidator.validateDateRange('2025-12-01');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should validate time ranges', () => {
    const result = DemandValidator.validateTimeRange('16:00', '08:00');
    expect(result.isValid).toBe(false);
  });
});
```

### Integration Tests

Test full CSV upload with various error scenarios to ensure proper error reporting throughout the pipeline.

## Support

For validation issues:
1. Check error `type` to identify category
2. Review error `message` for specific issue
3. Check `field` to locate problem column
4. Use `row` number to find exact CSV row
5. Apply `suggestedFix` if provided in warnings
