import type { Session } from '../auth/api';
import { apiFetch } from '../../shared/api/client';

export type AdminPermission = string;

export type AdminInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

export type AdminInvitationOrganizationMode = 'existing' | 'personal';

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
  isPilotUser: boolean;
  betaAccessEnabled: boolean;
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
    organizationMode: AdminInvitationOrganizationMode;
    membershipRole: string;
    status: AdminInvitationStatus;
    expiresAt: string;
    acceptedAt?: string | null;
    revokedAt?: string | null;
    createdAt: string;
    requiresPasswordSetup: boolean;
    organization: {
      id: string | null;
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

export type AdminIdea = {
  id: string;
  title: string;
  description: string;
  votesCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  isBeta: boolean;
  author: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
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

export type ListAdminIdeasParams = Partial<{
  status: string;
  sort: 'top' | 'recent';
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
    organizationMode: AdminInvitationOrganizationMode;
    organizationId?: string;
    membershipRole: string;
    reason: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch<{
    userId: string;
    email: string;
    deliveryMode: 'console' | 'smtp' | 'resend';
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
    deliveryMode: 'console' | 'smtp' | 'resend';
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

export function updateAdminUserPilotAccess(
  session: Session | null,
  userId: string,
  payload: {
    isPilotUser: boolean;
    betaAccessEnabled: boolean;
    reason: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch(`/admin/users/${userId}/pilot-access`, {
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

export function listAdminIdeas(
  session: Session | null,
  params: ListAdminIdeasParams,
) {
  const currentSession = requireSession(session);

  return apiFetch<AdminIdea[]>(
    `/admin/ideas${buildQuery(params as Record<string, string | number | undefined>)}`,
    {
      token: currentSession.accessToken,
    },
  );
}

export function updateAdminIdeaStatus(
  session: Session | null,
  featureRequestId: string,
  payload: {
    status: string;
    reason: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch<AdminIdea>(`/admin/ideas/${featureRequestId}/status`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export type AdminPilotApplicationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export type AdminPilotProvisioningStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';

export type AdminPilotApplicationEvent = {
  id: string;
  type: string;
  message?: string | null;
  metadata?: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type AdminPilotApplicationSummary = {
  id: string;
  firstName: string;
  lastName?: string | null;
  fullName: string;
  email: string;
  profileType: string;
  projectCount: string;
  problemDescription: string;
  status: AdminPilotApplicationStatus;
  provisioningStatus: AdminPilotProvisioningStatus;
  createdAt: string;
  approvedAt?: string | null;
  paymentStartedAt?: string | null;
  paymentConfirmedAt?: string | null;
  activatedAt?: string | null;
  reviewedAt?: string | null;
  checkoutLinkSentAt?: string | null;
  provisioningErrorMessage?: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    billingPlan: string;
    billingStatus: string;
    projectsCount: number;
  } | null;
  invitation: {
    id: string;
    status: AdminInvitationStatus;
    createdAt: string;
    acceptedAt?: string | null;
    expiresAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    isPilotUser: boolean;
    betaAccessEnabled: boolean;
  } | null;
  reviewedBy: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type AdminPilotApplicationDetail = AdminPilotApplicationSummary & {
  acknowledgementAcceptedAt: string;
  organizationName?: string | null;
  internalNote?: string | null;
  stripe: {
    customerId?: string | null;
    checkoutSessionId?: string | null;
    subscriptionId?: string | null;
    priceId?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    billingPlan: string;
    billingStatus: string;
    billingCurrentPeriodEnd?: string | null;
    billingCancelAtPeriodEnd: boolean;
    billingLastEventAt?: string | null;
    projectsCount: number;
    membersCount: number;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  } | null;
  invitation: {
    id: string;
    status: AdminInvitationStatus;
    createdAt: string;
    acceptedAt?: string | null;
    revokedAt?: string | null;
    expiresAt: string;
    membershipRole: string;
    organizationMode: string;
  } | null;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    hasPassword: boolean;
    isPilotUser: boolean;
    betaAccessEnabled: boolean;
    memberships: Array<{
      id: string;
      role: string;
      organizationId: string;
    }>;
  } | null;
  events: AdminPilotApplicationEvent[];
};

export type AdminPilotApplicationsResponse = {
  items: AdminPilotApplicationSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminPilotDelivery = {
  mode: 'console' | 'smtp' | 'resend' | 'failed' | 'skipped';
  error?: string;
};

export type ListAdminPilotApplicationsParams = Partial<{
  page: number;
  pageSize: number;
  search: string;
  status: AdminPilotApplicationStatus;
}>;

export function listAdminPilotApplications(
  session: Session | null,
  params: ListAdminPilotApplicationsParams,
) {
  const currentSession = requireSession(session);

  return apiFetch<AdminPilotApplicationsResponse>(
    `/admin/pilot-applications${buildQuery(params as Record<string, string | number | undefined>)}`,
    {
      token: currentSession.accessToken,
    },
  );
}

export function getAdminPilotApplication(
  session: Session | null,
  applicationId: string,
) {
  const currentSession = requireSession(session);

  return apiFetch<AdminPilotApplicationDetail>(
    `/admin/pilot-applications/${applicationId}`,
    {
      token: currentSession.accessToken,
    },
  );
}

export function approvePilotApplication(
  session: Session | null,
  applicationId: string,
  payload: {
    reason: string;
    note?: string;
    organizationName?: string;
    sendCheckoutLink?: boolean;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch<{
    application: AdminPilotApplicationDetail;
    delivery: AdminPilotDelivery;
  }>(`/admin/pilot-applications/${applicationId}/approve`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function rejectPilotApplication(
  session: Session | null,
  applicationId: string,
  payload: {
    reason: string;
    note?: string;
    sendRejectionEmail?: boolean;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch<{
    application: AdminPilotApplicationDetail;
    delivery: AdminPilotDelivery;
  }>(`/admin/pilot-applications/${applicationId}/reject`, {
    method: 'PATCH',
    token: currentSession.accessToken,
    body: payload,
  });
}

export function resendPilotCheckoutLink(
  session: Session | null,
  applicationId: string,
  payload: {
    reason: string;
    note?: string;
  },
) {
  const currentSession = requireSession(session);

  return apiFetch<{
    application: AdminPilotApplicationDetail;
    delivery: AdminPilotDelivery;
  }>(`/admin/pilot-applications/${applicationId}/send-checkout-link`, {
    method: 'POST',
    token: currentSession.accessToken,
    body: payload,
  });
}
