import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Controller('billing')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout-session')
  createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(user, body);
  }

  @Post('portal-session')
  createPortalSession(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.createPortalSession(user);
  }
}
