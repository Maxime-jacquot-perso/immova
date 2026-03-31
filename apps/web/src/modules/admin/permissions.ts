import type { Session } from '../auth/api';

export const ADMIN_PERMISSIONS = {
  dashboardRead: 'dashboard.read',
  usersRead: 'users.read',
  usersUpdate: 'users.update',
  usersSuspend: 'users.suspend',
  usersReactivate: 'users.reactivate',
  trialGrant: 'trial.grant',
  trialExtend: 'trial.extend',
  subscriptionOverride: 'subscription.override',
  adminsRead: 'admins.read',
  adminsCreate: 'admins.create',
  adminsUpdate: 'admins.update',
  adminRolesManage: 'admin.roles.manage',
  auditRead: 'audit.read',
} as const;

export function canAccessAdmin(session: Session | null) {
  return Boolean(session?.admin);
}

export function hasAdminPermission(
  session: Session | null,
  permission: string,
) {
  return session?.admin?.permissions.includes(permission) ?? false;
}

export function getAssignableAdminRoles(session: Session | null) {
  return session?.admin?.assignableRoles ?? [];
}
