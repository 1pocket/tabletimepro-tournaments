"use client";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [tenantId, setTenantId] = useState("dev-tenant");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">TableTimePro — Tournaments</h1>
        <p className="mt-2 text-slate-300">
          Create and run a tournament. Greens fees are automatically handled in payouts, and Calcutta is supported.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
        <label className="block text-sm text-slate-300 mb-2">Tenant ID</label>
        <input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="your-venue-or-tenant"
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 font-medium hover:bg-sky-500"
            href={`/${encodeURIComponent(tenantId)}/new`}
          >
            New tournament
          </Link>

          <Link
            className="inline-flex items-center rounded-xl bg-slate-700 px-4 py-2 font-medium hover:bg-slate-600"
            href={`/${encodeURIComponent(tenantId)}/tournament/preview`}
          >
            Bracket preview
          </Link>
        </div>
      </section>
    </main>
  );
}
