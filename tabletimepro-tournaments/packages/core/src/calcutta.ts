import { CalcuttaInput, CalcuttaResult } from './types';

function roundAmount(x: number, mode: 'nearest' | 'down' | 'up'): number {
  if (mode === 'down') return Math.floor(x);
  if (mode === 'up') return Math.ceil(x);
  return Math.round(x);
}

export function computeCalcutta(input: CalcuttaInput): CalcuttaResult {
  const { winningBids, houseVigPct = 0, template, rounding = 'nearest' } = input;
  const potGross = winningBids.reduce((a, b) => a + b, 0);
  const houseVig = potGross * (houseVigPct ?? 0);
  const potNet = potGross - houseVig;

  const raw = template.map(f => Math.max(0, f) * potNet);
  const payouts = raw.map(v => roundAmount(v, rounding));

  const diff = roundAmount(potNet, rounding) - payouts.reduce((a, b) => a + b, 0);
  if (diff !== 0 && payouts.length > 0) payouts[0] += diff;

  return { potGross, houseVig, potNet, payouts };
}
