---
phase: 06-budget-management
reviewed: 2026-05-12T13:26:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - backend/database/migrations/2026_05_12_000001_create_budgets_table.php
  - backend/app/Models/Budget.php
  - backend/app/Http/Controllers/Api/BudgetController.php
  - backend/routes/api.php
  - frontend/src/types/budget.ts
  - frontend/src/api/budgets.ts
  - frontend/src/pages/BudgetPage.tsx
  - frontend/src/App.tsx
  - frontend/src/pages/AnalyticsPage.tsx
  - frontend/src/pages/ExpensesPage.tsx
findings:
  critical: 4
  warning: 3
  info: 1
  total: 8
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-05-12T13:26:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Phase 6 implements budget management across a Laravel backend (migration, model, controller, routes) and a React/TypeScript frontend (types, API client, BudgetPage, and nav integration into existing pages). The feature itself is technically coherent — the data model is sound, ownership checks exist, and the UI flow is correct in the common case.

However, four critical defects were found:

1. The entire phase violates a locked project constraint: `CLAUDE.md` and `PROJECT.md` both explicitly state "Do not add budget features to v1." The budget routes are now deployed alongside v1 routes under the same auth guard. This is a scope violation against a documented locked decision.
2. `POST /api/budgets` (store) does not catch the unique-constraint violation. Submitting a duplicate (same user/category/month/year) crashes the server with an unhandled 500 instead of returning a user-facing error.
3. The `createBudget` and `updateBudget` API functions in `budgets.ts` declare `Promise<BudgetRow>` as their return type, but the backend returns a raw `Budget` model (no `category_name`, `spent`, or `remaining` fields). The types lie.
4. Amount validation omits the project-mandated "max 2 decimal places" rule on both store and update, allowing values like `100.999` to bypass validation and silently truncate in the database.

---

## Critical Issues

### CR-01: Entire Phase Violates Locked Scope Constraint

**File:** `backend/routes/api.php:46-49`, `backend/app/Http/Controllers/Api/BudgetController.php`, `backend/database/migrations/2026_05_12_000001_create_budgets_table.php`, `frontend/src/pages/BudgetPage.tsx`
**Issue:** `CLAUDE.md` contains a locked constraint: "Do not add budget, CSV export, or recurring features to v1." The Key Decisions section also lists "Budget/CSV/Recurring deferred to v2." Despite this, Phase 6 fully implements and wires up budget management — migration, model, controller, four new API routes, a new frontend page, and nav links in two existing pages. `PROJECT.md` confirms these are REQ-20/21/22 under the "Active (v2.0)" milestone, not v1. The budget routes are now reachable in the deployed v1 codebase.

This is not a retroactive concern — the constraint predates this phase and was documented as a locked decision. The code should not have been merged to main without a documented scope-change approval overriding the CLAUDE.md constraint.

**Fix:** Either (a) get explicit team sign-off that v2 work is being merged to the main branch intentionally and update `CLAUDE.md` to reflect the scope change, or (b) revert the budget-related changes from main and work them on a separate `v2` branch. At minimum the constraint in `CLAUDE.md` must be updated to reflect the actual state of the codebase.

---

### CR-02: Unhandled Unique Constraint Violation — 500 on Duplicate Budget Creation

**File:** `backend/app/Http/Controllers/Api/BudgetController.php:99-107`
**Issue:** The database enforces `UNIQUE(user_id, category_id, month, year)` (migration line 20). The `store()` method calls `Budget::create()` with no try/catch. If a record already exists for that combination, Laravel throws an `Illuminate\Database\UniqueConstraintViolationException` (Laravel 10+) or a `QueryException` with MySQL error 1062. No exception handler is registered in `bootstrap/app.php` to convert this to a JSON response — it propagates as an unhandled 500 error.

Race condition aside, a user can also trigger this by opening two tabs or if the frontend retries a failed request that actually succeeded.

