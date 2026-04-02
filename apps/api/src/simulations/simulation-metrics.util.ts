import {
  DecisionStatus,
  FinancingMode,
  SimulationPropertyType,
  SimulationStrategy,
} from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import {
  calculateSimulationNotaryFees,
  type SimulationNotaryFeesBreakdown,
} from './simulation-notary-fees.util';

type DecimalLike = {
  toNumber(): number;
};

type NumericValue = DecimalLike | number | string | null | undefined;

export type SimulationMetricsInput = {
  strategy: SimulationStrategy;
  purchasePrice: NumericValue;
  notaryFees: NumericValue;
  worksBudget: NumericValue;
  bufferAmount: NumericValue;
  financingMode: FinancingMode;
  downPayment: NumericValue;
  loanAmount: NumericValue;
  interestRate: NumericValue;
  loanDurationMonths: NumericValue;
  estimatedProjectDurationMonths: NumericValue;
  targetResalePrice: NumericValue;
  targetMonthlyRent: NumericValue;
};

export type SimulationAnalysisInput = {
  strategy: SimulationStrategy;
  purchasePrice: NumericValue;
  propertyType?: SimulationPropertyType | null;
  departmentCode?: string | null;
  isFirstTimeBuyer?: boolean | null;
  furnitureValue?: NumericValue;
  estimatedDisbursements?: NumericValue;
  notaryFees?: NumericValue;
  acquisitionFees?: NumericValue;
  worksBudget: NumericValue;
  bufferAmount: NumericValue;
  financingMode: FinancingMode;
  downPayment: NumericValue;
  loanAmount: NumericValue;
  interestRate: NumericValue;
  loanDurationMonths: NumericValue;
  estimatedProjectDurationMonths: NumericValue;
  targetResalePrice: NumericValue;
  targetMonthlyRent: NumericValue;
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

export type SimulationDecision = {
  score: number;
  status: DecisionStatus;
  recommendation: string;
  warnings: string[];
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
    financingMode: FinancingMode;
    downPayment: number;
    loanAmount: number;
    total: number;
  };
  requiredCash: number;
  remainingGap: number;
};

