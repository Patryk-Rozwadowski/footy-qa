# FootyScores QA Tool

A front-end tool that helps QA engineers generate and review the expected API endpoint for every football match played during the Paris 2024 Olympic Games. The generated endpoints serve as reference fixtures for automated tests validating the FootyScores API.

## Quick start

```bash
npm install
npm run dev       # starts at http://localhost:3000
```

`npm run dev` automatically fetches the latest Olympic schedule and regenerates the seed data before starting the server. If the Olympic API is unreachable, the bundled seed data is used instead.

## Usage

1. Open `http://localhost:3000`
2. Click **Generate Endpoints** to load match data
3. Browse the match table — click the eye icon on any row to open the endpoint viewer
4. **Expected tab** — copy the generated JSON to use as a test fixture
5. **Compare with actual tab** — paste a FootyScores API response to diff it field-by-field against the expected endpoint
6. Click **Export JSON** to download all endpoints as a single JSON file

## Installation & running

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Local development

```bash
npm install
npm run dev
```

### Production build

```bash
npm install
npm run build
npm start
```

### Regenerate seed data manually

The seed file (`src/data/paris2024-seed.ts`) is committed to the repository as a fallback.
To refresh it from the live Olympic API:

```bash
npm run generate-seed
```

## Deployment

### Vercel (recommended)

1. Import the repository in the Vercel dashboard
2. No environment variables are required for basic operation
3. Deploy — Vercel runs `npm run build` automatically (which regenerates the seed)

### Manual deploy

Any platform that supports Node.js 18+ and `npm run build` / `npm start` will work.

## How data is retrieved and parsed

Match data is fetched from the official Paris 2024 Olympic schedule JSON API:

```
https://stacy.olympics.com/srm/data/oly/schedule/day/ENG/{date}.json
```

One file per day is fetched in parallel for the full football window (2024-07-24 → 2024-08-11).
A browser-like `User-Agent` header is required; no authentication is needed.

Each day's payload is filtered to `disciplineCode === "FBL"` and `scheduleItemType === "H2H_NOC"` to extract football head-to-head matches only. The raw units are then mapped to the endpoint shape defined in `example.json`.

If live fetching fails, the application falls back to the bundled `src/data/paris2024-seed.ts`. The UI displays a **Static data** label whenever seed data is in use.

Full details: [`docs/decisions/003-scraping-strategy.md`](docs/decisions/003-scraping-strategy.md)

## Endpoint ordering

Matches are sorted **ascending by kickoff date and time**. Matches with no kickoff time are placed at the end. The sort is deterministic — the same input always produces the same output in the same order.

## Assumptions

See [`docs/assumptions.md`](docs/assumptions.md) for the full list, including:

- fields unavailable in the source (lineups, scorers, half-time score) and their default values
- home / away convention for Olympic matches
- competition name, season, and round mapping
- known limitation: all completed matches report `status: "FT"` regardless of extra time or penalties

## Architecture decisions

Each significant decision is documented in [`docs/decisions/`](docs/decisions/):

| ADR | Decision |
|-----|----------|
| [001](docs/decisions/001-stack.md) | Next.js + TypeScript + Tailwind + Vercel |
| [002](docs/decisions/002-data-storage.md) | Client-side localStorage with seed fallback |
| [003](docs/decisions/003-scraping-strategy.md) | Direct JSON API fetch (not Playwright) |
| [004](docs/decisions/004-football-only-scope.md) | Football-only scope (no sport selector) |
