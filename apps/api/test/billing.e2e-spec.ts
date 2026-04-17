import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  BillingPlan,
  BillingStatus,
  PrismaClient,
  StripeWebhookEventStatus,
} from '@prisma/client';
import Stripe from 'stripe';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { StripeClientService } from '../src/billing/stripe-client.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, prepareTestDatabase, seedUser } from './e2e-helpers';

describe('Billing e2e', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let stripeClient: StripeClientService;

  beforeAll(async () => {
    await prepareTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({
      rawBody: true,
    });
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    stripeClient = app.get(StripeClientService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken as string;
  }

  function signStripePayload(payload: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    return stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });
  }

  it('creates a Checkout session for an organization admin', async () => {
    const seeded = await seedUser(prisma, {
      organizationName: 'Org Billing',
      organizationSlug: 'org-billing',
      email: 'billing-admin@example.com',
      password: 'password123',
    });
    const token = await login('billing-admin@example.com', 'password123');

    const createCustomerSpy = jest
      .spyOn(stripeClient, 'createCustomer')
      .mockResolvedValue({ id: 'cus_checkout_123' } as any);
    const createCheckoutSessionSpy = jest
      .spyOn(stripeClient, 'createCheckoutSession')
      .mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/test_123',
      } as any);

    const response = await request(app.getHttpServer())
      .post('/api/billing/checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: BillingPlan.STANDARD })
      .expect(201);

    expect(response.body).toEqual({
      url: 'https://checkout.stripe.com/c/pay/test_123',
    });
    expect(createCustomerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Org Billing',
        email: 'billing-admin@example.com',
        metadata: expect.objectContaining({
          organizationId: seeded.organization.id,
        }),
      }),
      expect.objectContaining({
        idempotencyKey: `organization:${seeded.organization.id}:stripe-customer`,
      }),
    );
    expect(createCheckoutSessionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_checkout_123',
        client_reference_id: seeded.organization.id,
        metadata: expect.objectContaining({
          organizationId: seeded.organization.id,
          userId: seeded.user.id,
          plan: BillingPlan.STANDARD,
          priceId: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
        }),
      }),
    );

    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: seeded.organization.id },
    });

    expect(organization.stripeCustomerId).toBe('cus_checkout_123');
  });

  it('creates a Billing Portal session when the organization already has a customer', async () => {
    const seeded = await seedUser(prisma, {
      organizationName: 'Org Portal',
      organizationSlug: 'org-portal',
      email: 'portal-admin@example.com',
      password: 'password123',
    });
    const token = await login('portal-admin@example.com', 'password123');

    await prisma.organization.update({
      where: { id: seeded.organization.id },
      data: {
        stripeCustomerId: 'cus_portal_123',
      },
    });

    jest.spyOn(stripeClient, 'createBillingPortalSession').mockResolvedValue({
      id: 'bps_123',
      url: 'https://billing.stripe.com/session/test_123',
    } as any);

    const response = await request(app.getHttpServer())
      .post('/api/billing/portal-session')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(response.body).toEqual({
      url: 'https://billing.stripe.com/session/test_123',
    });
  });

  it('processes invoice.payment_failed idempotently and syncs the organization state', async () => {
    const seeded = await seedUser(prisma, {
      organizationName: 'Org Webhook',
      organizationSlug: 'org-webhook',
      email: 'webhook-admin@example.com',
      password: 'password123',
    });

    await prisma.organization.update({
      where: { id: seeded.organization.id },
      data: {
        stripeCustomerId: 'cus_webhook_123',
      },
    });

    const currentPeriodEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
    const retrieveSubscriptionSpy = jest
      .spyOn(stripeClient, 'retrieveSubscription')
      .mockResolvedValue({
        id: 'sub_webhook_123',
        customer: 'cus_webhook_123',
        status: 'past_due',
        cancel_at_period_end: false,
        current_period_end: currentPeriodEnd,
        metadata: {
          organizationId: seeded.organization.id,
        },
        items: {
          data: [
            {
              price: {
                id: process.env.STRIPE_PRICE_PRO_MONTHLY,
              },
            },
          ],
        },
      } as any);

    const eventPayload = JSON.stringify({
      id: 'evt_invoice_payment_failed_123',
      object: 'event',
      api_version: '2026-02-25.clover',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_123',
          object: 'invoice',
          customer: 'cus_webhook_123',
          subscription: 'sub_webhook_123',
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: 'invoice.payment_failed',
    });
    const signature = signStripePayload(eventPayload);

    const firstResponse = await request(app.getHttpServer())
      .post('/api/stripe/webhook')
      .set('Stripe-Signature', signature)
      .set('Content-Type', 'application/json')
      .send(eventPayload)
      .expect(200);
    const secondResponse = await request(app.getHttpServer())
      .post('/api/stripe/webhook')
      .set('Stripe-Signature', signature)
      .set('Content-Type', 'application/json')
      .send(eventPayload)
      .expect(200);

    expect(firstResponse.body).toEqual({
      received: true,
      duplicate: false,
    });
    expect(secondResponse.body).toEqual({
      received: true,
      duplicate: true,
    });
    expect(retrieveSubscriptionSpy).toHaveBeenCalledTimes(1);

    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: seeded.organization.id },
    });
    const webhookEvents = await prisma.stripeWebhookEvent.findMany({
      where: {
        stripeEventId: 'evt_invoice_payment_failed_123',
      },
    });

    expect(organization.stripeSubscriptionId).toBe('sub_webhook_123');
    expect(organization.stripePriceId).toBe(
      process.env.STRIPE_PRICE_PRO_MONTHLY,
    );
    expect(organization.billingPlan).toBe(BillingPlan.PRO);
    expect(organization.billingStatus).toBe(BillingStatus.PAST_DUE);
    expect(organization.billingCurrentPeriodEnd?.toISOString()).toBe(
      new Date(currentPeriodEnd * 1000).toISOString(),
    );
    expect(webhookEvents).toHaveLength(1);
    expect(webhookEvents[0]).toEqual(
      expect.objectContaining({
        status: StripeWebhookEventStatus.PROCESSED,
        organizationId: seeded.organization.id,
      }),
    );
  });

  it('rejects an invalid Stripe webhook signature', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/stripe/webhook')
      .set('Stripe-Signature', 'invalid_signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_invalid', object: 'event' }))
      .expect(400);

    expect(response.body.message).toBe('Invalid Stripe webhook signature');
  });
});
