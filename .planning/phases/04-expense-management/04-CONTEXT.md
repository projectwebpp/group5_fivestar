# Phase 4: Expense Management - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log new expenses (amount, category, description, date), view their full expense list with pagination and filters, inspect a single expense detail, edit it (full PUT and partial PATCH), and delete it — the core product value delivered end-to-end. All expense endpoints require a valid JWT. Currency is stored as THB silently for v1 (multi-currency UI deferred to v2).

</domain>

<decisions>
## Implementation Decisions

### Expense List Layout
- **D-01:** Expense list displays one **card per expense** — matches existing `ui-mockups/app.jsx` design direction.
- **D-02:** Each list card shows **amount (฿ symbol) + category name + date only**. Description visible only in the detail view.
- **D-03:** Tapping a card navigates to a **separate detail page at `/expenses/:id`** — clean URL, browser back returns to list.
- **D-04:** Empty state (no expenses, or filters return zero results) shows a **simple text message + "Add Expense" button** linking to `/expenses/new`.

### Filter & Pagination UX
- **D-05:** Filter controls live in a **collapsible filter bar above the list** — a "Filters" toggle button shows/hides filter inputs (date range, category, amount range).
- **D-06:** Pagination uses **Previous / Next buttons + "Page X of Y" indicator**. No numbered page buttons.
- **D-07:** Page size is **10 per page, fixed** — no user-facing page size control in v1.
- **D-08:** Filters apply via an **Apply button** — not auto-applied on change — to avoid API calls on every keystroke while entering amount range or date.

### Add/Edit Form Routing
- **D-09:** Add and Edit use the **same form component** rendered at two routes: `/expenses/new` (add) and `/expenses/:id/edit` (edit pre-fills fields from existing expense).
- **D-10:** After successful save (add or edit), user is **redirected to `/expenses`** (the expense list) to see the new/updated item.
- **D-11:** Delete action lives on the **detail page (`/expenses/:id`)**. An inline "Are you sure?" confirm message appears before the API call — no modal component needed (`window.confirm()` or inline state toggle acceptable).
- **D-12:** Form validation errors display **inline below the submit button** as a single red message — consistent with Phase 2 auth pattern (D-08 from `02-CONTEXT.md`). No field-level errors.

### Currency Handling
- **D-13:** Currency field is **THB by default, hidden from the user** — no currency UI control in v1. The backend stores `"THB"` silently on every expense record. Multi-currency UI is explicitly deferred to v2 per `CLAUDE.md`.
- **D-14:** All displayed amounts show the **฿ symbol** (e.g., "฿ 250.00") in both the list cards and the detail view.

### Claude's Discretion
- Exact card layout CSS / spacing — follow the minimal inline style pattern from Phase 1/2 (no CSS framework). Match `ui-mockups/` visual direction where practical.
- HTTP method for edit: PUT for full replacement, PATCH for partial — planner decides how to wire both in the frontend form (likely PUT only for simplicity in v1 UI, PATCH available via API).
- Category dropdown in the form — planner decides how to load the category list (GET /api/categories, same JWT interceptor).
- Date field format — ISO YYYY-MM-DD input (`<input type="date">`) consistent with CLAUDE.md constraint.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — EXP-01 through EXP-06 (the 6 requirements this phase must satisfy)
- `.planning/ROADMAP.md` — Phase 4 success criteria (6 criteria — all must be met)
- `.planning/PROJECT.md` — locked decisions: MySQL, JWT, API envelope `{success, data, message}`, amount > 0 / max 2 decimals / ISO dates, multi-currency deferred to v2

### Existing Backend (Phase 1 scaffold — read before planning API)
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros; ALL expense controllers MUST use these
- `backend/routes/api.php` — add all expense routes here (currently only GET /health exists)
- `backend/database/migrations/` — expenses table migration already created in Phase 1 (columns: id, user_id, amount, currency, category_id, description, date, timestamps)
- `backend/config/auth.php` — api guard driver = jwt; do not change
- `CLAUDE.md` — constraints: MySQL only, no v2 features (budget/CSV/recurring), response envelope, ISO dates, amount validation

