# Phase 5: Analytics & Reports - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 8 new/modified files
**Analogs found:** 7 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/app/Http/Controllers/Api/AnalyticsController.php` | controller | request-response | `backend/app/Http/Controllers/Api/ExpenseController.php` | exact |
| `backend/routes/api.php` | route config | request-response | `backend/routes/api.php` (existing pattern) | exact |
| `frontend/src/api/analytics.ts` | service | request-response | `frontend/src/api/expenses.ts` | exact |
| `frontend/src/types/analytics.ts` | model/types | — | `frontend/src/types/expense.ts` | exact |
| `frontend/src/pages/AnalyticsPage.tsx` | component/page | request-response | `frontend/src/pages/ExpensesPage.tsx` | exact |
| `frontend/src/components/AnalyticsFilterBar.tsx` | component | event-driven | `frontend/src/components/FilterBar.tsx` | role-match |
| `frontend/src/components/SummaryCards.tsx` | component | transform | `frontend/src/components/EmptyState.tsx` (inline style pattern) | partial |
| `frontend/src/components/CategoryPieChart.tsx` | component | transform | no analog (no chart component exists) | none |
| `frontend/src/App.tsx` | config | — | `frontend/src/App.tsx` (self) | exact |

---

## Pattern Assignments

### `backend/app/Http/Controllers/Api/AnalyticsController.php` (controller, request-response)

**Analog:** `backend/app/Http/Controllers/Api/ExpenseController.php`

**Imports pattern** (lines 1–11):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
```

**Additional imports needed** (not in ExpenseController — analytics-specific):
```php
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
```

**Auth/guard pattern** — user scoping (ExpenseController lines 24, 75, 85, 104):
```php
// Every query is scoped to the authenticated user — never omit this
->where('expenses.user_id', Auth::id())
// or for Eloquent:
Expense::query()->where('user_id', Auth::id())
```

**Validation pattern** (ExpenseController lines 16–22):
```php
$request->validate([
    'date_from' => ['sometimes', 'date_format:Y-m-d'],
    'date_to'   => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:date_from'],
]);
```

**Conditional whereDate filter pattern** (ExpenseController lines 29–33):
```php
if ($request->filled('date_from')) {
    $q->whereDate('expense_date', '>=', $request->input('date_from'));
}
if ($request->filled('date_to')) {
    $q->whereDate('expense_date', '<=', $request->input('date_to'));
}
```
**Critical:** The DB column is `expense_date`, NOT `date`. The `shape()` method in ExpenseController renames it to `date` only in the API response — use `expenses.expense_date` in all raw queries.

**DB aggregate query pattern** (no direct analog — use DB facade):
```php
$query = DB::table('expenses')
    ->join('categories', 'expenses.category_id', '=', 'categories.id')
    ->where('expenses.user_id', $userId)
    ->select('categories.id', 'categories.name', DB::raw('SUM(expenses.amount) AS category_total'));

$rows = $query->groupBy('categories.id', 'categories.name')
              ->orderByDesc('category_total')
              ->get();
```
**Critical:** Group by BOTH `categories.id` AND `categories.name` — MySQL `ONLY_FULL_GROUP_BY` (default in MySQL 8) rejects queries where selected non-aggregate columns are absent from GROUP BY.

**Response macro pattern** (ExpenseController lines 45–53, 70, 81, 114 — macro defined in AppServiceProvider lines 14–20):
```php
// success response — data + message
return response()->success($data, 'OK');

// error response — message + errors array + status code
return response()->error('Not found', [], 404);

// success with non-200 status
return response()->success($this->shape($expense), 'Created', 201);
```

**Response envelope shape** (AppServiceProvider lines 14–19):
```php
// response()->success() always produces:
{
  "success": true,
  "data": <payload>,
  "message": "OK"
}
```

---

### `backend/routes/api.php` (route config, modify)

**Analog:** `backend/routes/api.php` lines 25–39 (existing `auth:api` group)

