-- ============================================
-- ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- ============================================
-- Creates a comprehensive RBAC system with:
-- - Roles (admin, moderator, creator, viewer)
-- - User role assignments
-- - Permission checks
-- - Audit logging
-- ============================================

-- ============================================
-- STEP 1: CREATE ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'moderator', 'creator', 'viewer')),
  granted_by TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;

-- ============================================
-- STEP 2: CREATE PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'creator', 'viewer')),
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

-- ============================================
-- STEP 3: CREATE AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'video', 'comment', 'channel'
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_type, target_id);

-- ============================================
-- STEP 4: INSERT DEFAULT PERMISSIONS
-- ============================================

-- Admin permissions (full access)
INSERT INTO role_permissions (role, permission, description) VALUES
  ('admin', 'users.view', 'View all users'),
  ('admin', 'users.edit', 'Edit user details'),
  ('admin', 'users.delete', 'Delete users'),
  ('admin', 'users.manage_roles', 'Assign/revoke roles'),
  ('admin', 'videos.view_all', 'View all videos including private'),
  ('admin', 'videos.delete_any', 'Delete any video'),
  ('admin', 'videos.feature', 'Feature videos on homepage'),
  ('admin', 'comments.view_all', 'View all comments'),
  ('admin', 'comments.delete_any', 'Delete any comment'),
  ('admin', 'channels.view_all', 'View all channels'),
  ('admin', 'channels.suspend', 'Suspend channels'),
  ('admin', 'flags.manage', 'Manage all flagged content'),
  ('admin', 'analytics.view_all', 'View all analytics'),
  ('admin', 'settings.manage', 'Manage system settings')
ON CONFLICT DO NOTHING;

-- Moderator permissions (content moderation)
INSERT INTO role_permissions (role, permission, description) VALUES
  ('moderator', 'users.view', 'View all users'),
  ('moderator', 'videos.view_all', 'View all videos'),
  ('moderator', 'videos.delete_flagged', 'Delete flagged videos'),
  ('moderator', 'comments.view_all', 'View all comments'),
  ('moderator', 'comments.delete_any', 'Delete any comment'),
  ('moderator', 'flags.manage', 'Manage flagged content'),
  ('moderator', 'channels.view_all', 'View all channels')
ON CONFLICT DO NOTHING;

-- Creator permissions (content creation)
INSERT INTO role_permissions (role, permission, description) VALUES
  ('creator', 'videos.upload', 'Upload videos'),
  ('creator', 'videos.edit_own', 'Edit own videos'),
  ('creator', 'videos.delete_own', 'Delete own videos'),
  ('creator', 'comments.moderate_own', 'Moderate own video comments'),
  ('creator', 'channels.create', 'Create channel'),
  ('creator', 'channels.edit_own', 'Edit own channel'),
  ('creator', 'analytics.view_own', 'View own analytics')
ON CONFLICT DO NOTHING;

-- Viewer permissions (basic access)
INSERT INTO role_permissions (role, permission, description) VALUES
  ('viewer', 'videos.view_public', 'View public videos'),
  ('viewer', 'comments.create', 'Create comments'),
  ('viewer', 'comments.edit_own', 'Edit own comments'),
  ('viewer', 'comments.delete_own', 'Delete own comments'),
  ('viewer', 'channels.view', 'View channels'),
  ('viewer', 'playlists.create', 'Create playlists')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN COALESCE(v_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id TEXT, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  v_role := get_user_role(p_user_id);
  
  SELECT EXISTS(
    SELECT 1 FROM role_permissions
    WHERE role = v_role
    AND permission = p_permission
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant role to user
CREATE OR REPLACE FUNCTION grant_user_role(
  p_user_id TEXT,
  p_role TEXT,
  p_granted_by TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS user_roles AS $$
DECLARE
  v_result user_roles;
BEGIN
  INSERT INTO user_roles (user_id, role, granted_by, expires_at)
  VALUES (p_user_id, p_role, p_granted_by, p_expires_at)
  ON CONFLICT (user_id) DO UPDATE
  SET role = p_role,
      granted_by = p_granted_by,
      granted_at = NOW(),
      expires_at = p_expires_at,
      is_active = true
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke user role
CREATE OR REPLACE FUNCTION revoke_user_role(p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_roles
  SET is_active = false
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id TEXT,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS admin_audit_log AS $$
DECLARE
  v_result admin_audit_log;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details
  ) RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (get_user_role(auth.uid()::text) = 'admin');

CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
USING (get_user_role(auth.uid()::text) = 'admin');

-- Policies for role_permissions (read-only for all authenticated)
CREATE POLICY "Authenticated users can view permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);

-- Policies for admin_audit_log
CREATE POLICY "Admins can view audit logs"
ON admin_audit_log FOR SELECT
USING (get_user_role(auth.uid()::text) = 'admin');

CREATE POLICY "Admins can insert audit logs"
ON admin_audit_log FOR INSERT
WITH CHECK (get_user_role(auth.uid()::text) IN ('admin', 'moderator'));

-- ============================================
-- STEP 7: CREATE DEFAULT ADMIN USER
-- ============================================
-- NOTE: Replace 'YOUR_USER_ID' with actual user ID from auth.users
-- You can get this by running: SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Example: Set first registered user as admin
-- INSERT INTO user_roles (user_id, role, granted_by)
-- SELECT id::text, 'admin', 'system'
-- FROM auth.users
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- ============================================
-- STEP 8: CREATE STATISTICS VIEWS
-- ============================================

-- View for role distribution
CREATE OR REPLACE VIEW role_statistics AS
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at > NOW()) as temp_count
FROM user_roles
GROUP BY role;

-- View for recent admin actions
CREATE OR REPLACE VIEW recent_admin_actions AS
SELECT 
  aal.*,
  ur.role as admin_role
FROM admin_audit_log aal
LEFT JOIN user_roles ur ON ur.user_id = aal.admin_user_id
ORDER BY aal.created_at DESC
LIMIT 100;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check roles table
-- SELECT * FROM user_roles;

-- Check permissions
-- SELECT role, COUNT(*) as permission_count 
-- FROM role_permissions 
-- GROUP BY role;

-- Check user role
-- SELECT get_user_role('USER_ID');

-- Check user permission
-- SELECT user_has_permission('USER_ID', 'videos.delete_any');

-- View role statistics
-- SELECT * FROM role_statistics;

-- View recent admin actions
-- SELECT * FROM recent_admin_actions;

-- Grant admin role to user
-- SELECT grant_user_role('USER_ID', 'admin', 'system', NULL);

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Find expired roles
-- SELECT * FROM user_roles 
-- WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- Clean up expired roles
-- UPDATE user_roles 
-- SET is_active = false 
-- WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- Count users by role
-- SELECT role, COUNT(*) FROM user_roles WHERE is_active = true GROUP BY role;

-- Find users with multiple roles (should not happen)
-- SELECT user_id, COUNT(*) as role_count 
-- FROM user_roles WHERE is_active = true 
-- GROUP BY user_id HAVING COUNT(*) > 1;
