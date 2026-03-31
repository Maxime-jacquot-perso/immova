import { apiFetch } from '../../shared/api/client';
import type { Session } from '../auth/api';

export type FeatureIdea = {
  id: string;
  title: string;
  description: string;
  votesCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  hasVoted: boolean;
  isBeta: boolean;
  author: {
    id: string;
    email: string;
    name: string;
  };
};

function token(session: Session | null) {
  if (!session) {
    throw new Error('Missing session');
  }

  return session.accessToken;
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    searchParams.set(key, value);
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

export function listIdeas(
  session: Session | null,
  params: {
    sort?: 'top' | 'recent';
    status?: string;
  },
) {
  return apiFetch<FeatureIdea[]>(
    `/ideas${buildQuery({
      sort: params.sort,
      status: params.status && params.status !== 'ALL' ? params.status : undefined,
    })}`,
    {
      token: token(session),
    },
  );
}

export function createIdea(
  session: Session | null,
  payload: {
    title: string;
    description: string;
  },
) {
  return apiFetch<FeatureIdea>('/ideas', {
    method: 'POST',
    token: token(session),
    body: payload,
  });
}

export function listBetaIdeas(session: Session | null) {
  return apiFetch<FeatureIdea[]>('/ideas/beta', {
    token: token(session),
  });
}

export function voteIdea(session: Session | null, featureRequestId: string) {
  return apiFetch<{ id: string; votesCount: number; hasVoted: boolean }>(
    `/ideas/${featureRequestId}/vote`,
    {
      method: 'POST',
      token: token(session),
    },
  );
}

export function removeIdeaVote(
  session: Session | null,
  featureRequestId: string,
) {
  return apiFetch<{ id: string; votesCount: number; hasVoted: boolean }>(
    `/ideas/${featureRequestId}/vote`,
    {
      method: 'DELETE',
      token: token(session),
    },
  );
}
