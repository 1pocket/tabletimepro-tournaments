"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { computePayouts, drawSingleElim, drawDoubleElim } from "@ttpro/core";

const templates = {
  top3: [0.6, 0.3, 0.1],
  top4: [0.5, 0.25, 0.15, 0.1],
  top8: [0.35, 0.22, 0.15, 0.10, 0.06, 0.04, 0.04, 0.04],
};

type FinalsMode = "single" | "double-reset";

function encodeState(obj: unknown) {
  if (typeof window === "undefined") return "";
  const json = JSON.stringify(obj);
  const b64 = btoa(encodeURIComponent(json));
  return encodeURIComponent(b64);
}

export default function NewTournamentPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const [name, setName] = useState("Friday 8-Ball");
  const [format, setFormat] = useState<"single" | "double">("double");
  const [finalsMode, setFinalsMode] = useState<FinalsMode>("single");

  const [entryFee, setEntryFee] = useState(20);
  const [greenFee, setGreenFee] = useState(5);
  const [sponsorAdd, setSponsorAdd] = useState(0);
  const [templateKey, setTemplateKey] =
    useState<keyof typeof templates>("top4");

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
    () => playersText.split(/\n|,/).map((s) => s.trim()).filter(Boolean),
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

  // Build encoded state for the preview page
  const stateParam = useMemo(
    () =>
      encodeState({
        name,
        format,
        finalsMode, // <= include finals choice
        buybacks,
        buybackFee,
        players,
        entryFee,
        greenFee,
        sponsorAdd,
        templateKey,
      }),
    [
      name,
      format,
      finalsMode,
      buybacks,
      buybackFee,
      players,
      entryFee,
      greenFee,
      sponsorAdd,
      templateKey,
    ]
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-semibold">New Tournament</h1>
        <Link
          href={`/${params.tenantId}/tournament/preview?state=${stateParam}`}
          className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600"
        >
          Generate bracket
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: configuration */}
        <div className="space-y-6">
          {/* Basics */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                className="w-full rounded-lg bg-slate-800 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Friday 8-Ball"
              />
            </div>

            <div>
              <div className="block text-sm text-slate-400 mb-2">Format</div>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="format"
                    value="single"
                    checked={format === "single"}
                    onChange={() => setFormat("single")}
                  />
                  <span>Single Elimination</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="format"
                    value="double"
                    checked={format === "double"}
                    onChange={() => setFormat("double")}
                  />
                  <span>Double Elimination</span>
                </label>
              </div>
            </div>

            {format === "double" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="font-medium">Finals Format</div>
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="finalsMode"
                      value="single"
                      checked={finalsMode === "single"}
                      onChange={() => setFinalsMode("single")}
                    />
                    <span>Single Grand Final (one race)</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="finalsMode"
                      value="double-reset"
                      checked={finalsMode === "double-reset"}
                      onChange={() => setFinalsMode("double-reset")}
                    />
                    <span>True Double Elim (reset if hot seat loses set 1)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Money */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Entry Fee ($)
              </label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-800 px-3 py-2"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Greens Fee ($)
              </label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-800 px-3 py-2"
                value={greenFee}
                onChange={(e) => setGreenFee(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Sponsor Add ($)
              </label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-800 px-3 py-2"
                value={sponsorAdd}
                onChange={(e) => setSponsorAdd(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Payout Template
              </label>
              <select
                className="w-full rounded-lg bg-slate-800 px-3 py-2"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value as keyof typeof templates)}
              >
                <option value="top3">Top 3 (60/30/10)</option>
                <option value="top4">Top 4 (50/25/15/10)</option>
                <option value="top8">Top 8</option>
              </select>
            </div>
          </div>

          {/* Buybacks */}
          {format === "double" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 grid grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={buybacks}
                  onChange={(e) => setBuybacks(e.target.checked)}
                />
                <span>Enable Buybacks</span>
              </label>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Buyback Fee ($)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-slate-800 px-3 py-2"
                  value={buybackFee}
                  onChange={(e) => setBuybackFee(Number(e.target.value))}
                  disabled={!buybacks}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: players + preview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Players</div>
              <div className="text-xs text-slate-400">
                {players.length} entrant{players.length === 1 ? "" : "s"}
              </div>
            </div>
            <textarea
              className="mt-2 h-56 w-full rounded-lg bg-slate-800 px-3 py-2 font-mono"
              value={playersText}
              onChange={(e) => setPlayersText(e.target.value)}
              placeholder="One name per line"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="font-medium mb-3">Payout Preview (greens deducted)</div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Entry pool" value={`$${payoutPreview.entryPool.toFixed(2)}`} />
              <Stat label="Greens fees" value={`$${payoutPreview.greensTotal.toFixed(2)}`} />
              <Stat label="Payout total" value={`$${payoutPreview.payoutTotal.toFixed(2)}`} />
            </div>
            <ul className="mt-3 space-y-2">
              {payoutPreview.splits.map((s) => (
                <li
                  key={s.place}
                  className="rounded-lg bg-slate-800 px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-slate-300">Place {s.place}</span>
                  <span className="font-semibold">
                    ${s.amount.toFixed(2)}{" "}
                    <span className="text-slate-400 text-xs">
                      ({(s.share * 100).toFixed(0)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
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

