# Payout Schemes

## Entry Pool
- `gross_entry = entrants * entry_fee`
- `greens = entrants * green_fee`
- `net_entry_pool = gross_entry - greens + sponsor_add`

## Templates
- **Top 3:** [60%, 30%, 10%]
- **Top 4:** [50%, 25%, 15%, 10%]
- **Top 8:** [35%, 22%, 15%, 10%, 6%, 4%, 4%, 4%]

Choose the highest template that fits `entrants` or manually override.

## Rounding
- Round to nearest whole dollar (configurable: up/down/bankers).
