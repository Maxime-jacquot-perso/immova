import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OptionStatus, Prisma } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildSimulationConversionPlan,
  type ConversionIssue,
} from './simulation-conversion.util';
import { CreateOpportunityEventDto } from './dto/create-opportunity-event.dto';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { CreateSimulationLotDto } from './dto/create-simulation-lot.dto';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { CreateWorkItemOptionDto } from './dto/create-work-item-option.dto';
import { UpdateOpportunityEventDto } from './dto/update-opportunity-event.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { UpdateSimulationLotDto } from './dto/update-simulation-lot.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { UpdateWorkItemOptionDto } from './dto/update-work-item-option.dto';
import { buildSimulationResults } from './simulation-metrics.util';
import { normalizeDepartmentCode } from './simulation-notary-fees.util';
import { buildSimulationRuntimeState } from './simulation-resolver.util';

function mapSimulation(simulation: {
  id: string;
  organizationId: string;
  folderId: string;
  name: string;
  address: string | null;
  strategy: string;
  propertyType: string | null;
  departmentCode: string | null;
  isFirstTimeBuyer: boolean;
  purchasePrice: Prisma.Decimal;
  furnitureValue: Prisma.Decimal | null;
  estimatedDisbursements: Prisma.Decimal | null;
  notaryFees: Prisma.Decimal | null;
  notaryFeesBreakdown: Prisma.JsonValue | null;
  acquisitionFees: Prisma.Decimal;
  worksBudget: Prisma.Decimal;
  worksBreakdownJson: Prisma.JsonValue | null;
  financingMode: string;
  downPayment: Prisma.Decimal | null;
  loanAmount: Prisma.Decimal | null;
  interestRate: Prisma.Decimal | null;
  loanDurationMonths: number | null;
  estimatedMonthlyPayment: Prisma.Decimal | null;
  estimatedProjectDurationMonths: number | null;
  targetResalePrice: Prisma.Decimal | null;
  targetMonthlyRent: Prisma.Decimal | null;
  bufferAmount: Prisma.Decimal | null;
  notes: string | null;
  decisionScore: number | null;
  decisionStatus: string | null;
  resultSummaryJson: Prisma.JsonValue | null;
  convertedProjectId: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: simulation.id,
    organizationId: simulation.organizationId,
    folderId: simulation.folderId,
    name: simulation.name,
    address: simulation.address,
    strategy: simulation.strategy,
    propertyType: simulation.propertyType,
    departmentCode: simulation.departmentCode,
    isFirstTimeBuyer: simulation.isFirstTimeBuyer,
    purchasePrice: toNumber(simulation.purchasePrice),
    furnitureValue: toNumber(simulation.furnitureValue),
    estimatedDisbursements: toNumber(simulation.estimatedDisbursements),
    notaryFees: toNumber(simulation.notaryFees),
    notaryFeesBreakdown: simulation.notaryFeesBreakdown,
    acquisitionFees: toNumber(simulation.acquisitionFees),
    worksBudget: toNumber(simulation.worksBudget),
    worksBreakdownJson: simulation.worksBreakdownJson,
    financingMode: simulation.financingMode,
    downPayment: toNumber(simulation.downPayment),
    loanAmount: toNumber(simulation.loanAmount),
    interestRate: toNumber(simulation.interestRate),
    loanDurationMonths: simulation.loanDurationMonths,
    estimatedMonthlyPayment: toNumber(simulation.estimatedMonthlyPayment),
    estimatedProjectDurationMonths: simulation.estimatedProjectDurationMonths,
    targetResalePrice: toNumber(simulation.targetResalePrice),
    targetMonthlyRent: toNumber(simulation.targetMonthlyRent),
    bufferAmount: toNumber(simulation.bufferAmount),
    notes: simulation.notes,
    decisionScore: simulation.decisionScore,
    decisionStatus: simulation.decisionStatus,
    resultSummaryJson: simulation.resultSummaryJson,
    convertedProjectId: simulation.convertedProjectId,
    archivedAt: simulation.archivedAt,
    createdAt: simulation.createdAt,
    updatedAt: simulation.updatedAt,
  };
}

