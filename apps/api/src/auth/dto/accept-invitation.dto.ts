import {
  Equals,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password?: string;

  @Equals(true, {
    message:
      "L'acceptation des documents juridiques en vigueur est requise pour activer le compte.",
  })
  acceptLegalDocuments!: true;
}
