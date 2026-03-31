import { ExpenseCategory, LotStatus } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';

type DecimalLike = {
  toNumber(): number;
};

type NumericValue = DecimalLike | number | string | null | undefined;

type ProjectMetricsLot = {
  status: string;
  surface: NumericValue;
  estimatedRent: NumericValue;
};

type ProjectMetricsExpense = {
  category: string;
  amountTtc: NumericValue;
};

type ProjectMetricsDocument = {
  id?: string;
};

type ProjectMetricsInput = {
  name: string;
  purchasePrice: NumericValue;
  notaryFees: NumericValue;
  acquisitionFees: NumericValue;
  worksBudget: NumericValue;
  lots: ProjectMetricsLot[];
  expenses: ProjectMetricsExpense[];
  documents?: ProjectMetricsDocument[];
  documentsCount?: number;
};

export type ProjectAlertSeverity = 'critical' | 'warning' | 'info';

export type ProjectDecisionStatusLevel = 'ok' | 'warning' | 'critical';

export type ProjectCompleteness = {
  score: number;
  level: ProjectAlertSeverity;
  label: string;
  missingItems: string[];
  completedCriteriaCount: number;
  totalCriteriaCount: number;
};

export type ProjectAlert = {
  type: string;
  severity: ProjectAlertSeverity;
  message: string;
};

export type ProjectSuggestion = {
  code: string;
  severity: ProjectAlertSeverity;
  message: string;
};

export type ProjectDecisionStatus = {
  level: ProjectDecisionStatusLevel;
  label: string;
};

const TOTAL_COMPLETENESS_CRITERIA = 8;

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function formatCurrencyAmount(value: number) {
  return `${euroFormatter.format(value)} €`;
}

function pluralizeLots(count: number, suffix: string) {
  return `${count} lot(s) ${suffix}`;
}

export function getAlertSeverityRank(severity: ProjectAlertSeverity) {
  if (severity === 'critical') {
    return 3;
  }

  if (severity === 'warning') {
    return 2;
  }

  return 1;
}

function sortAlerts(left: ProjectAlert, right: ProjectAlert) {
  return (
    getAlertSeverityRank(right.severity) - getAlertSeverityRank(left.severity)
  );
}

function sortSuggestions(left: ProjectSuggestion, right: ProjectSuggestion) {
  return (
    getAlertSeverityRank(right.severity) - getAlertSeverityRank(left.severity)
  );
}

export function calculateProjectMetrics(input: ProjectMetricsInput) {
  const activeLots = input.lots.filter(
    (lot) => lot.status !== LotStatus.ARCHIVED,
  );
  const purchasePrice = toNumber(input.purchasePrice);
  const notaryFees = toNumber(input.notaryFees);
  const acquisitionFees = toNumber(input.acquisitionFees);
  const worksBudget = toNumber(input.worksBudget);
  const acquisitionCost =
    (purchasePrice ?? 0) + (notaryFees ?? 0) + (acquisitionFees ?? 0);
  const totalExpenses = input.expenses.reduce(
    (sum, expense) => sum + (toNumber(expense.amountTtc) ?? 0),
    0,
  );
  const worksExpenses = input.expenses
    .filter((expense) => expense.category === ExpenseCategory.WORKS)
    .reduce((sum, expense) => sum + (toNumber(expense.amountTtc) ?? 0), 0);
  const totalSurface = activeLots.reduce(
    (sum, lot) => sum + (toNumber(lot.surface) ?? 0),
    0,
  );
  const estimatedRentTotal = activeLots.reduce(
    (sum, lot) => sum + (toNumber(lot.estimatedRent) ?? 0),
    0,
  );
  const totalCostToDate = acquisitionCost + totalExpenses;
  const grossYieldEstimated =
    totalCostToDate > 0 && estimatedRentTotal > 0
      ? (estimatedRentTotal * 12 * 100) / totalCostToDate
      : null;
  const lotsWithoutSurfaceCount = activeLots.filter(
    (lot) => toNumber(lot.surface) === null,
  ).length;
  const lotsWithoutEstimatedRentCount = activeLots.filter(
    (lot) => toNumber(lot.estimatedRent) === null,
  ).length;

  return {
    purchasePrice,
    notaryFees,
    acquisitionFees,
    purchasePriceKnown: purchasePrice !== null,
    acquisitionFeesKnown: notaryFees !== null || acquisitionFees !== null,
    worksBudget,
    worksBudgetKnown: worksBudget !== null,
    acquisitionCost,
    worksExpenses,
    totalExpenses,
    totalCostToDate,
    worksBudgetDelta:
      worksBudget !== null ? (worksBudget ?? 0) - worksExpenses : null,
    lotsCount: activeLots.length,
    totalLotsCount: input.lots.length,
    totalSurface,
    estimatedRentTotal,
    grossYieldEstimated,
    lotsWithoutSurfaceCount,
    lotsWithoutEstimatedRentCount,
    expensesCount: input.expenses.length,
    documentsCount: input.documentsCount ?? input.documents?.length ?? 0,
  };
}

