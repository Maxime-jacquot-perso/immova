import { SimulationPropertyType } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';

type DecimalLike = {
  toNumber(): number;
};

type NumericValue = DecimalLike | number | string | null | undefined;

type DepartmentRateConfig = {
  currentRate: number;
  referenceRate: number;
};

export type SimulationNotaryFeesInput = {
  purchasePrice: NumericValue;
  propertyType: SimulationPropertyType;
  departmentCode: string;
  isFirstTimeBuyer?: boolean | null;
  furnitureValue?: NumericValue;
  estimatedDisbursements?: NumericValue;
};

export type NotaryEmolumentBracketBreakdown = {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  amount: number;
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
    emolumentBrackets: NotaryEmolumentBracketBreakdown[];
  };
};

export const DEFAULT_ESTIMATED_DISBURSEMENTS = 1_000;
export const SECURITY_CONTRIBUTION_RATE = 0.1;
export const SECURITY_CONTRIBUTION_MINIMUM = 15;
export const OLD_PROPERTY_COMMUNAL_TRANSFER_TAX_RATE = 1.2;
export const NEW_PROPERTY_DEPARTMENT_TRANSFER_TAX_RATE = 0.7;
export const OLD_PROPERTY_COLLECTION_RATE = 2.37;
export const NEW_PROPERTY_COLLECTION_RATE = 2.14;
export const NOTARY_RATE_SOURCE =
  'DGFiP DMTO au 1er fevrier 2026 (hors primo-accedant)';

const DEFAULT_OLD_PROPERTY_DEPARTMENT_RATE_CONFIG: DepartmentRateConfig = {
  currentRate: 5,
  referenceRate: 4.5,
};

const OLD_PROPERTY_DEPARTMENT_RATE_OVERRIDES: Record<
  string,
  DepartmentRateConfig
> = {
  '05': { currentRate: 4.5, referenceRate: 4.5 },
  '06': { currentRate: 4.5, referenceRate: 4.5 },
  '07': { currentRate: 4.5, referenceRate: 4.5 },
  '16': { currentRate: 4.5, referenceRate: 4.5 },
  '26': { currentRate: 4.5, referenceRate: 4.5 },
  '27': { currentRate: 4.5, referenceRate: 4.5 },
  '36': { currentRate: 3.8, referenceRate: 3.8 },
  '48': { currentRate: 4.5, referenceRate: 4.5 },
  '60': { currentRate: 4.5, referenceRate: 4.5 },
  '65': { currentRate: 4.5, referenceRate: 3.8 },
  '71': { currentRate: 4.5, referenceRate: 4.5 },
  '971': { currentRate: 4.5, referenceRate: 4.5 },
  '976': { currentRate: 3.8, referenceRate: 3.8 },
};

const EMOLUMENT_BRACKETS: Array<{
  from: number;
  to: number | null;
  rate: number;
}> = [
  { from: 0, to: 6_500, rate: 3.87 },
  { from: 6_500, to: 17_000, rate: 1.596 },
  { from: 17_000, to: 60_000, rate: 1.064 },
  { from: 60_000, to: null, rate: 0.799 },
];

function roundToCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getNumericValue(value: NumericValue, fallback = 0) {
  return toNumber(value) ?? fallback;
}

export function normalizeDepartmentCode(departmentCode: string) {
  const normalized = departmentCode.trim().toUpperCase();

  if (/^(?:0?[1-9]|[1-8]\d|9[0-5]|2A|2B|20|97[1-6])$/.test(normalized)) {
    if (/^\d$/.test(normalized)) {
      return normalized.padStart(2, '0');
    }

    return normalized;
  }

  throw new Error(`Unsupported department code "${departmentCode}"`);
}

export function getOldPropertyDepartmentRateConfig(departmentCode: string) {
  const normalized = normalizeDepartmentCode(departmentCode);
  return (
    OLD_PROPERTY_DEPARTMENT_RATE_OVERRIDES[normalized] ??
    DEFAULT_OLD_PROPERTY_DEPARTMENT_RATE_CONFIG
  );
}

