import { apiFetch } from "../../shared/api/client";
import type { Session } from "../auth/api";

export type SimulationPropertyType = "ANCIEN" | "NEUF_VEFA";

export type SimulationFolder = {
  id: string;
  name: string;
  description?: string | null;
  simulationsCount: number;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SimulationNotaryFeesBreakdown = {
  taxableBase: number;
  transferTaxes: number;
  securityContribution: number;
  notaryEmoluments: number;
  disbursements: number;
  total: number;
  appliedRates: {
    propertyType: SimulationPropertyType;
    departmentCode: string;
    departmentTransferTaxRate: number;
    departmentReferenceRate: number;
    municipalTransferTaxRate: number;
    collectionRate: number;
    securityContributionRate: number;
    securityContributionMinimum: number;
    defaultEstimatedDisbursements: number;
    firstTimeBuyerCaptured: boolean;
    firstTimeBuyerAdjustmentApplied: boolean;
    rateSource: string;
    emolumentBrackets: Array<{
      from: number;
      to: number | null;
      rate: number;
      taxableAmount: number;
      amount: number;
    }>;
  };
};

export type Simulation = {
  id: string;
  organizationId: string;
  folderId: string;
  name: string;
  address?: string | null;
  strategy: "FLIP" | "RENTAL";
  propertyType?: SimulationPropertyType | null;
  departmentCode?: string | null;
  isFirstTimeBuyer: boolean;
  purchasePrice: number;
  furnitureValue?: number | null;
  estimatedDisbursements?: number | null;
  notaryFees?: number | null;
  notaryFeesBreakdown?: SimulationNotaryFeesBreakdown | null;
  acquisitionFees: number;
  worksBudget: number;
  worksBreakdownJson?: unknown;
  financingMode: "CASH" | "LOAN";
  downPayment?: number | null;
  loanAmount?: number | null;
  interestRate?: number | null;
  loanDurationMonths?: number | null;
  estimatedMonthlyPayment?: number | null;
  estimatedProjectDurationMonths?: number | null;
  targetResalePrice?: number | null;
  targetMonthlyRent?: number | null;
  bufferAmount?: number | null;
  notes?: string | null;
  decisionScore?: number | null;
  decisionStatus?: "GOOD" | "REVIEW" | "RISKY" | null;
  resultSummaryJson?: SimulationResultSummary | null;
  convertedProjectId?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SimulationWithLots = Simulation & {
  lots: SimulationLot[];
};

export type SimulationLot = {
  id: string;
  organizationId: string;
  simulationId: string;
  name: string;
  type?: string | null;
  surface?: number | null;
  estimatedRent?: number | null;
  targetResaleValue?: number | null;
  notes?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type SimulationComparison = {
  id: string;
  name: string;
  strategy: "FLIP" | "RENTAL";
  totalProjectCost: number;
  equityRequired: number;
  grossMargin?: number | null;
  grossYield?: number | null;
  estimatedMonthlyPayment?: number | null;
  monthlyCashDelta?: number | null;
  projectDurationMonths?: number | null;
  decisionScore?: number | null;
  decisionStatus?: "GOOD" | "REVIEW" | "RISKY" | null;
  recommendation?: string | null;
};

export type OpportunityEvent = {
  id: string;
  organizationId: string;
  simulationId: string;
  type:
    | "NEGOTIATION_PRICE"
    | "BANK_FINANCING_QUOTE"
    | "VISIT_NOTE"
    | "RISK_ALERT"
    | "ASSUMPTION_CHANGE"
    | "OTHER";
  title: string;
  description?: string | null;
  eventDate: string;
  impact?: string | null;
  metadata?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkItemOption = {
  id: string;
  organizationId: string;
  workItemId: string;
  providerName: string;
  cost: number;
  durationDays?: number | null;
  notes?: string | null;
  status: "ACTIVE" | "CANDIDATE";
  createdAt: string;
  updatedAt: string;
};

export type SimulationWorkItem = {
  id: string;
  organizationId: string;
  simulationId: string;
  name: string;
  initialCost: number;
  estimatedDurationDays?: number | null;
  position: number;
  options: WorkItemOption[];
  createdAt: string;
  updatedAt: string;
};

export type ActiveValues = {
  activePurchasePrice: number;
  activePurchasePriceSource: string;
  activeWorksCost: number;
  activeWorksCostSource: string;
  worksCostBreakdown: Array<{
    itemName: string;
    cost: number;
    source: "initial" | "option";
    providerName?: string;
  }>;
  activeMonthlyRent: number;
  activeMonthlyRentSource: string;
  activeFinancing: {
    mode: string;
    rate: number | null;
    durationMonths: number | null;
    loanAmount: number | null;
    source: string;
  };
};

export type SimulationWithDetails = SimulationWithLots & {
  workItems?: SimulationWorkItem[];
  activeValues?: ActiveValues;
};

function token(session: Session | null) {
  if (!session) {
    throw new Error("Missing session");
  }

  return session.accessToken;
}

export function listFolders(session: Session | null) {
  return apiFetch<SimulationFolder[]>("/simulation-folders", {
    token: token(session),
  });
}

export function createFolder(
  session: Session | null,
  payload: Record<string, unknown>,
) {
  return apiFetch<SimulationFolder>("/simulation-folders", {
    method: "POST",
    token: token(session),
    body: payload,
  });
}

export function getFolder(session: Session | null, folderId: string) {
  return apiFetch<SimulationFolder>(`/simulation-folders/${folderId}`, {
    token: token(session),
  });
}

export function updateFolder(
  session: Session | null,
  folderId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<SimulationFolder>(`/simulation-folders/${folderId}`, {
    method: "PATCH",
    token: token(session),
    body: payload,
  });
}

export function archiveFolder(session: Session | null, folderId: string) {
  return apiFetch<SimulationFolder>(`/simulation-folders/${folderId}/archive`, {
    method: "POST",
    token: token(session),
  });
}

export function listSimulationsByFolder(
  session: Session | null,
  folderId: string,
) {
  return apiFetch<Simulation[]>(
    `/simulations/folders/${folderId}/simulations`,
    {
      token: token(session),
    },
  );
}

export function createSimulation(
  session: Session | null,
  payload: Record<string, unknown>,
) {
  return apiFetch<Simulation>("/simulations", {
    method: "POST",
    token: token(session),
    body: payload,
  });
}

export function getSimulation(session: Session | null, simulationId: string) {
  return apiFetch<SimulationWithDetails>(`/simulations/${simulationId}`, {
    token: token(session),
  });
}

export function updateSimulation(
  session: Session | null,
  simulationId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Simulation>(`/simulations/${simulationId}`, {
    method: "PATCH",
    token: token(session),
    body: payload,
  });
}

export function archiveSimulation(
  session: Session | null,
  simulationId: string,
) {
  return apiFetch<Simulation>(`/simulations/${simulationId}/archive`, {
    method: "POST",
    token: token(session),
  });
}

export function compareSimulations(session: Session | null, folderId: string) {
  return apiFetch<SimulationComparison[]>(
    `/simulations/folders/${folderId}/comparison`,
    {
      token: token(session),
    },
  );
}

export function convertToProject(
  session: Session | null,
  simulationId: string,
) {
  return apiFetch<{ projectId: string }>(
    `/simulations/${simulationId}/convert-to-project`,
    {
      method: "POST",
      token: token(session),
    },
  );
}

export function listSimulationLots(
  session: Session | null,
  simulationId: string,
) {
  return apiFetch<SimulationLot[]>(`/simulations/${simulationId}/lots`, {
    token: token(session),
  });
}

export function createSimulationLot(
  session: Session | null,
  simulationId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<SimulationLot>(`/simulations/${simulationId}/lots`, {
    method: "POST",
    token: token(session),
    body: payload,
  });
}

export function updateSimulationLot(
  session: Session | null,
  simulationId: string,
  lotId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<SimulationLot>(`/simulations/${simulationId}/lots/${lotId}`, {
    method: "PATCH",
    token: token(session),
    body: payload,
  });
}

export function deleteSimulationLot(
  session: Session | null,
  simulationId: string,
  lotId: string,
) {
  return apiFetch<{ success: boolean }>(
    `/simulations/${simulationId}/lots/${lotId}`,
    {
      method: "DELETE",
      token: token(session),
    },
  );
}

export function listOpportunityEvents(
  session: Session | null,
  simulationId: string,
) {
  return apiFetch<OpportunityEvent[]>(`/simulations/${simulationId}/events`, {
    token: token(session),
  });
}

export function createOpportunityEvent(
  session: Session | null,
  simulationId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<OpportunityEvent>(`/simulations/${simulationId}/events`, {
    method: "POST",
    token: token(session),
    body: payload,
  });
}

export function updateOpportunityEvent(
  session: Session | null,
  simulationId: string,
  eventId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<OpportunityEvent>(
    `/simulations/${simulationId}/events/${eventId}`,
    {
      method: "PATCH",
      token: token(session),
      body: payload,
    },
  );
}

export function deleteOpportunityEvent(
  session: Session | null,
  simulationId: string,
  eventId: string,
) {
  return apiFetch<{ success: boolean }>(
    `/simulations/${simulationId}/events/${eventId}`,
    {
      method: "DELETE",
      token: token(session),
    },
  );
}

// Work Items API
export function listWorkItems(session: Session | null, simulationId: string) {
  return apiFetch<SimulationWorkItem[]>(
    `/simulations/${simulationId}/work-items`,
    {
      token: token(session),
    },
  );
}

export function createWorkItem(
  session: Session | null,
  simulationId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<SimulationWorkItem>(
    `/simulations/${simulationId}/work-items`,
    {
      method: "POST",
      token: token(session),
      body: payload,
    },
  );
}

export function updateWorkItem(
  session: Session | null,
  simulationId: string,
  itemId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<SimulationWorkItem>(
    `/simulations/${simulationId}/work-items/${itemId}`,
    {
      method: "PATCH",
      token: token(session),
      body: payload,
    },
  );
}

export function deleteWorkItem(
  session: Session | null,
  simulationId: string,
  itemId: string,
) {
  return apiFetch<{ success: boolean }>(
    `/simulations/${simulationId}/work-items/${itemId}`,
    {
      method: "DELETE",
      token: token(session),
    },
  );
}

// Work Item Options API
export function createWorkItemOption(
  session: Session | null,
  simulationId: string,
  itemId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<WorkItemOption>(
    `/simulations/${simulationId}/work-items/${itemId}/options`,
    {
      method: "POST",
      token: token(session),
      body: payload,
    },
  );
}

export function updateWorkItemOption(
  session: Session | null,
  simulationId: string,
  itemId: string,
  optionId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch<WorkItemOption>(
    `/simulations/${simulationId}/work-items/${itemId}/options/${optionId}`,
    {
      method: "PATCH",
      token: token(session),
      body: payload,
    },
  );
}

export function deleteWorkItemOption(
  session: Session | null,
  simulationId: string,
  itemId: string,
  optionId: string,
) {
  return apiFetch<{ success: boolean }>(
    `/simulations/${simulationId}/work-items/${itemId}/options/${optionId}`,
    {
      method: "DELETE",
      token: token(session),
    },
  );
}

export function activateWorkItemOption(
  session: Session | null,
  simulationId: string,
  itemId: string,
  optionId: string,
) {
  return apiFetch<WorkItemOption>(
    `/simulations/${simulationId}/work-items/${itemId}/options/${optionId}/activate`,
    {
      method: "POST",
      token: token(session),
    },
  );
}

// ========================================
// SIMULATION OPTIONS (OPTIONS ACTIVES)
// ========================================

export type SimulationOptionGroupType =
  | "PURCHASE_PRICE"
  | "WORK_BUDGET"
  | "FINANCING";
export type SimulationOptionSource = "MANUAL" | "FROM_EVENT";

export type SimulationOption = {
  id: string;
  groupId: string;
  label: string;
  valueJson: Record<string, unknown>;
  isActive: boolean;
  source: SimulationOptionSource;
  sourceEventId?: string | null;
  sourceEvent?: OpportunityEvent | null;
  createdAt: string;
  updatedAt: string;
};

export type SimulationOptionGroup = {
  id: string;
  simulationId: string;
  type: SimulationOptionGroupType;
  label: string;
  activeOptionId?: string | null;
  activeOption?: SimulationOption | null;
  options: SimulationOption[];
  createdAt: string;
  updatedAt: string;
};

export type SimulationMetrics = {
  totalProjectCost: number;
  equityRequired: number;
  acquisitionCost: number;
  grossMargin: number | null;
  marginRate: number | null;
  grossYield: number | null;
  estimatedMonthlyPayment: number | null;
  monthlyCashDelta: number | null;
  simplePaybackYears: number | null;
  projectDurationMonths: number | null;
};

export type SimulationFinancingPlan = {
  uses: {
    purchasePrice: number;
    notaryFees: number;
    worksBudget: number;
    bufferAmount: number;
    total: number;
  };
  resources: {
    financingMode: "CASH" | "LOAN";
    downPayment: number;
    loanAmount: number;
    total: number;
  };
  requiredCash: number;
  remainingGap: number;
};

export type SimulationDecision = {
  score: number;
  status: "GOOD" | "REVIEW" | "RISKY";
  recommendation: string;
  warnings: string[];
};

export type SimulationResultSummary = {
  metrics?: SimulationMetrics;
  decision?: SimulationDecision;
  notaryFees?: SimulationNotaryFeesBreakdown | null;
  financingPlan?: SimulationFinancingPlan;
  activeValues?: ActiveValues;
};

export type OptionImpactDelta = {
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

export type OptionImpact = {
  base: {
    metrics: SimulationMetrics;
    decision: SimulationDecision;
  };
  simulated: {
    metrics: SimulationMetrics;
    decision: SimulationDecision;
  };
  delta: OptionImpactDelta;
};

export type OptionActivationHistoryEntry = {
  groupType: SimulationOptionGroupType;
  previous: string;
  next: string;
  delta: {
    totalProjectCost: number;
    margin: number;
    monthlyPayment: number;
    projectDurationMonths: number;
    score: number;
  };
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email?: string | null;
  };
};

export type OptionGroupComparisonEntry = {
  optionId: string;
  label: string;
  metrics: SimulationMetrics;
  deltaVsActive: OptionImpactDelta;
};

export function getOptionGroups(session: Session | null, simulationId: string) {
  return apiFetch<SimulationOptionGroup[]>(
    `/simulations/${simulationId}/option-groups`,
    {
      token: token(session),
    },
  );
}

export function createOptionGroup(
  session: Session | null,
  simulationId: string,
  payload: {
    type: SimulationOptionGroupType;
    label: string;
  },
) {
  return apiFetch<SimulationOptionGroup>(
    `/simulations/${simulationId}/option-groups`,
    {
      method: "POST",
      token: token(session),
      body: payload,
    },
  );
}

export function createOption(
  session: Session | null,
  simulationId: string,
  payload: {
    groupId: string;
    label: string;
    valueJson: Record<string, unknown>;
    source?: SimulationOptionSource;
    sourceEventId?: string;
  },
) {
  return apiFetch<SimulationOption>(`/simulations/${simulationId}/options`, {
    method: "POST",
    token: token(session),
    body: payload,
  });
}

export function activateOption(
  session: Session | null,
  simulationId: string,
  optionId: string,
) {
  return apiFetch<SimulationOption>(
    `/simulations/${simulationId}/options/${optionId}/activate`,
    {
      method: "PATCH",
      token: token(session),
    },
  );
}

export function deleteOption(
  session: Session | null,
  simulationId: string,
  optionId: string,
) {
  return apiFetch<{ success: boolean }>(
    `/simulations/${simulationId}/options/${optionId}`,
    {
      method: "DELETE",
      token: token(session),
    },
  );
}

export function getOptionImpact(
  session: Session | null,
  simulationId: string,
  optionId: string,
) {
  return apiFetch<OptionImpact>(
    `/simulations/${simulationId}/options/${optionId}/impact`,
    {
      token: token(session),
    },
  );
}

export function getOptionActivationHistory(
  session: Session | null,
  simulationId: string,
) {
  return apiFetch<OptionActivationHistoryEntry[]>(
    `/simulations/${simulationId}/options/activation-history`,
    {
      token: token(session),
    },
  );
}

export function getOptionGroupComparison(
  session: Session | null,
  simulationId: string,
  groupId: string,
) {
  return apiFetch<OptionGroupComparisonEntry[]>(
    `/simulations/${simulationId}/options/groups/${groupId}/comparison`,
    {
      token: token(session),
    },
  );
}
