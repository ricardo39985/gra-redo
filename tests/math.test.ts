import { describe, it, expect } from 'vitest';

describe('math', () => {
  it('adds numbers', () => {
    const a = 1;
    const b = 1;
    const expected = 2;
    console.log(`Adding ${a} + ${b} expecting ${expected}`);
    expect(a + b).toBe(expected);
  });
});
