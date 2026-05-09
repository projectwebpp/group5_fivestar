# Phase 1: Foundation - Research

**Researched:** 2026-05-09
**Domain:** Laravel 11 + React/Vite/TypeScript scaffold, MySQL on Railway, JWT config, Vercel SPA deploy
**Confidence:** HIGH (core stack), MEDIUM (Railway/Railpack specifics — actively evolving platform)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Monorepo layout — Laravel backend in `/backend`, React TypeScript frontend in `/frontend`. Both live in `group5_fivestar` repo root.
- **D-02:** Existing JSX mockup files move to `/ui-mockups/` directory. Keep as design reference — do not delete.
  - NOTE: Files are already in `/ui_design/` (not root). Planner should rename `ui_design/` to `ui-mockups/` per D-02.
- **D-03:** Vercel deploys `/frontend` only. Vercel project root = `/frontend`.
- **D-04:** Laravel backend deploys to Railway (free tier). Frontend calls Railway URL as API base URL via `VITE_API_URL`.
- **D-05:** Backend is NOT deployed to Vercel.

### Claude's Discretion
- React scaffold tooling: Vite (current standard — confirmed). CRA is deprecated.
- React Router version: v7 is current (7.15.0 verified on npm). Use v7.
- API client: Axios vs fetch — Axios recommended (interceptor support for JWT headers, better error handling).
- Laravel setup method: Composer CLI install (no Sail — Docker not available on this machine).
- Local dev MySQL: MAMP/XAMPP or DBngin on macOS/Windows; WSL2 + MySQL on Linux. Document both.
- TypeScript strictness: `strict: true` recommended.

### Deferred Ideas (OUT OF SCOPE)
- Budget management, CSV export, recurring expenses — v2 only.
- Auth routes, register/login/logout — Phase 2 scope.
- CRUD endpoints for expenses and categories — Phase 3/4 scope.
</user_constraints>

---

## Summary

Phase 1 establishes the full technical skeleton: Laravel 11 API in `/backend`, React+Vite+TypeScript in `/frontend`, MySQL schema migrations for expenses and categories, tymon/jwt-auth installed and middleware wired, and both services deployed (Railway for backend, Vercel for frontend). No functional CRUD or auth flows are implemented — Phase 1 only wires up the scaffolding so the app deploys and returns meaningful responses.

Laravel 11 introduced significant structural changes from v10: `bootstrap/app.php` replaces `Kernel.php` for middleware and routing registration, `routes/api.php` no longer exists by default (created via `php artisan install:api`), and a built-in `/up` health-check endpoint is included. These changes affect every aspect of the scaffold setup.

Railway now uses Railpack (not Nixpacks) as its build system. For Laravel, Railpack auto-detects the `artisan` file and handles document root (`/app/public`), Composer install, migrations, and server startup automatically. The monorepo root directory setting in Railway's service config points to `/backend`.

**Primary recommendation:** Scaffold Laravel 11 with Composer CLI (no Docker), install JWT and api routes immediately, add the response envelope helper in AppServiceProvider, then scaffold Vite+React+TypeScript with Axios and React Router v7, point `VITE_API_URL` to Railway, and configure Vercel with the SPA rewrite rule. The walking skeleton is: `GET /api/health` on Railway returns `{success:true,data:{status:"ok"},message:"API is healthy"}` and the React app fetches it from Vercel.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Health-check response | API / Backend (Laravel on Railway) | — | Backend owns all API responses; frontend only consumes |
| MySQL schema migrations | Database / Storage | API / Backend (runs migrations) | Migrations are backend-side; DB owns structure |
| JWT secret configuration | API / Backend | — | Secret lives server-side; never exposed to client |
| JWT middleware wiring | API / Backend | — | Middleware intercepts requests at API layer |
| Response envelope helper | API / Backend | — | Consistent API shape enforced at API layer |
| API client (Axios instance) | Frontend / Client | — | Client-side HTTP abstraction |
| React routing skeleton | Frontend / Client | — | Client-side routing; no SSR in this stack |
| Env var `VITE_API_URL` | Frontend Server (Vercel build) | Frontend / Client | Build-time injection; consumed at runtime by client |
| SPA rewrite rules | CDN / Static (Vercel) | — | Vercel handles client-side route deep-links |
| CORS configuration | API / Backend | — | Backend must allow cross-origin requests from Vercel domain |

