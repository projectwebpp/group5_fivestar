# Phase 3: Categories - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 11 (7 new, 4 modified)
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/database/migrations/2026_05_10_000001_add_user_id_to_categories_table.php` | migration | transform | `backend/database/migrations/2026_05_09_000001_create_users_table.php` | role-match (create vs alter) |
| `backend/app/Models/Category.php` | model | CRUD | `backend/app/Models/User.php` | exact |
| `backend/app/Models/Expense.php` (stub) | model | CRUD | `backend/app/Models/User.php` | role-match |
| `backend/app/Http/Controllers/Api/CategoryController.php` | controller | request-response | `backend/app/Http/Controllers/Api/AuthController.php` | exact |
| `backend/routes/api.php` (modified) | route | request-response | `backend/routes/api.php` | exact (self-analog) |
| `backend/app/Http/Controllers/Api/AuthController.php` (modified) | controller | request-response | `backend/app/Http/Controllers/Api/AuthController.php` | exact (self-analog) |
| `backend/app/Models/User.php` (modified) | model | CRUD | `backend/app/Models/User.php` | exact (self-analog) |
| `backend/database/seeders/CategorySeeder.php` (modified) | seeder | batch | `backend/database/seeders/CategorySeeder.php` | exact (self-analog) |
| `backend/tests/Feature/CategoryTest.php` | test | request-response | `backend/tests/Feature/AuthTest.php` | exact |
| `frontend/src/api/categories.ts` | service | request-response | `frontend/src/api/client.ts` | role-match |
| `frontend/src/pages/CategoriesPage.tsx` | component | request-response | `frontend/src/pages/AuthPage.tsx` | exact |

---

## Pattern Assignments

### `backend/database/migrations/2026_05_10_000001_add_user_id_to_categories_table.php` (migration, transform)

**Analog:** `backend/database/migrations/2026_05_09_000001_create_users_table.php`

**File wrapper pattern** (lines 1-7 of users migration — all migrations use this anonymous class form):
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
```

**Core alter pattern** — there is no existing `Schema::table` analog in the codebase; use the Laravel 13 native pattern from RESEARCH.md Pattern 2. The categories migration (lines 11-21) shows the `Schema::create` form for reference on index naming:
```php
// Existing index name to drop (from 2026_01_01_000001_create_categories_table.php line 13):
$table->string('name', 50)->unique();  // creates index named 'categories_name_unique'

// Phase 3 up() — alter existing table:
public function up(): void
{
    Schema::table('categories', function (Blueprint $table) {
        $table->unsignedBigInteger('user_id')->after('id');
        $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        $table->dropUnique('categories_name_unique');
        $table->unique(['user_id', 'name']);
    });
}

public function down(): void
{
    Schema::table('categories', function (Blueprint $table) {
        $table->dropForeign(['user_id']);
        $table->dropUnique(['user_id', 'name']);
        $table->dropColumn('user_id');
        $table->unique('name');
    });
}
```

**Critical notes:**
- Migration must be dated `2026_05_10_XXXXXX` or later — users table is `2026_05_09_000001`; FK must resolve after users table exists.
- `doctrine/dbal` is NOT installed and NOT needed — Laravel 13 handles native alter.
- SQLite in-memory (tests) Pitfall 7: if `dropUnique` fails under SQLite, the workaround is verifying the test suite post-migration run (ASSUMED safe per RESEARCH.md).

---

### `backend/app/Models/Category.php` (model, CRUD)

**Analog:** `backend/app/Models/User.php`

**Imports pattern** (lines 1-6 of User.php):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
```

**Core model pattern** — adapt from User.php `$fillable` (lines 20-23) and `$hidden` (lines 30-33) structure:
```php
class Category extends Model
{
    protected $fillable = ['user_id', 'name', 'icon', 'color'];

