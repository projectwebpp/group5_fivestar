---
phase: 04
plan: 02
subsystem: frontend
tags: [react, typescript, expenses, list, filter, pagination, mvp-vertical-slice]
dependency_graph:
  requires: [04-01]
  provides: [expense-list-page, expense-api-client, expense-components]
  affects: [04-03]
tech_stack:
  added: []
  patterns:
    - Inline styles only (no CSS framework) — matches Phase 1/2 pattern
    - Apply-only filter bar (D-08) — no keystroke auto-apply
    - Cancellation token pattern (cancelled flag) in useEffect data fetch
    - Stub-first approach for future-plan pages (ExpenseDetailPage, ExpenseFormPage)
key_files:
  created:
    - frontend/src/types/expense.ts
    - frontend/src/api/expenses.ts
    - frontend/src/components/ExpenseCard.tsx
    - frontend/src/components/FilterBar.tsx
    - frontend/src/components/Pagination.tsx
    - frontend/src/components/EmptyState.tsx
    - frontend/src/pages/ExpenseDetailPage.tsx
    - frontend/src/pages/ExpenseFormPage.tsx
  modified:
    - frontend/src/pages/ExpensesPage.tsx
    - frontend/src/App.tsx
decisions:
  - "Used existing ProtectedRoute component from Phase 2 — implemented RequireAuth inline wrapper for App.tsx to match plan spec (both check localStorage auth_token)"
  - "Category display is 'Category #N' placeholder; Phase 3 CategoriesPage already ships but name-join requires a future enhancement or plan 04-03 wiring"
  - "npm install required in worktree — no node_modules present; installed 180 packages before tsc could run"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-10T12:30:00Z"
  tasks: 2
  files_created: 8
  files_modified: 2
---

# Phase 4 Plan 02: Expense List Frontend Summary

**One-liner:** Paginated filterable expense list page backed by the Phase 04-01 API, with four reusable components (ExpenseCard, FilterBar, Pagination, EmptyState), typed API client, and all four expense routes registered in App.tsx with auth guard.

## What Was Built

Full frontend vertical slice for expense list view (EXP-02, EXP-03):

1. **Expense types** (`frontend/src/types/expense.ts`) — `Expense`, `ExpenseListMeta`, `ExpenseListResponse`, `ExpenseFilters`, `ApiEnvelope<T>` interfaces. Strictly typed to match the 04-01 API response shape.

2. **Expense API client** (`frontend/src/api/expenses.ts`) — Five typed functions: `listExpenses` (with filter params), `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`. Params omitted when empty/null per D-08. All routed through the existing `apiClient` axios instance with Bearer interceptor.

3. **ExpenseCard** — Card component rendering ฿ amount (15px bold, ink), category placeholder (15px regular, muted), and date formatted as "DD MMM" (13px, muted). Click handler + `role="button"` + `tabIndex` for accessibility. Card border/shadow per UI-SPEC.

4. **FilterBar** — Collapsible panel controlled by `open` prop. Local `draft` state initialized from `filters`; Apply button fires `onApply(draft)` only on click (D-08 compliance). Fields: date_from, date_to, amount_min, amount_max, category select (static "All categories" option for v1 — Phase 3 categories page is separate).

5. **Pagination** — Three-element row: "← Prev" / "Page X of Y" / "Next →". Prev disabled at page 1, Next disabled at last page. Both buttons: 48px min-height (WCAG touch target), subBg fill per UI-SPEC.

6. **EmptyState** — Two copy variants per UI-SPEC: "No expenses yet" (unfiltered) and "No matching expenses" (filtered). "Add Expense" link styled with accent fill per UI-SPEC.

7. **ExpensesPage** (rebuilt) — Full implementation replacing the Phase 1 stub. Uses `useEffect` with cancellation flag to fetch `listExpenses(appliedFilters)`. Separate `filters` (draft) and `appliedFilters` (committed) states ensure Apply-only pattern. `isFiltered` computed from appliedFilters to drive EmptyState copy.

