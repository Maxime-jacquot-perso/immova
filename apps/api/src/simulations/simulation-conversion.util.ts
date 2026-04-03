import {
  LotStatus,
  LotType,
  type Prisma,
  ProjectStatus,
  ProjectType,
  type Simulation,
  type SimulationLot,
  type SimulationOption,
  type SimulationOptionGroup,
  SimulationPropertyType,
  type SimulationStrategy,
  type SimulationWorkItem,
  type WorkItemOption,
} from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import { buildSimulationRuntimeState } from './simulation-resolver.util';

export type ConversionIssue = {
  code: string;
  message: string;
};

export type ConversionPreviewFieldKind =
  | 'currency'
  | 'percent'
  | 'number'
  | 'text';

export type ConversionPreviewField = {
  key: string;
  label: string;
  kind: ConversionPreviewFieldKind;
  value: number | string | null;
  reason?: string;
};

export type SimulationConversionPreview = {
  simulation: {
    id: string;
    name: string;
    strategy: SimulationStrategy;
    archivedAt: Date | null;
    convertedProjectId: string | null;
  };
  project: {
    name: string;
    addressLine1: string | null;
    country: string;
    type: ProjectType;
    strategy: SimulationStrategy;
    status: ProjectStatus;
    purchasePrice: number;
    notaryFees: number | null;
    worksBudget: number;
    notes: string | null;
  };
  lots: Array<{
    name: string;
    type: LotType;
    surface: number | null;
    estimatedRent: number | null;
    notes: string | null;
  }>;
  projectFields: ConversionPreviewField[];
  snapshotFields: ConversionPreviewField[];
  nonTransferredFields: ConversionPreviewField[];
  warnings: ConversionIssue[];
  blockingIssues: ConversionIssue[];
  canConvert: boolean;
  existingProject: {
    id: string;
    name: string;
  } | null;
};

type ConversionLotDraftData = Omit<Prisma.LotCreateManyInput, 'projectId'>;

type SimulationForConversion = Simulation & {
  lots: SimulationLot[];
  workItems: (SimulationWorkItem & { options: WorkItemOption[] })[];
  optionGroups: (SimulationOptionGroup & {
    activeOption: SimulationOption | null;
  })[];
  conversionRecord: {
    projectId: string;
    project: {
      id: string;
      name: string;
    };
  } | null;
  convertedProject: {
    id: string;
    name: string;
  } | null;
};

export type SimulationConversionPlan = {
  preview: SimulationConversionPreview;
  projectData: Prisma.ProjectUncheckedCreateInput;
  lotDraftData: ConversionLotDraftData[];
  snapshotData: Omit<
    Prisma.ProjectForecastSnapshotUncheckedCreateInput,
    'organizationId' | 'projectId' | 'simulationId' | 'conversionId'
  >;
};

function mapSimulationLotTypeToLotType(
  simulationLotType: SimulationLot['type'],
) {
  switch (simulationLotType) {
    case 'APARTMENT':
      return LotType.APARTMENT;
    case 'GARAGE':
      return LotType.GARAGE;
    case 'CELLAR':
      return LotType.CELLAR;
    default:
      return LotType.OTHER;
  }
}

