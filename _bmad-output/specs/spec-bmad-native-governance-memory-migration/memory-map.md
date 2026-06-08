# Memory Map

## Canonical Today

| Area | Path | Disposition |
| --- | --- | --- |
| BMad project context | `docs/project-context.md` | Remain canonical project knowledge under `docs/`. |
| Product source ledger | `CONTEXT.md` | Migrate; keep as source/historical until facts are fully absorbed and verified. |
| Launch checklist | `docs/production-launch-checklist.md` | Remain stable project knowledge under `docs/`. |
| BMad spec artifacts | `_bmad-output/specs/` | Remain canonical for SPEC folders. |
| BMad planning artifacts | `_bmad-output/planning-artifacts/` | Remain canonical for PRD, UX, architecture, research, and planning outputs. |
| BMad implementation artifacts | `_bmad-output/implementation-artifacts/` | Remain canonical for sprint, story, investigation, retrospective, and implementation records. |
| BMad test artifacts | `_bmad-output/test-artifacts/` | Remain canonical for TEA/test strategy, automation, reviews, traceability, and gates. |
| BMad durable customizations | `_bmad/custom/` | Remain canonical for team/user overrides. |

## Legacy Or Non-Canonical Areas

| Area | Path | Disposition |
| --- | --- | --- |
| Legacy superpowers specs | `docs/superpowers/specs/*.md` | Keep as historical only after valid decisions move to BMad artifacts or stable docs. |
| Legacy superpowers plans | `docs/superpowers/plans/*.md` | Remove from future workflow; their `superpowers:*` instructions are not BMad authority. |
| Installed BMad/skill mirror | `.agents/**` | Not project truth; decide whether to commit, ignore, or treat as local install output. |
| Installed BMad runtime/config bundle | `_bmad/**` | BMad install and customization surface; installer-owned files are not product truth. |
| WDS design output | `design-artifacts/` | Empty at migration time; not canonical until populated by a chosen workflow. |
| Old memory folders | `memory/`, `progress/`, `docs/state/`, `docs/work/` | Missing or empty; no migration needed. |

## Facts To Preserve

- Product glossary and terminology rules from `CONTEXT.md`.
- Calculator, Admin Catalog, Good, Estimate Card, and Estimate Message behavior.
- Russian-only and ruble-only v1 constraints.
- ARCHIPELAG visual baseline, Mont fonts, monochrome calculator/card direction, and premium motion constraints.
- Export-panel snapshot behavior and Instagram/manual sharing limitations.
- Admin settings boundaries and explicit-save behavior.
- Stack: Next.js App Router, React, TypeScript, Prisma, PostgreSQL, custom CSS, Motion, `html-to-image`, dnd-kit, Zod, SimpleWebAuthn.
- Security: admin auth, HttpOnly sessions, shared mutation guard, origin checks, throttling, audit logging, production seed safety, WebAuthn secure-context requirements.
- Current implementation status and known mismatch: Estimate Message code includes per-Good price details while product truth says default should list Good names only.
- Deployment ambiguity: Vercel/Postgres notes and VPS/Caddy/PostgreSQL notes both exist.

## Customization State

- Team override `_bmad/custom/bmad-spec.toml` appends `file:{project-root}/docs/project-context.md` to `bmad-spec` persistent facts.
- Resolver output includes both default `file:{project-root}/project-context.md` and canonical `file:{project-root}/docs/project-context.md`; the latter is the meaningful existing context file.
