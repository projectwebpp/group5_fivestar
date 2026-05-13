# Phase 6: Budget Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 6-Budget Management
**Areas discussed:** Budget page location, Budget page layout, Budget CRUD flow, Month scope, Category display, Over-budget warning scope

---

## Budget Page Location

| Option | Description | Selected |
|--------|-------------|----------|
| New /budget page | Dedicated page in top nav alongside Expenses and Analytics | ✓ |
| Inside Analytics page | Add budget section to existing Analytics page | |
| Inside Categories page | Set limits inline next to each category | |

**User's choice:** New /budget page (Recommended)
**Notes:** Clean separation — budget management is its own concern.

---

## Budget Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Table: category / limit / spent / remaining | Row per category, all budget info at a glance | ✓ |
| Cards: one card per category | Card layout reusing ExpenseCard style | |
| You decide | Claude picks layout | |

**User's choice:** Table layout (Recommended)
**Notes:** Red row or badge when over budget.

---

## Budget CRUD Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Inline edit in table row | Click limit cell → input appears in-place → Save/Cancel | ✓ |
| Modal form | Click 'Set Limit' → modal opens | |
| You decide | Claude picks simpler approach | |

**User's choice:** Inline edit (Recommended)
**Notes:** No separate page or modal needed.

---

## Month Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Current month only, no navigation | Always shows this month's budgets and spend | ✓ |
| Month/year picker | Navigate to past/future months | |

**User's choice:** Current month only (Recommended)
**Notes:** Simpler for v2.

---

## Category Display

| Option | Description | Selected |
|--------|-------------|----------|
| All user categories, limit blank if not set | Shows all categories; blank limit field if no budget set | ✓ |
| Only categories with a limit set | Cleaner but requires separate action to add new budget row | |

**User's choice:** All categories shown (Recommended)
**Notes:** Easy to see which categories have no budget set.

---

## Over-Budget Warning Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Budget page only — red row highlight | Row turns red when spent ≥ limit | ✓ |
| Budget page + Analytics pie chart | Also tint over-budget slices red | |
| Budget page + Analytics + expense list | Warnings everywhere | |

**User's choice:** Budget page only (Recommended)
**Notes:** Self-contained to budget page. Remaining column shows negative value when over.

---

## Claude's Discretion

- `budgets` DB table schema — `(id, user_id, category_id, month, year, amount, timestamps)` with unique constraint on `(user_id, category_id, month, year)`
- API endpoint design — POST/PUT/DELETE `/api/budgets`
- GET budget endpoint shape — returns each category with limit + current-month spend
- Empty state component reuse (EmptyState)
- Row sort order (alphabetical by category name)

## Deferred Ideas

- Month/year picker for historical budgets — deferred beyond v2
- Over-budget warnings on Analytics page or expense list — budget page only for v2
- Budget alerts / push notifications — visual only
- Budget templates (copy last month's limits) — future enhancement
