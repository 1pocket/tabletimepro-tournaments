'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [tenantId, setTenantId] = useState('dev-tenant');
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">TableTimePro — Tournaments</h1>
      <p className="text-muted">Create and run a tournament. Greens fees are accounted for automatically.</p>

      <div className="space-y-2">
        <label className="block text-sm text-muted">Tenant ID</label>
        <input value={tenantId} onChange={e=>setTenantId(e.target.value)}
               className="px-3 py-2 rounded bg-panel w-full" />
      </div>

      <div className="flex gap-3">
        <Link className="px-4 py-2 rounded bg-simonis text-bg" href={`/${tenantId}/new`}>New tournament</Link>
        <Link className="px-4 py-2 rounded border border-simonis" href={`/${tenantId}/demo`}>Demo / Seed</Link>
      </div>
    </main>
  )
}
