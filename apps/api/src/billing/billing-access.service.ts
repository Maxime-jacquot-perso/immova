import { Injectable } from '@nestjs/common';
import { BillingPlan, BillingStatus, SubscriptionStatus } from '@prisma/client';

export type BillingAccessSource =
  | 'organization'
  | 'legacy_subscription'
  | 'legacy_trial'
  | 'none';

@Injectable()
export class BillingAccessService {
  private readonly allowedOrganizationStatuses = new Set<BillingStatus>([
    BillingStatus.ACTIVE,
    BillingStatus.TRIALING,
  ]);

  getAccessContext(input: {
    organizationBillingPlan: BillingPlan;
    organizationBillingStatus: BillingStatus;
    userSubscriptionStatus: SubscriptionStatus;
    userTrialEndsAt: Date | null;
    now?: Date;
  }) {
    const now = input.now ?? new Date();

    if (
      input.organizationBillingPlan !== BillingPlan.NONE &&
      this.allowedOrganizationStatuses.has(input.organizationBillingStatus)
    ) {
      return {
        hasAccess: true,
        source: 'organization' as BillingAccessSource,
        reason:
          'Organization access is granted by a Stripe subscription in active or trialing state.',
      };
    }

    if (
      input.userSubscriptionStatus === SubscriptionStatus.TRIAL &&
      input.userTrialEndsAt &&
      input.userTrialEndsAt.getTime() > now.getTime()
    ) {
      return {
        hasAccess: true,
        source: 'legacy_trial' as BillingAccessSource,
        reason: `Legacy trial remains active until ${input.userTrialEndsAt.toISOString()}.`,
      };
    }

    if (input.userSubscriptionStatus === SubscriptionStatus.ACTIVE) {
      return {
        hasAccess: true,
        source: 'legacy_subscription' as BillingAccessSource,
        reason: 'Legacy user-level subscription remains active.',
      };
    }

    if (
      input.organizationBillingPlan === BillingPlan.NONE &&
      input.organizationBillingStatus !== BillingStatus.NONE
    ) {
      return {
        hasAccess: false,
        source: 'none' as BillingAccessSource,
        reason:
          'Stripe reported a subscription state, but no mapped Axelys plan could be resolved from the active price.',
      };
    }

    if (input.organizationBillingStatus === BillingStatus.PAST_DUE) {
      return {
        hasAccess: false,
        source: 'none' as BillingAccessSource,
        reason:
          'Organization subscription is past due. Access stays disabled until Stripe confirms a successful payment.',
      };
    }

    return {
      hasAccess: false,
      source: 'none' as BillingAccessSource,
      reason:
        'No active Stripe-backed organization subscription or legacy access override is available.',
    };
  }

  hasPaidAccess(input: {
    organizationBillingPlan: BillingPlan;
    organizationBillingStatus: BillingStatus;
    userSubscriptionStatus: SubscriptionStatus;
    userTrialEndsAt: Date | null;
    now?: Date;
  }) {
    return this.getAccessContext(input).hasAccess;
  }
}
