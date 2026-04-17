import { IsString, MinLength } from 'class-validator';

export class PilotCheckoutTokenQueryDto {
  @IsString()
  @MinLength(10)
  token!: string;
}

export class CreatePilotCheckoutSessionDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
