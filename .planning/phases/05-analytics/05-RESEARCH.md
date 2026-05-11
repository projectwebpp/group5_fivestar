# Phase 5: Analytics & Reports - Research

**Researched:** 2026-05-10
**Domain:** Laravel aggregate SQL + Recharts PieChart + React date-range filter
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Recharts for the pie chart. Install `recharts` via npm.
- **D-02:** Pie chart shows Recharts built-in Tooltip on hover/tap: category name + amount (฿) + percentage. No static legend.
- **D-03:** Add `Analytics` as a new top-nav link alongside `Expenses`. Route: `/analytics`. Wrap in `ProtectedRoute`.
- **D-04:** Analytics page is a single scrollable page. Section order top to bottom: (1) date range filter bar, (2) summary cards, (3) pie chart.
- **D-05:** Page opens with current month pre-selected (first day of current month → today).
- **D-06:** Filter bar provides pre-set buttons (This Month / Last Month / Last 3 Months) plus custom date from/to inputs. Clicking a pre-set populates the from/to inputs.
- **D-07:** Filter applies via Apply button — consistent with Phase 4 FilterBar. No auto-apply on change.
- **D-08:** Single endpoint: `GET /api/analytics/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`. Inside `auth:api` middleware group.
- **D-09:** Response envelope `{success, data, message}` with `data` shape: `{ date_from, date_to, total, daily_avg, monthly_avg, category_breakdown: [{ name, total, percentage }] }`.
- **D-10:** `percentage` is pre-computed server-side (each category total / grand total × 100, rounded to 2 decimal places). Frontend uses it directly as Recharts `dataKey`.
- **D-11:** "Trend" (REP-03) = filtered summary snapshot — same `/api/analytics/summary` endpoint, no time-series bar chart.

### Claude's Discretion
- Pie chart color palette — hardcoded 8-color Tableau 10 palette, cycling. Category color from DB is a nice-to-have, not required.
- Summary card layout — three stat cards flex row or stacked. Match inline-style pattern from prior phases.
- Empty state when no expenses in selected range — show "No expenses for this period" + "Add Expense" link. Reuse EmptyState pattern but inline variant.
- `monthly_avg` calculation — server decides: total / number of distinct months in range. For single-month ranges, monthly_avg = total.

### Deferred Ideas (OUT OF SCOPE)
- Time-series bar chart (daily/weekly trend line) — out of scope for v1.
- Category color from DB in pie chart slices — nice-to-have only.
- Export to CSV/PDF — explicitly deferred to v2 per CLAUDE.md.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REP-01 | User can view monthly total expense summary (total + by category) | Covered by `GET /api/analytics/summary` returning `total` + `category_breakdown`; SummaryCards + CategoryPieChart components |
| REP-02 | User can view expense breakdown by category (pie chart data) | Covered by `category_breakdown` array + Recharts `<PieChart>` with `<Cell>` per slice |
| REP-03 | User can filter expenses by custom date range for trend view | Covered by `date_from`/`date_to` query params on single summary endpoint; AnalyticsFilterBar with Apply button |
| REP-04 | User can view daily and monthly average expense calculations | Covered by `daily_avg` and `monthly_avg` fields in API response; displayed in SummaryCards |
</phase_requirements>

---

## Summary

Phase 5 adds a single analytics page consuming one new backend endpoint. The backend work is a Laravel controller method that runs a MySQL aggregate query joining `expenses` and `categories` tables, filtered by `user_id` and `expense_date` range, returning totals, averages, and a per-category breakdown. The frontend work is replacing the stub `AnalyticsPage.tsx` with a full implementation: a date-range filter bar, three summary stat cards, and a Recharts pie chart.

The codebase is in clean shape for this phase. The `/analytics` route is already registered in `App.tsx` (line 25), `AnalyticsPage` is already imported, and `RequireAuth` is already applied. The backend `auth:api` middleware group in `api.php` is the correct insertion point. No migrations are required — the existing `expenses` table (with `user_id`, `amount`, `category_id`, `expense_date`) and `categories` table (with `user_id`, `name`) have all the columns the analytics query needs.

The primary new dependency is `recharts` — confirmed NOT yet installed in `frontend/package.json`. Version 3.8.1 is current (published 2026-03-25). The Recharts API is stable: `<ResponsiveContainer>`, `<PieChart>`, `<Pie dataKey="percentage">`, `<Cell fill={color}>`, and `<Tooltip formatter={...}>` are all verified patterns.

