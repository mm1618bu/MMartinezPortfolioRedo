# RBAC System Setup Guide

## Overview
This guide walks you through setting up the Role-Based Access Control (RBAC) system for your YouTube clone. The system includes 4 roles with granular permissions, admin dashboard, user management, and comprehensive audit logging.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Quick Start](#quick-start)
3. [Database Setup](#database-setup)
4. [Setting Your First Admin](#setting-your-first-admin)
5. [Role & Permission Reference](#role--permission-reference)
6. [Admin Dashboard Usage](#admin-dashboard-usage)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## System Architecture

### 4-Tier Role Hierarchy
```
Admin (Level 4) → Full platform control
  ↓
Moderator (Level 3) → Content moderation & user reports
  ↓
Creator (Level 2) → Content creation & channel management
  ↓
Viewer (Level 1) → Basic viewing & interaction
```

### Core Components
1. **Database Schema** (`create_rbac_system.sql`)
   - `user_roles` table: User→Role mappings with expiration support
   - `role_permissions` table: Role→Permission mappings (34 total permissions)
   - `admin_audit_log` table: Complete history of admin actions

2. **API Layer** (`supabase.js`)
   - 18 RBAC functions for role management, permission checks, and user administration
   - Service role access for admin operations

3. **UI Components**
   - `AdminDashboard.jsx`: Admin control panel (400+ lines)
   - Role badges, user management table, audit log viewer

4. **Security**
   - Row Level Security (RLS) policies on all tables
   - Audit logging for all admin actions
   - IP tracking and metadata capture

---

## Quick Start

### Prerequisites
✅ Supabase project with PostgreSQL database  
✅ Service role API key configured in `supabase.js`  
✅ React app running with React Router  
✅ User authentication already working  

### 5-Minute Setup
```bash
# 1. Run the SQL migration
# Open Supabase Dashboard → SQL Editor → New Query
# Copy contents of create_rbac_system.sql and execute

# 2. Set your first admin user (replace USER_ID with your actual user ID)
INSERT INTO user_roles (user_id, role, granted_by, is_active)
VALUES ('YOUR_USER_ID_HERE', 'admin', 'system', true);

# 3. Navigate to the admin dashboard
# Go to: http://localhost:3000/admin (or your app URL)

# 4. Done! You now have full admin access
```

---

## Database Setup

### Step 1: Deploy SQL Migration

1. **Open Supabase Dashboard**
   - Navigate to your project
   - Go to SQL Editor → New Query

2. **Run Migration**
   ```sql
   -- Copy and paste the entire contents of create_rbac_system.sql
   -- Then click "Run"
   ```

3. **Verify Tables Created**
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_roles', 'role_permissions', 'admin_audit_log');
   ```

4. **Verify Permissions Loaded**
   ```sql
   -- Should return 34 rows (14 admin + 7 moderator + 7 creator + 6 viewer)
   SELECT role, COUNT(*) 
   FROM role_permissions 
   GROUP BY role;
   ```

### Step 2: Enable RLS Policies

RLS policies are automatically created by the migration. Verify they're enabled:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'role_permissions', 'admin_audit_log');

-- All should show rowsecurity = true
```

---

## Setting Your First Admin

### Method 1: Via SQL (Recommended)

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your.email@example.com';

-- Set admin role (replace the UUID with your user ID)
INSERT INTO user_roles (user_id, role, granted_by, is_active)
VALUES ('abc123-your-user-id-here', 'admin', 'system', true);

-- Verify it worked
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your.email@example.com';
```

### Method 2: Via Supabase Dashboard

1. Go to Authentication → Users
2. Find your user and copy the UUID
3. Go to Table Editor → `user_roles`
4. Click "Insert row"
   - `user_id`: Paste your UUID
   - `role`: Type "admin"
   - `granted_by`: Type "system"
   - `is_active`: Check the box
5. Click Save

### Method 3: Via API (After first admin exists)

```javascript
// Can only be done by an existing admin
await grantUserRole(newUserId, 'admin', currentAdminId);
```

---

## Role & Permission Reference

### Admin (14 permissions)
**Full platform control**

| Permission | Description |
|------------|-------------|
| `admin.manage_roles` | Grant/revoke any role |
| `admin.view_all_users` | Access all user data |
| `admin.suspend_users` | Suspend user accounts |
| `admin.delete_users` | Permanently delete users |
| `admin.manage_system_settings` | Configure platform settings |
| `admin.view_audit_logs` | Access all audit logs |
| `admin.manage_moderators` | Assign moderator roles |
| `moderator.manage_flags` | Handle flagged content |
| `moderator.moderate_comments` | Manage all comments |
| `moderator.moderate_videos` | Manage all videos |
| `moderator.view_reports` | Access user reports |
| `creator.upload_videos` | Upload content |
| `creator.manage_own_content` | Edit own content |
| `viewer.watch_videos` | Watch videos |

### Moderator (7 permissions)
**Content moderation & user reports**

| Permission | Description |
|------------|-------------|
| `moderator.manage_flags` | Resolve flagged content |
| `moderator.moderate_comments` | Delete/hide comments |
| `moderator.moderate_videos` | Remove/hide videos |
| `moderator.view_reports` | Review user reports |
| `creator.upload_videos` | Upload content |
| `creator.manage_own_content` | Manage own channel |
| `viewer.watch_videos` | Watch videos |

### Creator (7 permissions)
**Content creation & channel management**

| Permission | Description |
|------------|-------------|
| `creator.upload_videos` | Upload new videos |
| `creator.edit_videos` | Edit uploaded videos |
| `creator.delete_videos` | Delete own videos |
| `creator.manage_channel` | Configure channel settings |
| `creator.view_analytics` | Access channel analytics |
| `creator.manage_own_content` | Full content control |
| `viewer.watch_videos` | Watch videos |

### Viewer (6 permissions)
**Basic viewing & interaction**

| Permission | Description |
|------------|-------------|
| `viewer.watch_videos` | Watch videos |
| `viewer.like_videos` | Like/dislike videos |
| `viewer.comment` | Post comments |
| `viewer.subscribe` | Subscribe to channels |
| `viewer.create_playlists` | Create/manage playlists |
| `viewer.view_history` | Access watch history |

---

## Admin Dashboard Usage

### Accessing the Dashboard

Navigate to: `http://localhost:3000/admin` (or your production URL)

**Access Control:**
- Only users with `admin` or `moderator` roles can access
- Non-authorized users are automatically redirected to home page

### Dashboard Tabs

#### 1. Overview Tab
**Purpose:** High-level statistics and quick reference

**Features:**
- Role distribution statistics (4 cards showing counts for each role)
- Quick reference of admin capabilities
- Real-time data refresh every 60 seconds

**What You See:**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Admins     │ │  Moderators  │ │   Creators   │ │   Viewers    │
│      3       │ │      12      │ │     458      │ │    15,234    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

#### 2. Users Tab
**Purpose:** Comprehensive user management

**Features:**
- Full user table with search/filter (coming soon)
- Role badges with gradient colors
- Status indicators (confirmed/pending email)
- Inline action buttons per user

**Table Columns:**
1. **Email** - User's email address
2. **Role** - Current role with color-coded badge
   - Admin: Red/orange gradient
   - Moderator: Blue gradient
   - Creator: Purple gradient
   - Viewer: Gray background
3. **Status** - Email confirmation status
4. **Created** - Account creation date
5. **Last Sign In** - Most recent login
6. **Actions** - Quick action buttons

**Available Actions:**

**Change Role Button:**
- Opens modal with 4 role options
- Click desired role to assign
- Automatically logs action in audit log
- Updates in real-time (30s refresh)

**Suspend Button:** (for non-admins)
- Opens modal with reason textarea
- Suspends user account immediately
- Updates user metadata: `{ suspended: true, suspended_reason: "reason" }`
- User cannot log in while suspended
- Action logged with reason

**Unsuspend Button:** (for suspended users)
- Lifts suspension immediately
- Removes suspension metadata
- User can log in again
- Action logged in audit log

#### 3. Audit Log Tab
**Purpose:** Complete history of all admin actions

**Features:**
- Chronological list of admin actions
- Shows: Who did what, when, and why
- Auto-refreshes every 10 seconds
- Color-coded action types

**Entry Format:**
```
[2024-01-15 14:32:45]
Admin: admin@example.com
Action: SUSPEND_USER
Target: User ID abc123
Details: {"reason": "Spam violation"}
IP: 192.168.1.1
```

**Tracked Actions:**
- `GRANT_ROLE` - Role assignments
- `REVOKE_ROLE` - Role removals
- `SUSPEND_USER` - Account suspensions
- `UNSUSPEND_USER` - Suspension lifts
- `DELETE_VIDEO` - Content deletions
- All actions include IP address and metadata

---

## API Reference

### Core Functions

#### `getUserRole(userId)`
Get the role of any user.

```javascript
const role = await getUserRole('user-id-here');
// Returns: 'admin' | 'moderator' | 'creator' | 'viewer'
```

#### `userHasPermission(userId, permission)`
Check if user has specific permission.

```javascript
const canModerate = await userHasPermission(userId, 'moderator.moderate_comments');
// Returns: true | false
```

#### `isCurrentUserAdmin()`
Quick check if current logged-in user is admin.

```javascript
const isAdmin = await isCurrentUserAdmin();
// Returns: true | false
```

#### `isCurrentUserModerator()`
Check if current user is moderator OR admin.

```javascript
const canModerate = await isCurrentUserModerator();
// Returns: true | false
```

### Admin Functions

#### `grantUserRole(userId, role, grantedBy, expiresAt)`
Assign role to user (admin only).

```javascript
await grantUserRole(
  'user-id',
  'moderator',
  currentAdminId,
  null // No expiration
);
```

**With Expiration:**
```javascript
const expiresAt = new Date();
expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 months

await grantUserRole('user-id', 'creator', adminId, expiresAt);
```

#### `revokeUserRole(userId)`
Remove role from user (admin only).

```javascript
await revokeUserRole('user-id');
// User reverts to default 'viewer' role
```

#### `adminSuspendUser(adminUserId, targetUserId, reason)`
Suspend user account (admin only).

```javascript
await adminSuspendUser(
  currentAdminId,
  targetUserId,
  'Spam violation - Posted duplicate comments 20+ times'
);
```

#### `adminUnsuspendUser(adminUserId, targetUserId)`
Lift user suspension (admin only).

```javascript
await adminUnsuspendUser(currentAdminId, targetUserId);
```

#### `adminDeleteVideo(adminUserId, videoId)`
Delete any video with audit logging (admin only).

```javascript
await adminDeleteVideo(currentAdminId, 'video-id');
```

### Query Functions

#### `getAllUsersWithRoles()`
Get all users with their role data.

```javascript
const users = await getAllUsersWithRoles();
// Returns array of users with auth data + role info
```

#### `getUserWithRole(userId)`
Get single user with role details.

```javascript
const user = await getUserWithRole('user-id');
// Returns: { id, email, role, ...authData }
```

#### `getAdminAuditLog(limit)`
Fetch recent admin actions.

```javascript
const logs = await getAdminAuditLog(50); // Last 50 actions
// Returns array of audit entries
```

#### `getRoleStatistics()`
Get role distribution stats.

```javascript
const stats = await getRoleStatistics();
// Returns: { admin: 3, moderator: 12, creator: 458, viewer: 15234 }
```

#### `getRolePermissions(role)`
Get all permissions for a role.

```javascript
const perms = await getRolePermissions('moderator');
// Returns array of permission strings
```

---

## Protecting Routes

### Method 1: Component-Level Protection

**Used in AdminDashboard.jsx:**

```javascript
import { isCurrentUserAdmin, isCurrentUserModerator } from '../utils/supabase';

function AdminDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAccess = async () => {
      const isAdmin = await isCurrentUserAdmin();
      const isMod = await isCurrentUserModerator();
      
      if (!isAdmin && !isMod) {
        navigate('/'); // Redirect non-authorized users
      }
    };
    
    checkAccess();
  }, [navigate]);
  
  return <div>Admin Dashboard Content</div>;
}
```

### Method 2: Route-Level Protection

**Create ProtectedRoute component:**

```javascript
// ProtectedRoute.jsx
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { userHasPermission, getCurrentUserId } from '../utils/supabase';

function ProtectedRoute({ children, requiredPermission }) {
  const [hasAccess, setHasAccess] = useState(null); // null = loading
  
  useEffect(() => {
    const checkPermission = async () => {
      const userId = await getCurrentUserId();
      const permitted = await userHasPermission(userId, requiredPermission);
      setHasAccess(permitted);
    };
    
    checkPermission();
  }, [requiredPermission]);
  
  if (hasAccess === null) return <div>Loading...</div>;
  if (!hasAccess) return <Navigate to="/" replace />;
  
  return children;
}

export default ProtectedRoute;
```

**Usage in App.js:**

```javascript
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredPermission="admin.view_all_users">
      <><TopNavBar /><AdminDashboard /></>
    </ProtectedRoute>
  } 
/>
```

### Method 3: Hook-Based Protection

**Create useRequireRole hook:**

```javascript
// useRequireRole.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getCurrentUserId } from '../utils/supabase';

export function useRequireRole(requiredRole) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkRole = async () => {
      const userId = await getCurrentUserId();
      const userRole = await getUserRole(userId);
      
      const roleHierarchy = { viewer: 1, creator: 2, moderator: 3, admin: 4 };
      const hasAccess = roleHierarchy[userRole] >= roleHierarchy[requiredRole];
      
      if (!hasAccess) {
        navigate('/');
      } else {
        setAuthorized(true);
      }
      
      setLoading(false);
    };
    
    checkRole();
  }, [requiredRole, navigate]);
  
  return { loading, authorized };
}
```

**Usage:**

```javascript
function ModeratorPanel() {
  const { loading, authorized } = useRequireRole('moderator');
  
  if (loading) return <div>Loading...</div>;
  if (!authorized) return null; // Will redirect
  
  return <div>Moderator Panel Content</div>;
}
```

---

## Common Use Cases

### 1. Check if User Can Upload Videos

```javascript
const canUpload = await userHasPermission(userId, 'creator.upload_videos');

if (canUpload) {
  // Show upload button
} else {
  // Show "Upgrade to Creator" message
}
```

### 2. Make User a Creator

```javascript
// In admin panel
const currentAdminId = await getCurrentUserId();
await grantUserRole(targetUserId, 'creator', currentAdminId);

// Optionally notify user
await sendEmail(targetEmail, 'You are now a Creator!');
```

### 3. Temporary Moderator Access

```javascript
const expiresIn3Months = new Date();
expiresIn3Months.setMonth(expiresIn3Months.getMonth() + 3);

await grantUserRole(
  userId,
  'moderator',
  adminId,
  expiresIn3Months
);

// Auto-reverts to previous role after 3 months
```

### 4. Ban User for Violations

```javascript
await adminSuspendUser(
  adminId,
  violatorId,
  'Multiple copyright strikes - Uploaded 5 videos with copyrighted music'
);

// User cannot log in until unsuspended
```

### 5. Show Role Badge in UI

```javascript
function UserBadge({ userId }) {
  const [role, setRole] = useState('');
  
  useEffect(() => {
    getUserRole(userId).then(setRole);
  }, [userId]);
  
  const badgeColors = {
    admin: 'linear-gradient(135deg, #ef4444, #f97316)',
    moderator: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    creator: 'linear-gradient(135deg, #a855f7, #9333ea)',
    viewer: '#6b7280'
  };
  
  return (
    <span style={{ background: badgeColors[role] }}>
      {role.toUpperCase()}
    </span>
  );
}
```

---

## Troubleshooting

### Issue: "Not authorized to access this page"

**Symptoms:**
- Redirected to home page when accessing `/admin`
- Console shows no errors

**Solutions:**

1. **Verify your role in database:**
   ```sql
   SELECT u.email, ur.role, ur.is_active
   FROM auth.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'your.email@example.com';
   ```

2. **Check if role is active:**
   ```sql
   UPDATE user_roles 
   SET is_active = true 
   WHERE user_id = 'your-user-id';
   ```

3. **Verify RLS policies:**
   ```sql
   -- Should return policies for user_roles table
   SELECT * FROM pg_policies WHERE tablename = 'user_roles';
   ```

### Issue: "Cannot read properties of null (user)"

**Symptoms:**
- Error in console: `Cannot read properties of null (reading 'id')`
- Admin dashboard shows loading forever

**Solutions:**

1. **Verify user is logged in:**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

2. **Check authentication state:**
   ```javascript
   supabase.auth.onAuthStateChange((event, session) => {
     console.log('Auth event:', event);
     console.log('Session:', session);
   });
   ```

3. **Clear browser cache and re-login**

### Issue: getAllUsersWithRoles() returns empty array

**Symptoms:**
- Users tab shows "No users found"
- `adminUsers` query returns `[]`

**Solutions:**

1. **Verify service role key:**
   ```javascript
   // In supabase.js, check this line:
   const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
     auth: {
       autoRefreshToken: false,
       persistSession: false
     }
   });
   ```

2. **Check if service role key is correct:**
   - Go to Supabase Dashboard → Settings → API
   - Copy "service_role" key (NOT "anon" key)
   - Update `.env` or config file

3. **Test admin API access:**
   ```javascript
   const { data, error } = await supabaseAdmin.auth.admin.listUsers();
   console.log('Users from admin API:', data);
   console.log('Error:', error);
   ```

### Issue: "Permission denied" when granting roles

**Symptoms:**
- Error: `permission denied for table user_roles`
- Cannot insert into `user_roles` table

**Solutions:**

1. **Re-run RLS policies:**
   ```sql
   -- Drop existing policies
   DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
   
   -- Recreate admin policy
   CREATE POLICY "Admins can manage all roles"
   ON user_roles
   FOR ALL
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_id = auth.uid()::text
       AND role = 'admin'
       AND is_active = true
     )
   );
   ```

2. **Verify function exists:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'grant_user_role';
   ```

3. **Check function permissions:**
   ```sql
   GRANT EXECUTE ON FUNCTION grant_user_role TO authenticated;
   ```

### Issue: Audit log not recording actions

**Symptoms:**
- Actions complete successfully
- Audit log tab shows no entries

**Solutions:**

1. **Verify audit log function:**
   ```sql
   SELECT log_admin_action(
     'test-admin-id',
     'TEST_ACTION',
     'user',
     'test-target-id',
     '{"test": true}'::jsonb
   );
   ```

2. **Check if entries were created:**
   ```sql
   SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 10;
   ```

3. **Manually insert test entry:**
   ```sql
   INSERT INTO admin_audit_log (
     admin_user_id, action, target_type, target_id, details
   ) VALUES (
     'your-admin-id', 'TEST', 'user', 'target-id', '{}'::jsonb
   );
   ```

---

## Security Best Practices

### 1. Service Role Key Protection

**NEVER expose service role key in frontend code!**

```javascript
// ❌ WRONG - Exposed in frontend
const supabase = createClient(url, process.env.REACT_APP_SERVICE_ROLE_KEY);

// ✅ CORRECT - Only in backend/server
const supabaseAdmin = createClient(url, serviceRoleKey);
```

**Solution:** Use Supabase Edge Functions for admin operations:

```javascript
// Edge Function: admin-grant-role.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  
  const { userId, role } = await req.json();
  
  // Verify caller is admin
  const caller = req.headers.get('Authorization');
  const isAdmin = await checkIfAdmin(caller);
  
  if (!isAdmin) return new Response('Unauthorized', { status: 403 });
  
  // Grant role
  await supabaseAdmin.rpc('grant_user_role', { userId, role });
  
  return new Response('Success', { status: 200 });
}
```

### 2. Always Log Admin Actions

```javascript
async function anyAdminAction(adminId, action, targetId, details) {
  try {
    // Perform action
    const result = await performAction();
    
    // Log it
    await logAdminAction(adminId, action, 'user', targetId, details);
    
    return result;
  } catch (error) {
    // Log failed attempt too
    await logAdminAction(adminId, `${action}_FAILED`, 'user', targetId, {
      error: error.message
    });
    throw error;
  }
}
```

### 3. Validate Role Hierarchy

```javascript
function canGrantRole(adminRole, targetRole) {
  const hierarchy = { viewer: 1, creator: 2, moderator: 3, admin: 4 };
  
  // Admins can grant any role
  if (adminRole === 'admin') return true;
  
  // Moderators can only grant creator/viewer
  if (adminRole === 'moderator') {
    return ['creator', 'viewer'].includes(targetRole);
  }
  
  return false;
}
```

### 4. Implement Rate Limiting

```javascript
const actionCounts = new Map();

async function rateLimitAdminAction(adminId, action) {
  const key = `${adminId}:${action}`;
  const count = actionCounts.get(key) || 0;
  
  if (count > 10) {
    throw new Error('Rate limit exceeded - Max 10 actions per minute');
  }
  
  actionCounts.set(key, count + 1);
  
  setTimeout(() => {
    actionCounts.delete(key);
  }, 60000); // Reset after 1 minute
}
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review audit log for suspicious activity
- Check role statistics for anomalies
- Verify no expired roles still active

**Monthly:**
- Export audit log for archival
- Review and revoke inactive moderators
- Update permissions if new features added

### Database Maintenance

**Clean old audit logs (older than 90 days):**
```sql
DELETE FROM admin_audit_log 
WHERE created_at < NOW() - INTERVAL '90 days';
```

**Find expired roles still active:**
```sql
SELECT * FROM user_roles 
WHERE expires_at < NOW() 
AND is_active = true;
```

**Deactivate expired roles:**
```sql
UPDATE user_roles 
SET is_active = false 
WHERE expires_at < NOW() 
AND is_active = true;
```

---

## Advanced Topics

### Custom Permissions

Add new permission for specific feature:

```sql
-- 1. Add permission to role_permissions table
INSERT INTO role_permissions (role, permission, description)
VALUES ('creator', 'creator.schedule_videos', 'Schedule videos for future release');

-- 2. Use in code
const canSchedule = await userHasPermission(userId, 'creator.schedule_videos');
```

### Role Expiration Automation

Set up automatic role expiration:

```sql
-- Create function to auto-expire roles
CREATE OR REPLACE FUNCTION auto_expire_roles()
RETURNS void AS $$
BEGIN
  UPDATE user_roles
  SET is_active = false
  WHERE expires_at < NOW()
  AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
SELECT cron.schedule('expire-roles', '0 * * * *', 'SELECT auto_expire_roles()');
```

### Bulk Operations

Grant role to multiple users:

```javascript
async function bulkGrantRole(userIds, role, adminId) {
  const results = [];
  
  for (const userId of userIds) {
    try {
      await grantUserRole(userId, role, adminId);
      results.push({ userId, success: true });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }
  
  return results;
}
```

---

## Support & Resources

### Quick Links
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Router Documentation](https://reactrouter.com/)

### Need Help?

1. **Check troubleshooting section above**
2. **Review audit log for error details**
3. **Verify database schema matches migration**
4. **Check Supabase logs in dashboard**
5. **Test with service role key directly**

---

## Appendix

### Complete Schema Diagram

```
┌─────────────────────────────────────┐
│          auth.users (Supabase)       │
│  - id (UUID)                         │
│  - email                             │
│  - created_at                        │
│  - last_sign_in_at                   │
└───────────────┬─────────────────────┘
                │
                │ 1:1
                ▼
┌─────────────────────────────────────┐
│           user_roles                 │
│  - id (UUID, PK)                     │
│  - user_id (UUID, FK → auth.users)   │
│  - role (TEXT)                       │
│  - granted_by (TEXT)                 │
│  - granted_at (TIMESTAMP)            │
│  - expires_at (TIMESTAMP, nullable)  │
│  - is_active (BOOLEAN)               │
│  - metadata (JSONB)                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        role_permissions              │
│  - id (UUID, PK)                     │
│  - role (TEXT)                       │
│  - permission (TEXT)                 │
│  - description (TEXT)                │
│  - created_at (TIMESTAMP)            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        admin_audit_log               │
│  - id (UUID, PK)                     │
│  - admin_user_id (TEXT)              │
│  - action (TEXT)                     │
│  - target_type (TEXT)                │
│  - target_id (TEXT)                  │
│  - details (JSONB)                   │
│  - ip_address (INET, nullable)       │
│  - created_at (TIMESTAMP)            │
└─────────────────────────────────────┘
```

### Function Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `get_user_role(user_id)` | Get user's current role | TEXT |
| `user_has_permission(user_id, permission)` | Check permission | BOOLEAN |
| `grant_user_role(...)` | Assign role | user_roles row |
| `revoke_user_role(user_id)` | Remove role | void |
| `log_admin_action(...)` | Log action | admin_audit_log row |

### View Reference

| View | Purpose | Columns |
|------|---------|---------|
| `role_statistics` | Count users per role | role, count |
| `recent_admin_actions` | Last 100 admin actions | admin_user_id, action, target_type, target_id, created_at |

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial RBAC system release
- 4 roles with 34 permissions
- Admin dashboard with 3 tabs
- Complete audit logging
- User suspension system
- Role expiration support

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0  
**Maintainer:** Your Development Team
