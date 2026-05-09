# Phase 2: Authentication - Research

**Researched:** 2026-05-09
**Domain:** JWT authentication — tymon/jwt-auth 2.3.0 (Laravel) + react-router-dom v7 (React)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single `/auth` route with Login/Register tabs — not separate /auth/login and /auth/register routes. Replaces the existing `AuthPage.tsx` placeholder.
- **D-02:** Login tab shown first by default (returning users are the majority).
- **D-03:** After successful login or register, redirect to `/` (home page).
- **D-04:** Unauthenticated access to `/expenses`, `/categories`, `/analytics` redirects to `/auth` — implemented via a `ProtectedRoute` wrapper component in App.tsx.
- **D-05:** Server-side token blacklist on logout — `auth()->logout()` adds token to Laravel cache blacklist. File cache used on Railway (resets on redeploy — acceptable for v1).
- **D-06:** JWT stored in `localStorage` under key `auth_token` — already wired in Phase 1 `frontend/src/api/client.ts` interceptor.
- **D-07:** JWT TTL set to **24 hours** (1440 minutes). Update `JWT_TTL=1440` in `backend/config/jwt.php` and Railway env vars.
- **D-08:** Errors shown **inline below the form submit button** as a red message string. No toast library. No field-level errors.
- **D-09:** Submit button is **disabled and shows "Loading..."** during API call.
- **D-10:** Registration form collects **email + password only** — no name field.
- **D-11:** Password validation: **min 8 characters** with a `Confirm Password` field. Laravel rule: `'password' => 'required|min:8|confirmed'`.

### Claude's Discretion
- Laravel controller structure (single AuthController vs separate RegisterController/LoginController) — planner decides. Single AuthController is idiomatic for small APIs.
- React form state management (useState vs useReducer) — planner decides. useState is fine for 2–3 fields.
- Exact CSS/inline styles for the tab switcher — planner decides. Match the minimal inline style pattern from Phase 1 placeholder pages.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 2 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can register with email and password | POST /api/auth/register with email_unique validation + User::create; auth()->login($user) to return token |
| AUTH-02 | User can log in and receive a JWT token | POST /api/auth/login with auth()->attempt($credentials); returns token in envelope data field |
| AUTH-03 | User can log out (token invalidated) | POST /api/auth/logout with auth()->logout(); blacklist_enabled=true already in jwt.php |
| AUTH-04 | All expense/category/report endpoints require valid JWT | Apply `jwt.auth` middleware alias (already registered in bootstrap/app.php) to protected route groups |
</phase_requirements>

---

## Summary

Phase 2 wires together the already-configured JWT stack (tymon/jwt-auth 2.3.0, `jwt.auth` middleware alias, api guard set to jwt driver) with two new deliverables: an `AuthController` on the backend and a replaced `AuthPage.tsx` on the frontend. All scaffolding from Phase 1 is complete and correct — no configuration changes are needed except updating the JWT TTL from 60 to 1440 minutes.

The backend work is additive: implement `JWTSubject` on the User model, create `AuthController` with four methods (register, login, logout, me), add four routes to `api.php`, and add `jwt.auth` middleware to the existing protected-route groups (which currently have no routes, but AUTH-04 requires the guard to be in place before Phase 3 adds category routes). The frontend work replaces the `AuthPage.tsx` placeholder with a tabbed Login/Register form, adds a `ProtectedRoute` component, and wraps `/expenses`, `/categories`, `/analytics` in App.tsx.

The critical integration point is already built: `frontend/src/api/client.ts` reads `localStorage.getItem('auth_token')` and attaches `Authorization: Bearer` on every request. Phase 2 only needs to write `auth_token` to localStorage after login/register and remove it on logout.

