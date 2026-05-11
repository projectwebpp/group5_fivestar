# Expense Tracker — Project Guide

## Project

Expense Tracker web app (group5_fivestar).
Stack: React (TypeScript) + Laravel (PHP) + MySQL + JWT + Vercel.

See `.planning/PROJECT.md` for full context, requirements, and decisions.

## GSD Workflow

This project uses the Get Shit Done (GSD) planning system.

**Planning artifacts:**
- `.planning/ROADMAP.md` — 5-phase execution plan
- `.planning/REQUIREMENTS.md` — 19 v1 requirements with REQ-IDs
- `.planning/STATE.md` — current position and session continuity
- `.planning/PROJECT.md` — project context and key decisions

**Active phase:** Phase 1 — Foundation

**Phase commands:**
- `/gsd-discuss-phase 1` — gather context before planning
- `/gsd-plan-phase 1` — generate executable plans for Phase 1
- `/gsd-execute-phase 1` — execute the plans
- `/gsd-resume-work` — restore context and resume from last session

## Key Decisions (locked)

- MySQL (not SQLite) — Tech Stack section overrides MVP suggestion
- JWT auth — team decision
- API response envelope: `{success, data, message}` on success
- Deploy target: Vercel
- Budget/CSV/Recurring deferred to v2

## Constraints

- Do not introduce SQLite — MySQL only
- Do not add budget, CSV export, or recurring features to v1
- All API endpoints must use the standard response envelope
- Dates must be ISO format (YYYY-MM-DD)
- Amount validation: > 0, max 2 decimal places