function calculateEmoluments(taxableBase: number) {
  return EMOLUMENT_BRACKETS.map((bracket) => {
    const upperBound = bracket.to ?? taxableBase;
    const taxableAmount = Math.max(
      0,
      Math.min(taxableBase, upperBound) - bracket.from,
    );

    return {
      from: bracket.from,
      to: bracket.to,
      rate: bracket.rate,
      taxableAmount: roundToCents(taxableAmount),
      amount: roundToCents((taxableAmount * bracket.rate) / 100),
    };
  }).filter((bracket) => bracket.taxableAmount > 0);
}

export function calculateSimulationNotaryFees(
  input: SimulationNotaryFeesInput,
): SimulationNotaryFeesBreakdown {
  const purchasePrice = getNumericValue(input.purchasePrice);
  const furnitureValue = getNumericValue(input.furnitureValue);
  const estimatedDisbursements = roundToCents(
    getNumericValue(
      input.estimatedDisbursements,
      DEFAULT_ESTIMATED_DISBURSEMENTS,
    ),
  );
  const taxableBase = roundToCents(Math.max(0, purchasePrice - furnitureValue));
  const departmentCode = normalizeDepartmentCode(input.departmentCode);
  const firstTimeBuyerCaptured = Boolean(input.isFirstTimeBuyer);
  const departmentRateConfig =
    input.propertyType === SimulationPropertyType.ANCIEN
      ? getOldPropertyDepartmentRateConfig(departmentCode)
      : null;

  const municipalTransferTaxRate =
    input.propertyType === SimulationPropertyType.ANCIEN
      ? OLD_PROPERTY_COMMUNAL_TRANSFER_TAX_RATE
      : 0;
  const departmentTransferTaxRate =
    input.propertyType === SimulationPropertyType.ANCIEN
      ? (departmentRateConfig?.currentRate ??
        DEFAULT_OLD_PROPERTY_DEPARTMENT_RATE_CONFIG.currentRate)
      : NEW_PROPERTY_DEPARTMENT_TRANSFER_TAX_RATE;
  const departmentReferenceRate =
    input.propertyType === SimulationPropertyType.ANCIEN
      ? (departmentRateConfig?.referenceRate ??
        DEFAULT_OLD_PROPERTY_DEPARTMENT_RATE_CONFIG.referenceRate)
      : NEW_PROPERTY_DEPARTMENT_TRANSFER_TAX_RATE;
  const collectionRate =
    input.propertyType === SimulationPropertyType.ANCIEN
      ? OLD_PROPERTY_COLLECTION_RATE
      : NEW_PROPERTY_COLLECTION_RATE;

  const municipalTransferTaxes = roundToCents(
    (taxableBase * municipalTransferTaxRate) / 100,
  );
  const departmentTransferTaxes = roundToCents(
    (taxableBase * departmentTransferTaxRate) / 100,
  );
  const collectionTaxes = roundToCents(
    (departmentTransferTaxes * collectionRate) / 100,
  );
  const transferTaxes = roundToCents(
    municipalTransferTaxes + departmentTransferTaxes + collectionTaxes,
  );
  const securityContribution = roundToCents(
    Math.max(
      (taxableBase * SECURITY_CONTRIBUTION_RATE) / 100,
      SECURITY_CONTRIBUTION_MINIMUM,
    ),
  );
  const emolumentBrackets = calculateEmoluments(taxableBase);
  const notaryEmoluments = roundToCents(
    emolumentBrackets.reduce((sum, bracket) => sum + bracket.amount, 0),
  );
  const total = roundToCents(
    transferTaxes +
      securityContribution +
      notaryEmoluments +
      estimatedDisbursements,
  );

  return {
    taxableBase,
    transferTaxes,
    securityContribution,
    notaryEmoluments,
    disbursements: estimatedDisbursements,
    total,
    appliedRates: {
      propertyType: input.propertyType,
      departmentCode,
      departmentTransferTaxRate,
      departmentReferenceRate,
      municipalTransferTaxRate,
      collectionRate,
      securityContributionRate: SECURITY_CONTRIBUTION_RATE,
      securityContributionMinimum: SECURITY_CONTRIBUTION_MINIMUM,
      defaultEstimatedDisbursements: DEFAULT_ESTIMATED_DISBURSEMENTS,
      firstTimeBuyerCaptured,
      firstTimeBuyerAdjustmentApplied: false,
      rateSource: NOTARY_RATE_SOURCE,
      emolumentBrackets,
    },
  };
}
