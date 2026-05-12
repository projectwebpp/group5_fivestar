# Phase 6: Budget Management - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can set monthly budget limits per category, view a budget page showing every category's limit vs current-month spend, and see a red row highlight when spend meets or exceeds the limit. Budget management lives on a dedicated `/budget` page. Current month is always shown — no historical navigation. REQ-20, REQ-21, REQ-22.

</domain>

<decisions>
## Implementation Decisions

### Budget Page Location
- **D-01:** New dedicated **`/budget` route** — top nav link alongside Expenses and Analytics. Wrapped in `ProtectedRoute` (same as all protected pages).

### Budget Page Layout
- **D-02:** Main content is a **table** with columns: `Category | Limit (฿) | Spent (฿) | Remaining (฿)`.
- **D-03:** **All user categories appear** in the table. If no limit is set for a category, the Limit and Remaining cells show `—` (dash).
- **D-04:** Month scope: **current calendar month only** — no month/year picker. Spent column = sum of expenses for the current month in that category.

### Budget CRUD Flow
- **D-05:** Setting or editing a limit uses **inline edit** — click the Limit cell to reveal an input field in-place. Confirm with a Save button; cancel with a Cancel link. No separate form page or modal.
- **D-06:** Deleting a limit = saving blank/zero input, which removes the budget row (hard delete from the `budgets` table, not setting to NULL).

### Over-Budget Warnings
- **D-07:** Warning appears on the **budget page only** — the entire row turns **red** when `spent ≥ limit`. No warnings on Analytics or expense list.
- **D-08:** Remaining column shows a negative number when over budget (e.g., `-฿200`) — no separate warning icon needed.

### Claude's Discretion
- `budgets` DB table schema — recommended: `(id, user_id, category_id, month TINYINT, year SMALLINT, amount DECIMAL(10,2), timestamps)`. Unique constraint on `(user_id, category_id, month, year)`.
- API endpoint design — recommended: `POST /api/budgets` (create), `PUT /api/budgets/{id}` (update), `DELETE /api/budgets/{id}` (remove). Or use `PUT /api/budgets` with upsert logic — either is fine.
- GET budget endpoint — `GET /api/budgets?month=M&year=Y` returning each category with its limit + current-month spend aggregated.
- Empty state when no budgets set — reuse `EmptyState` component with "No budgets set yet — click any limit field to get started".
- Row sort order — alphabetical by category name.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/milestones/v2.0-REQUIREMENTS.md` — REQ-20, REQ-21, REQ-22 with acceptance criteria (budget limits, spend vs budget view, over-budget warnings)
- `.planning/ROADMAP.md` — Phase 6 goal and success criteria
- `.planning/PROJECT.md` — locked constraints: MySQL, JWT, `{success, data, message}` envelope, ISO dates, ฿ symbol, Vercel deploy

### Existing Backend (read before planning API)
- `backend/routes/api.php` — add budget routes inside `auth:api` middleware group here
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros; BudgetController MUST use these
- `backend/app/Http/Controllers/Api/AnalyticsController.php` — DB raw query pattern to follow for budget spend aggregation
- `backend/database/migrations/` — existing `categories` (user_id, name) and `expenses` (user_id, category_id, amount, expense_date) tables; new `budgets` migration must be consistent
- `backend/app/Models/Category.php` — Category model with user_id; budget belongs to category

### Existing Frontend (read before planning UI)
- `frontend/src/App.tsx` — add `/budget` route + `Budget` nav link alongside Expenses and Analytics
- `frontend/src/api/client.ts` — axios instance with JWT Bearer interceptor; budget API calls use this
- `frontend/src/components/ProtectedRoute.tsx` — wrap `/budget` route
- `frontend/src/components/EmptyState.tsx` — reuse for "no budgets set" state
- `frontend/src/components/InlineError.tsx` — for API error display on budget page
- `frontend/src/pages/AnalyticsPage.tsx` + `frontend/src/pages/ExpensesPage.tsx` — inline style patterns to follow (no CSS framework)

### Prior Phase Context
- `.planning/phases/05-analytics/05-CONTEXT.md` — established patterns: inline styles, ฿ symbol, Apply button, `response()->success()` usage
- `.planning/phases/04-expense-management/04-CONTEXT.md` — D-14 (฿ symbol), D-08 (Apply button pattern), inline error pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/api/client.ts` — axios instance; budget calls: `client.get('/budgets', { params: { month, year } })`, `client.post('/budgets', payload)`, `client.put('/budgets/{id}', payload)`, `client.delete('/budgets/{id}')`.
- `frontend/src/components/EmptyState.tsx` — reuse for no-budgets state.
- `frontend/src/components/InlineError.tsx` — reuse for budget page API errors.
- `frontend/src/components/ProtectedRoute.tsx` — wrap `/budget` route same as Analytics.

### Established Patterns
- Inline styles only — no Tailwind, no CSS modules, no external CSS framework.
- `฿` symbol on all monetary amounts.
- `response()->success(data, message)` macro on all controller responses.
- `auth:api` middleware group in `api.php` for all protected routes.
- DB raw queries via `DB::table()` + `DB::raw()` — see AnalyticsController.
- ISO date params (YYYY-MM-DD) for all date inputs.

### Integration Points
- New migration: `create_budgets_table` — columns: `user_id`, `category_id`, `month`, `year`, `amount`, timestamps. Unique on `(user_id, category_id, month, year)`.
- New `Budget` Eloquent model with `belongsTo(User)` and `belongsTo(Category)`.
- New `BudgetController` in `backend/app/Http/Controllers/Api/`.
- Budget spend query: join `expenses` where `user_id`, `category_id`, `MONTH(expense_date) = month`, `YEAR(expense_date) = year` — group by `category_id`, sum `amount`.
- New frontend files: `frontend/src/pages/BudgetPage.tsx`, `frontend/src/api/budgets.ts`, `frontend/src/types/budget.ts`.
- `App.tsx` changes: add `/budget` route + nav link.

</code_context>

<specifics>
## Specific Ideas

- Table row turns fully red (background color) when `spent >= limit` — not just a badge or icon.
- Remaining column shows negative value when over budget: `remaining = limit - spent`, formatted as `฿{remaining}` (negative = red row already makes it clear).
- Inline edit: clicking the limit cell shows a number input pre-filled with existing value (or blank). Save button submits; Cancel reverts to display mode.
- Categories with no limit set show `—` in Limit and Remaining columns, but the Spent column always shows the current-month spend even if no limit is set.

</specifics>

<deferred>
## Deferred Ideas

- Month/year picker for historical budgets — current month only for v2.
- Over-budget warnings on Analytics page or expense list — budget page only for v2.
- Budget alerts / push notifications — visual only, no email/push.
- Budget templates (copy last month's limits) — future enhancement.

</deferred>

---

*Phase: 6-Budget Management*
*Context gathered: 2026-05-12*