```php
// store() — BudgetController.php:99
public function store(Request $request)
{
    // ... validation and ownership check ...

    // FIX: wrap in try/catch for unique violation
    try {
        $budget = Budget::create([
            'user_id'     => $userId,
            'category_id' => $data['category_id'],
            'month'       => $data['month'],
            'year'        => $data['year'],
            'amount'      => $data['amount'],
        ]);
    } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
        return response()->error('A budget already exists for this category and period.', [], 422);
    }

    return response()->success($budget, 'Budget created', 201);
}
```

Alternatively, use `updateOrCreate()` to make the operation idempotent, or add a uniqueness validation rule before the insert using `Rule::unique`.

---

### CR-03: API Client Return Types Lie — `createBudget` and `updateBudget` Return Budget Model, Not BudgetRow

**File:** `frontend/src/api/budgets.ts:20-31`
**Issue:** Both `createBudget` and `updateBudget` are declared to return `Promise<BudgetRow>`. `BudgetRow` has shape `{ category_id, category_name, budget_id, limit, spent, remaining }`. However, the backend `store()` (line 107) and `update()` (line 131) both return the raw `Budget` Eloquent model, which serializes to `{ id, user_id, category_id, month, year, amount, created_at, updated_at }`. Fields `category_name`, `budget_id`, `limit`, `spent`, and `remaining` are absent.

TypeScript will not catch this at runtime. Any caller that consumes the returned value expecting `BudgetRow` shape will get `undefined` for those fields. The current `BudgetPage.tsx` discards the return values (lines 35-39), so there is no immediate runtime crash — but the incorrect type declaration is a trap for any future caller.

**Fix:**

```typescript
// Option A — correct the return type to match what the backend actually sends
export interface StoredBudget {
  id: number;
  user_id: number;
  category_id: number;
  month: number;
  year: number;
  amount: number;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<StoredBudget> { ... }
export async function updateBudget(id: number, payload: UpdateBudgetPayload): Promise<StoredBudget> { ... }

// Option B — have the backend store/update return the full BudgetRow shape
// (requires rewriting store/update to query and return the same shape as index())
```

---

### CR-04: Amount Validation Missing "Max 2 Decimal Places" Constraint

**File:** `backend/app/Http/Controllers/Api/BudgetController.php:84` and `117`
**Issue:** The project constraint in `CLAUDE.md` states: "Amount validation: > 0, max 2 decimal places." The `store` and `update` validation rules are:

```php
'amount' => ['required', 'numeric', 'gt:0'],
```

There is no decimal-precision rule. An input of `100.999` passes validation, gets stored, and is silently truncated to `100.99` by the MySQL `DECIMAL(10,2)` column. The stored value differs from the submitted value without any error or warning to the user. Laravel 10+ provides the `decimal:2` validation rule which rejects values with more than 2 decimal places.

**Fix:**

```php
// store() and update() — both locations
'amount' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
```

The `decimal:min,max` rule (Laravel 10.13+) allows 0 to 2 decimal places and rejects anything more precise.

---

## Warnings

### WR-01: `handleSave` Silent No-Op When Input Is Empty and No Budget Exists

**File:** `frontend/src/pages/BudgetPage.tsx:31-46`
**Issue:** The `handleSave` conditional has four possible states but only three branches:

| `editValue` | `budget_id` | Action |
|---|---|---|
| empty / <= 0 | not null | delete (line 34-35) |
| > 0 | not null | update (line 36-37) |
| > 0 | null | create (line 38-39) |
| empty / <= 0 | null | **no branch** — falls through silently |

When a row has no budget set, the user clicks the limit cell, clears the input (or leaves it blank), and clicks Save — `handleSave` runs, no API call is made, `setEditingId(null)` closes the editor, and `fetchRows()` re-fetches. Visually it appears to succeed. There is no feedback that nothing happened. This is confusing UX that masks a dead code path.

**Fix:**

