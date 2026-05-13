# Phase 8: Recurring Expenses — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 13 (7 new, 6 modified)
**Analogs found:** 13 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/database/migrations/2026_05_13_000001_create_recurring_expenses_table.php` | migration | CRUD | `backend/database/migrations/2026_05_12_000001_create_budgets_table.php` | exact |
| `backend/app/Models/RecurringExpense.php` | model | CRUD | `backend/app/Models/Budget.php` | exact |
| `backend/app/Http/Controllers/Api/RecurringExpenseController.php` | controller | request-response | `backend/app/Http/Controllers/Api/BudgetController.php` | exact |
| `backend/tests/Feature/RecurringExpenseTest.php` | test | CRUD | `backend/tests/Feature/ExpenseApiTest.php` | exact |
| `frontend/src/types/recurring.ts` | utility | transform | `frontend/src/types/budget.ts` | exact |
| `frontend/src/api/recurring.ts` | service | request-response | `frontend/src/api/budgets.ts` | exact |
| `frontend/src/pages/RecurringPage.tsx` | component | CRUD | `frontend/src/pages/BudgetPage.tsx` | exact |
| `backend/app/Http/Controllers/Api/ExpenseController.php` (add `processRecurring()`) | controller | CRUD | self — adds private method; `Expense::create()` pattern in existing `store()` | role-match |
| `backend/app/Models/Expense.php` (add `is_recurring`, `recurring_id` to fillable/casts) | model | CRUD | self — amend existing `$fillable` / `$casts` arrays | role-match |
| `backend/routes/api.php` (add 4 recurring routes) | config | request-response | self — mirror existing budget route block | role-match |
| `frontend/src/App.tsx` (add `/recurring` route) | config | request-response | self — mirror existing `/budget` Route entry | role-match |
| `frontend/src/pages/ExpensesPage.tsx` (add Recurring nav link) | component | request-response | self — mirror existing 3-link nav block | role-match |
| `frontend/src/pages/AnalyticsPage.tsx` (add Recurring nav link) | component | request-response | self — mirror existing 3-link nav block | role-match |
| `frontend/src/pages/BudgetPage.tsx` (add Recurring nav link) | component | request-response | self — mirror existing 3-link nav block | role-match |

---

## Pattern Assignments

---

### `backend/database/migrations/2026_05_13_000001_create_recurring_expenses_table.php` (migration, CRUD)

**Analog:** `backend/database/migrations/2026_05_12_000001_create_budgets_table.php`

**Full analog** (lines 1–29):
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->tinyInteger('month')->unsigned();
            $table->smallInteger('year')->unsigned();
            $table->decimal('amount', 10, 2);
            $table->timestamps();

            $table->unique(['user_id', 'category_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
```

**Deviation for recurring_expenses:** Replace the budgets-specific columns with the recurring schema from CONTEXT.md. Use `restrictOnDelete()` on `category_id` (matches `expenses` table — not `cascadeOnDelete()`). Add `user_id` index and composite `[user_id, start_date]` index.

```php
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

---

### `backend/app/Models/RecurringExpense.php` (model, CRUD)

**Analog:** `backend/app/Models/Budget.php`

**Full analog** (lines 1–26):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    protected $fillable = ['user_id', 'category_id', 'month', 'year', 'amount'];

    protected $casts = [
        'month'  => 'integer',
        'year'   => 'integer',
        'amount' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
```

**Also reference:** `backend/app/Models/Expense.php` lines 3–4 for typed `BelongsTo` import and return type.

**Deviation for RecurringExpense:** Replace fillable/casts with recurring fields. Use typed `BelongsTo` return (Expense.php pattern). Cast dates with `date:Y-m-d` (Expense.php pattern — not `float`/`integer`).

```php
<?php

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

### `backend/app/Http/Controllers/Api/RecurringExpenseController.php` (controller, request-response)

**Analog:** `backend/app/Http/Controllers/Api/BudgetController.php`

**Imports pattern** (lines 1–10):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
```

**Auth/ownership pattern** (lines 87–97 — store()):
```php
$userId = Auth::id();

// Verify category belongs to this user (T-06-01: ownership check)
$categoryExists = DB::table('categories')
    ->where('id', $data['category_id'])
    ->where('user_id', $userId)
    ->exists();

if (! $categoryExists) {
    return response()->error('Category not found', [], 404);
}
```

