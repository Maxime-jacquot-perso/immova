import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { isAdminRole } from '../admin-authorization';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AdminAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !isAdminRole(user.adminRole)) {
      throw new ForbiddenException(
        "Cette route est reservee a l'administration interne.",
      );
    }

    return true;
  }
}
