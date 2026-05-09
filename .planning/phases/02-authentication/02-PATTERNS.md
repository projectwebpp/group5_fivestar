# Phase 2: Authentication - Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 7 (2 new, 5 modified)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/app/Http/Controllers/Api/AuthController.php` | controller | request-response | `backend/app/Http/Controllers/Api/HealthController.php` | role-match |
| `backend/app/Models/User.php` | model | — | `backend/app/Models/User.php` (self) | exact (modify) |
| `backend/config/jwt.php` | config | — | `backend/config/jwt.php` (self) | exact (modify line 104) |
| `backend/routes/api.php` | route | request-response | `backend/routes/api.php` (self) | exact (extend) |
| `frontend/src/components/ProtectedRoute.tsx` | component | request-response | `frontend/src/App.tsx` (routing context) | partial |
| `frontend/src/pages/AuthPage.tsx` | component | request-response | `frontend/src/pages/HomePage.tsx` | role-match |
| `frontend/src/App.tsx` | config/router | — | `frontend/src/App.tsx` (self) | exact (modify) |

---

## Pattern Assignments

### `backend/app/Http/Controllers/Api/AuthController.php` (controller, request-response)

**Analog:** `backend/app/Http/Controllers/Api/HealthController.php`

**Imports pattern** (lines 1–7 of HealthController):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
```
AuthController adds these on top:
```php
use App\Models\User;
use Illuminate\Http\Request;
```

**Core response pattern** (HealthController line 12):
```php
return response()->success(['status' => 'ok'], 'API is healthy');
```
The `response()->success()` macro signature (from `AppServiceProvider.php` lines 14–19):
```php
Response::macro('success', function (mixed $data = null, string $message = 'Success', int $status = 200) {
    return Response::json([
        'success' => true,
        'data'    => $data,
        'message' => $message,
    ], $status);
});
```
The `response()->error()` macro signature (AppServiceProvider lines 22–28):
```php
Response::macro('error', function (string $message = 'Error', array $errors = [], int $status = 400) {
    return Response::json([
        'success' => false,
        'message' => $message,
        'errors'  => $errors,
    ], $status);
});
```

**Auth/validation pattern** — use `$request->validate()` inline (no FormRequest class needed at this scale):
```php
$data = $request->validate([
    'email'    => 'required|email|unique:users,email',
    'password' => 'required|min:8|confirmed',   // D-11: confirmed rule needs password_confirmation in body
]);
```

**Error handling pattern** — `auth()->attempt()` returns false on bad credentials; respond immediately:
```php
if (! $token = auth()->attempt($credentials)) {
    return response()->error('Invalid credentials', [], 401);
}
```
Laravel's `$request->validate()` throws `ValidationException` automatically (caught by the framework, returns 422) — no try/catch needed for validation.

**Logout pattern** — `auth()->logout()` blacklists the JTI in Laravel cache (uses the api/jwt guard because `auth.defaults.guard = api` in auth.php):
```php
auth()->logout();   // D-05: adds JTI to blacklist in Laravel file cache
return response()->success(null, 'Logged out successfully');
```

**Register-then-login pattern** — issue token immediately after user creation:
```php
$user  = User::create($data);
$token = auth()->login($user);
return response()->success(['token' => $token], 'Registration successful', 201);
```

---

### `backend/app/Models/User.php` (model — modify)

**Analog:** `backend/app/Models/User.php` (self — add interface and two methods)

**Current state** (full file, lines 1–47):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',        // <-- REMOVE: D-10 prohibits name in registration; also NOT NULL in default migration (Pitfall 1)
        'email',
        'password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',   // bcrypt applied automatically — do not hand-roll
        ];
    }
}
```

**Required additions** — JWTSubject interface (two methods, tymon/jwt-auth contract):
```php
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    // ... existing body unchanged except $fillable ...

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();   // returns primary key (users.id)
    }

    public function getJWTCustomClaims(): array
    {
        return [];   // no extra claims needed for v1
    }
}
```

**`$fillable` change** — remove `'name'`, keep `'email'` and `'password'`. Also requires a migration to make `users.name` nullable (default Laravel migration creates it NOT NULL — Pitfall 1):
```php
protected $fillable = ['email', 'password'];
```

---

### `backend/config/jwt.php` (config — modify one line)

**Analog:** `backend/config/jwt.php` (self — single value change)

**Current line 104:**
```php
'ttl' => (int) env('JWT_TTL', 60),
```

**Target state** — do not hardcode; set env var instead:
```php
'ttl' => (int) env('JWT_TTL', 60),   // unchanged in file — set JWT_TTL=1440 in Railway env (D-07)
```
No file edit required if Railway env is set. If a fallback default is desired, change `60` to `1440`. Either approach is valid; prefer env var so the file stays environment-agnostic.