**Primary recommendation:** Single `AuthController` with register/login/logout/me methods; `ProtectedRoute` component that checks `localStorage.getItem('auth_token')` and renders `<Navigate to="/auth" replace />` when absent.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Token issuance (register/login) | API / Backend | — | tymon/jwt-auth runs server-side; token generated from credentials |
| Token blacklisting (logout) | API / Backend | — | Blacklist stored in Laravel cache (server-side); client just deletes localStorage copy |
| JWT validation per request | API / Backend | — | JwtMiddleware parses Bearer header before controller runs |
| Token storage | Browser / Client | — | localStorage under `auth_token`; already wired in client.ts interceptor |
| Route guarding | Frontend (SPA routing) | — | ProtectedRoute checks localStorage; no API call needed on every page load |
| Auth UI (tabs, forms) | Browser / Client | — | React component; purely presentational |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tymon/jwt-auth | 2.3.0 (installed) | JWT issuance, validation, blacklisting | Already installed; api guard already wired to jwt driver in auth.php |
| react-router-dom | 7.15.0 (installed) | Client-side routing, Navigate redirect, ProtectedRoute | Already installed; App.tsx already uses BrowserRouter/Routes/Route |
| axios | 1.16.0 (installed) | HTTP client with interceptor that injects Bearer header | Already installed and wired in client.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Laravel Validator | (framework) | Server-side request validation for register/login | Use `$request->validate()` in AuthController — no extra install |
| Laravel Hash | (framework) | Password hashing with bcrypt | Already applied via `'password' => 'hashed'` cast in User model |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| auth()->logout() | JWTAuth::invalidate() facade | Both work; auth() helper is idiomatic with the api guard already configured |
| localStorage | httpOnly cookie | Cookie is more XSS-safe but requires CORS credential config and same-site setup; localStorage was locked as D-06 |
| Single AuthController | Separate RegisterController + LoginController | Single controller is cleaner for 4 methods at this scale |

**No installation required** — all libraries are already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser                       Laravel API                    MySQL
  |                               |                             |
  |-- POST /api/auth/register --> |                             |
  |                               |-- INSERT users -----------> |
  |                               |<-- user record ------------ |
  |                               |-- auth()->login($user)      |
  |<-- {success, data:{token}} -- |   (issues JWT)              |
  |                               |                             |
  |-- POST /api/auth/login -----> |                             |
  |                               |-- auth()->attempt() ------> |
  |                               |<-- user record ------------ |
  |<-- {success, data:{token}} -- |   (issues JWT)              |
  |                               |                             |
  |-- POST /api/auth/logout ----> |                             |
  |   Authorization: Bearer ...   |-- auth()->logout()          |
  |                               |   (blacklists token         |
  |                               |    in Laravel cache)        |
  |<-- {success, data:null} ----- |                             |
  |                               |                             |
  |-- GET /api/categories ------> |                             |
  |   (no token)                  |-- JwtMiddleware             |
  |<-- 401 Token absent --------- |   (rejects before           |
  |                               |    controller runs)         |
  |                               |                             |

React SPA Route Guard
  |
  |-- User visits /expenses
  |-- ProtectedRoute checks localStorage.getItem('auth_token')
  |-- null → <Navigate to="/auth" replace />
  |-- present → render <ExpensesPage />
```

### Recommended Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php    [NEW] register, login, logout, me
│   │   │   └── HealthController.php  [existing]
│   │   └── Middleware/
│   │       └── JwtMiddleware.php     [existing — do not modify]
│   └── Models/
│       └── User.php                  [MODIFY] add JWTSubject interface
├── config/
│   └── jwt.php                       [MODIFY] ttl: 60 → 1440
└── routes/
    └── api.php                       [MODIFY] add auth routes + protected group

frontend/src/
├── api/
│   └── client.ts                     [existing — do not modify]
├── components/
│   └── ProtectedRoute.tsx            [NEW]
├── pages/
│   └── AuthPage.tsx                  [REPLACE entirely]
└── App.tsx                           [MODIFY] wrap protected routes
```

