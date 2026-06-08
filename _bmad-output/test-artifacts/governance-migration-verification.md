# Governance Migration Verification

Date: 2026-06-08

## Required Checks

- Read back changed governance and artifact files.
- Run old-term scan:
  `rg -n "superpowers|GSD|docs/state|docs/work|progress/project-index|canonical memory|project-context.md|\\.agents" AGENTS.md docs _bmad-output _bmad/custom CONTEXT.md`
- Run canonical-path scan:
  `rg -n "_bmad-output/specs|_bmad-output/planning-artifacts|_bmad-output/implementation-artifacts|_bmad-output/test-artifacts|_bmad/custom|docs/project-context.md" AGENTS.md docs _bmad-output _bmad/custom`
- Run `git diff --check`.
- Run `git status --short --untracked-files=all`.

## Expected Results

- Legacy workflow terms appear only in historical classification, source paths, or verification commands.
- Canonical BMad paths are present in `AGENTS.md`, `docs/project-context.md`, migration spec companions, and relevant BMad artifacts.
- `git diff --check` reports no whitespace errors.
- Dirty worktree contains governance/docs/artifact files only.
- `.env`, secrets, credentials, runtime data, external services, deployment config, and private user data are untouched.

## Manual Safety Confirmation

- Product code is outside this migration scope.
- Deployment target remains unresolved and must not be acted on without user confirmation.
- Legacy `docs/superpowers/**` files are preserved for audit, not deleted.
