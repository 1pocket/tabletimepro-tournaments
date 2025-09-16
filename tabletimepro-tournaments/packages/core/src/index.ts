// packages/core/src/index.ts

export type PlayerId = string;

export type Match = {
  id: string;                 // e.g. "W1-M3" or "L2-M1"
  round: number;              // 1-based
  side: "W" | "L";            // winners or losers
  p1?: string | null;         // player name or placeholder "TBD" / "— bye —"
  p2?: string | null;
  winnerSlot?: "p1" | "p2";
};

export type Bracket = {
  type: "single" | "double";
  players: string[];
  winners: Match[];           // all winners-side matches (across rounds)
  losers: Match[];            // losers side (empty for single elim)
  meta: {
    roundsW: number;
    roundsL: number;
    byes: number;
    buybacksEnabled: boolean;
    buybackFee?: number;
  };
};

export type DrawOptions = {
  seed?: number;              // for reproducible shuffles
  buybacksEnabled?: boolean;
  buybackFee?: number;        // e.g. $10
};

export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  // Mulberry32 PRNG (tiny + deterministic)
  let t = seed >>> 0;
  const rand = () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function nextPow2(n: number) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function padWithByes(players: string[]): { list: (string | null)[]; byes: number } {
  const size = nextPow2(players.length);
  const byes = size - players.length;
  const list = players.concat(Array(byes).fill(null));
  return { list, byes };
}

export function drawSingleElim(playersIn: string[], opts: DrawOptions = {}): Bracket {
  const players = shuffle(playersIn.filter(Boolean), opts.seed);
  const { list, byes } = padWithByes(players);
  const size = list.length;
  const roundsW = Math.log2(size);

  const matches: Match[] = [];
  // Round 1 pairings
  for (let i = 0; i < size; i += 2) {
    matches.push({
      id: `W1-M${i / 2 + 1}`,
      round: 1,
      side: "W",
      p1: list[i] ?? "— bye —",
      p2: list[i + 1] ?? "— bye —",
    });
  }
  // Create empty shells for future rounds to render a full bracket shape
  let prevCount = size / 2;
  for (let r = 2; r <= roundsW; r++) {
    const count = prevCount / 2;
    for (let m = 0; m < prevCount; m += 2) {
      matches.push({ id: `W${r}-M${m / 2 + 1}`, round: r, side: "W", p1: "TBD", p2: "TBD" });
    }
    prevCount = count;
  }

  return {
    type: "single",
    players,
    winners: matches,
    losers: [],
    meta: { roundsW, roundsL: 0, byes, buybacksEnabled: false },
  };
}

/**
 * Simple double-elimination bracket scaffold:
 * - Winners side = single-elim tree
 * - Losers side = shells with labeled sources (e.g., "L from W1-M2")
 *   so venues can follow where losers drop.
 * - If buybacksEnabled, we pre-allocate an initial losers round ("L1")
 *   to accept re-entry players. They appear as "Buyback TBD" placeholders.
 */
export function drawDoubleElim(playersIn: string[], opts: DrawOptions = {}): Bracket {
  const base = drawSingleElim(playersIn, { seed: opts.seed });
  const { winners } = base;
  const size = nextPow2(playersIn.length);
  const roundsW = base.meta.roundsW;

  // Losers bracket rounds count ~= 2*roundsW - 1
  const roundsL = Math.max(1, 2 * roundsW - 1);
  const losers: Match[] = [];

  // L1: losers from W1 + optional buybacks
  const w1 = winners.filter(m => m.round === 1);
  const l1Slots = Math.ceil(w1.length); // enough slots for all W1 losers
  for (let i = 0; i < l1Slots; i++) {
    losers.push({
      id: `L1-M${i + 1}`,
      round: 1,
      side: "L",
      p1: `L from W1-M${i * 2 + 1}`,
      p2: opts.buybacksEnabled ? `Buyback TBD` : `L from W1-M${i * 2 + 2}`,
    });
  }

  // Subsequent loser rounds are shells (they’ll be filled as results come in)
  for (let r = 2; r <= roundsL; r++) {
    const prevInRound =
      losers.filter(m => m.round === r - 1).length ||
      Math.max(1, Math.ceil(l1Slots / Math.pow(2, r - 2)));
    const count = Math.max(1, Math.ceil(prevInRound / 2));
    for (let m = 1; m <= count; m++) {
      losers.push({ id: `L${r}-M${m}`, round: r, side: "L", p1: "TBD", p2: "TBD" });
    }
  }

  return {
    type: "double",
    players: base.players,
    winners,
    losers,
    meta: {
      roundsW,
      roundsL,
      byes: base.meta.byes,
      buybacksEnabled: !!opts.buybacksEnabled,
      buybackFee: opts.buybackFee,
    },
  };
}

