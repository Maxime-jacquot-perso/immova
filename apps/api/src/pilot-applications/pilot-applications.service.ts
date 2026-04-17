import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingPlan,
  BillingStatus,
  InvitationOrganizationMode,
  MembershipRole,
  PilotApplicationEventType,
  PilotApplicationProvisioningStatus,
  PilotApplicationStatus,
  Prisma,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { BillingConfigService } from '../billing/billing-config.service';
import { BillingPlanMapService } from '../billing/billing-plan-map.service';
import { StripeClientService } from '../billing/stripe-client.service';
import { InvitationsService } from '../invitations/invitations.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePilotApplicationDto } from './dto/create-pilot-application.dto';
import { CreatePilotCheckoutSessionDto } from './dto/pilot-checkout-token.dto';
import {
  ApprovePilotApplicationDto,
  RejectPilotApplicationDto,
  SendPilotCheckoutLinkDto,
} from './dto/pilot-application-review.dto';
import { ListAdminPilotApplicationsQueryDto } from './dto/list-admin-pilot-applications-query.dto';
import {
  buildPilotApplicantDisplayName,
  buildPilotOrganizationName,
  buildPilotOrganizationSlug,
  normalizePilotApplicationEmail,
} from './pilot-application.utils';

type AdminPilotApplicationListRecord = Prisma.PilotApplicationGetPayload<{
  include: {
    organization: {
      select: {
        id: true;
        name: true;
        slug: true;
        billingPlan: true;
        billingStatus: true;
        _count: {
          select: {
            projects: true;
          };
        };
      };
    };
    reviewedBy: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    invitation: {
      select: {
        id: true;
        createdAt: true;
        acceptedAt: true;
        revokedAt: true;
        expiresAt: true;
      };
    };
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
        isPilotUser: true;
        betaAccessEnabled: true;
      };
    };
  };
}>;

type AdminPilotApplicationDetailRecord = Prisma.PilotApplicationGetPayload<{
  include: {
    organization: {
      select: {
        id: true;
        name: true;
        slug: true;
        stripeCustomerId: true;
        stripeSubscriptionId: true;
        billingPlan: true;
        billingStatus: true;
        billingCurrentPeriodEnd: true;
        billingCancelAtPeriodEnd: true;
        billingLastEventAt: true;
        _count: {
          select: {
            projects: true;
            memberships: true;
          };
        };
      };
    };
    reviewedBy: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    invitation: {
      select: {
        id: true;
        createdAt: true;
        acceptedAt: true;
        revokedAt: true;
        expiresAt: true;
        membershipRole: true;
        organizationMode: true;
      };
    };
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
        isPilotUser: true;
        betaAccessEnabled: true;
        passwordHash: true;
        memberships: {
          select: {
            id: true;
            role: true;
            organizationId: true;
          };
        };
      };
    };
    events: {
      orderBy: {
        createdAt: 'desc';
      };
      include: {
        actorUser: {
          select: {
            id: true;
            email: true;
            firstName: true;
            lastName: true;
          };
        };
      };
    };
  };
}>;

type CheckoutApplicationRecord = Prisma.PilotApplicationGetPayload<{
  include: {
    organization: {
      select: {
        id: true;
        name: true;
        slug: true;
        stripeCustomerId: true;
      };
    };
  };
}>;

