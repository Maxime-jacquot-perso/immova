import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  hasAdminPermission,
  type AdminPermission,
} from '../admin-authorization';
import { ADMIN_PERMISSIONS_KEY } from '../decorators/admin-permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredPermissions =
      this.reflector.getAllAndOverride<AdminPermission[]>(
        ADMIN_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Missing authenticated admin context');
    }

    const missingPermission = requiredPermissions.find(
      (permission) => !hasAdminPermission(user.adminRole, permission),
    );

    if (missingPermission) {
      throw new ForbiddenException(
        `Missing admin permission: ${missingPermission}`,
      );
    }

    return true;
  }
}
