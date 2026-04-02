import type { SimulationWithDetails } from './api';
import {
  defaultSimulationFormFields,
  type SimulationFormFields,
  type SimulationFormValues,
} from './schemas';

export function buildSimulationFormFields(
  defaults: Partial<SimulationFormFields> = {},
): SimulationFormFields {
  return {
    ...defaultSimulationFormFields,
    ...defaults,
  };
}

export function mapSimulationToFormFields(
  simulation: SimulationWithDetails,
): Partial<SimulationFormFields> {
  return {
    folderId: simulation.folderId,
    name: simulation.name,
    address: simulation.address || '',
    strategy: simulation.strategy,
    propertyType: simulation.propertyType ?? 'ANCIEN',
    departmentCode: simulation.departmentCode || '',
    isFirstTimeBuyer: simulation.isFirstTimeBuyer,
    purchasePrice: simulation.purchasePrice?.toString() || '',
    furnitureValue: simulation.furnitureValue?.toString() || '',
    estimatedDisbursements:
      simulation.estimatedDisbursements?.toString() || '1000',
    worksBudget: simulation.worksBudget?.toString() || '',
    financingMode: simulation.financingMode,
    downPayment: simulation.downPayment?.toString() || '',
    loanAmount: simulation.loanAmount?.toString() || '',
    interestRate: simulation.interestRate?.toString() || '',
    loanDurationMonths: simulation.loanDurationMonths?.toString() || '',
    estimatedProjectDurationMonths:
      simulation.estimatedProjectDurationMonths?.toString() || '',
    targetResalePrice: simulation.targetResalePrice?.toString() || '',
    targetMonthlyRent: simulation.targetMonthlyRent?.toString() || '',
    bufferAmount: simulation.bufferAmount?.toString() || '',
    notes: simulation.notes || '',
  };
}

export function mapSimulationFormValuesToPayload(
  values: SimulationFormValues,
) {
  const usesLoan = values.financingMode === 'LOAN';
  const isFlip = values.strategy === 'FLIP';

  return {
    folderId: values.folderId,
    name: values.name,
    address: values.address || undefined,
    strategy: values.strategy,
    propertyType: values.propertyType,
    departmentCode: values.departmentCode.trim().toUpperCase(),
    isFirstTimeBuyer: values.isFirstTimeBuyer,
    purchasePrice: values.purchasePrice,
    furnitureValue: values.furnitureValue,
    estimatedDisbursements: values.estimatedDisbursements,
    worksBudget: values.worksBudget,
    financingMode: values.financingMode,
    downPayment: usesLoan ? values.downPayment : undefined,
    loanAmount: usesLoan ? values.loanAmount : undefined,
    interestRate: usesLoan ? values.interestRate : undefined,
    loanDurationMonths: usesLoan ? values.loanDurationMonths : undefined,
    estimatedProjectDurationMonths: values.estimatedProjectDurationMonths,
    targetResalePrice: isFlip ? values.targetResalePrice : undefined,
    targetMonthlyRent: isFlip ? undefined : values.targetMonthlyRent,
    bufferAmount: values.bufferAmount,
    notes: values.notes || undefined,
  };
}

export function mapSimulationFormValuesToUpdatePayload(
  values: SimulationFormValues,
) {
  const payload = mapSimulationFormValuesToPayload(values);

  return {
    name: payload.name,
    address: payload.address,
    strategy: payload.strategy,
    propertyType: payload.propertyType,
    departmentCode: payload.departmentCode,
    isFirstTimeBuyer: payload.isFirstTimeBuyer,
    purchasePrice: payload.purchasePrice,
    furnitureValue: payload.furnitureValue,
    estimatedDisbursements: payload.estimatedDisbursements,
    worksBudget: payload.worksBudget,
    financingMode: payload.financingMode,
    downPayment: payload.downPayment,
    loanAmount: payload.loanAmount,
    interestRate: payload.interestRate,
    loanDurationMonths: payload.loanDurationMonths,
    estimatedProjectDurationMonths: payload.estimatedProjectDurationMonths,
    targetResalePrice: payload.targetResalePrice,
    targetMonthlyRent: payload.targetMonthlyRent,
    bufferAmount: payload.bufferAmount,
    notes: payload.notes,
  };
}