function buildConversionNote(simulation: Simulation) {
  const sourcePrefix = `Converti depuis la simulation "${simulation.name}"`;

  if (!simulation.notes) {
    return sourcePrefix;
  }

  return `${sourcePrefix}\n\n${simulation.notes}`;
}

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber?: unknown }).toNumber === 'function'
  ) {
    const parsedValue = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function buildPropertyTypeLabel(propertyType: SimulationPropertyType | null) {
  if (propertyType === SimulationPropertyType.NEUF_VEFA) {
    return 'Neuf / VEFA';
  }

  if (propertyType === SimulationPropertyType.ANCIEN) {
    return 'Ancien';
  }

  return null;
}

export function buildSimulationConversionPlan(
  organizationId: string,
  simulation: SimulationForConversion,
): SimulationConversionPlan {
  const runtimeState = buildSimulationRuntimeState(
    simulation,
    simulation.workItems,
    simulation.lots,
    simulation.optionGroups,
  );
  const resolvedNotaryFees =
    runtimeState.results.notaryFees?.total ?? toNumber(simulation.notaryFees);
  const purchasePrice = runtimeState.activeValues.activePurchasePrice;
  const worksBudget = runtimeState.activeValues.activeWorksCost;
  const decision = runtimeState.results.decision;
  const metrics = runtimeState.results.metrics;
  const financingPlan = runtimeState.results.financingPlan;
  const monthlyRentForecast =
    simulation.strategy === 'RENTAL' &&
    runtimeState.activeValues.activeMonthlyRent > 0
      ? runtimeState.activeValues.activeMonthlyRent
      : null;
  const targetResalePrice =
    simulation.strategy === 'FLIP'
      ? normalizeNullableNumber(toNumber(simulation.targetResalePrice))
      : null;

  const projectData: Prisma.ProjectUncheckedCreateInput = {
    organizationId,
    name: simulation.name,
    addressLine1: simulation.address,
    country: 'FR',
    type: ProjectType.OTHER,
    strategy: simulation.strategy,
    status: ProjectStatus.ACQUISITION,
    purchasePrice,
    notaryFees: resolvedNotaryFees,
    acquisitionFees: null,
    worksBudget,
    notes: buildConversionNote(simulation),
  };

  const lotDraftData: ConversionLotDraftData[] = simulation.lots.map((lot) => ({
    organizationId,
    name: lot.name,
    type: mapSimulationLotTypeToLotType(lot.type),
    status: LotStatus.DRAFT,
    surface: lot.surface,
    estimatedRent: lot.estimatedRent,
    notes: lot.notes,
  }));

  const previewLots = lotDraftData.map((lot) => ({
    name: lot.name,
    type: lot.type ?? LotType.OTHER,
    surface: normalizeNullableNumber(lot.surface),
    estimatedRent: normalizeNullableNumber(lot.estimatedRent),
    notes: lot.notes ?? null,
  }));

  // `SimulationConversion` is the authoritative business trace for conversions.
  // `Simulation.convertedProjectId` is kept as a denormalized shortcut for
  // cheap reads in list/detail screens and for backward compatibility.
  const existingConvertedProjectId =
    simulation.conversionRecord?.projectId ?? simulation.convertedProjectId;
  const existingProject =
    simulation.conversionRecord?.project ?? simulation.convertedProject;

  const warnings: ConversionIssue[] = [];
  const blockingIssues: ConversionIssue[] = [];

  if (simulation.archivedAt) {
    blockingIssues.push({
      code: 'SIMULATION_ARCHIVED',
      message:
        'La simulation est archivee. Reactivez-la ou dupliquez-la avant de creer un projet.',
    });
  }

  if (existingConvertedProjectId) {
    blockingIssues.push({
      code: 'SIMULATION_ALREADY_CONVERTED',
      message:
        'Cette simulation a deja ete convertie. Axelys bloque volontairement les reconversions pour eviter les doublons silencieux.',
    });
  }

  if (!simulation.address) {
    warnings.push({
      code: 'PROJECT_ADDRESS_MISSING',
      message:
        "L'adresse n'est pas reprise car elle n'est pas renseignee dans la simulation.",
    });
  }

  if (previewLots.length === 0) {
    warnings.push({
      code: 'NO_SIMULATION_LOTS',
      message:
        'Aucun lot prepare dans la simulation. Le projet sera cree sans lot initial.',
    });
  }

  const lotsMissingSurface = previewLots.filter((lot) => lot.surface === null);
  if (lotsMissingSurface.length > 0) {
    warnings.push({
      code: 'LOTS_MISSING_SURFACE',
      message: `${lotsMissingSurface.length} lot(s) seront crees sans surface.`,
    });
  }

  if (simulation.strategy === 'RENTAL') {
    const lotsMissingRent = previewLots.filter(
      (lot) => lot.estimatedRent === null,
    );

    if (lotsMissingRent.length > 0 && previewLots.length > 0) {
      warnings.push({
        code: 'LOTS_MISSING_RENT',
        message: `${lotsMissingRent.length} lot(s) seront crees sans loyer estime.`,
      });
    }

    if (monthlyRentForecast === null) {
      warnings.push({
        code: 'RENT_FORECAST_MISSING',
        message:
          "Le snapshot sera cree sans loyer previsionnel exploitable, car aucun loyer cible n'est disponible.",
      });
    }
  }

  if (financingPlan.remainingGap > 0) {
    warnings.push({
      code: 'FINANCING_GAP_REMAINS',
      message: `Le plan de financement laisse un solde non couvert de ${financingPlan.remainingGap.toFixed(2)} EUR.`,
    });
  }

  const propertyTypeLabel = buildPropertyTypeLabel(simulation.propertyType);
  const projectFields: ConversionPreviewField[] = [
    {
      key: 'name',
      label: 'Nom du projet',
      kind: 'text',
      value: projectData.name,
    },
    {
      key: 'strategy',
      label: 'Strategie',
      kind: 'text',
      value: simulation.strategy,
    },
    {
      key: 'status',
      label: 'Statut initial',
      kind: 'text',
      value: ProjectStatus.ACQUISITION,
    },
    {
      key: 'purchasePrice',
      label: "Prix d'achat retenu",
      kind: 'currency',
      value: purchasePrice,
    },
    {
      key: 'notaryFees',
      label: 'Frais de notaire estimes',
      kind: 'currency',
      value: resolvedNotaryFees,
    },
    {
      key: 'worksBudget',
      label: 'Budget travaux retenu',
      kind: 'currency',
      value: worksBudget,
    },
    {
      key: 'addressLine1',
      label: 'Adresse',
      kind: 'text',
      value: projectData.addressLine1 ?? null,
    },
  ];

  const lotsSummary =
    previewLots.length > 0
      ? previewLots.map((lot) => ({
          name: lot.name,
          type: lot.type,
          surface: lot.surface,
          estimatedRent: lot.estimatedRent,
          notes: lot.notes,
        }))
      : [];

  const snapshotFields: ConversionPreviewField[] = [
    {
      key: 'totalProjectCost',
      label: 'Cout total previsionnel',
      kind: 'currency',
      value: metrics.totalProjectCost,
    },
    {
      key: 'equityRequired',
      label: 'Fonds propres mobilises',
      kind: 'currency',
      value: metrics.equityRequired,
    },
    {
      key: 'loanAmount',
      label: 'Montant du pret',
      kind: 'currency',
      value: normalizeNullableNumber(
        runtimeState.activeValues.activeFinancing.loanAmount,
      ),
    },
    {
      key: 'interestRate',
      label: "Taux d'interet",
      kind: 'percent',
      value: normalizeNullableNumber(
        runtimeState.activeValues.activeFinancing.rate,
      ),
    },
    {
      key: 'loanDurationMonths',
      label: 'Duree du pret (mois)',
      kind: 'number',
      value: runtimeState.activeValues.activeFinancing.durationMonths,
    },
    {
      key: 'estimatedMonthlyPayment',
      label: 'Mensualite estimee',
      kind: 'currency',
      value: metrics.estimatedMonthlyPayment,
    },
    {
      key: 'projectDurationMonths',
      label: 'Duree projet estimee (mois)',
      kind: 'number',
      value: metrics.projectDurationMonths,
    },
    {
      key: 'targetMonthlyRent',
      label: 'Loyer mensuel previsionnel',
      kind: 'currency',
      value: monthlyRentForecast,
    },
    {
      key: 'targetResalePrice',
      label: 'Prix de revente cible',
      kind: 'currency',
      value: targetResalePrice,
    },
    {
      key: 'grossMargin',
      label: 'Marge brute previsionnelle',
      kind: 'currency',
      value: metrics.grossMargin,
    },
    {
      key: 'grossYield',
      label: 'Rendement brut previsionnel',
      kind: 'percent',
      value: metrics.grossYield,
    },
    {
      key: 'decisionScore',
      label: 'Score decisionnel',
      kind: 'number',
      value: decision.score,
    },
    {
      key: 'recommendation',
      label: 'Recommendation',
      kind: 'text',
      value: decision.recommendation,
    },
    {
      key: 'lotsCount',
      label: 'Lots prepares',
      kind: 'number',
      value: previewLots.length,
    },
  ];

  const nonTransferredFields: ConversionPreviewField[] = [
    {
      key: 'journal',
      label: "Journal d'opportunite",
      kind: 'text',
      value: 'Conserve uniquement sur la simulation source',
      reason:
        "Le journal reste exploitable dans la simulation, mais n'est pas duplique dans le projet.",
    },
    {
      key: 'inactiveOptions',
      label: 'Options non actives',
      kind: 'text',
      value: 'Conservees uniquement sur la simulation source',
      reason:
        "Seule l'hypothese active est retenue pour creer le projet et le snapshot de reference.",
    },
    {
      key: 'activationHistory',
      label: "Historique d'activation",
      kind: 'text',
      value: 'Conserve uniquement sur la simulation source',
      reason:
        'La trace des arbitrages reste cote simulation pour eviter de surcharger la fiche projet.',
    },
    {
      key: 'propertyType',
      label: 'Nature juridique du bien (ancien / neuf)',
      kind: 'text',
      value: propertyTypeLabel,
      reason:
        "Cette information reste visible dans la simulation et le snapshot, mais n'alimente pas directement le modele Project V1.",
    },
    {
      key: 'workItems',
      label: 'Postes travaux detailles',
      kind: 'text',
      value:
        simulation.workItems.length > 0
          ? `${simulation.workItems.length} poste(s)`
          : 'Aucun poste detaille',
      reason:
        'Le projet V1 reprend le budget travaux retenu, pas le detail poste par poste.',
    },
  ];

  const snapshotData: Omit<
    Prisma.ProjectForecastSnapshotUncheckedCreateInput,
    'organizationId' | 'projectId' | 'simulationId' | 'conversionId'
  > = {
    referenceDate: new Date(),
    strategy: simulation.strategy,
    purchasePrice,
    acquisitionCost: metrics.acquisitionCost,
    notaryFees: resolvedNotaryFees,
    worksBudget,
    bufferAmount: normalizeNullableNumber(toNumber(simulation.bufferAmount)),
    downPayment: normalizeNullableNumber(toNumber(simulation.downPayment)),
    loanAmount: normalizeNullableNumber(
      runtimeState.activeValues.activeFinancing.loanAmount,
    ),
    interestRate: normalizeNullableNumber(
      runtimeState.activeValues.activeFinancing.rate,
    ),
    loanDurationMonths:
      runtimeState.activeValues.activeFinancing.durationMonths,
    estimatedMonthlyPayment: metrics.estimatedMonthlyPayment,
    estimatedProjectDurationMonths: metrics.projectDurationMonths,
    targetMonthlyRent: monthlyRentForecast,
    targetResalePrice,
    totalProjectCost: metrics.totalProjectCost,
    equityRequired: metrics.equityRequired,
    grossMargin: metrics.grossMargin,
    grossYield: metrics.grossYield,
    monthlyCashDelta: metrics.monthlyCashDelta,
    decisionScore: decision.score,
    decisionStatus: decision.status,
    recommendation: decision.recommendation,
    lotsCount: previewLots.length,
    lotsJson: lotsSummary as Prisma.InputJsonValue,
  };

  return {
    projectData,
    lotDraftData,
    snapshotData,
    preview: {
      simulation: {
        id: simulation.id,
        name: simulation.name,
        strategy: simulation.strategy,
        archivedAt: simulation.archivedAt,
        convertedProjectId: existingConvertedProjectId ?? null,
      },
      project: {
        name: projectData.name,
        addressLine1: projectData.addressLine1 ?? null,
        country: projectData.country ?? 'FR',
        type: projectData.type ?? ProjectType.OTHER,
        strategy: simulation.strategy,
        status: ProjectStatus.ACQUISITION,
        purchasePrice,
        notaryFees: resolvedNotaryFees,
        worksBudget,
        notes: projectData.notes ?? null,
      },
      lots: previewLots,
      projectFields,
      snapshotFields,
      nonTransferredFields,
      warnings,
      blockingIssues,
      canConvert: blockingIssues.length === 0,
      existingProject: existingProject
        ? {
            id: existingProject.id,
            name: existingProject.name,
          }
        : null,
    },
  };
}
