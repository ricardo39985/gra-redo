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
});
