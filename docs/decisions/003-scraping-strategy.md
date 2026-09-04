# ADR-003: Data Retrieval Strategy

## Context

`stacy.olympics.com` provides the official Paris 2024 competition schedule.
The public-facing page (`/en/paris-2024/schedule/football`) is JavaScript-rendered
and protected by Akamai WAF, blocking both plain HTTP fetch and headless browsers (Playwright).

By inspecting the browser's Network tab it was discovered that the page loads its data
from a set of static JSON files — one per day:

```
https://stacy.olympics.com/srm/data/oly/schedule/day/ENG/{date}.json
```

These files are publicly accessible with a standard browser `User-Agent` header.
No authentication or session cookies are required.

## Decision

Replace Playwright-based HTML scraping with direct **fetch calls** to the per-day JSON API.
The server-side API route (`/api/scrape`) fetches one file per day for the full football
window (2024-07-24 → 2024-08-11), all in parallel, then filters and maps the results.

```
Client (React) → GET /api/scrape → fetch {date}.json × 19 days (parallel)
                                         ↓
                              filter disciplineCode=FBL + scheduleItemType=H2H_NOC
                                         ↓
                              map OlympicUnit → Match → JSON response to client
```

## Football Match Identification

Each unit in the JSON has:
- `disciplineCode: "FBL"` — identifies football events
- `scheduleItemType: "H2H_NOC"` — identifies head-to-head team matches (excludes training sessions, ceremonies)

## Rationale

- No headless browser or binary dependencies — `fetch` is built into Node.js
- Parallel requests complete in under 2 seconds on average
- Works in serverless environments (Vercel) without size constraints
- Data comes directly from the official Olympic source in a structured format

## Rejected Alternatives

| Option | Reason for rejection |
|---|---|
| Playwright / headless browser | Blocked by Akamai WAF; adds ~100 MB dependency |
| Client-side fetch to Olympics API | CORS blocks cross-origin requests from the browser |
| Third-party sports APIs | Do not include Olympic data or require paid subscription |

## Consequences

+ No external browser dependencies — `npm install` is all that's needed
+ Structured JSON is easier to parse reliably than scraped HTML
+ Works in Vercel serverless without Chromium binary size issues
- Relies on an undocumented internal API; URL structure could change
- Static fallback (`paris2024-seed.ts`) is retained for resilience
