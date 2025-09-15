export type PayoutTemplate = number[]; // fractions that sum to 1.0

export interface PayoutInput {
  entrants: number;
  entryFee: number;
  greenFee: number;
  sponsorAdd?: number;
  template: PayoutTemplate;
  rounding?: 'nearest' | 'down' | 'up';
}

export interface PayoutResult {
  grossEntry: number;
  greensTotal: number;
  netEntryPool: number;
  payouts: number[]; // per place
}

export interface CalcuttaInput {
  winningBids: number[]; // top-N players' winning bids, summed into pot
  houseVigPct?: number;  // e.g., 0.1 = 10%
  template: PayoutTemplate;
  rounding?: 'nearest' | 'down' | 'up';
}

export interface CalcuttaResult {
  potGross: number;
  houseVig: number;
  potNet: number;
  payouts: number[];
}

export interface DrawInput {
  players: string[];
  shuffleSeed?: string | number; // optional
}

export interface MatchPair {
  p1?: string;
  p2?: string;
  bye?: boolean;
}

export interface DrawResult {
  bracketSize: number;  // power of two (e.g., 8, 16, 32)
  byes: number;
  pairs: MatchPair[];   // round 1 pairs
  shuffledPlayers: string[];
}