**Primary recommendation:** Build backend first (AnalyticsController + route), test via curl/Postman, then build frontend as a single self-contained `AnalyticsPage.tsx` plus a `frontend/src/api/analytics.ts` module and a `frontend/src/types/analytics.ts` type file.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Aggregate totals + averages | API / Backend | — | MySQL SUM/COUNT/GROUP BY query; server owns computation |
| Per-category percentage | API / Backend | — | D-10 explicitly server-side; avoids float rounding drift on client |
| Date-range filter params | Browser / Client | API / Backend | Client computes preset date strings; server applies WHERE clause |
| Pie chart rendering | Browser / Client | — | Recharts is a client-side React library |
| JWT auth guard | API / Backend + Frontend | — | `auth:api` middleware on backend; `RequireAuth` wrapper on frontend |
| Monthly avg calculation | API / Backend | — | Requires counting distinct months in range; not safe to delegate to frontend |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | Pie chart rendering | Locked by D-01; React-native, declarative SVG, no D3 knowledge required |
| axios (existing) | ^1.16.0 | Analytics API call | Already in project; `apiClient` has JWT interceptor |
| Laravel Eloquent + DB facade | (project version) | Aggregate query | Existing ORM pattern; `DB::table()` or raw query for GROUP BY |

[VERIFIED: npm registry] recharts 3.8.1, published 2026-03-25.
[VERIFIED: frontend/package.json] recharts is NOT currently installed.
[VERIFIED: Context7 /recharts/recharts] PieChart, Pie, Cell, ResponsiveContainer, Tooltip patterns confirmed.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-router-dom (existing) | ^7.15.0 | `/analytics` route (already wired) | Route already registered in App.tsx — no new work |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js / victory | Locked by D-01 — not applicable |
| DB::table() raw aggregate | Eloquent relationships + collection math | Raw query is cleaner for multi-table GROUP BY aggregate; Eloquent works too but requires eager loading all expenses into memory |

**Installation (Wave 1 task):**
```bash
cd frontend && npm install recharts
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (user selects date range)
        │
        │  GET /api/analytics/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
        │  Authorization: Bearer <jwt>
        ▼
Laravel Router (api.php)
  └─ Route::middleware('auth:api') group
        │
        ▼
AnalyticsController@summary
  ├─ Validate: date_from, date_to (date_format:Y-m-d, optional)
  ├─ Auth::id() → scope to current user
  ├─ MySQL aggregate query:
  │     SELECT categories.name,
  │            SUM(expenses.amount) AS category_total
  │     FROM expenses
  │     JOIN categories ON expenses.category_id = categories.id
  │     WHERE expenses.user_id = ?
  │       AND expenses.expense_date BETWEEN ? AND ?
  │     GROUP BY categories.id, categories.name
  │     ORDER BY category_total DESC
  ├─ Compute: grand total, daily_avg, monthly_avg, percentage per category
  └─ response()->success($data)
        │
        ▼
Frontend apiClient (axios + Bearer interceptor)
  └─ analytics.ts: getAnalyticsSummary(date_from, date_to)
        │
        ▼
AnalyticsPage.tsx (state: loading / error / data)
  ├─ AnalyticsFilterBar (preset buttons + date inputs + Apply)
  ├─ SummaryCards (Total | Daily Avg | Monthly Avg)
  └─ CategoryPieChart (ResponsiveContainer → PieChart → Pie → Cell[])
                                                            └─ Tooltip (formatter)
```

### Recommended Project Structure (new files only)

```
backend/
└── app/Http/Controllers/Api/
    └── AnalyticsController.php     # new — summary() method

frontend/src/
├── api/
│   └── analytics.ts                # new — getAnalyticsSummary()
├── types/
│   └── analytics.ts                # new — AnalyticsSummary, CategoryBreakdown types
└── pages/
    └── AnalyticsPage.tsx           # replace stub — full implementation
```

No new components needed as standalone files — `AnalyticsFilterBar`, `SummaryCards`, `CategoryPieChart`, and `AnalyticsEmptyState` can all be defined as local sub-components within `AnalyticsPage.tsx`, consistent with how prior phases kept page-specific UI colocated.

### Pattern 1: Laravel Aggregate Query (analytics controller)

The key is using `DB::table()` for the GROUP BY aggregate rather than loading all Expense models and computing in PHP — especially important at scale.

