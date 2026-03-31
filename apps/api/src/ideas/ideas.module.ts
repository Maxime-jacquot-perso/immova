import { Module } from '@nestjs/common';
import { BetaAccessGuard } from '../common/guards/beta-access.guard';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  controllers: [IdeasController],
  providers: [IdeasService, BetaAccessGuard],
  exports: [IdeasService],
})
export class IdeasModule {}
