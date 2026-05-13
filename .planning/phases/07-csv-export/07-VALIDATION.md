---
phase: 7
slug: csv-export
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-13
---

# Phase 7 — Validation Strategy

> Per-phase validation contract. No automated test framework exists in this project — all validation is manual.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project has no automated test suite |
| **Config file** | None |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Manual browser verification (open app, click Export CSV, inspect downloaded file)
- **After every plan wave:** Full manual checklist below
- **Before `/gsd-verify-work`:** All manual checks must pass

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Status |
|---------|------|------|-------------|-------------------|--------|
| 07-01-T1 | 07-01 | 1 | REQ-23 | N/A | ⬜ pending |
| 07-01-T2 | 07-01 | 1 | REQ-23 | N/A | ⬜ pending |
| 07-02-T1 | 07-02 | 2 | REQ-23 | N/A | ⬜ pending |
| 07-02-T2 | 07-02 | 2 | REQ-23 | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red*

---

## Wave 0 Requirements

None — no test framework exists. Wave 0 does not need to create test infrastructure.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GET /api/expenses/export returns 200 with text/csv content-type | REQ-23 | No test framework | Open app, click Export CSV, check DevTools Network tab → response Content-Type: text/csv |
| CSV contains correct headers: date,category,description,amount,currency,notes | REQ-23 | File download | Open downloaded file, verify row 1 = `date,category,description,amount,currency,notes` |
| CSV rows match user's actual expenses | REQ-23 | Live DB data | Compare rows in CSV to expenses visible in ExpensesPage |
| Empty user: CSV downloads with header row only, no error | REQ-23 | Requires DB state | Log in as user with no expenses, click Export CSV, open file — should have header row only |
| Amount is plain decimal (1250.00), no currency prefix | REQ-23 | File content | Inspect CSV amount column — must be `1250.00` not `฿1,250.00` |
| Export button shows "Exporting..." during in-flight request | REQ-23 | Browser runtime | Throttle network in DevTools, click Export CSV — button text must change to "Exporting..." |
| Error state: InlineError appears on export failure | REQ-23 | Browser runtime | Disconnect network, click Export CSV — InlineError component must appear on page |
| Export ignores active FilterBar filters | REQ-23 | Live data | Apply a category filter, click Export CSV — downloaded CSV must contain ALL user expenses, not filtered subset |
| Route /api/expenses/export resolves before /api/expenses/{id} | REQ-23 | Route collision | curl GET /api/expenses/export with valid JWT — must return CSV, not a 404 treating "export" as an ID |
| JWT sent via Authorization header, never in URL | Security | Browser runtime | DevTools Network → request for /api/expenses/export must show `Authorization: Bearer ...` header, URL must have no `token=` query param |
