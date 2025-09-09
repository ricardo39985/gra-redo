import { describe, it, expect } from 'vitest';
import { calculateGasoline, calculateDiesel } from '../app/utils/tax';

describe('tax calculations', () => {
  it('calculates gasoline tax for under4 small engine', () => {
    const res = calculateGasoline({
      cc: 1000,
      cif: 1000,
      exchangeRate: 200,
      vehicleType: 'Car',
      ageCategory: 'under4'
    });
    expect(res.duty).toBeCloseTo(350);
    expect(res.vat).toBeCloseTo(189);
    expect(res.totalTax).toBeCloseTo(539);
  });

  it('calculates diesel tax for under4 small engine', () => {
    const res = calculateDiesel({
      cc: 1000,
      cif: 1000,
      exchangeRate: 200,
      ageCategory: 'under4'
    });
    expect(res.duty).toBeCloseTo(350);
    expect(res.vat).toBeCloseTo(189);
    expect(res.totalTax).toBeCloseTo(539);
  });

  it.each([
    { cc: 1000, expectedExcise: 4000 },
    { cc: 1200, expectedExcise: 4000 },
    { cc: 1700, expectedExcise: 8100 },
    { cc: 1900, expectedExcise: 8750 },
    { cc: 2500, expectedExcise: 23650 },
    { cc: 3500, expectedExcise: 30000 }
  ])('calculates gasoline tax for over4 cc $cc', ({ cc, expectedExcise }) => {
    const res = calculateGasoline({
      cc,
      cif: 1000,
      exchangeRate: 200,
      vehicleType: 'Car',
      ageCategory: 'over4'
    });
    expect(res.duty).toBe(0);
    expect(res.vat).toBe(0);
    expect(res.excise).toBeCloseTo(expectedExcise);
    expect(res.totalTax).toBeCloseTo(expectedExcise);
  });
});
