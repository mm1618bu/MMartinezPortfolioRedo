/**
 * RBAC React Hooks
 * Custom hooks for permission checking in React components
 */

import { useCallback, useMemo } from 'react';
import { UserRole, Permission, PermissionContext } from './types';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  roleHasPermission,
} from './utils';

// Mock user context - replace with actual auth context
interface AuthUser {
  id: string;
  role: UserRole;
  organizationId: string;
  teamId?: string;
}

// Mock hook to get current user - replace with actual auth hook
const useAuth = (): AuthUser => {
  // This should come from your actual auth context/store
  return {
    id: 'user-123',
    role: UserRole.ADMIN,
    organizationId: 'org-123',
    teamId: 'team-123',
  };
};

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(
  permission: Permission,
  resourceOwnerId?: string,
  resourceTeamId?: string
): boolean {
  const user = useAuth();

  return useMemo(() => {
    const context: PermissionContext = {
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId,
      resourceOwnerId,
      resourceTeamId,
    };

    return hasPermission(context, permission);
  }, [user, permission, resourceOwnerId, resourceTeamId]);
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useAnyPermission(
  permissions: Permission[],
  resourceOwnerId?: string,
  resourceTeamId?: string
): boolean {
  const user = useAuth();

  return useMemo(() => {
    const context: PermissionContext = {
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId,
      resourceOwnerId,
      resourceTeamId,
    };

    return hasAnyPermission(context, permissions);
  }, [user, permissions, resourceOwnerId, resourceTeamId]);
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useAllPermissions(
  permissions: Permission[],
  resourceOwnerId?: string,
  resourceTeamId?: string
): boolean {
  const user = useAuth();

  return useMemo(() => {
    const context: PermissionContext = {
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId,
      resourceOwnerId,
      resourceTeamId,
    };

    return hasAllPermissions(context, permissions);
  }, [user, permissions, resourceOwnerId, resourceTeamId]);
}

/**
 * Hook to check if current user has a specific role
 */
export function useRole(requiredRole: UserRole): boolean {
  const user = useAuth();

  return useMemo(() => {
    return hasRole(user.role, requiredRole);
  }, [user, requiredRole]);
}

/**
 * Hook to check if current user has any of the specified roles
 */
export function useAnyRole(requiredRoles: UserRole[]): boolean {
  const user = useAuth();

  return useMemo(() => {
    return hasAnyRole(user.role, requiredRoles);
  }, [user, requiredRoles]);
}

/**
 * Hook to get permission checker function
 * Useful when you need to check multiple permissions dynamically
 */
export function usePermissionChecker() {
  const user = useAuth();

  return useCallback(
    (permission: Permission, resourceOwnerId?: string, resourceTeamId?: string) => {
      const context: PermissionContext = {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        teamId: user.teamId,
        resourceOwnerId,
        resourceTeamId,
      };

      return hasPermission(context, permission);
    },
    [user]
  );
}

/**
 * Hook to check if current user's role has a permission (without scope)
 * Useful for showing/hiding UI elements
 */
export function useRolePermission(permission: Permission): boolean {
  const user = useAuth();

  return useMemo(() => {
    return roleHasPermission(user.role, permission);
  }, [user, permission]);
}
