import { describe, it, expect } from 'vitest';
import { usdToGyd } from '../app/utils/currency';

describe('currency', () => {
  it('converts USD to GYD', () => {
    const dollars = 10;
    const rate = 200;
    const expected = 2000;
    console.log(`Converting ${dollars} USD at rate ${rate} => ${expected} GYD`);
    expect(usdToGyd(dollars, rate)).toBe(expected);
  });
});
