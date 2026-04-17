import { BillingStatus } from '@prisma/client';

export function mapStripeSubscriptionStatusToBillingStatus(status: string) {
  switch (status) {
    case 'incomplete':
      return BillingStatus.INCOMPLETE;
    case 'incomplete_expired':
      return BillingStatus.INCOMPLETE_EXPIRED;
    case 'trialing':
      return BillingStatus.TRIALING;
    case 'active':
      return BillingStatus.ACTIVE;
    case 'past_due':
      return BillingStatus.PAST_DUE;
    case 'canceled':
      return BillingStatus.CANCELED;
    case 'unpaid':
      return BillingStatus.UNPAID;
    case 'paused':
      return BillingStatus.PAUSED;
    default:
      return BillingStatus.NONE;
  }
}
