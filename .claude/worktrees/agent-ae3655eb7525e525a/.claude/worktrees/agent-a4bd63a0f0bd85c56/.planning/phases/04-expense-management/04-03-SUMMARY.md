---
phase: 04
plan: 03
subsystem: frontend
tags: [react, typescript, expenses, form, detail, delete, inline-confirm, mvp-vertical-slice]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [expense-form-page, expense-detail-page, inline-error, loading-button]
  affects: []
tech_stack:
  added: []
  patterns:
    - Shared add/edit form via mode prop (D-09)
    - Inline error below submit only — no field-level errors (D-12)
    - Two-step inline boolean delete confirm — no modal, no window.confirm (D-11)
    - listCategories() helper added to existing api/categories.ts
    - LoadingButton disabled-while-saving pattern (matches Phase 2)
key_files:
  created:
    - frontend/src/components/InlineError.tsx
    - frontend/src/components/LoadingButton.tsx
  modified:
    - frontend/src/api/categories.ts
    - frontend/src/pages/ExpenseFormPage.tsx
    - frontend/src/pages/ExpenseDetailPage.tsx
decisions:
  - "Added listCategories() to existing api/categories.ts rather than creating a separate file — avoids duplicate Category interface and type conflicts"
  - "ExpenseFormPage uses typed cast for createExpense payload to satisfy strict Omit type without introducing currency or notes fields"
  - "ExpenseDetailPage fetches categories alongside expense in Promise.all for a single loading state"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-10T12:29:08Z"
  tasks: 2
  files_created: 2
  files_modified: 3
---

# Phase 4 Plan 03: Expense Form + Detail Pages Summary

**One-liner:** Shared add/edit form with client validation and inline errors, plus detail page with two-step inline-confirm delete — completing the full expense lifecycle (create → list → detail → edit → delete).

## What Was Built

Third vertical slice for expense management, delivering EXP-01, EXP-04, EXP-05, EXP-06:

1. **InlineError** (`frontend/src/components/InlineError.tsx`) — Renders a single red error message (14px, `#C0392B`, weight 400) below the submit button. Returns null when message is null. Consistent with D-12 and Phase 2 auth error pattern.

2. **LoadingButton** (`frontend/src/components/LoadingButton.tsx`) — Button that disables and shows loadingLabel ("Saving...") during async operations. Background shifts to muted `#7A7064` at 60% opacity, cursor `not-allowed`. Accent fill `oklch(48% 0.10 195)` when idle. Matches Phase 2 pattern.

3. **listCategories()** added to `frontend/src/api/categories.ts` — Silent-fail wrapper around `GET /api/categories`. Handles both `data: Category[]` and `data: { items: Category[] }` response shapes (forward-compatible). Returns `[]` on any network/API error so the form still renders.

4. **ExpenseFormPage** (replaced stub from plan 04-02) — Shared add/edit form rendered at two routes via `mode` prop:
   - `/expenses/new` (mode="create"): pre-fills date to today; `Save Expense` label
   - `/expenses/:id/edit` (mode="edit"): loads expense on mount, pre-fills all fields; `Save Changes` label
   - Validation fires on submit: amount > 0, max 2 decimal places regex, category required, description required, date required
   - Single inline error below submit (D-12) — no field-level errors
   - No currency UI anywhere (D-13) — backend stores THB silently
   - ฿ symbol displayed as adjacent text to amount input (D-14)
   - Redirects to `/expenses` on success (D-10)
   - API errors extracted from `errors[0].message` → `message` → fallback string

