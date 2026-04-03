import { type DecisionStatus } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import {
  calculateProjectMetrics,
  type ProjectAlert,
} from './project-metrics.util';

type DecimalLike = {
  toNumber(): number;
};

type NumericValue = DecimalLike | number | string | null | undefined;

type ForecastSnapshotLot = {
  name: string;
  type: string;
  surface: number | null;
  estimatedRent: number | null;
  notes: string | null;
};

type ForecastComparisonProject = {
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
};

type ForecastSnapshot = {
  referenceDate: Date;
  strategy: 'FLIP' | 'RENTAL';
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
  lotsJson: ForecastSnapshotLot[] | null;
  simulation: {
    id: string;
    name: string;
  };
};

export type ForecastMetricStatus =
  | 'neutral'
  | 'watch'
  | 'drift'
  | 'unavailable';

export type ForecastMetric = {
  key: string;
  label: string;
  unit: 'currency' | 'count' | 'percent';
  forecastValue: number | null;
  actualValue: number | null;
  deltaValue: number | null;
  deltaPercent: number | null;
  status: ForecastMetricStatus;
  actualLabel: string;
  note?: string;
};

export type ForecastUnavailableMetric = {
  key: string;
  label: string;
  reason: string;
};

export type ProjectForecastComparison = {
  available: boolean;
  reason?: string;
  reference?: {
    conversionDate: Date;
    simulationId: string;
    simulationName: string;
    strategy: 'FLIP' | 'RENTAL';
    recommendation: string | null;
    decisionScore: number | null;
    decisionStatus: DecisionStatus | null;
  };
  metrics: ForecastMetric[];
  alerts: ProjectAlert[];
  unavailableMetrics: ForecastUnavailableMetric[];
  snapshotLots: ForecastSnapshotLot[];
};

const FORECAST_VARIANCE_THRESHOLDS = {
  negative: {
    watchRatio: 0.05,
    driftRatio: 0.1,
  },
  positive: {
    watchRatio: 0.1,
    driftRatio: 0.15,
  },
};

function computeDeltaPercent(
  forecastValue: number | null,
  actualValue: number | null,
) {
  if (forecastValue === null || actualValue === null || forecastValue === 0) {
    return null;
  }

  return ((actualValue - forecastValue) / forecastValue) * 100;
}

function buildNegativeVarianceMetric(input: {
  key: string;
  label: string;
  unit: 'currency' | 'percent';
  forecastValue: number | null;
  actualValue: number | null;
  actualLabel: string;
  note?: string;
}) {
  const deltaValue =
    input.forecastValue !== null && input.actualValue !== null
      ? input.actualValue - input.forecastValue
      : null;
  const deltaPercent = computeDeltaPercent(
    input.forecastValue,
    input.actualValue,
  );

  let status: ForecastMetricStatus = 'unavailable';

  if (input.forecastValue !== null && input.actualValue !== null) {
    if ((deltaValue ?? 0) <= 0) {
      status = 'neutral';
    } else if (
      deltaPercent !== null &&
      deltaPercent / 100 >= FORECAST_VARIANCE_THRESHOLDS.negative.driftRatio
    ) {
      status = 'drift';
    } else if (
      deltaPercent !== null &&
      deltaPercent / 100 >= FORECAST_VARIANCE_THRESHOLDS.negative.watchRatio
    ) {
      status = 'watch';
    } else {
      status = 'neutral';
    }
  }

  return {
    ...input,
    deltaValue,
    deltaPercent,
    status,
  } satisfies ForecastMetric;
}

function buildPositiveVarianceMetric(input: {
  key: string;
  label: string;
  unit: 'currency' | 'percent';
  forecastValue: number | null;
  actualValue: number | null;
  actualLabel: string;
  note?: string;
}) {
  const deltaValue =
    input.forecastValue !== null && input.actualValue !== null
      ? input.actualValue - input.forecastValue
      : null;
  const deltaPercent = computeDeltaPercent(
    input.forecastValue,
    input.actualValue,
  );

  let status: ForecastMetricStatus = 'unavailable';

  if (input.forecastValue !== null && input.actualValue !== null) {
    if ((deltaValue ?? 0) >= 0) {
      status = 'neutral';
    } else if (
      deltaPercent !== null &&
      Math.abs(deltaPercent) / 100 >=
        FORECAST_VARIANCE_THRESHOLDS.positive.driftRatio
    ) {
      status = 'drift';
    } else if (
      deltaPercent !== null &&
      Math.abs(deltaPercent) / 100 >=
        FORECAST_VARIANCE_THRESHOLDS.positive.watchRatio
    ) {
      status = 'watch';
    } else {
      status = 'neutral';
    }
  }

  return {
    ...input,
    deltaValue,
    deltaPercent,
    status,
  } satisfies ForecastMetric;
}

