---
phase: 02-authentication
plan: "02"
subsystem: frontend-auth-ui
tags: [auth, react, frontend, routing, ui, protected-route]
dependency_graph:
  requires: [02-01]
  provides: [frontend-auth-ui, protected-routes, login-register-form]
  affects: [frontend/src/App.tsx, frontend/src/pages/AuthPage.tsx, frontend/src/components/ProtectedRoute.tsx]
tech_stack:
  added: []
  patterns: [localStorage-jwt, react-router-navigate, tabbed-form, inline-error-state]
key_files:
  created:
    - frontend/src/components/ProtectedRoute.tsx
  modified:
    - frontend/src/pages/AuthPage.tsx
    - frontend/src/App.tsx
decisions:
  - "D-06: Token stored in localStorage under 'auth_token' — matches axios interceptor in client.ts"
  - "D-04: ProtectedRoute wraps /expenses, /categories, /analytics; /auth and / remain public"
  - "D-02: Login tab default state; Register tab adds Confirm Password field"
  - "D-08: Inline red error message below submit button (no toast library)"
  - "D-09: Submit button disabled + 'Loading...' label during API call"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-05-09"
  tasks_completed: 3
  tasks_total: 4
  files_created: 1
  files_modified: 2
---

# Phase 2 Plan 02: Frontend Auth UI Summary

**One-liner:** Tabbed Login/Register form at /auth with JWT localStorage storage and ProtectedRoute guards on /expenses, /categories, /analytics.

## What Was Built

Three files deliver the complete frontend authentication slice:

1. **`frontend/src/components/ProtectedRoute.tsx`** (new) — Synchronous localStorage guard. If `auth_token` is absent, renders `<Navigate to="/auth" replace />`. No async logic, no API call, no useState/useEffect — pure localStorage check per CONTEXT.md specifics (T-2-10: client-side UX only; backend jwt.auth middleware is the authoritative gate).

2. **`frontend/src/pages/AuthPage.tsx`** (replaced) — Full tabbed Login/Register implementation. Login tab shown by default (D-02). Register tab conditionally renders Confirm Password field (D-11). On submit: calls `/auth/login` or `/auth/register` via `apiClient.post`, extracts `res.data.data.token` from the `{success, data, message}` envelope, writes it to `localStorage.setItem('auth_token', token)` (D-06), then navigates to `/` (D-03). On error: extracts `response.data.message` from axios error shape and renders it as a red `<p role="alert">` below the submit button (D-08). Submit button is `disabled` and shows "Loading..." during in-flight request (D-09). POST body uses `password_confirmation` key (not `confirmPassword`) for Laravel's `|confirmed` validation (Pitfall 2 from 02-PATTERNS.md).

3. **`frontend/src/App.tsx`** (modified) — Imports `ProtectedRoute` from `./components/ProtectedRoute`. Wraps `/expenses`, `/categories`, `/analytics` routes. Leaves `/` and `/auth` public.

## TypeScript and Build Outcomes

- `./node_modules/.bin/tsc --noEmit`: exit 0 (all three tasks verified)
- `./node_modules/.bin/vite build`: exit 0, built in 1.47s, 277.73 kB bundle (90.94 kB gzip)

Note: `node_modules` were not present in the worktree; `npm install` was run as part of the TypeScript verification step (Rule 3 auto-fix for blocking issue).

## Token Storage Confirmation

- Key: `localStorage` key `auth_token` (exact key used by `frontend/src/api/client.ts` interceptor)
- Written: after successful login or register response
- Read: by `ProtectedRoute` (synchronous check) and by axios interceptor (injects `Authorization: Bearer` header)

## Public vs Protected Routes

| Route | Access |
|-------|--------|
| `/` | Public (no ProtectedRoute) |
| `/auth` | Public (no ProtectedRoute — wrapping would cause infinite redirect loop) |
| `/expenses` | Protected (ProtectedRoute) |
| `/categories` | Protected (ProtectedRoute) |
| `/analytics` | Protected (ProtectedRoute) |

## Task 4 Status: Pending Human Verification

Task 4 (`checkpoint:human-verify`) requires running backend + frontend dev servers and a 11-step browser smoke test. This cannot be performed in the worktree executor context. The checkpoint is pending and will be presented to the user by the orchestrator.

**Verification steps (for human reviewer):**
1. Start backend: `cd backend && php artisan migrate && php artisan serve`
2. Start frontend: `cd frontend && npm run dev` → open http://localhost:5173
3. Verify unauthenticated /expenses redirects to /auth (D-04)
4. Verify Login tab is active by default on /auth (D-02)
5. Register with email/password/confirm-password → check localStorage auth_token + redirect to / (AUTH-01, D-06, D-03)
6. Close and reopen /expenses — no redirect (cross-session persistence, Phase 2 criterion #5)
7. DevTools: remove auth_token → navigate /expenses → redirect to /auth
8. Login with existing credentials → redirect to /, token in localStorage (AUTH-02)
9. Wrong password → red error message below button (D-08)
10. Duplicate email register → server 422 error displayed inline (Pitfall 2 confirmed)
11. Short password register → browser minLength or server 422 (D-11)

## Requirements Satisfied

| Requirement | Status | Evidence |
|-------------|--------|---------|
| AUTH-01 (Register) | Satisfied | AuthPage Register tab calls /auth/register with email+password+password_confirmation |
| AUTH-02 (Login) | Satisfied | AuthPage Login tab calls /auth/login with email+password |
| AUTH-04 (Client-side protection) | Satisfied | ProtectedRoute redirects unauthenticated users from /expenses, /categories, /analytics |

AUTH-03 (Logout) UI is not in scope for this plan — no logout button added (deferred per plan objective). The contract is in place at the backend (Plan 02-01).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 755dc1f | feat(02-02): create ProtectedRoute component |
| Task 2 | 0c239bd | feat(02-02): replace AuthPage with tabbed Login/Register form |
| Task 3 | 4111351 | feat(02-02): wrap protected routes in App.tsx with ProtectedRoute |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed npm dependencies in worktree**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `node_modules/` directory was absent in the worktree; `npx tsc` invoked the wrong binary (not the project's TypeScript)
- **Fix:** Ran `npm install` in `frontend/` to install the 180 packages including typescript and vite
- **Files modified:** `frontend/node_modules/` (runtime, not committed — .gitignore excluded)
- **Commit:** Not separately committed (infrastructure fix, not code change)

## Known Stubs

None — all data flows are wired. AuthPage uses real `apiClient.post` calls; ProtectedRoute uses real `localStorage.getItem`. No placeholder text or hardcoded empty values in any of the three files.

## Threat Surface Scan

No new security-relevant surface introduced beyond the threat model documented in the plan. The threat register (T-2-09 through T-2-14) covers all introduced surface:
- localStorage XSS risk: accepted (D-06 lock, React escaping, no dangerouslySetInnerHTML)
- ProtectedRoute bypass: mitigated by backend jwt.auth middleware (Plan 02-01)
- Token in URL: N/A (token in JSON body + Authorization header only)

## Self-Check: PASSED

- FOUND: frontend/src/components/ProtectedRoute.tsx
- FOUND: frontend/src/pages/AuthPage.tsx
- FOUND: frontend/src/App.tsx
- FOUND commit 755dc1f (Task 1)
- FOUND commit 0c239bd (Task 2)
- FOUND commit 4111351 (Task 3)
- TypeScript: exit 0
- Vite build: exit 0
