'use client';

// Keep this component standalone so it doesn't rely on a type that isn't exported
export type MatchPair = {
  id?: string;
  round?: number;
  side?: 'W' | 'L';
  p1?: string | null;
  p2?: string | null;
};

export function Bracket({ pairs }: { pairs: MatchPair[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {pairs.map((m, i) => (
        <div key={m.id ?? i} className="rounded-xl bg-slate-800 p-3 space-y-2">
          <div className="text-xs text-slate-400">
            {m.id ?? `Match ${i + 1}`}
            {m.side ? ` • ${m.side}${m.round ?? ''}` : ''}
          </div>
          <Row name={m.p1 ?? '— bye —'} />
          <Row name={m.p2 ?? '— bye —'} />
        </div>
      ))}
    </div>
  );
}

function Row({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
      <span>{name}</span>
      <span className="text-slate-500 text-xs">vs</span>
    </div>
  );
}

export default Bracket;
