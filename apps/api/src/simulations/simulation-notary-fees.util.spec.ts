import { SimulationPropertyType } from '@prisma/client';
import { calculateSimulationNotaryFees } from './simulation-notary-fees.util';

describe('calculateSimulationNotaryFees', () => {
  it('calculates old-property fees with a standard departmental rate', () => {
    const result = calculateSimulationNotaryFees({
      purchasePrice: 250_000,
      propertyType: SimulationPropertyType.ANCIEN,
      departmentCode: '05',
    });

    expect(result.taxableBase).toBe(250_000);
    expect(result.transferTaxes).toBeCloseTo(14_516.63, 2);
    expect(result.securityContribution).toBe(250);
    expect(result.notaryEmoluments).toBeCloseTo(2_394.75, 2);
    expect(result.disbursements).toBe(1_000);
    expect(result.total).toBeCloseTo(18_161.38, 2);
    expect(result.appliedRates.departmentTransferTaxRate).toBe(4.5);
  });

  it('calculates old-property fees with a majorated departmental rate', () => {
    const result = calculateSimulationNotaryFees({
      purchasePrice: 250_000,
      propertyType: SimulationPropertyType.ANCIEN,
      departmentCode: '75',
    });

    expect(result.transferTaxes).toBeCloseTo(15_796.25, 2);
    expect(result.total).toBeCloseTo(19_441, 2);
    expect(result.appliedRates.departmentTransferTaxRate).toBe(5);
  });

  it('calculates fees for new property / VEFA', () => {
    const result = calculateSimulationNotaryFees({
      purchasePrice: 250_000,
      propertyType: SimulationPropertyType.NEUF_VEFA,
      departmentCode: '75',
    });

    expect(result.transferTaxes).toBeCloseTo(1_787.45, 2);
    expect(result.total).toBeCloseTo(5_432.2, 2);
    expect(result.appliedRates.departmentTransferTaxRate).toBe(0.7);
    expect(result.appliedRates.municipalTransferTaxRate).toBe(0);
  });

  it('deducts furniture from the taxable base', () => {
    const result = calculateSimulationNotaryFees({
      purchasePrice: 250_000,
      propertyType: SimulationPropertyType.ANCIEN,
      departmentCode: '75',
      furnitureValue: 10_000,
    });

    expect(result.taxableBase).toBe(240_000);
    expect(result.transferTaxes).toBeCloseTo(15_164.4, 2);
    expect(result.notaryEmoluments).toBeCloseTo(2_314.85, 2);
    expect(result.total).toBeCloseTo(18_719.25, 2);
  });

  it('applies the 15 euro minimum security contribution', () => {
    const result = calculateSimulationNotaryFees({
      purchasePrice: 1_000,
      propertyType: SimulationPropertyType.ANCIEN,
      departmentCode: '75',
      estimatedDisbursements: 0,
    });

    expect(result.securityContribution).toBe(15);
    expect(result.total).toBeCloseTo(116.89, 2);
  });
});
