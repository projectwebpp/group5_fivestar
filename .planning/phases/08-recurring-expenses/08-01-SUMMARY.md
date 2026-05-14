---
phase: 08-recurring-expenses
plan: 01
subsystem: api
tags: [laravel, php, mysql, jwt, recurring, eloquent, phpunit]

# Dependency graph
requires:
  - phase: 07-csv-export
    provides: ExpenseController.php with export() method and routes/api.php budget block
  - phase: 06-budget-management
    provides: BudgetController pattern (ownership check, response macros, DB::table category validation)

provides:
  - recurring_expenses table migration (id, user_id, category_id, description, amount, currency, frequency enum, start_date, last_created_date nullable, timestamps)
  - RecurringExpense Eloquent model with fillable, casts, user() and category() relations
  - Expense model amended: is_recurring and recurring_id in fillable and casts
  - RecurringExpenseController with index, store, update, destroy, shape() methods
  - processRecurring(int $userId): void private method on ExpenseController
  - 4 recurring routes inside auth:api middleware group
  - RecurringExpenseTest.php with 11 passing PHPUnit feature tests

affects:
  - 08-02 (frontend RecurringPage — depends on /api/recurring CRUD contract)
  - 08-03 (frontend App.tsx route and nav — depends on plan 01 backend being complete)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "processRecurring() called at top of ExpenseController::index() inside try/catch — on-request auto-creation (D-01)"
    - "last_created_date deduplication: set to nextDue not today to preserve recurrence anchoring (D-02)"
    - "D-03: at most 1 entry per template per call — no backfill after long absence"
    - "actingAs($user, 'api') for cross-user ownership tests (workaround for JWT guard caching)"

key-files:
  created:
    - backend/database/migrations/2026_05_13_000001_create_recurring_expenses_table.php
    - backend/app/Models/RecurringExpense.php
    - backend/app/Http/Controllers/Api/RecurringExpenseController.php
    - backend/tests/Feature/RecurringExpenseTest.php
  modified:
    - backend/app/Models/Expense.php
    - backend/app/Http/Controllers/Api/ExpenseController.php
    - backend/routes/api.php

key-decisions:
  - "processRecurring() on ExpenseController (not standalone service) — no infrastructure needed, works on Vercel Hobby"
  - "last_created_date set to nextDue->toDateString() NOT Carbon::today() — preserves recurrence anchoring (D-02/Pitfall 1)"
  - "Try/catch around processRecurring() call in index() — broken template never causes 500 on GET /expenses (T-08-07)"
  - "actingAs($user, 'api') in ownership test — withToken() with two users causes JWT guard caching in SQLite test env"
  - "category_id validation in store() uses DB::table exists check (not just exists:categories,id) for ownership (T-08-02)"
  - "recurring_expenses table uses restrictOnDelete on category_id — prevents accidental category deletion when templates exist"

patterns-established:
  - "RecurringExpenseController shape() pattern: compute next_due from last_created_date|start_date + frequency match"
  - "Ownership guard: Model::where('id', $id)->where('user_id', Auth::id())->first() returning 404 if null"

requirements-completed: [REQ-24]

# Metrics
duration: 35min
completed: 2026-05-14
---

# Phase 8 Plan 01: Recurring Expenses Backend Summary

**Full recurring expenses backend: migration, RecurringExpense model, CRUD controller, on-request auto-creation via processRecurring(), 4 routes, and 11 passing PHPUnit tests**

## Performance

