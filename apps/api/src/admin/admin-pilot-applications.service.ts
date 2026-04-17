import { Injectable } from '@nestjs/common';
import { AdminAuditAction, AdminAuditTargetType } from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PilotApplicationsService } from '../pilot-applications/pilot-applications.service';
import type { AdminRequestContext } from './admin-request-context';
import { AdminAuditService } from './admin-audit.service';
import { ListAdminPilotApplicationsQueryDto } from '../pilot-applications/dto/list-admin-pilot-applications-query.dto';
import {
  ApprovePilotApplicationDto,
  RejectPilotApplicationDto,
  SendPilotCheckoutLinkDto,
} from '../pilot-applications/dto/pilot-application-review.dto';

@Injectable()
export class AdminPilotApplicationsService {
  constructor(
    private readonly pilotApplicationsService: PilotApplicationsService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  list(query: ListAdminPilotApplicationsQueryDto) {
    return this.pilotApplicationsService.listForAdmin(query);
  }

  findOne(applicationId: string) {
    return this.pilotApplicationsService.getAdminDetail(applicationId);
  }

  async approve(
    actor: AuthenticatedUser,
    applicationId: string,
    body: ApprovePilotApplicationDto,
    context: AdminRequestContext,
  ) {
    const result = await this.pilotApplicationsService.approve({
      applicationId,
      actorUserId: actor.userId,
      body,
    });

    await this.adminAuditService.record({
      actorUserId: actor.userId,
      action: AdminAuditAction.PILOT_APPLICATION_APPROVED,
      targetType: AdminAuditTargetType.PILOT_APPLICATION,
      reason: body.reason,
      newValue: {
        applicationId,
        status: result.application.status,
        provisioningStatus: result.application.provisioningStatus,
      },
      metadata: {
        applicationId,
        delivery: result.delivery,
        organizationId: result.application.organization?.id ?? null,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return result;
  }

  async reject(
    actor: AuthenticatedUser,
    applicationId: string,
    body: RejectPilotApplicationDto,
    context: AdminRequestContext,
  ) {
    const result = await this.pilotApplicationsService.reject({
      applicationId,
      actorUserId: actor.userId,
      body,
    });

    await this.adminAuditService.record({
      actorUserId: actor.userId,
      action: AdminAuditAction.PILOT_APPLICATION_REJECTED,
      targetType: AdminAuditTargetType.PILOT_APPLICATION,
      reason: body.reason,
      newValue: {
        applicationId,
        status: result.application.status,
      },
      metadata: {
        applicationId,
        delivery: result.delivery,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return result;
  }

  async resendCheckoutLink(
    actor: AuthenticatedUser,
    applicationId: string,
    body: SendPilotCheckoutLinkDto,
    context: AdminRequestContext,
  ) {
    const result = await this.pilotApplicationsService.resendCheckoutLink({
      applicationId,
      actorUserId: actor.userId,
      body,
    });

    await this.adminAuditService.record({
      actorUserId: actor.userId,
      action: AdminAuditAction.PILOT_APPLICATION_CHECKOUT_LINK_SENT,
      targetType: AdminAuditTargetType.PILOT_APPLICATION,
      reason: body.reason,
      newValue: {
        applicationId,
        status: result.application.status,
      },
      metadata: {
        applicationId,
        delivery: result.delivery,
        checkoutLinkSentAt: result.application.checkoutLinkSentAt,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return result;
  }
}
