import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePilotApplicationDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsIn(['1', '2-5', '6-10', '10+'])
  projectCount: string;

  @IsString()
  @IsIn(['Investisseur immobilier', 'Marchand de biens', 'Autre'])
  profileType: string;

  @IsString()
  @IsNotEmpty()
  problemDescription: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  acknowledgement: boolean;
}
