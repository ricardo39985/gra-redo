// tests/tax.test.ts
import { describe, it, expect } from 'vitest';
import { calculateGasoline, calculateDiesel } from '../app/utils/tax';

/** Shared helpers */
const EX = 200; // GYD per USD for flat-rate conversions (over-4 ≤1500cc)

function solveRateAndAdder(c1: number, e1: number, c2: number, e2: number) {
  const r = (e2 - e1) / (c2 - c1);
  const K = (e1 - r * c1) / (1 + r);
  return { r, K };
}

function slopeFromTwoCIFs(fn: (cif: number) => number, c1: number, c2: number) {
  const e1 = fn(c1), e2 = fn(c2);
  return (e2 - e1) / (c2 - c1);
}

/* ============================================================================
 *                                OVER FOUR YEARS
 * ========================================================================== */
describe('Over four years old', () => {
  /* -------------------------------- Gasoline ------------------------------- */
  describe('Gasoline', () => {
    it('≤1500 cc: flat GYD 800,000 → USD; CIF independent; Duty/VAT = 0', () => {
      const a = calculateGasoline({ cc: 1000, cif: 0,    exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const b = calculateGasoline({ cc: 1200, cif: 5000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const flatUSD = 800_000 / EX;
      expect(a.excise).toBeCloseTo(flatUSD, 2);
      expect(b.excise).toBeCloseTo(flatUSD, 2);
      expect(a.duty).toBe(0); expect(a.vat).toBe(0);
      expect(a.totalTax).toBeCloseTo(flatUSD, 2);
    });

    it('1500–1800 cc: (CIF + 6,000) × 30% + 6,000', () => {
      const x = calculateGasoline({ cc: 1700, cif: 1000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const y = calculateGasoline({ cc: 1700, cif: 5000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 5000, y.excise);
      expect(r).toBeCloseTo(0.30, 6);
      expect(K).toBeCloseTo(6_000, 2);
      expect(x.excise).toBeCloseTo((1000 + 6000) * 0.30 + 6000, 2); // 8,100
    });

    it('1800–2000 cc: (CIF + 6,500) × 30% + 6,500', () => {
      const x = calculateGasoline({ cc: 1900, cif: 1000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const y = calculateGasoline({ cc: 1900, cif: 5000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 5000, y.excise);
      expect(r).toBeCloseTo(0.30, 6);
      expect(K).toBeCloseTo(6_500, 2);
    });

    it('2000–3000 cc: (CIF + 13,500) × 70% + 13,500', () => {
      const x = calculateGasoline({ cc: 2500, cif: 1000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const y = calculateGasoline({ cc: 2500, cif: 5000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 5000, y.excise);
      expect(r).toBeCloseTo(0.70, 6);
      expect(K).toBeCloseTo(13_500, 2);
      expect(x.excise).toBeCloseTo((1000 + 13_500) * 0.70 + 13_500, 2); // 23,650
    });

    it('>3000 cc: (CIF + 14,500) × 100% + 14,500', () => {
      const x = calculateGasoline({ cc: 3500, cif: 1000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const y = calculateGasoline({ cc: 3500, cif: 6000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 6000, y.excise);
      expect(r).toBeCloseTo(1.00, 6);
      expect(K).toBeCloseTo(14_500, 2);
      expect(x.excise).toBeCloseTo((1000 + 14_500) * 1.0 + 14_500, 2); // 30,500
    });

    it('band selection at boundaries (slope vs CIF)', () => {
      const slopeAt = (cc: number, c1 = 1000, c2 = 5000) =>
        slopeFromTwoCIFs(
          (cif) => calculateGasoline({ cc, cif, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' }).excise,
          c1, c2
        );
      expect(slopeAt(1500)).toBeCloseTo(0, 6);
      expect(slopeAt(1501)).toBeCloseTo(0.30, 6);
      expect(slopeAt(1800)).toBeCloseTo(0.30, 6);
      expect(slopeAt(1801)).toBeCloseTo(0.30, 6);
      expect(slopeAt(2001)).toBeCloseTo(0.70, 6);
      expect(slopeAt(3001, 1000, 6000)).toBeCloseTo(1.00, 6);
    });

    it('Duty & VAT are zero in all over-4 gasoline bands', () => {
      const r = calculateGasoline({ cc: 2500, cif: 3000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'over4' });
      expect(r.duty).toBe(0);
      expect(r.vat).toBe(0);
      expect(r.totalTax).toBeCloseTo(r.excise, 6);
    });
  });

  /* --------------------------- Diesel & Semi-Diesel ------------------------- */
  describe('Diesel & Semi-Diesel', () => {
    it('≤1500 cc: flat GYD 800,000 → USD; Duty/VAT = 0', () => {
      const a = calculateDiesel({ cc: 1500, cif: 0,    exchangeRate: EX, ageCategory: 'over4' });
      const b = calculateDiesel({ cc: 1500, cif: 5000, exchangeRate: EX, ageCategory: 'over4' });
      const flatUSD = 800_000 / EX;
      expect(a.excise).toBeCloseTo(flatUSD, 2);
      expect(b.excise).toBeCloseTo(flatUSD, 2);
      expect(a.duty).toBe(0); expect(a.vat).toBe(0);
    });

    it('1500–2000 cc: (CIF + 15,400) × 30% + 15,400', () => {
      const x = calculateDiesel({ cc: 1800, cif: 1000, exchangeRate: EX, ageCategory: 'over4' });
      const y = calculateDiesel({ cc: 1800, cif: 5000, exchangeRate: EX, ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 5000, y.excise);
      expect(r).toBeCloseTo(0.30, 6);
      expect(K).toBeCloseTo(15_400, 2);
    });

    it('2000–2500 cc: (CIF + 15,400) × 70% + 15,400', () => {
      const x = calculateDiesel({ cc: 2400, cif: 1000, exchangeRate: EX, ageCategory: 'over4' });
      const y = calculateDiesel({ cc: 2400, cif: 5000, exchangeRate: EX, ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 5000, y.excise);
      expect(r).toBeCloseTo(0.70, 6);
      expect(K).toBeCloseTo(15_400, 2);
    });

    it('2500–3000 cc: (CIF + 15,500) × 70% + 15,500', () => {
      const x = calculateDiesel({ cc: 2800, cif: 1000, exchangeRate: EX, ageCategory: 'over4' });
      const y = calculateDiesel({ cc: 2800, cif: 5000, exchangeRate: EX, ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 5000, y.excise);
      expect(r).toBeCloseTo(0.70, 6);
      expect(K).toBeCloseTo(15_500, 2);
    });

    it('>3000 cc: (CIF + 17,200) × 100% + 17,200', () => {
      const x = calculateDiesel({ cc: 3200, cif: 1000, exchangeRate: EX, ageCategory: 'over4' });
      const y = calculateDiesel({ cc: 3200, cif: 6000, exchangeRate: EX, ageCategory: 'over4' });
      const { r, K } = solveRateAndAdder(1000, x.excise, 6000, y.excise);
      expect(r).toBeCloseTo(1.00, 6);
      expect(K).toBeCloseTo(17_200, 2);
    });

    it('band selection at boundaries (slope vs CIF)', () => {
      const slopeAt = (cc: number, c1 = 1000, c2 = 5000) =>
        slopeFromTwoCIFs(
          (cif) => calculateDiesel({ cc, cif, exchangeRate: EX, ageCategory: 'over4' }).excise,
          c1, c2
        );
      expect(slopeAt(1500)).toBeCloseTo(0, 6);
      expect(slopeAt(1501)).toBeCloseTo(0.30, 6);
      expect(slopeAt(2001)).toBeCloseTo(0.70, 6);
      expect(slopeAt(2501)).toBeCloseTo(0.70, 6);
      expect(slopeAt(3001, 1000, 6000)).toBeCloseTo(1.00, 6);
    });

    it('Duty & VAT are zero in all over-4 diesel bands', () => {
      const r = calculateDiesel({ cc: 2500, cif: 3000, exchangeRate: EX, ageCategory: 'over4' });
      expect(r.duty).toBe(0);
      expect(r.vat).toBe(0);
      expect(r.totalTax).toBeCloseTo(r.excise, 6);
    });
  });
});

/* ============================================================================
 *                               UNDER FOUR YEARS
 * ========================================================================== */
describe('Under four years old', () => {
  // GASOLINE — from GRA table you shared
  // Duty: ≤1000:35%, 1000–1500:35%, 1500–1800:45%, 1800–2000:45%, 2000–3000:45%, >3000:45%
  // Excise as % of (CIF + Duty): 0%, 0%, 10%, 10%, 110%, 140%
  const gasDutyRate = (cc: number) => (cc <= 1500 ? 0.35 : 0.45);
  const gasExciseRate = (cc: number) =>
    cc <= 1500 ? 0 : cc <= 2000 ? 0.10 : cc <= 3000 ? 1.10 : 1.40;
  const VAT = 0.14;

  /* -------------------------------- Gasoline ------------------------------- */
  describe('Gasoline', () => {
    it.each([
      { cc: 1000, cif: 6000 },   // ≤1000
      { cc: 1500, cif: 6000 },   // 1000–1500
      { cc: 1501, cif: 6000 },   // 1500–1800
      { cc: 1800, cif: 6000 },   // 1500–1800
      { cc: 1801, cif: 6000 },   // 1800–2000
      { cc: 2000, cif: 6000 },   // 1800–2000
      { cc: 2800, cif: 6000 },   // 2000–3000 (matches example)
      { cc: 3001, cif: 6000 },   // >3000
    ])('applies correct duty %, excise % base, and VAT base for cc=$cc', ({ cc, cif }) => {
      const r = calculateGasoline({ cc, cif, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'under4' });

      const dutyExpected   = gasDutyRate(cc) * cif;
      const exciseBase     = cif + dutyExpected;
      const exciseExpected = gasExciseRate(cc) * exciseBase;
      const vatBase        = cif + dutyExpected + exciseExpected;
      const vatExpected    = VAT * vatBase;

      expect(r.duty).toBeCloseTo(dutyExpected, 2);
      expect(r.excise).toBeCloseTo(exciseExpected, 2);
      expect(r.vat).toBeCloseTo(vatExpected, 2);
      expect(r.totalTax).toBeCloseTo(r.duty + r.excise + r.vat, 5);
    });

    it('matches GRA gasoline example: 2800 cc, CIF 6000', () => {
      const r = calculateGasoline({ cc: 2800, cif: 6000, exchangeRate: EX, vehicleType: 'Car', ageCategory: 'under4' });
      expect(r.duty).toBeCloseTo(2700, 2);
      expect(r.excise).toBeCloseTo(9570, 2);
      expect(r.vat).toBeCloseTo(2557.8, 1);
      expect(r.totalTax).toBeCloseTo(14_827.8, 1);
    });
  });

  /* --------------------------- Diesel & Semi-Diesel ------------------------- */
  describe('Diesel & Semi-Diesel', () => {
    // From your diesel-under-4 table + example:
    // Duty: ≤1500:35%, >1500:45%
    // Excise % of (CIF + Duty): ≤1500:0%, 1500–1800:10%, 1800–2000:10% (assumed same), 2000–2500:110%, >2500:110%
    const dieselDutyRate = (cc: number) => (cc <= 1500 ? 0.35 : 0.45);
    const dieselExciseRate = (cc: number) => {
      if (cc <= 1500) return 0;
      if (cc <= 2000) return 0.10;     // 1500–2000 (table shows 1500–1800; 1800–2000 assumed same)
      if (cc <= 2500) return 1.10;     // 2000–2500
      return 1.10;                      // >2500 (per table screenshot)
    };

    it.each([
      { cc: 1500, cif: 6000 },   // ≤1500
      { cc: 1501, cif: 6000 },   // 1500–1800
      { cc: 1800, cif: 6000 },   // 1500–1800
      { cc: 1801, cif: 6000 },   // 1800–2000 (assumed same 10%)
      { cc: 2000, cif: 6000 },   // 1800–2000
      { cc: 2200, cif: 6000 },   // 2000–2500
      { cc: 2600, cif: 6000 },   // >2500
      { cc: 2800, cif: 6000 },   // example row (also >2500)
    ])('applies correct duty %, excise % base, and VAT base for cc=$cc', ({ cc, cif }) => {
      const r = calculateDiesel({ cc, cif, exchangeRate: EX, ageCategory: 'under4' });

      const dutyExpected   = dieselDutyRate(cc) * cif;
      const exciseBase     = cif + dutyExpected;
      const exciseExpected = dieselExciseRate(cc) * exciseBase;
      const vatBase        = cif + dutyExpected + exciseExpected;
      const vatExpected    = VAT * vatBase;

      expect(r.duty).toBeCloseTo(dutyExpected, 2);
      expect(r.excise).toBeCloseTo(exciseExpected, 2);
      expect(r.vat).toBeCloseTo(vatExpected, 2);
      expect(r.totalTax).toBeCloseTo(r.duty + r.excise + r.vat, 5);
    });

    it('matches GRA diesel example: 2800 cc, CIF 6000 → Duty 45%, Excise 110% of (CIF+Duty), VAT 14%', () => {
      const r = calculateDiesel({ cc: 2800, cif: 6000, exchangeRate: EX, ageCategory: 'under4' });
      expect(r.duty).toBeCloseTo(2700, 2);
      expect(r.excise).toBeCloseTo(9570, 2);
      expect(r.vat).toBeCloseTo(2557.8, 1);
      expect(r.totalTax).toBeCloseTo(14_827.8, 1);
    });
  });
});

/* ============================================================================
 *                        Documentation / GRA discrepancy
 * ========================================================================== */
// Diesel over-4 example on the GRA page uses +$8,200 (CIF=5000 → 12,160), but
// the table lists +$15,400. Keep this as a note so we don’t “fix” code wrongly.
describe('Documentation — diesel example on GRA page', () => {
  it('computes the example number 12,160 using +$8,200 (not used by code)', () => {
    const cif = 5000, add = 8200;
    const exc = (cif + add) * 0.30 + add;
    expect(exc).toBeCloseTo(12_160, 2);
  });
});
