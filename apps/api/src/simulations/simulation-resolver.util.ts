import {
  Simulation,
  SimulationWorkItem,
  WorkItemOption,
  SimulationLot,
  OptionStatus,
  SimulationOption,
  SimulationOptionGroup,
  SimulationOptionGroupType,
} from '@prisma/client';
import { buildSimulationResults } from './simulation-metrics.util';

/**
 * Helper function to convert Prisma Decimal to number safely
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'object' && 'toNumber' in value) {
    const nextValue = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(nextValue) ? nextValue : null;
  }

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function toNullableInteger(value: unknown): number | null {
  const nextValue = toNullableNumber(value);

  if (nextValue === null) {
    return null;
  }

  return Math.trunc(nextValue);
}

export interface ActiveValuesResult {
  activePurchasePrice: number;
  activePurchasePriceSource: string;
  activeWorksCost: number;
  activeWorksCostSource: string;
  worksCostBreakdown: Array<{
    itemName: string;
    cost: number;
    source: 'initial' | 'option';
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
}

export function resolveActiveValues(
  simulation: Simulation,
  workItems: (SimulationWorkItem & { options: WorkItemOption[] })[],
  lots: SimulationLot[],
  optionGroups?: (SimulationOptionGroup & {
    activeOption: SimulationOption | null;
  })[],
): ActiveValuesResult {
  // Helper pour récupérer l'option active d'un groupe par type
  const getActiveOptionGroup = (type: SimulationOptionGroupType) => {
    if (!optionGroups) return null;
    return optionGroups.find((group) => group.type === type) ?? null;
  };

  const getActiveOptionValue = (type: SimulationOptionGroupType) => {
    return getActiveOptionGroup(type)?.activeOption?.valueJson || null;
  };

  // 1. TRAVAUX
  let activeWorksCost: number;
  let activeWorksCostSource: string;
  const worksCostBreakdown: Array<{
    itemName: string;
    cost: number;
    source: 'initial' | 'option';
    providerName?: string;
  }> = [];
  const workBudgetValue = getActiveOptionValue(
    SimulationOptionGroupType.WORK_BUDGET,
  );
  const workBudgetGroup = getActiveOptionGroup(
    SimulationOptionGroupType.WORK_BUDGET,
  );

  if (!workItems || workItems.length === 0) {
    if (workBudgetValue && typeof workBudgetValue === 'object') {
      const valueData = workBudgetValue as Record<string, unknown>;
      activeWorksCost =
        toNullableNumber(valueData.cost ?? valueData.value) ??
        toNumber(simulation.worksBudget);
      activeWorksCostSource = `OPTION: ${
        workBudgetGroup?.activeOption?.label || 'active'
      }`;
    } else {
      // Pas de postes : budget global
      activeWorksCost = toNumber(simulation.worksBudget);
      activeWorksCostSource = 'INITIAL (budget global)';
    }
  } else {
    // Postes définis : somme des actifs
    let total = 0;
    for (const item of workItems) {
      const activeOption = item.options.find(
        (opt) => opt.status === OptionStatus.ACTIVE,
      );
      const cost = activeOption
        ? toNumber(activeOption.cost)
        : toNumber(item.initialCost);

      total += cost;
      worksCostBreakdown.push({
        itemName: item.name,
        cost,
        source: activeOption ? 'option' : 'initial',
        providerName: activeOption?.providerName,
      });
    }
    activeWorksCost = total;
    activeWorksCostSource = worksCostBreakdown.some(
      (b) => b.source === 'option',
    )
      ? 'POSTES (avec options)'
      : 'POSTES (estimations initiales)';
  }

  // 2. LOYER
  // Précision: Si au moins un lot a un loyer estimé > 0, on somme tous les loyers renseignés
  // Les lots sans loyer contribuent 0
  const lotsWithRent = lots.filter((lot) => toNumber(lot.estimatedRent) > 0);
  let activeMonthlyRent: number;
  let activeMonthlyRentSource: string;

  if (lotsWithRent.length > 0) {
    // Au moins un lot a un loyer : on somme tous les loyers (y compris les 0)
    activeMonthlyRent = lots.reduce(
      (sum, lot) => sum + toNumber(lot.estimatedRent),
      0,
    );
    activeMonthlyRentSource = `LOTS (${lotsWithRent.length} définis)`;
  } else {
    // Aucun lot avec loyer : loyer manuel global
    activeMonthlyRent = toNumber(simulation.targetMonthlyRent);
    activeMonthlyRentSource = 'INITIAL (loyer manuel)';
  }

  // 3. PRIX D'ACHAT
  // Si une option PURCHASE_PRICE est active, l'utiliser
  let activePurchasePrice: number;
  let activePurchasePriceSource: string;

  const purchasePriceValue = getActiveOptionValue(
    SimulationOptionGroupType.PURCHASE_PRICE,
  );
  const purchasePriceGroup = getActiveOptionGroup(
    SimulationOptionGroupType.PURCHASE_PRICE,
  );

  if (purchasePriceValue && typeof purchasePriceValue === 'object') {
    const valueData = purchasePriceValue as Record<string, unknown>;
    activePurchasePrice =
      toNullableNumber(valueData.price ?? valueData.value) ??
      toNumber(simulation.purchasePrice);
    activePurchasePriceSource = `OPTION: ${
      purchasePriceGroup?.activeOption?.label || 'active'
    }`;
  } else {
    activePurchasePrice = toNumber(simulation.purchasePrice);
    activePurchasePriceSource = 'INITIAL';
  }

  // 4. FINANCEMENT
  // Si une option FINANCING est active, l'utiliser
  let activeFinancing: {
    mode: string;
    rate: number | null;
    durationMonths: number | null;
    loanAmount: number | null;
    source: string;
  };

  const financingValue = getActiveOptionValue(
    SimulationOptionGroupType.FINANCING,
  );
  const financingGroup = getActiveOptionGroup(
    SimulationOptionGroupType.FINANCING,
  );

  if (financingValue && typeof financingValue === 'object') {
    const valueData = financingValue as Record<string, unknown>;
    activeFinancing = {
      mode:
        typeof valueData.mode === 'string'
          ? valueData.mode
          : simulation.financingMode,
      rate:
        toNullableNumber(valueData.rate) ??
        toNullableNumber(simulation.interestRate),
      durationMonths:
        toNullableInteger(valueData.durationMonths) ??
        simulation.loanDurationMonths,
      loanAmount:
        toNullableNumber(valueData.loanAmount) ??
        toNullableNumber(simulation.loanAmount),
      source: `OPTION: ${financingGroup?.activeOption?.label || 'active'}`,
    };
  } else {
    activeFinancing = {
      mode: simulation.financingMode,
      rate: toNullableNumber(simulation.interestRate),
      durationMonths: simulation.loanDurationMonths,
      loanAmount: toNullableNumber(simulation.loanAmount),
      source: 'INITIAL',
    };
  }

  return {
    activePurchasePrice,
    activePurchasePriceSource,
    activeWorksCost,
    activeWorksCostSource,
    worksCostBreakdown,
    activeMonthlyRent,
    activeMonthlyRentSource,
    activeFinancing,
  };
}

export function buildSimulationRuntimeState(
  simulation: Simulation,
  workItems: (SimulationWorkItem & { options: WorkItemOption[] })[],
  lots: SimulationLot[],
  optionGroups?: (SimulationOptionGroup & {
    activeOption: SimulationOption | null;
  })[],
) {
  const activeValues = resolveActiveValues(
    simulation,
    workItems,
    lots,
    optionGroups,
  );
  const activeWorkBudgetValue = optionGroups?.find(
    (group) => group.type === SimulationOptionGroupType.WORK_BUDGET,
  )?.activeOption?.valueJson;
  const activeProjectDurationMonths =
    activeWorkBudgetValue &&
    typeof activeWorkBudgetValue === 'object' &&
    !Array.isArray(activeWorkBudgetValue)
      ? (toNullableInteger(
          (activeWorkBudgetValue as Record<string, unknown>).durationMonths,
        ) ?? simulation.estimatedProjectDurationMonths)
      : simulation.estimatedProjectDurationMonths;

  const results = buildSimulationResults({
    strategy: simulation.strategy,
    propertyType: simulation.propertyType,
    departmentCode: simulation.departmentCode,
    isFirstTimeBuyer: simulation.isFirstTimeBuyer,
    purchasePrice: activeValues.activePurchasePrice,
    furnitureValue: simulation.furnitureValue,
    estimatedDisbursements: simulation.estimatedDisbursements,
    notaryFees: simulation.notaryFees,
    acquisitionFees: simulation.acquisitionFees,
    worksBudget: activeValues.activeWorksCost,
    bufferAmount: simulation.bufferAmount,
    financingMode: activeValues.activeFinancing.mode as 'CASH' | 'LOAN',
    downPayment: simulation.downPayment,
    loanAmount: activeValues.activeFinancing.loanAmount,
    interestRate: activeValues.activeFinancing.rate,
    loanDurationMonths: activeValues.activeFinancing.durationMonths,
    estimatedProjectDurationMonths: activeProjectDurationMonths,
    targetResalePrice: simulation.targetResalePrice,
    targetMonthlyRent: activeValues.activeMonthlyRent,
  });

  return {
    activeValues,
    results,
  };
}
