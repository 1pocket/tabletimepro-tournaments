    'use client';
    import { useState } from 'react';
    import Link from 'next/link';
    import { computePayouts } from '@ttpro/core';

    const templates = {
      top3: [0.6,0.3,0.1],
      top4: [0.5,0.25,0.15,0.1],
      top8: [0.35,0.22,0.15,0.10,0.06,0.04,0.04,0.04]
    };

    export default function NewTournamentPage({ params }: { params: { tenantId: string }}) {
      const [name, setName] = useState('Friday 8-Ball');
      const [entryFee, setEntryFee] = useState(20);
      const [greenFee, setGreenFee] = useState(5);
      const [sponsorAdd, setSponsorAdd] = useState(0);
      const [templateKey, setTemplateKey] = useState<'top3'|'top4'|'top8'>('top4');
const [playersText, setPlayersText] = useState(`Alice
Bob
Charlie
Derek
Erin
Frank
Gina
Hank`);


      const players = playersText.split(/\n|,/).map(s=>s.trim()).filter(Boolean);
      const preview = computePayouts({
        entrants: players.length,
        entryFee, greenFee, sponsorAdd,
        template: templates[templateKey]
      });

      return (
        <main className="space-y-6">
          <h1 className="text-2xl font-semibold">New Tournament</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted">Tournament name</label>
                <input className="px-3 py-2 rounded bg-panel w-full" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-muted">Entry fee</label>
                  <input type="number" className="px-3 py-2 rounded bg-panel w-full" value={entryFee}
                         onChange={e=>setEntryFee(parseFloat(e.target.value||'0'))} />
                </div>
                <div>
                  <label className="block text-sm text-muted">Green fee (per player)</label>
                  <input type="number" className="px-3 py-2 rounded bg-panel w-full" value={greenFee}
                         onChange={e=>setGreenFee(parseFloat(e.target.value||'0'))} />
                </div>
                <div>
                  <label className="block text-sm text-muted">Sponsor add-on</label>
                  <input type="number" className="px-3 py-2 rounded bg-panel w-full" value={sponsorAdd}
                         onChange={e=>setSponsorAdd(parseFloat(e.target.value||'0'))} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted">Payout template</label>
                <select className="px-3 py-2 rounded bg-panel w-full" value={templateKey}
                        onChange={e=>setTemplateKey(e.target.value as any)}>
                  <option value="top3">Top 3</option>
                  <option value="top4">Top 4</option>
                  <option value="top8">Top 8</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted">Players (one per line)</label>
                <textarea className="px-3 py-2 rounded bg-panel w-full min-h-[160px]"
                          value={playersText} onChange={e=>setPlayersText(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl">Payout Preview</h2>
              <div className="rounded bg-panel p-3">
                <div className="text-sm text-muted">Entrants</div>
                <div className="text-2xl">{players.length}</div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>Gross Entry</div><div className="text-right">${"{"+ "preview.grossEntry"+"}"}</div>
                  <div>Greens Total</div><div className="text-right">${"{"+ "preview.greensTotal"+"}"}</div>
                  <div>Net Entry Pool</div><div className="text-right font-semibold">${"{"+ "preview.netEntryPool"+"}"}</div>
                </div>
                <div className="mt-3">
                  <div className="font-semibold mb-1">Payouts</div>
                  <ol className="list-decimal list-inside space-y-1">
                    {preview.payouts.map((p, i) => (
                      <li key={i} className="flex justify-between">
                        <span>Place {i+1}</span><span>${"{"+ "p"+"}"}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <Link className="inline-block px-4 py-2 rounded bg-simonis text-bg"
                    href={`/${params.tenantId}/tournament/preview?name=${encodeURIComponent(name)}`}
              >Generate Bracket</Link>
              <p className="text-xs text-muted mt-1">Bracket generation is client-side for preview; saving requires the API.</p>
            </div>
          </div>
        </main>
      );
    }