**Core CRUD pattern — ownership guard on update/destroy** (lines 121–132):
```php
$budget = Budget::where('id', $id)
    ->where('user_id', Auth::id())
    ->first();

if (! $budget) {
    return response()->error('Budget not found', [], 404);
}

$budget->update(['amount' => $data['amount']]);

return response()->success($budget, 'Budget updated');
```

**Response macro pattern** (lines 71, 107, 131, 150):
```php
return response()->success($rows, 'OK');         // index
return response()->success($budget, 'Budget created', 201); // store
return response()->success($budget, 'Budget updated');      // update
return response()->success(null, 'Budget deleted');         // destroy
```

**Error response pattern**:
```php
return response()->error('Category not found', [], 404);
return response()->error('Budget not found', [], 404);
```

**Deviation for RecurringExpenseController:**
- `index()` needs no query params — returns all templates for the user, ordered by `created_at desc`, with `->with('category')`, mapped through a private `shape()` method.
- `store()` validates: `description`, `category_id`, `amount` (with `regex:/^\d+(\.\d{1,2})?$/`), `currency` (optional), `frequency` (in:daily,weekly,monthly), `start_date` (date_format:Y-m-d).
- `update()` uses `sometimes` rules (all fields optional).
- `destroy()` does not cascade to generated expenses — hard-delete template only.
- Add private `shape(RecurringExpense $t): array` method that computes `next_due` via Carbon (see RESEARCH.md Pattern 4 for the full `shape()` implementation).
- Add `use Illuminate\Support\Carbon;` import for the `shape()` Carbon date arithmetic.

---

### `backend/tests/Feature/RecurringExpenseTest.php` (test, CRUD)

**Analog:** `backend/tests/Feature/ExpenseApiTest.php`

**Namespace + traits** (lines 1–12):
```php
<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;
```

**Helper: `registerAndGetToken()`** (lines 22–33):
```php
private function registerAndGetToken(string $email = 'test@example.com'): array
{
    $res = $this->postJson('/api/auth/register', [
        'email'                 => $email,
        'password'              => 'password123',
        'password_confirmation' => 'password123',
    ]);
    $res->assertStatus(201);
    $token = $res->json('data.token');
    $user  = User::where('email', $email)->firstOrFail();
    return [$user, $token];
}
```

**Helper: `seedCategory()`** (lines 39–51):
```php
private function seedCategory(User $user): Category
{
    $cat = Category::where('user_id', $user->id)->first();
    if ($cat) {
        return $cat;
    }
    return Category::create([
        'user_id' => $user->id,
        'name'    => 'Test Category',
        'icon'    => 'tag',
        'color'   => '#FF6B6B',
    ]);
}
```

**Ownership test pattern** (lines 229–240):
```php
[$userA, $tokenA] = $this->registerAndGetToken('userA@example.com');
[$userB, $tokenB] = $this->registerAndGetToken('userB@example.com');

$expense = $this->seedExpense($userB);

// User A tries to access User B's expense
$this->withToken($tokenA)
    ->getJson("/api/expenses/{$expense->id}")
    ->assertStatus(404);
```

**Auth gate test pattern** (lines 322–326):
```php
public function test_endpoints_require_jwt(): void
{
    $this->getJson('/api/expenses')
        ->assertStatus(401);
}
```

**Response shape assertion pattern** (lines 85–90):
```php
$res->assertStatus(201)
    ->assertJson(['success' => true])
    ->assertJsonPath('data.amount', 250.0)
    ->assertJsonPath('data.currency', 'THB')
    ->assertJsonPath('data.date', '2026-05-10');
```

