import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.list(user.organizationId!);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateMembershipDto,
  ) {
    return this.membershipsService.create(
      user.membershipRole!,
      user.organizationId!,
      body,
    );
  }

  @Patch(':membershipId')
  updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('membershipId') membershipId: string,
    @Body() body: UpdateMembershipRoleDto,
  ) {
    return this.membershipsService.updateRole(
      user.membershipRole!,
      user.organizationId!,
      membershipId,
      body,
    );
  }
}
