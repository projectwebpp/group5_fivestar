# Phase 8: Recurring Expenses - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create recurring expense templates (daily/weekly/monthly). When the user loads the Expenses page, the backend silently checks for overdue recurring templates and creates any due entries before returning results — no background scheduler needed. Users can view, edit, and delete their recurring templates on a dedicated `/recurring` page. Generated entries appear in the normal expenses list. REQ-24.

</domain>

<decisions>
## Implementation Decisions

### Auto-Creation Mechanism
- **D-01:** Auto-creation is **on-request** — triggered when `GET /expenses` is called. The `index()` method in `ExpenseController` calls a `processRecurring()` helper before fetching and returning expenses. Zero infrastructure required; works on Vercel Hobby plan.
- **D-02:** Deduplication via **`last_created_date`** on the recurring template. Only create a new entry if today's date is past the next due date (derived from `last_created_date` + frequency). Update `last_created_date` after each entry is created.
- **D-03:** **Only one entry per load** — create at most 1 entry per template per trigger (the most recent due period only). If the user hasn't opened the app for 30 days with a monthly template, they get 1 entry, not 30. Avoids flooding the expense list after long absences.

### Recurring Page Layout
- **D-04:** Dedicated **`/recurring` route** with a nav link alongside Expenses, Analytics, Budget. Wrapped in `ProtectedRoute`.
- **D-05:** Page layout: **table** with columns: `Description | Category | Amount (฿) | Frequency | Next Due | Actions`. Consistent with the BudgetPage table pattern.
- **D-06:** Template creation uses an **inline form above the table** — a "+ Add Recurring Expense" button reveals a collapsible form section (no separate route). Form fields: description, category (dropdown), amount, currency, frequency (dropdown), start date.
- **D-07:** Edit uses **inline edit** on the table row (same pattern as BudgetPage's inline limit editing). Delete shows a confirmation dialog (or inline confirm/cancel links).

### Frequency & Schedule
- **D-08:** **Three frequencies only** — `daily`, `weekly`, `monthly`. Stored as an enum in the DB column.
- **D-09:** Weekly recurrence repeats on the **same day of the week as `start_date`** (e.g., starts on a Monday → repeats every Monday). Monthly recurrence repeats on the same day of month as `start_date`.
- **D-10:** Next due date logic per frequency:
  - `daily`: next_due = last_created_date + 1 day
  - `weekly`: next_due = last_created_date + 7 days (same weekday preserved via start_date)
  - `monthly`: next_due = last_created_date + 1 month (same day of month)

### End Condition
- **D-11:** Recurring expenses **run indefinitely** — no end date or max occurrences. The template is active until the user deletes it. No `end_date` column in schema.

### Claude's Discretion
- `recurring_expenses` DB table schema: `(id, user_id, category_id, description, amount DECIMAL(10,2), currency VARCHAR(3), frequency ENUM('daily','weekly','monthly'), start_date DATE, last_created_date DATE nullable, timestamps)`. Unique behavior: `last_created_date` is NULL on creation (first entry created on first `GET /expenses` call after start_date).
- `processRecurring()` as a private method on `ExpenseController` or a standalone `RecurringService` class — Claude's discretion.
- "Next Due" column in the table: compute as `last_created_date + frequency` (or `start_date` if `last_created_date` is NULL).
- Currency options: same as existing expense form (default `THB`).
- Empty state: reuse `EmptyState` component — "No recurring expenses yet — click + Add to get started".
- Error handling: use `InlineError` component on the recurring page for API errors (same pattern as BudgetPage).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/milestones/v2.0-REQUIREMENTS.md` — REQ-24 with acceptance criteria (recurring template CRUD, auto-creation, entries appear in expense list)
- `.planning/ROADMAP.md` — Phase 8 goal
- `.planning/PROJECT.md` — locked constraints: MySQL, JWT, ISO dates, `{success, data, message}` envelope, ฿ symbol, Vercel deploy

### Existing Backend (read before planning)
- `backend/routes/api.php` — add recurring routes inside `auth:api` middleware group; add `processRecurring()` call to `ExpenseController::index()`
- `backend/app/Http/Controllers/Api/ExpenseController.php` — `index()` method is the trigger point; `store()` pattern to follow for creating auto-generated expense entries
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros; all new endpoints MUST use these
- `backend/database/migrations/` — `expenses` table schema (user_id, category_id, amount, expense_date, description, notes, currency) and `categories` table; new `recurring_expenses` migration must be consistent
- `backend/app/Models/Expense.php` — model pattern to follow for `RecurringExpense` model

### Existing Frontend (read before planning)
- `frontend/src/App.tsx` — add `/recurring` route + `Recurring` nav link alongside Expenses, Analytics, Budget
- `frontend/src/pages/BudgetPage.tsx` — table layout, inline edit pattern, InlineError usage; RecurringPage should follow this pattern
- `frontend/src/api/client.ts` — axios instance with JWT Bearer interceptor
- `frontend/src/components/ProtectedRoute.tsx` — wrap `/recurring` route
- `frontend/src/components/EmptyState.tsx` — reuse for no-templates state
- `frontend/src/components/InlineError.tsx` — reuse for recurring page API errors
- `frontend/src/types/expense.ts` — expense type pattern for new `RecurringExpense` type
- `frontend/src/api/expenses.ts` — pattern to follow for new `frontend/src/api/recurring.ts`

### Prior Phase Context
- `.planning/phases/06-budget-management/06-CONTEXT.md` — inline edit pattern (D-05/D-06), table layout, inline styles, row actions pattern
- `.planning/phases/07-csv-export/07-CONTEXT.md` — established patterns: secondary button style, InlineError usage, loading state

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/pages/BudgetPage.tsx` — table + inline form pattern; RecurringPage.tsx should mirror this structure
- `frontend/src/components/EmptyState.tsx` — reuse with custom message
- `frontend/src/components/InlineError.tsx` — reuse for API errors
- `frontend/src/components/ProtectedRoute.tsx` — wrap new `/recurring` route
- `backend/app/Http/Controllers/Api/ExpenseController.php` — `store()` method creates an expense; `processRecurring()` will reuse this logic to create auto-generated entries
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` macro for all responses

### Established Patterns
- Inline styles only — no Tailwind, no CSS modules, no external CSS framework
- `฿` symbol on all monetary amounts
- `response()->success(data, message)` macro on all controller responses
- `auth:api` middleware group in `api.php` for all protected routes
- ISO date format (YYYY-MM-DD) for all date values
- `apiClient.get/post/put/delete` from `frontend/src/api/client.ts` for all API calls

### Integration Points
- `ExpenseController::index()` — add `$this->processRecurring(auth()->id())` call at the start (creates due entries before fetching)
- New `create_recurring_expenses_table` migration — separate from expenses table
- New `RecurringExpense` Eloquent model with `belongsTo(User)` and `belongsTo(Category)`
- New `RecurringExpenseController` in `backend/app/Http/Controllers/Api/`
- New frontend files: `frontend/src/pages/RecurringPage.tsx`, `frontend/src/api/recurring.ts`, `frontend/src/types/recurring.ts`
- `App.tsx`: add `/recurring` route + nav link (4th nav item after Budget)

</code_context>

<specifics>
## Specific Ideas

- On-request generation (D-01): entries created during `GET /expenses` call — the most recent missed period only (D-03), deduplicated by `last_created_date` (D-02).
- Weekly recurrence: same day-of-week as start_date (e.g., start Monday → every Monday).
- No end date — delete the template to stop generation.
- Table columns for `/recurring` page: `Description | Category | Amount (฿) | Frequency | Next Due | Actions`.
- Inline form creation (no separate route) — "+ Add Recurring Expense" button above table.

</specifics>

<deferred>
## Deferred Ideas

- Vercel Cron Jobs / GitHub Actions background processing — deferred; on-request generation is sufficient for v2.
- Bi-weekly / custom interval (every N days) — deferred; daily/weekly/monthly covers v2 scope.
- End date / max occurrences — deferred; indefinite with manual delete is sufficient for v2.
- Backfill of all missed entries — deferred; single most-recent entry is the chosen behavior.
- Email/push notifications for upcoming recurring expenses — out of scope.

</deferred>

---

*Phase: 8-recurring-expenses*
*Context gathered: 2026-05-13*
