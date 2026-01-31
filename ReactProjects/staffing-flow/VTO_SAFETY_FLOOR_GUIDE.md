# VTO Safety Floor Enforcement - Complete Guide

## 🛡️ Overview

**Safety Floor Enforcement** ensures that minimum staffing levels are maintained when offering Voluntary Time Off (VTO). This prevents understaffing situations that could compromise operational safety, service quality, or regulatory compliance.

---

## 🎯 What is a Safety Floor?

A **safety floor** is the minimum number of employees required to:
- Maintain safe operations
- Meet service level agreements (SLAs)
- Comply with regulatory requirements
- Ensure adequate skill coverage
- Maintain operational capacity

### Example Scenario

```
Department: Fulfillment Center
Scheduled Staff: 20 employees
Safety Floor: 12 employees (minimum)
Available VTO Slots: 8 (20 - 12 = 8)
```

If a manager tries to offer 10 VTO slots, the system will:
1. ❌ Block the request (strict enforcement)
2. ⚠️ Warn the manager (warning enforcement)
3. ℹ️ Advise but allow (advisory enforcement)

---

## 📊 Safety Floor Configuration

### Configuration Levels

Safety floors can be configured at multiple levels:

| Level | Scope | Example |
|-------|-------|---------|
| **Organization** | All departments | Company-wide minimum of 5 staff |
| **Department** | Specific department | Fulfillment requires 12 staff |
| **Shift Template** | Specific shift | Night shift requires 8 staff |
| **Day of Week** | Specific days | Weekends require 15 staff |
| **Time Range** | Specific hours | Peak hours (12-2 PM) require 20 staff |

### Configuration Types

1. **Absolute Minimum** - Fixed number of employees
   ```typescript
   minimum_staff_count: 12  // Always need at least 12 people
   ```

2. **Percentage Minimum** - % of scheduled staff
   ```typescript
   minimum_staff_percentage: 75  // Never go below 75% of scheduled
   ```

3. **Skill-Based** - Required skills/roles
   ```typescript
   skill_requirements: [
     { skill_id: "forklift", skill_name: "Forklift Certified", minimum_count: 2 },
     { skill_id: "supervisor", skill_name: "Supervisor", minimum_count: 1 }
   ]
   ```

### Enforcement Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| **Strict** | Blocks VTO if violates floor | Critical operations, safety-sensitive roles |
| **Warning** | Allows VTO with warning to manager | Standard operations, manager discretion |
| **Advisory** | Informational only, no block | Flexible operations, guidance only |

---

## 🚀 API Usage

### 1. Check Safety Floor Before Publishing VTO

**POST** `/api/labor-actions/vto/check-safety-floor`

Check if proposed VTO would violate safety floor requirements.

#### Request Body

```json
{
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",
  "shift_template_id": "shift-uuid",  // Optional
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "proposed_vto_count": 5
}
```

#### Response (200 OK) - Safe

```json
{
  "success": true,
  "data": {
    "is_safe": true,
    "enforcement_level": "strict",
    "current_staff_count": 20,
    "minimum_required": 12,
    "available_vto_slots": 8,
    "proposed_vto_count": 5,
    "staff_after_vto": 15,
    "override_required": false,
    "recommendation": "VTO can be safely offered. 8 slots available."
  }
}
```

#### Response (200 OK) - Violation

```json
{
  "success": true,
  "data": {
    "is_safe": false,
    "enforcement_level": "strict",
    "current_staff_count": 20,
    "minimum_required": 12,
    "available_vto_slots": 8,
    "proposed_vto_count": 10,
    "staff_after_vto": 10,
    "violations": [
      {
        "config_id": "config-uuid",
        "violation_type": "minimum_count",
        "current_value": 10,
        "required_value": 12,
        "deficit": 2,
        "message": "Staff count after VTO (10) would be below minimum requirement (12)",
        "severity": "critical"
      }
    ],
    "override_required": false,
    "recommendation": "VTO would violate safety floor. Reduce to 8 slots or less."
  }
}
```

