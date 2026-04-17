import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BillingPlan } from '@prisma/client';

export type PurchasableBillingPlan = Exclude<BillingPlan, 'NONE'>;

export const BILLING_PLAN_ENV_BY_PLAN: Record<PurchasableBillingPlan, string> =
  {
    PILOT: 'STRIPE_PRICE_PILOT_MONTHLY',
    STANDARD: 'STRIPE_PRICE_STANDARD_MONTHLY',
    PRO: 'STRIPE_PRICE_PRO_MONTHLY',
  };

@Injectable()
export class BillingConfigService {
  readonly apiVersion = '2026-02-25.clover';

  getStripeSecretKey() {
    return this.requireEnv('STRIPE_SECRET_KEY');
  }

  getStripeWebhookSecret() {
    return this.requireEnv('STRIPE_WEBHOOK_SECRET');
  }

  getCheckoutSuccessUrl() {
    return this.requireEnv('STRIPE_CHECKOUT_SUCCESS_URL');
  }

  getCheckoutCancelUrl() {
    return this.requireEnv('STRIPE_CHECKOUT_CANCEL_URL');
  }

  getPortalReturnUrl() {
    return this.requireEnv('STRIPE_PORTAL_RETURN_URL');
  }

  getPriceId(plan: PurchasableBillingPlan) {
    return this.requireEnv(BILLING_PLAN_ENV_BY_PLAN[plan]);
  }

  private requireEnv(name: string) {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new InternalServerErrorException(
        `${name} is required to use Stripe billing`,
      );
    }

    return value;
  }
}
