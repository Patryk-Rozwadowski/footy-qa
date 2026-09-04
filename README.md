# FootyScores QA Tool

A QA tool for generating expected API responses for every football match played during the Paris 2024 Olympic Games. Generated endpoints serve as reference test fixtures for validating the FootyScores API.

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

The app is optimised for [Vercel](https://vercel.com). One-command deploy:

```bash
npx vercel
```

## Usage

1. Click **Generate Endpoints** — the app loads all football matches from the Olympic schedule.
2. Use the **sport selector** to switch between Men's and Women's Football.
3. Click the **eye icon** on any row to inspect the full JSON endpoint for that match.
4. Click **Export JSON** to download all endpoints for the selected sport as a `.json` file.
5. Click **Refresh** to force a re-fetch, discarding the cached data.

## Data Retrieval

Match data is sourced from the official Paris 2024 Olympic schedule JSON API:
`https://stacy.olympics.com/srm/data/oly/schedule/day/ENG/{date}.json`

The server-side API route (`/api/scrape`) fetches one JSON file per day covering the full Olympic football window (2024-07-24 → 2024-08-10), filters events by `disciplineCode === "FBL"`, and maps them to the endpoint format.

**Static fallback**
If the API is unreachable (network error or rate limiting), the app falls back to `src/data/paris2024-seed.ts` — a bundled dataset of Paris 2024 football matches. The UI displays a **"Static data"** badge when the fallback is active.

Scraped or loaded data is cached in `localStorage`. Subsequent page loads restore data from cache instantly without re-fetching.

## Endpoint Structure

Each generated endpoint matches the structure of `example.json` exactly:

```json
{
  "competition": { "name": "Paris 2024 Olympics", "season": "2024", "round": "Group Stage" },
  "venue": { "name": "Parc des Princes", "city": "Paris" },
  "kickoff": "2024-07-24T19:00:00+02:00",
  "status": "FT",
  "teams": { "home": "France", "away": "United States" },
  "score": { "home": 3, "away": 0, "halfTime": null },
  "scorers": [],
  "lineups": { "home": null, "away": null }
}
```

Internal fields used for filtering (`id`, `sport`, `discipline`) are stripped before export.

## Endpoint Ordering

Matches are sorted **ascending by `kickoff` date and time**. Matches with a missing kickoff are placed at the end. This ordering is deterministic: the same input always produces the same output in the same order.

## Assumptions

See [`docs/assumptions.md`](docs/assumptions.md) for full details. Key points:

- **Home / Away:** Olympic matches have no home team. The first team listed in the schedule is treated as `home`, the second as `away`.
- **Missing fields:** The Olympic schedule does not include lineups, scorers, or half-time scores. These are set to `null` / `[]`.
- **Match status:** All Paris 2024 matches are completed. Status values used: `FT` (full time), `AET` (after extra time), `AP` (after penalties).
- **Scope:** Only team sports sharing the match format (Football, Basketball, Volleyball, etc.) are supported. Individual sports (athletics, swimming) are out of scope.

## Architecture Decisions

Documented in [`docs/decisions/`](docs/decisions/):

| ADR | Decision |
|---|---|
| [001](docs/decisions/001-stack.md) | Next.js 14 + TypeScript + Tailwind + Vercel |
| [002](docs/decisions/002-data-storage.md) | localStorage cache, manual fetch trigger |
| [003](docs/decisions/003-scraping-strategy.md) | Playwright in Next.js API route |
| [004](docs/decisions/004-generic-architecture.md) | Sport-agnostic scraper, filter as separate layer |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # main UI
│   └── api/scrape/route.ts      # scraping endpoint
├── components/
│   ├── MatchTable.tsx           # match list
│   ├── EndpointViewer.tsx       # JSON preview dialog
│   ├── ExportButton.tsx         # JSON export
│   └── SportSelector.tsx        # sport filter
├── data/
│   └── paris2024-seed.ts        # static fallback data
├── lib/
│   ├── scraper.ts               # Playwright scraper
│   ├── mapper.ts                # filter + toEndpoint()
│   └── storage.ts               # localStorage helpers
└── types/
    └── match.ts                 # TypeScript types
```
