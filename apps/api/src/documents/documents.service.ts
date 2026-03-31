import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StreamableFile } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { StorageService } from '../storage/storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  async list(
    organizationId: string,
    projectId: string,
    query: ListDocumentsQueryDto,
  ) {
    await this.assertProject(organizationId, projectId);

    const where: Prisma.DocumentWhereInput = {
      organizationId,
      projectId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.expenseId ? { expenseId: query.expenseId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                originalFileName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    return this.prisma.document.findMany({
      where,
      include: {
        expense: {
          select: {
            id: true,
            invoiceNumber: true,
            category: true,
            vendorName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    organizationId: string,
    projectId: string,
    body: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    await this.assertProject(organizationId, projectId);

    if (body.expenseId) {
      const expense = await this.prisma.expense.findFirst({
        where: {
          id: body.expenseId,
          projectId,
          organizationId,
        },
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }
    }

    const storageKey = `${organizationId}/${randomUUID()}-${sanitizeFileName(
      file.originalname,
    )}`;

    await this.storage.save(storageKey, file.buffer);

    return this.prisma.document.create({
      data: {
        organizationId,
        projectId,
        expenseId: body.expenseId || undefined,
        type: body.type,
        title: body.title,
        originalFileName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
  }

  async download(
    organizationId: string,
    projectId: string,
    documentId: string,
  ) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
        projectId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const stream = await this.storage.openReadStream(document.storageKey);

    return {
      document,
      file: new StreamableFile(stream),
    };
  }
}
