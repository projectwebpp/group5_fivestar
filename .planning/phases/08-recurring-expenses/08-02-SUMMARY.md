---
phase: 08-recurring-expenses
plan: 02
subsystem: frontend-types-api
tags: [typescript, react, api-client, recurring, types]

# Dependency graph
requires:
  - phase: 08-recurring-expenses
    plan: 01
    provides: "/api/recurring CRUD endpoints with shape() contract"

provides:
  - RecurringExpense TypeScript interface matching backend shape() output
  - CreateRecurringPayload interface for POST /api/recurring
  - UpdateRecurringPayload interface for PUT /api/recurring/{id}
  - listRecurring() — GET /recurring returning RecurringExpense[]
  - createRecurring(payload) — POST /recurring returning RecurringExpense
  - updateRecurring(id, payload) — PUT /recurring/${id} returning RecurringExpense
  - deleteRecurring(id) — DELETE /recurring/${id} returning void

affects:
  - 08-03 (RecurringPage.tsx — imports all 3 interfaces and 4 API functions from these files)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ApiEnvelope<T> unwrapping pattern: res.data.data for typed CRUD functions"
    - "Import chain: api/recurring.ts → client.ts (axios+JWT), ../types/expense (ApiEnvelope), ../types/recurring"
    - "Named exports only — no default export in types or api files"

key-files:
  created:
    - frontend/src/types/recurring.ts
    - frontend/src/api/recurring.ts
  modified: []

key-decisions:
  - "RecurringExpense.category_name typed as string | null — backend returns null when category deleted"
  - "RecurringExpense.currency typed as string (not literal 'THB') — backend allows other values per schema"
  - "UpdateRecurringPayload omits currency — backend shape() does not show currency as updateable in context D-08"
  - "Endpoint paths use '/recurring' (no /api prefix) — apiClient baseURL already includes /api"

requirements-completed: [REQ-24]

# Metrics
duration: 2min
completed: 2026-05-14
---

# Phase 8 Plan 02: Recurring Expenses Frontend Types & API Summary

**TypeScript type contracts and API client layer for recurring expenses — 3 interfaces and 4 typed async functions mirroring the budgets.ts/budget.ts pattern exactly**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-14T01:44:56Z
- **Completed:** 2026-05-14T01:46:38Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created `frontend/src/types/recurring.ts` with 3 exported interfaces: `RecurringExpense`, `CreateRecurringPayload`, `UpdateRecurringPayload`
- `RecurringExpense` fields match backend `shape()` output exactly: id, description, category_id, category_name, amount, currency, frequency, start_date, last_created_date, next_due, created_at, updated_at
- Created `frontend/src/api/recurring.ts` with 4 exported async functions mirroring `budgets.ts` pattern
- All 4 functions use `ApiEnvelope<T>` generic and unwrap `res.data.data` consistently
- TypeScript compilation exits 0 with zero errors (verified via `node node_modules/typescript/bin/tsc --noEmit`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Types** — `8988a06` (feat) — `frontend/src/types/recurring.ts`
2. **Task 2: API layer** — `f73fd56` (feat) — `frontend/src/api/recurring.ts`

## Files Created

- `frontend/src/types/recurring.ts` — 3 interfaces: RecurringExpense (12 fields), CreateRecurringPayload (6 fields), UpdateRecurringPayload (5 optional fields)
- `frontend/src/api/recurring.ts` — 4 async functions: listRecurring, createRecurring, updateRecurring, deleteRecurring

## Decisions Made

- **currency typed as string (not 'THB' literal):** The backend schema stores `VARCHAR(3)` and the context allows other currency values; using a broad type avoids future breakage if currency is ever used.
- **UpdateRecurringPayload omits currency field:** The plan spec lists only description, category_id, amount, frequency, start_date as updateable — consistent with D-08 scope (daily/weekly/monthly only, no currency editing).
- **category_name: string | null:** Backend join returns null when a category is deleted (defensive type matches shape() comment in 08-01-SUMMARY).

## Deviations from Plan

None — plan executed exactly as written. Both files created with matching structure to budget.ts/budgets.ts pattern.

## Known Stubs

None — these are pure type definition and API client files with no UI rendering.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. The api/recurring.ts functions call existing `/api/recurring` endpoints established in Plan 08-01. No new trust boundaries.

## Self-Check: PASSED

- `frontend/src/types/recurring.ts` exists and exports 3 interfaces
- `frontend/src/api/recurring.ts` exists and exports 4 async functions
- Commit `8988a06` verified in git log
- Commit `f73fd56` verified in git log
- TypeScript: 0 errors (node tsc --noEmit exits 0)

---
*Phase: 08-recurring-expenses*
*Completed: 2026-05-14*
