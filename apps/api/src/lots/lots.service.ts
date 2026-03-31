import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';

function mapLot(lot: {
  id: string;
  projectId: string;
  name: string;
  reference: string | null;
  type: string;
  status: string;
  surface: Prisma.Decimal | null;
  estimatedRent: Prisma.Decimal | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...lot,
    surface: toNumber(lot.surface),
    estimatedRent: toNumber(lot.estimatedRent),
  };
}

@Injectable()
export class LotsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  async list(organizationId: string, projectId: string) {
    await this.assertProject(organizationId, projectId);

    const lots = await this.prisma.lot.findMany({
      where: { organizationId, projectId },
      orderBy: { createdAt: 'asc' },
    });

    return lots.map(mapLot);
  }

  async create(organizationId: string, projectId: string, input: CreateLotDto) {
    await this.assertProject(organizationId, projectId);

    const lot = await this.prisma.lot.create({
      data: {
        organizationId,
        projectId,
        ...input,
      },
    });

    return mapLot(lot);
  }

  async update(
    organizationId: string,
    projectId: string,
    lotId: string,
    input: UpdateLotDto,
  ) {
    await this.assertProject(organizationId, projectId);

    const lot = await this.prisma.lot.findFirst({
      where: {
        id: lotId,
        organizationId,
        projectId,
      },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    const updated = await this.prisma.lot.update({
      where: { id: lotId },
      data: input,
    });

    return mapLot(updated);
  }
}
