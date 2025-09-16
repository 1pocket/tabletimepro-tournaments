'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Side = 'W' | 'L';
export type Match = {
  id: string; round: number; side: Side;
  p1?: string | null; p2?: string | null;
  winnerSlot?: 'p1' | 'p2'; // for highlighting/lock
};
export type Bracket = { type: 'single' | 'double'; winners: Match[]; losers: Match[] };

type Snapshot = { winners: Match[]; losers: Match[] };

type Store = {
  winners: Match[];
  losers: Match[];
  type: 'single' | 'double';
  recordResult: (matchId: string, side: Side, winner: 'p1' | 'p2', opts?: { silent?: boolean }) => void;
  undo: () => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

function cloneMatches(arr: Match[]) { return arr.map(m => ({ ...m })); }
function parseId(id: string) { const m = id.match(/^([WL])(\d+)-M(\d+)$/i); return m ? { side: m[1].toUpperCase() as Side, r: +m[2], k: +m[3] } : null; }
function nextMatchId(side: Side, r: number, k: number) { return `${side}${r + 1}-M${Math.ceil(k / 2)}`; }
function targetSlotForNext(k: number): 'p1' | 'p2' { return (k % 2 === 1) ? 'p1' : 'p2'; }
function setSlot(matches: Match[], id: string, slot: 'p1' | 'p2', name: string) { const m = matches.find(mm => mm.id === id); if (m) m[slot] = name; }
function dropLoserByPlaceholder(losers: Match[], fromWId: string, loserName: string) {
  for (const m of losers) {
    if (m.p1 === `L from ${fromWId}`) { m.p1 = loserName; return; }
    if (m.p2 === `L from ${fromWId}`) { m.p2 = loserName; return; }
  }
}
const isBye = (s?: string | null) => !s || /^— bye —$/i.test(s) || /^bye$/i.test(s);
const isTbd = (s?: string | null) => !!s && /^tbd$/i.test(s);

export function TournamentStoreProvider({
  initial, storageKey, children,
}: { initial: Bracket; storageKey: string; children: React.ReactNode }) {
  const [winners, setWinners] = useState<Match[]>(() => cloneMatches(initial.winners));
  const [losers,  setLosers]  = useState<Match[]>(() => cloneMatches(initial.losers));
  const undoStack = useRef<Snapshot[]>([]);
  const mounted = useRef(false);
  const autoApplied = useRef(false);

  // persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // on mount, try restore
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: Snapshot = JSON.parse(saved);
        setWinners(parsed.winners); setLosers(parsed.losers);
      } catch {}
    }
    mounted.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted.current || typeof window === 'undefined') return;
    const payload: Snapshot = { winners, losers };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [winners, losers, storageKey]);

  // auto-advance byes once (only if no saved state existed)
  useEffect(() => {
    if (autoApplied.current) return;
    if (typeof window === 'undefined') return;
    const hadSaved = !!window.localStorage.getItem(storageKey);
    if (hadSaved) { autoApplied.current = true; return; }
    // run through winners R1 only
    const r1 = winners.filter(m => m.side === 'W' && m.round === 1);
    r1.forEach(m => {
      const p = parseId(m.id); if (!p) return;
      if (isBye(m.p1) && !isBye(m.p2) && !isTbd(m.p2)) recordResult(m.id, 'W', 'p2', { silent: true });
      if (isBye(m.p2) && !isBye(m.p1) && !isTbd(m.p1)) recordResult(m.id, 'W', 'p1', { silent: true });
    });
    autoApplied.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winners]);

  const recordResult = (matchId: string, side: Side, winner: 'p1' | 'p2', opts?: { silent?: boolean }) => {
    const useSet = side === 'W' ? setWinners : setLosers;
    const get = side === 'W' ? winners : losers;
    const other = side === 'W' ? losers : winners;

    // snapshot for undo
    if (!opts?.silent) undoStack.current.push({ winners: cloneMatches(winners), losers: cloneMatches(losers) });

    const matches = get.map(m => ({ ...m }));
    const idx = matches.findIndex(m => m.id === matchId);
    if (idx === -1) return;
    const m = { ...matches[idx] };

    const wName = (winner === 'p1' ? m.p1 : m.p2) ?? '';
    const lName = (winner === 'p1' ? m.p2 : m.p1) ?? '';
    if (!wName || isBye(wName) || isTbd(wName)) return;

    // lock the match
    m.winnerSlot = winner;
    matches[idx] = m;

    const parsed = parseId(m.id);
    if (parsed) {
      const nmId = nextMatchId(parsed.side, parsed.r, parsed.k);
      const slot = targetSlotForNext(parsed.k);
      if (side === 'W') {
        // place winner to next winners round
        const nextWinners = cloneMatches(winners);
        setSlot(nextWinners, nmId, slot, wName);
        // drop loser into losers by placeholder
        const nextLosers = cloneMatches(losers);
        if (initial.type === 'double' && lName && !isBye(lName) && !isTbd(lName)) {
          dropLoserByPlaceholder(nextLosers, m.id, lName);
        }
        // write back
        setWinners(nextWinners.map(mm => (mm.id === m.id ? m : mm)));
        setLosers(nextLosers);
      } else {
        // losers side: winner advances within L
        const nextLosers = cloneMatches(losers);
        setSlot(nextLosers, nmId, slot, wName);
        setLosers(nextLosers.map(mm => (mm.id === m.id ? m : mm)));
      }
    } else {
      // write back the locked match
      useSet(matches);
    }
  };

  const undo = () => {
    const snap = undoStack.current.pop();
    if (!snap) return;
    setWinners(cloneMatches(snap.winners));
    setLosers(cloneMatches(snap.losers));
  };

  const reset = () => {
    undoStack.current = [];
    setWinners(cloneMatches(initial.winners));
    setLosers(cloneMatches(initial.losers));
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
    autoApplied.current = false;
  };

  const value: Store = useMemo(() => ({
    winners, losers, type: initial.type, recordResult, undo, reset
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [winners, losers, initial.type]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTournament() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTournament must be used within TournamentStoreProvider');
  return ctx;
}

