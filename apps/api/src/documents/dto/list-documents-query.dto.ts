import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListDocumentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsString()
  expenseId?: string;
}
