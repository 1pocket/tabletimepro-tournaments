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

  // prepare encoded state (now includes payout config)
  const stateParam = useMemo(
    () =>
      encodeState({
        name,
        format,
        buybacks,
        buybackFee,
        players,
        entryFee,
        greenFee,
        sponsorAdd,
        templateKey
      }),
    [name, format, buybacks, buybackFee, players, entryFee, greenFee, sponsorAdd, templateKey]
  );
  // ...imports remain...
const templates = {
  top3: [0.6, 0.3, 0.1],
  top4: [0.5, 0.25, 0.15, 0.1],
  top8: [0.35, 0.22, 0.15, 0.10, 0.06, 0.04, 0.04, 0.04],
};

type FinalsMode = 'single' | 'double-reset';

// inside component state:
const [finalsMode, setFinalsMode] = useState<FinalsMode>('single');

// when building stateParam:
const stateParam = useMemo(
  () =>
    encodeState({
      name,
      format,
      buybacks,
      buybackFee,
      players,
      entryFee,
      greenFee,
      sponsorAdd,
      templateKey,
      finalsMode,        // <-- include this
    }),
  [name, format, buybacks, buybackFee, players, entryFee, greenFee, sponsorAdd, templateKey, finalsMode]
);

// In your form UI, add a Finals Format selector (put it near format/buybacks):
<div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
  <div className="font-medium">Finals Format</div>
  <div className="flex gap-3">
    <label className="inline-flex items-center gap-2">
      <input
        type="radio"
        name="finalsMode"
        value="single"
        checked={finalsMode === 'single'}
        onChange={() => setFinalsMode('single')}
      />
      <span>Single Grand Final (one race)</span>
    </label>
    <label className="inline-flex items-center gap-2">
      <input
        type="radio"
        name="finalsMode"
        value="double-reset"
        checked={finalsMode === 'double-reset'}
        onChange={() => setFinalsMode('double-reset')}
      />
      <span>True Double Elim (reset if hot seat loses set 1)</span>
    </label>
  </div>
</div>


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
        {/* ... (rest of your file unchanged) ... */}
      </div>

      {/* payout preview (unchanged) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        {/* ... unchanged payout preview block ... */}
      </div>
    </main>
  );
}