```php
// Source: verified against ExpenseController.php patterns + Laravel docs
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

public function summary(Request $request)
{
    $request->validate([
        'date_from' => ['sometimes', 'date_format:Y-m-d'],
        'date_to'   => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:date_from'],
    ]);

    $userId   = Auth::id();
    $dateFrom = $request->input('date_from');
    $dateTo   = $request->input('date_to');

    $query = DB::table('expenses')
        ->join('categories', 'expenses.category_id', '=', 'categories.id')
        ->where('expenses.user_id', $userId)
        ->select('categories.name', DB::raw('SUM(expenses.amount) AS category_total'));

    if ($dateFrom) {
        $query->whereDate('expenses.expense_date', '>=', $dateFrom);
    }
    if ($dateTo) {
        $query->whereDate('expenses.expense_date', '<=', $dateTo);
    }

    $rows  = $query->groupBy('categories.id', 'categories.name')
                   ->orderByDesc('category_total')
                   ->get();

    $total = $rows->sum('category_total');

    // daily_avg: total / number of days in range (fallback: 1)
    $days = 1;
    if ($dateFrom && $dateTo) {
        $days = max(1, \Carbon\Carbon::parse($dateFrom)->diffInDays(\Carbon\Carbon::parse($dateTo)) + 1);
    }

    // monthly_avg: total / distinct months spanned (fallback: 1)
    $months = 1;
    if ($dateFrom && $dateTo) {
        $start  = \Carbon\Carbon::parse($dateFrom)->startOfMonth();
        $end    = \Carbon\Carbon::parse($dateTo)->startOfMonth();
        $months = max(1, $start->diffInMonths($end) + 1);
    }

    $breakdown = $rows->map(fn($r) => [
        'name'       => $r->name,
        'total'      => (float) $r->category_total,
        'percentage' => $total > 0
            ? round((float) $r->category_total / $total * 100, 2)
            : 0.0,
    ])->all();

    return response()->success([
        'date_from'          => $dateFrom,
        'date_to'            => $dateTo,
        'total'              => (float) $total,
        'daily_avg'          => round((float) $total / $days, 2),
        'monthly_avg'        => round((float) $total / $months, 2),
        'category_breakdown' => $breakdown,
    ], 'OK');
}
```

[VERIFIED: codebase] Pattern matches `ExpenseController` use of `Auth::id()`, `response()->success()`, `whereDate()`.
[VERIFIED: Context7 Laravel docs] `DB::table()->join()->groupBy()->get()` is standard Laravel query builder pattern.

### Pattern 2: Recharts PieChart with Cell colors and Tooltip formatter

```tsx
// Source: Context7 /recharts/recharts — verified PieChart + Cell + Tooltip formatter pattern
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#4E79A7','#F28E2B','#59A14F','#E15759','#76B7B2','#EDC948','#B07AA1','#FF9DA7'];

interface CategoryBreakdown {
  name: string;
  total: number;
  percentage: number;
}

function CategoryPieChart({ data }: { data: CategoryBreakdown[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="percentage"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={110}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: { payload: CategoryBreakdown }) =>
            [`฿${props.payload.total.toFixed(2)} (${value}%)`, name]
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

[VERIFIED: Context7 /recharts/recharts] `PieChart`, `Pie`, `Cell`, `Tooltip formatter` prop pattern confirmed in docs.

### Pattern 3: Analytics API client module

```ts
// frontend/src/api/analytics.ts
// Source: mirrors expenses.ts pattern [VERIFIED: codebase]
import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
import type { AnalyticsSummary } from '../types/analytics';

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

### Pattern 4: TypeScript type definition for analytics response

```ts
// frontend/src/types/analytics.ts
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

### Pattern 5: Date preset computation

```ts
// Preset helpers — pure date arithmetic, no library needed
function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getThisMonth(): { from: string; to: string } {
  const now = new Date();
  return {
    from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toISO(now),
  };
}

function getLastMonth(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last  = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toISO(first), to: toISO(last) };
}