8. **App.tsx** — All four expense routes registered: `/expenses`, `/expenses/new`, `/expenses/:id`, `/expenses/:id/edit`. `RequireAuth` inline wrapper (checks `localStorage.getItem('auth_token')`, redirects to `/auth`). `/categories` and `/analytics` also wrapped.

9. **Stub pages** — `ExpenseDetailPage.tsx` and `ExpenseFormPage.tsx` created as minimal stubs ("implemented in plan 04-03") to satisfy TypeScript imports without blocking the build. Plan 04-03 replaces both.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `d802845` | Types, API client, and 4 reusable expense components |
| 2 | `1050c1d` | ExpensesPage rebuild + expense routes in App.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm install required in worktree**
- **Found during:** Task 1 verification
- **Issue:** The worktree had no `node_modules/` — `npx tsc --noEmit` failed with "not the tsc command you are looking for". The main repo also had no node_modules installed.
- **Fix:** Ran `npm install` inside the worktree frontend directory. Installed 180 packages (took ~60 seconds).
- **Files modified:** `frontend/node_modules/` (not committed — gitignored)
- **Commit:** N/A (devDependency install only)

**2. [Rule 2 - Adaptation] Used React.ReactElement for RequireAuth children type**
- **Found during:** Task 2
- **Issue:** The plan template used `JSX.Element` which requires `--jsx` compiler option. The project's tsconfig uses `React.ReactElement` pattern (as seen in `ProtectedRoute.tsx`).
- **Fix:** Used `React.ReactElement` import type for RequireAuth children prop to match the established pattern and avoid TypeScript errors.
- **Files modified:** `frontend/src/App.tsx`
- **Commit:** `1050c1d`

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `Category #${expense.category_id}` | `frontend/src/components/ExpenseCard.tsx` | 37 | Category name join requires passing name from parent or a category lookup; plan spec explicitly calls this out as a placeholder until Phase 3 wires names. The list page only has `category_id` from the expense, not the name. Plan 04-03 or a future enhancement should pass category names. |
| Detail page stub | `frontend/src/pages/ExpenseDetailPage.tsx` | 4 | Intentional — plan 04-03 replaces this file |
| Form page stub | `frontend/src/pages/ExpenseFormPage.tsx` | 4 | Intentional — plan 04-03 replaces this file |

## Threat Surface Scan

All threats from the plan's threat model are mitigated as implemented:

| Threat | Mitigation |
|--------|------------|
| T-04-09 (Spoofing — /expenses* routes) | `RequireAuth` guard redirects unauthenticated users to /auth; `apiClient` attaches Bearer on every request |
| T-04-10 (XSS via expense.description) | `description` field not rendered in list cards (only amount, category_id, date). React escapes all text nodes by default. No `dangerouslySetInnerHTML` used anywhere. |
| T-04-11 (Tampering filter inputs) | `type="number" step="0.01" min="0"` on amount fields; browser-side validation + backend revalidates |
| T-04-12 (DoS filter spam) | Apply-only pattern (D-08) — `onApply` fires only on button click, not on input change |
| T-04-13 (Token leak via URL) | Token in localStorage; never appended to URL parameters |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `frontend/src/types/expense.ts` | FOUND |
| `frontend/src/api/expenses.ts` | FOUND |
| `frontend/src/components/ExpenseCard.tsx` | FOUND |
| `frontend/src/components/FilterBar.tsx` | FOUND |
| `frontend/src/components/Pagination.tsx` | FOUND |
| `frontend/src/components/EmptyState.tsx` | FOUND |
| `frontend/src/pages/ExpensesPage.tsx` | FOUND (rebuilt) |
| `frontend/src/pages/ExpenseDetailPage.tsx` | FOUND (stub) |
| `frontend/src/pages/ExpenseFormPage.tsx` | FOUND (stub) |
| `frontend/src/App.tsx` | FOUND (updated) |
| commit d802845 | FOUND |
| commit 1050c1d | FOUND |
| `tsc --noEmit` | PASSES |
| `vite build` | PASSES |