function buildLotsCountMetric(
  forecastLotsCount: number,
  actualLotsCount: number,
) {
  const deltaValue = actualLotsCount - forecastLotsCount;
  const absoluteDelta = Math.abs(deltaValue);

  let status: ForecastMetricStatus = 'neutral';

  if (absoluteDelta >= 2 || (forecastLotsCount > 0 && actualLotsCount === 0)) {
    status = 'drift';
  } else if (absoluteDelta >= 1) {
    status = 'watch';
  }

  return {
    key: 'lotsCount',
    label: 'Nombre de lots',
    unit: 'count',
    forecastValue: forecastLotsCount,
    actualValue: actualLotsCount,
    deltaValue,
    deltaPercent: computeDeltaPercent(forecastLotsCount, actualLotsCount),
    status,
    actualLabel: 'Lots non archives du projet',
  } satisfies ForecastMetric;
}

function buildComparableProjectForecastMetrics(input: {
  project: ForecastComparisonProject;
  snapshot: ForecastSnapshot;
}) {
  const projectMetrics = calculateProjectMetrics({
    name: 'project',
    purchasePrice: input.project.purchasePrice,
    notaryFees: input.project.notaryFees,
    acquisitionFees: input.project.acquisitionFees,
    worksBudget: input.project.worksBudget,
    lots: input.project.lots,
    expenses: input.project.expenses,
  });
  const bufferAmount = toNumber(input.snapshot.bufferAmount) ?? 0;
  const comparableWorksCommitment =
    projectMetrics.worksBudget !== null
      ? Math.max(projectMetrics.worksBudget, projectMetrics.worksExpenses)
      : projectMetrics.worksExpenses > 0
        ? projectMetrics.worksExpenses
        : null;
  const comparableTotalProjectCost =
    comparableWorksCommitment === null
      ? null
      : projectMetrics.acquisitionCost +
        comparableWorksCommitment +
        bufferAmount;
  const comparableMonthlyRent =
    projectMetrics.estimatedRentTotal > 0
      ? projectMetrics.estimatedRentTotal
      : null;
  const comparableGrossYield =
    comparableTotalProjectCost !== null &&
    comparableTotalProjectCost > 0 &&
    comparableMonthlyRent !== null
      ? (comparableMonthlyRent * 12 * 100) / comparableTotalProjectCost
      : null;

  return {
    ...projectMetrics,
    bufferAmount,
    comparableWorksCommitment,
    comparableTotalProjectCost,
    comparableMonthlyRent,
    comparableGrossYield,
  };
}

function buildForecastAlerts(metrics: ForecastMetric[]) {
  const alerts: ProjectAlert[] = [];

  const worksMetric = metrics.find((metric) => metric.key === 'worksBudget');
  if (worksMetric?.status === 'watch' || worksMetric?.status === 'drift') {
    alerts.push({
      type: 'FORECAST_WORKS_BUDGET_DRIFT',
      severity: worksMetric.status === 'drift' ? 'critical' : 'warning',
      message:
        worksMetric.status === 'drift'
          ? 'Les depenses travaux engagees depassent nettement le budget previsionnel.'
          : 'Les depenses travaux commencent a depasser le budget previsionnel.',
    });
  }

  const totalCostMetric = metrics.find(
    (metric) => metric.key === 'totalProjectCost',
  );
  if (
    totalCostMetric?.status === 'watch' ||
    totalCostMetric?.status === 'drift'
  ) {
    alerts.push({
      type: 'FORECAST_TOTAL_COST_DRIFT',
      severity: totalCostMetric.status === 'drift' ? 'critical' : 'warning',
      message:
        totalCostMetric.status === 'drift'
          ? 'Le cout total recalcule sur la fiche projet depasse fortement le previsionnel initial.'
          : 'Le cout total recalcule sur la fiche projet commence a sortir du previsionnel initial.',
    });
  }

  const lotsMetric = metrics.find((metric) => metric.key === 'lotsCount');
  if (lotsMetric && lotsMetric.status !== 'neutral') {
    alerts.push({
      type: 'FORECAST_LOTS_COUNT_MISMATCH',
      severity: lotsMetric.status === 'drift' ? 'critical' : 'warning',
      message:
        'Le nombre de lots reels ne correspond plus au plan prepare dans la simulation.',
    });
  }

  const rentMetric = metrics.find((metric) => metric.key === 'monthlyRent');
  if (rentMetric?.status === 'watch' || rentMetric?.status === 'drift') {
    alerts.push({
      type: 'FORECAST_RENT_SHORTFALL',
      severity: rentMetric.status === 'drift' ? 'critical' : 'warning',
      message:
        "Les loyers estimes saisis aujourd'hui restent en dessous du previsionnel initial.",
    });
  }

  const yieldMetric = metrics.find((metric) => metric.key === 'grossYield');
  if (yieldMetric?.status === 'watch' || yieldMetric?.status === 'drift') {
    alerts.push({
      type: 'FORECAST_YIELD_SHORTFALL',
      severity: yieldMetric.status === 'drift' ? 'critical' : 'warning',
      message:
        'Le rendement brut recalcule sur le projet est inferieur au rendement previsionnel.',
    });
  }

  return alerts;
}

