import { describe, it, expect } from 'vitest';
import { computePayouts } from '../src/payout';

describe('computePayouts', () => {
  it('deducts green fees and applies template', () => {
    const res = computePayouts({
      entrants: 16,
      entryFee: 20,
      greenFee: 5,
      sponsorAdd: 100,
      template: [0.6, 0.3, 0.1],
      rounding: 'nearest'
    });
    expect(res.grossEntry).toBe(320);
    expect(res.greensTotal).toBe(80);
    expect(res.netEntryPool).toBe(340);
    expect(res.payouts.reduce((a,b)=>a+b,0)).toBeCloseTo(Math.round(340));
  });
});
