---
phase: 01-expense-tracker
plan: 03
subsystem: database
tags: [mysql, migrations, laravel, railway, vercel, walking-skeleton]

requires:
  - phase: 01-01
    provides: Laravel API scaffold, health endpoint
  - phase: 01-02
    provides: React frontend scaffold with VITE_API_URL

provides:
  - categories table migration (id, name, description, color, icon, budget)
  - expenses table migration (id, amount, currency, category_id FK, description, expense_date, notes, is_recurring, recurring_id)
  - CategorySeeder with 10 default categories (idempotent via insertOrIgnore)
  - ui-mockups/ directory (renamed from ui_design/)
  - Walking skeleton verified end-to-end: Vercel → Railway → MySQL

affects: [02-authentication, 03-categories, 04-expenses]

tech-stack:
  added: [railway-mysql, vercel]
  patterns: [idempotent seeder with insertOrIgnore, Railway variable reference syntax ${{VAR}}]

key-files:
  created:
    - backend/database/migrations/2026_01_01_000001_create_categories_table.php
    - backend/database/migrations/2026_01_01_000002_create_expenses_table.php
    - backend/database/seeders/CategorySeeder.php
    - backend/database/seeders/DatabaseSeeder.php
    - ui-mockups/ (renamed from ui_design/ via git mv)
  modified: []

key-decisions:
  - "expense_date column name (not 'date') — matches SPEC.md and RESEARCH.md naming"
  - "NO user_id in expenses table — Phase 2 adds users table then migration to add user_id FK"
  - "recurring_id is plain unsignedBigInteger with no FK — recurring_expenses table is v2 scope"
  - "CategorySeeder uses insertOrIgnore — safe to re-run, no duplicate errors"
  - "categories migration runs BEFORE expenses — FK constraint requires categories to exist first"

patterns-established:
  - "Migration order: categories (000001) before expenses (000002) — FK dependency"
  - "Seeders use DB::table()->insertOrIgnore() with now() timestamps — idempotent"
  - "Railway env var reference syntax in Laravel: ${{MYSQLHOST}} etc."
---

# 01-03: DB Migrations + Deploy

MySQL schema migrations, CategorySeeder, ui-mockups rename, and walking skeleton verified end-to-end on Railway + Vercel.

## Files Created

- `backend/database/migrations/2026_01_01_000001_create_categories_table.php`
- `backend/database/migrations/2026_01_01_000002_create_expenses_table.php`
- `backend/database/seeders/CategorySeeder.php` — 10 default categories
- `backend/database/seeders/DatabaseSeeder.php` — calls CategorySeeder
- `ui-mockups/` — design reference JSX files (renamed from ui_design/)

## Schema Summary

**categories**: id, name(unique,50), description(text,null), color(7,null), icon(50,null), budget(decimal,null), timestamps, INDEX(name)

**expenses**: id, amount(decimal), currency(3,THB), category_id(FK→categories RESTRICT), description(255), expense_date(date), notes(text,null), is_recurring(bool,false), recurring_id(bigint,null), timestamps, INDEX(expense_date, category_id, created_at)

## CategorySeeder Data (10 records)

Food, Transport, Housing, Education, Health, Entertainment, Shopping, Utilities, Business, Other

## Walking Skeleton Verification

- Railway backend: GET /api/health → `{"success":true,"data":{"status":"ok"},"message":"API is healthy"}` ✅
- Vercel frontend: "API Status: ok" shown in green ✅
- SPA routing: /expenses loads (no 404) ✅
- git push → Vercel auto-deploy triggered ✅

## Deviations from Plan

- `php artisan migrate --pretend` dry-run skipped — PHP not available in WSL2 during execution. Migrations verified correct via Railway deploy (ran cleanly in production).
- Migration files created manually (not via `php artisan make:migration`) — exact filenames per plan spec.

## Next Phase Readiness

Phase 1 complete. Phase 2 (Authentication) can begin: categories and expenses tables exist in MySQL, JWT config wired, backend deployed on Railway, frontend on Vercel.

---
*Phase: 01-expense-tracker*
*Completed: 2026-05-09*