function mapSimulationLot(lot: {
  id: string;
  organizationId: string;
  simulationId: string;
  name: string;
  type: string | null;
  surface: Prisma.Decimal | null;
  estimatedRent: Prisma.Decimal | null;
  targetResaleValue: Prisma.Decimal | null;
  notes: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: lot.id,
    organizationId: lot.organizationId,
    simulationId: lot.simulationId,
    name: lot.name,
    type: lot.type,
    surface: toNumber(lot.surface),
    estimatedRent: toNumber(lot.estimatedRent),
    targetResaleValue: toNumber(lot.targetResaleValue),
    notes: lot.notes,
    position: lot.position,
    createdAt: lot.createdAt,
    updatedAt: lot.updatedAt,
  };
}

function mapWorkItem(item: {
  id: string;
  organizationId: string;
  simulationId: string;
  name: string;
  initialCost: Prisma.Decimal;
  estimatedDurationDays: number | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    organizationId: item.organizationId,
    simulationId: item.simulationId,
    name: item.name,
    initialCost: toNumber(item.initialCost),
    estimatedDurationDays: item.estimatedDurationDays,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapWorkItemOption(option: {
  id: string;
  organizationId: string;
  workItemId: string;
  providerName: string;
  cost: Prisma.Decimal;
  durationDays: number | null;
  notes: string | null;
  status: OptionStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: option.id,
    organizationId: option.organizationId,
    workItemId: option.workItemId,
    providerName: option.providerName,
    cost: toNumber(option.cost),
    durationDays: option.durationDays,
    notes: option.notes,
    status: option.status,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt,
  };
}

function pickPrimaryConversionBlockingIssue(issues: ConversionIssue[]) {
  return (
    issues.find((issue) => issue.code === 'SIMULATION_ALREADY_CONVERTED') ??
    issues[0] ??
    null
  );
}

function throwConversionBlockingIssue(issue: ConversionIssue | null): never {
  if (!issue) {
    throw new UnprocessableEntityException({
      code: 'SIMULATION_CONVERSION_BLOCKED',
      message: 'Cette simulation ne peut pas etre convertie en projet.',
    });
  }

  if (issue.code === 'SIMULATION_ALREADY_CONVERTED') {
    throw new ConflictException({
      code: issue.code,
      message: issue.message,
    });
  }

  throw new UnprocessableEntityException({
    code: issue.code,
    message: issue.message,
  });
}

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSimulationForConversion(
    organizationId: string,
    simulationId: string,
  ) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
      include: {
        lots: {
          orderBy: { position: 'asc' },
        },
        workItems: {
          include: {
            options: true,
          },
          orderBy: { position: 'asc' },
        },
        optionGroups: {
          include: {
            activeOption: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        conversionRecord: {
          select: {
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        convertedProject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    return simulation;
  }

  async listByFolder(organizationId: string, folderId: string) {
    const simulations = await this.prisma.simulation.findMany({
      where: {
        organizationId,
        folderId,
      },
      include: {
        lots: {
          orderBy: { position: 'asc' },
        },
        workItems: {
          include: { options: true },
          orderBy: { position: 'asc' },
        },
        optionGroups: {
          include: {
            activeOption: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return simulations
      .map((simulation) => {
        const runtimeState = buildSimulationRuntimeState(
          simulation,
          simulation.workItems,
          simulation.lots,
          simulation.optionGroups,
        );

        return {
          ...mapSimulation(simulation),
          notaryFees:
            runtimeState.results.notaryFees?.total ??
            toNumber(simulation.notaryFees),
          acquisitionFees:
            runtimeState.results.notaryFees?.total ??
            toNumber(simulation.acquisitionFees),
          notaryFeesBreakdown:
            runtimeState.results.notaryFees ?? simulation.notaryFeesBreakdown,
          decisionScore: runtimeState.results.decision.score,
          decisionStatus: runtimeState.results.decision.status,
          estimatedMonthlyPayment:
            runtimeState.results.metrics.estimatedMonthlyPayment,
          resultSummaryJson: {
            metrics: runtimeState.results.metrics,
            decision: runtimeState.results.decision,
            notaryFees: runtimeState.results.notaryFees,
            financingPlan: runtimeState.results.financingPlan,
            activeValues: runtimeState.activeValues,
          },
        };
      })
      .sort((left, right) => {
        const scoreDelta =
          (right.decisionScore ?? 0) - (left.decisionScore ?? 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      });
  }

  async create(organizationId: string, input: CreateSimulationDto) {
    const folder = await this.prisma.simulationFolder.findFirst({
      where: {
        id: input.folderId,
        organizationId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Simulation folder not found');
    }

    const results = buildSimulationResults({
      strategy: input.strategy,
      propertyType: input.propertyType,
      departmentCode: input.departmentCode,
      isFirstTimeBuyer: input.isFirstTimeBuyer ?? false,
      purchasePrice: input.purchasePrice,
      furnitureValue: input.furnitureValue ?? 0,
      estimatedDisbursements: input.estimatedDisbursements ?? undefined,
      acquisitionFees: input.acquisitionFees,
      worksBudget: input.worksBudget,
      bufferAmount: input.bufferAmount ?? 0,
      financingMode: input.financingMode,
      downPayment: input.downPayment ?? 0,
      loanAmount: input.loanAmount ?? 0,
      interestRate: input.interestRate ?? 0,
      loanDurationMonths: input.loanDurationMonths ?? 0,
      estimatedProjectDurationMonths:
        input.estimatedProjectDurationMonths ?? null,
      targetResalePrice: input.targetResalePrice ?? null,
      targetMonthlyRent: input.targetMonthlyRent ?? null,
    });

    const simulation = await this.prisma.simulation.create({
      data: {
        organizationId,
        folderId: input.folderId,
        name: input.name,
        address: input.address,
        strategy: input.strategy,
        propertyType: input.propertyType,
        departmentCode: normalizeDepartmentCode(input.departmentCode),
        isFirstTimeBuyer: input.isFirstTimeBuyer ?? false,
        purchasePrice: input.purchasePrice,
        furnitureValue: input.furnitureValue,
        estimatedDisbursements: input.estimatedDisbursements,
        notaryFees: results.notaryFees?.total ?? input.acquisitionFees ?? 0,
        notaryFeesBreakdown:
          results.notaryFees !== null
            ? (results.notaryFees as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        acquisitionFees:
          results.notaryFees?.total ?? input.acquisitionFees ?? 0,
        worksBudget: input.worksBudget,
        worksBreakdownJson: input.worksBreakdownJson
          ? JSON.parse(input.worksBreakdownJson)
          : null,
        financingMode: input.financingMode,
        downPayment: input.downPayment,
        loanAmount: input.loanAmount,
        interestRate: input.interestRate,
        loanDurationMonths: input.loanDurationMonths,
        estimatedMonthlyPayment: results.metrics.estimatedMonthlyPayment,
        estimatedProjectDurationMonths: input.estimatedProjectDurationMonths,
        targetResalePrice: input.targetResalePrice,
        targetMonthlyRent: input.targetMonthlyRent,
        bufferAmount: input.bufferAmount,
        notes: input.notes,
        decisionScore: results.decision.score,
        decisionStatus: results.decision.status,
        resultSummaryJson: {
          metrics: results.metrics,
          decision: results.decision,
          notaryFees: results.notaryFees,
          financingPlan: results.financingPlan,
        },
      },
    });

    return mapSimulation(simulation);
  }

  async findOne(organizationId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
      include: {
        lots: {
          orderBy: { position: 'asc' },
        },
        workItems: {
          include: { options: true },
          orderBy: { position: 'asc' },
        },
        optionGroups: {
          include: {
            activeOption: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const runtimeState = buildSimulationRuntimeState(
      simulation,
      simulation.workItems || [],
      simulation.lots || [],
      simulation.optionGroups || [],
    );

    return {
      ...mapSimulation(simulation),
      notaryFees:
        runtimeState.results.notaryFees?.total ??
        toNumber(simulation.notaryFees),
      acquisitionFees:
        runtimeState.results.notaryFees?.total ??
        toNumber(simulation.acquisitionFees),
      notaryFeesBreakdown:
        runtimeState.results.notaryFees ?? simulation.notaryFeesBreakdown,
      decisionScore: runtimeState.results.decision.score,
      decisionStatus: runtimeState.results.decision.status,
      estimatedMonthlyPayment:
        runtimeState.results.metrics.estimatedMonthlyPayment,
      lots: simulation.lots.map(mapSimulationLot),
      workItems: simulation.workItems?.map((item) => ({
        ...mapWorkItem(item),
        options: item.options.map(mapWorkItemOption),
      })),
      activeValues: runtimeState.activeValues,
      resultSummaryJson: {
        metrics: runtimeState.results.metrics,
        decision: runtimeState.results.decision,
        notaryFees: runtimeState.results.notaryFees,
        financingPlan: runtimeState.results.financingPlan,
        activeValues: runtimeState.activeValues,
      },
    };
  }

  async update(
    organizationId: string,
    simulationId: string,
    input: UpdateSimulationDto,
  ) {
    const existing = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Simulation not found');
    }

    const dataToUpdate: any = { ...input };
    delete dataToUpdate.acquisitionFees;

    if (input.worksBreakdownJson) {
      dataToUpdate.worksBreakdownJson = JSON.parse(input.worksBreakdownJson);
    }

    if (input.departmentCode !== undefined) {
      dataToUpdate.departmentCode = normalizeDepartmentCode(
        input.departmentCode,
      );
    }

    const shouldRecalculate =
      input.strategy !== undefined ||
      input.propertyType !== undefined ||
      input.departmentCode !== undefined ||
      input.isFirstTimeBuyer !== undefined ||
      input.purchasePrice !== undefined ||
      input.furnitureValue !== undefined ||
      input.estimatedDisbursements !== undefined ||
      input.acquisitionFees !== undefined ||
      input.worksBudget !== undefined ||
      input.bufferAmount !== undefined ||
      input.financingMode !== undefined ||
      input.downPayment !== undefined ||
      input.loanAmount !== undefined ||
      input.interestRate !== undefined ||
      input.loanDurationMonths !== undefined ||
      input.estimatedProjectDurationMonths !== undefined ||
      input.targetResalePrice !== undefined ||
      input.targetMonthlyRent !== undefined;

    if (shouldRecalculate) {
      const merged = {
        strategy: input.strategy ?? existing.strategy,
        propertyType: input.propertyType ?? existing.propertyType,
        departmentCode: input.departmentCode ?? existing.departmentCode,
        isFirstTimeBuyer: input.isFirstTimeBuyer ?? existing.isFirstTimeBuyer,
        purchasePrice: input.purchasePrice ?? existing.purchasePrice,
        furnitureValue: input.furnitureValue ?? existing.furnitureValue,
        estimatedDisbursements:
          input.estimatedDisbursements ?? existing.estimatedDisbursements,
        notaryFees: input.acquisitionFees ?? existing.notaryFees,
        acquisitionFees: input.acquisitionFees ?? existing.acquisitionFees,
        worksBudget: input.worksBudget ?? existing.worksBudget,
        bufferAmount: input.bufferAmount ?? existing.bufferAmount,
        financingMode: input.financingMode ?? existing.financingMode,
        downPayment: input.downPayment ?? existing.downPayment,
        loanAmount: input.loanAmount ?? existing.loanAmount,
        interestRate: input.interestRate ?? existing.interestRate,
        loanDurationMonths:
          input.loanDurationMonths ?? existing.loanDurationMonths,
        estimatedProjectDurationMonths:
          input.estimatedProjectDurationMonths ??
          existing.estimatedProjectDurationMonths,
        targetResalePrice:
          input.targetResalePrice ?? existing.targetResalePrice,
        targetMonthlyRent:
          input.targetMonthlyRent ?? existing.targetMonthlyRent,
      };

      const results = buildSimulationResults(merged);

      dataToUpdate.notaryFees =
        results.notaryFees?.total ??
        input.acquisitionFees ??
        toNumber(existing.notaryFees) ??
        toNumber(existing.acquisitionFees) ??
        0;
      dataToUpdate.acquisitionFees = dataToUpdate.notaryFees;
      dataToUpdate.notaryFeesBreakdown =
        results.notaryFees !== null
          ? (results.notaryFees as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      dataToUpdate.estimatedMonthlyPayment =
        results.metrics.estimatedMonthlyPayment;
      dataToUpdate.decisionScore = results.decision.score;
      dataToUpdate.decisionStatus = results.decision.status;
      dataToUpdate.resultSummaryJson = {
        metrics: results.metrics,
        decision: results.decision,
        notaryFees: results.notaryFees,
        financingPlan: results.financingPlan,
      };
    }

    const simulation = await this.prisma.simulation.update({
      where: { id: simulationId },
      data: dataToUpdate,
    });

    return mapSimulation(simulation);
  }

  async archive(organizationId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const updated = await this.prisma.simulation.update({
      where: { id: simulationId },
      data: { archivedAt: new Date() },
    });

    return mapSimulation(updated);
  }

  async compareByFolder(organizationId: string, folderId: string) {
    const simulations = await this.prisma.simulation.findMany({
      where: {
        organizationId,
        folderId,
        archivedAt: null,
      },
      include: {
        lots: {
          orderBy: { position: 'asc' },
        },
        workItems: {
          include: { options: true },
          orderBy: { position: 'asc' },
        },
        optionGroups: {
          include: {
            activeOption: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return simulations
      .map((simulation) => {
        const runtimeState = buildSimulationRuntimeState(
          simulation,
          simulation.workItems,
          simulation.lots,
          simulation.optionGroups,
        );

        return {
          createdAt: simulation.createdAt,
          id: simulation.id,
          name: simulation.name,
          strategy: simulation.strategy,
          totalProjectCost: runtimeState.results.metrics.totalProjectCost,
          equityRequired: runtimeState.results.metrics.equityRequired,
          grossMargin: runtimeState.results.metrics.grossMargin,
          grossYield: runtimeState.results.metrics.grossYield,
          estimatedMonthlyPayment:
            runtimeState.results.metrics.estimatedMonthlyPayment,
          monthlyCashDelta: runtimeState.results.metrics.monthlyCashDelta,
          projectDurationMonths:
            runtimeState.results.metrics.projectDurationMonths,
          decisionScore: runtimeState.results.decision.score,
          decisionStatus: runtimeState.results.decision.status,
          recommendation: runtimeState.results.decision.recommendation,
        };
      })
      .sort((left, right) => {
        const scoreDelta =
          (right.decisionScore ?? 0) - (left.decisionScore ?? 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return right.createdAt.getTime() - left.createdAt.getTime();
      })
      .map(({ createdAt, ...comparison }) => {
        void createdAt;
        return comparison;
      });
  }

  async getConversionPreview(organizationId: string, simulationId: string) {
    const simulation = await this.getSimulationForConversion(
      organizationId,
      simulationId,
    );

    return buildSimulationConversionPlan(organizationId, simulation).preview;
  }

  async convertToProject(
    organizationId: string,
    userId: string,
    simulationId: string,
  ) {
    const simulation = await this.getSimulationForConversion(
      organizationId,
      simulationId,
    );
    const plan = buildSimulationConversionPlan(organizationId, simulation);

    if (!plan.preview.canConvert) {
      throwConversionBlockingIssue(
        pickPrimaryConversionBlockingIssue(plan.preview.blockingIssues),
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: plan.projectData,
        });

        if (plan.lotDraftData.length > 0) {
          await tx.lot.createMany({
            data: plan.lotDraftData.map((lot) => ({
              ...lot,
              projectId: project.id,
            })),
          });
        }

        const conversion = await tx.simulationConversion.create({
          data: {
            organizationId,
            simulationId,
            projectId: project.id,
            createdByUserId: userId,
            status: 'COMPLETED',
          },
        });

        await tx.projectForecastSnapshot.create({
          data: {
            organizationId,
            projectId: project.id,
            simulationId,
            conversionId: conversion.id,
            ...plan.snapshotData,
          },
        });

        await tx.simulation.update({
          where: { id: simulationId },
          data: { convertedProjectId: project.id },
        });

        return {
          projectId: project.id,
          conversionId: conversion.id,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'SIMULATION_ALREADY_CONVERTED',
          message:
            'Cette simulation a deja ete convertie. Axelys bloque volontairement les reconversions pour eviter les doublons silencieux.',
        });
      }

      throw error;
    }
  }

  async listLots(organizationId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const lots = await this.prisma.simulationLot.findMany({
      where: {
        organizationId,
        simulationId,
      },
      orderBy: { position: 'asc' },
    });

    return lots.map(mapSimulationLot);
  }

  async createLot(
    organizationId: string,
    simulationId: string,
    input: CreateSimulationLotDto,
  ) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const maxPosition = await this.prisma.simulationLot.findFirst({
      where: {
        organizationId,
        simulationId,
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const lot = await this.prisma.simulationLot.create({
      data: {
        organizationId,
        simulationId,
        name: input.name,
        type: input.type,
        surface: input.surface,
        estimatedRent: input.estimatedRent,
        targetResaleValue: input.targetResaleValue,
        notes: input.notes,
        position: input.position ?? (maxPosition?.position ?? 0) + 1,
      },
    });

    return mapSimulationLot(lot);
  }

  async updateLot(
    organizationId: string,
    simulationId: string,
    lotId: string,
    input: UpdateSimulationLotDto,
  ) {
    const lot = await this.prisma.simulationLot.findFirst({
      where: {
        id: lotId,
        simulationId,
        organizationId,
      },
    });

    if (!lot) {
      throw new NotFoundException('Simulation lot not found');
    }

    const updated = await this.prisma.simulationLot.update({
      where: { id: lotId },
      data: input,
    });

    return mapSimulationLot(updated);
  }

  async deleteLot(organizationId: string, simulationId: string, lotId: string) {
    const lot = await this.prisma.simulationLot.findFirst({
      where: {
        id: lotId,
        simulationId,
        organizationId,
      },
    });

    if (!lot) {
      throw new NotFoundException('Simulation lot not found');
    }

    await this.prisma.simulationLot.delete({
      where: { id: lotId },
    });

    return { success: true };
  }

  async listEvents(organizationId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const events = await this.prisma.opportunityEvent.findMany({
      where: {
        organizationId,
        simulationId,
      },
      orderBy: { eventDate: 'desc' },
    });

    return events;
  }

  async createEvent(
    organizationId: string,
    simulationId: string,
    input: CreateOpportunityEventDto,
  ) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const event = await this.prisma.opportunityEvent.create({
      data: {
        organizationId,
        simulationId,
        type: input.type,
        title: input.title,
        description: input.description,
        eventDate: new Date(input.eventDate),
        impact: input.impact,
        metadata: input.metadata ? JSON.parse(input.metadata) : null,
      },
    });

    return event;
  }

  async updateEvent(
    organizationId: string,
    simulationId: string,
    eventId: string,
    input: UpdateOpportunityEventDto,
  ) {
    const event = await this.prisma.opportunityEvent.findFirst({
      where: {
        id: eventId,
        simulationId,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException('Opportunity event not found');
    }

    const dataToUpdate: any = { ...input };

    if (input.eventDate) {
      dataToUpdate.eventDate = new Date(input.eventDate);
    }

    if (input.metadata) {
      dataToUpdate.metadata = JSON.parse(input.metadata);
    }

    const updated = await this.prisma.opportunityEvent.update({
      where: { id: eventId },
      data: dataToUpdate,
    });

    return updated;
  }

  async deleteEvent(
    organizationId: string,
    simulationId: string,
    eventId: string,
  ) {
    const event = await this.prisma.opportunityEvent.findFirst({
      where: {
        id: eventId,
        simulationId,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException('Opportunity event not found');
    }

    await this.prisma.opportunityEvent.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  // Work Items methods
  async listWorkItems(organizationId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const workItems = await this.prisma.simulationWorkItem.findMany({
      where: {
        organizationId,
        simulationId,
      },
      include: {
        options: true,
      },
      orderBy: { position: 'asc' },
    });

    return workItems.map((item) => ({
      ...mapWorkItem(item),
      options: item.options.map(mapWorkItemOption),
    }));
  }

  async createWorkItem(
    organizationId: string,
    simulationId: string,
    input: CreateWorkItemDto,
  ) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        organizationId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const maxPosition = await this.prisma.simulationWorkItem.findFirst({
      where: {
        organizationId,
        simulationId,
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const workItem = await this.prisma.simulationWorkItem.create({
      data: {
        organizationId,
        simulationId,
        name: input.name,
        initialCost: input.initialCost,
        estimatedDurationDays: input.estimatedDurationDays,
        position: input.position ?? (maxPosition?.position ?? 0) + 1,
      },
      include: {
        options: true,
      },
    });

    return {
      ...mapWorkItem(workItem),
      options: workItem.options.map(mapWorkItemOption),
    };
  }

  async updateWorkItem(
    organizationId: string,
    simulationId: string,
    itemId: string,
    input: UpdateWorkItemDto,
  ) {
    const workItem = await this.prisma.simulationWorkItem.findFirst({
      where: {
        id: itemId,
        simulationId,
        organizationId,
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const updated = await this.prisma.simulationWorkItem.update({
      where: { id: itemId },
      data: input,
      include: {
        options: true,
      },
    });

    return {
      ...mapWorkItem(updated),
      options: updated.options.map(mapWorkItemOption),
    };
  }

  async deleteWorkItem(
    organizationId: string,
    simulationId: string,
    itemId: string,
  ) {
    const workItem = await this.prisma.simulationWorkItem.findFirst({
      where: {
        id: itemId,
        simulationId,
        organizationId,
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    await this.prisma.simulationWorkItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  // Work Item Options methods
  async createWorkItemOption(
    organizationId: string,
    simulationId: string,
    itemId: string,
    input: CreateWorkItemOptionDto,
  ) {
    const workItem = await this.prisma.simulationWorkItem.findFirst({
      where: {
        id: itemId,
        simulationId,
        organizationId,
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const option = await this.prisma.workItemOption.create({
      data: {
        organizationId,
        workItemId: itemId,
        providerName: input.providerName,
        cost: input.cost,
        durationDays: input.durationDays,
        notes: input.notes,
        status: OptionStatus.CANDIDATE,
      },
    });

    return mapWorkItemOption(option);
  }

  async updateWorkItemOption(
    organizationId: string,
    simulationId: string,
    itemId: string,
    optionId: string,
    input: UpdateWorkItemOptionDto,
  ) {
    const workItem = await this.prisma.simulationWorkItem.findFirst({
      where: {
        id: itemId,
        simulationId,
        organizationId,
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const option = await this.prisma.workItemOption.findFirst({
      where: {
        id: optionId,
        workItemId: itemId,
        organizationId,
      },
    });

    if (!option) {
      throw new NotFoundException('Work item option not found');
    }

    const updated = await this.prisma.workItemOption.update({
      where: { id: optionId },
      data: input,
    });

    return mapWorkItemOption(updated);
  }

  async deleteWorkItemOption(
    organizationId: string,
    simulationId: string,
    itemId: string,
    optionId: string,
  ) {
    const workItem = await this.prisma.simulationWorkItem.findFirst({
      where: {
        id: itemId,
        simulationId,
        organizationId,
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const option = await this.prisma.workItemOption.findFirst({
      where: {
        id: optionId,
        workItemId: itemId,
        organizationId,
      },
    });

    if (!option) {
      throw new NotFoundException('Work item option not found');
    }

    await this.prisma.workItemOption.delete({
      where: { id: optionId },
    });

    return { success: true };
  }

  async activateWorkItemOption(
    organizationId: string,
    simulationId: string,
    itemId: string,
    optionId: string,
  ) {
    const workItem = await this.prisma.simulationWorkItem.findFirst({
      where: {
        id: itemId,
        simulationId,
        organizationId,
      },
      include: { options: true },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const option = workItem.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new NotFoundException('Work item option not found');
    }

    // Désactiver toutes les autres options du même work item
    await this.prisma.workItemOption.updateMany({
      where: {
        workItemId: itemId,
        organizationId,
      },
      data: { status: OptionStatus.CANDIDATE },
    });

    // Activer l'option sélectionnée
    const activated = await this.prisma.workItemOption.update({
      where: { id: optionId },
      data: { status: OptionStatus.ACTIVE },
    });

    return mapWorkItemOption(activated);
  }
}