export function buildProjectForecastComparison(input: {
  project: ForecastComparisonProject;
  snapshot: ForecastSnapshot | null;
}): ProjectForecastComparison {
  if (!input.snapshot) {
    return {
      available: false,
      reason:
        "Aucun snapshot previsionnel n'est disponible pour ce projet. Les projets crees hors conversion ou convertis avant cette V1 restent donc sans comparaison fiable.",
      metrics: [],
      alerts: [],
      unavailableMetrics: [],
      snapshotLots: [],
    };
  }

  const actualMetrics = buildComparableProjectForecastMetrics({
    project: input.project,
    snapshot: input.snapshot,
  });

  const snapshotLots =
    input.snapshot.lotsJson && Array.isArray(input.snapshot.lotsJson)
      ? input.snapshot.lotsJson
      : [];

  const metrics: ForecastMetric[] = [
    buildNegativeVarianceMetric({
      key: 'acquisitionCost',
      label: "Cout d'acquisition",
      unit: 'currency',
      forecastValue: toNumber(input.snapshot.acquisitionCost),
      actualValue: actualMetrics.acquisitionCost,
      actualLabel: 'Fiche projet actuelle',
    }),
    buildNegativeVarianceMetric({
      key: 'worksBudget',
      label: 'Budget travaux',
      unit: 'currency',
      forecastValue: toNumber(input.snapshot.worksBudget),
      actualValue: actualMetrics.worksExpenses,
      actualLabel: 'Depenses travaux engagees',
      note: 'Comparaison basee sur les depenses travaux deja saisies.',
    }),
    buildNegativeVarianceMetric({
      key: 'totalProjectCost',
      label: 'Cout total',
      unit: 'currency',
      forecastValue: toNumber(input.snapshot.totalProjectCost),
      actualValue: actualMetrics.comparableTotalProjectCost,
      actualLabel: 'Cout total recalcule sur la fiche projet',
      note:
        actualMetrics.comparableTotalProjectCost === null
          ? 'Le cout total comparable reste indisponible tant qu aucun budget travaux ni aucune depense travaux exploitable n est renseigne.'
          : actualMetrics.bufferAmount > 0
            ? 'Le calcul reprend le plus prudent entre budget travaux actuel et depenses engagees, puis conserve le buffer de securite fige a la conversion.'
            : 'Le calcul reprend le plus prudent entre budget travaux actuel et depenses engagees.',
    }),
    buildLotsCountMetric(input.snapshot.lotsCount, actualMetrics.lotsCount),
    buildPositiveVarianceMetric({
      key: 'monthlyRent',
      label: 'Loyer mensuel',
      unit: 'currency',
      forecastValue: toNumber(input.snapshot.targetMonthlyRent),
      actualValue: actualMetrics.comparableMonthlyRent,
      actualLabel: 'Loyers estimes saisis',
      note:
        actualMetrics.comparableMonthlyRent !== null
          ? undefined
          : 'Non calculable tant qu aucun loyer estime exploitable n est renseigne.',
    }),
    buildPositiveVarianceMetric({
      key: 'grossYield',
      label: 'Rendement brut',
      unit: 'percent',
      forecastValue: toNumber(input.snapshot.grossYield),
      actualValue: actualMetrics.comparableGrossYield,
      actualLabel: 'Rendement recalcule',
      note:
        actualMetrics.comparableGrossYield === null
          ? 'Le rendement comparable reste indisponible tant que cout total actuel et loyers saisis sont insuffisants.'
          : undefined,
    }),
  ];

  const unavailableMetrics: ForecastUnavailableMetric[] = [];

  if (toNumber(input.snapshot.equityRequired) !== null) {
    unavailableMetrics.push({
      key: 'equityRequired',
      label: 'Capital mobilise reel',
      reason:
        "Le financement reel n'est pas encore structure dans le modele Project V1, donc l'ecart de capital mobilise n'est pas calculable proprement.",
    });
  }

  if (
    input.snapshot.strategy === 'FLIP' &&
    toNumber(input.snapshot.grossMargin) !== null
  ) {
    unavailableMetrics.push({
      key: 'grossMargin',
      label: 'Marge brute reelle',
      reason:
        "Le prix de sortie reel n'est pas encore stocke sur le projet, donc la marge reelle ne peut pas etre recalculee proprement.",
    });
  }

  if (input.snapshot.strategy === 'RENTAL') {
    unavailableMetrics.push({
      key: 'monthlyCashDelta',
      label: 'Effort mensuel reel',
      reason:
        "Le projet ne stocke pas encore le financement reel en cours de vie, donc l'effort mensuel reel reste hors scope de cette V1.",
    });
  }

  return {
    available: true,
    reference: {
      conversionDate: input.snapshot.referenceDate,
      simulationId: input.snapshot.simulation.id,
      simulationName: input.snapshot.simulation.name,
      strategy: input.snapshot.strategy,
      recommendation: input.snapshot.recommendation,
      decisionScore: input.snapshot.decisionScore,
      decisionStatus: input.snapshot.decisionStatus,
    },
    metrics,
    alerts: buildForecastAlerts(metrics),
    unavailableMetrics,
    snapshotLots,
  };
}