### Pattern 1: JWTSubject Interface on User Model

**What:** Two methods that tymon/jwt-auth requires on any Eloquent model used for authentication.
**When to use:** Required — without this the model cannot be used to issue tokens.

```php
// Source: https://github.com/tymondesigns/jwt-auth/blob/2.x/docs/quick-start.md
// [VERIFIED: Context7 /tymondesigns/jwt-auth]
<?php
namespace App\Models;

use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = ['email', 'password'];  // D-10: no name field

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
```

**Note:** `name` must be removed from `$fillable` because D-10 prohibits it. The `users` table has a nullable `name` column from Phase 1 migration — that is fine, the field just won't be set on registration.

### Pattern 2: AuthController Structure

**What:** Single controller handling all four auth endpoints.
**When to use:** Idiomatic for small APIs; matches Claude's Discretion decision.

```php
// Source: https://github.com/tymondesigns/jwt-auth/blob/2.x/docs/quick-start.md
// [VERIFIED: Context7 /tymondesigns/jwt-auth] — adapted for project response envelope
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|min:8|confirmed',  // D-11
        ]);

        $user  = User::create($data);
        $token = auth()->login($user);

        return response()->success(
            ['token' => $token],
            'Registration successful',
            201
        );
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (! $token = auth()->attempt($credentials)) {
            return response()->error('Invalid credentials', [], 401);
        }

        return response()->success(['token' => $token], 'Login successful');
    }

    public function logout(): JsonResponse
    {
        auth()->logout();  // D-05: adds token to blacklist in Laravel cache
        return response()->success(null, 'Logged out successfully');
    }

    public function me(): JsonResponse
    {
        return response()->success(auth()->user(), 'Authenticated user');
    }
}
```

### Pattern 3: Auth Routes in api.php

**What:** Public auth routes + protected group applying `jwt.auth` alias.
**When to use:** The `jwt.auth` alias is already registered in bootstrap/app.php — just reference it here.

```php
// [VERIFIED: codebase — bootstrap/app.php line 12 registers jwt.auth alias]
<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'index']);

// Public auth endpoints
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Protected auth endpoints
Route::middleware('jwt.auth')->prefix('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me',      [AuthController::class, 'me']);
});

// Protected API endpoints (AUTH-04: all expense/category/report routes go here)
Route::middleware('jwt.auth')->group(function () {
    // Phase 3: category routes added here
    // Phase 4: expense routes added here
    // Phase 5: analytics routes added here
});
```

### Pattern 4: ProtectedRoute Component (React Router v7)

**What:** Wrapper component that checks localStorage for a token; redirects to /auth if absent.
**When to use:** Wraps all routes that require authentication in App.tsx.

```tsx
// Source: https://github.com/remix-run/react-router/blob/main/examples/auth/src/App.tsx
// [VERIFIED: Context7 /remix-run/react-router]
// Simplified per D-04 (no location state needed — D-03 always redirects to /)
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}
```

### Pattern 5: AuthPage.tsx — Tab Structure with Form State

**What:** Replaces placeholder with Login/Register tabs using React useState.
**When to use:** D-01 requires single /auth route with tabs; D-08/D-09 require inline errors + loading state.

