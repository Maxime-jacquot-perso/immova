import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { SimulationOptionsController } from './simulation-options.controller';
import { SimulationOptionsService } from './simulation-options.service';

@Module({
  imports: [PrismaModule],
  controllers: [SimulationsController, SimulationOptionsController],
  providers: [SimulationsService, SimulationOptionsService],
  exports: [SimulationsService, SimulationOptionsService],
})
export class SimulationsModule {}