    // budget is v2; description omitted from v1 API per RESEARCH.md Open Question 2
    protected $hidden = ['budget', 'description'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

**Key rules:**
- `'description'` and `'budget'` are NOT in `$fillable` — they must not be mass-assignable in v1.
- `$hidden` keeps both columns out of JSON serialization so API responses never leak `budget: null`.
- No `JWTSubject` interface — Category is a plain Eloquent Model (not Authenticatable).

---

### `backend/app/Models/Expense.php` (model stub, CRUD)

**Analog:** `backend/app/Models/User.php`

**Minimal stub pattern** — needed only so `CategoryController` can `use App\Models\Expense` without import failure. Copy the structural shell from User.php (lines 1-4, replace class body):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'amount',
        'currency',
        'category_id',
        'description',
        'expense_date',
        'notes',
    ];
}
```

**Note:** The expenses table schema (confirmed from `2026_01_01_000002_create_expenses_table.php` lines 11-26) has NO `user_id` column. Do NOT add `user_id` to `$fillable` — Phase 4 will own the full Expense model.

---

### `backend/app/Http/Controllers/Api/CategoryController.php` (controller, request-response)

**Analog:** `backend/app/Http/Controllers/Api/AuthController.php`

**Imports pattern** (AuthController.php lines 1-8 — copy namespace and base imports, extend with Category/Expense/Rule):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
```

**Auth/guard pattern** — copy ownership check form from AuthController's conditional guard pattern (AuthController.php line 32: `if (! $token = auth()->attempt($credentials))`). For CategoryController, adapt to owner check:
```php
// Used in update() and destroy() before any mutation:
if ($category->user_id !== auth()->id()) {
    return response()->error('Not found', [], 404);
}
```

**Core CRUD pattern** — `index()` and `store()` follow the validate→create→success form from AuthController.php lines 14-23:
```php
// index() — user-scoped list
public function index(): JsonResponse
{
    $categories = Category::where('user_id', auth()->id())
        ->orderBy('name')
        ->get();
    return response()->success($categories, 'Categories retrieved');
}

// store() — validate, merge user_id, create
public function store(Request $request): JsonResponse
{
    $data = $request->validate([
        'name'  => [
            'required', 'string', 'max:50',
            Rule::unique('categories')->where('user_id', auth()->id()),
        ],
        'icon'  => 'required|string|max:50',
        'color' => 'required|string|size:7',
    ]);

    $category = Category::create(array_merge($data, ['user_id' => auth()->id()]));
    return response()->success($category, 'Category created', 201);
}
```

**Update pattern** (owner check + Rule::unique ignore self):
```php
public function update(Request $request, Category $category): JsonResponse
{
    if ($category->user_id !== auth()->id()) {
        return response()->error('Not found', [], 404);
    }

    $data = $request->validate([
        'name'  => [
            'required', 'string', 'max:50',
            Rule::unique('categories')->where('user_id', auth()->id())->ignore($category->id),
        ],
        'icon'  => 'required|string|max:50',
        'color' => 'required|string|size:7',
    ]);

    $category->update($data);
    return response()->success($category->fresh(), 'Category updated');
}
```

**Delete/guard pattern** (owner check → deletion guard → delete):
```php
public function destroy(Category $category): JsonResponse
{
    if ($category->user_id !== auth()->id()) {
        return response()->error('Not found', [], 404);
    }

    // CRITICAL: use single-condition guard — expenses table has NO user_id column (confirmed)
    if (Expense::where('category_id', $category->id)->exists()) {
        return response()->error('Category has expenses and cannot be deleted', [], 422);
    }

    $category->delete();
    return response()->success(null, 'Category deleted');
}
```

**Error handling pattern** — copy from AppServiceProvider.php (lines 22-28). Always use macros — never `response()->json()` directly:
```php
// success macro signature:
response()->success(mixed $data, string $message, int $status = 200)
// error macro signature:
response()->error(string $message, array $errors = [], int $status = 400)
```

---

### `backend/routes/api.php` (modified — add category routes)

**Analog:** `backend/routes/api.php` (self)

