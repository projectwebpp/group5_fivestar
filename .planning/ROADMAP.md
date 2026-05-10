# Roadmap: Expense Tracker (group5_fivestar)

## Overview

Five phases that take the project from an empty repository to a fully working expense tracker with analytics. Phase 1 lays the technical foundation (Laravel API scaffold, React TypeScript scaffold, MySQL, JWT config, Vercel deploy pipeline). Phases 2-3 unlock the app for real users (auth, categories). Phase 4 delivers the core product value (log, view, edit, filter, delete expenses). Phase 5 completes the v1 product with analytics and reports. Every phase delivers a working, verifiable capability before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Laravel + React scaffolds, MySQL schema, JWT config, Vercel deploy pipeline wired up
- [ ] **Phase 2: Authentication** - Users can register, log in, log out; all protected routes require valid JWT
- [ ] **Phase 3: Categories** - Users can view predefined categories and manage custom ones
- [ ] **Phase 4: Expense Management** - Users can add, view, filter, edit, and delete expenses end-to-end
- [ ] **Phase 5: Analytics & Reports** - Users can see monthly summaries, category breakdowns, and averages

## Phase Details

### Phase 1: Foundation
**Goal**: The full technical skeleton exists — Laravel API, React TypeScript frontend, MySQL database, JWT configuration, and Vercel deploy pipeline — with nothing broken and the app reachable at a real URL.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: (No v1 functional requirements — foundational technical setup enabling all subsequent phases)
**Success Criteria** (what must be TRUE):
  1. Laravel API returns a health-check response at the deployed URL
  2. React TypeScript app loads in a browser at the Vercel-deployed URL with no console errors
  3. MySQL database is connected and all v1 schema migrations run cleanly (expenses, categories tables)
  4. JWT secret is configured and the auth middleware stack is wired (even before auth routes exist)
  5. A `git push` to main triggers a successful Vercel deployment automatically
**Plans**: 3 (Wave 1: 01-01 Laravel scaffold, 01-02 React scaffold | Wave 2: 01-03 DB migrations + deploy)

Plans:
- [x] 01-01: Laravel API scaffold (routes, middleware, DB connection, JWT config, response envelope)
- [x] 01-02: React TypeScript frontend scaffold (Vite/CRA, TypeScript config, API client, routing skeleton)
- [x] 01-03: Database schema migrations and Vercel deploy pipeline
**UI hint**: yes

### Phase 2: Authentication
**Goal**: Users can create accounts, log in, and log out; every protected API endpoint rejects requests without a valid JWT.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can register with email and password and receives a success response
  2. User can log in with valid credentials and receives a JWT token
  3. User can log out and the token is invalidated (subsequent requests with that token are rejected)
  4. Any request to an expense, category, or report endpoint without a valid JWT returns 401
  5. User stays logged in across browser sessions (token persisted client-side)
**Plans**: TBD

Plans:
- [ ] 02-01: Auth API endpoints (register, login, logout) with JWT issuance and invalidation
- [ ] 02-02: Auth UI (register form, login form, logout action, JWT storage and routing guards)
**UI hint**: yes

### Phase 3: Categories
**Goal**: Users can browse the predefined expense categories and create, edit, and delete their own custom categories before logging any expenses.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05
**Success Criteria** (what must be TRUE):
  1. User sees a list of predefined default categories immediately after logging in
  2. User can create a custom category with a name, icon, and color, and it appears in the list
  3. User can edit an existing category's name, icon, or color
  4. User can delete a category that has no expenses referencing it; deletion is blocked with an error message if active expenses exist
  5. User can view all categories (predefined and custom) via a single list endpoint and UI screen
**Plans**: TBD

Plans:
- [ ] 03-01: Category API endpoints (list, create, update, delete with referential guard)
- [ ] 03-02: Categories UI (category list screen, create/edit form, delete with guard feedback)
**UI hint**: yes

### Phase 4: Expense Management
**Goal**: Users can log new expenses, view their full expense list with pagination and filters, inspect a single expense, edit it, and delete it — the core product value delivered end-to-end.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, EXP-06
**Success Criteria** (what must be TRUE):
  1. User can add an expense with amount, currency, category, description, and date; it appears immediately in the expense list
  2. User can view all expenses paginated (page and limit controls work); list shows category and date for each entry
  3. User can filter the expense list by date range, category, and amount range and see only matching results
  4. User can tap an expense to view its full detail
  5. User can edit an expense (both full replacement and partial update) and see the updated values
  6. User can delete an expense and it is removed from the list
**Plans**: 3 (Wave 1: 04-01 backend API | Wave 2: 04-02 list UI | Wave 3: 04-03 form + detail + delete)

Plans:
- [ ] 04-01-PLAN.md — Expense API: migration patch (user_id), Eloquent model, JWT-protected REST controller (CRUD + filter + pagination), feature tests
- [ ] 04-02-PLAN.md — Expense list UI: typed API client, ExpenseCard/FilterBar/Pagination/EmptyState, ExpensesPage rebuild, route registration
- [ ] 04-03-PLAN.md — Form + detail + delete UI: shared add/edit form (D-09), detail page with inline-confirm delete (D-11), InlineError + LoadingButton
**UI hint**: yes

### Phase 5: Analytics & Reports
**Goal**: Users can see their financial picture — monthly totals by category, a visual pie chart breakdown, date-range trend filtering, and daily/monthly averages — completing the v1 product.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: REP-01, REP-02, REP-03, REP-04
**Success Criteria** (what must be TRUE):
  1. User can view the current month's total expenses and a per-category breakdown in a summary screen
  2. User can see a pie chart that accurately reflects spending proportions by category
  3. User can select a custom date range and see expense trends for that period
  4. User can see their daily average and monthly average expense amounts on the summary screen
**Plans**: TBD

Plans:
- [ ] 05-01: Analytics API endpoints (monthly summary, category breakdown, date-range trends, averages)
- [ ] 05-02: Analytics UI (summary screen with pie chart, date-range filter, averages display)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-05-09 |
| 2. Authentication | 0/2 | Not started | - |
| 3. Categories | 0/2 | Not started | - |
| 4. Expense Management | 0/3 | Not started | - |
| 5. Analytics & Reports | 0/2 | Not started | - |
