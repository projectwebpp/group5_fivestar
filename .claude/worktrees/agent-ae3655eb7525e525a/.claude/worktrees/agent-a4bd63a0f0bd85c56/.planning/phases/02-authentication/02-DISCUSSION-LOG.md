# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 02-authentication
**Areas discussed:** Auth page structure, Logout invalidation, Auth error UX, Registration fields

---

## Auth page structure

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs on single /auth route | One page with Login/Register tabs. AuthPage.tsx stays at /auth. | ✓ |
| Separate routes /auth/login and /auth/register | Two pages with nav links. Requires nested routes. | |

**Login tab first?**
| Option | Selected |
|--------|----------|
| Login tab first | ✓ |
| Register tab first | |

**Post-login redirect?**
| Option | Selected |
|--------|----------|
| / (Home page) | ✓ |
| /expenses | |

**Notes:** Single page keeps routing simpler — AuthPage.tsx placeholder at /auth just gets replaced.

---

## Logout invalidation

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side blacklist via tymon/jwt-auth | JWTAuth::invalidate() + Laravel cache. Meets ROADMAP criterion. | ✓ |
| Client-side only | Delete from localStorage. Token still valid until expiry. | |

**Token storage?**
| Option | Selected |
|--------|----------|
| localStorage (auth_token) | ✓ |
| sessionStorage | |

**JWT TTL?**
| Option | Selected |
|--------|----------|
| 60 minutes (default) | |
| 24 hours | ✓ |
| 7 days | |

**Notes:** File cache blacklist resets on Railway redeploy — acceptable for v1 school project.

---

## Auth error UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline below form | Red message below submit button. No extra library. | ✓ |
| Field-level errors | Per-field error messages. More state management. | |
| Toast notification | Floating notification. Requires toast library. | |

**Loading state on submit?**
| Option | Selected |
|--------|----------|
| Yes — disable + "Loading..." | ✓ |
| No | |

**Unauthenticated route access?**
| Option | Selected |
|--------|----------|
| Redirect to /auth via ProtectedRoute | ✓ |
| Show error on page | |

---

## Registration fields

| Option | Description | Selected |
|--------|-------------|----------|
| Email + password only | Matches AUTH-01 exactly. No name field. | ✓ |
| Name + email + password | Adds personalization. Laravel User model has name column. | |

**Password rules?**
| Option | Selected |
|--------|----------|
| Min 8 characters | ✓ |
| Min 8 + number/letter | |
| No minimum | |

**Confirm password field?**
| Option | Selected |
|--------|----------|
| Yes — require confirmation | ✓ |
| No — single field | |

---

## Claude's Discretion

- Laravel controller structure (single AuthController recommended)
- React form state management (useState recommended)
- Tab switcher CSS/inline styles (match Phase 1 minimal inline style pattern)

## Deferred Ideas

None — discussion stayed within Phase 2 scope.
