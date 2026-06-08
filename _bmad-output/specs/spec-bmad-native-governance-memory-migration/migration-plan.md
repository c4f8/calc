# Migration Plan

## Files To Create Or Update

- Create root `AGENTS.md` with BMad-native repository governance.
- Keep and maintain `docs/project-context.md` as canonical project knowledge.
- Keep `_bmad/custom/bmad-spec.toml` so `bmad-spec` reads `docs/project-context.md`.
- Add BMad planning artifacts for current product/architecture/deployment truth under `_bmad-output/planning-artifacts/`.
- Add BMad implementation artifacts for current implementation state under `_bmad-output/implementation-artifacts/`.
- Add BMad test artifacts for launch/security verification under `_bmad-output/test-artifacts/` when test planning begins.
- Mark or archive `docs/superpowers/**` as historical after migrated facts are verified.

## Proposed AGENTS.md Contract

```markdown
# Repository Governance

- BMad is the canonical governance and workflow system for this repository.
- Read `docs/project-context.md` before implementation or planning work.
- Canonical specs live under `_bmad-output/specs/`.
- Canonical planning artifacts live under `_bmad-output/planning-artifacts/`.
- Canonical implementation artifacts live under `_bmad-output/implementation-artifacts/`.
- Canonical test artifacts live under `_bmad-output/test-artifacts/`.
- Stable project knowledge lives under `docs/`.
- Durable BMad customizations live under `_bmad/custom/`.
- `CONTEXT.md` is legacy source truth until its migration is verified.
- `docs/superpowers/**` is historical only and must not direct future execution.
- Do not touch `.env`, secrets, credentials, runtime data, external services, deployment config, or private user data unless explicitly requested.
- Do not stage, commit, push, reset, revert, or overwrite unrelated user changes unless explicitly requested.
- Run `git status --short` before edits and preserve unrelated dirty files.
```

## Steps

1. Create root `AGENTS.md` from the proposed contract.
2. Decide whether `CONTEXT.md` remains maintained, becomes a short pointer to `docs/project-context.md`, or is archived as historical source.
3. Convert legacy production-hardening decisions into BMad planning/implementation artifacts, noting which code is already implemented.
4. Convert deployment knowledge into a BMad planning artifact, explicitly reconciling Vercel/Postgres vs VPS/Caddy/PostgreSQL as an open or resolved decision.
5. Add a historical notice to `docs/superpowers/**` or move it to an archive path after migrated facts are verified.
6. Add or update BMad test artifacts for launch/security smoke checks if TEA/test planning is in scope.
7. Run verification and keep only expected governance/artifact changes.

## Verification

- Read back every changed doc after implementation.
- Old-term scan:
  `rg -n "superpowers|GSD|docs/state|docs/work|progress/project-index|canonical memory|project-context.md|\\.agents" AGENTS.md docs _bmad-output _bmad/custom CONTEXT.md`
- Canonical-path scan:
  `rg -n "_bmad-output/specs|_bmad-output/planning-artifacts|_bmad-output/implementation-artifacts|_bmad-output/test-artifacts|_bmad/custom|docs/project-context.md" AGENTS.md docs _bmad-output _bmad/custom`
- Run `git diff --check`.
- Run `git status --short`.
- Confirm `.env`, secrets, credentials, runtime data, external services, deployment config, private user data, and unrelated dirty files were not touched.

## Risks

- `CONTEXT.md` is dense; an over-aggressive archive could drop product rules.
- Legacy superpowers plans contain both useful decisions and stale execution instructions.
- Deployment target is ambiguous across sources.
- Some BMad tools still default to root `project-context.md`; current customization addresses `bmad-spec`, not every possible tool.
- `_bmad/` and `.agents/` repository policy is unresolved.

## Recommended Next BMad Skill

Run `bmad-agent-tech-writer` or `bmad-quick-dev` depending on whether the next step is documentation-only or implementation.

Documentation-only invocation:

```text
$bmad-agent-tech-writer write Create root AGENTS.md for /home/ronin/Desktop/project/calc from _bmad-output/specs/spec-bmad-native-governance-memory-migration/SPEC.md, memory-map.md, migration-plan.md, and docs/project-context.md. Do not touch product code, secrets, runtime data, external services, deployment config, or unrelated dirty files.
```

Implementation-oriented invocation:

```text
$bmad-quick-dev Implement the BMad governance migration docs from _bmad-output/specs/spec-bmad-native-governance-memory-migration/. Limit changes to governance/docs/artifacts; do not touch product code, secrets, runtime data, external services, deployment config, or unrelated dirty files.
```
