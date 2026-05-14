# Roadmap: Expense Tracker (group5_fivestar)

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-05-11) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🔄 **v2.0 Budget & Export** — Phases 6–8 (in progress 2026-05-12)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-05-11</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-05-09
- [x] Phase 2: Authentication (2/2 plans) — completed 2026-05-09
- [x] Phase 3: Categories (2/2 plans) — completed 2026-05-10
- [x] Phase 4: Expense Management (3/3 plans) — completed 2026-05-10
- [x] Phase 5: Analytics & Reports (2/2 plans) — completed 2026-05-11

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### ✅ Phase 6: Budget Management (v2.0) — completed 2026-05-13

**Goal:** Users can set monthly budget limits per category, view spend vs limit on a dedicated /budget page, and see red-row warnings when over budget.

**Requirements:** REQ-20, REQ-21, REQ-22

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Backend: migration, Budget model, BudgetController (GET/POST/PUT/DELETE), routes
- [x] 06-02-PLAN.md — Frontend types and API layer: types/budget.ts, api/budgets.ts
- [x] 06-03-PLAN.md — Frontend UI: BudgetPage.tsx with inline edit, over-budget warnings, App.tsx wiring

### ✅ Phase 7: CSV Export (v2.0) — completed 2026-05-13

**Goal:** Users can download all their expense data as a CSV file from the Expenses page header.

**Requirements:** REQ-23

**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — Backend: export() method in ExpenseController, GET /api/expenses/export route
- [x] 07-02-PLAN.md — Frontend: exportExpenses() API function, Export CSV button and state on ExpensesPage

### 🔄 Phase 8: Recurring Expenses (v2.0) — in progress

**Goal:** Users can create recurring expense templates (daily/weekly/monthly), view and manage them on a dedicated /recurring page, and have entries auto-created when they load the Expenses page.

**Requirements:** REQ-24

**Plans:** 3 plans

Plans:
- [x] 08-01-PLAN.md — Backend: migration, RecurringExpense model, RecurringExpenseController (CRUD), processRecurring() in ExpenseController, routes, feature tests
- [ ] 08-02-PLAN.md — Frontend types and API layer: types/recurring.ts, api/recurring.ts
- [ ] 08-03-PLAN.md — Frontend UI: RecurringPage.tsx with inline form/edit/delete, App.tsx wiring, Recurring nav link on all pages

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-05-09 |
| 2. Authentication | v1.0 | 2/2 | Complete | 2026-05-09 |
| 3. Categories | v1.0 | 2/2 | Complete | 2026-05-10 |
| 4. Expense Management | v1.0 | 3/3 | Complete | 2026-05-10 |
| 5. Analytics & Reports | v1.0 | 2/2 | Complete | 2026-05-11 |
| 6. Budget Management | v2.0 | 3/3 | Complete | 2026-05-13 |
| 7. CSV Export | v2.0 | 2/2 | Complete | 2026-05-13 |
| 8. Recurring Expenses | v2.0 | 1/3 | In Progress | — |
