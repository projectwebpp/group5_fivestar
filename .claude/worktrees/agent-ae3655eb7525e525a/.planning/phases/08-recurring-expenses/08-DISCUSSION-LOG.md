# Phase 8: Recurring Expenses - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 08-recurring-expenses
**Areas discussed:** Auto-creation trigger, Template creation UX, Frequency options, End condition

---

## Auto-creation trigger

| Option | Description | Selected |
|--------|-------------|----------|
| On-request generation | Piggyback on GET /expenses — backend checks overdue templates and creates due entries before returning. Zero infrastructure. Works on Vercel Hobby. | ✓ |
| Vercel Cron Jobs | vercel.json cron calls GET /api/recurring/process daily at midnight. True background scheduling. | |
| GitHub Actions cron | Daily workflow hits POST /api/recurring/process with API key. External, no Vercel plan dependency. | |

**User's choice:** On-request generation (piggyback on GET /expenses)
**Notes:** None — accepted recommended option.

---

### Trigger endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| GET /expenses (piggyback) | Existing endpoint silently checks + creates due entries before returning list. | ✓ |
| Dedicated POST /recurring/process | Frontend calls this explicitly on mount, then fetches expenses. Two API calls. | |
| You decide | Claude picks trigger point. | |

**User's choice:** GET /expenses (piggyback)

---

### Duplicate prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Date-based deduplication via last_created_date | Only create if today > next due date. Simple, no extra table lookups. | ✓ |
| Check expense table for matches | Query expenses for existing template_id + date before creating. | |
| You decide | Claude handles deduplication logic. | |

**User's choice:** Date-based deduplication via last_created_date

---

### Catch-up behavior (long absence)

| Option | Description | Selected |
|--------|-------------|----------|
| Create only most recent due entry | 1 entry max per template per trigger. No flooding after long absence. | ✓ |
| Backfill all missed entries | Create every missed entry since last_created_date. Accurate but can flood list. | |
| You decide | Claude picks behavior that fits UX. | |

**User's choice:** Create only most recent due entry

---

## Template creation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /recurring page + nav link | New page alongside Expenses, Analytics, Budget. Clean separation. | ✓ |
| Toggle on existing expense form | "Make recurring" toggle on ExpenseFormPage. Management in Expenses page section. | |
| You decide | Claude picks UX pattern. | |

**User's choice:** Dedicated /recurring page + nav link

---

### Page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Table layout | Columns: Description \| Category \| Amount \| Frequency \| Next Due \| Actions. Consistent with BudgetPage. | ✓ |
| Card layout | Cards similar to ExpenseCard.tsx. Consistent with expense list. | |
| You decide | Claude picks layout. | |

**User's choice:** Table layout (matches BudgetPage pattern)

---

### Template creation flow

| Option | Description | Selected |
|--------|-------------|----------|
| Inline form above table | "+ Add Recurring Expense" button reveals collapsible form above table. No separate route. | ✓ |
| Separate /recurring/new route | Dedicated form page, navigates away from list. | |
| You decide | Claude picks creation flow. | |

**User's choice:** Inline form above table (no separate route)

---

## Frequency options

| Option | Description | Selected |
|--------|-------------|----------|
| Daily, Weekly, Monthly only | Exact REQ-24 minimum. Simple 3-option dropdown. | ✓ |
| Daily, Weekly, Bi-weekly, Monthly | Adds bi-weekly for paycheck-aligned expenses. | |
| Custom interval (every N days/weeks/months) | Most flexible but complex schema. | |

**User's choice:** Daily, Weekly, Monthly only

---

### Weekly recurrence alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Same day of week as start_date | e.g., starts Monday → repeats every Monday. More intuitive. | ✓ |
| Every 7 days from last_created_date | Exact 7-day interval. Simpler math but can drift. | |
| You decide | Claude picks approach. | |

**User's choice:** Same day of week as start_date

---

## End condition

| Option | Description | Selected |
|--------|-------------|----------|
| Run indefinitely until deleted | No end_date column. Active until user deletes template. Simplest schema. | ✓ |
| Optional end date | Users can set end_date. Template becomes inactive after. Needs end_date column + is_active check. | |
| You decide | Claude picks behavior. | |

**User's choice:** Run indefinitely until deleted (no end_date)

---

## Claude's Discretion

- `processRecurring()` implementation: private method on ExpenseController or standalone RecurringService — Claude's choice
- "Next Due" column computation: `last_created_date + frequency` (or `start_date` if null)
- Currency options: same as existing expense form (default THB)
- DB schema for `recurring_expenses` table — columns and types at Claude's discretion within established patterns
- Edit flow for table rows: inline edit or modal — Claude's choice (suggested: inline edit matching BudgetPage)

## Deferred Ideas

- Vercel Cron Jobs / GitHub Actions background processing — on-request generation sufficient for v2
- Bi-weekly / custom interval frequencies — daily/weekly/monthly covers REQ-24
- End date / max occurrences — indefinite with manual delete is sufficient
- Backfill of all missed entries — single most-recent entry is the chosen behavior
- Email/push notifications for upcoming recurring expenses — out of scope for v2
