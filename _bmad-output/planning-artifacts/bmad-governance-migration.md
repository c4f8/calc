# BMad Governance Migration Planning Artifact

Date: 2026-06-08

## Purpose

Close the repository governance migration from mixed legacy workflow memory into BMad-native project knowledge and artifact paths.

## Canonical Planning Decisions

- `docs/project-context.md` is the current canonical project context for future agents.
- `AGENTS.md` is the root governance contract.
- `_bmad-output/specs/` is the canonical spec folder root.
- `_bmad-output/planning-artifacts/` is the canonical planning folder root.
- `_bmad-output/implementation-artifacts/` is the canonical implementation folder root.
- `_bmad-output/test-artifacts/` is the canonical test folder root.
- `_bmad/custom/` is the durable team customization surface.
- `docs/superpowers/**` remains available as historical evidence only.

## Preserved Product Truth

- The product is the ARCHIPELAG interior cost **Calculator** with admin-managed **Goods** and Instagram-friendly export.
- Canonical terms are **Good**, **Calculator**, **Admin Catalog**, **Estimate Card**, and **Estimate Message**.
- V1 remains Russian-only, ruble-only, mobile-first, and non-binding-estimate oriented.
- Customer export must not promise direct Instagram DM automation.
- Admin auth, passkeys, HttpOnly sessions, same-origin mutation protection, throttling, audit logging, and production-safe seed behavior remain safety invariants.

## Legacy Decision Migration

- Production-hardening decisions from `docs/superpowers/specs/2026-05-25-production-hardening-design.md` are preserved in `docs/project-context.md` and implementation status artifacts.
- Launch checklist decisions remain in `docs/production-launch-checklist.md`.
- VPS deployment decisions from `docs/superpowers/specs/2026-05-25-vps-production-deployment-design.md` remain historical until the active deployment target is confirmed.
- Legacy plans in `docs/superpowers/plans/*.md` are not active implementation plans.

## Open Planning Decisions

- Decide whether `CONTEXT.md` remains maintained or becomes historical after migration verification.
- Decide whether the active production target is Vercel/Postgres, VPS `info.aglab.pro`, or both.
- Decide whether `.agents/` and `_bmad/` should be committed, ignored, or treated as local install output.
- Decide whether the current **Estimate Message** implementation should be changed to list **Good** names only.