- **Duration:** 35 min
- **Started:** 2026-05-14T01:28:00Z
- **Completed:** 2026-05-14T02:03:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created recurring_expenses table with proper FK constraints (cascadeOnDelete on user_id, restrictOnDelete on category_id)
- RecurringExpense model and Expense model amendment (is_recurring/recurring_id in fillable+casts) enabling mass assignment
- RecurringExpenseController with full CRUD, shape() computing next_due, ownership guards on all mutating operations
- processRecurring() auto-creates exactly 1 due entry per overdue template on every GET /api/expenses — wrapped in try/catch ensuring it never propagates as a 500
- All 11 RecurringExpenseTest tests pass; full suite maintains same 6 pre-existing failures (zero new regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Test stubs** - `2fe18b6` (test)
2. **Task 2: Migration + Models** - `79d17bc` (feat)
3. **Task 3: Controller + processRecurring + routes + implement tests** - `8360faa` (feat)

## Files Created/Modified
- `backend/database/migrations/2026_05_13_000001_create_recurring_expenses_table.php` - recurring_expenses schema with FK constraints and composite index
- `backend/app/Models/RecurringExpense.php` - Eloquent model with fillable, casts, user() and category() BelongsTo
- `backend/app/Models/Expense.php` - Added is_recurring (boolean) and recurring_id (integer) to fillable and casts
- `backend/app/Http/Controllers/Api/RecurringExpenseController.php` - CRUD with shape(), ownership checks, category ownership validation
- `backend/app/Http/Controllers/Api/ExpenseController.php` - Added imports, processRecurring() call in index(), processRecurring() private method
- `backend/routes/api.php` - Added RecurringExpenseController import and 4 routes in auth:api group
- `backend/tests/Feature/RecurringExpenseTest.php` - 11 PHPUnit feature tests covering all REQ-24 behaviors

## Decisions Made
- **processRecurring() on ExpenseController vs standalone service:** Implemented as private method on ExpenseController (D-01). No infrastructure needed; Vercel Hobby compatible.
- **last_created_date = nextDue not today:** Preserves recurrence anchoring as specified in D-02/Pitfall 1 in RESEARCH.md. If set to today, a Monday template with last_created_date=Wednesday drifts off its weekly anchor.
- **actingAs($userA, 'api') in ownership test:** withToken() with two sequentially-registered users causes JWT guard to cache the second user's identity, making Auth::id() return the wrong user. actingAs() directly sets the guard user without parsing the JWT token.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed assertJsonPath float comparison in test_update_modifies_template**
- **Found during:** Task 3 (test implementation)
- **Issue:** `assertJsonPath('data.amount', 200.00)` fails because PHP JSON parser returns integer `200` for whole-number decimal amounts; assertJsonPath uses strict comparison
- **Fix:** Replaced with `assertEquals(200.0, (float) $res->json('data.amount'))` which casts before comparison
- **Files modified:** backend/tests/Feature/RecurringExpenseTest.php
- **Verification:** test_update_modifies_template passes
- **Committed in:** 8360faa (Task 3 commit)

**2. [Rule 1 - Bug] Fixed cross-user ownership test using actingAs instead of withToken**
- **Found during:** Task 3 (test implementation)
- **Issue:** test_ownership_enforced returned 200 instead of 404 — withToken($tokenA) after withToken($tokenB) caused JWT guard to return userB's identity for userA's request due to request-level caching in tymon/jwt-auth
- **Fix:** Used actingAs($userA, 'api') to directly set the API guard user, bypassing JWT token parsing
- **Files modified:** backend/tests/Feature/RecurringExpenseTest.php
- **Verification:** test_ownership_enforced passes; RecurringExpenseController ownership guard remains unchanged (correct implementation)
- **Committed in:** 8360faa (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs in test assertions)
**Impact on plan:** Both fixes are test-layer corrections only. Controller/model/migration logic executed exactly as planned. No scope creep.

## Issues Encountered
- Local MySQL unavailable (Railway is the production DB); migration cannot be verified locally via `php artisan migrate:status`. Tests use SQLite in-memory (phpunit.xml sets DB_CONNECTION=sqlite, DB_DATABASE=:memory:) which correctly exercises the migration via RefreshDatabase trait. Railway migration will run on next deploy.
- 6 pre-existing test failures confirmed before any changes (CategoryTest 2, ExpenseApiTest 3, ExampleTest 1). All are unrelated to this plan. Zero new failures introduced.

## User Setup Required
None - no external service configuration required. Railway MySQL migration will run automatically on next deploy.

## Next Phase Readiness
- All 4 /api/recurring endpoints functional and tested
- GET /api/expenses auto-creates due entries via processRecurring() — frontend can rely on this
- shape() response contract established: id, description, category_id, category_name, amount, currency, frequency, start_date, last_created_date, next_due, created_at, updated_at
- Plan 08-02 (RecurringPage frontend) and 08-03 (App.tsx integration) can be built immediately against this API

---
*Phase: 08-recurring-expenses*
*Completed: 2026-05-14*