5. **ExpenseDetailPage** (replaced stub from plan 04-02) — Full detail view:
   - Loads expense and categories in a single `Promise.all` call for one loading state
   - Displays: ฿ amount (36px bold, D-14), category name (with `#N` fallback), description, formatted date
   - Edit button: Link to `/expenses/:id/edit` (accent fill, white text)
   - Delete: two-step inline confirm via `showDeleteConfirm` boolean state (D-11)
     - First click: "Delete Expense" → reveals "Confirm Delete" + "Keep Expense"
     - Confirm Delete: fires `deleteExpense(id)` → redirects to `/expenses`
     - Keep Expense: resets to initial Delete button
     - No `window.confirm()`, no modal (D-11)
   - IDOR: non-owned expense returns API 404; UI shows "Failed to load expense." without leaking data (T-04-15)
   - XSS: description rendered as `<p>{expense.description}</p>` — React escapes by default, no `dangerouslySetInnerHTML` (T-04-16)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `c8e247f` | InlineError + LoadingButton + listCategories + ExpenseFormPage |
| 2 | `b9bb26c` | ExpenseDetailPage with inline-confirm delete |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Adaptation] Added listCategories() to existing categories.ts instead of creating new file**
- **Found during:** Task 1
- **Issue:** The plan specified adding a new `listCategories` export with a minimal `Category` interface. However, `frontend/src/api/categories.ts` already exists with a full `Category` interface (includes `user_id`, `created_at`, `updated_at`). Creating a second file with a duplicate `Category` interface would cause type conflicts in components importing from both.
- **Fix:** Added `listCategories()` function to the existing file, reusing the existing `Category` type. The function handles both `Category[]` and `{ items: Category[] }` array shapes for forward-compatibility.
- **Files modified:** `frontend/src/api/categories.ts`
- **Commit:** `c8e247f`

**2. [Rule 1 - Bug] Used typed payload cast instead of `as any` for createExpense**
- **Found during:** Task 1 TypeScript check
- **Issue:** The plan's template used `payload as any` for the createExpense call. Using `any` bypasses type safety and may suppress real type errors.
- **Fix:** Used `payload as Parameters<typeof createExpense>[0]` to preserve type checking while satisfying the strict `Omit` constraint (payload omits `id`, `currency`, `created_at`, `updated_at`, `notes` — all absent from the form).
- **Files modified:** `frontend/src/pages/ExpenseFormPage.tsx`
- **Commit:** `c8e247f`

## Known Stubs

None — all form pages are fully implemented. The stub pages from plan 04-02 have been replaced.

## Threat Surface Scan

All threats from the plan's `<threat_model>` are mitigated:

| Threat | File | Mitigation |
|--------|------|------------|
| T-04-14 (Tampering — amount input) | ExpenseFormPage.tsx | Client regex `^\d+(\.\d{1,2})?$` + `> 0` check before API call; backend re-validates with StoreExpenseRequest |
| T-04-15 (IDOR via URL :id) | ExpenseDetailPage.tsx | getExpense() returns API 404 for non-owner; UI shows "Failed to load expense." — no data leakage |
| T-04-16 (XSS — description) | ExpenseDetailPage.tsx | `<p>{expense.description}</p>` — React text node, escaped by default; no dangerouslySetInnerHTML |
| T-04-17 (Accidental delete) | ExpenseDetailPage.tsx | D-11 two-step: first click shows confirm panel; only "Confirm Delete" fires deleteExpense() |
| T-04-18 (CSRF) | expenses.ts / categories.ts | Bearer JWT via axios interceptor; no cookie-based auth surface |
| T-04-19 (Replay after expiry) | ExpenseDetailPage.tsx | 401 from API caught → sets error message; user must re-auth |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `frontend/src/components/InlineError.tsx` | FOUND |
| `frontend/src/components/LoadingButton.tsx` | FOUND |
| `frontend/src/api/categories.ts` (listCategories added) | FOUND |
| `frontend/src/pages/ExpenseFormPage.tsx` (full impl) | FOUND |
| `frontend/src/pages/ExpenseDetailPage.tsx` (full impl) | FOUND |
| `npx tsc --noEmit` | PASSES |
| `npx vite build` | PASSES |
| No `window.confirm` in ExpenseDetailPage | VERIFIED |
| No `currency` in ExpenseFormPage (D-13) | VERIFIED |
| commit c8e247f | FOUND |
| commit b9bb26c | FOUND |
