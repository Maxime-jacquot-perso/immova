import { ExpenseCategory, PaymentStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  lotId?: string | null;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsNumber()
  amountHt?: number;

  @IsOptional()
  @IsNumber()
  vatAmount?: number;

  @IsOptional()
  @IsNumber()
  amountTtc?: number;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
