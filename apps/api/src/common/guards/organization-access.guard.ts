import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.organizationId || !user.membershipRole) {
      throw new ForbiddenException(
        "Cette route n'est accessible qu'avec un contexte organisation valide.",
      );
    }

    return true;
  }
}
