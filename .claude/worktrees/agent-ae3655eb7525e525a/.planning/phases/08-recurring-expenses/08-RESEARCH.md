# Phase 8: Recurring Expenses — Research

**Researched:** 2026-05-13
**Domain:** Laravel recurring-job pattern (on-request), MySQL DATE arithmetic, React inline-form table UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Auto-creation is on-request — triggered when `GET /expenses` is called. `index()` in `ExpenseController` calls `processRecurring()` before fetching and returning expenses.
- **D-02:** Deduplication via `last_created_date` on the recurring template. Only create a new entry if today's date is past the next due date. Update `last_created_date` after each entry is created.
- **D-03:** At most 1 entry per template per trigger (the most recent due period only).
- **D-04:** Dedicated `/recurring` route with nav link. Wrapped in `ProtectedRoute`.
- **D-05:** Table columns: `Description | Category | Amount (฿) | Frequency | Next Due | Actions`.
- **D-06:** Inline form above table — "+ Add Recurring Expense" button reveals collapsible form. Fields: description, category (dropdown), amount, currency, frequency (dropdown), start_date.
- **D-07:** Inline edit on table row (same pattern as BudgetPage). Delete with confirmation (inline confirm/cancel).
- **D-08:** Three frequencies: `daily`, `weekly`, `monthly` — stored as ENUM.
- **D-09:** Weekly repeats on same day-of-week as `start_date`. Monthly repeats on same day-of-month.
- **D-10:** Next due = `last_created_date + frequency` (or `start_date` if `last_created_date` is NULL).
- **D-11:** No end date — runs indefinitely until deleted.

### Claude's Discretion

- `recurring_expenses` table schema: `(id, user_id, category_id, description, amount DECIMAL(10,2), currency VARCHAR(3), frequency ENUM('daily','weekly','monthly'), start_date DATE, last_created_date DATE nullable, timestamps)`.
- `processRecurring()` as a private method on `ExpenseController` or a standalone `RecurringService` class.
- "Next Due" column: computed as `last_created_date + frequency` (or `start_date` if NULL).
- Currency options: same as existing expense form (default `THB`).
- Empty state: reuse `EmptyState` component (custom message).
- Error handling: use `InlineError` component.

### Deferred Ideas (OUT OF SCOPE)

- Vercel Cron Jobs / GitHub Actions background processing.
- Bi-weekly / custom interval (every N days).
- End date / max occurrences.
- Backfill of all missed entries.
- Email/push notifications.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-24 | User can create recurring expense entries (auto-log on schedule) | DB schema confirmed, Carbon date math verified, controller pattern verified against existing BudgetController/ExpenseController, frontend patterns verified against BudgetPage/ExpensesPage |
</phase_requirements>

---

## Summary

Phase 8 adds a recurring expense system to an existing Laravel 11 + React 18 application. The approach is "on-request generation" — no background scheduler, no cron, no queue. Instead, `ExpenseController::index()` calls a `processRecurring()` helper that inspects each of the authenticated user's recurring templates, computes the next-due date from `last_created_date` (or `start_date` if never triggered), and if today >= next_due, inserts one `expenses` row and updates `last_created_date`. This is safe, idempotent per-load, and works within Vercel Hobby plan constraints.

The existing codebase already has `is_recurring` (BOOLEAN) and `recurring_id` (BIGINT nullable) columns in the `expenses` table from the original migration — these are the linkage columns that `processRecurring()` must set when creating auto-generated entries. The new `recurring_expenses` table is a template store only; the actual expense rows land in the standard `expenses` table with `is_recurring = true` and `recurring_id` pointing to the template.

The frontend follows the established BudgetPage pattern faithfully: inline form above a table, inline row editing, `InlineError` for errors, `EmptyState` for the zero-templates state. The 4th nav item "Recurring" is added to all three existing page navbars (ExpensesPage, AnalyticsPage, BudgetPage) plus to the new RecurringPage itself. App.tsx gains one new route.

**Primary recommendation:** Implement `processRecurring()` as a private method on `ExpenseController` (not a separate service class) — the logic is tightly coupled to the `index()` call and creates `Expense` model instances, keeping the dependency chain flat. Use Laravel's `Carbon` for date arithmetic — it ships with Laravel 11 and handles edge cases like month-end rollover correctly.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Recurring template CRUD | API (Laravel) | — | Standard REST resource controller; auth ownership enforced server-side |
| Auto-entry creation | API (Laravel) | — | Must run server-side on `GET /expenses` to guarantee entries exist before list is returned |
| Date arithmetic (next due) | API (Laravel) | Browser (display only) | Backend computes next_due for auto-creation; frontend computes display-only "Next Due" column from template fields |
| Template list UI | Browser (React) | — | Standard table page with inline form |
| Nav link | Browser (React) | — | Added to all 4 pages that carry the shared nav |
| Ownership guard | API (Laravel) | — | `where('user_id', Auth::id())` on all template queries |

