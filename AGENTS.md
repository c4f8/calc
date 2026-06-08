# Repository Governance

This repository uses BMad as its canonical governance and workflow system. Read this file and `docs/project-context.md` before planning, editing, reviewing, or implementing work.

## Canonical Sources

- Project context: `docs/project-context.md`
- BMad specs: `_bmad-output/specs/`
- BMad planning artifacts: `_bmad-output/planning-artifacts/`
- BMad implementation artifacts: `_bmad-output/implementation-artifacts/`
- BMad test artifacts: `_bmad-output/test-artifacts/`
- Stable project knowledge: `docs/`
- Durable BMad team customizations: `_bmad/custom/`

## Migration State

- The current migration spec is `_bmad-output/specs/spec-bmad-native-governance-memory-migration/SPEC.md`.
- `CONTEXT.md` remains a source of product truth until its migration is fully verified. Do not discard or contradict it without an explicit migration decision.
- `docs/superpowers/**` is historical workflow material. Preserve valid decisions, but do not use `superpowers:*` instructions as future workflow authority.
- `.agents/**` is an installed skill mirror, not product truth.
- `_bmad/**` contains BMad installation/configuration files. Treat installer-owned files as generated unless a later governance decision says otherwise.

## Product Invariants

- Preserve canonical terms: **Good**, **Calculator**, **Admin Catalog**, **Estimate Card**, **Estimate Message**.
- Preserve v1 constraints: Russian customer/admin language only, Russian ruble only, non-binding estimates, no CRM/client database assumption, and no direct Instagram DM automation.
- Preserve the ARCHIPELAG visual direction: monochrome premium surface, Mont fonts, thin dividers, restrained motion, and low-noise actions.
- Disabled **Goods** must not appear in the customer-facing **Calculator**.
- Required **Goods** must stay included and non-deselectable in customer UI.
- Deleting a **Good** means archive/soft-delete, not hard delete.
- Export creates an immutable estimate snapshot after `Поделиться расчётом`, not continuously on every calculator change.

## Security And Privacy

- Do not touch `.env`, credentials, secrets, runtime databases, private user data, DNS, VPS state, Vercel settings, or external services unless explicitly requested.
- Do not expose user files, secrets, workspaces, local services, environment values, or private admin data.
- Admin pages and APIs require server-side checks. UI visibility is not a security boundary.
- Admin mutation routes must use the shared mutation guard before parsing JSON or mutating state.
- Preserve HttpOnly session cookies, same-origin mutation protection, throttling, audit logging, production-safe bootstrap credentials, and WebAuthn origin/RP alignment.

## Working Rules

- Run `git status --short` before edits.
- Do not stage, commit, push, reset, checkout, revert, or overwrite unrelated user changes unless explicitly requested.
- Do not install packages unless explicitly requested.
- Do not run migrations or seed against remote/production databases unless explicitly requested and the environment is confirmed.
- Do not edit generated Prisma client files in `src/generated/prisma`.
- Do not edit runtime artifacts such as `.next`, `.playwright-mcp`, `prisma/dev.db`, screenshots, generated exports, or private local files.
- Keep documentation changes scoped to BMad governance and project knowledge unless the user asks for broader documentation work.

## Verification For Governance Or Documentation Changes

- Read back changed documents after writing them.
- Run `git diff --check`.
- Run `git status --short`.
- For migration work, scan for legacy workflow terms and stale canonical-memory references:
  `rg -n "superpowers|GSD|docs/state|docs/work|progress/project-index|canonical memory|project-context.md|\\.agents" AGENTS.md docs _bmad-output _bmad/custom CONTEXT.md`
- Confirm canonical BMad path references are present where expected:
  `rg -n "_bmad-output/specs|_bmad-output/planning-artifacts|_bmad-output/implementation-artifacts|_bmad-output/test-artifacts|_bmad/custom|docs/project-context.md" AGENTS.md docs _bmad-output _bmad/custom`
- Confirm secrets, runtime data, external services, deployment config, private user data, and unrelated dirty files were not touched.

## Open Decisions

- Decide whether `CONTEXT.md` remains maintained after migration or becomes historical only.
- Reconcile deployment truth before deployment work: Vercel/Postgres and VPS/Caddy/PostgreSQL notes both exist.
- Decide whether `_bmad/` and `.agents/` should be committed, ignored, or treated as local install output.
