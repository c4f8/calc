# Investigation: Production Git Pull Failure

## Hand-off Brief

1. **What happened.** User reports production cannot run `git pull`; direct SSH inspection is currently blocked because both documented `deploy` and `root` users reject the available local key.
2. **Where the case stands.** User-provided production output confirms `/opt/calc` is a Git repository with remote `origin`, but local branch `master` has no upstream tracking branch.
3. **What's needed next.** On production, set `master` to track `origin/master`, run a fast-forward pull as `deploy`, then rebuild and restart the `calc` service.

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-06-08 |
| Status | Concluded |
| System | Documented Ubuntu VPS at `195.161.68.76`; direct OS inspection blocked by SSH auth |
| Evidence sources | `docs/project-context.md`, historical VPS deployment plan, local Git state, DNS lookup, SSH auth checks |

## Problem Statement

User reports: "can you repair my git hub repo on my prod, because i can't do gt pull".

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| Local Git | Available | Local `master` tracks `origin/master` at `5d3ada70c1607b91616920268b60230acf3b98c2`. |
| DNS | Available | `info.aglab.pro` resolves to `195.161.68.76`. |
| SSH access | Partial | `deploy@195.161.68.76` and `root@195.161.68.76` reject available key-based non-interactive auth. |
| Deployment target docs | Partial | `docs/project-context.md:168` says the active production target is ambiguous. |
| Historical VPS plan | Available | `docs/superpowers/plans/2026-05-25-vps-production-deployment.md:5` identifies `info.aglab.pro` / `195.161.68.76`; lines 202-208 copy source to `/opt/calc` while excluding `.git`. |
| Production `git pull` error text | Available | Error says there is no tracking information for current branch and suggests `git branch --set-upstream-to=origin/<branch> master`. |

## Investigation Backlog

| # | Path to Explore | Priority | Status | Notes |
| - | --- | --- | --- | --- |
| 1 | Inspect `/opt/calc` on VPS | High | Done | User provided diagnostic output. |
| 2 | Capture exact `git pull` stderr | High | Done | Error confirms missing upstream tracking config. |
| 3 | Determine whether `/opt/calc/.git` exists | High | Done | `.git` exists and contains normal Git metadata. |
| 4 | Check systemd service and build path | Medium | Open | Needed after pull/build/restart to verify production service. |

## Timeline of Events

| Time | Event | Source | Confidence |
| --- | --- | --- | --- |
| 2026-06-08 | New code pushed to `origin/master` at `5d3ada70c1607b91616920268b60230acf3b98c2`. | Local Git / remote branch query | Confirmed |
| 2026-06-08 | User reports production cannot run `git pull`. | User message | Confirmed |
| 2026-06-08 | Non-interactive SSH as `deploy` and `root` failed. | SSH command output | Confirmed |
| 2026-06-08 | User-provided production diagnostics showed `## master`, remote `origin`, and `git pull` error "There is no tracking information for the current branch." | User-provided terminal output | Confirmed |

## Confirmed Findings

### Finding 1: Local GitHub branch is healthy

**Evidence:** Local `git rev-parse HEAD` and `git ls-remote origin refs/heads/master` both report `5d3ada70c1607b91616920268b60230acf3b98c2`.

**Detail:** The pushed commit exists on `origin/master`, so the immediate symptom is unlikely to be a missing GitHub push.

### Finding 2: Documented VPS target is reachable by DNS but not by current SSH credentials

**Evidence:** `dig +short A info.aglab.pro` returned `195.161.68.76`; SSH checks for `deploy` and `root` returned permission denied.

**Detail:** The server target can be identified, but the repository cannot be inspected or repaired directly from this environment yet.

### Finding 3: Historical VPS deployment excluded `.git`

**Evidence:** `docs/superpowers/plans/2026-05-25-vps-production-deployment.md:202` through `docs/superpowers/plans/2026-05-25-vps-production-deployment.md:208`.

**Detail:** The plan copied source by `rsync` with `--exclude '.git'`. If production followed this plan, `/opt/calc` is a source copy, not a Git clone, and `git pull` will fail.

### Finding 4: Production branch lacks upstream tracking

**Evidence:** User-provided output from `/opt/calc`: `git status --short --branch` printed `## master`, `git remote -v` showed `origin https://github.com/c4f8/calc.git`, and `git pull` printed "There is no tracking information for the current branch."

