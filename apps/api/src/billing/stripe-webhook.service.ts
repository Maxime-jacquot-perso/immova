import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BillingPlan, Prisma, StripeWebhookEventStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { BillingPlanMapService } from './billing-plan-map.service';
import { mapStripeSubscriptionStatusToBillingStatus } from './billing-status.util';
import { StripeClientService } from './stripe-client.service';

type HandledStripeEventResult = {
  handled: boolean;
  organizationId: string | null;
};

type StripeClient = InstanceType<typeof Stripe>;
type StripeEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;
type StripeMetadata = Record<string, string>;
type StripeCheckoutSession = {
  id: string;
  mode: string | null;
  customer: unknown;
  subscription: unknown;
  client_reference_id: string | null;
  metadata?: StripeMetadata | null;
};
type StripeInvoice = {
  id: string;
  customer: unknown;
  subscription?: unknown;
  parent?: {
    subscription_details?: {
      subscription?: unknown;
    } | null;
  } | null;
};
type StripeSubscription = {
  id: string;
  customer: unknown;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  metadata?: StripeMetadata | null;
  items: {
    data: Array<{
      price?: {
        id?: string | null;
      } | null;
    }>;
  };
};

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly processingLeaseMs = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClientService,
    private readonly billingPlanMap: BillingPlanMapService,
  ) {}

  async handleWebhook(rawPayload: Buffer, signature?: string) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe-Signature header');
    }

    let event: StripeEvent;

    try {
      event = this.stripeClient.constructWebhookEvent(rawPayload, signature);
    } catch (error) {
      this.logger.warn(
        `Rejected Stripe webhook because signature verification failed: ${this.getErrorMessage(
          error,
        )}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const claim = await this.claimEvent(event);

    if (!claim.shouldProcess) {
      return { received: true, duplicate: true };
    }

    try {
      const result = await this.processEvent(event);
      await this.markEventProcessed(
        claim.recordId,
        result.handled
          ? StripeWebhookEventStatus.PROCESSED
          : StripeWebhookEventStatus.IGNORED,
        result.organizationId,
      );

      return {
        received: true,
        duplicate: false,
      };
    } catch (error) {
      await this.markEventFailed(claim.recordId, error);
      throw error;
    }
  }

  private async processEvent(
    event: StripeEvent,
  ): Promise<HandledStripeEventResult> {
    const eventCreatedAt = new Date(event.created * 1000);

    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutSessionCompleted(
          event.data.object as StripeCheckoutSession,
          eventCreatedAt,
        );
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.syncOrganizationFromSubscription(
          event.data.object as StripeSubscription,
          eventCreatedAt,
        );
      case 'invoice.paid':
      case 'invoice.payment_failed':
        return this.handleInvoiceEvent(
          event.data.object as StripeInvoice,
          eventCreatedAt,
        );
      default:
        this.logger.debug(`Ignoring unsupported Stripe event ${event.type}`);
        return {
          handled: false,
          organizationId: null,
        };
    }
  }

  private async handleCheckoutSessionCompleted(
    session: StripeCheckoutSession,
    eventCreatedAt: Date,
  ): Promise<HandledStripeEventResult> {
    if (session.mode !== 'subscription') {
      return {
        handled: false,
        organizationId: null,
      };
    }

    const stripeCustomerId = this.extractStripeId(session.customer);
    const stripeSubscriptionId = this.extractStripeId(session.subscription);
    const organization = await this.findOrganizationForEvent({
      organizationId:
        this.getMetadataValue(session.metadata, 'organizationId') ??
        session.client_reference_id,
      stripeCustomerId,
      stripeSubscriptionId,
    });

    if (!organization) {
      this.logger.warn(
        `Unable to resolve organization for checkout.session.completed ${session.id}`,
      );
      return {
        handled: false,
        organizationId: null,
      };
    }

    if (!stripeSubscriptionId) {
      await this.applyOrganizationStripeState({
        organizationId: organization.id,
        stripeCustomerId,
        stripeSubscriptionId: null,
        stripePriceId: this.getMetadataValue(session.metadata, 'priceId'),
        billingPlan:
          this.parsePlan(this.getMetadataValue(session.metadata, 'plan')) ??
          BillingPlan.NONE,
        billingStatus: organization.billingStatus,
        billingCurrentPeriodEnd: organization.billingCurrentPeriodEnd,
        billingCancelAtPeriodEnd: organization.billingCancelAtPeriodEnd,
        eventCreatedAt,
      });

      return {
        handled: true,
        organizationId: organization.id,
      };
    }

    return this.syncOrganizationFromSubscriptionById(
      stripeSubscriptionId,
      eventCreatedAt,
      {
        organizationIdHint: organization.id,
        stripeCustomerIdHint: stripeCustomerId,
      },
    );
  }

  private async handleInvoiceEvent(
    invoice: StripeInvoice,
    eventCreatedAt: Date,
  ): Promise<HandledStripeEventResult> {
    const subscriptionId =
      this.extractStripeId(invoice.subscription) ??
      this.extractStripeId(
        invoice.parent?.subscription_details?.subscription ?? null,
      );

    if (!subscriptionId) {
      this.logger.warn(
        `Ignoring invoice event ${invoice.id} because it is not tied to a subscription`,
      );
      return {
        handled: false,
        organizationId: null,
      };
    }

    return this.syncOrganizationFromSubscriptionById(
      subscriptionId,
      eventCreatedAt,
      {
        stripeCustomerIdHint: this.extractStripeId(invoice.customer),
      },
    );
  }

  private async syncOrganizationFromSubscriptionById(
    subscriptionId: string,
    eventCreatedAt: Date,
    hints?: {
      organizationIdHint?: string | null;
      stripeCustomerIdHint?: string | null;
    },
  ) {
    const subscription =
      await this.stripeClient.retrieveSubscription(subscriptionId);

    return this.syncOrganizationFromSubscription(subscription, eventCreatedAt, {
      organizationIdHint: hints?.organizationIdHint ?? null,
      stripeCustomerIdHint: hints?.stripeCustomerIdHint ?? null,
    });
  }

  private async syncOrganizationFromSubscription(
    subscription: StripeSubscription,
    eventCreatedAt: Date,
    hints?: {
      organizationIdHint?: string | null;
      stripeCustomerIdHint?: string | null;
    },
  ): Promise<HandledStripeEventResult> {
    const stripeCustomerId =
      this.extractStripeId(subscription.customer) ??
      hints?.stripeCustomerIdHint ??
      null;
    const organization = await this.findOrganizationForEvent({
      organizationId:
        this.getMetadataValue(subscription.metadata, 'organizationId') ??
        hints?.organizationIdHint ??
        null,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    });

    if (!organization) {
      this.logger.warn(
        `Unable to resolve organization for subscription ${subscription.id}`,
      );
      return {
        handled: false,
        organizationId: null,
      };
    }

    const stripePriceId = this.extractPrimaryPriceId(subscription);
    const billingPlan =
      this.billingPlanMap.getPlanFromStripePriceId(stripePriceId) ??
      BillingPlan.NONE;

    if (stripePriceId && billingPlan === BillingPlan.NONE) {
      this.logger.warn(
        `Subscription ${subscription.id} uses unmapped Stripe price ${stripePriceId}`,
      );
    }

    await this.applyOrganizationStripeState({
      organizationId: organization.id,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      billingPlan,
      billingStatus: mapStripeSubscriptionStatusToBillingStatus(
        subscription.status,
      ),
      billingCurrentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      billingCancelAtPeriodEnd: subscription.cancel_at_period_end,
      eventCreatedAt,
    });

    return {
      handled: true,
      organizationId: organization.id,
    };
  }

  private async findOrganizationForEvent(input: {
    organizationId: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }) {
    const whereOr: Prisma.OrganizationWhereInput[] = [];

    if (input.organizationId) {
      whereOr.push({ id: input.organizationId });
    }

    if (input.stripeCustomerId) {
      whereOr.push({ stripeCustomerId: input.stripeCustomerId });
    }

    if (input.stripeSubscriptionId) {
      whereOr.push({ stripeSubscriptionId: input.stripeSubscriptionId });
    }

    if (whereOr.length === 0) {
      return null;
    }

    return this.prisma.organization.findFirst({
      where: {
        OR: whereOr,
      },
      select: {
        id: true,
        billingStatus: true,
        billingCurrentPeriodEnd: true,
        billingCancelAtPeriodEnd: true,
      },
    });
  }

  private async applyOrganizationStripeState(input: {
    organizationId: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    billingPlan: BillingPlan;
    billingStatus: Prisma.OrganizationGetPayload<{
      select: {
        billingStatus: true;
      };
    }>['billingStatus'];
    billingCurrentPeriodEnd: Date | null;
    billingCancelAtPeriodEnd: boolean;
    eventCreatedAt: Date;
  }) {
    await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({
        where: { id: input.organizationId },
        select: {
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          billingLastEventAt: true,
        },
      });

      if (!organization) {
        return;
      }

      const shouldApplyEventState =
        !organization.billingLastEventAt ||
        input.eventCreatedAt.getTime() >=
          organization.billingLastEventAt.getTime();

      const data: Prisma.OrganizationUpdateInput = {};

      if (shouldApplyEventState) {
        data.stripeCustomerId =
          input.stripeCustomerId ?? organization.stripeCustomerId ?? null;
        data.stripeSubscriptionId =
          input.stripeSubscriptionId ??
          organization.stripeSubscriptionId ??
          null;
        data.stripePriceId = input.stripePriceId;
        data.billingPlan = input.billingPlan;
        data.billingStatus = input.billingStatus;
        data.billingCurrentPeriodEnd = input.billingCurrentPeriodEnd;
        data.billingCancelAtPeriodEnd = input.billingCancelAtPeriodEnd;
        data.billingLastEventAt = input.eventCreatedAt;
      } else {
        if (!organization.stripeCustomerId && input.stripeCustomerId) {
          data.stripeCustomerId = input.stripeCustomerId;
        }

        if (!organization.stripeSubscriptionId && input.stripeSubscriptionId) {
          data.stripeSubscriptionId = input.stripeSubscriptionId;
        }
      }

      if (Object.keys(data).length === 0) {
        return;
      }

      await tx.organization.update({
        where: { id: input.organizationId },
        data,
      });
    });
  }

  private async claimEvent(event: StripeEvent) {
    const payload = JSON.parse(JSON.stringify(event)) as Prisma.JsonObject;
    const eventCreatedAt = new Date(event.created * 1000);

    try {
      const record = await this.prisma.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          livemode: event.livemode,
          status: StripeWebhookEventStatus.PROCESSING,
          eventCreatedAt,
          payload,
        },
        select: {
          id: true,
        },
      });

      return {
        shouldProcess: true,
        recordId: record.id,
      };
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await this.prisma.stripeWebhookEvent.findUnique({
        where: {
          stripeEventId: event.id,
        },
        select: {
          id: true,
          status: true,
          receivedAt: true,
        },
      });

      if (!existing) {
        throw error;
      }

      const isFreshProcessingLease =
        existing.status === StripeWebhookEventStatus.PROCESSING &&
        Date.now() - existing.receivedAt.getTime() < this.processingLeaseMs;

      if (
        existing.status === StripeWebhookEventStatus.PROCESSED ||
        existing.status === StripeWebhookEventStatus.IGNORED ||
        isFreshProcessingLease
      ) {
        return {
          shouldProcess: false,
          recordId: existing.id,
        };
      }

      await this.prisma.stripeWebhookEvent.update({
        where: {
          id: existing.id,
        },
        data: {
          type: event.type,
          livemode: event.livemode,
          status: StripeWebhookEventStatus.PROCESSING,
          eventCreatedAt,
          receivedAt: new Date(),
          processedAt: null,
          payload,
          errorMessage: null,
          organizationId: null,
        },
      });

      return {
        shouldProcess: true,
        recordId: existing.id,
      };
    }
  }

  private async markEventProcessed(
    recordId: string,
    status: 'PROCESSED' | 'IGNORED',
    organizationId: string | null,
  ) {
    await this.prisma.stripeWebhookEvent.update({
      where: { id: recordId },
      data: {
        status,
        organizationId,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  private async markEventFailed(recordId: string, error: unknown) {
    await this.prisma.stripeWebhookEvent.update({
      where: { id: recordId },
      data: {
        status: StripeWebhookEventStatus.FAILED,
        errorMessage: this.getErrorMessage(error),
      },
    });
  }

  private extractPrimaryPriceId(subscription: StripeSubscription) {
    if (subscription.items.data.length > 1) {
      this.logger.warn(
        `Subscription ${subscription.id} contains ${subscription.items.data.length} items. Axelys uses the first Stripe price as the application plan source.`,
      );
    }

    return subscription.items.data[0]?.price?.id ?? null;
  }

  private extractStripeId(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }

    if (
      value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof value.id === 'string'
    ) {
      return value.id;
    }

    return null;
  }

  private getMetadataValue(
    metadata: StripeMetadata | null | undefined,
    key: string,
  ) {
    const value = metadata?.[key];

    if (typeof value !== 'string') {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private parsePlan(value: string | null) {
    if (!value) {
      return null;
    }

    return value in BillingPlan ? (value as BillingPlan) : null;
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown Stripe webhook processing error';
  }
}
