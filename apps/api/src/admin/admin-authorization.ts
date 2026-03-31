import { AdminRole } from '@prisma/client';

export const ADMIN_PERMISSIONS = {
  dashboardRead: 'dashboard.read',
  usersRead: 'users.read',
  usersUpdate: 'users.update',
  usersSuspend: 'users.suspend',
  usersReactivate: 'users.reactivate',
  projectsRead: 'projects.read',
  trialRead: 'trial.read',
  trialGrant: 'trial.grant',
  trialExtend: 'trial.extend',
  subscriptionRead: 'subscription.read',
  subscriptionOverride: 'subscription.override',
  adminsRead: 'admins.read',
  adminsCreate: 'admins.create',
  adminsUpdate: 'admins.update',
  adminRolesManage: 'admin.roles.manage',
  auditRead: 'audit.read',
} as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export type TrialPolicy = {
  maxGrantDays: number;
  maxExtensionDays: number;
  maxExtensionCount: number | null;
};

const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS);

const ROLE_LEVELS: Record<AdminRole, number> = {
  [AdminRole.USER]: 0,
  [AdminRole.READONLY_ADMIN]: 1,
  [AdminRole.SALES_ADMIN]: 2,
  [AdminRole.SUPPORT_ADMIN]: 2,
  [AdminRole.ADMIN]: 3,
  [AdminRole.SUPER_ADMIN]: 4,
};

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  [AdminRole.USER]: [],
  [AdminRole.READONLY_ADMIN]: [
    ADMIN_PERMISSIONS.dashboardRead,
    ADMIN_PERMISSIONS.usersRead,
    ADMIN_PERMISSIONS.projectsRead,
    ADMIN_PERMISSIONS.trialRead,
    ADMIN_PERMISSIONS.subscriptionRead,
    ADMIN_PERMISSIONS.auditRead,
  ],
  [AdminRole.SALES_ADMIN]: [
    ADMIN_PERMISSIONS.dashboardRead,
    ADMIN_PERMISSIONS.usersRead,
    ADMIN_PERMISSIONS.trialRead,
    ADMIN_PERMISSIONS.trialGrant,
    ADMIN_PERMISSIONS.trialExtend,
    ADMIN_PERMISSIONS.subscriptionRead,
  ],
  [AdminRole.SUPPORT_ADMIN]: [
    ADMIN_PERMISSIONS.dashboardRead,
    ADMIN_PERMISSIONS.usersRead,
    ADMIN_PERMISSIONS.projectsRead,
    ADMIN_PERMISSIONS.trialRead,
    ADMIN_PERMISSIONS.subscriptionRead,
    ADMIN_PERMISSIONS.auditRead,
  ],
  [AdminRole.ADMIN]: [
    ADMIN_PERMISSIONS.dashboardRead,
    ADMIN_PERMISSIONS.usersRead,
    ADMIN_PERMISSIONS.usersUpdate,
    ADMIN_PERMISSIONS.usersSuspend,
    ADMIN_PERMISSIONS.usersReactivate,
    ADMIN_PERMISSIONS.projectsRead,
    ADMIN_PERMISSIONS.trialRead,
    ADMIN_PERMISSIONS.trialGrant,
    ADMIN_PERMISSIONS.trialExtend,
    ADMIN_PERMISSIONS.subscriptionRead,
    ADMIN_PERMISSIONS.subscriptionOverride,
    ADMIN_PERMISSIONS.adminsRead,
    ADMIN_PERMISSIONS.adminsCreate,
    ADMIN_PERMISSIONS.adminsUpdate,
    ADMIN_PERMISSIONS.adminRolesManage,
    ADMIN_PERMISSIONS.auditRead,
  ],
  [AdminRole.SUPER_ADMIN]: ALL_ADMIN_PERMISSIONS,
};

const ASSIGNABLE_ROLES: Record<AdminRole, readonly AdminRole[]> = {
  [AdminRole.USER]: [],
  [AdminRole.READONLY_ADMIN]: [],
  [AdminRole.SALES_ADMIN]: [],
  [AdminRole.SUPPORT_ADMIN]: [],
  [AdminRole.ADMIN]: [
    AdminRole.READONLY_ADMIN,
    AdminRole.SALES_ADMIN,
    AdminRole.SUPPORT_ADMIN,
  ],
  [AdminRole.SUPER_ADMIN]: [
    AdminRole.READONLY_ADMIN,
    AdminRole.SALES_ADMIN,
    AdminRole.SUPPORT_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPER_ADMIN,
  ],
};

const ROLE_TRIAL_POLICIES: Partial<Record<AdminRole, TrialPolicy>> = {
  [AdminRole.SALES_ADMIN]: {
    maxGrantDays: 21,
    maxExtensionDays: 14,
    maxExtensionCount: 2,
  },
  [AdminRole.ADMIN]: {
    maxGrantDays: 45,
    maxExtensionDays: 30,
    maxExtensionCount: 4,
  },
  [AdminRole.SUPER_ADMIN]: {
    maxGrantDays: 90,
    maxExtensionDays: 90,
    maxExtensionCount: null,
  },
};

export function getAdminPermissions(role: AdminRole): AdminPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function getAssignableAdminRoles(role: AdminRole): AdminRole[] {
  return [...ASSIGNABLE_ROLES[role]];
}

export function getTrialPolicy(role: AdminRole): TrialPolicy | null {
  return ROLE_TRIAL_POLICIES[role] ?? null;
}

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isAdminRole(role: AdminRole): boolean {
  return role !== AdminRole.USER;
}

export function getAdminRoleLevel(role: AdminRole): number {
  return ROLE_LEVELS[role];
}
