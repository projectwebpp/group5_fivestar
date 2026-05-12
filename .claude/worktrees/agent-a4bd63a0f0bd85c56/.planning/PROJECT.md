# Expense Tracker (group5_fivestar)

## What This Is

A web app for individual users to log expenses, categorize spending, and visualize monthly financial status. Built as a group project with a full REST API backend (Laravel) and React TypeScript frontend, deployed on Vercel. **v1.0 shipped 2026-05-11.**

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

### Active (v2.0 candidates)

- [ ] User can set a monthly budget limit per category
- [ ] User can view current spend vs budget limit
- [ ] User can download expense data as CSV
- [ ] User can create recurring expense entries

### Out of Scope

- Budget management with alerts — MoSCoW "Could Have", deferred to v2
- CSV export — MoSCoW "Could Have", deferred to v2
- Recurring expenses — MoSCoW "Could Have", deferred to v2
- Multi-currency support — not in MoSCoW Must/Should, deferred to v2
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

---
*Last updated: 2026-05-11 after v1.0 milestone*
