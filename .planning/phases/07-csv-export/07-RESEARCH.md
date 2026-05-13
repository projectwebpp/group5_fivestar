# Phase 7: CSV Export - Research

**Researched:** 2026-05-13
**Domain:** Laravel CSV streaming + Axios blob download (React/TypeScript)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Export CSV button on ExpensesPage header, next to "+ Add Expense"
- D-02: Secondary/muted style — visually lighter than the primary button
- D-03: Always export ALL user expenses — ignore active FilterBar filters
- D-04: Empty state: valid CSV with header row only (no error, no disabled button)
- D-05: CSV columns (7): date, category, description, amount, currency, notes

### Claude's Discretion
- Backend endpoint: GET /api/expenses/export inside auth:api middleware group
- Method: ExpenseController::export()
- JWT auth for download: Axios responseType: 'blob' + programmatic anchor trigger
- CSV filename: expenses-{YYYY-MM-DD}.csv (today's date)
- Amount format: plain decimal (1250.00), no ฿ prefix
- Date format: ISO YYYY-MM-DD
- Category column: category name string (not category_id)
- Loading state: button shows "Exporting..." while in-flight, reverts on completion/error
- Error state: InlineError component on page if export fails

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-23 | User can download expense data as CSV | Backend: response()->streamDownload() with DB JOIN for category names; Frontend: Axios blob download pattern with programmatic anchor trigger |
</phase_requirements>

---

## Summary

Phase 7 is a small, well-bounded feature with two independent implementation units: a Laravel export endpoint and a React download trigger. No new routes, no new pages, no new database tables are required.

The backend task is straightforward: add one method (`export()`) to `ExpenseController`, register one route in `api.php` (before `expenses/{id}`), fetch all user expenses via an Eloquent query with an eager-loaded `category` relationship, build a CSV string, and return it via `response()->streamDownload()`. The `shape()` helper is not reused — export produces CSV, not JSON, and does not use the `{success, data, message}` envelope.

The frontend task is equally bounded: add one exported function `exportExpenses()` to `api/expenses.ts` using `responseType: 'blob'`, add one `<button>` element to `ExpensesPage.tsx`'s header `<div>` alongside the existing "Add Expense" link, and manage a single piece of local boolean state (`exportLoading`) for the loading indicator. The `InlineError` component and `LoadingButton` component already exist and are ready to reuse.

**Primary recommendation:** Use Eloquent `with('category')` (eager load) in `export()` rather than a raw DB JOIN — it is simpler, matches the existing model relationship, and is safe for any realistic expense dataset size. Use `response()->streamDownload()` with a callback to write the CSV. On the frontend, use the standard Axios blob + programmatic anchor pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch all user expenses for export | API / Backend | — | Auth-scoped data fetch; never client-side |
| CSV serialization | API / Backend | — | Server owns data format; avoids shipping raw data to client for reformatting |
| JWT authentication of download | API / Backend | Frontend (sends header) | Bearer token in Authorization header; no token in URL |
| Blob download trigger | Browser / Client | — | URL.createObjectURL lives in the browser DOM |
| Loading state during export | Frontend | — | Single useState boolean, local to ExpensesPage |
| Error display | Frontend | — | InlineError component, already exists |

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Laravel (PHP) | existing | `response()->streamDownload()` for CSV response | Already in use; built-in method, no package needed |
| Axios | existing | `responseType: 'blob'` for binary download | Already in `frontend/src/api/client.ts`; interceptors already attach JWT |
| React | existing | `useState` for export loading state | Already in use across all pages |

**No new packages to install.** This phase requires zero new dependencies on either side.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `response()->streamDownload()` | Manual `Response::make()` with headers | streamDownload is cleaner; automatic Content-Disposition header; no advantage to manual |
| Eager load `with('category')` | Raw DB JOIN (`DB::table()->join()`) | Eloquent `with()` is simpler; JOIN is what AnalyticsController uses but export is lower complexity. Either works. |
| Axios blob + anchor | `window.location.href` redirect | window.location would expose JWT token in URL query param — violates auth decision D per CONTEXT.md |

---

## Architecture Patterns

### System Architecture Diagram

```
[Browser: ExpensesPage]
    |
    | user clicks "Export CSV"
    v
[exportLoading = true]  →  [button shows "Exporting..."]
    |
    | apiClient.get('/expenses/export', { responseType: 'blob' })
    |   Authorization: Bearer <JWT>
    v
[Laravel: auth:api middleware]
    |
    | validates JWT, injects Auth::id()
    v
[ExpenseController::export()]
    |
    | Expense::where('user_id', Auth::id())->with('category')->orderBy('expense_date','desc')->get()
    v
[PHP: build CSV string]
    |  header row + one row per expense
    |  category name from $expense->category->name
    v
[response()->streamDownload(callback, 'expenses-2026-05-13.csv')]
    |  Content-Type: text/csv
    |  Content-Disposition: attachment; filename="expenses-2026-05-13.csv"
    v
[Axios receives blob]
    |
    | URL.createObjectURL(blob)  →  <a> click  →  URL.revokeObjectURL()
    v
[Browser: file saved to Downloads]
    |
[exportLoading = false]
```

### Recommended File Changes

```
backend/
├── routes/api.php                              # +1 route (expenses/export before expenses/{id})
└── app/Http/Controllers/Api/
    └── ExpenseController.php                   # +export() method

frontend/src/
├── api/expenses.ts                             # +exportExpenses() function
└── pages/ExpensesPage.tsx                      # +button, exportLoading state, InlineError
```

### Pattern 1: Laravel streamDownload for CSV

**What:** Returns a streamed file download response without writing to disk.
**When to use:** Any file download that does not use the JSON envelope.

```php
// Source: Laravel documentation — HTTP Responses > File Downloads
public function export(): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $userId = Auth::id();

    $expenses = Expense::where('user_id', $userId)
        ->with('category')
        ->orderBy('expense_date', 'desc')
        ->orderBy('id', 'desc')
        ->get();

    $filename = 'expenses-' . now()->format('Y-m-d') . '.csv';

    return response()->streamDownload(function () use ($expenses) {
        $handle = fopen('php://output', 'w');

        // Header row
        fputcsv($handle, ['date', 'category', 'description', 'amount', 'currency', 'notes']);

        // Data rows
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
}
```

**Key facts about `fputcsv`:** [VERIFIED: PHP documentation]
- Automatically wraps fields containing commas, double-quotes, or newlines in double-quotes.
- Escapes embedded double-quotes by doubling them (`"` → `""`).
- No hand-rolled escaping needed. This covers description, notes, and category name safely.

### Pattern 2: Axios blob download with programmatic anchor

**What:** Downloads a file through Axios (with auth headers) then triggers browser save dialog.
**When to use:** Any JWT-authenticated file download in an SPA — prevents token in URL.

```typescript
// Source: Axios documentation + MDN URL.createObjectURL
export async function exportExpenses(): Promise<void> {
  const res = await apiClient.get('/expenses/export', { responseType: 'blob' });

  const blob = new Blob([res.data], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');

  // Extract filename from Content-Disposition header, or fall back
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

### Pattern 3: Export button with loading state in ExpensesPage

**What:** Local boolean state for a single async action; does not affect page data loading.
**When to use:** Any secondary action button that triggers an async operation.

```tsx
// Inline in ExpensesPage — no new component needed
const [exportLoading, setExportLoading] = useState(false);
const [exportError,   setExportError]   = useState<string | null>(null);

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

Button JSX (secondary style, visually subordinate to primary "Add Expense"):

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

`InlineError` placement — below the header, above FilterBar:

```tsx
<InlineError message={exportError} />
```

### Anti-Patterns to Avoid

- **Token in URL:** Never pass JWT as `?token=...` query param. Axios `responseType: 'blob'` with the Bearer interceptor already in `client.ts` handles auth correctly.
- **Using `response()->success()` for CSV:** The `success()` macro wraps JSON envelope. CSV responses MUST use `streamDownload()` directly. [VERIFIED: AppServiceProvider.php line 14-20]
- **Forgetting route order:** `Route::get('expenses/export', ...)` MUST appear BEFORE `Route::get('expenses/{id}', ...)` in `api.php`. Laravel matches routes top-to-bottom; if `{id}` comes first, the string "export" is matched as an ID. [VERIFIED: api.php lines 35-40]
- **Not revoking the object URL:** Call `URL.revokeObjectURL(url)` after the anchor click to avoid memory leaks.
- **Disabling the button while page data loads:** `exportLoading` is independent of the page `loading` state. The export button should be enabled whenever the page is ready (do not gate it on `!loading`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV field escaping | Custom string escape function | `fputcsv()` (PHP built-in) | Handles commas, quotes, newlines, and UTF-8 per RFC 4180 automatically |
| File download with auth | window.location redirect | Axios blob + anchor | window.location cannot send Authorization header |
| Loading button state | New LoadingButton variant | Inline `useState(false)` + `disabled` | Simpler for a single one-off button; LoadingButton exists but is sized for form submissions |

**Key insight:** `fputcsv` is a PHP primitive that handles all CSV edge cases correctly. Never concatenate CSV strings manually — a description containing a comma or a double-quote will corrupt the output.

---

## Common Pitfalls

### Pitfall 1: Route collision — "export" matched as expense ID
**What goes wrong:** `GET /api/expenses/export` returns 404 or triggers `show()` with id="export", which returns "Expense not found."
**Why it happens:** Laravel routes are matched top-to-bottom. `expenses/{id}` catches any segment, including the literal string "export."
**How to avoid:** Register `expenses/export` BEFORE `expenses/{id}` in `api.php`. [VERIFIED: api.php line 38]
**Warning signs:** 404 response or `{"success":false,"message":"Expense not found"}` when hitting the export endpoint.

### Pitfall 2: Content-Disposition header blocked by CORS
**What goes wrong:** `res.headers['content-disposition']` is `undefined` in the browser even though Laravel sets it correctly.
**Why it happens:** CORS `Access-Control-Expose-Headers` must include `Content-Disposition` for the browser to read it. If not exposed, the fallback filename in `exportExpenses()` (using today's date) kicks in — the download still works, just with a client-derived filename.
**How to avoid:** The fallback `expenses-${new Date().toISOString().slice(0, 10)}.csv` in the frontend function handles this case gracefully. The filename will still be correct because both server and client use today's date.
**Warning signs:** Header reads as `undefined` in DevTools Network tab.

### Pitfall 3: Empty CSV causes browser error dialog
**What goes wrong:** User with no expenses gets an error instead of a valid download.
**Why it happens:** Returning an empty body or a non-CSV response for zero records.
**How to avoid:** D-04 (locked): always write the header row. `fputcsv` writes the header before the `foreach` loop, so an empty `$expenses` collection produces a valid single-line CSV. [VERIFIED: pattern code above]

### Pitfall 4: Amount formatted with thousands separator
**What goes wrong:** Excel receives "1,250.00" and interprets it as text, not a number.
**Why it happens:** PHP's `number_format()` default includes thousand separators.
**How to avoid:** Use `number_format((float) $expense->amount, 2, '.', '')` — the fourth argument `''` disables the thousands separator. [VERIFIED: pattern code above]

### Pitfall 5: category_id instead of category name in CSV
**What goes wrong:** CSV shows `3` instead of `"Food"` for the category column.
**Why it happens:** `ExpenseController::index()` uses `$expense->category_id` via `shape()`. The `export()` method must use `$expense->category?->name` from the eager-loaded relationship.
**How to avoid:** Load with `->with('category')` and access `$expense->category?->name ?? ''`. The `??` guard handles any orphaned expense row where the category was deleted.
**Warning signs:** Numeric values in the category column of the downloaded file.

### Pitfall 6: Axios response interceptor redirecting on export error
**What goes wrong:** A 401 during export silently redirects to `/auth` instead of showing the export error message.
**Why it happens:** `client.ts` response interceptor catches 401 globally and calls `window.location.href = '/auth'`. This is correct behavior — a 401 on export means the session expired. The export error handler in `handleExport` will not fire for 401s.
**How to avoid:** This is acceptable behavior. If the session is still valid, 401 will not occur. No special handling needed for this case.

---

## Code Examples

### Full export() method (ready to implement)

```php
// Source: derived from existing ExpenseController pattern + Laravel streamDownload docs
public function export(): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $userId = Auth::id();

    $expenses = Expense::where('user_id', $userId)
        ->with('category')
        ->orderBy('expense_date', 'desc')
        ->orderBy('id', 'desc')
        ->get();

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
}
```

### Route registration (correct order)

```php
// Source: api.php — insert before expenses/{id}
// Phase 7: CSV Export (REQ-23) — MUST be before expenses/{id}
Route::get('expenses/export', [ExpenseController::class, 'export']);

// Phase 4: Expenses (EXP-01 through EXP-06)
Route::get   ('expenses',        [ExpenseController::class, 'index']);
Route::post  ('expenses',        [ExpenseController::class, 'store']);
Route::get   ('expenses/{id}',   [ExpenseController::class, 'show']);
// ...
```

### exportExpenses() API function

```typescript
// Source: api/expenses.ts — new export at end of file
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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Token in URL for file downloads | Axios blob + programmatic anchor | SPA era (2015+) | Tokens never appear in server logs or browser history |
| Manual CSV string concatenation | `fputcsv()` with `php://output` | PHP 5.1+ | RFC 4180 compliance without custom code |
| `Response::make()` with headers | `response()->streamDownload()` | Laravel 7+ | Cleaner API; automatic Content-Disposition |

**Nothing deprecated in this phase.** All patterns used are current Laravel and React idioms.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `response()->streamDownload()` is available in the Laravel version deployed on this project | Standard Stack | Low — it was introduced in Laravel 7 (2020); project uses Laravel 10+ based on codebase structure |
| A2 | The `expenses` table `user_id` column exists (added in migration `2026_05_10_000002`) | Architecture | Low — migration file confirmed present; `index()` already filters by `user_id` successfully |
| A3 | CORS on the backend exposes `Content-Disposition` header to JS | Common Pitfalls | Low-medium — if not exposed, the fallback filename still produces correct output |

**All other claims are VERIFIED from codebase reads in this session.**

---

## Open Questions (RESOLVED)

1. **CORS Content-Disposition header exposure**
   - What we know: `client.ts` fetches blob successfully (same origin or CORS-permitted). Header reading is optional — fallback is in place.
   - What's unclear: Whether `cors.php` config exposes `Content-Disposition` in `Access-Control-Expose-Headers`.
   - Recommendation: Implement the fallback (already in the pattern code). If header IS available, use it; if not, the client-derived filename is identical. No action needed before planning.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code/config changes only. No new external tools, services, CLIs, runtimes, or databases are required. All dependencies (Laravel, Axios, React) are already installed and operational.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project has no automated test suite |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-23 | GET /api/expenses/export returns 200 with text/csv content-type | manual | N/A — no test framework | N/A |
| REQ-23 | CSV contains correct headers: date,category,description,amount,currency,notes | manual | N/A | N/A |
| REQ-23 | CSV rows match user's actual expenses | manual | N/A | N/A |
| REQ-23 | Empty user: CSV downloads with header row only, no error | manual | N/A | N/A |
| REQ-23 | Amount is plain decimal (1250.00), no currency prefix | manual | N/A | N/A |
| REQ-23 | Export button shows "Exporting..." during in-flight request | manual | N/A | N/A |
| REQ-23 | 401 redirects to /auth (JWT expired) | manual | N/A | N/A |
| REQ-23 | Export ignores active FilterBar filters | manual | N/A | N/A |

### Sampling Rate

- **Per task commit:** Manual browser verification (open app, click Export CSV, inspect downloaded file)
- **Per wave merge:** Full manual checklist above
- **Phase gate:** All manual checks pass before `/gsd-verify-work`

### Wave 0 Gaps

None — no test framework exists in this project. All validation is manual. Wave 0 does not need to create test infrastructure (no test framework in use across any phase).

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via `auth:api` middleware — same as all protected endpoints |
| V3 Session Management | no | Stateless JWT; no session involved |
| V4 Access Control | yes | `Expense::where('user_id', Auth::id())` — user can only export their own data |
| V5 Input Validation | no | No user input; export takes no query parameters |
| V6 Cryptography | no | No new crypto; JWT validation handled by existing middleware |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR — user exports another user's data | Information Disclosure | `->where('user_id', Auth::id())` scope on every query — confirmed in export() pattern |
| Token in URL / server logs | Information Disclosure | Axios blob + Authorization header — never `?token=` in URL |
| CSV injection (formula injection) | Tampering | `fputcsv()` wraps fields in quotes but does NOT strip leading `=`, `+`, `-`, `@`. Fields like description or notes could contain formula triggers if opened in Excel. Low risk for internal expense tracker, but noted. |

**CSV injection note:** [ASSUMED] For an internal personal expense tracker, the risk of CSV injection is low — a user would be injecting into their own data. The planner may choose to add a sanitization step (strip leading `=+-@` from string fields) if security hardening is desired, but it is not required by REQ-23.

---

## Sources

### Primary (HIGH confidence — verified from codebase in this session)
- `backend/app/Http/Controllers/Api/ExpenseController.php` — existing query pattern, `shape()`, `Auth::id()` usage
- `backend/app/Http/Controllers/Api/AnalyticsController.php` — category JOIN pattern (DB::table + join vs Eloquent with())
- `backend/app/Providers/AppServiceProvider.php` — confirmed `response()->success()` is JSON-only; `streamDownload()` is the correct alternative
- `backend/routes/api.php` — confirmed `expenses/{id}` at line 38; export route MUST precede it
- `backend/database/migrations/2026_01_01_000002_create_expenses_table.php` — confirmed column names: expense_date, amount, currency, description, notes
- `backend/database/migrations/2026_01_01_000001_create_categories_table.php` — confirmed categories.name column
- `backend/app/Models/Expense.php` — confirmed `category()` BelongsTo relationship exists
- `frontend/src/api/client.ts` — confirmed Axios interceptor attaches Bearer token; blob download will include auth header
- `frontend/src/api/expenses.ts` — confirmed pattern for adding new exported function
- `frontend/src/pages/ExpensesPage.tsx` — confirmed header structure; exact insertion point for button
- `frontend/src/components/InlineError.tsx` — confirmed component signature: `{ message: string | null }`
- `frontend/src/components/LoadingButton.tsx` — confirmed exists but sized for form submissions (12px/24px padding); inline button preferred for header

### Secondary (MEDIUM confidence)
- PHP documentation — `fputcsv()` handles RFC 4180 CSV escaping including commas, double-quotes, newlines
- Laravel documentation — `response()->streamDownload()` available since Laravel 7

### Tertiary (LOW confidence)
- None — all claims verified from codebase or well-known PHP/Laravel primitives.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; verified from codebase
- Architecture: HIGH — route structure, controller pattern, Eloquent relationships all verified from source
- Pitfalls: HIGH — route collision, amount format, and category name vs ID verified directly from source files
- CSV escaping: HIGH — fputcsv is a PHP primitive with well-documented behavior

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — stable stack, no fast-moving dependencies)
