import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { buildProjectInsights } from './project-metrics.util';
import { UpdateProjectDto } from './dto/update-project.dto';

function mapProject(project: {
  id: string;
  name: string;
  reference: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  type: string;
  status: string;
  purchasePrice: Prisma.Decimal | null;
  notaryFees: Prisma.Decimal | null;
  acquisitionFees: Prisma.Decimal | null;
  worksBudget: Prisma.Decimal | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: project.id,
    name: project.name,
    reference: project.reference,
    addressLine1: project.addressLine1,
    postalCode: project.postalCode,
    city: project.city,
    country: project.country,
    type: project.type,
    status: project.status,
    purchasePrice: toNumber(project.purchasePrice),
    notaryFees: toNumber(project.notaryFees),
    acquisitionFees: toNumber(project.acquisitionFees),
    worksBudget: toNumber(project.worksBudget),
    notes: project.notes,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        reference: true,
        addressLine1: true,
        postalCode: true,
        city: true,
        country: true,
        type: true,
        status: true,
        purchasePrice: true,
        notaryFees: true,
        acquisitionFees: true,
        worksBudget: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        lots: {
          select: {
            status: true,
            surface: true,
            estimatedRent: true,
          },
        },
        expenses: {
          select: {
            category: true,
            amountTtc: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return projects.map((project) => {
      const insights = buildProjectInsights({
        ...project,
        documentsCount: project._count.documents,
      });

      return {
        ...mapProject(project),
        decisionStatus: insights.decisionStatus,
      };
    });
  }

  async create(organizationId: string, input: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        organizationId,
        ...input,
      },
    });

    return mapProject(project);
  }

  async findOne(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return mapProject(project);
  }

  async update(
    organizationId: string,
    projectId: string,
    input: UpdateProjectDto,
  ) {
    await this.findOne(organizationId, projectId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: input,
    });

    return mapProject(project);
  }

  async overview(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        lots: true,
        expenses: true,
        _count: {
          select: {
            documents: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const insights = buildProjectInsights({
      ...project,
      documentsCount: project._count.documents,
    });

    return {
      project: mapProject(project),
      kpis: {
        acquisitionCost: insights.metrics.acquisitionCost,
        worksBudget: insights.metrics.worksBudget,
        worksExpenses: insights.metrics.worksExpenses,
        totalExpenses: insights.metrics.totalExpenses,
        totalCostToDate: insights.metrics.totalCostToDate,
        worksBudgetDelta: insights.metrics.worksBudgetDelta,
        lotsCount: insights.metrics.lotsCount,
        totalSurface: insights.metrics.totalSurface,
        estimatedRentTotal: insights.metrics.estimatedRentTotal,
        grossYieldEstimated: insights.metrics.grossYieldEstimated,
      },
      completeness: insights.completeness,
      decisionStatus: insights.decisionStatus,
      alerts: insights.alerts,
      suggestions: insights.suggestions,
      recentExpenses: project.expenses
        .sort(
          (left, right) => right.issueDate.getTime() - left.issueDate.getTime(),
        )
        .slice(0, 5)
        .map((expense) => ({
          id: expense.id,
          invoiceNumber: expense.invoiceNumber,
          issueDate: expense.issueDate,
          category: expense.category,
          paymentStatus: expense.paymentStatus,
          vendorName: expense.vendorName,
          amountTtc: toNumber(expense.amountTtc),
        })),
      recentDocuments: project.documents.map((document) => ({
        id: document.id,
        title: document.title,
        type: document.type,
        createdAt: document.createdAt,
      })),
    };
  }
}