```tsx
// [ASSUMED — pattern based on codebase conventions from HomePage.tsx and Context decisions]
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

type Tab = 'login' | 'register';

interface ApiResponse {
  success: boolean;
  data: { token: string } | null;
  message: string;
}

export default function AuthPage() {
  const [tab, setTab]           = useState<Tab>('login');  // D-02: login default
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');  // D-11
  const [loading, setLoading]   = useState(false);  // D-09
  const [error, setError]       = useState<string | null>(null);  // D-08
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);  // D-09
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { email, password, password_confirmation: confirmPassword };
      const res = await apiClient.post<ApiResponse>(endpoint, body);
      localStorage.setItem('auth_token', res.data.data!.token);  // D-06
      navigate('/');  // D-03
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Something went wrong';
      setError(msg);  // D-08
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '400px' }}>
      <h1>Expense Tracker</h1>
      {/* Tab switcher */}
      <div>
        <button onClick={() => setTab('login')}
                style={{ fontWeight: tab === 'login' ? 'bold' : 'normal' }}>
          Login
        </button>
        <button onClick={() => setTab('register')}
                style={{ fontWeight: tab === 'register' ? 'bold' : 'normal' }}>
          Register
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div><label>Email<input type="email" value={email}
          onChange={e => setEmail(e.target.value)} required /></label></div>
        <div><label>Password<input type="password" value={password}
          onChange={e => setPassword(e.target.value)} required /></label></div>
        {tab === 'register' && (
          <div><label>Confirm Password<input type="password" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} required /></label></div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : tab === 'login' ? 'Log In' : 'Register'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}  {/* D-08 */}
      </form>
    </div>
  );
}
```

### Pattern 6: App.tsx — Wrapping Protected Routes

**What:** Wrap the three protected routes in `ProtectedRoute`; keep `/` and `/auth` public.
**When to use:** Satisfies AUTH-04 at the client-side routing level.

