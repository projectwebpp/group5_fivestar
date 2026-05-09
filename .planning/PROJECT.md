# Expense Tracker (group5_fivestar)

## What This Is

A web app for individual users to log expenses, categorize spending, and visualize monthly financial status. Built as a group project with a full REST API backend (Laravel) and React frontend, deployed on Vercel. Designed to eliminate manual calculation errors and give users real-time monthly financial insight.

## Core Value

Users can accurately log and view their monthly expenses by category — everything else is enhancement.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Must Have — expense core:**
- [ ] User can add an expense (amount, description, category, date)
- [ ] User can view all expenses with pagination
- [ ] User can delete an expense
- [ ] User can assign an expense to a category
- [ ] User can view monthly total expenses

**Must Have — categories:**
- [ ] User can view predefined expense categories
- [ ] User can create custom categories (name, icon, color)
- [ ] User can edit and delete categories

**Must Have — date:**
- [ ] System stores expense dates in ISO format (YYYY-MM-DD)
- [ ] Monthly summaries are date-consistent

**Should Have — analytics:**
- [ ] User can view pie chart of expenses by category
- [ ] User can filter expenses by date range
- [ ] User can see daily and monthly average expense calculations

### Out of Scope

- Budget management with alerts — MoSCoW "Could Have", deferred to v2
- CSV export — MoSCoW "Could Have", deferred to v2
- Recurring expenses — MoSCoW "Could Have", deferred to v2
- Multi-currency support — not in MoSCoW Must/Should, deferred to v2
- AI receipt scanning (OCR) — explicit Won't Have
- Cross-bank sync — explicit Won't Have

## Context

- Group project (group5_fivestar), built for a course/assignment
- Full SPEC.md exists with API design, data models, edge cases, and MoSCoW priorities
- UI design mockups already exist as JSX files in root (add-screen.jsx, stats-screen.jsx, etc.)
- API envelope standard: `{success, data, message}` on success; `{success: false, message, errors: [{field, message}]}` on failure
- All responses support pagination; filters by date range, category, currency
- DB schema: expenses, categories, budgets, recurring_expenses tables

## Constraints

- **Tech Stack**: React (TypeScript) frontend — locked by team decision
- **Tech Stack**: Laravel (PHP) backend — locked by team decision
- **Tech Stack**: MySQL database — locked (Tech Stack section overrides SQLite MVP suggestion in SPEC.md)
- **Auth**: JWT — locked by team decision
- **Deploy**: Vercel — locked by team decision
- **API Design**: REST with standard envelope — locked per SPEC.md
- **Validation**: amount > 0, max 2 decimal places; dates ISO YYYY-MM-DD; currency codes validated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MySQL over SQLite | SPEC.md Tech Stack section declares MySQL; overrides MVP SQLite suggestion | — Pending |
| JWT auth | Team decision per SPEC.md | — Pending |
| Vercel deploy | SPEC.md deploy target; non-HEAD side of merge conflict retained | — Pending |
| `{success, data, message}` response envelope | SPEC.md API standard; consistent error/success shape | — Pending |
| Budget/CSV/Recurring deferred to v2 | MoSCoW "Could Have" — not blocking core product | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after initialization*
