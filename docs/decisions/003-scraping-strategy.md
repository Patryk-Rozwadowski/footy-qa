# ADR-003: Scraping Strategy

## Context

`stacy.olympics.com/en/paris-2024/competition-schedule` is JavaScript-rendered —
a plain HTTP fetch returns empty HTML with no match data.
Scraping must happen server-side (not in the browser) to avoid CORS issues and bot detection.

## Decision

Scraping runs inside a **Next.js API route** (`/api/scrape`) using **Playwright** (headless Chromium).
The frontend calls this endpoint when the user clicks "Generate Endpoints".

```
Client (React) → POST /api/scrape → Playwright → stacy.olympics.com
                                         ↓
                              parse HTML → filter football matches
                                         ↓
                              JSON with matches ← response to client
```

## Football Match Identification

Since there is no dedicated Olympic API, football matches are identified by filtering on:
1. Sport name in the schedule (e.g. "Football", "Soccer")
2. Venue names (football stadiums: Parc des Princes, Stade de Lyon, etc.)

## Rationale

- Playwright handles JS-rendered pages, unlike fetch/axios
- Next.js API route removes the need for a separate server
- Server-side scraping bypasses CORS
- Playwright is the industry standard for browser automation and scraping

## Rejected Alternatives

| Option | Reason for rejection |
|---|---|
| fetch / axios (plain HTTP) | JS-rendered page — returns empty HTML |
| Client-side scraping | CORS blocks cross-origin requests from the browser |
| Official Olympic API | No public API exists for this schedule |
| Third-party sports APIs (api-football.com) | Do not include Olympic data or require a paid subscription |

## Consequences

+ Reliable data extraction from a JS-rendered page
+ Single endpoint handles the entire scraping pipeline
- Playwright adds ~100 MB to project dependencies
- Vercel cold start may take a few seconds (Playwright requires a Chromium binary)
