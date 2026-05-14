---
phase: 08-recurring-expenses
plan: 03
subsystem: frontend-ui
tags: [typescript, react, recurring, ui, nav, routing]

# Dependency graph
requires:
  - phase: 08-recurring-expenses
    plan: 01
    provides: "/api/recurring CRUD endpoints"
  - phase: 08-recurring-expenses
    plan: 02
    provides: "RecurringExpense types + api/recurring.ts functions"

provides:
  - RecurringPage.tsx — full template management UI (create, inline edit, inline delete confirm)
  - /recurring route with RequireAuth in App.tsx
  - "Recurring" 4th nav link on ExpensesPage, AnalyticsPage, BudgetPage, RecurringPage

affects:
  - All 4 existing pages now have consistent 4-link nav

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline form toggle (showForm state) above table — mirrors BudgetPage.tsx pattern"
    - "Inline edit per row (editingId + editData state) — mirrors BudgetPage.tsx pattern"
    - "Inline delete confirm (deletingId state) — no modal, no alert"
    - "InlineError for both page-level and form-level errors"
    - "Empty state via inline div, NOT EmptyState component"

key-files:
  created:
    - frontend/src/pages/RecurringPage.tsx
  modified:
    - frontend/src/App.tsx
    - frontend/src/pages/ExpensesPage.tsx
    - frontend/src/pages/AnalyticsPage.tsx
    - frontend/src/pages/BudgetPage.tsx

key-decisions:
  - "RecurringPage mirrors BudgetPage structure exactly — inline form above table, inline edit, inline delete confirm"
  - "4-link nav (Expenses | Analytics | Budget | Recurring) on all 4 pages from D-11"
  - "Active Recurring link color: oklch(48% 0.10 195) — consistent with other active nav items"
  - "Empty state inline div with custom copy — NOT EmptyState component per PATTERNS.md"
  - "InlineError used for both page and form errors — BudgetPage used raw <p>, corrected here"

requirements-completed: [REQ-24]

# Metrics
duration: ~10min
completed: 2026-05-14
human-approved: 2026-05-14
---

# Phase 8 Plan 03: RecurringPage UI + App.tsx Wiring Summary

**Full recurring expense template management UI — inline form, inline edit, inline delete confirm, 4th nav link on all pages, /recurring route in App.tsx. Human browser test approved.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-05-14
- **Human approved:** 2026-05-14
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 4

## Accomplishments

- Created `frontend/src/pages/RecurringPage.tsx` — full template management page mirroring BudgetPage pattern
  - Collapsible "+ Add Recurring Expense" form above table (description, category, amount, currency, frequency, start_date)
  - 6-column table: Description | Category | Amount (฿) | Frequency | Next Due | Actions
  - Inline row edit (editingId state) — click Edit → fields editable inline → Save/Cancel
  - Inline delete confirm (deletingId state) — click Delete → "Delete? Yes / Cancel" inline → no modal
  - InlineError for page-level and form-level error display
  - Empty state: inline div "No recurring expenses yet…" — no EmptyState component
  - Active nav link "Recurring" with oklch(48% 0.10 195) color
- Added `import RecurringPage` + `<Route path="/recurring" element={<RequireAuth><RecurringPage /></RequireAuth>} />` to App.tsx
- Added "Recurring" 4th nav Link (to="/recurring", inactive color #7A7064) to ExpensesPage, AnalyticsPage, BudgetPage

## Task Commits

1. **Task 1: Nav + App.tsx wiring** — `400dda5` (feat) — ExpensesPage, AnalyticsPage, BudgetPage, App.tsx
2. **Task 2: RecurringPage.tsx** — `61153bc` (feat) — frontend/src/pages/RecurringPage.tsx

## Files Created

- `frontend/src/pages/RecurringPage.tsx` — complete template management UI (~280 lines)

## Files Modified

- `frontend/src/App.tsx` — added RecurringPage import + /recurring route
- `frontend/src/pages/ExpensesPage.tsx` — added 4th nav link
- `frontend/src/pages/AnalyticsPage.tsx` — added 4th nav link
- `frontend/src/pages/BudgetPage.tsx` — added 4th nav link

## Decisions Made

- **InlineError over raw `<p>` for errors:** BudgetPage uses raw `<p>` for error display; RecurringPage uses `<InlineError message={error} />` consistently for both page and form errors — better UX consistency.
- **Empty state inline div:** Per PATTERNS.md observation 3, existing pages use inline divs for empty state rather than the EmptyState component.
- **currency field in create form:** Included as optional input (default THB) matching CreateRecurringPayload shape; not shown in edit form per UpdateRecurringPayload omitting currency.

## Deviations from Plan

None — plan executed exactly as written. All 8 acceptance criteria in the checkpoint checklist verified by human browser test.

## Human Verification Results

All 9 checklist items passed:
1. ✅ /expenses, /analytics, /budget each show "Recurring" 4th nav link
2. ✅ Clicking "Recurring" navigates to /recurring
3. ✅ Logged-out user navigating to /recurring redirects to /auth
4. ✅ No templates: empty state message shown
5. ✅ Create template: row appears in table immediately
6. ✅ Inline edit: amount change saves and updates row
7. ✅ Delete Cancel: row stays
8. ✅ Delete Yes: row removed
9. ✅ Template with today's start_date: auto-created entry appears on /expenses

## Threat Surface Scan

No new trust boundaries beyond RequireAuth guard (consistent with all other protected routes). API calls go to existing /api/recurring endpoints from Plan 08-01. No new auth paths or file access.

## Self-Check: PASSED

- `frontend/src/pages/RecurringPage.tsx` exists, exports `RecurringPage` default
- InlineError imported and used (not raw `<p>`)
- EmptyState component NOT used (inline div)
- All 4 pages have `to="/recurring"` nav link
- App.tsx has `path="/recurring"` with RequireAuth
- Commits 61153bc and 400dda5 in git log
- TypeScript: 0 errors
- Human browser test: approved 2026-05-14

---
*Phase: 08-recurring-expenses*
*Completed: 2026-05-14*
