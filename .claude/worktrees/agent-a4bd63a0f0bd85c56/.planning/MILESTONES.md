# Milestones

## v1.0 — MVP (Expense Tracker)

**Shipped:** 2026-05-11
**Phases:** 5 | **Plans:** 10 | **LOC:** ~5,532 (PHP + TS/TSX)
**Files changed:** 193 | **Timeline:** 2026-05-07 → 2026-05-11 (4 days)
**PR:** https://github.com/projectwebpp/group5_fivestar/pull/3

### Delivered

Full expense tracker — users can register, authenticate via JWT, manage categories, add/view/filter/edit/delete expenses with pagination, and view analytics with a Recharts pie chart and date-range filtering.

### Key Accomplishments

1. Laravel REST API scaffold with JWT auth, response envelope macro, and MySQL migrations
2. React TypeScript frontend with Vite, React Router, and typed API client
3. Full JWT auth flow (register/login/logout) with ProtectedRoute and token persistence
4. Category CRUD with referential guard blocking deletion of categories with active expenses
5. Expense CRUD with pagination, multi-field filtering (date/category/amount), add/edit/delete UI
6. Analytics API (DB aggregate query, user-scoped, averages, server-side percentages) + Recharts pie chart UI

### Known Deferred (acknowledged at close)
- Phase 03/04 VERIFICATION.md: `human_needed` runtime checks skipped (4 items — see STATE.md Deferred Items)

### Archive
- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
