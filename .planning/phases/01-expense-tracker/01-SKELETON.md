# Walking Skeleton — Phase 1: Foundation

**Established:** Phase 1 (01-expense-tracker)
**Status:** Defined — to be verified after 01-03-PLAN execution

---

## What the Walking Skeleton Proves

The walking skeleton is the thinnest possible end-to-end slice that exercises every layer of the stack without implementing any user-facing features. When the skeleton is green, the full technical infrastructure exists and every subsequent phase adds features on top of a known-working foundation.

**Stack layers exercised:**
1. Browser → Vercel CDN (React app loads)
2. React → Railway API (axios fetches health endpoint)
3. Railway API → Laravel app (PHP handles request, returns envelope)
4. Laravel → MySQL (connection established, migrations ran)
5. Vercel deploy pipeline (git push → automatic deploy)

---

## Architectural Decisions (Locked for All Subsequent Phases)

These decisions are established in Phase 1 and MUST NOT be renegotiated in later phases without explicit user sign-off.

| Concern | Decision | Locked In |
|---------|----------|-----------|
| Repo layout | Monorepo: /backend (Laravel), /frontend (React), /ui-mockups | D-01 |
| Backend framework | Laravel 11 (PHP 8.2+) | SPEC.md |
| Frontend framework | React 19 + Vite + TypeScript (strict mode) | SPEC.md |
| Database | MySQL (NOT SQLite, NOT PostgreSQL) | SPEC.md Tech Stack (overrides MVP suggestion) |
| Auth mechanism | JWT via tymon/jwt-auth (NOT Sanctum, NOT sessions) | Team decision |
| API response envelope | `{success, data, message}` on success; `{success:false, message, errors:[{field,message}]}` on failure | SPEC.md |
| Backend deploy | Railway (free tier) | D-04 |
| Frontend deploy | Vercel (project root: /frontend) | D-03 |
| Backend NOT on Vercel | Vercel PHP serverless excluded | D-05 |
| Frontend-backend connection | `VITE_API_URL` env var → Railway public URL | D-04 |
| CORS | config/cors.php reads `FRONTEND_URL` env var (Vercel domain) | RESEARCH.md Pattern 4 |
| Middleware registration | bootstrap/app.php (NOT Kernel.php — Laravel 11) | RESEARCH.md Pattern 1 |
| API routes file | Created via `php artisan install:api` (NOT manually) | RESEARCH.md Pitfall 1 |
| JWT TTL | Must be cast to `(int)` in config/jwt.php — PHP 8.2 requirement | RESEARCH.md Pitfall 2 |
| SPA routing | vercel.json rewrite `/(.*) → /index.html` | RESEARCH.md Pattern 6 |
| Design reference | ui-mockups/ directory (renamed from ui_design/) | D-02 |

---

## Directory Layout

```
group5_fivestar/               ← repo root
├── backend/                   ← Laravel 11 (deployed to Railway)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   │       └── HealthController.php
│   │   │   └── Middleware/
│   │   │       └── JwtMiddleware.php   ← registered as jwt.auth alias
│   │   └── Providers/
│   │       └── AppServiceProvider.php  ← success/error response macros
│   ├── bootstrap/
│   │   └── app.php                     ← withRouting, withMiddleware, health:/up
│   ├── config/
│   │   ├── auth.php                    ← api guard: jwt driver
│   │   ├── cors.php                    ← FRONTEND_URL env var
│   │   └── jwt.php                     ← TTL cast to (int)
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── *_create_categories_table.php
│   │   │   └── *_create_expenses_table.php
│   │   └── seeders/
│   │       └── CategorySeeder.php      ← 10 default categories
│   ├── routes/
│   │   └── api.php                     ← GET /api/health only (no auth routes)
│   └── tests/
│       ├── Feature/
│       │   └── HealthCheckTest.php
│       └── Unit/
│           └── JwtConfigTest.php
├── frontend/                  ← React 19 + Vite + TypeScript (deployed to Vercel)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts               ← axios instance, VITE_API_URL baseURL
│   │   ├── pages/
│   │   │   ├── HomePage.tsx            ← health check fetch + display
│   │   │   ├── AuthPage.tsx            ← placeholder (Phase 2)
│   │   │   ├── ExpensesPage.tsx        ← placeholder (Phase 4)
│   │   │   ├── CategoriesPage.tsx      ← placeholder (Phase 3)
│   │   │   └── AnalyticsPage.tsx       ← placeholder (Phase 5)
│   │   ├── App.tsx                     ← BrowserRouter + Routes
│   │   └── main.tsx                    ← createRoot entry
│   ├── vercel.json                     ← SPA rewrite: /(.*) → /index.html
│   └── .env.local                      ← VITE_API_URL=http://localhost:8000 (gitignored)
└── ui-mockups/                ← JSX design reference (renamed from ui_design/)
    ├── app.jsx
    ├── add-screen.jsx
    ├── stats-screen.jsx
    └── ...
```