**Existing group to extend** (api.php lines 23-27 — the placeholder protected group):
```php
// Protected API surface (AUTH-04) — populated in Phases 3-5
Route::middleware('jwt.auth')->group(function () {
    // Phase 3: category routes     ← insert here
    // Phase 4: expense routes
    // Phase 5: analytics routes
});
```

**Route registration pattern** — copy the explicit route form from lines 11-14 (auth prefix group), no `apiResource`:
```php
// Add these imports at the top alongside AuthController and HealthController:
use App\Http\Controllers\Api\CategoryController;

// Insert inside the existing jwt.auth group:
Route::get('categories',                  [CategoryController::class, 'index']);
Route::post('categories',                 [CategoryController::class, 'store']);
Route::put('categories/{category}',       [CategoryController::class, 'update']);
Route::delete('categories/{category}',    [CategoryController::class, 'destroy']);
```

**Note:** No `Route::prefix('categories')` wrapper needed — the explicit route list is unambiguous and matches the pattern already used for auth routes.

---

### `backend/app/Http/Controllers/Api/AuthController.php` (modified — add default seeding in register())

**Analog:** `backend/app/Http/Controllers/Api/AuthController.php` (self)

**Insertion point** — after `User::create($data)` on line 19, before `auth()->login($user)` on line 20. Add import for Category at the top (line 7 area):
```php
use App\Models\Category;
```

**Seeding block to insert** (between lines 19 and 20):
```php
$user = User::create($data);

// D-02: seed 10 default categories per new user at registration
$defaults = [
    ['name' => 'Food',          'icon' => 'utensils',     'color' => '#FF6B6B'],
    ['name' => 'Transport',     'icon' => 'car',          'color' => '#4ECDC4'],
    ['name' => 'Housing',       'icon' => 'home',         'color' => '#FFE66D'],
    ['name' => 'Education',     'icon' => 'book',         'color' => '#95E1D3'],
    ['name' => 'Health',        'icon' => 'heart',        'color' => '#F38181'],
    ['name' => 'Entertainment', 'icon' => 'gamepad-2',    'color' => '#AA96DA'],
    ['name' => 'Shopping',      'icon' => 'shopping-bag', 'color' => '#FCBAD3'],
    ['name' => 'Utilities',     'icon' => 'zap',          'color' => '#A8D8EA'],
    ['name' => 'Business',      'icon' => 'briefcase',    'color' => '#C1D82F'],
    ['name' => 'Other',         'icon' => 'gift',         'color' => '#999999'],
];
foreach ($defaults as $cat) {
    Category::create(array_merge($cat, ['user_id' => $user->id]));
}

$token = auth()->login($user);
```

**Critical:** icon name is `'gamepad-2'` (not `'gamepad'`) — CategorySeeder has the old name; this block must use `'gamepad-2'` to match lucide-react's `Gamepad2` export.

---

### `backend/app/Models/User.php` (modified — add hasMany relationship)

**Analog:** `backend/app/Models/User.php` (self)

**Insertion point** — after the `getJWTCustomClaims()` method (line 55), before the closing `}` on line 57:
```php
public function categories()
{
    return $this->hasMany(Category::class);
}
```

**Import to add** at line 7 area:
```php
use App\Models\Category;
```

No other changes to User.php — `$fillable`, `$hidden`, `$casts`, and JWT methods are unchanged.

---

### `backend/database/seeders/CategorySeeder.php` (modified — make user_id-safe)

**Analog:** `backend/database/seeders/CategorySeeder.php` (self)

**Current run() method** (lines 11-31) uses `DB::table('categories')->insertOrIgnore(...)` without `user_id`. After the Phase 3 migration adds `user_id NOT NULL`, this throws an integrity constraint violation.

**Replacement run() body** — keep class wrapper (lines 1-9) unchanged, replace only the method body:
```php
public function run(): void
{
    // Safety: after Phase 3 migration, categories.user_id is NOT NULL.
    // The seeder is a dev convenience only — AuthController::register() is the production path.
    // Skip silently when no users exist to avoid NOT NULL constraint violation.
    if (\App\Models\User::count() === 0) {
        return;
    }
    // If a developer creates a user first (e.g., via tinker), the seeder is a no-op.
    // Registration is the canonical seeding path.
}
```

