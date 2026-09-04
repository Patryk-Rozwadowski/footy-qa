# Data Assumptions

## Bonus: Accessibility

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

---


## Source

Single source: the official Paris 2024 Olympic schedule.
The page is JavaScript-rendered — scraping is handled server-side via Playwright.

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
| `competition.round` | Stage from schedule (e.g. `"Group Stage"`, `"Semi-final"`, `"Gold Medal Match"`) |

## Match Status

| Situation | `status` value |
|---|---|
| Match finished in regular time | `"FT"` |
| Match finished after extra time | `"AET"` |
| Match finished after penalties | `"AP"` |
| Match cancelled | `"CANC"` |

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
