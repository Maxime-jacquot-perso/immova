import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentsService } from './documents.service';

@Controller('projects/:projectId/documents')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: ListDocumentsQueryDto,
  ) {
    return this.documentsService.list(user.organizationId!, projectId, query);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.upload(
      user.organizationId!,
      projectId,
      body,
      file,
    );
  }

  @Get(':documentId/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const payload = await this.documentsService.download(
      user.organizationId!,
      projectId,
      documentId,
    );

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${payload.document.originalFileName}"`,
    );
    response.setHeader('Content-Type', payload.document.mimeType);
    return payload.file;
  }
}
