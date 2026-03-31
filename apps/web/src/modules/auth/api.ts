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

export function login(payload: { email: string; password: string }) {
  return apiFetch<Session>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}
