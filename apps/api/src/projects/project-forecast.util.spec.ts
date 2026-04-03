import { ExpenseCategory, LotStatus } from '@prisma/client';
import { buildProjectForecastComparison } from './project-forecast.util';

function createSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    referenceDate: new Date('2026-04-03T10:00:00.000Z'),
    strategy: 'RENTAL' as const,
    purchasePrice: 180000,
    acquisitionCost: 190000,
    bufferAmount: 5000,
    worksBudget: 24000,
    totalProjectCost: 219000,
    targetMonthlyRent: 980,
    grossYield: (980 * 12 * 100) / 219000,
    equityRequired: 59000,
    grossMargin: null,
    decisionScore: 74,
    decisionStatus: 'GOOD' as const,
    recommendation: 'interessant',
    lotsCount: 1,
    lotsJson: [
      {
        name: 'Lot 1',
        type: 'APARTMENT',
        surface: 52,
        estimatedRent: 980,
        notes: null,
      },
    ],
    simulation: {
      id: 'sim_1',
      name: 'Simulation de reference',
    },
    ...overrides,
  };
}

function createProject(overrides: Record<string, unknown> = {}) {
  return {
    purchasePrice: 180000,
    notaryFees: 10000,
    acquisitionFees: null,
    worksBudget: 24000,
    lots: [
      {
        status: LotStatus.DRAFT,
        surface: 52,
        estimatedRent: 980,
      },
    ],
    expenses: [] as Array<{
      category: string;
      amountTtc: number;
    }>,
    ...overrides,
  };
}

function getMetric(
  comparison: ReturnType<typeof buildProjectForecastComparison>,
  key: string,
) {
  const metric = comparison.metrics.find((entry) => entry.key === key);

  if (!metric) {
    throw new Error(`Metric ${key} not found`);
  }

  return metric;
}

describe('buildProjectForecastComparison', () => {
  it('keeps comparable KPIs neutral on a freshly converted project when nothing changed', () => {
    const comparison = buildProjectForecastComparison({
      project: createProject(),
      snapshot: createSnapshot(),
    });

    expect(getMetric(comparison, 'acquisitionCost')).toMatchObject({
      forecastValue: 190000,
      actualValue: 190000,
      status: 'neutral',
    });
    expect(getMetric(comparison, 'totalProjectCost')).toMatchObject({
      forecastValue: 219000,
      actualValue: 219000,
      status: 'neutral',
    });
    expect(getMetric(comparison, 'grossYield')).toMatchObject({
      status: 'neutral',
    });
    expect(getMetric(comparison, 'grossYield').actualValue).toBeCloseTo(
      getMetric(comparison, 'grossYield').forecastValue ?? 0,
      6,
    );
    expect(getMetric(comparison, 'lotsCount')).toMatchObject({
      forecastValue: 1,
      actualValue: 1,
      status: 'neutral',
      actualLabel: 'Lots non archives du projet',
    });
  });

  it('introduces a real neutral zone before watch and drift on cost overruns', () => {
    const snapshot = createSnapshot({
      bufferAmount: 0,
      worksBudget: 10000,
      totalProjectCost: 200000,
      targetMonthlyRent: 1000,
      grossYield: 6,
    });
    const baseProject = createProject({
      purchasePrice: 180000,
      notaryFees: 10000,
      worksBudget: 10000,
      lots: [
        {
          status: LotStatus.DRAFT,
          surface: 52,
          estimatedRent: 1000,
        },
      ],
    });

    const neutralComparison = buildProjectForecastComparison({
      project: {
        ...baseProject,
        expenses: [
          {
            category: ExpenseCategory.WORKS,
            amountTtc: 10499,
          },
        ],
      },
      snapshot,
    });
    const watchComparison = buildProjectForecastComparison({
      project: {
        ...baseProject,
        expenses: [
          {
            category: ExpenseCategory.WORKS,
            amountTtc: 10500,
          },
        ],
      },
      snapshot,
    });
    const driftComparison = buildProjectForecastComparison({
      project: {
        ...baseProject,
        expenses: [
          {
            category: ExpenseCategory.WORKS,
            amountTtc: 30000,
          },
        ],
      },
      snapshot,
    });

    expect(getMetric(neutralComparison, 'worksBudget')).toMatchObject({
      actualValue: 10499,
      status: 'neutral',
    });
    expect(getMetric(watchComparison, 'worksBudget')).toMatchObject({
      actualValue: 10500,
      status: 'watch',
    });
    expect(getMetric(driftComparison, 'worksBudget')).toMatchObject({
      actualValue: 30000,
      status: 'drift',
    });
    expect(getMetric(driftComparison, 'totalProjectCost')).toMatchObject({
      actualValue: 220000,
      status: 'drift',
    });
  });

  it('introduces a real neutral zone before watch and drift on rent shortfalls', () => {
    const snapshot = createSnapshot({
      bufferAmount: 0,
      worksBudget: 10000,
      totalProjectCost: 200000,
      targetMonthlyRent: 1000,
      grossYield: 6,
    });
    const baseProject = createProject({
      purchasePrice: 180000,
      notaryFees: 10000,
      worksBudget: 10000,
    });

    const neutralComparison = buildProjectForecastComparison({
      project: {
        ...baseProject,
        lots: [
          {
            status: LotStatus.DRAFT,
            surface: 52,
            estimatedRent: 950,
          },
        ],
      },
      snapshot,
    });
    const watchComparison = buildProjectForecastComparison({
      project: {
        ...baseProject,
        lots: [
          {
            status: LotStatus.DRAFT,
            surface: 52,
            estimatedRent: 890,
          },
        ],
      },
      snapshot,
    });
    const driftComparison = buildProjectForecastComparison({
      project: {
        ...baseProject,
        lots: [
          {
            status: LotStatus.DRAFT,
            surface: 52,
            estimatedRent: 830,
          },
        ],
      },
      snapshot,
    });

    expect(getMetric(neutralComparison, 'monthlyRent')).toMatchObject({
      actualValue: 950,
      status: 'neutral',
    });
    expect(getMetric(watchComparison, 'monthlyRent')).toMatchObject({
      actualValue: 890,
      status: 'watch',
    });
    expect(getMetric(driftComparison, 'monthlyRent')).toMatchObject({
      actualValue: 830,
      status: 'drift',
    });
    expect(getMetric(watchComparison, 'grossYield').status).toBe('watch');
    expect(getMetric(driftComparison, 'grossYield').status).toBe('drift');
  });

  it('compares lots count against non archived project lots', () => {
    const comparison = buildProjectForecastComparison({
      project: createProject({
        lots: [
          {
            status: LotStatus.DRAFT,
            surface: 52,
            estimatedRent: 600,
          },
          {
            status: LotStatus.ARCHIVED,
            surface: 18,
            estimatedRent: 380,
          },
        ],
      }),
      snapshot: createSnapshot({
        lotsCount: 2,
        lotsJson: [
          {
            name: 'Lot 1',
            type: 'APARTMENT',
            surface: 52,
            estimatedRent: 600,
            notes: null,
          },
          {
            name: 'Lot 2',
            type: 'GARAGE',
            surface: 18,
            estimatedRent: 380,
            notes: null,
          },
        ],
      }),
    });

    expect(getMetric(comparison, 'lotsCount')).toMatchObject({
      forecastValue: 2,
      actualValue: 1,
      status: 'watch',
      actualLabel: 'Lots non archives du projet',
    });
  });
});
