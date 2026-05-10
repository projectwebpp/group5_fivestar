# Phase 4: Expense Management - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log new expenses, view their full expense list with pagination and filters, inspect a single expense via the edit modal, edit expenses (full and partial update), and delete expenses — the core product value delivered end-to-end. All expenses are user-scoped.

</domain>

<decisions>
## Implementation Decisions

### Schema Migrations (Architectural — Locked)
- **D-01:** The `expenses` table from Phase 1 has **no `user_id` column**. Phase 4 MUST add `user_id` via a new migration: add `user_id BIGINT UNSIGNED NOT NULL`, add FK constraint to `users.id` with `onDelete('cascade')`, add index on `user_id`. All expense queries must be scoped to `auth()->id()`.
- **D-02:** The `is_recurring` (boolean) and `recurring_id` (unsignedBigInteger) columns exist in the Phase 1 expenses migration but are deferred to v2 (Phase 3 review IN-03). Phase 4 drops them via a separate migration to clean up schema noise. The `recurring_id` column has no FK constraint — safe to drop.
- **D-03:** The `category_id` FK on expenses uses `restrictOnDelete()` (from Phase 1 migration) — this enforces that deleting a category with expenses is blocked at the DB level (consistent with the Phase 3 application-level guard).

### Expense Form & Edit UX
- **D-04:** "Add expense" opens a **modal overlay on the expenses list page** — same pattern as Phase 3 categories (no new route needed).
- **D-05:** "Edit expense" reuses the **same modal, pre-filled** with the expense's current values. One component handles both create and edit. No separate edit route.
- **D-06:** **No separate detail view** — the pre-filled edit modal satisfies EXP-04 (view single expense detail). Clicking edit on a card opens the modal with all fields visible.

### Expense List Layout
- **D-07:** Expenses are displayed as a **cards grid** (`display: grid`, `repeat(auto-fill, minmax(240px, 1fr))`). Each card shows: category color strip at top (as background of a header area), category icon + category name, expense description, amount (bold), and date.
- **D-08:** Each card has **edit (pencil) and delete (trash) icons** visible on the card — same pattern as categories. Delete uses the Phase 3 inline confirmation pattern: trash icon → "Are you sure? Confirm" button appears inline → success removes the card → error stays visible on the card.

### Filters (EXP-03)
- **D-09:** Filters are shown in an **always-visible filter bar above the card grid**. No toggle or modal needed — filtering is a core workflow, not an edge case.
- **D-10:** Filters **auto-apply on change** — each filter field change immediately re-fetches the expense list (no separate Apply button).
- **D-11:** Filter controls use **native HTML inputs** — no extra libraries:
  - Date range: two `<input type="date">` fields (from / to)
  - Category: `<select>` dropdown populated from the user's categories
  - Amount range: two `<input type="number">` fields (min / max)
- **D-12:** Changing any filter **resets to page 1** automatically (prevents empty page results).

### Pagination (EXP-02)
- **D-13:** Pagination uses **Previous / Next buttons with a page indicator** ("Page 2 of 5"). No numbered page links, no infinite scroll.
- **D-14:** **10 expenses per page**, fixed. No per-page selector. Backend default `limit=10`.
- **D-15:** Pagination controls sit **below the card grid**.

### API Design
- **D-16:** `GET /expenses` accepts query params: `page` (default 1), `limit` (default 10), `date_from` (ISO date), `date_to` (ISO date), `category_id` (integer), `amount_min` (decimal), `amount_max` (decimal). Returns paginated envelope with `data`, `meta.current_page`, `meta.last_page`, `meta.total`.
- **D-17:** `POST /expenses` and `PUT /expenses/{id}` validate: `amount` (required, numeric, > 0, max 2 decimal places), `currency` (required, string, size:3 — default THB), `category_id` (required, integer, must belong to authenticated user), `description` (required, string, max:255), `expense_date` (required, date format YYYY-MM-DD), `notes` (nullable, string, max:1000).
- **D-18:** `PATCH /expenses/{id}` allows partial update — all fields optional, but any provided field must pass the same validation rules.
- **D-19:** Owner check on all expense routes returns **404 not 403** (consistent with Phase 3 category pattern — no resource enumeration).
- **D-20:** `GET /categories/{category}` (show single category) was intentionally deferred from Phase 3. Phase 4 ADDS this endpoint (needed by the expense form to resolve the category for display). Same ownership check pattern.

### Currency
- **D-21:** The `currency` field is included in the expense form as a **small read-only label showing "THB"** (not a dropdown). The value is stored as `'THB'` automatically. Multi-currency is v2 — we keep the column but don't expose selection in the UI.

