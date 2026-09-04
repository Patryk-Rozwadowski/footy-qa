# FootyScores QA Tool

A QA tool for generating expected API responses for football matches
from the Paris 2024 Olympic Games. Used as reference test fixtures
to validate the FootyScores API.

## Task Context

FootyScores is a fictional application providing football data through an API.
This tool builds expected API responses from the official Olympic schedule —
which QA engineers can compare against what the API actually returns.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Data fetching:** Next.js API route with `fetch` to the official Olympics JSON API
- **Cache:** client-side localStorage
- **Deployment:** Vercel

## Data Source

Single source of truth:
`https://stacy.olympics.com/srm/data/oly/schedule/day/ENG/{date}.json`

One JSON file per day, fetched in parallel for the full football window (2024-07-24 → 2024-08-11).
Requires a browser-like `User-Agent` header — no authentication needed.
Data is historical (Paris 2024 is over) and will never change.

## Output Format

Each football match is generated as a JSON object matching the structure from `example.json`.
Fields unavailable in the source (lineups, scorers) are set to `null` / `[]`.
Details: `docs/assumptions.md`

## Key Architectural Decisions

- API fetcher filters for `disciplineCode === 'FBL'` at the source — returns football matches only
- Fetching is triggered once by the user (UI button), results stored in localStorage
- Data is never fetched automatically on page refresh
- If live fetch fails, the API route falls back to `src/data/paris2024-seed.ts` (static snapshot); the UI labels seed data clearly
- `EndpointViewer` has a **Compare with actual** tab — QA engineer pastes a FootyScores API response, tool diffs it field-by-field against the expected endpoint
- Each decision documented in `docs/decisions/`

## Commands

```bash
npm install            # install dependencies
npm run dev            # dev server (localhost:3000)
npm run build          # production build
npm run lint           # linting
npm run generate-seed  # re-fetch Olympic data and overwrite src/data/paris2024-seed.ts
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # entry point — renders DynamicHome
│   ├── layout.tsx            # root layout (Sonner toaster, fonts)
│   ├── globals.css           # global Tailwind base styles
│   └── api/
│       └── scrape/route.ts   # API route: live fetch → seed fallback
├── components/
│   ├── DynamicHome.tsx       # ssr=false wrapper to avoid hydration issues
│   ├── HomeClient.tsx        # main client component (state, layout, actions)
│   ├── MatchTable.tsx        # match list table
│   ├── EndpointViewer.tsx    # expected JSON + Compare with actual tab
│   ├── ExportButton.tsx      # export to JSON file
│   └── ui/                   # shadcn/ui primitives (button, badge, dialog, etc.)
├── data/
│   └── paris2024-seed.ts     # static snapshot of all Paris 2024 football matches
├── lib/
│   ├── scraper.ts            # Olympic JSON API fetch + field mapping functions
│   ├── mapper.ts             # sort, endpoint shape (toEndpoint)
│   ├── storage.ts            # localStorage helpers
│   └── utils.ts              # Tailwind class merge utility (cn)
└── types/
    └── match.ts              # TypeScript types (OlympicEvent, Match, MatchEndpoint…)
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
