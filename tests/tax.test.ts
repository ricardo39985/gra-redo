import { describe, it, expect } from 'vitest';
import { calculateGasoline } from '../app/utils/tax';

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

  it('Calculate duty for 2014 gas with cif of 4500 to be 1575', () => {
    const res = calculateGasoline({
      cc: 1000,
      cif: 4500,
      exchangeRate: 200,
      vehicleType: 'Car',
      ageCategory: 'under4'
    });
    expect(res.duty).toBeCloseTo(1575);
    expect(res.vat).toBeCloseTo(850.5);
    expect(res.totalTax).toBeCloseTo(2425.5);
  });
});
