# VTO Safety Floor - Quick Reference

## 🎯 What is Safety Floor?

Prevents understaffing by blocking VTO offers that would drop below minimum safe staffing levels.

---

## ⚡ Quick Start

### 1. Check if VTO is Safe

```bash
POST /api/labor-actions/vto/check-safety-floor
```

```json
{
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "proposed_vto_count": 5
}
```

**Response:**
```json
{
  "is_safe": true,
  "available_vto_slots": 8,
  "enforcement_level": "strict"
}
```

### 2. Publish VTO (Auto-Checked)

```bash
POST /api/labor-actions/vto/publish
```

```json
{
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "positions_available": 5,
  "posted_by": "manager-uuid"
}
```

**Success:** `201 Created`  
**Blocked:** `409 Conflict` (safety floor violated)

---

## 🔧 Configuration Types

| Type | Field | Example | Use Case |
|------|-------|---------|----------|
| **Absolute** | `minimum_staff_count` | `12` | Always need X people |
| **Percentage** | `minimum_staff_percentage` | `75` | Never below X% of scheduled |
| **Skills** | `skill_requirements` | `[{skill: "forklift", min: 2}]` | Required skills/roles |
| **Time-Based** | `time_start`, `time_end` | `12:00-14:00` | Peak hours |
| **Day-Based** | `day_of_week` | `0` (Sunday) | Weekend rules |

---

## 🚦 Enforcement Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| **Strict** | ❌ Blocks VTO | Critical operations, safety-sensitive |
| **Warning** | ⚠️ Warns but allows | Standard operations, manager discretion |
| **Advisory** | ℹ️ Informational only | Flexible operations, guidance |

---

## 🔓 Manager Override

When safety floor blocks VTO, managers can override:

```json
{
  "positions_available": 15,
  "skip_safety_floor_check": true,
  "override_reason": "Equipment failure - reduced capacity",
  "override_approved_by": "senior-manager-uuid",
  ...
}
```

**Required Fields:**
- `skip_safety_floor_check: true`
- `override_reason: string` (why override needed)
- `override_approved_by: UUID` (who approved)

---

## 📋 Common Scenarios

### Scenario 1: Normal VTO (Safe)

```
Scheduled: 20 staff
Minimum: 12 staff
VTO Offered: 5 positions
Result: ✅ SAFE (20 - 5 = 15 ≥ 12)
```

### Scenario 2: Blocked VTO (Unsafe)

```
Scheduled: 20 staff
Minimum: 12 staff
VTO Offered: 10 positions
Result: ❌ BLOCKED (20 - 10 = 10 < 12)
Available: Max 8 VTO slots
```

### Scenario 3: Override Required

```
Scheduled: 20 staff
Minimum: 12 staff
VTO Needed: 15 positions (emergency)
Action: Override with reason + approval
Result: ✅ ALLOWED (with audit log)
```

---

## 🗄️ Database Tables

### safety_floor_configs

```sql
id                      UUID PRIMARY KEY
organization_id         UUID NOT NULL
department_id           UUID (NULL = all depts)
shift_template_id       UUID (NULL = all shifts)
day_of_week            INTEGER (0-6, NULL = all days)
time_start             TIME (NULL = no restriction)
time_end               TIME (NULL = no restriction)
minimum_staff_count    INTEGER NOT NULL
minimum_staff_percentage INTEGER
skill_requirements     JSONB
enforcement_level      TEXT ('strict'|'warning'|'advisory')
override_allowed       BOOLEAN
```

### safety_floor_audit_logs

```sql
id                  UUID PRIMARY KEY
labor_action_id     UUID NOT NULL
check_timestamp     TIMESTAMPTZ
is_safe             BOOLEAN
enforcement_level   TEXT
current_staff_count INTEGER
minimum_required    INTEGER
proposed_vto_count  INTEGER
override_applied    BOOLEAN
override_reason     TEXT
override_approved_by UUID
violations          JSONB
```

---

## 📊 Response Structure

### SafetyFloorCheckResponse

```typescript
{
  is_safe: boolean;              // True if VTO is safe
  enforcement_level: string;     // 'strict' | 'warning' | 'advisory'
  current_staff_count: number;   // Scheduled staff for period
  minimum_required: number;      // Minimum staff needed
  available_vto_slots: number;   // Max safe VTO positions
  proposed_vto_count: number;    // Requested VTO positions
  staff_after_vto: number;       // Staff remaining after VTO
  violations: Violation[];       // Array of violations
  override_required: boolean;    // True if override needed
  recommendation: string;        // Human-readable advice
}
```

