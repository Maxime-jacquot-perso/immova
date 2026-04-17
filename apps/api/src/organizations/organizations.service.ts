import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { BillingAccessService } from '../billing/billing-access.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingAccessService: BillingAccessService,
  ) {}

  async getCurrent(input: { organizationId: string; userId: string }) {
    const [organization, user] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          billingPlan: true,
          billingStatus: true,
          billingCurrentPeriodEnd: true,
          billingCancelAtPeriodEnd: true,
          billingLastEventAt: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          subscriptionStatus: true,
          trialEndsAt: true,
        },
      }),
    ]);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const access = this.billingAccessService.getAccessContext({
      organizationBillingPlan: organization.billingPlan,
      organizationBillingStatus: organization.billingStatus,
      userSubscriptionStatus:
        user?.subscriptionStatus ?? SubscriptionStatus.NONE,
      userTrialEndsAt: user?.trialEndsAt ?? null,
    });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      billing: {
        plan: organization.billingPlan,
        status: organization.billingStatus,
        currentPeriodEnd: organization.billingCurrentPeriodEnd,
        cancelAtPeriodEnd: organization.billingCancelAtPeriodEnd,
        lastEventAt: organization.billingLastEventAt,
        hasCustomer: Boolean(organization.stripeCustomerId),
        hasSubscription: Boolean(organization.stripeSubscriptionId),
        access,
      },
    };
  }
}