### Claude's Discretion
- Exact column order in the paginator response meta (`current_page`, `last_page`, `per_page`, `total`) — planner picks consistent with Laravel's paginator
- Whether to use `$request->validated()` or individual field extraction in the controller — planner decides
- Whether the expense `Expense` model has `$casts` for `amount` (decimal), `expense_date` (date), and `user_id` (integer) — planner should add these for type safety
- Exact card grid column breakpoints and card height — planner picks, should be consistent with categories page
- Whether a "Clear filters" button appears when any filter is active — planner adds it if it fits naturally

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — EXP-01 through EXP-06 (the 6 requirements this phase must satisfy)
- `.planning/ROADMAP.md` — Phase 4 success criteria (6 criteria)
- `.planning/PROJECT.md` — locked decisions: MySQL, JWT, API envelope, response macros, constraints

### Existing Backend (Phase 1-3 — read before planning API)
- `backend/database/migrations/2026_01_01_000002_create_expenses_table.php` — current expenses schema: NO `user_id`, has `is_recurring` + `recurring_id` (to be dropped in Phase 4)
- `backend/database/migrations/2026_05_10_000001_add_user_id_to_categories_table.php` — migration pattern for adding user_id FK (follow same approach for expenses)
- `backend/app/Http/Controllers/Api/CategoryController.php` — ownership check pattern (404 not 403), response envelope usage, validation array syntax for regex rules
- `backend/app/Models/Category.php` — model with `$casts`, `$fillable`, `$hidden` — follow same structure for Expense model
- `backend/routes/api.php` — existing jwt.auth group structure; Phase 4 adds expense routes here + GET /categories/{category}
- `backend/app/Http/Controllers/Api/AuthController.php` — DB::transaction pattern for atomic user + category seeding

### Existing Frontend (Phase 2-3 — read before planning UI)
- `frontend/src/pages/CategoriesPage.tsx` — full reference implementation: cards grid, modal create/edit, inline delete confirmation, useEffect with cancelled guard, filter state. Phase 4 follows ALL established patterns here.
- `frontend/src/api/categories.ts` — API module pattern: interface definitions, Envelope generic, getCategories / createCategory / updateCategory / deleteCategory
- `frontend/src/App.tsx` — `/expenses` route already exists and is wrapped in ProtectedRoute
- `frontend/src/api/client.ts` — Axios instance with JWT interceptor; `VITE_API_URL` as base

### Phase 3 Review (known issues to NOT repeat)
- `.planning/phases/03-categories/03-REVIEW.md` — CR-03 (use regex array syntax for validation), WR-01 ($casts for integer FK), WR-03 (don't reset confirm state on error), WR-04 (cancelled guard in useEffect), WR-05 (DB::transaction)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CategoriesPage.tsx` — modal overlay, cards grid, inline delete confirmation, cancelled useEffect guard. Phase 4 ExpensesPage reuses ALL of these patterns directly.
- `categories.ts` API module — interface + function export pattern for expense API module
- `lucide-react` — already installed; icons available for expense cards (e.g., `Receipt`, `DollarSign`, `Calendar`, `Pencil`, `Trash2`)

### Established Patterns
- **Ownership check returns 404** — all resource routes check `resource->user_id !== auth()->id()` and return `response()->error('Not found', [], 404)`
- **No CSS framework** — inline styles only throughout the frontend; no className props, no Tailwind, no Bootstrap
- **Response macro** — `response()->success(data, message)` and `response()->error(message, errors, status)` are wired in Phase 1
- **JWT middleware** — `jwt.auth` group in `routes/api.php` handles all protected routes

### Integration Points
- Expense → Category (FK): expense form category dropdown must load from `GET /categories` and validate that the chosen category belongs to the authenticated user
- Phase 4 adds `GET /categories/{category}` (show) which was deferred from Phase 3 — must follow same ownership pattern as update/destroy
- Phase 5 (analytics) will query expenses by `user_id` — the `user_id` index added in Phase 4's migration is critical for performance

</code_context>

<specifics>
## Specific Ideas

- Category FK validation in store/update: use `Rule::exists('categories', 'id')->where('user_id', auth()->id())` to prevent assigning expenses to another user's categories
- The filter bar should include a "Clear" button that resets all filters at once (common UX expectation)
- Phase 3's `CategoryController::destroy()` has a `TODO(Phase 4)` comment at line ~98 noting that the expense check must be scoped to `auth()->id()` once `expenses.user_id` exists — Phase 4 MUST update this guard

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Expense Management*
*Context gathered: 2026-05-10*
