import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SimulationFoldersController } from './simulation-folders.controller';
import { SimulationFoldersService } from './simulation-folders.service';

@Module({
  imports: [PrismaModule],
  controllers: [SimulationFoldersController],
  providers: [SimulationFoldersService],
  exports: [SimulationFoldersService],
})
export class SimulationFoldersModule {}
