# Requirements: Expense Tracker

**Defined:** 2026-05-09
**Core Value:** Users can accurately log and view their monthly expenses by category

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can register with email and password
- [ ] **AUTH-02**: User can log in and receive a JWT token
- [ ] **AUTH-03**: User can log out (token invalidated)
- [ ] **AUTH-04**: All expense/category/report endpoints require valid JWT

### Expenses

- [x] **EXP-01**: User can add an expense (amount, currency, category, description, date)
- [x] **EXP-02**: User can view all expenses with pagination (page, limit)
- [x] **EXP-03**: User can filter expenses by date range, category, and amount range
- [x] **EXP-04**: User can view a single expense's detail
- [x] **EXP-05**: User can edit an expense (full PUT and partial PATCH)
- [x] **EXP-06**: User can delete an expense

### Categories

- [ ] **CAT-01**: System provides predefined default categories
- [ ] **CAT-02**: User can create a custom category (name, icon, color)
- [ ] **CAT-03**: User can edit a category
- [ ] **CAT-04**: User can delete a category (blocked if active expenses reference it)
- [ ] **CAT-05**: User can view all categories

### Analytics & Reports

- [x] **REP-01**: User can view monthly total expense summary (total + by category)
- [x] **REP-02**: User can view expense breakdown by category (pie chart data)
- [x] **REP-03**: User can filter expenses by custom date range for trend view
- [x] **REP-04**: User can view daily and monthly average expense calculations

## v2 Requirements

### Budget Management

- **BUD-01**: User can set a monthly budget limit per category
- **BUD-02**: User can view current spend vs budget limit
- **BUD-03**: System returns alert status when spend approaches or exceeds limit (safe / near-limit / over-budget)

### CSV Export

- **CSV-01**: User can download expense data as CSV for a given month

### Recurring Expenses

- **REC-01**: User can create a recurring expense entry (name, amount, category, repeat type, start date)
- **REC-02**: User can view, edit, and delete recurring expenses
- **REC-03**: User can manually trigger a recurring expense to create an expense record

### Multi-Currency

- **CUR-01**: User can log expenses in currencies other than THB
- **CUR-02**: System converts multi-currency expenses to base currency for summary totals

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI receipt scanning (OCR) | Explicit Won't Have in SPEC.md MoSCoW |
| Cross-bank sync | Explicit Won't Have in SPEC.md MoSCoW |
| Multi-user / group shared expenses | Not in SPEC.md scope |
| OAuth (Google/GitHub login) | JWT email/password sufficient for v1 |
| Mobile app | Web-first via Vercel |
| Real-time notifications (WebSocket) | Budget alerts are polling-based for v1 |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| EXP-01 | Phase 4 | Complete |
| EXP-02 | Phase 4 | Complete |
| EXP-03 | Phase 4 | Complete |
| EXP-04 | Phase 4 | Complete |
| EXP-05 | Phase 4 | Complete |
| EXP-06 | Phase 4 | Complete |
| CAT-01 | Phase 3 | Pending |
| CAT-02 | Phase 3 | Pending |
| CAT-03 | Phase 3 | Pending |
| CAT-04 | Phase 3 | Pending |
| CAT-05 | Phase 3 | Pending |
| REP-01 | Phase 5 | Complete |
| REP-02 | Phase 5 | Complete |
| REP-03 | Phase 5 | Complete |
| REP-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19 (Phase 2: 4, Phase 3: 5, Phase 4: 6, Phase 5: 4)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 after roadmap creation — traceability populated*
