# Expense Tracker (group5_fivestar)

## What This Is

A web app for individual users to log expenses, categorize spending, visualize monthly financial status, and manage budgets. Built as a group project with a full REST API backend (Laravel) and React TypeScript frontend, deployed on Vercel. **v1.0 shipped 2026-05-11. v2.0 in progress.**

## Core Value

Users can accurately log and view their monthly expenses by category — everything else is enhancement.

## Current State (v1.0)

- **Backend:** Laravel 10, PHP 8.3, MySQL, tymon/jwt-auth, custom response envelope macro
- **Frontend:** React 18, TypeScript, Vite, React Router, Recharts
- **Auth:** JWT (register/login/logout), token in localStorage, ProtectedRoute guard
- **LOC:** ~5,532 (PHP + TS/TSX)
- **Deploy:** Vercel

## Requirements

### Validated (v1.0)

- ✓ User can register, log in, log out — v1.0
- ✓ All endpoints require valid JWT — v1.0
- ✓ User can add an expense (amount, currency, category, description, date) — v1.0
- ✓ User can view all expenses with pagination — v1.0
- ✓ User can filter expenses by date range, category, and amount range — v1.0
- ✓ User can view, edit, and delete expenses — v1.0
- ✓ System provides predefined default categories — v1.0
- ✓ User can create, edit, and delete custom categories (with referential guard) — v1.0
- ✓ User can view monthly total expense summary with category breakdown — v1.0
- ✓ User can view pie chart of expenses by category — v1.0
- ✓ User can filter by date range for trend view — v1.0
- ✓ User can see daily and monthly average expense calculations — v1.0

### Validated (v2.0)

- ✓ REQ-20: User can set a monthly budget limit per category — Phase 6
- ✓ REQ-21: User can view current spend vs budget limit per category — Phase 6
- ✓ REQ-22: System displays over-budget warnings when spend exceeds limit — Phase 6
- ✓ REQ-23: User can download expense data as CSV — Phase 7

### Active (v2.0)

- [ ] REQ-24: User can create recurring expense entries

### Out of Scope

- Multi-currency support — deferred beyond v2
- AI receipt scanning (OCR) — explicit Won't Have
- Cross-bank sync — explicit Won't Have

## Constraints

- **Tech Stack**: React (TypeScript) frontend + Laravel (PHP) backend — locked by team decision
- **Database**: MySQL only — no SQLite
- **Auth**: JWT (tymon/jwt-auth) — team decision
- **Deploy**: Vercel
- **API envelope**: `{success, data, message}` on success — enforced via response()->success() macro
- **Dates**: ISO format (YYYY-MM-DD) throughout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MySQL not SQLite | Team tech stack | ✓ Good — no issues |
| JWT auth (tymon/jwt-auth) | Team decision | ✓ Good |
| Response envelope macro | Consistent API contract | ✓ Good |
| Server-side % pre-computation | No client rounding errors | ✓ Good |
| Recharts for pie chart | Native React, built-in Tooltip | ✓ Good |
| Single analytics endpoint | Trend = filtered snapshot | ✓ Good |
| Budget/CSV/Recurring → v2 | MoSCoW scope control | ✓ Good |

## Context

- Group project (group5_fivestar), built for a course/assignment
- All v1 work done on `main` branch directly
- PR #3 merged 2026-05-11T12:39:50Z
- Tagged: v1.0

## v2.0 Milestone

**Goal:** Add budget management, CSV export, and recurring expenses
**Status:** Phase 7 complete — Phase 8 (Recurring Expenses) is final remaining phase
**Phases:** 6+ (continues from v1.0)
- ✅ Phase 6: Budget Management — complete 2026-05-13
- ✅ Phase 7: CSV Export — complete 2026-05-13
- 🔄 Phase 8: Recurring Expenses — next

---
*Last updated: 2026-05-13 — Phase 7 CSV Export approved; Phase 8 next*
