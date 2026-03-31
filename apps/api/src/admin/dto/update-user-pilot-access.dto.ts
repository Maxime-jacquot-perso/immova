import { IsBoolean } from 'class-validator';
import { AdminReasonDto } from './admin-reason.dto';

export class UpdateUserPilotAccessDto extends AdminReasonDto {
  @IsBoolean()
  isPilotUser!: boolean;

  @IsBoolean()
  betaAccessEnabled!: boolean;
}
