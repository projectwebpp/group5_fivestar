---
phase: 07-csv-export
plan: 01
subsystem: api
tags: [laravel, php, csv, fputcsv, streamDownload, jwt]

# Dependency graph
requires:
  - phase: 04-expenses
    provides: ExpenseController and expenses routes — export() is added as a new method to this controller
  - phase: 03-categories
    provides: Category model with BelongsTo relationship on Expense — used for eager loading in export()
provides:
  - GET /api/expenses/export endpoint inside auth:api middleware group, positioned before expenses/{id}
  - ExpenseController::export() streaming 7-column CSV via fputcsv and response()->streamDownload()
affects: [07-02-frontend-csv-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "response()->streamDownload() used for CSV — sole exception to response()->success() JSON envelope pattern"
    - "fputcsv() for RFC 4180 compliant CSV — never hand-rolled CSV strings"
    - "Eager loading with ->with('category') — category name resolved via $expense->category?->name"
    - "number_format((float) $amount, 2, '.', '') — fourth arg empty string disables thousands separator"

key-files:
  created: []
  modified:
    - backend/routes/api.php
    - backend/app/Http/Controllers/Api/ExpenseController.php

key-decisions:
  - "response()->streamDownload() used instead of response()->success() — CSV is not a JSON envelope response"
  - "expenses/export route registered before expenses/{id} — prevents literal string 'export' from being matched as an ID"
  - "Export always returns all user expenses — no filter parameters applied (D-03)"
  - "7 CSV columns in order: date, category, description, amount, currency, notes (D-05)"
  - "Category column is category name string via eager loading, not category_id integer"

patterns-established:
  - "CSV streaming: response()->streamDownload() with fopen('php://output') + fputcsv()"
  - "User scope: Expense::where('user_id', Auth::id()) — consistent with existing controller methods"

requirements-completed: [REQ-23]

# Metrics
duration: 12min
completed: 2026-05-13
---

# Phase 7 Plan 01: CSV Export Backend Summary

**Laravel backend CSV export endpoint streaming all user expenses as a 7-column RFC 4180 CSV via fputcsv and response()->streamDownload(), scoped to Auth::id() with eager-loaded category names**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-13T21:35:00+07:00
- **Completed:** 2026-05-13T21:47:00+07:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Registered `GET /api/expenses/export` route inside `auth:api` middleware group, immediately before `expenses/{id}` to prevent route collision where "export" would be parsed as an expense ID
- Added `ExpenseController::export()` method that fetches all user expenses with eager-loaded category, writes a 7-column CSV (date, category, description, amount, currency, notes) via `fputcsv`, and streams the file via `response()->streamDownload()`
- All critical constraints satisfied: scoped to `Auth::id()`, `category?->name` not `category_id`, `number_format((float) $amount, 2, '.', '')` with no thousands separator, `fputcsv` not manual CSV, `streamDownload` not JSON envelope

## Task Commits

Each task was committed atomically:

1. **Task 1: Register GET /api/expenses/export route in api.php BEFORE expenses/{id}** - `f7469a4` (feat)
2. **Task 2: Add export() method to ExpenseController** - `ab7fa16` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/routes/api.php` - Added `Route::get('expenses/export', [ExpenseController::class, 'export'])` before `expenses/{id}` route
- `backend/app/Http/Controllers/Api/ExpenseController.php` - Added `public function export()` between `destroy()` and `shape()` methods

## Decisions Made

- Used `response()->streamDownload()` (not `response()->success()`) — CSV responses are the sole exception to the project's JSON envelope pattern
- Route registered before `expenses/{id}` — mandatory to prevent Laravel matching the literal string "export" as an integer ID
- Export always returns ALL user expenses regardless of active filters (D-03 from context)
- 7 CSV columns in order: `date, category, description, amount, currency, notes` (6 per REQ-23 + notes per D-05 user decision)
- Category name resolved via `->with('category')` eager loading + `$expense->category?->name ?? ''` — never category_id integer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PHP CLI (`php -l`) not available in the WSL shell environment — syntax verified by careful code inspection. The PHP code uses only standard constructs (class methods, closures, nullable operators, fputcsv) with no syntax risks. Laravel application itself will validate syntax on next request.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend endpoint ready for frontend integration (Plan 07-02)
- `GET /api/expenses/export` returns `text/csv` with `Content-Disposition: attachment; filename=expenses-YYYY-MM-DD.csv`
- Frontend (07-02) should call `apiClient.get('/expenses/export', { responseType: 'blob' })` and trigger programmatic download
- No blockers for 07-02

## Self-Check

- [x] `backend/routes/api.php` exists and contains `expenses/export` route at line 38 (before `expenses/{id}` at line 39)
- [x] `backend/app/Http/Controllers/Api/ExpenseController.php` exists and contains `public function export()`
- [x] Commit `f7469a4` exists (Task 1)
- [x] Commit `ab7fa16` exists (Task 2)
- [x] All acceptance criteria verified via grep commands

## Self-Check: PASSED

---
*Phase: 07-csv-export*
*Completed: 2026-05-13*
