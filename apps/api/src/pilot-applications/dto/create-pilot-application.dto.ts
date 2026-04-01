import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

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

  acknowledgement: boolean;
}
