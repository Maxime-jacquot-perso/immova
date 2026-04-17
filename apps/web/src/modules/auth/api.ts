import { apiFetch } from '../../shared/api/client';

export type AdminContext = {
  role: string;
  permissions: string[];
  assignableRoles: string[];
  trialPolicy: {
    maxGrantDays: number;
    maxExtensionDays: number;
    maxExtensionCount: number | null;
  } | null;
};

export type Session = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    adminRole: string;
    isSuspended: boolean;
    isPilotUser: boolean;
    betaAccessEnabled: boolean;
    lastLoginAt?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  role: string | null;
  admin: AdminContext | null;
  legal?: {
    accountAcceptanceRequired: boolean;
    missingDocumentTypes: string[];
  };
};

export type InvitationVerification = {
  email: string;
  organizationMode: 'existing' | 'personal';
  membershipRole: string;
  expiresAt: string;
  requiresPasswordSetup: boolean;
  organization: {
    id: string | null;
    name: string;
    slug: string;
  };
};

export type PasswordResetVerification = {
  expiresAt: string;
};

export function login(payload: {
  email: string;
  password: string;
  organizationSlug?: string;
}) {
  return apiFetch<Session>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function verifyInvitationToken(token: string) {
  const searchParams = new URLSearchParams({ token });

  return apiFetch<InvitationVerification>(
    `/auth/invitations/verify?${searchParams.toString()}`,
  );
}

export function acceptInvitation(payload: {
  token: string;
  password?: string;
  acceptLegalDocuments: true;
}) {
  return apiFetch<{
    email: string;
    requiresPasswordSetup: boolean;
    organization: {
      id: string;
      name: string;
      slug: string;
      };
  }>('/auth/invitations/accept', {
    method: 'POST',
    body: payload,
  });
}

export function requestPasswordReset(payload: { email: string }) {
  return apiFetch<{
    success: true;
    message: string;
  }>('/auth/forgot-password', {
    method: 'POST',
    body: payload,
  });
}

export function verifyPasswordResetToken(token: string) {
  const searchParams = new URLSearchParams({ token });

  return apiFetch<PasswordResetVerification>(
    `/auth/reset-password/verify?${searchParams.toString()}`,
  );
}

export function resetPassword(payload: { token: string; password: string }) {
  return apiFetch<{
    success: true;
  }>('/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}