**Deviation for RecurringExpenseTest:**
- Copy `registerAndGetToken()` and `seedCategory()` helpers verbatim.
- Add a `seedRecurring(User $user, array $overrides = [])` helper (mirrors `seedExpense()`) that directly creates a `RecurringExpense` model row.
- Test names follow the map in RESEARCH.md Validation Architecture section: `test_process_creates_due_entry`, `test_process_skips_future_template`, `test_process_creates_only_one_entry`, `test_future_start_date_not_processed`, `test_delete_template_keeps_expenses`, `test_ownership_enforced`, `test_requires_auth`.
- Add `use App\Models\RecurringExpense;` to the imports block.
- For `processRecurring()` tests, use `$this->travelTo(Carbon::parse('...'))` (Laravel time travel) or seed `last_created_date` directly on the model to control the date arithmetic.

---

### `frontend/src/types/recurring.ts` (utility, transform)

**Analog:** `frontend/src/types/budget.ts`

**Full analog** (lines 1–29):
```typescript
/**
 * Represents one row in the budget table — one per user category.
 * Returned by GET /api/budgets.
 */
export interface BudgetRow {
  category_id: number;
  category_name: string;
  budget_id: number | null;   // null if no limit has been set for this category
  limit: number | null;       // null if no limit set
  spent: number;              // always present — current-month spend
  remaining: number | null;   // null if no limit; negative when over budget (per D-08)
}

/**
 * Body for POST /api/budgets (create a new limit).
 */
export interface CreateBudgetPayload {
  category_id: number;
  month: number;  // 1–12
  year: number;
  amount: number; // > 0
}

/**
 * Body for PUT /api/budgets/{id} (update existing limit).
 */
export interface UpdateBudgetPayload {
  amount: number; // > 0
}
```

**Also reference:** `frontend/src/types/expense.ts` lines 1–11 for `Expense` interface shape (id, timestamps, string dates).

**Deviation for recurring.ts:** Three interfaces — `RecurringExpense`, `CreateRecurringPayload`, `UpdateRecurringPayload`. `RecurringExpense.frequency` is a union literal `'daily' | 'weekly' | 'monthly'`. All date fields are `string` (YYYY-MM-DD). `last_created_date` is `string | null`. Include `next_due: string` (computed by backend `shape()`). Full content per RESEARCH.md Pattern 6.

---

### `frontend/src/api/recurring.ts` (service, request-response)

**Analog:** `frontend/src/api/budgets.ts`

**Full analog** (lines 1–40):
```typescript
import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
import type { BudgetRow, CreateBudgetPayload, UpdateBudgetPayload } from '../types/budget';

export async function getBudgets(month: number, year: number): Promise<BudgetRow[]> {
  const res = await apiClient.get<ApiEnvelope<BudgetRow[]>>('/budgets', {
    params: { month, year },
  });
  return res.data.data;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<BudgetRow> {
  const res = await apiClient.post<ApiEnvelope<BudgetRow>>('/budgets', payload);
  return res.data.data;
}

export async function updateBudget(id: number, payload: UpdateBudgetPayload): Promise<BudgetRow> {
  const res = await apiClient.put<ApiEnvelope<BudgetRow>>(`/budgets/${id}`, payload);
  return res.data.data;
}

export async function deleteBudget(id: number): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
```

**Deviation for recurring.ts:** Four functions: `listRecurring()`, `createRecurring(payload)`, `updateRecurring(id, payload)`, `deleteRecurring(id)`. No query params on `listRecurring` (unlike `getBudgets` which takes month/year). Import types from `'../types/recurring'`. Full content per RESEARCH.md Pattern 7.

---

### `frontend/src/pages/RecurringPage.tsx` (component, CRUD)

**Analog:** `frontend/src/pages/BudgetPage.tsx`

**Page shell pattern** (lines 1–10 — imports):
```typescript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../api/budgets';
import type { BudgetRow } from '../types/budget';
```

**State pattern** (lines 11–16):
```typescript
const [rows,      setRows]      = useState<BudgetRow[]>([]);
const [loading,   setLoading]   = useState(true);
const [error,     setError]     = useState<string | null>(null);
const [editingId, setEditingId] = useState<number | null>(null);
const [editValue, setEditValue] = useState<string>('');
```

