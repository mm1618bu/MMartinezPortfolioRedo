# RBAC Architecture - Roles and Permissions

## Overview

The Staffing Flow application implements Role-Based Access Control (RBAC) to manage user permissions across the platform. This document defines all roles, permissions, and the permission matrix.

## User Roles

### 1. Super Admin

**Description:** Full system access with ability to manage all users, roles, and system configuration.

**Responsibilities:**

- System configuration and maintenance
- User and role management
- Access to all features and data
- Audit log review
- Security management

**Typical Users:** System administrators, IT administrators

### 2. Admin

**Description:** Organization-level administrator with broad permissions.

**Responsibilities:**

- User management within organization
- Staff management (create, edit, delete)
- Schedule management
- Department management
- Report generation
- Settings configuration

**Typical Users:** HR managers, Operations managers

### 3. Manager

**Description:** Department or team-level manager with oversight of assigned staff.

**Responsibilities:**

- View and manage assigned staff
- Create and modify schedules for their team
- Approve time off requests
- View team reports
- Update staff assignments

**Typical Users:** Department managers, Team leads, Supervisors

### 4. Staff

**Description:** Regular employee with limited access to their own information.

**Responsibilities:**

- View own profile and schedule
- Update own availability
- Submit time off requests
- View assigned shifts
- Update own contact information

**Typical Users:** Regular employees, Contractors

### 5. Viewer

**Description:** Read-only access for reporting and analysis.

**Responsibilities:**

- View staff information (limited fields)
- View schedules (read-only)
- Generate reports
- Export data

**Typical Users:** Analysts, Executives, External auditors

## Permission Categories

### User Management

- `user.create` - Create new users
- `user.read` - View user information
- `user.update` - Update user information
- `user.delete` - Delete users
- `user.assign_role` - Assign roles to users

### Staff Management

- `staff.create` - Create staff records
- `staff.read` - View staff information
- `staff.read.own` - View own staff information
- `staff.read.team` - View team staff information
- `staff.update` - Update staff information
- `staff.update.own` - Update own information
- `staff.delete` - Delete staff records
- `staff.export` - Export staff data

### Schedule Management

- `schedule.create` - Create schedules
- `schedule.read` - View all schedules
- `schedule.read.own` - View own schedule
- `schedule.read.team` - View team schedules
- `schedule.update` - Update schedules
- `schedule.update.team` - Update team schedules
- `schedule.delete` - Delete schedules
- `schedule.publish` - Publish schedules

### Time Off Management

- `timeoff.create` - Submit time off requests
- `timeoff.read` - View all time off requests
- `timeoff.read.own` - View own requests
- `timeoff.read.team` - View team requests
- `timeoff.approve` - Approve/deny requests
- `timeoff.cancel` - Cancel time off

### Department Management

- `department.create` - Create departments
- `department.read` - View departments
- `department.update` - Update departments
- `department.delete` - Delete departments

### Reporting

- `report.generate` - Generate reports
- `report.view` - View reports
- `report.export` - Export reports
- `report.schedule` - Schedule automated reports

### Settings & Configuration

- `settings.system` - Modify system settings
- `settings.organization` - Modify organization settings
- `settings.view` - View settings

### Audit & Logs

- `audit.read` - View audit logs
- `audit.export` - Export audit logs

## Permission Matrix

| Permission                   | Super Admin | Admin | Manager | Staff | Viewer |
| ---------------------------- | :---------: | :---: | :-----: | :---: | :----: |
| **User Management**          |
| user.create                  |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| user.read                    |     ✅      |  ✅   |   🟡    |  ❌   |   ❌   |
| user.update                  |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| user.delete                  |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| user.assign_role             |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| **Staff Management**         |
| staff.create                 |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| staff.read                   |     ✅      |  ✅   |   🟡    |  ❌   |   🟡   |
| staff.read.own               |     ✅      |  ✅   |   ✅    |  ✅   |   ❌   |
| staff.read.team              |     ✅      |  ✅   |   ✅    |  ❌   |   ❌   |
| staff.update                 |     ✅      |  ✅   |   🟡    |  ❌   |   ❌   |
| staff.update.own             |     ✅      |  ✅   |   ✅    |  ✅   |   ❌   |
| staff.delete                 |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| staff.export                 |     ✅      |  ✅   |   ❌    |  ❌   |   ✅   |
| **Schedule Management**      |
| schedule.create              |     ✅      |  ✅   |   🟡    |  ❌   |   ❌   |
| schedule.read                |     ✅      |  ✅   |   🟡    |  ❌   |   ✅   |
| schedule.read.own            |     ✅      |  ✅   |   ✅    |  ✅   |   ❌   |
| schedule.read.team           |     ✅      |  ✅   |   ✅    |  ❌   |   ❌   |
| schedule.update              |     ✅      |  ✅   |   🟡    |  ❌   |   ❌   |
| schedule.update.team         |     ✅      |  ✅   |   ✅    |  ❌   |   ❌   |
| schedule.delete              |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| schedule.publish             |     ✅      |  ✅   |   🟡    |  ❌   |   ❌   |
| **Time Off Management**      |
| timeoff.create               |     ✅      |  ✅   |   ✅    |  ✅   |   ❌   |
| timeoff.read                 |     ✅      |  ✅   |   🟡    |  ❌   |   ❌   |
| timeoff.read.own             |     ✅      |  ✅   |   ✅    |  ✅   |   ❌   |
| timeoff.read.team            |     ✅      |  ✅   |   ✅    |  ❌   |   ❌   |
| timeoff.approve              |     ✅      |  ✅   |   ✅    |  ❌   |   ❌   |
| timeoff.cancel               |     ✅      |  ✅   |   🟡    |  🟡   |   ❌   |
| **Department Management**    |
| department.create            |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| department.read              |     ✅      |  ✅   |   ✅    |  ✅   |   ✅   |
| department.update            |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| department.delete            |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| **Reporting**                |
| report.generate              |     ✅      |  ✅   |   ✅    |  ❌   |   ✅   |
| report.view                  |     ✅      |  ✅   |   ✅    |  ❌   |   ✅   |
| report.export                |     ✅      |  ✅   |   ✅    |  ❌   |   ✅   |
| report.schedule              |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| **Settings & Configuration** |
| settings.system              |     ✅      |  ❌   |   ❌    |  ❌   |   ❌   |
| settings.organization        |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| settings.view                |     ✅      |  ✅   |   ✅    |  ✅   |   ✅   |
| **Audit & Logs**             |
| audit.read                   |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |
| audit.export                 |     ✅      |  ✅   |   ❌    |  ❌   |   ❌   |

