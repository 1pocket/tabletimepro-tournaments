'use client';
import { useSearchParams } from 'next/navigation';
import { drawSingleElim } from '@ttpro/core';
import { useMemo, useState } from 'react';

export default function PreviewBracket() {
  const sp = useSearchParams();
  const name = sp.get('name') || 'Tournament';
  const [playersText, setPlayersText] = useState('Alice\nBob\nCharlie\nDerek\nErin\nFrank\nGina\nHank');
  const players = useMemo(() => playersText.split(/\n|,/).map(s=>s.trim()).filter(Boolean), [playersText]);
  const draw = drawSingleElim({ players });

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">{name} — Bracket Preview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-muted">Players (one per line)</label>
          <textarea className="px-3 py-2 rounded bg-panel w-full min-h-[200px]"
                    value={playersText} onChange={e=>setPlayersText(e.target.value)} />
          <p className="text-xs text-muted mt-1">{draw.bracketSize}-slot bracket • {draw.byes} byes</p>
        </div>

        <div className="rounded bg-panel p-3">
          <h2 className="text-lg mb-2">Round 1</h2>
          <ol className="space-y-2">
            {draw.pairs.map((pair, i) => (
              <li key={i} className="flex justify-between border-b border-zinc-800 pb-1">
                <span>{pair.p1 || 'BYE'}</span>
                <span className="text-muted">vs</span>
                <span>{pair.p2 || 'BYE'}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  )
}
