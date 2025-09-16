'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { drawSingleElim, drawDoubleElim, computePayouts } from '@ttpro/core';
import { TournamentStoreProvider, useTournament } from '@/lib/tournamentStore';
import Link from 'next/link';

type State = {
  name: string;
  format: 'single' | 'double';
  buybacks: boolean;
  buybackFee?: number;
  players: string[];
  entryFee?: number;
  greenFee?: number;
  sponsorAdd?: number;
  templateKey?: 'top3' | 'top4' | 'top8';
};

const templates = {
  top3: [0.6, 0.3, 0.1],
  top4: [0.5, 0.25, 0.15, 0.1],
  top8: [0.35, 0.22, 0.15, 0.10, 0.06, 0.04, 0.04, 0.04],
};

function decodeState(param: string | null): State {
  if (!param || typeof window === 'undefined') return { name: 'Tournament', format: 'single', buybacks: false, players: [] };
  try { const json = decodeURIComponent(atob(decodeURIComponent(param))); return JSON.parse(json); }
  catch { return { name: 'Tournament', format: 'single', buybacks: false, players: [] }; }
}

function makeStorageKey(tenantId: string, state: State) {
  const base = `${tenantId}|${state.name}|${state.format}|${state.players.join('|')}`;
  return `ttp:tournament:${base}`;
}

export default function PreviewPage({ params }: { params: { tenantId: string } }) {
  const sp = useSearchParams();
  const state = useMemo(() => decodeState(sp.get('state')), [sp]);

  const initial = useMemo(() => {
    const opts = { seed: 42, buybacksEnabled: state.buybacks, buybackFee: state.buybackFee };
    const b = state.format === 'single' ? drawSingleElim(state.players, opts) : drawDoubleElim(state.players, opts);
    return { type: b.type, winners: b.winners, losers: b.losers };
  }, [state]);

  const storageKey = useMemo(() => makeStorageKey(params.tenantId, state), [params.tenantId, state]);

  return (
    <TournamentStoreProvider initial={initial} storageKey={storageKey}>
      <PageUI state={state} tenantId={params.tenantId} storageKey={storageKey} />
    </TournamentStoreProvider>
  );
}