@Injectable()
export class PilotApplicationsService {
  private readonly logger = new Logger(PilotApplicationsService.name);
  private readonly notificationEmail =
    process.env.PILOT_NOTIFICATION_EMAIL?.trim() || 'contact@axelys.app';
  private readonly checkoutTokenTtlHours = Math.max(
    1,
    Number(process.env.PILOT_CHECKOUT_TOKEN_TTL_HOURS || 168),
  );
  private readonly activeBillingStatuses = new Set<BillingStatus>([
    BillingStatus.ACTIVE,
    BillingStatus.TRIALING,
  ]);
  private readonly cancellationBillingStatuses = new Set<BillingStatus>([
    BillingStatus.CANCELED,
    BillingStatus.INCOMPLETE_EXPIRED,
    BillingStatus.PAST_DUE,
    BillingStatus.PAUSED,
    BillingStatus.UNPAID,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly stripeClient: StripeClientService,
    private readonly billingConfig: BillingConfigService,
    private readonly billingPlanMap: BillingPlanMapService,
    private readonly invitationsService: InvitationsService,
  ) {}

  async create(dto: CreatePilotApplicationDto) {
    const normalizedEmail = normalizePilotApplicationEmail(dto.email);
    const existingOpenApplication =
      await this.prisma.pilotApplication.findFirst({
        where: {
          normalizedEmail,
          status: {
            in: [
              PilotApplicationStatus.PENDING,
              PilotApplicationStatus.APPROVED,
              PilotApplicationStatus.PAYMENT_PENDING,
              PilotApplicationStatus.ACTIVE,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

    if (existingOpenApplication) {
      this.logger.log(
        `Ignoring duplicate pilot application for ${normalizedEmail} because ${existingOpenApplication.id} is still ${existingOpenApplication.status}`,
      );

      return {
        id: existingOpenApplication.id,
        status: existingOpenApplication.status,
        createdAt: existingOpenApplication.createdAt,
        duplicate: true,
      };
    }

    const acknowledgedAt = new Date();
    const application = await this.prisma.$transaction(async (tx) => {
      const createdApplication = await tx.pilotApplication.create({
        data: {
          firstName: dto.firstname,
          lastName: dto.lastname ?? null,
          email: normalizedEmail,
          normalizedEmail,
          profileType: dto.profileType,
          projectCount: dto.projectCount,
          problemDescription: dto.problemDescription,
          acknowledgementAcceptedAt: acknowledgedAt,
        },
      });

      await tx.pilotApplicationEvent.create({
        data: {
          pilotApplicationId: createdApplication.id,
          type: PilotApplicationEventType.SUBMITTED,
          message: 'Candidature reçue depuis la landing publique.',
          metadata: {
            profileType: dto.profileType,
            projectCount: dto.projectCount,
          },
        },
      });

      return createdApplication;
    });

    await this.mailService.sendPilotApplicationNotification({
      to: this.notificationEmail,
      application: {
        id: application.id,
        firstname: application.firstName,
        lastname: application.lastName,
        email: application.email,
        projectCount: application.projectCount,
        profileType: application.profileType,
        problemDescription: application.problemDescription,
        acknowledgement: dto.acknowledgement,
      },
    });

    return {
      id: application.id,
      status: application.status,
      createdAt: application.createdAt,
      duplicate: false,
    };
  }

  async listForAdmin(query: ListAdminPilotApplicationsQueryDto) {
    const where = this.buildAdminWhere(query);
    const [total, items] = await Promise.all([
      this.prisma.pilotApplication.count({ where }),
      this.prisma.pilotApplication.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              billingPlan: true,
              billingStatus: true,
              _count: {
                select: {
                  projects: true,
                },
              },
            },
          },
          reviewedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          invitation: {
            select: {
              id: true,
              createdAt: true,
              acceptedAt: true,
              revokedAt: true,
              expiresAt: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isPilotUser: true,
              betaAccessEnabled: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      items: items.map((item) => this.mapAdminListItem(item)),
    };
  }

  async getAdminDetail(applicationId: string) {
    const application = await this.prisma.pilotApplication.findUnique({
      where: { id: applicationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            billingPlan: true,
            billingStatus: true,
            billingCurrentPeriodEnd: true,
            billingCancelAtPeriodEnd: true,
            billingLastEventAt: true,
            _count: {
              select: {
                projects: true,
                memberships: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        invitation: {
          select: {
            id: true,
            createdAt: true,
            acceptedAt: true,
            revokedAt: true,
            expiresAt: true,
            membershipRole: true,
            organizationMode: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isPilotUser: true,
            betaAccessEnabled: true,
            passwordHash: true,
            memberships: {
              select: {
                id: true,
                role: true,
                organizationId: true,
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          include: {
            actorUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature pilote introuvable');
    }

    return this.mapAdminDetail(application);
  }

  async approve(input: {
    applicationId: string;
    actorUserId: string;
    body: ApprovePilotApplicationDto;
  }) {
    const sendCheckoutLink = input.body.sendCheckoutLink ?? true;
    const approvedAt = new Date();
    const checkoutToken = this.generateToken();
    const checkoutTokenHash = this.hashToken(checkoutToken);
    const checkoutTokenExpiresAt = new Date(
      approvedAt.getTime() + this.checkoutTokenTtlHours * 60 * 60 * 1000,
    );

    const application = await this.prisma.$transaction(async (tx) => {
      const currentApplication = await tx.pilotApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              stripeCustomerId: true,
            },
          },
        },
      });

      if (!currentApplication) {
        throw new NotFoundException('Candidature pilote introuvable');
      }

      if (currentApplication.status === PilotApplicationStatus.ACTIVE) {
        throw new ConflictException(
          'Cette candidature est deja active. Utilisez le portail Stripe ou la gestion utilisateur pour la suite.',
        );
      }

      if (
        currentApplication.status === PilotApplicationStatus.APPROVED ||
        currentApplication.status === PilotApplicationStatus.PAYMENT_PENDING
      ) {
        throw new ConflictException(
          'Cette candidature a deja ete approuvee. Utilisez l action de renvoi du lien si necessaire.',
        );
      }

      const organizationName = buildPilotOrganizationName({
        firstName: currentApplication.firstName,
        lastName: currentApplication.lastName,
        email: currentApplication.email,
        organizationName:
          input.body.organizationName ?? currentApplication.organizationName,
      });

      const organization = currentApplication.organization
        ? await tx.organization.update({
            where: { id: currentApplication.organization.id },
            data: {
              name: organizationName,
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          })
        : await tx.organization.create({
            data: {
              name: organizationName,
              slug: buildPilotOrganizationSlug(
                organizationName,
                currentApplication.id,
              ),
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          });

      const updatedApplication = await tx.pilotApplication.update({
        where: { id: currentApplication.id },
        data: {
          status: PilotApplicationStatus.APPROVED,
          provisioningStatus: PilotApplicationProvisioningStatus.PENDING,
          organizationId: organization.id,
          organizationName,
          internalNote: input.body.note?.trim() || null,
          reviewedAt: approvedAt,
          reviewedByUserId: input.actorUserId,
          approvedAt,
          rejectedAt: null,
          checkoutTokenHash,
          checkoutTokenExpiresAt,
          checkoutLinkSentAt: sendCheckoutLink ? approvedAt : null,
          provisioningErrorMessage: null,
        },
      });

      await tx.pilotApplicationEvent.create({
        data: {
          pilotApplicationId: updatedApplication.id,
          actorUserId: input.actorUserId,
          type: PilotApplicationEventType.APPROVED,
          message: 'Candidature approuvee cote admin.',
          metadata: {
            reason: input.body.reason,
            organizationName,
          },
        },
      });

      if (sendCheckoutLink) {
        await tx.pilotApplicationEvent.create({
          data: {
            pilotApplicationId: updatedApplication.id,
            actorUserId: input.actorUserId,
            type: PilotApplicationEventType.CHECKOUT_LINK_SENT,
            message: 'Lien de souscription pilote envoye au candidat.',
          },
        });
      }

      return tx.pilotApplication.findUniqueOrThrow({
        where: { id: updatedApplication.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              stripeCustomerId: true,
            },
          },
        },
      });
    });

    let delivery: {
      mode: 'console' | 'smtp' | 'resend' | 'skipped';
      error?: string;
    } = { mode: 'skipped' };

    if (sendCheckoutLink && application.organization) {
      try {
        const result = await this.mailService.sendPilotApplicationApproved({
          to: application.email,
          firstName: application.firstName,
          organizationName: application.organization.name,
          checkoutUrl:
            this.billingConfig.getPilotCheckoutStartUrl(checkoutToken),
          expiresAt: checkoutTokenExpiresAt,
          planLabel: 'Pilote',
          priceLabel: '15 € / mois',
        });
        delivery = { mode: result.mode };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "L'email d'approbation n'a pas pu etre envoye.";
        delivery = { mode: 'skipped', error: message };
      }
    }

    return {
      application: await this.getAdminDetail(application.id),
      delivery,
    };
  }

  async reject(input: {
    applicationId: string;
    actorUserId: string;
    body: RejectPilotApplicationDto;
  }) {
    const sendRejectionEmail = input.body.sendRejectionEmail ?? true;
    const rejectedAt = new Date();

    const application = await this.prisma.$transaction(async (tx) => {
      const currentApplication = await tx.pilotApplication.findUnique({
        where: { id: input.applicationId },
      });

      if (!currentApplication) {
        throw new NotFoundException('Candidature pilote introuvable');
      }

      if (currentApplication.status === PilotApplicationStatus.ACTIVE) {
        throw new ConflictException(
          'Une candidature deja active ne peut pas etre rejetee depuis cet ecran.',
        );
      }

      const updatedApplication = await tx.pilotApplication.update({
        where: { id: currentApplication.id },
        data: {
          status: PilotApplicationStatus.REJECTED,
          internalNote: input.body.note?.trim() || null,
          reviewedAt: rejectedAt,
          reviewedByUserId: input.actorUserId,
          rejectedAt,
          checkoutTokenHash: null,
          checkoutTokenExpiresAt: null,
          checkoutLinkSentAt: null,
        },
      });

      await tx.pilotApplicationEvent.create({
        data: {
          pilotApplicationId: updatedApplication.id,
          actorUserId: input.actorUserId,
          type: PilotApplicationEventType.REJECTED,
          message: 'Candidature rejetee cote admin.',
          metadata: {
            reason: input.body.reason,
          },
        },
      });

      return updatedApplication;
    });

    let delivery: {
      mode: 'console' | 'smtp' | 'resend' | 'skipped';
      error?: string;
    } = { mode: 'skipped' };

    if (sendRejectionEmail) {
      try {
        const result = await this.mailService.sendPilotApplicationRejected({
          to: application.email,
          firstName: application.firstName,
        });
        delivery = { mode: result.mode };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "L'email de refus n'a pas pu etre envoye.";
        delivery = { mode: 'skipped', error: message };
      }
    }

    return {
      application: await this.getAdminDetail(application.id),
      delivery,
    };
  }

  async resendCheckoutLink(input: {
    applicationId: string;
    actorUserId: string;
    body: SendPilotCheckoutLinkDto;
  }) {
    const now = new Date();
    const checkoutToken = this.generateToken();
    const checkoutTokenHash = this.hashToken(checkoutToken);
    const checkoutTokenExpiresAt = new Date(
      now.getTime() + this.checkoutTokenTtlHours * 60 * 60 * 1000,
    );

    const application = await this.prisma.$transaction(async (tx) => {
      const currentApplication = await tx.pilotApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!currentApplication || !currentApplication.organization) {
        throw new NotFoundException('Candidature pilote introuvable');
      }

      if (
        currentApplication.status !== PilotApplicationStatus.APPROVED &&
        currentApplication.status !== PilotApplicationStatus.PAYMENT_PENDING &&
        currentApplication.status !== PilotApplicationStatus.EXPIRED
      ) {
        throw new ConflictException(
          'Le lien de souscription ne peut etre renvoye que pour une candidature approuvee ou en attente de paiement.',
        );
      }

      const nextStatus =
        currentApplication.status === PilotApplicationStatus.EXPIRED
          ? PilotApplicationStatus.APPROVED
          : currentApplication.status;

      const updatedApplication = await tx.pilotApplication.update({
        where: { id: currentApplication.id },
        data: {
          status: nextStatus,
          checkoutTokenHash,
          checkoutTokenExpiresAt,
          checkoutLinkSentAt: now,
          internalNote:
            input.body.note?.trim() || currentApplication.internalNote,
        },
      });

      await tx.pilotApplicationEvent.create({
        data: {
          pilotApplicationId: updatedApplication.id,
          actorUserId: input.actorUserId,
          type: PilotApplicationEventType.CHECKOUT_LINK_SENT,
          message: 'Lien de souscription pilote renvoye.',
          metadata: {
            reason: input.body.reason,
          },
        },
      });

      return currentApplication;
    });

    let delivery: {
      mode: 'console' | 'smtp' | 'resend';
      error?: string;
    };

    try {
      const result = await this.mailService.sendPilotApplicationApproved({
        to: application.email,
        firstName: application.firstName,
        organizationName: application.organization!.name,
        checkoutUrl: this.billingConfig.getPilotCheckoutStartUrl(checkoutToken),
        expiresAt: checkoutTokenExpiresAt,
        planLabel: 'Pilote',
        priceLabel: '15 € / mois',
      });
      delivery = { mode: result.mode };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "L'email de souscription n'a pas pu etre renvoye.";
      delivery = { mode: 'console', error: message };
    }

    return {
      application: await this.getAdminDetail(application.id),
      delivery,
    };
  }

  async getCheckoutContext(token: string) {
    const application = await this.getApplicationByCheckoutToken(token);

    return {
      id: application.id,
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      organizationName:
        application.organization?.name || application.organizationName,
      status: application.status,
      approvedAt: application.approvedAt,
      paymentStartedAt: application.paymentStartedAt,
      paymentConfirmedAt: application.paymentConfirmedAt,
      activatedAt: application.activatedAt,
      checkoutTokenExpiresAt: application.checkoutTokenExpiresAt,
      canStartCheckout:
        application.status === PilotApplicationStatus.APPROVED ||
        application.status === PilotApplicationStatus.PAYMENT_PENDING,
      message: this.buildCheckoutContextMessage(application),
    };
  }

  async createCheckoutSession(input: CreatePilotCheckoutSessionDto) {
    const application = await this.getApplicationByCheckoutToken(input.token, {
      requireOrganization: true,
    });

    if (
      application.status !== PilotApplicationStatus.APPROVED &&
      application.status !== PilotApplicationStatus.PAYMENT_PENDING
    ) {
      throw new ConflictException(
        'Cette candidature ne peut pas lancer de souscription dans son etat actuel.',
      );
    }

    const priceId = this.billingPlanMap.getStripePriceIdForPlan(
      BillingPlan.PILOT,
    );
    const customerId = await this.ensureStripeCustomerForOrganization({
      applicationId: application.id,
      organizationId: application.organization!.id,
      organizationName: application.organization!.name,
      email: application.email,
      currentStripeCustomerId: application.organization!.stripeCustomerId,
    });

    const session = await this.stripeClient.createCheckoutSession({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: application.organization!.id,
      success_url: this.billingConfig.getPilotCheckoutSuccessUrl(
        application.id,
      ),
      cancel_url: this.billingConfig.getPilotCheckoutCancelUrl(application.id),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        organizationId: application.organization!.id,
        pilotApplicationId: application.id,
        plan: BillingPlan.PILOT,
        priceId,
        email: application.email,
      },
      subscription_data: {
        metadata: {
          organizationId: application.organization!.id,
          pilotApplicationId: application.id,
          plan: BillingPlan.PILOT,
          priceId,
          email: application.email,
        },
      },
    });

    if (!session.url) {
      throw new BadRequestException(
        'Stripe Checkout n a pas retourne d URL de redirection.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pilotApplication.update({
        where: { id: application.id },
        data: {
          status: PilotApplicationStatus.PAYMENT_PENDING,
          paymentStartedAt: application.paymentStartedAt ?? new Date(),
          stripeCustomerId: customerId,
          stripeCheckoutSessionId: session.id,
          stripePriceId: priceId,
        },
      });

      await tx.pilotApplicationEvent.create({
        data: {
          pilotApplicationId: application.id,
          type: PilotApplicationEventType.CHECKOUT_STARTED,
          message: 'Le candidat a demarre Stripe Checkout.',
          metadata: {
            stripeCheckoutSessionId: session.id,
            stripeCustomerId: customerId,
          },
        },
      });
    });

    return {
      url: session.url,
    };
  }

  async markCheckoutCompleted(input: {
    pilotApplicationId?: string | null;
    stripeCheckoutSessionId: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }) {
    if (!input.pilotApplicationId) {
      return null;
    }

    const application = await this.prisma.pilotApplication.findUnique({
      where: { id: input.pilotApplicationId },
      select: { id: true },
    });

    if (!application) {
      return null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pilotApplication.update({
        where: { id: application.id },
        data: {
          stripeCheckoutSessionId: input.stripeCheckoutSessionId,
          stripeCustomerId: input.stripeCustomerId,
          stripeSubscriptionId: input.stripeSubscriptionId,
        },
      });

      await tx.pilotApplicationEvent.create({
        data: {
          pilotApplicationId: application.id,
          type: PilotApplicationEventType.CHECKOUT_COMPLETED,
          message: 'Stripe a confirme la completion du Checkout.',
          metadata: {
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
            stripeSubscriptionId: input.stripeSubscriptionId,
          },
        },
      });
    });

    return application.id;
  }

  async syncFromOrganizationBilling(input: {
    organizationId: string;
    billingStatus: BillingStatus;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
  }) {
    const application = await this.prisma.pilotApplication.findFirst({
      where: {
        OR: [
          { organizationId: input.organizationId },
          input.stripeSubscriptionId
            ? { stripeSubscriptionId: input.stripeSubscriptionId }
            : undefined,
        ].filter(Boolean) as Prisma.PilotApplicationWhereInput[],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeCustomerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            passwordHash: true,
            isSuspended: true,
            isPilotUser: true,
            betaAccessEnabled: true,
            memberships: {
              select: {
                organizationId: true,
              },
            },
          },
        },
        invitation: {
          select: {
            id: true,
            createdAt: true,
            acceptedAt: true,
            revokedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!application) {
      return null;
    }

    await this.prisma.pilotApplication.update({
      where: { id: application.id },
      data: {
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripePriceId: input.stripePriceId,
      },
    });

    if (this.activeBillingStatuses.has(input.billingStatus)) {
      return this.provisionApplicationAccess(application.id);
    }

    if (
      application.status === PilotApplicationStatus.ACTIVE &&
      this.cancellationBillingStatuses.has(input.billingStatus)
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.pilotApplication.update({
          where: { id: application.id },
          data: {
            status: PilotApplicationStatus.CANCELLED,
          },
        });

        await tx.pilotApplicationEvent.create({
          data: {
            pilotApplicationId: application.id,
            type: PilotApplicationEventType.CANCELLED,
            message: `Le statut Stripe de l organisation est maintenant ${input.billingStatus}.`,
            metadata: {
              billingStatus: input.billingStatus,
            },
          },
        });
      });
    }

    return application.id;
  }

  private async provisionApplicationAccess(applicationId: string) {
    const application = await this.prisma.pilotApplication.findUnique({
      where: { id: applicationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeCustomerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            passwordHash: true,
            isSuspended: true,
            isPilotUser: true,
            betaAccessEnabled: true,
            memberships: {
              select: {
                organizationId: true,
              },
            },
          },
        },
        invitation: {
          select: {
            id: true,
            createdAt: true,
            acceptedAt: true,
            revokedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!application || !application.organization) {
      return null;
    }

    if (
      application.status === PilotApplicationStatus.ACTIVE &&
      application.provisioningStatus ===
        PilotApplicationProvisioningStatus.COMPLETED
    ) {
      return application.id;
    }

    await this.prisma.pilotApplication.update({
      where: { id: application.id },
      data: {
        status: PilotApplicationStatus.PAYMENT_PENDING,
        provisioningStatus: PilotApplicationProvisioningStatus.IN_PROGRESS,
        paymentConfirmedAt: application.paymentConfirmedAt ?? new Date(),
        provisioningErrorMessage: null,
      },
    });

    try {
      const user = await this.ensureApplicationUser(application);
      const invitation = await this.ensureApplicationInvitation(
        application,
        user,
      );
      const activatedAt = new Date();
      const deliveryError =
        invitation.deliveryMode === 'failed'
          ? invitation.deliveryError || 'Invitation email failed'
          : null;

      await this.prisma.$transaction(async (tx) => {
        await tx.pilotApplication.update({
          where: { id: application.id },
          data: {
            status: PilotApplicationStatus.ACTIVE,
            provisioningStatus: PilotApplicationProvisioningStatus.COMPLETED,
            userId: user.id,
            invitationId: invitation.invitation.id,
            paymentConfirmedAt: application.paymentConfirmedAt ?? activatedAt,
            activatedAt,
            provisioningErrorMessage: deliveryError,
          },
        });

        await tx.pilotApplicationEvent.create({
          data: {
            pilotApplicationId: application.id,
            actorUserId: application.reviewedByUserId,
            type: PilotApplicationEventType.PAYMENT_CONFIRMED,
            message: 'Stripe a confirme le paiement et l abonnement pilote.',
          },
        });

        await tx.pilotApplicationEvent.create({
          data: {
            pilotApplicationId: application.id,
            actorUserId: application.reviewedByUserId,
            type: PilotApplicationEventType.PROVISIONING_COMPLETED,
            message:
              invitation.deliveryMode === 'failed'
                ? 'Provisioning termine, mais l email final n a pas pu etre envoye automatiquement.'
                : 'Provisioning termine et invitation finale envoyee.',
            metadata: {
              invitationId: invitation.invitation.id,
              deliveryMode: invitation.deliveryMode,
              deliveryError,
            },
          },
        });
      });

      return application.id;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Provisioning pilote impossible';

      await this.prisma.$transaction(async (tx) => {
        await tx.pilotApplication.update({
          where: { id: application.id },
          data: {
            status: PilotApplicationStatus.PAYMENT_PENDING,
            provisioningStatus: PilotApplicationProvisioningStatus.FAILED,
            paymentConfirmedAt: application.paymentConfirmedAt ?? new Date(),
            provisioningErrorMessage: message,
          },
        });

        await tx.pilotApplicationEvent.create({
          data: {
            pilotApplicationId: application.id,
            actorUserId: application.reviewedByUserId,
            type: PilotApplicationEventType.PROVISIONING_FAILED,
            message: 'Le provisioning automatique a echoue.',
            metadata: {
              error: message,
            },
          },
        });
      });

      this.logger.error(
        `Pilot provisioning failed for ${application.id}: ${message}`,
      );
      return application.id;
    }
  }

  private async ensureApplicationUser(
    application:
      | Awaited<ReturnType<PilotApplicationsService['getAdminDetail']>>
      | any,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: application.normalizedEmail,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        isSuspended: true,
        isPilotUser: true,
        betaAccessEnabled: true,
      },
    });

    if (existingUser?.isSuspended) {
      throw new ConflictException(
        'Un compte suspendu existe deja pour cet email. Le provisioning automatique est bloque.',
      );
    }

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: existingUser.firstName ?? application.firstName,
          lastName: existingUser.lastName ?? application.lastName,
          isPilotUser: true,
          betaAccessEnabled: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: application.normalizedEmail,
        firstName: application.firstName,
        lastName: application.lastName,
        isPilotUser: true,
        betaAccessEnabled: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
      },
    });
  }

  private async ensureApplicationInvitation(
    application: CheckoutApplicationRecord & {
      reviewedByUserId?: string | null;
      invitation?: {
        id: string;
        createdAt: Date;
        acceptedAt: Date | null;
        revokedAt: Date | null;
        expiresAt: Date;
      } | null;
    },
    user: {
      id: string;
      email: string;
      passwordHash: string | null;
    },
  ) {
    if (!application.organization) {
      throw new NotFoundException('Organisation pilote introuvable');
    }

    if (application.invitation) {
      return {
        invitation: {
          id: application.invitation.id,
        },
        deliveryMode: 'skipped' as const,
      };
    }

    if (!application.reviewedByUserId) {
      throw new ConflictException(
        'La candidature ne reference aucun admin validateur pour emettre l invitation finale.',
      );
    }

    return this.invitationsService.issueInvitation({
      userId: user.id,
      email: application.email,
      organizationMode: InvitationOrganizationMode.EXISTING,
      organization: application.organization,
      membershipRole: MembershipRole.ADMIN,
      createdByAdminUserId: application.reviewedByUserId,
      requiresPasswordSetup: !user.passwordHash,
      emailVariant: 'pilotActivation',
    });
  }

  private async ensureStripeCustomerForOrganization(input: {
    applicationId: string;
    organizationId: string;
    organizationName: string;
    email: string;
    currentStripeCustomerId: string | null;
  }) {
    if (input.currentStripeCustomerId) {
      return input.currentStripeCustomerId;
    }

    const customer = await this.stripeClient.createCustomer(
      {
        name: input.organizationName,
        email: input.email,
        metadata: {
          organizationId: input.organizationId,
          pilotApplicationId: input.applicationId,
        },
      },
      {
        idempotencyKey: `pilot-application:${input.applicationId}:stripe-customer`,
      },
    );

    await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    await this.prisma.pilotApplication.update({
      where: { id: input.applicationId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  private buildAdminWhere(query: ListAdminPilotApplicationsQueryDto) {
    const search = query.search?.trim();

    return {
      status: query.status,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              {
                profileType: { contains: search, mode: 'insensitive' as const },
              },
              {
                problemDescription: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    } satisfies Prisma.PilotApplicationWhereInput;
  }

  private mapAdminListItem(item: AdminPilotApplicationListRecord) {
    return {
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      fullName: buildPilotApplicantDisplayName({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
      }),
      email: item.email,
      profileType: item.profileType,
      projectCount: item.projectCount,
      problemDescription: item.problemDescription,
      status: item.status,
      provisioningStatus: item.provisioningStatus,
      createdAt: item.createdAt,
      approvedAt: item.approvedAt,
      paymentStartedAt: item.paymentStartedAt,
      paymentConfirmedAt: item.paymentConfirmedAt,
      activatedAt: item.activatedAt,
      reviewedAt: item.reviewedAt,
      checkoutLinkSentAt: item.checkoutLinkSentAt,
      provisioningErrorMessage: item.provisioningErrorMessage,
      organization: item.organization
        ? {
            id: item.organization.id,
            name: item.organization.name,
            slug: item.organization.slug,
            billingPlan: item.organization.billingPlan,
            billingStatus: item.organization.billingStatus,
            projectsCount: item.organization._count.projects,
          }
        : null,
      invitation: item.invitation
        ? {
            id: item.invitation.id,
            status: this.getInvitationStatus(item.invitation),
            createdAt: item.invitation.createdAt,
            acceptedAt: item.invitation.acceptedAt,
            expiresAt: item.invitation.expiresAt,
          }
        : null,
      user: item.user
        ? {
            id: item.user.id,
            email: item.user.email,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            isPilotUser: item.user.isPilotUser,
            betaAccessEnabled: item.user.betaAccessEnabled,
          }
        : null,
      reviewedBy: item.reviewedBy
        ? {
            id: item.reviewedBy.id,
            email: item.reviewedBy.email,
            firstName: item.reviewedBy.firstName,
            lastName: item.reviewedBy.lastName,
          }
        : null,
    };
  }

  private mapAdminDetail(application: AdminPilotApplicationDetailRecord) {
    return {
      ...this.mapAdminListItem(application),
      acknowledgementAcceptedAt: application.acknowledgementAcceptedAt,
      organizationName: application.organizationName,
      internalNote: application.internalNote,
      stripe: {
        customerId: application.stripeCustomerId,
        checkoutSessionId: application.stripeCheckoutSessionId,
        subscriptionId: application.stripeSubscriptionId,
        priceId: application.stripePriceId,
      },
      organization: application.organization
        ? {
            id: application.organization.id,
            name: application.organization.name,
            slug: application.organization.slug,
            billingPlan: application.organization.billingPlan,
            billingStatus: application.organization.billingStatus,
            billingCurrentPeriodEnd:
              application.organization.billingCurrentPeriodEnd,
            billingCancelAtPeriodEnd:
              application.organization.billingCancelAtPeriodEnd,
            billingLastEventAt: application.organization.billingLastEventAt,
            projectsCount: application.organization._count.projects,
            membersCount: application.organization._count.memberships,
            stripeCustomerId: application.organization.stripeCustomerId,
            stripeSubscriptionId: application.organization.stripeSubscriptionId,
          }
        : null,
      invitation: application.invitation
        ? {
            id: application.invitation.id,
            status: this.getInvitationStatus(application.invitation),
            createdAt: application.invitation.createdAt,
            acceptedAt: application.invitation.acceptedAt,
            revokedAt: application.invitation.revokedAt,
            expiresAt: application.invitation.expiresAt,
            membershipRole: application.invitation.membershipRole,
            organizationMode: application.invitation.organizationMode,
          }
        : null,
      user: application.user
        ? {
            id: application.user.id,
            email: application.user.email,
            firstName: application.user.firstName,
            lastName: application.user.lastName,
            hasPassword: Boolean(application.user.passwordHash),
            isPilotUser: application.user.isPilotUser,
            betaAccessEnabled: application.user.betaAccessEnabled,
            memberships: application.user.memberships,
          }
        : null,
      events: application.events.map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        metadata: event.metadata,
        createdAt: event.createdAt,
        actor: event.actorUser
          ? {
              id: event.actorUser.id,
              email: event.actorUser.email,
              firstName: event.actorUser.firstName,
              lastName: event.actorUser.lastName,
            }
          : null,
      })),
    };
  }

  private async getApplicationByCheckoutToken(
    token: string,
    options?: { requireOrganization?: boolean },
  ) {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new BadRequestException('Lien de souscription invalide');
    }

    const application = await this.prisma.pilotApplication.findUnique({
      where: {
        checkoutTokenHash: this.hashToken(normalizedToken),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!application) {
      throw new BadRequestException('Ce lien de souscription est invalide');
    }

    if (!application.checkoutTokenExpiresAt) {
      throw new GoneException('Ce lien de souscription nest plus actif');
    }

    if (application.checkoutTokenExpiresAt.getTime() <= Date.now()) {
      if (application.status !== PilotApplicationStatus.ACTIVE) {
        await this.prisma.$transaction(async (tx) => {
          await tx.pilotApplication.update({
            where: { id: application.id },
            data: {
              status: PilotApplicationStatus.EXPIRED,
              checkoutTokenHash: null,
              checkoutTokenExpiresAt: null,
            },
          });

          await tx.pilotApplicationEvent.create({
            data: {
              pilotApplicationId: application.id,
              type: PilotApplicationEventType.EXPIRED,
              message: 'Le lien de souscription pilote a expire.',
            },
          });
        });
      }

      throw new GoneException('Ce lien de souscription a expire');
    }

    if (application.status === PilotApplicationStatus.PENDING) {
      throw new ForbiddenException(
        'Cette candidature na pas encore ete approuvee.',
      );
    }

    if (application.status === PilotApplicationStatus.REJECTED) {
      throw new ForbiddenException('Cette candidature a ete refusee.');
    }

    if (application.status === PilotApplicationStatus.CANCELLED) {
      throw new ForbiddenException(
        'Cette souscription pilote nest plus disponible.',
      );
    }

    if (options?.requireOrganization && !application.organization) {
      throw new ConflictException(
        'L organisation cible nest pas prete. Reessayez apres validation admin.',
      );
    }

    return application;
  }

  private buildCheckoutContextMessage(application: CheckoutApplicationRecord) {
    if (application.status === PilotApplicationStatus.ACTIVE) {
      return 'Votre abonnement pilote est deja confirme. Verifiez votre email pour finaliser votre acces Axelys.';
    }

    if (application.status === PilotApplicationStatus.PAYMENT_PENDING) {
      return 'Votre souscription a deja ete lancee. Vous pouvez reprendre ou relancer le paiement si besoin.';
    }

    return 'Votre candidature a ete approuvee. Vous pouvez maintenant lancer votre abonnement pilote Stripe.';
  }

  private getInvitationStatus(invitation: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  }) {
    if (invitation.acceptedAt) {
      return 'ACCEPTED' as const;
    }

    if (invitation.revokedAt) {
      return 'REVOKED' as const;
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return 'EXPIRED' as const;
    }

    return 'PENDING' as const;
  }

  private generateToken() {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
