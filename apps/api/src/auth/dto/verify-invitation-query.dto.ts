import { IsString, MinLength } from 'class-validator';

export class VerifyInvitationQueryDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
