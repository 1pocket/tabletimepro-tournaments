import { DrawInput, DrawResult, MatchPair } from './types';

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function shuffle<T>(arr: T[], seed?: string | number): T[] {
  const out = arr.slice();
  const seedNum = typeof seed === 'number'
    ? seed
    : (seed ? Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) : Date.now());
  const rnd = mulberry32(seedNum);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export function drawSingleElim(input: DrawInput): DrawResult {
  const players = input.players.map(s => s.trim()).filter(Boolean);
  const shuffled = shuffle(players, input.shuffleSeed);
  const bracketSize = nextPowerOfTwo(shuffled.length || 1);
  const byes = bracketSize - shuffled.length;
  const padded = shuffled.concat(Array(byes).fill(undefined));

  const pairs: MatchPair[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const p1 = padded[i];
    const p2 = padded[i+1];
    const pair: MatchPair = { p1, p2 };
    if (!p1 || !p2) pair.bye = true;
    pairs.push(pair);
  }
  return { bracketSize, byes, pairs, shuffledPlayers: shuffled };
}
