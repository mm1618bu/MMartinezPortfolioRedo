/**
 * RBAC Type Definitions
 * Role-Based Access Control types for the frontend
 */

// User Roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  VIEWER = 'viewer',
}

// Permission Categories
export type Permission =
  // User Management
  | 'user.create'
  | 'user.read'
  | 'user.update'
  | 'user.delete'
  | 'user.assign_role'
  // Staff Management
  | 'staff.create'
  | 'staff.read'
  | 'staff.read.own'
  | 'staff.read.team'
  | 'staff.update'
  | 'staff.update.own'
  | 'staff.delete'
  | 'staff.export'
  // Schedule Management
  | 'schedule.create'
  | 'schedule.read'
  | 'schedule.read.own'
  | 'schedule.read.team'
  | 'schedule.update'
  | 'schedule.update.team'
  | 'schedule.delete'
  | 'schedule.publish'
  // Time Off Management
  | 'timeoff.create'
  | 'timeoff.read'
  | 'timeoff.read.own'
  | 'timeoff.read.team'
  | 'timeoff.approve'
  | 'timeoff.cancel'
  // Department Management
  | 'department.create'
  | 'department.read'
  | 'department.update'
  | 'department.delete'
  // Reporting
  | 'report.generate'
  | 'report.view'
  | 'report.export'
  | 'report.schedule'
  // Settings & Configuration
  | 'settings.system'
  | 'settings.organization'
  | 'settings.view'
  // Audit & Logs
  | 'audit.read'
  | 'audit.export';

// Permission Scope
export enum PermissionScope {
  SYSTEM = 'system',
  ORGANIZATION = 'organization',
  TEAM = 'team',
  SELF = 'self',
}

// Role Permissions Mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'user.assign_role',
    'staff.create',
    'staff.read',
    'staff.read.own',
    'staff.read.team',
    'staff.update',
    'staff.update.own',
    'staff.delete',
    'staff.export',
    'schedule.create',
    'schedule.read',
    'schedule.read.own',
    'schedule.read.team',
    'schedule.update',
    'schedule.update.team',
    'schedule.delete',
    'schedule.publish',
    'timeoff.create',
    'timeoff.read',
    'timeoff.read.own',
    'timeoff.read.team',
    'timeoff.approve',
    'timeoff.cancel',
    'department.create',
    'department.read',
    'department.update',
    'department.delete',
    'report.generate',
    'report.view',
    'report.export',
    'report.schedule',
    'settings.system',
    'settings.organization',
    'settings.view',
    'audit.read',
    'audit.export',
  ],

  [UserRole.ADMIN]: [
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'user.assign_role',
    'staff.create',
    'staff.read',
    'staff.read.own',
    'staff.read.team',
    'staff.update',
    'staff.update.own',
    'staff.delete',
    'staff.export',
    'schedule.create',
    'schedule.read',
    'schedule.read.own',
    'schedule.read.team',
    'schedule.update',
    'schedule.update.team',
    'schedule.delete',
    'schedule.publish',
    'timeoff.create',
    'timeoff.read',
    'timeoff.read.own',
    'timeoff.read.team',
    'timeoff.approve',
    'timeoff.cancel',
    'department.create',
    'department.read',
    'department.update',
    'department.delete',
    'report.generate',
    'report.view',
    'report.export',
    'report.schedule',
    'settings.organization',
    'settings.view',
    'audit.read',
    'audit.export',
  ],

  [UserRole.MANAGER]: [
    'staff.read.own',
    'staff.read.team',
    'staff.update.own',
    'schedule.read.own',
    'schedule.read.team',
    'schedule.update.team',
    'timeoff.create',
    'timeoff.read.own',
    'timeoff.read.team',
    'timeoff.approve',
    'timeoff.cancel',
    'department.read',
    'report.generate',
    'report.view',
    'report.export',
    'settings.view',
  ],

  [UserRole.STAFF]: [
    'staff.read.own',
    'staff.update.own',
    'schedule.read.own',
    'timeoff.create',
    'timeoff.read.own',
    'timeoff.cancel',
    'department.read',
    'settings.view',
  ],

  [UserRole.VIEWER]: [
    'staff.read',
    'staff.export',
    'schedule.read',
    'department.read',
    'report.generate',
    'report.view',
    'report.export',
    'settings.view',
  ],
};

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  teamId?: string;
  permissions?: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// Permission Check Context
export interface PermissionContext {
  userId: string;
  role: UserRole;
  organizationId: string;
  teamId?: string;
  resourceOwnerId?: string;
  resourceTeamId?: string;
}

// Permission Check Result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
