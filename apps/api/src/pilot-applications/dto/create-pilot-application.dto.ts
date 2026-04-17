import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePilotApplicationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstname!: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastname?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsIn(['1', '2-5', '6-10', '10+'])
  projectCount!: string;

  @IsString()
  @IsIn(['Investisseur immobilier', 'Marchand de biens', 'Autre'])
  profileType!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  problemDescription!: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  acknowledgement!: boolean;
}
