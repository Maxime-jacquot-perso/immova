import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class SimulationFoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    const folders = await this.prisma.simulationFolder.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            simulations: {
              where: {
                archivedAt: null,
              },
            },
          },
        },
      },
    });

    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      simulationsCount: folder._count.simulations,
      archivedAt: folder.archivedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));
  }

  async create(organizationId: string, input: CreateFolderDto) {
    const folder = await this.prisma.simulationFolder.create({
      data: {
        organizationId,
        ...input,
      },
    });

    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      archivedAt: folder.archivedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  async findOne(organizationId: string, folderId: string) {
    const folder = await this.prisma.simulationFolder.findFirst({
      where: {
        id: folderId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            simulations: {
              where: {
                archivedAt: null,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Simulation folder not found');
    }

    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      simulationsCount: folder._count.simulations,
      archivedAt: folder.archivedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  async update(
    organizationId: string,
    folderId: string,
    input: UpdateFolderDto,
  ) {
    await this.findOne(organizationId, folderId);

    const folder = await this.prisma.simulationFolder.update({
      where: { id: folderId },
      data: input,
    });

    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      archivedAt: folder.archivedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  async archive(organizationId: string, folderId: string) {
    await this.findOne(organizationId, folderId);

    const folder = await this.prisma.simulationFolder.update({
      where: { id: folderId },
      data: { archivedAt: new Date() },
    });

    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      archivedAt: folder.archivedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }
}
