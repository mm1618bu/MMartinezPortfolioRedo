/**
 * RBAC Utilities
 * Helper functions for role and permission checking
 */

import { UserRole, Permission, ROLE_PERMISSIONS, PermissionContext } from './types';

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => roleHasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => roleHasPermission(role, permission));
}

/**
 * Check if a user has a specific permission
 * Includes scope validation for team/self permissions
 */
export function hasPermission(context: PermissionContext, permission: Permission): boolean {
  // Check if role has the permission
  if (!roleHasPermission(context.role, permission)) {
    return false;
  }

  // Handle scope-based permissions
  if (permission.includes('.own')) {
    // Self-scoped permission
    return context.userId === context.resourceOwnerId;
  }

  if (permission.includes('.team')) {
    // Team-scoped permission
    return context.teamId === context.resourceTeamId;
  }

  // Organization-scoped or system permission
  return true;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(context: PermissionContext, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(context, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(context: PermissionContext, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(context, permission));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if a role is higher in hierarchy than another role
 */
export function isRoleHigherThan(role: UserRole, compareRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.MANAGER]: 3,
    [UserRole.STAFF]: 2,
    [UserRole.VIEWER]: 1,
  };

  return hierarchy[role] > hierarchy[compareRole];
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.STAFF]: 'Staff',
    [UserRole.VIEWER]: 'Viewer',
  };

  return displayNames[role];
}

/**
 * Validate if a user can assign a specific role
 * Users can only assign roles lower than their own
 */
export function canAssignRole(userRole: UserRole, targetRole: UserRole): boolean {
  // Super admins can assign any role
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Admins can assign manager, staff, viewer
  if (userRole === UserRole.ADMIN) {
    return [UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER].includes(targetRole);
  }

  // Other roles cannot assign roles
  return false;
}

/**
 * Filter available roles based on user's role
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  if (userRole === UserRole.SUPER_ADMIN) {
    return Object.values(UserRole);
  }

  if (userRole === UserRole.ADMIN) {
    return [UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER];
  }

  return [];
}