**Existing protected group pattern** (lines 25–39):
```php
Route::middleware('auth:api')->group(function () {
    // Phase 3: Categories
    Route::get('categories', [CategoryController::class, 'index']);
    // ...
    // Phase 4: Expenses
    Route::get('expenses', [ExpenseController::class, 'index']);
    // ...
});
```

**Addition to make** — insert inside the `auth:api` group following the Phase 4 expense routes:
```php
// Phase 5: Analytics (REP-01 through REP-04)
Route::get('analytics/summary', [AnalyticsController::class, 'summary']);
```

**Import to add** at top of file (following the existing use-statement pattern, lines 3–5):
```php
use App\Http\Controllers\Api\AnalyticsController;
```

---

### `frontend/src/api/analytics.ts` (service, request-response)

**Analog:** `frontend/src/api/expenses.ts`

**Imports pattern** (expenses.ts lines 1–2):
```ts
import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
```

**For analytics.ts — adapted imports:**
```ts
import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';   // reuse existing envelope type
import type { AnalyticsSummary } from '../types/analytics';
```

**Core API call pattern** (expenses.ts lines 12–13) — GET with query params + envelope unwrap:
```ts
const res = await apiClient.get<ApiEnvelope<ExpenseListResponse>>('/expenses', { params });
return res.data.data;
```

**Analytics function to implement:**
```ts
export async function getAnalyticsSummary(
  date_from: string,
  date_to: string
): Promise<AnalyticsSummary> {
  const res = await apiClient.get<ApiEnvelope<AnalyticsSummary>>(
    '/analytics/summary',
    { params: { date_from, date_to } }
  );
  return res.data.data;
}
```

---

### `frontend/src/types/analytics.ts` (model/types)

**Analog:** `frontend/src/types/expense.ts`

**Interface declaration pattern** (expense.ts lines 1–11):
```ts
export interface Expense {
  id: number;
  amount: number;
  currency: 'THB';
  // ...
  date: string;        // YYYY-MM-DD
}
```

**`ApiEnvelope` is already defined in `frontend/src/types/expense.ts` lines 34–39** — do not redeclare it. Import from there:
```ts
// In analytics.ts — types only, no re-export of ApiEnvelope
export interface CategoryBreakdown {
  name: string;
  total: number;
  percentage: number;
}

export interface AnalyticsSummary {
  date_from: string | null;
  date_to: string | null;
  total: number;
  daily_avg: number;
  monthly_avg: number;
  category_breakdown: CategoryBreakdown[];
}
```

---

### `frontend/src/pages/AnalyticsPage.tsx` (component/page, request-response)

**Analog:** `frontend/src/pages/ExpensesPage.tsx`

**This file is a stub replacement** — current content (AnalyticsPage.tsx lines 1–8) is a 7-line placeholder.