**Detail:** A normal tracking branch would show `## master...origin/master`. Production instead has local `master` without upstream, so plain `git pull` is ambiguous.

## Deduced Conclusions

### Deduction 1: The repair is to set upstream tracking

**Based on:** Finding 4.

**Reasoning:** `git pull` requires the current branch to know which remote branch to merge from. Production has remote `origin`, but `master` is not linked to `origin/master`.

**Conclusion:** Run `git branch --set-upstream-to=origin/master master`, then `git pull --ff-only`.

## Hypothesized Paths

### Hypothesis 1: `/opt/calc` is not a Git repository

**Status:** Open

**Theory:** Production was deployed using the historical `rsync --exclude '.git'` plan, so `git pull` fails because `.git` is absent.

**Supporting indicators:** Historical deployment plan explicitly excludes `.git`.

**Would confirm:** On VPS, `test -d /opt/calc/.git || echo "missing .git"` or exact error `fatal: not a git repository`.

**Would refute:** `/opt/calc/.git` exists and `git remote -v` shows `origin`.

**Resolution:** Refuted by user-provided production output showing `.git` exists and `origin` is configured.

### Hypothesis 2: `/opt/calc` is a Git repository but has local changes, divergent branch, ownership, or auth failure

**Status:** Open

**Theory:** `git pull` fails for a normal repository maintenance reason.

**Supporting indicators:** User described "my git hub repo on my prod", which may mean a clone exists.

**Would confirm:** Exact `git pull` stderr such as "Your local changes would be overwritten", "dubious ownership", "Need to specify how to reconcile divergent branches", or GitHub auth errors.

**Would refute:** `.git` is absent.

**Resolution:** Confirmed specifically as missing upstream tracking; local branch is not configured to track `origin/master`.

## Missing Evidence

| Gap | Impact | How to Obtain |
| --- | --- | --- |
| Exact `git pull` error | Determines the correct non-destructive repair | Provided by user |
| `/opt/calc/.git` existence | Confirms whether server is a clone | Provided by user |
| SSH access | Enables direct repair and verification | Provide working SSH access or add a temporary key |

## Source Code Trace

| Element | Detail |
| --- | --- |
| Error origin | Production shell/Git state, not application source |
| Trigger | Running `git pull` on production |
| Condition | Local `master` branch has no upstream tracking branch |
| Related files | `docs/project-context.md`, `docs/superpowers/plans/2026-05-25-vps-production-deployment.md` |

## Conclusion

**Confidence:** High

The GitHub remote and local branch are healthy, and production has a valid Git repository with `origin` configured. The confirmed root cause is that production's local `master` branch has no upstream tracking branch, so plain `git pull` cannot infer `origin/master`.

## Recommended Next Steps

### Fix direction

Set upstream tracking for production `master`, pull fast-forward from `origin/master`, then rebuild and restart the app service.

### Diagnostic

Run on the VPS after repair:

```bash
cd /opt/calc
git status --short --branch
git rev-parse HEAD
systemctl status calc --no-pager
```

## Reproduction Plan

1. SSH into the production VPS.
2. Run `cd /opt/calc && git pull`.
3. Expected pre-repair result: Git reports no tracking information for the current branch.
4. Run the upstream repair and repeat `git pull --ff-only`.
5. Expected post-repair result: the branch fast-forwards to `origin/master` or reports already up to date.

## Follow-up: 2026-06-08

### New Evidence

User provided production command output from `/opt/calc`:

- `.git` exists and contains normal metadata.
- `git status --short --branch` prints `## master`, with no `...origin/master`.
- `git remote -v` shows `origin https://github.com/c4f8/calc.git`.
- `git pull` fails with "There is no tracking information for the current branch."

### Additional Findings

The missing upstream branch is the direct cause of the `git pull` failure.

### Updated Hypotheses

- Hypothesis 1, missing `.git`, is refuted.
- Hypothesis 2 is confirmed as missing upstream tracking.

### Backlog Changes

Remaining work is operational verification after repair: fast-forward pull, dependency/build steps, service restart, and smoke check.

### Updated Conclusion

Root cause is confirmed with high confidence. Repair is `git branch --set-upstream-to=origin/master master` followed by a fast-forward pull.

## Side Findings

- The project context requires active production target confirmation before deployment work because Vercel/Postgres and VPS/Caddy/PostgreSQL notes both exist: `docs/project-context.md:168`.
