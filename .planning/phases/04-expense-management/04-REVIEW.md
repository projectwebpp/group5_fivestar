---
phase: 04-expense-management
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - backend/app/Http/Controllers/Api/ExpenseController.php
  - backend/app/Http/Requests/StoreExpenseRequest.php
  - backend/app/Http/Requests/UpdateExpenseRequest.php
  - backend/app/Models/Expense.php
  - backend/app/Models/User.php
  - backend/database/migrations/2026_05_10_000002_add_user_id_to_expenses_table.php
  - backend/routes/api.php
  - backend/tests/Feature/CategoryTest.php
  - backend/tests/Feature/ExpenseApiTest.php
  - frontend/src/App.tsx
  - frontend/src/api/categories.ts
  - frontend/src/api/expenses.ts
  - frontend/src/components/EmptyState.tsx
  - frontend/src/components/ExpenseCard.tsx
  - frontend/src/components/FilterBar.tsx
  - frontend/src/components/InlineError.tsx
  - frontend/src/components/LoadingButton.tsx
  - frontend/src/components/Pagination.tsx
  - frontend/src/pages/ExpenseDetailPage.tsx
  - frontend/src/pages/ExpenseFormPage.tsx
  - frontend/src/pages/ExpensesPage.tsx
  - frontend/src/types/expense.ts
findings:
  critical: 0
  warning: 0
  info: 4
  total: 4
status: fixed
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

The phase 04 expense management implementation covers the full CRUD surface (backend controller, form requests, model, migration, routes) and a complete frontend (list, create, edit, detail pages plus shared components). The architecture is sound and ownership checks are consistently applied across all controller methods.

Five blockers were found: a category ownership bypass in `StoreExpenseRequest` that lets any user assign another user's category; a broken `currency` field in the `Expense` model that will always return `null`; the stale TODO in `CategoryController::destroy` that was never acted on (cross-user category-id probing is now possible); a date timezone bug that silently shifts expense dates for users west of UTC; and an unguarded cross-user update path in `ExpenseFormPage` that passes `category_id` belonging to a different user without server-side ownership check.

Six warnings and four info items cover missing filter validation, a duplicated API helper, dead model fields, and UX gaps.

---

## Critical Issues

### CR-01: Category ownership not verified on expense create/update — cross-user category assignment

**File:** `backend/app/Http/Requests/StoreExpenseRequest.php:20`

**Issue:** The `category_id` validation rule is `exists:categories,id` — it only checks that the category row exists in the table, not that it belongs to the authenticated user. An attacker can POST `/api/expenses` with any valid `category_id` from another user's account. The same flaw exists in `UpdateExpenseRequest` line 20. The expense is then stored under the attacker's `user_id` but referencing another user's category, leaking the fact that category ID N belongs to someone.

**Fix:** Scope the `exists` rule to the current user's categories in both request classes:

```php
// StoreExpenseRequest.php and UpdateExpenseRequest.php, inside rules()
use Illuminate\Validation\Rule;

'category_id' => [
    'required',   // or 'sometimes' for update
    'integer',
    Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
],
```

---

### CR-02: `currency` field missing from `Expense::$fillable` — always null after create

**File:** `backend/app/Models/Expense.php:10-17`

**Issue:** The `Expense::$fillable` array does not include `currency`. `ExpenseController::store` sets `'currency' => 'THB'` in the `create()` call (line 55), but because `currency` is not in `$fillable`, Laravel's mass-assignment guard silently drops it. The row is written with the database column default (`THB`), but when the model is then passed to `shape()`, `$expense->currency` returns `null` (the model instance never had the attribute set). The `shape()` result therefore contains `"currency": null`, breaking the contract the frontend type `Expense.currency: 'THB'` asserts.

**Fix:** Add `currency` to `$fillable`:

```php
protected $fillable = [
    'user_id',
    'amount',
    'currency',      // add this
    'category_id',
    'description',
    'expense_date',
    'notes',
];
```

Alternatively, call `$expense->fresh()` after `create()` in `store()` (as `update()` already does) so the attribute is reloaded from the DB default.

---

### CR-03: `CategoryController::destroy` TODO not completed — category-id enumeration across users

