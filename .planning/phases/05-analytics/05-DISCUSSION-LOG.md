# Phase 5: Analytics & Reports - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 5-Analytics & Reports
**Areas discussed:** Chart library, Analytics nav & layout, Date range filter UX, API shape for analytics

---

## Chart Library

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts | React-native API, `<PieChart>` + `<Pie>` + `<Tooltip>`. ~130KB gzip. | ✓ |
| react-chartjs-2 | Chart.js wrapper. ~110KB, imperative config style. | |
| Native SVG (no dependency) | Pure SVG pie chart, zero install. ~60 lines of math. No built-in tooltips. | |

**User's choice:** Recharts

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tooltip: category name + amount + % | Recharts built-in Tooltip. Shows e.g. "Food: ฿1,200 (34%)" on hover. | ✓ |
| Legend only, no tooltip | Static color-coded legend beneath chart. | |
| Both: tooltip + static legend | Best visibility, more layout space needed. | |

**User's choice:** Tooltip: category name + amount + %

---

## Analytics Nav & Layout

| Option | Description | Selected |
|--------|-------------|----------|
| New nav link alongside Expenses | Add 'Analytics' next to 'Expenses' in top nav. Route: /analytics. | ✓ |
| Replace current HomePage | Analytics becomes dashboard / landing page after login. | |
| Link inside Expenses page | 'View Analytics' button at top of expense list. | |

**User's choice:** New nav link alongside Expenses

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single scrollable page | Filter → summary cards → pie chart. All on one scroll. | ✓ |
| Two tabs: Summary + Trends | Tab 1: totals + pie. Tab 2: date-range trend view. | |
| Side-by-side: chart left, stats right | Pie left, category list and averages right. | |

**User's choice:** Single scrollable page

---

## Date Range Filter UX

| Option | Description | Selected |
|--------|-------------|----------|
| Current month | Auto-load current month's stats on page open. | ✓ |
| Last 30 days | Rolling 30-day window from today. | |
| No default — user must pick | Page shows empty state until date range chosen. | |

**User's choice:** Current month

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-set buttons + custom inputs | This Month / Last Month / Last 3 Months buttons + from/to date inputs. | ✓ |
| Custom date inputs only | Just from/to date inputs (like Phase 4 FilterBar). | |
| Pre-set buttons only | This Month / Last Month / Last 3 Months / This Year. No free date input. | |

**User's choice:** Pre-set buttons + custom inputs

---

| Option | Description | Selected |
|--------|-------------|----------|
| Apply button | Consistent with Phase 4 FilterBar (D-08). No extra API calls while typing. | ✓ |
| Auto-apply on change | Pre-sets auto-apply immediately; custom inputs apply on blur/valid-date. | |

**User's choice:** Apply button

---

## API Shape for Analytics

| Option | Description | Selected |
|--------|-------------|----------|
| Single endpoint, all stats | GET /api/analytics/summary?date_from=&date_to= returns all data. | ✓ |
| Two endpoints: summary + breakdown | GET /api/analytics/summary + GET /api/analytics/categories. | |
| Four separate endpoints | One per requirement (REP-01 through REP-04). | |

**User's choice:** Single endpoint, all stats

---

| Option | Description | Selected |
|--------|-------------|----------|
| name + total + percentage | Each category: { name, total, percentage }. Server pre-computes %. | ✓ |
| name + total only | Frontend computes percentage from raw totals. | |

**User's choice:** name + total + percentage (server pre-computed)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Filtered summary only | Date range filter updates totals, pie, averages. No extra time-series chart. | ✓ |
| Bar chart: total per day/week | BarChart showing expense totals grouped by day/week in range. | |
| List of expenses in the range | Raw expense list filtered by date range (reuses Phase 4 list). | |

**User's choice:** Filtered summary only

---

## Claude's Discretion

- Pie chart color palette — hardcoded cycling palette of 6–8 colors (category DB color is nice-to-have, not required)
- Summary card layout — three stat cards flex-row or stacked; match inline-style pattern
- `monthly_avg` calculation — (total / distinct months in range); single-month range = total
- Pre-set button triggers Apply automatically (exception to Apply button rule — one-tap convenience)

## Deferred Ideas

- Time-series bar chart (daily/weekly expense trends) — out of scope for v1
- Category color from DB used in pie slices — v2 enhancement
- Export to CSV/PDF — explicitly deferred to v2 per CLAUDE.md