export function calculateProjectCompleteness(
  input: ProjectMetricsInput,
  metrics = calculateProjectMetrics(input),
): ProjectCompleteness {
  const completedCriteria = [
    metrics.purchasePriceKnown,
    metrics.acquisitionFeesKnown,
    metrics.worksBudgetKnown,
    metrics.lotsCount > 0,
    metrics.lotsCount > 0 && metrics.lotsWithoutSurfaceCount === 0,
    metrics.lotsCount > 0 && metrics.lotsWithoutEstimatedRentCount === 0,
    metrics.expensesCount > 0,
    metrics.documentsCount > 0,
  ].filter(Boolean).length;

  const score = Math.round(
    (completedCriteria / TOTAL_COMPLETENESS_CRITERIA) * 100,
  );

  const missingItems: string[] = [];

  if (metrics.lotsCount === 0) {
    missingItems.push('Aucun lot actif renseigne');
  } else {
    if (metrics.lotsWithoutEstimatedRentCount > 0) {
      missingItems.push(
        pluralizeLots(
          metrics.lotsWithoutEstimatedRentCount,
          'sans loyer estime',
        ),
      );
    }

    if (metrics.lotsWithoutSurfaceCount > 0) {
      missingItems.push(
        pluralizeLots(
          metrics.lotsWithoutSurfaceCount,
          'sans surface renseignee',
        ),
      );
    }
  }

  if (!metrics.purchasePriceKnown) {
    missingItems.push("Prix d'achat non renseigne");
  }

  if (metrics.expensesCount === 0) {
    missingItems.push('Aucune depense enregistree a ce jour');
  }

  if (metrics.documentsCount === 0) {
    missingItems.push('Aucun document enregistre');
  }

  if (!metrics.worksBudgetKnown) {
    missingItems.push('Budget travaux non renseigne');
  }

  if (!metrics.acquisitionFeesKnown) {
    missingItems.push('Frais de notaire / acquisition non renseignes');
  }

  if (score < 50) {
    return {
      score,
      level: 'critical',
      label: 'Projet incomplet',
      missingItems,
      completedCriteriaCount: completedCriteria,
      totalCriteriaCount: TOTAL_COMPLETENESS_CRITERIA,
    };
  }

  if (score < 80) {
    return {
      score,
      level: 'warning',
      label: 'Projet partiellement renseigne',
      missingItems,
      completedCriteriaCount: completedCriteria,
      totalCriteriaCount: TOTAL_COMPLETENESS_CRITERIA,
    };
  }

  return {
    score,
    level: 'info',
    label: 'Projet suffisamment renseigne',
    missingItems,
    completedCriteriaCount: completedCriteria,
    totalCriteriaCount: TOTAL_COMPLETENESS_CRITERIA,
  };
}

export function buildProjectAlerts(
  input: ProjectMetricsInput,
  metrics = calculateProjectMetrics(input),
  completeness = calculateProjectCompleteness(input, metrics),
) {
  const alerts: ProjectAlert[] = [];

  if (metrics.lotsCount === 0) {
    alerts.push({
      type: 'PROJECT_WITHOUT_LOTS',
      severity: 'critical',
      message: 'Aucun lot renseigne a ce jour.',
    });
  }

  if (
    metrics.worksBudget !== null &&
    metrics.worksBudget > 0 &&
    metrics.worksExpenses > metrics.worksBudget
  ) {
    alerts.push({
      type: 'WORKS_BUDGET_EXCEEDED',
      severity: 'critical',
      message: `Budget travaux depasse de ${formatCurrencyAmount(metrics.worksExpenses - metrics.worksBudget)}.`,
    });
  }

  if (completeness.level === 'critical') {
    alerts.push({
      type: 'PROJECT_COMPLETENESS_LOW',
      severity: 'critical',
      message: 'Projet encore trop incomplet pour etre pilote correctement.',
    });
  } else if (completeness.level === 'warning') {
    alerts.push({
      type: 'PROJECT_COMPLETENESS_MEDIUM',
      severity: 'warning',
      message:
        'Projet partiellement renseigne : plusieurs donnees clefs manquent encore.',
    });
  }

  if (metrics.expensesCount === 0) {
    alerts.push({
      type: 'PROJECT_WITHOUT_EXPENSES',
      severity: 'warning',
      message: 'Aucune depense enregistree a ce jour.',
    });
  }

  if (metrics.lotsWithoutEstimatedRentCount > 0) {
    alerts.push({
      type: 'LOT_MISSING_ESTIMATED_RENT',
      severity: 'warning',
      message: `Impossible d'estimer correctement le rendement brut : ${pluralizeLots(
        metrics.lotsWithoutEstimatedRentCount,
        'sans loyer estime',
      )}.`,
    });
  } else if (metrics.lotsCount > 0 && metrics.grossYieldEstimated === null) {
    const yieldReason =
      metrics.totalCostToDate <= 0
        ? "cout d'acquisition incomplet"
        : 'loyers estimes insuffisants';

    alerts.push({
      type: 'GROSS_YIELD_NOT_COMPUTABLE',
      severity: 'info',
      message: `Impossible d'estimer le rendement brut : ${yieldReason}.`,
    });
  }

  return alerts.sort(sortAlerts);
}

