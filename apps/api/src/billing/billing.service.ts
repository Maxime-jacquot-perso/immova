import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BillingPlan, BillingStatus, MembershipRole } from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { LegalDocumentsService } from '../legal/legal-documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingConfigService } from './billing-config.service';
import { BillingPlanMapService } from './billing-plan-map.service';
import { StripeClientService } from './stripe-client.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly blockedCheckoutStatuses = new Set<BillingStatus>([
    BillingStatus.ACTIVE,
    BillingStatus.TRIALING,
    BillingStatus.PAST_DUE,
    BillingStatus.UNPAID,
    BillingStatus.INCOMPLETE,
    BillingStatus.PAUSED,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClientService,
    private readonly billingConfig: BillingConfigService,
    private readonly billingPlanMap: BillingPlanMapService,
    private readonly legalDocumentsService: LegalDocumentsService,
  ) {}

  async createCheckoutSession(
    user: AuthenticatedUser,
    input: CreateCheckoutSessionDto,
  ) {
    this.assertCanManageBilling(user);

    if (input.plan === BillingPlan.NONE) {
      throw new BadRequestException('A valid paid billing plan is required');
    }

    const [organization, actor] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: user.organizationId! },
        select: {
          id: true,
          name: true,
          slug: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          billingStatus: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
        },
      }),
    ]);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    this.assertCheckoutAllowed(organization);
    const legalStatus =
      await this.legalDocumentsService.ensureCheckoutAcceptance({
        userId: actor.id,
        organizationId: organization.id,
      });

    if (!legalStatus.isSatisfied) {
      throw new BadRequestException(
        "L'acceptation en vigueur des CGV et de la politique de confidentialite est requise avant toute souscription.",
      );
    }

    const priceId = this.billingPlanMap.getStripePriceIdForPlan(input.plan);
    const customerId =
      organization.stripeCustomerId ??
      (await this.createCustomerForOrganization({
        organizationId: organization.id,
        organizationName: organization.name,
        actorUserId: actor.id,
        actorEmail: actor.email,
      }));

    const session = await this.stripeClient.createCheckoutSession({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: organization.id,
      success_url: this.billingConfig.getCheckoutSuccessUrl(),
      cancel_url: this.billingConfig.getCheckoutCancelUrl(),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        organizationId: organization.id,
        userId: actor.id,
        plan: input.plan,
        priceId,
        legalAcceptanceScope: 'CHECKOUT',
      },
      subscription_data: {
        metadata: {
          organizationId: organization.id,
          userId: actor.id,
          plan: input.plan,
          priceId,
          legalAcceptanceScope: 'CHECKOUT',
        },
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Stripe Checkout session did not return a redirect URL',
      );
    }

    this.logger.log(
      `Created Stripe Checkout session ${session.id} for organization ${organization.id} on plan ${input.plan}`,
    );

    return { url: session.url };
  }

  async createPortalSession(user: AuthenticatedUser) {
    this.assertCanManageBilling(user);

    const organization = await this.prisma.organization.findUnique({
      where: { id: user.organizationId! },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (!organization.stripeCustomerId) {
      throw new BadRequestException(
        'This organization does not have a Stripe customer yet',
      );
    }

    const session = await this.stripeClient.createBillingPortalSession({
      customer: organization.stripeCustomerId,
      return_url: this.billingConfig.getPortalReturnUrl(),
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Stripe Billing Portal did not return a redirect URL',
      );
    }

    this.logger.log(
      `Created Stripe Billing Portal session for organization ${organization.id}`,
    );

    return { url: session.url };
  }

  private assertCanManageBilling(user: AuthenticatedUser) {
    if (user.membershipRole !== MembershipRole.ADMIN) {
      throw new ForbiddenException(
        'Only organization admins can manage billing',
      );
    }
  }

  private assertCheckoutAllowed(organization: {
    stripeSubscriptionId: string | null;
    billingStatus: BillingStatus;
  }) {
    if (
      organization.stripeSubscriptionId &&
      organization.billingStatus === BillingStatus.NONE
    ) {
      throw new ConflictException(
        'This organization already has a Stripe subscription reference. Use the billing portal to manage it.',
      );
    }

    if (this.blockedCheckoutStatuses.has(organization.billingStatus)) {
      throw new ConflictException(
        'This organization already has a Stripe subscription state that must be managed from the billing portal.',
      );
    }
  }

  private async createCustomerForOrganization(input: {
    organizationId: string;
    organizationName: string;
    actorUserId: string;
    actorEmail: string;
  }) {
    const customer = await this.stripeClient.createCustomer(
      {
        name: input.organizationName,
        email: input.actorEmail,
        metadata: {
          organizationId: input.organizationId,
          createdByUserId: input.actorUserId,
        },
      },
      {
        idempotencyKey: `organization:${input.organizationId}:stripe-customer`,
      },
    );

    const updateResult = await this.prisma.organization.updateMany({
      where: {
        id: input.organizationId,
        stripeCustomerId: null,
      },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    if (updateResult.count > 0) {
      return customer.id;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!organization?.stripeCustomerId) {
      throw new InternalServerErrorException(
        'Stripe customer could not be persisted on the organization',
      );
    }

    return organization.stripeCustomerId;
  }
}
