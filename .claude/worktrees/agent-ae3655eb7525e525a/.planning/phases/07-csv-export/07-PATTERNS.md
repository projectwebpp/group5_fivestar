# Phase 7: CSV Export - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 4 (2 backend, 2 frontend)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/app/Http/Controllers/Api/ExpenseController.php` | controller | file-I/O (CSV stream) | `ExpenseController::index()` same file lines 14-54 | exact (same controller, method addition) |
| `backend/routes/api.php` | route config | request-response | Lines 35-40 (existing expense routes) | exact |
| `frontend/src/api/expenses.ts` | service/API | request-response | `listExpenses()` / `getExpense()` lines 4-18 | role-match (same file, new function) |
| `frontend/src/pages/ExpensesPage.tsx` | component/page | request-response | Primary button + header div lines 47-69 | role-match (same file, button addition) |

---

## Pattern Assignments

### `backend/app/Http/Controllers/Api/ExpenseController.php` — add `export()` method

**Analog:** `index()` in the same file (lines 14-54) for query structure; `shape()` (lines 117-130) for field access conventions.

**Imports already present — no new use statements required** (lines 1-10):
```php
use App\Models\Expense;
use Illuminate\Support\Facades\Auth;
```
No additional imports needed. `response()->streamDownload()` is a Laravel macro — no class import required. The return type `\Symfony\Component\HttpFoundation\StreamedResponse` is referenced with a fully-qualified name inline.

**Auth pattern** — copy exactly from every other method (lines 24, 75, 86, 106):
```php
$userId = Auth::id();
// then: Expense::query()->where('user_id', $userId)  — or Expense::where('user_id', $userId)
```

**Core query pattern** — derived from `index()` lines 24 and 43, without filters, with eager-load:
```php
// index() uses: Expense::query()->where('user_id', Auth::id())
// export() uses the same scope but no filters, and adds ->with('category')
$expenses = Expense::where('user_id', Auth::id())
    ->with('category')
    ->orderBy('expense_date', 'desc')
    ->orderBy('id', 'desc')
    ->get();
```

**Field access conventions** — from `shape()` lines 117-130:
```php
// These field names and null-safe patterns are already established:
$expense->expense_date?->format('Y-m-d')   // date
$expense->currency                          // currency (always set, no ?? needed)
$expense->description                       // description
$expense->notes                             // nullable — use ?? ''
// NEW for export() — relationship access (not in shape(), which uses category_id):
$expense->category?->name ?? ''            // category name from eager-loaded BelongsTo
```

**Amount format** — `shape()` line 122 uses `(float) $expense->amount` for JSON; export uses `number_format()` instead:
```php
// shape() pattern (JSON): (float) $expense->amount
// export() pattern (CSV — no thousands separator):
number_format((float) $expense->amount, 2, '.', '')
```

**Response pattern** — DO NOT use `response()->success()` (that is JSON envelope only). Use `streamDownload()` directly:
```php
$filename = 'expenses-' . now()->format('Y-m-d') . '.csv';

return response()->streamDownload(function () use ($expenses) {
    $handle = fopen('php://output', 'w');
    fputcsv($handle, ['date', 'category', 'description', 'amount', 'currency', 'notes']);
    foreach ($expenses as $expense) {
        fputcsv($handle, [
            $expense->expense_date?->format('Y-m-d'),
            $expense->category?->name ?? '',
            $expense->description,
            number_format((float) $expense->amount, 2, '.', ''),
            $expense->currency,
            $expense->notes ?? '',
        ]);
    }
    fclose($handle);
}, $filename, ['Content-Type' => 'text/csv']);
```

**Method placement:** Add `export()` as a public method after `index()` (after line 54) and before `store()`. It is a read-only operation and belongs near the top of the public surface.

**Return type:** Declare `public function export(): \Symfony\Component\HttpFoundation\StreamedResponse` — the only method in this controller with a non-JSON return type.

**No error handling needed:** There is no "not found" case — an empty collection produces a valid CSV with header only (D-04). No try/catch required; Laravel's exception handler covers unexpected errors.

---

### `backend/routes/api.php` — add `GET expenses/export` route

**Analog:** Existing expense routes lines 34-40.

