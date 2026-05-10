# Phase 4: Expense Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 04-expense-management
**Areas discussed:** Expense list layout, Filter & pagination UX, Add/Edit form routing, Currency handling

---

## Expense list layout

| Option | Description | Selected |
|--------|-------------|----------|
| Card per expense | Matches existing mockups. Amount prominent, category name/icon, date, description snippet. | ✓ |
| Compact rows | Table-like rows. More expenses visible without scrolling. Diverges from mockup style. | |
| Grouped by date | Expenses grouped under date headers. Common in finance apps but adds grouping complexity. | |

**User's choice:** Card per expense

| Option | Description | Selected |
|--------|-------------|----------|
| Amount + category + date | Three most scannable fields. Description only in detail. | ✓ |
| Amount + category + date + description snippet | First ~40 chars of description on card. | |
| Amount + category + date + currency | Shows currency code on each card. | |

**User's choice:** Amount + category + date only

| Option | Description | Selected |
|--------|-------------|----------|
| Separate detail page /expenses/:id | Clean URL, browser back returns to list. | ✓ |
| Expand inline below the card | Card expands in place. No navigation. | |
| Slide-in drawer/panel | Detail slides from right. Adds animation complexity. | |

**User's choice:** Separate detail page /expenses/:id

| Option | Description | Selected |
|--------|-------------|----------|
| Simple text message + Add button | Minimal, fast to build. | ✓ |
| Illustration + message | Empty state illustration. More polished. | |
| You decide | Leave to planner. | |

**User's choice:** Simple text message + Add button

---

## Filter & pagination UX

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible filter bar above list | Toggle button shows/hides filter inputs. Clean when closed. | ✓ |
| Always-visible filter row | Always shown above list. Takes permanent vertical space. | |
| Filter modal/drawer | Tapping Filter opens a modal. Good for many filters. | |

**User's choice:** Collapsible filter bar

| Option | Description | Selected |
|--------|-------------|----------|
| Previous / Next + page indicator | Simple, works well on mobile. | ✓ |
| Numbered page buttons | 1 2 3 … 8. Needs responsive truncation logic. | |
| Load more button | Appends items. No separate pages. | |

**User's choice:** Previous / Next buttons + page indicator

| Option | Description | Selected |
|--------|-------------|----------|
| 10 per page, fixed | Simple. No user-facing page size control. | ✓ |
| 10 per page, user can change | Show: 10 / 25 / 50 control. | |
| 20 per page, fixed | More items per page. | |

**User's choice:** 10 per page, fixed

| Option | Description | Selected |
|--------|-------------|----------|
| Apply button | Prevents API call on every keystroke. | ✓ |
| Auto-apply on change | Filter updates trigger refresh immediately. | |
| You decide | Apply button is standard for multi-field filters. | |

**User's choice:** Apply button

---

## Add/Edit form routing

| Option | Description | Selected |
|--------|-------------|----------|
| Same form, different routes | /expenses/new and /expenses/:id/edit render same component. | ✓ |
| Same form, one route /expenses/form | Optional ID via query param. | |
| Separate add and edit components | More code duplication. Fully independent. | |

**User's choice:** Same form, routes: /expenses/new and /expenses/:id/edit

| Option | Description | Selected |
|--------|-------------|----------|
| Back to /expenses list | User sees new/updated expense immediately. | ✓ |
| To /expenses/:id detail | User sees saved expense detail. One more click to get back. | |
| Stay on form with success message | Good for adding multiple expenses quickly. | |

**User's choice:** Redirect to /expenses list after save

| Option | Description | Selected |
|--------|-------------|----------|
| Delete on detail page, confirm dialog | window.confirm() or inline "Are you sure?" | ✓ |
| Delete on detail page, no confirmation | One-click delete. | |
| Delete from list card, confirm dialog | Per-card action button on the list. | |

**User's choice:** Delete button on detail page with inline confirm

| Option | Description | Selected |
|--------|-------------|----------|
| Inline below submit button | Matches Phase 2 auth pattern (D-08). | ✓ |
| Field-level errors | Red text under each invalid field. | |
| You decide | Inline below submit is fine for consistency. | |

**User's choice:** Inline below submit button (consistent with Phase 2)

---

## Currency handling

| Option | Description | Selected |
|--------|-------------|----------|
| THB default, hidden from user | Stored as 'THB' always. No UI control. | ✓ |
| THB default, user can change via dropdown | Dropdown with THB/USD/EUR/JPY. | |
| User types currency code manually | Free-text field. Prone to typos. | |

**User's choice:** THB default, hidden from user

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show ฿ symbol | Amounts displayed as "฿ 250.00" | ✓ |
| No symbol, just the number | Amounts shown as "250.00" only. | |
| You decide | Showing ฿ is conventional for THB apps. | |

**User's choice:** Show ฿ symbol next to all amounts

---

## Claude's Discretion

- Card layout CSS/spacing — minimal inline styles, match ui-mockups/ direction
- HTTP method for edit: PUT vs PATCH wiring in frontend form
- Category dropdown population: GET /api/categories on form mount
- Date field: `<input type="date">` with ISO YYYY-MM-DD value

## Deferred Ideas

- Multi-currency dropdown (THB/USD/EUR/JPY) — v2 per CLAUDE.md
- Delete from list card (swipe/per-card button) — v2 simplification
- Slip/receipt image upload — shown in mockup, out of scope (no OCR in v1)
- Income tracking / type toggle — shown in mockup, not in REQUIREMENTS.md v1