---

### `backend/routes/api.php` (route — extend)

**Analog:** `backend/routes/api.php` (self — extend the existing pattern)

**Current state** (lines 1–7):
```php
<?php

use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'index']);
```

**Extension pattern** — add import, public group, protected groups:
```php
use App\Http\Controllers\Api\AuthController;   // add alongside HealthController import

// Existing health check — keep unchanged
Route::get('/health', [HealthController::class, 'index']);

// Public auth endpoints — no middleware
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Protected auth endpoints — require valid JWT
Route::middleware('jwt.auth')->prefix('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me',      [AuthController::class, 'me']);
});

// Protected API endpoint group — empty now, populated in Phases 3-5 (AUTH-04)
Route::middleware('jwt.auth')->group(function () {
    // Phase 3: category routes added here
    // Phase 4: expense routes added here
    // Phase 5: analytics routes added here
});
```

**`jwt.auth` alias source** — registered in `backend/bootstrap/app.php` (do not modify that file):
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['jwt.auth' => \App\Http\Middleware\JwtMiddleware::class]);
})
```

---

### `frontend/src/components/ProtectedRoute.tsx` (component, request-response)

**Analog:** `frontend/src/App.tsx` (routing context — uses same react-router-dom imports)

**Routing imports pattern** (App.tsx line 1):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```
ProtectedRoute uses `Navigate` from the same package:
```tsx
import { Navigate } from 'react-router-dom';
```

**Core guard pattern** — localStorage check, no API call (per CONTEXT.md specifics):
```tsx
interface ProtectedRouteProps {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('auth_token');   // D-06: key is 'auth_token'
  if (!token) {
    return <Navigate to="/auth" replace />;   // `replace` required — prevents back-button loop (Pitfall 5)
  }
  return children;
}
```

**No async state needed** — the check is synchronous. Do not add `useEffect` or `useState` here.

---

### `frontend/src/pages/AuthPage.tsx` (component, request-response — full replacement)

**Analog:** `frontend/src/pages/HomePage.tsx`

**Inline style pattern** (HomePage lines 31–32, 39):
```tsx
<div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
...
{error && <p style={{ color: 'red' }}>{error}</p>}
```
AuthPage follows the same `fontFamily: 'sans-serif', padding: '2rem'` root div. Error display at `{ color: 'red' }` matches exactly.

**API call pattern** (HomePage lines 19–27 — adapted from GET to POST):
```tsx
apiClient
  .get<HealthResponse>('/health')
  .then(...)
  .catch(() => { setError('...'); });
```
AuthPage uses async/await form with `try/catch/finally` instead (suitable for form submit handler):
```tsx
import apiClient from '../api/client';   // same import as HomePage

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);   // D-09: disable button during call
  try {
    const res = await apiClient.post<ApiResponse>(endpoint, body);
    localStorage.setItem('auth_token', res.data.data!.token);   // D-06: write token
    navigate('/');   // D-03: redirect to home after auth
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? 'Something went wrong';
    setError(msg);   // D-08: inline error below submit button
  } finally {
    setLoading(false);
  }
};
```

**Response envelope interface** — mirrors the envelope from AppServiceProvider:
```tsx
interface ApiResponse {
  success: boolean;
  data: { token: string } | null;
  message: string;
}
```

