import { describe, it, expect } from 'vitest';
import { usdToGyd, formatCurrency } from '../app/utils/currency';

describe('currency', () => {
  it('converts USD to GYD', () => {
    const dollars = 10;
    const rate = 200;
    const expected = 2000;
    expect(usdToGyd(dollars, rate)).toBe(expected);
  });

  describe('formatCurrency', () => {
    it('formats a value as GYD', () => {
      // When formatting as GYD, the exchange rate should be ignored.
      // The 'val' is assumed to be in the target currency already.
      const valueInGyd = 123456.78;
      const expected = 'GY$123,456.78';
      expect(formatCurrency(valueInGyd, 'GYD', 218)).toBe(expected);
    });

    it('converts a GYD value to USD and formats it', () => {
      // When formatting as USD, the 'val' (assumed to be GYD) is divided by the exchange rate.
      const valueInGyd = 218000;
      const exchangeRate = 218;
      const expected = '$1,000.00';
      expect(formatCurrency(valueInGyd, 'USD', exchangeRate)).toBe(expected);
    });
  });
});
