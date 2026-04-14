import {
  type ForecastMetric,
  type ProjectForecastComparison,
} from '../projects/project-forecast.util';

type DashboardDriftProjectInput = {
  id: string;
  name: string;
  updatedAt: Date;
  forecastComparison: ProjectForecastComparison;
};

export type DashboardDriftIssue = {
  metricKey: string;
  label: string;
  status: 'watch' | 'drift';
  deltaPercent: number | null;
  deltaValue: number | null;
};

export type DashboardDriftProject = {
  projectId: string;
  name: string;
  status: 'watch' | 'drift';
  driftScore: number;
  mainIssues: DashboardDriftIssue[];
};

export type DashboardDriftsPayload = {
  totalProjects: number;
  projectsWithDrift: number;
  projectsWithWatch: number;
  projectsWithoutForecastReference: number;
  criticalProjects: DashboardDriftProject[];
};

function isActiveDriftMetric(
  metric: ForecastMetric,
): metric is ForecastMetric & { status: 'watch' | 'drift' } {
  return metric.status === 'watch' || metric.status === 'drift';
}

function getMetricStatusRank(status: DashboardDriftIssue['status']) {
  return status === 'drift' ? 2 : 1;
}

function getMetricMagnitude(
  metric: Pick<ForecastMetric, 'deltaPercent' | 'deltaValue'>,
) {
  if (typeof metric.deltaPercent === 'number') {
    return Math.abs(metric.deltaPercent);
  }

  if (typeof metric.deltaValue === 'number') {
    return Math.abs(metric.deltaValue);
  }

  return 0;
}

function compareIssues(left: DashboardDriftIssue, right: DashboardDriftIssue) {
  if (getMetricStatusRank(right.status) !== getMetricStatusRank(left.status)) {
    return getMetricStatusRank(right.status) - getMetricStatusRank(left.status);
  }

  if (getMetricMagnitude(right) !== getMetricMagnitude(left)) {
    return getMetricMagnitude(right) - getMetricMagnitude(left);
  }

  return left.label.localeCompare(right.label, 'fr');
}

function getIssueScore(issue: DashboardDriftIssue) {
  const baseScore = issue.status === 'drift' ? 100 : 40;

  if (typeof issue.deltaPercent === 'number') {
    return baseScore + Math.min(Math.round(Math.abs(issue.deltaPercent)), 50);
  }

  if (typeof issue.deltaValue === 'number') {
    return baseScore + Math.min(Math.round(Math.abs(issue.deltaValue)), 20);
  }

  return baseScore;
}

function compareProjects(
  left: DashboardDriftProject & { updatedAt: Date },
  right: DashboardDriftProject & { updatedAt: Date },
) {
  if (right.driftScore !== left.driftScore) {
    return right.driftScore - left.driftScore;
  }

  if (getMetricStatusRank(right.status) !== getMetricStatusRank(left.status)) {
    return getMetricStatusRank(right.status) - getMetricStatusRank(left.status);
  }

  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

export function buildDashboardDriftsPayload(input: {
  projects: DashboardDriftProjectInput[];
}): DashboardDriftsPayload {
  let projectsWithDrift = 0;
  let projectsWithWatch = 0;
  let projectsWithoutForecastReference = 0;

  const criticalProjects = input.projects
    .flatMap((project) => {
      if (!project.forecastComparison.available) {
        projectsWithoutForecastReference += 1;
        return [];
      }

      const issues = project.forecastComparison.metrics
        .filter(isActiveDriftMetric)
        .map(
          (metric) =>
            ({
              metricKey: metric.key,
              label: metric.label,
              status: metric.status,
              deltaPercent: metric.deltaPercent,
              deltaValue: metric.deltaValue,
            }) satisfies DashboardDriftIssue,
        )
        .sort(compareIssues);

      if (issues.length === 0) {
        return [];
      }

      const status: DashboardDriftProject['status'] = issues.some(
        (issue) => issue.status === 'drift',
      )
        ? 'drift'
        : 'watch';

      if (status === 'drift') {
        projectsWithDrift += 1;
      } else {
        projectsWithWatch += 1;
      }

      return [
        {
          projectId: project.id,
          name: project.name,
          status,
          driftScore: issues.reduce(
            (sum, issue) => sum + getIssueScore(issue),
            0,
          ),
          mainIssues: issues.slice(0, 3),
          updatedAt: project.updatedAt,
        },
      ];
    })
    .sort(compareProjects)
    .slice(0, 3)
    .map(({ projectId, name, status, driftScore, mainIssues }) => ({
      projectId,
      name,
      status,
      driftScore,
      mainIssues,
    }));

  return {
    totalProjects: input.projects.length,
    projectsWithDrift,
    projectsWithWatch,
    projectsWithoutForecastReference,
    criticalProjects,
  };
}
