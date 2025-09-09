import { describe, it, expect } from 'vitest';
import { usdToGyd } from '../app/utils/currency';

describe('currency', () => {
  it('converts USD to GYD', () => {
    expect(usdToGyd(10, 200)).toBe(2000);
  });
});