---

## How to Hit the Walking Skeleton

### Production (after Phase 1 deploy)

**Health check — API only:**
```bash
curl https://your-backend.railway.app/api/health
```
Expected response:
```json
{
  "success": true,
  "data": { "status": "ok" },
  "message": "API is healthy"
}
```

**Built-in Laravel health:**
```bash
curl https://your-backend.railway.app/up
# Expected: HTTP 200 (no body)
```

**Frontend — browser:**
```
https://your-vercel-app.vercel.app/
```
Expected: Page loads. "API Status: ok" shown in green.

**SPA routing test:**
```
https://your-vercel-app.vercel.app/expenses
```
Expected: "Expenses" placeholder page loads (not Vercel 404).

### Local Development

```bash
# Terminal 1 — backend
cd backend
php artisan serve
# API available at http://localhost:8000

# Terminal 2 — frontend
cd frontend
npm run dev
# App available at http://localhost:5173
```

**Local health check:**
```bash
curl http://localhost:8000/api/health
# Expected: {"success":true,"data":{"status":"ok"},"message":"API is healthy"}
```

Open http://localhost:5173 — "API Status: ok" should appear (frontend connects to local backend via VITE_API_URL=http://localhost:8000 in .env.local).

---

## End-to-End Verification Checklist

Run these in order after Phase 1 execution completes:

- [ ] `cd backend && php artisan test` — 0 failures (HealthCheckTest + JwtConfigTest pass)
- [ ] `cd frontend && npm run build` — 0 TypeScript errors
- [ ] `curl https://railway-url/api/health` returns `{"success":true,"data":{"status":"ok"}}`
- [ ] Browser loads Vercel URL — "API Status: ok" shown in green, 0 console errors
- [ ] Direct navigation to `/expenses` on Vercel returns 200 (not 404)
- [ ] Railway MySQL has `categories` (10 rows) and `expenses` (0 rows) tables
- [ ] `git push origin main` triggers Vercel auto-deploy (visible in Vercel dashboard)
- [ ] `ui-mockups/` exists at repo root; `ui_design/` does not exist

**All 8 checks passing = Walking Skeleton is green.**

---

## Database State After Phase 1

```
categories table: 10 rows (Food, Transport, Housing, Education, Health,
                            Entertainment, Shopping, Utilities, Business, Other)
expenses table:   0 rows  (schema exists; data comes in Phase 4)
users table:      does not exist yet (Phase 2 creates it)
```

**No user_id in expenses.** Phase 2 adds a migration: `add_user_id_to_expenses_table` after creating the users table and FK.

---

## What Is NOT in the Skeleton (Intentionally Deferred)

| Feature | Phase |
|---------|-------|
| User registration / login / logout | Phase 2 |
| JWT-protected routes | Phase 2 |
| Category CRUD API | Phase 3 |
| Expense CRUD API | Phase 4 |
| Analytics / reports | Phase 5 |
| Budget management | v2 (deferred) |
| CSV export | v2 (deferred) |
| Recurring expenses | v2 (deferred) |

---

## Environment Variables Reference

### Railway (backend service)

| Variable | Source | Example |
|----------|--------|---------|
| APP_KEY | `php artisan key:generate --show` | base64:abc123... |
| APP_ENV | manual | production |
| APP_DEBUG | manual | false |
| JWT_SECRET | from backend/.env after `jwt:secret` | generated string |
| JWT_TTL | manual | 60 |
| JWT_REFRESH_TTL | manual | 20160 |
| FRONTEND_URL | Vercel deployment URL | https://group5-fivestar.vercel.app |
| DB_CONNECTION | manual | mysql |
| DB_HOST | Railway variable reference | ${{MYSQLHOST}} |
| DB_PORT | Railway variable reference | ${{MYSQLPORT}} |
| DB_DATABASE | Railway variable reference | ${{MYSQLDATABASE}} |
| DB_USERNAME | Railway variable reference | ${{MYSQLUSER}} |
| DB_PASSWORD | Railway variable reference | ${{MYSQLPASSWORD}} |

### Vercel (frontend service)

| Variable | Source | Example |
|----------|--------|---------|
| VITE_API_URL | Railway backend public URL | https://backend-production.up.railway.app |

---

## Known Risks at This Layer

| Risk | Impact | Mitigation |
|------|--------|------------|
| Railway free tier MySQL sleep | Migrations must re-run if DB is reset | Run migrations on every deploy (Railpack does this automatically) |
| Railpack build failure | Backend not deployed | Set Root Directory to /backend in Railway service settings |
| CORS error (Vercel → Railway) | Frontend cannot reach API | Set FRONTEND_URL in Railway env vars to exact Vercel domain |
| PHP/Composer not installed locally | Cannot run backend locally | Install PHP 8.2+ and Composer before executing Plan 01-01 |
| Vercel root directory misconfigured | Vercel tries to deploy repo root | Set Root Directory to `frontend` in Vercel project settings during import |