function PageUI({ state, tenantId, storageKey }: { state: State; tenantId: string; storageKey: string }) {
  const { winners, losers, undo, reset, hotSeat, losersWinner, finals, setChampion } = useTournament();

  const winnersByRound = groupByRound(winners, 'W');
  const losersByRound = groupByRound(losers, 'L');

  const tvUrl = useMemo(() => `/${tenantId}/display?key=${encodeURIComponent(storageKey)}`, [tenantId, storageKey]);

  const entryFee = state.entryFee ?? 20;
  const greenFee = state.greenFee ?? 5;
  const sponsorAdd = state.sponsorAdd ?? 0;
  const templateKey = state.templateKey ?? 'top4';
  const payout = useMemo(() => computePayouts({
    entrants: state.players.length,
    entryFee, greenFee, sponsorAdd, template: templates[templateKey]
  }), [state.players.length, entryFee, greenFee, sponsorAdd, templateKey]);

  // derive 1st/2nd/3rd names (best-effort)
  const grandFinalReady = !!hotSeat && !!losersWinner && !finals.champion;
  const first = finals.champion;
  const second = finals.runnerUp;
  // 3rd = loser of the last L-round final, if decided
  const third = useMemo(() => {
    if (!losers.length) return undefined;
    const maxL = Math.max(...losers.map(m => m.round));
    const lf = losers.find(m => m.round === maxL && m.id.endsWith('M1'));
    if (!lf || !lf.winnerSlot) return undefined;
    const winName = lf.winnerSlot === 'p1' ? (lf.p1 ?? '') : (lf.p2 ?? '');
    const loseName = lf.winnerSlot === 'p1' ? (lf.p2 ?? '') : (lf.p1 ?? '');
    return winName && loseName ? loseName : undefined;
  }, [losers]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">{state.name}</h1>
          <div className="text-slate-400">{state.format.toUpperCase()} • click a player to advance</div>
          {hotSeat && state.format === 'double' && !finals.champion && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-300 px-3 py-1 text-sm">
              <span>🔥 Hot Seat:</span> <strong className="font-semibold">{hotSeat}</strong>
            </div>
          )}
          {finals.champion && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-600/10 text-emerald-300 px-3 py-1 text-sm">
              🏆 Champion: <strong className="font-semibold">{finals.champion}</strong>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={tvUrl} className="rounded-lg bg-sky-600 px-3 py-2 hover:bg-sky-500">Open TV Display</Link>
          <button onClick={undo} className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600">Undo</button>
          <button onClick={reset} className="rounded-lg bg-red-600 px-3 py-2 hover:bg-red-500">Reset</button>
        </div>
      </header>

      {/* Brackets */}
      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">Winners Bracket</h2>
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from(winnersByRound.keys()).map((r) => (
                <RoundCol key={`W${r}`} title={`W${r}`} matches={winnersByRound.get(r)!} side="W" />
              ))}
            </div>
          </section>

          {state.format === 'double' && (
            <section>
              <h2 className="text-lg font-semibold mt-2 mb-3">Losers Bracket</h2>
              <div className="grid gap-4 md:grid-cols-6">
                {Array.from(losersByRound.keys()).map((r) => (
                  <RoundCol key={`L${r}`} title={`L${r}`} matches={losersByRound.get(r)!} side="L" />
                ))}
              </div>
            </section>
          )}

          {/* Grand Final card */}
          {state.format === 'double' && grandFinalReady && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-lg font-semibold mb-2">Grand Final</h3>
              <p className="text-slate-300 mb-4">
                Hot Seat winner faces losers' bracket winner. Click the champion:
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <GFButton label={hotSeat!} onClick={() => setChampion(hotSeat!, losersWinner!)} />
                <GFButton label={losersWinner!} onClick={() => setChampion(losersWinner!, hotSeat!)} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                (If you run a true double final with a reset, we can add the reset flow next.)
              </p>
            </section>
          )}
        </div>

        {/* Payout panel */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 h-fit sticky top-6">
          <h2 className="text-lg font-semibold mb-4">Payouts (greens deducted)</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Entry pool" value={`$${payout.entryPool.toFixed(2)}`} />
            <Stat label="Greens fees" value={`$${payout.greensTotal.toFixed(2)}`} />
            <Stat label="Payout total" value={`$${payout.payoutTotal.toFixed(2)}`} />
          </div>

          <ul className="mt-4 space-y-2">
            {payout.splits.map((s, i) => {
              const name =
                i === 0 ? (first ?? '—') :
                i === 1 ? (second ?? '—') :
                i === 2 ? (third ?? '—') : '—';
              const highlight =
                (i === 0 && first) || (i === 1 && second) || (i === 2 && third);
              return (
                <li key={s.place} className={`rounded-lg px-4 py-2 flex items-center justify-between ${highlight ? 'bg-emerald-800/30 ring-1 ring-emerald-500' : 'bg-slate-800'}`}>
                  <div className="flex flex-col">
                    <span className="text-slate-300">Place {s.place}</span>
                    <span className={`text-sm ${highlight ? 'text-emerald-300' : 'text-slate-400'}`}>{name}</span>
                  </div>
                  <span className="font-semibold">${s.amount.toFixed(2)} <span className="text-slate-400 text-xs">({(s.share*100).toFixed(0)}%)</span></span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}

function GFButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl bg-slate-800 px-4 py-3 hover:bg-slate-700 text-left">
      <div className="text-sm text-slate-400">Declare Champion</div>
      <div className="text-xl font-semibold">{label}</div>
    </button>
  );
}

function RoundCol({ title, matches, side }: { title: string; matches: any[]; side: 'W'|'L' }) {
  return (
    <div>
      <div className="mb-2 text-slate-300 text-sm">{title}</div>
      <div className="space-y-3">{matches.map((m) => (<MatchCard key={m.id} side={side} match={m} />))}</div>
    </div>
  );
}

function MatchCard({ match, side }: { match: any; side: 'W' | 'L' }) {
  const { recordResult } = useTournament();
  const canClick = (name?: string | null) => !!name && !/^TBD$/i.test(name) && !/^— bye —$/i.test(name);
  const locked = !!match.winnerSlot;

  return (
    <div className="rounded-xl bg-slate-800 p-3 space-y-2">
      <div className="text-xs text-slate-400">{match.id}</div>
      <Row
        name={match.p1 ?? '— bye —'}
        highlight={match.winnerSlot === 'p1'}
        disabled={locked || !canClick(match.p1)}
        onClick={() => recordResult(match.id, side, 'p1')}
      />
      <Row
        name={match.p2 ?? '— bye —'}
        highlight={match.winnerSlot === 'p2'}
        disabled={locked || !canClick(match.p2)}
        onClick={() => recordResult(match.id, side, 'p2')}
      />
    </div>
  );
}

function Row({ name, onClick, disabled, highlight }: { name: string; onClick?: () => void; disabled?: boolean; highlight?: boolean; }) {
  const base = 'flex w-full items-center justify-between rounded-lg px-3 py-2';
  const style = disabled ? ' bg-slate-900/40 cursor-default' : ' bg-slate-900/60 hover:bg-slate-900/80';
  const win = highlight ? ' ring-2 ring-emerald-500' : '';
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base}${style}${win}`}>
      <span className={highlight ? 'font-semibold text-emerald-300' : ''}>{name}</span>
      <span className="text-slate-500 text-xs">{disabled && !highlight ? 'vs' : 'advance →'}</span>
    </button>
  );
}

function groupByRound(matches: any[], side: 'W' | 'L') {
  const map = new Map<number, any[]>();
  matches.filter(m => m.side === side).forEach(m => {
    map.set(m.round, [...(map.get(m.round) ?? []), m]);
  });
  return map;
}

