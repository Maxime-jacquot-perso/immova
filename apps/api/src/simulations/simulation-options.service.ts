import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SimulationOptionGroupType,
  SimulationOptionSource,
} from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import { buildSimulationRuntimeState } from './simulation-resolver.util';

export type CreateOptionGroupInput = {
  organizationId: string;
  simulationId: string;
  type: SimulationOptionGroupType;
  label: string;
};

export type CreateOptionInput = {
  organizationId: string;
  groupId: string;
  label: string;
  valueJson: Prisma.JsonValue;
  source?: SimulationOptionSource;
  sourceEventId?: string;
};

export type ActivateOptionInput = {
  organizationId: string;
  optionId: string;
  activatedByUserId: string;
};

type ScenarioSimulation = Prisma.SimulationGetPayload<{
  include: {
    lots: true;
    workItems: {
      include: {
        options: true;
      };
    };
  };
}>;

type ScenarioOptionGroup = Prisma.SimulationOptionGroupGetPayload<{
  include: {
    activeOption: true;
    options: true;
  };
}>;

type ScenarioResults = ReturnType<
  typeof buildSimulationRuntimeState
>['results'];

type ScenarioContext = {
  simulation: ScenarioSimulation;
  optionGroups: ScenarioOptionGroup[];
};

type OptionImpactDelta = {
  totalProjectCost: number;
  equityRequired: number;
  grossMargin: number;
  marginRate: number;
  grossYield: number;
  estimatedMonthlyPayment: number;
  monthlyCashDelta: number;
  projectDurationMonths: number;
  score: number;
};

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  return `${currencyFormatter.format(value)} €`;
}

function formatOptionValue(
  type: SimulationOptionGroupType,
  valueJson: Prisma.JsonValue,
) {
  if (!valueJson || typeof valueJson !== 'object' || Array.isArray(valueJson)) {
    return '—';
  }

  const record = valueJson as Record<string, unknown>;

  if (type === SimulationOptionGroupType.PURCHASE_PRICE) {
    const value = toNumber(record.price as number | string | null | undefined);
    return formatCurrency(value);
  }

  if (type === SimulationOptionGroupType.WORK_BUDGET) {
    const parts: string[] = [];
    const rawValue = record.cost as number | string | null | undefined;
    const value =
      rawValue === null || rawValue === undefined ? null : toNumber(rawValue);

    if (value !== null) {
      parts.push(formatCurrency(value));
    }

    const durationMonths =
      typeof record.durationMonths === 'number'
        ? record.durationMonths
        : typeof record.durationMonths === 'string'
          ? Number(record.durationMonths)
          : null;

    if (durationMonths) {
      parts.push(`${durationMonths} mois`);
    }

    return parts.join(' • ') || '—';
  }

  if (type === SimulationOptionGroupType.FINANCING) {
    const parts: string[] = [];

    if (record.mode === 'CASH') {
      parts.push('Cash');
    }

    if (record.mode === 'LOAN') {
      parts.push('Crédit');
    }

    const rate = toNumber(record.rate as number | string | null | undefined);
    if (rate !== null) {
      parts.push(`${rate} %`);
    }

    const durationMonths =
      typeof record.durationMonths === 'number'
        ? record.durationMonths
        : typeof record.durationMonths === 'string'
          ? Number(record.durationMonths)
          : null;

    if (durationMonths) {
      parts.push(`${durationMonths} mois`);
    }

    const loanAmount = toNumber(
      record.loanAmount as number | string | null | undefined,
    );
    if (loanAmount !== null && loanAmount > 0) {
      parts.push(formatCurrency(loanAmount));
    }

    return parts.join(' • ') || '—';
  }

  return '—';
}

