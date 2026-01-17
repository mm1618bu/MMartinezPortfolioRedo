"""RBAC __init__ module"""

from python.rbac.types import (
    UserRole,
    Permission,
    PermissionScope,
    User,
    PermissionContext,
    PermissionCheckResult,
    ROLE_PERMISSIONS,
)

from python.rbac.utils import (
    role_has_permission,
    role_has_any_permission,
    role_has_all_permissions,
    has_permission,
    has_any_permission,
    has_all_permissions,
    has_role,
    has_any_role,
    is_role_higher_than,
    get_permissions_for_role,
    get_role_display_name,
    can_assign_role,
    get_assignable_roles,
)

__all__ = [
    "UserRole",
    "Permission",
    "PermissionScope",
    "User",
    "PermissionContext",
    "PermissionCheckResult",
    "ROLE_PERMISSIONS",
    "role_has_permission",
    "role_has_any_permission",
    "role_has_all_permissions",
    "has_permission",
    "has_any_permission",
    "has_all_permissions",
    "has_role",
    "has_any_role",
    "is_role_higher_than",
    "get_permissions_for_role",
    "get_role_display_name",
    "can_assign_role",
    "get_assignable_roles",
]
