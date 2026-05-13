# Phase 3: Categories - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 3-Categories
**Areas discussed:** Category ownership, Predefined protection, Icon system, Categories UI layout

---

## Category Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Per-user | Each user has their own categories list. Add user_id to categories table. | ✓ |
| Global shared | One pool of categories all users share. Matches existing migration (no user_id, name UNIQUE). | |

**User's choice:** Per-user

**Follow-up — default seeding:**

| Option | Description | Selected |
|--------|-------------|----------|
| Seed global rows (user_id = NULL) | Predefined rows have no user_id. API returns NULLs + user's own rows. | |
| Copy to each user on register | When user registers, 10 defaults are inserted as their own rows. | ✓ |

**User's choice:** Copy to each user on register
**Notes:** Per-user ownership is the clean model. Copying on register means users can freely edit/delete their default categories.

---

## Predefined Protection

| Option | Description | Selected |
|--------|-------------|----------|
| No distinction — all editable/deletable | Simpler. No is_default flag needed. | ✓ |
| Mark defaults as read-only | Add is_default boolean. Predefined can't be edited or deleted. | |

**User's choice:** No distinction — all categories editable/deletable
**Notes:** Flows naturally from the per-user + copy-on-register decision. Since defaults become the user's own rows, there's no meaningful distinction.

---

## Icon System

| Option | Description | Selected |
|--------|-------------|----------|
| Preset list of ~15 Lucide icon names | User picks from a fixed visual grid of icon buttons. Lucide React fits the stack. | ✓ |
| Free text input | User types an icon name. Simpler but poor UX. | |
| Emoji picker | User picks an emoji. No icon library needed, but stores emoji string. | |

**User's choice:** Preset list of ~15 Lucide icon names
**Notes:** `lucide-react` is not yet installed — planner must add it. Seeder already uses Lucide names (utensils, car, home, etc.) so the preset list should include those 10 at minimum.

---

## Categories UI Layout

**Sub-question 1 — list display:**

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded cards grid | Cards with color swatch, icon, and name. Grid layout. | ✓ |
| Simple list rows | Icon + color dot + name in a plain list. | |

**User's choice:** Color-coded cards grid

**Sub-question 2 — create/edit form location:**

| Option | Description | Selected |
|--------|-------------|----------|
| Modal overlay on categories page | Click '+ New Category' or edit icon → modal opens. No page navigation. | ✓ |
| Separate /categories/new and /categories/:id/edit pages | Full page navigation. More surface area. | |

**User's choice:** Modal overlay on the categories page

**Sub-question 3 — delete UX:**

| Option | Description | Selected |
|--------|-------------|----------|
| Inline confirm + inline error | Delete button → 'Are you sure? Confirm' inline → error inline if blocked. Phase 2 pattern. | ✓ |
| Separate confirm modal | Separate dialog for delete confirmation. | |

**User's choice:** Inline confirm on card + inline error message

---

## Claude's Discretion

- Exact 15 Lucide icon names in the preset grid
- Exact 12 hex color swatches in the preset grid
- React state management for modal open/close (context vs prop-drilling)
- HTTP verb for update: PUT vs PATCH
- Whether to expose the `description` field in the v1 UI

## Deferred Ideas

None — discussion stayed within Phase 3 scope.
