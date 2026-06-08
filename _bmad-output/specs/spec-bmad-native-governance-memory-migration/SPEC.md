---
spec: bmad-native-governance-memory-migration
project: calc
project_root: /home/ronin/Desktop/project/calc
date: 2026-06-08
companions:
  - memory-map.md
  - migration-plan.md
  - ../../../docs/project-context.md
sources:
  - ../../../CONTEXT.md
  - ../../../docs/production-launch-checklist.md
  - ../../../docs/superpowers/specs/2026-05-25-production-hardening-design.md
  - ../../../docs/superpowers/specs/2026-05-25-vps-production-deployment-design.md
  - ../../../docs/superpowers/plans/2026-05-25-production-hardening.md
  - ../../../docs/superpowers/plans/2026-05-25-vps-production-deployment.md
assumptions:
  - docs/project-context.md is the canonical BMad project-knowledge artifact for this migration.
  - Existing legacy docs are preserved as historical evidence during the first migration pass.
open_questions:
  - Should CONTEXT.md remain maintained after migration, or become historical only?
  - Is the active production target Vercel/Postgres, VPS info.aglab.pro, or both?
  - Should _bmad/ and .agents/ be committed, ignored, or treated as local install output?
---

# SPEC

## Why

`calc` is moving from mixed legacy agent and workflow memory into BMad-native governance. The migration must preserve product truth, safety invariants, security decisions, implementation state, deployment knowledge, and domain terminology while removing legacy workflow authority from future work.

## Capabilities

### CAP-1: Establish BMad Governance Contract

Intent: Define a root governance contract that tells future agents which BMad paths are canonical, which legacy paths are historical, and which operations are forbidden without explicit user approval.

Success: A future agent can identify canonical project knowledge, spec, planning, implementation, test, customization, and legacy paths before editing.

### CAP-2: Preserve Product Truth

Intent: Keep the ARCHIPELAG Calculator product model, glossary, UI/export behavior, implementation state, and open ambiguities available to BMad agents.

Success: `docs/project-context.md` remains readable as adopted project knowledge and no migrated artifact contradicts its glossary, v1 constraints, or security invariants.

### CAP-3: Convert Legacy Workflow Memory

Intent: Reclassify `docs/superpowers/**` as historical evidence while carrying valid production-hardening and deployment decisions into BMad artifacts or stable docs.

Success: Future workflow instructions no longer require `superpowers:*`, and valid legacy decisions are represented under BMad-governed paths or `docs/`.

### CAP-4: Use Installed BMad Paths

Intent: Anchor the migration to installed BMad config paths instead of inventing a parallel artifact layout.

Success: Governance references `_bmad-output/specs/`, `_bmad-output/planning-artifacts/`, `_bmad-output/implementation-artifacts/`, `_bmad-output/test-artifacts/`, `docs/`, and `_bmad/custom/`.

### CAP-5: Protect Secrets, Runtime Data, and User Changes

Intent: Migrate governance and memory without touching product code, credentials, runtime data, deployment targets, external services, or unrelated dirty worktree state.

Success: Verification confirms `.env`, secrets, private data, runtime DBs, deployment config, external services, and unrelated dirty files were not touched.

### CAP-6: Verify Migration Integrity

Intent: Provide repeatable checks that prove the migration is coherent, whitespace-clean, and free of stale canonical-memory references.

Success: Changed-doc readback, old-term scan, canonical-path scan, `git diff --check`, and `git status --short` all complete with expected results.

## Constraints

- Do not edit product code as part of this migration spec.
- Do not stage, commit, push, reset, revert, or overwrite unrelated user changes.
- Do not touch `.env`, credentials, secrets, runtime databases, local private data, DNS, VPS state, Vercel settings, or external services.
- Preserve canonical terms: **Good**, **Calculator**, **Admin Catalog**, **Estimate Card**, **Estimate Message**.
- Preserve Russian-only and ruble-only v1 product constraints.
- Preserve admin security invariants: server-side admin checks, shared mutation guard, HttpOnly sessions, WebAuthn/passkeys, production-safe bootstrap credentials, throttling, audit events, and exact WebAuthn origin/RP alignment.
- Treat `_bmad/custom/` as the durable team customization surface.
- Treat installer-owned BMad files as generated unless a later governance decision says otherwise.

## Non-goals

- No product feature change.
- No code refactor.
- No package installation.
- No database migration execution.
- No deployment.
- No deletion of legacy docs in the first migration pass.
- No conversion of secrets, private runtime data, or external service settings into documentation.

## Success Signal

The migration is ready when root governance, BMad spec artifacts, project context, memory disposition, migration steps, and verification checks agree on canonical BMad paths, legacy workflow areas are no longer future authority, and the dirty worktree shows only expected governance/artifact changes.
