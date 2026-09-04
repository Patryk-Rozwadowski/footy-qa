# ADR-001: Technology Stack

## Context

The task requires a tool with a user interface (web app, Chrome extension, or CLI)
that fetches data, generates JSONs, and supports export. The tool targets QA engineers —
priority is ease of running and readable UI.

## Decision

**Next.js 16 (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.**

## Rationale

- **Next.js** provides a built-in frontend/backend split in one project — API route
  for scraping + React UI without a separate server
- **TypeScript** required for typing the match structure (conformance with example.json)
- **Tailwind CSS** — fast UI development with no configuration overhead
- **Vercel** — zero-config deployment, native Next.js integration

## Rejected Alternatives

| Option | Reason for rejection |
|---|---|
| Chrome Extension | Harder to deploy and share; no clean backend for scraping |
| CLI | Does not satisfy "UI clearly communicates loading, empty, error states" |
| Vite + Express | Two separate projects with more configuration and no benefit |

## Consequences

+ Single project, single `npm run dev`
+ One-command deployment
- Next.js may be overhead for a simple tool, but it simplifies the overall architecture
