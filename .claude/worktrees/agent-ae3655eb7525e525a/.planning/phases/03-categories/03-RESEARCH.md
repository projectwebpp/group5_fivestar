# Phase 3: Categories - Research

**Researched:** 2026-05-10
**Domain:** Laravel resource CRUD API + React TypeScript modal UI + per-user data scoping
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Categories are per-user. New migration adds `user_id BIGINT UNSIGNED NOT NULL`, drops existing `name` unique index, adds composite unique on `(user_id, name)`, adds FK to `users.id` with `onDelete('cascade')`.
- **D-02:** 10 default categories seeded per user at registration time inside `AuthController::register()` immediately after `User::create()`.
- **D-03:** No predefined vs custom distinction — all categories equal; any can be edited or deleted.
- **D-04:** Delete guard: check `Expense::where('category_id', $id)->exists()` before delete (see Pitfall 1 — D-04 as written in CONTEXT.md references `where('user_id', ...)` on expenses, but expenses table has NO `user_id` column; use simpler guard). Return 422 on block.
- **D-05:** Icons stored as varchar(50). Frontend uses `lucide-react` (not yet installed). Preset grid of 15 Lucide icon names — defined in UI spec.
- **D-06:** Color stored as 7-char hex. User picks from preset grid of 12 hex swatches — defined in UI spec.
- **D-07:** CategoriesPage = color-coded cards grid.
- **D-08:** Create/edit form = modal overlay.
- **D-09:** Delete = inline confirm pattern (no modal/toast). State: idle → confirming → deleted/error.
- **D-10:** Navigation from HomePage. `/categories` route already wrapped in `ProtectedRoute` in `App.tsx`.
- **D-11:** CategorySeeder must be updated to skip silently when no users exist (it is called by `DatabaseSeeder`).

### Claude's Discretion
- Exact 15 icon names in the preset grid (defined in UI spec: utensils, car, home, book, heart, gamepad-2, shopping-bag, zap, briefcase, gift, coffee, plane, music, dumbbell, smartphone)
- Exact 12 color swatches (defined in UI spec — seeder colors plus amber + green)
- Whether to use React context or prop-drilling for modal state — planner decides
- HTTP verb for update: PUT (full replace) or PATCH — planner decides
- Whether `description` column is exposed in UI — planner decides (can omit for v1 simplicity)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 3 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-01 | System provides predefined default categories | D-02: AuthController seeds 10 defaults on register; CategorySeeder defines the canonical list |
| CAT-02 | User can create a custom category (name, icon, color) | CategoryController@store with validation; modal form in CategoriesPage |
| CAT-03 | User can edit a category | CategoryController@update (PUT); same modal reused with pre-filled values |
| CAT-04 | User can delete a category (blocked if active expenses reference it) | CategoryController@destroy with guard; 422 response via response()->error() macro |
| CAT-05 | User can view all categories | CategoryController@index scoped to auth()->id(); CategoriesPage cards grid |
</phase_requirements>

---

## Summary

Phase 3 delivers the categories subsystem end-to-end: a new Laravel migration adds `user_id` to the existing `categories` table, a new `CategoryController` provides CRUD endpoints behind `jwt.auth`, `AuthController::register()` is extended to seed 10 default categories per new user, the `CategorySeeder` is made safe for the new NOT NULL constraint, and a new `CategoriesPage` replaces the placeholder with a color-coded card grid and inline modal form.

All backend patterns follow exactly the form established in Phase 2: `response()->success()` / `response()->error()` macros, `$request->validate()` inline, user scoping via `auth()->id()`, and the `jwt.auth` middleware alias for protected routes. On the frontend, the same inline style conventions from `AuthPage.tsx` apply throughout — no CSS framework, no component library beyond `lucide-react` (must be npm-installed).

