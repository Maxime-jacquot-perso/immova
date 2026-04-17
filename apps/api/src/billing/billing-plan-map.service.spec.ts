import { BillingPlan } from '@prisma/client';
import { BillingConfigService } from './billing-config.service';
import { BillingPlanMapService } from './billing-plan-map.service';

describe('BillingPlanMapService', () => {
  const originalEnv = process.env;
  let service: BillingPlanMapService;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_PILOT_MONTHLY: 'price_pilot_monthly',
      STRIPE_PRICE_STANDARD_MONTHLY: 'price_standard_monthly',
      STRIPE_PRICE_PRO_MONTHLY: 'price_pro_monthly',
    };

    service = new BillingPlanMapService(new BillingConfigService());
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('maps application plans to Stripe price ids', () => {
    expect(service.getStripePriceIdForPlan(BillingPlan.PILOT)).toBe(
      'price_pilot_monthly',
    );
    expect(service.getStripePriceIdForPlan(BillingPlan.STANDARD)).toBe(
      'price_standard_monthly',
    );
    expect(service.getStripePriceIdForPlan(BillingPlan.PRO)).toBe(
      'price_pro_monthly',
    );
  });

  it('resolves a plan from a Stripe price id', () => {
    expect(service.getPlanFromStripePriceId('price_pilot_monthly')).toBe(
      BillingPlan.PILOT,
    );
    expect(service.getPlanFromStripePriceId('price_standard_monthly')).toBe(
      BillingPlan.STANDARD,
    );
    expect(service.getPlanFromStripePriceId('price_pro_monthly')).toBe(
      BillingPlan.PRO,
    );
    expect(service.getPlanFromStripePriceId('price_unknown')).toBeNull();
  });
});
