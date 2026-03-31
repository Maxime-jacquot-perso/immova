import { Controller, Get, Header, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ExportsService } from './exports.service';

@Controller('projects/:projectId/exports')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('expenses.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async expensesCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${projectId}-expenses.csv"`,
    );

    return this.exportsService.expensesCsv(user.organizationId!, projectId);
  }
}