**Fetch-on-mount pattern** (lines 17–29):
```typescript
const fetchRows = () => {
    setLoading(true);
    setError(null);
    getBudgets(currentMonth, currentYear)
      .then(data => setRows(data))
      .catch(() => setError('Failed to load budgets. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

**Page container style** (line 49):
```typescript
<div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: '24px', paddingBottom: 48 }}>
```

**Header + nav pattern** (lines 52–59):
```tsx
<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
  <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>Budget</h1>
  <nav style={{ display: 'flex', gap: 16 }}>
    <Link to="/expenses"  style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Expenses</Link>
    <Link to="/analytics" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Analytics</Link>
    <Link to="/budget"    style={{ fontSize: 15, fontWeight: 700, color: 'oklch(48% 0.10 195)', textDecoration: 'none' }}>Budget</Link>
  </nav>
</header>
```

**Error display pattern** (line 62 — NOTE: BudgetPage uses a raw `<p>`, not InlineError; use `InlineError` on RecurringPage per CONTEXT.md):
```tsx
{error && <p style={{ color: '#C0392B', fontSize: 14, marginBottom: 16 }}>{error}</p>}
```

**Loading pattern** (line 65):
```tsx
{loading && <p style={{ color: '#7A7064', fontSize: 15 }}>Loading budgets...</p>}
```

**Empty state pattern** (lines 68–89 — inline div, NOT EmptyState component):
```tsx
{!loading && rows.length === 0 && !error && (
  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
    <p style={{ fontSize: 15, color: '#7A7064', marginBottom: 16 }}>
      No categories found. Add categories first.
    </p>
  </div>
)}
```

**Table card wrapper** (lines 93–100):
```tsx
<div style={{
  background: '#FFFCF7',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
  border: '1px solid rgba(31,27,22,0.04)',
  overflowX: 'auto',
}}>
```

**Table header style** (lines 103–108):
```tsx
<thead>
  <tr style={{ borderBottom: '1px solid rgba(31,27,22,0.08)' }}>
    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Category</th>
    ...
  </tr>