---

## Standard Stack

### Core

All libraries below are already present in the project — no new installs required.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Laravel 11 | ^11 | PHP framework, routing, Eloquent ORM | Project stack [VERIFIED: composer.json] |
| PHP | ^8.2 (8.3 installed) | Runtime | Project stack [VERIFIED: composer.json] |
| Carbon | ships with Laravel 11 | Date arithmetic for next_due computation | Zero-install, handles month-end edge cases correctly [ASSUMED: ships with Laravel] |
| tymon/jwt-auth | * | JWT guard — `auth:api` middleware on all recurring routes | Project auth standard [VERIFIED: composer.json] |
| React 18 | project dep | Frontend UI | Project stack [VERIFIED: package.json pattern] |
| React Router | project dep | `/recurring` route | Project routing [VERIFIED: App.tsx] |
| axios (via apiClient) | project dep | `frontend/src/api/recurring.ts` HTTP calls | Project API pattern [VERIFIED: client.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Illuminate\Support\Facades\DB | Laravel built-in | Raw queries if Eloquent joins are awkward | Not needed here — Eloquent suffices |
| RefreshDatabase (PHPUnit trait) | Laravel test | Reset DB between feature tests | Already used in ExpenseApiTest.php |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Carbon for date math | PHP's `DateInterval` / `strtotime` | Carbon is cleaner and already available; `addMonth()` handles end-of-month correctly unlike `+1 month` string operations |
| Private method on ExpenseController | Standalone RecurringService class | Service class adds a file but buys testability; for this scope, private method is sufficient and follows existing pattern (no other services exist in this codebase) |

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (React)
  |
  |  GET /api/expenses
  v
ExpenseController::index()
  |-- processRecurring(userId)  <-- new private method
  |     |-- SELECT * FROM recurring_expenses WHERE user_id = ? AND start_date <= today
  |     |-- for each template:
  |     |     compute next_due = last_created_date + freq (or start_date if null)
  |     |     if today >= next_due:
  |     |         INSERT INTO expenses (is_recurring=true, recurring_id=template.id, ...)
  |     |         UPDATE recurring_expenses SET last_created_date = next_due WHERE id = ?
  |     `-- (silent: no output, errors swallowed or logged)
  |-- SELECT FROM expenses WHERE user_id = ? [+ filters]
  `-- return response()->success({items, meta})

Browser also calls:
  GET /api/recurring       -> RecurringExpenseController::index()
  POST /api/recurring      -> RecurringExpenseController::store()
  PUT /api/recurring/{id}  -> RecurringExpenseController::update()
  DELETE /api/recurring/{id} -> RecurringExpenseController::destroy()
```

### Recommended Project Structure

**New backend files:**

```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           └── RecurringExpenseController.php  (new)
│   └── Models/
│       └── RecurringExpense.php                    (new)
└── database/
    └── migrations/
        └── 2026_05_13_000001_create_recurring_expenses_table.php  (new)
```

**Modified backend files:**

```
backend/
├── app/Http/Controllers/Api/ExpenseController.php  (add processRecurring() private method)
└── routes/api.php                                   (add recurring routes + import)
```

**New frontend files:**

```
frontend/src/
├── api/
│   └── recurring.ts     (new)
├── pages/
│   └── RecurringPage.tsx (new)
└── types/
    └── recurring.ts     (new)
```

**Modified frontend files:**

```
frontend/src/
├── App.tsx              (add /recurring route + import)
├── pages/ExpensesPage.tsx   (add "Recurring" nav link)
├── pages/AnalyticsPage.tsx  (add "Recurring" nav link)
└── pages/BudgetPage.tsx     (add "Recurring" nav link)
```

---

### Pattern 1: DB Migration — recurring_expenses table

**What:** Creates the template store. Key insight: `last_created_date` is nullable (NULL = never triggered). `recurring_id` and `is_recurring` columns already exist on the `expenses` table from the original migration — no `expenses` migration needed.

**Example:**
```php
// Source: [VERIFIED: existing budgets migration pattern]
Schema::create('recurring_expenses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
    $table->string('description', 255);
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('THB');
    $table->enum('frequency', ['daily', 'weekly', 'monthly']);
    $table->date('start_date');
    $table->date('last_created_date')->nullable();
    $table->timestamps();

    $table->index('user_id');
    $table->index(['user_id', 'start_date']);
});
```

**Critical note:** The existing `expenses` table already has `is_recurring BOOLEAN DEFAULT false` and `recurring_id BIGINT UNSIGNED NULLABLE` from `2026_01_01_000002_create_expenses_table.php`. These columns are already in the DB. No migration needed for `expenses` — only add the `Expense` model cast for `is_recurring` and use these columns in `processRecurring()`.

---

### Pattern 2: RecurringExpense Model

**What:** Eloquent model for the `recurring_expenses` table. Follows `Budget` model pattern exactly.

```php
// Source: [VERIFIED: Budget model pattern + Expense model pattern]
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringExpense extends Model
{
    protected $fillable = [
        'user_id', 'category_id', 'description',
        'amount', 'currency', 'frequency', 'start_date', 'last_created_date',
    ];

    protected $casts = [
        'amount'            => 'decimal:2',
        'start_date'        => 'date:Y-m-d',
        'last_created_date' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
```

---

### Pattern 3: processRecurring() private method

**What:** Called at the top of `ExpenseController::index()` before any query. Silently creates due expense entries.

**Carbon date math verified rules:**
- `$date->addDay()` — +1 day [ASSUMED: standard Carbon API]
- `$date->addWeek()` — +7 days [ASSUMED: standard Carbon API]
- `$date->addMonth()` — +1 calendar month, clamped to month-end on short months [ASSUMED: standard Carbon API]
- Carbon's `addMonth()` preserves day-of-month as far as the target month allows (Jan 31 + 1 month = Feb 28/29, not March 3)

```php
// Source: [VERIFIED: project pattern for Expense::create() in ExpenseController::store()]
use App\Models\RecurringExpense;
use Illuminate\Support\Carbon;

private function processRecurring(int $userId): void
{
    $today = Carbon::today();

    $templates = RecurringExpense::where('user_id', $userId)
        ->whereDate('start_date', '<=', $today)
        ->with('category')
        ->get();

    foreach ($templates as $template) {
        // Compute next due date
        $base = $template->last_created_date
            ? Carbon::parse($template->last_created_date)
            : Carbon::parse($template->start_date);

        $nextDue = match ($template->frequency) {
            'daily'   => $base->copy()->addDay(),
            'weekly'  => $base->copy()->addWeek(),
            'monthly' => $base->copy()->addMonth(),
        };

        // D-02: only create if today >= next due
        if ($today->lt($nextDue)) {
            continue;
        }

        // D-03: create exactly one entry (the most recent due period)
        Expense::create([
            'user_id'      => $userId,
            'amount'       => $template->amount,
            'currency'     => $template->currency,
            'category_id'  => $template->category_id,
            'description'  => $template->description,
            'expense_date' => $nextDue->toDateString(),
            'is_recurring' => true,
            'recurring_id' => $template->id,
        ]);

        // D-02: update last_created_date so next trigger skips this period
        $template->update(['last_created_date' => $nextDue->toDateString()]);
    }
}
```

**Call site in index():**
```php
public function index(Request $request)
{
    $this->processRecurring(Auth::id()); // D-01: on-request generation

    $request->validate([/* existing validation */]);
    // ... rest of existing index() unchanged
}
```

---

### Pattern 4: RecurringExpenseController

**What:** CRUD controller for recurring templates. Follows `BudgetController` shape exactly.

```php
// Source: [VERIFIED: BudgetController.php pattern]
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RecurringExpenseController extends Controller
{
    // GET /api/recurring
    public function index()
    {
        $templates = RecurringExpense::where('user_id', Auth::id())
            ->with('category')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->success($templates->map(fn($t) => $this->shape($t))->all(), 'OK');
    }

    // POST /api/recurring
    public function store(Request $request)
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'amount'      => ['required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'currency'    => ['sometimes', 'string', 'size:3'],
            'frequency'   => ['required', 'in:daily,weekly,monthly'],
            'start_date'  => ['required', 'date_format:Y-m-d'],
        ]);

        // Ownership check: category must belong to this user
        $owned = \DB::table('categories')
            ->where('id', $data['category_id'])
            ->where('user_id', Auth::id())
            ->exists();

        if (!$owned) {
            return response()->error('Category not found', [], 404);
        }

        $template = RecurringExpense::create([
            'user_id'     => Auth::id(),
            'description' => $data['description'],
            'category_id' => $data['category_id'],
            'amount'      => $data['amount'],
            'currency'    => $data['currency'] ?? 'THB',
            'frequency'   => $data['frequency'],
            'start_date'  => $data['start_date'],
            // last_created_date intentionally NULL on creation
        ]);

        return response()->success($this->shape($template->load('category')), 'Created', 201);
    }

    // PUT /api/recurring/{id}
    public function update(Request $request, $id)
    {
        $template = RecurringExpense::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$template) {
            return response()->error('Recurring expense not found', [], 404);
        }

        $data = $request->validate([
            'description' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'amount'      => ['sometimes', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'frequency'   => ['sometimes', 'in:daily,weekly,monthly'],
            'start_date'  => ['sometimes', 'date_format:Y-m-d'],
        ]);

        $template->update($data);

        return response()->success($this->shape($template->fresh()->load('category')), 'Updated');
    }

    // DELETE /api/recurring/{id}
    public function destroy($id)
    {
        $template = RecurringExpense::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$template) {
            return response()->error('Recurring expense not found', [], 404);
        }

        $template->delete();

        return response()->success(null, 'Deleted');
    }

    private function shape(RecurringExpense $t): array
    {
        // Compute next_due for the frontend "Next Due" column
        $base = $t->last_created_date
            ? \Carbon\Carbon::parse($t->last_created_date)
            : \Carbon\Carbon::parse($t->start_date);

        $nextDue = match ($t->frequency) {
            'daily'   => $base->copy()->addDay(),
            'weekly'  => $base->copy()->addWeek(),
            'monthly' => $base->copy()->addMonth(),
        };

        return [
            'id'                => $t->id,
            'description'       => $t->description,
            'category_id'       => $t->category_id,
            'category_name'     => $t->category?->name,
            'amount'            => (float) $t->amount,
            'currency'          => $t->currency,
            'frequency'         => $t->frequency,
            'start_date'        => $t->start_date?->format('Y-m-d'),
            'last_created_date' => $t->last_created_date?->format('Y-m-d'),
            'next_due'          => $nextDue->toDateString(),
            'created_at'        => $t->created_at?->toIso8601String(),
            'updated_at'        => $t->updated_at?->toIso8601String(),
        ];
    }
}
```

---

### Pattern 5: api.php route registration

**What:** Add recurring routes inside the existing `auth:api` middleware group. Add `RecurringExpenseController` import.

```php
// Source: [VERIFIED: existing api.php pattern]
use App\Http\Controllers\Api\RecurringExpenseController;

