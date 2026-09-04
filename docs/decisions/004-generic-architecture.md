# ADR-004: Generic Scraper and Visualization Architecture

## Context

The initial design tied the scraper and UI directly to football (soccer).
If a QA engineer wanted to review athletics, basketball, or any other Olympic sport,
the tool would need to be rewritten. The Olympic schedule contains all sports —
restricting the scraper to football discards useful data and limits reuse.

## Decision

The scraper and visualization layer are sport-agnostic.

- The scraper fetches **all events** from the Olympic schedule and returns `OlympicEvent[]`
- Sport filtering is a **separate, optional layer** applied after scraping
- The API endpoint accepts an optional `?sport=` query parameter (defaults to `football`)
- The UI renders a sport selector — switching sport re-filters already-cached data (no re-fetch)
- The table columns adapt to the selected sport

```
OlympicEvent[]  (all sports, cached in localStorage)
      │
      ▼
 sport filter   (e.g. "football", "basketball", "athletics")
      │
      ▼
 mapped data    (formatted per sport schema)
      │
      ▼
   UI table     (columns derived from sport schema)
```

## Type Structure

```ts
// base — every Olympic event
interface OlympicEvent {
  sport: string
  discipline: string
  venue: Venue
  kickoff: string | null
  status: EventStatus
  round: string
}

// extension — for match-format sports (football, basketball, volleyball…)
interface Match extends OlympicEvent {
  teams: { home: string; away: string }
  score: Score
  scorers: Scorer[]
  lineups: Lineups
}
```

## Supported Sports (Scope)

Grouping and visualization is limited to **team sports** — events where two teams
compete and produce a score. These all share the `Match` data structure.

| Group | Sports |
|---|---|
| Football | Football (Men's), Football (Women's) |
| Ball Sports | Basketball, Volleyball, Beach Volleyball, Handball, Water Polo |
| Other Team Sports | Hockey, Rugby Sevens |

Individual sports (athletics, swimming, gymnastics) are out of scope.
Their data structure differs fundamentally — no teams, no score in the match sense —
and would require a separate type and visualization layer.

## Rationale

- Scraping cost is the same whether we fetch all sports or just one — no reason to discard data
- Filtering in JavaScript (client-side) is free and instant
- Limiting to team sports keeps the `Match` type coherent — all supported sports share the same fields
- Makes the tool genuinely useful beyond football without over-engineering

## Consequences

+ Tool works for all Olympic team sports without code changes
+ Switching sport requires no re-fetch (already cached)
+ UI sport selector is a natural extension of the existing design
- Individual sports (athletics, swimming) are explicitly out of scope
- Slightly more complex type hierarchy (OlympicEvent → Match)
