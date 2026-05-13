# Phase 7: CSV Export - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can download all their expense data as a CSV file. A secondary "Export CSV" button on the ExpensesPage header triggers a backend `GET /api/expenses/export` endpoint (JWT-protected), which streams all the user's expenses as `text/csv`. Frontend uses Axios blob download + programmatic `<a>` trigger. No new route or nav link required. REQ-23.

</domain>

<decisions>
## Implementation Decisions

### Export Button Location
- **D-01:** Export CSV button lives on **ExpensesPage header**, positioned next to the "+ Add Expense" primary button. No new `/export` route, no new nav link.
- **D-02:** Button uses a **secondary/muted style** — visually lighter than "+ Add Expense" (e.g., outlined or gray). Keeps visual hierarchy: export is a secondary action.

### Export Scope & Content
- **D-03:** **Always export ALL of the user's expenses** — no filter applied. User gets everything regardless of what filters are currently active in the FilterBar.
- **D-04:** **Empty state**: if user has no expenses, still download a valid CSV with the header row only (not an error state, not a disabled button).
- **D-05:** **CSV columns (7):** `date, category, description, amount, currency, notes` — exact REQ-23 spec plus `notes` field. Notes column will be empty string when not set.

### Claude's Discretion
- Backend endpoint: `GET /api/expenses/export` inside `auth:api` middleware group in `api.php`. Add to `ExpenseController` as an `export()` method.
- JWT auth for download: use Axios `responseType: 'blob'` + programmatic `<a href>` trigger — no token in URL query param.
- CSV filename: `expenses-{YYYY-MM-DD}.csv` (today's date).
- Amount format in CSV: plain decimal number (`1250.00`), no ฿ prefix — easier to process in Excel.
- Date format: ISO `YYYY-MM-DD` per project constraint.
- Category column: category name string (not category_id).
- Loading state: button shows "Exporting…" text while Axios request is in flight; reverts on completion or error.
- Error state: show `InlineError` component on the page if export fails (same pattern as BudgetPage).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/milestones/v2.0-REQUIREMENTS.md` — REQ-23 with acceptance criteria (CSV columns, endpoint spec, optional filter)
- `.planning/ROADMAP.md` — Phase 7 goal
- `.planning/PROJECT.md` — locked constraints: MySQL, JWT, ISO dates, Vercel deploy

### Existing Backend (read before planning)
- `backend/routes/api.php` — add `GET /api/expenses/export` inside `auth:api` middleware group here (alongside existing expense routes)
- `backend/app/Http/Controllers/Api/ExpenseController.php` — add `export()` method here; existing `index()` query logic is the reference for fetching user expenses
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` macro; export returns `text/csv` directly (not JSON envelope), so use `response()->streamDownload()` instead
- `backend/database/migrations/` — `expenses` table schema (user_id, category_id, amount, expense_date, description, notes) and `categories` table (name)

### Existing Frontend (read before planning)
- `frontend/src/pages/ExpensesPage.tsx` — add Export CSV button here; reference header layout (existing "+ Add Expense" button position)
- `frontend/src/api/expenses.ts` — add `exportExpenses()` function here; use `apiClient.get('/expenses/export', { responseType: 'blob' })` pattern
- `frontend/src/api/client.ts` — axios instance with JWT Bearer interceptor; blob download works through this
- `frontend/src/components/InlineError.tsx` — reuse for export error display on ExpensesPage

### Prior Phase Context
- `.planning/phases/06-budget-management/06-CONTEXT.md` — established patterns: inline styles, ฿ symbol display, `response()->success()` usage, secondary action styling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/api/client.ts` — axios instance; export call: `apiClient.get('/expenses/export', { responseType: 'blob' })`
- `frontend/src/components/InlineError.tsx` — for export error display
- `backend/app/Http/Controllers/Api/ExpenseController.php` — `index()` query (filter by `user_id`, join `categories`) is the base for `export()` — same data, different output format

### Established Patterns
- Inline styles only — no CSS framework (set in Phase 4, confirmed Phase 5-6)
- JWT auth via `auth:api` middleware group — all new protected routes go inside the existing group in `api.php`
- `response()->streamDownload()` for file responses — does NOT use `{success, data, message}` envelope (CSV is not JSON)
- `apiClient.get(url, { responseType: 'blob' })` → `URL.createObjectURL(blob)` → programmatic `<a>` click → `URL.revokeObjectURL()` — standard pattern for JWT-authenticated file downloads in SPAs

### Integration Points
- `ExpensesPage.tsx` header: new secondary button sits alongside the existing primary "+ Add Expense" button
- `api/expenses.ts`: new `exportExpenses()` export function alongside existing `listExpenses`, `createExpense`, etc.
- `api.php`: one new route `Route::get('expenses/export', ...)` inside `auth:api` group — register BEFORE `expenses/{id}` to avoid route collision

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose to include `notes` as a 7th column (beyond REQ-23 spec) — downstream agents must implement this.
- Export button secondary style: lighter visual weight than primary "+ Add Expense" button — exact styling at Claude's discretion but must be visually subordinate.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-csv-export*
*Context gathered: 2026-05-13*