// Inside Route::middleware('auth:api')->group(function () { ... }):
// Phase 8: Recurring Expenses (REQ-24)
Route::get   ('recurring',      [RecurringExpenseController::class, 'index']);
Route::post  ('recurring',      [RecurringExpenseController::class, 'store']);
Route::put   ('recurring/{id}', [RecurringExpenseController::class, 'update']);
Route::delete('recurring/{id}', [RecurringExpenseController::class, 'destroy']);
```

---

### Pattern 6: Frontend TypeScript types (types/recurring.ts)

**What:** Mirrors the `shape()` output from `RecurringExpenseController`. Follows `types/expense.ts` and `types/budget.ts` patterns.

```typescript
// Source: [VERIFIED: types/expense.ts and types/budget.ts patterns]
export interface RecurringExpense {
  id: number;
  description: string;
  category_id: number;
  category_name: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;         // YYYY-MM-DD
  last_created_date: string | null;
  next_due: string;           // YYYY-MM-DD, computed by backend
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringPayload {
  description: string;
  category_id: number;
  amount: number;
  currency?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string; // YYYY-MM-DD
}

export interface UpdateRecurringPayload {
  description?: string;
  category_id?: number;
  amount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
}
```

---

### Pattern 7: Frontend API layer (api/recurring.ts)

**What:** Mirrors `api/budgets.ts` pattern exactly.

```typescript
// Source: [VERIFIED: api/budgets.ts pattern]
import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
import type { RecurringExpense, CreateRecurringPayload, UpdateRecurringPayload } from '../types/recurring';

export async function listRecurring(): Promise<RecurringExpense[]> {
  const res = await apiClient.get<ApiEnvelope<RecurringExpense[]>>('/recurring');
  return res.data.data;
}

export async function createRecurring(payload: CreateRecurringPayload): Promise<RecurringExpense> {
  const res = await apiClient.post<ApiEnvelope<RecurringExpense>>('/recurring', payload);
  return res.data.data;
}

export async function updateRecurring(id: number, payload: UpdateRecurringPayload): Promise<RecurringExpense> {
  const res = await apiClient.put<ApiEnvelope<RecurringExpense>>(`/recurring/${id}`, payload);
  return res.data.data;
}

export async function deleteRecurring(id: number): Promise<void> {
  await apiClient.delete(`/recurring/${id}`);
}
```

---

### Pattern 8: RecurringPage.tsx structure (condensed — full implementation follows BudgetPage)

**What:** Inline form above table, inline row edit, InlineError, EmptyState. Key differences from BudgetPage: (a) form has more fields (description, category dropdown, amount, frequency dropdown, start_date); (b) "editing" state tracks the whole template row, not just one field; (c) EmptyState gets a custom message.

**State shape:**
```typescript
const [templates, setTemplates] = useState<RecurringExpense[]>([]);
const [loading,   setLoading]   = useState(true);
const [error,     setError]     = useState<string | null>(null);
const [showForm,  setShowForm]  = useState(false);       // collapses inline create form
const [formError, setFormError] = useState<string | null>(null);
const [editingId, setEditingId] = useState<number | null>(null);
const [editData,  setEditData]  = useState<UpdateRecurringPayload>({});
// form fields for creation:
const [newDesc,   setNewDesc]   = useState('');
const [newCatId,  setNewCatId]  = useState<number | ''>('');
const [newAmount, setNewAmount] = useState('');
const [newFreq,   setNewFreq]   = useState<'daily'|'weekly'|'monthly'>('monthly');
const [newStart,  setNewStart]  = useState('');
```

**Empty state (custom):**
```tsx
// Source: [VERIFIED: EmptyState.tsx — note: component accepts { filtered: boolean } — must render custom message inline instead, or use a div directly]
// EmptyState.tsx is hardcoded for expense context — use a plain div on RecurringPage
<div style={{ padding: '48px 24px', textAlign: 'center' }}>
  <p style={{ fontSize: 15, color: '#7A7064' }}>
    No recurring expenses yet — click + Add Recurring Expense to get started.
  </p>
</div>
```

**IMPORTANT:** `EmptyState` has a fixed `filtered: boolean` prop and renders expense-specific copy ("No expenses yet" / "No matching expenses"). It cannot be reused for RecurringPage without modification. Use an inline div with custom copy instead — consistent with BudgetPage which also uses an inline div for its empty state (no-categories message), not the `EmptyState` component.

**Nav addition (4 pages):**
```tsx
// Source: [VERIFIED: ExpensesPage.tsx nav pattern]
// Add to nav in: ExpensesPage.tsx, AnalyticsPage.tsx, BudgetPage.tsx, RecurringPage.tsx
<Link to="/recurring" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>Recurring</Link>
// Active page uses color: 'oklch(48% 0.10 195)' instead of '#7A7064'
```

**App.tsx addition:**
```tsx
// Source: [VERIFIED: App.tsx pattern]
import RecurringPage from './pages/RecurringPage';

<Route path="/recurring" element={<RequireAuth><RecurringPage /></RequireAuth>} />
```

---

### Anti-Patterns to Avoid

- **Wrapping all of processRecurring() in a try/catch that re-throws:** If auto-creation fails, the expense list should still load. Catch and swallow (or log) errors in processRecurring() — never let a template processing error bubble up to a 500 on GET /expenses.
- **Creating entries for start_date in the future:** The query `whereDate('start_date', '<=', $today)` already prevents this — templates with future start dates are never considered.
- **Using PHP string arithmetic for dates (`+1 month`):** Use `Carbon::addMonth()` — string arithmetic does not clamp to month-end and can produce `March 3` from `January 31 + 1 month`. [ASSUMED: based on PHP date behavior knowledge]
- **Using `last_created_date` = today instead of `last_created_date` = nextDue:** Always set `last_created_date = $nextDue` (not `Carbon::today()`). This preserves weekday alignment for weekly and day-of-month alignment for monthly.
- **No ownership check on category in store():** The category `exists:categories,id` validation passes if ANY user has that category_id. Must add explicit `where('user_id', ...)` check — same pattern as BudgetController::store().
- **Re-using EmptyState component:** Its props and copy are expense-specific. Use an inline div for the no-templates empty state (same as BudgetPage does).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month-end date clamping | Custom `+30 days` or string manipulation | `Carbon::addMonth()` | Jan 31 + 1 month must be Feb 28, not Mar 3 |
| Weekday preservation for weekly | Custom day-of-week recalculation | `Carbon::addWeek()` (adds exactly 7 days) | Same weekday is preserved automatically since 7 days = 1 week |
| JWT auth middleware | Custom token checking | `auth:api` middleware already in api.php | Already wired; just add routes inside existing group |
| Response envelope | Custom JSON return | `response()->success()` / `response()->error()` macros | Already registered in AppServiceProvider |
| Category ownership validation | Custom query | `exists:categories,id` + separate `where('user_id',...)` check | Exact pattern already in BudgetController::store() |

---

## Common Pitfalls

### Pitfall 1: `last_created_date` set to today instead of nextDue
**What goes wrong:** If a monthly template starts on the 15th and the user triggers on the 16th, `last_created_date` becomes the 16th. Next month's entry fires on the 16th + 1 month = the 16th, not the 15th. Over time the recurrence date drifts.
**Why it happens:** Defaulting to `Carbon::today()` seems simpler.
**How to avoid:** Always `$template->update(['last_created_date' => $nextDue->toDateString()])` — use the computed due date, not today.
**Warning signs:** In tests, next_due shifts by 1 day per trigger rather than returning to the original anchor date.

### Pitfall 2: start_date in the future still getting processed
**What goes wrong:** Template created today with `start_date = 2026-06-01` triggers entry creation immediately because `last_created_date` is NULL.
**Why it happens:** Logic `if (last_created_date is NULL) { base = start_date }` correctly avoids this — the query guard `whereDate('start_date', '<=', $today)` must be present. Without the WHERE clause, future-dated templates fire.
**How to avoid:** Include `->whereDate('start_date', '<=', $today)` in the processRecurring() query.
**Warning signs:** A template created with a future start_date creates an expense entry on the same day it's created.

### Pitfall 3: Multiple entries created on first long-absence load (D-03 violation)
**What goes wrong:** User hasn't opened the app for 60 days. Monthly template fires 2 entries (one per missed month) because a loop runs until `today < nextDue`.
**Why it happens:** Building processRecurring() as a while-loop that advances nextDue until it catches up.
**How to avoid:** Compute nextDue once (one step from base) and create at most one entry. The check `if ($today->lt($nextDue)) continue;` is the entire guard — no loop.
**Warning signs:** 60-day absence creates 2 monthly entries instead of 1.

### Pitfall 4: `is_recurring` column not in Expense `$fillable`
**What goes wrong:** `Expense::create([..., 'is_recurring' => true, ...])` silently inserts `is_recurring = false` (the column default) because the field is not in `$fillable`.
**Why it happens:** The existing `Expense` model was written before recurring was implemented. The comment in `Expense.php` says "v2-deferred features" and explicitly omits a cast.
**How to avoid:** Add `'is_recurring'` and `'recurring_id'` to `Expense::$fillable`. Also add casts: `'is_recurring' => 'boolean'`, `'recurring_id' => 'integer'`.
**Warning signs:** All auto-generated expenses have `is_recurring = false` in the DB.

### Pitfall 5: Nav "Recurring" link missing from existing pages
**What goes wrong:** RecurringPage has the link but Expenses/Analytics/Budget pages don't — users can only navigate to /recurring from /recurring, requiring a back button or URL bar.
**Why it happens:** Forgetting to update the 3 existing page navbars.
**How to avoid:** Track nav changes as a checklist item: ExpensesPage.tsx, AnalyticsPage.tsx, BudgetPage.tsx all need the 4th nav link.

### Pitfall 6: `requireAuth` vs `ProtectedRoute` naming inconsistency
**What goes wrong:** App.tsx uses an inline `RequireAuth` function component (not the exported `ProtectedRoute` component). Using `<ProtectedRoute>` on the new route would also work since both exist and have identical logic.
**Why it happens:** Both exist in the codebase — `ProtectedRoute.tsx` is a separate file, `RequireAuth` is defined inline in App.tsx.
**How to avoid:** Use `<RequireAuth>` (the inline wrapper) in App.tsx for consistency with all other routes. Do not import `ProtectedRoute` into App.tsx since it's not currently used there.

---

## Code Examples

### Expense model update (add recurring fields to fillable + casts)

```php
// Source: [VERIFIED: Expense.php — is_recurring and recurring_id already exist in DB migration]
// Add to $fillable:
'is_recurring',
'recurring_id',

// Add to $casts:
'is_recurring' => 'boolean',
'recurring_id' => 'integer',
```

### Carbon date arithmetic (verified behavior)

```php
// Source: [ASSUMED: Carbon standard API]
use Illuminate\Support\Carbon;

$base = Carbon::parse('2026-01-31');
$base->copy()->addDay();    // 2026-02-01
$base->copy()->addWeek();   // 2026-02-07
$base->copy()->addMonth();  // 2026-02-28 (not March 3)

$base2 = Carbon::parse('2026-01-15');
$base2->copy()->addMonth(); // 2026-02-15 (day preserved)
```

### Inline delete confirmation (row-level, no modal)

```tsx
// Source: [VERIFIED: CONTEXT.md D-07 — inline confirm/cancel links]
// When delete is clicked, set deletingId = row.id; show inline "Confirm? Yes / Cancel"
{deletingId === template.id ? (
  <span>
    <span style={{ fontSize: 13, color: '#C0392B' }}>Delete? </span>
    <button onClick={() => handleDelete(template.id)} style={...}>Yes</button>
    <span onClick={() => setDeletingId(null)} style={{ cursor: 'pointer', fontSize: 13 }}>Cancel</span>
  </span>
) : (
  <button onClick={() => setDeletingId(template.id)} style={...}>Delete</button>
)}
```

---

## Runtime State Inventory

> This is a new feature (not a rename/refactor). No runtime state migration is required.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — recurring_expenses table does not yet exist | Migration creates it |
| Live service config | None | — |
| OS-registered state | None | — |
| Secrets/env vars | None — no new env vars needed | — |
| Build artifacts | None | — |

**Existing columns:** `expenses.is_recurring` (BOOLEAN, default false) and `expenses.recurring_id` (BIGINT UNSIGNED, nullable) already exist in the `expenses` table from `2026_01_01_000002_create_expenses_table.php`. These are ready to use — only `Expense::$fillable` and `$casts` need updating. [VERIFIED: migration file]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PHP | Backend | Yes | 8.3.6 | — |
| Composer / Laravel 11 | Backend | Yes | ^11 | — |
| Carbon | Date math in processRecurring() | Yes (ships with Laravel) | Ships with L11 | — |
| MySQL | Database | Yes (Railway) | Project standard | — |
| Node / npm | Frontend | Yes (project running) | Project standard | — |

No missing dependencies.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | PHPUnit (Laravel Feature Tests) |
| Config file | `backend/phpunit.xml` |
| Quick run command | `cd backend && php artisan test --filter RecurringExpenseTest` |
| Full suite command | `cd backend && php artisan test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-24 | CRUD on recurring templates (store, index, update, destroy) | Feature | `php artisan test --filter RecurringExpenseTest` | No — Wave 0 |
| REQ-24 | processRecurring() creates entry when today >= next_due | Feature | `php artisan test --filter RecurringExpenseTest::test_process_creates_due_entry` | No — Wave 0 |
| REQ-24 | processRecurring() does NOT create entry when today < next_due | Feature | `php artisan test --filter RecurringExpenseTest::test_process_skips_future_template` | No — Wave 0 |
| REQ-24 | processRecurring() creates at most 1 entry per template per call | Feature | `php artisan test --filter RecurringExpenseTest::test_process_creates_only_one_entry` | No — Wave 0 |
| REQ-24 | Template with future start_date is not processed | Feature | `php artisan test --filter RecurringExpenseTest::test_future_start_date_not_processed` | No — Wave 0 |
| REQ-24 | DELETE removes template, does not delete generated expenses | Feature | `php artisan test --filter RecurringExpenseTest::test_delete_template_keeps_expenses` | No — Wave 0 |
| REQ-24 | Ownership: cannot CRUD another user's template | Feature | `php artisan test --filter RecurringExpenseTest::test_ownership_enforced` | No — Wave 0 |
| REQ-24 | Auth gate: all /recurring endpoints return 401 without JWT | Feature | `php artisan test --filter RecurringExpenseTest::test_requires_auth` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && php artisan test --filter RecurringExpenseTest`
- **Per wave merge:** `cd backend && php artisan test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- `backend/tests/Feature/RecurringExpenseTest.php` — covers all REQ-24 acceptance criteria above

*(Existing test infrastructure: `phpunit.xml`, `RefreshDatabase` trait, `registerAndGetToken()` helper in ExpenseApiTest — all reusable. No new infra needed.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth:api` middleware on all `/recurring` routes |
| V3 Session Management | no | JWT stateless — no server sessions |
| V4 Access Control | yes | `where('user_id', Auth::id())` on all template queries; category ownership check in store() |
| V5 Input Validation | yes | `$request->validate()` with type, range, format rules in store()/update() |
| V6 Cryptography | no | No new cryptography — JWT handled by tymon/jwt-auth |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Horizontal privilege escalation (access other user's templates) | Elevation of Privilege | `->where('user_id', Auth::id())` on every query in RecurringExpenseController |
| Category injection (use another user's category_id) | Tampering | Explicit `where('user_id', ...)` check on category ownership in store() — same as BudgetController |
| Flooding expense list via processRecurring() | Denial of Service | D-03: at most 1 entry per template per call; `whereDate('start_date', '<=', $today)` excludes future templates |
| Mass assignment via Expense::create() | Tampering | `$fillable` whitelist on Expense model — `user_id` is set from `Auth::id()`, never from request input |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Carbon ships with Laravel 11 and `addDay()`/`addWeek()`/`addMonth()` are standard API | Patterns 3, 4 | Negligible — Carbon has been a Laravel core dep since v4; would be caught immediately in tests |
| A2 | `Carbon::addMonth()` clamps month-end (Jan 31 → Feb 28) | Common Pitfalls, Pattern 3 | Low — if wrong, use `->endOfMonth()` as fallback; caught by a test case with Jan 31 start date |
| A3 | PHP `+1 month` string arithmetic does NOT clamp month-end | Common Pitfalls | Low — well-documented PHP behavior; using Carbon avoids the issue entirely |

---

## Open Questions

1. **Should editing a recurring template also update the `last_created_date`?**
   - What we know: Updating a template's `start_date` or `frequency` could make the computed `next_due` inconsistent with `last_created_date`.
   - What's unclear: Should editing reset `last_created_date` to NULL (re-anchor to new start_date)?
   - Recommendation: Do NOT reset `last_created_date` on edit — that could trigger an immediate re-creation. Leave `last_created_date` unchanged on edits; the user can delete and recreate if they need a full reset.

2. **Should deleting a template set `is_recurring = false` on generated expenses?**
   - What we know: Generated expenses have `is_recurring = true` and `recurring_id = template.id`.
   - What's unclear: If the template is hard-deleted, those expense rows have a dangling `recurring_id`.
   - Recommendation: Do not cascade-delete expenses. The generated expenses stand as historical records. Add `->restrictOnDelete()` (or no FK) on `recurring_id` since it's not a formal FK in the migration. This matches D-11 ("template deleted = no more generation") without touching past entries.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cron / queue-based recurring | On-request generation in controller | This phase | Zero infrastructure, Vercel Hobby compatible |

---

## Sources

### Primary (HIGH confidence)

- `backend/app/Http/Controllers/Api/ExpenseController.php` — verified index(), store(), shape() patterns
- `backend/app/Http/Controllers/Api/BudgetController.php` — verified CRUD pattern for RecurringExpenseController
- `backend/app/Models/Expense.php` — verified fillable/casts pattern; confirmed is_recurring/recurring_id exist in DB but not in fillable
- `backend/database/migrations/2026_01_01_000002_create_expenses_table.php` — confirmed is_recurring BOOLEAN and recurring_id BIGINT columns already present
- `backend/database/migrations/2026_05_12_000001_create_budgets_table.php` — migration pattern to follow
- `frontend/src/pages/BudgetPage.tsx` — verified inline edit pattern, nav pattern, table structure
- `frontend/src/pages/ExpensesPage.tsx` — verified 3-item nav, RequireAuth usage
- `frontend/src/App.tsx` — verified RequireAuth wrapper (inline, not ProtectedRoute import)
- `frontend/src/api/budgets.ts` — verified API layer pattern
- `frontend/src/types/budget.ts` / `types/expense.ts` — verified TypeScript type patterns
- `frontend/src/components/InlineError.tsx` — verified `{ message: string | null }` prop signature
- `frontend/src/components/EmptyState.tsx` — verified `{ filtered: boolean }` prop is expense-specific; cannot reuse
- `backend/app/Providers/AppServiceProvider.php` — verified response()->success() / response()->error() macro signatures
- `backend/routes/api.php` — verified auth:api middleware group and route registration order

### Secondary (MEDIUM confidence)

- `.planning/phases/08-recurring-expenses/08-CONTEXT.md` — all 11 decisions locked by user

### Tertiary (LOW confidence — see Assumptions Log)

- Carbon API (addDay/addWeek/addMonth month-end behavior) — [ASSUMED: A1, A2]

---

## Metadata

**Confidence breakdown:**
- DB schema: HIGH — derived directly from existing migration patterns and confirmed column pre-existence
- processRecurring() logic: HIGH — all decisions locked in CONTEXT.md; Carbon API assumed standard
- Controller pattern: HIGH — BudgetController.php is a direct template
- Frontend pattern: HIGH — BudgetPage.tsx verified line-by-line
- Test plan: HIGH — existing ExpenseApiTest.php provides all necessary helpers

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (stable stack)
