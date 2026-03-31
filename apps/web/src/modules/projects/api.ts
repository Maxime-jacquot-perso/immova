import { apiFetch, apiUpload, downloadFile } from '../../shared/api/client';
import type { Session } from '../auth/api';

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

export type Project = {
  id: string;
  name: string;
  reference?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country: string;
  type: string;
  status: string;
  purchasePrice?: number | null;
  notaryFees?: number | null;
  acquisitionFees?: number | null;
  worksBudget?: number | null;
  notes?: string | null;
  decisionStatus?: ProjectDecisionStatus;
};

export type Lot = {
  id: string;
  name: string;
  reference?: string | null;
  type: string;
  status: string;
  surface?: number | null;
  estimatedRent?: number | null;
  notes?: string | null;
};

export type Expense = {
  id: string;
  projectId: string;
  lotId?: string | null;
  invoiceNumber?: string | null;
  issueDate: string;
  amountHt: number;
  vatAmount: number;
  amountTtc: number;
  category: string;
  paymentStatus: string;
  vendorName?: string | null;
  comment?: string | null;
};

export type ProjectOverview = {
  project: Project;
  kpis: {
    acquisitionCost: number;
    worksBudget?: number | null;
    worksExpenses: number;
    totalExpenses: number;
    totalCostToDate: number;
    worksBudgetDelta?: number | null;
    lotsCount: number;
    totalSurface: number;
    estimatedRentTotal: number;
    grossYieldEstimated?: number | null;
  };
  completeness: ProjectCompleteness;
  decisionStatus: ProjectDecisionStatus;
  alerts: ProjectAlert[];
  suggestions: ProjectSuggestion[];
  recentExpenses: Array<{
    id: string;
    invoiceNumber?: string | null;
    issueDate: string;
    category: string;
    paymentStatus: string;
    vendorName?: string | null;
    amountTtc: number;
  }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
};

export type ProjectDocument = {
  id: string;
  title: string;
  type: string;
  originalFileName: string;
  createdAt: string;
  expense?: {
    id: string;
    invoiceNumber?: string | null;
    category: string;
    vendorName?: string | null;
  } | null;
};

function token(session: Session | null) {
  if (!session) {
    throw new Error('Missing session');
  }

  return session.accessToken;
}

export function listProjects(session: Session | null) {
  return apiFetch<Project[]>('/projects', { token: token(session) });
}

export function createProject(
  session: Session | null,
  payload: Record<string, unknown>,
) {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    token: token(session),
    body: payload,
  });
}

export function updateProject(
  session: Session | null,
  projectId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    token: token(session),
    body: payload,
  });
}

export function getProject(session: Session | null, projectId: string) {
  return apiFetch<Project>(`/projects/${projectId}`, { token: token(session) });
}

export function getProjectOverview(session: Session | null, projectId: string) {
  return apiFetch<ProjectOverview>(`/projects/${projectId}/overview`, {
    token: token(session),
  });
}

export function listLots(session: Session | null, projectId: string) {
  return apiFetch<Lot[]>(`/projects/${projectId}/lots`, { token: token(session) });
}

export function createLot(
  session: Session | null,
  projectId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Lot>(`/projects/${projectId}/lots`, {
    method: 'POST',
    token: token(session),
    body: payload,
  });
}

export function updateLot(
  session: Session | null,
  projectId: string,
  lotId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Lot>(`/projects/${projectId}/lots/${lotId}`, {
    method: 'PATCH',
    token: token(session),
    body: payload,
  });
}

export function listExpenses(session: Session | null, projectId: string) {
  return apiFetch<Expense[]>(`/projects/${projectId}/expenses`, {
    token: token(session),
  });
}

export function createExpense(
  session: Session | null,
  projectId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Expense>(`/projects/${projectId}/expenses`, {
    method: 'POST',
    token: token(session),
    body: payload,
  });
}

export function updateExpense(
  session: Session | null,
  projectId: string,
  expenseId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Expense>(`/projects/${projectId}/expenses/${expenseId}`, {
    method: 'PATCH',
    token: token(session),
    body: payload,
  });
}

export function listDocuments(
  session: Session | null,
  projectId: string,
  filters?: {
    search?: string;
    type?: string;
    expenseId?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (filters?.search) {
    searchParams.set('search', filters.search);
  }
  if (filters?.type && filters.type !== 'ALL') {
    searchParams.set('type', filters.type);
  }
  if (filters?.expenseId) {
    searchParams.set('expenseId', filters.expenseId);
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return apiFetch<ProjectDocument[]>(`/projects/${projectId}/documents${suffix}`, {
    token: token(session),
  });
}

export function uploadDocument(
  session: Session | null,
  projectId: string,
  payload: {
    title: string;
    type: string;
    expenseId?: string;
    file: File;
  },
) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('type', payload.type);
  if (payload.expenseId) {
    formData.append('expenseId', payload.expenseId);
  }
  formData.append('file', payload.file);

  return apiUpload<ProjectDocument>(
    `/projects/${projectId}/documents/upload`,
    token(session),
    formData,
  );
}

export function downloadDocument(
  session: Session | null,
  projectId: string,
  documentId: string,
  fileName: string,
) {
  return downloadFile(
    `/projects/${projectId}/documents/${documentId}/download`,
    token(session),
    fileName,
  );
}

export function exportExpenses(session: Session | null, projectId: string) {
  return downloadFile(
    `/projects/${projectId}/exports/expenses.csv`,
    token(session),
    `project-${projectId}-expenses.csv`,
  );
}

export function getCurrentOrganization(session: Session | null) {
  return apiFetch<{ id: string; name: string; slug: string }>('/organizations/current', {
    token: token(session),
  });
}

export function listMemberships(session: Session | null) {
  return apiFetch<
    Array<{
      id: string;
      role: string;
      user: {
        email: string;
        firstName?: string | null;
        lastName?: string | null;
      };
    }>
  >('/memberships', {
    token: token(session),
  });
}

export function createMembership(
  session: Session | null,
  payload: Record<string, unknown>,
) {
  return apiFetch('/memberships', {
    method: 'POST',
    token: token(session),
    body: payload,
  });
}