**Page-level state pattern** (ExpensesPage.tsx lines 13–21):
```ts
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
// analytics equivalent:
const [data, setData] = useState<AnalyticsSummary | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Fetch-on-filter pattern** (ExpensesPage.tsx lines 27–35):
```ts
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  listExpenses(appliedFilters)
    .then(r => { if (!cancelled) { setItems(r.items); setMeta(r.meta); setError(null); } })
    .catch(() => { if (!cancelled) setError('Failed to load expenses. Please try again.'); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [appliedFilters]);
```
**Analytics variant** — simpler (no cancellation complexity needed for single-value state, but the pattern is the same):
```ts
const fetchData = (from: string, to: string) => {
  setLoading(true);
  setError(null);
  getAnalyticsSummary(from, to)
    .then(d => setData(d))
    .catch(() => setError('Failed to load analytics. Please try again.'))
    .finally(() => setLoading(false));
};

useEffect(() => {
  fetchData(defaultFrom, defaultTo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**Page container inline style pattern** (ExpensesPage.tsx line 46):
```tsx
<div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: '24px', paddingBottom: 48 }}>
```

**Page header pattern** (ExpensesPage.tsx lines 47–63):
```tsx
<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
  <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>Expenses</h1>
  {/* right-side action */}
</header>
```

**Error display pattern** (ExpensesPage.tsx line 75):
```tsx
{error && <p style={{ color: '#C0392B', fontSize: 14 }}>{error}</p>}
```

**Loading display pattern** (ExpensesPage.tsx line 74):
```tsx
{loading && <p style={{ color: '#7A7064', fontSize: 15 }}>Loading expenses...</p>}
```

**Nav pattern note:** App.tsx (lines 1–29) has NO shared `<Nav>` component — each page has an inline header. AnalyticsPage must add its own nav row with links to `/expenses` and `/analytics`. Do NOT create a shared Nav component. Match the inline `<header>` style from ExpensesPage.tsx lines 47–63.

**Empty state pattern** (ExpensesPage.tsx line 76 + EmptyState.tsx):
```tsx
{!loading && !error && items.length === 0 && <EmptyState filtered={isFiltered} />}
```
**Analytics variant** — gate on `category_breakdown.length === 0`, NOT `total === 0`:
```tsx
{!loading && !error && data && data.category_breakdown.length === 0 && (
  // inline empty state: "No expenses for this period" + Link to /expenses/new
)}
```

---

### `frontend/src/components/AnalyticsFilterBar.tsx` (component, event-driven)

**Analog:** `frontend/src/components/FilterBar.tsx`

**Note from RESEARCH.md:** RESEARCH.md recommends that `AnalyticsFilterBar`, `SummaryCards`, and `CategoryPieChart` be defined as **local sub-components within `AnalyticsPage.tsx`** rather than separate files — consistent with how prior phases kept page-specific UI colocated. If the planner chooses to extract them to separate files, use the patterns below. If colocated, define them above the `AnalyticsPage` default export in the same file.

**Props interface pattern** (FilterBar.tsx lines 5–11):
```ts
interface FilterBarProps {
  open: boolean;
  onToggle: () => void;
  filters: ExpenseFilters;
  onApply: (f: ExpenseFilters) => void;
  categories: Category[];
}
```
**Analytics filter bar variant** — simpler (always visible, no collapse, no category/amount filters):
```ts
interface AnalyticsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onApply: () => void;
}
```

**Draft state + Apply button pattern** (FilterBar.tsx lines 14–18, 112–127):
```ts
// FilterBar uses a draft state that only commits on Apply click
const [draft, setDraft] = useState<ExpenseFilters>(filters);
const handleApply = () => { onApply(draft); };
```

**Apply button style** (FilterBar.tsx lines 113–127) — copy exactly:
```tsx
<button
  onClick={handleApply}
  style={{
    padding: '8px 16px',
    background: 'oklch(48% 0.10 195)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  }}
>
  Apply
</button>
```

**Date input style** (FilterBar.tsx lines 56–61):
```tsx
<input
  type="date"
  value={draft.date_from ?? ''}
  onChange={(e) => setDraft(d => ({ ...d, date_from: e.target.value || undefined }))}
  style={{ display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
/>
```

**Filter container style** (FilterBar.tsx lines 44–52):
```tsx
<div style={{
  background: '#EDE7DA',
  padding: 16,
  borderRadius: 12,
  marginTop: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}}>
```

**Preset button pattern** — no direct analog (new for Phase 5). Use the same button style as FilterBar "Clear" button (FilterBar.tsx lines 128–142) but with the primary teal color for active preset:
```tsx
// Inactive preset: muted background
style={{ padding: '6px 12px', background: '#EDE7DA', color: '#7A7064', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}

// Active preset: teal (same as Apply)
style={{ padding: '6px 12px', background: 'oklch(48% 0.10 195)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}
```

---

### `frontend/src/components/SummaryCards.tsx` (component, transform)

**Analog:** `frontend/src/components/EmptyState.tsx` (inline style and structure pattern)

**Note:** No stat-card component exists in the codebase. Use inline styles consistent with the rest of the project.

**EmptyState inline style reference** (EmptyState.tsx lines 9–31):
```tsx
<div style={{ padding: '48px 24px', textAlign: 'center' }}>
  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', marginBottom: 12 }}>...</h2>
  <p style={{ fontSize: 15, fontWeight: 400, color: '#7A7064', marginBottom: 24 }}>...</p>
</div>
```

**SummaryCards pattern to implement** (three cards, flex row, inline styles only):
```tsx
// Three stat cards side-by-side — amounts use ฿ symbol (D-14)
<div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
  {/* Each card */}
  <div style={{ flex: 1, minWidth: 120, background: '#EDE7DA', borderRadius: 12, padding: '16px 20px' }}>
    <p style={{ fontSize: 12, color: '#7A7064', margin: '0 0 4px' }}>Total</p>
    <p style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>฿{total.toFixed(2)}</p>
  </div>
</div>
```

**Amount formatting rule** (from CLAUDE.md + Phase 4 D-14): always prefix with `฿`, always `.toFixed(2)`.

---

### `frontend/src/components/CategoryPieChart.tsx` (component, transform)

**Analog:** None — no chart component exists in the codebase.

**Use RESEARCH.md Pattern 2 as the implementation reference** (05-RESEARCH.md lines 244–281). Key points extracted:

**Recharts import pattern:**
```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
```

**Color palette** (hardcoded Tableau 10 — Claude's discretion):
```tsx
const COLORS = ['#4E79A7','#F28E2B','#59A14F','#E15759','#76B7B2','#EDC948','#B07AA1','#FF9DA7'];
```

**Pie dataKey rule** (D-10): use `dataKey="percentage"` NOT `dataKey="total"`. The pie slice visual proportion must be driven by the server-computed `percentage` field.

**Tooltip formatter** — three arguments required (Pitfall 2 in RESEARCH.md):
```tsx
<Tooltip
  formatter={(value: number, name: string, props: { payload: CategoryBreakdown }) =>
    [`฿${props.payload.total.toFixed(2)} (${value}%)`, name]
  }
/>
```

**No `<Legend>` — D-02 explicitly forbids it.**

**ResponsiveContainer** wraps PieChart (never manual resize):
```tsx
<ResponsiveContainer width="100%" height={280}>
  <PieChart>
    <Pie data={data} dataKey="percentage" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
      {data.map((_, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip formatter={...} />
  </PieChart>
</ResponsiveContainer>
```

---

### `frontend/src/App.tsx` (config, modify)

**Analog:** `frontend/src/App.tsx` (self — pattern already exists)

**Current state** (App.tsx lines 8, 25): `AnalyticsPage` is already imported and the `/analytics` route is already registered with `RequireAuth`. **No route changes needed.**

**Existing route registration to verify** (App.tsx line 25):
```tsx
<Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
```

**RequireAuth pattern** (App.tsx lines 10–12):
```tsx
function RequireAuth({ children }: { children: React.ReactElement }) {
  return localStorage.getItem('auth_token') ? children : <Navigate to="/auth" replace />;
}
```

**Nav link pattern** (App.tsx has no shared nav — see Pitfall 4 in RESEARCH.md). The only App.tsx change needed is confirming the route exists. Nav links are added inline to AnalyticsPage and ExpensesPage headers, not here.

---

## Shared Patterns

### Response Macro (backend)
**Source:** `backend/app/Providers/AppServiceProvider.php` lines 14–28
**Apply to:** `AnalyticsController.php`
```php
// Success — always use this, never return Response::json() directly
response()->success($data, 'OK')          // → { success: true, data: $data, message: 'OK' }
response()->success($data, 'Created', 201) // → same with HTTP 201
response()->error('Not found', [], 404)   // → { success: false, message: '...', errors: [] }
```

### User Scoping (backend)
**Source:** `backend/app/Http/Controllers/Api/ExpenseController.php` lines 24, 75, 85, 104
**Apply to:** `AnalyticsController.php` — every DB query path
```php
->where('expenses.user_id', Auth::id())
```
This is the primary security control for analytics. The query touches all of a user's expense data — never omit this scope.

### ApiEnvelope Unwrap (frontend)
**Source:** `frontend/src/api/expenses.ts` lines 12–13 + `frontend/src/types/expense.ts` lines 34–39
**Apply to:** `frontend/src/api/analytics.ts`
```ts
// Pattern: get<ApiEnvelope<T>>(...) then return res.data.data
const res = await apiClient.get<ApiEnvelope<AnalyticsSummary>>('/analytics/summary', { params });
return res.data.data;
```

### Inline Style Tokens (frontend)
**Source:** `frontend/src/pages/ExpensesPage.tsx`, `frontend/src/components/FilterBar.tsx`, `frontend/src/components/EmptyState.tsx`
**Apply to:** All new frontend components
```
Background page:    #F4EFE6
Card/panel:         #EDE7DA
Primary text:       #1F1B16
Secondary text:     #7A7064
Error text:         #C0392B
Primary action:     oklch(48% 0.10 195)   ← teal (Apply button, Add Expense link)
Border:             1px solid rgba(31,27,22,0.1)
Border radius card: 12px
Border radius input: 6px
Font family:        sans-serif
฿ symbol:           always prefix amounts, always .toFixed(2)
```

### Loading / Error / Empty State (frontend)
**Source:** `frontend/src/pages/ExpensesPage.tsx` lines 74–76
**Apply to:** `frontend/src/pages/AnalyticsPage.tsx`
```tsx
{loading && <p style={{ color: '#7A7064', fontSize: 15 }}>Loading...</p>}
{error && <p style={{ color: '#C0392B', fontSize: 14 }}>{error}</p>}
{/* empty: gate on data.category_breakdown.length === 0, NOT data.total === 0 */}
```

### ISO Date Constraint
**Source:** `CLAUDE.md` + ExpenseController lines 17–18
**Apply to:** All date params in AnalyticsController validation and AnalyticsFilterBar inputs
```php
// Backend validation
'date_from' => ['sometimes', 'date_format:Y-m-d'],
```
```ts
// Frontend — all date strings must be YYYY-MM-DD
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `frontend/src/components/CategoryPieChart.tsx` | component | transform | No chart component exists anywhere in the codebase — first Recharts usage. Use RESEARCH.md Pattern 2 (lines 244–281) as the implementation reference. |

---

## Key Constraints Captured

1. **`expense_date` not `date`** — the DB column is `expenses.expense_date`. The `shape()` method in ExpenseController renames it to `date` only in API responses. All raw SQL queries must use `expense_date`.
2. **GROUP BY both columns** — `->groupBy('categories.id', 'categories.name')` — MySQL 8 `ONLY_FULL_GROUP_BY` requires all non-aggregate SELECTed columns to appear in GROUP BY.
3. **`dataKey="percentage"` not `"total"`** — D-10 requires server-computed percentages drive the pie visual proportion.
4. **No `<Legend>`** — D-02 explicitly forbids Recharts Legend component.
5. **Apply button, not auto-apply** — D-07; no API call on date input `onChange`.
6. **Empty state gates on `category_breakdown.length === 0`** — not on `total === 0`.
7. **recharts not yet installed** — `npm install recharts` is a required Wave 1 step before any frontend tasks.
8. **No shared Nav component** — App.tsx has no persistent nav bar. Each page has its own inline header. Add nav links inline to AnalyticsPage header only.

---

## Metadata

**Analog search scope:** `backend/app/Http/Controllers/Api/`, `backend/routes/`, `frontend/src/api/`, `frontend/src/types/`, `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/App.tsx`, `backend/app/Providers/`
**Files scanned:** 10 source files read directly
**Pattern extraction date:** 2026-05-10
