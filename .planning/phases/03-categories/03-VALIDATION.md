---
phase: 3
slug: categories
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | PHPUnit 12.x (via `php artisan test`) |
| **Config file** | `backend/phpunit.xml` |
| **Quick run command** | `cd backend && php artisan test --filter Category` |
| **Full suite command** | `cd backend && php artisan test` |
| **Estimated runtime** | ~5 seconds |

**Note:** No frontend test framework installed. Frontend validation is manual browser smoke testing.

---

## Sampling Rate

- **After every task commit:** Run `cd backend && php artisan test --filter Category`
- **After every plan wave:** Run `cd backend && php artisan test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | CAT-01–05 | — | N/A | setup | `test -f backend/tests/Feature/CategoryTest.php` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | CAT-01–05 | — | N/A | setup | `test -f backend/app/Models/Category.php` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | CAT-01 | — | Register seeds 10 default categories per user | feature | `cd backend && php artisan test --filter CategoryTest::test_register_seeds_default_categories` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | CAT-05 | IDOR | List returns only own categories; 401 without JWT | feature | `cd backend && php artisan test --filter CategoryTest::test_list_returns_only_own_categories` | ❌ W0 | ⬜ pending |
| 3-01-05 | 01 | 1 | CAT-02 | mass-assign | Create category; duplicate name → 422 | feature | `cd backend && php artisan test --filter CategoryTest::test_user_can_create_category` | ❌ W0 | ⬜ pending |
| 3-01-06 | 01 | 1 | CAT-03 | IDOR | Update own category; cannot update other user's | feature | `cd backend && php artisan test --filter CategoryTest::test_user_can_update_category` | ❌ W0 | ⬜ pending |
| 3-01-07 | 01 | 1 | CAT-04 | IDOR | Delete succeeds when no expenses; blocked (422) when expenses exist | feature | `cd backend && php artisan test --filter CategoryTest::test_user_can_delete_category` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | CAT-01–05 | — | CategoriesPage loads, modal opens, delete confirm, error display | manual | Browser smoke test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/Feature/CategoryTest.php` — 9 test method stubs covering CAT-01 through CAT-05
- [ ] `backend/app/Models/Category.php` — must exist before CategoryController can use it
- [ ] `backend/app/Models/Expense.php` — stub for deletion guard import
- [ ] `npm install lucide-react` in `/frontend` — required before CategoriesPage compiles

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CategoriesPage renders color-coded cards grid | CAT-05 | No frontend test framework | Load /categories in browser after seeding; confirm cards display icon, name, color swatch |
| Modal opens on "+ Add Category" click | CAT-02 | No frontend test framework | Click button; confirm modal overlay appears with name input, color grid, icon grid |
| Create category appears in grid | CAT-02 | No frontend test framework | Submit form with name, color, icon; confirm new card appears |
| Edit category updates card | CAT-03 | No frontend test framework | Click edit icon; change name; confirm card updates |
| Delete inline confirm flow | CAT-04 | No frontend test framework | Click trash icon; confirm "Confirm delete?" appears; confirm Yes removes card |
| Delete blocked error shows inline | CAT-04 | No frontend test framework | Requires Phase 4 expense data; test visually with seeded expense if possible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
