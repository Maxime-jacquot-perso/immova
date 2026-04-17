import { IsString, MinLength } from 'class-validator';

export class VerifyResetPasswordQueryDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
