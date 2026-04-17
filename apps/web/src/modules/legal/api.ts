import { apiFetch } from '../../shared/api/client';
import type { Session } from '../auth/api';

function token(session: Session | null) {
  if (!session) {
    throw new Error('Missing session');
  }

  return session.accessToken;
}

export function acceptCurrentLegalDocuments(
  session: Session | null,
  payload: {
    scope: 'ACCOUNT' | 'CHECKOUT';
    accepted: true;
  },
) {
  return apiFetch<{
    scope: 'ACCOUNT' | 'CHECKOUT';
    acceptedAt: string;
    acceptedDocuments: Array<{
      type: string;
      title: string;
      slug: string;
      version: string;
      updatedAt: string;
      isCurrent: boolean;
    }>;
  }>('/legal-documents/accept/current', {
    method: 'POST',
    token: token(session),
    body: payload,
  });
}
