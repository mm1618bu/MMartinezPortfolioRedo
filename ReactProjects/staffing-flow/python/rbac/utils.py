"""RBAC Utilities for Python Backend"""

from typing import List, Optional
from python.rbac.types import (
    UserRole,
    Permission,
    ROLE_PERMISSIONS,
    PermissionContext,
    PermissionCheckResult,
)


def role_has_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    permissions = ROLE_PERMISSIONS.get(role, [])
    return permission in permissions


def role_has_any_permission(role: UserRole, permissions: List[Permission]) -> bool:
    """Check if a role has any of the specified permissions"""
    return any(role_has_permission(role, perm) for perm in permissions)


def role_has_all_permissions(role: UserRole, permissions: List[Permission]) -> bool:
    """Check if a role has all of the specified permissions"""
    return all(role_has_permission(role, perm) for perm in permissions)


def has_permission(
    context: PermissionContext, permission: Permission
) -> PermissionCheckResult:
    """
    Check if a user has a specific permission
    Includes scope validation for team/self permissions
    """
    # Check if role has the permission
    if not role_has_permission(context.role, permission):
        return PermissionCheckResult(
            allowed=False, reason=f"Role {context.role} does not have permission {permission}"
        )

    # Handle scope-based permissions
    if ".own" in permission.value:
        # Self-scoped permission
        if context.user_id != context.resource_owner_id:
            return PermissionCheckResult(
                allowed=False, reason="Can only access own resources"
            )

    if ".team" in permission.value:
        # Team-scoped permission
        if context.team_id != context.resource_team_id:
            return PermissionCheckResult(
                allowed=False, reason="Can only access team resources"
            )

    return PermissionCheckResult(allowed=True)


def has_any_permission(
    context: PermissionContext, permissions: List[Permission]
) -> PermissionCheckResult:
    """Check if a user has any of the specified permissions"""
    for permission in permissions:
        result = has_permission(context, permission)
        if result.allowed:
            return result

    return PermissionCheckResult(
        allowed=False, reason="Does not have any of the required permissions"
    )


def has_all_permissions(
    context: PermissionContext, permissions: List[Permission]
) -> PermissionCheckResult:
    """Check if a user has all of the specified permissions"""
    for permission in permissions:
        result = has_permission(context, permission)
        if not result.allowed:
            return result

    return PermissionCheckResult(allowed=True)


def has_role(user_role: UserRole, required_role: UserRole) -> bool:
    """Check if a user has a specific role"""
    return user_role == required_role


def has_any_role(user_role: UserRole, required_roles: List[UserRole]) -> bool:
    """Check if a user has any of the specified roles"""
    return user_role in required_roles


def is_role_higher_than(role: UserRole, compare_role: UserRole) -> bool:
    """Check if a role is higher in hierarchy than another role"""
    hierarchy = {
        UserRole.SUPER_ADMIN: 5,
        UserRole.ADMIN: 4,
        UserRole.MANAGER: 3,
        UserRole.STAFF: 2,
        UserRole.VIEWER: 1,
    }

    return hierarchy.get(role, 0) > hierarchy.get(compare_role, 0)


def get_permissions_for_role(role: UserRole) -> List[Permission]:
    """Get all permissions for a role"""
    return ROLE_PERMISSIONS.get(role, [])


def get_role_display_name(role: UserRole) -> str:
    """Get role display name"""
    display_names = {
        UserRole.SUPER_ADMIN: "Super Admin",
        UserRole.ADMIN: "Admin",
        UserRole.MANAGER: "Manager",
        UserRole.STAFF: "Staff",
        UserRole.VIEWER: "Viewer",
    }

    return display_names.get(role, str(role))


def can_assign_role(user_role: UserRole, target_role: UserRole) -> bool:
    """
    Validate if a user can assign a specific role
    Users can only assign roles lower than their own
    """
    # Super admins can assign any role
    if user_role == UserRole.SUPER_ADMIN:
        return True

    # Admins can assign manager, staff, viewer
    if user_role == UserRole.ADMIN:
        return target_role in [UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER]

    # Other roles cannot assign roles
    return False


def get_assignable_roles(user_role: UserRole) -> List[UserRole]:
    """Filter available roles based on user's role"""
    if user_role == UserRole.SUPER_ADMIN:
        return list(UserRole)

    if user_role == UserRole.ADMIN:
        return [UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER]

    return []
