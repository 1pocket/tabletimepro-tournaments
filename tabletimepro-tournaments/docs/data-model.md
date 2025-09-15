# Data Model (Initial)

## Entities
- **Tenant** (id, name)
- **Venue** (id, tenant_id, name)
- **Tournament**
  - id, tenant_id, venue_id, name, game (8‑ball/9‑ball), start_time
  - entry_fee, green_fee, sponsor_add, payout_template_key (e.g., top3, top4)
  - calcutta_enabled, calcutta_house_vig_pct, calcutta_payout_template_key
  - bracket_type = `single` (v1), `double` (later), best_of, race_to, notes
- **Player**: id, name, rating (optional), contact (optional)
- **Entry**: tournament_id, player_id, paid, payment_method, created_at
- **Match**:
  - id, tournament_id, round, position, player1_id, player2_id, best_of
  - status (pending/active/done), score_p1, score_p2, winner_id
- **CalcuttaBid**: tournament_id, player_id, amount, bidder_name, created_at

## Derived
- **Bracket**: computed from entries (randomized draw, byes to power of two).
- **Payouts**: driven by templates and configuration; green fees deducted from entries pool.
- **Calcutta payouts**: pot minus house vig, split by template.