One critical discrepancy found between CONTEXT.md D-04 and the actual expenses table schema: the expenses migration has no `user_id` column, so the deletion guard must use `Expense::where('category_id', $id)->exists()` instead of the two-condition form described in D-04. This is the correct guard because category ownership is already enforced upstream (only the owning user's categories are returned by the list endpoint, and a 403/404 authorization check before the guard prevents cross-user deletion).

**Primary recommendation:** Two plans (03-01 backend, 03-02 frontend). Wave 0 in each plan creates the test file before implementation begins. Migration naming must use a date after `2026_05_09_000001_create_users_table.php` so the FK to `users.id` resolves correctly.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Category CRUD persistence | API / Backend | Database / Storage | Server owns all category data; client never writes DB directly |
| User scoping (data isolation) | API / Backend | — | `auth()->id()` enforced at controller layer, not DB trigger |
| Default category seeding on register | API / Backend | — | AuthController seeds atomically after User::create(); no client involvement |
| Referential integrity guard | API / Backend | Database / Storage | Controller check returns 422 before MySQL FK would throw; belt-and-suspenders |
| Icon rendering | Browser / Client | — | lucide-react named components rendered in React; DB stores string name only |
| Color swatch picker | Browser / Client | — | Preset grid; chosen hex POSTed to API |
| Modal open/close state | Browser / Client | — | Local React state; no server round-trip |
| Delete confirm state machine | Browser / Client | — | Inline card state; no server involvement until final confirm click |
| JWT auth gate | API / Backend | — | `jwt.auth` middleware alias on all category routes |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Laravel | v13.8.0 | PHP API framework — resource controllers, migrations, Eloquent | Already installed [VERIFIED: composer.lock] |
| tymon/jwt-auth | 2.3.0 | JWT issuance and middleware — `jwt.auth` alias already wired | Already installed [VERIFIED: composer.lock] |
| React | ^19.2.5 | Frontend component runtime | Already installed [VERIFIED: frontend/package.json] |
| react-router-dom | ^7.15.0 | Client-side routing — `/categories` route exists | Already installed [VERIFIED: frontend/package.json] |
| axios | ^1.16.0 | HTTP client with JWT interceptor | Already installed [VERIFIED: frontend/package.json] |
| lucide-react | 1.14.0 | React icon components — named exports, `size` prop | NOT YET INSTALLED — must `npm install lucide-react` [VERIFIED: npm registry, 2026-04-29] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PHPUnit | 12.x (via artisan test) | Backend feature tests | CategoryTest.php in Wave 0 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lucide-react | react-icons | react-icons is larger bundle; lucide-react is the UI spec decision |
| Inline modal (useState) | React context | Context adds indirection for a single-page component; prop-drilling is sufficient |
| PUT for update | PATCH | PUT requires all fields; PATCH allows partial. Planner decides — either is fine for v1 |

**Installation (frontend):**
```bash
cd frontend && npm install lucide-react
```

**Version verification:**
```
lucide-react: 1.14.0 (latest as of 2026-04-29) [VERIFIED: npm registry]
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (React)
    |
    | GET /api/categories         (list — returns user's categories)
    | POST /api/categories        (create — validated; seeder values as baseline)
    | PUT /api/categories/{id}    (update — 403 if wrong user)
    | DELETE /api/categories/{id} (delete — 422 if has expenses)
    |
    v
Laravel API (jwt.auth middleware)
    |
    +-- CategoryController
    |       |-- index():   Category::where('user_id', auth()->id())->get()
    |       |-- store():   validate → Category::create([..., 'user_id' => auth()->id()])
    |       |-- update():  authorize owner → category->update([...])
    |       |-- destroy(): guard check → category->delete()
    |
    +-- AuthController::register()  [extended]
    |       +-- User::create()
    |       +-- seed 10 default categories with user_id = $user->id
    |
    v
MySQL (categories table)
    id | user_id (FK→users.id CASCADE) | name | icon | color | description | budget | timestamps
    UNIQUE(user_id, name)
```

### Recommended Project Structure (new files for Phase 3)

```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   └── CategoryController.php      # NEW — resource controller (index, store, update, destroy)
│   └── Models/
│       └── Category.php                # NEW — Eloquent model, $fillable, belongsTo(User)
├── database/
│   ├── migrations/
│   │   └── 2026_05_10_000001_add_user_id_to_categories_table.php  # NEW
│   └── seeders/
│       └── CategorySeeder.php          # MODIFY — skip when no users exist
└── tests/Feature/
    └── CategoryTest.php                # NEW — Wave 0 gap

backend/app/Http/Controllers/Api/AuthController.php  # MODIFY — add default seeding in register()
backend/app/Models/User.php                          # MODIFY — add hasMany(Category::class)
backend/routes/api.php                               # MODIFY — add category routes in jwt.auth group

frontend/
├── src/
│   ├── api/
│   │   └── categories.ts               # NEW — CRUD functions using apiClient
│   └── pages/
│       └── CategoriesPage.tsx          # REPLACE — full card grid + modal implementation
└── package.json                         # MODIFY — add lucide-react
```

### Pattern 1: Laravel Resource Controller (User-Scoped)

**What:** Controller that scopes all operations to the authenticated user via `auth()->id()`.
**When to use:** Every CRUD action on the categories resource.

```php
// Source: established pattern from AuthController.php in this project
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::where('user_id', auth()->id())->get();
        return response()->success($categories, 'Categories retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:50',
            'icon'  => 'required|string|max:50',
            'color' => 'required|string|size:7',
        ]);

        $category = Category::create(array_merge($data, ['user_id' => auth()->id()]));
        return response()->success($category, 'Category created', 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->error('Not found', [], 404);
        }

        $data = $request->validate([
            'name'  => 'required|string|max:50',
            'icon'  => 'required|string|max:50',
            'color' => 'required|string|size:7',
        ]);

        $category->update($data);
        return response()->success($category->fresh(), 'Category updated');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->error('Not found', [], 404);
        }

        // Deletion guard — see Pitfall 1 for why user_id is NOT used here
        if (Expense::where('category_id', $category->id)->exists()) {
            return response()->error('Category has expenses and cannot be deleted', [], 422);
        }

        $category->delete();
        return response()->success(null, 'Category deleted');
    }
}
```

### Pattern 2: Migration — Adding FK Column to Existing Table

**What:** New migration (date after users table) adds `user_id`, drops old unique index, adds composite unique, adds FK.
**When to use:** Any time a column with FK constraint is added to a table that already exists.

```php
// Source: Laravel 13 schema builder — verified against installed framework v13.8.0 [VERIFIED]
// File: backend/database/migrations/2026_05_10_000001_add_user_id_to_categories_table.php
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

**Note:** `doctrine/dbal` is NOT installed and is NOT needed for Laravel 13. Laravel 10+ removed the doctrine/dbal dependency for column modifications. [VERIFIED: composer.lock shows no doctrine/dbal; Laravel 13 has native column modification] [ASSUMED: Laravel 13 native alter handles `dropUnique` on SQLite for tests — needs verification during execution if tests fail]

**Migration ordering safety:** The new migration must be dated `2026_05_10_XXXXXX` or later so it runs after `2026_05_09_000001_create_users_table.php`. The FK to `users.id` will resolve correctly. [VERIFIED: existing migration list shows users created at 2026_05_09]

### Pattern 3: Seeding Default Categories at Registration

**What:** Inline loop inside `AuthController::register()` that creates 10 rows with `user_id = $user->id`.
**When to use:** After `User::create()`, before returning the token.

```php
// Source: established register() pattern from AuthController.php in this project
public function register(Request $request): JsonResponse
{
    $data = $request->validate([
        'email'    => 'required|email|unique:users,email',
        'password' => 'required|min:8|confirmed',
    ]);

    $user  = User::create($data);

    // D-02: seed 10 default categories per new user
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
    return response()->success(['token' => $token], 'Registration successful', 201);
}
```

**Icon name correction:** CategorySeeder uses `'gamepad'` but the frontend renders `Gamepad2` from lucide-react. The canonical stored value should be `'gamepad-2'` (kebab-case) so it maps to the `Gamepad2` component. Update both the seeder defaults array and the inline defaults in `AuthController`. [VERIFIED: 03-UI-SPEC.md table row 6]

### Pattern 4: CategorySeeder Safe Update (D-11)

**What:** Update the seeder to skip when no users exist, so `php artisan db:seed` does not throw a NOT NULL violation.
**When to use:** Since `DatabaseSeeder` calls `CategorySeeder`, any `db:seed` run would fail after migration adds `user_id NOT NULL`.

```php
// Replaces current CategorySeeder::run()
public function run(): void
{
    // Safety: after Phase 3 migration, categories.user_id is NOT NULL.
    // The seeder is a dev convenience only — registration is the production path.
    // Skip silently when no users exist.
    if (\App\Models\User::count() === 0) {
        return;
    }

    // Seeder now no-ops unless a developer manually creates a user first.
    // For local dev: php artisan tinker → User::factory()->create() → php artisan db:seed
}
```

**Alternative (if planner prefers):** Keep the seeder body but wrap in a user-existence check and seed for the first user found. The "skip silently" approach is simpler and correct per D-11.

### Pattern 5: Category Model

```php
// Source: analogous to User.php pattern in this project
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['user_id', 'name', 'icon', 'color'];
    // 'description' and 'budget' are intentionally excluded from v1 (description optional; budget is v2)

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

**User model relationship to add:**
```php
// In User.php — add below existing methods
public function categories()
{
    return $this->hasMany(Category::class);
}
```

### Pattern 6: API Routes Registration

```php
// In backend/routes/api.php — inside the existing jwt.auth group
Route::middleware('jwt.auth')->group(function () {
    // Phase 3: Categories (CAT-01 through CAT-05)
    Route::get('categories',          [CategoryController::class, 'index']);
    Route::post('categories',         [CategoryController::class, 'store']);
    Route::put('categories/{category}',    [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
});
```

**No `apiResource`:** Using explicit routes avoids generating the `show` route (not needed in v1). [ASSUMED: `apiResource` partial list is also valid — planner may use `Route::apiResource(...)->only([...])` as equivalent]

### Pattern 7: Frontend categories.ts API Module

```typescript
// Source: follows apiClient pattern from frontend/src/api/client.ts
// File: frontend/src/api/categories.ts
import apiClient from './client';

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

export const getCategories = () =>
  apiClient.get<Envelope<Category[]>>('/categories');

export const createCategory = (payload: CategoryPayload) =>
  apiClient.post<Envelope<Category>>('/categories', payload);

export const updateCategory = (id: number, payload: CategoryPayload) =>
  apiClient.put<Envelope<Category>>(`/categories/${id}`, payload);

export const deleteCategory = (id: number) =>
  apiClient.delete<Envelope<null>>(`/categories/${id}`);
```

### Pattern 8: CategoriesPage — Modal and Card State

**What:** Local useState drives both modal visibility and per-card delete confirm state.
**When to use:** Single-page component; no need for context.

```typescript
// Source: follows useState pattern from AuthPage.tsx
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [pageError, setPageError] = useState<string | null>(null);

// Modal state
const [modalOpen, setModalOpen] = useState(false);
const [editingCategory, setEditingCategory] = useState<Category | null>(null);

// Per-card delete confirm: key = category.id
const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
const [deleteError, setDeleteError] = useState<Record<number, string>>({});

// Modal form state
const [formName, setFormName] = useState('');
const [formIcon, setFormIcon] = useState('utensils');
const [formColor, setFormColor] = useState('#FF6B6B');
const [formLoading, setFormLoading] = useState(false);
const [formError, setFormError] = useState<string | null>(null);
```

### Pattern 9: Lucide React Icon Rendering

```typescript
// Source: lucide-react 1.14.0 npm package [VERIFIED: npm registry]
// Import only used icons (tree-shakeable):
import { Utensils, Car, Home, Book, Heart, Gamepad2,
         ShoppingBag, Zap, Briefcase, Gift,
         Coffee, Plane, Music, Dumbbell, Smartphone,
         Pencil, Trash2 } from 'lucide-react';

// Dynamic icon lookup map (maps stored string → component)
const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  'utensils':     Utensils,
  'car':          Car,
  'home':         Home,
  'book':         Book,
  'heart':        Heart,
  'gamepad-2':    Gamepad2,
  'shopping-bag': ShoppingBag,
  'zap':          Zap,
  'briefcase':    Briefcase,
  'gift':         Gift,
  'coffee':       Coffee,
  'plane':        Plane,
  'music':        Music,
  'dumbbell':     Dumbbell,
  'smartphone':   Smartphone,
};

// Render in card:
const IconComponent = ICON_MAP[category.icon] ?? Gift;
<IconComponent size={20} />
```

**Lucide import pattern:** Named exports only — `import { Utensils } from 'lucide-react'`. No default export. Use `size` prop (integer). [VERIFIED: lucide-react 1.14.0 npm package description]

### Pattern 10: Modal Overlay (Inline Styles Only)

```typescript
// Source: 03-UI-SPEC.md overlay/panel spec [VERIFIED: 03-UI-SPEC.md]
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
      {formError && <p style={{ color: 'red', marginTop: '0.75rem' }} role="alert">{formError}</p>}
    </div>
  </div>
)}
```

### Anti-Patterns to Avoid
- **Using `DB::table()` in CategoryController:** Always use Eloquent `Category::` for scoping — raw queries bypass fillable guards.
- **Forgetting `user_id` in `store()`:** Must merge `['user_id' => auth()->id()]` — it is not in `$request->all()`.
- **Exposing `budget` in v1 API responses:** The column exists in the table but must be excluded from v1. Either guard with `$hidden` on the model or use `makeHidden(['budget'])` on the collection.
- **Using `gamepad` icon name (seeder):** CategorySeeder uses `'gamepad'` but all Phase 3 code must use `'gamepad-2'` to match the lucide-react export `Gamepad2`. Update seeder defaults array.
- **Calling `response()->json()` directly:** Always use `response()->success()` and `response()->error()` macros from `AppServiceProvider.php`. [VERIFIED: codebase pattern]
- **Adding state to `ProtectedRoute.tsx`:** The component is complete and correct — do not modify it.
- **Adding `description` to `$fillable`:** The column is nullable and exists in the table but is out of scope for v1 UI. Keep it hidden from the API unless planner explicitly enables it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT auth check | Custom token parsing in controllers | `jwt.auth` middleware alias already wired | Handles expired, invalid, absent token with correct 401 responses |
| JSON response envelope | Manual `response()->json(['success'=>...])` | `response()->success()` / `response()->error()` macros | Consistency with all other endpoints; macros already registered |
| Password hashing | Manual `bcrypt()` call | `password` cast in User model | Already configured in `User::$casts`; `User::create()` hashes automatically |
| Color validation (backend) | Custom hex regex validator | Laravel `'color' => 'required|string|size:7'` | Simple string length check is sufficient — frontend enforces preset picker |
| Icon validation (backend) | Enum validator of 15 names | `'icon' => 'required|string|max:50'` | Frontend enforces preset; strict backend enum causes maintenance burden |
| API HTTP client setup | New axios instance | Import `apiClient` from `../api/client` | Interceptor already injects Bearer token; don't create a second instance |

**Key insight:** All the infrastructure plumbing (JWT, response macros, axios interceptor, route guard) is already wired from Phase 1 and 2. Phase 3 only fills in the application layer.

---

## Common Pitfalls

### Pitfall 1: D-04 Deletion Guard References Non-Existent `user_id` Column on Expenses
**What goes wrong:** CONTEXT.md D-04 specifies `Expense::where('category_id', $id)->where('user_id', auth()->id())->exists()`, but the expenses migration (`2026_01_01_000002_create_expenses_table.php`) has NO `user_id` column. Executing that query causes an SQL error: `Unknown column 'expenses.user_id'`.
**Why it happens:** D-04 was written with Phase 4 in mind, where expenses will have `user_id`. But Phase 4 hasn't run yet.
**How to avoid:** Use the single-condition guard: `Expense::where('category_id', $category->id)->exists()`. Ownership is enforced upstream by the `if ($category->user_id !== auth()->id())` check before the guard. Only the owner can reach the guard, so cross-user deletion is impossible.
**Warning signs:** SQL exception in `destroy()` during testing; error message contains "Unknown column 'expenses.user_id'".
[VERIFIED: expenses migration file has no user_id column — confirmed by direct file read]

### Pitfall 2: Migration Date Ordering — FK to `users` Before Users Table Exists
**What goes wrong:** If the Phase 3 migration is dated earlier than `2026_05_09_000001_create_users_table.php`, the FK to `users.id` will fail because the `users` table doesn't exist yet at migration run time.
**Why it happens:** The original categories migration is dated `2026_01_01` — adding a new migration at a similar date would cause ordering issues.
**How to avoid:** Name the Phase 3 migration `2026_05_10_000001_add_user_id_to_categories_table.php` (or any date after `2026_05_09`). Migration files run in alphabetical/timestamp order.
**Warning signs:** Migration fails with "Table 'users' doesn't exist" during `php artisan migrate`.
[VERIFIED: migration list shows users created 2026_05_09]

### Pitfall 3: CategorySeeder Breaks After Migration
**What goes wrong:** `DatabaseSeeder` calls `CategorySeeder`. After Phase 3 migration adds `user_id NOT NULL`, any `php artisan db:seed` run (including test `RefreshDatabase` cycle) that reaches CategorySeeder will throw an integrity constraint violation.
**Why it happens:** The seeder's `DB::table('categories')->insertOrIgnore(...)` calls don't include `user_id`.
**How to avoid:** Update `CategorySeeder::run()` to return early when `User::count() === 0`. This makes the seeder a no-op in both test and production environments unless users exist.
**Warning signs:** Tests fail with "SQLSTATE[HY000]: General error: 19 NOT NULL constraint failed: categories.user_id" during `RefreshDatabase`.
[VERIFIED: CategorySeeder current code reviewed; DatabaseSeeder confirmed to call it]

### Pitfall 4: `gamepad` vs `gamepad-2` Icon Name Mismatch
**What goes wrong:** CategorySeeder uses `'gamepad'` as the icon string. The frontend ICON_MAP maps `'gamepad-2'` → `Gamepad2`. A category seeded with `'gamepad'` will have no matching component in ICON_MAP and fall back to the default icon silently.
**Why it happens:** lucide-react renamed `Gamepad` to `Gamepad2` in a version update. The seeder predates this.
**How to avoid:** Change `'gamepad'` → `'gamepad-2'` in: (1) CategorySeeder defaults array, (2) AuthController's inline defaults array in `register()`.
**Warning signs:** Entertainment category shows a fallback icon (Gift) instead of a gamepad icon.
[VERIFIED: 03-UI-SPEC.md explicitly calls this out; lucide-react 1.14.0 exports `Gamepad2`]

### Pitfall 5: `budget` Column Leaking in API Responses
**What goes wrong:** Eloquent's default `->get()` includes all columns, so the `budget` decimal field appears in every category API response. This exposes a v2 feature prematurely and may confuse Phase 4/5 consumers.
**Why it happens:** The Phase 1 migration added `budget` to categories for future use.
**How to avoid:** Add `'budget'` to `Category::$hidden` (alongside 'description' if that's also excluded):
```php
protected $hidden = ['budget'];
```
**Warning signs:** API response JSON includes `"budget": null` on every category object.
[VERIFIED: categories migration includes budget decimal column]

### Pitfall 6: Duplicate Category Name for Same User
**What goes wrong:** Two `store()` calls with the same `name` for the same `user_id` will throw a MySQL integrity constraint violation (uncaught exception, returns 500 instead of 422).
**Why it happens:** The composite unique index `(user_id, name)` prevents duplicates at DB level but the controller doesn't validate uniqueness at application level first.
**How to avoid:** Add a uniqueness rule to the `store()` and `update()` validation:
```php
'name' => [
    'required', 'string', 'max:50',
    \Illuminate\Validation\Rule::unique('categories')->where('user_id', auth()->id()),
]
```
Laravel's `$request->validate()` will return 422 automatically via the validation exception handler.
**Warning signs:** 500 error on duplicate category name submission instead of 422.
[VERIFIED: composite unique index in migration design; Laravel Rule::unique verified against framework]

### Pitfall 7: SQLite `dropUnique` Behavior in Tests
**What goes wrong:** SQLite doesn't support `ALTER TABLE DROP CONSTRAINT`. In some Laravel versions, `dropUnique()` on SQLite silently fails or throws during test `RefreshDatabase` cycles.
**Why it happens:** The test suite uses SQLite in-memory (`phpunit.xml` verified: `DB_CONNECTION=sqlite, DB_DATABASE=:memory:`). The Phase 3 migration calls `$table->dropUnique('categories_name_unique')`.
**How to avoid:** Laravel 13 handles SQLite schema rebuilds by recreating the table when modifying columns. [ASSUMED: This works correctly in Laravel 13 with SQLite — should be verified by running the test suite after migration creation]
**Warning signs:** `RefreshDatabase` fails with "Cannot remove index from table 'categories'" or similar SQLite error.

---

## Code Examples

### Complete CategoryController (production-ready)

```php
// Source: established patterns from AuthController.php + AppServiceProvider.php in this project
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::where('user_id', auth()->id())
            ->orderBy('name')
            ->get();
        return response()->success($categories, 'Categories retrieved');
    }

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

    public function destroy(Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->error('Not found', [], 404);
        }

        // Guard: block delete if any expense references this category
        // NOTE: expenses.user_id does not exist yet (added in Phase 4)
        // Ownership enforced above — this guard is correctly scoped without user_id on expenses
        if (Expense::where('category_id', $category->id)->exists()) {
            return response()->error('Category has expenses and cannot be deleted', [], 422);
        }

        $category->delete();
        return response()->success(null, 'Category deleted');
    }
}
```

### CategoriesPage Skeleton

```typescript
// Source: inline style pattern from frontend/src/pages/AuthPage.tsx + 03-UI-SPEC.md
import { useState, useEffect } from 'react';
import { Utensils, Car, Home, Book, Heart, Gamepad2,
         ShoppingBag, Zap, Briefcase, Gift,
         Coffee, Plane, Music, Dumbbell, Smartphone,
         Pencil, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory,
         deleteCategory, type Category, type CategoryPayload } from '../api/categories';

const ICON_NAMES = [
  'utensils','car','home','book','heart','gamepad-2',
  'shopping-bag','zap','briefcase','gift',
  'coffee','plane','music','dumbbell','smartphone',
] as const;

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  utensils: Utensils, car: Car, home: Home, book: Book, heart: Heart,
  'gamepad-2': Gamepad2, 'shopping-bag': ShoppingBag, zap: Zap,
  briefcase: Briefcase, gift: Gift, coffee: Coffee, plane: Plane,
  music: Music, dumbbell: Dumbbell, smartphone: Smartphone,
};

const COLOR_SWATCHES = [
  '#FF6B6B','#4ECDC4','#FFE66D','#95E1D3','#F38181',
  '#AA96DA','#FCBAD3','#A8D8EA','#C1D82F','#999999',
  '#F7B731','#26de81',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({});
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('utensils');
  const [formColor, setFormColor] = useState('#FF6B6B');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // fetch on mount, submit handler, delete handler — see Plan tasks
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `doctrine/dbal` required for column modification | Native column modification in Laravel | Laravel 10 | No extra package needed for `->change()` or schema alteration |
| Lucide v0.x (tree-shaken differently) | lucide-react 1.x — named exports, `size` prop standard | ~2023 | `import { Utensils } from 'lucide-react'` — straightforward |
| `tymon/jwt-auth` v1 (Laravel 5-6) | `tymon/jwt-auth` v2.x (Laravel 9+) | 2022 | `auth()->login()`, `auth()->logout()` work identically; v2 installed [VERIFIED] |

**Deprecated/outdated:**
- `$table->string('name')->unique()->change()` with doctrine/dbal: NOT needed in Laravel 13 — use native schema operations.
- `'Gamepad'` icon name in lucide-react: replaced by `Gamepad2` in lucide icon set.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Laravel 13 native `dropUnique` works correctly in SQLite in-memory test environment during `RefreshDatabase` | Pitfall 7, Pattern 2 | Tests fail during migration; workaround: run tests after verifying migration works in MySQL only |
| A2 | `Route::apiResource(...)->only([...])` is equivalent to explicit routes for Phase 3 | Pattern 6 | Minimal — explicit routes used in pattern are unambiguous |
| A3 | `Expense` model will exist as a PHP class at Phase 3 code-write time (needed for deletion guard import) | Pattern 1 | If Expense model doesn't exist, `use App\Models\Expense` import fails; create stub Expense model in Phase 3 Wave 0 |

---

## Open Questions

1. **Does `Expense` model exist yet?**
   - What we know: The `expenses` table exists (Phase 1 migration). The `AuthController` and other controllers are present.
   - What's unclear: No `Expense.php` model file was found in `backend/app/Models/`. Using `Expense::where(...)` in CategoryController requires either an Eloquent model or using `DB::table('expenses')`.
   - Recommendation: Create a minimal `Expense.php` model stub in Wave 0 (before CategoryController) with just `$fillable` and the class declaration. Alternatively, use `DB::table('expenses')->where('category_id', $id)->exists()` to avoid the model dependency.

2. **Should `description` be included in the v1 create/edit form?**
   - What we know: Column exists and is nullable. UI spec says omit for simplicity. CONTEXT.md leaves it to planner.
   - What's unclear: No explicit decision locked.
   - Recommendation: Omit from v1 form (CONTEXT.md "specifics" section says "can be omitted for v1 simplicity"). Add `'description'` to `$hidden` on Category model to keep it out of API responses.

3. **HTTP verb for update: PUT vs PATCH?**
   - What we know: CONTEXT.md leaves this to planner.
   - Recommendation: Use PUT — simpler; all three fields (name, icon, color) are always present in the modal form, so there's no partial update scenario in v1.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PHP | Laravel backend | Yes | 8.3.31 | — |
| Laravel | CategoryController | Yes | 13.8.0 | — |
| MySQL | Production DB | Yes (assumed Railway) | — | — |
| SQLite (in-memory) | PHPUnit tests | Yes (phpunit.xml wired) | — | — |
| Node / npm | Frontend build | Yes (package.json present) | — | — |
| lucide-react | CategoriesPage icons | NOT INSTALLED | — | Must `npm install lucide-react@1.14.0` |
| doctrine/dbal | Schema column modification | NOT INSTALLED | — | Not needed — Laravel 13 native |

**Missing dependencies with no fallback:**
- `lucide-react` — must be installed before CategoriesPage can be compiled. Wave 0 task.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | PHPUnit 12.x (via `php artisan test`) |
| Config file | `backend/phpunit.xml` |
| Quick run command | `cd backend && php artisan test --filter Category` |
| Full suite command | `cd backend && php artisan test` |
| SQLite in-memory | Yes — `phpunit.xml` sets `DB_CONNECTION=sqlite, DB_DATABASE=:memory:` |

**Note:** No frontend test framework is installed. Frontend validation is manual browser smoke testing (consistent with Phase 2 strategy). [VERIFIED: frontend/package.json has no vitest/jest]

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | Register creates 10 default categories for new user | Feature | `php artisan test --filter CategoryTest::test_register_seeds_default_categories` | Wave 0 gap |
| CAT-02 | Authenticated user can create a category | Feature | `php artisan test --filter CategoryTest::test_user_can_create_category` | Wave 0 gap |
| CAT-02 | Duplicate name for same user returns 422 | Feature | `php artisan test --filter CategoryTest::test_duplicate_category_name_returns_422` | Wave 0 gap |
| CAT-03 | Authenticated user can update own category | Feature | `php artisan test --filter CategoryTest::test_user_can_update_category` | Wave 0 gap |
| CAT-03 | User cannot update another user's category | Feature | `php artisan test --filter CategoryTest::test_user_cannot_update_other_users_category` | Wave 0 gap |
| CAT-04 | Delete category with no expenses succeeds | Feature | `php artisan test --filter CategoryTest::test_user_can_delete_category` | Wave 0 gap |
| CAT-04 | Delete category blocked (returns 422) when expense exists | Feature | `php artisan test --filter CategoryTest::test_delete_blocked_if_category_has_expenses` | Wave 0 gap |
| CAT-05 | List returns only authenticated user's categories | Feature | `php artisan test --filter CategoryTest::test_list_returns_only_own_categories` | Wave 0 gap |
| CAT-05 | Unauthenticated request returns 401 | Feature | `php artisan test --filter CategoryTest::test_unauthenticated_request_returns_401` | Wave 0 gap |
| CAT-01–05 | Manual: CategoriesPage loads cards, modal opens, delete confirm works | Manual | Browser smoke test | N/A |

### Sampling Rate
- **Per task commit:** `cd backend && php artisan test --filter Category`
- **Per wave merge:** `cd backend && php artisan test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/Feature/CategoryTest.php` — covers CAT-01 through CAT-05 (9 test methods)
- [ ] `backend/app/Models/Category.php` — must exist before CategoryController uses it
- [ ] `backend/app/Models/Expense.php` — stub needed for CategoryController deletion guard import (if using Eloquent model rather than `DB::table`)
- [ ] `npm install lucide-react` in `/frontend` — required before CategoriesPage compiles

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (indirect) | JWT via `jwt.auth` middleware — already implemented in Phase 2; category routes use same gate |
| V3 Session Management | No | JWT stateless — no session |
| V4 Access Control | Yes | Owner check: `if ($category->user_id !== auth()->id())` before mutate/delete — returns 404 (not 403) to avoid resource enumeration |
| V5 Input Validation | Yes | `$request->validate()` inline — name max:50, icon max:50, color size:7, name unique per user |
| V6 Cryptography | No | No new crypto in Phase 3 |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR (access other user's category by ID) | Spoofing / Elevation | Owner check before update/delete; returns 404 not 403 (prevents enumeration) |
| Mass assignment via `create($request->all())` | Tampering | `$fillable` on Category model; never pass `$request->all()` directly — use validated data + merge user_id |
| Duplicate name collision → 500 error | Tampering | `Rule::unique('categories')->where('user_id', auth()->id())` in validation |
| Unauthorized deletion of foreign-user category | Elevation | Owner check + 404 return before deletion guard |
| Frontend rendering arbitrary icon strings | Spoofing | ICON_MAP lookup — unknown strings fall back to default icon; no `dangerouslySetInnerHTML` |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: codebase] `backend/database/migrations/2026_01_01_000001_create_categories_table.php` — current schema
- [VERIFIED: codebase] `backend/database/migrations/2026_01_01_000002_create_expenses_table.php` — confirmed NO user_id column
- [VERIFIED: codebase] `backend/database/migrations/2026_05_09_000001_create_users_table.php` — migration ordering baseline
- [VERIFIED: codebase] `backend/app/Providers/AppServiceProvider.php` — response macro signatures
- [VERIFIED: codebase] `backend/app/Http/Controllers/Api/AuthController.php` — register() pattern to extend
- [VERIFIED: codebase] `backend/database/seeders/CategorySeeder.php` — 10 default categories with exact icon/color values
- [VERIFIED: codebase] `backend/database/seeders/DatabaseSeeder.php` — confirmed calls CategorySeeder
- [VERIFIED: codebase] `frontend/src/api/client.ts` — axios client with Bearer interceptor
- [VERIFIED: codebase] `frontend/src/pages/AuthPage.tsx` — inline style pattern baseline
- [VERIFIED: codebase] `frontend/package.json` — confirmed lucide-react NOT in dependencies
- [VERIFIED: codebase] `backend/phpunit.xml` — SQLite in-memory test configuration
- [VERIFIED: codebase] `backend/composer.lock` — Laravel 13.8.0, tymon/jwt-auth 2.3.0, no doctrine/dbal
- [VERIFIED: npm registry] lucide-react 1.14.0 — current latest (published 2026-04-29)
- [VERIFIED: codebase] `.planning/phases/03-categories/03-UI-SPEC.md` — icon list, color swatches, spacing, component spec

### Secondary (MEDIUM confidence)
- [VERIFIED: codebase] `.planning/phases/03-categories/03-CONTEXT.md` — locked decisions D-01 through D-11
- [VERIFIED: codebase] `.planning/phases/02-authentication/02-PATTERNS.md` — Phase 2 established patterns

### Tertiary (LOW confidence)
- [ASSUMED] Laravel 13 native schema builder handles `dropUnique` + composite index on SQLite in-memory without doctrine/dbal

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from composer.lock, package.json, npm registry
- Architecture: HIGH — all integration points verified from direct file reads
- Pitfalls: HIGH for Pitfalls 1-6 (all verified from code); MEDIUM for Pitfall 7 (SQLite schema behavior assumed)
- Test patterns: HIGH — PHPUnit pattern confirmed from AuthTest.php; wave 0 gaps enumerated

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (stable stack; lucide-react and Laravel are stable libraries)

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 3 |
|-----------|------------------|
| MySQL only — no SQLite | Production MySQL; SQLite used only in phpunit.xml for tests (existing setup) |
| JWT auth — team decision | All category endpoints behind `jwt.auth` middleware |
| API envelope: `{success, data, message}` | Every CategoryController method uses `response()->success()` / `response()->error()` macros |
| No Budget/CSV/Recurring in v1 | `budget` column on categories table is hidden in API responses; not exposed in UI |
| Dates ISO format | Not directly relevant to categories (no date fields) |
| Amount validation | Not relevant to categories |
| Deploy target: Vercel | Frontend build must succeed with lucide-react added to package.json |
