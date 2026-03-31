import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeatureRequestDto {
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;
}
