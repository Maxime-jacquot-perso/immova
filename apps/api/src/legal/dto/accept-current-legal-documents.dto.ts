import { Equals, IsIn, IsString } from 'class-validator';

export class AcceptCurrentLegalDocumentsDto {
  @IsString()
  @IsIn(['ACCOUNT', 'CHECKOUT'])
  scope!: 'ACCOUNT' | 'CHECKOUT';

  @Equals(true, {
    message:
      "L'acceptation explicite des documents juridiques en vigueur est requise.",
  })
  accepted!: true;
}
