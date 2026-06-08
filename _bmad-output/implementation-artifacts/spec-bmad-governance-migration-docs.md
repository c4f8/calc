---
title: 'BMad Governance Migration Docs'
type: 'chore'
created: '2026-06-08'
updated: '2026-06-08'
status: 'done'
baseline_commit: 'fd62fab01bda9dfbe37b591287ff04fba9a95c73'
context:
  - '../../docs/project-context.md'
  - '../specs/spec-bmad-native-governance-memory-migration/SPEC.md'
  - '../specs/spec-bmad-native-governance-memory-migration/memory-map.md'
  - '../specs/spec-bmad-native-governance-memory-migration/migration-plan.md'
---

<frozen-after-approval reason="human-owned intent -- do not modify unless human renegotiates">

## Intent

**Problem:** The repository now has BMad project context and a migration spec, but legacy workflow decisions are not yet represented in BMad planning, implementation, and test artifact locations.

**Approach:** Close the docs-only governance migration by creating BMad-native artifact summaries and marking legacy `docs/superpowers/**` content as historical evidence without deleting or rewriting it.

## Boundaries & Constraints

**Always:** Keep changes limited to governance documents, `docs/`, `_bmad/custom/`, and `_bmad-output/`. Preserve product truth from `docs/project-context.md`, existing migration spec files, and legacy source docs.

**Ask First:** Any decision to delete legacy docs, alter product code, modify deployment configuration, touch secrets, run migrations, or resolve the active production target must be approved by the user.

**Never:** Do not edit product code, `.env`, credentials, runtime data, external services, deployment config, generated artifacts, or unrelated dirty files. Do not make legacy `superpowers:*` instructions future workflow authority.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Migration closure | Existing BMad spec plus legacy docs | BMad planning, implementation, and test artifacts summarize migrated truth | Preserve unresolved decisions as open questions |
| Legacy workflow references | `docs/superpowers/**` still contains old instructions | Folder-level notice classifies them as historical | Do not delete or rewrite legacy files |
| Safety boundary | Secrets/runtime/deployment files exist locally | No access or modification | Report verification boundary in artifacts |

</frozen-after-approval>

## Code Map

- `AGENTS.md` -- Root governance contract for future agents.
- `docs/project-context.md` -- Canonical BMad project knowledge.
- `docs/superpowers/README.md` -- Historical classification for legacy workflow docs.
- `_bmad/custom/bmad-spec.toml` -- Durable workflow customization so `bmad-spec` reads project context.
- `_bmad-output/specs/spec-bmad-native-governance-memory-migration/` -- Canonical migration SPEC and companions.
- `_bmad-output/planning-artifacts/bmad-governance-migration.md` -- Planning-level migration decisions and unresolved deployment target.
- `_bmad-output/implementation-artifacts/bmad-governance-migration-status.md` -- Implementation-state ledger for governance migration.
- `_bmad-output/test-artifacts/governance-migration-verification.md` -- Verification checklist and evidence for migration closure.

## Tasks & Acceptance

**Execution:**
- [x] `docs/superpowers/README.md` -- Add historical notice -- Prevent future agents from treating legacy plans as active workflow authority.
- [x] `_bmad-output/planning-artifacts/bmad-governance-migration.md` -- Add planning summary -- Preserve migrated decisions under the configured BMad planning path.
- [x] `_bmad-output/implementation-artifacts/bmad-governance-migration-status.md` -- Add implementation status -- Record completed governance artifacts and unresolved repository policy.
- [x] `_bmad-output/test-artifacts/governance-migration-verification.md` -- Add verification artifact -- Capture scans and safety checks expected for migration closure.
- [x] `_bmad-output/implementation-artifacts/spec-bmad-governance-migration-docs.md` -- Mark tasks complete and status done -- Keep Quick Dev audit trail current.

**Acceptance Criteria:**
- Given future agents read `AGENTS.md` and `docs/project-context.md`, when they inspect legacy docs, then `docs/superpowers/**` is clearly historical and not future workflow authority.
- Given BMad config points to `_bmad-output/planning-artifacts`, `_bmad-output/implementation-artifacts`, and `_bmad-output/test-artifacts`, when migration artifacts are listed, then each path contains a governance migration artifact.
- Given verification runs, when scans and `git diff --check` complete, then only expected governance/docs artifacts are dirty and secrets/runtime/deployment files remain untouched.

## Verification

**Commands:**
- `rg -n "superpowers|GSD|docs/state|docs/work|progress/project-index|canonical memory|project-context.md|\\.agents" AGENTS.md docs _bmad-output _bmad/custom CONTEXT.md` -- expected: legacy terms appear only in historical classification, source paths, or verification commands.
- `rg -n "_bmad-output/specs|_bmad-output/planning-artifacts|_bmad-output/implementation-artifacts|_bmad-output/test-artifacts|_bmad/custom|docs/project-context.md" AGENTS.md docs _bmad-output _bmad/custom` -- expected: canonical BMad paths are present.
- `git diff --check` -- expected: no whitespace errors.
- `git status --short --untracked-files=all` -- expected: governance/docs artifact changes only.

## Suggested Review Order

**Governance Entry Point**

- Root contract tells future agents which sources and paths are canonical.
  [`AGENTS.md:3`](../../AGENTS.md#L3)

- Historical notice downgrades legacy workflow instructions without deleting evidence.
  [`README.md:5`](../../docs/superpowers/README.md#L5)

**BMad Artifact Closure**

- Planning artifact captures migrated decisions and unresolved planning questions.
  [`bmad-governance-migration.md:9`](../planning-artifacts/bmad-governance-migration.md#L9)

- Implementation status records completed governance artifacts and safety boundaries.
  [`bmad-governance-migration-status.md:5`](bmad-governance-migration-status.md#L5)

- Verification artifact preserves repeatable migration checks.
  [`governance-migration-verification.md:5`](../test-artifacts/governance-migration-verification.md#L5)
