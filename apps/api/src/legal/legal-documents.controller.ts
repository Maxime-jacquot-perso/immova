import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LegalAcceptanceSource } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { extractRequestMetadata } from '../common/utils/request-metadata.util';
import { AcceptCurrentLegalDocumentsDto } from './dto/accept-current-legal-documents.dto';
import { LegalDocumentsService } from './legal-documents.service';

@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Get('current')
  getCurrentDocuments() {
    return this.legalDocumentsService.listCurrentDocuments();
  }

  @Post('accept/current')
  @UseGuards(JwtAuthGuard)
  acceptCurrentDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AcceptCurrentLegalDocumentsDto,
    @Req() request: Request,
  ) {
    const metadata = extractRequestMetadata(request);

    return this.legalDocumentsService.acceptCurrentDocuments({
      userId: user.userId,
      organizationId: user.organizationId,
      scope: body.scope,
      source: LegalAcceptanceSource.IN_APP,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }
}