**State pattern** — useState for all form fields (Claude's Discretion: useState fine for 2–3 fields):
```tsx
const [tab, setTab]           = useState<Tab>('login');   // D-02: login default
const [email, setEmail]       = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');   // D-11: register only
const [loading, setLoading]   = useState(false);   // D-09
const [error, setError]       = useState<string | null>(null);   // D-08
const navigate = useNavigate();
```

**`password_confirmation` mapping** — React state key differs from Laravel's expected field name (Pitfall 2):
```tsx
const body = tab === 'login'
  ? { email, password }
  : { email, password, password_confirmation: confirmPassword };   // NOT confirmPassword as key
```

**Tab switcher pattern** — inline bold weight for active tab (matches minimal style convention):
```tsx
<button onClick={() => setTab('login')}
        style={{ fontWeight: tab === 'login' ? 'bold' : 'normal' }}>
  Login
</button>
<button onClick={() => setTab('register')}
        style={{ fontWeight: tab === 'register' ? 'bold' : 'normal' }}>
  Register
</button>
```

**Submit button loading/disabled pattern** (D-09):
```tsx
<button type="submit" disabled={loading}>
  {loading ? 'Loading...' : tab === 'login' ? 'Log In' : 'Register'}
</button>
{error && <p style={{ color: 'red' }}>{error}</p>}
```

---

### `frontend/src/App.tsx` (config/router — modify)

**Analog:** `frontend/src/App.tsx` (self — add import + wrap three routes)

**Current state** (full file, lines 1–20):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        <Route path="/expenses"   element={<ExpensesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/analytics"  element={<AnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Required change** — add one import, wrap three routes:
```tsx
import ProtectedRoute from './components/ProtectedRoute';   // add after existing imports

// / and /auth remain public — unchanged
// Wrap the three protected routes:
<Route path="/expenses"   element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
<Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
<Route path="/analytics"  element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
```

---

## Shared Patterns

### Response Envelope (ALL backend controllers)
**Source:** `backend/app/Providers/AppServiceProvider.php` lines 14–28
**Apply to:** `AuthController.php` — every method must return via these macros, never `response()->json()` directly.
```php
// Success (data, message, optional HTTP status):
return response()->success($data, 'Message here');          // 200
return response()->success($data, 'Created', 201);          // 201

// Error (message, errors array, HTTP status):
return response()->error('Invalid credentials', [], 401);
return response()->error('Validation failed', $errors, 422);
```
Note: `$request->validate()` throws automatically on validation failure — the framework returns 422 using the envelope via the exception handler. No manual call to `response()->error()` needed for validation.

### JWT Middleware Error Pattern
**Source:** `backend/app/Http/Middleware/JwtMiddleware.php` lines 16–24
**Apply to:** Protected routes via `jwt.auth` alias — the middleware already handles all three JWT exception types.
```php
// Already handled — do NOT replicate in controllers:
} catch (TokenExpiredException $e) {
    return response()->error('Token expired', [], 401);
} catch (TokenInvalidException $e) {
    return response()->error('Token invalid', [], 401);
} catch (JWTException $e) {
    return response()->error('Token absent', [], 401);
}
```

### localStorage Token Key
**Source:** `frontend/src/api/client.ts` line 14
**Apply to:** `AuthPage.tsx` (write), `ProtectedRoute.tsx` (read)
```ts
// Read (client.ts interceptor — already wired):
const token = localStorage.getItem('auth_token');

// Write (AuthPage.tsx after login/register):
localStorage.setItem('auth_token', res.data.data!.token);

// Remove (AuthPage.tsx logout, if logout UI is added):
localStorage.removeItem('auth_token');
```
Key is `'auth_token'` — must match exactly in all three locations.

### Inline Style Convention
**Source:** `frontend/src/pages/HomePage.tsx` lines 31, 39 and `frontend/src/pages/AuthPage.tsx` line 3 (current placeholder)
**Apply to:** `AuthPage.tsx` replacement
```tsx
// Root container:
<div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>

// Error display:
{error && <p style={{ color: 'red' }}>{error}</p>}
```
Do not introduce a CSS framework or CSS modules.

---

## No Analog Found

All 7 files have analogs or are self-modifications. No files require falling back to RESEARCH.md patterns exclusively.

| File | Notes |
|------|-------|
| `frontend/src/components/ProtectedRoute.tsx` | New file with no prior component analog, but App.tsx provides the routing import context and react-router-dom v7 Navigate pattern is verified in RESEARCH.md Pattern 4 |

---

## Critical Notes for Planner

1. **Migration wave required before AuthController wave.** The default Laravel `users` migration creates `name NOT NULL` with no default. `User::create(['email'=>..., 'password'=>...])` will throw an integrity constraint violation (Pitfall 1). Add a migration task: `$table->string('name')->nullable()->change()` using `doctrine/dbal` or a raw `ALTER TABLE`. This must run before any register endpoint test.

2. **`password_confirmation` is the exact field name.** React state variable is `confirmPassword`; the POST body key must be `password_confirmation`. This mapping must be explicit in `handleSubmit` (Pitfall 2).

3. **`jwt.php` line 104 — set env var, not hardcode.** Change `JWT_TTL=1440` in Railway environment variables. The file line `'ttl' => (int) env('JWT_TTL', 60)` can remain as-is if Railway env is set; or change default from `60` to `1440` as a fallback. Either is valid.

4. **Do not modify** `JwtMiddleware.php`, `bootstrap/app.php`, `config/auth.php`, or `frontend/src/api/client.ts`. These are complete and correct.

5. **Test file gap.** `backend/tests/Feature/AuthTest.php` does not exist — it is a Wave 0 gap. The planner must include creating this file as the first wave task.

---

## Metadata

**Analog search scope:** `backend/app/Http/Controllers/Api/`, `backend/app/Models/`, `backend/app/Http/Middleware/`, `backend/app/Providers/`, `backend/config/`, `backend/routes/`, `frontend/src/pages/`, `frontend/src/api/`, `frontend/src/`
**Files scanned:** 12
**Pattern extraction date:** 2026-05-09
