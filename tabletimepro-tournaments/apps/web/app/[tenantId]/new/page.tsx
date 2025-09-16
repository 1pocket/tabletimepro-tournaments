"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { computePayouts, drawSingleElim, drawDoubleElim } from "@ttpro/core";

const templates = {
  top3: [0.6, 0.3, 0.1],
  top4: [0.5, 0.25, 0.15, 0.1],
  top8: [0.35, 0.22, 0.15, 0.10, 0.06, 0.04, 0.04, 0.04],
};

function encodeState(obj: unknown) {
  // Browser-safe base64 (works with unicode)
  if (typeof window === "undefined") return "";
  const json = JSON.stringify(obj);
  const b64 = btoa(encodeURIComponent(json));
  return encodeURIComponent(b64);
}

export default function NewTournamentPage({ params }: { params: { tenantId: string } }) {
  const [name, setName] = useState("Friday 8-Ball");
  const [entryFee, setEntryFee] = useState(20);
  const [greenFee, setGreenFee] = useState(5);
  const [sponsorAdd, setSponsorAdd] = useState(0);
  const [templateKey, setTemplateKey] = useState<keyof typeof templates>("top4");
  const [format, setFormat] = useState<"single" | "double">("double");
  const [buybacks, setBuybacks] = useState(true);
  const [buybackFee, setBuybackFee] = useState(10);
  const [playersText, setPlayersText] = useState(`Alice
Bob
Charlie
Derek
Erin
Frank
Gina
Hank`);

  const players = useMemo(
    () => playersText.split(/\n|,/).map(s => s.trim()).filter(Boolean),
    [playersText]
  );

  const payoutPreview = useMemo(
    () =>
      computePayouts({
        entrants: players.length,
        entryFee,
        greenFee,
        sponsorAdd,
        template: templates[templateKey],
      }),
    [players.length, entryFee, greenFee, sponsorAdd, templateKey]
  );

  // Generate a bracket now so you can see count/shape in UI (optional)
  useMemo(() => {
    const opts = { seed: 42, buybacksEnabled: buybacks, buybackFee };
    return format === "single"
      ? drawSingleElim(players, opts)
      : drawDoubleElim(players, opts);
  }, [players, format, buybacks, buybackFee]);

  const stateParam = useMemo(
    () =>
      encodeState({
        name,
        format,
        buybacks,
        buybackFee,
        players,
      }),
    [name, format, buybacks, buybackFee, players]
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">New Tournament</h1>
        <Link
          href={`/${params.tenantId}/tournament/preview?state=${stateParam}`}
          className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600"
        >
          Generate bracket
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* left: config */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Tournament name</label>
            <input
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-slate-300">Entry fee</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Greens fee</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                value={greenFee}
                onChange={(e) => setGreenFee(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Sponsor add</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                value={sponsorAdd}
                onChange={(e) => setSponsorAdd(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300">Format</label>
              <select
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                value={format}
                onChange={(e) => setFormat(e.target.value as "single" | "double")}
              >
                <option value="single">Single elimination</option>
                <option value="double">Double elimination</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300">Payout template</label>
              <select
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value as keyof typeof templates)}
              >
                <option value="top3">Top 3</option>
                <option value="top4">Top 4</option>
                <option value="top8">Top 8</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={buybacks}
                onChange={(e) => setBuybacks(e.target.checked)}
              />
              <span className="text-sm text-slate-300">Enable buybacks</span>
            </label>
            {buybacks && (
              <input
                type="number"
                className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                value={buybackFee}
                onChange={(e) => setBuybackFee(Number(e.target.value))}
              />
            )}
          </div>
        </div>

        {/* right: players */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <label className="text-sm text-slate-300">
            Players (one per line or comma-separated)
          </label>
          <textarea
            className="mt-1 h-64 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
            value={playersText}
            onChange={(e) => setPlayersText(e.target.value)}
          />
          <p className="mt-2 text-sm text-slate-400">{players.length} players</p>
        </div>
      </div>

      {/* payout preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold mb-4">Payout preview (greens fees deducted)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Stat label="Entry pool" value={`$${payoutPreview.entryPool.toFixed(2)}`} />
          <Stat label="Greens fees" value={`$${payoutPreview.greensTotal.toFixed(2)}`} />
          <Stat label="Payout total" value={`$${payoutPreview.payoutTotal.toFixed(2)}`} />
        </div>
        <ul className="mt-4 grid md:grid-cols-2 gap-3">
          {payoutPreview.splits.map((s) => (
            <li
              key={s.place}
              className="rounded-lg bg-slate-800 px-4 py-2 flex items-center justify-between"
            >
              <span className="text-slate-300">Place {s.place}</span>
              <span className="font-semibold">
                ${s.amount.toFixed(2)}{" "}
                <span className="text-slate-400 text-sm">({(s.share * 100).toFixed(0)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

