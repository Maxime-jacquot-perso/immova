import { IsInt, Max, Min } from 'class-validator';
import { AdminReasonDto } from './admin-reason.dto';

export class ExtendTrialDto extends AdminReasonDto {
  @IsInt()
  @Min(1)
  @Max(90)
  durationDays!: number;
}
