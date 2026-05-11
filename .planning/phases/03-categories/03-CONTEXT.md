# Phase 3: Categories - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view, create, edit, and delete expense categories. Ten predefined categories (Food, Transport, Housing, etc.) are automatically copied to each user when they register. Users can add custom categories with a name, icon, and color. Deletion is blocked if any expense references the category. All category data is user-scoped — each user manages their own list independently.

</domain>

<decisions>
## Implementation Decisions

### Category Ownership & Schema
- **D-01:** Categories are **per-user**. The `categories` table must gain a `user_id` FK column. The existing Phase 1 migration (`2026_01_01_000001_create_categories_table.php`) lacks `user_id` — Phase 3 must add a new migration that: (1) adds `user_id BIGINT UNSIGNED NOT NULL`, (2) drops the existing `name` unique index, (3) adds a composite unique index on `(user_id, name)`, (4) adds FK constraint to `users.id` with `onDelete('cascade')`.
- **D-02:** The 10 predefined categories defined in `CategorySeeder` are **copied to each new user at registration time**. The `AuthController::register()` method seeds these 10 rows with `user_id = $user->id` immediately after `User::create()`. No `is_default` flag needed.
- **D-03:** All categories are equal — no distinction between "predefined" and "custom". Any category can be edited or deleted by its owning user.

### Deletion Guard
- **D-04:** `DELETE /api/categories/{id}` checks whether any expense row references this category (`Expense::where('category_id', $id)->where('user_id', auth()->id())->exists()`). If yes, return `response()->error('Category has expenses and cannot be deleted', [], 422)`. The expenses table already exists from Phase 1 migration (`2026_01_01_000002_create_expenses_table.php`), so this check is safe to write in Phase 3. In practice, during Phase 3 testing there are no expenses, so deletion always succeeds — the guard code is correct but never triggered until Phase 4.

### Icon System
- **D-05:** Icons are stored as string names (varchar 50) in `categories.icon`. The frontend renders them using **Lucide React** (`lucide-react` npm package — not yet installed, must be added). User picks from a **preset grid of 15 Lucide icon names** in the create/edit modal. Planner selects the 15 icons; the seeder's existing names (`utensils`, `car`, `home`, `book`, `heart`, `gamepad`, `shopping-bag`, `zap`, `briefcase`, `gift`) are the baseline — planner may add 5 more.
- **D-06:** Color is stored as a 7-char hex string (e.g., `#FF6B6B`) in `categories.color`. In the create/edit form, user picks from a **preset grid of ~12 hex color swatches** (no free-text hex input, no full color picker). Planner chooses the swatches; the seeder's existing colors are a good starting set.

### Categories UI
- **D-07:** CategoriesPage shows categories as a **color-coded cards grid**. Each card displays the category's color as a background swatch (or left border), the Lucide icon, and the name. Edit and delete action buttons appear on the card (edit icon + delete icon).
- **D-08:** Create/edit form opens as a **modal overlay** on the categories page. No separate routes needed. The existing `/categories` route in App.tsx is sufficient.
- **D-09:** Delete UX follows the **Phase 2 inline error pattern**: delete icon on card → "Are you sure? Confirm" button appears inline → on success, card disappears → on 422 error (has expenses), show error message inline on the card. No separate delete modal, no toast library.
- **D-10:** Navigation to the categories page is done from the HomePage (already has nav links). No new routes to add to App.tsx.

### CategorySeeder Update
- **D-11:** The existing `CategorySeeder` does a raw `DB::table('categories')->insertOrIgnore(...)` without `user_id`. After adding the `user_id NOT NULL` FK in the migration, this seeder will break on `php artisan db:seed`. Update the seeder to either (a) skip itself silently when no users exist, or (b) not be called in production. The registration logic (not the seeder) is the canonical path for default category seeding in production.

### Claude's Discretion
- Exact 15 icon names in the preset grid — planner picks from Lucide icon set
- Exact 12 color swatches in the preset grid — planner picks, seeder colors as baseline
- Whether to use a React context or prop-drilling for modal open/close state — planner decides
- HTTP verb for update: PUT (full replace) is fine; PATCH optional — planner decides
- Whether `description` column (nullable text, already in migration) is exposed in the UI — planner decides (can omit for v1 simplicity)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — CAT-01 through CAT-05 (the 5 requirements this phase must satisfy)
- `.planning/ROADMAP.md` — Phase 3 success criteria (5 criteria, including deletion guard and single list endpoint)
- `.planning/PROJECT.md` — locked decisions: MySQL, JWT, API envelope `{success, data, message}`, response macros

