---
phase: 06-budget-management
plan: "01"
subsystem: backend
tags: [budget, laravel, migration, eloquent, api, jwt]
dependency_graph:
  requires: [phases/05-analytics]
  provides: [budget-api-backend]
  affects: [backend/routes/api.php]
tech_stack:
  added: []
  patterns: [DB::table-raw-queries, response-macro-envelope, Auth::id-ownership-guard]
key_files:
  created:
    - backend/database/migrations/2026_05_12_000001_create_budgets_table.php
    - backend/app/Models/Budget.php
    - backend/app/Http/Controllers/Api/BudgetController.php
  modified:
    - backend/routes/api.php
decisions:
  - "Used DB::table raw queries in BudgetController::index (matching AnalyticsController pattern) to avoid N+1 on categories/budgets/expenses joins"
  - "Hard-delete on destroy (no soft deletes) — matches plan D-06 decision"
  - "Category ownership verified in store via separate WHERE user_id query before Budget::create (T-06-01)"
metrics:
  duration: "2 minutes"
  completed_date: "2026-05-12T11:58:34Z"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 06 Plan 01: Budget Management Backend Summary

## One-liner

Budget CRUD API with four JWT-protected endpoints: migration with unique constraint, Budget Eloquent model, BudgetController returning per-category spend-vs-limit rows, and routes registered in api.php.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migration and Budget model | d0b4368 | backend/database/migrations/2026_05_12_000001_create_budgets_table.php, backend/app/Models/Budget.php |
| 2 | BudgetController with index, store, update, destroy | 1712bd9 | backend/app/Http/Controllers/Api/BudgetController.php |
| 3 | Register budget routes in api.php | 5349928 | backend/routes/api.php |

## What Was Built

### Migration (budgets table)
- `id`, `user_id` (FK to users, cascadeOnDelete), `category_id` (FK to categories, cascadeOnDelete), `month` TINYINT UNSIGNED, `year` SMALLINT UNSIGNED, `amount` DECIMAL(10,2), timestamps
- Composite unique constraint on `(user_id, category_id, month, year)` — prevents duplicate budget rows per user/category/period

### Budget Model
- `$fillable`: user_id, category_id, month, year, amount
- `$casts`: month/year as integer, amount as float
- Relations: `belongsTo(User::class)`, `belongsTo(Category::class)`

### BudgetController
- `index(month, year)`: three separate DB::table queries (categories, budgets, expenses) joined in PHP via Collection::keyBy. Returns per-category rows: `{category_id, category_name, budget_id (nullable), limit (nullable float), spent (float), remaining (nullable float)}`
- `store(category_id, month, year, amount)`: validates category ownership before create
- `update(id, amount)`: ownership-scoped WHERE clause, 404 on not-found/not-owned
- `destroy(id)`: ownership-scoped WHERE clause, hard delete, 404 on not-found/not-owned

### Routes (api.php)
```
GET    /api/budgets          -> BudgetController::index
POST   /api/budgets          -> BudgetController::store
PUT    /api/budgets/{id}     -> BudgetController::update
DELETE /api/budgets/{id}     -> BudgetController::destroy
```
All inside `Route::middleware('auth:api')` group — JWT required (T-06-04).

## Threat Mitigations Applied

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-06-01 | Mitigated | `DB::table('categories')->where('id', category_id)->where('user_id', $userId)->exists()` before Budget::create |
| T-06-02 | Mitigated | `Budget::where('id', $id)->where('user_id', Auth::id())` in update and destroy |
| T-06-03 | Mitigated | `DB::table('categories')->where('user_id', $userId)` — only auth user's categories returned in index |
| T-06-04 | Mitigated | All four routes inside `Route::middleware('auth:api')` group |
| T-06-05 | Mitigated | `amount` validated with `numeric, gt:0` in store and update |

## Deviations from Plan

None — plan executed exactly as written.

Note: `php artisan migrate` was not executable from the worktree environment (vendor/ directory lives only in the main repo, and MySQL is not reachable from WSL). The migration file is the deployable artifact; it runs on `php artisan migrate` in the actual deployment or local dev environment.

## Known Stubs

None. No UI components created in this plan (backend-only plan).

## Self-Check

- [x] `backend/database/migrations/2026_05_12_000001_create_budgets_table.php` — EXISTS
- [x] `backend/app/Models/Budget.php` — EXISTS
- [x] `backend/app/Http/Controllers/Api/BudgetController.php` — EXISTS
- [x] `backend/routes/api.php` — MODIFIED (BudgetController use + 4 routes)
- [x] Commits d0b4368, 1712bd9, 5349928 — created on worktree-agent branch

## Self-Check: PASSED
