# Integration with TableTimePro

- **JWT Trust:** share TTP JWT (HS256) with `tenant_id`, `venue_id`, `role` claims.
- **Deep Links:** Venue portal can link to create/run/display pages with these ids.
- **Stripe:** reuse TableTimePro keys or a tournaments-specific product for entry fees.
- **Roles:** owner/manager can create tournaments and payouts; staff/scorekeeper can record results; display is read-only.
