import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeatureRequestStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BetaAccessGuard } from '../common/guards/beta-access.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';
import { ListIdeasQueryDto } from './dto/list-ideas-query.dto';
import { IdeasService } from './ideas.service';

@Controller('ideas')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListIdeasQueryDto,
  ) {
    return this.ideasService.list({
      organizationId: user.organizationId!,
      userId: user.userId,
      status: query.status,
      sort: query.sort,
    });
  }

  @Get('beta')
  @UseGuards(BetaAccessGuard)
  listBeta(@CurrentUser() user: AuthenticatedUser) {
    return this.ideasService.list({
      organizationId: user.organizationId!,
      userId: user.userId,
      status: FeatureRequestStatus.IN_PROGRESS,
      sort: 'top',
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateFeatureRequestDto,
  ) {
    return this.ideasService.create(user.organizationId!, user.userId, body);
  }

  @Post(':featureRequestId/vote')
  vote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('featureRequestId') featureRequestId: string,
  ) {
    return this.ideasService.addVote(
      user.organizationId!,
      user.userId,
      featureRequestId,
    );
  }

  @Delete(':featureRequestId/vote')
  removeVote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('featureRequestId') featureRequestId: string,
  ) {
    return this.ideasService.removeVote(
      user.organizationId!,
      user.userId,
      featureRequestId,
    );
  }
}
