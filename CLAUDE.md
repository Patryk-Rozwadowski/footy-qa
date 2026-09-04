# FootyScores QA Tool

A QA tool for generating expected API responses for football matches
from the Paris 2024 Olympic Games. Used as reference test fixtures
to validate the FootyScores API.

## Task Context

FootyScores is a fictional application providing football data through an API.
This tool builds expected API responses from the official Olympic schedule —
which QA engineers can compare against what the API actually returns.

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Scraping:** Next.js API route with Playwright (JS-rendered page)
- **Cache:** client-side localStorage
- **Deployment:** Vercel

## Data Source

Single source of truth: `https://stacy.olympics.com/en/paris-2024/competition-schedule`

Data is historical (Paris 2024 is over) and will never change.

## Output Format

Each football match is generated as a JSON object matching the structure from `example.json`.
Fields unavailable in the source (lineups, scorers) are set to `null` / `[]`.
Details: `docs/assumptions.md`

## Key Architectural Decisions

- Scraper fetches ALL Olympic sports and returns `OlympicEvent[]` — sport filtering is a separate layer
- Football is the default filter; the UI sport selector switches filters without re-fetching
- Scraping is triggered once by the user (UI button), results stored in localStorage
- Data is never fetched automatically on page refresh
- Each decision documented in `docs/decisions/`

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server (localhost:3000)
npm run build     # production build
npm run lint      # linting
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # main view
│   └── api/
│       └── scrape/route.ts   # API route that scrapes the Olympic schedule
├── components/
│   ├── MatchTable.tsx        # match list table
│   ├── EndpointViewer.tsx    # JSON preview for a selected match
│   └── ExportButton.tsx      # export to JSON file
├── lib/
│   ├── scraper.ts            # scraping logic
│   ├── mapper.ts             # maps raw data → example.json format
│   └── storage.ts            # localStorage helpers
└── types/
    └── match.ts              # TypeScript types
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
