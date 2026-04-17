import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { BillingConfigService } from './billing-config.service';

type StripeClient = InstanceType<typeof Stripe>;
type CreateBillingPortalSessionParams = Parameters<
  StripeClient['billingPortal']['sessions']['create']
>[0];
type CreateCheckoutSessionParams = Parameters<
  StripeClient['checkout']['sessions']['create']
>[0];
type CreateCustomerParams = Parameters<StripeClient['customers']['create']>[0];
type RetrieveSubscriptionParams = Parameters<
  StripeClient['subscriptions']['retrieve']
>[1];
type StripeRequestOptions = Parameters<StripeClient['customers']['create']>[1];

@Injectable()
export class StripeClientService {
  private client: StripeClient | null = null;

  constructor(private readonly billingConfig: BillingConfigService) {}

  createBillingPortalSession(
    params: CreateBillingPortalSessionParams,
    options?: StripeRequestOptions,
  ) {
    return this.getClient().billingPortal.sessions.create(params, options);
  }

  createCheckoutSession(
    params: CreateCheckoutSessionParams,
    options?: StripeRequestOptions,
  ) {
    return this.getClient().checkout.sessions.create(params, options);
  }

  createCustomer(params: CreateCustomerParams, options?: StripeRequestOptions) {
    return this.getClient().customers.create(params, options);
  }

  constructWebhookEvent(payload: Buffer | string, signature: string) {
    return this.getClient().webhooks.constructEvent(
      payload,
      signature,
      this.billingConfig.getStripeWebhookSecret(),
    );
  }

  retrieveSubscription(
    subscriptionId: string,
    params?: RetrieveSubscriptionParams,
  ) {
    return this.getClient().subscriptions.retrieve(subscriptionId, params);
  }

  private getClient() {
    if (!this.client) {
      this.client = new Stripe(this.billingConfig.getStripeSecretKey(), {
        apiVersion: this.billingConfig.apiVersion as any,
        appInfo: {
          name: 'Axelys API',
          version: '0.0.1',
        },
      });
    }

    return this.client;
  }
}