```tsx
const handleSave = async (row: BudgetRow) => {
  const amount = parseFloat(editValue);
  try {
    if ((!editValue || amount <= 0) && row.budget_id !== null) {
      await deleteBudget(row.budget_id);
    } else if (amount > 0 && row.budget_id !== null) {
      await updateBudget(row.budget_id, { amount });
    } else if (amount > 0 && row.budget_id === null) {
      await createBudget({ category_id: row.category_id, month: currentMonth, year: currentYear, amount });
    } else {
      // No budget to delete and no valid amount — just cancel
      setEditingId(null);
      return;
    }
    setEditingId(null);
    fetchRows();
  } catch {
    setError('Failed to save budget. Please try again.');
  }
};
```

---

### WR-02: `year` Validation Has No Upper Bound

**File:** `backend/app/Http/Controllers/Api/BudgetController.php:21` and `83`
**Issue:** The `year` validation rule is `['required', 'integer', 'min:2000']` with no `max`. A client can submit `year: 9999` (or any arbitrary large integer), creating budget rows that can never be meaningfully queried. The `month/year` pair controls which expenses are aggregated in the `index()` spend calculation — there is no logical reason to allow years far beyond the current year.

**Fix:**

```php
'year' => ['required', 'integer', 'min:2000', 'max:2100'],
```

Or use a dynamic bound: `'max:' . (date('Y') + 1)` to allow budget setting one year ahead.

---

### WR-03: `fetchRows` Defined Inside Component Without `useCallback` — Stale Closure Risk

**File:** `frontend/src/pages/BudgetPage.tsx:17-24`
**Issue:** `fetchRows` is defined as a plain function inside the component body. It captures `currentMonth` and `currentYear` from the closure, which are derived from `new Date()` at render time. Since `BudgetPage` does not use `useCallback`, every render recreates `fetchRows`. The `useEffect` on line 26-29 correctly runs only on mount (empty dep array), so this does not cause an infinite loop. However, when `handleSave` calls `fetchRows()` after a mutation, it is calling the closure instance at that moment — which is fine in this case since the date values never change during a session.

The actual risk is more subtle: the `eslint-disable-next-line react-hooks/exhaustive-deps` comment on line 28 suppresses the warning about `fetchRows` being a missing dependency, which could mask a real stale-closure bug if `fetchRows` is ever modified to depend on state that changes. This comment should be removed and `fetchRows` should be wrapped in `useCallback`.

**Fix:**

```tsx
const fetchRows = useCallback(() => {
  setLoading(true);
  setError(null);
  getBudgets(currentMonth, currentYear)
    .then(data => setRows(data))
    .catch(() => setError('Failed to load budgets. Please try again.'))
    .finally(() => setLoading(false));
}, [currentMonth, currentYear]);

useEffect(() => {
  fetchRows();
}, [fetchRows]); // eslint-disable-next-line removed — deps are now correct
```

---

## Info

### IN-01: `Budget` Model Casts `amount` as `'float'` — Should Use `'decimal:2'`

**File:** `backend/app/Models/Budget.php:14`
**Issue:** The `amount` field is cast to `'float'`, which uses PHP's native float type. PHP floats have well-known binary precision issues (e.g., `0.1 + 0.2 !== 0.3`). The database column is `DECIMAL(10,2)`, which stores exact values. Casting to `float` on retrieval can introduce tiny floating-point drift in edge cases when the value is further manipulated in PHP. Laravel's `'decimal:2'` cast preserves the value as a string with exactly 2 decimal places, matching the database type semantically.

**Fix:**

```php
protected $casts = [
    'month'  => 'integer',
    'year'   => 'integer',
    'amount' => 'decimal:2',
];
```

Note: this changes the serialized JSON type from a float number to a numeric string (e.g., `"100.00"` instead of `100`). If the frontend `BudgetRow.limit` field is typed as `number`, it will need to be updated to `number | string` or the backend should cast back to float before returning. Evaluate the trade-off.

---

_Reviewed: 2026-05-12T13:26:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
