"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { drawSingleElim, drawDoubleElim } from "@ttpro/core";

type State = {
  name: string;
  format: "single" | "double";
  buybacks: boolean;
  buybackFee?: number;
  players: string[];
};

function decodeState(param: string | null): State {
  if (!param || typeof window === "undefined") {
    return { name: "Tournament", format: "single", buybacks: false, players: [] };
  }
  try {
    const json = decodeURIComponent(atob(decodeURIComponent(param)));
    return JSON.parse(json);
  } catch {
    return { name: "Tournament", format: "single", buybacks: false, players: [] };
  }
}

export default function PreviewPage({ params }: { params: { tenantId: string } }) {
  const sp = useSearchParams();
  const state = useMemo(() => decodeState(sp.get("state")), [sp]);

  const bracket = useMemo(() => {
    const opts = { seed: 42, buybacksEnabled: state.buybacks, buybackFee: state.buybackFee };
    return state.format === "single"
      ? drawSingleElim(state.players, opts)
      : drawDoubleElim(state.players, opts);
  }, [state]);

  const winnersByRound = groupByRound(bracket.winners, "W");
  const losersByRound = groupByRound(bracket.losers, "L");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">{state.name}</h1>
        <div className="text-slate-400">
          {state.format.toUpperCase()} {state.buybacks ? "• Buybacks enabled" : ""}
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Winners Bracket</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from(winnersByRound.keys()).map((r) => (
            <RoundCol key={`W${r}`} title={`W${r}`} matches={winnersByRound.get(r)!} />
          ))}
        </div>
      </section>

      {state.format === "double" && (
        <section>
          <h2 className="text-lg font-semibold mt-8 mb-3">Losers Bracket</h2>
          <div className="grid gap-4 md:grid-cols-6">
            {Array.from(losersByRound.keys()).map((r) => (
              <RoundCol key={`L${r}`} title={`L${r}`} matches={losersByRound.get(r)!} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function RoundCol({ title, matches }: { title: string; matches: any[] }) {
  return (
    <div>
      <div className="mb-2 text-slate-300 text-sm">{title}</div>
      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="rounded-xl bg-slate-800 p-3 space-y-2">
            <div className="text-xs text-slate-400">{m.id}</div>
            <Row name={m.p1 ?? "— bye —"} />
            <Row name={m.p2 ?? "— bye —"} />
          </div>
        ))}
      </div>
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

function groupByRound(matches: any[], side: "W" | "L") {
  const map = new Map<number, any[]>();
  matches
    .filter((m) => m.side === side)
    .forEach((m) => map.set(m.round, [...(map.get(m.round) ?? []), m]));
  return map;
}

