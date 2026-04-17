import { apiFetch } from '../../shared/api/client';

export type PilotCheckoutContext = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  organizationName?: string | null;
  status: string;
  approvedAt?: string | null;
  paymentStartedAt?: string | null;
  paymentConfirmedAt?: string | null;
  activatedAt?: string | null;
  checkoutTokenExpiresAt?: string | null;
  canStartCheckout: boolean;
  message: string;
};

export function getPilotCheckoutContext(token: string) {
  const searchParams = new URLSearchParams({ token });

  return apiFetch<PilotCheckoutContext>(
    `/pilot-applications/checkout?${searchParams.toString()}`,
  );
}

export function createPilotCheckoutSession(token: string) {
  return apiFetch<{ url: string }>('/pilot-applications/checkout-session', {
    method: 'POST',
    body: { token },
  });
}
