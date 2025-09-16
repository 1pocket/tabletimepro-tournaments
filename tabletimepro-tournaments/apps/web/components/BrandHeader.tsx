'use client';

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-sky-900/40 via-slate-900/40 to-emerald-900/40 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-wider text-slate-400 uppercase">TableTimePro</div>
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight">Tournaments</div>
          {subtitle && <div className="text-slate-300 mt-1">{subtitle}</div>}
        </div>
        <div className="opacity-70">
          {/* simple “logo” mark */}
          <div className="h-12 w-12 rounded-xl bg-sky-600/30 ring-1 ring-sky-500 grid place-items-center">
            <span className="text-xl font-bold">TT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