### Existing Backend (Phase 1 + 2 scaffold — read before planning API)
- `backend/database/migrations/2026_01_01_000001_create_categories_table.php` — current schema: `id`, `name` (unique 50), `description`, `color` (7), `icon` (50), `budget` (nullable decimal — v2 ignore), `timestamps`. Phase 3 adds `user_id` via new migration.
- `backend/database/migrations/2026_01_01_000002_create_expenses_table.php` — expenses table exists; read to confirm `category_id` FK column is present before writing deletion guard.
- `backend/database/seeders/CategorySeeder.php` — 10 default categories with icon names and hex colors. Phase 3 registration logic copies these exact rows per user. Update seeder to be compatible with `user_id NOT NULL`.
- `backend/app/Http/Controllers/Api/AuthController.php` — `register()` method must seed default categories after `User::create()`.
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros — ALL category controller methods must use these.
- `backend/routes/api.php` — protected API surface (jwt.auth group) already exists; add category routes here.
- `backend/app/Models/User.php` — User model; add `hasMany(Category::class)` relationship.

### Existing Frontend (Phase 1 + 2 scaffold — read before planning UI)
- `frontend/src/pages/CategoriesPage.tsx` — blank placeholder; replace entirely.
- `frontend/src/App.tsx` — `/categories` route already wrapped in `ProtectedRoute`. No new routes needed.
- `frontend/src/api/client.ts` — axios client with JWT Bearer header injected; create `frontend/src/api/categories.ts` alongside it.
- `frontend/src/pages/AuthPage.tsx` — Phase 2 inline error pattern (red message below button) — follow same pattern for category form errors.

### Prior Phase Context
- `.planning/phases/02-authentication/02-CONTEXT.md` — inline error UX decisions (D-08, D-09) to follow in category forms

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros. Use in every CategoryController method.
- `backend/app/Http/Middleware/JwtMiddleware.php` — already wired as `jwt.auth` alias. Category routes go inside the existing protected group in `routes/api.php`.
- `frontend/src/api/client.ts` — axios client with auto-injected Bearer token. Create a `categories.ts` API module alongside `client.ts`.
- `frontend/src/components/ProtectedRoute.tsx` — already wraps `/categories`. No changes needed.

### Established Patterns
- API envelope: `{success, data, message}` on success; `{success: false, message, errors: [...]}` on failure — ALL category endpoints follow this.
- Frontend pages use minimal inline styles (`fontFamily: 'sans-serif', padding: '2rem'`) — categories UI can follow same pattern or introduce a simple CSS module.
- Phase 2 inline error: show error string below submit button as red text — follow for modal form errors.
- Phase 2 loading state: disable button + "Loading..." text during API call — follow for category form submissions.

### Integration Points
- `backend/routes/api.php` — add CRUD routes for categories inside the `Route::middleware('jwt.auth')` group.
- `backend/app/Http/Controllers/Api/AuthController.php::register()` — add default category seeding after `User::create($data)`.
- `backend/app/Models/User.php` — add `hasMany(Category::class)` relationship.
- `frontend/src/pages/CategoriesPage.tsx` — replace placeholder with grid + modal.
- `frontend/package.json` — add `lucide-react` dependency.

</code_context>

<specifics>
## Specific Ideas

- The 10 default category names, icons, and colors are already defined in `CategorySeeder.php` — use those exact values as the default set copied on registration. No need to hardcode them elsewhere; read from the seeder array.
- The `budget` column in the categories migration is for v2 budget management — do NOT expose it in v1 API responses or forms. It exists in the DB but is invisible to v1.
- The `description` column (nullable text) can be omitted from the v1 create/edit form for simplicity — planner decides.
- The categories list endpoint (`GET /api/categories`) should return categories scoped to the authenticated user only: `Category::where('user_id', auth()->id())->get()`.
- For the deletion guard: the check is `Expense::where('category_id', $id)->where('user_id', auth()->id())->exists()`. If true, return 422. This is safe to write now even though Phase 4 hasn't built expenses yet.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 3 scope.

</deferred>

---

*Phase: 3-Categories*
*Context gathered: 2026-05-10*
