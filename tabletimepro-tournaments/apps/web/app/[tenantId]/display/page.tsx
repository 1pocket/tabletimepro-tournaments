'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Match = { id: string; round: number; side: 'W'|'L'; p1?: string|null; p2?: string|null; winnerSlot?: 'p1'|'p2' };
type Snapshot = { winners: Match[]; losers: Match[] };

export default function DisplayPage() {
  const sp = useSearchParams();
  const key = sp.get('key') || '';
  const [snap, setSnap] = useState<Snapshot | null>(null);

  // pull immediately + poll every 5s
  useEffect(() => {
    const read = () => {
      if (typeof window === 'undefined' || !key) return;
      try { const s = window.localStorage.getItem(key); if (s) setSnap(JSON.parse(s)); } catch {}
    };
    read();
    const t = setInterval(read, 5000);
    return () => clearInterval(t);
  }, [key]);

  const winnersByRound = useMemo(() => groupByRound(snap?.winners ?? [], 'W'), [snap]);
  const losersByRound = useMemo(() => groupByRound(snap?.losers ?? [], 'L'), [snap]);

  if (!key) return <div className="p-8">Missing <code>?key=…</code>. Open the bracket page and click <b>Open TV Display</b>.</div>;
  if (!snap) return <div className="p-8">Waiting for tournament state…</div>;

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8 space-y-10">
      <h1 className="text-3xl font-bold tracking-tight">Live Bracket</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Winners</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from(winnersByRound.keys()).map((r) => (
            <Round key={`W${r}`} title={`W${r}`} matches={winnersByRound.get(r)!} />
          ))}
        </div>
      </section>

      { (snap.losers?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Losers</h2>
          <div className="grid gap-6 md:grid-cols-6">
            {Array.from(losersByRound.keys()).map((r) => (
              <Round key={`L${r}`} title={`L${r}`} matches={losersByRound.get(r)!} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Round({ title, matches }: { title: string; matches: Match[] }) {
  return (
    <div>
      <div className="mb-2 text-slate-300 text-lg">{title}</div>
      <div className="space-y-4">
        {matches.map((m) => (
          <div key={m.id} className="rounded-2xl bg-slate-800 p-4 space-y-3 shadow">
            <div className="text-sm text-slate-400">{m.id}</div>
            <Row name={m.p1 ?? '— bye —'} win={m.winnerSlot === 'p1'} />
            <Row name={m.p2 ?? '— bye —'} win={m.winnerSlot === 'p2'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ name, win }: { name: string; win?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-xl ${win ? 'bg-emerald-900/40 ring-2 ring-emerald-500' : 'bg-slate-900/60'}`}>
      <span className={win ? 'font-semibold text-emerald-300' : ''}>{name}</span>
      <span className="text-slate-500 text-sm">vs</span>
    </div>
  );
}

function groupByRound(matches: Match[], side: 'W' | 'L') {
  const map = new Map<number, Match[]>();
  matches.filter(m => m.side === side).forEach(m => {
    map.set(m.round, [...(map.get(m.round) ?? []), m]);
  });
  return map;
}