**Legend:**

- ✅ Full access
- 🟡 Limited access (own data or assigned team only)
- ❌ No access

## Role Hierarchy

```
Super Admin
    │
    ├── Admin
    │     │
    │     └── Manager
    │           │
    │           └── Staff
    │
    └── Viewer (parallel, read-only)
```

## Permission Inheritance

Roles inherit permissions from lower-level roles when applicable:

- **Super Admin** inherits all Admin permissions + system-level access
- **Admin** inherits all Manager permissions + organization-level access
- **Manager** inherits relevant Staff permissions + team management

## Scope-Based Permissions

Some permissions are **scope-based**, meaning they're limited to specific contexts:

### Organization Scope

- Admins can only manage users within their organization
- Cannot access other organizations' data

### Team/Department Scope

- Managers can only manage staff in their assigned teams/departments
- Limited to viewing and modifying their team's schedules

### Self Scope

- Staff can only access their own information
- Cannot view other staff members' data

## Special Permissions

### Conditional Permissions

1. **Time Off Cancellation**
   - Staff: Can cancel own requests if status is "pending"
   - Manager: Can cancel team requests if status is "pending" or "approved"
   - Admin: Can cancel any request

2. **Schedule Modification**
   - Cannot modify published schedules older than 7 days (configurable)
   - Requires audit trail for all schedule changes

3. **User Deletion**
   - Cannot delete users with active assignments
   - Requires transfer of ownership before deletion

## Implementation Guidelines

### Frontend (React/TypeScript)

```typescript
// Check permission before rendering UI
if (hasPermission('staff.create')) {
  return <CreateStaffButton />;
}

// Check role
if (hasRole('admin')) {
  return <AdminDashboard />;
}

// Check multiple permissions
if (hasAnyPermission(['staff.update', 'staff.update.own'])) {
  return <EditButton />;
}
```

### Backend (Node.js/Python)

```typescript
// Route protection
@requirePermission('staff.create')
async createStaff(req, res) { ... }

// Role-based access
@requireRole('admin')
async adminDashboard(req, res) { ... }

// Scope validation
@requirePermission('staff.read.team')
@validateScope('team')
async getTeamStaff(req, res) { ... }
```

## Security Considerations

1. **Least Privilege Principle**
   - Users should have minimum permissions needed for their role
   - Default to deny, explicitly grant access

2. **Permission Checks**
   - Always validate on both frontend and backend
   - Frontend checks for UX, backend for security
   - Never trust client-side permission checks alone

3. **Audit Logging**
   - Log all permission-sensitive operations
   - Include user, timestamp, action, and result
   - Retain logs per compliance requirements

4. **Session Management**
   - Permissions cached in session/token
   - Re-validate periodically
   - Invalidate on role change

5. **Multi-tenancy**
   - Enforce organization boundaries
   - Prevent cross-organization data access
   - Validate organization context in all requests

## Migration Path

When changing roles or permissions:

1. **Adding New Permission**
   - Add to permission definitions
   - Update role mappings
   - Deploy backend first, then frontend
   - No user impact

2. **Removing Permission**
   - Identify affected users
   - Notify stakeholders
   - Update roles
   - Deploy with migration

3. **Role Changes**
   - Create new role definition
   - Migrate users gradually
   - Deprecate old role
   - Remove after migration complete

## Testing Strategy

### Unit Tests

- Test permission checking functions
- Test role hierarchy
- Test scope validation

### Integration Tests

- Test API endpoints with different roles
- Test permission inheritance
- Test edge cases (expired tokens, role changes)

### E2E Tests

- Test complete user workflows per role
- Test permission boundaries
- Test multi-user scenarios

## Future Enhancements

- [ ] Custom roles (organization-defined)
- [ ] Permission sets/groups
- [ ] Temporary permission grants
- [ ] Permission delegation
- [ ] Fine-grained resource permissions
- [ ] Time-based permissions
- [ ] Conditional permissions based on context
- [ ] Permission analytics and recommendations

## References

- Backend Implementation: `python/rbac/` and `api/rbac/`
- Frontend Implementation: `src/rbac/`
- Database Schema: `database/rbac.sql`
- API Documentation: `docs/api/rbac.md`