### Existing Frontend (Phase 1/2 scaffold — read before planning UI)
- `frontend/src/api/client.ts` — axios client with Bearer token interceptor; all expense API calls use this client
- `frontend/src/App.tsx` — add `/expenses/new`, `/expenses/:id`, `/expenses/:id/edit` routes here; wrap in `ProtectedRoute` (Phase 2 adds this component)
- `frontend/src/pages/ExpensesPage.tsx` — current stub to replace with full list implementation
- `frontend/src/pages/AuthPage.tsx` — reference for inline error + loading button pattern (Phase 2 D-08, D-09)

### UI Reference (design direction, not binding)
- `ui-mockups/add-screen.jsx` — add expense form mockup (card layout, numeric keypad style, amount prominent)
- `ui-mockups/app.jsx` — main list view mockup (card-based expenses, category icons, date display)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/api/client.ts` — axios instance with JWT Bearer interceptor already configured. All expense API calls (GET /api/expenses, POST, PUT, PATCH, DELETE) use this client without any auth setup.
- `backend/app/Providers/AppServiceProvider.php` — `response()->success($data, $message)` and `response()->error($message, $errors, $code)` macros. Every expense controller action must use these — no raw `return response()->json(...)`.
- Phase 2 `ProtectedRoute` component — wraps expense routes; if user is unauthenticated, redirects to `/auth`. Expense pages are protected by default.

### Established Patterns
- API response envelope: `{success, data, message}` on success; `{success: false, message, errors: [{field, message}]}` on failure — ALL expense endpoints follow this without exception.
- Frontend pages use minimal inline styles (`fontFamily: 'sans-serif', padding: '2rem'`) — expense UI follows this pattern, no CSS framework introduced.
- Error display: single message inline below submit button (from Phase 2 D-08) — expense form follows the same pattern.
- Pagination: backend already supports `?page=&limit=` query params on list endpoints (Phase 1 scaffold design). Frontend sends these params via axios, renders Prev/Next controls.

### Integration Points
- `backend/routes/api.php` — add expense routes inside a `Route::middleware('jwt.auth')->group(...)` block:
  - `POST /api/expenses` (create)
  - `GET /api/expenses` (list with `?page=&limit=&category_id=&date_from=&date_to=&amount_min=&amount_max=`)
  - `GET /api/expenses/{id}` (detail)
  - `PUT /api/expenses/{id}` (full update)
  - `PATCH /api/expenses/{id}` (partial update)
  - `DELETE /api/expenses/{id}`
- `frontend/src/App.tsx` — add routes: `/expenses` (list), `/expenses/new` (add form), `/expenses/:id` (detail), `/expenses/:id/edit` (edit form). All wrapped in `ProtectedRoute`.
- Category list for the expense form dropdown: `GET /api/categories` (Phase 3 endpoint) — expense form fetches this on mount to populate the category selector.

</code_context>

<specifics>
## Specific Ideas

- The `ui-mockups/add-screen.jsx` shows a full-page add form with amount prominently displayed at the top and a category grid below. The card style (rounded corners, shadow, `borderRadius: 20`) matches what the expense list cards should look like.
- The mockup uses Thai labels ("เพิ่มรายการใหม่"). For v1, English labels are fine (or Thai — planner's choice consistent with the rest of the UI).
- The inline "Are you sure?" delete confirm can be implemented as a simple boolean state toggle (`showDeleteConfirm`) that replaces the Delete button with "Confirm Delete" + "Cancel" — no modal library needed.
- Amount input: `<input type="number" step="0.01" min="0.01">` — browser validates format, backend validates amount > 0 and max 2 decimals.

</specifics>

<deferred>
## Deferred Ideas

- **Multi-currency dropdown** — user-selectable currency (THB/USD/EUR/JPY) deferred to v2 per `CLAUDE.md` constraint.
- **Delete from list card** — swipe-to-delete or per-card delete button on the list view. Deferred to v2 for simplicity; v1 delete is on the detail page only.
- **Slip/receipt image upload** — shown in `ui-mockups/add-screen.jsx` but explicitly out of scope (no OCR in v1).
- **Income tracking / "type" toggle** — mockup shows income/expense toggle but REQUIREMENTS.md has no income tracking requirement. Deferred to v2.

</deferred>

---

*Phase: 4-Expense-Management*
*Context gathered: 2026-05-10*