function getLast3Months(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return { from: toISO(first), to: toISO(now) };
}
```

[ASSUMED] No external date library — plain JS Date arithmetic is sufficient for these three simple preset calculations.

### Anti-Patterns to Avoid

- **Computing percentage client-side:** D-10 requires server-computed `percentage`. Do not recalculate `entry.total / total * 100` in the frontend — use `entry.percentage` directly as Recharts `dataKey`.
- **Adding `<Legend>` to Recharts:** D-02 — tooltip only. `<Legend>` must not be added.
- **Using `<Pie dataKey="total">` instead of `dataKey="percentage"`:** The pie visual proportion must be driven by `percentage` (pre-computed), not raw `total`. Both fields exist on the data object; use the right one.
- **Auto-apply on filter change:** D-07 requires Apply button. Do not fire the API call on date input `onChange`.
- **Fetching analytics on initial render without default dates:** The page must initialize `date_from`/`date_to` to "This Month" before the first API call (D-05).
- **Loading `category_breakdown` into `DB::select()` raw SQL without user_id scoping:** Always scope to `expenses.user_id = Auth::id()` to prevent data leakage across users.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG pie chart rendering | Custom `<svg>` arc math | `recharts` PieChart + Cell | Arc angle math, responsive sizing, tooltip positioning are complex; Recharts handles all of it |
| Tooltip hover state | Manual mouseover event tracking | Recharts built-in `<Tooltip>` | Recharts manages active segment, positioning, and keyboard accessibility internally |
| Responsive chart container | Manual `ResizeObserver` | `<ResponsiveContainer width="100%">` | Built-in Recharts component; handles resize events correctly |
| SQL date-range aggregate | PHP collection filtering after loading all expenses | `DB::table()->whereDate()->groupBy()` | Loading all expense records into memory for PHP arithmetic fails at scale; push to MySQL |

**Key insight:** Recharts converts the percentage/total array into SVG arc paths via D3 math internally. The app only needs to pass the data array and color palette — zero geometry code required.

---

## Common Pitfalls

### Pitfall 1: `expense_date` column name (not `date`)

**What goes wrong:** The Expense model maps the `expense_date` DB column to `date` in the API response (via `shape()` in ExpenseController). But the actual DB column is `expense_date`. When writing the analytics SQL query, use `expenses.expense_date` (the DB column), not `expenses.date`.

**Why it happens:** The `shape()` method in ExpenseController renames `expense_date` → `date` for the API response. New controller authors forget this and write `->whereDate('expenses.date', ...)` which fails silently (MySQL returns no results because the column doesn't exist — it throws an error).

**How to avoid:** Always use `expenses.expense_date` in all DB queries. Confirmed in migration `2026_01_01_000002_create_expenses_table.php` line: `$table->date('expense_date')`.

**Warning signs:** Analytics returns `total: 0` for a date range that clearly has expenses. Check the SQL column name first.

[VERIFIED: codebase] migration + ExpenseController `shape()` method cross-referenced.

### Pitfall 2: Recharts Tooltip `formatter` receives `payload` as third argument (props object)

**What goes wrong:** The Tooltip `formatter` signature is `(value, name, props)`. To access the raw `total` field (for `฿{total}` display), you need `props.payload.total`. Beginners write `(value, name) => ...` and try to access `total` from closure, losing per-slice data.

**Why it happens:** Recharts docs show simple two-arg `formatter` examples. The third `props` argument containing the full data entry is documented but easy to miss.

**How to avoid:** Use `formatter={(value, name, props) => [`฿${props.payload.total.toFixed(2)} (${value}%)`, name]}` — three arguments.

[VERIFIED: Context7 /recharts/recharts] formatter three-argument pattern confirmed.

### Pitfall 3: `category_breakdown` empty array vs zero total — empty state logic

**What goes wrong:** When the user has no expenses in the selected range, the API returns `total: 0` and `category_breakdown: []`. The frontend must show the empty state. If the check is `if (data.total === 0)` instead of `if (data.category_breakdown.length === 0)`, it fails for a legitimate edge case where total could be zero due to data issues.

**Why it happens:** The D-10 design in 05-CONTEXT.md: "Stat cards still shown with ฿0.00 values when total === 0 but array empty — ONLY show AnalyticsEmptyState when API returns empty category_breakdown."

**How to avoid:** Gate the empty state on `data.category_breakdown.length === 0`, not on `data.total === 0`. Show stat cards with ฿0.00 values alongside the empty state message.

[VERIFIED: 05-UI-SPEC.md] Empty state section explicitly documents this distinction.

### Pitfall 4: App.tsx nav — no shared nav component exists

**What goes wrong:** The 05-CONTEXT.md D-03 says "Add Analytics as a new top-nav link alongside Expenses." The 05-UI-SPEC.md notes: "If the existing authenticated pages do NOT share a nav bar component, AnalyticsPage gets the same inline header pattern."

**Why it happens:** `App.tsx` (verified) has no shared `<Nav>` component — it only provides routing. Each page renders its own `<h1>` header inline (confirmed in ExpensesPage.tsx). There is no persistent nav bar to add a link to.

**How to avoid:** The "Analytics nav link" requirement (D-03) means the AnalyticsPage must include a way to navigate back to Expenses (e.g., a back link or a small nav row at the top), and the ExpensesPage should similarly link to Analytics. The simplest consistent approach: add a small top nav row to AnalyticsPage matching the ExpensesPage header style, with links to both `/expenses` and `/analytics`. Do NOT create a shared Nav component (scope creep — not asked for). Just add the link where needed.

[VERIFIED: codebase] App.tsx lines 1-29 — no shared Nav component; each page is standalone.

### Pitfall 5: MySQL `GROUP BY` strict mode — all selected columns must be in GROUP BY or aggregates

**What goes wrong:** MySQL 5.7+ with `ONLY_FULL_GROUP_BY` mode (default) rejects queries that SELECT non-aggregated columns not in the GROUP BY clause. Selecting `categories.id, categories.name` but grouping only by `categories.name` causes an error.

**Why it happens:** Common when developers write `groupBy('categories.name')` but also select `categories.id` or forget to include all non-aggregate columns.

**How to avoid:** Group by both `categories.id` AND `categories.name`: `->groupBy('categories.id', 'categories.name')`. This is safe because `categories.id` is the primary key — each `id` has exactly one `name`.

[VERIFIED: codebase] ExpenseController uses `->where()` scoping correctly; GroupBy strict mode is a known MySQL 8 behavior.
[ASSUMED] The deployed MySQL instance has `ONLY_FULL_GROUP_BY` enabled (it is on by default in MySQL 5.7+/8.0).

---

## Code Examples

### Complete AnalyticsController skeleton

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function summary(Request $request)
    {
        $request->validate([
            'date_from' => ['sometimes', 'date_format:Y-m-d'],
            'date_to'   => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $userId   = Auth::id();
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        $query = DB::table('expenses')
            ->join('categories', 'expenses.category_id', '=', 'categories.id')
            ->where('expenses.user_id', $userId)
            ->select('categories.id', 'categories.name', DB::raw('SUM(expenses.amount) AS category_total'));

        if ($dateFrom) {
            $query->whereDate('expenses.expense_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('expenses.expense_date', '<=', $dateTo);
        }

        $rows  = $query->groupBy('categories.id', 'categories.name')
                       ->orderByDesc('category_total')
                       ->get();

        $total = (float) $rows->sum('category_total');

        // Daily average
        $days = 1;
        if ($dateFrom && $dateTo) {
            $days = max(1, Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1);
        }

        // Monthly average
        $months = 1;
        if ($dateFrom && $dateTo) {
            $start  = Carbon::parse($dateFrom)->startOfMonth();
            $end    = Carbon::parse($dateTo)->startOfMonth();
            $months = max(1, $start->diffInMonths($end) + 1);
        }

        $breakdown = $rows->map(fn($r) => [
            'name'       => $r->name,
            'total'      => (float) $r->category_total,
            'percentage' => $total > 0
                ? round((float) $r->category_total / $total * 100, 2)
                : 0.0,
        ])->all();

        return response()->success([
            'date_from'          => $dateFrom,
            'date_to'            => $dateTo,
            'total'              => $total,
            'daily_avg'          => round($total / $days, 2),
            'monthly_avg'        => round($total / $months, 2),
            'category_breakdown' => $breakdown,
        ], 'OK');
    }
}
```