function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  durationMonths: number,
): number {
  if (loanAmount <= 0 || annualRate <= 0 || durationMonths <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
    (Math.pow(1 + monthlyRate, durationMonths) - 1);

  return payment;
}

export function calculateSimulationMetrics(
  input: SimulationMetricsInput,
): SimulationMetrics {
  const purchasePrice = toNumber(input.purchasePrice) ?? 0;
  const notaryFees = toNumber(input.notaryFees) ?? 0;
  const worksBudget = toNumber(input.worksBudget) ?? 0;
  const bufferAmount = toNumber(input.bufferAmount) ?? 0;
  const downPayment = toNumber(input.downPayment) ?? 0;
  const loanAmount = toNumber(input.loanAmount) ?? 0;
  const interestRate = toNumber(input.interestRate) ?? 0;
  const loanDurationMonths = toNumber(input.loanDurationMonths) ?? 0;
  const projectDurationMonths = toNumber(input.estimatedProjectDurationMonths);
  const targetResalePrice = toNumber(input.targetResalePrice);
  const targetMonthlyRent = toNumber(input.targetMonthlyRent);

  const acquisitionCost = purchasePrice + notaryFees;
  const totalProjectCost =
    purchasePrice + notaryFees + worksBudget + bufferAmount;

  let equityRequired = 0;
  if (input.financingMode === FinancingMode.CASH) {
    equityRequired = totalProjectCost;
  } else {
    equityRequired = downPayment + notaryFees + worksBudget + bufferAmount;
  }

  let grossMargin: number | null = null;
  let marginRate: number | null = null;
  let grossYield: number | null = null;
  let estimatedMonthlyPayment: number | null = null;
  let monthlyCashDelta: number | null = null;
  let simplePaybackYears: number | null = null;

  if (input.strategy === SimulationStrategy.FLIP) {
    if (targetResalePrice !== null && totalProjectCost > 0) {
      grossMargin = targetResalePrice - totalProjectCost;
      marginRate = (grossMargin / totalProjectCost) * 100;
    }
  } else {
    if (targetMonthlyRent !== null && totalProjectCost > 0) {
      grossYield = ((targetMonthlyRent * 12) / totalProjectCost) * 100;
    }

    if (
      input.financingMode === FinancingMode.LOAN &&
      loanAmount > 0 &&
      interestRate > 0 &&
      loanDurationMonths > 0
    ) {
      estimatedMonthlyPayment = calculateMonthlyPayment(
        loanAmount,
        interestRate,
        loanDurationMonths,
      );

      if (targetMonthlyRent !== null) {
        monthlyCashDelta = targetMonthlyRent - estimatedMonthlyPayment;
      }
    }

    if (
      input.financingMode === FinancingMode.CASH &&
      targetMonthlyRent !== null &&
      targetMonthlyRent > 0
    ) {
      simplePaybackYears = totalProjectCost / (targetMonthlyRent * 12);
    }
  }

  return {
    totalProjectCost,
    equityRequired,
    acquisitionCost,
    grossMargin,
    marginRate,
    grossYield,
    estimatedMonthlyPayment,
    monthlyCashDelta,
    simplePaybackYears,
    projectDurationMonths,
  };
}

export function calculateSimulationDecision(
  input: SimulationMetricsInput,
  metrics: SimulationMetrics,
): SimulationDecision {
  const warnings: string[] = [];
  let profitabilityScore = 0;
  let capitalScore = 0;
  let riskScore = 0;

  const purchasePrice = toNumber(input.purchasePrice) ?? 0;
  const worksBudget = toNumber(input.worksBudget) ?? 0;
  const targetResalePrice = toNumber(input.targetResalePrice);
  const targetMonthlyRent = toNumber(input.targetMonthlyRent);

  if (purchasePrice === 0) {
    warnings.push("Prix d'achat manquant");
    riskScore -= 30;
  }

  if (input.strategy === SimulationStrategy.FLIP) {
    if (targetResalePrice === null) {
      warnings.push('Prix de revente cible manquant');
      riskScore -= 20;
    } else if (metrics.marginRate !== null) {
      if (metrics.marginRate >= 25) {
        profitabilityScore = 100;
      } else if (metrics.marginRate >= 15) {
        profitabilityScore = 70;
      } else if (metrics.marginRate >= 10) {
        profitabilityScore = 50;
      } else {
        profitabilityScore = 20;
        warnings.push('Marge faible');
      }
    }

    if (worksBudget / purchasePrice > 0.5 && purchasePrice > 0) {
      warnings.push('Budget travaux élevé vs prix achat');
      riskScore -= 10;
    }
  } else {
    if (targetMonthlyRent === null) {
      warnings.push('Loyer cible manquant');
      riskScore -= 20;
    } else if (metrics.grossYield !== null) {
      if (metrics.grossYield >= 8) {
        profitabilityScore = 100;
      } else if (metrics.grossYield >= 6) {
        profitabilityScore = 70;
      } else if (metrics.grossYield >= 4) {
        profitabilityScore = 50;
      } else {
        profitabilityScore = 20;
        warnings.push('Rendement brut faible');
      }
    }

    if (metrics.monthlyCashDelta !== null && metrics.monthlyCashDelta < -200) {
      warnings.push('Effort mensuel négatif important');
      riskScore -= 15;
    }
  }

  if (metrics.equityRequired > 0) {
    if (metrics.equityRequired < 50_000) {
      capitalScore = 100;
    } else if (metrics.equityRequired < 100_000) {
      capitalScore = 80;
    } else if (metrics.equityRequired < 200_000) {
      capitalScore = 60;
    } else {
      capitalScore = 40;
    }
  }

  const dataCompletenessBonus = warnings.length === 0 ? 20 : 0;
  riskScore = Math.max(0, 100 + riskScore + dataCompletenessBonus);

  const finalScore = Math.round(
    profitabilityScore * 0.5 + capitalScore * 0.2 + riskScore * 0.3,
  );

  let status: DecisionStatus;
  let recommendation: string;

  if (finalScore >= 70) {
    status = DecisionStatus.GOOD;
    recommendation = 'Intéressant';
  } else if (finalScore >= 45) {
    status = DecisionStatus.REVIEW;
    recommendation = 'À négocier';
  } else {
    status = DecisionStatus.RISKY;
    recommendation = 'Trop risqué';
  }

  return {
    score: finalScore,
    status,
    recommendation,
    warnings,
  };
}

function resolveCalculatedNotaryFees(
  input: SimulationAnalysisInput,
): SimulationNotaryFeesBreakdown | null {
  if (!input.propertyType || !input.departmentCode) {
    return null;
  }

  return calculateSimulationNotaryFees({
    purchasePrice: input.purchasePrice,
    propertyType: input.propertyType,
    departmentCode: input.departmentCode,
    isFirstTimeBuyer: input.isFirstTimeBuyer,
    furnitureValue: input.furnitureValue,
    estimatedDisbursements: input.estimatedDisbursements,
  });
}

function calculateSimulationFinancingPlan(
  input: Pick<
    SimulationAnalysisInput,
    | 'purchasePrice'
    | 'worksBudget'
    | 'bufferAmount'
    | 'financingMode'
    | 'downPayment'
    | 'loanAmount'
  > & {
    notaryFees: number;
  },
): SimulationFinancingPlan {
  const purchasePrice = toNumber(input.purchasePrice) ?? 0;
  const worksBudget = toNumber(input.worksBudget) ?? 0;
  const bufferAmount = toNumber(input.bufferAmount) ?? 0;
  const downPayment = toNumber(input.downPayment) ?? 0;
  const loanAmount = toNumber(input.loanAmount) ?? 0;
  const totalUses =
    purchasePrice + input.notaryFees + worksBudget + bufferAmount;

  if (input.financingMode === FinancingMode.CASH) {
    return {
      uses: {
        purchasePrice,
        notaryFees: input.notaryFees,
        worksBudget,
        bufferAmount,
        total: totalUses,
      },
      resources: {
        financingMode: FinancingMode.CASH,
        downPayment: totalUses,
        loanAmount: 0,
        total: totalUses,
      },
      requiredCash: totalUses,
      remainingGap: 0,
    };
  }

  const totalResources = downPayment + loanAmount;

  return {
    uses: {
      purchasePrice,
      notaryFees: input.notaryFees,
      worksBudget,
      bufferAmount,
      total: totalUses,
    },
    resources: {
      financingMode: FinancingMode.LOAN,
      downPayment,
      loanAmount,
      total: totalResources,
    },
    requiredCash: Math.max(totalUses - loanAmount, 0),
    remainingGap: totalUses - totalResources,
  };
}

export function buildSimulationResults(input: SimulationAnalysisInput) {
  const calculatedNotaryFees = resolveCalculatedNotaryFees(input);
  const effectiveNotaryFees =
    calculatedNotaryFees?.total ??
    toNumber(input.notaryFees) ??
    toNumber(input.acquisitionFees) ??
    0;
  const metrics = calculateSimulationMetrics({
    strategy: input.strategy,
    purchasePrice: input.purchasePrice,
    notaryFees: effectiveNotaryFees,
    worksBudget: input.worksBudget,
    bufferAmount: input.bufferAmount,
    financingMode: input.financingMode,
    downPayment: input.downPayment,
    loanAmount: input.loanAmount,
    interestRate: input.interestRate,
    loanDurationMonths: input.loanDurationMonths,
    estimatedProjectDurationMonths: input.estimatedProjectDurationMonths,
    targetResalePrice: input.targetResalePrice,
    targetMonthlyRent: input.targetMonthlyRent,
  });
  const decision = calculateSimulationDecision(
    {
      strategy: input.strategy,
      purchasePrice: input.purchasePrice,
      notaryFees: effectiveNotaryFees,
      worksBudget: input.worksBudget,
      bufferAmount: input.bufferAmount,
      financingMode: input.financingMode,
      downPayment: input.downPayment,
      loanAmount: input.loanAmount,
      interestRate: input.interestRate,
      loanDurationMonths: input.loanDurationMonths,
      estimatedProjectDurationMonths: input.estimatedProjectDurationMonths,
      targetResalePrice: input.targetResalePrice,
      targetMonthlyRent: input.targetMonthlyRent,
    },
    metrics,
  );
  const financingPlan = calculateSimulationFinancingPlan({
    purchasePrice: input.purchasePrice,
    notaryFees: effectiveNotaryFees,
    worksBudget: input.worksBudget,
    bufferAmount: input.bufferAmount,
    financingMode: input.financingMode,
    downPayment: input.downPayment,
    loanAmount: input.loanAmount,
  });

  return {
    metrics,
    decision,
    notaryFees: calculatedNotaryFees,
    financingPlan,
  };
}
