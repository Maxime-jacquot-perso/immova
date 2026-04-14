import { buildDashboardDriftsPayload } from './dashboard-drifts.util';

function createComparison(overrides: Record<string, unknown> = {}) {
  return {
    available: true,
    metrics: [],
    alerts: [],
    unavailableMetrics: [],
    snapshotLots: [],
    ...overrides,
  };
}

describe('buildDashboardDriftsPayload', () => {
  it('counts drift, watch and missing forecast references while keeping only the most critical projects', () => {
    const payload = buildDashboardDriftsPayload({
      projects: [
        {
          id: 'project-drift',
          name: 'Projet en derive',
          updatedAt: new Date('2026-04-05T10:00:00.000Z'),
          forecastComparison: createComparison({
            metrics: [
              {
                key: 'worksBudget',
                label: 'Budget travaux',
                unit: 'currency',
                forecastValue: 10000,
                actualValue: 16000,
                deltaValue: 6000,
                deltaPercent: 60,
                status: 'drift',
                actualLabel: 'Depenses travaux engagees',
              },
              {
                key: 'grossYield',
                label: 'Rendement brut',
                unit: 'percent',
                forecastValue: 6,
                actualValue: 4.9,
                deltaValue: -1.1,
                deltaPercent: -18.3,
                status: 'drift',
                actualLabel: 'Rendement recalcule',
              },
            ],
          }),
        },
        {
          id: 'project-watch',
          name: 'Projet a surveiller',
          updatedAt: new Date('2026-04-05T09:00:00.000Z'),
          forecastComparison: createComparison({
            metrics: [
              {
                key: 'monthlyRent',
                label: 'Loyer mensuel',
                unit: 'currency',
                forecastValue: 1000,
                actualValue: 890,
                deltaValue: -110,
                deltaPercent: -11,
                status: 'watch',
                actualLabel: 'Loyers estimes saisis',
              },
            ],
          }),
        },
        {
          id: 'project-no-reference',
          name: 'Projet sans reference',
          updatedAt: new Date('2026-04-05T08:00:00.000Z'),
          forecastComparison: createComparison({
            available: false,
          }),
        },
      ],
    });

    expect(payload).toEqual({
      totalProjects: 3,
      projectsWithDrift: 1,
      projectsWithWatch: 1,
      projectsWithoutForecastReference: 1,
      criticalProjects: [
        {
          projectId: 'project-drift',
          name: 'Projet en derive',
          status: 'drift',
          driftScore: 268,
          mainIssues: [
            expect.objectContaining({
              metricKey: 'worksBudget',
              status: 'drift',
            }),
            expect.objectContaining({
              metricKey: 'grossYield',
              status: 'drift',
            }),
          ],
        },
        {
          projectId: 'project-watch',
          name: 'Projet a surveiller',
          status: 'watch',
          driftScore: 51,
          mainIssues: [
            expect.objectContaining({
              metricKey: 'monthlyRent',
              status: 'watch',
            }),
          ],
        },
      ],
    });
  });
});