</thead>
```

**Inline edit pattern** (lines 131–155 — Save + Cancel within a table cell):
```tsx
{isEditing ? (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="number"
      min="0"
      step="0.01"
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      autoFocus
      style={{ width: 90, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14 }}
    />
    <button
      onClick={() => handleSave(row)}
      style={{ padding: '4px 10px', background: 'oklch(48% 0.10 195)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
    >
      Save
    </button>
    <span
      onClick={e => { e.stopPropagation(); setEditingId(null); }}
      style={{ fontSize: 13, color: '#7A7064', cursor: 'pointer', textDecoration: 'underline' }}
    >
      Cancel
    </span>
  </span>
) : (
  row.limit !== null ? `฿${row.limit.toFixed(2)}` : '—'
)}
```

**Deviation for RecurringPage.tsx:**
- Nav: 4 links (Expenses, Analytics, Budget, Recurring-active). Add `<Link to="/recurring" ...>Recurring</Link>` as the 4th link. Active page uses `color: 'oklch(48% 0.10 195)'`, inactive uses `color: '#7A7064'`.
- State: more fields than BudgetPage — add `showForm`, `formError`, `editData`, `deletingId`, and individual new-record form fields (`newDesc`, `newCatId`, `newAmount`, `newFreq`, `newStart`, `newCurrency`). See RESEARCH.md Pattern 8 for the full state shape.
- Table columns: `Description | Category | Amount (฿) | Frequency | Next Due | Actions` (6 columns vs BudgetPage's 4).
- "Next Due" is a read-only display computed from `template.next_due` (string, provided by backend `shape()`).
- Inline edit: `editingId` tracks the template `id` (not `category_id` as in BudgetPage). `editData` holds the full `UpdateRecurringPayload` object (not a single string value).
- Delete: inline confirm/cancel pattern (not a save blank) — `deletingId` state; show "Delete? Yes Cancel" inline when `deletingId === template.id`.
- Form creation: collapsible form above the table revealed by "+ Add Recurring Expense" button. `showForm` boolean controls display. Form fields: description (text), category (select from user's categories), amount (number), currency (select, default THB), frequency (select: daily/weekly/monthly), start_date (date).
- Empty state copy: "No recurring expenses yet — click + Add Recurring Expense to get started." (inline div, NOT EmptyState component — same as BudgetPage's empty state pattern).
- Error display: use `<InlineError message={error} />` (import `InlineError` from `'../components/InlineError'`).
- Import `listCategories` from `'../api/categories'` and `Category` type to populate the category dropdown.

---

### `backend/app/Http/Controllers/Api/ExpenseController.php` — add `processRecurring()` (controller, CRUD)

**Analog:** self — existing file `backend/app/Http/Controllers/Api/ExpenseController.php`

**Call site to modify — `index()` method** (lines 14–15):
```php
public function index(Request $request)
{
    $request->validate([    // line 16 — insert processRecurring() BEFORE this line
```

**Expense::create() pattern to replicate inside processRecurring()** (lines 60–69):
```php
$expense = Expense::create([
    'user_id'      => Auth::id(),
    'amount'       => $data['amount'],
    'currency' => 'THB', // D-13 silent server-set
    'category_id'  => $data['category_id'],
    'description'  => $data['description'],
    'expense_date' => $data['date'],
    'notes'        => $data['notes'] ?? null,
]);
```

**Add to top of file — new imports:**
```php
use App\Models\RecurringExpense;
use Illuminate\Support\Carbon;
```

**New private method to insert after `destroy()` and before `export()`:**
```php
private function processRecurring(int $userId): void
{
    try {
        $today = Carbon::today();

        $templates = RecurringExpense::where('user_id', $userId)
            ->whereDate('start_date', '<=', $today)
            ->get();

        foreach ($templates as $template) {
            $base = $template->last_created_date
                ? Carbon::parse($template->last_created_date)
                : Carbon::parse($template->start_date);

            $nextDue = match ($template->frequency) {
                'daily'   => $base->copy()->addDay(),
                'weekly'  => $base->copy()->addWeek(),
                'monthly' => $base->copy()->addMonth(),
            };

            if ($today->lt($nextDue)) {
                continue;
            }

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

            $template->update(['last_created_date' => $nextDue->toDateString()]);
        }
    } catch (\Throwable $e) {
        // Swallow errors: processRecurring() must never break GET /expenses
        \Illuminate\Support\Facades\Log::warning('processRecurring failed: ' . $e->getMessage());
    }
}
```

**index() modification — add one line before `$request->validate()`:**
```php
public function index(Request $request)
{
    $this->processRecurring(Auth::id()); // REQ-24: on-request generation (D-01)

    $request->validate([
```

---

### `backend/app/Models/Expense.php` — add `is_recurring`, `recurring_id` (model, CRUD)

**Analog:** self — existing file `backend/app/Models/Expense.php`

**Current `$fillable`** (lines 10–19):
```php
protected $fillable = [
    'user_id',
    'amount',
    'currency',
    'category_id',
    'description',
    'expense_date',
    'notes',
];
```

**Current `$casts`** (lines 21–25):
```php
protected $casts = [
    'amount'       => 'decimal:2',
    'expense_date' => 'date:Y-m-d',
    // is_recurring and recurring_id columns exist in the DB but are v2-deferred features.
    // No cast for is_recurring here so the field is not part of the v1 API contract.
];
```

**Required change — add two entries to `$fillable`:**
```php
protected $fillable = [
    'user_id',
    'amount',
    'currency',
    'category_id',
    'description',
    'expense_date',
    'notes',
    'is_recurring',   // add
    'recurring_id',   // add
];
```

**Required change — add two casts and remove the deferred comment:**
```php
protected $casts = [
    'amount'       => 'decimal:2',
    'expense_date' => 'date:Y-m-d',
    'is_recurring' => 'boolean',  // add
    'recurring_id' => 'integer',  // add
];
```

---

### `backend/routes/api.php` — add recurring routes (config, request-response)

**Analog:** self — existing budget route block (lines 48–52):
```php
// Phase 6: Budget Management (REQ-20, REQ-21, REQ-22)
Route::get   ('budgets',      [BudgetController::class, 'index']);
Route::post  ('budgets',      [BudgetController::class, 'store']);
Route::put   ('budgets/{id}', [BudgetController::class, 'update']);
Route::delete('budgets/{id}', [BudgetController::class, 'destroy']);
```

**Import to add** (after line 4 — existing `BudgetController` import):
```php
use App\Http\Controllers\Api\RecurringExpenseController;
```

**Block to append inside the `auth:api` middleware group, after the budget block:**
```php
// Phase 8: Recurring Expenses (REQ-24)
Route::get   ('recurring',      [RecurringExpenseController::class, 'index']);
Route::post  ('recurring',      [RecurringExpenseController::class, 'store']);
Route::put   ('recurring/{id}', [RecurringExpenseController::class, 'update']);
Route::delete('recurring/{id}', [RecurringExpenseController::class, 'destroy']);
```

---

### `frontend/src/App.tsx` — add `/recurring` route (config, request-response)

**Analog:** self — existing `/budget` route (line 27):
```tsx
<Route path="/budget"     element={<RequireAuth><BudgetPage /></RequireAuth>} />
```

**Import to add** (after line 9 — existing `BudgetPage` import):
```tsx
import RecurringPage from './pages/RecurringPage';
```

**Route to add** (after the `/budget` Route entry):
```tsx
<Route path="/recurring"  element={<RequireAuth><RecurringPage /></RequireAuth>} />
```

**Critical:** Use `<RequireAuth>` (the inline component defined on line 11), NOT `<ProtectedRoute>`. `ProtectedRoute.tsx` is not imported in App.tsx and is not used by any existing route.

---

### `frontend/src/pages/ExpensesPage.tsx` — add Recurring nav link (component, request-response)

**Analog:** self — existing nav block (lines 65–69):
```tsx
<nav style={{ display: 'flex', gap: 16 }}>
  <Link to="/expenses"  style={{ fontSize: 15, fontWeight: 700, color: 'oklch(48% 0.10 195)', textDecoration: 'none' }}>Expenses</Link>
  <Link to="/analytics" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Analytics</Link>
  <Link to="/budget"    style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Budget</Link>
</nav>
```

**Add a 4th link** (Expenses is active, so Recurring uses inactive color `#7A7064`):
```tsx
<Link to="/recurring" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>Recurring</Link>
```

---

### `frontend/src/pages/AnalyticsPage.tsx` — add Recurring nav link (component, request-response)

**Analog:** self — existing nav block (lines 276–286):
```tsx
<nav style={{ display: 'flex', gap: 16 }}>
  <Link to="/expenses" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>
    Expenses
  </Link>
  <Link to="/analytics" style={{ fontSize: 15, fontWeight: 700, color: 'oklch(48% 0.10 195)', textDecoration: 'none' }}>
    Analytics
  </Link>
  <Link to="/budget" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>
    Budget
  </Link>
</nav>
```

**Add a 4th link** (Analytics is active, so Recurring uses inactive color `#7A7064`):
```tsx
<Link to="/recurring" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>
  Recurring
</Link>
```

---

### `frontend/src/pages/BudgetPage.tsx` — add Recurring nav link (component, request-response)

**Analog:** self — existing nav block (lines 54–58):
```tsx
<nav style={{ display: 'flex', gap: 16 }}>
  <Link to="/expenses"  style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Expenses</Link>
  <Link to="/analytics" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Analytics</Link>
  <Link to="/budget"    style={{ fontSize: 15, fontWeight: 700, color: 'oklch(48% 0.10 195)', textDecoration: 'none' }}>Budget</Link>
</nav>
```

**Add a 4th link** (Budget is active, so Recurring uses inactive color `#7A7064`):
```tsx
<Link to="/recurring" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>Recurring</Link>
```

---

## Shared Patterns

### Response Macros
**Source:** `backend/app/Providers/AppServiceProvider.php` (registered macros; verified in BudgetController and ExpenseController usage)
**Apply to:** `RecurringExpenseController` — all four action methods
```php
return response()->success($data, 'Message');        // 200 default
return response()->success($data, 'Created', 201);   // 201 for store()
return response()->error('Not found', [], 404);      // 404 ownership failures
```

### JWT Auth Guard
**Source:** `backend/routes/api.php` lines 27–52 — `Route::middleware('auth:api')->group()`
**Apply to:** All 4 recurring routes — add inside the existing `auth:api` group, not a new group
```php
Route::middleware('auth:api')->group(function () {
    // ... existing routes ...
    Route::get('recurring', [RecurringExpenseController::class, 'index']);
    // etc.
});
```

### Ownership Guard
**Source:** `backend/app/Http/Controllers/Api/BudgetController.php` lines 121–127 (update) and 140–145 (destroy)
**Apply to:** `RecurringExpenseController::update()` and `RecurringExpenseController::destroy()`
```php
$template = RecurringExpense::where('id', $id)
    ->where('user_id', Auth::id())
    ->first();

if (! $template) {
    return response()->error('Recurring expense not found', [], 404);
}
```

### Category Ownership Check
**Source:** `backend/app/Http/Controllers/Api/BudgetController.php` lines 89–97
**Apply to:** `RecurringExpenseController::store()` before creating the template
```php
$categoryExists = DB::table('categories')
    ->where('id', $data['category_id'])
    ->where('user_id', Auth::id())
    ->exists();

if (! $categoryExists) {
    return response()->error('Category not found', [], 404);
}
```

### Inline Styles Only
**Source:** All existing frontend pages (`BudgetPage.tsx`, `ExpensesPage.tsx`, `AnalyticsPage.tsx`)
**Apply to:** `RecurringPage.tsx` — use only inline style objects. No Tailwind, no CSS modules, no external CSS framework.

### Active/Inactive Nav Link Colors
**Source:** `BudgetPage.tsx` line 57 (active), line 55–56 (inactive)
**Apply to:** Nav link additions in all 4 pages
```
Active page link:   color: 'oklch(48% 0.10 195)'
Inactive page link: color: '#7A7064'
```

### InlineError Component
**Source:** `frontend/src/components/InlineError.tsx` (full file, 8 lines)
**Apply to:** `RecurringPage.tsx` — use `<InlineError message={error} />` and `<InlineError message={formError} />`
```tsx
// Prop signature: { message: string | null }
// Returns null when message is null — safe to always render
import InlineError from '../components/InlineError';
```

### RefreshDatabase Test Trait
**Source:** `backend/tests/Feature/ExpenseApiTest.php` line 8
**Apply to:** `RecurringExpenseTest.php`
```php
use Illuminate\Foundation\Testing\RefreshDatabase;
// ...
class RecurringExpenseTest extends TestCase
{
    use RefreshDatabase;
```

---

## No Analog Found

All 13 files have analog coverage. No new patterns without existing codebase equivalents.

---

## Key Observations for Planner

1. **`is_recurring` Pitfall:** `backend/app/Models/Expense.php` line 23 explicitly defers `is_recurring` and `recurring_id` casts. These MUST be added to `$fillable` and `$casts` before `processRecurring()` can set them via `Expense::create()`. This is a prerequisite for every processRecurring() test to pass.

2. **`BudgetPage` does NOT use `InlineError`:** It uses a raw `<p>` tag (line 62). CONTEXT.md explicitly requires `InlineError` on RecurringPage. Use `<InlineError message={error} />`.

3. **`EmptyState` component is NOT reusable:** Its only prop is `{ filtered: boolean }` and its copy is expense-specific. RecurringPage must use an inline `<div>` with custom copy — same pattern as BudgetPage's empty state (lines 68–89).

4. **`RequireAuth` vs `ProtectedRoute`:** App.tsx defines `RequireAuth` inline (line 11). All existing routes use `<RequireAuth>`. Do not import `ProtectedRoute` into App.tsx.

5. **`last_created_date` must be set to `$nextDue`, not `Carbon::today()`:** Setting to today causes monthly/weekly recurrence to drift from the original start-date anchor.

6. **`processRecurring()` must be wrapped in try/catch:** Errors inside must not surface as a 500 on `GET /expenses`. Catch and log; never rethrow.

7. **Nav update scope:** 4 pages need the "Recurring" 4th nav link: `ExpensesPage.tsx`, `AnalyticsPage.tsx`, `BudgetPage.tsx`, and the new `RecurringPage.tsx` itself.

---

## Metadata

**Analog search scope:** `backend/app/Models/`, `backend/app/Http/Controllers/Api/`, `backend/database/migrations/`, `backend/tests/Feature/`, `frontend/src/types/`, `frontend/src/api/`, `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/App.tsx`, `backend/routes/api.php`
**Files read:** 16
**Pattern extraction date:** 2026-05-13