**File:** `backend/app/Http/Controllers/Api/CategoryController.php:69-72`

**Issue:** The comment left by the implementer (`TODO(Phase 4): scope this query to auth()->id() once expenses.user_id exists`) was never acted on. `expenses.user_id` now exists (migration `2026_05_10_000002`), but the query on line 72 is still unscoped:

```php
if (Expense::where('category_id', $category->id)->exists()) {
```

The authorization check on line 65 already prevents *deleting* another user's category (returns 404), so data mutation is safe. However, because `destroy` is reached only when the category belongs to the authenticated user, the unscoped query leaks information: if user A's category ID happens to be numerically equal to user B's `category_id` in an expense, user A's delete attempt returns 422 instead of 200, revealing that *some* expense references that ID without owning it. In this schema categories are per-user so IDs don't overlap in practice, but the code is incorrect by design and must be fixed before the schema assumption is safe to rely on.

**Fix:**

```php
if (Expense::where('category_id', $category->id)
          ->where('user_id', auth()->id())
          ->exists()) {
    return response()->error('Category has expenses and cannot be deleted', [], 422);
}
```

---

### CR-04: Off-by-one date shift — `new Date(expense.date)` parses ISO date as UTC midnight, displays previous day for users west of UTC

**File:** `frontend/src/components/ExpenseCard.tsx:9` and `frontend/src/pages/ExpenseDetailPage.tsx:54`

**Issue:** Both files construct a JS `Date` from `expense.date` (a `YYYY-MM-DD` string) using `new Date(expense.date)`. The ECMAScript specification treats date-only ISO strings as UTC midnight. When `.toLocaleDateString()` is called, it converts to the browser's local timezone. Any user whose timezone is behind UTC (e.g., UTC-5) will see the date displayed as the previous day — e.g., `2026-05-10` displays as `09 May`.

**Fix:** Parse the date without timezone conversion by splitting the string, or append `T00:00:00` to force local interpretation:

```tsx
// ExpenseCard.tsx line 9
const [year, month, day] = expense.date.split('-').map(Number);
const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
});
```

Apply the same fix in `ExpenseDetailPage.tsx` line 54.

---

### CR-05: `StoreExpenseRequest` category validation accepts categories from other users' scopes — also reproduced in `update` path via `ExpenseFormPage`

**File:** `frontend/src/pages/ExpenseFormPage.tsx:61-66`

