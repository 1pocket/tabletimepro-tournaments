# ADR-0001: Architecture Choice

## Context
We need a fast, flexible tournament add-on that can run standalone and also embed inside TableTimePro.

## Decision
- **Monorepo** with:
  - Next.js + Tailwind for web (TV display & operator views)
  - FastAPI + Postgres for persistence, SSE endpoints for live updates
  - Shared TypeScript core package for bracket/payout/calcutta logic
- Docker Compose for local dev; GitHub Actions for CI.
- Token-based trust with TableTimePro: accept JWT with `tenant_id`, `venue_id`, `role`.

## Consequences
- Simple local setup; clear separation of concerns.
- Core logic covered by unit tests and reused across web and (optionally) workers.
