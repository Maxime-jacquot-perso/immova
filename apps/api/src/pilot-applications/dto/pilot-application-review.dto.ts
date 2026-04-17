import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ApprovePilotApplicationDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  sendCheckoutLink?: boolean;
}

export class RejectPilotApplicationDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  sendRejectionEmail?: boolean;
}

export class SendPilotCheckoutLinkDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
