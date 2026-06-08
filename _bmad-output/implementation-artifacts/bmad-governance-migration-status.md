# BMad Governance Migration Status

Date: 2026-06-08

## Completed

- Created `docs/project-context.md` as canonical BMad project knowledge.
- Created `_bmad/custom/bmad-spec.toml` so `bmad-spec` loads `docs/project-context.md`.
- Created `_bmad-output/specs/spec-bmad-native-governance-memory-migration/` with `SPEC.md`, `memory-map.md`, `migration-plan.md`, and `.decision-log.md`.
- Created root `AGENTS.md` as the repository governance contract.
- Added `docs/superpowers/README.md` to classify legacy workflow files as historical.
- Added BMad planning and test artifacts for the governance migration.

## Current Canonical Paths

- Governance contract: `AGENTS.md`
- Project context: `docs/project-context.md`
- Migration spec: `_bmad-output/specs/spec-bmad-native-governance-memory-migration/SPEC.md`
- Memory map: `_bmad-output/specs/spec-bmad-native-governance-memory-migration/memory-map.md`
- Migration plan: `_bmad-output/specs/spec-bmad-native-governance-memory-migration/migration-plan.md`
- Planning artifact: `_bmad-output/planning-artifacts/bmad-governance-migration.md`
- Verification artifact: `_bmad-output/test-artifacts/governance-migration-verification.md`

## Historical Areas

- `docs/superpowers/**` remains historical only.
- `CONTEXT.md` remains source truth until the user decides whether it stays maintained or becomes historical.

## Not Changed

- Product code was not changed.
- Secrets and `.env` files were not touched.
- Runtime data was not touched.
- External services, DNS, VPS state, Vercel settings, and deployment configuration were not touched.

## Remaining Follow-Up

- Run BMad PRD only after confirming the product or release scope to avoid inventing requirements.
- Resolve active deployment target before any deployment planning or execution.
- Decide repository policy for `.agents/` and `_bmad/`.
