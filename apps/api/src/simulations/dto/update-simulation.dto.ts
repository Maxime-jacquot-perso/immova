import {
  FinancingMode,
  SimulationPropertyType,
  SimulationStrategy,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSimulationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsEnum(SimulationStrategy)
  strategy?: SimulationStrategy;

  @IsOptional()
  @IsEnum(SimulationPropertyType)
  propertyType?: SimulationPropertyType;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Matches(/^(?:0?[1-9]|[1-8]\d|9[0-5]|2A|2B|20|97[1-6])$/i)
  departmentCode?: string;

  @IsOptional()
  @IsBoolean()
  isFirstTimeBuyer?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  furnitureValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDisbursements?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  acquisitionFees?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  worksBudget?: number;

  @IsOptional()
  @IsJSON()
  worksBreakdownJson?: string;

  @IsOptional()
  @IsEnum(FinancingMode)
  financingMode?: FinancingMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loanAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  loanDurationMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedProjectDurationMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetResalePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetMonthlyRent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