export function calculateProjectDecisionStatus(
  completeness: ProjectCompleteness,
  alerts: ProjectAlert[],
): ProjectDecisionStatus {
  const hasCriticalAlert = alerts.some(
    (alert) => alert.severity === 'critical',
  );
  const hasWarningAlert = alerts.some((alert) => alert.severity === 'warning');

  if (hasCriticalAlert || completeness.level === 'critical') {
    return {
      level: 'critical',
      label: 'Problematique',
    };
  }

  if (hasWarningAlert || completeness.level === 'warning') {
    return {
      level: 'warning',
      label: 'A surveiller',
    };
  }

  return {
    level: 'ok',
    label: 'OK',
  };
}

export function buildProjectSuggestions(alerts: ProjectAlert[]) {
  const suggestions = new Map<string, ProjectSuggestion>();

  for (const alert of alerts) {
    let suggestion: ProjectSuggestion | null = null;

    switch (alert.type) {
      case 'PROJECT_WITHOUT_LOTS':
        suggestion = {
          code: 'ADD_FIRST_LOTS',
          severity: alert.severity,
          message:
            'Ajoute les premiers lots pour structurer la lecture du projet.',
        };
        break;
      case 'PROJECT_WITHOUT_EXPENSES':
        suggestion = {
          code: 'ADD_FIRST_EXPENSES',
          severity: alert.severity,
          message:
            'Ajoute les premieres depenses pour suivre le cout reel du projet.',
        };
        break;
      case 'LOT_MISSING_ESTIMATED_RENT':
        suggestion = {
          code: 'COMPLETE_ESTIMATED_RENTS',
          severity: alert.severity,
          message:
            'Ajoute un loyer estime pour ameliorer la fiabilite du projet.',
        };
        break;
      case 'WORKS_BUDGET_EXCEEDED':
        suggestion = {
          code: 'REVIEW_WORKS_BUDGET',
          severity: alert.severity,
          message:
            'Verifie les dernieres depenses travaux ou ajuste le budget.',
        };
        break;
      case 'PROJECT_COMPLETENESS_LOW':
      case 'PROJECT_COMPLETENESS_MEDIUM':
        suggestion = {
          code: 'COMPLETE_KEY_DATA',
          severity: alert.severity,
          message: 'Complete les donnees manquantes pour fiabiliser les KPI.',
        };
        break;
      case 'GROSS_YIELD_NOT_COMPUTABLE':
        suggestion = {
          code: 'ENABLE_GROSS_YIELD',
          severity: alert.severity,
          message:
            'Renseigne les donnees manquantes pour rendre le rendement brut exploitable.',
        };
        break;
      default:
        break;
    }

    if (suggestion && !suggestions.has(suggestion.code)) {
      suggestions.set(suggestion.code, suggestion);
    }
  }

  return [...suggestions.values()].sort(sortSuggestions).slice(0, 5);
}

export function buildProjectInsights(input: ProjectMetricsInput) {
  const metrics = calculateProjectMetrics(input);
  const completeness = calculateProjectCompleteness(input, metrics);
  const alerts = buildProjectAlerts(input, metrics, completeness);
  const decisionStatus = calculateProjectDecisionStatus(completeness, alerts);
  const suggestions = buildProjectSuggestions(alerts);

  return {
    metrics,
    completeness,
    alerts,
    decisionStatus,
    suggestions,
  };
}
