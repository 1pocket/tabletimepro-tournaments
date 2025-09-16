'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Side = 'W' | 'L';
export type Match = { id: string; round: number; side: Side; p1?: string|null; p2?: string|null; winnerSlot?: 'p1'|'p2' };
export type Bracket = { type: 'single' | 'double'; winners: Match[]; losers: Match[] };
type FinalsMode = 'single' | 'double-reset';
type FinalsStage = 'pending' | 'reset' | 'done';

type Finals = {
  mode: FinalsMode;
  stage: FinalsStage;
  champion?: string;
  runnerUp?: string;
  set1Winner?: string; // for reset history
};

type Snapshot = { winners: Match[]; losers: Match[]; finals: Finals };

type Store = {
  winners: Match[];
  losers: Match[];
  type: 'single' | 'double';
  finals: Finals;
  hotSeat?: string;
  losersWinner?: string;
  recordResult: (matchId: string, side: Side, winner: 'p1' | 'p2', opts?: { silent?: boolean }) => void;
  playGrandFinal: (winner: string, opponent: string) => void;
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

function pickHotSeat(winners: Match[]): string | undefined {
  const maxRound = winners.reduce((mx, m) => m.side === 'W' ? Math.max(mx, m.round) : mx, 0);
  const final = winners.find(m => m.side === 'W' && m.round === maxRound && m.id.endsWith('M1'));
  if (!final || !final.winnerSlot) return;
  return final.winnerSlot === 'p1' ? (final.p1 ?? undefined) : (final.p2 ?? undefined);
}
function pickLosersWinner(losers: Match[]): string | undefined {
  if (!losers.length) return;
  const maxRound = losers.reduce((mx, m) => m.side === 'L' ? Math.max(mx, m.round) : mx, 0);
  const final = losers.find(m => m.side === 'L' && m.round === maxRound && m.id.endsWith('M1'));
  if (!final || !final.winnerSlot) return;
  return final.winnerSlot === 'p1' ? (final.p1 ?? undefined) : (final.p2 ?? undefined);
}

export function TournamentStoreProvider({
  initial, storageKey, finalsMode = 'single', children,
}: { initial: Bracket; storageKey: string; finalsMode?: FinalsMode; children: React.ReactNode }) {
  const [winners, setWinners] = useState<Match[]>(() => cloneMatches(initial.winners));
  const [losers,  setLosers]  = useState<Match[]>(() => cloneMatches(initial.losers));
  const [finals,  setFinals]  = useState<Finals>({ mode: finalsMode, stage: 'pending' });
  const undoStack = useRef<Snapshot[]>([]);
  const mounted = useRef(false);
  const autoApplied = useRef(false);

  // restore
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: Snapshot = JSON.parse(saved);
        if (parsed.winners) setWinners(parsed.winners);
        if (parsed.losers)  setLosers(parsed.losers);
        if (parsed.finals)  setFinals(parsed.finals);
      } catch {}
    } else {
      // ensure finals mode set on first run
      setFinals({ mode: finalsMode, stage: 'pending' });
    }
    mounted.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    if (!mounted.current || typeof window === 'undefined') return;
    const payload: Snapshot = { winners, losers, finals };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [winners, losers, finals, storageKey]);

  // auto-advance byes in W1 only
  useEffect(() => {
    if (autoApplied.current) return;
    if (typeof window === 'undefined') return;
    const hadSaved = !!window.localStorage.getItem(storageKey);
    if (hadSaved) { autoApplied.current = true; return; }
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
    if (!opts?.silent) undoStack.current.push({ winners: cloneMatches(winners), losers: cloneMatches(losers), finals: { ...finals } });

    const get = side === 'W' ? winners : losers;
    const matches = get.map(m => ({ ...m }));
    const idx = matches.findIndex(m => m.id === matchId);
    if (idx === -1) return;
    const m = { ...matches[idx] };
    const wName = (winner === 'p1' ? m.p1 : m.p2) ?? '';
    const lName = (winner === 'p1' ? m.p2 : m.p1) ?? '';
    if (!wName || isBye(wName) || isTbd(wName)) return;

    m.winnerSlot = winner;
    matches[idx] = m;

    const parsed = parseId(m.id);
    if (parsed) {
      const nmId = nextMatchId(parsed.side, parsed.r, parsed.k);
      const slot = targetSlotForNext(parsed.k);
      if (side === 'W') {
        const nextWinners = cloneMatches(winners);
        setSlot(nextWinners, nmId, slot, wName);
        const nextLosers = cloneMatches(losers);
        if (initial.type === 'double' && lName && !isBye(lName) && !isTbd(lName)) dropLoserByPlaceholder(nextLosers, m.id, lName);
        setWinners(nextWinners.map(mm => (mm.id === m.id ? m : mm)));
        setLosers(nextLosers);
      } else {
        const nextLosers = cloneMatches(losers);
        setSlot(nextLosers, nmId, slot, wName);
        setLosers(nextLosers.map(mm => (mm.id === m.id ? m : mm)));
      }
    } else {
      if (side === 'W') setWinners(matches); else setLosers(matches);
    }
  };

  const playGrandFinal = (winner: string, opponent: string) => {
    undoStack.current.push({ winners: cloneMatches(winners), losers: cloneMatches(losers), finals: { ...finals } });

    if (finals.mode === 'single') {
      setFinals({ ...finals, stage: 'done', champion: winner, runnerUp: opponent });
      return;
    }
    // double-reset
    if (finals.stage === 'pending') {
      // if hot seat loses set 1, we go to reset; if hot seat wins, tournament ends
      // We don't know which name is HS here; the caller provides (winner, opponent).
      // Rule: if set 1 winner is NOT the hot seat, UI logic ensures this call means "losers winner took set 1" => reset.
      setFinals({ ...finals, stage: 'reset', set1Winner: winner });
      if (winner === opponent) {
        // impossible; guard
        setFinals({ ...finals, stage: 'done', champion: winner, runnerUp: opponent });
      }
      return;
    }
    if (finals.stage === 'reset') {
      setFinals({ ...finals, stage: 'done', champion: winner, runnerUp: opponent });
      return;
    }
  };

  const undo = () => {
    const snap = undoStack.current.pop();
    if (!snap) return;
    setWinners(cloneMatches(snap.winners));
    setLosers(cloneMatches(snap.losers));
    setFinals({ ...(snap.finals ?? { mode: finals.mode, stage: 'pending' }) });
  };

  const reset = () => {
    undoStack.current = [];
    setWinners(cloneMatches(initial.winners));
    setLosers(cloneMatches(initial.losers));
    setFinals({ mode: finals.mode, stage: 'pending' });
    if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
  };

  const hotSeat = useMemo(() => pickHotSeat(winners), [winners]);
  const losersWinner = useMemo(() => pickLosersWinner(losers), [losers]);

  const value: Store = useMemo(() => ({
    winners, losers, type: initial.type, finals, hotSeat, losersWinner,
    recordResult, playGrandFinal, undo, reset
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [winners, losers, finals, hotSeat, losersWinner, initial.type]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTournament() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTournament must be used within TournamentStoreProvider');
  return ctx;
}


