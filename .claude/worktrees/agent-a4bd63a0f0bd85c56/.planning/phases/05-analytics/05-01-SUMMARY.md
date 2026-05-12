---
phase: 05-analytics
plan: 01
subsystem: backend
tags: [analytics, laravel, mysql, aggregate-query, jwt-auth]
dependency_graph:
  requires:
    - 04-expense-management (expenses + categories tables, auth:api middleware group)
    - 02-authentication (JWT auth:api guard)
    - 03-categories (categories table with id + name)
  provides:
    - GET api/analytics/summary endpoint
    - AnalyticsController with summary() aggregate method
  affects:
    - backend/routes/api.php (added route + use statement)
tech_stack:
  added: []
  patterns:
    - DB::table() aggregate query with JOIN + GROUP BY (multi-table, no Eloquent loading)
    - Carbon date arithmetic for daily/monthly average calculations
    - response()->success() macro (existing project pattern)
    - $total > 0 division guard for zero-expense edge case
key_files:
  created:
    - backend/app/Http/Controllers/Api/AnalyticsController.php
  modified:
    - backend/routes/api.php
decisions:
  - D-08: Single endpoint GET /api/analytics/summary with date_from/date_to query params
  - D-09: Response shape: total, daily_avg, monthly_avg, category_breakdown with pre-computed percentages
  - D-10: percentage pre-computed server-side (each category_total / grand_total * 100, rounded 2dp)
  - D-11: Trend = filtered snapshot of same endpoint (no time-series)
metrics:
  duration: "~8 minutes"
  completed: "2026-05-11T11:30:34Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 5 Plan 01: Analytics API Endpoint Summary

**One-liner:** Laravel aggregate controller (`DB::table()` JOIN + GROUP BY) returning expense totals, daily/monthly averages, and per-category breakdowns with server-side percentage pre-computation, protected by existing `auth:api` JWT middleware.

## What Was Built

A single `GET /api/analytics/summary` endpoint that aggregates authenticated user's expense data across an optional date range, returning the full analytics payload required by REP-01 through REP-04.

### AnalyticsController (`backend/app/Http/Controllers/Api/AnalyticsController.php`)

New controller in `App\Http\Controllers\Api` namespace with a single `summary()` method:

- **Validation:** `date_from` / `date_to` validated as `date_format:Y-m-d` with `after_or_equal` constraint. Returns 422 on invalid format.
- **User scoping:** `$userId = Auth::id()` → `->where('expenses.user_id', $userId)` on every query path (T-05-01 mitigation).
- **Aggregate query:** `DB::table('expenses')->join('categories', ...)->select(categories.id, categories.name, SUM(expenses.amount))` — uses raw SQL aggregate, not Eloquent, to keep the query pushed to MySQL.
- **Correct column:** `expenses.expense_date` (the actual DB column) not `expenses.date` (which is only in API response shapes via `ExpenseController::shape()`).
- **GROUP BY:** Both `categories.id` AND `categories.name` to satisfy MySQL `ONLY_FULL_GROUP_BY` mode (Pitfall 5 from RESEARCH.md).
- **Division guard:** `$total > 0` before percentage calculation prevents 0/0 arithmetic.
- **Averages:** `daily_avg = total / days_in_range`; `monthly_avg = total / distinct_months_spanned`; both default to 1 when no date range provided.
- **Response:** `response()->success()` macro with all required keys.

### Route Registration (`backend/routes/api.php`)

Two changes:
1. `use App\Http\Controllers\Api\AnalyticsController;` added to use-statement block
2. `Route::get('analytics/summary', [AnalyticsController::class, 'summary'])` added inside the existing `Route::middleware('auth:api')->group()` block (T-05-02 mitigation — unauthenticated requests return 401)

## Requirements Satisfied

| ID | Description | How Satisfied |
|----|-------------|---------------|
| REP-01 | Monthly total expense summary (total + by category) | `total` + `category_breakdown` in response |
| REP-02 | Expense breakdown by category (pie chart data) | `category_breakdown: [{name, total, percentage}]` array |
| REP-03 | Filter by custom date range for trend view | `date_from`/`date_to` query params filter the DB query |
| REP-04 | Daily and monthly average expense calculations | `daily_avg` and `monthly_avg` in response |

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create AnalyticsController | 3bd56e8 | backend/app/Http/Controllers/Api/AnalyticsController.php (created) |
| 2 | Register analytics route | c602220 | backend/routes/api.php (modified) |

## Threat Model Compliance

All five threats from the plan's `<threat_model>` are mitigated:

| ID | Threat | Mitigation Applied |
|----|--------|--------------------|
| T-05-01 | Cross-user data leakage | `->where('expenses.user_id', Auth::id())` on all query paths |
| T-05-02 | Unauthenticated access | Route inside `Route::middleware('auth:api')` group — 401 on missing token |
| T-05-03 | Invalid date param injection | `$request->validate(['date_from' => ['sometimes', 'date_format:Y-m-d'], ...])` — 422 returned |
| T-05-04 | Division by zero (zero total) | `$total > 0` guard before `$r->category_total / $total` |
| T-05-05 | SQL injection via date params | Laravel query builder PDO binding; `DB::raw()` only used for `SUM(expenses.amount)` with no user input |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Acceptance Criteria Note

The plan's grep check `"expenses.user_id.*Auth::id\|Auth::id.*expenses.user_id"` expected both identifiers on the same line. The implementation follows the two-line pattern used by ExpenseController: `$userId = Auth::id()` then `->where('expenses.user_id', $userId)`. The security control is equivalent — `$userId` is derived solely from `Auth::id()` and used immediately in the WHERE clause. All 8 other criteria passed.

## Known Stubs

None. All fields in the response are computed from real DB data.

## Threat Flags

None. The new `GET api/analytics/summary` endpoint is fully documented in the plan's `<threat_model>` section (T-05-01 through T-05-05). No additional unplanned network surface was introduced.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `backend/app/Http/Controllers/Api/AnalyticsController.php` exists | FOUND |
| `backend/routes/api.php` exists | FOUND |
| `.planning/phases/05-analytics/05-01-SUMMARY.md` exists | FOUND |
| Commit 3bd56e8 (AnalyticsController) exists | FOUND |
| Commit c602220 (route registration) exists | FOUND |