### Route registration (api.php addition)

```php
// Source: backend/routes/api.php — add inside Route::middleware('auth:api')->group()
use App\Http\Controllers\Api\AnalyticsController;

Route::get('analytics/summary', [AnalyticsController::class, 'summary']);
```

### AnalyticsPage.tsx skeleton (state management pattern)

```tsx
// Source: mirrors ExpensesPage.tsx pattern [VERIFIED: codebase]
import { useEffect, useState } from 'react';
import { getAnalyticsSummary } from '../api/analytics';
import type { AnalyticsSummary } from '../types/analytics';

// ... sub-components defined here or imported ...

export default function AnalyticsPage() {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const defaultTo = today.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo,   setDateTo]   = useState(defaultTo);
  const [activePreset, setActivePreset] = useState<string | null>('this-month');
  const [data,    setData]    = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = (from: string, to: string) => {
    setLoading(true);
    setError(null);
    getAnalyticsSummary(from, to)
      .then(d => { setData(d); })
      .catch(() => setError('Failed to load analytics. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(defaultFrom, defaultTo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => fetchData(dateFrom, dateTo);

  // ... render AnalyticsFilterBar, SummaryCards, CategoryPieChart ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<Pie dataKey="value">` with client-computed percentages | `<Pie dataKey="percentage">` with server-computed percentages (D-10) | Phase 5 design decision | Consistent rounding; no float drift between tooltip % and pie slice size |
