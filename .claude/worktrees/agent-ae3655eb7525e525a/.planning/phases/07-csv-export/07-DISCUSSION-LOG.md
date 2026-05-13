# Phase 7: CSV Export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 7-csv-export
**Areas discussed:** Export button location, Pre-export filter

---

## Export Button Location

### Q1: Where should the Export CSV button live?

| Option | Description | Selected |
|--------|-------------|----------|
| ExpensesPage header | Button next to '+ Add Expense'. No new route or nav link. | ✓ |
| New /export page | Dedicated page with its own nav link (4th item). More space but complexity for a one-action page. | |
| ExpensesPage + AnalyticsPage | Button on both pages — doubles wiring work. | |

**User's choice:** ExpensesPage header
**Notes:** Natural location — user is already on the expense list.

### Q2: What should the Export CSV button look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Text link / secondary button | Smaller, muted style. Keeps visual hierarchy — export is secondary. | ✓ |
| Same style as + Add Expense | Equal-weight button — competes with primary action. | |
| You decide | Claude picks style consistent with existing buttons. | |

**User's choice:** Secondary/muted style

---

## Pre-export Filter / Content

### Q1: What data gets included in the CSV?

| Option | Description | Selected |
|--------|-------------|----------|
| Always export ALL expenses | No filter — download everything. | ✓ |
| Honor current active filters | Export respects FilterBar state. 'Export what you see.' | |
| Separate date-range picker | New UI before download — independent from list filters. | |

**User's choice:** Always export ALL expenses
**Notes:** User can filter in Excel/Sheets after download.

### Q2: What happens when user has no expenses?

| Option | Description | Selected |
|--------|-------------|----------|
| Download empty CSV with headers only | Valid file with just column headers. Not an error. | ✓ |
| Show error / disabled button | Toast or disabled state when list is empty. | |

**User's choice:** Download empty CSV with headers only

### Q3: Include notes column?

| Option | Description | Selected |
|--------|-------------|----------|
| Include notes as 7th column | date, category, description, amount, currency, notes. | ✓ |
| Exact REQ-23 spec only | date, category, description, amount, currency. | |

**User's choice:** Include notes as 7th column
**Notes:** Beyond REQ-23 spec — downstream agents must implement this extra column.

---

## Claude's Discretion

- JWT auth for file download: Axios `responseType: 'blob'` + programmatic `<a>` trigger (no token in URL)
- CSV filename: `expenses-{YYYY-MM-DD}.csv`
- Amount format: plain decimal (`1250.00`), no ฿ prefix
- Loading state: button shows "Exporting…" while request is in flight
- Error state: `InlineError` component on page if export fails
- Route ordering: `GET /api/expenses/export` registered BEFORE `GET /api/expenses/{id}` to avoid collision

## Deferred Ideas

None — discussion stayed within phase scope.