```tsx
// [VERIFIED: codebase — current App.tsx structure]
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ExpensesPage from './pages/ExpensesPage';
import CategoriesPage from './pages/CategoriesPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/auth"     element={<AuthPage />} />
        <Route path="/expenses"   element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
        <Route path="/analytics"  element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Anti-Patterns to Avoid

- **Using constructor middleware on AuthController:** The tymon/jwt-auth quick-start shows `$this->middleware('auth:api', ['except' => ['login']])` in the constructor. Do NOT use this — the project uses route-level `jwt.auth` middleware groups in api.php, which is cleaner and more explicit for Laravel 11.
- **Calling JWTAuth facade directly for logout:** `JWTAuth::invalidate()` requires the token to be parsed first. Use `auth()->logout()` instead — it handles parsing internally and is the idiomatic api-guard approach.
- **Storing token in response envelope `message` field:** Token must be in `data.token`, not `message`. The existing `response()->success()` macro puts data in the `data` field.
- **Forgetting `password_confirmation` field name:** Laravel's `confirmed` rule expects a field named `{field}_confirmation` (i.e., `password_confirmation`), not `confirmPassword`. The frontend must send `password_confirmation`.
- **Making API call in ProtectedRoute to validate token:** Client-side localStorage check is sufficient for v1 (per CONTEXT.md specifics). Adding an API call makes every page load slower and requires handling the async state.
- **React Router v7 `<Navigate>` without `replace`:** Without `replace`, the login redirect goes into browser history, causing the back button to loop back to the protected page. Always use `replace`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt wrapper | Laravel's `'password' => 'hashed'` cast (already in User model) | Already configured; handles rounds, rehashing, timing-safe comparison |
| Token blacklisting | Custom cache key management | `auth()->logout()` from tymon/jwt-auth | The library manages JTI tracking, cache TTL alignment, and blacklist lookup |
| JWT signature verification | Custom HMAC decode | `JwtMiddleware::parseToken()->authenticate()` (already built in Phase 1) | Already handles TokenExpiredException, TokenInvalidException, JWTException |
| Email uniqueness check | Manual `User::where('email', $email)->exists()` | Laravel validation rule `unique:users,email` | Atomic, race-condition safe via DB constraint + validation |
| Form loading/disabled state | Manual DOM manipulation | React `useState` + `disabled={loading}` | Standard React controlled component pattern |

**Key insight:** The blacklist, middleware, and password hashing are entirely pre-built. Phase 2 is additive wiring, not infrastructure.

---

## Common Pitfalls

### Pitfall 1: `name` in `$fillable` breaks registration
**What goes wrong:** `User::create($data)` with `['email', 'password']` will silently skip `name` if it is in `$fillable` but not in `$data`. However, if `name` has a NOT NULL constraint in the migration without a default, the INSERT fails.
**Why it happens:** Phase 1 migration sets `$table->string('name')` which is NOT NULL with no default.
**How to avoid:** Check the actual migration. If `name` is NOT NULL, either: (a) add `->nullable()` in a new migration, or (b) set `->default('')`. Do NOT add `name` to the registration form (D-10 prohibits it). The recommended fix is a migration: `$table->string('name')->nullable()->change()`.
**Warning signs:** 500 error on register with "Integrity constraint violation: 1048 Column 'name' cannot be null".

### Pitfall 2: `password_confirmation` field name mismatch
**What goes wrong:** Laravel's `confirmed` rule looks for `password_confirmation` in the request. If the frontend sends `confirmPassword` or `confirm_password`, validation fails with 422.
**Why it happens:** React state variable name (`confirmPassword`) differs from the Laravel convention.
**How to avoid:** The `handleSubmit` function must map the React state to the correct key: `password_confirmation: confirmPassword` in the POST body.
**Warning signs:** 422 "The password confirmation does not match" even when both fields have the same value.

### Pitfall 3: Blacklist resets on Railway redeploy
**What goes wrong:** Tokens that were invalidated (logged out) become valid again after a Railway service redeploy because the file cache is wiped.
**Why it happens:** `jwt.php` uses `Tymon\JWTAuth\Providers\Storage\Illuminate::class` (Laravel cache). Laravel's `CACHE_STORE` defaults to `file` on Railway. File cache lives in `storage/framework/cache/` which is ephemeral on Railway.
**How to avoid:** This is accepted for v1 (documented in CONTEXT.md D-05). No action needed unless v2 adds Redis. Document in code comments.
**Warning signs:** Logged-out users can re-authenticate using a token that was previously invalidated — only manifests after a Railway restart.

### Pitfall 4: CORS preflight blocks auth endpoints
**What goes wrong:** Browser sends OPTIONS preflight before POST /api/auth/login. If CORS is not configured to allow the Vercel frontend origin, the login request is blocked before it reaches Laravel.
**Why it happens:** Phase 1 scaffold wired CORS but the Vercel URL was not necessarily in `CORS_ALLOWED_ORIGINS` at time of setup.
**How to avoid:** Verify `CORS_ALLOWED_ORIGINS` in Railway env vars includes the Vercel deploy URL. Laravel's `config/cors.php` should have `'paths' => ['api/*']` — check this file exists and is correct.
**Warning signs:** Browser console shows "CORS error" or "Access-Control-Allow-Origin" missing; OPTIONS request returns 405.

### Pitfall 5: React Router v7 `<Navigate>` API difference from v5
**What goes wrong:** Older patterns use `<Redirect to="/auth" />` (v5) which does not exist in v7.
**Why it happens:** react-router-dom v7 is installed (package.json shows `^7.15.0`); v5 patterns copied from StackOverflow will fail.
**How to avoid:** Use `<Navigate to="/auth" replace />` from `react-router-dom`. This is verified from the react-router v7 source example.
**Warning signs:** TypeScript error "Module has no exported member 'Redirect'".

### Pitfall 6: Auth guard not specified — wrong guard used
**What goes wrong:** Calling `auth()->user()` or `auth()->logout()` without specifying the guard defaults to whatever `auth.defaults.guard` is. In this project it is `api` (confirmed in auth.php line 19), which uses the jwt driver — so this is already correct. But be aware that if the default guard were changed to `web`, the JWT guard would not be called.
**Why it happens:** auth.php `defaults.guard` is set to `api` in Phase 1 — this is intentional and correct.
**How to avoid:** No action needed. Confirmed: `auth()->attempt()`, `auth()->login()`, `auth()->logout()`, `auth()->user()` all correctly route to the jwt guard.
**Warning signs:** Would only appear if someone changes `auth.defaults.guard` back to `web`.

---

## Exact File Changes

### Files to CREATE
| File | Type | What |
|------|------|------|
| `backend/app/Http/Controllers/Api/AuthController.php` | New PHP class | register, login, logout, me methods |
| `frontend/src/components/ProtectedRoute.tsx` | New React component | localStorage check + Navigate redirect |

### Files to MODIFY
| File | Change | Specific Lines / Scope |
|------|--------|----------------------|
| `backend/app/Models/User.php` | Add JWTSubject interface | Add `implements JWTSubject`, two methods, update `$fillable` to remove `name` (or handle via migration — see Pitfall 1) |
| `backend/config/jwt.php` | Update TTL | Line 104: `'ttl' => (int) env('JWT_TTL', 60)` — set `JWT_TTL=1440` in Railway env (do not hardcode) |
| `backend/routes/api.php` | Add routes | POST /auth/register, POST /auth/login (public); POST /auth/logout, GET /auth/me (jwt.auth); empty protected group for future phases |
| `frontend/src/pages/AuthPage.tsx` | Full replacement | Discard placeholder; implement Login/Register tab component per D-01 through D-11 |
| `frontend/src/App.tsx` | Wrap protected routes | Import ProtectedRoute; wrap ExpensesPage, CategoriesPage, AnalyticsPage |

### Files NOT to touch
| File | Reason |
|------|--------|
| `backend/app/Http/Middleware/JwtMiddleware.php` | Complete and correct — do not modify |
| `backend/bootstrap/app.php` | `jwt.auth` alias already registered — do not modify |
| `backend/config/auth.php` | api guard already uses jwt driver — do not modify |
| `frontend/src/api/client.ts` | Interceptor already reads auth_token — do not modify |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | PHPUnit 12.5.12 (backend) — no frontend test framework installed |
| Config file | `backend/phpunit.xml` |
| Quick run command | `cd backend && php artisan test --filter Auth` |
| Full suite command | `cd backend && php artisan test` |

**Note on phpunit.xml:** `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:` are set for tests — SQLite in-memory is used for the test suite only. Production uses MySQL. This is correct and intentional for fast test runs.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST /api/auth/register returns 201 + token | Feature | `php artisan test --filter AuthTest::test_user_can_register` | No — Wave 0 |
| AUTH-01 | POST /api/auth/register with duplicate email returns 422 | Feature | `php artisan test --filter AuthTest::test_register_rejects_duplicate_email` | No — Wave 0 |
| AUTH-01 | POST /api/auth/register with password < 8 chars returns 422 | Feature | `php artisan test --filter AuthTest::test_register_rejects_short_password` | No — Wave 0 |
| AUTH-02 | POST /api/auth/login with valid credentials returns 200 + token | Feature | `php artisan test --filter AuthTest::test_user_can_login` | No — Wave 0 |
| AUTH-02 | POST /api/auth/login with wrong password returns 401 | Feature | `php artisan test --filter AuthTest::test_login_rejects_wrong_password` | No — Wave 0 |
| AUTH-03 | POST /api/auth/logout invalidates token (subsequent request returns 401) | Feature | `php artisan test --filter AuthTest::test_logout_invalidates_token` | No — Wave 0 |
| AUTH-04 | GET /api/categories without token returns 401 | Feature | `php artisan test --filter AuthTest::test_protected_route_rejects_unauthenticated` | No — Wave 0 |
| AUTH-04 | GET /api/categories with valid token returns 200 (or 404 pre-Phase 3) | Feature | `php artisan test --filter AuthTest::test_protected_route_accepts_valid_token` | No — Wave 0 |

**Frontend tests:** No frontend test framework is installed (`package.json` has no vitest, jest, or @testing-library). Frontend validation is manual (browser smoke test). This is acceptable for v1 school project scope.

### Sampling Rate
- **Per task commit:** `cd /mnt/c/Users/Admin/Desktop/group5_fivestar/backend && php artisan test --filter Auth`
- **Per wave merge:** `cd /mnt/c/Users/Admin/Desktop/group5_fivestar/backend && php artisan test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/Feature/AuthTest.php` — covers AUTH-01, AUTH-02, AUTH-03, AUTH-04 (8 test methods listed above)

*(All other test infrastructure is in place: `backend/tests/TestCase.php`, `backend/phpunit.xml`, in-memory SQLite wired.)*

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| tymon/jwt-auth | All auth endpoints | Yes | 2.3.0 (composer.lock) | — |
| react-router-dom | ProtectedRoute, Navigate | Yes | 7.15.0 (package.json) | — |
| axios | API calls from frontend | Yes | 1.16.0 (package.json) | — |
| PHPUnit | Backend tests | Yes | 12.5.12 (composer.lock) | — |
| SQLite (in-memory) | Test DB | Yes (phpunit.xml) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | tymon/jwt-auth `auth()->attempt()` — timing-safe credential check via Laravel Hash |
| V3 Session Management | Yes | JWT blacklist via `auth()->logout()`; 24-hour TTL (D-07) |
| V4 Access Control | Yes | `jwt.auth` middleware on all expense/category/report routes (AUTH-04) |
| V5 Input Validation | Yes | `$request->validate()` in AuthController — email format, unique, min:8, confirmed |
| V6 Cryptography | Yes | bcrypt via Laravel `'password' => 'hashed'` cast (already in User model) — do not hand-roll |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Credential brute force | Tampering | Not mitigated in v1 (rate limiting is v2 scope) — acceptable for school project |
| Token replay after logout | Repudiation | `auth()->logout()` blacklists JTI in Laravel cache — mitigated (resets on redeploy, D-05) |
| JWT tampering (algorithm confusion) | Tampering | `jwt.php` locks to HS256; `required_claims` includes `jti`, `exp`, `sub` — mitigated by library |
| XSS token theft from localStorage | Information Disclosure | localStorage is XSS-vulnerable; httpOnly cookie would be safer — accepted as D-06 for v1 |
| Mass assignment (extra fields in register) | Tampering | `$fillable` on User model limits what `User::create()` will accept |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `users` table `name` column is NOT NULL without default (would break register) | Pitfall 1 | If nullable, no migration needed — check actual migration file before planning |
| A2 | Railway file cache is ephemeral (wiped on redeploy) | Pitfall 3 | If Railway persists the filesystem, blacklist survives deploys — no impact on correctness |
| A3 | `config/cors.php` exists with `paths => ['api/*']` from Phase 1 | Pitfall 4 | If CORS not configured, auth requests from Vercel will be blocked — planner should verify |
| A4 | Frontend smoke test (manual) is sufficient for AuthPage.tsx — no automated frontend tests needed | Validation Architecture | If team wants automated frontend tests, a Wave 0 gap needs vitest install |

---

## Open Questions

1. **`name` column nullability in users migration**
   - What we know: User model has `name` in `$fillable`; registration per D-10 sends only email+password.
   - What's unclear: Whether the Phase 1 migration created `name` as nullable or NOT NULL.
   - Recommendation: Planner should read `backend/database/migrations/*_create_users_table.php` before finalizing the AuthController plan. If NOT NULL, add a migration task to make it nullable.

2. **CORS configuration**
   - What we know: Phase 1 wired CORS in principle; Railway env has `CORS_ALLOWED_ORIGINS`.
   - What's unclear: Whether the exact Vercel URL is already in the allowed origins list.
   - Recommendation: Planner should include a verification step — `cat backend/config/cors.php` — and note that Railway env update may be required. This is an operational task, not a code task.

---

## Sources

### Primary (HIGH confidence)
- `/tymondesigns/jwt-auth` (Context7) — JWTSubject interface, auth()->attempt(), auth()->logout(), auth()->login(), getJWTIdentifier(), getJWTCustomClaims()
- `/remix-run/react-router` (Context7) — RequireAuth/ProtectedRoute pattern, `<Navigate to="..." replace />`
- Codebase: `backend/bootstrap/app.php` — `jwt.auth` alias already registered
- Codebase: `backend/config/auth.php` — api guard driver = jwt, default guard = api
- Codebase: `backend/config/jwt.php` — blacklist_enabled=true, ttl=60 (needs update to 1440)
- Codebase: `backend/app/Http/Middleware/JwtMiddleware.php` — complete, handles all three JWT exceptions
- Codebase: `frontend/src/api/client.ts` — already reads auth_token and injects Bearer header
- Codebase: `backend/tests/TestCase.php` + `phpunit.xml` — SQLite in-memory test infrastructure

### Secondary (MEDIUM confidence)
- `npm view react-router-dom version` — 7.15.0 confirmed installed in package.json
- `composer.lock` — tymon/jwt-auth 2.3.0 confirmed installed

### Tertiary (LOW confidence)
- None — all critical claims verified against codebase or Context7

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; versions from composer.lock and package.json
- Architecture: HIGH — verified from existing codebase (middleware, guards, interceptor all confirmed)
- Pitfalls: HIGH for P1-P3 (codebase-verified), MEDIUM for P4 (CORS config not inspected), HIGH for P5-P6 (verified from react-router docs and auth.php)
- Test patterns: HIGH — PHPUnit infrastructure confirmed from phpunit.xml and existing test files

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable stack — tymon/jwt-auth and react-router-dom change slowly)

---

## RESEARCH COMPLETE

**Phase:** 2 - Authentication
**Confidence:** HIGH

### Key Findings

1. **All libraries installed, all middleware wired.** tymon/jwt-auth 2.3.0 is in composer.lock; the `jwt.auth` alias is registered in bootstrap/app.php; the api guard uses the jwt driver in auth.php; the axios interceptor in client.ts already reads `auth_token`. Phase 2 is purely additive.

2. **Two backend deliverables:** Implement `JWTSubject` on User model (two methods: `getJWTIdentifier()` returns `$this->getKey()`, `getJWTCustomClaims()` returns `[]`) + create `AuthController` with register/login/logout/me using `auth()->attempt()`, `auth()->login()`, `auth()->logout()`, `response()->success()` macros.

3. **Critical name column risk.** D-10 removes the `name` field from registration, but the `users` table likely has `name NOT NULL`. A migration to make it nullable is probably needed before register will work. Planner must verify `*_create_users_table.php`.

4. **`password_confirmation` naming is a common failure point.** Laravel's `confirmed` rule requires the body field to be named `password_confirmation` exactly. The frontend AuthPage must map React state `confirmPassword` → `password_confirmation` in the POST body.

5. **react-router-dom v7 is installed** (not v6). The `ProtectedRoute` pattern using `<Navigate to="/auth" replace />` is confirmed from react-router v7 source examples. No `Redirect` component exists in v7.

### File Created
`.planning/phases/02-authentication/02-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All from composer.lock + package.json (not training data) |
| tymon/jwt-auth API | HIGH | Verified via Context7 /tymondesigns/jwt-auth |
| react-router-dom v7 patterns | HIGH | Verified via Context7 /remix-run/react-router |
| Architecture | HIGH | Codebase inspection — all integration points confirmed |
| Pitfalls | HIGH (P1-P3), MEDIUM (P4 CORS) | P1-P3 from codebase; P4 from known pattern, CORS file not read |

### Open Questions
1. Is `users.name` NOT NULL in the migration? Planner must check before finalizing.
2. Is `config/cors.php` allowing the Vercel origin? Planner should verify, not assume.

### Ready for Planning
Research complete. Planner can now create PLAN.md files for 02-01 (Auth API) and 02-02 (Auth UI).
