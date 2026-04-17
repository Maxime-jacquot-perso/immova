import { BillingPlan, BillingStatus, SubscriptionStatus } from '@prisma/client';
import { BillingAccessService } from './billing-access.service';

describe('BillingAccessService', () => {
  const service = new BillingAccessService();

  it('allows access when the organization Stripe subscription is active', () => {
    const result = service.getAccessContext({
      organizationBillingPlan: BillingPlan.PRO,
      organizationBillingStatus: BillingStatus.ACTIVE,
      userSubscriptionStatus: SubscriptionStatus.NONE,
      userTrialEndsAt: null,
    });

    expect(result).toEqual(
      expect.objectContaining({
        hasAccess: true,
        source: 'organization',
      }),
    );
  });

  it('denies access when the organization subscription is past due', () => {
    const result = service.getAccessContext({
      organizationBillingPlan: BillingPlan.STANDARD,
      organizationBillingStatus: BillingStatus.PAST_DUE,
      userSubscriptionStatus: SubscriptionStatus.NONE,
      userTrialEndsAt: null,
    });

    expect(result).toEqual(
      expect.objectContaining({
        hasAccess: false,
        source: 'none',
      }),
    );
  });

  it('keeps legacy trial access while the trial end date is in the future', () => {
    const result = service.getAccessContext({
      organizationBillingPlan: BillingPlan.NONE,
      organizationBillingStatus: BillingStatus.NONE,
      userSubscriptionStatus: SubscriptionStatus.TRIAL,
      userTrialEndsAt: new Date('2030-01-01T00:00:00.000Z'),
      now: new Date('2029-12-31T00:00:00.000Z'),
    });

    expect(result).toEqual(
      expect.objectContaining({
        hasAccess: true,
        source: 'legacy_trial',
      }),
    );
  });
});