| Shared nav component | Per-page inline header (existing project pattern) | Phase 1 scaffold | No refactor needed; just add nav links inline to AnalyticsPage |

**Deprecated/outdated:**
- Recharts v1/v2 API: older docs show `dataKey="value"` on Pie — still works but this project uses `percentage` as the display proportion value. Use `dataKey="percentage"` to match D-10.

---

## Runtime State Inventory

> Greenfield addition phase — no rename/refactor. Section not applicable.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | `npm install recharts` | ✓ | (project already uses npm) | — |
| recharts | Pie chart component | ✗ (not in package.json) | — | None — must install |
| MySQL | Analytics aggregate query | ✓ (existing project DB) | MySQL 8 assumed | — |
| Laravel + Carbon | Date arithmetic in controller | ✓ (existing project) | (project version) | — |

**Missing dependencies with no fallback:**
- `recharts` — must be installed via `npm install recharts` before frontend wave tasks. This is a Wave 1 / first-task action.

**Missing dependencies with fallback:**
- None.

[VERIFIED: frontend/package.json] recharts absent — confirmed not installed.
[VERIFIED: npm registry] recharts 3.8.1 available, published 2026-03-25.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not detected in codebase (no test config file found) |
| Config file | None — see Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

> Note: No `pytest.ini`, `jest.config.*`, `vitest.config.*`, or `tests/` directories were found in the frontend or backend during scouting. `nyquist_validation` is `true` in config.json but no test infrastructure exists in this project. Wave 0 must either install a test framework or document why automated tests are deferred. Given the scope of Phase 5 (one API endpoint, one page), the most pragmatic approach is manual smoke testing against the running app — if the team has not set up testing for Phases 1-4, Phase 5 should not be the first phase to introduce test infrastructure.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REP-01 | GET /api/analytics/summary returns total + category_breakdown | manual smoke | `curl -H "Authorization: Bearer $TOKEN" "$API_URL/analytics/summary?date_from=2026-05-01&date_to=2026-05-31"` | ❌ no test infra |
| REP-02 | Pie chart renders with correct slice count and tooltip | manual UI | Browser DevTools visual inspection | ❌ no test infra |
| REP-03 | Changing date range and applying re-fetches with correct params | manual UI | Network tab inspection | ❌ no test infra |
| REP-04 | daily_avg and monthly_avg values are mathematically correct | manual smoke | Compare curl response values against calculator | ❌ no test infra |

### Sampling Rate
- **Per task commit:** Manual smoke test via curl / browser
- **Per wave merge:** Full manual walkthrough of analytics page
- **Phase gate:** All 4 success criteria from ROADMAP.md verified manually before `/gsd-verify-work`

### Wave 0 Gaps
- No automated test infrastructure exists in this project — consistent with Phases 1-4
- No Wave 0 setup required (manual smoke testing is the established project pattern)

*(If automated tests are desired: install `vitest` + `@testing-library/react` in frontend; install PHPUnit feature tests in backend — but this is out of scope for Phase 5 given project history)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via `auth:api` middleware — already established in prior phases |
| V3 Session Management | no | Stateless JWT — no server-side session |
| V4 Access Control | yes | `expenses.user_id = Auth::id()` scoping in every query — prevents cross-user data leakage |
| V5 Input Validation | yes | `date_format:Y-m-d` Laravel validation on `date_from`/`date_to` params |
| V6 Cryptography | no | No new crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-user data leakage via analytics endpoint | Information Disclosure | Always scope: `->where('expenses.user_id', Auth::id())` — never query without user_id filter |
| SQL injection via date params | Tampering | Laravel query builder uses PDO parameter binding automatically; `whereDate()` is safe |
| Unauthenticated analytics access | Elevation of Privilege | `Route::middleware('auth:api')` group in api.php — same as all other protected endpoints |

