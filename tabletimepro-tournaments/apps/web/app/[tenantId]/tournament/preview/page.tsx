'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { drawSingleElim, drawDoubleElim } from '@ttpro/core';
import { TournamentStoreProvider, useTournament } from '../../../../lib/tournamentStore';

import Link from 'next/link';

type State = {
  name: string; format: 'single' | 'double'; buybacks: boolean; buybackFee?: number; players: string[];
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

  const tvUrl = useMemo(() => {
    const key = encodeURIComponent(storageKey);
    return `/${params.tenantId}/display?key=${key}`;
  }, [params.tenantId, storageKey]);

  return (
    <TournamentStoreProvider initial={initial} storageKey={storageKey}>
      <PageUI name={state.name} format={state.format} tvUrl={tvUrl} />
    </TournamentStoreProvider>
  );
}

function PageUI({ name, format, tvUrl }: { name: string; format: 'single'|'double'; tvUrl: string }) {
  const { winners, losers, undo, reset } = useTournament();
  const winnersByRound = groupByRound(winners, 'W');
  const losersByRound = groupByRound(losers, 'L');

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">{name}</h1>
          <div className="text-slate-400">{format.toUpperCase()} • click a player to advance</div>
        </div>
        <div className="flex gap-2">
          <Link href={tvUrl} className="rounded-lg bg-sky-600 px-3 py-2 hover:bg-sky-500">Open TV Display</Link>
          <button onClick={undo} className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600">Undo</button>
          <button onClick={reset} className="rounded-lg bg-red-600 px-3 py-2 hover:bg-red-500">Reset</button>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Winners Bracket</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from(winnersByRound.keys()).map((r) => (
            <RoundCol key={`W${r}`} title={`W${r}`} matches={winnersByRound.get(r)!} side="W" />
          ))}
        </div>
      </section>

      {format === 'double' && (
        <section>
          <h2 className="text-lg font-semibold mt-8 mb-3">Losers Bracket</h2>
          <div className="grid gap-4 md:grid-cols-6">
            {Array.from(losersByRound.keys()).map((r) => (
              <RoundCol key={`L${r}`} title={`L${r}`} matches={losersByRound.get(r)!} side="L" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function RoundCol({ title, matches, side }: { title: string; matches: any[]; side: 'W'|'L' }) {
  return (
    <div>
      <div className="mb-2 text-slate-300 text-sm">{title}</div>
      <div className="space-y-3">
        {matches.map((m) => (<MatchCard key={m.id} side={side} match={m} />))}
      </div>
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
  const style =
    disabled
      ? ' bg-slate-900/40 cursor-default'
      : ' bg-slate-900/60 hover:bg-slate-900/80';
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