---

## Standard Stack

### Backend Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Laravel | 11.x | PHP API framework | Team locked; latest stable |
| tymon/jwt-auth | ^2.1 | JWT token issuance and validation | Team locked; most widely used JWT package for Laravel |
| PHP | 8.2+ | Runtime | Railpack default; Laravel 11 minimum |

**Version verification:** `composer require tymon/jwt-auth` resolves to ^2.1 (last verified on Packagist 2024). [CITED: packagist.org/packages/tymon/jwt-auth]

### Frontend Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.0.11 | Build tool | Current standard, verified npm |
| React | 19.2.6 | UI library | Team locked; latest stable, verified npm |
| TypeScript | 6.0.3 | Type safety | Team locked; latest stable, verified npm |
| @vitejs/plugin-react | 6.0.1 | Vite React integration | Required companion plugin, verified npm |
| react-router-dom | 7.15.0 | Client-side routing | Current major version, verified npm |
| axios | 1.16.0 | HTTP client | Interceptor support for JWT auth headers, verified npm |

### Frontend Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.14 | TypeScript definitions | Always with TypeScript |
| @types/react-dom | 19.2.3 | TypeScript definitions | Always with TypeScript |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axios | fetch | fetch is native but no interceptors; JWT header injection requires wrapper; axios preferred for this use case |
| react-router-dom v7 | v6 | v6 is still active; v7 is current; either works for scaffold — use v7 |
| tymon/jwt-auth | Laravel Sanctum | Sanctum uses opaque tokens + sessions; team decided JWT specifically; do not substitute |

**Backend installation:**
```bash
cd backend
composer create-project laravel/laravel .
composer require tymon/jwt-auth
php artisan install:api
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
php artisan jwt:secret
```

**Frontend installation:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react-router-dom axios
npm install --save-dev @types/react @types/react-dom
```

---

## Architecture Patterns

### System Architecture Diagram

```
[Browser]
    |
    | HTTPS (Vercel CDN)
    v
[Vercel: /frontend]           ← React SPA (static bundle)
    |                           vercel.json: SPA rewrite /(.*) → /index.html
    | VITE_API_URL = Railway URL
    |
    | HTTP (Railway URL)
    v
[Railway: /backend]           ← Laravel 11 API (PHP + Caddy via Railpack)
    |                           routes/api.php: /api/health, future CRUD
    | DB connection
    v
[Railway: MySQL]              ← expenses, categories tables
```

Data flow for walking skeleton:
1. Browser loads React app from Vercel
2. React app calls `GET /api/health` on Railway URL (via axios instance)
3. Laravel returns `{success:true, data:{status:"ok"}, message:"API is healthy"}`
4. React renders status — end-to-end confirmed

### Recommended Project Structure

```
group5_fivestar/               ← repo root
├── backend/                   ← Laravel 11 (Railway)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/       ← namespace App\Http\Controllers\Api
│   │   │   └── Middleware/
│   │   │       └── JwtMiddleware.php
│   │   ├── Models/
│   │   │   └── User.php       ← implements JWTSubject (Phase 2)
│   │   └── Providers/
│   │       └── AppServiceProvider.php  ← response macros registered here
│   ├── bootstrap/
│   │   └── app.php            ← withRouting, withMiddleware, withExceptions
│   ├── config/
│   │   ├── auth.php           ← api guard: jwt driver
│   │   ├── cors.php           ← allowed_origins for Vercel domain
│   │   └── jwt.php            ← published by tymon
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── create_categories_table.php
│   │   │   └── create_expenses_table.php
│   │   └── seeders/
│   │       └── CategorySeeder.php
│   ├── routes/
│   │   ├── api.php            ← created by install:api; /health endpoint here
│   │   └── web.php            ← minimal; /up health is auto-registered
│   ├── .env                   ← DB_* vars from Railway, JWT_SECRET, APP_KEY
│   └── railway.toml           ← optional; root dir set in Railway UI instead
├── frontend/                  ← React+Vite+TypeScript (Vercel)
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts      ← axios instance with baseURL=VITE_API_URL
│   │   ├── pages/
│   │   │   └── HomePage.tsx   ← renders health check status
│   │   ├── App.tsx            ← router + layout
│   │   └── main.tsx           ← ReactDOM.createRoot entry
│   ├── index.html
│   ├── vercel.json            ← SPA rewrite rule
│   ├── vite.config.ts
│   └── tsconfig.json
└── ui-mockups/                ← renamed from ui_design/ (D-02)
    ├── app.jsx
    ├── add-screen.jsx
    └── ...
