# ADR-004: Football-Only Scope

## Context

The Olympic schedule JSON API returns all sports. An earlier design added a sport
selector and sport-agnostic data model (`SPORT_GROUPS`, `filterBySport`, `SportSelector`)
to support switching between Men's and Women's Football and potentially other team sports.

## Decision

Scope the tool strictly to **football (all genders)**. Remove the sport selector, filtering
layer, and all sport-agnostic abstractions.

- The scraper filters `disciplineCode === 'FBL'` at fetch time — only football matches reach the UI
- `mapper.ts` exposes only `sortByKickoff` and `toEndpoint` — no sport filtering
- `HomeClient` holds a single `Match[]` state — no derived filtered view
- The table always shows all fetched matches (Men's + Women's Football combined)

## Rationale

- The task requirement is football-only; a sport selector adds UI complexity with no requirement driving it
- Removing the layer reduces state, props, and cognitive overhead significantly
- Men's and Women's matches are easily distinguished by the `competition.name` field already present in the table
- The `OlympicEvent → Match` type hierarchy is retained for clarity but the UI does not act on it

## Consequences

+ Simpler component tree — no sport prop threading through MatchTable / ExportButton
+ Fewer states in HomeClient — no `sport`, `availableSports`, derived filtered array
+ Export filename is deterministic (`paris-2024-football-endpoints.json`)
- Tool cannot be repurposed for other sports without re-adding a filter layer
