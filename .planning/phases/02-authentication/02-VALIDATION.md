---
phase: 2
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | PHPUnit 12.5.12 (backend) — no frontend test framework installed |
| **Config file** | `backend/phpunit.xml` |
| **Quick run command** | `cd backend && php artisan test --filter Auth` |
| **Full suite command** | `cd backend && php artisan test` |
| **Estimated runtime** | ~10 seconds |

**Note:** Frontend validation is manual (browser smoke test). No vitest/jest installed. Acceptable for v1 school project scope.

---

## Sampling Rate

- **After every task commit:** Run `cd backend && php artisan test --filter Auth`
- **After every plan wave:** Run `cd backend && php artisan test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | T-2-01 | Registration rejects email < unique, password < 8 chars | Feature | `php artisan test --filter AuthTest::test_user_can_register` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | T-2-01 | Duplicate email returns 422 | Feature | `php artisan test --filter AuthTest::test_register_rejects_duplicate_email` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-01 | T-2-01 | Password < 8 chars returns 422 | Feature | `php artisan test --filter AuthTest::test_register_rejects_short_password` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | AUTH-02 | T-2-02 | Valid credentials return 200 + JWT token | Feature | `php artisan test --filter AuthTest::test_user_can_login` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | AUTH-02 | T-2-02 | Wrong password returns 401 | Feature | `php artisan test --filter AuthTest::test_login_rejects_wrong_password` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | AUTH-03 | T-2-03 | Logout invalidates token — subsequent request returns 401 | Feature | `php artisan test --filter AuthTest::test_logout_invalidates_token` | ❌ W0 | ⬜ pending |
| 02-01-07 | 01 | 1 | AUTH-04 | T-2-04 | No token on protected route returns 401 | Feature | `php artisan test --filter AuthTest::test_protected_route_rejects_unauthenticated` | ❌ W0 | ⬜ pending |
| 02-01-08 | 01 | 1 | AUTH-04 | T-2-04 | Valid token on protected route accepted | Feature | `php artisan test --filter AuthTest::test_protected_route_accepts_valid_token` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-01 | — | Auth page renders Login tab by default | Manual | Browser: navigate to /auth, verify Login tab shown first | N/A | ⬜ pending |
| 02-02-02 | 02 | 1 | AUTH-02 | — | Login form submits and stores auth_token in localStorage | Manual | Browser: login with valid creds, check localStorage.getItem('auth_token') | N/A | ⬜ pending |
| 02-02-03 | 02 | 1 | AUTH-04 | — | ProtectedRoute redirects unauthenticated user to /auth | Manual | Browser: clear localStorage, visit /expenses, verify redirect to /auth | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/Feature/AuthTest.php` — 8 test methods covering AUTH-01, AUTH-02, AUTH-03, AUTH-04

*All other test infrastructure is in place: `backend/tests/TestCase.php`, `backend/phpunit.xml`, SQLite in-memory wired via `phpunit.xml` (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login tab shown by default | AUTH-01/02 | No frontend test framework | Navigate to /auth, verify Login tab is bold/active by default |
| Error message shows below button | AUTH-01/02 | UI state validation | Submit with bad credentials, verify red error text appears below submit button |
| Loading state during submit | D-09 | Async UI state | Submit form, verify button shows "Loading..." and is disabled during request |
| Register tab switch works | AUTH-01 | Tab interaction | Click Register tab, verify Confirm Password field appears |
| ProtectedRoute redirect | AUTH-04 | SPA routing | Clear localStorage, navigate to /expenses directly, verify redirect to /auth |
| Post-login redirect to / | D-03 | Navigation | Login successfully, verify redirect to / (home) |
| Token persists across browser session | AUTH-01/02 | localStorage persistence | Login, close/reopen tab, verify still authenticated (no redirect to /auth) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
