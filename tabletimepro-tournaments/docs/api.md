# API Overview (FastAPI)

Base URL: `/api`

## Auth
- Accept Bearer JWT from TableTimePro with `tenant_id`, `venue_id`, `role`.
- For dev, allow `X-Debug-Tenant: dev-tenant` header.

## Endpoints (initial)
- `GET /health` – health check.
- `POST /tournaments` – create tournament.
- `GET /tournaments/{id}` – get tournament details (players, config).
- `POST /tournaments/{id}/players` – add players (bulk supported).
- `POST /tournaments/{id}/draw` – randomize and create bracket (single‑elim v1).
- `POST /tournaments/{id}/matches/{match_id}/result` – record match result and advance bracket.
- `GET /tournaments/{id}/display` – read‑only payload for TV display.
- `GET /tournaments/{id}/payouts` – compute payouts (entry pool) and calcutta payouts.
- `POST /tournaments/{id}/calcutta/bid` – record a bid on a player/team.
- `GET /tournaments/{id}/sse` – server‑sent events for live updates.
