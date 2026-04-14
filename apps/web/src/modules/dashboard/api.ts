import { apiFetch } from '../../shared/api/client';
import type { Session } from '../auth/api';
import type {
  ProjectAlert,
  ProjectAlertSeverity,
  ProjectCompleteness,
  ProjectDecisionStatus,
  ProjectSuggestion,
} from '../projects/api';

export type DashboardAlert = {
  type: string;
  severity: ProjectAlertSeverity;
  project: {
    id: string;
    name: string;
    status: string;
  };
  message: string;
  href: string;
};

export type DashboardWatchlistProject = {
  id: string;
  name: string;
  status: string;
  totalCostToDate: number;
  estimatedRentTotal: number;
  grossYieldEstimated?: number | null;
  completeness: ProjectCompleteness;
  decisionStatus: ProjectDecisionStatus;
  highestAlertSeverity?: ProjectAlertSeverity | null;
  alertCount: number;
  alerts: ProjectAlert[];
  suggestions: ProjectSuggestion[];
  alertTypes: string[];
  updatedAt: string;
  href: string;
};

export type DashboardComparisonProject = {
  id: string;
  name: string;
  status: string;
  totalCostToDate: number;
  estimatedRentTotal: number;
  grossYieldEstimated?: number | null;
  completeness: ProjectCompleteness;
  decisionStatus: ProjectDecisionStatus;
  href: string;
};

export type DashboardActivityItem = {
  type: 'project' | 'expense' | 'document';
  label: string;
  date: string;
  project?: {
    id: string;
    name: string;
  } | null;
  href: string;
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

export type DashboardPayload = {
  summary: {
    activeProjectsCount: number;
    archivedProjectsCount: number;
    nonArchivedLotsCount: number;
    totalExpensesAmount: number;
    estimatedMonthlyRentTotal: number;
  };
  alerts: DashboardAlert[];
  watchlist: DashboardWatchlistProject[];
  comparison: DashboardComparisonProject[];
  recentActivity: DashboardActivityItem[];
};

function token(session: Session | null) {
  if (!session) {
    throw new Error('Missing session');
  }

  return session.accessToken;
}

export function getDashboard(session: Session | null) {
  return apiFetch<DashboardPayload>('/dashboard', {
    token: token(session),
  });
}

export function getDashboardDrifts(session: Session | null) {
  return apiFetch<DashboardDriftsPayload>('/dashboard/drifts', {
    token: token(session),
  });
}
