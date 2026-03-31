import type { Session } from '../auth/api';
import { apiFetch } from '../../shared/api/client';

export type AdminPermission = string;

export type AdminInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

export type AdminDashboard = {
  summary: {
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    trialsExpiringSoon: number;
    suspendedUsers: number;
  };
  adminRoleDistribution: Array<{
    role: string;
    count: number;
  }>;
  recentActions: AdminAuditLog[];
};

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
  projectsCount: number;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  adminRole: string;
  isSuspended: boolean;
  accessStatus: 'ACTIVE' | 'SUSPENDED';
  trialEndsAt?: string | null;
  trialExtensionsCount: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  lastLoginAt?: string | null;
  createdAt: string;
  organizationsCount: number;
  totalProjectsCount: number;
  organizations: OrganizationSummary[];
};

export type AdminAuditLog = {
  id: string;
  action: string;
  targetType: string;
  reason: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    adminRole: string;
  };
  targetUser: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    adminRole: string;
  } | null;
};

export type AdminUserDetail = AdminUserSummary & {
  memberships: Array<{
    id: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      projectsCount: number;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    membershipRole: string;
    status: AdminInvitationStatus;
    expiresAt: string;
    acceptedAt?: string | null;
    revokedAt?: string | null;
    createdAt: string;
    requiresPasswordSetup: boolean;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  totalProjectsCount: number;
  recentAuditLogs: AdminAuditLog[];
};

export type AdminOrganizationOption = {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  projectsCount: number;
};

export type AdminUserListResponse = {
  items: AdminUserSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminsListResponse = {
  items: Array<{
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName: string;
    adminRole: string;
    isSuspended: boolean;
    lastLoginAt?: string | null;
    createdAt: string;
    createdBy: {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      adminRole: string;
      createdAt: string;
    } | null;
    updatedBy: {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      adminRole: string;
      createdAt: string;
    } | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AuditLogsResponse = {
  items: AdminAuditLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ListAdminUsersParams = Partial<{
  page: number;
  pageSize: number;
  search: string;
  adminRole: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  accessStatus: 'ACTIVE' | 'SUSPENDED';
}>;

export type ListAdminsParams = Partial<{
  page: number;
  pageSize: number;
  search: string;
  adminRole: string;
}>;

export type ListAuditLogsParams = Partial<{
  page: number;
  pageSize: number;
  search: string;
  action: string;
  actorUserId: string;
  targetUserId: string;
}>;

function requireSession(session: Session | null): Session {
  if (!session) {
    throw new Error('Session manquante');
  }

  return session;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

export function getAdminDashboard(session: Session | null) {
  const currentSession = requireSession(session);

  return apiFetch<AdminDashboard>('/admin/dashboard', {
    token: currentSession.accessToken,
  });
}

export function listAdminUsers(
  session: Session | null,
  params: ListAdminUsersParams,
) {
  const currentSession = requireSession(session);

  return apiFetch<AdminUserListResponse>(
    `/admin/users${buildQuery(params as Record<string, string | number | undefined>)}`,
    {
      token: currentSession.accessToken,
    },
  );
}

export function getAdminUser(session: Session | null, userId: string) {
  const currentSession = requireSession(session);

  return apiFetch<AdminUserDetail>(`/admin/users/${userId}`, {
    token: currentSession.accessToken,
  });
}

export function listAdminOrganizationOptions(session: Session | null) {
  const currentSession = requireSession(session);

  return apiFetch<AdminOrganizationOption[]>(
    '/admin/users/organizations/options',
    {
      token: currentSession.accessToken,
    },
  );
}

export function inviteAdminUser(
  session: Session | null,
  payload: {
    email: string;
    organizationId: string;
    membershipRole: string;
    reason: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch<{
    userId: string;
    email: string;
    deliveryMode: 'console' | 'resend';
    invitation: AdminUserDetail['invitations'][number];
  }>('/admin/users/invite', {
    method: 'POST',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function resendAdminUserInvitation(
  session: Session | null,
  invitationId: string,
  payload: { reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch<{
    userId: string;
    email: string;
    deliveryMode: 'console' | 'resend';
    invitation: AdminUserDetail['invitations'][number];
  }>(`/admin/users/invitations/${invitationId}/resend`, {
    method: 'POST',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function suspendAdminUser(
  session: Session | null,
  userId: string,
  payload: { reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/suspend`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function reactivateAdminUser(
  session: Session | null,
  userId: string,
  payload: { reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/reactivate`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function grantAdminUserTrial(
  session: Session | null,
  userId: string,
  payload: { durationDays: number; reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/grant-trial`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function extendAdminUserTrial(
  session: Session | null,
  userId: string,
  payload: { durationDays: number; reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/extend-trial`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function updateAdminUserSubscription(
  session: Session | null,
  userId: string,
  payload: {
    subscriptionPlan: string;
    subscriptionStatus: string;
    reason: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/subscription`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function changeAdminUserRole(
  session: Session | null,
  userId: string,
  payload: { adminRole: string; reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/change-role`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function listAdmins(
  session: Session | null,
  params: ListAdminsParams,
) {
  const currentSession = requireSession(session);

  return apiFetch<AdminsListResponse>(
    `/admin/admins${buildQuery(params as Record<string, string | number | undefined>)}`,
    {
      token: currentSession.accessToken,
    },
  );
}

export function createAdmin(
  session: Session | null,
  payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    adminRole: string;
    reason: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch('/admin/admins', {
    method: 'POST',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function changeAdminRole(
  session: Session | null,
  userId: string,
  payload: { adminRole: string; reason: string },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/admins/${userId}/change-role`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function listAuditLogs(
  session: Session | null,
  params: ListAuditLogsParams,
) {
  const currentSession = requireSession(session);

  return apiFetch<AuditLogsResponse>(
    `/admin/audit-logs${buildQuery(params as Record<string, string | number | undefined>)}`,
    {
      token: currentSession.accessToken,
    },
  );
}
