# 02-01 Backend Auth — Execution Summary

**Status:** COMPLETE — 8/8 tests passing
**Date:** 2026-05-10
**Approach:** TDD (RED → GREEN)

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/database/migrations/2026_05_09_000001_create_users_table.php` | Users table schema |
| `backend/database/factories/UserFactory.php` | Test factory for User model |
| `backend/tests/Feature/AuthTest.php` | 8-test TDD suite (register, login, logout, me) |
| `backend/app/Http/Controllers/Api/AuthController.php` | JWT auth endpoints |

## Files Modified

| File | Change |
|------|--------|
| `backend/app/Models/User.php` | Implements JWTSubject; `$fillable` reduced to `['email', 'password']` |
| `backend/routes/api.php` | Added public auth routes + `jwt.auth`-protected auth routes |
| `backend/config/jwt.php` | Default TTL changed from 60 → 1440 minutes |

---

## Test Results

```
Tests:    8 passed (8 assertions)
Duration: ~12s
```

All 8 AuthTest cases green:
- `test_user_can_register` — 201 + token in response
- `test_register_rejects_duplicate_email` — 422
- `test_register_rejects_short_password` — 422 (min:8)
- `test_user_can_login` — 200 + token
- `test_login_rejects_wrong_password` — 401 + `{success:false, message:"Invalid credentials"}`
- `test_logout_invalidates_token` — 200 then 401 on reuse
- `test_protected_route_rejects_unauthenticated` — 401
- `test_protected_route_accepts_valid_token` — 200 + user email

Pre-existing `ExampleTest::test_the_application_returns_a_successful_response` fails (500) due to
Blade view cache path invalid in WSL environment — unrelated to auth work; was failing before this phase.

---

## API Surface Delivered

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | public | Register + return JWT |
| POST | `/api/auth/login` | public | Login + return JWT |
| POST | `/api/auth/logout` | jwt.auth | Invalidate token |
| GET | `/api/auth/me` | jwt.auth | Return authenticated user |

All responses use `{success, data, message}` envelope via `response()->success()` / `response()->error()` macros.

---

## Operational Notes (Railway / Production)

- Set `JWT_TTL=1440` in Railway environment (default now 1440 but explicit is safer)
- Set `FRONTEND_URL` in Railway to allow CORS from Vercel frontend
- Run `php artisan jwt:secret` on first deploy if `JWT_SECRET` is not set
- `JWT_BLACKLIST_ENABLED=true` (default) — required for logout invalidation to work

---

## Key Decisions

- Password hashing: handled by `'password' => 'hashed'` cast — no manual `bcrypt()` calls
- `name` field: in migration (nullable) but NOT in `$fillable` — registration is email+password only
- UserFactory: `password` set as plain string `'password123'` — the `hashed` cast auto-bcrypts it
- JWT blacklist uses array cache driver in tests (`CACHE_STORE=array` in phpunit.xml) — no Redis needed for tests
