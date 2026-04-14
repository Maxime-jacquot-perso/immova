import { Injectable } from '@nestjs/common';
import {
  type DecisionStatus,
  Prisma,
  ProjectStatus,
  type SimulationStrategy,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildProjectForecastComparison } from '../projects/project-forecast.util';
import {
  buildProjectInsights,
  getAlertSeverityRank,
} from '../projects/project-metrics.util';
import { buildDashboardDriftsPayload } from './dashboard-drifts.util';

function projectHref(projectId: string) {
  return `/projects/${projectId}`;
}

function expenseHref(projectId: string) {
  return `/projects/${projectId}/expenses`;
}

function documentHref(projectId: string) {
  return `/projects/${projectId}/documents`;
}

function hasBeenUpdated(createdAt: Date, updatedAt: Date) {
  return Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60_000;
}

function compareGrossYieldDesc(left: number | null, right: number | null) {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return right - left;
}

type NumericValue = Prisma.Decimal | number | string | null | undefined;

function buildDashboardProjectForecastComparison(project: {
  purchasePrice: NumericValue;
  notaryFees: NumericValue;
  acquisitionFees: NumericValue;
  worksBudget: NumericValue;
  lots: Array<{
    status: string;
    surface: NumericValue;
    estimatedRent: NumericValue;
  }>;
  expenses: Array<{
    category: string;
    amountTtc: NumericValue;
  }>;
  forecastSnapshot: {
    referenceDate: Date;
    strategy: SimulationStrategy;
    purchasePrice: NumericValue;
    acquisitionCost: NumericValue;
    bufferAmount: NumericValue;
    worksBudget: NumericValue;
    totalProjectCost: NumericValue;
    targetMonthlyRent: NumericValue;
    grossYield: NumericValue;
    equityRequired: NumericValue;
    grossMargin: NumericValue;
    decisionScore: number | null;
    decisionStatus: DecisionStatus | null;
    recommendation: string | null;
    lotsCount: number;
    lotsJson: Prisma.JsonValue | null;
    simulation: {
      id: string;
      name: string;
    };
  } | null;
}) {
  return buildProjectForecastComparison({
    project: {
      purchasePrice: project.purchasePrice,
      notaryFees: project.notaryFees,
      acquisitionFees: project.acquisitionFees,
      worksBudget: project.worksBudget,
      lots: project.lots,
      expenses: project.expenses,
    },
    snapshot: project.forecastSnapshot
      ? {
          referenceDate: project.forecastSnapshot.referenceDate,
          strategy: project.forecastSnapshot.strategy,
          purchasePrice: project.forecastSnapshot.purchasePrice,
          acquisitionCost: project.forecastSnapshot.acquisitionCost,
          bufferAmount: project.forecastSnapshot.bufferAmount,
          worksBudget: project.forecastSnapshot.worksBudget,
          totalProjectCost: project.forecastSnapshot.totalProjectCost,
          targetMonthlyRent: project.forecastSnapshot.targetMonthlyRent,
          grossYield: project.forecastSnapshot.grossYield,
          equityRequired: project.forecastSnapshot.equityRequired,
          grossMargin: project.forecastSnapshot.grossMargin,
          decisionScore: project.forecastSnapshot.decisionScore,
          decisionStatus: project.forecastSnapshot.decisionStatus,
          recommendation: project.forecastSnapshot.recommendation,
          lotsCount: project.forecastSnapshot.lotsCount,
          lotsJson: project.forecastSnapshot.lotsJson as Array<{
            name: string;
            type: string;
            surface: number | null;
            estimatedRent: number | null;
            notes: string | null;
          }> | null,
          simulation: project.forecastSnapshot.simulation,
        }
      : null,
  });
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        purchasePrice: true,
        notaryFees: true,
        acquisitionFees: true,
        worksBudget: true,
        createdAt: true,
        updatedAt: true,
        lots: {
          select: {
            id: true,
            name: true,
            status: true,
            surface: true,
            estimatedRent: true,
          },
        },
        expenses: {
          select: {
            id: true,
            invoiceNumber: true,
            amountTtc: true,
            category: true,
            vendorName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const activeProjects = projects.filter(
      (project) => project.status !== ProjectStatus.ARCHIVED,
    );

    const projectSnapshots = activeProjects.map((project) => ({
      ...project,
      ...buildProjectInsights(project),
    }));

    const alerts = projectSnapshots
      .flatMap((project) =>
        project.alerts.map((alert) => ({
          type: alert.type,
          severity: alert.severity,
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
          },
          message: alert.message,
          href: projectHref(project.id),
          projectCompletenessScore: project.completeness.score,
          updatedAt: project.updatedAt,
        })),
      )
      .sort((left, right) => {
        if (
          getAlertSeverityRank(right.severity) !==
          getAlertSeverityRank(left.severity)
        ) {
          return (
            getAlertSeverityRank(right.severity) -
            getAlertSeverityRank(left.severity)
          );
        }

        if (left.projectCompletenessScore !== right.projectCompletenessScore) {
          return left.projectCompletenessScore - right.projectCompletenessScore;
        }

        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })
      .slice(0, 8)
      .map((alert) => ({
        type: alert.type,
        severity: alert.severity,
        project: alert.project,
        message: alert.message,
        href: alert.href,
      }));

    const watchlist = [...projectSnapshots]
      .sort((left, right) => {
        const leftMaxSeverity = left.alerts[0]?.severity ?? 'info';
        const rightMaxSeverity = right.alerts[0]?.severity ?? 'info';

        if (
          getAlertSeverityRank(rightMaxSeverity) !==
          getAlertSeverityRank(leftMaxSeverity)
        ) {
          return (
            getAlertSeverityRank(rightMaxSeverity) -
            getAlertSeverityRank(leftMaxSeverity)
          );
        }

        if (left.completeness.score !== right.completeness.score) {
          return left.completeness.score - right.completeness.score;
        }

        if (right.alerts.length !== left.alerts.length) {
          return right.alerts.length - left.alerts.length;
        }

        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })
      .map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        totalCostToDate: project.metrics.totalCostToDate,
        estimatedRentTotal: project.metrics.estimatedRentTotal,
        grossYieldEstimated: project.metrics.grossYieldEstimated,
        completeness: project.completeness,
        decisionStatus: project.decisionStatus,
        highestAlertSeverity: project.alerts[0]?.severity ?? null,
        alertCount: project.alerts.length,
        alerts: project.alerts,
        suggestions: project.suggestions,
        alertTypes: project.alerts.map((alert) => alert.type),
        updatedAt: project.updatedAt,
        href: projectHref(project.id),
      }));

    const comparison = [...projectSnapshots]
      .sort((left, right) => {
        const leftHasCriticalAlert = left.alerts.some(
          (alert) => alert.severity === 'critical',
        );
        const rightHasCriticalAlert = right.alerts.some(
          (alert) => alert.severity === 'critical',
        );

        if (rightHasCriticalAlert !== leftHasCriticalAlert) {
          return Number(rightHasCriticalAlert) - Number(leftHasCriticalAlert);
        }

        if (left.completeness.score !== right.completeness.score) {
          return left.completeness.score - right.completeness.score;
        }

        const yieldComparison = compareGrossYieldDesc(
          left.metrics.grossYieldEstimated,
          right.metrics.grossYieldEstimated,
        );

        if (yieldComparison !== 0) {
          return yieldComparison;
        }

        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })
      .map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        totalCostToDate: project.metrics.totalCostToDate,
        estimatedRentTotal: project.metrics.estimatedRentTotal,
        grossYieldEstimated: project.metrics.grossYieldEstimated,
        completeness: project.completeness,
        decisionStatus: project.decisionStatus,
        href: projectHref(project.id),
      }));

    const recentActivity = [
      ...activeProjects.map((project) => ({
        type: 'project' as const,
        label: hasBeenUpdated(project.createdAt, project.updatedAt)
          ? `Projet mis a jour : ${project.name}`
          : `Projet cree : ${project.name}`,
        date: hasBeenUpdated(project.createdAt, project.updatedAt)
          ? project.updatedAt
          : project.createdAt,
        project: {
          id: project.id,
          name: project.name,
        },
        href: projectHref(project.id),
      })),
      ...activeProjects.flatMap((project) =>
        project.expenses.map((expense) => ({
          type: 'expense' as const,
          label: hasBeenUpdated(expense.createdAt, expense.updatedAt)
            ? `Depense mise a jour : ${expense.invoiceNumber || expense.vendorName || 'Sans libelle'}`
            : `Depense enregistree : ${expense.invoiceNumber || expense.vendorName || 'Sans libelle'}`,
          date: hasBeenUpdated(expense.createdAt, expense.updatedAt)
            ? expense.updatedAt
            : expense.createdAt,
          project: {
            id: project.id,
            name: project.name,
          },
          href: expenseHref(project.id),
        })),
      ),
      ...activeProjects.flatMap((project) =>
        project.documents.map((document) => ({
          type: 'document' as const,
          label: hasBeenUpdated(document.createdAt, document.updatedAt)
            ? `Document mis a jour : ${document.title}`
            : `Document ajoute : ${document.title}`,
          date: hasBeenUpdated(document.createdAt, document.updatedAt)
            ? document.updatedAt
            : document.createdAt,
          project: {
            id: project.id,
            name: project.name,
          },
          href: documentHref(project.id),
        })),
      ),
    ]
      .sort((left, right) => right.date.getTime() - left.date.getTime())
      .slice(0, 8);

    return {
      summary: {
        activeProjectsCount: activeProjects.length,
        archivedProjectsCount: projects.length - activeProjects.length,
        nonArchivedLotsCount: projectSnapshots.reduce(
          (sum, project) => sum + project.metrics.lotsCount,
          0,
        ),
        totalExpensesAmount: projectSnapshots.reduce(
          (sum, project) => sum + project.metrics.totalExpenses,
          0,
        ),
        estimatedMonthlyRentTotal: projectSnapshots.reduce(
          (sum, project) => sum + project.metrics.estimatedRentTotal,
          0,
        ),
      },
      alerts,
      watchlist,
      comparison,
      recentActivity,
    };
  }

  async getDashboardDrifts(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        status: {
          not: ProjectStatus.ARCHIVED,
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        purchasePrice: true,
        notaryFees: true,
        acquisitionFees: true,
        worksBudget: true,
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
        forecastSnapshot: {
          select: {
            referenceDate: true,
            strategy: true,
            purchasePrice: true,
            acquisitionCost: true,
            bufferAmount: true,
            worksBudget: true,
            totalProjectCost: true,
            targetMonthlyRent: true,
            grossYield: true,
            equityRequired: true,
            grossMargin: true,
            decisionScore: true,
            decisionStatus: true,
            recommendation: true,
            lotsCount: true,
            lotsJson: true,
            simulation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return buildDashboardDriftsPayload({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt,
        forecastComparison: buildDashboardProjectForecastComparison(project),
      })),
    });
  }
}