**Remove** the `use Illuminate\Support\Facades\DB;` import if nothing else in the file uses it (it won't be needed after the method body is replaced).

---

### `backend/tests/Feature/CategoryTest.php` (test, request-response)

**Analog:** `backend/tests/Feature/AuthTest.php`

**Class structure pattern** (AuthTest.php lines 1-12):
```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;
```

**Additional imports needed** (no analog in AuthTest — add for Category):
```php
use App\Models\Category;
```

**Helper pattern** — AuthTest uses factory create + token extract from register response. CategoryTest needs an authenticated client helper. Copy the two-step pattern from AuthTest.php lines 86-92:
```php
// Reusable helper in CategoryTest — register and return [user, token]:
private function registerAndGetToken(string $email = 'test@example.com'): array
{
    $res = $this->postJson('/api/auth/register', [
        'email' => $email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);
    $token = $res->json('data.token');
    $user  = User::where('email', $email)->first();
    return [$user, $token];
}
```

**Assertion pattern** — copy from AuthTest.php lines 22-25:
```php
$response->assertStatus(200)
    ->assertJson(['success' => true])
    ->assertJsonPath('data.0.name', fn ($v) => is_string($v));
```

**401 assertion pattern** (AuthTest.php line 104):
```php
$this->getJson('/api/categories')->assertStatus(401);
```

**422 assertion pattern** (AuthTest.php lines 36-39):
```php
$response->assertStatus(422);
```

**Database assertion pattern** (AuthTest.php line 25):
```php
$this->assertDatabaseHas('categories', ['name' => 'Food', 'user_id' => $user->id]);
$this->assertDatabaseMissing('categories', ['name' => 'Test', 'user_id' => $otherUser->id]);
```

**Test methods to implement** (9 total, per RESEARCH.md Validation Architecture):
- `test_register_seeds_default_categories` — register → assert 10 categories in DB with correct user_id
- `test_list_returns_only_own_categories` — two users, assert list scoping
- `test_unauthenticated_request_returns_401` — no token → 401
- `test_user_can_create_category` — POST with valid payload → 201 + DB row
- `test_duplicate_category_name_returns_422` — POST same name twice → 422 on second
- `test_user_can_update_category` — PUT with valid payload → 200 + updated values
- `test_user_cannot_update_other_users_category` — cross-user PUT → 404
- `test_user_can_delete_category` — DELETE with no expenses → 200
- `test_delete_blocked_if_category_has_expenses` — insert expense row → DELETE → 422

---

### `frontend/src/api/categories.ts` (service, request-response)

**Analog:** `frontend/src/api/client.ts`

**Import pattern** (client.ts lines 1-9 — import the default export, not a named export):
```typescript
import apiClient from './client';
```

**Type definition pattern** — copy the `interface` form used in AuthPage.tsx (lines 8-17) and HomePage.tsx (lines 4-11):
```typescript
export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  icon: string;
  color: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  message: string;
}
```

**API function pattern** — copy the typed `.get<T>` / `.post<T>` call form from HomePage.tsx line 19 (`apiClient.get<HealthResponse>('/health')`):
```typescript
export const getCategories = () =>
  apiClient.get<Envelope<Category[]>>('/categories');

export const createCategory = (payload: CategoryPayload) =>
  apiClient.post<Envelope<Category>>('/categories', payload);

export const updateCategory = (id: number, payload: CategoryPayload) =>
  apiClient.put<Envelope<Category>>(`/categories/${id}`, payload);

export const deleteCategory = (id: number) =>
  apiClient.delete<Envelope<null>>(`/categories/${id}`);
```

**Note:** Never create a second axios instance — import `apiClient` from `./client`. The Bearer token interceptor (client.ts lines 12-18) auto-injects the JWT on every request.

---

### `frontend/src/pages/CategoriesPage.tsx` (component, request-response)

**Analog:** `frontend/src/pages/AuthPage.tsx`

**Imports pattern** (AuthPage.tsx lines 1-4 — copy structure, swap content):
```typescript
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Utensils, Car, Home, Book, Heart, Gamepad2,
         ShoppingBag, Zap, Briefcase, Gift,
         Coffee, Plane, Music, Dumbbell, Smartphone,
         Pencil, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory,
         deleteCategory, type Category, type CategoryPayload } from '../api/categories';
```

**Page container pattern** (AuthPage.tsx line 75 — copy exactly):
```typescript
<div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
```

**State initialization pattern** (AuthPage.tsx lines 19-25 — extend this pattern):
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```
Extended for CategoriesPage:
```typescript
const [categories, setCategories]         = useState<Category[]>([]);
const [loading, setLoading]               = useState(true);
const [pageError, setPageError]           = useState<string | null>(null);
const [modalOpen, setModalOpen]           = useState(false);
const [editingCategory, setEditingCategory] = useState<Category | null>(null);
const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
const [deleteErrors, setDeleteErrors]     = useState<Record<number, string>>({});
const [formName, setFormName]             = useState('');
const [formIcon, setFormIcon]             = useState('utensils');
const [formColor, setFormColor]           = useState('#FF6B6B');
const [formLoading, setFormLoading]       = useState(false);
const [formError, setFormError]           = useState<string | null>(null);
```

**useEffect fetch pattern** (copy from HomePage.tsx lines 17-27):
```typescript
useEffect(() => {
  getCategories()
    .then((res) => setCategories(res.data.data))
    .catch(() => setPageError('Failed to load categories. Please refresh.'))
    .finally(() => setLoading(false));
}, []);
```

**Async handler with loading/error pattern** (AuthPage.tsx lines 34-58 — copy the try/catch/finally structure exactly):
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError(null);
  setFormLoading(true);
  try {
    const payload: CategoryPayload = { name: formName, icon: formIcon, color: formColor };
    if (editingCategory) {
      const res = await updateCategory(editingCategory.id, payload);
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? res.data.data : c));
    } else {
      const res = await createCategory(payload);
      setCategories(prev => [...prev, res.data.data]);
    }
    closeModal();
  } catch (err) {
    const msg = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? 'Something went wrong. Please try again.';
    setFormError(msg);
  } finally {
    setFormLoading(false);
  }
};
```

**Error message pattern** (AuthPage.tsx lines 150-153 — copy exactly):
```typescript
{formError && (
  <p style={{ color: 'red', marginTop: '0.75rem' }} role="alert">
    {formError}
  </p>
)}
```

**Submit button disabled pattern** (AuthPage.tsx lines 142-147):
```typescript
<button
  type="submit"
  disabled={formLoading}
  style={{ padding: '0.5rem 1rem', cursor: formLoading ? 'not-allowed' : 'pointer' }}
>
  {formLoading ? 'Saving...' : (editingCategory ? 'Save Category' : 'Save Category')}
</button>
```

**Card grid layout** (from UI-SPEC.md Component Inventory section 2):
```typescript
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '1rem',
}}>
  {categories.map(category => (
    <div key={category.id} style={{
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
    }}>
      {/* color swatch, icon, name, edit/delete actions */}
    </div>
  ))}
</div>
```

**Modal overlay pattern** (from RESEARCH.md Pattern 10 + UI-SPEC.md section 3):
```typescript
{modalOpen && (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}
  >
    <div style={{
      backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem',
      minWidth: '320px', maxWidth: '480px', width: '90%',
    }}>
      <h2 id="modal-title">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
      {/* form fields */}
    </div>
  </div>
)}
```

**Icon component lookup pattern** (from RESEARCH.md Pattern 9):
```typescript
const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  'utensils': Utensils, 'car': Car, 'home': Home, 'book': Book, 'heart': Heart,
  'gamepad-2': Gamepad2, 'shopping-bag': ShoppingBag, 'zap': Zap,
  'briefcase': Briefcase, 'gift': Gift, 'coffee': Coffee, 'plane': Plane,
  'music': Music, 'dumbbell': Dumbbell, 'smartphone': Smartphone,
};

// In card render:
const IconComponent = ICON_MAP[category.icon] ?? Gift;
<IconComponent size={20} />
```

---

## Shared Patterns

### Response Macros (apply to ALL CategoryController methods)

**Source:** `backend/app/Providers/AppServiceProvider.php` lines 14-28

```php
// Success — data can be null, Collection, or Model
response()->success(mixed $data, string $message, int $status = 200)
// Returns: { "success": true, "data": ..., "message": "..." }

// Error — errors array is optional metadata
response()->error(string $message, array $errors = [], int $status = 400)
// Returns: { "success": false, "message": "...", "errors": [...] }
```

**Never use** `response()->json([...])` directly — the macros enforce the `{success, data, message}` envelope required by CLAUDE.md.

---

### JWT Auth Middleware (apply to ALL category routes)

**Source:** `backend/routes/api.php` lines 17 and 23

```php
Route::middleware('jwt.auth')->group(function () {
    // all category routes go here — jwt.auth already wired as alias
});
```

Category routes must go inside the **existing** `Route::middleware('jwt.auth')->group(...)` block at lines 23-27 — do NOT create a new middleware group.

---

### Inline Error Display (apply to CategoriesPage modal form AND delete confirm)

**Source:** `frontend/src/pages/AuthPage.tsx` lines 150-153

```typescript
{error && (
  <p style={{ color: 'red', marginTop: '0.75rem' }} role="alert">
    {error}
  </p>
)}
```

Use `role="alert"` on all error paragraphs. This applies to:
- Modal form error (`formError`)
- Page-load error (`pageError`)
- Per-card delete error (`deleteErrors[category.id]`)

---

### Axios Error Shape (apply to ALL frontend API handlers)

**Source:** `frontend/src/pages/AuthPage.tsx` lines 52-55

```typescript
const msg =
  (err as AxiosErrorShape)?.response?.data?.message ?? 'Something went wrong';
setError(msg);
```

Use optional chaining down to `.response.data.message` — the backend's `response()->error()` macro always puts the human-readable message at that path.

---

### Loading State / Disabled Button (apply to modal submit and delete confirm)

**Source:** `frontend/src/pages/AuthPage.tsx` lines 142-148 and 68-72

```typescript
// Button disabled during async call:
<button type="submit" disabled={loading} style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
  {loading ? 'Loading...' : 'Submit'}
</button>
```

For the category modal: `disabled={formLoading}`, label changes to `'Saving...'`.
For delete confirm button: `disabled` while delete API call is in-flight.

---

### Inline Styles Only (apply to ALL frontend files in Phase 3)

**Source:** `frontend/src/pages/AuthPage.tsx` line 75 and `frontend/src/pages/HomePage.tsx` line 31

```typescript
// Page wrapper — copy exactly:
<div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>

// Form field bottom margin — copy exactly (12px not 16px):
<div style={{ marginBottom: '0.75rem' }}>

// Input width — copy exactly:
<input style={{ width: '100%', padding: '0.5rem' }} />
```

No CSS modules. No Tailwind. No className-based styling. All styles are inline `style` props only.

---

## No Analog Found

All files have at least a role-match analog in the codebase. No files require falling back to RESEARCH.md patterns exclusively — however the migration `Schema::table` alter pattern has no existing codebase example (all current migrations use `Schema::create`). Use RESEARCH.md Pattern 2 for the alter-table form.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `backend/database/migrations/2026_05_10_000001_add_user_id_to_categories_table.php` | migration | transform | No `Schema::table` alter-type migration exists in codebase — all existing migrations use `Schema::create`. Use RESEARCH.md Pattern 2 for the alter form. |

---

## Metadata

**Analog search scope:** `backend/app/`, `backend/database/`, `backend/routes/`, `backend/tests/`, `frontend/src/`
**Files scanned:** 12 source files read
**Pattern extraction date:** 2026-05-10