---

### 2. Publish VTO with Safety Floor Enforcement

**POST** `/api/labor-actions/vto/publish`

Publish VTO offer with automatic safety floor checking.

#### Request Body (Normal)

```json
{
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "positions_available": 5,
  "posted_by": "manager-uuid",
  "paid": false,
  "requires_approval": false
}
```

#### Response (201 Created) - Safe

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "action_type": "VTO",
    "positions_available": 5,
    "status": "open"
  },
  "message": "VTO offer published successfully"
}
```

#### Response (409 Conflict) - Blocked by Safety Floor

```json
{
  "success": false,
  "error": "Safety floor violation: VTO would violate safety floor. Reduce to 8 slots or less.",
  "data": {
    "is_safe": false,
    "enforcement_level": "strict",
    "current_staff_count": 20,
    "minimum_required": 12,
    "available_vto_slots": 8,
    "proposed_vto_count": 10,
    "staff_after_vto": 10,
    "violations": [...]
  }
}
```

---

### 3. Publish VTO with Safety Floor Override

**POST** `/api/labor-actions/vto/publish` (with override)

Override safety floor enforcement when necessary.

#### Request Body

```json
{
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",
  "target_date": "2026-02-15",
  "start_time": "14:00:00",
  "end_time": "22:00:00",
  "positions_available": 10,
  "posted_by": "manager-uuid",
  "skip_safety_floor_check": true,
  "override_reason": "Emergency shutdown - equipment malfunction requires reduced staffing",
  "override_approved_by": "senior-manager-uuid"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "vto-uuid",
    "action_type": "VTO",
    "positions_available": 10,
    "status": "open"
  },
  "message": "VTO offer published successfully"
}
```

---

## 📋 Common Workflows

### Workflow 1: Standard VTO Publishing (No Violations)

```bash
# Step 1: Check safety floor
curl -X POST http://localhost:5000/api/labor-actions/vto/check-safety-floor \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "department_id": "dept-1",
    "target_date": "2026-02-15",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "proposed_vto_count": 5
  }'

# Response: is_safe = true, available_vto_slots = 8

# Step 2: Publish VTO
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "department_id": "dept-1",
    "target_date": "2026-02-15",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "positions_available": 5,
    "posted_by": "manager-1"
  }'

# Success: VTO published
```

### Workflow 2: VTO Blocked by Safety Floor

```bash
# Step 1: Attempt to publish VTO with too many positions
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "department_id": "dept-1",
    "target_date": "2026-02-15",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "positions_available": 12,
    "posted_by": "manager-1"
  }'

# Response: 409 Conflict - Safety floor violation

# Step 2: Check recommended maximum
curl -X POST http://localhost:5000/api/labor-actions/vto/check-safety-floor \
  -H "Content-Type: application/json" \
  -d '{...}'

# Response: available_vto_slots = 8

# Step 3: Publish with correct count
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "positions_available": 8,
    ...
  }'

# Success: VTO published with 8 positions
```

### Workflow 3: Emergency Override

```bash
# Manager needs to offer more VTO than safety floor allows
curl -X POST http://localhost:5000/api/labor-actions/vto/publish \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-1",
    "department_id": "dept-1",
    "target_date": "2026-02-15",
    "start_time": "14:00:00",
    "end_time": "22:00:00",
    "positions_available": 15,
    "posted_by": "manager-1",
    "skip_safety_floor_check": true,
    "override_reason": "Equipment failure - reduced capacity",
    "override_approved_by": "senior-manager-1"
  }'