// ---------- payouts (with greens fees) ----------

export type PayoutInput = {
  entrants: number;
  entryFee: number;
  greenFee: number;
  sponsorAdd?: number;
  template: number[]; // shares that sum to 1.0
};

export type PayoutResult = {
  greensTotal: number;
  entryPool: number;
  payoutTotal: number;
  splits: { place: number; share: number; amount: number }[];
};

export function computePayouts(input: PayoutInput): PayoutResult {
  const { entrants, entryFee, greenFee, sponsorAdd = 0, template } = input;
  const gross = entrants * entryFee;
  const greensTotal = entrants * greenFee;
  const net = Math.max(0, gross - greensTotal) + sponsorAdd;

  const raw = template.map((share, i) => ({
    place: i + 1,
    share,
    amount: +(net * share).toFixed(2),
  }));
  const allocated = raw.reduce((s, r) => s + r.amount, 0);
  const drift = +(net - allocated).toFixed(2);
  if (Math.abs(drift) >= 0.01 && raw.length > 0) {
    raw[0].amount = +(raw[0].amount + drift).toFixed(2);
  }

  return {
    greensTotal: +greensTotal.toFixed(2),
    entryPool: +gross.toFixed(2),
    payoutTotal: +net.toFixed(2),
    splits: raw,
  };
}

// ---------- Calcutta ----------

export type CalcuttaBid = { player: string; owner: string; amount: number };
export type CalcuttaConfig = { rakePct?: number; template: number[] };
export type CalcuttaPlacements = string[]; // [first, second, third, ...]

export type CalcuttaOwnerPayout = { owner: string; amount: number };
export type CalcuttaPlayerPayout = {
  place: number;
  player: string;
  owner?: string;
  share: number;
  amount: number;
};

export type CalcuttaResult = {
  pot: number;
  rake: number;
  distributable: number;
  ownerPayouts: CalcuttaOwnerPayout[];
  playerPayouts: CalcuttaPlayerPayout[];
};

export function computeCalcuttaPayouts(
  bids: CalcuttaBid[],
  cfg: CalcuttaConfig,
  placements: CalcuttaPlacements
): CalcuttaResult {
  const pot = +(bids.reduce((s, b) => s + (Number(b.amount) || 0), 0)).toFixed(2);
  const rake = +((pot * ((cfg.rakePct ?? 0) / 100))).toFixed(2);
  const distributable = +(pot - rake).toFixed(2);

  const template = cfg.template || [];
  const ownerByPlayer = new Map<string, string>();
  bids.forEach(b => ownerByPlayer.set((b.player || '').trim(), (b.owner || '').trim()));

  const playerPayouts: CalcuttaPlayerPayout[] = template.map((share, i) => {
    const place = i + 1;
    const player = (placements[i] || '').trim();
    const owner = player ? ownerByPlayer.get(player) : undefined;
    const amount = +(distributable * share).toFixed(2);
    return { place, player, owner, share, amount };
  });

  // sum by owner
  const ownerMap = new Map<string, number>();
  for (const p of playerPayouts) {
    if (!p.owner) continue;
    ownerMap.set(p.owner, +((ownerMap.get(p.owner) ?? 0) + p.amount).toFixed(2));
  }
  const ownerPayouts = Array.from(ownerMap.entries()).map(([owner, amount]) => ({ owner, amount }));

  // fix rounding drift to first place if needed
  const totalAllocated = +playerPayouts.reduce((s, p) => s + p.amount, 0).toFixed(2);
  const drift = +(distributable - totalAllocated).toFixed(2);
  if (Math.abs(drift) >= 0.01 && playerPayouts.length > 0) {
    playerPayouts[0].amount = +(playerPayouts[0].amount + drift).toFixed(2);
    if (playerPayouts[0].owner) {
      const cur = ownerMap.get(playerPayouts[0].owner) ?? 0;
      ownerMap.set(playerPayouts[0].owner, +(cur + drift).toFixed(2));
    }
  }

  return { pot, rake, distributable, ownerPayouts, playerPayouts };
}
