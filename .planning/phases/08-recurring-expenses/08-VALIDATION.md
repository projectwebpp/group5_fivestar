---
phase: 8
slug: recurring-expenses
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | PHPUnit (Laravel Feature Tests) |
| **Config file** | `backend/phpunit.xml` |
| **Quick run command** | `cd backend && php artisan test --filter RecurringExpenseTest` |
| **Full suite command** | `cd backend && php artisan test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && php artisan test --filter RecurringExpenseTest`
- **After every plan wave:** Run `cd backend && php artisan test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Status |
|---------|------|------|-------------|-------------------|--------|
| 08-01-T0 | 08-01 | 0 | REQ-24 | `php artisan test --filter RecurringExpenseTest` | ⬜ pending |
| 08-01-T1 | 08-01 | 1 | REQ-24 | `php artisan test --filter RecurringExpenseTest` | ⬜ pending |
| 08-01-T2 | 08-01 | 1 | REQ-24 | `php artisan test --filter RecurringExpenseTest` | ⬜ pending |
| 08-01-T3 | 08-01 | 1 | REQ-24 | `php artisan test --filter RecurringExpenseTest` | ⬜ pending |
| 08-02-T1 | 08-02 | 2 | REQ-24 | N/A — TypeScript types; manual browser check | ⬜ pending |
| 08-02-T2 | 08-02 | 2 | REQ-24 | N/A — API layer; verified via integration | ⬜ pending |
| 08-03-T1 | 08-03 | 3 | REQ-24 | N/A — frontend UI; manual browser check | ⬜ pending |
| 08-03-T2 | 08-03 | 3 | REQ-24 | N/A — frontend UI; manual browser check | ⬜ pending |
| 08-03-T3 | 08-03 | 3 | REQ-24 | N/A — frontend UI; manual browser check | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/Feature/RecurringExpenseTest.php` — stubs for all REQ-24 behaviors (CRUD + processRecurring edge cases)

*Existing infrastructure: `phpunit.xml`, `RefreshDatabase` trait, `registerAndGetToken()` helper in `ExpenseApiTest.php` — all reusable. No new infrastructure needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /recurring page renders table with correct columns | REQ-24 | Frontend UI | Open app, navigate to /recurring — verify table columns: Description, Category, Amount (฿), Frequency, Next Due, Actions |
| "+ Add Recurring Expense" button reveals inline form | REQ-24 | Browser runtime | Click button — form must appear above table with fields: description, category, amount, currency, frequency, start_date |
| Created template appears in table immediately | REQ-24 | Browser runtime | Create a template — row must appear in table without page refresh |
| Inline row edit saves changes | REQ-24 | Browser runtime | Click edit on a row, change amount, save — row must update inline |
| Delete with inline confirm/cancel | REQ-24 | Browser runtime | Click Delete on a row — "Delete? Yes / Cancel" must appear inline (no modal) |
| Auto-created expense appears on /expenses page | REQ-24 | Live data integration | Create a template with start_date = today, navigate to /expenses — auto-generated expense entry must appear in list |
| "Recurring" nav link appears on all 4 pages | REQ-24 | Browser runtime | Visit /expenses, /analytics, /budget, /recurring — each must show Recurring nav link |
| /recurring protected by auth | REQ-24 | Browser runtime | Log out, visit /recurring directly — must redirect to /login |
| Empty state shows custom message | REQ-24 | Browser runtime | Visit /recurring with no templates — must show "No recurring expenses yet — click + Add Recurring Expense to get started" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