**Current expense route block** (lines 34-40):
```php
// Phase 4: Expenses (EXP-01 through EXP-06)
Route::get   ('expenses',        [ExpenseController::class, 'index']);
Route::post  ('expenses',        [ExpenseController::class, 'store']);
Route::get   ('expenses/{id}',   [ExpenseController::class, 'show']);
Route::put   ('expenses/{id}',   [ExpenseController::class, 'update']);
Route::patch ('expenses/{id}',   [ExpenseController::class, 'update']);
Route::delete('expenses/{id}',   [ExpenseController::class, 'destroy']);
```

**CRITICAL — insertion point:** The new route MUST be inserted BEFORE `Route::get('expenses/{id}', ...)` (currently line 37). Laravel matches routes top-to-bottom; if `{id}` is registered first, the literal string "export" is matched as an ID and `show()` returns `{"success":false,"message":"Expense not found"}`.

**Route to insert** (between line 36 and 37):
```php
// Phase 7: CSV Export (REQ-23) — MUST be before expenses/{id}
Route::get('expenses/export', [ExpenseController::class, 'export']);
```

**Formatting convention** — existing routes use aligned spacing with `Route::get/post/put/patch/delete` verbs. The new route uses `Route::get` (no padding needed — it has no sibling verbs to align with). Match the indentation of the surrounding block (4 spaces inside the `middleware('auth:api')` group).

**No new `use` import needed** — `ExpenseController` is already imported at line 7.

---

### `frontend/src/api/expenses.ts` — add `exportExpenses()` function

**Analog:** `getExpense()` lines 16-18 (simplest existing function — one apiClient call, no params).

**Import pattern** (line 1 — already present):
```typescript
import apiClient from './client';
```
No new imports needed. `Blob`, `URL`, `document` are browser globals.

**Existing function signature style** — all functions are named exports, async, with explicit return type:
```typescript
// Pattern from lines 4, 16, 21, 28, 36:
export async function functionName(params): Promise<ReturnType> {
  const res = await apiClient.METHOD<ApiEnvelope<T>>('/path', options);
  return res.data.data;
}
```

**exportExpenses() departs from this pattern** in two ways: (1) `responseType: 'blob'` instead of JSON, (2) `Promise<void>` return — the function triggers a download side-effect rather than returning data. There is no `ApiEnvelope` wrapper for blob responses.

**Full function to append at end of file** (after line 38):
```typescript
export async function exportExpenses(): Promise<void> {
  const res = await apiClient.get('/expenses/export', { responseType: 'blob' });

  const blob = new Blob([res.data], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');

  const disposition = res.headers['content-disposition'] as string | undefined;
  const match       = disposition?.match(/filename="?([^"]+)"?/);
  const filename    = match?.[1] ?? `expenses-${new Date().toISOString().slice(0, 10)}.csv`;

  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**Note on `client.ts` interceptors** (lines 12-18, 21-29): The request interceptor attaches `Authorization: Bearer <token>` automatically. The response interceptor redirects to `/auth` on 401. Both apply to blob requests — no special handling needed in `exportExpenses()`. A 401 during export will redirect to `/auth` (session expired); the `catch` block in the page's `handleExport` will not fire for 401s.

---

### `frontend/src/pages/ExpensesPage.tsx` — add Export CSV button and state

**Analog:** Primary "Add Expense" `<Link>` button in the header, lines 55-68. Secondary button is visually subordinate — outlined, transparent background, same teal color as text/border.

**State pattern** — matches existing `loading` and `error` state declarations (lines 18-19):
```typescript
// Existing pattern (lines 18-19):
const [loading, setLoading] = useState(true);
const [error, setError]     = useState<string | null>(null);

// New state to add alongside these:
const [exportLoading, setExportLoading] = useState(false);
const [exportError,   setExportError]   = useState<string | null>(null);
```

**Import addition** — `exportExpenses` needs to be added to the existing import on line 3, and `InlineError` added to component imports:
```typescript
// Line 3 — change from:
import { listExpenses } from '../api/expenses';
// to:
import { listExpenses, exportExpenses } from '../api/expenses';