@Injectable()
export class SimulationOptionsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(input: CreateOptionGroupInput) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: input.simulationId },
      select: { organizationId: true },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    if (simulation.organizationId !== input.organizationId) {
      throw new ForbiddenException('Access denied to this simulation');
    }

    const existing = await this.prisma.simulationOptionGroup.findUnique({
      where: {
        simulationId_type: {
          simulationId: input.simulationId,
          type: input.type,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `A group of type ${input.type} already exists for this simulation`,
      );
    }

    return this.prisma.simulationOptionGroup.create({
      data: {
        organizationId: input.organizationId,
        simulationId: input.simulationId,
        type: input.type,
        label: input.label,
      },
      include: {
        options: true,
        activeOption: true,
      },
    });
  }

  async createOption(input: CreateOptionInput) {
    const group = await this.prisma.simulationOptionGroup.findUnique({
      where: { id: input.groupId },
      select: { organizationId: true, simulationId: true },
    });

    if (!group) {
      throw new NotFoundException('Option group not found');
    }

    if (group.organizationId !== input.organizationId) {
      throw new ForbiddenException('Access denied to this option group');
    }

    if (input.sourceEventId) {
      const event = await this.prisma.opportunityEvent.findUnique({
        where: { id: input.sourceEventId },
        select: { simulationId: true, organizationId: true },
      });

      if (!event) {
        throw new NotFoundException('Source event not found');
      }

      if (event.organizationId !== input.organizationId) {
        throw new ForbiddenException('Access denied to source event');
      }

      if (event.simulationId !== group.simulationId) {
        throw new BadRequestException(
          'Source event must belong to the same simulation',
        );
      }
    }

    return this.prisma.simulationOption.create({
      data: {
        organizationId: input.organizationId,
        groupId: input.groupId,
        label: input.label,
        valueJson: input.valueJson as Prisma.InputJsonValue,
        source: input.source || SimulationOptionSource.MANUAL,
        sourceEventId: input.sourceEventId,
        isActive: false,
      },
      include: {
        sourceEvent: true,
      },
    });
  }

  async activateOption(input: ActivateOptionInput) {
    const option = await this.prisma.simulationOption.findUnique({
      where: { id: input.optionId },
      include: {
        group: {
          select: {
            id: true,
            simulationId: true,
          },
        },
      },
    });

    if (!option) {
      throw new NotFoundException('Option not found');
    }

    if (option.organizationId !== input.organizationId) {
      throw new ForbiddenException('Access denied to this option');
    }

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.simulationOptionGroup.findUnique({
        where: { id: option.group.id },
        select: {
          activeOptionId: true,
        },
      });

      if (!group) {
        throw new NotFoundException('Option group not found');
      }

      if (group.activeOptionId === input.optionId) {
        return tx.simulationOption.findUniqueOrThrow({
          where: { id: input.optionId },
        });
      }

      await tx.simulationOption.updateMany({
        where: {
          organizationId: input.organizationId,
          groupId: option.group.id,
        },
        data: { isActive: false },
      });

      const activated = await tx.simulationOption.update({
        where: { id: input.optionId },
        data: { isActive: true },
      });

      await tx.simulationOptionGroup.update({
        where: { id: option.group.id },
        data: { activeOptionId: input.optionId },
      });

      await tx.simulationOptionActivationLog.create({
        data: {
          organizationId: input.organizationId,
          simulationId: option.group.simulationId,
          optionGroupId: option.group.id,
          previousOptionId: group.activeOptionId,
          newOptionId: input.optionId,
          activatedByUserId: input.activatedByUserId,
        },
      });

      return activated;
    });
  }

  async getGroupsForSimulation(organizationId: string, simulationId: string) {
    await this.assertSimulationAccess(organizationId, simulationId);

    return this.prisma.simulationOptionGroup.findMany({
      where: {
        organizationId,
        simulationId,
      },
      include: {
        options: {
          include: {
            sourceEvent: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        activeOption: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getActivationHistory(organizationId: string, simulationId: string) {
    const context = await this.loadSimulationContext(
      organizationId,
      simulationId,
    );

    const logs = await this.prisma.simulationOptionActivationLog.findMany({
      where: {
        organizationId,
        simulationId,
      },
      include: {
        optionGroup: {
          select: {
            id: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (logs.length === 0) {
      return [];
    }

    const optionIds = Array.from(
      new Set(
        logs.flatMap((log) =>
          [log.previousOptionId, log.newOptionId].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      ),
    );
    const userIds = Array.from(
      new Set(logs.map((log) => log.activatedByUserId)),
    );

    const [options, users] = await Promise.all([
      optionIds.length === 0
        ? Promise.resolve([])
        : this.prisma.simulationOption.findMany({
            where: {
              organizationId,
              id: {
                in: optionIds,
              },
            },
            select: {
              id: true,
              label: true,
              valueJson: true,
              groupId: true,
            },
          }),
      userIds.length === 0
        ? Promise.resolve([])
        : this.prisma.user.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          }),
    ]);

    const optionById = new Map(options.map((option) => [option.id, option]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const activeOptionIdsByGroup = new Map<string, string | null>();

    const history = logs.map((log) => {
      const previousState = new Map(activeOptionIdsByGroup);
      previousState.set(log.optionGroupId, log.previousOptionId ?? null);

      const nextState = new Map(previousState);
      nextState.set(log.optionGroupId, log.newOptionId);

      const beforeResults = this.buildScenarioResults(
        context.simulation,
        this.withActiveOptionIds(context.optionGroups, previousState),
      );
      const afterResults = this.buildScenarioResults(
        context.simulation,
        this.withActiveOptionIds(context.optionGroups, nextState),
      );

      activeOptionIdsByGroup.clear();
      nextState.forEach((value, key) => {
        activeOptionIdsByGroup.set(key, value);
      });

      const previousOption = log.previousOptionId
        ? (optionById.get(log.previousOptionId) ?? null)
        : null;
      const newOption = optionById.get(log.newOptionId) ?? null;
      const user = userById.get(log.activatedByUserId) ?? null;

      return {
        groupType: log.optionGroup.type,
        previous: this.getHistoryOptionLabel(
          log.optionGroup.type,
          context.simulation,
          previousOption,
        ),
        next: this.getHistoryOptionLabel(
          log.optionGroup.type,
          context.simulation,
          newOption,
        ),
        delta: {
          totalProjectCost:
            afterResults.metrics.totalProjectCost -
            beforeResults.metrics.totalProjectCost,
          margin:
            (afterResults.metrics.grossMargin ?? 0) -
            (beforeResults.metrics.grossMargin ?? 0),
          monthlyPayment:
            (afterResults.metrics.estimatedMonthlyPayment ?? 0) -
            (beforeResults.metrics.estimatedMonthlyPayment ?? 0),
          projectDurationMonths:
            (afterResults.metrics.projectDurationMonths ?? 0) -
            (beforeResults.metrics.projectDurationMonths ?? 0),
          score: afterResults.decision.score - beforeResults.decision.score,
        },
        createdAt: log.createdAt,
        user: {
          id: log.activatedByUserId,
          displayName: this.getUserDisplayName(user),
          email: user?.email ?? null,
        },
      };
    });

    return history.reverse();
  }

  async getGroupComparison(
    organizationId: string,
    simulationId: string,
    groupId: string,
  ) {
    const context = await this.loadSimulationContext(
      organizationId,
      simulationId,
    );
    const group = context.optionGroups.find((item) => item.id === groupId);

    if (!group) {
      throw new NotFoundException('Option group not found');
    }

    const baseResults = this.buildScenarioResults(
      context.simulation,
      context.optionGroups,
    );

    const activeOptionId = group.activeOptionId ?? null;
    const orderedOptions = [...group.options].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );

    return orderedOptions.map((option) => {
      const results =
        option.id === activeOptionId
          ? baseResults
          : this.buildScenarioResults(
              context.simulation,
              this.withGroupOverride(context.optionGroups, group.id, option.id),
            );

      return {
        optionId: option.id,
        label: option.label,
        metrics: results.metrics,
        deltaVsActive: this.buildDelta(baseResults, results),
      };
    });
  }

  async deleteOption(organizationId: string, optionId: string) {
    const option = await this.prisma.simulationOption.findUnique({
      where: { id: optionId },
      include: { group: true },
    });

    if (!option) {
      throw new NotFoundException('Option not found');
    }

    if (option.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this option');
    }

    if (option.isActive) {
      await this.prisma.simulationOptionGroup.update({
        where: { id: option.groupId },
        data: { activeOptionId: null },
      });
    }

    await this.prisma.simulationOption.delete({
      where: { id: optionId },
    });

    return { success: true };
  }

  async getActiveOption(
    organizationId: string,
    simulationId: string,
    type: SimulationOptionGroupType,
  ) {
    const group = await this.prisma.simulationOptionGroup.findUnique({
      where: {
        simulationId_type: {
          simulationId,
          type,
        },
      },
      include: {
        activeOption: true,
      },
    });

    if (!group) {
      return null;
    }

    if (group.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this option group');
    }

    return group.activeOption;
  }

  async simulateWithOptionOverride(
    organizationId: string,
    simulationId: string,
    optionId: string,
  ) {
    const context = await this.loadSimulationContext(
      organizationId,
      simulationId,
    );
    const optionToSimulate = context.optionGroups
      .flatMap((group) => group.options)
      .find((option) => option.id === optionId);

    if (!optionToSimulate) {
      const option = await this.prisma.simulationOption.findUnique({
        where: { id: optionId },
        include: {
          group: {
            select: {
              simulationId: true,
              organizationId: true,
            },
          },
        },
      });

      if (!option) {
        throw new NotFoundException('Option not found');
      }

      if (option.organizationId !== organizationId) {
        throw new ForbiddenException('Access denied to this option');
      }

      if (option.group.simulationId !== simulationId) {
        throw new BadRequestException(
          'Option does not belong to this simulation',
        );
      }

      throw new NotFoundException('Option group not found');
    }

    const group = context.optionGroups.find(
      (item) => item.id === optionToSimulate.groupId,
    );

    if (!group) {
      throw new NotFoundException('Option group not found');
    }

    const baseResults = this.buildScenarioResults(
      context.simulation,
      context.optionGroups,
    );
    const simulatedResults = this.buildScenarioResults(
      context.simulation,
      this.withGroupOverride(
        context.optionGroups,
        group.id,
        optionToSimulate.id,
      ),
    );

    return {
      base: {
        metrics: baseResults.metrics,
        decision: baseResults.decision,
      },
      simulated: {
        metrics: simulatedResults.metrics,
        decision: simulatedResults.decision,
      },
      delta: this.buildDelta(baseResults, simulatedResults),
    };
  }

  private async assertSimulationAccess(
    organizationId: string,
    simulationId: string,
  ) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
      select: { organizationId: true },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    if (simulation.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this simulation');
    }
  }

  private async loadSimulationContext(
    organizationId: string,
    simulationId: string,
  ): Promise<ScenarioContext> {
    await this.assertSimulationAccess(organizationId, simulationId);

    const simulation = await this.prisma.simulation.findUnique({
      where: {
        id: simulationId,
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
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    const optionGroups = await this.prisma.simulationOptionGroup.findMany({
      where: {
        organizationId,
        simulationId,
      },
      include: {
        activeOption: true,
        options: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      simulation,
      optionGroups,
    };
  }

  private buildScenarioResults(
    simulation: ScenarioSimulation,
    optionGroups: ScenarioOptionGroup[],
  ): ScenarioResults {
    return buildSimulationRuntimeState(
      simulation,
      simulation.workItems,
      simulation.lots,
      optionGroups,
    ).results;
  }

  private buildDelta(
    baseResults: ScenarioResults,
    comparedResults: ScenarioResults,
  ): OptionImpactDelta {
    return {
      totalProjectCost:
        comparedResults.metrics.totalProjectCost -
        baseResults.metrics.totalProjectCost,
      equityRequired:
        comparedResults.metrics.equityRequired -
        baseResults.metrics.equityRequired,
      grossMargin:
        (comparedResults.metrics.grossMargin ?? 0) -
        (baseResults.metrics.grossMargin ?? 0),
      marginRate:
        (comparedResults.metrics.marginRate ?? 0) -
        (baseResults.metrics.marginRate ?? 0),
      grossYield:
        (comparedResults.metrics.grossYield ?? 0) -
        (baseResults.metrics.grossYield ?? 0),
      estimatedMonthlyPayment:
        (comparedResults.metrics.estimatedMonthlyPayment ?? 0) -
        (baseResults.metrics.estimatedMonthlyPayment ?? 0),
      monthlyCashDelta:
        (comparedResults.metrics.monthlyCashDelta ?? 0) -
        (baseResults.metrics.monthlyCashDelta ?? 0),
      projectDurationMonths:
        (comparedResults.metrics.projectDurationMonths ?? 0) -
        (baseResults.metrics.projectDurationMonths ?? 0),
      score: comparedResults.decision.score - baseResults.decision.score,
    };
  }

  private withGroupOverride(
    optionGroups: ScenarioOptionGroup[],
    groupId: string,
    optionId: string,
  ) {
    return optionGroups.map((group) => {
      if (group.id !== groupId) {
        return group;
      }

      const activeOption =
        group.options.find((option) => option.id === optionId) ?? null;

      if (!activeOption) {
        throw new NotFoundException('Option not found in this group');
      }

      return {
        ...group,
        activeOptionId: activeOption.id,
        activeOption,
      };
    });
  }

  private withActiveOptionIds(
    optionGroups: ScenarioOptionGroup[],
    activeOptionIdsByGroup: Map<string, string | null>,
  ) {
    return optionGroups.map((group) => {
      const activeOptionId = activeOptionIdsByGroup.get(group.id) ?? null;
      const activeOption = activeOptionId
        ? (group.options.find((option) => option.id === activeOptionId) ?? null)
        : null;

      return {
        ...group,
        activeOptionId,
        activeOption,
      };
    });
  }

  private getHistoryOptionLabel(
    groupType: SimulationOptionGroupType,
    simulation: ScenarioSimulation,
    option: {
      label: string;
      valueJson: Prisma.JsonValue;
    } | null,
  ) {
    if (!option) {
      return this.getInitialValueLabel(groupType, simulation);
    }

    const formattedValue = formatOptionValue(groupType, option.valueJson);
    if (formattedValue === '—') {
      return option.label;
    }

    return `${option.label} - ${formattedValue}`;
  }

  private getInitialValueLabel(
    groupType: SimulationOptionGroupType,
    simulation: ScenarioSimulation,
  ) {
    if (groupType === SimulationOptionGroupType.PURCHASE_PRICE) {
      return `Valeur initiale - ${formatCurrency(
        toNumber(simulation.purchasePrice),
      )}`;
    }

    if (groupType === SimulationOptionGroupType.WORK_BUDGET) {
      return `Valeur initiale - ${formatCurrency(
        toNumber(simulation.worksBudget),
      )}`;
    }

    if (groupType === SimulationOptionGroupType.FINANCING) {
      const parts: string[] = [];

      parts.push(simulation.financingMode === 'CASH' ? 'Cash' : 'Crédit');

      const rate = toNumber(simulation.interestRate);
      if (rate !== null) {
        parts.push(`${rate} %`);
      }

      if (simulation.loanDurationMonths) {
        parts.push(`${simulation.loanDurationMonths} mois`);
      }

      return `Valeur initiale - ${parts.join(' • ')}`;
    }

    return 'Valeur initiale';
  }

  private getUserDisplayName(
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null,
  ) {
    if (!user) {
      return 'Utilisateur inconnu';
    }

    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || user.email;
  }
}
