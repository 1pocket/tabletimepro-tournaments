'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type Side = 'W' | 'L';
export type Match = {
  id: string;
  round: number;
  side: Side;
  p1?: string | null;
  p2?: string | null;
};
export type Bracket = {
  type: 'single' | 'double';
  winners: Match[];
  losers: Match[];
};

type Store = {
  winners: Match[];
  losers: Match[];
  type: 'single' | 'double';
  recordResult: (matchId: string, side: Side, winner: 'p1' | 'p2') => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

function cloneMatches(arr: Match[]) {
  return arr.map(m => ({ ...m }));
}

function parseId(id: string) {
  // e.g. "W1-M3" -> { side:'W', r:1, k:3 }
  const m = id.match(/^([WL])(\d+)-M(\d+)$/i);
  if (!m) return null;
  return { side: m[1].toUpperCase() as Side, r: parseInt(m[2], 10), k: parseInt(m[3], 10) };
}

function nextMatchId(side: Side, r: number, k: number) {
  // Winners or Losers both follow: next round = r+1; target match = ceil(k/2)
  const nr = r + 1;
  const nk = Math.ceil(k / 2);
  return `${side}${nr}-M${nk}`;
}

function targetSlotForNext(k: number): 'p1' | 'p2' {
  // odd k -> winner goes to p1, even k -> p2
  return (k % 2 === 1) ? 'p1' : 'p2';
}

function setSlot(matches: Match[], id: string, slot: 'p1' | 'p2', name: string) {
  const m = matches.find(mm => mm.id === id);
  if (!m) return;
  m[slot] = name;
}

function dropLoserByPlaceholder(losers: Match[], fromWId: string, loserName: string) {
  // Find the first losers-side slot that references "L from W{r}-M{k}" and fill it
  for (const m of losers) {
    if (m.p1 === `L from ${fromWId}`) { m.p1 = loserName; return; }
    if (m.p2 === `L from ${fromWId}`) { m.p2 = loserName; return; }
  }
}

export function TournamentStoreProvider({
  initial,
  children,
}: {
  initial: Bracket;
  children: React.ReactNode;
}) {
  const [winners, setWinners] = useState<Match[]>(() => cloneMatches(initial.winners));
  const [losers, setLosers] = useState<Match[]>(() => cloneMatches(initial.losers));

  const value = useMemo<Store>(() => ({
    winners,
    losers,
    type: initial.type,
    recordResult: (matchId, side, winner) => {
      const matches = side === 'W' ? [...winners] : [...losers];
      const idx = matches.findIndex(m => m.id === matchId);
      if (idx === -1) return;

      const m = { ...matches[idx] };
      const wName = (winner === 'p1' ? m.p1 : m.p2) ?? '';
      const lName = (winner === 'p1' ? m.p2 : m.p1) ?? '';

      // Persist winner marker locally (purely visual)
      if (winner === 'p1') {
        m.p1 = wName ? `${wName}` : wName;
      } else {
        m.p2 = wName ? `${wName}` : wName;
      }
      matches[idx] = m;

      // Advance winner
      const parsed = parseId(m.id);
      if (parsed) {
        const nmId = nextMatchId(parsed.side, parsed.r, parsed.k);
        const slot = targetSlotForNext(parsed.k);
        if (side === 'W') {
          const nextW = [...matches];
          // copy back to winners, then set slot in winners round+1
          setWinners(prev => {
            const cloned = cloneMatches(prev);
            // ensure we keep our current edits to winners matches
            const map = new Map(cloned.map(mm => [mm.id, mm]));
            nextW.forEach(mm => { map.set(mm.id, { ...mm }); });
            setSlot([...map.values()], nmId, slot, wName);
            // re-materialize in original order
            return cloned.map(mm => map.get(mm.id) || mm);
          });

          // Send loser to losers bracket if double
          if (initial.type === 'double' && lName && !/^— bye —$/i.test(lName) && !/^TBD$/i.test(lName)) {
            setLosers(prev => {
              const cloned = cloneMatches(prev);
              dropLoserByPlaceholder(cloned, m.id, lName);
              return cloned;
            });
          }
        } else {
          // Losers side winner advances within L tree
          setLosers(prev => {
            const cloned = cloneMatches(prev);
            // apply our current edits (matches array holds our edit for this match)
            const map = new Map(cloned.map(mm => [mm.id, mm]));
            matches.forEach(mm => { map.set(mm.id, { ...mm }); });
            setSlot([...map.values()], nmId, slot, wName);
            return cloned.map(mm => map.get(mm.id) || mm);
          });
        }
      }

      if (side === 'W') setWinners(matches);
      else setLosers(matches);
    },
    reset: () => {
      setWinners(cloneMatches(initial.winners));
      setLosers(cloneMatches(initial.losers));
    },
  }), [winners, losers, initial]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTournament() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTournament must be used within TournamentStoreProvider');
  return ctx;
}