// Add alongside other component imports (after line 10):
import InlineError from '../components/InlineError';
```

**handleExport handler** — follows the same try/catch/finally pattern as the `useEffect` data fetch (lines 30-34):
```typescript
const handleExport = async () => {
  setExportLoading(true);
  setExportError(null);
  try {
    await exportExpenses();
  } catch {
    setExportError('Export failed. Please try again.');
  } finally {
    setExportLoading(false);
  }
};
```

**Button placement** — inside the existing `<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>` (line 49), after the `<nav>` block (line 50-54) and before or after the existing `<Link to="/expenses/new">` (lines 55-68). Export is a secondary action — place it BEFORE the primary "Add Expense" button so the primary action remains rightmost (conventional hierarchy).

**Primary button style for reference** (lines 57-65):
```typescript
style={{
  padding: '8px 16px',
  background: 'oklch(48% 0.10 195)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  borderRadius: 12,
  textDecoration: 'none',
}}
```

**Secondary button style** — same geometry, transparent background, teal border and text color:
```tsx
<button
  onClick={handleExport}
  disabled={exportLoading}
  style={{
    padding: '8px 16px',
    background: 'transparent',
    color: 'oklch(48% 0.10 195)',
    fontWeight: 600,
    fontSize: 14,
    borderRadius: 12,
    border: '1.5px solid oklch(48% 0.10 195)',
    cursor: exportLoading ? 'not-allowed' : 'pointer',
    opacity: exportLoading ? 0.6 : 1,
  }}
>
  {exportLoading ? 'Exporting...' : 'Export CSV'}
</button>
```

**InlineError placement** — after the closing `</header>` tag (line 70), before `<FilterBar>` (line 72). Mirrors the BudgetPage pattern where InlineError sits between header and main content:
```tsx
<InlineError message={exportError} />
```

**InlineError component signature** (from `InlineError.tsx` line 1): `{ message: string | null }` — renders `null` when message is null, so it is always safe to render unconditionally.

**exportLoading is independent of page loading state** — do not gate the export button on `!loading`. The page data loading and the export operation are entirely separate state variables.

---

## Shared Patterns

### JWT Authentication
**Source:** `backend/routes/api.php` line 27; `backend/app/Http/Controllers/Api/ExpenseController.php` lines 24, 75, 86, 106
**Apply to:** `export()` method
```php
// All protected routes live inside:
Route::middleware('auth:api')->group(function () { ... });
// All methods scope data by authenticated user:
Expense::where('user_id', Auth::id())
```

### Axios Bearer Token (Frontend)
**Source:** `frontend/src/api/client.ts` lines 12-18
**Apply to:** `exportExpenses()` — no action needed, interceptor fires automatically
```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Inline Styles Only
**Source:** `frontend/src/pages/ExpensesPage.tsx` (entire file — zero className usage)
**Apply to:** Export button, any new JSX elements
All styling is done via the `style={{}}` prop. No CSS classes, no Tailwind, no CSS modules.

### Response Envelope — JSON only
**Source:** `backend/app/Http/Controllers/Api/ExpenseController.php` lines 45-53, 70, 81
**Apply to:** `export()` — this is the ONE exception
```php
// All other methods use:
return response()->success($data, 'OK');
// export() MUST NOT use response()->success() — CSV is not JSON.
// export() uses:
return response()->streamDownload(callback, $filename, ['Content-Type' => 'text/csv']);
```

---

## No Analog Found

All four files have strong analogs within themselves. No files in this phase lack a pattern reference.

| File | Role | Data Flow | Notes |
|------|------|-----------|-------|
| — | — | — | All files have analogs |

The `streamDownload` + blob download pattern has no existing analog in the codebase (this is the first file download feature), but the full implementation is verified from RESEARCH.md and Laravel/Axios documentation. The planner should treat the RESEARCH.md code examples as the canonical implementation reference for these sections.

---

## Key Pitfalls (for planner to include in plan actions)

1. **Route order** — `expenses/export` MUST be registered on a line BEFORE `expenses/{id}` in `api.php`. Current `expenses/{id}` is on line 37.
2. **No `response()->success()` for CSV** — `streamDownload()` only.
3. **Category name, not ID** — use `$expense->category?->name ?? ''` not `$expense->category_id`. Requires `->with('category')` on the query.
4. **Amount format** — `number_format((float) $expense->amount, 2, '.', '')` — the 4th argument `''` disables thousands separator.
5. **`URL.revokeObjectURL(url)`** — must be called after anchor click to prevent memory leak.
6. **`exportLoading` state is independent** — do not tie it to the page `loading` variable.

---

## Metadata

**Analog search scope:** `backend/app/Http/Controllers/Api/`, `backend/routes/`, `frontend/src/api/`, `frontend/src/pages/`, `frontend/src/components/`
**Files read:** 6 (`ExpenseController.php`, `api.php`, `expenses.ts`, `ExpensesPage.tsx`, `InlineError.tsx`, `client.ts`)
**Pattern extraction date:** 2026-05-13
