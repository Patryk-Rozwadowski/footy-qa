# Data Assumptions

## Bonus features implemented

### Accessibility

The UI targets QA engineers who may rely on keyboard navigation or screen readers.
The following accessibility standards are applied as a bonus:

- All interactive elements are reachable by keyboard (Tab / Enter / Space)
- Match table supports arrow key navigation between rows
- JSON viewer panel is announced by screen readers (`role="region"`, `aria-label`)
- Loading, empty, and error states use `aria-live="polite"` for screen reader announcements
- Color is never the sole indicator of state (status badges include text labels)
- Contrast ratio meets WCAG 2.1 AA (minimum 4.5:1 for normal text)

Component library choice (shadcn/ui) is driven partly by this requirement —
it is built on Radix UI primitives which are WAI-ARIA compliant out of the box.

### JSON comparison with the tested API

The `EndpointViewer` (opened by clicking any match row) has a **Compare with actual** tab.
A QA engineer pastes the raw FootyScores API response for that match into the text area;
the tool diffs it field-by-field against the generated expected endpoint and highlights
every mismatch with the expected and actual values side by side.

FootyScores is a fictional application — no live API URL is available to automate the fetch.
The comparison is therefore user-driven: the engineer fetches the response manually and pastes it in.

A **mock FootyScores API** is provided at `/api/mock-footy-scores/[matchId]` to demonstrate
the comparison feature end-to-end without a real external API. The **Fetch from mock API**
button in the Compare tab populates the textarea automatically.

The mock returns the correct match structure with three intentional discrepancies that
simulate common API convention mismatches:

| Field | Expected | Mock returns | Simulated issue |
|---|---|---|---|
| `status` | `"FT"` | `"FINISHED"` | API uses different status string |
| `competition.season` | `"2024"` | `"2024/25"` | API uses different season format |
| `score.halfTime` | `null` | `{"home":0,"away":0}` | API always returns HT score |

---

## Source

Single source: the official Paris 2024 Olympic schedule.

Data is fetched directly from static per-day JSON endpoints:

```
https://stacy.olympics.com/srm/data/oly/schedule/day/ENG/{date}.json
```

A browser-like `User-Agent` header is required; no authentication is needed.
One file per day is fetched in parallel for the full football window (2024-07-24 → 2024-08-11).
See ADR-003 for the full rationale and rejected alternatives.

If live fetching fails (network error, API change), the application falls back to
`src/data/paris2024-seed.ts` — a static snapshot of all Paris 2024 football matches
embedded in the bundle. The UI clearly labels when seed data is in use ("Static data" label).

To regenerate the seed file from the live API:

```bash
npm run generate-seed
```

This runs `scripts/generate-seed.ts`, which fetches the full schedule and overwrites `src/data/paris2024-seed.ts`.

## Fields Unavailable in the Source

The Olympic schedule does not include match details such as
lineups, player numbers, formations, scorers, or assists.

| Field from example.json | Value in our data | Reason |
|---|---|---|
| `scorers` | `[]` | Not available in schedule |
| `lineups.home` | `null` | Not available in schedule |
| `lineups.away` | `null` | Not available in schedule |
| `score.halfTime` | `null` | Not available in schedule |

## Home / Away Convention

The Olympic Games have no concept of a home team.
Convention: first team listed in the schedule = `home`, second = `away`.

## Competition Structure

Olympic football does not follow traditional league/round structure.

| Field | Value |
|---|---|
| `competition.name` | `"Paris 2024 Olympics"` |
| `competition.season` | `"2024"` |
| `competition.round` | Stage from schedule — one of: `"Group Stage"`, `"Quarter-final"`, `"Semi-final"`, `"Bronze Medal Match"`, `"Gold Medal Match"` |

**Note on Bronze Medal Match:** The Olympic schedule API uses `phaseName: "Final"` for
the 3rd-place match (same as the gold medal final). `mapRound` resolves this by checking
`eventUnitName` as a fallback — if it contains "bronze", the round is correctly set to
`"Bronze Medal Match"`.

## Match Status

| Situation | `status` value |
|---|---|
| Match finished in regular time | `"FT"` |
| Match finished after extra time | `"AET"` |
| Match finished after penalties | `"AP"` |
| Match cancelled | `"CANC"` |
| Match in progress (live) | `"LIVE"` |
| Match not yet started / unknown | `"TBD"` |

**Limitation:** The official schedule API returns `"FINISHED"` for every completed match regardless
of how it ended (regular time, extra time, or penalties). Distinguishing `FT` / `AET` / `AP`
would require fetching the individual match detail page for each knockout match.
For Paris 2024, all group stage matches ended in regular time. Knockout matches that went
to extra time or penalties are currently reported as `"FT"` — this is a known gap.

## Output Ordering

Default order: **ascending by `kickoff`** (date and time).
Output is deterministic — the same input always produces the same output in the same order.

## Handling Inconsistent Data

If a match is missing a kickoff time, it is placed at the end of the list with `kickoff: null`.
If a team name is missing (e.g. `"TBD"`), the value is kept as-is without transformation.
