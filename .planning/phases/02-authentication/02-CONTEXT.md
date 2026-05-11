# Phase 2: Authentication - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can register with email/password, log in to receive a JWT, and log out with server-side token invalidation. All expense, category, and report API endpoints require a valid JWT (401 otherwise). The React frontend has a login/register UI at /auth, with ProtectedRoute guards redirecting unauthenticated users away from /expenses, /categories, and /analytics.

</domain>

<decisions>
## Implementation Decisions

### Auth Page Structure (Frontend)
- **D-01:** Single `/auth` route with Login/Register tabs — not separate /auth/login and /auth/register routes. Replaces the existing `AuthPage.tsx` placeholder.
- **D-02:** Login tab shown first by default (returning users are the majority).
- **D-03:** After successful login or register, redirect to `/` (home page).
- **D-04:** Unauthenticated access to `/expenses`, `/categories`, `/analytics` redirects to `/auth` — implemented via a `ProtectedRoute` wrapper component in App.tsx.

### Logout & Token Storage
- **D-05:** Server-side token blacklist on logout — `JWTAuth::invalidate()` adds token to Laravel cache blacklist. Meets ROADMAP criterion "subsequent requests with that token are rejected". File cache used on Railway (resets on redeploy — acceptable for v1).
- **D-06:** JWT stored in `localStorage` under key `auth_token` — already wired in Phase 1 `frontend/src/api/client.ts` interceptor. Persists across browser sessions (meets ROADMAP "stays logged in across browser sessions").
- **D-07:** JWT TTL set to **24 hours** (1440 minutes). Update `JWT_TTL=1440` in `backend/config/jwt.php` and Railway env vars.

### Auth Error UX
- **D-08:** Errors shown **inline below the form submit button** as a red message string. No toast library. No field-level errors. One error message per form submission.
- **D-09:** Submit button is **disabled and shows "Loading..."** during API call to prevent double-submit.

### Registration Fields & Validation
- **D-10:** Registration form collects **email + password only** — no name field. Matches AUTH-01 exactly.
- **D-11:** Password validation: **min 8 characters** with a `Confirm Password` field. Laravel rule: `'password' => 'required|min:8|confirmed'`. Backend rejects passwords shorter than 8 characters with a 422 response.

### Claude's Discretion
- Laravel controller structure (single AuthController vs separate RegisterController/LoginController) — planner decides. Single AuthController is idiomatic for small APIs.
- React form state management (useState vs useReducer) — planner decides. useState is fine for 2–3 fields.
- Exact CSS/inline styles for the tab switcher — planner decides. Match the minimal inline style pattern from Phase 1 placeholder pages.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04 (the 4 requirements this phase must satisfy)
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 criteria, including token invalidation and cross-session persistence)
- `.planning/PROJECT.md` — locked decisions: JWT auth, MySQL, API envelope `{success, data, message}`, Railway/Vercel deploy

### Existing Backend (Phase 1 scaffold — read before planning API)
- `backend/app/Http/Middleware/JwtMiddleware.php` — JWT middleware already registered as `jwt.auth` alias; Phase 2 applies it to protected route groups
- `backend/config/jwt.php` — JWT config; TTL must be updated to 1440 (24 hours)
- `backend/config/auth.php` — api guard driver = jwt; do not change
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros; ALL auth controllers must use these
- `backend/routes/api.php` — current routes file (only GET /health exists); auth routes added here
- `backend/app/Models/User.php` — User model; must implement JWTSubject interface for tymon/jwt-auth

### Existing Frontend (Phase 1 scaffold — read before planning UI)
- `frontend/src/api/client.ts` — axios client; reads `localStorage.getItem('auth_token')` and injects Bearer header; Phase 2 writes auth_token here after login
- `frontend/src/App.tsx` — current routes; Phase 2 adds ProtectedRoute wrapper and updates /auth with tab UI
- `frontend/src/pages/AuthPage.tsx` — placeholder to replace entirely with Login/Register tab component

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/Http/Middleware/JwtMiddleware.php` — complete, registered, tested. Phase 2 just applies `jwt.auth` middleware alias to protected route groups — do not rewrite the middleware.
- `frontend/src/api/client.ts` — axios interceptor already reads `auth_token` from localStorage and injects `Authorization: Bearer` header. Phase 2 just needs to write the token after login.
- `backend/app/Providers/AppServiceProvider.php` — `response()->success()` and `response()->error()` macros available in every controller.

### Established Patterns
- API response envelope: `{success, data, message}` on success; `{success: false, message, errors: [{field, message}]}` on failure — ALL auth endpoints must follow this.
- Frontend pages use minimal inline styles (`fontFamily: 'sans-serif', padding: '2rem'`) — auth UI can follow same pattern without introducing a CSS framework.

### Integration Points
- `backend/routes/api.php` — add POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout (protected), GET /api/auth/me (protected) here.
- `frontend/src/App.tsx` — wrap /expenses, /categories, /analytics in ProtectedRoute; keep /auth and / as public.
- `backend/app/Models/User.php` — implement `Tymon\JWTAuth\Contracts\JWTSubject` with `getJWTIdentifier()` and `getJWTCustomClaims()` methods.

</code_context>

<specifics>
## Specific Ideas

- tymon/jwt-auth blacklist feature uses the Laravel cache driver. On Railway, the file cache is the default and works correctly — no Redis needed for v1. The blacklist resets on redeploy, which means logged-out tokens become valid again after a Railway redeploy. This is acceptable for a school project.
- The `ProtectedRoute` component should check `localStorage.getItem('auth_token')` — if null/empty, redirect to `/auth`. No API call needed to validate the token on every page load (client-side check is sufficient for v1).
- The `GET /api/auth/me` endpoint (returns authenticated user) is useful for the frontend to verify the token is still valid after page refresh.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 2-Authentication*
*Context gathered: 2026-05-09*