# Success: VTO published with override logged
```

---

## 🗄️ Database Schema

### safety_floor_configs Table

```sql
CREATE TABLE safety_floor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  department_id UUID REFERENCES departments(id),  -- NULL = all departments
  shift_template_id UUID REFERENCES shift_templates(id),  -- NULL = all shifts
  day_of_week INTEGER,  -- 0-6 (Sunday-Saturday), NULL = all days
  time_start TIME,  -- NULL = no time restriction
  time_end TIME,  -- NULL = no time restriction
  minimum_staff_count INTEGER NOT NULL,  -- Absolute minimum
  minimum_staff_percentage INTEGER,  -- % of scheduled staff
  skill_requirements JSONB,  -- Array of required skills
  enforcement_level TEXT NOT NULL CHECK (enforcement_level IN ('strict', 'warning', 'advisory')),
  override_allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_safety_floor_org ON safety_floor_configs(organization_id);
CREATE INDEX idx_safety_floor_dept ON safety_floor_configs(department_id);
CREATE INDEX idx_safety_floor_shift ON safety_floor_configs(shift_template_id);
```

### safety_floor_audit_logs Table

```sql
CREATE TABLE safety_floor_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_action_id UUID NOT NULL REFERENCES labor_actions(id),
  check_timestamp TIMESTAMPTZ NOT NULL,
  is_safe BOOLEAN NOT NULL,
  enforcement_level TEXT NOT NULL,
  current_staff_count INTEGER NOT NULL,
  minimum_required INTEGER NOT NULL,
  proposed_vto_count INTEGER NOT NULL,
  override_applied BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  override_approved_by UUID REFERENCES users(id),
  violations JSONB,  -- Array of violations
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_labor_action ON safety_floor_audit_logs(labor_action_id);
CREATE INDEX idx_audit_timestamp ON safety_floor_audit_logs(check_timestamp);
CREATE INDEX idx_audit_override ON safety_floor_audit_logs(override_applied);
```

---

## 💡 Configuration Examples

### Example 1: Basic Department Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id,
  department_id,
  minimum_staff_count,
  enforcement_level,
  override_allowed
) VALUES (
  'org-uuid',
  'fulfillment-dept-uuid',
  12,  -- Always need 12 people minimum
  'strict',
  false  -- No overrides allowed
);
```

### Example 2: Percentage-Based Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id,
  department_id,
  minimum_staff_count,
  minimum_staff_percentage,
  enforcement_level,
  override_allowed
) VALUES (
  'org-uuid',
  'customer-service-uuid',
  5,  -- At least 5 people
  75,  -- OR 75% of scheduled staff (whichever is higher)
  'warning',
  true
);
```

### Example 3: Time-Specific Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id,
  department_id,
  time_start,
  time_end,
  minimum_staff_count,
  enforcement_level,
  override_allowed
) VALUES (
  'org-uuid',
  'fulfillment-uuid',
  '12:00:00',  -- Noon
  '14:00:00',  -- 2 PM
  20,  -- Peak lunch hour requires 20 staff
  'strict',
  false
);
```

### Example 4: Weekend-Specific Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id,
  department_id,
  day_of_week,
  minimum_staff_count,
  enforcement_level,
  override_allowed
) VALUES (
  'org-uuid',
  'fulfillment-uuid',
  0,  -- Sunday (0 = Sunday, 6 = Saturday)
  15,
  'strict',
  false
);
```

### Example 5: Skill-Based Minimum

```sql
INSERT INTO safety_floor_configs (
  organization_id,
  department_id,
  minimum_staff_count,
  skill_requirements,
  enforcement_level,
  override_allowed
) VALUES (
  'org-uuid',
  'warehouse-uuid',
  10,
  '[
    {"skill_id": "forklift", "skill_name": "Forklift Certified", "minimum_count": 2},
    {"skill_id": "supervisor", "skill_name": "Supervisor", "minimum_count": 1}
  ]'::jsonb,
  'strict',
  false
);
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Safety Floor Violations**
   - Number of blocked VTO requests
   - Violation frequency by department
   - Time periods with most violations

