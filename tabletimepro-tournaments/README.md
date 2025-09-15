# TableTimePro — Tournaments Add‑On

A production‑grade add‑on for **TableTimePro** that lets venues run bar/pool‑hall tournaments end‑to‑end:
- Enter player names (or import from CSV/phone contacts) and **randomize the draw**
- Generate **single‑elimination** brackets (double‑elimination roadmap)
- **Live bracket view** designed for TVs (large typography, high contrast)
- **Payouts**: entry pool minus **greens fees** + optional sponsor/house adjustments
- **Calcutta**: track bids, totals, house vig, and automatic payouts
- Role‑aware: **Owner/Manager/Staff/Scorekeeper/Display**
- Deploy standalone or embed inside TableTimePro (shared tenant/venue identity)

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
- **Core Shared Logic:** TypeScript package (`packages/core`)
- **Backend:** FastAPI + SQLAlchemy + Postgres (via Docker Compose); Pydantic for schemas
- **Testing:** Vitest (web), Pytest (api), Playwright (e2e – optional later)
- **CI:** GitHub Actions (lint, test, build)

## Monorepo Layout
```
tabletimepro-tournaments/
├─ apps/
│  └─ web/                # Next.js app (staff, setup, display modes)
├─ services/
│  └─ api/                # FastAPI service (REST+SSE), Alembic migrations
├─ packages/
│  ├─ core/               # Shared tournament logic (brackets/payouts/calcutta)
│  └─ ui/                 # (Optional) Shared UI kit if you want to extract components
├─ docs/                  # Architecture, ADRs, data model, API, payouts, calcutta
├─ devops/                # Docker compose, Dockerfiles, deploy configs
└─ .github/workflows/     # CI pipelines
```

## Quick Start (Dev)
1) **Clone** and copy `.env.example` to `.env` in root and in `services/api/` as needed.
2) **Docker Compose** (db + api) in one terminal:
   ```bash
   docker compose -f devops/docker-compose.yml up --build
   ```
3) **Web app** in another terminal (from `apps/web`):
   ```bash
   pnpm install
   pnpm dev
   ```
4) Navigate to **http://localhost:3000** (API is **http://localhost:8000**).

## TV Display Mode
- `/:tenantId/tournaments/:id/display` — a high‑contrast, auto‑refreshing bracket view for mirroring to TVs.
- Toggle **dark theme** with Simonis‑style tourney blue accents.

## Integration with TableTimePro
- Accepts a **TTP JWT** with `tenant_id`, `venue_id`, and `role` claims.
- Can be **embedded** in the TableTimePro Venue Portal via iframe or routed link.
- Stripe can be reused to collect entry fees; green fees are **automatically deducted**.

## Greens Fees & Payouts (Defaults)
- `net_entry_pool = entrants * entry_fee - entrants * green_fee + sponsor_add`
- Apply a payout template (e.g., Top 3: `[0.6, 0.3, 0.1]` or Top 4, Top 8, etc.).
- **Round** to whole dollars (configurable).

## Calcutta
- Track **bids per player/team**, sum to a **calcutta pot**.
- Optional **house_vig_pct** deducted from calcutta pot.
- Distribute per template (e.g., `[0.7, 0.2, 0.1]` for 1st/2nd/3rd).

## Roadmap
- Double elimination brackets (winners/losers tree)
- QR code public bracket page
- CSV import/export and payouts printable report
- Stripe terminals for in‑person entries
- Offline‑first (PWA) for back‑room Wi‑Fi drops

---

### Repo Hygiene / Senior Practices
- **ADR** folder for decisions (see `docs/adr/ADR-0001-architecture.md`).
- **CODEOWNERS**, PR templates, conventional commits, versioned releases.
- Linting & tests on CI; preview deploy for `apps/web`.

### Licensing
MIT by default; swap for private/commercial if preferred.
