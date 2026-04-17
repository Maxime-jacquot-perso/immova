import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BillingPlan } from '@prisma/client';
import {
  BillingConfigService,
  PurchasableBillingPlan,
} from './billing-config.service';

const SUPPORTED_BILLING_PLANS: PurchasableBillingPlan[] = [
  BillingPlan.PILOT,
  BillingPlan.STANDARD,
  BillingPlan.PRO,
];

@Injectable()
export class BillingPlanMapService {
  constructor(private readonly billingConfig: BillingConfigService) {}

  getPlanFromStripePriceId(priceId?: string | null) {
    if (!priceId) {
      return null;
    }

    for (const plan of SUPPORTED_BILLING_PLANS) {
      if (this.billingConfig.getPriceId(plan) === priceId) {
        return plan;
      }
    }

    return null;
  }

  getStripePriceIdForPlan(plan: BillingPlan) {
    if (plan === BillingPlan.NONE) {
      throw new InternalServerErrorException(
        'Billing plan NONE cannot be purchased through Stripe Checkout',
      );
    }

    return this.billingConfig.getPriceId(plan as PurchasableBillingPlan);
  }

  getSupportedPlans() {
    return [...SUPPORTED_BILLING_PLANS];
  }
}
