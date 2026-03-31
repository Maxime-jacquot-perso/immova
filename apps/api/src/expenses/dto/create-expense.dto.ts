import { ExpenseCategory, PaymentStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  lotId?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsDateString()
  issueDate!: string;

  @IsNumber()
  amountHt!: number;

  @IsNumber()
  vatAmount!: number;

  @IsNumber()
  amountTtc!: number;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