### SafetyFloorViolation

```typescript
{
  config_id: string;            // Config that was violated
  violation_type: string;       // 'minimum_count' | 'minimum_percentage' | 'skill_requirement'
  current_value: number;        // Actual value
  required_value: number;       // Required value
  deficit: number;              // How many short
  message: string;              // Human-readable message
  severity: string;             // 'critical' | 'warning' | 'info'
}
```

---

## 🔍 Validation Logic

```typescript
// For each safety floor config:

// 1. Absolute Minimum Check
if (staffAfterVTO < minimum_staff_count) {
  VIOLATION: "Below absolute minimum"
}

// 2. Percentage Minimum Check
if (staffAfterVTO < (currentStaff * minimum_staff_percentage / 100)) {
  VIOLATION: "Below percentage minimum"
}

// 3. Skill Requirements Check (if configured)
for (skill in skill_requirements) {
  if (availableSkillCount < skill.minimum_count) {
    VIOLATION: "Insufficient skilled staff"
  }
}

// 4. Available Slots Calculation
available_vto_slots = max(0, currentStaff - minimum_required)
```

---

## 💡 Configuration Examples

### Example 1: Basic Department Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id, department_id,
  minimum_staff_count, enforcement_level
) VALUES (
  'org-1', 'fulfillment-1',
  12, 'strict'
);
```

**Effect:** Fulfillment always needs ≥12 people

### Example 2: Peak Hour Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id, department_id,
  time_start, time_end,
  minimum_staff_count, enforcement_level
) VALUES (
  'org-1', 'customer-service-1',
  '12:00:00', '14:00:00',
  20, 'strict'
);
```

**Effect:** Lunch rush (12-2 PM) needs ≥20 people

### Example 3: Weekend Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id, department_id,
  day_of_week, minimum_staff_count, enforcement_level
) VALUES (
  'org-1', 'fulfillment-1',
  0, 15, 'strict'
);
```

**Effect:** Sundays need ≥15 people

### Example 4: Percentage-Based

```sql
INSERT INTO safety_floor_configs (
  organization_id, department_id,
  minimum_staff_count, minimum_staff_percentage,
  enforcement_level
) VALUES (
  'org-1', 'warehouse-1',
  8, 75, 'warning'
);
```

**Effect:** Need ≥8 people OR ≥75% of scheduled (whichever is higher)

---

## 🚨 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `200` | Check completed | Review `is_safe` field |
| `201` | VTO published | Success |
| `400` | Invalid request | Fix request parameters |
| `409` | Safety floor violated | Reduce VTO count or override |
| `500` | Server error | Retry or contact support |

---

## 🎛️ API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/vto/check-safety-floor` | POST | Pre-flight check | Manager |
| `/vto/publish` | POST | Publish with auto-check | Manager |
| `/safety-floor/configs` | GET | List configs | Admin |
| `/safety-floor/configs` | POST | Create config | Admin |
| `/safety-floor/configs/:id` | PUT | Update config | Admin |
| `/safety-floor/audit-logs` | GET | View audit trail | Admin |

---

## 📈 Best Practices

### ✅ DO

- **Check before publishing** - Use `/check-safety-floor` first
- **Set realistic minimums** - Based on actual operational needs
- **Use percentage minimums** - For flexible scaling
- **Document overrides** - Clear reason and approval
- **Monitor audit logs** - Track violation patterns
- **Test configurations** - Validate before enforcing

### ❌ DON'T

- **Set floors too high** - Reduces operational flexibility
- **Ignore violations** - Review why they occur
- **Override without reason** - Breaks audit trail
- **Use strict everywhere** - Reserve for critical operations
- **Forget skill requirements** - Validate qualified staff

---

## 🔗 Related Documentation

- **Full Guide:** [VTO_SAFETY_FLOOR_GUIDE.md](./VTO_SAFETY_FLOOR_GUIDE.md)
- **VTO API:** [VTO_API_DOCUMENTATION.md](./VTO_API_DOCUMENTATION.md)
- **VTO Quick Ref:** [VTO_API_QUICK_REFERENCE.md](./VTO_API_QUICK_REFERENCE.md)

---

**Version**: 1.0.0  
**Status**: ✅ Ready  
**Last Updated**: January 31, 2026