**Critical:** The analytics query touches all of a user's expense data. The `user_id` scope is the single most important security control in this entire phase. Every DB query path must have `->where('expenses.user_id', Auth::id())`.

[VERIFIED: codebase] ExpenseController lines 24, 75, 85, 104 all use `->where('user_id', Auth::id())` — same pattern must be applied in AnalyticsController.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MySQL `ONLY_FULL_GROUP_BY` mode is enabled (MySQL 8 default) — GROUP BY must include `categories.id` | Common Pitfalls #5 | If disabled, grouping only by `categories.name` would work; but including `categories.id` is correct either way and poses no risk |
| A2 | Plain JS `Date` arithmetic is sufficient for preset date calculations (no `date-fns` / `dayjs` needed) | Pattern 5 | If timezone edge cases matter (DST transitions), a library would be safer — but for simple calendar month boundaries in Bangkok timezone, plain JS is adequate |
| A3 | Carbon is available in the Laravel backend (it is a Laravel core dependency) | Code Examples | Carbon is included with all Laravel 10+ installations; risk is effectively zero |

**All other claims are VERIFIED via codebase inspection or Context7 documentation.**

---

## Open Questions

1. **No shared Nav component — how to wire D-03 "Analytics nav link alongside Expenses"**
   - What we know: App.tsx has no shared Nav; each page has its own inline header. The `/analytics` route is already registered and RequireAuth is applied.
   - What's unclear: Should the planner add a small two-link nav row to both ExpensesPage and AnalyticsPage? Or just a back-link from AnalyticsPage to Expenses?
   - Recommendation: Add a minimal `<nav>` row to AnalyticsPage only (matching 05-UI-SPEC.md nav spec). Optionally add the reverse link to ExpensesPage header. Scope to AnalyticsPage modifications only — do not refactor ExpensesPage nav beyond adding one link.

2. **`monthly_avg` for ranges shorter than one full month**
   - What we know: 05-CONTEXT.md discretion says "for single-month ranges, monthly_avg = total."
   - What's unclear: Current implementation uses `diffInMonths` which returns 0 for ranges within the same calendar month, so `months = max(1, 0 + 1) = 1` → `monthly_avg = total`. This is correct per the spec.
   - Recommendation: No action needed — the `max(1, ...)` guard handles this correctly.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/recharts/recharts` — PieChart, Pie, Cell, ResponsiveContainer, Tooltip formatter patterns
- `frontend/package.json` — recharts absence confirmed, react/axios/react-router-dom versions
- `backend/routes/api.php` — route structure and middleware group confirmed
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` / `response()->error()` macro signatures
- `backend/app/Http/Controllers/Api/ExpenseController.php` — controller patterns (Auth::id(), validation, response macros)
- `backend/database/migrations/` — `expense_date` column name, `user_id` FK on both tables
- `frontend/src/App.tsx` — `/analytics` route already registered with RequireAuth
- `frontend/src/api/client.ts` — axios client with Bearer interceptor
- `frontend/src/pages/ExpensesPage.tsx` — page structure, loading/error/empty state pattern
- `frontend/src/components/FilterBar.tsx` — Apply button style, date input style, filter state pattern
- `frontend/src/components/EmptyState.tsx` — empty state component (not directly reused — inline variant for analytics)
- `frontend/src/components/InlineError.tsx` — error display component
- `frontend/src/api/expenses.ts` — API module pattern (ApiEnvelope unwrapping)
- `frontend/src/types/expense.ts` — ApiEnvelope type definition
- `.planning/phases/05-analytics/05-CONTEXT.md` — all locked decisions
- `.planning/phases/05-analytics/05-UI-SPEC.md` — approved visual contract

### Secondary (MEDIUM confidence)
- npm registry: recharts 3.8.1 — version and publish date verified

### Tertiary (LOW confidence)
- None in this research — all critical claims verified via codebase or Context7.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts verified via npm registry + Context7; all other dependencies verified in codebase
- Architecture: HIGH — all integration points verified in actual source files
- Pitfalls: HIGH — `expense_date` column name, GROUP BY strict mode, Tooltip formatter arg all verified against codebase or official docs
- Security: HIGH — user_id scoping pattern verified in ExpenseController; same pattern applies here

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (recharts API stable; Laravel patterns stable)