**Issue:** In edit mode, `ExpenseFormPage` loads the expense (which contains the owner's `category_id`) and populates the category dropdown only with categories fetched via `listCategories()`. However, `listCategories()` swallows all errors with an empty catch and returns `[]` (see `frontend/src/api/categories.ts:37-44`). If the categories request fails after an expense loads, `categories` is `[]` while `categoryId` is the previously stored ID — not in the dropdown. The user sees "Select a category" selected, but the state holds the old numeric ID. On submit, the payload sends the old `category_id`, which passes backend validation (it belongs to the user) — so no data loss here — but the UX is misleading: the dropdown appears blank yet the form succeeds, making users think they submitted without a category.

More critically: the silent `return []` in `listCategories` means a 401 (token expiry) during category load is invisible to the user. The form stays interactive, and the next submit hits the API with an expired token, returning a 401 that is then shown as a generic "Something went wrong" error. The correct behavior is to surface the auth failure and redirect to `/auth`.

**Fix:** In `listCategories`, propagate authentication errors rather than swallowing them:

```ts
export async function listCategories(): Promise<Category[]> {
  const res = await apiClient.get<Envelope<Category[] | { items: Category[] }>>('/categories');
  const d = res.data.data;
  return Array.isArray(d) ? d : (d.items ?? []);
  // Let the caller (or a global interceptor) handle errors
}
```

And in `ExpenseFormPage`, handle the error from `listCategories`:

```ts
listCategories()
  .then(setCategories)
  .catch(() => setError('Failed to load categories. Please refresh.'))
  .finally(() => setCategoriesLoading(false));
```

---

## Warnings

### WR-01: `date_from` / `date_to` / `amount_min` / `amount_max` filter inputs not validated server-side

**File:** `backend/app/Http/Controllers/Api/ExpenseController.php:21-32`

**Issue:** The `index` method accepts `date_from`, `date_to`, `amount_min`, and `amount_max` query parameters and passes them directly to `whereDate` and `where` comparisons with no validation. An invalid `date_from` like `"not-a-date"` is passed to MySQL's `WHERE DATE(expense_date) >= 'not-a-date'`, which MySQL silently coerces to `0000-00-00`, returning all expenses. A negative `amount_min` is also accepted without complaint. This is not SQL-injectable (query builder uses bound parameters) but the semantics are silently wrong.

**Fix:** Add an inline validation block at the top of `index()`:

```php
$request->validate([
    'date_from'   => ['sometimes', 'date_format:Y-m-d'],
    'date_to'     => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:date_from'],
    'amount_min'  => ['sometimes', 'numeric', 'min:0'],
    'amount_max'  => ['sometimes', 'numeric', 'min:0', 'gte:amount_min'],
    'category_id' => ['sometimes', 'integer'],
]);
```

---

### WR-02: `FilterBar` category dropdown renders no options — filter by category is non-functional

**File:** `frontend/src/components/FilterBar.tsx:92-99`

**Issue:** The `<select>` for category filtering has only a static `<option value="">All categories</option>`. No categories are ever loaded into the component. The `FilterBarProps` interface does not include a `categories` prop, and the component never calls `listCategories`. The filter will always reset `category_id` to `''`. This is a feature regression — the backend supports category filtering and tests cover it, but the UI does not expose it.

**Fix:** Pass categories from the parent or load them inside `FilterBar`:

```tsx
// Option A: Accept categories as a prop
interface FilterBarProps {
  open: boolean;
  onToggle: () => void;
  filters: ExpenseFilters;
  onApply: (f: ExpenseFilters) => void;
  categories: Category[];   // add this
}

// Then in the select:
{categories.map(c => (
  <option key={c.id} value={c.id}>{c.name}</option>
))}
```

`ExpensesPage` already imports `listCategories` (indirectly via `ExpenseFormPage`); load categories there and pass them down.

---

### WR-03: `ExpensesPage` filter state is split between `filters` and `appliedFilters` — resetting filters clears `appliedFilters` but leaves `filters` stale

**File:** `frontend/src/pages/ExpensesPage.tsx:62`

**Issue:** `onApply` in `FilterBar` sets both `filters` (draft state displayed in FilterBar) and `appliedFilters` (what drives the API call). However there is no reset/clear button. More importantly, when the `FilterBar` `draft` state is initialized from `filters` prop (line 12 of `FilterBar.tsx`), and the user opens the filter panel *after* a previous apply, the `draft` is initialized from the last `filters` value passed by the parent. Since `filters` and `appliedFilters` are kept in sync by `onApply`, this is consistent — but `filters` is never updated when the user navigates to page 2 via `setAppliedFilters(a => ({ ...a, page: ... }))`. This means the FilterBar draft will always show `page: 1` to the user even while they are on page 3, which is only a cosmetic issue but could confuse debugging. A more substantial issue: there is no "clear filters" affordance; once a filter is applied, users cannot easily reset to the unfiltered view without manually clearing each field.

**Fix:** Add a "Clear" button in `FilterBar` that resets `draft` to `{ page: 1 }` and calls `onApply({ page: 1 })`.

---

### WR-04: `ExpenseFormPage` in edit mode allows submission when `id` is undefined

**File:** `frontend/src/pages/ExpenseFormPage.tsx:69-71`

**Issue:** In the `handleSubmit` function, when `mode === 'edit'`, the code calls `updateExpense(Number(id), payload)`. If `id` is `undefined` (which TypeScript allows since `useParams` returns `string | undefined`), `Number(undefined)` evaluates to `NaN`. The API call becomes `PUT /api/expenses/NaN`, which the backend will treat as a 404 (or potentially match unexpected routes). The route is protected by `RequireAuth` but `id` being undefined is a legitimate scenario if someone navigates to `/expenses//edit`.

**Fix:** Guard against missing `id`:

```ts
if (mode === 'edit' && !id) {
  setError('Invalid expense ID.');
  return;
}
```

---

### WR-05: `ExpenseCard` renders `Category #N` instead of category name — no category lookup on the list page

**File:** `frontend/src/components/ExpenseCard.tsx:37`

**Issue:** The card displays `Category #{expense.category_id}` as a raw ID number. The backend `shape()` method does not include `category_name` in the response (only `category_id`). `ExpensesPage` does not load categories. So every expense card in the list shows an opaque number instead of a human-readable name. `ExpenseDetailPage` resolves this by calling `listCategories()`, but `ExpensesPage` does not.

**Fix:** Either include `category_name` in the backend `shape()` response (preferred — one extra join), or load categories in `ExpensesPage` and pass the resolved name to `ExpenseCard`.

---

### WR-06: Auth guard in `App.tsx` reads raw `localStorage` without token expiry validation

**File:** `frontend/src/App.tsx:11`

**Issue:** `RequireAuth` only checks `localStorage.getItem('auth_token') !== null`. It does not validate whether the token is expired. An expired token passes the guard, the user is taken to the protected page, and all API calls immediately return 401. The user sees error banners rather than a redirect to `/auth`. This is a UX and soft-security defect — the API is still protected, but the frontend guard provides a false sense of access.

**Fix:** At minimum, decode the JWT expiry claim client-side and redirect to `/auth` if the token is expired. A global Axios response interceptor that redirects on 401 is an equally effective and simpler approach:

```ts
// in api/client.ts
apiClient.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);
```

---

## Info

### IN-01: Duplicate category API helpers — `getCategories` and `listCategories` both exist in `categories.ts`

**File:** `frontend/src/api/categories.ts:25-45`

**Issue:** The file exports both `getCategories` (line 25, raw Axios response) and `listCategories` (line 37, unwrapped array). Only `listCategories` is used by the expense pages. `getCategories` is presumably used by `CategoriesPage` (not in scope), but the duplication of similar intent with different return shapes is a maintenance hazard.

**Fix:** Verify whether `getCategories` is used anywhere. If only `listCategories` is needed by expense pages, remove `getCategories` or standardize on one helper.

---

### IN-02: `Expense` model casts `is_recurring` and references `recurring_id` — deferred v2 fields present in active model

**File:** `backend/app/Models/Expense.php:22`

**Issue:** `$casts` includes `'is_recurring' => 'bool'`, and the schema migration (`2026_01_01_000002`) creates `is_recurring` and `recurring_id` columns. These are v2 features explicitly deferred per `CLAUDE.md`. The model advertises these casts, creating an implicit API surface and confusion about whether they are part of the current contract.

**Fix:** Remove `'is_recurring' => 'bool'` from `$casts` for now, or add a comment making the v2 deferral explicit. The columns themselves can remain (they have defaults).

---

### IN-03: `notes` field missing from `Expense::$fillable` but referenced everywhere

**File:** `backend/app/Models/Expense.php:10-17`

**Issue:** `notes` is listed in `$fillable` (line 16), but the `shape()` method returns it, `StoreExpenseRequest` validates it, and `seedExpense` in tests passes it — so the presence in `$fillable` is correct. This is not a defect, but the `notes` field is never shown or editable in the frontend UI (`ExpenseFormPage` has no notes input). The stored value is therefore permanently `null` for all expenses created through the UI.

**Fix:** Add an optional `notes` textarea to `ExpenseFormPage` to expose the field, or defer it to v2 explicitly.

---

### IN-04: Migration creates duplicate index on `user_id` — `foreignId` already creates an index

**File:** `backend/database/migrations/2026_05_10_000002_add_user_id_to_expenses_table.php:13`

**Issue:** `$table->foreignId('user_id')->...->constrained(...)` implicitly creates an index on `user_id` in most database drivers. The explicit `$table->index('user_id')` on line 13 creates a second redundant index on the same column, wasting storage and slightly slowing writes.

**Fix:** Remove the explicit `$table->index('user_id')` call, and remove the corresponding `$table->dropIndex(['user_id'])` from the `down()` method.

---

_Reviewed: 2026-05-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
