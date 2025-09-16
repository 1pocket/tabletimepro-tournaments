'use client';

import { useMemo, useState } from 'react';
import { computeCalcuttaPayouts, CalcuttaBid } from '@ttpro/core';

const templates = {
  top3: [0.6, 0.3, 0.1],
  top4: [0.5, 0.25, 0.15, 0.1],
  top8: [0.35, 0.22, 0.15, 0.10, 0.06, 0.04, 0.04, 0.04],
};

export function CalcuttaPanel({
  knownPlacements, // e.g. ['Alice','Bob','Charlie'] if decided, else blanks
}: {
  knownPlacements: string[];
}) {
  const [rakePct, setRakePct] = useState(0);
  const [templateKey, setTemplateKey] = useState<keyof typeof templates>('top4');
  const [bidsText, setBidsText] = useState(
    `# player, owner, amount
Alice, Chris, 120
Bob, Dana, 80
Charlie, Evan, 60`
  );

  const bids: CalcuttaBid[] = useMemo(() => {
    return bidsText
      .split('\n')
      .map((ln) => ln.trim())
      .filter((ln) => ln && !ln.startsWith('#'))
      .map((ln) => {
        const [player, owner, amount] = ln.split(',').map((s) => (s ?? '').trim());
        return { player, owner, amount: Number(amount || 0) };
      })
      .filter((b) => b.player && !Number.isNaN(b.amount));
  }, [bidsText]);

  // placements from UI or known results
  const [manualPlacements, setManualPlacements] = useState<string[]>([]);
  const placements = useMemo(() => {
    const base = manualPlacements.length ? manualPlacements : knownPlacements;
    const k = templates[templateKey].length;
    const arr = Array.from({ length: k }, (_, i) => base[i] || '');
    return arr;
  }, [manualPlacements, knownPlacements, templateKey]);

  const result = useMemo(() => {
    return computeCalcuttaPayouts(bids, { rakePct, template: templates[templateKey] }, placements);
  }, [bids, rakePct, templateKey, placements]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Calcutta</h3>
        <div className="text-sm text-slate-400">Pot summarized by owner and place</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm text-slate-300">
            Rake %
            <input
              type="number"
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2"
              value={rakePct}
              onChange={(e) => setRakePct(Number(e.target.value || 0))}
              min={0}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Template
            <select
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value as any)}
            >
              <option value="top3">Top 3</option>
              <option value="top4">Top 4</option>
              <option value="top8">Top 8</option>
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Placements (optional override)
            {templates[templateKey].map((_, idx) => (
              <input
                key={idx}
                placeholder={`${ordinal(idx + 1)} place player`}
                className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2"
                value={manualPlacements[idx] || ''}
                onChange={(e) => {
                  const next = manualPlacements.slice();
                  next[idx] = e.target.value;
                  setManualPlacements(next);
                }}
              />
            ))}
            <p className="mt-1 text-xs text-slate-500">
              If left blank, we use the live results (1st/2nd/3rd…) when available.
            </p>
          </label>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-slate-300">
            Bids (player, owner, amount)
            <textarea
              rows={10}
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm"
              value={bidsText}
              onChange={(e) => setBidsText(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Calcutta Pot" value={`$${result.pot.toFixed(2)}`} />
        <Stat label="Rake" value={`$${result.rake.toFixed(2)}`} />
        <Stat label="Distributable" value={`$${result.distributable.toFixed(2)}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <h4 className="text-slate-300 mb-2">Payout by Place</h4>
          <ul className="space-y-2">
            {result.playerPayouts.map((p) => (
              <li key={p.place} className="rounded-lg bg-slate-800 px-4 py-2 flex items-center justify-between">
                <div>
                  <div className="text-slate-300">{ordinal(p.place)} – {p.player || '—'}</div>
                  <div className="text-xs text-slate-500">Owner: {p.owner || '—'} • {(p.share * 100).toFixed(0)}%</div>
                </div>
                <div className="font-semibold">${p.amount.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-slate-300 mb-2">Payout by Owner</h4>
          <ul className="space-y-2">
            {result.ownerPayouts.length ? (
              result.ownerPayouts.map((o) => (
                <li key={o.owner} className="rounded-lg bg-slate-800 px-4 py-2 flex items-center justify-between">
                  <div className="text-slate-300">{o.owner}</div>
                  <div className="font-semibold">${o.amount.toFixed(2)}</div>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No owner payouts yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800 px-3 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ordinal(n: number) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}
