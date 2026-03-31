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
    lastLoginAt?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  role: string | null;
  admin: AdminContext | null;
};

export type InvitationVerification = {
  email: string;
  membershipRole: string;
  expiresAt: string;
  requiresPasswordSetup: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
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
