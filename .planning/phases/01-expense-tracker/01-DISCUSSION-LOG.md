# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 1-Foundation
**Areas discussed:** Repo structure

---

## Repo Structure

### Q1: Directory layout

| Option | Description | Selected |
|--------|-------------|----------|
| /backend + /frontend dirs | Clean separation — Laravel in /backend, React TypeScript in /frontend | ✓ |
| Frontend at root, backend in /backend | React app at repo root, Laravel in /backend subdir | |
| Separate repos | Two repos, one per service | |

**User's choice:** /backend + /frontend dirs
**Notes:** Standard monorepo layout. Existing JSX mockups in root excluded from this structure.

### Q2: Existing JSX mockup files

| Option | Description | Selected |
|--------|-------------|----------|
| Move to /ui-mockups | Keep as design reference, out of the way | ✓ |
| Delete them | No longer needed | |
| Leave in root | Keep alongside /frontend and /backend | |

**User's choice:** Move to /ui-mockups
**Notes:** JSX files (app.jsx, add-screen.jsx, stats-screen.jsx, etc.) preserved as design reference for UI phases.

### Q3: Vercel deploy scope

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel deploys /frontend only | React on Vercel, Laravel separate | ✓ |
| Vercel deploys both via PHP runtime | Laravel serverless on Vercel | |
| You decide | Let planner figure out Vercel config | |

**User's choice:** Vercel deploys /frontend only
**Notes:** Backend does not go to Vercel. Vercel project root = `/frontend`.

### Q4: Laravel hosting

| Option | Description | Selected |
|--------|-------------|----------|
| Railway | Free tier, PHP/Laravel support, GitHub integration | ✓ |
| Render | Similar to Railway | |
| Local/manual for now | Skip backend hosting in Phase 1 | |
| You decide | Let planner pick | |

**User's choice:** Railway
**Notes:** Railway explicitly chosen for backend. MySQL also on Railway or Railway-connected instance.

---

## Claude's Discretion

- React scaffold tooling (Vite vs CRA, React Router version, Axios vs fetch)
- Laravel setup method (Sail/Docker vs manual vs Breeze starter)
- Local dev MySQL setup (Docker vs MAMP/XAMPP)
- TypeScript strictness level

## Deferred Ideas

- Backend deploy specifics (Railway setup steps) — deferred to planner
- React toolchain details — deferred to researcher/planner
- Local dev environment setup — deferred to planner documentation
