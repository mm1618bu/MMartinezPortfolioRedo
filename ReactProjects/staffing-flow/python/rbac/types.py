"""RBAC Type Definitions for Python Backend"""

from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User roles in the system"""

    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"
    VIEWER = "viewer"


class Permission(str, Enum):
    """System permissions"""

    # User Management
    USER_CREATE = "user.create"
    USER_READ = "user.read"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_ASSIGN_ROLE = "user.assign_role"

    # Staff Management
    STAFF_CREATE = "staff.create"
    STAFF_READ = "staff.read"
    STAFF_READ_OWN = "staff.read.own"
    STAFF_READ_TEAM = "staff.read.team"
    STAFF_UPDATE = "staff.update"
    STAFF_UPDATE_OWN = "staff.update.own"
    STAFF_DELETE = "staff.delete"
    STAFF_EXPORT = "staff.export"

    # Schedule Management
    SCHEDULE_CREATE = "schedule.create"
    SCHEDULE_READ = "schedule.read"
    SCHEDULE_READ_OWN = "schedule.read.own"
    SCHEDULE_READ_TEAM = "schedule.read.team"
    SCHEDULE_UPDATE = "schedule.update"
    SCHEDULE_UPDATE_TEAM = "schedule.update.team"
    SCHEDULE_DELETE = "schedule.delete"
    SCHEDULE_PUBLISH = "schedule.publish"

    # Time Off Management
    TIMEOFF_CREATE = "timeoff.create"
    TIMEOFF_READ = "timeoff.read"
    TIMEOFF_READ_OWN = "timeoff.read.own"
    TIMEOFF_READ_TEAM = "timeoff.read.team"
    TIMEOFF_APPROVE = "timeoff.approve"
    TIMEOFF_CANCEL = "timeoff.cancel"

    # Department Management
    DEPARTMENT_CREATE = "department.create"
    DEPARTMENT_READ = "department.read"
    DEPARTMENT_UPDATE = "department.update"
    DEPARTMENT_DELETE = "department.delete"

    # Reporting
    REPORT_GENERATE = "report.generate"
    REPORT_VIEW = "report.view"
    REPORT_EXPORT = "report.export"
    REPORT_SCHEDULE = "report.schedule"

    # Settings & Configuration
    SETTINGS_SYSTEM = "settings.system"
    SETTINGS_ORGANIZATION = "settings.organization"
    SETTINGS_VIEW = "settings.view"

    # Audit & Logs
    AUDIT_READ = "audit.read"
    AUDIT_EXPORT = "audit.export"


class PermissionScope(str, Enum):
    """Permission scopes"""

    SYSTEM = "system"
    ORGANIZATION = "organization"
    TEAM = "team"
    SELF = "self"


# Role permissions mapping
ROLE_PERMISSIONS: dict[UserRole, List[Permission]] = {
    UserRole.SUPER_ADMIN: [p for p in Permission],  # All permissions
    UserRole.ADMIN: [
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_ASSIGN_ROLE,
        Permission.STAFF_CREATE,
        Permission.STAFF_READ,
        Permission.STAFF_READ_OWN,
        Permission.STAFF_READ_TEAM,
        Permission.STAFF_UPDATE,
        Permission.STAFF_UPDATE_OWN,
        Permission.STAFF_DELETE,
        Permission.STAFF_EXPORT,
        Permission.SCHEDULE_CREATE,
        Permission.SCHEDULE_READ,
        Permission.SCHEDULE_READ_OWN,
        Permission.SCHEDULE_READ_TEAM,
        Permission.SCHEDULE_UPDATE,
        Permission.SCHEDULE_UPDATE_TEAM,
        Permission.SCHEDULE_DELETE,
        Permission.SCHEDULE_PUBLISH,
        Permission.TIMEOFF_CREATE,
        Permission.TIMEOFF_READ,
        Permission.TIMEOFF_READ_OWN,
        Permission.TIMEOFF_READ_TEAM,
        Permission.TIMEOFF_APPROVE,
        Permission.TIMEOFF_CANCEL,
        Permission.DEPARTMENT_CREATE,
        Permission.DEPARTMENT_READ,
        Permission.DEPARTMENT_UPDATE,
        Permission.DEPARTMENT_DELETE,
        Permission.REPORT_GENERATE,
        Permission.REPORT_VIEW,
        Permission.REPORT_EXPORT,
        Permission.REPORT_SCHEDULE,
        Permission.SETTINGS_ORGANIZATION,
        Permission.SETTINGS_VIEW,
        Permission.AUDIT_READ,
        Permission.AUDIT_EXPORT,
    ],
    UserRole.MANAGER: [
        Permission.STAFF_READ_OWN,
        Permission.STAFF_READ_TEAM,
        Permission.STAFF_UPDATE_OWN,
        Permission.SCHEDULE_READ_OWN,
        Permission.SCHEDULE_READ_TEAM,
        Permission.SCHEDULE_UPDATE_TEAM,
        Permission.TIMEOFF_CREATE,
        Permission.TIMEOFF_READ_OWN,
        Permission.TIMEOFF_READ_TEAM,
        Permission.TIMEOFF_APPROVE,
        Permission.TIMEOFF_CANCEL,
        Permission.DEPARTMENT_READ,
        Permission.REPORT_GENERATE,
        Permission.REPORT_VIEW,
        Permission.REPORT_EXPORT,
        Permission.SETTINGS_VIEW,
    ],
    UserRole.STAFF: [
        Permission.STAFF_READ_OWN,
        Permission.STAFF_UPDATE_OWN,
        Permission.SCHEDULE_READ_OWN,
        Permission.TIMEOFF_CREATE,
        Permission.TIMEOFF_READ_OWN,
        Permission.TIMEOFF_CANCEL,
        Permission.DEPARTMENT_READ,
        Permission.SETTINGS_VIEW,
    ],
    UserRole.VIEWER: [
        Permission.STAFF_READ,
        Permission.STAFF_EXPORT,
        Permission.SCHEDULE_READ,
        Permission.DEPARTMENT_READ,
        Permission.REPORT_GENERATE,
        Permission.REPORT_VIEW,
        Permission.REPORT_EXPORT,
        Permission.SETTINGS_VIEW,
    ],
}


class User(BaseModel):
    """User model"""

    id: str
    email: str
    name: str
    role: UserRole
    organization_id: str
    team_id: Optional[str] = None
    permissions: Optional[List[Permission]] = None
    created_at: datetime
    updated_at: datetime


class PermissionContext(BaseModel):
    """Context for permission checking"""

    user_id: str
    role: UserRole
    organization_id: str
    team_id: Optional[str] = None
    resource_owner_id: Optional[str] = None
    resource_team_id: Optional[str] = None


class PermissionCheckResult(BaseModel):
    """Result of permission check"""

    allowed: bool
    reason: Optional[str] = None
