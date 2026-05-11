# Phase 1: Foundation - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the full technical skeleton: Laravel PHP API scaffold in `/backend`, React TypeScript frontend scaffold in `/frontend`, MySQL database schema migrations (expenses + categories tables), JWT middleware wired but not yet routing auth endpoints, and both services reachable — frontend on Vercel, backend on Railway. Nothing functional for end users yet; everything compiles, connects, and deploys without errors.

</domain>

<decisions>
## Implementation Decisions

### Repo Structure
- **D-01:** Monorepo layout — Laravel backend in `/backend`, React TypeScript frontend in `/frontend`. Both live in `group5_fivestar` repo root alongside `.planning/`.
- **D-02:** Existing JSX mockup files (`app.jsx`, `add-screen.jsx`, `stats-screen.jsx`, `settings-screen.jsx`, `data.jsx`, `ui.jsx`, `ios-frame.jsx`, `tweaks-panel.jsx`) move to `/ui-mockups/` directory. Keep as design reference for future UI phases — do not delete.

### Deploy Architecture
- **D-03:** Vercel deploys `/frontend` only. The Vercel project root is set to `/frontend`.
- **D-04:** Laravel backend deploys to Railway (free tier). Railway connects to the same MySQL instance. Frontend calls the Railway URL as the API base URL (via env var `VITE_API_URL`).
- **D-05:** Backend is NOT deployed to Vercel. Vercel's PHP serverless runtime is not used.

### Claude's Discretion
- React scaffold tooling: Vite vs CRA, React Router version, Axios vs fetch — researcher/planner decides. Vite is the current standard for new React projects.
- Laravel setup method: Sail (Docker) vs manual install vs Breeze starter — planner decides based on team environment. Sail is recommended for consistency.
- Local dev MySQL setup: Docker vs MAMP/XAMPP — team decides independently; planner should document both options.
- TypeScript strictness level: planner decides; recommend `strict: true` as starting point.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — locked decisions: MySQL, JWT, API envelope `{success,data,message}`, full stack, key decisions log
- `.planning/REQUIREMENTS.md` — 19 v1 requirements with REQ-IDs; Phase 1 maps to foundational setup (no functional req IDs)
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 criteria), plan structure (3 plans: API scaffold, React scaffold, DB+deploy)

### API Spec
- `SPEC.md` — Full API design, data models (expenses/categories/budgets/recurring_expenses tables), edge cases, MoSCoW requirements. Use for DB schema reference in migrations.

### UI Design Reference
- `ui-mockups/` (after move from root) — JSX wireframe mockups showing intended screens: add-screen, stats-screen, settings-screen. Use for understanding UI intent in future phases; not relevant to Phase 1 scaffold.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app.jsx`, `add-screen.jsx`, `stats-screen.jsx`, `settings-screen.jsx`, `data.jsx` — UI mockups showing expense list layout, add form, charts. Moving to `/ui-mockups/`. Planner should note their existence as design reference for Phase 3+.
- `SPEC.md` §DB Schema — exact table + column definitions for migrations (expenses, categories, budgets, recurring_expenses).

### Established Patterns
- No existing application code — greenfield. First patterns established in this phase become the baseline.
- API response envelope already decided: `{success, data, message}` on success; `{success: false, message, errors: [{field, message}]}` on failure. Must be set up in Laravel's base response helper in Phase 1.

### Integration Points
- `/frontend` calls `/backend` API via `VITE_API_URL` environment variable — must be configured in Vercel env settings pointing to Railway URL.
- Railway → MySQL connection via `DATABASE_URL` env var in Laravel `.env`.

</code_context>

<specifics>
## Specific Ideas

- The JSX mockup files are a valuable design artifact — moving them to `/ui-mockups/` preserves them for UI-focused phases (Phase 3, 4, 5).
- Railway is the explicit choice for Laravel hosting (not Render, not manual) — free tier, GitHub integration.
- Vercel project root must be set to `/frontend` so Vercel doesn't try to deploy the repo root.

</specifics>

<deferred>
## Deferred Ideas

- Backend deploy target (Railway) and React scaffold tooling specifics were noted but not discussed in depth — intentionally left to planner/researcher discretion per user decision.

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-09*