```

### Pattern 1: Laravel 11 bootstrap/app.php Structure

**What:** All middleware, routing, and exception handling registered in a single file.
**When to use:** Always in Laravel 11 — replaces Kernel.php from v10.

```php
// backend/bootstrap/app.php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',                                   // Built-in health check
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\JwtMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
```
[CITED: laravel.com/docs/11.x/releases — withRouting/withMiddleware pattern]

**Important:** `routes/api.php` is NOT present by default in Laravel 11. It is created by running `php artisan install:api`. That command also installs Sanctum — which is fine; Sanctum is not used since JWT is the auth mechanism, but the api route file scaffold is what we need.

### Pattern 2: API Response Envelope (AppServiceProvider)

**What:** Register response macros so all controllers use a consistent `{success, data, message}` envelope.
**When to use:** Register in `AppServiceProvider::boot()` once; call in every controller.

```php
// backend/app/Providers/AppServiceProvider.php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Response::macro('success', function (mixed $data = null, string $message = 'Success', int $status = 200) {
            return Response::json([
                'success' => true,
                'data'    => $data,
                'message' => $message,
            ], $status);
        });

        Response::macro('error', function (string $message = 'Error', array $errors = [], int $status = 400) {
            return Response::json([
                'success' => false,
                'message' => $message,
                'errors'  => $errors,   // [{field, message}]
            ], $status);
        });
    }
}
```

Usage in controllers:
```php
return response()->success(['status' => 'ok'], 'API is healthy');
return response()->error('Validation failed', [['field' => 'amount', 'message' => 'Must be > 0']]);
```
[ASSUMED: Macro registration pattern is stable across Laravel 11; verified as standard approach from multiple sources]

### Pattern 3: tymon/jwt-auth Setup for Laravel 11

**What:** JWT auth guard registration. Middleware wired but NO auth routes yet (those are Phase 2).
**When to use:** Phase 1 wires this so Phase 2 can add routes without touching config.

```php
// backend/config/auth.php — api guard section
'defaults' => [
    'guard' => 'api',
    'passwords' => 'users',
],

'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'api' => ['driver' => 'jwt',     'provider' => 'users'],
],
```

```php
// backend/app/Http/Middleware/JwtMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next): mixed
    {
        try {
            JWTAuth::parseToken()->authenticate();
        } catch (TokenExpiredException $e) {
            return response()->error('Token expired', [], 401);
        } catch (TokenInvalidException $e) {
            return response()->error('Token invalid', [], 401);
        } catch (JWTException $e) {
            return response()->error('Token absent', [], 401);
        }

        return $next($request);
    }
}
```

```php
// backend/config/jwt.php — fix TTL integer cast issue in Laravel 11
'ttl'         => (int) env('JWT_TTL', 60),
'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 20160),
```
[CITED: dev.to/jruizsilva/laravel-11-api-rest-auth-with-jwt-auth-nb4 — Laravel 11 TTL cast requirement]

### Pattern 4: CORS Configuration (Native Laravel 11)

**What:** Built-in CORS support via `config/cors.php`. No third-party package needed since Laravel 9.2.
**When to use:** Required for Railway backend to accept requests from Vercel frontend domain.

```php
// backend/config/cors.php (publish with php artisan config:publish cors)
return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
```

Set `FRONTEND_URL=https://your-app.vercel.app` in Railway env vars. During development, `http://localhost:5173` is the Vite dev server default.

### Pattern 5: Axios API Client with Base URL

**What:** Single axios instance configured with Railway URL and JWT bearer token injection.
**When to use:** Import in all components that call the API.

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — attaches JWT token when present (Phase 2 will store it)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Pattern 6: vercel.json SPA Rewrite Rule

**What:** Redirects all non-asset requests to index.html so React Router handles client-side routing.
**When to use:** Required for any Vite React SPA deployed to Vercel.

