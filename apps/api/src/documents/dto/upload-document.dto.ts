import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  title!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsOptional()
  @IsString()
  expenseId?: string;
}
