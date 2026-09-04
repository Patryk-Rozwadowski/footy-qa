# ADR-002: Client-side localStorage for Data Storage

## Context

Olympic data is historical — Paris 2024 is over and the schedule will never change.
Scraping the Olympic page takes a few seconds. The tool is used locally by QA engineers,
not as a shared service.

## Decision

Scraping results are stored in **localStorage** on the client side.
Data is never fetched automatically on page refresh.
The user triggers data loading manually via a UI button.

```typescript
localStorage.setItem('olympic-matches', JSON.stringify(matches))
localStorage.setItem('olympic-matches-fetched-at', new Date().toISOString())
```

The UI displays the timestamp of the last fetch and allows a manual force re-fetch.

## Rationale

- Data is static — once fetched it is always up to date
- No infrastructure cost (no database, no server cache)
- Persists across browser sessions
- Simple to implement

## Rejected Alternatives

| Option | Reason for rejection |
|---|---|
| Scrape on every refresh | Slow; unnecessary load on the Olympic server |
| sessionStorage | Data lost on tab close — poor UX |
| Backend database | Overkill; local tool, not multi-user |
| Hardcoded data as primary source | Does not demonstrate scraping; does not satisfy "trigger data loading" requirement |

## Static Seed Fallback

`src/data/paris2024-seed.ts` ships a pre-generated snapshot of all Paris 2024
football matches. The API route uses it when live scraping fails:

```
GET /api/scrape
  └─ scrapeOlympicSchedule()  ─── success → return live data + comparison
  └─ error / empty            ─── fallback → return seed data (source: "seed")
```

The UI displays a "Static data" label whenever seed data is in use.
This is a resilience mechanism, not a replacement for live scraping.

## Consequences

+ Zero infrastructure cost and complexity
+ Data persists across sessions
+ Seed fallback ensures the tool remains usable even if the Olympics API changes
- localStorage limit (~5 MB) — irrelevant at this data scale (~50 matches)
- Data is not shared across browsers or devices
- Seed data is a point-in-time snapshot; it cannot reflect late changes to the source