```json
// frontend/vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
[CITED: vercel.com/docs/frameworks/frontend/vite — SPA rewrite configuration, updated 2026-03-09]

### Pattern 7: MySQL Schema Migrations

**What:** Laravel migration files for the two v1 tables needed by Phase 1 (schema established now; CRUD in Phase 3/4).
**When to use:** Run in Phase 1 to verify DB connection and confirm schema is correct.

```php
// database/migrations/xxxx_create_categories_table.php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name', 50)->unique();
    $table->text('description')->nullable();
    $table->string('color', 7)->nullable();     // HEX: #RRGGBB
    $table->string('icon', 50)->nullable();
    $table->decimal('budget', 10, 2)->nullable();
    $table->timestamps();
    $table->index('name');
});

// database/migrations/xxxx_create_expenses_table.php
Schema::create('expenses', function (Blueprint $table) {
    $table->id();
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('THB');
    $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
    $table->string('description', 255);
    $table->date('expense_date');
    $table->text('notes')->nullable();
    $table->boolean('is_recurring')->default(false);
    $table->unsignedBigInteger('recurring_id')->nullable();
    $table->timestamps();
    $table->index('expense_date');
    $table->index('category_id');
    $table->index('created_at');
});
```

Note: `user_id` column is intentionally absent from Phase 1 migrations — Phase 2 adds `users` table and the foreign key migration.

**CategorySeeder default data (from SPEC.md):**
```php
$categories = [
    ['name' => 'Food',          'icon' => 'utensils',  'color' => '#FF6B6B'],
    ['name' => 'Transport',     'icon' => 'car',       'color' => '#4ECDC4'],
    ['name' => 'Housing',       'icon' => 'home',      'color' => '#FFE66D'],
    ['name' => 'Education',     'icon' => 'book',      'color' => '#95E1D3'],
    ['name' => 'Health',        'icon' => 'heart',     'color' => '#F38181'],
    ['name' => 'Entertainment', 'icon' => 'gamepad',   'color' => '#AA96DA'],
    ['name' => 'Shopping',      'icon' => 'shopping-bag', 'color' => '#FCBAD3'],
    ['name' => 'Utilities',     'icon' => 'zap',       'color' => '#A8D8EA'],
    ['name' => 'Business',      'icon' => 'briefcase', 'color' => '#C1D82F'],
    ['name' => 'Other',         'icon' => 'gift',      'color' => '#999999'],
];
```
[CITED: SPEC.md §DB Schema — canonical schema definitions for this project]

### Anti-Patterns to Avoid

- **Using Sanctum tokens instead of JWT:** `php artisan install:api` installs Sanctum; that is fine for creating routes/api.php, but do NOT use Sanctum's token guard — keep the `api` guard set to `jwt` driver.
- **Putting backend on Vercel:** Vercel PHP serverless runtime is explicitly excluded (D-05). Laravel does not deploy cleanly to Vercel.
- **Skipping `php artisan install:api`:** In Laravel 11, `routes/api.php` does not exist until this command is run. Manually creating it misses the bootstrap/app.php registration.
- **Hardcoding Railway URL:** Always use `VITE_API_URL` env var. Never hardcode the Railway domain in source code.
- **Using SQLite:** Locked out — MySQL only per CLAUDE.md.
- **Wildcard CORS `allowed_origins: ['*']`:** Acceptable for development but must be scoped to the specific Vercel domain in production.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token issuance/validation | Custom JWT encode/decode | tymon/jwt-auth ^2.1 | Token expiry, refresh, blacklisting have edge cases; library handles RS256/HS256, TTL, guards |
| CORS headers | Custom middleware | Laravel built-in HandleCors (config/cors.php) | Preflight OPTIONS handling, cache headers, security edge cases |
| HTTP client | Custom fetch wrapper | axios with interceptors | Token injection, retry logic, error normalization; fetch requires manual wrapper for same behavior |
| Response consistency | Inline arrays in every controller | Response macros in AppServiceProvider | Ensures uniform envelope; single change point if envelope shape changes |
| SPA routing | Custom Nginx/Apache config | vercel.json rewrite rule | Vercel handles this natively; one line config |

**Key insight:** JWT and CORS together are a common failure point in Laravel API + React SPA setups. Using the established packages means spending zero time on HTTP header debugging and zero time on token parsing bugs.

---

## Common Pitfalls

### Pitfall 1: Laravel 11 Missing routes/api.php
**What goes wrong:** Developer creates `/backend` with `composer create-project`, then immediately tries to add API routes to a file that doesn't exist yet.
**Why it happens:** Laravel 11 removed routes/api.php from the default scaffold to reduce boilerplate.
**How to avoid:** Run `php artisan install:api` immediately after project creation. This creates routes/api.php and registers it in bootstrap/app.php.
**Warning signs:** 404 on all `/api/*` routes even though the route is defined.

### Pitfall 2: JWT TTL TypeError in Laravel 11
**What goes wrong:** `TypeError: Argument 1 passed to DateInterval::createFromDateString() must be of type string, int given`
**Why it happens:** PHP 8.2+ strict type checks; jwt.php config stores TTL as `env('JWT_TTL', 60)` which returns a string.
**How to avoid:** Cast TTL values to int in `config/jwt.php`: `'ttl' => (int) env('JWT_TTL', 60)`
**Warning signs:** JWT auth works locally on PHP 8.1 but fails on Railway (PHP 8.2+).

### Pitfall 3: CORS Blocking Vercel → Railway Requests
**What goes wrong:** Frontend makes API calls; browser blocks them with "No 'Access-Control-Allow-Origin' header".
**Why it happens:** Railway backend domain and Vercel frontend domain are different origins. Backend must explicitly allow the frontend domain.
**How to avoid:** Set `FRONTEND_URL` env var in Railway service to the exact Vercel domain. Configure `config/cors.php` to read from `env('FRONTEND_URL')`. Set `paths: ['api/*']`.
**Warning signs:** Health check works with curl/Postman but fails in browser.

### Pitfall 4: Railway Monorepo Root Directory Not Set
**What goes wrong:** Railway tries to build from repo root and fails (no composer.json at root).
**Why it happens:** Default Railway service points to repo root, not `/backend` subdirectory.
**How to avoid:** In Railway service settings → Source → Root Directory: set to `/backend`. Railway then treats `/backend` as the project root for all build commands.
**Warning signs:** Railway build fails with "could not find composer.json" or similar.

### Pitfall 5: Vite Proxy Works Locally but Not on Vercel
**What goes wrong:** API calls work in dev (`vite.config.ts` proxy config to localhost backend), but fail after Vercel deploy.
**Why it happens:** Vite dev server proxy only runs locally. In production, Vercel serves a static bundle — no proxy.
**How to avoid:** Always use `VITE_API_URL` (the Railway URL) as the axios base URL. Do NOT rely on Vite's proxy for the axios instance. Vite proxy is only useful for development DX — configure it as a dev convenience but ensure the axios client always uses the env var.
**Warning signs:** API calls fail in production but work in dev; CORS errors appear only on deployed build.

### Pitfall 6: React Router Deep Links Return 404 on Vercel
**What goes wrong:** Navigating to `/expenses` directly (or refreshing) returns Vercel 404.
**Why it happens:** Vercel serves static files; `/expenses` has no static file. Without the rewrite rule, Vercel returns 404 instead of serving index.html.
**How to avoid:** Include `vercel.json` with the SPA rewrite rule in `/frontend` before first deploy.
**Warning signs:** Root URL works; any sub-path fails on refresh or direct navigation.

### Pitfall 7: Missing APP_KEY on Railway
**What goes wrong:** Laravel 500 error on Railway; all requests fail.
**Why it happens:** `APP_KEY` must be set as an environment variable in Railway. It is NOT committed to git (`.env` is gitignored).
**How to avoid:** Generate locally with `php artisan key:generate --show`, copy the output, set it as `APP_KEY` in Railway service environment variables.
**Warning signs:** Every request returns 500; Laravel log shows "No application encryption key has been specified."

---

## Runtime State Inventory

Step 2.5: SKIPPED — This is a greenfield scaffold phase with no existing runtime state. No renames, no migrations of existing data, no OS-registered services to update.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend scaffold (Vite) | Yes | v24.15.0 | — |
| npm | Frontend package install | Yes | 11.12.1 | — |
| git | Version control | Yes | 2.43.0 | — |
| PHP | Backend scaffold | No | — | Install PHP 8.2+ via official PHP installer for Windows/WSL |
| Composer | Laravel install | No | — | Install from getcomposer.org |
| MySQL (local) | Local dev DB testing | No | — | Use Railway MySQL directly for dev; or install via MAMP/XAMPP/DBngin |
| Docker | Laravel Sail | No | — | N/A — Sail excluded from plan (Composer CLI approach) |

**Missing dependencies with no fallback:**
- PHP 8.2+ — required for `composer create-project laravel/laravel`. Must be installed before plan execution begins.
- Composer — required for all Laravel commands. Install from getcomposer.org.

**Missing dependencies with fallback:**
- MySQL (local) — team can use Railway MySQL directly as the dev database (configure `.env` to point to Railway). Alternatively install MAMP/XAMPP/DBngin locally. Plan should document both options.

**Note for planner:** The machine running this research (WSL2) does not have PHP or Composer. Wave 0 should include a pre-flight step confirming these tools are available on the executing machine. The plan executor likely has PHP/Composer on their Windows environment or can install via WSL2.

---

## Validation Architecture

nyquist_validation is enabled (config.json `workflow.nyquist_validation: true`).

### Test Framework

Phase 1 is a scaffold phase — no application logic to unit test. The appropriate validation is smoke tests: does it deploy, does the health endpoint return, does the React app load.

| Property | Value |
|----------|-------|
| Backend framework | PHPUnit (bundled with Laravel) |
| Frontend framework | Vitest (not yet installed — Wave 0 gap) |
| Backend quick run | `cd backend && php artisan test` |
| Frontend quick run | `cd frontend && npm run test` |

### Phase Requirements → Test Map

Phase 1 has no functional REQ-IDs (foundational). Tests map to success criteria from ROADMAP.md:

| Criteria | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| SC-1 | Laravel returns 200 at `/api/health` | Smoke (HTTP) | `php artisan test --filter=HealthCheckTest` | No — Wave 0 |
| SC-2 | React app loads with no console errors | Manual smoke | Manual browser check | N/A |
| SC-3 | MySQL migrations run cleanly | Integration | `php artisan migrate --pretend` then `php artisan migrate` | N/A (artisan command) |
| SC-4 | JWT secret is configured | Unit | `php artisan test --filter=JwtConfigTest` | No — Wave 0 |
| SC-5 | `git push` triggers Vercel deploy | Manual | Check Vercel deployment dashboard | N/A |

### Wave 0 Gaps
- `backend/tests/Feature/HealthCheckTest.php` — tests `GET /api/health` returns 200 with success envelope
- `backend/tests/Unit/JwtConfigTest.php` — tests JWT_SECRET is set and jwt guard is configured
- `frontend/` — Vitest not installed; install with `npm install --save-dev vitest @vitest/ui`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Partial (wired, not functional until Phase 2) | tymon/jwt-auth — Phase 2 implements routes |
| V3 Session Management | No | JWT is stateless — no server sessions |
| V4 Access Control | No | No auth routes in Phase 1 |
| V5 Input Validation | No | No user input in Phase 1 (scaffold only) |
| V6 Cryptography | Yes | JWT_SECRET: use `php artisan jwt:secret` — never set manually; APP_KEY: use `php artisan key:generate` |

### Known Threat Patterns for Laravel API + React SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT secret exposure | Information Disclosure | Never commit `.env`; set JWT_SECRET in Railway env vars only |
| CORS wildcard | Elevation of Privilege | Use specific Vercel domain in `allowed_origins`, not `*` in production |
| APP_KEY committed to git | Information Disclosure | `.env` is gitignored by Laravel default; confirm `.gitignore` includes `.env` |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Laravel Kernel.php for middleware | bootstrap/app.php withMiddleware() | Laravel 11 (March 2024) | All middleware registration is in one file |
| routes/api.php by default | Must run `php artisan install:api` | Laravel 11 | Easy to miss; causes 404 on all API routes |
| Nixpacks on Railway | Railpack (Railway's own build tool) | 2024-2025 | Auto-detects Laravel via artisan file; migrations run automatically |
| CRA (Create React App) | Vite | 2022-2024 | CRA deprecated; Vite is universal standard |
| React Router v5/v6 | React Router v7 | v7 released Nov 2024 | v7 adds first-class framework mode; for SPA use, API is compatible with v6 |

**Deprecated/outdated:**
- `Create React App`: Officially deprecated; do not use. Vite is the replacement.
- `fruitcake/laravel-cors`: Redundant since Laravel 9.2 which includes HandleCors natively. Do not install.
- Laravel Kernel.php: Removed from default scaffold in Laravel 11. If you find a tutorial referencing Kernel.php for middleware registration, it is pre-Laravel 11.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Response macro registration in AppServiceProvider::boot() is stable for Laravel 11 | Code Examples — Pattern 2 | Low: macros have been a Laravel feature since v5; pattern is well-established |
| A2 | Railway free tier provides persistent MySQL storage between deployments | Environment Availability | High: if Railway free tier drops DB between deployments, migrations must re-run; verify Railway free tier MySQL persistence policy |
| A3 | Vercel GitHub integration auto-deploys from `main` branch without additional config beyond setting root directory | Pitfalls — SC-5 | Medium: Vercel may need `vercel.json` at repo root pointing to `/frontend` subdirectory; verify during setup |
| A4 | `php artisan install:api` does not break JWT guard setup (installs Sanctum but we override the guard) | Pattern 3 — JWT setup | Low: auth guard config in auth.php overrides Sanctum; Sanctum package installed but unused |

---

## Open Questions

1. **Railway Free Tier MySQL Persistence**
   - What we know: Railway provides MySQL as an add-on; environment variables `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQL_URL` are auto-injected
   - What's unclear: Free tier limits (storage GB, connection count, whether DB persists if service sleeps)
   - Recommendation: Set up Railway MySQL immediately in Phase 1 and run migrations; document Railway env var names so `.env` is pre-configured correctly: `DB_HOST=${{MYSQLHOST}}`, `DB_PORT=${{MYSQLPORT}}`, `DB_DATABASE=${{MYSQLDATABASE}}`, `DB_USERNAME=${{MYSQLUSER}}`, `DB_PASSWORD=${{MYSQLPASSWORD}}`

2. **Vercel Subdirectory Deploy Configuration**
   - What we know: Vercel project root must be set to `/frontend`; this is configured in Vercel dashboard or via `vercel.json` at project root
   - What's unclear: Whether a `vercel.json` at repo root is needed to tell Vercel which subdirectory to deploy, or whether the Vercel project's root directory setting alone is sufficient
   - Recommendation: Set root directory in Vercel dashboard during first project import; no repo-root `vercel.json` needed. The `/frontend/vercel.json` handles SPA routing only.

3. **user_id Foreign Key in Phase 1 Migrations**
   - What we know: SPEC.md schema shows `expenses` needs a `user_id` FK; `users` table is created in Phase 2
   - What's unclear: Should Phase 1 create the `users` table stub to enable the FK? Or create `expenses` without `user_id` and add it in Phase 2?
   - Recommendation: Create `expenses` without `user_id` in Phase 1. Phase 2 adds a migration to add the column and FK after creating the `users` table. This avoids a circular dependency problem.

---

## Sources

### Primary (HIGH confidence)
- [CITED: laravel.com/docs/11.x/releases] — Laravel 11 structural changes, bootstrap/app.php, health endpoint, install:api
- [CITED: vercel.com/docs/frameworks/frontend/vite] — vercel.json SPA rewrite pattern, env vars, updated 2026-03-09
- [CITED: railpack.com/languages/php/] — PHP/Laravel auto-detection, document root, start-container.sh, migrations auto-run
- [CITED: docs.railway.com/databases/mysql] — MySQL env var names: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQL_URL
- [CITED: docs.railway.com/guides/deploying-a-monorepo] — Root directory config per service, watch paths
- [CITED: SPEC.md] — Canonical DB schema, API envelope shape, default categories

### Secondary (MEDIUM confidence)
- [CITED: dev.to/jruizsilva/laravel-11-api-rest-auth-with-jwt-auth-nb4] — JWT TTL integer cast fix for Laravel 11 + PHP 8.2
- [CITED: nixpacks.com/docs/providers/php] — Nixpacks PHP env vars (predecessor context; Railpack now used)

### Tertiary (LOW confidence)
- [WebSearch] Multiple sources on tymon/jwt-auth Laravel 11 middleware setup — consistent pattern across sources, elevated to MEDIUM

---

## Metadata

**Confidence breakdown:**
- Standard stack (Vite, React, Laravel, tymon/jwt-auth): HIGH — npm versions verified, Laravel docs confirmed
- Railway deploy (Railpack, root dir, MySQL vars): MEDIUM — platform actively evolving; Railpack replaced Nixpacks recently; validate during execution
- vercel.json SPA rewrite: HIGH — official Vercel docs, updated March 2026
- JWT setup for Laravel 11: MEDIUM-HIGH — multiple consistent sources; TTL cast is a known confirmed issue

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (Railway platform changes rapidly; re-verify Railway-specific steps if > 30 days)
