import { PayoutInput, PayoutResult } from './types';

function roundAmount(x: number, mode: 'nearest' | 'down' | 'up'): number {
  if (mode === 'down') return Math.floor(x);
  if (mode === 'up') return Math.ceil(x);
  return Math.round(x);
}

export function computePayouts(input: PayoutInput): PayoutResult {
  const { entrants, entryFee, greenFee, sponsorAdd = 0, template, rounding = 'nearest' } = input;
  const grossEntry = entrants * entryFee;
  const greensTotal = entrants * greenFee;
  const netEntryPool = grossEntry - greensTotal + sponsorAdd;

  // Scale by template
  const raw = template.map(f => Math.max(0, f) * netEntryPool);
  const payouts = raw.map(v => roundAmount(v, rounding));

  // Adjust tiny rounding diffs by correcting the first place
  const diff = roundAmount(netEntryPool, rounding) - payouts.reduce((a, b) => a + b, 0);
  if (diff !== 0 && payouts.length > 0) payouts[0] += diff;

  return { grossEntry, greensTotal, netEntryPool, payouts };
}