2. **Override Usage**
   - Override frequency
   - Override reasons
   - Override approval chain

3. **Staffing Efficiency**
   - Available VTO slots vs utilized
   - Safety floor impact on labor costs
   - Understaffing incidents avoided

### Sample Analytics Queries

```sql
-- Blocked VTO requests by department
SELECT 
  d.name AS department,
  COUNT(*) AS blocked_requests,
  AVG(current_staff_count - minimum_required) AS avg_deficit
FROM safety_floor_audit_logs sal
JOIN labor_actions la ON sal.labor_action_id = la.id
JOIN departments d ON la.department_id = d.id
WHERE is_safe = false
  AND check_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY d.name
ORDER BY blocked_requests DESC;

-- Override usage by manager
SELECT 
  u.name AS manager,
  COUNT(*) AS override_count,
  STRING_AGG(DISTINCT override_reason, '; ') AS common_reasons
FROM safety_floor_audit_logs sal
JOIN users u ON sal.override_approved_by = u.id
WHERE override_applied = true
  AND check_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY u.name
ORDER BY override_count DESC;

-- Safety floor effectiveness
SELECT 
  DATE_TRUNC('day', check_timestamp) AS date,
  COUNT(*) AS total_checks,
  SUM(CASE WHEN is_safe = true THEN 1 ELSE 0 END) AS safe_count,
  SUM(CASE WHEN is_safe = false THEN 1 ELSE 0 END) AS violation_count,
  ROUND(AVG(current_staff_count - minimum_required), 2) AS avg_buffer
FROM safety_floor_audit_logs
WHERE check_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', check_timestamp)
ORDER BY date;
```

---

## 🚨 Troubleshooting

### Issue: Safety Floor Too Restrictive

**Symptoms:** Most VTO requests blocked

**Solutions:**
1. Review safety floor configurations
2. Adjust minimum_staff_count to be more realistic
3. Use percentage-based minimums for flexibility
4. Consider time-specific minimums instead of all-day

### Issue: Safety Floor Not Enforced

**Symptoms:** VTO offered below minimum staffing

**Solutions:**
1. Check enforcement_level is set to 'strict'
2. Verify safety_floor_configs table has entries
3. Ensure organization_id and department_id match
4. Check day_of_week and time_range filters

### Issue: Frequent Overrides

**Symptoms:** Many overrides being used

**Solutions:**
1. Safety floor may be too strict
2. Review override reasons for patterns
3. Adjust configuration based on actual needs
4. Consider advisory level for some configs

---

## 🔐 Security & Compliance

### Authorization

- **View safety floor configs**: Manager role
- **Create/update configs**: Senior manager or admin
- **Override safety floor**: Senior manager (with audit trail)
- **View audit logs**: Admin only

### Audit Trail

All safety floor checks and overrides are logged:
- When VTO is checked against safety floor
- Whether it passed or failed
- Who applied overrides and why
- Staff counts at time of check

### Compliance

Safety floor enforcement helps with:
- ✅ OSHA safety requirements
- ✅ Labor law compliance
- ✅ Union agreement adherence
- ✅ Service level agreement (SLA) maintenance
- ✅ Insurance requirements

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] **Dynamic Safety Floors** - Auto-adjust based on real-time volume
- [ ] **ML-Based Predictions** - Predict minimum staff needs
- [ ] **Skill-Based Validation** - Full implementation of skill checking
- [ ] **Multi-Level Approvals** - Require multiple approvals for overrides
- [ ] **Safety Floor Templates** - Pre-defined configurations
- [ ] **Impact Simulation** - Forecast impact of VTO on operations

---

## 📚 Related Documentation

- [VTO API Documentation](./VTO_API_DOCUMENTATION.md)
- [VTO Quick Reference](./VTO_API_QUICK_REFERENCE.md)
- [VTO Implementation Summary](./VTO_API_IMPLEMENTATION.md)

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 31, 2026
