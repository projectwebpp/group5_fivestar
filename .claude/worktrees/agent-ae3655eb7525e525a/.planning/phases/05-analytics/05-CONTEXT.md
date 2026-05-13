# Phase 5: Analytics & Reports - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can see their financial picture for a selected date range — monthly totals, a per-category breakdown rendered as a pie chart, and daily/monthly averages — all on a single scrollable analytics page accessible from the main nav. The date range defaults to the current month and can be changed via pre-set buttons or custom date inputs. "Trend" is a filtered snapshot (the same summary stats recalculated for the chosen range) — no separate time-series chart.

</domain>

<decisions>
## Implementation Decisions

### Chart Library
- **D-01:** Use **Recharts** for the pie chart. Install `recharts` via npm.
- **D-02:** Pie chart shows a **Recharts built-in Tooltip** on hover/tap: category name + amount (฿) + percentage (e.g., "Food: ฿1,200 (34%)"). No static legend needed.

### Analytics Nav & Layout
- **D-03:** Add **`Analytics` as a new top-nav link** alongside `Expenses`. Route: `/analytics`. Wrap in `ProtectedRoute` (same as expense routes).
- **D-04:** Analytics page is a **single scrollable page**. Section order from top to bottom:
  1. Date range filter bar (pre-sets + custom inputs + Apply button)
  2. Summary cards: Total expenses | Daily average | Monthly average
  3. Pie chart (category breakdown)

### Date Range Filter UX
- **D-05:** Page opens with **current month** pre-selected (first day of current month → today).
- **D-06:** Filter bar provides **pre-set buttons** (This Month / Last Month / Last 3 Months) **plus custom date from/to inputs**. Clicking a pre-set populates the from/to inputs.
- **D-07:** Filter applies via an **Apply button** — consistent with Phase 4 FilterBar (D-08 in `04-CONTEXT.md`). No auto-apply on change.

### API Shape
- **D-08:** Single endpoint: `GET /api/analytics/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`. Must be inside `auth:api` middleware group.
- **D-09:** Response envelope (`{success, data, message}`) with `data` shape:
  ```json
  {
    "date_from": "2026-05-01",
    "date_to": "2026-05-10",
    "total": 5200.00,
    "daily_avg": 520.00,
    "monthly_avg": 5200.00,
    "category_breakdown": [
      { "name": "Food", "total": 1200.00, "percentage": 23.08 },
      { "name": "Transport", "total": 800.00, "percentage": 15.38 }
    ]
  }
  ```
- **D-10:** `percentage` is **pre-computed server-side** (each category total / grand total × 100, rounded to 2 decimal places). Frontend uses it directly for Recharts `<Pie dataKey="percentage">`.
- **D-11:** "Trend" (REP-03) = **filtered summary snapshot** — no time-series bar chart. Applying a custom date range re-fetches the same `/api/analytics/summary` endpoint; the returned stats reflect that period.

### Claude's Discretion
- Pie chart color palette — assign distinct colors per category slice (Recharts accepts a `fill` prop per Cell). Use a simple hardcoded palette (6–8 colors cycling); category color from the DB (Phase 3) is a nice-to-have but not required.
- Summary card layout — three stat cards side-by-side (flex row) or stacked. Match inline-style pattern from prior phases.
- Empty state when no expenses in selected range — show "No expenses for this period" message + "Add Expense" link. Reuse `EmptyState` component.
- `monthly_avg` calculation — server decides: (total / number of distinct months in range). For single-month ranges, monthly_avg = total.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — REP-01 through REP-04 (the 4 requirements this phase must satisfy)
- `.planning/ROADMAP.md` — Phase 5 success criteria (4 criteria — all must be met)
- `.planning/PROJECT.md` — locked decisions: MySQL, JWT, API envelope `{success, data, message}`, ISO dates, ฿ symbol, v2-deferred features

### Existing Backend (read before planning API)
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros; analytics controller MUST use these
- `backend/routes/api.php` — add `GET analytics/summary` route inside the `auth:api` middleware group here
- `backend/database/migrations/` — expenses table (user_id, amount, category_id, date) and categories table (name) — analytics queries join these
- `CLAUDE.md` — constraints: MySQL only, response envelope, ISO dates

### Existing Frontend (read before planning UI)
- `frontend/src/api/client.ts` — axios client with Bearer token interceptor; analytics API call uses this client
- `frontend/src/App.tsx` — add `/analytics` route here, wrapped in `ProtectedRoute`; add nav link alongside Expenses
- `frontend/src/pages/AnalyticsPage.tsx` — stub to replace with full implementation
- `frontend/src/pages/ExpensesPage.tsx` + `frontend/src/components/FilterBar.tsx` — reference for filter bar + Apply button pattern (Phase 4 D-08)
- `frontend/src/components/EmptyState.tsx` — reuse for "No expenses for this period" state

### Phase 4 Context (established patterns to follow)
- `.planning/phases/04-expense-management/04-CONTEXT.md` — D-08 (Apply button pattern), D-14 (฿ symbol display), inline error pattern, minimal inline style

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/api/client.ts` — axios instance with JWT Bearer interceptor. Analytics GET call: `client.get('/analytics/summary', { params: { date_from, date_to } })`.
- `frontend/src/components/FilterBar.tsx` — collapsible filter bar with date inputs + Apply button. Phase 5 filter bar can follow the same structure or be a simplified inline variant (no collapse needed since analytics always shows the filter).
- `frontend/src/components/EmptyState.tsx` — empty state component. Reuse for "No expenses for this period."
- `frontend/src/components/InlineError.tsx` — for API error display on analytics page.
- Phase 2 `ProtectedRoute` component — wrap `/analytics` route.

### Established Patterns
- API response envelope: `{success, data, message}` — analytics endpoint follows without exception.
- Inline styles only (`fontFamily: 'sans-serif', padding: '2rem'`) — no CSS framework.
- Apply button for filter (not auto-apply) — consistent with Phase 4 FilterBar D-08.
- `฿` symbol on all amounts — consistent with Phase 4 D-14.
- ISO date params (`YYYY-MM-DD`) — consistent with CLAUDE.md constraint.

### Integration Points
- `backend/routes/api.php` — add inside `Route::middleware('auth:api')->group(...)`:
  ```php
  Route::get('analytics/summary', [AnalyticsController::class, 'summary']);
  ```
- `frontend/src/App.tsx` — add:
  - Route: `<Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />`
  - Nav link: `<Link to="/analytics">Analytics</Link>` alongside existing Expenses link
- Analytics query joins `expenses` + `categories` tables, filtered by `user_id` + `date BETWEEN date_from AND date_to`.

</code_context>

<specifics>
## Specific Ideas

- Recharts `<PieChart>` with `<Pie>` + `<Tooltip>` — tooltip content: `{name}: ฿{total} ({percentage}%)`.
- Pre-set button labels: **This Month** | **Last Month** | **Last 3 Months**. Clicking a pre-set populates from/to inputs AND triggers Apply automatically (exception to the Apply button rule — pre-sets are one-tap actions).

</specifics>

<deferred>
## Deferred Ideas

- Time-series bar chart (daily/weekly expense trend line) — user confirmed this is out of scope for v1. If needed, it's a future phase or v2 enhancement.
- Category color from DB used in pie chart slices — nice-to-have; Phase 5 uses a hardcoded palette.
- Export to CSV/PDF — explicitly deferred to v2 per CLAUDE.md.

</deferred>

---

*Phase: 5-Analytics & Reports*
*Context gathered: 2026-05-10*
