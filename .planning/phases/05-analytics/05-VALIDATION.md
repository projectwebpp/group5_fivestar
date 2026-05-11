---
phase: 5
slug: analytics
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — manual smoke testing (consistent with Phases 1-4; no test infra in project) |
| **Config file** | none |
| **Quick run command** | `curl -H "Authorization: Bearer $TOKEN" "$API_URL/analytics/summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD"` |
| **Full suite command** | Manual browser walkthrough of analytics page (all 4 ROADMAP success criteria) |
| **Estimated runtime** | ~2 minutes manual |

---

## Sampling Rate

- **After every task commit:** Manual smoke via curl (backend tasks) or browser visual check (frontend tasks)
- **After every plan wave:** Full manual walkthrough — filter presets, Apply button, pie chart render, averages
- **Before `/gsd-verify-work`:** All 4 ROADMAP success criteria verified manually

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 05-01-T1 | 01 | 1 | REP-01, REP-02, REP-04 | user_id scope — no cross-user data | manual smoke | `curl -H "Authorization: Bearer $TOKEN" "$API_URL/analytics/summary?date_from=2026-05-01&date_to=2026-05-31"` | ⬜ pending |
| 05-01-T2 | 01 | 1 | REP-01, REP-04 | query uses `expense_date` not `date`; GROUP BY includes `categories.id, categories.name` | manual smoke | Inspect JSON: `total`, `daily_avg`, `monthly_avg`, `category_breakdown` present | ⬜ pending |
| 05-02-T1 | 02 | 2 | REP-01, REP-03 | N/A | manual UI | Browser: analytics page loads, default current-month data appears, filter bar visible | ⬜ pending |
| 05-02-T2 | 02 | 2 | REP-02 | N/A | manual UI | Browser: pie chart renders slices, Tooltip shows `฿{total} ({percentage}%)` on hover | ⬜ pending |
| 05-02-T3 | 02 | 2 | REP-03 | N/A | manual UI | Browser: click "Last Month" → data updates; set custom range + Apply → Network tab shows correct params | ⬜ pending |
| 05-02-T4 | 02 | 2 | REP-04 | N/A | manual smoke | Compare `daily_avg` = `total / days_in_range`; `monthly_avg` = `total / distinct_months` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing project pattern — no test framework installed in Phases 1-4. No Wave 0 setup required.

*Manual smoke testing is the established project pattern.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pie chart renders slices with correct proportions | REP-02 | No frontend test framework | Browser: open /analytics, verify slice count matches category_breakdown count; hover each slice for tooltip |
| Pre-set buttons auto-apply | REP-03 | UI interaction, no test framework | Click "This Month" — verify Network tab shows API call with correct date_from/date_to immediately |
| Cross-user data isolation | REP-01 | Requires two test accounts | Log in as user A, log in as user B in incognito — verify each sees only their own data |

---

## Validation Sign-Off

- [x] All tasks have manual verify steps
- [x] Sampling continuity: manual check after every task
- [x] Wave 0: not needed (established project pattern — no test infra)
- [x] No watch-mode flags
- [x] Feedback latency < 5 minutes (manual smoke)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-10
